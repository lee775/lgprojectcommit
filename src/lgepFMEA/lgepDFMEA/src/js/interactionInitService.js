/**
 * interaction Service
 * @module js/interactionService
 */
import appCtxService from "js/appCtxService";
import eventBus from "js/eventBus";

import { getTreePartName } from "js/dfmeaMasterTreeTableInteractionService";
import { getPartName } from "js/dfmeaMasterTableInteractionService";
import { tableRefresh, isTreeTable } from "js/utils/fmeaViewCommonUtils";
import * as constants from "js/constants/fmeaConstants";

/**
 * Interaction panel UI초기화
 * @param {*} ctx
 * @returns
 */
const initAction = async (ctx) => {
  // 1. selectRow 임시 저장
  const selectRow = ctx[constants.ROW_SELECT];
  appCtxService.registerCtx(constants.INTERACTION_INIT_ROW_SELECT, selectRow);

  // 2. Panel UI 초기화
  const selectPartName = getPartNameByTableMode(selectRow);
  const effectTypes = constants.INTERACTION_TYPES.map((type) => {
    return type;
  });

  // 3. init select
  const tableMode = ctx[constants.DFMEA_TABLE_MODE];
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    eventBus.publish("fmea.treeTable.initSelectRow");
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    eventBus.publish("fmea.textTable.initSelectRow");
  } else {
    eventBus.publish("fmea.imageTable.initSelectRow");
  }

  return {
    selectPartName: selectPartName,
    effectTypes: effectTypes,
  };
};

/**
 * 선택한 row의 partName get
 * @param {*} selectRow
 * @param {*} ctx
 * @returns
 */
export const getPartNameByTableMode = (selectRow) => {
  if (isTreeTable()) {
    return getTreePartName(selectRow);
  } else {
    return getPartName(selectRow);
  }
};

/**
 * 영향 타입 변경 시 테이블 refresh
 */
const selectionEffectType = (data) => {
  const tab = data.selectedTab;
  if (!tab) {
    return;
  }
  if (tab.tabKey === "influencing") {
    tableRefresh("influencingTable");
  } else {
    tableRefresh("affectedTable");
  }
};

window.addEventListener("click", function (event) {
  if (event && event.target) {
    if (
      event.target.className.includes &&
      event.target.className.includes("aw-jswidgets-checkboxButton")
    ) {
      eventBus.publish("fmea.change.effectTypes");
    }
  }
});

export default {
  initAction,
  selectionEffectType,
};
