/**
 * DFMEA Master Detail List
 * @module js/dfmeaMasterListService
 */
import appCtxService from 'js/appCtxService';

import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import { commonEditCancel } from 'js/dfmeaMasterEditService';
import {
  saveCloseBomWindow,
  saveAsItemToRev,
  loadObjectByPolicy,
} from 'js/utils/fmeaTcUtils';
import { makeShortenValues, insertLog } from 'js/utils/fmeaCommonUtils';
import { showInfoMessage } from 'js/utils/fmeaMessageUtils';
import { editCancelCtx } from 'js/dfmeaMasterEditService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';
import loadUtils from 'js/utils/lgepLoadingUtils';
import {
  tableRefreshByTableMode,
} from 'js/utils/fmeaViewCommonUtils';

/**
 * 편집 저장.
 * @param {*} data
 * @param {*} ctx
 * @returns
 */
const saveAction = async (data, ctx) => {
  const changeInfo = ctx[constants.CHANGE_INFO];
  const editRows = changeInfo[constants.CHANGE_EDIT_ROWS];
  const fmeaRev = ctx[constants.FMEA_SELECT];

  // 수정되었는지 확인
  if (!_isChange(changeInfo) || editRows.length === 0) {
    commonEditCancel();
    return;
  }

  appCtxService.registerCtx(constants.FMEA_POPUP, true);
  loadUtils.openWindow();

  await _editRows(fmeaRev, editRows);

  tableRefreshByTableMode();

  loadUtils.closeWindow(data);

  showInfoMessage('successEditSave');
  appCtxService.registerCtx(constants.FMEA_POPUP, false);
  editCancelCtx();

  insertLog('Edit CheckList', fmeaRev.uid);
};

const _editRows = async (fmeaRev, editRows) => {
  const changeEditRows = await _replaceFunctions(editRows, fmeaRev);
  const changeEditFailureRows = await _replaceFailures(changeEditRows, fmeaRev);

  await _replaceFailureProperties(changeEditFailureRows, fmeaRev);
};

// 기능 수정
const _replaceFunctions = async (editRows, fmeaRev) => {
  let changeEditRows = [...editRows];
  let bom;
  for (let editRow of changeEditRows) {
    // 변경 row 정보 중 기능 변경인 경우만 실행
    if (!editRow[prop.FUNCTION] || !editRow[prop.FUNCTION].uid) {
      continue;
    }
    if (!bom) {
      bom = await lgepBomUtils.createBOMWindow(null, fmeaRev);
    }
    try {
      const allBomlines = await lgepBomUtils.expandPSAllLevels([bom.bomLine]);
      const newFunctionUid = await _replaceFunction(
        editRow,
        allBomlines.output
      );
      editRow['newFunctionUid'] = newFunctionUid;
    } catch (e) {
      console.log('_replaceFunctions', e);
    } finally {
      await saveCloseBomWindow(bom.bomWindow);
    }
  }
  return changeEditRows;
};

