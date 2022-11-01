import appCtxService from 'js/appCtxService';

import {
  makeEditor,
  setValue,
  getEditorValueById,
} from 'js/utils/fmeaEditorUtils';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import { langIndex } from 'js/dfmeaMasterImageTableService';
import {lineBreak} from 'js/dfmeaMasterImageTableColumnLoadService';
import { addChangeRow } from 'js/dfmeaMasterRowEditService';
import * as constants from 'js/constants/fmeaConstants';
import { getTableMode } from 'js/utils/fmeaViewCommonUtils';
import { removeImgTagInStr } from 'js/dfmeaMasterTextGridTableService';
import { removeImgPopup } from 'js/dfmeaImageHoverService';

let table;
const EDITOR_ID = 'cell-editor';
export let isOpenCellEditor;

export const closeCellEditor = () => {
  fmeaPopupUtils.closePopup();
  isOpenCellEditor = false;
};

export const openCellEditor = (e, grid) => {
  table = grid;
  const propName = _getPropByColName(e.columnName);
  if (!propName) {
    return;
  }

  removeImgPopup();
  fmeaPopupUtils.openCellEditorPopup(e.columnName);
  isOpenCellEditor = true;
};

const onMount = async () => {
  const currentEditCell = table.getFocusedCell();
  makeEditor(EDITOR_ID, true);

  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    const rowKey = currentEditCell.rowKey;
    const tableList = appCtxService.ctx[constants.FMEA_TABLE_LIST];
    const row = tableList[rowKey];
    const propName = _getPropByColName(currentEditCell.columnName);
    const editValue = getEditValue(rowKey, propName);
    if (editValue) {
      setValue(EDITOR_ID, editValue);
      return;
    }
    const originValue = row[propName].value ? row[propName].value : '';
    setValue(EDITOR_ID, originValue);
  } else {
    setValue(EDITOR_ID, currentEditCell.value);
  }
};

export const getEditValue = (rowKey, propName) => {
  const changeInfo = appCtxService.ctx[constants.CHANGE_INFO];
  if (!changeInfo) {
    return;
  }
  const editRows = changeInfo[constants.CHANGE_EDIT_ROWS];
  for (const editRow of editRows) {
    if (rowKey === editRow.row.rowKey) {
      if (editRow[propName]) {
        return editRow[propName].value;
      }
    }
  }
};

const _getPropByColName = (columnName) => {
  for (const editorCol of constants.EDITOR_NOTETYPES_COLS) {
    if (columnName === editorCol[langIndex]) {
      return editorCol[0];
    }
  }
  return null;
};

const editSave = () => {
  const tableCell = table.getFocusedCell();
  const value = getEditorValueById(EDITOR_ID);
  _addChangeRowByEditorValue(value);

  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    table.setValue(
      tableCell.rowKey,
      tableCell.columnName,
      lineBreak(removeImgTagInStr(value))
    );
  } else {
    table.setValue(tableCell.rowKey, tableCell.columnName, value);
  }
  fmeaPopupUtils.closePopup();
};

const _addChangeRowByEditorValue = (value) => {
  const currentEditCell = table.getFocusedCell();
  const propName = _getPropByColName(currentEditCell.columnName);
  const changeRow = {
    [propName]: { value },
    row: appCtxService.ctx[constants.ROW_SELECT],
  };
  addChangeRow(changeRow, propName);
};

export default {
  onMount,
  editSave,
};
