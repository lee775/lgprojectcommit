/**
 * interaction Service
 * @module js/interactionService
 */
import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';

import { isTreeTable } from 'js/utils/fmeaViewCommonUtils';
import { allImageResetStyles } from 'js/dfmeaMasterTableInteractionService';
import popupService from 'js/popupService';

import * as constants from 'js/constants/fmeaConstants';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

// Interaction Matrix Popup Open
const openInteraction = (ctx) => {
  const inputParam = {
    declView: 'interactionMatrix',
    locals: {
      caption: 'Interaction Matrix',
      anchor: 'closePopupAnchor',
    },
    options: {
      width: 1440,
      height: 950,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenClosed: () => {
          delete appCtxService.ctx[constants.FMEA_INERATION_INIT];
        },
      },
    },
  };
  popupService.show(inputParam);
};

// Interaction select action
const selectTableRowAction = (select, ctx) => {
  appCtxService.registerCtx(constants.INTERACTION_ROW, select);
  const tableMode = ctx[constants.DFMEA_TABLE_MODE];

  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    eventBus.publish('fmea.treeTable.focusInteraction');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    eventBus.publish('fmea.textTable.focusInteraction');
  } else {
    eventBus.publish('fmea.imageTable.focusInteraction');
  }
};

const changeTab = (ctx) => {
  if (!ctx[constants.INTERACTION_ROW]) {
    return;
  }
  // reset 마지막으로 선택한 interaction row 제거
  delete appCtxService.ctx[constants.INTERACTION_ROW];
  appCtxService.registerCtx(
    constants.ROW_SELECT,
    ctx[constants.INTERACTION_INIT_ROW_SELECT]
  );

  // Interaction Table에서 선택한 흔적 제거
  if (isTreeTable()) {
    eventBus.publish('fmea.treeTable.initSelect');
  } else if (
    ctx[constants.DFMEA_TABLE_MODE] === constants.DFMEA_TABLE_MODE_KEY_TEXT
  ) {
    allImageResetStyles();
    eventBus.publish('fmea.textTable.initSelect');
  } else {
    allImageResetStyles();
    eventBus.publish('fmea.imageTable.initSelect');
  }
};

const unMount = async (ctx) => {
  const initRowSelection = ctx[constants.INTERACTION_INIT_ROW_SELECT];
  appCtxService.registerCtx(constants.ROW_SELECT, initRowSelection);
  // 1. selection 초기화
  resetSelection(ctx);
  await lgepCommonUtils.delay(1000);
  unMountCtx();
};

const resetSelection = (ctx) => {
  const tableMode = ctx[constants.DFMEA_TABLE_MODE];
  // 2. init css 초기화
  // 3. focus 초기화
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    initReset();
    eventBus.publish('fmea.treeTable.initRest');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    eventBus.publish('fmea.textTable.initRest');
    allImageResetStyles();
  } else {
    eventBus.publish('fmea.imageTable.initRest');
    allImageResetStyles();
  }
};

const initReset = () => {
  const initLines = document.querySelectorAll(
    `#${constants.INTERACTION_INIT_SELECT_CLASSNAME}`
  );
  for (const line of initLines) {
    line.removeAttribute('id');
  }
};

const unMountCtx = () => {
  delete appCtxService.ctx[constants.INTERACTION_INIT_ROW_SELECT];
  delete appCtxService.ctx[constants.INTERACTION_ROW];
};

export default {
  selectTableRowAction,
  openInteraction,
  unMount,
  changeTab,
};
