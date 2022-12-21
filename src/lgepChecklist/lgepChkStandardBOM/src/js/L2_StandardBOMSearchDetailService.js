import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import viewModelService from 'js/viewModelService';
import viewModelObjectService from 'js/viewModelObjectService';
import awTableService from 'js/awTableService';
import eventBus from 'js/eventBus';

import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import L2_StandardBOMSearchAndSelectService from 'js/L2_StandardBOMSearchAndSelectService';

import L2_StandardBOMService from 'js/L2_StandardBOMService';
import soaService from 'soa/kernel/soaService';

var exports = {};

let product = {};
let productContext = {};
let topTreeNode;

/**
 * 체크리스트 생성 메뉴 내에서의 편집 기능 실행 전,
 * 테이블의 캐시 정보를 초기화 시키고, 뷰를 로드시킨다.
 *
 * @param {*} ctx
 * @param {*} data
 */
export function onMount(ctx, data) {
  // 1. 캐시 내에서 테이블의 정보를 초기화 시킨다.
  let awTreeTableState = JSON.parse(localStorage.getItem('awTreeTableState:/'));
  awTreeTableState.L2_StandardBOMSearchDetail = undefined;
  let stringified = JSON.stringify(awTreeTableState);
  localStorage.setItem('awTreeTableState:/', stringified);
  // 2. 테이블의 Element ID를 통해 ViewModel을 가져오고, 이를 통해서 트리테이블을 로드한다.
  let view = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
  loadStandardBOMTreeDetail('standardBOMTreeDetailDataProvider', appCtxService.ctx, view);
}

/**
 * 트리테이블의 ROW를 재귀적으로 불러온다.
 * 이 때, N레벨로 펼치기, 특정 타입만 조회하기 등도 예외처리를 통해서 가능하다.
 * @param {*} targetTreeNode 대상이 되는 트리 테이블의 Node
 * @param {*} treeNodeArray 전체 트리테이블의 Array
 * @param {*} expandLevel N레벨까지 펼치기
 * @param {*} type 특정 타입만 조회하도록 설정
 * @returns
 */
function _recursiveCreateTreeNode(targetTreeNode, treeNodeArray, expandLevel, type) {
  //1. 대상이 되는 TreeNode (ROW)에 originalObject 가 있는지를 검사한다.
  //originalObject는 가장 처음 객체들을 불러올 때, 일괄적으로 넣어줬기 때문에 보통 있다고 가정한다.
  if (targetTreeNode.originalObject) {
    let mo = targetTreeNode.originalObject;
    // 2. 트리의 자식 노드가 있는 경우를 검사한다.
    // isLeaf 속성을 통해서 AwTable의 펼침/접힘 아이콘의 유무가 결정되기 때문에 중요하다.
    if (mo._children && mo._children.length > 0) {
      if (appCtxService.ctx.checklist.standardBOM.includeType && appCtxService.ctx.checklist.standardBOM.includeType.length > 0) {
        let filterArray = mo._children.filter((e) =>
          appCtxService.ctx.checklist.standardBOM.includeType.includes(lgepObjectUtils.getObject(e.props.awb0UnderlyingObject.dbValues[0]).type),
        );
        if (filterArray.length > 0) {
          targetTreeNode.isLeaf = false;
        } else {
          targetTreeNode.isLeaf = true;
          return;
        }
      } else {
        targetTreeNode.isLeaf = false;
      }
    } else {
      targetTreeNode.isLeaf = true;
    }
    // 3. 특정 타입만 조회가능하도록 하기 위해, type 매개변수를 통해 포함되지 않으면 함수를 종료시켜준다.
    if (type) {
      let typeArray = type.split(',');
      if (!typeArray.includes(lgepObjectUtils.getObject(targetTreeNode.props.awb0UnderlyingObject.dbValues[0]).type)) return;
    }
    // 4. 해당 IF 문을 통해서, 매개변수로 입력받은 expandLevel 이 현재 트리 노드와 차이가 있다면 재귀문을 빠져나가도록 처리한다.
    // 뿐만 아니라, 트리 노드의 자식 유무도 검사한다.
    if ((mo._children && mo._children.length > 0 && targetTreeNode.levelNdx < expandLevel) || (mo._children && mo._children.length > 0 && !expandLevel)) {
      // 재귀문 내로 들어 오는 경우, 자식이 있다는 이야기가 되기 때문에 펼쳐준다
      targetTreeNode.isExpanded = true;
      targetTreeNode.childNdx = mo._children.length;
      let children = [];
      //자식의 타입을 검사하여, 재귀문을 빠져나가도록 처리한다.
      for (const moChild of mo._children) {
        if (
          appCtxService.ctx.checklist.standardBOM.includeType &&
          appCtxService.ctx.checklist.standardBOM.includeType.length > 0 &&
          !appCtxService.ctx.checklist.standardBOM.includeType.includes(lgepObjectUtils.getObject(moChild.props.awb0UnderlyingObject.dbValues[0]).type)
        ) {
          continue;
        }
        // 5.여기까지 문제없이 통과했다면, 이제 트리노드를 생성한다.
        let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(moChild);
        let treeVmoChild = awTableService.createViewModelTreeNode(
          vmoChild.uid,
          vmoChild.type,
          vmoChild.props.object_string.dbValues[0],
          targetTreeNode.levelNdx + 1,
          targetTreeNode.levelNdx + 2,
          vmoChild.typeIconURL,
        );
        // 함수 사용 시 필요한 각종 속성을 입력시켜준다.
        treeVmoChild.parentNode = targetTreeNode;
        // ViewModelTreeNode는 일반 ViewModelObject나 ModelObject 처럼 props 를 가지지 못하는 경우가 많으므로, 넣어준다.
        treeVmoChild.props = vmoChild.props;
        treeVmoChild.originalObject = moChild;
        //Alternate ID는 일종의 BOM Path 이다. Top 기준으로 우측 -> 좌측 으로 읽으면 순서대로 최하위 자식까지 PATH를 볼 수 있다.
        treeVmoChild.alternateID = treeVmoChild.uid + ',' + targetTreeNode.alternateID;
        //Display NAME에 입력된 문자열로
        treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
        treeNodeArray.push(treeVmoChild);
        _recursiveCreateTreeNode(treeVmoChild, treeNodeArray, expandLevel, type);
        children.push(treeVmoChild);
      }
      targetTreeNode.children = children;
      return targetTreeNode;
    }
  }
}

