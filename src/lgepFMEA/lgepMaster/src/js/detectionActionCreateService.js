/**
 * Action Master Create Service
 * @module js/failureActionsCreateService
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { makeShortenValues } from 'js/utils/fmeaCommonUtils';
import { createObject } from 'js/utils/fmeaTcUtils';
import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 검출 조치 생성 및 setProperty, 고장과 연결
 * @param {ModelObject} failureRev
 */
export const createDetection = async (failureRev) => {
  // await lgepObjectUtils.getProperties([failureRev], [prop.OBJECT_NAME]);
  // const name = failureRev.props[prop.OBJECT_NAME].dbValues[0] + '_detection';
  // const detectionActionUid = await createObject(
  //   prop.TYPE_FMEA_DETECTION_ACTION,
  //   name
  // );
  // const detectionAction = await lgepObjectUtils.getObject(detectionActionUid);
  const editorId = prop.DETECTION_ACTION + constants.CREATE_SUFFIX;
  const editorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(editorValue);
  // FIXME: Failure Revision 의 속성으로 변경
  await lgepObjectUtils.setProperties(failureRev, [prop.DETECTION_ACTIONS, prop.DETECTION_ACTIONS_SHORT], [editorValue, shortenValue]);

  return failureRev;
};

/**
 * 검출조치 saveas
 * @param {ModelObject} basePrecaution
 * @param {string} newPrecatuionValue
 */
export const saveasDetection = async (baseDetection, newDetectionValue) => {
  await lgepObjectUtils.getProperties([baseDetection], [prop.OBJECT_NAME]);
  const name = baseDetection.props[prop.OBJECT_NAME].dbValues[0];
  const detectionActionUid = await createObject(prop.TYPE_FMEA_DETECTION_ACTION, name);
  const detectionAction = await lgepObjectUtils.getObject(detectionActionUid);
  const shortenValue = makeShortenValues(newDetectionValue);

  await lgepObjectUtils.setProperties(detectionAction, [prop.DETECTION_ACTION, prop.DETECTION_ACTION_SHORT], [newDetectionValue, shortenValue]);
  return detectionAction;
};
