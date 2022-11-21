import appCtxService from 'js/appCtxService';

import { getLangIndex, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let langIndex;
let tableInfo;

export const initSod = async (sodUid) => {
  langIndex = getLangIndex();
  if (!sodUid) {
    return;
  }

  const sod = await loadObjectByPolicy(sodUid, prop.TYPE_SOD, [prop.SOD_SEVERITY_TABLE, prop.SOD_OCCURENCE_TABLE, prop.SOD_DETECTION_TABLE]);

  await _getTableInfo();

  const severityTables = await _makeTableRow(sod, prop.SOD_SEVERITY_TABLE);
  const occurenceTables = await _makeTableRow(sod, prop.SOD_OCCURENCE_TABLE);
  const detectionTables = await _makeTableRow(sod, prop.SOD_DETECTION_TABLE);

  const sodInfo = {
    [prop.SOD_SEVERITY_TABLE]: severityTables,
    [prop.SOD_OCCURENCE_TABLE]: occurenceTables,
    [prop.SOD_DETECTION_TABLE]: detectionTables,
  };

  appCtxService.registerCtx(constants.FMEA_SOD, sodInfo);
};

const _getTableInfo = async () => {
  const productInfo = await initGroupProuct();
  if (productInfo.value === 'refrigerator') {
    tableInfo = constants.SOD_REFRIGERATOR_TABLE_INFO;
    return;
  }
  tableInfo = constants.SOD_VACUUM_TABLE_INFO;
};

const _makeTableRow = async (sod, tableName) => {
  const props = tableInfo[tableName].cols.map((col) => col[0]);
  const objects = await _loadSodTables(sod, tableName, props);
  return _getTableDatas(objects, tableName, props);
};

const _loadSodTables = async (sod, tableName, props) => {
  const tables = await Promise.all(
    sod.props[tableName].dbValues.map(async (uid) => {
      const tableRow = await loadObjectByPolicy(uid, prop.TYPE_SOD_ROW, props);
      return tableRow;
    }),
  );
  return tables;
};

const _getTableDatas = (objects, tableName, props) => {
  const columns = tableInfo[tableName].cols;
  return objects.map((row) => {
    return _makeRow(row, props, columns);
  });
};

const _makeRow = (tableRow, props, columns) => {
  let row;
  for (let index = 0; index < props.length; index++) {
    const propName = props[index];
    row = {
      ...row,
      [columns[index][langIndex]]: tableRow.props[propName].dbValues[0],
    };
  }
  return row;
};
