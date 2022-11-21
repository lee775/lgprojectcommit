/**
 * DFMEA Master Row 추가 서비스
 */
import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import appCtxService from 'js/appCtxService';

import { createPrecaution } from 'js/precautionActionsCreateService';
import { createDetection } from 'js/detectionActionCreateService';
import { createRequirementByCreate } from 'js/requirementCreateService';
import { makeShortenValues, replaceEmptyValue, insertLog } from 'js/utils/fmeaCommonUtils';
import { getSelectItemRev } from 'js/utils/fmeaViewCommonUtils';
import { saveAsItemToRev, saveCloseBomWindow, recursionRevise } from 'js/utils/fmeaTcUtils';
import { getEditorValueById } from 'js/utils/fmeaEditorUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';
import { calculateAp } from 'js/calculationActionPriority';

let masterDatas; // 현재 FMEA Master 제품 관련된 기능/고장 마스터 리스트
let fmeaRevId; // 현재 FMEA Master의 revision ID
let reviseRev; // ReviseFMEA Master Revision

/**
 * FMEA Row Add Operation
 * @param {*} ctx
 * @param {*} data
 */
export const saveOperation = async (ctx, data) => {
  const dfmeaRev = await _getFmeaRev(ctx);
  await _addRow(dfmeaRev, data, ctx);

  insertLog('Add CheckList Row', dfmeaRev.uid);

  return reviseRev;
};

/**
 * FMEA Master 생성 후 첫 편집 Operation인 경우는 개정 x
 * @param {*} ctx
 * @returns {ModelObejct}
 */
const _getFmeaRev = async (ctx) => {
  const dfmeaRev = ctx[constants.FMEA_SELECT];
  const tableList = ctx[constants.FMEA_TABLE_LIST];
  const isInitView = ctx[constants.INIT_CREATE_VIEW];

  appCtxService.registerCtx(constants.INIT_CREATE_VIEW, true);
  await _setCurrentFmeaRevId(dfmeaRev);
  return dfmeaRev;

  // if (isInitView || !tableList || tableList.length === 0) {
  //   appCtxService.registerCtx(constants.INIT_CREATE_VIEW, true);
  //   await _setCurrentFmeaRevId(dfmeaRev);
  //   return dfmeaRev;
  // } else {
  //   const reviseRevision = await reviseByRevision(dfmeaRev);
  //   reviseRev = reviseRevision;

  //   // 구조 전체 개정
  //   await allReviseBomlines(
  //     reviseRevision,
  //     fmeaRevId,
  //     prop.TYPE_FMEA_STRUCTURE_REV
  //   );

  //   // 기능 전체 개정
  //   await allReviseBomlines(
  //     reviseRevision,
  //     fmeaRevId,
  //     prop.TYPE_FMEA_FUNC_REVISION
  //   );

  //   // 고장 전체 개정
  //   await allReviseBomlines(
  //     reviseRevision,
  //     fmeaRevId,
  //     prop.TYPE_FMEA_FAILURE_REVISION
  //   );

  //   await _setCurrentFmeaRevId(reviseRevision);

  //   return reviseRevision;
  // }
};

// 현재 FMEA Master의 Revision ID 저장
const _setCurrentFmeaRevId = async (dfmeaRev) => {
  await lgepObjectUtils.getProperties([dfmeaRev], [prop.REVISION_ID]);
  fmeaRevId = dfmeaRev.props[prop.REVISION_ID].dbValues[0];
};

/**
 * FMEA Line 추가 Operation
 * @param {ModelObject} dfmeaRev
 * @param {*} data
 * @param {*} ctx
 */
