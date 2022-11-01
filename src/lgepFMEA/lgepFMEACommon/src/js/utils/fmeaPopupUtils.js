import popupService from 'js/popupService';
import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import { initActionInEditors } from 'js/cmCreateService';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 팝업 close 및 ctx 처리
 */
const closePopup = function () {
  popupService.hide();
  appCtxService.registerCtx(constants.FMEA_POPUP, false);
  delete appCtxService.ctx[constants.IS_PIN];
};

/**
 * 팝업 open 및 ctx 처리
 */
const _initPopupCtx = () => {
  appCtxService.registerCtx(constants.IS_PIN, false);
  appCtxService.registerCtx(constants.FMEA_POPUP, true);
};

/**
 * FMEA row 추가창 호출
 * @param {string} htmlPanel - 삽입할 뷰
 * @param {string} title - View Title
 * @returns
 */
const openDfmeaAddPopup = (htmlPanel, title) => {
  const inputParam = {
    declView: htmlPanel,
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 900,
      height: 900,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          _initPopupCtx();
          eventBus.publish('dfmeaadd.onmount');
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

/**
 * FMEA 생성창 호출
 * @param {string} htmlPanel - 삽입할 뷰
 * @param {string} title - View Title
 * @returns
 */
const openDfmeaCreatePopup = (htmlPanel, title) => {
  const inputParam = {
    declView: htmlPanel,
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 700,
      height: 260,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          _initPopupCtx();
          eventBus.publish('dfmeacreate.onmount');
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

/**
 * 마스터 생성창 호출
 * @param {string} htmlPanel - 삽입할 뷰
 * @param {string} title - View Title
 * @param {string} type - 생성할 아이템 타입 (ex. L2_FMEAFunc)
 * @returns
 */
const openMasterCreatePopup = (htmlPanel, title, type) => {
  const inputParam = {
    declView: htmlPanel,
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 860,
      height: 660,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          _initPopupCtx();
          initActionInEditors(type);
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

const openInfoPopup = (htmlPanel, title) => {
  const inputParam = {
    declView: htmlPanel,
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 1400,
      height: 600,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          appCtxService.registerCtx(constants.FMEA_POPUP, true);
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

/**
 * FMEA 복제창 호출
 * @param {string} title - View Title
 * @returns
 */
const openMasterDuplicateName = (title) => {
  const inputParam = {
    declView: 'dfmeaDuplicateName',
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 700,
      height: 240,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          _initPopupCtx();
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

const openCellEditorPopup = (title) => {
  const inputParam = {
    declView: 'dfmeaCellEditorPopup',
    locals: {
      caption: title,
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 850,
      height: 650,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          appCtxService.registerCtx(constants.FMEA_POPUP, true);
          eventBus.publish('dfmea.celledit');
        },
        whenClosed: () => {
          closePopup();
        },
      },
    },
  };
  return popupService.show(inputParam);
};

export default {
  closePopup,
  openMasterCreatePopup,
  openDfmeaCreatePopup,
  openDfmeaAddPopup,
  openInfoPopup,
  openMasterDuplicateName,
  openCellEditorPopup,
};
