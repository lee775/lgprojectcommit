// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import popupService from 'js/popupService';

let exports = {};

const initParams = function (
  view,
  caption = 'popup',
  width = 300,
  height = 300,
  isModal = true,
  draggable = true,
  closable = true,
  reference,
  placement,
  openHookFunction,
  closeHookFunction,
) {
  let params = {
    declView: view,
    locals: {
      anchor: 'closePopupAnchor',
      caption: caption,
      hasCloseButton: true,
    },
    options: {
      clickOutsideToClose: false,
      draggable: draggable,
      isModal: isModal,
      // placement: "bottom-start",
      // reference: "referenceId",
      width: width,
      height: height,
      hooks: {
        whenOpened: (res) => {
          if (openHookFunction) {
            openHookFunction(res);
          }
        },
        whenClosed: (res) => {
          if (closeHookFunction) {
            closeHookFunction(res);
          }
        },
      },
    },
  };

  if (closable) {
    params.locals['anchor'] = 'aw_popupAnchor';
  }
  if (reference) {
    params.options['reference'] = reference;

    if (!placement) {
      placement = 'bottom-start';
    }
    params.options['placement'] = placement;
  }

  return params;
};

export const openPopup = function (view, caption = 'popup', width = 300, height = 300, isModal = true, draggable = true, closable = true) {
  return popupService.show(initParams(view, caption, width, height, isModal, draggable, closable));
};

/**
 * 팝업 열기
 *
 * @param {*} view - view 이름(xxxView.html 일 경우 xxx)
 * @param {*} caption - 타이틀
 * @param {*} width - 가로
 * @param {*} height - 세로
 * @param {*} isModal - 모달 여부
 * @param {*} draggable - 드래그 여부
 * @param {*} closable - Close 허용 여부 ( Close 버튼 표시 )
 * @param {*} reference - 모달이 참조하는 엘리먼트
 * @param {*} placement - reference 기준으로 팝업을 배치할 위치를 지정
 * @param {*} openHookFunction - 팝업 오픈 시 콜백함수
 * @param {*} closeHookFunction - 팝업 종료 시 콜백함수
 * @returns
 */
export const openPopup2 = function (
  view,
  caption = 'popup',
  width = 300,
  height = 300,
  isModal = true,
  draggable = true,
  closable = true,
  reference,
  placement,
  openHookFunction,
  closeHookFunction,
  closeByClickOutside = false,
) {
  let params = initParams(view, caption, width, height, isModal, draggable, closable, reference, placement, openHookFunction, closeHookFunction);
  params.options.clickOutsideToClose = closeByClickOutside;
  return popupService.show(params);
};

/**
 *
 * @param {*} popupEl - 팝업 엘리먼트, 값이 없으면 hideById 함수를 통해 모든 팝업을 종료시킨다.
 * @returns
 */
export const closePopup = function (popupEl) {
  return popupService.hide(popupEl);
};

export default exports = {
  openPopup,
  openPopup2,
  closePopup,
};
app.factory('lgepPopupUtils', () => exports);
