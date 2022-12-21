import Excel from 'exceljs';
import appCtxService from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import dmSvc from 'soa/dataManagementService';
import cdmSvc from 'soa/kernel/clientDataModel';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import common, { delay } from 'js/utils/lgepCommonUtils';
import exportUtils from 'js/utils/lgepExcelExportUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import message from 'js/utils/lgepMessagingUtils';
import * as datas from 'js/L2_interactionExcelServiceData';
import $ from 'jquery';
import { TOP, getInteractionTable } from 'js/L2_ChecklistInteractionUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

let workbook;
let worksheet;
let compareData;
let tableData;
const startRow = 12;
const startCell = 2;
let endRow = 12;
let endCell = 2;
const FONT = 'LG스마트체2.0 Regular';
const FONT_STYLE = { name: FONT, size: 11 };
const BORDER_STYLE = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

export async function excelInteraction(workbook) {
  let ctx = appCtxService.ctx;
  workbook.addWorksheet('interaction');
  worksheet = workbook.getWorksheet('interaction');
  worksheet.views = [
    {
      showGridLines: false,
    },
  ];
  addExplainRow();

  await getValues(ctx);

  addHeader();

  addValues();

  setGridBorder();

  mergeFirst();
}

const addInteraction = async (data, ctx) => {
  for (const editInfo of ctx.checklist.standardBOM.editNodes) {
    let values = Array.values(editInfo);
    console.log('values', { values });
  }
  // let param = {
  //   uids: uids,
  // };
  // try {
  //   await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param);
  //   let objs = lgepObjectUtils.getObjects(uids);
  //   console.log(objs);
  //   lgepObjectUtils.deleteObjects(objs).then(() => {});
  // } catch (err) {
  //   console.log(err);
  // }

  // ctx = appCtxService.ctx;
  // workbook = new Excel.Workbook();
  // workbook.addWorksheet('interaction');
  // worksheet = workbook.getWorksheet('interaction');
  // worksheet.views = [
  //   {
  //     showGridLines: false,
  //   },
  // ];
  // addExplainRow();

  // await getValues(ctx);

  // addHeader();

  // addValues();

  // setGridBorder();

  // mergeFirst();

  // ctx.testWorkSheet = worksheet;

  // downloadExcel('test');
};

function addExplainRow() {
  worksheet.getColumn(1).width = 2;
  for (let i = datas.cellRange1['start']; i <= datas.cellRange1['end']; i++) {
    worksheet.getColumn(i).width = datas.cellWidth;
  }
  for (let i = datas.rowRange1['start']; i <= datas.rowRange1['end']; i++) {
    worksheet.getRow(i).height = 30;
  }
  let explainCell = worksheet.getCell(datas.explainCell);
  explainCell.value = datas.explain;
  explainCell.font = FONT_STYLE;
  explainCell.alignment = { vertical: 'top', wrapText: true };
  //
  worksheet.mergeCells(`${datas.explainCell}:${datas.mergeExplainCell}`);
  let mergeCell = worksheet.getCell(`${datas.explainCell}:${datas.mergeExplainCell}`);
  mergeCell.border = BORDER_STYLE;
  mergeCell.fill = datas.textBg;
  mergeCell.font = FONT_STYLE;

  for (let val of datas.divValues) {
    let Cell = worksheet.getCell(val['cell']);
    if (val['val'] == 'color') {
      Cell.fill = val['color'];
    } else {
      Cell.value = val['val'];
      Cell.font = FONT_STYLE;
    }
    if (val['mergeCell']) {
      Cell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.mergeCells(`${val.cell}:${val.mergeCell}`);
      let mergeCell2 = worksheet.getCell(`${val.cell}:${val.mergeCell}`);
      mergeCell2.border = BORDER_STYLE;
      mergeCell2.fill = datas.textBg;
    } else {
      Cell.alignment = { vertical: 'middle' };
    }
    if (val['border']) {
      Cell.border = val['border'];
    }
  }
}

async function getValues(ctx) {
  let structureInfo = ctx.checklist.interaction_structure_info;
  const topObject = structureInfo[TOP].getOriginalObject();
  const INTERACTION_TABLES = await getInteractionTable(topObject);
  let idData = {};
  let compData = [];
  let arrayData = [];
  for (let assy of structureInfo.parentAssy) {
    // let lowerValue = {};
    // lowerValue['upperAssy'] = assy.lowerAssy;
    // lowerValue['lowerAssy'] = assy.single;
    // idData[assy.icon] = assy.single;
    // arrayData.push(lowerValue);
    let lowers = assy.getChildren();
    if (Array.isArray(lowers)) {
      for (let lower of lowers) {
        let lowerValue = {};
        lowerValue['upperAssy'] = assy.name;
        lowerValue['lowerAssy'] = lower.name;
        idData[lower.icon] = assy.name;
        arrayData.push(lowerValue);
      }
    } else {
      let lowerValue = {};
      lowerValue['upperAssy'] = assy.name;
      lowerValue['lowerAssy'] = lowers.name;
      idData[lowers.icon] = assy.name;
      arrayData.push(lowerValue);
    }
  }
  for (let Obj of INTERACTION_TABLES) {
    let onlyData = {};
    onlyData['val1'] = idData[Obj.props.l2_primary.dbValues[0]];
    onlyData['val2'] = idData[Obj.props.l2_secondary.dbValues[0]];
    onlyData['grade'] = Obj.props.l2_grade.dbValues[0];
    compData.push(onlyData);
  }
  arrayData.sort(function (a, b) {
    if (a.upperAssy < b.upperAssy) {
      return -1;
    } else if (a.upperAssy > b.upperAssy) {
      return 1;
    } else {
      return 0;
    }
  });
  // console.log('comp', compData);
  // console.log('array', arrayData);

  compareData = compData;
  tableData = arrayData;
}

