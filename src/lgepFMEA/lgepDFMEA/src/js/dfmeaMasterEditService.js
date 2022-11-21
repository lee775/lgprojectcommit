/**
 * DFMEA Master Detail List
 * @module js/dfmeaMasterListService
 */
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { showWarnMessage } from 'js/utils/fmeaMessageUtils';
import { isTreeTable, tableRefreshByTableMode } from 'js/utils/fmeaViewCommonUtils';
import * as constants from 'js/constants/fmeaConstants';

const NO_EDITING = 'no-editing';
const EDITING = 'editing';

/**
 * 편집 실행
 * @param {*} data
 * @param {*} ctx
 */
const editAction = async (data, ctx) => {
  // TODO :: 결재 체크?
  // const isLatestRev = await _checkLatestRev(ctx);
  // if (!isLatestRev) {
  //   showWarnMessage('warnLatestCheck');
  //   return;
  // }

  if (isTreeTable()) {
    showWarnMessage('warnDevloping');
    return;
  }

  const {
    dfmeaName: { dbValue: dfmeaNameValue },
    dfmeaNameText,
  } = data;
  appCtxService.registerCtx(constants.FMEA_POPUP, true);

  dfmeaNameText.dbValue = dfmeaNameValue;
  dfmeaNameText.dispValue = dfmeaNameValue;

  appCtxService.registerCtx(constants.EDITING, true);
  appCtxService.registerCtx(constants.FMEA_EDIT_INIT, true);
  appCtxService.registerCtx(constants.FMEA_POPUP, false);

  const changeINfo = {
    [constants.CHANGE_ADD_ROWS]: [],
    [constants.CHANGE_REMOVE_ROWS]: [],
    [constants.CHANGE_EDIT_ROWS]: [],
  };
  appCtxService.registerCtx(constants.CHANGE_INFO, changeINfo);

  _changeOpenUiTableSelect();
};

const _changeOpenUiTableSelect = () => {
  const tableSelectElements = document.querySelectorAll('.dfmea-listbox');
  for (const element of tableSelectElements) {
    element.classList.remove(NO_EDITING);
  }

  const buttonArrows = document.querySelectorAll('aw-property-image');
  for (const arrow of buttonArrows) {
    arrow.classList.add(EDITING);
  }
};

const _changeCloseUiTableSelect = () => {
  const tableSelectElements = document.querySelectorAll('.dfmea-listbox');
  for (const element of tableSelectElements) {
    element.classList.add(NO_EDITING);
  }

  const buttonArrows = document.querySelectorAll('aw-property-image');
  for (const arrow of buttonArrows) {
    arrow.classList.remove(EDITING);
  }
};

// 현재 FMEA가 최신 리비전인지 체크
const _checkLatestRev = async (ctx) => {
  const dfmea = ctx[constants.FMEA_SELECT];
  const latesetFmeaRev = await lgepObjectUtils.getLatestItemRevision(dfmea);
  if (dfmea.uid === latesetFmeaRev.uid) {
    return true;
  }
  return false;
};

/**
 * 편집 취소 실행
 * @param {*} ctx
 */
export const editCancelAction = async (ctx) => {
  const isRowEidtSave = ctx[constants.FMEA_ROW_EDIT_SAVE];
  if (isRowEidtSave || _isEditRows(ctx)) {
    appCtxService.registerCtx(constants.FMEA_POPUP, true);

    await tableRefreshByTableMode();
  }
  editCancelCtx();
  appCtxService.registerCtx(constants.FMEA_POPUP, false);
};

const _isEditRows = (ctx) => {
  const changeInfo = ctx[constants.CHANGE_INFO];
  if (changeInfo) {
    const editRows = changeInfo[constants.CHANGE_EDIT_ROWS];
    if (editRows.length > 0) {
      return true;
    }
  }
  return false;
};

export const commonEditCancel = () => {
  _changeCloseUiTableSelect();
  editCancelCtx();
};

export const editCancelCtx = () => {
  appCtxService.registerCtx(constants.EDITING, false);
  appCtxService.registerCtx(constants.FMEA_EDIT_INIT, false);
  appCtxService.registerCtx(constants.FMEA_REFRESH, false);
  appCtxService.registerCtx(constants.FMEA_ROW_EDIT_SAVE, false);
};

export default {
  editAction,
  editCancelAction,
};
