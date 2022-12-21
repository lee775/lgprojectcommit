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
import $ from 'jquery';
import { rgb } from 'd3';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import awPromiseService from 'js/awPromiseService';

let selectKey;
let selectRow;

const exportExcel = async (data, ctx) => {
  let templateUid = await lgepPreferenceUtils.getPreference('L2_Excel_Template');
  try {
    if (ctx) {
      ctx = appCtxService.ctx;
    }

    let gridWidth = ctx.checklist.grid.el.scrollWidth;
    let gridheight = ctx.checklist.grid.el.scrollHeight;
    ctx.checklist.grid.setWidth(50000);
    ctx.checklist.grid.setBodyHeight(50000);

    await common.delay(500);

    let targetObj = ctx.checklist.target;
    let project = targetObj.props.l2_current_project.dbValues[0];
    let product = targetObj.props.l2_product_name.dbValues[0];
    let module = targetObj.props.object_name.dbValues[0];
    let rev = targetObj.props.item_revision_id.dbValues[0];
    let fileName = `Checklist_${project}_${product}_${module}_${rev}`;
    fileName = fileName.replaceAll('_null', '');

    if (!fileName) {
      fileName = 'DFMEA';
    }

    await exportUtils.exportExcel(ctx.checklist.grid, 'MUiN2c0s5p7XAC', fileName, '6.Worksheet');
    findAttach();

    ctx.checklist.grid.setWidth(gridWidth + 25);
    ctx.checklist.grid.setBodyHeight(gridheight);
  } catch (error) {
    console.error(error);
  }
};

let beforeRow;
let beforeKey;

