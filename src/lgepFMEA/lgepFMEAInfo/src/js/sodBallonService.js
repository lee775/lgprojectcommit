import vmoc from 'js/viewModelObjectService';

import { getHeaderData } from 'js/utils/fmeaTableMakeUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const loadColumnSeverity = (dataProvider) => {
  const columns = [constants.COL_GRADE, constants.COL_CAUSE_EFFECT, constants.COL_EFFECT, constants.COL_EVALUATION_STANDARD];
  _setColumns(dataProvider, columns);
};

const loadDataSeverity = async (ctx) => {
  const sod = ctx[constants.FMEA_SOD];
  const rows = sod[prop.SOD_SEVERITY_TABLE];

  const result = _getTableDatas(rows);
  return result;
};

const loadColumnOccurence = (dataProvider) => {
  const columns = [constants.COL_GRADE, constants.COL_POSSIBILITY_OF_FAILURE, constants.COL_DESIGN_LIFE_RELIABILITY];
  _setColumns(dataProvider, columns);
};

const loadDataOccurence = async (ctx) => {
  const sod = ctx[constants.FMEA_SOD];
  const rows = sod[prop.SOD_OCCURENCE_TABLE];

  const result = _getTableDatas(rows);
  return result;
};

const loadColumnDetection = (dataProvider) => {
  const columns = [constants.COL_GRADE, constants.COL_DETECTION_OPPORTUNITY, constants.COL_DETECTION_RANGE, constants.COL_DETECTABILITY];
  _setColumns(dataProvider, columns);
};

const loadDataDetection = (ctx) => {
  const sod = ctx[constants.FMEA_SOD];
  const rows = sod[prop.SOD_DETECTION_TABLE];
  const result = _getTableDatas(rows);
  return result;
};

const _setColumns = (dataProvider, columns) => {
  const columnHeader = getHeaderData(columns);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

export const _getTableDatas = async (rows) => {
  const results = rows.map((row) => {
    return vmoc.createViewModelObject(row);
  });

  const result = {
    filterResults: results,
    totalFound: results.length,
  };
  return result;
};

export const filterRows = (response, startIndex) => {
  const searchResults = response.filterResults.slice(startIndex, 40);
  return searchResults;
};

export default {
  loadColumnSeverity,
  loadDataSeverity,
  loadDataOccurence,
  loadColumnOccurence,
  loadColumnDetection,
  loadDataDetection,
  filterRows,
};
