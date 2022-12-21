import Excel from 'exceljs';
import appCtxService from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import dmSvc from 'soa/dataManagementService';
import cdmSvc from 'soa/kernel/clientDataModel';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import common from 'js/utils/lgepCommonUtils';
import { excelInteraction } from 'js/L2_interactionExcelService';

const columnError = lgepLocalizationUtils.getLocalizedText('lgepCommonMessages', 'columnError');
const templateError = lgepLocalizationUtils.getLocalizedText('lgepCommonMessages', 'templateLoadError');

let workbook;
let worksheet;
let startRowValue = 0;
let rowIndex = 0;
let vaildColumnIndex = 1;
let columnKey = [];
let columnSequence = {};
let maxColumnNum = 0;
let headerRow = 1;
let header;
let gridValue;
const FONT = 'LG스마트체2.0 Regular';
const FONT_STYLE = { name: FONT, size: 10 };
const BORDER_STYLE = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};
const BOTTOM_WHITE = {
  left: { style: 'thin', color: { argb: '000000' } },
  bottom: { style: 'thin', color: { argb: 'FFFFFF' } },
  right: { style: 'thin', color: { argb: '000000' } },
};
const BOTTOM_BLACK = {
  left: { style: 'thin', color: { argb: '000000' } },
  bottom: { style: 'thin', color: { argb: '000000' } },
  right: { style: 'thin', color: { argb: '000000' } },
};
const IS_IMAGE = 'src=';
const ESCAPE = '\r\n';
const P_STYLE_TAG = '<p style="font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; font-size: 15px;">';
let objDataArray = [];
let mergeStartIndexArray = [];

/**
 *
 * @param {Object} grid toastGrid의 grid항목
 * @param {String} templatesUid 템플릿 데이터 셋 Uid
 * @param {String} fileName 만들 파일 이름
 * @param {Number} templateNumber 양식 번호
 */

export async function exportExcel(grid, templatesUid, fileName, templateNumber) {
  try {
    if (!templateNumber) {
      templateNumber = 1;
    }
    //엑셀 workSheet 생성
    let checkUid = await loadWorkBook(grid, templatesUid, templateNumber);
    templatesUid = checkUid;

    //toastGrid의 헤더 확인
    header = toastGridTableStyle(grid);

    //toastGrid의 헤더와 excel파일 있을 시 헤더를 비교하여 column key값 설정
    createColumns(grid, templatesUid, header);

    gridValue = grid;

    //자료 입력
    _addRowData(grid);

    //자료가 입력된 부분에 테두리 설정
    _setAllContentCellStyle();

    //이미지와 텍스트가 섞여있는 값들을 재배열
    _setMergeFirstValues();

    //양식이 없을 시 헤더의 스타일 설정
    if (!templatesUid) {
      setHeaderStyle();
    }
    if (!fileName) {
      fileName = 'ExcelFile';
    }

    worksheet.views = [{ state: 'frozen', ySplit: headerRow }];

    await excelInteraction(workbook);

    appCtxService.ctx.excel = worksheet;

    //엑셀 파일 다운로드
    downloadExcel(fileName);
  } catch (err) {
    console.log(err);
  }
}

function inputValues(grid, rowIndex) {
  let tableList2 = grid.dataManager.getOriginData();
  console.log(tableList2);
  let excelValue = [];
  for (let td of tableList2) {
    let lineValue = {};
    Object.keys(td).forEach((key) => {
      if (columnSequence[key]) {
        let val = td[key];
        lineValue[key] = String(val);
      }
    });
    excelValue.push(lineValue);
    // console.log(lineValue);
    worksheet.addRow(lineValue, rowIndex);
    for (let i = 1; i <= maxColumnNum; i++) {
      let cell = worksheet.getRow(rowIndex).getCell(i);
      cell.border = BORDER_STYLE;
      cell.alignment = { vertical: 'top', wrapText: true };
    }
    rowIndex++;
  }
  // console.log(excelValue);
}

/**
 * 템플릿 값 유무에따라 워크북을 다르게 가져옴
 * @param {Object} gridData
 * @param {String} templatesUid
 * @param {String} templateNumber
 * @returns workbook
 */
