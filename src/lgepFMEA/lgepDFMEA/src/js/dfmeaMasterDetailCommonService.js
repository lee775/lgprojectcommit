/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterDetailService
 */
import appCtxService from 'js/appCtxService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

import { makeEditor, setValue } from 'js/utils/fmeaEditorUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

export const loadDetail = async (selectRow) => {
  await lgepCommonUtils.delay(100);

  functionInit(selectRow);

  requirementInit(selectRow);

  failureInit(selectRow);

  actionInit(selectRow);
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
};

/**
 * 조치 액션 (예방/검출) value값으로 에디터 init
 * @param {} selectRow
 */
export const actionInit = async (selectRow) => {
  const {
    [prop.PRECATUIONS_ACTION]: { dbValue: precautionsActionValue },
    [prop.DETECTION_ACTION]: { dbValue: detectionActionValue },
  } = selectRow.props;
  _setEditValue(prop.PRECATUIONS_ACTION, precautionsActionValue);
  _setEditValue(prop.DETECTION_ACTION, detectionActionValue);
};

/**
 * 기능 value값으로 에디터 init,
 * @param {string} selectRow
 */
export const functionInit = async (selectRow) => {
  const {
    [prop.FUNCTION]: { dbValue: functionValue },
  } = selectRow.props;
  //console.log(prop.FUNCTION, functionValue);
  _setEditValue(prop.FUNCTION, functionValue);
};

/**
 * 요구사항 value값으로 에디터 init
 * @param {*} selectRow
 */
export const requirementInit = async (selectRow) => {
  const {
    [prop.REQUIREMENT]: { dbValue: requirementsValue, uid: requirementUid },
  } = selectRow.props;
  _setEditValue(prop.REQUIREMENT, requirementsValue);
};

/**
 * 고장 객체의 모드,영향,원인 속성 값으로 에디터 init
 * @param {string} selectRow
 */
export const failureInit = async (selectRow) => {
  const {
    [prop.POTENTIAL_FAILURE_MODE]: { dbValue: potentialFailureModeValue },
    [prop.CAUSE_OF_FAILURE]: { dbValue: causeOfFailureValue },
    [prop.FAILURE_EFFECT]: { dbValue: failureEffectValue },
  } = selectRow.props;
  _setEditValue(prop.POTENTIAL_FAILURE_MODE, potentialFailureModeValue);
  _setEditValue(prop.FAILURE_EFFECT, failureEffectValue);
  _setEditValue(prop.CAUSE_OF_FAILURE, causeOfFailureValue);
};

export const setEmptyEditorValue = async () => {
  await lgepCommonUtils.delay(100);
  functionInit();
  failureInit();
  actionInit();
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
};

const _setEditValue = (prop, value) => {
  makeEditor(prop, 'disable');
  setValue(prop, value);
};