// 기능 replace
const _replaceFunction = async (editRow, allBomlinesOutput) => {
  // 1. 변경 전 기능 정보 get
  const newFunctionUid = editRow[prop.FUNCTION].uid;
  const baseFunction = _getBomInfoByUid(
    allBomlinesOutput,
    editRow.row.props[prop.FUNCTION_SHORT].uid,
    prop.TYPE_FMEA_FUNC_REVISION
  );
  // 1-2. 변경전 funciton을 자식으로 가지고 있는 strcture 정보 get
  const structureUid = _getStructureUidUntilSubAssy(editRow.row);
  const structureInfo = await _getBomInfoByPreviousRevUid(
    allBomlinesOutput,
    structureUid,
    prop.TYPE_FMEA_STRUCTURE_REV
  );

  // 1-3. 변경전 function의 고장 bomline갖고있기
  const baseFunctionRev = baseFunction.itemRevOfBOMLine;
  const failureBomlines = await _getBomlinesByParentRev(baseFunctionRev);

  // 1-4. 변경할 master saveas 및 revise
  const masterFunction = await loadObjectByPolicy(
    newFunctionUid,
    prop.TYPE_FMEA_FUNC_REVISION,
    [prop.OBJECT_NAME]
  );
  const saveasFunc = await saveAsItemToRev(masterFunction);
  // await lgepObjectUtils.getProperties(
  //   [baseFunctionRev, saveasFunc],
  //   [prop.REVISION_ID]
  // );

  // 2. requirement 객체 ref 추가
  const requirementUid =
    baseFunctionRev.props[prop.REF_REQUIREMENTS].dbValues[0];
  const requirement = lgepObjectUtils.getObject(requirementUid);
  await lgepObjectUtils.addChildren(
    saveasFunc,
    [requirement],
    prop.REF_REQUIREMENTS
  );

  // 3. 변경 전 function bomline 제거
  await lgepBomUtils.removeChildrenFromParentLine([baseFunction.bomLine]);

  // 4. 새 function bomline add
  const addResult = await lgepBomUtils.add(structureInfo.bomLine, saveasFunc);
  const newFunctionBomLine = addResult.addedLines[0];

  // 5. 새 funciton bomline에 기존 고장 bomlines add
  for (const bomline of failureBomlines) {
    const failureRev = bomline.itemRevOfBOMLine;
    const currentFailureBomline = bomline.bomLine;
    const addResult = await lgepBomUtils.add(newFunctionBomLine, failureRev);
    const failureBomline = addResult.addedLines[0];
    const noteTypeValues = await _getNoteTypesValue(currentFailureBomline);
    lgepObjectUtils.setProperties(
      failureBomline,
      constants.NOTETYPE_PROPS,
      noteTypeValues
    );
  }
  return saveasFunc.uid;
};

// 4. 고장 변경
const _replaceFailures = async (editRows, fmeaRevision) => {
  let changeEditRows = [...editRows];
  if (!editRows) {
    return;
  }
  let bom;
  for (let editRow of changeEditRows) {
    // 변경 row 정보 중 고장 변경인 경우만 실행
    if (
      !editRow[prop.POTENTIAL_FAILURE_MODE] ||
      !editRow[prop.POTENTIAL_FAILURE_MODE].uid
    ) {
      continue;
    }
    if (!bom) {
      bom = await lgepBomUtils.createBOMWindow(null, fmeaRevision);
    }
    try {
      const allBomlines = await lgepBomUtils.expandPSAllLevels([bom.bomLine]);
      const newFailureUid = await _replaceFailure(editRow, allBomlines.output);
      editRow['newFailureUid'] = newFailureUid;
    } catch (e) {
      //console.log('_replaceFailures', e);
    } finally {
      await saveCloseBomWindow(bom.bomWindow);
    }
  }
  return changeEditRows;
};

// 4. 고장 변경
const _replaceFailure = async (editRow, allBomlinesOutput) => {
  try {
    // 1. 기존 고장 정보 get
    const baseFailure = _getBomInfoByUid(
      allBomlinesOutput,
      editRow.row.props.uid,
      prop.TYPE_FMEA_FAILURE_REVISION
    );

    const baseFailureRev = baseFailure.itemRevOfBOMLine;
    // const noteTypeValues = await _getNoteTypesValue(baseFailure.bomLine);
    // 1-2. 기존 고장이 붙어있는 function Info get
    const funcitonUid = editRow['newFunctionUid']
      ? editRow['newFunctionUid']
      : editRow.row.props[prop.FUNCTION_SHORT].uid;

    const functionInfo = await _getBomInfoByPreviousRevUid(
      allBomlinesOutput,
      funcitonUid,
      prop.TYPE_FMEA_FUNC_REVISION
    );
    const masterFailureUid = editRow[prop.POTENTIAL_FAILURE_MODE].uid;
    const masterFailure = await loadObjectByPolicy(
      masterFailureUid,
      prop.TYPE_FMEA_FAILURE_REVISION,
      [prop.OBJECT_NAME]
    );
    const saveasFailure = await saveAsItemToRev(masterFailure);

    // 3. 새 failure bomline add
    const addResult = await lgepBomUtils.add(
      functionInfo.bomLine,
      saveasFailure
    );
    // const newFailureBomline = addResult.addedLines[0];

    // 4. Note Types 복사
    // await _copyNoteTypes(noteTypeValues, newFailureBomline);

    // 5. 변경 전 failure bomline 제거
    await lgepBomUtils.removeChildrenFromParentLine([baseFailure.bomLine]);

    return saveasFailure.uid;
  } catch (e) {
    //console.log('_replaceFailure', e);
  }
};

