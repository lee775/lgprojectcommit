/**
 * FMEA Master 페이지 관련 서비스
 */
import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import { initMasterDatas } from 'js/dfmeaMasterEditInitService';
import { getTableMode, isTreeTable } from 'js/utils/fmeaViewCommonUtils';
import {
  showWarnMessage,
  getLocalizedMessageByMasterView,
} from 'js/utils/fmeaMessageUtils';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import { openSubPanel, closePanel } from 'js/utils/fmeaPanelUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import { onLoadSod } from 'js/dfmeaMasterListService';
import { insertLog, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 화면 초기화
 * 이름, 리비전, 제품 등 초기화
 * @param {*} ctx
 * @returns {object}
 */
const onInit = async (ctx, data) => {
  try {
    // FMEA 정보 초기화
    const dfmeaMasterRev = await getDfmea(ctx);

    appCtxService.registerCtx(constants.FMEA_SELECT, dfmeaMasterRev);

    _setProductTitle(dfmeaMasterRev, data);

    // // 관련 Master list 초기화
    if (!ctx[constants.DFMEA_ALL_MASTER_DATA]) {
      const productName = dfmeaMasterRev.props[prop.PRODUCT].uiValues[0];
      initMasterDatas(productName);
    }

    // SOD 초기화
    if (!ctx[constants.FMEA_SOD]) {
      const productInfo = await initGroupProuct();
      await onLoadSod(productInfo);
    }

    insertLog('Load CheckList', dfmeaMasterRev.uid);
  } catch (e) {
    showErrorMessage(e);
  }
};

const _setProductTitle = (dfmeaMasterRev, data) => {
  const {
    dfmeaName: dfmeaNameTitle,
    revisionId: revisionIdTitle,
    l2Product: l2ProductTitle,
  } = data.i18n;

  const headerTitleEl = document.querySelector('aw-sublocation-title');
  const productTitleEl = document.createElement('div');
  productTitleEl.classList.add('product-title');

  const dfmeaName = dfmeaMasterRev.props[prop.OBJECT_NAME].dbValues[0];
  const revisionId = dfmeaMasterRev.props[prop.REVISION_ID].uiValues[0];
  const productName = dfmeaMasterRev.props[prop.PRODUCT].uiValues[0];

  const text = `
  ${dfmeaNameTitle} : ${constants.SPACING} ${dfmeaName} ${constants.TWOSPACING} / 
  ${constants.TWOSPACING} ${revisionIdTitle} : ${constants.SPACING} ${revisionId} ${constants.TWOSPACING} / 
  ${constants.TWOSPACING} ${l2ProductTitle}  : ${constants.SPACING} ${productName}
  `;

  productTitleEl.textContent = text;
  headerTitleEl.appendChild(productTitleEl);
};

/**
 * DFMEA 객체 리턴
 * @param {*} ctx
 * @returns {ModelObject}
 */
const getDfmea = async (ctx) => {
  const currentUrl = window.location.href;
  const uid = currentUrl.split('?s_uid=')[1];
  const dfmeaMasterRev = await loadObjectByPolicy(
    uid,
    prop.TYPE_DFMEA_MASTER_REVISION,
    [
      prop.ITEM_ID,
      prop.OBJECT_NAME,
      prop.PRODUCT,
      prop.REVISION_ID,
      prop.REF_SOD_STANDARD,
    ]
  );
  appCtxService.registerCtx(constants.FMEA_SELECT, dfmeaMasterRev);
  return dfmeaMasterRev;
};

/**
 * 이미지 테이블 <-> 트리 테이블 전환
 * @param {string} tableMode - text/image
 */
export const changeTableMode = (tableMode, data) => {
  appCtxService.registerCtx('changemode', true);
  if (data.zoomSliderProp) {
    data.zoomSliderProp.dbValues[0].sliderOption.value = 1.04;
  }
  _deleteCtx([
    constants.DFMEA_DETAIL_MODE,
    constants.DFMEA_DETAIL_INIT,
    constants.ROW_SELECT,
    constants.FMEA_SELECT_STRUCTURE,
  ]);

  if (appCtxService.ctx[constants.FMEA_PANEL]) {
    // Interaction
    closePanel();
  }

  // Tree Table default Detail View
  appCtxService.registerCtx(constants.DFMEA_TABLE_MODE, tableMode);
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    // fmea_detail_mode
    appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, true);
  } else {
    appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, true);
    return changeView(appCtxService.ctx);
  }
};

