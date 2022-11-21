import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';

import { getHtmlValue } from 'js/utils/fmeaDatasetUtils';
import { makeShortenValues, replaceEmptyValue } from 'js/utils/fmeaCommonUtils';
import dfmeaMasterService from 'js/dfmeaMasterService';
import { loadObjectByPolicy, getRevisionByRevId } from 'js/utils/fmeaTcUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let fmeaRevId;
let result = [];

// 테이블 불러오기
export const loadTableDatas = async (ctx) => {
  const dfmeaMasterRev = await dfmeaMasterService.getDfmea(ctx);
  fmeaRevId = dfmeaMasterRev.props[prop.REVISION_ID].dbValues[0];

  const bom = await lgepBomUtils.createBOMWindow(null, dfmeaMasterRev);
  const bomWindow = bom.bomWindow;
  try {
    await _getTableData2(bom, dfmeaMasterRev); // FIXME: 전개 방식 변경
    //await _getTableData(bom);

    appCtxService.registerCtx(constants.FMEA_TABLE_LIST, result);
  } catch (e) {
    showErrorMessage(e);
  } finally {
    await lgepBomUtils.closeBOMWindow(bomWindow);
    result = [];
  }
};

const _getTableData2 = async (parent, dfmeaMasterRev) => {
  let bomDatas = await lgepBomUtils.expandPSAllLevels([parent.bomLine], null, lgepObjectUtils.createPolicy(_getBomLineProperties(), 'BOMLine'));
  let bomLineOutput = bomDatas.output;
  let topLine = bomLineOutput.find((i) => i.parent.itemRevOfBOMLine.uid === dfmeaMasterRev.uid);
  appCtxService.ctx[appCtxService.ctx.fmea_select.uid] = {};
  if (topLine) {
    for (const childLine of topLine.children) {
      childLine['parentInfo'] = {};
      getStructureInfomation(childLine);
      await getChildBOM(bomLineOutput, childLine);
    }
  }
};

const _getTableData = async (parent) => {
  //dfmea_structure_list added
  const res = await lgepBomUtils.expandPSOneLevel([parent.bomLine]);
  const children = res.output[0].children;
  appCtxService.ctx[appCtxService.ctx.fmea_select.uid] = {};
  for (const child of children) {
    // 1. parent assy
    appCtxService.ctx[appCtxService.ctx.fmea_select.uid][child.itemRevOfBOMLine.uid] = {};

    if (child.itemRevOfBOMLine.type === prop.TYPE_FMEA_STRUCTURE_REV) {
      const parentAssyProperty = await _getStructure(child);
      const parentResChildren = await _getBomChildren(child);
      if (parentResChildren.length === 0) {
        appCtxService.ctx[appCtxService.ctx.fmea_select.uid][child.itemRevOfBOMLine.uid] = {};
        const assyInfo = {
          [prop.PARENT_ASSY]: parentAssyProperty,
        };
        await _createTableRow(child, assyInfo);
      }
      for (const parentChild of parentResChildren) {
        appCtxService.ctx[appCtxService.ctx.fmea_select.uid][child.itemRevOfBOMLine.uid][parentChild.itemRevOfBOMLine.uid] = {};
        // 2. sub assy
        if (_checkStructure(parentChild)) {
          const subAssyProperty = await _getStructure(parentChild);
          const assyInfo = {
            [prop.PARENT_ASSY]: parentAssyProperty,
            [prop.SUB_ASSY]: subAssyProperty,
          };
          const subResChildren = await _getBomChildren(parentChild);
          if (subResChildren.length === 0) {
            await _createTableRow(parentChild, assyInfo);
          }
          for (const subChild of subResChildren) {
            // 3. single assy
            if (_checkStructure(subChild)) {
              const singleAssyProperty = await _getStructure(subChild);
              const assyInfo = {
                [prop.PARENT_ASSY]: parentAssyProperty,
                [prop.SUB_ASSY]: subAssyProperty,
                [constants.SINGLE_ITEM]: singleAssyProperty,
              };
              const singleResChildren = await _getBomChildren(subChild);
              if (singleResChildren.length === 0) {
                await _createTableRow(subChild, assyInfo);
              }
              for (const singleChild of singleResChildren) {
                await _createTableRow(singleChild, assyInfo);
              }
            } else if (_checkFunction(subChild)) {
              await _createTableRow(subChild, assyInfo);
            }
          }
        } else if (_checkFunction(parentChild)) {
          const assyInfo = {
            [prop.PARENT_ASSY]: parentAssyProperty,
          };
          await _createTableRow(parentChild, assyInfo);
        }
      }
    }
  }
};