function fixed(data, ctx, num) {
  try {
    let change = document.querySelector(
      '#openGrid > div > div.tui-grid-content-area.tui-grid-no-scroll-x.tui-grid-no-scroll-y > div.tui-grid-rside-area > div.tui-grid-body-area',
    );
    let headTable = document.querySelector('.tui-grid-rside-area .tui-grid-header-area .tui-grid-table');
    let cellTable = document.querySelector('.tui-grid-rside-area .tui-grid-body-area .tui-grid-table');
    let container = document.querySelector('.tui-grid-rside-area .tui-grid-body-area');
    let container2 = document.querySelectorAll('.tui-grid-cell-selected');
    for (let cell of container2) {
      let name = cell.dataset.columnName;
      let tds = $(`td[data-column-name="${name}"]`);
      for (let td of tds) {
        td.style.backgroundColor = '#e5f6ff';
      }
    }

    container.onmousedown = function (e) {
      beforeRow;
      beforeKey;
      let selectTd = $('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');
      selectKey = [];
      selectRow = [];
      for (let td of selectTd) {
        td.style.backgroundColor = '';
        td.addEventListener('mousemove', changeColor);
      }
    };
    container.onmouseup = function (e) {
      // let selectedRow = $('.changeBorder .tui-grid-cell-current-row');
      // console.log('showRow', selectedRow);
      // let testBox = $('div.tui-grid-layer-selection');
      // console.log('test', testBox);
      let selectTd = $('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');
      for (let td of selectTd) {
        td.removeEventListener('mousemove', changeColor);
        td.removeEventListener('mousemove', moveTest);
      }
      let ths = $('.tui-grid-rside-area .tui-grid-header-area th');
      for (let th of ths) {
        th.removeEventListener('mousemove', moveTest);
      }
    };

    const grid = ctx.checklist.grid;
    let columnLength = grid.store.column.visibleColumns.length;
    let selectColumn = $('.tui-grid-cell-selected');
    let tableHeader = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area th');
    let tableColumn = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');

    let selectColumnNum = 0;
    if (num) {
      selectColumnNum = num;
    } else {
      selectColumnNum = selectColumn.length;
    }

    if (!(selectColumnNum == columnLength) && selectColumnNum > 0) {
      headTable.classList.add('changeBorder');
      cellTable.classList.add('changeBorder');
      change.style.overflow = '';
      change.style.position = 'absolute';
      change.style.top = '0px';

      // grid.setFrozenColumnCount(selectColumn.length);
      let setWidth = 0;
      for (let head of tableHeader) {
        // head.style.setProperty('border-bottom-color', 'transparent', 'important');
        head.style.setProperty('border-left-color', 'transparent', 'important');
        // head.style.setProperty('border-top-width', '1px', 'important');
        head.onclick = '';
        head.onmousedown = function (e) {
          let targetName = e.target.dataset.columnName;
          let ths = $('.tui-grid-rside-area .tui-grid-header-area th');
          for (let th of ths) {
            th.addEventListener('mousemove', moveTest);
          }
          let tds = $('.tui-grid-rside-area .tui-grid-body-area td');
          for (let td of tds) {
            td.addEventListener('mousemove', moveTest);
            if (td.dataset.columnName == targetName && td.style.position == 'sticky') {
              td.style.backgroundColor = '#e5f6ff';
            } else {
              td.style.backgroundColor = '';
            }
          }
        };
        head.onmouseup = function (e) {
          let ths = $('.tui-grid-rside-area .tui-grid-header-area th');
          for (let th of ths) {
            th.removeEventListener('mousemove', moveTest);
          }
          let tds = $('.tui-grid-rside-area .tui-grid-body-area td');
          for (let td of tds) {
            td.removeEventListener('mousemove', moveTest);
          }
        };
        // head.style = "border-bottom : 0 !important; border-left-width : 0 !important;";
      }
      for (let column of tableColumn) {
        // column.style.setProperty('border-bottom-color', 'transparent', 'important');
        column.style.setProperty('border-left-color', 'transparent', 'important');
        column.style.setProperty('border-top-width', '0px');
        column.onclick = async function (column) {
          await common.delay(10);
          let temp1 = $('.tui-grid-layer-selection');
          temp1[0].style.zIndex = 2;
          // let trs = $('.tui-grid-rside-area .tui-grid-body-area .tui-grid-table tr');
          // for (let tr of trs) {
          //   let classNames = tr.classList.value;
          //   if (classNames.includes('tui-grid-cell-current-row')) {
          //     for (let td of tr.childNodes) {
          //       td.style.backgroundColor = '#e5f6ff';
          //       console.log('test2', td);
          //     }
          //   } else {
          //     for (let td of tr.childNodes) {
          //       td.style.backgroundColor = '';
          //     }
          //   }
          // }
        };
        // column.style = "border-left-width: 0 !important;  border-bottom: 0 !important";
      }
      for (let i = 1; i <= selectColumnNum; i++) {
        let header = $(`tr th:nth-child(${i})`);
        let value = $(`tr td:nth-child(${i})`);
        for (let val of value) {
          val.style.position = 'sticky';
          val.style.left = setWidth + 'px';
          val.style.zIndex = 1;
          if (i == selectColumnNum) {
            val.style.setProperty('border-right-width', '3px', 'important');
          }
        }
        for (let head of header) {
          head.style.position = 'sticky';
          head.style.left = setWidth + 'px';
          head.style.zIndex = 2;
          if (i == selectColumnNum) {
            head.style.setProperty('border-right-width', '3px', 'important');
          }
          setWidth += head.offsetWidth;
        }
      }
      ctx.fixed = selectColumnNum;
    } else {
      message.show(2, '컬럼을 선택해야 합니다.');
    }
  } catch (err) {
    console.log(err);
    message.show(2, '틀 고정 중 오류가 발생했습니다.');
  }
}

