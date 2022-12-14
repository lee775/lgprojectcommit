import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';
import { WARNING, show } from 'js/utils/lgepMessagingUtils';
import { STRUCTURE_INFO, INTERACTION_TARGET_ROW, INTERACTION_TYPES, INTERACTION_TARGET_SELECT_CLASSNAME, getSubAssy } from 'js/L2_ChecklistInteractionUtils';
import { resetCheckRows } from 'js/L2_ChecklistInteractionCheckTableService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

const TYPE_STRUCTURE_REV = 'L2_StructureRevision';

/** 영향성 체크 실행 */
export const openInteractionPanel = () => {
  const selectRow = appCtxService.ctx.checklist.selectedRow;
  if (!selectRow) {
    show(WARNING, '로우를 선택해주세요');
    return;
  }

  // 트리인 경우 type structure, subAssy 체크
  const tableMode = appCtxService.ctx.checklist.tableMode;
  if (tableMode == 3) {
    if (!selectRow) {
      return;
    }
    if (!selectRow.type === TYPE_STRUCTURE_REV) {
      return;
    }

    if (!_checkSubAssy(selectRow)) {
      return;
    }
  }

  const data = {
    id: 'checklist_interaction',
    includeView: 'L2_interaction',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_interaction',
    config: {
      width: 'WIDE',
    },
  };
  eventBus.publish('awsidenav.openClose', data);
};

export const closePanel = () => {
  delete appCtxService.ctx.checklist[INTERACTION_TARGET_ROW];
  eventBus.publish('awsidenav.openClose', {});
};

const _checkSubAssy = (selectRow) => {
  const selectRowUid = selectRow.getOriginalObject().uid;
  for (const subAssy of appCtxService.ctx.checklist[STRUCTURE_INFO].subAssy) {
    if (subAssy.getOriginalObject().uid === selectRowUid) {
      return true;
    }
  }
  return false;
};

/**
 * Interaction panel UI초기화
 * @param {*} ctx
 * @returns
 */
const initAction = async (ctx, data) => {
  // 0. 전체 선택/해제 버튼 초기화
  data.allCheckButton.dispValue = '유형 전체 해제';

  // 1. selectRow 임시 저장
  const selectRow = ctx.checklist.selectedRow;

  ctx.checklist[INTERACTION_TARGET_ROW] = selectRow;

  // 2. Panel UI 초기화
  let selectPartName = '';
  const subAssy = getSubAssy(selectRow);
  if (!subAssy.props.object_name) {
    const subAssyObject = lgepObjectUtils.getObject(subAssy.uid);
    await lgepObjectUtils.getProperties([subAssy], ['object_name']);
    selectPartName = subAssyObject.props.object_name.dbValues[0];
  } else {
    selectPartName = subAssy.props.object_name.dbValues[0];
  }

  // 3. 대상 row css
  const grid = ctx.checklist.grid;
  const tableMode = ctx.checklist.tableMode;
  if (tableMode === 3) {
    // tree css는 다를걸
  }

  grid.addRowClassName(selectRow.rowKey, INTERACTION_TARGET_SELECT_CLASSNAME);

  // default 전체 선택
  _allCheck(data);
  selectionEffectType(data);
  return {
    selectPartName: selectPartName,
  };
};

const unMount = async (ctx) => {
  const initRowKey = ctx.checklist[INTERACTION_TARGET_ROW].rowKey;
  const grid = ctx.checklist.grid;

  grid.removeRowClassName(initRowKey, INTERACTION_TARGET_SELECT_CLASSNAME); // 타겟 ROW CSS 삭제

  grid.focusAt(grid.getIndexOfRow(initRowKey), 0, true); // focus 원위치

  delete ctx.checklist[INTERACTION_TARGET_ROW];

  resetCheckRows(ctx);
};

const changeTab = (ctx) => {
  resetCheckRows(ctx);
};

/**
 * 영향 타입 변경 시 테이블 refresh
 */
const selectionEffectType = (data) => {
  const tab = data.selectedTab;
  if (!tab) {
    return;
  }
  if (tab.tabKey === 'influencing') {
    eventBus.publish('influencingTable.plTable.reload');
  } else {
    eventBus.publish('affectedTable.plTable.reload');
  }
};

window.addEventListener('click', function (event) {
  if (event && event.target) {
    if (event.target.className.includes && event.target.className.includes('aw-jswidgets-checkboxButton')) {
      eventBus.publish('fmea.change.effectTypes');
    }
  }
});

const _allCheck = (data) => {
  const allDbValues = data.effectTypes.dbValue.map((value) => value.propInternalValue);
  const allUiValues = data.effectTypes.dbValue.map((value) => value.propDisplayValue);
  data.effectType.dbValue = allDbValues;
  data.effectType.uiValue = allUiValues;
};

const allCheckAction = (data) => {
  if (data.allCheckButton.dbValue) {
    data.effectType.dbValue = [];
    data.effectType.uiValue = [];
    data.allCheckButton.dispValue = '유형 전체 선택';
  } else {
    _allCheck(data);
    data.allCheckButton.dispValue = '유형 전체 해제';
  }
  data.allCheckButton.dbValue = !data.allCheckButton.dbValue;
  selectionEffectType(data);
};

export default {
  initAction,
  unMount,
  changeTab,
  selectionEffectType,
  allCheckAction,
};
