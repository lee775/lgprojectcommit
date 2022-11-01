/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterRowEditService
 */
import appCtxService from 'js/appCtxService';

import { setValue, changeEnableEditors } from 'js/utils/fmeaEditorUtils';
import { ROW_EDITORS } from 'js/dfmeaMasterRowEditInitService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 기능 List에서 기능 선택하면 에디터 업데이트
 * @param {*} functionData
 */
const selectionFunction = (functionData) => {
  const value = functionData.dbValue !== '' ? functionData.dbValue : '';
  setValue(prop.FUNCTION, value);
};

/**
 * 고장 List에서 고장 선택하면 에디터 업데이트
 * @param {*} functionData
 */
const selectionFailure = (failureData) => {
  const value = failureData.dbValue !== '' ? failureData.dbValue : '';
  setValue(prop.POTENTIAL_FAILURE_MODE, value);
};

/**
 * 편집 취소
 * 에디터 RESET
 * @param {*} ctx
 */
export const editRowCancelAction = (ctx) => {
  const editorValeus = ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];
  for (const valueObj of editorValeus) {
    const { id, value } = valueObj;
    setValue(id, value);
  }
  changeEnableEditors('disable', ROW_EDITORS);

  changeListUIOncloseEdit();
  editCtxHandle(false);
};

/**
 * List UI 수정
 */
export const changeListUIOncloseEdit = () => {
  const labelList = document.querySelectorAll('.list-editor');
  for (const label of labelList) {
    label.classList.remove('edit');
  }
};
/**
 * 편집 실행/취소 시 관련 CTX 처리
 * @param {boolean} condition
 */
export const editCtxHandle = (condition) => {
  appCtxService.registerCtx(constants.DFMEA_ROW_EDIT, condition);
  appCtxService.registerCtx(constants.FMEA_POPUP, condition);
  if (!condition) {
    delete appCtxService.ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];
  }
};

/**
 * 테이블 행에서 편집 (sod/user등)
 * @param {*} changeRow
 * @param {*} propName
 */
export const addChangeRow = (changeRow, propName) => {
  let changeInfo = appCtxService.ctx[constants.CHANGE_INFO];
  let baseChangeRows = changeInfo[constants.CHANGE_EDIT_ROWS];
  const baseChangeRow = _checkExistRow(baseChangeRows, changeRow);
  if (baseChangeRow) {
    baseChangeRow[propName] = changeRow[propName];
  } else {
    baseChangeRows.push(changeRow);
  }

  setChangeEditRows(baseChangeRows, changeInfo);
};

const _checkExistRow = (baseChangeRows, changeRow) => {
  for (const baseChangeRow of baseChangeRows) {
    if (baseChangeRow.row.props.uid === changeRow.row.props.uid) {
      return baseChangeRow;
    }
  }
};

export const setChangeEditRows = (
  resultChangeRows,
  changeInfo = appCtxService.ctx[constants.CHANGE_INFO]
) => {
  const resultInfo = {
    ...changeInfo,
    [constants.CHANGE_EDIT_ROWS]: resultChangeRows,
  };
  appCtxService.registerCtx(constants.CHANGE_INFO, resultInfo);
};

export default {
  editRowCancelAction,
  selectionFunction,
  selectionFailure,
};