async function loadWorkBook(gridData, templatesUid, templateNumber) {
  if (templatesUid) {
    workbook = await loadExcelFile(templatesUid);
    if (workbook) {
      worksheet = workbook.getWorksheet(templateNumber);
      return templatesUid;
    } else {
      workbook = new Excel.Workbook();
      workbook.addWorksheet('sheet1');
      worksheet = workbook.getWorksheet(1);
      return '';
    }
  } else {
    workbook = new Excel.Workbook();
    workbook.addWorksheet('sheet1');
    worksheet = workbook.getWorksheet(1);
    return '';
  }
}

/**
 * 템플릿 값 유무에따라 컬럼생성 혹은 컬럼 키 입력
 * @param {Object} gridData
 * @param {String} templatesUid
 * @param {Object} header
 * @returns workbook
 */
async function createColumns(gridData, templatesUid, header) {
  try {
    if (templatesUid) {
      let tempHeaderRowNum = worksheet._rows.length - 1;
      headerRow = tempHeaderRowNum;
      rowIndex = worksheet._rows.length + 1;
      startRowValue = worksheet._rows.length + 1;
      let tempHeaderRow = worksheet.getRow(tempHeaderRowNum);
      for (let gridColumn of header) {
        let changeHeader = gridColumn.header.toUpperCase();
        changeHeader = changeHeader.replace(' ', '');
      }
      maxColumnNum = tempHeaderRow._cells.length;
      for (let i = 1; i <= tempHeaderRow._cells.length; i++) {
        let cellValue = tempHeaderRow.getCell(Number(i)).value;
        if (cellValue) {
          let cellText = '';
          if (cellValue.richText) {
            for (let rich of cellValue.richText) {
              cellText += rich.text;
            }
          } else {
            cellText = cellValue;
          }
          cellText = cellText.replace('\n', '');
          cellText = cellText.replace(' ', '');
          cellText = cellText.toUpperCase();
          for (let gridColumn of header) {
            let changeHeader = gridColumn.header.toUpperCase();
            changeHeader = changeHeader.replace(' ', '');
            if (cellText == changeHeader) {
              worksheet.getColumn(Number(i)).key = gridColumn.key;
              columnSequence[gridColumn.key] = Number(i);
            }
          }
        } else {
          vaildColumnIndex = i + 1;
        }
      }
    } else {
      worksheet.columns = header;
      maxColumnNum = header.length;
      rowIndex = 2;
    }
  } catch (err) {
    message.show(2, columnError);
  }
}

/**
 * uid 입력시 excel파일의 워크북 가져옴
 * @param {String} uid
 * @returns workbook
 */
async function loadExcelFile(uid) {
  try {
    let videosUid = [uid];
    let returnValue2 = await loadObj(videosUid);
    let videos = Object.values(returnValue2.modelObjects);
    await dmSvc.getProperties(videosUid, ['ref_list']);
    let files = [];
    for (let video of videos) {
      let file = cdmSvc.getObject(video.props.ref_list.dbValues[0]);
      files.push(file);
    }
    let inputParam = {
      files: files,
    };
    let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
    let tickets = serachResult.tickets[1];
    let fileUrl = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(tickets[0]) + '?ticket=' + tickets[0];
    const res = await fetch(fileUrl);
    const arrayBuffer = await res.arrayBuffer();
    const workbook1 = new Excel.Workbook();
    let excelFile = await workbook1.xlsx.load(arrayBuffer);
    return excelFile;
  } catch (err) {
    console.log(err);
    message.show(2, templateError);
    return '';
  }
}

async function loadObj(uid, policy) {
  let param = {
    uids: uid,
  };
  if (policy) {
    let returnValue = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy);
    return returnValue;
  } else {
    let returnValue = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param);
    return returnValue;
  }
}

function toastGridTableStyle(grid) {
  try {
    let toastGridHeader = [];
    let gridColumns = grid.store.column.visibleColumns;
    for (let i in gridColumns) {
      if (gridColumns[i]['hidden'] == false) {
        let column = {
          header: gridColumns[i]['header'],
          key: gridColumns[i]['name'],
          width: gridColumns[i]['baseWidth'] / 8,
        };
        columnKey.push(gridColumns[i]['name']);
        toastGridHeader.push(column);
      }
    }
    return toastGridHeader;
  } catch (err) {
    console.log(err);
  }
}

