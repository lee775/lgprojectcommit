/**
 * FMEA 마스터 - 고장 (조회)
 * @module js/failureListService
 */
import { makeLongColumns, loadTableData } from 'js/cmListService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const TABLE_COLS = [constants.COL_FAILURE_SHORT_LANG, constants.COL_PRODUCT_OBJECT_NAME_LANG, constants.COL_OWNING_USER_LANG, constants.COL_CREATION_DATE_LANG];

/**
 * 고장 테이블 리스트 컬럼
 */
const loadColumns = (dataProvider) => {
  makeLongColumns(dataProvider, TABLE_COLS);
};

/**
 * 고장 테이블 리스트
 * @returns {
 * number,
 * [ViewModelObject]
 * }
 */
const loadData = async () => {
  const results = await loadTableData(prop.QUERY_FMEA_FAILURE, TABLE_COLS);
  return {
    totalFound: results.length,
    searchResults: results,
  };
};

export default {
  loadData,
  loadColumns,
};
