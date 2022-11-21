/**
 * FMEA 마스터 - 구조 (조회)
 * @module js/structureListService
 */
import { makeColumns, loadTableData } from 'js/cmListService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const TABLE_COLS = [
  constants.COL_STRUTURE_NAME_LANG,
  constants.COL_PRODUCT_OBJECT_NAME_LANG,
  constants.COL_CATEGORY_LANG,
  constants.COL_OWNING_USER_LANG,
  constants.COL_CREATION_DATE_LANG,
];

/**
 * 구조 테이블 리스트 컬럼
 */
const loadColumns = (dataProvider) => {
  makeColumns(dataProvider, TABLE_COLS);
};

/**
 * 구조 테이블 리스트
 * @returns {
 * number,
 * [ViewModelObject]
 * }
 */
const loadData = async () => {
  const results = await loadTableData(prop.QUERY_FMEA_STRUCTURE, TABLE_COLS);
  return {
    totalFound: results.length,
    searchResults: results,
  };
};

export default {
  loadData,
  loadColumns,
};
