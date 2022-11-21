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

const exportExcel = async (data, ctx) => {
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

    // let fileName = ctx.checklist.target.props.object_name.dbValues[0]
    if (!fileName) {
      fileName = 'DFEMA';
    }

    await exportUtils.exportExcel(ctx.checklist.grid, 'MUiN2c0s5p7XAC', fileName, '6.Worksheet');

    ctx.checklist.grid.setWidth(gridWidth + 25);
    ctx.checklist.grid.setBodyHeight(gridheight);
  } catch (error) {
    console.error(error);
  }
};

function fixed(data, ctx, num) {
  try {
    let change = document.querySelector(
      '#openGrid > div > div.tui-grid-content-area.tui-grid-no-scroll-x.tui-grid-no-scroll-y > div.tui-grid-rside-area > div.tui-grid-body-area',
    );
    let headTable = document.querySelector('.tui-grid-rside-area .tui-grid-header-area .tui-grid-table');
    let cellTable = document.querySelector('.tui-grid-rside-area .tui-grid-body-area .tui-grid-table');

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
        head.style.setProperty('border-bottom-color', 'transparent', 'important');
        head.style.setProperty('border-left-color', 'transparent', 'important');
        head.style.setProperty('border-top-width', '1px', 'important');
        head.onclick = function (head) {
          let targetName = head.target.dataset.columnName;
          let tds = $('#checklist-open-view .tui-grid-rside-area .tui-grid-body-area td');
          for (let td of tds) {
            if (td.dataset.columnName == targetName) {
              // td.style.backgroundColor = '#e5f6ff';
            } else {
              td.style.backgroundColor = '';
            }
          }
        };
        // head.style = "border-bottom : 0 !important; border-left-width : 0 !important;";
      }
      for (let column of tableColumn) {
        column.style.setProperty('border-bottom-color', 'transparent', 'important');
        column.style.setProperty('border-left-color', 'transparent', 'important');
        column.onclick = function (column) {
          let trs = $('.tui-grid-rside-area .tui-grid-body-area .tui-grid-table tr');
          for (let tr of trs) {
            let classNames = tr.classList.value;
            if (classNames.includes('tui-grid-cell-current-row')) {
              for (let td of tr.childNodes) {
                td.style.backgroundColor = ctx.theme == 'ui-lgepDark' ? rgb(61, 66, 71) : '#e5f6ff';
              }
              // tr.childNodes[0].style.backgroundColor = ctx.theme == 'ui-lgepDark' ? rgb(61, 66, 71) : '#e5f6ff';
            } else {
              for (let td of tr.childNodes) {
                td.style.backgroundColor = '';
              }
              // tr.childNodes[0].style.backgroundColor = '';
            }
          }
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
          head.style.zIndex = 1;
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

export function autoResize(data, ctx) {
  const grid = ctx.checklist.grid;

  grid.setWidth(50000);

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

  try {
    if (imgCount > 0) {
      for (let i = 0; i < imgCount; i++) {
        if (width < imgTag[i].width + 10) {
          width = imgTag[i].width + 10;
        }
      }
    } else {
      let totalValue = value.length;
      for (let i = 0; i < totalValue; i++) {
        let text = value[i].innerText;
        let textLong = text.length;
        if (textLong > maxLength) {
          textLong = maxLength;
        }
        if (width < textLong) {
          width = textLong;
        }
      }
      width = width * 13;
    }
    return width;
  } catch (err) {
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
      console.log('숨긴고정컬럼 갯수', ctx.hideFixColumn);
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
  await lgepCommonUtils.delay(100);
  autoResize(data, ctx);
}

function resetCmdData(data, ctx) {
  if (ctx.fixed) {
    fixedOff(data, ctx);
  }
  delete ctx.hideColumn;
}

function changeColor() {}

export default {
  exportExcel,
  fixed,
  fixedOff,
  autoResize,
  hideColumn,
  checkSelected,
  resetCmdData,
};
