/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterRowEditService
 */
import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import { makeShortenValues } from 'js/utils/fmeaCommonUtils';
import { getSelectItemRev, isTreeTable, getTableMode } from 'js/utils/fmeaViewCommonUtils';
import { showErrorMessage, showInfoMessage } from 'js/utils/fmeaMessageUtils';
import { getEditorValueById, changeEnableEditors } from 'js/utils/fmeaEditorUtils';
import { changeListUIOncloseEdit, editCtxHandle } from 'js/dfmeaMasterRowEditService';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import { ROW_EDITORS } from 'js/dfmeaMasterRowEditInitService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 편집한 로우 내용 저장
 * @param {*} ctx
 * @param {*} functionData
 * @param {*} failureData
 */
const editRowSaveAction = async (ctx, functionData, failureData) => {
  const selectRow = ctx[constants.ROW_SELECT];
  try {
    const newChangeInfo = await _getChangeInfo(ctx, functionData, failureData);
    if (!_checkResultChange(newChangeInfo)) {
      appCtxService.registerCtx(constants.FMEA_ROW_EDIT_SAVE, false);
    }

    if (isTreeTable()) {
      newChangeInfo['row'] = selectRow.viewModel;
    } else {
      newChangeInfo['row'] = selectRow;
    }

    const ctxChangeInfo = ctx[constants.CHANGE_INFO]; // 현재 changeInfo
    const editRows = getEditRows(ctxChangeInfo, newChangeInfo, selectRow.props.uid);
    const resultInfo = {
      ...ctxChangeInfo,
      isChagne: true,
      [constants.CHANGE_EDIT_ROWS]: editRows,
    };
    appCtxService.registerCtx(constants.CHANGE_INFO, resultInfo);

    _updateUI(ctx, selectRow, newChangeInfo);
    showInfoMessage('successEditSave');
    appCtxService.registerCtx(constants.FMEA_ROW_EDIT_SAVE, true);
  } catch (e) {
    showErrorMessage(e);
  } finally {
    changeListUIOncloseEdit();
    editCtxHandle(false);
  }
};

/**
 * 중복 row일 경우 최신 changeInfo로 덮어쓰기
 * @param {*} ctxChangeInfo
 * @param {*} newChangeInfo
 * @param {*} selectRowUid
 * @returns
 */
const getEditRows = (ctxChangeInfo, newChangeInfo, selectRowUid) => {
  const currentEditRows = [...ctxChangeInfo[constants.CHANGE_EDIT_ROWS]];
  try {
    const replaceIndex = currentEditRows.findIndex((currentEditRow) => currentEditRow.row.uid === selectRowUid);
    if (replaceIndex < 0) {
      return [...ctxChangeInfo[constants.CHANGE_EDIT_ROWS], newChangeInfo];
    }
    const currentEditRow = currentEditRows[replaceIndex];
    const changeEidtRow = { ...currentEditRow, newChangeInfo };
    currentEditRows.splice(replaceIndex, 1, changeEidtRow);
    return currentEditRows;
  } catch (e) {
    //console.log("getEditRows", e);
  }
};

/**
 * 최종적으로 수정된것이 있는지 체크
 * @param {Object} newChangeInfo
 * @returns
 */
const _checkResultChange = (newChangeInfo) => {
  const infos = Object.values(newChangeInfo);
  for (const info of infos) {
    const { uid, value } = info;
    if (value !== '') {
      return true;
    }
  }
  return false;
};

const _updateUI = (ctx, selectRow, changeInfo) => {
  const changeTableList = ctx[constants.FMEA_TABLE_LIST];
  const changeRow = _getChangeRow(ctx, selectRow, changeInfo);

  // 2. ChangeTableList 만들기
  const replaceIndex = changeTableList.findIndex((row) => row.uid === changeRow.uid);
  changeTableList.splice(replaceIndex, 1, changeRow);

  // 3. Editor Disabled
  // changeEnableEditors("disable", ROW_EDITORS);

  // 4. table Refresh
  _chagneTable(changeTableList);
};

