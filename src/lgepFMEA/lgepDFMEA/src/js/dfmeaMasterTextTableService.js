/**
 * DFMEA Master Detail Table List
 * @module js/dfmeaMasterTextTableService
 */
import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import { editCancelCtx } from 'js/dfmeaMasterEditService';
import { showSaveMessage } from 'js/utils/fmeaMessageUtils';
import { editRowCancelAction } from 'js/dfmeaMasterRowEditService';
import { loadTableDatas } from 'js/dfmeaMasteTextTableLoadService';
import * as constants from 'js/constants/fmeaConstants';

const loadData = async (ctx) => {
  const datas = ctx[constants.FMEA_TABLE_LIST];
  const isRefresh = ctx[constants.FMEA_REFRESH];
  if (!isRefresh && datas) {
    if (ctx[constants.EDITING]) {
      appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, true);
    }
    return {
      totalFound: datas.length,
      searchResults: datas,
    };
  }
  return _loadTableDatas(ctx, isRefresh);
};

export const _loadTableDatas = async (ctx, isRefresh) => {
  try {
    const results = await loadTableDatas(ctx);

    appCtxService.registerCtx(constants.FMEA_TABLE_LIST, results);
    appCtxService.registerCtx(constants.INIT_COMPLETE, true);
    appCtxService.registerCtx(constants.FMEA_POPUP, false);
    return {
      totalFound: results.length,
      searchResults: results,
    };
  } catch (e) {
    //console.log('loadData', e);
  } finally {
    const execute = ctx[constants.FMEA_EXECUTE];
    if (execute && execute === constants.FMEA_EXECUTE_SAVE) {
      // TODO :: 패널 고정/해제 여부
      if (ctx[constants.IS_PIN]) {
        eventBus.publish('fmea.save.end');
      } else {
        fmeaPopupUtils.closePopup();
      }
      showSaveMessage();
    }
    delete appCtxService.ctx[constants.FMEA_EXECUTE];
    if (isRefresh) {
      editCancelCtx();
    }
  }
};

const selectTableRowAction = (selectionRow, ctx) => {
  if (ctx[constants.DFMEA_ROW_EDIT]) {
    editRowCancelAction(ctx);
  }
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  appCtxService.registerCtx(constants.ROW_SELECT, selectionRow);
  eventBus.publish('dfmeaDetail.onmount.textTable');
};

export const updateTable = (ctx, data) => {
  const chagneTableData = ctx[constants.DFMEA_CHANGE_TABLE_LIST];
  const provider = data.dataProviders.dfmeaTableProvider;
  provider.response = chagneTableData;
  provider.totalFound = chagneTableData.length;
  eventBus.publish('dfmeaTable.plTable.clientRefresh');
};

export default {
  loadData,
  selectTableRowAction,
  updateTable,
};
