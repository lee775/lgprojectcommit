import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import popupService from 'js/popupService';
import appCtxService from 'js/appCtxService';

import {
  resetBtnEvent
} from 'js/dfmeaSodSelectPopupEventService';
import {
  langIndex
} from 'js/dfmeaMasterImageTableService';
import {
  getTableInfo
} from 'js/sodPopupTableService';
import {
  getGradeValue,
  addChangeRowByGrade,
} from 'js/dfmeaSodSelectPopupEventService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';

export let isOpenSodPopup = false;
let innerGrid; // popup sod table
let mainGrid; // image/text table
let sodCellEl;
let prevCell;
const FOCUS_CELL_CLASSNAME = 'sod-focus-cell';

export const closeSodPopup = () => {
  fmeaPopupUtils.closePopup();
  isOpenSodPopup = false;
  removePrevCell();
};

const removePrevCell = () => {
  if (prevCell) {
    prevCell.classList.remove(FOCUS_CELL_CLASSNAME);
    prevCell = null;
  }
};

const _addCellColor = (grid, toastGridCell) => {
  prevCell = grid.getElement(toastGridCell.rowKey, toastGridCell.columnName);
  prevCell.classList.add(FOCUS_CELL_CLASSNAME);
};

export const openSodPopup = async (grid, e) => {
  const toastGridCell = grid.getFocusedCell();
  mainGrid = grid;

  removePrevCell();

  if (checkColumnSelect(e)) {
    return;
  }

  if (sodCellEl) {
    sodCellEl.setAttribute('id', '');
    sodCellEl = null;
  }

  sodCellEl = grid.getElement(toastGridCell.rowKey, toastGridCell.columnName);
  const tableId = _getTableIdByCellName(toastGridCell);
  if (tableId) {
    _addCellColor(grid, toastGridCell);
    openSodBalloonPopup(tableId);
  }
};

const openSodBalloonPopup = (tableId) => {
  const inputParam = {
    declView: 'sodBalloon',
    options: {
      reference: 'referenceID',
      isModal: false,
      width: 1100,
      height: 510,
      clickOutsideToClose: true,
      hooks: {
        whenOpened: () => {
          appCtxService.registerCtx(constants.FMEA_POPUP, true);
          makeGridTable(tableId);
        },
        whenClosed: () => {
          closeSodPopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

const _getTableIdByCellName = (selectCell) => {
  const columnName = selectCell.columnName;
  switch (columnName) {
    case constants.COL_RESULT_SEVERITY_LANG[langIndex]:
      return constants.COL_RESULT_SEVERITY_LANG[0];
    case constants.COL_RESULT_OCCURENCE_LANG[langIndex]:
      return constants.COL_RESULT_OCCURENCE_LANG[0];
    case constants.COL_RESULT_DETECTION_LANG[langIndex]:
      return constants.COL_RESULT_DETECTION_LANG[0];
    default:
      return null;
  }
};

const checkColumnSelect = (e) => {
  const selectTarget = e.nativeEvent.target;
  if (selectTarget.classList.contains('tui-grid-cell-header')) {
    return true;
  }
  return false;
};

export const makeGridTable = async (tableId) => {
  const gridOption = await makePopupTableOption(tableId);
  innerGrid = new Grid(gridOption);
  innerGrid.on('focusChange', (ev) => {
    focusEvent(innerGrid, ev);
  });
};

const makePopupTableOption =async (tableId) => {
  const tableInfo = await getTableInfo(tableId);
  const columns = _getColumns(tableInfo);

  const sod = appCtxService.ctx[constants.FMEA_SOD];
  const datas = sod[tableInfo.type];

  const options = {
    el: document.getElementById('inner-grid'),
    columns: columns,
    data: datas,
    columnOptions: {
      minWidth: 150,
      resizable: true,
    },
    rowHeight: 'auto',
    contextMenu: null,
  };
  return options;
};

const _getColumns = (tableInfo) => {
  const columns = tableInfo.columns;
  const gridColumns = columns.map((column, index) => {
    return {
      title: column[0],
      name: column[langIndex],
      width: _getColWidth(index, column[0]),
    };
  });
  return gridColumns;
};

const _getColWidth = (index, column) => {
  if (index === 0) {
    return 50;
  } else if (column === prop.SOD_DESIGN_LIFE_RELIABILITY) {
    return 750;
  }
  return 'auto';
};

/** table row click event */
const focusEvent = (innerGrid, ev) => {
  const toastGridCell = mainGrid.getFocusedCell();
  const selectedRowKey = ev.rowKey;
  const selectRow = innerGrid.getRow(selectedRowKey);
  const gradeValue = getGradeValue(selectRow);
  mainGrid.setValue(toastGridCell.rowKey, toastGridCell.columnName, gradeValue);
  addChangeRowByGrade(gradeValue, mainGrid);
  closeSodPopup();
};

/** Reset Btn Event */
const resetAction = () => {
  resetBtnEvent(mainGrid);
  closeSodPopup();
};

export default {
  resetAction,
};