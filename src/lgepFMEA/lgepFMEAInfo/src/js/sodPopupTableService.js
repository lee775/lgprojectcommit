import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import { getLangIndex, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import { initToastGrid } from 'js/utils/fmeaViewCommonUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let langIndex;
let typeTable;

const onMount = async (ctx, tableId) => {
  langIndex = getLangIndex();

  const tableInfo = await getTableInfo(tableId);

  const widthArray = _getColumnWidth(tableId);
  const sod = ctx[constants.FMEA_SOD];
  const columns = _getColumns(typeTable[tableInfo.type].cols, widthArray);
  const datas = sod[tableInfo.type];

  const options = {
    el: document.getElementById(tableInfo.tableElId),
    scrollX: true,
    scrollY: true,
    bodyHeight: 'fitToParent',
    columnOptions: {
      resizable: true,
    },
    rowHeight: 'auto',
    columns: columns,
    contextMenu: null,
    selectionUnit: 'row',
  };
  initToastGrid();

  const grid = new Grid(options);
  grid.resetData(datas);

  grid.setFrozenColumnCount(tableInfo.frozen);
};

const _getTableInfo = async () => {
  const productInfo = await initGroupProuct();
  if (productInfo.value === 'refrigerator') {
    typeTable = constants.SOD_REFRIGERATOR_TABLE_INFO;
    return;
  }
  typeTable = constants.SOD_VACUUM_TABLE_INFO;
};

export const getTableInfo = async (tableId) => {
  await _getTableInfo();

  switch (tableId) {
    case constants.COL_SEVERITY_LANG[0]:
    case constants.COL_RESULT_SEVERITY_LANG[0]:
      return {
        type: prop.SOD_SEVERITY_TABLE,
        columns: typeTable[prop.SOD_SEVERITY_TABLE].cols,
        frozen: 4,
        tableElId: 'severityTable',
      };
    case constants.COL_OCCURENCE_LANG[0]:
    case constants.COL_RESULT_OCCURENCE_LANG[0]:
      return {
        type: prop.SOD_OCCURENCE_TABLE,
        columns: typeTable[prop.SOD_OCCURENCE_TABLE].cols,
        frozen: 4,
        tableElId: 'occurenceTable',
      };
    default:
      return {
        type: prop.SOD_DETECTION_TABLE,
        columns: typeTable[prop.SOD_DETECTION_TABLE].cols,
        frozen: 3,
        tableElId: 'detectionTable',
      };
  }
};

const _getColumnWidth = (tableId) => {
  if(typeTable === constants.SOD_VACUUM_TABLE_INFO){
    if (tableId === constants.COL_SEVERITY_LANG[0]) {
      return [70, 250, 1100];
    } else if (tableId === constants.COL_OCCURENCE_LANG[0]) {
      return [70, 1000, 350];
    } else {
      return [70, 280, 850, 270];
    }
  }
  if (tableId === constants.COL_SEVERITY_LANG[0]) {
    return [70, 240, 210, 830];
  } else if (tableId === constants.COL_OCCURENCE_LANG[0]) {
    return [70, 250, 1100];
  } else {
    return [70, 280, 870, 250];
  }
};

const _getColumns = (columns, widthArray) => {
  const gridColumns = columns.map((column, index) => {
    const width = widthArray[index];
    return _getLangColumn(column, width);
  });
  return gridColumns;
};

const _getLangColumn = (column, width) => {
  return {
    title: column[0],
    name: column[langIndex],
    width: width,
  };
};

export default {
  onMount,
};
