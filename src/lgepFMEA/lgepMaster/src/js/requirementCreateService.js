/**
 * Requirement Master Create
 * @module js/requirementCreateService
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import { makeShortenValues } from 'js/utils/fmeaCommonUtils';
import { reviseByRevision, createItem } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 *
 * 요구사항 생성 및 setProperty, setReference
 * FIXME: Failure Revision 의 속성으로 저장
 * @param {ModelObject} functionRevision
 */
export const createRequirementByCreate = async (failureRev) => {
  try {
    // 1. 요구사항 생성 (제거)
    //const requirementRev = await _createRequirement();

    // 2. 요구사항 setProperty
    const editorId = prop.REQUIREMENT + constants.CREATE_SUFFIX;
    await _setRevProperties(failureRev, editorId);

    // 3. 기능-요구사항 연결 제거
    //await lgepObjectUtils.addChildren(
    //  functionRev,
    //  [requirementRev],
    //  prop.REF_REQUIREMENTS
    //);

    return failureRev;
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * 요구사항 개정
 * @param {BomLine} baseBomline
 * @param {ModelObject} requirementValue
 * @returns
 */
export const reviseRequirement = async (baseBomline, requirementValue) => {
  const baseRequirementUid = baseBomline.props[prop.BOMLINE_REQUIREMENT].dbValues[0];
  const baseRequirement = await lgepObjectUtils.getObject(baseRequirementUid);

  const reviseRequirementRev = await reviseByRevision(baseRequirement);
  const shortenValue = makeShortenValues(requirementValue);

  await lgepObjectUtils.setProperties(reviseRequirementRev, [prop.REQUIREMENT, prop.REQUIREMENT_SHORT], [requirementValue, shortenValue]);
  return reviseRequirementRev;
};

/**
 * 에디터 값과 에디터 값의 요약 값을 setProperty
 * shorten value 처리
 * @param {ModelObject} requirementRev
 * @param {string} editorId
 */
const _setRevProperties = async (requirementRev, editorId) => {
  const editorValue = getEditorValueById(editorId);
  const shortenValue = makeShortenValues(editorValue);

  const attrs = [prop.FUNCTION_REQUIREMENTS, prop.FUNCTION_REQUIREMENTS_SHORT];
  const values = [shortenValue, editorValue];
  await lgepObjectUtils.setProperties(requirementRev, attrs, values);
};

/**
 * 요구 사항 객체 생성
 * @returns Requirement ItemRev
 */
const _createRequirement = async () => {
  try {
    const requirement = await createItem(prop.TYPE_FMEA_REQ);
    const requirementRev = requirement.itemRev;
    return requirementRev;
  } catch (e) {
    throw new Error(e);
  }
};