const _deleteCtx = (ctxList) => {
  for (const ctxName of ctxList) {
    delete appCtxService.ctx[ctxName];
  }
};

/**
 * 상세보기 <-> 요약보기 전환
 * Only ImageTable
 * @param {*} ctx
 */
let changeWidth = 793;
const changeView = async (ctx) => {
  const detailViewCondition = ctx[constants.DFMEA_DETAIL_MODE];

  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  appCtxService.registerCtx(constants.DFMEA_DETAIL_MODE, !detailViewCondition);

  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    eventBus.publish('dfmea.textTable.reLayout');
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_IMAGE) {
    let headerLayout = document.querySelector(
      '#scrollCtrl .tui-grid-rside-area .tui-grid-header-area'
    );
    if(document.querySelector('#toastGrid')) {
      headerLayout.style.width = changeWidth + 'px';
      changeWidth = document.querySelector('#toastGrid').offsetWidth;
    }

    eventBus.publish('dfmea.imageTable.reLayout');
  }

  if (detailViewCondition) {
    return getLocalizedMessageByMasterView('editFunction');
  } else {
    return getLocalizedMessageByMasterView('editFunction');
  }
};

/**
 * SOD 오픈
 * @param {*} ctx
 */
const openSod = async (ctx) => {
  const sod = ctx[constants.FMEA_SOD];
  if (!sod) {
    const productInfo = await initGroupProuct();
    await onLoadSod(productInfo);
  }
  fmeaPopupUtils.openInfoPopup('sodStandardPopup', 'SOD');
};

/**
 * Interaction 실행
 * @param {*} ctx
 */
const interactionAction = (ctx) => {
  const selectRow = ctx[constants.ROW_SELECT];
  if (!selectRow) {
    showWarnMessage('warnSelectRow');
    return;
  }
  if (isTreeTable()) {
    if (
      selectRow.type !== prop.TYPE_FMEA_STRUCTURE_REV ||
      selectRow.typeLevel !== prop.SUB_ASSY
    ) {
      showWarnMessage('warnNoStructureNode');
      return;
    }
  }
  openSubPanel('fmeaInteraction', 'interaction');
};

const updateSliderValue = (value, ctx) => {
  let plusBtn = document.querySelector('.sliderBtn .aw-widgets-plusButton');
  let minusBtn = document.querySelector('.sliderBtn .aw-widgets-minusButton');
  plusBtn.disabled = true;
  minusBtn.disabled = true;

  setTimeout(function () {
    let tableLayout = document.querySelector('#toastGrid');
    if (!tableLayout) {
      tableLayout = document.querySelector('#text-toastGrid');
      if (!tableLayout) {
        tableLayout = document.querySelector('#tree-table-container');
      }
    }
    
    // tableLayout.style.transform = `scale(${value})`;
    // tableLayout.style.transformOrigin = 'left top';
    tableLayout.style.zoom = value;

    let headerLayout = document.querySelector(
      '#scrollCtrl .tui-grid-rside-area .tui-grid-header-area'
    );

    if(headerLayout) {
      headerLayout.style.width = tableLayout.offsetWidth + 'px';
  
      var div = document.getElementById('scrollCtrl');
      let headerTableLayout = document.querySelector(
        '#scrollCtrl .tui-grid-rside-area .tui-grid-header-area .tui-grid-table'
      );
      headerTableLayout.style.marginLeft = '-' + div.scrollLeft / value + 'px';
      appCtxService.registerCtx(constants.FMEA_IS_RESIZE, true);

      plusBtn.disabled = false;
      minusBtn.disabled = false;
    }

  }, 260);
};

const initSliderValue = (data, ctx) => {
  data.zoomSliderProp.dbValue[0].sliderOption.value = 1.04;
};

export default {
  onInit,
  getDfmea,
  changeTableMode,
  changeView,
  openSod,
  interactionAction,
  updateSliderValue,
  initSliderValue,
};
