import Excel from "exceljs";
import appCtxService from "js/appCtxService";

import * as prop from "js/constants/fmeaProperty";
import * as constants from "js/constants/fmeaConstants";
import * as datas from "js/dfmeaExcelServiceDatas";
import { removeTagInStr, getLangIndex } from "js/utils/fmeaCommonUtils";
import { makeColumnCells } from "js/dfmeaExcelColumnService";

export const MAX_COLUMN_COUNT = 28;
let workbook;
let worksheet;
let rowIndex = 5;
let langIndex;
const IS_IMAGE = "src=";
const ESCAPE = "\r\n";
const P_STYLE_TAG =
  '<p style="font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; font-size: 15px;">';

const exportExcel = async (ctx, data) => {
  try {
    langIndex = getLangIndex();
    const fmea = ctx[constants.FMEA_SELECT];
    const fmeaName = fmea.props[prop.OBJECT_NAME].dbValues[0];

    workbook = new Excel.Workbook();
    workbook.addWorksheet("DFMEA");
    worksheet = workbook.getWorksheet(1);

    makeColumnCells(worksheet);

    _addRowData(ctx);

    _setAllContentCellStyle();

    _setMergeFirstValues();

    _downloadExcel(fmeaName);
  } catch (error) {
    console.error(error);
  } finally {
    rowIndex = 5;
  }
};

let objDataArray = [];
let mergeStartIndexArray = [];
// 행 데이터 추가
const _addRowData = (ctx) => {
  const tableList = ctx[constants.FMEA_TABLE_LIST];
  for (let index = 0; index < tableList.length; index++) {
    const startRowIndex = rowIndex;
    const tableRow = tableList[index];
    const objDatas = _makeDataByRow(tableRow, index);
    objDataArray.push(objDatas);

    _setValueRow(objDatas, index);
    _mergeCells(startRowIndex, rowIndex);
    mergeStartIndexArray.push(startRowIndex);
  }
};

// 행 데이터 추가2
const _setMergeFirstValues = () => {
  let cnt = 0;
  for (const mergeStartIndex of mergeStartIndexArray) {
    const values = _getMergeFirstValues(objDataArray[cnt++]);
    worksheet.getRow(mergeStartIndex).values = ["", ...values];
    _setCellStyle(mergeStartIndex);
  }
};

const _getMergeFirstValues = (data) => {
  let result = [];
  for (const column of datas.COLUMNS) {
    const key = column.key;
    const originKey = key + "_origin";
    if (data[originKey]) {
      result.push(data[originKey]);
    } else {
      const value = test1(data[key]);
      result.push(value);
    }
  }
  return result;
};

const test1 = (value) => {
  if (!value) {
    return "";
  }
  if (Array.isArray(value)) {
    return test2(value[0]);
  }

  return test2(value);
};

const test2 = (value) => {
  if (!value) {
    return "";
  }
  if (Number.isInteger(value)) {
    return value;
  }
  if (!value.includes(IS_IMAGE)) {
    return value;
  }
  return "";
};

// 시트의 row에 set values 후 row의 높이 값 조정
const _setValueRow = (data, tableIndex) => {
  const arrayDataLength = _checkArrayData(data);
  for (let index = 0; index < arrayDataLength; index++) {
    const values = _getValues(data, index, tableIndex);
    worksheet.getRow(rowIndex).values = values;
    _setRowHeight(values);
    rowIndex += 1;
  }
};

// Object(string,array)를 한 줄 배열 형태로 만들어 반환
const _getValues = (data, index, tableIndex) => {
  let result = [];
  for (const column of datas.COLUMNS) {
    const key = column.key;
    const dataValues = data[key];
    const value = _getDataValue(dataValues, index, tableIndex, key);
    result.push(value);
  }

  return ["", ...result];
};

// 로우 높이값 조정
const _setRowHeight = (values) => {
  const rowHeight = _getMaxRowHeight(values);
  if (!rowHeight) {
    return;
  }
  worksheet.getRow(rowIndex).height = _getCalRowCnt(rowHeight);
};

// 실제로 한줄인 row들을 합침
const _mergeCells = (startRowIndex) => {
  if (startRowIndex === rowIndex) {
    return;
  }
  for (let i = 1; i <= 28; i++) {
    worksheet.mergeCells(startRowIndex, i, rowIndex - 1, i);
  }
};

