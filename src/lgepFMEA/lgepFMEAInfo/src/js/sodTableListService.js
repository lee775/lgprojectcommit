/**
 * Structure Master List
 * @module js/structureListService
 */
import vmoc from 'js/viewModelObjectService';
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import queryUtil from 'js/utils/lgepQueryUtils';

import { makeColumns } from 'js/cmListService';
import { getProductNameByGroup } from 'js/utils/fmeaCommonUtils';
import tableUtil from 'js/utils/fmeaTableSortFilterUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const TABLE_COLS = [constants.COL_NAME, constants.COL_TYPE, constants.COL_OWNING_USER_LANG, constants.COL_CREATION_DATE_LANG];

/**
 * @param {TableDataProvider} dataProvider
 * @returns
 */
const loadColumns = (dataProvider) => {
  makeColumns(dataProvider, TABLE_COLS);
};

/**
 * @returns {
 * number,
 * [ViewModelObject]
 * }
 */
const loadData = async (ctx) => {
  const results = await loadTableData(prop.QUERY_FMEA_SOD, TABLE_COLS);
  //console.log("results", results);
  ctx.ap_edited = false;
  appCtxService.registerCtx(constants.FMEA_SET_VMO, results);
  return {
    totalFound: results.length,
    searchResults: results,
  };
};

export const loadTableData = async (queryName, revProps, itemProps) => {
  const product = getProductNameByGroup();
  const queryResults = await queryUtil.executeSavedQuery(
    queryName,
    [prop.QUERY_ENTRY_NAME, prop.QUERY_DFMEA_MASTER_PRODUCT],
    ['*', product],
    lgepObjectUtils.createPolicy(['l2_severity_table', 'l2_occurence_table', 'l2_detection_table', 'l2_product', 'object_name', 'l2_ap_table'], 'L2_SODTable'),
  );

  if (queryResults) {
    const vmObjects = await makeTableDatas(queryResults, revProps, itemProps);
    const results = tableUtil.sortDesc(vmObjects); // 기본 내림차순 정렬
    return results;
  }
  // 테이블 헤더의 커맨드들이 테이블 결과보다 먼저 뜨는것 방지하기 위한 ctx
  appCtxService.registerCtx(constants.INIT_COMPLETE, true);
  return [];
};

const makeTableDatas = async (queryResults, revProps) => {
  const revCols = revProps.map((prop) => prop[0]);
  const results = await Promise.all(
    queryResults.map(async (result) => {
      const model = lgepObjectUtils.getObject(result.uid);
      await lgepObjectUtils.getProperties(model, revCols);
      let vmo = vmoc.createViewModelObject(model);

      return vmo;
    }),
  );

  return results;
};

const setVmoXrt = async () => {
  const results = await loadTableData(prop.QUERY_FMEA_SOD, TABLE_COLS);
  //console.log("results", results);
  appCtxService.registerCtx(constants.FMEA_SET_VMO, results);
};

export default {
  loadData,
  loadColumns,
  setVmoXrt,
};
