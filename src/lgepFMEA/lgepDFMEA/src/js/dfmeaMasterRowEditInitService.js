/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterRowEditService
 */
import appCtxService from 'js/appCtxService';

import { setValue, getEditorValueById, changeEnableEditors } from 'js/utils/fmeaEditorUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

// 에디터 value 저장 및 활성화
export const ROW_EDITORS = [prop.REQUIREMENT, prop.FAILURE_EFFECT, prop.CAUSE_OF_FAILURE, prop.PRECATUIONS_ACTION, prop.DETECTION_ACTION];

/**
 * 로우 편집 실행
 * 마스터 속성 List 전환
 * 기존 값 저장
 * 에디터 편집 활성화
 * UI 수정
 * @param {*} ctx
 * @returns
 */
const editRow = (ctx) => {
  const selectRow = ctx[constants.ROW_SELECT];
  // 리스트 초기화
  const result = _getListValues(ctx, selectRow);
  const { functionValue, failureValue } = result;
  setValue(prop.FUNCTION, functionValue.propDisplayValue);
  setValue(prop.POTENTIAL_FAILURE_MODE, failureValue.propDisplayValue);

  _setDefaultEditorValue();
  // changeEnableEditors('enable', ROW_EDITORS);

  // 편집 모드 실행
  _editCtxHandle(true);
  return result;
};

/**
 * 기능/고장모드 마스터 리스트 호출
 * @param {*} ctx
 * @param {Object} selectRow
 * @returns
 */
const _getListValues = (ctx, selectRow) => {
  const allMasterList = ctx[constants.DFMEA_ALL_MASTER_DATA];
  const functionValues = allMasterList[constants.MASTER_DATA_KEY_FUNCTION];
  const failureValues = allMasterList[constants.MASTER_DATA_KEY_FAILURE];

  const currentValues = _getCurrentValues(selectRow);
  const [currentFunctionValue, currentFailureValue] = currentValues;

  const resultFunctionValues = _changeOrderValues(functionValues, currentFunctionValue);
  const resultFailureValues = _changeOrderValues(failureValues, currentFailureValue);

  return {
    l2_function: resultFunctionValues,
    functionValue: currentFunctionValue,
    failureValue: currentFailureValue,
    l2_potential_failure_mode: resultFailureValues,
  };
};

const _getCurrentValues = (selectRow) => {
  const changeRows = appCtxService.ctx[constants.CHANGE_INFO][constants.CHANGE_EDIT_ROWS];
  // chagne rows에 있으면
  for (const changeRow of changeRows) {
    if (selectRow.props.uid === changeRow.row.props.uid) {
      //function이나 failure를 이미 바꿨으면
      const functionValue = _getCurrentListValueByProp(changeRow, selectRow, prop.FUNCTION_SHORT);
      const failureValue = _getCurrentListValueByProp(changeRow, selectRow, prop.POTENTIAL_FAILURE_MODE_SHORT);

      return [functionValue, failureValue];
    }
  }
  return [selectRow.props[prop.FUNCTION_SHORT].value, selectRow.props[prop.POTENTIAL_FAILURE_MODE_SHORT].value];
};

const _getCurrentListValueByProp = (changeRow, selectRow, prop) => {
  const changeRowProp = changeRow[prop];
  if (!changeRowProp || !changeRowProp.value) {
    return selectRow.props[prop].value;
  } else {
    return changeRowProp.value;
  }
};

const _changeOrderValues = (values, currentValue) => {
  const currentValueObj = values.find((value) => value.propDisplayValue === currentValue);
  const filaterValues = values.filter((value) => value.propDisplayValue !== currentValueObj.propDisplayValue);
  return [currentValueObj, ...filaterValues];
};

/**
 * 기존 에디터 값 저장
 */
const _setDefaultEditorValue = () => {
  const allEditors = [
    prop.FUNCTION,
    prop.REQUIREMENT,
    prop.POTENTIAL_FAILURE_MODE,
    prop.FAILURE_EFFECT,
    prop.CAUSE_OF_FAILURE,
    prop.PRECATUIONS_ACTION,
    prop.DETECTION_ACTION,
  ];
  const editorValeus = allEditors.map((id) => {
    const value = getEditorValueById(id);
    return {
      id,
      value,
    };
  });
  appCtxService.registerCtx(constants.DFMEA_ROW_EDIT_INIT_VALUES, editorValeus);
};

/**
 * 편집 실행/취소 시 관련 CTX 처리
 * @param {boolean} condition
 */
const _editCtxHandle = (condition) => {
  appCtxService.registerCtx(constants.DFMEA_ROW_EDIT, condition);
  appCtxService.registerCtx(constants.FMEA_POPUP, condition);
  if (!condition) {
    delete appCtxService.ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];
  }
};

export default {
  editRow,
};