// 5. 고장 속성 변경
const _replaceFailureProperties = async (editRows, reviseRevision) => {
  const bom = await lgepBomUtils.createBOMWindow(null, reviseRevision);
  const allBomlines = await lgepBomUtils.expandPSAllLevels([bom.bomLine]);
  try {
    for (const editRow of editRows) {
      // 고장 봄라인 get
      const failureUid = editRow['newFailureUid']
        ? editRow['newFailureUid']
        : editRow.row.props.uid;

      const failureInfo = await _getBomInfoByPreviousRevUid(
        allBomlines.output,
        failureUid,
        prop.TYPE_FMEA_FAILURE_REVISION
      );

      const failureBomline = failureInfo.bomLine;
      const failureRev = failureInfo.itemRevOfBOMLine;

      // 요구사항 수정
      _editRequirement2(editRow, failureRev);
      // 고장원인/영향 수정
      _replaceFailureProps2(editRow, failureRev);
      // 예방 수정
      _revisePrecautionAction2(editRow, failureRev);
      // 검출 수정
      _reviseDetectionAction2(editRow, failureRev);
      // SOD
      _setNoteTypes(editRow, failureBomline);
      // 조치 결과...
      await _setCellEditorValues(editRow, failureBomline);
    }
  } catch (e) {
    //console.log('_replaceFailureProperties', e);
  } finally {
    await saveCloseBomWindow(bom.bomWindow);
  }
};

const _setCellEditorValues = async (editRow, failureBomline) => {
  for (const prop of constants.EDITOR_NOTETYPES_PROPS) {
    const changeProp = editRow[prop];
    if (changeProp && changeProp.value) {
      const value = changeProp.value;
      // 1. txt 파일 생성 및 uid 리턴
      const fileName = `FMEA_${prop}.TXT`;
      let file = new File([value], fileName, { type: 'text' });
      const dataset = await lgepSummerNoteUtils.uploadFileToDataset(file);
      lgepObjectUtils.setProperties(failureBomline, [prop], [dataset.uid]);
    }
  }
};

// SOD 외 Note Type 업데이트
const _setNoteTypes = (editRow, failureBomline) => {
  for (const prop of constants.RESULT_AP_PROPS) {
    const changeProp = editRow[prop];
    if (changeProp) {
      const value = changeProp.value;
      lgepObjectUtils.setProperties(failureBomline, [prop], [value]);
    }
  }
};

// get NoteType
const _getNoteTypesValue = async (baseBomline) => {
  await lgepObjectUtils.getProperties([baseBomline], constants.NOTETYPE_PROPS);
  const noteTypeValues = constants.NOTETYPE_PROPS.map((prop) => {
    return baseBomline.props[prop].dbValues[0];
  });
  return noteTypeValues;
};

// Note Types 복사
const _copyNoteTypes = async (noteTypeValues, newBomline) => {
  await lgepObjectUtils.setProperties(
    newBomline,
    constants.NOTETYPE_PROPS,
    noteTypeValues
  );
};

// get Bomline
const _getBomlinesByParentRev = async (parentRev) => {
  const bom = await lgepBomUtils.createBOMWindow(null, parentRev);
  const bomWindow = bom.bomWindow;
  try {
    const allBomlines = await lgepBomUtils.expandPSOneLevel([bom.bomLine]);
    return allBomlines.output[0].children;
  } catch (e) {
    console.log('_getBomlinesByParentRev', e);
  } finally {
    await saveCloseBomWindow(bomWindow);
  }
};

