/**
 * FMEA MessageUtil Util
 * @module js/fmeaMessageUtils
 */
import { getLocalizedMessage, getErrorEmptyMsg } from 'js/utils/fmeaMessageUtils';
import { emptryCheck } from 'js/utils/fmeaEditorUtils';

import * as prop from 'js/constants/fmeaProperty';

const OBJECT_NAME_CHECK = [prop.OBJECT_NAME, 128];
const CHECK_PROPS = [OBJECT_NAME_CHECK];

const MSG_ERROR_LENGTH = 'errorLenghtCheck';

/**
 * null, undefined 체크
 * 길이 체크
 * @param {ViewModelProperty[]} inputDatas
 */
export const validationInputs = (inputDatas) => {
  for (const inputData of inputDatas) {
    const { propertyName, dbValue, propertyDisplayName } = inputData;
    emptyCheck(dbValue);
    checkPropLength(propertyName, dbValue, propertyDisplayName);
  }
};

/**
 * null, undefined 체크
 * @param {ViewModelProperty} inputValue
 */
export const validationInput = (inputData) => {
  return validationInputs([inputData]);
};

/**
 * 입력 값의 null/undefined 체크
 * @param {string[]} value - 보통 property의 dbValues
 */
export const emptyCheck = (value) => {
  if (!value || !value[0]) {
    throw new Error(getErrorEmptyMsg());
  }
};

/**
 * 입력값의 유효 길이 체크
 * @param {string} propName
 * @param {string} propValue
 */
export const checkPropLength = (propName, propValue, displayName) => {
  for (const CHECK of CHECK_PROPS) {
    const [name, len] = CHECK;
    if (propName !== name) {
      continue;
    }
    if (propValue.length >= len) {
      throw new Error(getLocalizedMessage(MSG_ERROR_LENGTH, displayName, len));
    }
  }
};

/**
 * 해당 id가진 에디터의 빈 값 체크
 * @param {string} editors  - editor id
 */
export const checkEmptyByEditor = (editor) => {
  checkEmptyByEditors([editor]);
};

/**
 * 해당 id가진 에디터의 빈 값 체크
 * @param {string[]} editors  - editor ids
 */
export const checkEmptyByEditors = (editors) => {
  if (emptryCheck(editors)) {
    throw new Error(getErrorEmptyMsg());
  }
};