function setHeaderStyle() {
  let excelColumn = worksheet.getRow(1);
  excelColumn.height = 40;
  for (let i = 1; i <= maxColumnNum; i++) {
    let column = worksheet.getRow(1).getCell(i);
    column.style.font = { name: FONT, size: 11, bold: true };
    column.style.alignment = { vertical: 'middle', horizontal: 'center' };
    column.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'EAEAEA' },
      bgColor: { argb: 'EAEAEA' },
    };
    column.border = BORDER_STYLE;
  }
}

/**
 * 에디터 code의 태그 제거
 * @param {string} value
 * @returns
 */
const removeTagInStr = (value) => {
  let replaceSpace = value.replaceAll('<p>', ' ');
  let nonTagValue = replaceSpace.replaceAll(/[<][^>]*[>]/gi, '');
  // 그 외 예외처리
  let replaceValue = nonTagValue.replaceAll('&nbsp;', ' ');
  return replaceValue;
};

const _addRowData = (grid) => {
  const tableList = grid.store.data.rawData;
  for (let index = 0; index < tableList.length; index++) {
    const startRowIndex = rowIndex;
    const tableRow = tableList[index];
    const objDatas = _makeDataByRow(tableRow, index);
    objDataArray.push(objDatas);

    _setValueRow(objDatas, index);
    _mergeCells(startRowIndex);
    mergeStartIndexArray.push(startRowIndex);
  }
};

const _setValueRow = (data, tableIndex) => {
  const arrayDataLength = _checkArrayData(data);
  for (let index = 0; index < arrayDataLength; index++) {
    const values = _getValues(data, index, tableIndex);
    worksheet.getRow(rowIndex).values = values;
    _setRowHeight(values);
    rowIndex += 1;
  }
};

const _makeDataByRow = (tableRow, tableIndex) => {
  let data = {};
  for (const column of header) {
    const key = column.key;
    if (tableRow[key]) {
      const targetRowValue = tableRow[key];
      const value = _getValueByReplaceTag(targetRowValue, key, tableIndex);
      data[key] = value;
    }
  }
  return data;
};

const _getValueByReplaceTag = (value) => {
  let result = [];
  const splitResult = value.split('<img');
  for (let index = 0; index < splitResult.length; index++) {
    const text = splitResult[index];
    if (text.includes(IS_IMAGE)) {
      const text1 = text.substring(0, text.indexOf('>'));
      result.push(text1);
      const text2 = text.substring(text.indexOf('>') + 1, text.length);
      if (removeTagInStr(text2).length > 0) {
        result.push(_getValueByReplaceTag2(text2));
      }
      continue;
    }
    result.push(_getValueByReplaceTag2(text)); // 일반 text는 태그 삭제
  }
  return result;
};

const _getValueByReplaceTag2 = (value) => {
  let result;
  result = value.replace(/<img[^>]+>/gi, '');

  // 1. <p>태그는 \r\n으로 치환
  result = result.replace('<p>', '');
  result = result.replaceAll('<p>', ESCAPE);
  result = result.replaceAll('</div>', ESCAPE);
  result = result.replaceAll(P_STYLE_TAG, ESCAPE);
  result = result.replaceAll('&nbsp;', '');

  return removeTagInStr(result);
};

const _getValues = (data, index, tableIndex) => {
  let result = [];
  for (const column of worksheet._columns) {
    if (column._number <= maxColumnNum + 2) {
      const key = column.key;
      const dataValues = data[key];
      const value = _getDataValue(dataValues, index, tableIndex, key);
      result.push(value);
    } else {
      column._hidden = true;
    }
  }

  return [...result];
};

