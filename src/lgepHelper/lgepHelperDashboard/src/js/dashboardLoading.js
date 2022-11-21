import app from 'app';
import appCtxService from 'js/appCtxService';
import popupService from 'js/popupService';
import _ from 'lodash';

let exports = {};
let popup_id;

/**
 * 크기를 지정하여 로딩창 열기
 * @param {string} x - width를 string 숫자값으로
 * @param {string} y - height를 string 숫자값으로
 */
async function openDashboardWindow(x, y) {
  if (x) {
    x = '800';
  }
  if (y) {
    y = '300';
  }
  let test = await popupService.show({
    declView: 'dashboardLoading',
    options: {
      reference: 'referenceId',
      isModal: true,
      clickOutsideToClose: false,
      draggable: true,
      placement: 'right-end',
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
function closeDashboardWindow(data) {
  popupService.hide(popup_id);
}

export default exports = {
  openDashboardWindow,
  closeDashboardWindow,
};

/**
 *  CommonUtil for LGEP
 */
app.factory('dashboardLoading', () => exports);
