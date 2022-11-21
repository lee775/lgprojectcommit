/**
 * FMEA 마스터 - 고장 (생성)
 * @module js/failureCreateService
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { checkEmptyByEditor } from 'js/utils/fmeaValidationUtils';
import { makeShortenValues, initGroupProuct, insertLog } from 'js/utils/fmeaCommonUtils';
import { afterSaveAction, beforeSaveAction } from 'js/utils/fmeaViewCommonUtils';
import { createItem, reviseByRevision } from 'js/utils/fmeaTcUtils';
import { setMasterItemProperty, masterCreateAfterActionByPopup, insertLogByCreate } from 'js/cmCreateService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 고장 객체 생성
 * @param {*} ctx
 * @param {*} data
 */
const createAction = async (ctx, data) => {
  try {
    const createEditorId = prop.POTENTIAL_FAILURE_MODE + constants.CREATE_SUFFIX;

    // validation check
    checkEmptyByEditor(createEditorId);

    // button disable, progress
    beforeSaveAction(data);

    // 고장 객체 생성
    const master = await createItem(prop.TYPE_FMEA_FAILURE);

    // item setProperty
    await setMasterItemProperty(master.item);

    // revision set property
    await _setRevisionProperties(master.itemRev, createEditorId);

    insertLogByCreate(master);

    // 성공 처리
    masterCreateAfterActionByPopup('fmFailureTableGrid', ctx[constants.IS_PIN], [createEditorId], data);
  } catch (e) {
    afterSaveAction(data);
    showErrorMessage(e);
  }
};

/**
 * 고장 개정
 * @param {BomLine} baseBomline
 * @param {string} newFailureValue
 * @param {string} propName
 * @returns
 */
export const reviseFailure = async (baseBomline, newFailureValue, propName) => {
  await lgepObjectUtils.getProperties(baseBomline, [propName]);
  const baseFailureUid = baseBomline.props[propName].dbValues[0];
  const baseFailure = await lgepObjectUtils.getObject(baseFailureUid);
  const reviseFailureRev = await reviseByRevision(baseFailure);
  await _setproperties(reviseFailureRev, newFailureValue, propName);
  return reviseFailureRev;
};

const _getprops = (propName) => {
  if (propName === prop.BOMLINE_CAUSE_OF_FAILURE) {
    return [prop.CAUSE_OF_FAILURE, prop.CAUSE_OF_FAILURE_SHORT];
  }

  return [prop.FAILURE_EFFECT, prop.FAILURE_EFFECT_SHORT];
};

/**
 * 고장, 고장 요약 set property
 * @param {ModelObject} revision
 * @param {string} editor_value
 * @param {string} propName
 */
const _setproperties = async (revision, value, propName) => {
  const shortenValue = makeShortenValues(value);
  const values = [value, shortenValue];

  await lgepObjectUtils.setProperties(revision, _getprops(propName), values);
};

/**
 * 에디터 값과 에디터 값의 요약 값을 setProperty
 * + 그 외 속성 setProperties
 * @param {ModelObject} failureRev
 * @param {string} editorId
 */
const _setRevisionProperties = async (failureRev, editorId) => {
  const productInfo = await initGroupProuct();
  const productName = productInfo.value;
  const editorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(editorValue);

  const attrs = [prop.POTENTIAL_FAILURE_MODE, prop.POTENTIAL_FAILURE_MODE_SHORT, prop.PRODUCT_CATEGORY];
  const values = [editorValue, shortenValue, productName];

  await lgepObjectUtils.setProperties(failureRev, attrs, values);
};

/**
 * 에디터에서 가져온 고장 값, 고장 요약 set property
 * @param {ModelObejct} failureRev
 * @param {string} editorId
 */
export const eidtRevisionProperties = async (failureRev, editorId) => {
  const editorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(editorValue);

  const attrs = [prop.POTENTIAL_FAILURE_MODE, prop.POTENTIAL_FAILURE_MODE_SHORT];
  const values = [editorValue, shortenValue];

  await lgepObjectUtils.setProperties(failureRev, attrs, values);
};

export default {
  createAction,
};
