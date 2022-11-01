/**
 * FMEA Master Text Table 로드 서비스
 */
import vmoc from 'js/viewModelObjectService';
import uwPropertySvc from 'js/uwPropertyService';
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';

import dfmeaMasterService from 'js/dfmeaMasterService';
import { makeShortenValues } from 'js/utils/fmeaCommonUtils';
import {
  makeEmptyProperty,
  makeVmPropertyOnTextTable,
} from 'js/utils/fmeaTableMakeUtils';
import { loadObjectByPolicy, getRevisionByRevId } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let results = [];
let fmeaRevId;

// 테이블 불러오기
export const loadTableDatas = async (ctx) => {
  const dfmeaMasterRev = await dfmeaMasterService.getDfmea(ctx);
  await _getFmeaRevisionId(dfmeaMasterRev);
  const bom = await lgepBomUtils.createBOMWindow(null, dfmeaMasterRev);
  const bomWindow = bom.bomWindow;
  try {
    //console.log('...table load');
    await _getTableData(bom);
    //console.log('...table complete');
    return results;
  } catch (e) {
    //console.log('loadTableDatas', e);
  } finally {
    await lgepBomUtils.closeBOMWindow(bomWindow);
    results = [];
  }
};

// 현재 dfmea의 revId get
const _getFmeaRevisionId = async (fmeaRev) => {
  await lgepObjectUtils.getProperties(fmeaRev, [prop.REVISION_ID]);
  fmeaRevId = fmeaRev.props[prop.REVISION_ID].dbValues[0];
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
      const parentAssyProperty = await _getStructureProperty(child);
      const parentResChildren = await _getBomChildren(child);
      if (parentResChildren.length === 0) {
        const assyInfo = {
          [prop.PARENT_ASSY]: parentAssyProperty,
        };
        appCtxService.ctx[appCtxService.ctx.fmea_select.uid][child.itemRevOfBOMLine.uid] = {};
        await _createTableRow(child, assyInfo);
      }
      for (const parentChild of parentResChildren) {
        appCtxService.ctx[appCtxService.ctx.fmea_select.uid][child.itemRevOfBOMLine.uid][parentChild.itemRevOfBOMLine.uid] = {};
        // 2. sub assy
        if (_checkStructure(parentChild)) {
          const subAssyProperty = await _getStructureProperty(parentChild);
          const subResChildren = await _getBomChildren(parentChild);
          if (subResChildren.length === 0) {
            const assyInfo = {
              [prop.PARENT_ASSY]: parentAssyProperty,
              [prop.SUB_ASSY]: subAssyProperty,
            };
            await _createTableRow(parentChild, assyInfo);
          }
          for (const subChild of subResChildren) {
            // 3. single assy
            if (_checkStructure(subChild)) {
              const singleAssyyProperty = await _getStructureProperty(subChild);
              const singleResChildren = await _getBomChildren(subChild);
              if (singleResChildren.length === 0) {
                const assyInfo = {
                  [prop.PARENT_ASSY]: parentAssyProperty,
                  [prop.SUB_ASSY]: subAssyProperty,
                  [constants.SINGLE_ITEM]: singleAssyyProperty,
                };
                await _createTableRow(subChild, assyInfo);
              }
              for (const singleChild of singleResChildren) {
                const assyInfo = {
                  [prop.PARENT_ASSY]: parentAssyProperty,
                  [prop.SUB_ASSY]: subAssyProperty,
                  [constants.SINGLE_ITEM]: singleAssyyProperty,
                };
                await _createTableRow(singleChild, assyInfo);
              }
            } else if (_checkFunction(subChild)) {
              const assyInfo = {
                [prop.PARENT_ASSY]: parentAssyProperty,
                [prop.SUB_ASSY]: subAssyProperty,
              };
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

/**
 * TableRow 생성
 * @param {object} parentChild - {bomLine: ModelObject, itemRevOfBOMLine: ModelObject}
 * @param {object} assyData - {l2_parent_assy: ViewModelProperty, l2_sub_assy: ViewModelProperty}
 */
const _createTableRow = async (parentChild, assyData) => {
  if (parentChild.itemRevOfBOMLine.type === prop.TYPE_FMEA_FUNC_REVISION) {
    const functionData = await _getFunctionData(parentChild);
    await _makeViewModelProperty(functionData, assyData);
  }
};

// 구조 프로퍼티 get (상위/하위/단품)
const _getStructureProperty = async (bomLine) => {
  const assyRevision = await loadObjectByPolicy(
    bomLine.itemRevOfBOMLine.uid,
    prop.TYPE_FMEA_STRUCTURE_REV,
    [prop.OBJECT_NAME]
  );
  const currentAssyRevision = await getRevisionByRevId(assyRevision, fmeaRevId);
  const assyProperty = makeVmPropertyOnTextTable(
    currentAssyRevision,
    prop.OBJECT_NAME
  );
  return assyProperty;
};



/**
 * 기능, 기능요약 property 및 rev 반환
 * @param {*} structureRev
 * @returns
 */
const _getFunctionData = async (structureRev) => {
  const props = [
    prop.FUNCTION,
    prop.FUNCTION_SHORT,
    prop.REF_REQUIREMENTS,
    prop.REVISION_ID,
  ];
  const functionRev = await loadObjectByPolicy(
    structureRev.itemRevOfBOMLine.uid,
    prop.TYPE_FMEA_FUNC_REVISION,
    props
  );
  const currentFunctionRev = await getRevisionByRevId(functionRev, fmeaRevId, props);
  const functionProperties = _getFunctionProperties(currentFunctionRev);
  const funcResChildren = await _getFunctionChildren(currentFunctionRev);
  return {
    functionRev: currentFunctionRev,
    ...functionProperties,
    funcResChildren,
  };
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

// 기능, 기능요약 property 반환
const _getFunctionProperties = (functionRev) => {
  const functionProperty = makeVmPropertyOnTextTable(
    functionRev,
    prop.FUNCTION,
    prop.FUNCTION_SHORT
  );
  const functionShortenProperty = makeVmPropertyOnTextTable(
    functionRev,
    prop.FUNCTION_SHORT,
    prop.FUNCTION_SHORT
  );
  return {
    functionProperty,
    functionShortenProperty,
  };
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

const _getBomChildren = async (child) => {
  const res = await lgepBomUtils.expandPSOneLevel([child.bomLine]);
  const children = res.output[0].children;
  return children;
};

/**
 * ViewModelProperty 생성 시작
 * @param {object} functionData
 * @param {object} assyData
 */
const _makeViewModelProperty = async (functionData, assyData) => {
  for (const funcChild of functionData.funcResChildren) {
    if (funcChild.itemRevOfBOMLine.type === prop.TYPE_FMEA_FAILURE_REVISION) {
      const props = [
        prop.POTENTIAL_FAILURE_MODE,
        prop.POTENTIAL_FAILURE_MODE_SHORT,
        prop.CAUSE_OF_FAILURE_SHORT,
        prop.FAILURE_EFFECT_SHORT,
        prop.SEVERITY,
        prop.REF_PREVENTION_ACTION,
        prop.REF_DETECTION_ACTION,
        prop.CLASSFICATION,
      ];

      const failureRev = await loadObjectByPolicy(
        funcChild.itemRevOfBOMLine.uid,
        prop.TYPE_FMEA_FAILURE_REVISION,
        props
      );

      const failureBomline = funcChild.bomLine;

      // 요구사항 추가
      const requirementProperty = await _makeRequirementProperty(
        failureBomline
      );

      // 고장 vmo 생성
      const vmo = await _createVmoByFailure(
        failureRev,
        failureBomline,
        functionData.functionRev
      );
      _addProperty(vmo, assyData, functionData, requirementProperty);
      results.push(vmo);
    }
  }
};

/**
 * 요구사항 property 추가
 */
const _makeRequirementProperty = async (failureBomline) => {
  await lgepObjectUtils.getProperties(
    [failureBomline],
    [prop.BOMLINE_REQUIREMENT]
  );
  const requirmentUid =
    failureBomline.props[prop.BOMLINE_REQUIREMENT].dbValues[0];
  if (!requirmentUid) {
    return makeEmptyProperty();
  }
  try {
    const props = [prop.REQUIREMENT, prop.REQUIREMENT_SHORT];
    const requirementRev = await loadObjectByPolicy(
      requirmentUid,
      prop.TYPE_FMEA_REQ_REVISION,
      props
    );

    const requirementProperty = makeVmPropertyOnTextTable(
      requirementRev,
      props[0],
      props[1]
    );
    return requirementProperty;
  } catch (e) {
    //console.log('_makeRequirementProperty', e);
  }
};

/**
 * 고장 VMO 생성
 * @param {*} failureRev
 * @param {*} failureBomline
 * @param {*} functionRev
 * @returns
 */
const _createVmoByFailure = async (failureRev, failureBomline, functionRev) => {
  await lgepObjectUtils.getProperties(
    [failureBomline],
    [
      prop.BOMLINE_PRECAUTION_ACTION,
      prop.BOMLINE_DETECTION_ACTION,
      prop.BOMLINE_FAILURE_EFFECT,
      prop.BOMLINE_CAUSE_OF_FAILURE,
    ]
  );
  let vmo = _createFailureViewModelObject(failureRev);

  // 고장 영향 추가
  await _addFailureEffectProperty(vmo, failureBomline);
  // 고장 원인 추가
  await _addCauseFailureProperty(vmo, failureBomline);
  // // 예방 조치 추가
  await _addPrecatuionProperty(vmo, failureBomline);
  // 검출 조치 추가
  await _addDetectionProperty(vmo, failureBomline);

  // SOD 및 NoteTYPe추가
  await _addNoteTypeProperties(vmo, failureBomline);

  return vmo;
};

// 고장 ViewModelObject get
const _createFailureViewModelObject = (failureRev) => {
  const vmo = vmoc.createViewModelObject(failureRev);
  vmo.props[prop.POTENTIAL_FAILURE_MODE].uid = failureRev.uid;
  vmo.props[prop.POTENTIAL_FAILURE_MODE].displayValues[0] =
    vmo.props[prop.POTENTIAL_FAILURE_MODE_SHORT].displayValues[0];
  return vmo;
};

const _addPropertyStructure = (vmo, assyData) => {
  vmo.props[prop.PARENT_ASSY] = assyData[prop.PARENT_ASSY];
  if (assyData[prop.SUB_ASSY]) {
    vmo.props[prop.SUB_ASSY] = assyData[prop.SUB_ASSY];
  }
  if (assyData[constants.SINGLE_ITEM]) {
    vmo.props[constants.SINGLE_ITEM] = assyData[constants.SINGLE_ITEM];
  }
};

const _addProperty = (vmo, assyData, functionData, requirementProperty) => {
  _addPropertyStructure(vmo, assyData);
  vmo.props[prop.FUNCTION] = functionData.functionProperty;
  vmo.props[prop.FUNCTION_SHORT] = functionData.functionShortenProperty;
  vmo.props[prop.REQUIREMENT] = requirementProperty;
};

// 고장 영향, 고장영향 요약 프로퍼티 get
const _addFailureEffectProperty = async (vmo, failureBomline) => {
  const tempFailureUid =
  failureBomline.props[prop.BOMLINE_FAILURE_EFFECT].dbValues[0];
  const props = [prop.FAILURE_EFFECT, prop.FAILURE_EFFECT_SHORT];
  const tempFailure = await loadObjectByPolicy(
    tempFailureUid,
    prop.TYPE_FMEA_FAILURE_REVISION,
    props
  );

  const shortValue = tempFailure.props[prop.FAILURE_EFFECT_SHORT].dbValues[0];
  const failureEffectProperty = makeVmPropertyOnTextTable2(
    tempFailure,
    prop.FAILURE_EFFECT,
    shortValue
  );
  vmo.props[prop.FAILURE_EFFECT] = failureEffectProperty;

  const failureEffectShortenProperty = makeVmPropertyOnTextTable2(
    tempFailure,
    prop.FAILURE_EFFECT_SHORT,
    shortValue
  );
  vmo.props[prop.FAILURE_EFFECT_SHORT] = failureEffectShortenProperty;
};

// 고장 원인, 고장원인 요약 프로퍼티 get
const _addCauseFailureProperty = async (vmo, failureBomline) => {
  await lgepObjectUtils.getProperties(failureBomline, [
    prop.BOMLINE_CAUSE_OF_FAILURE,
  ]);

  const tempFailureUid =
    failureBomline.props[prop.BOMLINE_CAUSE_OF_FAILURE].dbValues[0];

  const props = [prop.CAUSE_OF_FAILURE, prop.CAUSE_OF_FAILURE_SHORT];

  const tempFailure = await loadObjectByPolicy(
    tempFailureUid,
    prop.TYPE_FMEA_FAILURE_REVISION,
    props
  );

  const shortValue = tempFailure.props[prop.CAUSE_OF_FAILURE_SHORT].dbValues[0];

  const failureEffectProperty = makeVmPropertyOnTextTable2(
    tempFailure,
    prop.CAUSE_OF_FAILURE,
    shortValue
  );
  vmo.props[prop.CAUSE_OF_FAILURE] = failureEffectProperty;
  const failureEffectShortenProperty = makeVmPropertyOnTextTable2(
    tempFailure,
    prop.CAUSE_OF_FAILURE_SHORT,
    shortValue
  );
  vmo.props[prop.CAUSE_OF_FAILURE_SHORT] = failureEffectShortenProperty;
};

const _addNoteTypeProperties = async (vmo, failureBomline) => {
  await lgepObjectUtils.getProperties(
    failureBomline,
    constants.RESULT_NOTETYPES_PROPS
  );

  for (const noteTypeProp of constants.RESULT_NOTETYPES_PROPS) {
    const property = makeVmPropertyOnTextTable(failureBomline, noteTypeProp);
    vmo.props[noteTypeProp] = property;
  }
};

const _addDetectionProperty = async (vmo, failureBomline) => {
  await lgepObjectUtils.getProperties(failureBomline, [
    prop.BOMLINE_DETECTION_ACTION,
  ]);

  const detectionUid =
    failureBomline.props[prop.BOMLINE_DETECTION_ACTION].dbValues[0];
  const props = [prop.DETECTION_ACTION, prop.OBJECT_NAME, prop.DETECTION];
  const detection = await loadObjectByPolicy(
    detectionUid,
    prop.TYPE_FMEA_DETECTION_ACTION,
    props
  );

  const isEmptyDbValue = !detection.props[prop.DETECTION_ACTION].dbValues[0]
    ? true
    : false;

  const value = getShortValue(
    isEmptyDbValue,
    detection.props[prop.DETECTION_ACTION].dbValues[0]
  );

  const detectionActionProperty = makeVmPropertyOnTextTable2(
    detection,
    prop.DETECTION_ACTION,
    value
  );
  vmo.props[prop.DETECTION_ACTION] = detectionActionProperty;
  const detectionProperty = makeVmPropertyOnTextTable(
    detection,
    prop.DETECTION,
    prop.DETECTION
  );
  vmo.props[prop.DETECTION] = detectionProperty;
};

const _addPrecatuionProperty = async (vmo, failureBomline) => {
  await lgepObjectUtils.getProperties(failureBomline, [
    prop.BOMLINE_PRECAUTION_ACTION,
  ]);
  const precautionUid =
    failureBomline.props[prop.BOMLINE_PRECAUTION_ACTION].dbValues[0];
  const props = [
    prop.PRECATUIONS_ACTION,
    prop.OBJECT_NAME,
    prop.OCCURENCE,
    prop.RELATED_SOURCES,
  ];
  const precaution = await loadObjectByPolicy(
    precautionUid,
    prop.TYPE_FMEA_PREACUTION_ACTION,
    props
  );
  const isEmptyDbValue = !precaution.props[prop.PRECATUIONS_ACTION].dbValues[0]
    ? true
    : false;

  const value = getShortValue(
    isEmptyDbValue,
    precaution.props[prop.PRECATUIONS_ACTION].dbValues[0]
  );

  const precautionProperty = makeVmPropertyOnTextTable2(
    precaution,
    prop.PRECATUIONS_ACTION,
    value
  );
  vmo.props[prop.PRECATUIONS_ACTION] = precautionProperty;
  const occurenceProperty = makeVmPropertyOnTextTable(
    precaution,
    prop.OCCURENCE,
    prop.OCCURENCE
  );
  vmo.props[prop.OCCURENCE] = occurenceProperty;
  const relatedSourcesProperty = makeVmPropertyOnTextTable(
    precaution,
    prop.RELATED_SOURCES,
    prop.RELATED_SOURCES
  );
  vmo.props[prop.RELATED_SOURCES] = relatedSourcesProperty;
};

const makeVmPropertyOnTextTable2 = (rev, dbValueProp, displayValue) => {
  const dbValue = rev.props[dbValueProp].dbValues[0];
  const vmProperty = uwPropertySvc.createViewModelProperty(
    dbValueProp,
    dbValue,
    'STRING',
    dbValue,
    [displayValue]
  );
  vmProperty.uid = rev.uid;
  uwPropertySvc.setIsEditable(vmProperty, true);
  uwPropertySvc.setIsPropertyModifiable(vmProperty, true);
  return vmProperty;
};

const getShortValue = (isEmptyDbValue, value) => {
  if (isEmptyDbValue) {
    return '';
  }
  const shortAction = makeShortenValues(value, 60);
  return shortAction;
};


const _createBomPath = (uid) => {

}