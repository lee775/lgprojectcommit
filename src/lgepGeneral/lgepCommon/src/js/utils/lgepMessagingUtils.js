// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import msgService from 'js/messagingService';
import eventBus from 'js/eventBus';

let exports = {};

export const INFORMATION = "INFO";
export const WARNING = "WARNING";
export const ERROR = "ERROR";

/**
 * 팀센터 메시지 박스를 출력하기 위한 함수.
 * 
 * @param {string|number} type - INFO (1), WARNING (2), ERROR (3)
 * @param {string} text - 텍스트 메시지
 * @param {string|Array<string>} buttonTexts - 버튼 메시지, 배열로 입력시 버튼 여러개 생성됨.
 * @param {function|Array<function>} buttonActions - 버튼 클릭 시의 동작 함수를 매개변수로 받는다.
 */
export const show = function (type = "INFO", text, buttonTexts, buttonActions) {
    let buttonArray = _createButtonArray(buttonTexts, buttonActions);
    if (type == INFORMATION || type == 0) {
        msgService.showInfo(text, "", "", buttonArray);
    } else if (type == WARNING || type == 1) {
        msgService.showWarning(text, buttonArray);
    } else if (type == ERROR || type == 2) {
        msgService.showError(text, "", "", buttonArray);
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
export const showWithParams = function (type = "INFO", text, msgArray = [], buttonTexts, buttonActions) {
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
        onClick: callback
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
            buttonArray.push(_createButton(buttonTexts[i], function ($noty) {
                $noty.close();
                if (buttonActions[i]) {
                    buttonActions[i]();
                }
            }));
        }
    }
    return buttonArray;
};

export function closeMessages() {
    eventBus.publish('removeMessages');
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
    closeMessages
};
app.factory('lgepMessagingUtils', () => exports);