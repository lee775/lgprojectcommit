// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import localeService from 'js/localeService';

let exports = {};

/**
 * i18n 지역화 json 파일로부터 특정 key 값의 value를 return한다.
 * 접속한 locale에 따라서 자동으로 다른 locale의 지역화 value를 return한다.
 * 지역화 value 값에 매개변수를 위한 값이 존재하는 경우, 
 * 예: 선택하신 {0} 객체는 {1} 상태이기 때문에 삭제에 실패하였습니다 -> 선택하신 LGE-1111 객체는 체크아웃 상태이기 때문에...  )
 * 
 * 지역화 json 파일은 다음과 같은 형태로 저장한다.
 * i18n/ ***** Messages.json
 * i18n/ ***** Messages_ko_KR.json
 * 
 * @param {string} jsonName - 지역화 파일 명
 * @param {string} key - json의 key 값
 * @param  {...string} args - 지역화 언어에 포함된 매개변수 란에 값을 넣기 위한 값.
 * @returns {string} 지역화 언어 value 값
 */
export const getLocalizedText = function (jsonName, key, ...args) {
    if (args.length > 0) {
        return _formatText(localeService.getLoadedTextFromKey(jsonName + "." + key), ...args);
    } else {
        return localeService.getLoadedTextFromKey(jsonName + "." + key);
    }
};

/**
 * 입력한 문자열 중 매개변수를 위한 값이 존재하는 경우, 매개변수 칸에 입력한 값을 치환해주기 위한 함수.
 * 예: 선택하신 {0} 객체는 {1} 상태이기 때문에 삭제에 실패하였습니다 -> 선택하신 LGE-1111 객체는 체크아웃 상태이기 때문에...  )
 * 
 * @param {string} text 
 * @param  {...string} args 
 * @returns {string} 매개변수로 치환된 텍스트 값
 */
const _formatText = function (text, ...args) {
    let argc = args.length;
    let output = text;
    for (let i = 0; i < argc; i++) {
        output = output.replace("{" + i + "}", args[i]);
    }
    return output;
};

export default exports = {
    getLocalizedText
};

/**
 *  접속한 locale에 따른 문자열 처리를 위한 Script
 */
app.factory('lgepLocalizationUtils', () => exports);