// 구조 프로퍼티 get (상위/하위/단품)
const _getStructure = async (bomLine) => {
  const currentAssyRevision = await getRevisionByRevId(bomLine.itemRevOfBOMLine, fmeaRevId);

  return currentAssyRevision;
};

const _getBomChildren = async (child) => {
  const res = await lgepBomUtils.expandPSOneLevel([child.bomLine]);
  const children = res.output[0].children;
  return children;
};

// 기능의 children get
const _getFunctionChildren = async (functionRev) => {
  const bom = await lgepBomUtils.createBOMWindow(null, functionRev);
  const bomWindow = bom.bomWindow;
  try {
    const funcResChildren = await _getBomChildren(bom);
    return funcResChildren;
  } catch (e) {
    //console.log('_getFunctionChildren', e);
  } finally {
    await lgepBomUtils.closeBOMWindow(bomWindow);
  }
};

const _checkStructure = (child) => {
  if (child.itemRevOfBOMLine.type === prop.TYPE_FMEA_STRUCTURE_REV) {
    return true;
  }
  return false;
};

const _checkFunction = (child) => {
  if (child.itemRevOfBOMLine.type === prop.TYPE_FMEA_FUNC_REVISION) {
    return true;
  }
  return false;
};
let rowInfo;

/**
 * TableRow 생성
 * @param {object} parentChild - {bomLine: ModelObject, itemRevOfBOMLine: ModelObject}
 * @param {object} assyData
 */
const _createTableRow = async (parentChild, assyInfo) => {
  if (parentChild.itemRevOfBOMLine.type !== prop.TYPE_FMEA_FUNC_REVISION) {
    return;
  }
  const functionData = await _getFunctionData(parentChild);
  for (const funcChild of functionData.funcResChildren) {
    if (funcChild.itemRevOfBOMLine.type === prop.TYPE_FMEA_FAILURE_REVISION) {
      rowInfo = {};

      _addPropertyStructure(assyInfo);
      _setRowInfo(functionData.functionRev, prop.FUNCTION);
      _setRowInfo(functionData.functionRev, prop.FUNCTION_SHORT);

      const failureRev = await lgepObjectUtils.getObject(funcChild.itemRevOfBOMLine.uid);

      const failureBomline = funcChild.bomLine;

      await _createVmoByFailure(failureRev, failureBomline);
      rowInfo.uid = failureRev.uid;
      result.push(rowInfo);
    }
  }
};

const _addPropertyStructure = (assyData) => {
  _setRowInfo2(assyData[prop.PARENT_ASSY], prop.PARENT_ASSY, _getObjectName(assyData[prop.PARENT_ASSY]));
  if (assyData[prop.SUB_ASSY]) {
    _setRowInfo2(assyData[prop.SUB_ASSY], prop.SUB_ASSY, _getObjectName(assyData[prop.SUB_ASSY]));
  }
  if (assyData[constants.SINGLE_ITEM]) {
    _setRowInfo2(assyData[constants.SINGLE_ITEM], constants.SINGLE_ITEM, _getObjectName(assyData[constants.SINGLE_ITEM]));
  }
};

const _getObjectName = (assy) => {
  return assy.props[prop.OBJECT_NAME].dbValues[0];
};

/**
 * 기능, 기능요약 property 및 rev 반환
 * @param {*} structureRev
 * @returns
 */
const _getFunctionData = async (structureRev) => {
  const functionRev = await lgepObjectUtils.getObject(structureRev.itemRevOfBOMLine.uid);

  const currentFunctionRev = await getRevisionByRevId(functionRev, fmeaRevId);
  const funcResChildren = await _getFunctionChildren(currentFunctionRev);

  return {
    functionRev: currentFunctionRev,
    funcResChildren,
  };
};

const _setRowInfo = (modelObejct, propName = prop.OBJECT_NAME) => {
  if (modelObejct) {
    rowInfo[propName] = {
      uid: modelObejct.uid,
      value: modelObejct.props[propName].dbValues[0],
    };
    return;
  }
  rowInfo[propName] = {
    uid: null,
    value: '',
  };
};

const _setRowInfo2 = (modelObejct, propName, value) => {
  rowInfo[propName] = {
    uid: modelObejct.uid,
    value: value,
  };
};

/**
 * 요구사항 property 추가
 */