export function fixedOff(data, ctx, num) {
  let change = document.querySelector(
    '#openGrid > div > div.tui-grid-content-area.tui-grid-no-scroll-x.tui-grid-no-scroll-y > div.tui-grid-rside-area > div.tui-grid-body-area',
  );
  let headTable = document.querySelector('.tui-grid-rside-area .tui-grid-header-area .tui-grid-table');
  let cellTable = document.querySelector('.tui-grid-rside-area .tui-grid-body-area .tui-grid-table');

  let headerStyle = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');
  headTable.classList.remove('changeBorder');
  cellTable.classList.remove('changeBorder');

  change.style.overflow = 'hidden';
  headerStyle.style.top = '';

  let container = document.querySelector('.tui-grid-rside-area .tui-grid-body-area');
  container.onmousedown = '';
  container.onmouseup = '';

  // grid.setFrozenColumnCount(0);
  let tableHeader = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area th');
  let tableColumn = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');
  for (let head of tableHeader) {
    head.style.setProperty('border-bottom-color', '');
    head.style.setProperty('border-left-color', '');
    head.style.setProperty('border-top-width', '');
    head.style.setProperty('border-right-width', '');
    if (head.style.position == 'sticky') {
      head.style.position = '';
      head.style.left = '';
    }
    // head.onclick = function (head) {
    //   console.log('click');
    //   let tds = $(`.tui-grid-rside-area .tui-grid-body-area td`);
    //   for (let td of tds) {
    //     td.style.backgroundColor = '';
    //   }
    // };
    // head.style = "border-bottom : ''; border-left-width : ''";
  }
  for (let column of tableColumn) {
    column.style.setProperty('border-bottom-color', '');
    column.style.setProperty('border-left-color', '');
    column.style.setProperty('border-right-width', '');
    if (column.style.position == 'sticky') {
      column.style.position = '';
      column.style.left = '';
    }
    column.style.backgroundColor = '';
    column.onclick = '';
    // column.style = "border-left-width: ''; border-bottom: ''";
  }
  // let selectLength = 0;
  // if (num) {
  //   selectLength = num;
  // } else {
  //   selectLength = ctx.fixed;
  // }
  // for (let i = 1; i <= selectLength + 1; i++) {
  //   let header = $(`tr th:nth-child(${i})`);
  //   let value = $(`tr td:nth-child(${i})`);
  //   for (let head of header) {
  //     head.style.position = '';
  //     head.style.left = '';
  //     if (i == selectLength) {
  //       head.style.setProperty('border-right-width', '');
  //     }
  //   }
  //   for (let val of value) {
  //     val.style.position = '';
  //     val.style.left = '';
  //     if (i == selectLength) {
  //       val.style.setProperty('border-right-width', '');
  //     }
  //   }
  // }
  delete ctx.fixed;
}

export async function autoResize(data, ctx) {
  const grid = ctx.checklist.grid;

  grid.setWidth(50000);
  await lgepCommonUtils.delay(500);

  let columns = grid.store.column.visibleColumns;
  let totalWidth = 0;
  for (let column of columns) {
    let columnWidth = 0;
    let contentWidth = 0;

    columnWidth = getColumnWidth(column);
    contentWidth = getContentWidth(column);

    if (columnWidth == 0) {
      columnWidth = column.baseWidth;
    }
    if (contentWidth == 0) {
      contentWidth = 90;
    }

    if (columnWidth >= contentWidth) {
      column.baseWidth = columnWidth;
      totalWidth += columnWidth;
    } else if (columnWidth < contentWidth) {
      column.baseWidth = contentWidth;
      totalWidth += contentWidth;
    }
  }
  grid.setWidth(totalWidth + 25);
}

// 테이블 헤더의 글자 길이에 따른 넓이 반환
function getColumnWidth(column) {
  let headerText = column.header;
  let headerLength = headerText.length;
  if (column.name == 'icon') {
    headerLength = 15;
  }
  return headerLength * 14;
}

// 컨텐츠의 글자 길이에 따른 넓이 반환
function getContentWidth(column) {
  let width = 0;
  const maxLength = 45;
  let imgTag = $(`td[data-column-name=${column.name}]`).find('img');
  let imgCount = imgTag.length;
  let value = $(`td[data-column-name=${column.name}]`);
  const names = ['upperAssy', 'lowerAssy', 'single'];
  let check = names.find((val) => val == column.name);
  try {
    let imgWidth = 0;
    if (imgCount > 0) {
      for (let i = 0; i < imgCount; i++) {
        if (imgWidth < imgTag[i].width + 10) {
          imgWidth = imgTag[i].width + 10;
        }
      }
    }
    let totalValue = value.length;
    let textLong = 0;
    for (let i = 0; i < totalValue; i++) {
      let text = value[i].innerText;
      let splitText = text.split('\n');
      for (let txt of splitText) {
        if (textLong < txt.length) {
          textLong = txt.length;
        }
      }
    }
    if (textLong > maxLength) {
      textLong = maxLength;
    }
    if (imgWidth < textLong * 14) {
      width = textLong * 14;
    } else {
      width = imgWidth;
    }
    if (check && imgCount < 1) {
      return 125;
    } else if (check && imgCount > 0) {
      if (width < 125) {
        return 125;
      } else {
        return width;
      }
    } else {
      return width;
    }
  } catch (err) {
    console.log(err);
    return width;
  }
}

