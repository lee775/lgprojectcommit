/**
 * Checklist Structure Edit Service
 *
 * @module js/L2_ChecklistStructureEditService
 */

import app from 'app';
import awTableService from 'js/awTableService';
import awTableStateService from 'js/awTableStateService';
import eventBus from 'js/eventBus';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import logger from 'js/logger';
import popupService from 'js/popupService';
import soaService from 'soa/kernel/soaService';
import uwPropertyService from 'js/uwPropertyService';
import viewModelObjectService from 'js/viewModelObjectService';
import _ from 'lodash';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import L2_StandardBOMPropertyPolicyService from 'js/L2_StandardBOMPropertyPolicyService';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import L2_ChecklistOpenService from 'js/L2_ChecklistOpenService';
import { removeTagInStr } from 'js/L2_ChecklistMasterEditService';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import uwPropertySvc from 'js/uwPropertyService';

let exports = {};

let topItem;
let topItemRevision;
let topTreeNode;

let product = {};
let productContext = {};

let _ctx;
let _data;
let _dataProvider;
let _scope;
let _gridid = 'checklistStructureEditTree';

export async function loadChecklistStructureEditTree(ctx, data) {
  if (!topItemRevision) {
    return [];
  }

  let modelObjects = [];
  if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
    const parentNode = data.treeLoadInput.parentNode;
    const requestParam = L2_StandardBOMService.getOccurrences3Param(product, productContext, parentNode.uid);
    requestParam.inputData.requestPref.startFreshNavigation = ['false'];
    delete requestParam.inputData.requestPref.includePath;
    delete requestParam.inputData.requestPref.loadTreeHierarchyThreshold;

    const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);
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
      const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties(occurrenceIds);

      _.forEach(occInfos, function (occInfo) {
        const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId];
        modelObject.parentNode = parentNode;
        modelObject.numberOfChildren = occInfo.numberOfChildren;
        modelObjects.push(modelObject);
      });

      //구조 편집 기능에서 전체 보기 시 선택하지 않은 다른 모듈 숨기기 #183
      modelObjects = modelObjects.filter(function (modelObject) {
        if (
          (modelObject.parentNode.props.awb0UnderlyingObject.dbValues[0] != topItemRevision.uid &&
            modelObject.props.l2_is_selected &&
            modelObject.props.l2_is_selected.dbValues[0] !== '') ||
          (modelObject.parentNode.props.awb0UnderlyingObject.dbValues[0] == topItemRevision.uid && modelObject.props.l2_is_selected.dbValues[0] === 'Y')
        ) {
          return modelObject;
        }
      });

      //구조 편집 기능에서 전체 보기 시 선택하지 않은 다른 모듈 숨기기 #183 END
      if (!ctx.checklist.standardBOM.isAllLineView) {
        modelObjects = modelObjects.filter(function (modelObject) {
          if (modelObject.props.l2_is_selected && modelObject.props.l2_is_selected.dbValues[0] === 'Y') {
            return modelObject;
          }
        });
      }
    }
  } else {
    const requestParam = L2_StandardBOMService.getOccurrences3Param(product);
    const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);

    // Occurrence
    const parentOccurrence = getOccurrences3Response.parentOccurrence;
    const parentOccurrenceId = parentOccurrence.occurrenceId;
    const parentOccurrenceNumberOfChildren = parentOccurrence.numberOfChildren;

    // Product Context
    productContext.uid = getOccurrences3Response.rootProductContext.uid;
    productContext.type = getOccurrences3Response.rootProductContext.type;

    // In Context
    const inContextParam = L2_StandardBOMService.getInContextParam(parentOccurrenceId);
    const saveUserWorkingContextState2Response = await soaService.post(
      'Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement',
      'saveUserWorkingContextState2',
      inContextParam,
    );

    const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);

    const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];
    modelObject.numberOfChildren = parentOccurrenceNumberOfChildren;
    modelObjects.push(modelObject);
  }

  return modelObjects;
}