// 요구사항 수정
const _editRequirement = async (editRow, baseBomline) => {
  const changeRequirement = editRow[prop.REQUIREMENT];
  if (changeRequirement && changeRequirement.value) {
    const requirementUid =
      baseBomline.props[prop.BOMLINE_REQUIREMENT].dbValues[0];
    const requirement = lgepObjectUtils.getObject(requirementUid);
    const props = [prop.REQUIREMENT, prop.REQUIREMENT_SHORT];
    const values = [
      changeRequirement.value,
      makeShortenValues(changeRequirement.value),
    ];
    await lgepObjectUtils.setProperties(requirement, props, values);
  }
};

// 고장 속성 수정
const _replaceFailureProps = async (editRow, baseBomline) => {
  const changeEffect = editRow[prop.FAILURE_EFFECT];
  let failureRev;
  if (changeEffect && changeEffect.value) {
    const baseFailureUid =
      baseBomline.props[prop.BOMLINE_FAILURE_EFFECT].dbValues[0];
    failureRev = lgepObjectUtils.getObject(baseFailureUid);

    await lgepObjectUtils.setProperties(
      failureRev,
      [prop.FAILURE_EFFECT, prop.FAILURE_EFFECT_SHORT],
      [changeEffect.value, makeShortenValues(changeEffect.value)]
    );
  }
  const changeCause = editRow[prop.CAUSE_OF_FAILURE];
  if (changeCause && changeCause.value) {
    const newCauseValue = changeCause.value;
    if (!failureRev) {
      const baseFailureUid =
        baseBomline.props[prop.BOMLINE_CAUSE_OF_FAILURE].dbValues[0];
      failureRev = lgepObjectUtils.getObject(baseFailureUid);
    }
    await lgepObjectUtils.setProperties(
      failureRev,
      [prop.CAUSE_OF_FAILURE, prop.CAUSE_OF_FAILURE_SHORT],
      [newCauseValue, makeShortenValues(newCauseValue)]
    );
  }
};

// 예방 수정
const _revisePrecautionAction = async (editRow, baseBomline) => {
  const changePrecaution = editRow[prop.PRECATUIONS_ACTION];
  if (changePrecaution && changePrecaution.value) {
    await lgepObjectUtils.getProperties(baseBomline, [
      prop.BOMLINE_PRECAUTION_ACTION,
    ]);
    const precautionUid =
      baseBomline.props[prop.BOMLINE_PRECAUTION_ACTION].dbValues[0];
    const precaution = await loadObjectByPolicy(
      precautionUid,
      prop.TYPE_FMEA_PREACUTION_ACTION
    );
    lgepObjectUtils.setProperties(
      precaution,
      [prop.PRECATUIONS_ACTION, prop.PRECATUIONS_ACTION_SHORT],
      [changePrecaution.value, makeShortenValues(changePrecaution.value)]
    );
  }
};

// 검출 수정
const _reviseDetectionAction = async (editRow, baseBomline) => {
  const changeDetection = editRow[prop.DETECTION_ACTION];
  if (changeDetection && changeDetection.value) {
    await lgepObjectUtils.getProperties(baseBomline, [
      prop.BOMLINE_DETECTION_ACTION,
    ]);

    const detectionUid =
      baseBomline.props[prop.BOMLINE_DETECTION_ACTION].dbValues[0];
    const detectionAction = await loadObjectByPolicy(
      detectionUid,
      prop.TYPE_FMEA_DETECTION_ACTION
    );
    lgepObjectUtils.setProperties(
      detectionAction,
      [prop.DETECTION_ACTION, prop.DETECTION_ACTION_SHORT],
      [changeDetection.value, makeShortenValues(changeDetection.value)]
    );
  }
};

const _getBomInfoByPreviousRevUid = async (allBomline, previousUid, type) => {
  for (const bomlineInfo of allBomline) {
    const revision = bomlineInfo.parent.itemRevOfBOMLine;
    if (revision.type !== type) {
      continue;
    }
    await lgepObjectUtils.getProperties([revision], [prop.REVISION_LIST]);
    for (const rev of revision.props[prop.REVISION_LIST].dbValues) {
      if (rev === previousUid) {
        return bomlineInfo.parent;
      }
    }
  }
};