function addHeader() {
  worksheet.getRow(startRow).getCell(2).value = datas.header[0];
  worksheet.getRow(startRow).getCell(3).value = datas.header[1];
  worksheet.getColumn(2).key = 'upperAssy';
  worksheet.getColumn(3).key = 'lowerAssy';
  let i = 4;
  for (let data of tableData) {
    let Cell1 = worksheet.getRow(startRow).getCell(i);
    let Cell2 = worksheet.getRow(startRow + 1).getCell(i);
    let Column = worksheet.getColumn(i);
    Column.key = data['lowerAssy'];
    Column.width = datas.cellWidth;
    Cell1.value = data['upperAssy'];
    Cell2.value = data['lowerAssy'];
    Cell1.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    Cell2.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    // Cell.header = data['lowerAssy'];
    i++;
  }
}
function addValues() {
  let begin = startRow + 2;
  for (let data of tableData) {
    let row = worksheet.getRow(begin);
    row.values = data;
    begin++;
  }
  let end = begin;
  endCell = 3 + tableData.length;
  endRow = begin;

  for (let i = startRow + 2; i <= end; i++) {
    for (let j = 4; j < 4 + tableData.length; j++) {
      let Cell = worksheet.getRow(i).getCell(j);
      let key = worksheet.getColumn(j).key;
      let lower = worksheet.getRow(i).getCell(3).value;
      if (key == lower) {
        Cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '5f5f5f' },
          bgColor: { argb: '5f5f5f' },
        };
      } else {
        for (let compare of compareData) {
          if (compare['val2'] == key && compare['val1'] == lower) {
            Cell.value = compare['grade'];
            Cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: datas.color[compare['grade']] },
              bgColor: { argb: datas.color[compare['grade']] },
            };
            Cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          }
        }
      }
    }
  }
}

function setGridBorder() {
  for (let i = startRow; i < endRow; i++) {
    worksheet.getRow(i).height = 30;
    for (let j = startCell; j <= endCell; j++) {
      let checkCell = worksheet.getRow(i).getCell(j);
      checkCell.border = BORDER_STYLE;
      checkCell.font = FONT_STYLE;
      if (!checkCell.alignment) {
        checkCell.alignment = { vertical: 'middle', wrapText: true };
      }
    }
  }
}

function mergeFirst() {
  let mergeRow = {};
  let firstRow = worksheet.getRow(startRow);
  for (let i = startCell + 2; i <= endCell; i++) {
    let mergeData = {};
    let Cell = firstRow.getCell(i);
    if (i > 12) {
      Cell.width = datas.cellWidth;
    }
    if (mergeRow[Cell.value]) {
      mergeRow[Cell.value]['mergeCell'] = Cell.address;
    } else {
      mergeData['cell'] = Cell.address;
      mergeRow[Cell.value] = mergeData;
    }
  }

  let mergeCell = {};
  for (let i = startRow + 2; i < endRow; i++) {
    let Cell = worksheet.getRow(i).getCell(2);
    let mergeData = {};
    if (mergeCell[Cell.value]) {
      mergeCell[Cell.value]['mergeCell'] = Cell.address;
    } else {
      mergeData['cell'] = Cell.address;
      mergeCell[Cell.value] = mergeData;
    }
  }

  for (let arr of datas.valueHeaderMerge) {
    let front = arr.cell;
    let end = arr.mergeCell;
    worksheet.mergeCells(`${front}:${end}`);
    let mergeCell = worksheet.getCell(`${front}:${end}`);
    mergeCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }

  let rowKey = Object.keys(mergeRow);
  let cellKey = Object.keys(mergeCell);

  for (let row of rowKey) {
    let front = mergeRow[row].cell;
    let end = mergeRow[row].mergeCell;
    if (end) {
      worksheet.mergeCells(`${front}:${end}`);
    }
  }
  for (let cell of cellKey) {
    let front = mergeCell[cell].cell;
    let end = mergeCell[cell].mergeCell;
    if (end) {
      worksheet.mergeCells(`${front}:${end}`);
    }
  }
  // worksheet.getCell();
}

const downloadExcel = (fmeaName) => {
  const XLSX = 'xlsx';
  workbook.xlsx.writeBuffer().then((data) => {
    const blob = new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fmeaName}.${XLSX}`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
};

export default {
  addInteraction,
};