async function hideColumn(data, ctx) {
  let selectColumn = $('.tui-grid-cell-selected');
  const grid = ctx.checklist.grid;
  let columnLength = grid.store.column.visibleColumns.length;
  let change = document.querySelector(
    '#openGrid > div > div.tui-grid-content-area.tui-grid-no-scroll-x.tui-grid-no-scroll-y > div.tui-grid-rside-area > div.tui-grid-body-area',
  );
  if (!(selectColumn.length == columnLength) && !ctx.hideColumn && selectColumn.length > 0) {
    //컬럼 숨기기
    let columnNames = [];
    let checkFix;
    let selectFixNum = 0;
    for (let column of selectColumn) {
      let columnName = column.attributes['data-column-name'].value;
      if (column.style.position == 'sticky') {
        checkFix = true;
        selectFixNum++;
        columnNames.push(columnName);
      } else {
        columnNames.push(columnName);
      }
    }
    if (checkFix == true) {
      // 고정된 틀이 있을 때
      let fixedNum = ctx.fixed;
      fixedOff(data, ctx);
      for (let name of columnNames) {
        grid.hideColumn(name);
      }
      await lgepCommonUtils.delay(100);
      ctx.hideColumn = columnNames;
      fixedNum -= selectFixNum;
      ctx.fixed = fixedNum;
      fixed(data, ctx, fixedNum);
    } else {
      //고정된 틀이 없을 때
      for (let name of columnNames) {
        grid.hideColumn(name);
      }
      ctx.hideColumn = columnNames;
    }
    ctx.hideFixColumn = selectFixNum;
    if (columnNames.length < 1) {
      delete ctx.hideColumn;
    }
  } else if (ctx.hideColumn) {
    //컬럼 보이기
    if (!ctx.fixed) {
      //틀 고정 없을 때
      for (let name of ctx.hideColumn) {
        grid.showColumn(name);
        delete ctx.hideColumn;
      }
      await lgepCommonUtils.delay(100);
      let tableHeader = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area th');
      let tableColumn = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');
      for (let head of tableHeader) {
        head.style.setProperty('border-bottom-color', '');
        head.style.setProperty('border-left-color', '');
        head.style.setProperty('border-top-width', '');
        head.style.setProperty('position', '');
        head.style.setProperty('left', '');
        head.style.setProperty('border-right-width', '');
      }
      for (let column of tableColumn) {
        column.style.setProperty('border-bottom-color', '');
        column.style.setProperty('border-left-color', '');
        column.style.setProperty('position', '');
        column.style.setProperty('left', '');
        column.style.setProperty('border-right-width', '');
      }
    } else {
      //틀 고정 있을 때
      let fixedNum = ctx.fixed + ctx.hideFixColumn;
      for (let name of ctx.hideColumn) {
        grid.showColumn(name);
      }
      delete ctx.hideColumn;
      await lgepCommonUtils.delay(100);
      fixedOff(data, ctx, fixedNum);
      await lgepCommonUtils.delay(100);
      fixed(data, ctx, fixedNum);
    }
    delete ctx.hideFixColumn;
  } else {
    message.show(2, '컬럼을 선택해야 합니다.');
  }
  await lgepCommonUtils.delay(500);
  if (ctx.fixed) {
    change.style.overflow = '';
  }
}

async function checkSelected(data, ctx) {
  if (ctx.checklist.isAllSelected == true) {
    let rawData = ctx.checklist.grid.store.data.rawData;
    let selectRowNum = [];
    for (let raw of rawData) {
      if (raw.isSelected == 'Y') {
        ctx.checklist.grid.addRowClassName(raw.rowKey, 'targetRow');
        selectRowNum.push(raw.rowKey);
      }
    }
  }
  try {
    await insertImage(ctx);
    // await lgepCommonUtils.delay(5000);
    await tableResize();
    await autoResize(data, ctx);
  } catch (err) {
    console.log(err);
  }
}

function resetCmdData(data, ctx) {
  if (ctx.fixed) {
    fixedOff(data, ctx);
  }
  delete ctx.hideColumn;
}

