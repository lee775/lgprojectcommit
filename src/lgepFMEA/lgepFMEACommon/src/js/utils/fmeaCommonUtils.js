import appCtxService from 'js/appCtxService';
import localeService from 'js/localeService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { isEmptyValue } from 'js/utils/fmeaEditorUtils';
import { getLocalizedMessageByMaster } from 'js/utils/fmeaMessageUtils';
import navigationSvc from 'js/navigationService';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const SHORTEN_ALL_IMAGE = 'viewAllImage';

/**
 * 에디터 내용 요약
 * @param {string} value
 * @param {number} length
 * @returns {string} - replaceValue
 */
export const makeShortenValues = (value, length = 600) => {
  if (!value) {
    return '';
  }
  let replaceValue = removeTagInStr(value);
  if (replaceValue.length > length) {
    let subStringValue = replaceValue.substring(0, length) + '...';
    return subStringValue;
  }
  if (!isEmptyValue(value) && replaceValue === '') {
    return getLocalizedMessageByMaster(SHORTEN_ALL_IMAGE);
  } else if (isEmptyValue(value) && replaceValue === '') {
    return '';
  }
  return replaceValue;
};

/**
 * 에디터 code의 태그 제거
 * @param {string} value
 * @returns
 */
export const removeTagInStr = (value) => {
  let replaceSpace = value.replaceAll('<p>', ' ');
  let nonTagValue = replaceSpace.replaceAll(/[<][^>]*[>]/gi, '');
  // 그 외 예외처리
  let replaceValue = nonTagValue.replaceAll('&nbsp;', ' ');
  return replaceValue;
};

/**
 * 전달받은 URI로 이동 하면서 리비전 uid 넘김
 * @param {ModelObject} revision
 * @param {string} toUri
 */
export const navigationFmea = (revision, toUri = '#/dchecklistm') => {
  const action = {
    actionType: 'Navigate',
    navigateTo: toUri,
  };
  navigationSvc.navigate(action, { s_uid: revision.uid });
};

/**
 * 페이지 이동 시 모든 FMEA ctx 초기화 및
 * 팝업 창 close
 */
export const pageUnMount = (ctxList = constants.MASTER_CTX_LIST) => {
  for (const ctx of ctxList) {
    delete appCtxService.ctx[ctx];
  }
  fmeaPopupUtils.closePopup();
};

/**
 * value가 null / undefinded인 경우 '' 리턴
 * @param {string} value
 * @returns
 */
export const replaceEmptyValue = (value) => {
  if (!value) {
    return '';
  }
  return value;
};

export const getLangIndex = () => {
  const LOCALE_KR = 'ko_KR';
  if (localeService.getLocale() === LOCALE_KR) {
    return 1;
  } else {
    return 2;
  }
};

/**
 * 해당 FMEA로 이동
 * @param {ModelObject} dfmeaMasterRev
 */
export const goDFmeaMasterView = async (dfmeaMasterRev) => {
  appCtxService.registerCtx(constants.FMEA_SELECT, dfmeaMasterRev);
  navigationFmea(dfmeaMasterRev);

  await lgepCommonUtils.delay(500);
  location.reload();
};

// row의 최하위 structure uid get
export const getStructureUidUntilSubAssy = (selectRow) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  if (selectRow.props[prop.SUB_ASSY]) {
    return selectRow.props[prop.SUB_ASSY].uid;
  } else {
    return selectRow.props[prop.PARENT_ASSY].uid;
  }
};

export const getStructureUid = (selectRow) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  if (selectRow.props[constants.SINGLE_ITEM]) {
    return selectRow.props[constants.SINGLE_ITEM].uid;
  } else if (selectRow.props[prop.SUB_ASSY]) {
    return selectRow.props[prop.SUB_ASSY].uid;
  } else {
    return selectRow.props[prop.PARENT_ASSY].uid;
  }
};

export const replaceAmp = (text) => {
  if (text.includes('&amp;')) {
    return text.replaceAll('&amp;', ' & ');
  }
  return text;
};

// returns : clear vacuum
export const getProductNameValueByGroup = async () => {
  const lov = await getProductLovResults();
  const {
    propInternalValues: { lov_values: propValues },
  } = lov;
  return propValues[0];
};

// returns : {name : 청소기 value : vacuum }
export const initGroupProuct = async () => {
  const lov = await getProductLovResults();
  const {
    propDisplayValues: { lov_values: dispValues },
    propInternalValues: { lov_values: propValues },
  } = lov;
  return { name: dispValues[0], value: propValues[0] };
};

const ALL = '*';

const getProductLovResults = async () => {
  const productName = getProductNameByGroup();
  // if (productName === ALL) {
  //   return {
  //     propDisplayValues: { lov_values: ["ALL"] },
  //     propInternalValues: { lov_values: [ALL] },
  //   };
  // }
  const productLovResult = await lgepObjectUtils.getInitialLOVValues(
    prop.TYPE_FMEA_REVISION,
    'Create',
    prop.PRODUCT_CATEGORY
  );

  for (const lov of productLovResult.lovValues) {
    const {
      propDisplayValues: { lov_values: dispValues },
    } = lov;
    if (dispValues[0] === productName) {
      return lov;
    }
  }
  return productLovResult.lovValues[0];
};

//TODO :: LOCALE 작업
export const getProductNameByGroup = () => {
  const ctx = appCtxService.ctx;
  if (ctx[constants.FMEA_GROUP_PRODUCT]) {
    return ctx[constants.FMEA_GROUP_PRODUCT];
  }
  const groupName = ctx.userSession.props[prop.GROUP_NAME].dbValues[0];
  for (const groupProduct of constants.GROUP_PRODUCT) {
    const productName = groupProduct[groupName];
    if (productName) {
      appCtxService.registerCtx(constants.FMEA_GROUP_PRODUCT, productName);
      return productName;
    }
  }
  // if (groupName === 'H&A') {
  //   return ALL;
  // }
  const defaultProduct = constants.GROUP_PRODUCT[0]['DVZ'];
  appCtxService.registerCtx(constants.FMEA_GROUP_PRODUCT, defaultProduct);
  return defaultProduct;
};

export const insertLog = (msg, uid = '') => {
  try{
    lgepCommonUtils.userLogsInsert(msg, uid, 'S', 'Success');
  }catch(e){
    console.log('insert log ', e);
  }
};
