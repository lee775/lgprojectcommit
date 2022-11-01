// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import appCtxService from 'js/appCtxService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import com from "js/utils/lgepObjectUtils";
import soaService from 'soa/kernel/soaService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import _ from 'lodash';

let exports = {};

/**
 * 시간 지연 함수. await 와 함께 쓰면 의도적으로 hang을 걸 수 있음.
 * @param {*} millisecond 
 * @returns 
 */
export const delay = function (millisecond) {
    return new Promise(resolve => {
        setTimeout(resolve, millisecond);
    });
};

/**
 * 화면에 선택된 모든 객체들을 가져온다.
 * @returns 
 */
export const getAllSelectedList = function () {
    const ctx = appCtxService.ctx;

    let selectedList = [];

    // Parent, pselected가 있다면.. Tree 구조임.
    if (ctx.pselected) {
        selectedList.push(ctx.pselected);
    }

    ctx.mselected.forEach(element => {
        if (!selectedList.includes(element)) {
            selectedList.push(element);
        }
    });

    if (!selectedList.includes(ctx.selected)) {
        selectedList.push(ctx.selected);
    }

    return selectedList;
};

/**
 * 화면에 선택된 모든 객체들 중에 parameter로 넘겨진 타입들만 리턴함.
 * @param {*} objectType 
 * @returns 
 */
export const getSelectedObjects = function (objectType) {
    let selectedObjects = [];

    let selectedList = getAllSelectedList();
    selectedList.forEach(element => {
        if (element) {
            if (Array.isArray(objectType)) {
                if (objectType.includes(element.type)) {
                    selectedObjects.push(element);
                }
            } else {
                if (element.type == objectType) {
                    selectedObjects.push(element);
                }
            }
        }
    });

    return selectedObjects;
};

/**
 * 대상이 빈 객체인지 검사하기 위한 함수.
 * Map, Array는 원소가 없을 때, 
 * Object는 속성이 없을 때, 
 * String은 빈 String일 때,
 * null 혹은 undefined 일 때,
 * true를 반환한다. 위의 케이스가 아니라면 에러를 출력한다.
 * @param {Object} target 
 * @returns {Boolean}
 */
export const isEmpty = function (target) {
    if (!_.isBoolean(target)) {
        if (!target || target == null || target == undefined) {
            return true;
        }

        if (Array.isArray(target)) {
            if (target.length > 0) {
                return false;
            }

            return true;
        }

        if (_.isMap(target)) {
            if (target.keys().length > 0) {
                return false;
            }

            return true;
        }

        if (_.isObject(target)) {
            if (Object.keys(target).length > 0) {
                return false;
            }

            return true;
        }

        if (_.isNumber(target)) {
            return false;
        }

        if (_.isString(target)) {
            if (target.length > 0) {
                return false;
            } else {
                return true;
            }
        }
 
        let message = lgepLocalizationUtils.getLocalizedText("lgepCommonMessages", "commonFunctionFailed", "isEmpty");
        lgepMessagingUtils.showWithParams("ERROR", message);
        throw new Error(message);
    } else {
        return false;
    }
};

/**
 * user_id, division 은 접속 세션을 가져와서 체크함.
 * module_name 은 현재 접속중인 Url 가져와서 replace
 * action_name, targets, results, log_comments 는 파라미터를 전달받는다.
 * update_date는 현재 시간을 가져와서 String 타입으로 파싱
 * @param {String} actionName => getUserList, User Props Update 등. 동작을 알 수 있는 문구 입력.
 * @param {String} targets => 해당 동작이 수행되었을 때 대상 객체. 단, 전체 조회같이 객체에 의존하지 않는 작업은 공란으로 입력.
 * @param {String} results => S (성공) / E (실패)  
 * @param {String} log_comments => "Success" 혹은 Error Stack Message 전송
 */
export async function userLogsInsert (actionName,targets,results,log_comments) {
    return;
    //사용자 접속정보 구하기.
    let getTcSession = await com.getTCSessionInfo();

    let userUid = getTcSession.ServiceData.plain[0];

    let user = getTcSession.ServiceData.modelObjects[userUid];

    let getPropertiesParam = {
        objects
        : [ user ],
        attributes: [ "user_id","login_group" ]
    };
    await soaService.post( "Core-2006-03-DataManagement", "getProperties", getPropertiesParam );

    let loginName = user.props.user_id.dbValues[0];
    let division = user.props.login_group.uiValues[0];

    // URL을 통해 현재 모듈 구하기
    let thisUrl = window.location.href;
    let startIdx = thisUrl.lastIndexOf('/')+1;
    let urlLength = thisUrl.length;
    let endIdx;

    // 1차 자르기
    thisUrl = thisUrl.substring(startIdx,urlLength);

    let module_name;
    if(thisUrl.includes('?')){
        endIdx = thisUrl.indexOf('?');
        module_name = thisUrl.substring(0,endIdx);
    } else {
        module_name = thisUrl
    }

    // 날짜 구하기
    let today = new Date();

    var year = today.getFullYear();
    var month = ('0' + (today.getMonth() + 1)).slice(-2);
    var day = ('0' + today.getDate()).slice(-2);

    var dateString = year + month  + day;  //20220202

    var hours = ('0' + today.getHours()).slice(-2); 
    var minutes = ('0' + today.getMinutes()).slice(-2);
    var seconds = ('0' + today.getSeconds()).slice(-2); 

    var timeString = hours + ':' + minutes  + ':' + seconds; // 15:05:05

    var update_date = dateString + " " + timeString;

    // 프리퍼런스로 주소 가져오기
    let serviceData = await lgepPreferenceUtils.getPreference("BatchServerRestfulHosting.URL")
    let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

    let dataMap = new Map();
    dataMap.set("user_id",loginName);
    dataMap.set("division", division);
    dataMap.set("module_name",module_name);
    dataMap.set("action_name",actionName);
    dataMap.set("targets",targets);
    dataMap.set("results", results);
    dataMap.set("log_comments", log_comments);
    dataMap.set("update_date",update_date);

    await fetch(batchServerAddress+"/userLog/insertUserLogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(dataMap)),
    })
    .then((response) => {
        //console.log(response))
    }).catch((error) => {
        //console.log(`error: ${error}`)
    });
}



export default exports = {
    delay,
    getAllSelectedList,
    getSelectedObjects,
    isEmpty,
    userLogsInsert
};

/**
 *  CommonUtil for LGEP
 */
app.factory('lgepCommonUtils', () => exports);