import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import 'tui-date-picker/dist/tui-date-picker.css';

import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';

import lgepCommonUtils from 'js/utils/lgepCommonUtils';

import { openImagePopup } from 'js/dfmeaImageHoverService';
import { openCellEditor } from 'js/dfmeaCellEditorService';
import { initImgSelectRow } from 'js/dfmeaMasterTableInteractionService';
import { openSodPopup } from 'js/dfmeaSodSelectPopupService';
import { loadTableDatas } from 'js/dfmeaMasteTableInitLoadService';
import { initToastGrid } from 'js/utils/fmeaViewCommonUtils';
import { getColumns } from 'js/dfmeaMasterTextGridColumnLoadService';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import * as constants from 'js/constants/fmeaConstants';
import { makeShortenValues } from 'js/utils/fmeaCommonUtils';
import { copyCell } from 'js/dfmeaMasterImageTableService';

let grid;

const shortCols = [constants.COL_INSPECTION_RESULTS_LANG, constants.COL_RECOMMENDED_ACTION_LANG, constants.COL_RECOMMENDED_ACTION_RESULT_LANG];

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
    const value = rowInfo[prop].value;
    if (_shortColCheck(prop)) {
      return makeShortenValues(value);
    }

    return removeImgTagInStr(value);
  }
  return '';
};

export const removeImgTagInStr = (value) => {
  let nonTagValue = value.replaceAll(/<IMG(.*?)>/gi, '');
  let replaceValue = nonTagValue.replaceAll('&nbsp;', ' ');
  return replaceValue;
};

const _shortColCheck = (prop) => {
  for (const shortCol of shortCols) {
    if (shortCol[0] === prop) {
      return true;
    }
  }
  return false;
};

const onLoad = async (ctx) => {
  try {
    const columns = getColumns();
    const datas = await getData(ctx[constants.FMEA_TABLE_LIST], columns);
    const options = {
      el: document.getElementById('text-toastGrid'),
      scrollX: true,
      scrollY: true,
      // bodyHeight: 'fitToParent',
      pageOptions: {
        type: 'scroll',
        perPage: 50,
      },
      rowHeight: 'auto',
      columns: columns,
      contextMenu: null,
      selectionUnit: 'row',
    };

    initToastGrid();

    grid = new Grid(options);
    grid.resetData(datas);

    if (ctx[constants.EDITING]) {
      appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, true);
    }
    // ctx.grid_table = grid;

    let getTable = document.querySelectorAll('#scrollCtrl .tui-grid-rside-area .tui-grid-table > tbody > tr > th');
    let width = 0;
    for (let th of getTable) {
      width += th.offsetWidth;
    }
    grid.setWidth(width + 25);
    events();
    tableResize();
  } catch (e) {
    //console.log("onLoad", e);
  }
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
    if (editStatus) {
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

// 재로드
const reLoad = async (ctx) => {
  await loadTableDatas(ctx);
  const columns = getColumns();
  const datas = await getData(ctx[constants.FMEA_TABLE_LIST], columns);
  grid.resetData(datas);
  reLayout();
  fmeaPopupUtils.closePopup();
};

const reLayout = async () => {
  await lgepCommonUtils.delay(100);
  grid.refreshLayout();
  tableResize();
};

const _setSelectionRowModel = (rowData) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  appCtxService.registerCtx(constants.ROW_SELECT, rowData);
  eventBus.publish('dfmeaDetail.onmount.imageTable');
};

const updateTable = async (ctx) => {
  const columns = getColumns();
  const datas = await getData(ctx[constants.DFMEA_CHANGE_TABLE_LIST], columns);
  grid.resetData(datas);
  tableResize();

  const initSelect = appCtxService.ctx[constants.ROW_SELECT];
  _selectRow(initSelect.rowKey);
};

const _selectRow = (selectedRowKey) => {
  grid.addRowClassName(selectedRowKey, 'select');
  _setSelectionRowModel(grid.getRow(selectedRowKey));
};

// Interaction 호출 시 선택한 파트 ctx 등록 및 css
const initSelectRow = () => {
  const initSelect = appCtxService.ctx[constants.ROW_SELECT];
  appCtxService.registerCtx(constants.INTERACTION_INIT_ROW_SELECT, initSelect);
  initImgSelectRow(grid);
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
  updateTable,
  reLayout,
  initSelectRow,
};
