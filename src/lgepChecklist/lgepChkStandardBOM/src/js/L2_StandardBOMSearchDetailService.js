import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import viewModelService from 'js/viewModelService';
import viewModelObjectService from 'js/viewModelObjectService';
import awTableService from 'js/awTableService';
import eventBus from 'js/eventBus';

import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import { ERROR, show, INFORMATION } from 'js/utils/lgepMessagingUtils';
import L2_StandardBOMSearchAndSelectService from 'js/L2_StandardBOMSearchAndSelectService';

var exports = {};

export function onMount(data) {
  ctx.checklist.standardBOM.viewData.disabledButtonChk.dbValue = true;
  let targetObject = appCtxService.ctx.checklist.standardBOM.currentDetailObject;
  let bomTreeMap = new Map();
  let parentOccurrence;
  lgepBomUtils
    .getOccurrences3(targetObject)
    .then((response) => {
      let rootProductContext = response.rootProductContext;
      let parentOccurrenceObject = lgepObjectUtils.getObject(response.parentOccurrence.occurrenceId);
      return lgepBomUtils.getOccurrences3(targetObject, rootProductContext, parentOccurrenceObject);
    })
    .then((response) => {
      parentOccurrence = response.parentOccurrence;
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
      _recursiveCreateTreeNode(topTreeVmo, treeNodeArray);
      data.dataProviders.standardBOMTreeDetailDataProvider.viewModelCollection.loadedVMObjects = treeNodeArray;
      data.dataProviders.standardBOMTreeDetailDataProvider.selectionModel.addToSelection(topTreeVmo);
    });
}

function _recursiveCreateTreeNode(targetTreeNode, treeNodeArray) {
  if (targetTreeNode.originalObject) {
    let mo = targetTreeNode.originalObject;
    targetTreeNode.isLeaf = true;
    if (mo._children && mo._children.length > 0) {
      targetTreeNode.isExpanded = true;
      targetTreeNode.childNdx = mo._children.length;
      let children = [];
      for (const moChild of mo._children) {
        let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(moChild);
        let treeVmoChild = awTableService.createViewModelTreeNode(
          vmoChild.uid,
          vmoChild.type,
          vmoChild.props.object_string.dbValues[0],
          targetTreeNode.levelNdx + 1,
          targetTreeNode.levelNdx + 2,
          vmoChild.typeIconURL,
        );
        treeVmoChild.parentNode = targetTreeNode;
        treeVmoChild.props = vmoChild.props;
        treeVmoChild.originalObject = moChild;
        treeVmoChild.alternateID = treeVmoChild.uid + ',' + targetTreeNode.alternateID;
        treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
        treeNodeArray.push(treeVmoChild);
        _recursiveCreateTreeNode(treeVmoChild, treeNodeArray);
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
  delete ctx.checklist.standardBOM.isDetailView;
  delete ctx.checklist.standardBOM.isEditableNode;
  delete ctx.checklist.standardBOM.initComplete;
  delete ctx.checklist.standardBOM.bomTreeSelection;
  delete ctx.checklist.standardBOM.currentDetailObject;
  delete ctx.checklist.standardBOM.detailTop;
  delete ctx.checklist.standardBOM.selectBomTreeNode;
  delete ctx.checklist.standardBOM.selectBomTreeNodeType;
  ctx.checklist.standardBOM.viewData.dataProviders.standardBOMTreeDataProvider.selectNone();
}

export async function standardBOMTreeSelectionChangeEvent(ctx, data, eventData) {
  ctx.checklist.standardBOM.previousView = data;
  L2_StandardBOMSearchAndSelectService.standardBOMTreeSelectionChangeEvent(ctx, data, eventData);
  let selectedObject = eventData.selectedObjects[0];
  if (!selectedObject) {
    return;
  }
  // detail 편집 모드로
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

export default exports = {
  onMount,
  standardBOMBack,
  standardBOMTreeSelectionChangeEvent,
};
app.factory('L2_StandardBOMSearchDetailService', () => exports);
