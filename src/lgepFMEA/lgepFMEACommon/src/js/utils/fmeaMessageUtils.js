/**
 * FMEA MessageUtil Util
 * @module js/fmeaMessageUtils
 */
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';

const FMEA_MESSAGE = 'lgepDFMEAMessages';
const FMEA_MASTER_MESSAGE = 'lgepMasterMessages';
const FMEA_VIEW_MESSAGE = 'lgepDFMEAViewMessages';

export const TYPE_INFO = 'INFO';
const TYPE_WARNING = 'WARNING';
const TYPE_ERROR = 'ERROR';

const SUCCESS_SAVE = 'successSave';
const SUCCESS_SAVE_EDIT = 'successEditSave';
const MSG_ERROR_EMPTY = 'errorEmptyCheck';

/**
 * 에러 메시지 호출
 * @param {string} msg
 */
export const showErrorMessageByText = (msg) => {
  const message = getLocalizedMessageByMaster(msg);
  lgepMessagingUtils.show(TYPE_INFO, message);
};

/**
 * 에러 메시지 호출
 * @param {Error} e
 */
export const showErrorMessage = (e) => {
  //console.log(e);
  const message = getLocalizedMessageByMaster('errorExcute');
  lgepMessagingUtils.show(TYPE_ERROR, message);
};

/**
 * lgepDFMEAMessages의 i18n 지역화 후 리턴
 * @param {string} text
 * @param  {...any} args
 * @returns
 */
export const getLocalizedMessage = (text, ...args) => {
  return getLocalizedText(FMEA_MESSAGE, text, ...args);
};

/**
 * lgepMasterMessages i18n 지역화 후 리턴
 * @param {string} text
 * @param  {...any} args
 * @returns
 */
export const getLocalizedMessageByMaster = (text, ...args) => {
  return getLocalizedText(FMEA_MASTER_MESSAGE, text, ...args);
};

export const getLocalizedMessageByMasterView = (text, ...args) => {
  return getLocalizedText(FMEA_VIEW_MESSAGE, text, ...args);
};

/**
 * 지역화함
 * @param {string} fileName
 * @param {string} text
 * @param  {...any} args
 * @returns
 */
export const getLocalizedText = (fileName, text, ...args) => {
  const message = lgepLocalizationUtils.getLocalizedText(fileName, text, ...args);
  return message;
};

/**
 * 저장 성공 메시지창 호출
 */
export const showSaveMessage = () => {
  const message = getLocalizedMessageByMaster(SUCCESS_SAVE);
  lgepMessagingUtils.show(TYPE_INFO, message);
};

/**
 * 편집 저장 성공 메시지 창 호출
 */
export const showEditSuccessMsg = () => {
  const message = getLocalizedMessageByMaster(SUCCESS_SAVE_EDIT);
  lgepMessagingUtils.show(TYPE_INFO, message);
};

/**
 * 빈 값 에러 메시지 리턴
 * @returns {string}
 */
export const getErrorEmptyMsg = () => {
  const message = getLocalizedMessage(MSG_ERROR_EMPTY);
  return message;
};

/**
 * 성공 메시지창 호출
 */
export const showInfoMessage = (msg) => {
  const message = getLocalizedMessage(msg);
  lgepMessagingUtils.show(TYPE_INFO, message);
};

/**
 * 경고 메시지창 호출
 */
export const showWarnMessage = (msg) => {
  const message = getLocalizedMessage(msg);
  lgepMessagingUtils.show(TYPE_WARNING, message);
};
