/**
 * DFMEA Master List
 * @module js/dfmeaMasterListService
 */
import appCtxService from 'js/appCtxService';

import {
  navigationFmea,
  pageUnMount,
  initGroupProuct,
  getLangIndex,
} from 'js/utils/fmeaCommonUtils';
import { tableRefresh } from 'js/utils/fmeaViewCommonUtils';
import { getLocalizedText } from 'js/utils/fmeaMessageUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';
import { initSod } from 'js/sodInitService';
import queryUtil from 'js/utils/lgepQueryUtils';
import { initMasterDatas } from 'js/dfmeaMasterEditInitService';

/**
 * 트리 테이블에서 리비전 행 선택 시 해당 리비전 View로 페이지 이동
 * @param {ModelObject} dfmeaMasterRev
 */
const goDFmeaMasterView = (dfmeaMasterRev) => {
  appCtxService.registerCtx(
    constants.DFMEA_TABLE_MODE,
    constants.DFMEA_TABLE_MODE_KEY_IMAGE
  );
  appCtxService.registerCtx(constants.FMEA_SELECT, dfmeaMasterRev);
  navigationFmea(dfmeaMasterRev);
};

const onMount = async () => {
  const productInfo = await initGroupProuct();

  // SOD 초기화
  await onLoadSod(productInfo);

  // 관련 Master list 초기화
  initMasterDatas(productInfo.value);
  _setProductTitle(productInfo);

  tableRefresh('dfmeaListTable');
};

export const onLoadSod = async (productInfo) => {
  const entryValue = entryValueByProduct(productInfo.value);
  const queryResults = await _loadSod(entryValue);
  initSod(queryResults[0].uid);
};

const entryValueByProduct = (productValue) => {
  if (productValue === 'refrigerator') {
    return '냉장고_RiskRankings';
  }
  return '청소기_Risk Rankings';
};

const _loadSod = async (entryValue) => {
  const queryResults = await queryUtil.executeSavedQuery(
    prop.QUERY_FMEA_SOD,
    prop.QUERY_ENTRY_NAME,
    entryValue
  );
  return queryResults;
};

const _setProductTitle = (productInfo) => {
  const headerTitleEl = document.querySelector('aw-sublocation-title');
  const productTitleEl = document.createElement('div');
  productTitleEl.classList.add('product-title');

  const localProductTitle = getLocalizedText(
    'lgepDFMEAViewMessages',
    'productTitle'
  );
  const localProdcutVale =
    getLangIndex() === 1 ? productInfo.name : productInfo.value;

  productTitleEl.textContent =
    localProductTitle +
    constants.TWOSPACING +
    ':' +
    constants.TWOSPACING +
    localProdcutVale;
  headerTitleEl.appendChild(productTitleEl);
};

const unMount = () => {
  const allCtxList = constants.FMEA_CTX_LIST;
  pageUnMount(allCtxList);
};

export default {
  goDFmeaMasterView,
  onMount,
  unMount,
};