// 로우의 cell값 중 가장 많은 \r\n을 가진 cell의 \r\n 개수 반환
const _getMaxRowHeight = (values) => {
  let maxLenght = 0;
  for (let index = 0; index < 27; index++) {
    const value = values[index];
    if (!value || Number.isInteger(value)) {
      continue;
    }
    if (value.includes(IS_IMAGE)) {
      return;
    }
    if (maxLenght < value.length) {
      const count = _countRN(value);
      if (maxLenght < count) {
        maxLenght = count;
      }
    }
  }

  return maxLenght;
};

const _getDataValue = (dataValues, index, tableIndex, key) => {
  if (!dataValues) {
    return "";
  }
  if (index > 0 && !Array.isArray(dataValues)) {
    return dataValues;
  }
  if (!dataValues[index]) {
    return "";
  }
  if (Number.isInteger(dataValues[index])) {
    return dataValues[index];
  }
  if (!dataValues[index].includes(IS_IMAGE)) {
    return dataValues[index];
  }
  if (dataValues[index].includes(IS_IMAGE)) {
    _addImage(tableIndex, dataValues[index], key);
  }

  return "";
};

const _addImage = (tableIndex, imageDataValue, key) => {
  const grid = appCtxService.ctx[constants.FMEA_IMAGE_GRID];
  const columnIndex = _getImageColumnIndex(key);
  const column = datas.EXCEL_IMAGE_COLUMNS[columnIndex][langIndex];
  const el = grid.getElement(tableIndex, column);
  const imgTags = el.getElementsByTagName("img");
  if (!imgTags || imgTags.length === 0) {
    return;
  }

  const imgTag = _getImageTag(imgTags, imageDataValue);
  const width = imgTag.offsetWidth;
  const height = imgTag.offsetHeight;
  const imageId = workbook.addImage({
    base64: imgTag.src,
    extension: "png",
  });

  worksheet.getRow(rowIndex).height = height;

  const imageRowIndex = rowIndex - 1;
  const colIndex = columnIndex + 2 + 0.1;
  worksheet.addImage(imageId, {
    tl: { col: colIndex, row: imageRowIndex + 0.1 },
    ext: { width: width, height: height },
  });
};

const _getImageTag = (imgTags, imageDataValue) => {
  for (const imgTag of imgTags) {
    const test = imageDataValue.split(` ${IS_IMAGE}`)[1];
    if (imgTag.src === test.split('"')[1]) {
      return imgTag;
    }
  }
};

const _getImageColumnIndex = (key) => {
  for (let index = 0; index < datas.EXCEL_IMAGE_COLUMNS.length; index++) {
    const col = datas.EXCEL_IMAGE_COLUMNS[index];
    if (col[0] === key) {
      return index;
    }
  }
};

const _checkArrayData = (data) => {
  let result = 0;
  for (const column of datas.COLUMNS) {
    const key = column.key;
    if (!_cellCheck(datas.INSERT_CELLS, key)) {
      continue;
    }
    const value = data[key];
    if (!value) {
      continue;
    }
    const dataLength = data[key].length;
    if (result < dataLength) {
      result = dataLength;
    }
  }

  return result;
};

const _countRN = (value) => {
  let count = 0;
  let searchChar = ESCAPE;
  let pos = value.indexOf(searchChar);
  while (pos !== -1) {
    count++;
    pos = value.indexOf(searchChar, pos + 1);
  }

  return count;
};

const _getCalRowCnt = (maxLenght) => {
  const ONE_LINE_HEIGHT = 13; // 한줄

  return ONE_LINE_HEIGHT * (maxLenght + 1);
};

const _setAllContentCellStyle = () => {
  for (let i = 5; i < rowIndex; i++) {
    const index = i;
    _setCellStyle(index);
  }
};
const _setCellStyle = (rowIndex) => {
  for (let j = 2; j <= MAX_COLUMN_COUNT; j++) {
    const cell = worksheet.getRow(rowIndex).getCell(j);
    cell.font = datas.COL_FONT_STYLE;
    cell.border = datas.BORDER_STYLE;
    cell.alignment = { vertical: "top", wrapText: true };
  }
};

// 이미지 포함된 경우 one cell에 넣어야 하기 때문에 데이터 자름
// return { l2_precautions_action : ["..text..value..", " src="image/path.."]}
const _makeDataByRow = (tableRow, tableIndex) => {
  let data = { className: "" };
  for (const column of datas.COLUMNS) {
    const key = column.key;
    if (!_cellCheck(datas.INSERT_CELLS, key)) {
      continue;
    }
    if (tableRow[key]) {
      const targetRowValue = tableRow[key].value;
      // SOD 관련 컬럼인 경우(Number)
      if (_cellCheck(datas.SOD_CELLS, key)) {
        const value = targetRowValue ? Number.parseInt(targetRowValue) : "";
        data[key] = [value];
      } else {
        const value = _getValueByReplaceTag(targetRowValue, key, tableIndex);
        data[key] = value;
        const firstValue = _getFirstValue(
          targetRowValue,
          value,
          tableIndex,
          key
        );
        if (firstValue) {
          const originKey = key + "_origin";
          data[originKey] = firstValue;
        }
      }
    }
  }
  return data;
};