/**
 * 실제 데이터 편집 작업 전 테이블 뷰만 update
 */
export const _chagneTable = (changeTableList) => {
  appCtxService.registerCtx(constants.DFMEA_CHANGE_TABLE_LIST, changeTableList);
  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    eventBus.publish('fmea.tree.update');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    eventBus.publish('fmea.textTable.update');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_IMAGE) {
    eventBus.publish('fmea.imageTable.update');
  }
};

const _updateRow = () => {
  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    // eventBus.publish('fmea.tree.update');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    // eventBus.publish('fmea.textTable.update');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_IMAGE) {
    eventBus.publish('fmea.imageTable.updateRow');
  }
};

const _getChangeRow = (ctx, selectRow, changeInfo) => {
  const isTreeMode = isTreeTable();
  if (isTreeMode) {
    return _updateTreeRow(selectRow, changeInfo);
  } else {
    return _updateImageRow(selectRow, changeInfo, ctx);
  }
};

// row 내용 변경
const _updateImageRow = (selectRow, changeInfo, ctx) => {
  const changeRow = _getTextRow(ctx, selectRow);
  const props = Object.keys(changeInfo);
  for (const prop of props) {
    const value = changeInfo[prop].value;
    if (value !== '') {
      const displayValue = makeShortenValues(value);
      const property = makeVmProperty(prop, value, displayValue);
      changeRow[prop] = property;
    }
  }
  return changeRow;
};

const _getTextRow = (ctx, selectRow) => {
  const tableList = ctx[constants.FMEA_TABLE_LIST];
  for (const textRow of tableList) {
    if (textRow.uid === selectRow.props.uid) {
      return textRow;
    }
  }
};

const _updateTreeRow = (selectRow, changeInfo) => {
  const changeRow = selectRow;
  const props = Object.keys(changeInfo);
  for (const prop of props) {
    const value = changeInfo[prop].value;
    if (value !== '') {
      const displayValue = makeShortenValues(value);
      const property = makeVmProperty(prop, value, displayValue);
      changeRow.props[prop] = property;
    }
  }
  return changeRow;
};

const _makeNewChangeInfo = () => {
  return {
    [prop.FUNCTION]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.FUNCTION_SHORT]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.REQUIREMENT]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.POTENTIAL_FAILURE_MODE]: {
      [constants.UID]: '',
      [constants.VALUE]: '',
    },
    [prop.POTENTIAL_FAILURE_MODE_SHORT]: {
      [constants.UID]: '',
      [constants.VALUE]: '',
    },
    [prop.FAILURE_EFFECT]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.FAILURE_EFFECT_SHORT]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.CAUSE_OF_FAILURE]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.CAUSE_OF_FAILURE_SHORT]: {
      [constants.UID]: '',
      [constants.VALUE]: '',
    },
    [prop.PRECATUIONS_ACTION]: { [constants.UID]: '', [constants.VALUE]: '' },
    [prop.DETECTION_ACTION]: { [constants.UID]: '', [constants.VALUE]: '' },
  };
};

/**
 * 로우의 수정된 부분 추출
 * @param {*} ctx
 * @param {*} functionData
 * @param {*} failureData
 * @returns
 */