const _addRow = async (dfmeaRev, data, ctx) => {
  const bom = await lgepBomUtils.createBOMWindow(null, dfmeaRev);
  const topLine = bom.bomLine;
  let bomWindow = bom.bomWindow;
  try {
    const {
      functionData,
      l2Severity: {
        dbValues: [severity],
      },
      l2Occurence: {
        dbValues: [occurence],
      },
      l2Detection: {
        dbValues: [detection],
      },
      l2RelatedSources,
    } = data;

    masterDatas = ctx[constants.DFMEA_ALL_MASTER_DATA];

    // 구조 save as
    const structureBomline = await _saveAsStructure(data, topLine);

    // 기능 save as
    const newFunctionData = await _saveFunctionAction(functionData, structureBomline);

    // 요구사항 생성(Original)
    //const requirementRev = await createRequirementByCreate(
    //  newFunctionData.revision
    //);

    // 고장 save as
    const failureData = await _saveAsFailure(data, newFunctionData.bomLine);

    // 요구사항 생성(Original)
    const requirementRev = await createRequirementByCreate(failureData.revision);

    // 예방 조치 생성
    const precautionAction = await createPrecaution(failureData.revision, l2RelatedSources.dbValue);

    // 검출 조치 생성
    const detectionAction = await createDetection(failureData.revision);

    // AP 계산
    const actionPriority = _getActionPriority(severity, occurence, detection);

    // NOTE TYPE
    const noteData = [
      requirementRev.uid,
      precautionAction.uid,
      detectionAction.uid,
      failureData.failureEffect,
      failureData.causeOfFailure,
      replaceEmptyValue(severity),
      replaceEmptyValue(occurence),
      replaceEmptyValue(detection),
      actionPriority,
    ];
    await _setNoteTypes(failureData.bomLine, noteData);
  } catch (e) {
    throw new Error(e);
  } finally {
    saveCloseBomWindow(bomWindow);
  }
};
const _getActionPriority = (severity, occurence, detection) => {
  if (!severity || !occurence || !detection) {
    return '';
  }

  const ap = calculateAp(severity, occurence, detection);
  return ap;
};
/**
 * 구조 Saveas (상위 / 하위 / 단품)
 * 최하위 구조 봄라인 반환
 * @param {*} data
 * @param {BomLine} topLine
 * @returns {BomLine}
 */