export async function loadChecklistStructureEditTreeData(modelObjects, nodeBeingExpanded) {
  const treeNodes = [];
  for (const modelObject of modelObjects) {
    const numberOfChildren = modelObject.numberOfChildren;
    const parentNode = modelObject.parentNode;

    const vmo = viewModelObjectService.constructViewModelObjectFromModelObject(modelObject);
    vmo.isLeaf = !(numberOfChildren > 0);
    const objectString = vmo.props.object_string.dbValues[0];

    // 트리 노드 생성
    const treeNode = awTableService.createViewModelTreeNode(
      vmo.uid,
      vmo.type,
      objectString,
      nodeBeingExpanded.levelNdx,
      nodeBeingExpanded.levelNdx + 1,
      vmo.typeIconURL,
    );

    treeNode.alternateID = treeNode.uid + ',' + nodeBeingExpanded.alternateID;
    treeNode.levelNdx = nodeBeingExpanded.levelNdx + 1;
    treeNode.parentNode = parentNode;
    Object.assign(treeNode, vmo);

    if (treeNode.isLeaf) {
      const values = await _readPropertiesFromTextFile(treeNode.props.l2_reference_dataset.dbValues[0]);
      const failureEffectValue = removeTagInStr(values['failureEffect']);
      const failureEffectProperty = uwPropertySvc.createViewModelProperty('failrue_effect', failureEffectValue, 'STRING', failureEffectValue, [
        failureEffectValue,
      ]);
      treeNode.props['failrue_effect'] = failureEffectProperty;

      const failureMechanismValue = removeTagInStr(values['failureDetail']);
      const failureMechanismProperty = uwPropertySvc.createViewModelProperty('failrue_effect', failureMechanismValue, 'STRING', failureMechanismValue, [
        failureMechanismValue,
      ]);
      treeNode.props['failure_mechanism'] = failureMechanismProperty;
    }

    treeNodes.push(treeNode);

    // 확장
    // if (treeNode.levelNdx < 2) {
    //     awTableStateService.saveRowExpanded(_data, _gridid, treeNode);
    // }
  }

  if (nodeBeingExpanded.uid === 'top' && treeNodes.length > 0) {
    topTreeNode = treeNodes[0];
  }

  return {
    // parentElement: nodeBeingExpanded.uid,
    parentNode: nodeBeingExpanded,
    childNodes: treeNodes,
    totalChildCount: treeNodes.length,
    startChildNdx: 0,
  };
}

export async function okAction(ctx, data) {
  logger.info('okAction');

  const selectedObjects = _dataProvider.getSelectedObjects();
  if (selectedObjects.length === 0) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, '체크리스트 편집을 위한 행을 선택해주세요.');
    return;
  }

  // 체크리스트
  try {
    const productId = data.productIdTextBox.uiValue;
    const projectId = data.projectIdTextBox.uiValue;

    // 체크리스트 속성 업데이트
    await lgepObjectUtils.setProperties(
      topItem,
      [standardBOMConstants.l2_is_checklist, standardBOMConstants.l2_is_template, standardBOMConstants.l2_product_id],
      ['Y', '', productId],
    );
    await lgepObjectUtils.setProperty(topItemRevision, standardBOMConstants.l2_current_project, projectId);

    /**
     * BOM 업데이트
     */
    const loadedVMObjects = _dataProvider.getViewModelCollection().loadedVMObjects;
    const saveViewModelEditAndSubmitWorkflow2Param = {
      inputs: L2_StandardBOMService.getSaveViewModelEditAndSubmitWorkflow2Param(loadedVMObjects),
    };
    const saveViewModelEditAndSubmitWorkflow2Response = await soaService.post(
      'Internal-AWS2-2018-05-DataManagement',
      'saveViewModelEditAndSubmitWorkflow2',
      saveViewModelEditAndSubmitWorkflow2Param,
    );
    logger.info('saveViewModelEditAndSubmitWorkflow2Response: ', saveViewModelEditAndSubmitWorkflow2Response);

    // 메시지박스
    const objectString = topItemRevision.props.items_tag.uiValues[0];
    const message = '"' + objectString + '"' + '이(가) 저장되었습니다.';
    lgepMessagingUtils.show(lgepMessagingUtils.INFORMATION, message);

    // 체크리스트 화면 새로고침
    L2_ChecklistOpenService.loadAndRefreshOpenGrid();
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
  }
}

export function onInit(ctx, data) {
  // Policy
  L2_StandardBOMPropertyPolicyService.registerPropertyPolicy();

  // Context
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }
  ctx.checklist.standardBOM.isSelectAll = false;
  ctx.checklist.standardBOM.isAllLineView = false;
  ctx.checklist.standardBOM.topItem = topItem;
  ctx.checklist.standardBOM.topItemRevision = topItemRevision;

  _ctx = ctx;
  _data = data;
  _dataProvider = data.dataProviders.checklistStructureEditTreeDataProvider;

  lgepObjectUtils.getProperties(topItem, [standardBOMConstants.l2_product_id]).then(() => {
    uwPropertyService.setValue(data.productIdTextBox, topItem.props[standardBOMConstants.l2_product_id].dbValues[0]);
  });
  lgepObjectUtils.getProperties(topItemRevision, [standardBOMConstants.l2_current_project]).then(() => {
    uwPropertyService.setValue(data.projectIdTextBox, topItemRevision.props[standardBOMConstants.l2_current_project].dbValues[0]);
  });

  product = {
    uid: topItemRevision.uid,
    type: topItemRevision.type,
  };
}

export function onMount(ctx, data) {
  logger.info('onMount');
}

export function onUnmount(ctx, data) {
  logger.info('onUnmount');

  // BOM 닫기 구현해야함.

  // Context
  topItem = undefined;
  topItemRevision = undefined;
  ctx.checklist.standardBOM = undefined;

  // Policy
  L2_StandardBOMPropertyPolicyService.unRegisterPropertyPolicy();
}

