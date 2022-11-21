/**
 * FMEA 마스터 - 구조 (생성)
 * @module js/functionCreateService
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import { setMasterItemProperty, masterCreateAfterActionByPopup, insertLogByCreate } from 'js/cmCreateService';
import { makeShortenValues, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import { afterSaveAction, beforeSaveAction } from 'js/utils/fmeaViewCommonUtils';
import { createItem } from 'js/utils/fmeaTcUtils';
import { checkEmptyByEditor } from 'js/utils/fmeaValidationUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 기능 객체 생성
 * @param {*} ctx
 * @param {*} data
 */
const createAction = async (ctx, data) => {
  try {
    const createEditorId = prop.FUNCTION + constants.CREATE_SUFFIX;

    // validation check
    checkEmptyByEditor(createEditorId);

    // button disable, progress
    beforeSaveAction(data);

    // 기능 객체 생성
    const master = await createItem(prop.TYPE_FMEA_FUNC);

    // 기능 item setProperty
    await setMasterItemProperty(master.item);

    // 기능 setProperty
    await _setRevProperties(master.itemRev, createEditorId);

    insertLogByCreate(master);

    // 성공 처리
    masterCreateAfterActionByPopup('fmFunctionTableGrid', ctx[constants.IS_PIN], [createEditorId], data);
  } catch (e) {
    afterSaveAction(data);
    showErrorMessage(e);
  }
};

/**
 * 에디터 값과 에디터 값의 요약 값을 set
 *  + 그 외 속성 setProperties
 * @param {ModelObject} functionRev
 * @param {string} editorId
 */
const _setRevProperties = async (functionRev, editorId) => {
  const productInfo = await initGroupProuct();
  const productName = productInfo.value;
  const eidtorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(eidtorValue);

  const attrs = [prop.FUNCTION, prop.FUNCTION_SHORT, prop.PRODUCT_CATEGORY];
  const values = [eidtorValue, shortenValue, productName];
  await lgepObjectUtils.setProperties(functionRev, attrs, values);
};

/**
 * 에디터 값인 기능, 기능 요약 속성 set
 */
export const eidtRevProperties = async (functionRev, editorId) => {
  const eidtorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(eidtorValue);

  const attrs = [prop.FUNCTION, prop.FUNCTION_SHORT];
  const values = [eidtorValue, shortenValue];
  await lgepObjectUtils.setProperties(functionRev, attrs, values);
};

export default {
  createAction,
};
