/**
 * DFMEA Master Row 추가 팝업 초기화 서비스
 */
import { initeEditorByCreate, initeEditorByCreateByValue } from 'js/utils/fmeaEditorUtils';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 추가 팝업 창 초기화
 * @param {*} ctx
 * @returns {{string : []}}
 */
const onMount = async (ctx) => {
  const masterList = initMasterList(ctx);
  const firstFcuntionValue = masterList[prop.FUNCTION].functionValues;
  const firstFailureValue = masterList[prop.POTENTIAL_FAILURE_MODE].failureValues;
  _mountEditors(firstFcuntionValue, firstFailureValue);
  return masterList;
};

/**
 * Master List 초기화
 * @param {*} ctx
 * @returns
 */
const initMasterList = (ctx) => {
  const allMasterList = ctx[constants.DFMEA_ALL_MASTER_DATA];
  const functionValues = allMasterList[constants.MASTER_DATA_KEY_FUNCTION];
  const failureValues = allMasterList[constants.MASTER_DATA_KEY_FAILURE];
  return {
    [prop.PARENT_ASSY]: allMasterList[constants.MASTER_DATA_KEY_STRUCTURE]['parentAssyList'],
    [prop.SUB_ASSY]: allMasterList[constants.MASTER_DATA_KEY_STRUCTURE]['subAssyList'],
    [constants.SINGLE_ITEM]: allMasterList[constants.MASTER_DATA_KEY_STRUCTURE]['singleAssyList'],
    [prop.FUNCTION]: functionValues,
    [prop.POTENTIAL_FAILURE_MODE]: failureValues,
  };
};

/**
 * 에디터 초기화
 * 입력 받지 않는 에디터 초기화 (구조, 기능, 고장모드)
 * 그 외 입력 받는 에디터 초기화
 * @param {string} initFunctionValue
 * @param {string} initFailureValue
 */
const _mountEditors = (initFunctionValue, initFailureValue) => {
  initeEditorByCreateByValue(prop.FUNCTION, initFunctionValue);
  initeEditorByCreateByValue(prop.POTENTIAL_FAILURE_MODE, initFailureValue);

  initActionInAbleEditors();
};

/**
 * 구조, 기능, 잠재적고장모드 제외한 에디터 초기화
 */
const initActionInAbleEditors = () => {
  const ids = [prop.REQUIREMENT, prop.FAILURE_EFFECT, prop.CAUSE_OF_FAILURE, prop.PRECATUIONS_ACTION, prop.DETECTION_ACTION];
  ids.forEach((id) => {
    initeEditorByCreate(id, 835);
  });
};

/**
 *  fmea 추가 팝업 창 오픈
 * @param {string} htmlPanel
 * @param {string} title
 */
const openCreateView = async (htmlPanel, title) => {
  fmeaPopupUtils.openDfmeaAddPopup(htmlPanel, title);
};

export default {
  onMount,
  openCreateView,
};