async function openPopup(ctx, data) {
  topItemRevision = ctx.checklist.target;
  if (!topItemRevision) {
    return;
  }
  if (!topItemRevision.props.items_tag) {
    await lgepObjectUtils.getProperties([topItemRevision], [standardBOMConstants.items_tag]);
  }
  topItem = await lgepObjectUtils.loadObject2(topItemRevision.props.items_tag.dbValues[0]);

  // Popup Caption
  let caption = data && data.i18n && data.i18n.checklistStructureEditCaption;
  if (!caption) {
    caption = '체크리스트 구조 편집';
  }

  popupService.show({
    declView: 'L2_ChecklistStructureEdit',
    locals: {
      anchor: 'closePopupAnchor',
      caption: caption,
      hasCloseButton: true,
    },
    options: {
      clickOutsideToClose: false,
      draggable: true,
      enableResize: true,
      isModal: true,
      // placement: "right-start",
      // reference: referenceElement,
      width: 1200,
      height: 800,
      hooks: {
        whenClosed: (res) => {
          // logger.info("whenClosed", res);
        },
        whenOpened: async (res) => {
          // logger.info("whenOpened", res);
        },
      },
    },
  });
}

export function treeAllLineView(ctx, data) {
  // logger.info("treeAllLineView");

  ctx.checklist.standardBOM.isAllLineView = !ctx.checklist.standardBOM.isAllLineView;
  eventBus.publish('checklistStructureEditTree.plTable.reload');
}

export function treeCollapseBelow(ctx, data) {
  // logger.info("treeCollapseBelow");

  const loadedVMObjects = _dataProvider.getViewModelCollection().loadedVMObjects;
  const findExpandedNodes = awTableStateService.findExpandedNodes(_data, _gridid, loadedVMObjects);
  if (findExpandedNodes) {
    const findExpandedNodesValues = Object.values(findExpandedNodes);
    _.forEach(findExpandedNodesValues, function (findExpandedNodesValue) {
      const expandedNode = findExpandedNodesValue.nodeToExpand;
      delete expandedNode.isExpanded;
      awTableStateService.saveRowCollapsed(_data, _gridid, expandedNode);
      _dataProvider
        .collapseObject(null, expandedNode)
        .then((updatedViewModelCollection) => {
          // logger.info("updatedViewModelCollection: ", updatedViewModelCollection);
        })
        .finally(() => {
          delete expandedNode.loadingStatus;
        });
    });
  }
}

export async function treeExpandBelow(ctx, data) {
  // logger.info("treeExpandBelow");

  if (!_scope) {
    return;
  }

  const loadedVMObjects = _dataProvider.getViewModelCollection().loadedVMObjects;
  for (let i = 0; i < loadedVMObjects.length; i++) {
    const loadedVMObject = loadedVMObjects[i];
    if (loadedVMObject.isLeaf || loadedVMObject.isExpanded) {
      continue;
    }

    await L2_StandardBOMService.expandAll(_scope, loadedVMObject);
  }
}

export async function treeGridSelection(data, eventData) {
  // logger.info("treeGridSelection");

  const selectedVmo = eventData.selectedVmo;
  if (!selectedVmo) {
    return;
  }

  if (selectedVmo.selected) {
    // 하위 노드 확장
    await L2_StandardBOMService.expandAll(_scope, selectedVmo);

    // 선택
    L2_StandardBOMService.recursiveAddToSelectionForChildren(_dataProvider, selectedVmo);
    L2_StandardBOMService.recursiveAddToSelectionForParent(_dataProvider, selectedVmo);
  } else {
    L2_StandardBOMService.recursiveRemoveFromSelectionForChildren(_dataProvider, selectedVmo);
    L2_StandardBOMService.recursiveRemoveFromSelectionForParent(_dataProvider, selectedVmo);
  }
}

export function treeSelectAll(ctx, data) {
  ctx.checklist.standardBOM.isSelectAll = !ctx.checklist.standardBOM.isSelectAll;
  if (ctx.checklist.standardBOM.isSelectAll) {
    _dataProvider.selectAll();
  } else {
    _dataProvider.selectNone();
  }
}

export function treeSelectionChangeEvent(ctx, data, eventData) {
  // logger.info("treeSelectionChangeEvent");

  _scope = eventData.scope;
}

export function treeTreeNodesLoaded(ctx, data, eventData) {
  // logger.info("treeTreeNodesLoaded");

  const childNodes = eventData.treeLoadResult.childNodes;
  _.forEach(childNodes, function (childNode) {
    const selected = childNode.props.l2_is_selected ? (childNode.props.l2_is_selected.dbValues[0] === 'Y' ? true : false) : false;
    if (selected) {
      _dataProvider.selectionModel.addToSelection(childNode);
    }
  });
}

export default exports = {
  loadChecklistStructureEditTree,
  loadChecklistStructureEditTreeData,

  okAction,

  onInit,
  onMount,
  onUnmount,

  openPopup,

  treeAllLineView,
  treeCollapseBelow,
  treeExpandBelow,
  treeGridSelection,
  treeSelectAll,
  treeSelectionChangeEvent,
  treeTreeNodesLoaded,
};
/**
 * @memberof NgServices
 * @member L2_ChecklistStructureEditService
 */
app.factory('L2_ChecklistStructureEditService', () => exports);
