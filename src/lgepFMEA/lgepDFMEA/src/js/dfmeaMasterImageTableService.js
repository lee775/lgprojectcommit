import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import loadUtils from 'js/utils/lgepLoadingUtils';

import { openCellEditor } from 'js/dfmeaCellEditorService';
import { getLangIndex } from 'js/utils/fmeaCommonUtils';
import { openImagePopup } from 'js/dfmeaImageHoverService';
import { openSodPopup } from 'js/dfmeaSodSelectPopupService';
import { initToastGrid } from 'js/utils/fmeaViewCommonUtils';
import { initImgSelectRow } from 'js/dfmeaMasterTableInteractionService';
import { getColumns } from 'js/dfmeaMasterImageTableColumnLoadService';
import { loadTableDatas } from 'js/dfmeaMasteTableInitLoadService';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import { showErrorMessageByText } from 'js/utils/fmeaMessageUtils';
import * as constants from 'js/constants/fmeaConstants';

import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';

export let langIndex;
let grid;

const onLoad = async (ctx, data) => {
  try {
    langIndex = getLangIndex();

    if (!ctx[constants.FMEA_TABLE_LIST]) {
      await newLoadData(ctx, data);
    }
    appCtxService.registerCtx(constants.FMEA_POPUP, true);

    await initTable(ctx, data);

    if (ctx[constants.EDITING]) {
      appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, true);
    }

    afterLoadAction();
    events();
    tableResize();
  } catch (e) {
    showErrorMessageByText('errorLoadTable');
    //console.log("onLoad", e);
  }
};

const newLoadData = async (ctx, data) => {
  loadUtils.openWindow();

  await loadTableDatas(ctx);

  loadUtils.closeWindow(data);
};

const afterLoadAction = () => {
  appCtxService.registerCtx(constants.INIT_COMPLETE, true);
  appCtxService.registerCtx(constants.FMEA_POPUP, false);
};

const initTable = async (ctx, data) => {
  if (!ctx[constants.FMEA_TABLE_LIST]) {
    await newLoadData(ctx, data);
  }
  const columns = getColumns();
  const datas = getData(ctx[constants.FMEA_TABLE_LIST], columns);

  const options = {
    el: document.getElementById('toastGrid'),
    scrollX: false,
    scrollY: true,
    // bodyHeight: 'fitToParent',
    pageOptions: {
      type: 'scroll',
      perPage: 50,
    },
    rowHeight: 'auto',
    // columnOptions: {
    //   frozenCount: 3,
    //   resizable: true,
    //   frozenBorderWidth: 2,
    // },
    columns: columns,
    data: datas,
    contextMenu: null,
    selectionUnit: 'row',
    // draggable: true
  };

  initToastGrid();
  grid = new Grid(options);
  appCtxService.registerCtx(constants.FMEA_IMAGE_GRID, grid);
  // ctx.grid_table = grid;

  let getTable = document.querySelectorAll('#scrollCtrl .tui-grid-rside-area .tui-grid-table > tbody > tr > th');
  let width = 0;
  for (let th of getTable) {
    width += th.offsetWidth;
  }
  grid.setWidth(width + 25);

  let headerLayout = document.querySelector('#scrollCtrl .tui-grid-rside-area .tui-grid-header-area');
  headerLayout.style.width = document.querySelector('#toastGrid').offsetWidth + 'px';
};

const events = () => {
  let selectedRowKey = null;
  grid.on('click', async (e) => {
    if (e.targetType === 'columnHeader' || e.rowKey === undefined) {
      return;
    }
    if (selectedRowKey != e.rowKey) {
      grid.removeRowClassName(selectedRowKey, 'select');
    }
    _selectRow(e.rowKey);
    selectedRowKey = e.rowKey;

    const editStatus = appCtxService.ctx[constants.EDITING];
    const isPopupOpen = appCtxService.ctx[constants.FMEA_POPUP];
    if (editStatus && !isPopupOpen) {
      if (appCtxService.ctx[constants.FMEA_IS_RESIZE]) {
        grid.focus(e.rowKey, e.columnName);
      }
      openSodPopup(grid, e);
      openCellEditor(e, grid);
    }
    await copyCell(e);
  });

  grid.on('mouseover', (e) => {
    openImagePopup(e, grid);
  });
};

