import app from 'app';
import bomUtils from 'js/utils/lgepBomUtils';
import { ctx } from 'js/appCtxService';
import soaService from 'soa/kernel/soaService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let exports;

export function initialize() {
  alert('TEST Module Initialized');
}

function getBomLineProperties() {
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
    prop.BOMLINE_RESULT_SEVERITY,
    prop.BOMLINE_RESULT_OCCURENCE,
    prop.BOMLINE_RESULT_DETECTION,
    prop.BOMLINE_INSPECTION_RESULTS,
    prop.BOMLINE_PRECAUTIONS,
    prop.BOMLINE_ETC_NOTE,
  ];

  return bomLineProperties;
}

let rowInfo;
let result;

const _createVmoByFailure = async (failureBomline, parentInfo) => {
  failureBomline = failureBomline.parent.bomLine;
  result = [];
  rowInfo = {};

  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT, prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE); // 고장 원인
  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT_SHORT, prop.BOMLINE_FAILURE_CAUSE_OF_FAILURE_SHORT); // 고장 원인
  _setBOMRowInfo(failureBomline, prop.CLASSFICATION, prop.BOMLINE_FAILURE_CLASSIFICATION); // 분류
  _setBOMRowInfo(failureBomline, prop.DETECTION_ACTIONS, prop.BOMLINE_FAILURE_DETECTION_ACTIONS); // 검출 조치
  _setBOMRowInfo(failureBomline, prop.DETECTION_ACTIONS_SHORT, prop.BOMLINE_FAILURE_DETECTION_ACTIONS_SHORT);
  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT, prop.BOMLINE_FAILURE_FAILURE_EFFECT); // 고장영향
  _setBOMRowInfo(failureBomline, prop.FAILURE_EFFECT_SHORT, prop.BOMLINE_FAILURE_FAILURE_EFFECT_SHORT);
  _setBOMRowInfo(failureBomline, prop.REQUIREMENT, prop.BOMLINE_FAILURE_REQUIREMENT); // 기능 요구사항
  _setBOMRowInfo(failureBomline, prop.POTENTIAL_FAILURE_MODE, prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE); // 고장모드
  _setBOMRowInfo(failureBomline, prop.POTENTIAL_FAILURE_MODE_SHORT, prop.BOMLINE_FAILURE_POTENTIAL_FAILURE_MODE_SHORT);
  _setBOMRowInfo(failureBomline, prop.PRECATUIONS_ACTION, prop.BOMLINE_FAILURE_PRECAUTION_ACTION); // 예방조치 내용
  _setBOMRowInfo(failureBomline, prop.PRECATUIONS_ACTION_SHORT, prop.BOMLINE_FAILURE_PRECAUTION_ACTION_SHORT);
  _setBOMRowInfo(failureBomline, prop.RELATED_SOURCES, prop.BOMLINE_FAILURE_RELATED_SOURCES); // 관련 자료

  for (const noteTypeProp of constants.RESULT_NOTETYPES_PROPS) {
    _setBOMRowInfo(failureBomline, noteTypeProp);
  }

  rowInfo = { ...rowInfo, ...parentInfo };

  result.push(rowInfo);
};

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

const getChildBOM = async (bomLineOutput, parentBOMLine) => {
  let parentUid = parentBOMLine.itemRevOfBOMLine.uid;
  let parentLine = bomLineOutput.find((i) => i.parent.itemRevOfBOMLine.uid === parentUid);

  if (parentLine) {
    if (parentLine.children.length === 0) {
      let objType = parentLine.parent['itemRevOfBOMLine'].type;
      if (objType === prop.TYPE_FMEA_FAILURE_REVISION) {
        _createVmoByFailure(parentLine, parentBOMLine.parentInfo);
        return;
      }
      return;
    }

    for (const childLine of parentLine.children) {
      childLine['parentInfo'] = parentBOMLine.parentInfo;
      getStructureInfomation(childLine);
      getChildBOM(bomLineOutput, childLine);
    }
  }
};

const _assignObject = (modelObejct, bomLine, propName) => {
  if (modelObejct) {
    return {
      uid: modelObejct.uid,
      value: bomLine.props[propName].dbValues[0],
    };
  }
};

const getStructureInfomation = (childLine) => {
  let objType = childLine['itemRevOfBOMLine'].type; // Object Type
  let modelObject = childLine['itemRevOfBOMLine'];
  let childBOMLine = childLine['bomLine'];

  if (objType === prop.TYPE_FMEA_STRUCTURE_REV) {
    let lineLevel = childLine['bomLine'].props[prop.BOMLINE_LINE_LEVEL].dbValues;

    if (lineLevel == 1) {
      childLine.parentInfo[prop.PARENT_ASSY] = _assignObject(modelObject, childBOMLine, prop.BOMLINE_OBJECT_NAME);
    }
    if (lineLevel == 2) {
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

export async function buttonAction(data, ctx) {
  let bomWindow;
  try {
    const fmeaRevision = await loadObjectByPolicy('eOqNCesr5p7XAC', prop.TYPE_DFMEA_MASTER_REVISION);
    bomWindow = await bomUtils.createBOMWindow(null, fmeaRevision);
    let bomDatas = await bomUtils.expandPSAllLevels([bomWindow.bomLine], null, lgepObjectUtils.createPolicy(getBomLineProperties(), 'BOMLine'));
    let bomLineOutput = bomDatas.output;
    let topLine = bomLineOutput.find((i) => i.parent.itemRevOfBOMLine.uid === 'eOqNCesr5p7XAC');

    if (topLine) {
      for (const childLine of topLine.children) {
        childLine['parentInfo'] = {};
        getStructureInfomation(childLine);
        getChildBOM(bomLineOutput, childLine);
      }
    }

    // for (let i = 0; i < bomLineDatas.length; i++) {
    //     const bomLineData = bomLineDatas[i];
    //     let parentBOMLine = bomLineData.parent;
    //     let childList = bomLineData.children;

    //     if(childList.length !== 0){
    //         parentBOMLine = parentBOMLine.itemRevOfBOMLine.uid;
    //     }
    // }
  } catch (e) {
    //console.log('loadTableDatas', e);
  } finally {
    await bomUtils.closeBOMWindow(bomWindow.bomWindow);
  }

  //alert("!!");
  // lgepObjectUtils.createRelateAndSubmitObjects2("Fnd0Message",{
  //     "fnd0Subject": ["TEST MESSAGE CREATION"],
  //     "fnd0Priority": ["Normal"],
  //     // "fnd0EventType": [""],
  //     "fnd0Sender": [ctx.user.uid],
  //     "fnd0SentDate": ["2022-02-24T17:57:24+09:00"],
  //     "fnd0Receiver": [ctx.user.uid],
  //     "fnd0MessageBody": ["테스트용 메세지 생성"],
  //     // "fnd0RelatedObjects": [""],
  //     // "fnd0TargetObject": [""],
  // }).then( (res) => {
  //     //console.log({res});
  // })
}

export default exports = {
  initialize,
  buttonAction,
};

app.factory('testModuleService', () => exports);
