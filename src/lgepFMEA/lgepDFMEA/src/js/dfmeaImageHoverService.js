import appCtxService from 'js/appCtxService';

import { getEditValue } from 'js/dfmeaCellEditorService';
import { isOpenSodPopup, closeSodPopup } from 'js/dfmeaSodSelectPopupService';
import { langIndex } from 'js/dfmeaMasterImageTableService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

let popupEl;
let isPopup;
const POPUP_ID = 'imgPopup';
let prevCell;
let click;

export const openImagePopup = (e, grid) => {
  const cell = { rowKey: e.rowKey, columnName: e.columnName };
  if (click) {
    if (prevCell.rowKey === cell.rowKey && prevCell.columnName === cell.columnName) {
      return;
    }
    click = false;
    prevCell = cell;
  }
  removeImgPopup();
  const isPopup = appCtxService.ctx[constants.FMEA_POPUP];
  if (isPopup) {
    return;
  }

  // sod popup close
  if (isOpenSodPopup) {
    closeSodPopup();
  }

  const propName = _getPropName(e.columnName);
  if (!propName) {
    return;
  }
  const el = grid.getElement(e.rowKey, e.columnName);
  if (!el) {
    return;
  }
  const imgTags = el.getElementsByTagName('img');
  if (!imgTags || imgTags.length === 0) {
    return;
  }
  makePopup();
  appendImgTags(imgTags);

  _setRect(e, propName);
  popupEl.classList.add('active');

  clickImgPopup(cell);
};

export const clickImgPopup = (cell) => {
  if (!popupEl) {
    return;
  }
  return popupEl.addEventListener('click', () => {
    prevCell = cell;
    removeImgPopup();
    click = true;
  });
};

const appendImgTags = (imgTags) => {
  for (const imgTag of imgTags) {
    const copyNode = imgTag.cloneNode(true);
    popupEl.appendChild(copyNode);
  }
};

const makePopup = () => {
  const body = document.querySelector('body');
  popupEl = document.createElement('div');
  popupEl.setAttribute('id', POPUP_ID);

  body.appendChild(popupEl);

  isPopup = true;
};

// 이미지 태그 실제 width get
const _getImgWidth = (tag) => {
  let maxWidth;
  const imgSplits = tag.split('<img');
  let cnt = 0;
  for (const imgSplit of imgSplits) {
    if (imgSplit.includes('src=')) {
      const widthStyle = imgSplit.indexOf('width:');
      if (widthStyle < 0) {
        maxWidth = 500;
        continue;
      }
      const styleValue = imgSplit.substring(widthStyle).replaceAll(' ', '');
      const pxIndex = styleValue.indexOf('px;');
      if (pxIndex > 0) {
        const widthSplit = styleValue.split('width:')[1].split('px;');
        maxWidth = _getMaxWidth(widthSplit[0], maxWidth);
      } else {
        const widthSplit = styleValue.split('width:')[1].split('%;');
        const percentWidth = widthSplit[0] >= 100 ? 1250 : 625;
        maxWidth = _getMaxWidth(percentWidth, maxWidth);
      }
      _setImg(cnt++, maxWidth);
    }
  }
  if (!maxWidth || isNaN(maxWidth)) {
    return 500;
  }
  return maxWidth;
};

const _getMaxWidth = (width, maxWidth) => {
  if (!maxWidth || width > maxWidth) {
    return width;
  }
  return maxWidth;
};

const _getCellImageValue = (e, propName) => {
  const tableList = appCtxService.ctx[constants.FMEA_TABLE_LIST];
  const rowKey = e.rowKey;
  const row = tableList[rowKey];

  const isEditing = appCtxService.ctx[constants.EDITING];
  if (isEditing) {
    const editValue = getEditValue(rowKey, propName);
    if (editValue) return editValue;
  }
  const cellValue = row[propName].value;
  return cellValue;
};

const _setRect = (e, propName) => {
  const MAX_POPUP_HEIGHT = 850;
  const cellValue = _getCellImageValue(e, propName);
  const imgWidth = _getImgWidth(cellValue);

  const _left = Math.ceil((window.screen.width - imgWidth) / 2);
  const _top = Math.ceil((window.screen.height - MAX_POPUP_HEIGHT) / 2);

  popupEl.style.left = _left + 'px';
  popupEl.style.top = _top + 'px';
  popupEl.style.overflowY = 'scroll';
};

const _setImg = (index, imgWidth) => {
  const imgs = popupEl.querySelectorAll('img');
  imgs[index].style.maxWidth = imgWidth + 'px';
  imgs[index].style.width = imgWidth + 'px';
};

const _getPropName = (columnName) => {
  switch (columnName) {
    case constants.COL_SHORT_FUNCTION_LANG[langIndex]:
      return prop.FUNCTION;
    case constants.COL_REQUIREMENT_LANG[langIndex]:
      return constants.COL_REQUIREMENT_LANG[0];
    case constants.COL_FAILURE_LANG[langIndex]:
      return constants.COL_FAILURE_LANG[0];
    case constants.COL_FAILURE_EFFECT_LANG[langIndex]:
      return constants.COL_FAILURE_EFFECT_LANG[0];
    case constants.COL_CAUSE_OF_FAILURE_LANG[langIndex]:
      return constants.COL_CAUSE_OF_FAILURE_LANG[0];
    case constants.COL_PRECATUIONS_ACTION_LANG[langIndex]:
      return constants.COL_PRECATUIONS_ACTION_LANG[0];
    case constants.COL_DETECTION_ACTION_LANG[langIndex]:
      return constants.COL_DETECTION_ACTION_LANG[0];
    case constants.COL_INSPECTION_RESULTS_LANG[langIndex]:
      return constants.COL_INSPECTION_RESULTS_LANG[0];
    case constants.COL_RECOMMENDED_ACTION_LANG[langIndex]:
      return constants.COL_RECOMMENDED_ACTION_LANG[0];
    case constants.COL_RECOMMENDED_ACTION_RESULT_LANG[langIndex]:
      return constants.COL_RECOMMENDED_ACTION_RESULT_LANG[0];
    default:
      return null;
  }
};

export const removeImgPopup = () => {
  if (isPopup) {
    popupEl.remove();
    isPopup = false;
  }
};

document.addEventListener('click', function (e) {
  const tgEl = e.target;
  const gridTable = tgEl.closest('#toastGrid');
  const isClosetCell = tgEl.closest('.tui-grid-cell');
  if (!gridTable || !isClosetCell) {
    if (isPopup) {
      removeImgPopup();
    }
  }
});
