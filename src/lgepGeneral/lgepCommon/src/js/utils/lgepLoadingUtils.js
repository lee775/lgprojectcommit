import app from 'app';
import appCtxService from 'js/appCtxService';
import popupService from 'js/popupService';
import _ from 'lodash';

let exports = {};
let popup_id;

/**
 * 크기를 지정하여 로딩창 열기
 * @param {string} x - width를 숫자로
 * @param {string} y - height를 숫자로
 */
async function openWindow(x, y, place) {
  if (!place) {
    place = 'bottom-start';
  }
  let test = await popupService.show({
    declView: 'knowledgeLoading',
    options: {
      reference: 'referenceId',
      isModal: true,
      clickOutsideToClose: false,
      draggable: true,
      placement: 'bottom-start',
      height: y,
      width: x,
    },
  });
  popup_id = test.id;
}

/**
 * 현재 열려 있는 로딩창 닫기
 * @param {data} data - 현재 화면의 data값을 넣는다.
 */
function closeWindow(data) {
  popupService.hide(popup_id);
}

export default exports = {
  openWindow,
  closeWindow,
};

/**
 *  CommonUtil for LGEP
 */
app.factory('lgepLoadingUtils', () => exports);
