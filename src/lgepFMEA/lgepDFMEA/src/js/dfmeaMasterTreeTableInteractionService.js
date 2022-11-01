import appCtxService from 'js/appCtxService';

import * as constants from 'js/constants/fmeaConstants';

/**
 * Interaction 실행할 구조 라인 css 적용
 * 선택한 파트 css 적용
 * @param {} ctx
 */
export const initTreeSelectRow = () => {
  const id = constants.INTERACTION_INIT_SELECT_CLASSNAME;
  constants.INTERACTION_INIT_SELECT_CLASSNAME;
  const selectEls = document.querySelectorAll(
    '.aw-splm-tableRow[aria-selected="true"]'
  );
  for (const selectEl of selectEls) {
    selectEl.setAttribute('id', id);
  }
};

const focusRowByInteraction = (ctx, provider) => {
  const interactionRowUid = appCtxService.ctx[constants.INTERACTION_ROW].uid;
  const node = _getNodeByUid(interactionRowUid, provider);
  provider.selectionModel.setSelection(node);
};

const _getNodeByUid = (uid, provider) => {
  const nodes = provider.viewModelCollection.loadedVMObjects;
  for (const node of nodes) {
    if (node.uid === uid) {
      return node;
    }
  }
};

// change tab시 선택한 파트 select로
const initSelect = (provider) => {
  const initSelect = appCtxService.ctx[constants.INTERACTION_INIT_ROW_SELECT];
  const node = _getNodeByUid(initSelect.uid, provider);
  provider.selectionModel.setSelection(node);
};

/**
 * 선택한 구조 Node의 이름 반환
 * @param {*} selectRow
 * @returns
 */
export const getTreePartName = (selectRow) => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  return selectRow.displayName;
};

export default {
  focusRowByInteraction,
  initSelect,
  // initRest,
};