const _makeRequirementProperty = async (failureBomline) => {
  const requirmentUid = failureBomline.props[prop.BOMLINE_REQUIREMENT].dbValues[0];
  try {
    const props = [prop.REQUIREMENT, prop.REQUIREMENT_SHORT];
    const requirementRev = await loadObjectByPolicy(requirmentUid, prop.TYPE_FMEA_REQ_REVISION, props);

    _setRowInfo(requirementRev, prop.REQUIREMENT);
    _setRowInfo(requirementRev, prop.REQUIREMENT_SHORT);
  } catch (e) {
    //console.log('_makeRequirementProperty', e);
  }
};

/**
 * 고장 VMO 생성
 * @param {*} failureRev
 * @param {*} failureBomline
 * @returns
 */
const _createVmoByFailure = async (failureRev, failureBomline) => {
  _setRowInfo(failureRev, prop.POTENTIAL_FAILURE_MODE);
  _setRowInfo(failureRev, prop.POTENTIAL_FAILURE_MODE_SHORT);

  // 요구사항 추가
  await _makeRequirementProperty(failureBomline);

  // 고장 영향 추가
  await _addFailureEffectProperty(failureBomline);

  // 고장 원인 추가
  await _addCauseFailureProperty(failureBomline);

  // // 예방 조치 추가
  await _addPrecatuionProperty(failureBomline);

  // 검출 조치 추가
  await _addDetectionProperty(failureBomline);

  // SOD 및 NoteTYPe추가
  await _addNoteTypeProperties(failureBomline);

  // Editor NoteType 추가
  // await _addEditorNoteTypeProperties(failureBomline);
};

// 고장 영향, 고장영향 요약 프로퍼티 get
const _addFailureEffectProperty = async (failureBomline) => {
  const tempFailureUid = failureBomline.props[prop.BOMLINE_FAILURE_EFFECT].dbValues[0];

  const props = [prop.FAILURE_EFFECT, prop.FAILURE_EFFECT_SHORT];
  const tempFailure = await loadObjectByPolicy(tempFailureUid, prop.TYPE_FMEA_FAILURE_REVISION, props);
  await lgepObjectUtils.getProperties([tempFailure], props);

  _setRowInfo(tempFailure, prop.FAILURE_EFFECT);
  _setRowInfo(tempFailure, prop.FAILURE_EFFECT_SHORT);
};

// 고장 원인, 고장원인 요약 프로퍼티 get
const _addCauseFailureProperty = async (failureBomline) => {
  const tempFailureUid = failureBomline.props[prop.BOMLINE_CAUSE_OF_FAILURE].dbValues[0];

  const props = [prop.CAUSE_OF_FAILURE, prop.CAUSE_OF_FAILURE_SHORT];
  const tempFailure = await loadObjectByPolicy(tempFailureUid, prop.TYPE_FMEA_FAILURE_REVISION);
  await lgepObjectUtils.getProperties([tempFailure], props);
  _setRowInfo(tempFailure, prop.CAUSE_OF_FAILURE);
  _setRowInfo(tempFailure, prop.CAUSE_OF_FAILURE_SHORT);
};

const _addDetectionProperty = async (failureBomline) => {
  const detectionUid = failureBomline.props[prop.BOMLINE_DETECTION_ACTION].dbValues[0];
  const props = [prop.DETECTION_ACTION, prop.OBJECT_NAME, prop.DETECTION];
  const detection = await loadObjectByPolicy(detectionUid, prop.TYPE_FMEA_DETECTION_ACTION, props);

  const value = getShortValue(detection, prop.DETECTION_ACTION);

  _setRowInfo(detection, prop.DETECTION_ACTION);
  _setRowInfo2(detection, prop.DETECTION_ACTION_SHORT, value);
  _setRowInfo(detection, prop.DETECTION);
};

const _addPrecatuionProperty = async (failureBomline) => {
  const precautionUid = failureBomline.props[prop.BOMLINE_PRECAUTION_ACTION].dbValues[0];
  const props = [prop.PRECATUIONS_ACTION, prop.OBJECT_NAME, prop.OCCURENCE, prop.RELATED_SOURCES];
  const precaution = await loadObjectByPolicy(precautionUid, prop.TYPE_FMEA_PREACUTION_ACTION, props);

  const value = getShortValue(precaution, prop.PRECATUIONS_ACTION);

  _setRowInfo(precaution, prop.PRECATUIONS_ACTION);
  _setRowInfo2(precaution, prop.PRECATUIONS_ACTION_SHORT, value);
  _setRowInfo(precaution, prop.OCCURENCE);
  _setRowInfo(precaution, prop.RELATED_SOURCES);
};