// 뒤로가기 버튼
export function standardBOMBack() {
  ctx.checklist.standardBOM.viewData.disabledButtonChk.dbValue = false;
  delete ctx.checklist.standardBOM.currentProductContext;
  delete ctx.checklist.standardBOM.isDetailView;
  delete ctx.checklist.standardBOM.isEditableNode;
  delete ctx.checklist.standardBOM.initComplete;
  delete ctx.checklist.standardBOM.selectBomTreeNode;
  delete ctx.checklist.standardBOM.currentDetailObject;
  delete ctx.checklist.standardBOM.detailTop;
  delete ctx.checklist.standardBOM.selectBomTreeNode;
  delete ctx.checklist.standardBOM.selectBomTreeNodeType;
  delete ctx.checklist.standardBOM.occurrenceList;

  eventBus.publish('standardBOMTree.plTable.reload');
}

export async function standardselectBomTreeNodeChangeEvent(ctx, data, eventData) {
  ctx.checklist.standardBOM.previousView = data;
  L2_StandardBOMSearchAndSelectService.standardselectBomTreeNodeChangeEvent(ctx, data, eventData);
  let selectedObject = eventData.selectedObjects[0];
  if (!selectedObject) {
    return;
  }

  if (selectedObject.props.l2_is_checklist_target && selectedObject.props.l2_is_checklist_target.dbValues[0] == 'Y') {
    ctx.checklist.standardBOM.isEditableNode = true;
    ctx.checklist.standardBOM.currentDetailObject = { uid: selectedObject.props.awb0UnderlyingObject.dbValue, type: 'L2_StructureRevision' };
    if (!ctx.checklist.standardBOM.viewData) {
      ctx.checklist.standardBOM.viewData = data;
    }
  } else {
    ctx.checklist.standardBOM.isEditableNode = false;
  }
}

export async function loadAndExpand(dpName, ctx, data, expandLevel, expandType) {
  onMount();
  loadStandardBOMTreeDetail(dpName, ctx, data, expandLevel, expandType);
}