// 전체 text와 img 분리.
// 0번째에 text 일부 들어있음
const _getValueByReplaceTag = (value, columnKey, tableIndex) => {
  let result = [];
  const splitResult = value.split("<img");
  for (let index = 0; index < splitResult.length; index++) {
    const text = splitResult[index];
    if (text.includes(IS_IMAGE)) {
      const text1 = text.substring(0, text.indexOf(">"));
      result.push(text1);
      const text2 = text.substring(text.indexOf(">") + 1, text.length);
      if (removeTagInStr(text2).length > 0) {
        result.push(_getValueByReplaceTag2(text2));
      }
      continue;
    }
    result.push(_getValueByReplaceTag2(text)); // 일반 text는 태그 삭제
  }
  return result;
};

// 첫번째 cell에 모든 내용 넣어야 함
// img 이전 \r\n
const _getFirstValue = (value, splitResult, tableIndex, columnKey) => {
  if (splitResult.length <= 1) {
    return;
  }
  // text 하나면 return;
  const onlyTxtValues = splitResult.filter(
    (s) => !s.includes("src=") && s !== ""
  );
  if (onlyTxtValues.length === 1) {
    return;
  }

  let result = "";

  for (let index = 0; index < splitResult.length; index++) {
    const splitValue = splitResult[index];
    if (!splitValue || Number.isInteger(value)) {
      continue;
    }

    if (splitValue.includes("src=")) {
      const imgTag = _getImgTag(columnKey, tableIndex, splitValue);
      if (!imgTag) {
        continue;
      }
      const imgTagHeight = imgTag.offsetHeight;
      let previousImgValue = splitResult[index - 1]; // 이미지 전 텍스트
      if (!previousImgValue) {
        continue;
      }
      const match = previousImgValue.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/gi);
      if (!match) {
        continue;
      }
      const previousTextEscapeIndex = previousImgValue.lastIndexOf(
        match[match.length - 1]
      );
      const previousTextSubstring = previousImgValue.substring(
        previousTextEscapeIndex,
        previousImgValue.length
      );
      const calRNCnt = Math.ceil(imgTagHeight / 14);
      const rnNum = _countRN(previousTextSubstring);
      for (let index = rnNum; index <= calRNCnt; index++) {
        previousImgValue = previousImgValue += ESCAPE;
      }
      result += previousImgValue;
    }
  }
  return result;
};

const _getImgTag = (columnKey, tableIndex, splitValue) => {
  const grid = appCtxService.ctx[constants.FMEA_IMAGE_GRID];
  const columnIndex = _getImageColumnIndex(columnKey);
  const column = datas.EXCEL_IMAGE_COLUMNS[columnIndex][1];
  const el = grid.getElement(tableIndex, column);
  const imgTags = el.getElementsByTagName("img");
  if (!imgTags || imgTags.length === 0 || imgTags.length === 1) {
    return;
  }
  for (const imgTag of imgTags) {
    if (splitValue.includes(imgTag.src)) {
      return imgTag;
    }
  }
};

const _getValueByReplaceTag2 = (value) => {
  let result;
  result = value.replace(/<img[^>]+>/gi, "");

  // 1. <p>태그는 \r\n으로 치환
  result = result.replace("<p>", "");
  result = result.replaceAll("<p>", ESCAPE);
  result = result.replaceAll(P_STYLE_TAG, ESCAPE);
  result = result.replaceAll("&nbsp;", "");

  return removeTagInStr(result);
};

// Image 포함 가능 cell인지, sod 관련 cell 인지 check
const _cellCheck = (checkCells, key) => {
  for (const checkCell of checkCells) {
    if (key === checkCell) {
      return true;
    }
  }
  return false;
};

// 로컬 pc에 엑셀 다운로드
const _downloadExcel = (fmeaName) => {
  const XLSX = "xlsx";
  workbook.xlsx.writeBuffer().then((data) => {
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fmeaName}.${XLSX}`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  });
};

export default {
  exportExcel,
};