const _addNoteTypeProperties = async (failureBomline) => {
  for (const noteTypeProp of constants.RESULT_NOTETYPES_PROPS) {
    _setRowInfo(failureBomline, noteTypeProp);
  }
};

const _addEditorNoteTypeProperties = async (failureBomline) => {
  for (const noteTypeProp of constants.EDITOR_NOTETYPES_PROPS) {
    const uid = failureBomline.props[noteTypeProp].dbValues[0];
    if (uid) {
      const htmlValue = await getHtmlValue(uid);
      _setRowInfo2(failureBomline, noteTypeProp, htmlValue);
    }
  }
};

const getShortValue = (modelObject, propName) => {
  const value = modelObject.props[propName].dbValues[0];
  if (!value) {
    return '';
  }
  const shortAction = makeShortenValues(value, 60);
  return shortAction;
};

const _getBomLineProperties = () => {
  let bomLineProperties = [
    prop.BOMLINE_OBJECT_NAME,
    prop.BOMLINE_SEQUENCE,
    prop.BOMLINE_LINE_LEVEL,
    prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE,
    prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE_SHORT,
    prop.BOMLINE_FAILURE_CLASSIFICATION,
    prop.BOMLINE_FAILURE_DETECTION_ACTIONS,
    prop.BOMLINE_FAILURE_DETECTION_ACTIONS_SHORT,
    prop.BOMLINE_FAILURE_FAILURE_EFFECT,
    prop.BOMLINE_FAILURE_FAILURE_EFFECT_SHORT,
    prop.BOMLINE_FAILURE_REQUIREMENT,
    prop.BOMLINE_FAILURE_REQUIREMENT_SHORT,
    prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE,
    prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE_SHORT,
    prop.BOMLINE_FAILURE_PRECAUTION_ACTION,
    prop.BOMLINE_FAILURE_PRECAUTION_ACTION_SHORT,
    prop.BOMLINE_FAILURE_RELATED_SOURCES,
    prop.BOMLINE_FUNC_FUNCTION,
    prop.BOMLINE_FUNC_FUNCTION_SHORT,
    prop.BOMLINE_SEVERITY,
    prop.BOMLINE_OCCURENCE,
    prop.BOMLINE_DETECTION,
    prop.BOMLINE_ACTION_PRIORITY,
    prop.BOMLINE_RESULT_SEVERITY,
    prop.BOMLINE_RESULT_OCCURENCE,
    prop.BOMLINE_RESULT_DETECTION,
    prop.BOMLINE_INSPECTION_RESULTS,
    prop.BOMLINE_PRECAUTIONS,
    prop.BOMLINE_ETC_NOTE,
    prop.BOMLINE_RESULT_ACTION_PRIORITY,
  ];

  return bomLineProperties;
};

/**
 * Failure 리비전 외 구조 및 기능 리비전의 정보를 추출함.
 */
const getStructureInfomation = (childLine, parentLine) => {
  let objType = childLine['itemRevOfBOMLine'].type; // Object Type
  let modelObject = childLine['itemRevOfBOMLine'];
  let childBOMLine = childLine['bomLine'];

  if (objType === prop.TYPE_FMEA_STRUCTURE_REV) {
    let lineLevel = childLine['bomLine'].props[prop.BOMLINE_LINE_LEVEL].dbValues;
    if (lineLevel == 1) {
      appCtxService.ctx[appCtxService.ctx.fmea_select.uid][childLine.itemRevOfBOMLine.uid] = {};
      childLine.parentInfo[prop.PARENT_ASSY] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_OBJECT_NAME);
    }
    if (lineLevel == 2) {
      if (parentLine) appCtxService.ctx[appCtxService.ctx.fmea_select.uid][parentLine.parent.itemRevOfBOMLine.uid][childLine.itemRevOfBOMLine.uid] = {};
      childLine.parentInfo[prop.SUB_ASSY] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_OBJECT_NAME);
    }
    if (lineLevel == 3) {
      childLine.parentInfo[prop.SINGLE_ITEM] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_OBJECT_NAME);
    }
  } else if (objType === prop.TYPE_FMEA_FUNC_REVISION) {
    childLine.parentInfo[prop.FUNCTION] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_FUNC_FUNCTION);
    childLine.parentInfo[prop.FUNCTION_SHORT] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_FUNC_FUNCTION_SHORT);
  }
};

// BOMLine 속성정보 추출
const _assignObject = (modelObejct, bomLine, propName) => {
  if (modelObejct) {
    return {
      uid: modelObejct.uid,
      value: bomLine.props[propName].dbValues[0],
    };
  }
};