// getBomInfo
const _getBomInfoByUid = (allBomline, uid, type) => {
  for (const bomlineInfo of allBomline) {
    const revision = bomlineInfo.parent.itemRevOfBOMLine;
    if (revision.type !== type) {
      continue;
    }
    if (revision.uid === uid) {
      return bomlineInfo.parent;
    }
  }
};

// 고장의 최종 구조 uid 리턴
export const _getStructureUidUntilSubAssy = (row) => {
  if (row.props[constants.SINGLE_ITEM]) {
    return row.props[constants.SINGLE_ITEM].uid;
  } else if (row.props[prop.SUB_ASSY]) {
    return row.props[prop.SUB_ASSY].uid;
  } else {
    return row.props[prop.PARENT_ASSY].uid;
  }
};

const _isChange = (changeInfo) => {
  const infos = Object.values(changeInfo);
  for (const rows of infos) {
    if (rows.length > 0) {
      return true;
    }
  }
  return false;
};

/**
 * _editRequirement 변경 함수
 * failureRevision 의 속성[l2_fun_requirements, l2_fun_requirements_s]에 데이터를 저장하는 것으로 함수를 재 변경함.
 */
const _editRequirement2 = (editRow, failureRev) => {
  const changeRequirement = editRow[prop.REQUIREMENT];
  if (changeRequirement && changeRequirement.value) {
    const props = [
      prop.FUNCTION_REQUIREMENTS,
      prop.FUNCTION_REQUIREMENTS_SHORT,
    ];
    const values = [
      changeRequirement.value,
      makeShortenValues(changeRequirement.value),
    ];
    lgepObjectUtils.setProperties(failureRev, props, values);
  }
};

/**
 * _editRequirement 변경 함수
 * BOMLine 과 연관된 객체에 데이터를 저장 하지 않음.
 * BOMLine 의 리비전(FailureRevision) 속성에 데이터를 저장하는 것으로 함수를 재 변경함.
 */
const _replaceFailureProps2 = (editRow, failureRev) => {
  const changeEffect = editRow[prop.FAILURE_EFFECT];
  if (changeEffect && changeEffect.value) {
    lgepObjectUtils.setProperties(
      failureRev,
      [prop.FAILURE_EFFECT, prop.FAILURE_EFFECT_SHORT],
      [changeEffect.value, makeShortenValues(changeEffect.value)]
    );
  }
  const changeCause = editRow[prop.CAUSE_OF_FAILURE];
  if (changeCause && changeCause.value) {
    const newCauseValue = changeCause.value;
    lgepObjectUtils.setProperties(
      failureRev,
      [prop.CAUSE_OF_FAILURE, prop.CAUSE_OF_FAILURE_SHORT],
      [newCauseValue, makeShortenValues(newCauseValue)]
    );
  }
};

/**
 * 예방
 * _revisePrecautionAction 변경 함수
 * BOMLine 과 연관된 객체에 데이터를 저장 하지 않음.
 * BOMLine 의 리비전(FailureRevision) 속성에 데이터를 저장하는 것으로 함수를 재 변경함.
 */
const _revisePrecautionAction2 = (editRow, failureRev) => {
  const changePrecaution = editRow[prop.PRECATUIONS_ACTION];
  if (changePrecaution && changePrecaution.value) {
    lgepObjectUtils.setProperties(
      failureRev,
      [prop.PRECATUION_ACTION, prop.PRECATUION_ACTION_SHORT],
      [changePrecaution.value, makeShortenValues(changePrecaution.value)]
    );
  }
};

/**
 * 검출
 * _revisePrecautionAction 변경 함수
 * BOMLine 과 연관된 객체에 데이터를 저장 하지 않음.
 * BOMLine 의 리비전(FailureRevision) 속성에 데이터를 저장하는 것으로 함수를 재 변경함.
 */
const _reviseDetectionAction2 = (editRow, failureRev) => {
  const changeDetection = editRow[prop.DETECTION_ACTION];
  if (changeDetection && changeDetection.value) {
    lgepObjectUtils.setProperties(
      failureRev,
      [prop.DETECTION_ACTIONS, prop.DETECTION_ACTIONS_SHORT],
      [changeDetection.value, makeShortenValues(changeDetection.value)]
    );
  }
};

export default {
  saveAction,
};
