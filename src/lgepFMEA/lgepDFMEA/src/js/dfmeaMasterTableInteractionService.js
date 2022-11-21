import appCtxService from 'js/appCtxService';

import { getStructureUidUntilSubAssy } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

let grid;
const FOCUS_ID = 'interaction-focus';

/**
 * Interaction 실행할 구조 라인 css 적용
 * 선택한 파트 css 적용
 * @param {} ctx
 */
export const initImgSelectRow = (tuiGrid) => {
  grid = tuiGrid;
  const selectRowKey = grid.getFocusedCell().rowKey;

  grid.addRowClassName(selectRowKey, constants.INTERACTION_INIT_SELECT_CLASSNAME);
};

/**
 * Interaction Operation
 */
const focusRowByInteraction = () => {
  const interactionRow = appCtxService.ctx[constants.INTERACTION_ROW];
  _setInteractionRow(interactionRow);
};

// 선택한 파트 select로
const initSelect = () => {
  const initSelectRow = appCtxService.ctx[constants.ROW_SELECT];
  grid.focusAt(initSelectRow.rowKey, 0, true);
  _focusScroll(initSelectRow);
};

const _setInteractionRow = (interactionRow) => {
  const imageTableRows = grid.getData();
  for (const row of imageTableRows) {
    const structureUid = getStructureUidUntilSubAssy(row);
    if (interactionRow.uid === structureUid) {
      allImageResetStyles();
      _addStyleBySameStructure(imageTableRows, row);
      _focusScroll(row);
    }
  }
};

const _focusScroll = (row) => {
  grid.focusAt(row.rowKey, 0, true);
  const focusCell = grid.getFocusedCell();
  const el = grid.getElement(focusCell.rowKey, focusCell.columnName);
  el.setAttribute('id', FOCUS_ID);
  document.getElementById(FOCUS_ID).scrollIntoView();
  el.setAttribute('id', '');
};

let sameStructureIndexArray = [];

const _addStyleBySameStructure = (textTableRows, selectRow) => {
  const selectRowName = getPartName(selectRow);
  for (let rowKey = 0; rowKey < textTableRows.length; rowKey++) {
    const row = textTableRows[rowKey];
    const rowName = getPartName(row);
    if (selectRowName === rowName) {
      sameStructureIndexArray.push(rowKey);
      grid.addRowClassName(rowKey, constants.INTERACTION_INIT_SAME_SELECT);
    }
  }
};

export const allImageResetStyles = () => {
  for (const rowKey of sameStructureIndexArray) {
    grid.removeRowClassName(rowKey, constants.INTERACTION_INIT_SAME_SELECT);
  }
  sameStructureIndexArray = [];
};

// 선택한 파트 css 제거
const initRest = (ctx) => {
  const initRowKey = ctx[constants.INTERACTION_INIT_ROW_SELECT];
  grid.removeRowClassName(initRowKey.rowKey, constants.INTERACTION_INIT_SELECT_CLASSNAME);
  initSelect();
};

export const getPartName = (selectRow) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  if (selectRow.props[prop.SUB_ASSY]) {
    return selectRow.props[prop.SUB_ASSY].value;
  } else {
    return selectRow.props[prop.PARENT_ASSY].value;
  }
};

export default {
  focusRowByInteraction,
  initSelect,
  initRest,
};