const _saveAsStructure = async (data, topLine) => {
  try {
    const { parentAssy, subAssy, singleItem } = data;
    if (singleItem.dbValue && !subAssy.dbValue) {
      throw new Error('하위 Assy 없이 단품을 선택 할 수 없습니다');
    }
    const { parentAssyList: parentAssys, subAssyList: subAssys, singleAssyList: singleAssys } = masterDatas[constants.MASTER_DATA_KEY_STRUCTURE];

    // 상위 ASSY
    const parentAssyBomline = await _getStructureBomLineBySaveAs(parentAssys, parentAssy, topLine);
    if (!subAssy.dbValue) {
      return parentAssyBomline;
    }
    // 하위 ASSY
    const subAssyBomline = await _getStructureBomLineBySaveAs(subAssys, subAssy, parentAssyBomline);
    if (!singleItem.dbValue) {
      return subAssyBomline;
    }
    // 단품
    const newSingleBomLine = await _getStructureBomLineBySaveAs(singleAssys, singleItem, subAssyBomline);
    if (newSingleBomLine) {
      return newSingleBomLine;
    }
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * 새 구조라면 Master saveas 후 상위 구조 봄라인에 추가
 * saveas한 봄라인 반환
 * @param {[Object??]} datas
 * @param {Object} master
 * @param {BomLine} parentBomline
 * @returns {BomLine}
 */
const _getStructureBomLineBySaveAs = async (datas, master, parentBomline) => {
  if (master.dbValue === '') {
    return null;
  }
  const structureRev = await getSelectItemRev(datas, master);

  const existingBomline = await _getExistingBomLine(parentBomline, structureRev, prop.TYPE_FMEA_STRUCTURE_REV);
  if (!existingBomline) {
    const newStructureRev = await saveAsItemToRev(structureRev);
    await recursionRevise(fmeaRevId, newStructureRev);
    const parentAssyAddResult = await lgepBomUtils.add(parentBomline, newStructureRev);
    const parentAssyBomline = parentAssyAddResult.addedLines[0];
    return parentAssyBomline;
  }
  return existingBomline.bomLine;
};

/**
 * 기존에 존재하는 봄라인인지 체크하여 반환
 * 봄라인의 Iman_based_on으로 확인
 * 존재하지 않으면 null 반환
 * @param {BomLine} parentBomline
 * @param {ModelObject} revision
 * @returns {BomLine}
 */
const _getExistingBomLine = async (parentBomline, revision, type) => {
  const res = await lgepBomUtils.expandPSOneLevel([parentBomline]);
  const children = res.output[0].children;
  for (const child of children) {
    if (child.itemRevOfBOMLine.type === type) {
      const rev = child.itemRevOfBOMLine;
      await lgepObjectUtils.getProperties(rev, [prop.IMAN_BASED_ON]);
      const baseUid = rev.props[prop.IMAN_BASED_ON].dbValues[0];
      if (baseUid === revision.uid) {
        return child;
      }
    }
  }
  return null;
};

/**
 * 기능 Save as
 * @param {object} functionData
 * @param {BomLine} structureBomline
 * @returns
 */
const _saveFunctionAction = async (functionData, structureBomline) => {
  const masterFunction = await getSelectItemRev(masterDatas[constants.MASTER_DATA_KEY_FUNCTION], functionData);
  // saveas할 기능이 이미 존재하는 경우 있음
  const existingFunction = await _getExistingBomLine(structureBomline, masterFunction, prop.TYPE_FMEA_FUNC_REVISION);
  if (existingFunction) {
    return {
      revision: existingFunction.itemRevOfBOMLine,
      bomLine: existingFunction.bomLine,
    };
  }
  const newFunctionRev = await saveAsItemToRev(masterFunction);
  await recursionRevise(fmeaRevId, newFunctionRev);
  const functionAddResult = await lgepBomUtils.add(structureBomline, newFunctionRev);
  return {
    revision: newFunctionRev,
    bomLine: functionAddResult.addedLines[0],
  };
};

/**
 * 고장 saveas 후 봄라인 추가
 * @param {*} data
 * @param {BomLine} functionBomLine
 * @returns
 */
const _saveAsFailure = async (data, functionBomLine) => {
  const { failure, classification } = data;

  const masterFailureRev = await getSelectItemRev(masterDatas[constants.MASTER_DATA_KEY_FAILURE], failure);
  const newFailureRev = await saveAsItemToRev(masterFailureRev);
  await recursionRevise(fmeaRevId, newFailureRev);

  // TODO:: 봄라인인가
  const classificationValue = replaceEmptyValue(classification.dbValue);
  await lgepObjectUtils.setProperties(newFailureRev, [prop.CLASSFICATION], [classificationValue]);

  const failureAddResult = await lgepBomUtils.add(functionBomLine, newFailureRev);

  // TODO :: DATASET으로 변경
  const tempRev = await _getFailureDataset(newFailureRev);
  return {
    revision: newFailureRev,
    bomLine: failureAddResult.addedLines[0],
    failureEffect: tempRev.uid,
    causeOfFailure: tempRev.uid,
  };
};

/**
 * 고장영향, 고장원인
 * @param {ModelObject} newFailureRev
 * @returns
 */
export const _getFailureDataset = async (newFailureRev) => {
  // 임시 고장 객체 생성
  //const tempRev = await saveAsItemToRev(newFailureRev);

  const failureEffectValue = getEditorValueById(prop.FAILURE_EFFECT + constants.CREATE_SUFFIX);
  const shortFailureEffect = makeShortenValues(failureEffectValue);

  const causeOfFailureValue = getEditorValueById(prop.CAUSE_OF_FAILURE + constants.CREATE_SUFFIX);
  const shortCauseOfFailure = makeShortenValues(causeOfFailureValue);

  const props = [prop.FAILURE_EFFECT, prop.CAUSE_OF_FAILURE, prop.FAILURE_EFFECT_SHORT, prop.CAUSE_OF_FAILURE_SHORT];

  const values = [failureEffectValue, causeOfFailureValue, shortFailureEffect, shortCauseOfFailure];

  await lgepObjectUtils.setProperties(newFailureRev, props, values);

  return newFailureRev;
};

/**
 * Note Type set
 * @param {BomLine} failureBomLine
 * @param {object} noteData
 */
const _setNoteTypes = async (failureBomLine, noteData) => {
  await lgepObjectUtils.setProperties(failureBomLine, constants.NOTETYPE_PROPS, noteData);
};