// 클릭시 셀 값이 클립보드에 저장
export const copyCell = async (e) => {
  let cellValue = await lgepSummerNoteUtils.stripTags(grid.getValue(e.rowKey, e.columnName));
  if (cellValue.length > 1) {
    // clipboard API 사용
    if (navigator.clipboard !== undefined) {
      navigator.clipboard.writeText(cellValue).then(() => {
        notySvc.setTimeout('info', 1500);
        notySvc.showInfo('"' + cellValue + '"이(가) Teamcenter 및 OS 클립보드로 복사되었습니다.');
      });
    } else {
      // execCommand 사용
      const textArea = document.createElement('textarea');
      textArea.value = cellValue;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        notySvc.setTimeout('info', 1500);
        notySvc.showInfo('"' + cellValue + '"이(가) Teamcenter 및 OS 클립보드로 복사되었습니다.');
      } catch (err) {
        //console.error('복사 실패', err);
      }
      document.body.removeChild(textArea);
    }
  }
};

// 재로드
const reLoad = async (ctx) => {
  await loadTableDatas(ctx);
  const columns = getColumns();
  const datas = getData(ctx[constants.FMEA_TABLE_LIST], columns);
  grid.resetData(datas);
  reLayout();
  fmeaPopupUtils.closePopup();
};

const _setSelectionRowModel = (rowData) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  appCtxService.registerCtx(constants.ROW_SELECT, rowData);
  if (appCtxService.ctx[constants.DFMEA_DETAIL_MODE]) {
    eventBus.publish('dfmeaDetail.onmount.imageTable');
  }
};

export const reLayout = async () => {
  await lgepCommonUtils.delay(100);
  grid.refreshLayout();
  tableResize();
};

const _selectRow = (selectedRowKey) => {
  grid.addRowClassName(selectedRowKey, 'select');
  _setSelectionRowModel(grid.getRow(selectedRowKey));
};

const updateTable = async (ctx) => {
  const columns = getColumns();
  const datas = await getData(ctx[constants.DFMEA_CHANGE_TABLE_LIST], columns);
  grid.resetData(datas);
  tableResize();
  const initSelect = appCtxService.ctx[constants.ROW_SELECT];
  _selectRow(initSelect.rowKey);
};

// Interaction 호출 시 선택한 파트 ctx 등록 및 css
const initSelectRow = () => {
  const initSelect = appCtxService.ctx[constants.ROW_SELECT];
  appCtxService.registerCtx(constants.INTERACTION_INIT_ROW_SELECT, initSelect);
  initImgSelectRow(grid);
};

const getData = (tableList, columns) => {
  const tableData = tableList.map((rowInfo) => {
    const row = columns.reduce((prev, col) => {
      const columnInfo = {
        [col.name]: _getValue(rowInfo, col.title),
      };
      return {
        ...prev,
        ...columnInfo,
      };
    }, '');

    return {
      ...row,
      props: {
        ...rowInfo,
      },
    };
  });
  return tableData;
};

const _getValue = (rowInfo, prop) => {
  if (rowInfo[prop]) {
    return rowInfo[prop].value;
  }
  return '';
};

const windowResize = () => {
  let headerLayout = document.querySelector('#scrollCtrl .tui-grid-rside-area .tui-grid-header-area');
  headerLayout.style.width = document.querySelector('#toastGrid').offsetWidth + 'px';
};

const tableResize = async () => {
  await lgepCommonUtils.delay(1000);
  let getTable = document.querySelectorAll('#scrollCtrl .tui-grid-rside-area .tui-grid-table > tbody > tr');
  let height = 0;
  for (let tr of getTable) {
    let str = tr.style.height;
    const regex = /[^0-9]/g;
    const result = str.replace(regex, '');

    height += parseInt(result);
  }
  grid.setBodyHeight(height + 40);
};

export default {
  onLoad,
  reLoad,
  reLayout,
  updateTable,
  initSelectRow,
  windowResize,
};