// BOM 구조 탐색
const getChildBOM = async (bomLineOutput, parentBOMLine) => {
  let parentUid = parentBOMLine.itemRevOfBOMLine.uid;
  let parentLine = bomLineOutput.find((i) => i.parent.itemRevOfBOMLine.uid === parentUid);
  if (parentLine) {
    if (parentLine.children.length === 0) {
      // 자부품이 없는 경우 Failure Revision
      let objType = parentLine.parent['itemRevOfBOMLine'].type;
      if (objType === prop.TYPE_FMEA_FAILURE_REVISION) {
        await _createVmoByFailureBOMObj(parentLine, parentBOMLine.parentInfo);
        return;
      }
      return;
    }

    for (const childLine of parentLine.children) {
      childLine['parentInfo'] = parentBOMLine.parentInfo;
      getStructureInfomation(childLine, parentLine);
      await getChildBOM(bomLineOutput, childLine);
    }
  }
};

// BOMLine 속성 정보 추출 및 Row 에 값을 저장
const _setBOMRowInfo = (modelObejct, propName, bomPropName) => {
  if (modelObejct) {
    if (bomPropName) {
      rowInfo[propName] = {
        uid: modelObejct.uid,
        value: modelObejct.props[bomPropName].dbValues[0],
      };
      return;
    } else {
      rowInfo[propName] = {
        uid: modelObejct.uid,
        value: modelObejct.props[propName].dbValues[0],
      };
    }
  }
};

// 테이블에 출력할 대상 항목을 추출함.
const _createVmoByFailureBOMObj = async (failureBomline, parentInfo) => {
  let failureRevUid = failureBomline.parent.itemRevOfBOMLine.uid;
  failureBomline = failureBomline.parent.bomLine;
  rowInfo = {};

  _setBOMRowInfo(failureBomline, prop.CAUSE_OF_FAILURE, prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE); // 고장 원인
  _setBOMRowInfo(failureBomline, prop.CAUSE_OF_FAILURE_SHORT, prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE_SHORT); // 고장 원인
  _setBOMRowInfo(failureBomline, prop.CLASSFICATION, prop.BOMLINE_FAILURE_CLASSIFICATION); // 분류
  _setBOMRowInfo(failureBomline, prop.DETECTION_ACTION, prop.BOMLINE_FAILURE_DETECTION_ACTIONS); // 검출 조치
  _setBOMRowInfo(failureBomline, prop.DETECTION_ACTION_SHORT, prop.BOMLINE_FAILURE_DETECTION_ACTIONS_SHORT);
  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT, prop.BOMLINE_FAILURE_FAILURE_EFFECT); // 고장영향
  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT_SHORT, prop.BOMLINE_FAILURE_FAILURE_EFFECT_SHORT); // 고장 영향
  _setBOMRowInfo(failureBomline, prop.REQUIREMENT, prop.BOMLINE_FAILURE_REQUIREMENT_SHORT); // 기능 요구사항
  _setBOMRowInfo(failureBomline, prop.REQUIREMENT_SHORT, prop.BOMLINE_FAILURE_REQUIREMENT); // 기능 요구사항
  _setBOMRowInfo(failureBomline, prop.POTENTIAL_FAILURE_MODE, prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE); // 고장모드
  _setBOMRowInfo(failureBomline, prop.POTENTIAL_FAILURE_MODE_SHORT, prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE_SHORT);
  _setBOMRowInfo(failureBomline, prop.PRECATUIONS_ACTION, prop.BOMLINE_FAILURE_PRECAUTION_ACTION); // 예방조치 내용
  _setBOMRowInfo(failureBomline, prop.PRECATUIONS_ACTION_SHORT, prop.BOMLINE_FAILURE_PRECAUTION_ACTION_SHORT);
  _setBOMRowInfo(failureBomline, prop.RELATED_SOURCES, prop.BOMLINE_FAILURE_RELATED_SOURCES); // 관련 자료

  for (const noteTypeProp of constants.RESULT_NOTETYPES_PROPS) {
    _setBOMRowInfo(failureBomline, noteTypeProp);
  }

  for (const noteTypeProp of constants.EDITOR_NOTETYPES_PROPS) {
    const uid = failureBomline.props[noteTypeProp].dbValues[0];
    if (uid) {
      const htmlValue = await getHtmlValue(uid);
      _setRowInfo2(failureBomline, noteTypeProp, htmlValue);
    }
  }

  rowInfo = { ...rowInfo, ...parentInfo };
  rowInfo.uid = failureRevUid;
  result.push(rowInfo);
};
