import * as datas from "js/dfmeaExcelServiceDatas";
import { MAX_COLUMN_COUNT } from "js/dfmeaExcelService";

export const makeColumnCells = (sheet) => {
  try {
    _makeFirstRow(sheet);
    _makeGroupCols(sheet);
    const columns = _makeColumns(sheet);
    sheet.columns = [{ key: "A", width: 1 }, ...columns];
    _makeColsDesc(sheet);
  } catch (error) {
    console.error(error);
  }
};

const _makeFirstRow = (sheet) => {
  datas.GROUPS.map((data) => {
    if (data.merge) {
      sheet.mergeCells(data.cell, data.mergeCell);
    }
    const cell = sheet.getCell(data.cell);
    cell.value = data.value
      ? data.value
      : {
          richText: data.richText,
        };
    _setColCellStyle(cell, data);
  });
};

const _makeGroupCols = (sheet) => {
  datas.COL_GROUPS.map((data) => {
    sheet.mergeCells(data.cell, data.mergeCell);
    const cell = sheet.getCell(data.cell);
    cell.value = data.value;
    _setColCellStyle(cell, data);
  });
};

const _makeColumns = (sheet) => {
  datas.COLUMNS.map((data) => {
    const cellStart = `${data.cell}2`;
    if (_checkMergeCells(data)) {
      sheet.mergeCells(cellStart, `${data.cell}3`);
    }
    const cell = sheet.getCell(`${data.cell}3`);
    cell.value = data.header;
    _setColCellStyle(cell, data);
  });
  return datas.COLUMNS.map((data) => {
    return { key: data.key, width: data.width };
  });
};

const _checkMergeCells = (data) => {
  if (data.nonmerge) {
    return false;
  }
  return true;
};

const _makeColsDesc = (sheet) => {
  const descRowIndex = 4;
  for (const data of datas.COLUMNS_DESC) {
    if (data.merge) {
      sheet.mergeCells(`${data.cell}${descRowIndex}`, `${data.mergeCell}${descRowIndex}`);
    }
    const cell = sheet.getCell(`${data.cell}4`);
    cell.value = data.value
      ? data.value
      : {
          richText: data.richText,
        };
    cell.font = {
      ...datas.COL_FONT_STYLE,
      color: {
        argb: datas.COLOR_COL_DESC,
      },
    };
  }

  for (let j = 2; j <= MAX_COLUMN_COUNT; j++) {
    const cell = sheet.getRow(descRowIndex).getCell(j);
    cell.border = datas.BORDER_STYLE;
    cell.alignment = { vertical: "top", wrapText: true };
  }
};

const _setColCellStyle = (cell, data) => {
  cell.font = { ...datas.COL_FONT_STYLE, bold: true };
  cell.border = datas.BORDER_STYLE;
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: data.color ? data.color : "FF99CCFF" },
    bgColor: { argb: "FF0000FF" },
  };
  cell.alignment = { ...datas.ALIGNMENT_CENTER, wrapText: true };
};
