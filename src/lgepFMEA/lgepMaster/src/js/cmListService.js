/**
 * FMEA MASTER (구조/기능/고장) 조회 모듈 유틸
 * @module js/cmListService
 */
import appCtxService from 'js/appCtxService';
import vmoc from 'js/viewModelObjectService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import queryUtil from 'js/utils/lgepQueryUtils';

import tableUtil from 'js/utils/fmeaTableSortFilterUtils';
import failureEditService from 'js/failureEditService';
import functionEditService from 'js/functionEditService';
import { getHeaderData, getLongHeaderData } from 'js/utils/fmeaTableMakeUtils';
import {
  getProductNameValueByGroup,
  insertLog,
} from 'js/utils/fmeaCommonUtils';
import { cancel } from 'js/cmEditService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * Table Columns 생성
 * @param {TableDataProvider} dataProvider
 * @param {string[]} columns
 *  ㄴex. ['owning_user', '등록자'] -> 실제 property명과 테이블 컬럼에 보일 한글명
 */
export const makeColumns = (dataProvider, columns) => {
  const columnHeader = getHeaderData(columns);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

/**
 * Table Columns 생성
 * 첫번째 컬럼이 Long property인 경우
 * @param {TableDataProvider} dataProvider
 * @param {string[]} columns
 *  ㄴex. ['owning_user', '등록자'] -> 실제 property명과 테이블 컬럼에 보일 한글명
 */
export const makeLongColumns = (dataProvider, columns) => {
  const columnHeader = getLongHeaderData(columns);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

/**
 * 쿼리 검색 후 ViewModelObject로 변환 하여 리턴
 * @param {string} queryName - 쿼리명
 * @param {string[]} revProps - 리비전 속성 배열
 * @param {string[]} itemProps - 아이템 속성 배열
 * @returns
 */
export const loadTableData = async (queryName, revProps) => {
  const product = await getProductNameValueByGroup();
  const queryResults = await _allMasterSearchByProduct(queryName, product);
  if (queryResults) {
    const revCols = revProps.map((prop) => prop[0]);
    await lgepObjectUtils.getProperties(queryResults, revCols);

    const vmObjects = _makeTableDatas(queryResults);
    const results = tableUtil.sortDesc(vmObjects); // 기본 내림차순 정렬

    insertLog(`Load Checklist ${queryResults[0].type} Master`);
    appCtxService.registerCtx(constants.INIT_COMPLETE, true);
    
    return results;
  }

  // 테이블 헤더의 커맨드들이 테이블 결과보다 먼저 뜨는것 방지하기 위한 ctx
  appCtxService.registerCtx(constants.INIT_COMPLETE, true);

  return [];
};

/**
 * 제품별 마스터 객체 조회
 * @param {string} queryName
 * @param {string} product
 * @returns
 */
const _allMasterSearchByProduct = async (queryName, product) => {
  const queryResults = await queryUtil.executeSavedQuery(
    queryName,
    [prop.QUERY_ENTRY_ISMASTER, prop.QUERY_DFMEA_MASTER_PRODUCT],
    ['true', product]
  );
  return queryResults;
};

/**
 * ModelObject -> ViewModelObejct
 * @param {[ModelObject]} queryResults
 * @returns
 */
const _makeTableDatas = (queryResults) => {
  const results = queryResults.map((resultRev) => {
    return vmoc.createViewModelObject(resultRev);
  });
  return results;
};

/**
 * 테이블에서 선택한 ViewModelObject로 ModelObject 불러와 ctx에 저장
 * 편집중인 경우 편집 취소
 * @param {ViewModelObject} currentNode
 * @param {*} ctx
 */
export const selectTableRowAction = (currentNode, ctx) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  const selectMaster = lgepObjectUtils.getObject(currentNode.uid);
  appCtxService.registerCtx(constants.ROW_SELECT, selectMaster);

  // _removeAllObjsetCtx();
  if (ctx[constants.EDITING]) {
    _cancelEdit(selectMaster.type, ctx);
  }
};

/**
 * 편집 중 다른 테이블 행 선택하면 편집 취소
 * @param {string} masterType
 * @param {*} ctx
 */
const _cancelEdit = (masterType, ctx) => {
  if (masterType === prop.TYPE_FMEA_FAILURE_REVISION) {
    failureEditService.cancelEdit(ctx);
  } else if (masterType === prop.TYPE_FMEA_STRUCTURE_REV) {
    cancel();
  } else if (masterType === prop.TYPE_FMEA_FUNC_REVISION) {
    functionEditService.cancelEdit(ctx);
  }
};
