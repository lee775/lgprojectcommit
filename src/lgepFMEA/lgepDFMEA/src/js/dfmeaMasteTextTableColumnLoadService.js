/**
 * FMEA Master Text Table 컬럼 로드 서비스
 */
import { getLangIndex } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';

const columns = [
  constants.COL_PARENT_ASSY_LANG,
  constants.COL_SUB_ASSY_LANG,
  constants.COL_SINGLE_ITEM_LANG,
  constants.COL_FAILURE_FUNCTION_LANG,
  constants.COL_FAILURE_REQUIREMENT_LANG,
  constants.COL_FAILURE_LANG,
  constants.COL_FAILURE_EFFECT_LANG,
  constants.COL_CAUSE_OF_FAILURE_LANG,
  constants.COL_PRECATUIONS_ACTION_LANG,
  constants.COL_RELATED_SOURCES_LANG,
  constants.COL_DETECTION_ACTION_LANG,
  constants.COL_CLASSIFICATION_LANG,
  constants.COL_SEVERITY_LANG,
  constants.COL_OCCURENCE_LANG,
  constants.COL_DETECTION_LANG,
  constants.COL_AP_LANG,
  constants.COL_INSPECTION_RESULTS_LANG,
  constants.COL_RECOMMENDED_ACTION_LANG,
  // constants.COL_RESPONSIBLE_LANG,
  // constants.COL_TARGET_DATE_LANG,
  constants.COL_RECOMMENDED_ACTION_RESULT_LANG,
  constants.COL_RESULT_SEVERITY_LANG,
  constants.COL_RESULT_OCCURENCE_LANG,
  constants.COL_RESULT_DETECTION_LANG,
  constants.COL_RESULT_AP_LANG,
];

const loadColumns = (dataProvider) => {
  const langIndex = getLangIndex();

  const columnHeader = columns.map((column) => {
    const width = _getColumnWidth(column[0]);
    return _getLangColumn(column, langIndex, width);
  });

  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};


const _getColumnWidth = (column) => {
  switch (column) {
    case constants.COL_PARENT_ASSY_LANG[0]:
    case constants.COL_SUB_ASSY_LANG[0]:
      return 250;
    case constants.COL_FAILURE_FUNCTION_LANG[0]:
    case constants.COL_FAILURE_REQUIREMENT_LANG[0]:
    case constants.COL_FAILURE_LANG[0]:
    case constants.COL_FAILURE_EFFECT_LANG[0]:
    case constants.COL_CAUSE_OF_FAILURE_LANG[0]:
    case constants.COL_PRECATUIONS_ACTION_LANG[0]:
    case constants.COL_DETECTION_ACTION_LANG[0]:
      return 600;
    default:
      return 120;
  }
};

const _getLangColumn = (column, langIndex, width) => {
  return {
    name: column[0],
    propertyName: column[0],
    displayName: column[langIndex],
    typeName: 'String',
    width: width,
    modifiable: false,
    enableColumnResizing: true,
    enableColumnMoving: false,
  };
};

export default {
  loadColumns,
};
