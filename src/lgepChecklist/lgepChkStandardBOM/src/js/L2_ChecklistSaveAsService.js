/**
 * Checklist SaveAs Service
 *
 * @module js/L2_ChecklistSaveAsService
 */

import app from 'app';
import awTableService from 'js/awTableService';
import awTableStateService from 'js/awTableStateService';
import browserUtils from 'js/browserUtils';
import eventBus from 'js/eventBus';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import logger from 'js/logger';
import popupService from 'js/popupService';
import soaService from 'soa/kernel/soaService';
import uwPropertyService from 'js/uwPropertyService';
import viewModelObjectService from 'js/viewModelObjectService';
import _ from 'lodash';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import L2_StandardBOMPropertyPolicyService from 'js/L2_StandardBOMPropertyPolicyService';
import L2_ChecklistMainService from 'js/L2_ChecklistMainService';

let exports = {};

let selectedChecklistItem;
let selectedChecklistItemRevision;

let topItem;
let topItemRevision;
let topTreeNode;

let deleteFlag = true;

let product = {};
let productContext = {};

let _ctx;
let _data;
let _dataProvider;
let _scope;
let _gridid = 'checklistSaveAsTree';

export async function loadChecklistSaveAsTree(ctx, data) {
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
      // logger.info("getTableViewModelPropertiesResponse: ", getTableViewModelPropertiesResponse);

      _.forEach(occInfos, function (occInfo) {
        const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId];
        modelObject.parentNode = parentNode;
        modelObject.numberOfChildren = occInfo.numberOfChildren;
        modelObjects.push(modelObject);
      });

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
    logger.info('getOccurrences3Response', getOccurrences3Response);

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
    logger.info('saveUserWorkingContextState2Response: ', saveUserWorkingContextState2Response);

    const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);
    // logger.info("getTableViewModelPropertiesResponse: ", getTableViewModelPropertiesResponse);

    const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];
    modelObject.numberOfChildren = parentOccurrenceNumberOfChildren;
    modelObjects.push(modelObject);
  }
  // logger.info("modelObjects: ", modelObjects);

  return modelObjects;
}

export function loadChecklistSaveAsTreeData(modelObjects, nodeBeingExpanded) {
  const treeNodes = [];
  _.forEach(modelObjects, function (modelObject) {
    // logger.info(modelObject);
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
    // logger.info(treeNode);

    treeNodes.push(treeNode);

    // 확장
    // if (treeNode.levelNdx < 2) {
    //     awTableStateService.saveRowExpanded(_data, _gridid, treeNode);
    // }
  });
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
  const selectedObjects = _dataProvider.getSelectedObjects();
  if (selectedObjects.length === 0) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, '체크리스트 생성을 위한 행을 선택해주세요.');
    return;
  }

  // 버튼 비활성화
  data.disabledButtonChk.dbValue = true;

  // 삭제 여부
  deleteFlag = false;

  lgepMessagingUtils.show(lgepMessagingUtils.INFORMATION, '체크리스트를 다른이름으로 저장중입니다.\n잠시 기다려주세요.');
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
     * 데이터셋 SaveAs
     */
    let saveAsDatasets;
    await lgepObjectUtils.getProperties(topItemRevision, [standardBOMConstants.IMAN_reference]);
    const saveAsReference = await lgepObjectUtils.loadObjects2(topItemRevision.props[standardBOMConstants.IMAN_reference].dbValues);
    if (saveAsReference) {
      saveAsDatasets = Object.values(saveAsReference);
    }

    /**
     * BOM 업데이트
     */
    await L2_StandardBOMService.expandAll(_scope, topTreeNode);
    const loadedVMObjects = _dataProvider.getViewModelCollection().loadedVMObjects;
    const saveViewModelEditAndSubmitWorkflow2Param = {
      inputs: L2_StandardBOMService.getSaveViewModelEditAndSubmitWorkflow2Param(loadedVMObjects, saveAsDatasets),
    };
    const saveViewModelEditAndSubmitWorkflow2Response = await soaService.post(
      'Internal-AWS2-2018-05-DataManagement',
      'saveViewModelEditAndSubmitWorkflow2',
      saveViewModelEditAndSubmitWorkflow2Param,
    );
    logger.info('saveViewModelEditAndSubmitWorkflow2Response: ', saveViewModelEditAndSubmitWorkflow2Response);

    // 메시지박스
    eventBus.publish('removeMessages');
    const objectString = topItemRevision.props.items_tag.uiValues[0];
    const message = '"' + objectString + '"' + '이(가) 저장되었습니다.\n어디로 이동하시겠습니까?';
    // lgepMessagingUtils.show(lgepMessagingUtils.INFORMATION, message);
    lgepMessagingUtils.show(
      lgepMessagingUtils.INFORMATION,
      message,
      ['체크리스트 목록', '체크리스트 에디터'],
      [
        function () {
          popupService.hide();

          // 체크리스트 화면 새로고침
          L2_ChecklistMainService.loadAndRefreshGrid(ctx.checklist.list);
        },
        function () {
          popupService.hide();

          // 체크리스트 화면 새로고침
          L2_ChecklistMainService.loadAndRefreshGrid(ctx.checklist.list);

          // 에디터 페이지 이동
          window.location.href = browserUtils.getBaseURL() + '#/checklistMain?uid=' + topItemRevision.uid;
          ctx.checklist.browseMode = '1';
        },
      ],
    );
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);

    data.disabledButtonChk.dbValue = false;
  }
}