const _getDataValue = (dataValues, index, tableIndex, key) => {
  if (!dataValues) {
    return '';
  }
  if (index > 0 && !Array.isArray(dataValues)) {
    return dataValues;
  }
  if (!dataValues[index]) {
    return '';
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

  return '';
};

const _addImage = (tableIndex, imageDataValue, key) => {
  const grid = gridValue;
  const columnIndex = _getImageColumnIndex(key);
  const column = worksheet.columns[columnIndex];
  const el = grid.getElement(tableIndex, column.key);
  const imgTags = el.getElementsByTagName('img');
  if (!imgTags || imgTags.length === 0) {
    return;
  }
  const imgTag = _getImageTag(imgTags, imageDataValue);
  const width = imgTag.offsetWidth;
  const height = imgTag.offsetHeight;
  if (!imgTag.src.includes('base64')) {
    imgTag.src = getBase64Image(imgTag);
  }
  const imageId = workbook.addImage({
    base64: imgTag.src,
    extension: 'png',
  });

  if (!worksheet.getRow(rowIndex).height || worksheet.getRow(rowIndex).height < height) {
    worksheet.getRow(rowIndex).height = height;
  }
  if (worksheet.columns[columnIndex].width < width / 8) {
    worksheet.columns[columnIndex].width = width / 8 + 1;
  }

  const imageRowIndex = rowIndex - 1;
  const colIndex = columnIndex + 0.1;
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
    } else if (imgTag.src === test) {
      return imgTag;
    }
  }
};

const _getImageColumnIndex = (key) => {
  for (let index = 0; index < maxColumnNum; index++) {
    const col = worksheet.columns[index];
    if (col.key) {
      let colKey = col.key.replaceAll(' ', '');
      colKey = colKey.toUpperCase();
      let keyVal = key.replaceAll(' ', '');
      keyVal = keyVal.toUpperCase();
      if (colKey === keyVal) {
        return index;
      }
    }
  }
};

const _setRowHeight = (values) => {
  const rowHeight = _getMaxRowHeight(values);
  if (!rowHeight) {
    return;
  }
  worksheet.getRow(rowIndex).height = _getCalRowCnt(rowHeight);
};

const _getMaxRowHeight = (values) => {
  let maxLenght = 0;
  for (let index = 0; index < maxColumnNum; index++) {
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

const _getCalRowCnt = (maxLenght) => {
  const ONE_LINE_HEIGHT = 13; // 한줄

  return ONE_LINE_HEIGHT * (maxLenght + 1);
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

const _checkArrayData = (data) => {
  let result = 0;
  for (const column of header) {
    const key = column.key;
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

const _mergeCells = (startRowIndex) => {
  if (startRowIndex === rowIndex) {
    return;
  }
  for (let i = 1; i <= maxColumnNum; i++) {
    // 이전 내용과 같으면 합침
    worksheet.mergeCells(startRowIndex, i, rowIndex - 1, i);
  }
};

// sheet 공통 style
const _setAllContentCellStyle = () => {
  for (let i = startRowValue; i < rowIndex; i++) {
    const index = i;
    _setCellStyle(index);
  }
};

const _setCellStyle = (rowIndex) => {
  for (let j = vaildColumnIndex; j <= maxColumnNum; j++) {
    const cell = worksheet.getRow(rowIndex).getCell(j);
    cell.font = FONT_STYLE;
    cell.border = BORDER_STYLE;
    cell.alignment = { vertical: 'top', wrapText: true };
  }
};

const _setMergeFirstValues = () => {
  let cnt = 0;
  for (const mergeStartIndex of mergeStartIndexArray) {
    _getMergeFirstValues(objDataArray[cnt++], mergeStartIndex);
  }
};

const _getMergeFirstValues = (data, index) => {
  let maxLength = 1;
  let dataValues = Object.values(data);
  for (let num of dataValues) {
    if (num.length > maxLength) {
      maxLength = num.length;
    }
  }
  for (let i = 0; i < maxColumnNum; i++) {
    const column = worksheet.columns[i];
    const key = column.key;
    if (key && data[key] && data[key].length > 1) {
      let mergedCell = worksheet.getRow(index).getCell(i + 1);
      worksheet.unMergeCells(mergedCell._address);
      for (let j = 0; j < maxLength; j++) {
        const cell = worksheet.getRow(index + j).getCell(i + 1);
        let value = data[key][j];
        if (value && !value.includes(IS_IMAGE)) {
          cell.value = value;
          cell.font = FONT_STYLE;
          cell.alignment = { vertical: 'top', wrapText: true };
        }
        if (j == maxLength - 1) {
          cell.border = BOTTOM_BLACK;
        } else {
          cell.border = BOTTOM_WHITE;
        }
      }
    }
  }
};

// 로컬 pc에 엑셀 다운로드
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

function getBase64Image(img) {
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL('image/png');
  return dataURL;
}

export default {
  exportExcel,
};
