// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import appCtxService from 'js/appCtxService';
import msgService from 'js/messagingService';
import eventBus from 'js/eventBus';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

let exports = {};

export const INFO = 'info';
export const INFORMATION = 'INFO';
export const WARNING = 'WARNING';
export const ERROR = 'ERROR';

/**
 * 팀센터 메시지 박스를 출력하기 위한 함수.
 *
 * @param {string|number} type - INFO (1), WARNING (2), ERROR (3)
 * @param {string} text - 텍스트 메시지
 * @param {string|Array<string>} buttonTexts - 버튼 메시지, 배열로 입력시 버튼 여러개 생성됨.
 * @param {function|Array<function>} buttonActions - 버튼 클릭 시의 동작 함수를 매개변수로 받는다.
 */
export const show = function (type = 'INFO', text, buttonTexts, buttonActions) {
  let buttonArray = _createButtonArray(buttonTexts, buttonActions);
  if (type == INFORMATION || type == 0) {
    msgService.showInfo(text, '', '', buttonArray);
  } else if (type == WARNING || type == 1) {
    msgService.showWarning(text, buttonArray);
  } else if (type == ERROR || type == 2) {
    msgService.showError(text, '', '', buttonArray);
  }
};

/**
 * 팀센터 메시지 박스를 출력하기 위한 함수.
 *
 * @param {string|number} type - INFO (1), WARNING (2), ERROR (3)
 * @param {string} text - 텍스트 메시지
 * @param {string|Array<string>} msgArray - 텍스트 메시지가 {0}, {1} 과 같은 형태로 매개변수를 받는 경우 이 변수를 통해 값을 넣을 수 있다.
 * @param {string|Array<string>} buttonTexts - 버튼 메시지, 배열로 입력시 버튼 여러개 생성됨.
 * @param {function|Array<function>} buttonActions - 버튼 클릭 시의 동작 함수를 매개변수로 받는다.
 */
export const showWithParams = function (type = 'INFO', text, msgArray = [], buttonTexts, buttonActions) {
  show(type, msgArray.length == 0 ? text : msgService.applyMessageParamsWithoutContext(text, msgArray), buttonTexts, buttonActions);
};

/**
 * 버튼을 생성하기 위하여 사용되는 함수.
 *
 * @param {String} text 버튼 텍스트
 * @param {AsyncFunction} callback 버튼 클릭 시의 동작 함수
 * @returns {Object} button Object
 */
const _createButton = function (text, callback, buttonType = 'btn btn-notify') {
  return {
    addClass: buttonType,
    text: text,
    onClick: callback,
  };
};

/**
 *
 * @param {*} buttonTexts
 * @param {*} buttonActions
 * @returns
 */
const _createButtonArray = function (buttonTexts, buttonActions) {
  let buttonArray = [];
  if (buttonTexts && !Array.isArray(buttonTexts)) {
    buttonTexts = [buttonTexts];
  }
  if (buttonActions && !Array.isArray(buttonActions)) {
    buttonActions = [buttonActions];
  }
  if (buttonTexts) {
    for (let i = 0; i < buttonTexts.length; i++) {
      buttonArray.push(
        _createButton(buttonTexts[i], function ($noty) {
          $noty.close();
          if (buttonActions[i]) {
            buttonActions[i]();
          }
        }),
      );
    }
  }
  return buttonArray;
};

export function closeMessages() {
  eventBus.publish('removeMessages');
}

/**
 *
 * @param {string} title 알림 메시지 제목
 * @param {string} content 알림 메시지 내용
 * @param {string} targetObjectUid 첨부 객체의 UID
 * @param {string} receiverUserUid 받는 유저의 UID
 * @param {string} sender 보내는 이 (Default 현재 세션 유저)
 * @param {Date} date 보낸 날짜 (Default 현재 시각)
 * @param {string} priorty 우선 순위 (Default Normal)
 * @param {string} msgType 메시지 종류(Default SUB_MAN - 뉴스 알림)
 * @returns
 */
export function sendAlarmMessage(
  title,
  content,
  targetObjectUid,
  receiverUserUid,
  sender = appCtxService.ctx.user.uid,
  date = new Date(),
  priorty = 'Normal',
  msgType = 'REPORTS',
) {
  return lgepObjectUtils.createRelateAndSubmitObjects2('Fnd0Message', {
    fnd0Subject: [title],
    fnd0Priority: [priorty],
    fnd0ApplicationType: [msgType],
    fnd0Sender: [sender],
    fnd0SentDate: [_dateTo_GMTString(date)],
    fnd0Receiver: [receiverUserUid],
    fnd0MessageBody: [content],
    fnd0TargetObject: [targetObjectUid],
  });
}

/**
 *
 * @param {*} date
 * @returns
 */
function _dateTo_GMTString(date) {
  date = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  var MM = date.getMonth() + 1;
  MM = MM < 10 ? '0' + MM : MM;
  var dd = date.getDate();
  dd = dd < 10 ? '0' + dd : dd;
  let hh = date.getHours();
  hh = hh < 10 ? '0' + hh : hh;
  var mm = date.getMinutes();
  mm = mm < 10 ? '0' + mm : mm;
  var ss = date.getSeconds();
  ss = ss < 10 ? '0' + ss : ss;
  return date.getFullYear() + '-' + MM + '-' + dd + 'T' + hh + ':' + mm + ':' + ss + date.toString().slice(28, 33);
}

/**
 * 알림 메시지 생성을 위한 클래스
 */
export default exports = {
  INFORMATION,
  WARNING,
  ERROR,
  show,
  showWithParams,
  closeMessages,
  sendAlarmMessage,
};
app.factory('lgepMessagingUtils', () => exports);
