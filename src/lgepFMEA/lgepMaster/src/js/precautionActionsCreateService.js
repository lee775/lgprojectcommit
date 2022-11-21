/**
 * Precautio Create Service
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import { makeShortenValues, replaceEmptyValue } from 'js/utils/fmeaCommonUtils';
import { createObject } from 'js/utils/fmeaTcUtils';
import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 예방 조치 생성
 * @param {ModelObject} failureRev
 * @param {string} relatedSourceValue
 * @returns
 */
export const createPrecaution = async (failureRev, relatedSourceValue) => {
  try {
    //await lgepObjectUtils.getProperties([failureRev], [prop.OBJECT_NAME]);
    //const name = failureRev.props[prop.OBJECT_NAME].dbValues[0] + '_precaution';
    //const precautionActionUid = await createObject(
    //  prop.TYPE_FMEA_PREACUTION_ACTION,
    //  name
    //);
    //const precautionAction = await lgepObjectUtils.getObject(
    //  precautionActionUid
    //);
    const editorId = prop.PRECATUIONS_ACTION + constants.CREATE_SUFFIX;
    const editorValue = getEditorValueById(editorId);
    const shortenValue = makeShortenValues(editorValue);
    const relatedSourceReplaceValue = replaceEmptyValue(relatedSourceValue);
    // FIXME: Failure Revision 의 속성으로 저장하는것으로 변경
    await lgepObjectUtils.setProperties(
      failureRev,
      [prop.PRECATUION_ACTION, prop.PRECATUION_ACTION_SHORT, prop.RELATED_SOURCES],
      [editorValue, shortenValue, relatedSourceReplaceValue],
    );
    return failureRev;
  } catch (e) {
    //console.log(e);
  }
};

/**
 * 예방조치 saveas
 * @param {ModelObject} basePrecaution
 * @param {string} newPrecatuionValue
 */
export const saveasPrecaution = async (basePrecaution, newPrecatuionValue) => {
  await lgepObjectUtils.getProperties([basePrecaution], [prop.OBJECT_NAME, prop.RELATED_SOURCES]);
  const name = basePrecaution.props[prop.OBJECT_NAME].dbValues[0];

  const precautionActionUid = await createObject(prop.TYPE_FMEA_PREACUTION_ACTION, name);
  const precautionAction = await lgepObjectUtils.getObject(precautionActionUid);
  const shortenValue = makeShortenValues(newPrecatuionValue);
  const relatedSourceValue = basePrecaution.props[prop.RELATED_SOURCES].dbValues[0];
  const values = [newPrecatuionValue, shortenValue, replaceEmptyValue(relatedSourceValue)];
  await lgepObjectUtils.setProperties(precautionAction, [prop.PRECATUIONS_ACTION, prop.PRECATUIONS_ACTION_SHORT, prop.RELATED_SOURCES], values);
  return precautionAction;
};