export async function loadStandardBOMTreeDetail(dpName, ctx, data, expandLevel, expandType) {
  ctx.checklist.standardBOM.viewData.disabledButtonChk.dbValue = true;
  ctx.checklist.interactionMatrixEditSaving = true;
  let targetObject = appCtxService.ctx.checklist.standardBOM.currentDetailObject;
  let bomTreeMap = new Map();
  let parentOccurrence;
  lgepBomUtils
    .getOccurrences3(targetObject)
    .then((response) => {
      let rootProductContext = response.rootProductContext;
      if (!data) {
        data = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
      }
      data.rootProductContext = rootProductContext;
      let parentOccurrenceObject = lgepObjectUtils.getObject(response.parentOccurrence.occurrenceId);
      return lgepBomUtils.getOccurrences3(targetObject, rootProductContext, parentOccurrenceObject);
    })
    .then((response) => {
      parentOccurrence = response.parentOccurrence;
      ctx.checklist.standardBOM.currentProductContext = {
        uid: response.rootProductContext.uid,
        type: response.rootProductContext.type,
      };
      // getOccurrence3의 response들을 분석하여, 부모-자식 관계를 Map에 할당한다.
      let infos = response.parentChildrenInfos;
      if (infos.length == 0) {
        return {
          ServiceData: {
            modelObjects: [lgepObjectUtils.getObject(parentOccurrence.occurrenceId)],
          },
        };
      }
      let allObjectUids = [];
      for (const info of infos) {
        if (!allObjectUids.includes(info.parentInfo.occurrenceId)) allObjectUids.push(info.parentInfo.occurrenceId);
        if (info.parentInfo.numberOfChildren > 0) {
          let _children = [];
          for (const childInfo of info.childrenInfo) {
            if (!allObjectUids.includes(childInfo.occurrenceId)) allObjectUids.push(childInfo.occurrenceId);
            _children.push(childInfo.occurrenceId);
          }
          bomTreeMap.set(info.parentInfo.occurrenceId, _children);
        }
      }
      // 3. 해당 BOM을 In-Context 모드로 변경한다.
      return lgepBomUtils.saveUserWorkingContextState2(parentOccurrence.occurrenceId).then(() => {
        return lgepBomUtils.getTableViewModelProperties(allObjectUids);
      });
    })
    .then((getTableViewModelPropsResp) => {
      //4. 부모-자식 관계가 담긴 Map으부터 내용을 읽어와 ChecklistRow를 알맞게 생성한다.
      //topLine은 생성되지 않는 경우가 있기 때문에 예외적으로 별도로 생성한다.
      let responseModelObjects = getTableViewModelPropsResp.ServiceData.modelObjects;
      let modelObjects = Object.values(responseModelObjects);
      let topLine = lgepObjectUtils.getObject(parentOccurrence.occurrenceId);
      let allObjects = [];

      //modelObject에 부모-자식 관계를 할당한다.
      for (const modelObject of modelObjects) {
        if (modelObject.type == 'Awb0DesignElement') {
          allObjects.push(modelObject);
          let children = bomTreeMap.get(modelObject.uid);
          if (children) {
            modelObject._children = [];
            for (const childUid of children) {
              let child = responseModelObjects[childUid];
              if (child) {
                modelObject._children.push(child);
                child.parent = modelObject;
              }
            }
          }
        }
      }
      return allObjects.filter((e) => e.uid == parentOccurrence.occurrenceId);
    })
    .then((response) => {
      let vmo = viewModelObjectService.constructViewModelObjectFromModelObject(response[0]);
      let topTreeVmo = awTableService.createViewModelTreeNode(vmo.uid, vmo.type, vmo.props.object_string.dbValues[0], 0, 1, vmo.typeIconURL);
      topTreeVmo.props = vmo.props;
      topTreeVmo.originalObject = response[0];
      let data = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
      topTreeVmo.isExpanded = true;
      topTreeVmo.alternateID = topTreeVmo.uid + ',' + 'top';
      topTreeVmo.displayName = vmo.props.object_string.dbValues[0];
      let treeNodeArray = [topTreeVmo];
      ctx.checklist.standardBOM.detailTop = topTreeVmo;
      _recursiveCreateTreeNode(topTreeVmo, treeNodeArray, expandLevel, expandType);
      data.dataProviders[dpName].viewModelCollection.loadedVMObjects = treeNodeArray;
      // data.dataProviders[dpName].selectionModel.addToSelection(topTreeVmo);
    });
}

