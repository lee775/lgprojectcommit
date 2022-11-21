/**
 * DFMEA Master 생성 서비스
 */
import appCtxService from 'js/appCtxService';

import queryUtil from 'js/utils/lgepQueryUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import dfmeaMasterListService from 'js/dfmeaMasterListService';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { afterSaveAction, beforeSaveAction } from 'js/utils/fmeaViewCommonUtils';
import { getProductNameByGroup, getProductNameValueByGroup, insertLog } from 'js/utils/fmeaCommonUtils';
import { createItem } from 'js/utils/fmeaTcUtils';
import { validationInputs } from 'js/utils/fmeaValidationUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * DFMEA Master/Sheet 생성 창 호출
 * @param {*} htmlPanel
 * @param {*} title
 * @returns
 */
const openCreateView = (htmlPanel, title) => {
  fmeaPopupUtils.openDfmeaCreatePopup(htmlPanel, title);
};

// 팝업창 초기화
const onMount = () => {
  const productValue = getProductNameByGroup();
  return { productValue };
};

/**
 * DFMEA 생성
 * @param {*} data
 */
const createAction = async (data) => {
  const { dfmeaName } = data;
  try {
    //1. validation check
    validationInputs([dfmeaName]);

    // 2. button disable, progress
    beforeSaveAction(data);

    // 3. DFMEA SHEET 생성
    const master = await createItem(prop.TYPE_DFMEA_MASTER_ITEM, dfmeaName.dbValue);
    const dfmeaRev = master.itemRev;

    // TODO :: SOD 강제 추가 로직 삭제
    const queryResults = await queryUtil.executeSavedQuery(prop.QUERY_FMEA_SOD, prop.QUERY_ENTRY_NAME, '청소기_Risk Rankings');

    const productValue = await getProductNameValueByGroup();

    await lgepObjectUtils.setProperties(dfmeaRev, [prop.PRODUCT, prop.REF_SOD_STANDARD], [productValue, queryResults[0].uid]);

    await lgepObjectUtils.setProperties(dfmeaRev, [prop.PRODUCT], [productValue]);

    // 후 처리
    afterSaveAction(data);
    fmeaPopupUtils.closePopup();

    appCtxService.registerCtx(constants.INIT_CREATE_VIEW, true);

    insertLog('Create CheckList', dfmeaRev.uid);

    // 페이지 이동
    dfmeaMasterListService.goDFmeaMasterView(dfmeaRev);
  } catch (e) {
    showErrorMessage(e);
  } finally {
    afterSaveAction(data);
  }
};

export default {
  openCreateView,
  createAction,
  onMount,
};