export function onInit(ctx, data) {
  logger.info('onInit');

  // Policy
  L2_StandardBOMPropertyPolicyService.registerPropertyPolicy();

  // Context
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }
  ctx.checklist.standardBOM.isSelectAll = false;
  ctx.checklist.standardBOM.isAllLineView = false;
  ctx.checklist.standardBOM.selectedChecklistItem = selectedChecklistItem;
  ctx.checklist.standardBOM.selectedChecklistItemRevision = selectedChecklistItemRevision;
  ctx.checklist.standardBOM.topItem = topItem;
  ctx.checklist.standardBOM.topItemRevision = topItemRevision;

  _ctx = ctx;
  _data = data;
  _dataProvider = data.dataProviders.checklistSaveAsTreeDataProvider;
  deleteFlag = true;

  lgepObjectUtils.getProperties(selectedChecklistItem, standardBOMConstants.L2_Structure_PROPERTIES).then(() => {
    // 베이스 템플릿
    const templateUid = selectedChecklistItem.props.IMAN_based_on.dbValues[0];
    if (templateUid) {
      lgepObjectUtils.loadObject2(templateUid).then((templateItem) => {
        lgepObjectUtils.getProperties(templateItem, standardBOMConstants.L2_Structure_PROPERTIES).then(() => {
          uwPropertyService.setValue(data.baseProject, templateItem.props[standardBOMConstants.object_name].dbValues[0]);
          uwPropertyService.setValue(data.baseProjectProductCode, templateItem.props[standardBOMConstants.item_id].dbValues[0]);
          uwPropertyService.setValue(data.baseProjectModule, templateItem.props[standardBOMConstants.l2_product_class].dbValues[0]);
        });
      });
    }

    // 기존 체크리스트
    uwPropertyService.setValue(data.checklistProject, selectedChecklistItem.props[standardBOMConstants.object_name].dbValues[0]);
    uwPropertyService.setValue(data.checklistProjectProductCode, selectedChecklistItem.props[standardBOMConstants.item_id].dbValues[0]);
    uwPropertyService.setValue(data.checklistProjectModule, selectedChecklistItem.props[standardBOMConstants.l2_product_class].dbValues[0]);

    // Product
    uwPropertyService.setValue(data.productIdTextBox, selectedChecklistItem.props[standardBOMConstants.l2_product_id].dbValues[0]);

    // Project
    if (!selectedChecklistItemRevision.props[standardBOMConstants.l2_current_project]) {
      lgepObjectUtils.getProperties(selectedChecklistItemRevision, [standardBOMConstants.l2_current_project]).then(() => {
        uwPropertyService.setValue(data.projectIdTextBox, selectedChecklistItemRevision.props[standardBOMConstants.l2_current_project].dbValues[0]);
      });
    } else {
      uwPropertyService.setValue(data.projectIdTextBox, selectedChecklistItemRevision.props[standardBOMConstants.l2_current_project].dbValues[0]);
    }
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

  // 삭제
  if (deleteFlag) {
    lgepObjectUtils.deleteObject(topItem);
  }

  // Context
  topItem = undefined;
  topItemRevision = undefined;
  selectedChecklistItem = undefined;
  selectedChecklistItemRevision = undefined;
  ctx.checklist.standardBOM = undefined;

  // Policy
  L2_StandardBOMPropertyPolicyService.unRegisterPropertyPolicy();
}

async function openPopup(ctx, data) {
  try {
    const checkedRows = ctx.checklist.list.getCheckedRows();
    if (!Array.isArray(checkedRows) || checkedRows.length === 0) {
      // throw new Error("체크리스트를 선택해주세요.");
      lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '체크리스트를 선택해주세요.');
      return;
    }

    lgepLoadingUtils.openWindow();

    const selectedChecklistItemRevisionRow = checkedRows[checkedRows.length - 1];
    selectedChecklistItemRevision = selectedChecklistItemRevisionRow.getObject();
    if (!selectedChecklistItemRevision.props.items_tag) {
      await lgepObjectUtils.getProperties(selectedChecklistItemRevision, [standardBOMConstants.items_tag, standardBOMConstants.IMAN_reference]);
    }
    selectedChecklistItem = await lgepObjectUtils.loadObject2(selectedChecklistItemRevision.props.items_tag.dbValues[0]);

    // Save As
    const saveAsNewItemResponse = await L2_StandardBOMService.saveAsNewItem(selectedChecklistItemRevision);
    topItem = saveAsNewItemResponse.item;
    topItemRevision = saveAsNewItemResponse.itemRev;
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
    return;
  } finally {
    lgepLoadingUtils.closeWindow();
  }

  // Popup Caption
  let caption = data && data.i18n && data.i18n.checklistSaveAsCaption;
  if (!caption) {
    caption = '체크리스트 다른 이름으로 저장';
  }

  popupService.show({
    declView: 'L2_ChecklistSaveAs',
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
  eventBus.publish('standardBOMSelectTree.plTable.reload');
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
  loadChecklistSaveAsTree,
  loadChecklistSaveAsTreeData,

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
 * @member L2_ChecklistSaveAsService
 */
app.factory('L2_ChecklistSaveAsService', () => exports);
