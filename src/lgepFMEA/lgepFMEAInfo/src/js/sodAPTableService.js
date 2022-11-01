import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import appCtxService from 'js/appCtxService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { getLangIndex, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import { loadObjectByPolicy, createObject } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

import lgepCommonUtils from "js/utils/lgepCommonUtils";
import SoaService from 'soa/kernel/soaService'
import queryUtil from 'js/utils/lgepQueryUtils';

import popupService from 'js/popupService';

let langIndex;
let grid;
let tableInfo;

const onMount = async (ctx) => {

  langIndex = getLangIndex();



  const sod = await loadObjectByPolicy(ctx.fmea_set_vmo[0].uid, prop.TYPE_SOD, [
    prop.SOD_AP_TABLE,
  ]);

  await _getTableInfo();

  const apTables = await _makeTableRow(sod, prop.SOD_AP_TABLE);
  let apTableRev = apTables.reverse();
  // console.log("apTables", apTableRev);


  const widthArray = [250, 150, 300, 150, 200, 150, 200, 300];
  const columns = _getColumns(tableInfo[prop.SOD_AP_TABLE].cols, widthArray);

  // const rowData = new Array();
  // for (let i = 1; i <= columns.length; i++) {
  //   var list = new Object();
  //   for (let data2 of columns) {
  //     list[data2.name] = "Test" + i;
  //   }
  //   rowData.push(list);
  // }
  // console.log(rowData);

  grid = new Grid({
    el: document.getElementById('apToastTable'),
    data: apTableRev,
    columns: columns
  });

  events();
  // tableResize();

};

const events = () => {
  grid.on("editingFinish", async (e) => {
    console.log(e);
  });
};

const _getTableInfo = async () => {
  tableInfo = constants.SOD_VACUUM_TABLE_INFO;
};

const _makeTableRow = async (sod, tableName) => {
  const props = tableInfo[tableName].cols.map(
    (col) => col[0]
  );
  const objects = await _loadSodTables(sod, tableName, props);
  try {
    let getPropertiesParam = {
        objects: objects,
        attributes: ["l2_severity_s", "l2_severity_e", "l2_occurence_s", "l2_occurence_e", "l2_detection_s", "l2_detection_e"
        , "l2_effectivity", "l2_potential_failure_cause", "l2_detection_capability", "l2_ap", "l2_opinion"]
    };
    await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

  } catch (err) {
      //console.log(err);
  }

  return _getTableDatas(objects, tableName, props);
};

const _loadSodTables = async (sod, tableName, props) => {
  const tables = await Promise.all(
    sod.props[tableName].dbValues.map(async (uid) => {
      const tableRow = await loadObjectByPolicy(uid, prop.TYPE_SOD_ROW, props);
      return tableRow;
    })
  );
  return tables;
};

const _getTableDatas = async (objects, tableName, props) => {
  const columns = tableInfo[tableName].cols;
  // console.log("objects", objects);
  // await lgepObjectUtils.deleteObjects(objects);
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
      [columns[index][langIndex]]: !tableRow.props[propName] ? tableRow.props["l2_" + propName + "_e"].dbValues[0] == 1 ? "1" : (tableRow.props["l2_" + propName + "_s"].dbValues[0] + "-" + tableRow.props["l2_" + propName + "_e"].dbValues[0]) : tableRow.props[propName].dbValues[0],
    };
  }
  return row;
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
    // editor: {
    //   type: "text",
    // }
    rowSpan: column[0] == "l2_ap" || column[0] == "l2_detection_capability" ? false : true
  };
};

const tableResize = async () => {
  await lgepCommonUtils.delay(1000);
  let getTable = document.querySelectorAll(
    "#occurenceTable .tui-grid-rside-area .tui-grid-body-area .tui-grid-body-container"
  );
  console.log("getTable", getTable[0].style.height);
  let width = getTable[0].style.width;
  // let height = getTable[0].style.height;

  const regex = /[^0-9]/g;
  width = width.replace(regex, "");
  let height = 0;

  for (let tr of getTable) {
    let str = tr.style.height;
    const result = str.replace(regex, "");

    height += parseInt(result);
  }
  grid.setBodyHeight(height + 40);
  grid.setWidth(width + 25);
};

// const makeRow = async (ctx) => {

//   popupService.show({
//     declView: "makeRow",
//     locals: {
//       caption: "AP Table Row 만들기"
//     },
//     options: {
//       clickOutsideToClose: false,
//       isModal: false,
//       width: "800",
//       height: "1000"
//     },
//     outputData: {
//       popupId: "id"
//     }
//   });

// };

// const doit = async (ctx, data) => {

//   const workspaceObject = await lgepObjectUtils.getObject(ctx.fmea_set_vmo[0].uid);
//   const name = workspaceObject.props.object_name.dbValues[0];
//   console.log("wobj", workspaceObject);

//   try {

//     await setChildTables(workspaceObject, name, prop.SOD_AP_TABLE, data);

//   } catch (err) {
//     console.log(err);
//   }

// };

const setChildTables = async (workspaceObject, name, type, data) => {
  const rows = await makeTableRows(name, data);
  await lgepObjectUtils.addChildren(workspaceObject, rows, type);
};

const makeTableRows = async (name, data) => {

  let rows = [];

  console.log(data.box1.dbValues[0]);
  console.log(data.box2.dbValues[0]);
  console.log(data.box3.dbValues[0]);
  console.log(data.box4.dbValues[0]);
  console.log(data.box5.dbValues[0]);
  console.log(data.box6.dbValues[0]);
  console.log(data.box7.dbValues[0]);
  console.log(data.box8.dbValues[0]);
  console.log(data.box9.dbValues[0]);
  console.log(data.box10.dbValues[0]);
  console.log(data.box11.dbValues[0]);

  let props = {
    [prop.SOD_EFFECTIVITY]: [data.box1.dbValues[0]],
    [prop.SOD_SEVERITY_S]: [data.box2.dbValues[0]],
    [prop.SOD_SEVERITY_E]: [data.box3.dbValues[0]],
    [prop.SOD_POTENTIAL_FAILURE_CAUSE]: [data.box4.dbValues[0]],
    [prop.SOD_OCCURENCE_S]: [data.box5.dbValues[0]],
    [prop.SOD_OCCURENCE_E]: [data.box6.dbValues[0]],
    [prop.SOD_DETECTION_CAPABILITY]: [data.box7.dbValues[0]],
    [prop.SOD_DETECTION_S]: [data.box8.dbValues[0]],
    [prop.SOD_DETECTION_E]: [data.box9.dbValues[0]],
    [prop.SOD_AP]: [data.box10.dbValues[0]],
  }

  const rowUid = await lgepObjectUtils.createRelateAndSubmitObjects2(prop.TYPE_AP_ROW, props);
  console.log("rowUid", rowUid);
  const row = await lgepObjectUtils.getObject(rowUid.ServiceData.created[0]);
  console.log("row", row);
  rows.push(row);

  return rows;
};

export default {
  onMount,
  // makeRow,
  // doit
};