function changeColor(e) {
  let temp1 = $('.tui-grid-layer-selection');
  temp1.addClass('hideEvent');
  // if(temp1.length>0){
  //   temp1[0].style.zIndex = 2;
  // }
  // this.style.backgroundColor = '#ffa500';
  let check1 = selectKey.find((key) => key == this.dataset.columnName);
  let check2 = selectRow.find((row) => row == this.dataset.rowKey);
  let delete1 = false;
  let delete2 = false;
  let deleteRow;
  let deleteKey;
  if (beforeRow && beforeRow != this.dataset.rowKey) {
    if (!check2) {
      selectRow.push(this.dataset.rowKey);
    } else {
      deleteRow = selectRow.pop();
      delete2 = true;
    }
  } else {
    if (!check2) {
      selectRow.push(this.dataset.rowKey);
    }
  }

  if (beforeKey && beforeKey != this.dataset.columnName) {
    if (!check1) {
      selectKey.push(this.dataset.columnName);
    } else {
      deleteKey = selectKey.pop();
      delete1 = true;
    }
  } else {
    if (!check1) {
      selectKey.push(this.dataset.columnName);
    }
  }

  if (delete1 == true && delete2 == true) {
    //
  } else if (delete2 == true) {
    for (let key of selectKey) {
      let cell = $(`td[data-row-key=${deleteRow}][data-column-name=${key}]`);
      cell[0].style.backgroundColor = '';
    }
  } else if (delete1 == true) {
    for (let row of selectRow) {
      let cell = $(`td[data-row-key=${row}][data-column-name=${deleteKey}]`);
      cell[0].style.backgroundColor = '';
    }
  }
  beforeRow = this.dataset.rowKey;
  beforeKey = this.dataset.columnName;
  for (let key of selectKey) {
    for (let row of selectRow) {
      let cell = $(`td[data-row-key=${row}][data-column-name=${key}]`);
      if (cell[0].style.position == 'sticky') {
        cell[0].style.backgroundColor = '#e5f6ff';
      }
    }
  }
}

function moveTest(e) {
  let columnName = this.dataset.columnName;
  let tds = $(`td[data-column-name="${columnName}"]`);
  for (let td of tds) {
    if (td.style.position == 'sticky') {
      td.style.backgroundColor = '#e5f6ff';
    }
  }
}

export const tableResize = async () => {
  let ctx = appCtxService.ctx;
  // ctx.checklist.grid.setBodyHeight(50000);
  await lgepCommonUtils.delay(300);

  let headerLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');
  headerLayout.style.width = document.querySelector('#openGrid').offsetWidth + 'px';

  let getTable = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-table > tbody > tr');
  let height = 0;
  for (let tr of getTable) {
    let str = tr.offsetHeight;
    height += parseInt(str);
  }
  ctx.checklist.grid.setBodyHeight(height + 40);
  return;
};

function insertImage(ctx) {
  var deferred = awPromiseService.instance.defer();
  let rawDatas = ctx.checklist.grid.store.data.rawData;
  let promiseArray = [];
  for (let raw of rawDatas) {
    let single;
    let lower;
    let upper;
    single = raw.getParent().getParent();
    if (!single.parent) {
      upper = single;
      lower = '';
      single = '';
    } else {
      lower = single.getParent();
    }
    if (!lower.parent) {
      upper = lower;
      lower = single;
      single = '';
    } else {
      upper = lower.getParent();
    }

    if (upper) {
      promiseArray.push(getImageUrls(upper, raw, 'upperAssy'));
    }
    if (lower) {
      promiseArray.push(getImageUrls(lower, raw, 'lowerAssy'));
    }
    if (single) {
      promiseArray.push(getImageUrls(single, raw, 'single'));
    }
  }
  if (promiseArray.length > 0) {
    Promise.all(promiseArray).then(() => {
      deferred.resolve(true);
    });
  }
  return deferred.promise;
}

function getImageUrls(obj, raw, key) {
  return obj.getImageTicket().then((result) => {
    let img1 = result;
    if (img1) {
      for (let url of img1) {
        let tag1 = `<br><img src=${url}>`;
        raw[key] += tag1;
      }
    }
    return;
  });
}

function findAttach() {
  let aTags = $('a[datauid]');
  let uids = '';
  if (aTags.length > 0) {
    for (let a of aTags) {
      let uid = a.attributes.datauid.value;
      uids += `${uid},`;
    }
    let link = document.createElement('a');
    let url = browserUtils.getBaseURL() + '#/lgepXcelerator?uids=' + uids;
    link.href = url;
    link.target = '_blank';
    link.click();
  }
}

export default {
  exportExcel,
  fixed,
  fixedOff,
  autoResize,
  hideColumn,
  checkSelected,
  resetCmdData,
};