export function loadStandardBOMTreeDetailPartial(dpName, ctx, data) {
  let modelObjects = [];
  const parentNode = data.treeLoadInput.parentNode;
  if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
    let product = {
      uid: parentNode.props.awb0Archetype.dbValues[0],
      type: 'L2_StructureRevision',
    };
    const requestParam = L2_StandardBOMService.getOccurrences3Param(product, data.rootProductContext, parentNode.uid);
    requestParam.inputData.requestPref.startFreshNavigation = ['false'];
    delete requestParam.inputData.requestPref.includePath;
    delete requestParam.inputData.requestPref.loadTreeHierarchyThreshold;
    return soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam).then((getOccurrences3Response) => {
      const parentChildrenInfos = getOccurrences3Response.parentChildrenInfos;
      if (Array.isArray(parentChildrenInfos) && parentChildrenInfos.length > 0) {
        const occInfos = [];
        const childrenInfo = parentChildrenInfos[0].childrenInfo;
        for (let i = 0; i < childrenInfo.length; i++) {
          const childInfo = childrenInfo[i];
          const occurrenceId = childInfo.occurrenceId;
          const numberOfChildren = childInfo.numberOfChildren;
          occInfos.push({
            occurrenceId: occurrenceId,
            numberOfChildren: numberOfChildren,
          });
        }
        const occurrenceIds = occInfos.map((occInfo) => occInfo.occurrenceId);
        return L2_StandardBOMService.getTableViewModelProperties(occurrenceIds).then((getTableViewModelPropertiesResponse) => {
          for (const occInfo of occInfos) {
            const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId];
            let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(modelObject);
            let treeVmoChild = awTableService.createViewModelTreeNode(
              vmoChild.uid,
              vmoChild.type,
              vmoChild.props.object_string.dbValues[0],
              data.treeLoadInput.parentNode.levelNdx + 1,
              data.treeLoadInput.parentNode.levelNdx + 2,
              vmoChild.typeIconURL,
            );
            treeVmoChild.parentNode = data.treeLoadInput.parentNode;
            treeVmoChild.props = vmoChild.props;
            treeVmoChild.originalObject = modelObject;
            treeVmoChild.alternateID = treeVmoChild.uid + ',' + data.treeLoadInput.parentNode.alternateID;
            treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
            treeVmoChild.numberOfChildren = occInfo.numberOfChildren;
            if (treeVmoChild.numberOfChildren && treeVmoChild.numberOfChildren > 0) {
              treeVmoChild.isLeaf = false;
            } else {
              treeVmoChild.isLeaf = true;
            }
            modelObjects.push(treeVmoChild);
          }
          let index = data.dataProviders[dpName].viewModelCollection.loadedVMObjects.map((e) => e.uid).indexOf(data.treeLoadInput.parentNode.uid);
          for (let i = modelObjects.length - 1; i >= 0; i--) {
            let uidArray = data.dataProviders[dpName].viewModelCollection.loadedVMObjects.map((e) => e.uid);
            if (!uidArray.includes(modelObjects[i].uid)) {
              arrayInsertAt(data.dataProviders[dpName].viewModelCollection.loadedVMObjects, index + 1, modelObjects[i]);
            }
          }
          return modelObjects;
        });
      }
    });
  }
}

export function setIncludeTypes(dpName, ctx, data, includeType) {
  if (includeType) {
    let array = includeType.split(',');
    appCtxService.ctx.checklist.standardBOM.includeType = array;
  } else {
    appCtxService.ctx.checklist.standardBOM.includeType = [];
  }
  loadStandardBOMTreeDetail(dpName, ctx, data);
}

function arrayInsertAt(destArray, pos, arrayToInsert) {
  var args = [];
  args.push(pos); // where to insert
  args.push(0); // nothing to remove
  args = args.concat(arrayToInsert); // add on array to insert
  destArray.splice.apply(destArray, args); // splice it in
}

export default exports = {
  onMount,
  standardBOMBack,
  standardselectBomTreeNodeChangeEvent,

  loadStandardBOMTreeDetail,
  loadStandardBOMTreeDetailPartial,
  loadAndExpand,
  setIncludeTypes,
};
app.factory('L2_StandardBOMSearchDetailService', () => exports);