const _getChangeInfo = async (ctx, functionData, failureData) => {
  const selectListDatas = ctx[constants.DFMEA_ALL_MASTER_DATA];
  const initEditorDatas = ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];

  const newFunctionValue = functionData.dbValue;
  const newFailureValue = failureData.dbValue;

  const newChangeInfo = _makeNewChangeInfo();

  const originValues = ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];
  // 기능
  if (_isSaveas(newFunctionValue, originValues, prop.FUNCTION)) {
    const newFunction = await getSelectItemRev(selectListDatas[constants.MASTER_DATA_KEY_FUNCTION], functionData);
    newChangeInfo[prop.FUNCTION] = {
      [constants.UID]: newFunction.uid,
      [constants.VALUE]: newFunctionValue,
    };
    newChangeInfo[prop.FUNCTION_SHORT] = {
      [constants.UID]: newFunction.uid,
      [constants.VALUE]: makeShortenValues(newFunctionValue),
    };
  }

  // const newRequirementValue = _getChangeEditorValue(
  //   initEditorDatas,
  //   prop.REQUIREMENT
  // );
  // newChangeInfo[prop.REQUIREMENT] = {
  //   [constants.VALUE]: newRequirementValue,
  // };

  // 고장
  if (_isSaveas(newFailureValue, originValues, prop.POTENTIAL_FAILURE_MODE)) {
    const newFailureRev = await getSelectItemRev(selectListDatas[constants.MASTER_DATA_KEY_FAILURE], failureData);
    newChangeInfo[prop.POTENTIAL_FAILURE_MODE] = {
      [constants.UID]: newFailureRev.uid,
      [constants.VALUE]: newFailureValue,
    };
    newChangeInfo[prop.POTENTIAL_FAILURE_MODE_SHORT] = {
      [constants.UID]: newFailureRev.uid,
      [constants.VALUE]: makeShortenValues(newFailureValue),
    };
  }

  // const newFailureEffectValue = _getChangeEditorValue(
  //   initEditorDatas,
  //   prop.FAILURE_EFFECT
  // );

  // newChangeInfo[prop.FAILURE_EFFECT] = {
  //   [constants.VALUE]: newFailureEffectValue,
  // };
  // newChangeInfo[prop.FAILURE_EFFECT_SHORT] = {
  //   [constants.VALUE]: makeShortenValues(newFailureEffectValue),
  // };
  // const newCauseFailureValue = _getChangeEditorValue(
  //   initEditorDatas,
  //   prop.CAUSE_OF_FAILURE
  // );
  // newChangeInfo[prop.CAUSE_OF_FAILURE_SHORT] = {
  //   [constants.VALUE]: makeShortenValues(newCauseFailureValue),
  // };
  // newChangeInfo[prop.CAUSE_OF_FAILURE] = {
  //   [constants.VALUE]: newCauseFailureValue,
  // };
  // const precautionValue = _getChangeEditorValue(
  //   initEditorDatas,
  //   prop.PRECATUIONS_ACTION
  // );

  // newChangeInfo[prop.PRECATUIONS_ACTION] = {
  //   [constants.VALUE]: precautionValue,
  // };

  // const detectionValue = _getChangeEditorValue(
  //   initEditorDatas,
  //   prop.DETECTION_ACTION
  // );

  // newChangeInfo[prop.DETECTION_ACTION] = {
  //   [constants.VALUE]: detectionValue,
  // };

  return newChangeInfo;
};

/**
 * 기존 에디터 value와 현재 에디터 value 비교해서
 * 서로 다를 경우 현재 에디터 value 리턴
 * @param {[Object]} initEditorDatas
 * @param {string} propId
 * @returns {string}
 */
const _getChangeEditorValue = (initEditorDatas, propId) => {
  const newEditorValue = getEditorValueById(propId);
  const originEditorValue = _getOriginEditorValue(initEditorDatas, propId);
  if (newEditorValue !== originEditorValue) {
    return newEditorValue;
  }
  return '';
};

/**
 * 전달받은 propId에 해당하는 기존 에디터 value 리턴
 * @param {[Object]} initEditorDatas
 * @param {string} propId
 * @returns
 */
const _getOriginEditorValue = (initEditorDatas, propId) => {
  return initEditorDatas.filter(({ id }) => id === propId)[0].value;
};

/**
 * 기능/ 고장의 saveas 여부 체크
 * @param {string} newValue
 * @param {Object} originValues
 * @param {string} propId
 * @returns
 */
const _isSaveas = (newValue, originValues, propId) => {
  const originFuncitonValue = originValues.filter(({ id }) => id === propId)[0].value;
  if (newValue === originFuncitonValue) {
    return false;
  }

  return true;
};

export default {
  editRowSaveAction,
};
