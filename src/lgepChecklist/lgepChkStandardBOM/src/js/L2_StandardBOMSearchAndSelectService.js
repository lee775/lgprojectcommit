/**
 * Standard BOM Search And Select Service
 *
 * @module js/L2_StandardBOMSearchAndSelectService
 */
import app from 'app';
import awTableService from 'js/awTableService';
import eventBus from 'js/eventBus';
import soaService from 'soa/kernel/soaService';
import appCtxService, { ctx } from 'js/appCtxService';
import viewModelService from 'js/viewModelService';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import logger from 'js/logger';
import popupService from 'js/popupService';
import viewModelObjectService from 'js/viewModelObjectService';
import _ from 'lodash';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import L2_StandardBOMPropertyPolicyService from 'js/L2_StandardBOMPropertyPolicyService';
import L2_ChecklistCreateService from 'js/L2_ChecklistCreateService';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import { initEditorSection, saveEditInfo } from 'js/L2_StandardBOMSearchAndSelectEditService';
import awTableStateService from 'js/awTableStateService';

let exports = {};

let selectedTemplateItemRevision;
let selectedStructureItemRevision;
let selectedStructureBOMLine;

let bomWindow;

let _ctx;
let _data;
let _dataProvider;

export async function loadStandardBOMFolderTree(ctx, data) {
  try {
    let parentNode = null;
    if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
      parentNode = data.treeLoadInput.parentNode;
    } else {
      // Top 폴더(제품구조관리)
      const PREF_L2_CHECKLIST_STRUCTURE = standardBOMConstants.PREF_L2_CHECKLIST_STRUCTURE;
      const getPreferenceValues = await lgepPreferenceUtils.getPreferenceValues(PREF_L2_CHECKLIST_STRUCTURE);

      let topFolderUid = getPreferenceValues[0].value;
      // topFolderUid = "AXrN0zUA5p7XAC";
      const topFolder = await lgepObjectUtils.loadObject2(topFolderUid);

      // 현재 그룹
      let currentGroup = ctx.userSession.props.group_name.uiValue;

      // 현재 그룹에 해당하는 폴더 가져오기
      const childFolderContents = topFolder.props.contents;
      for (let i = 0; i < childFolderContents.uiValues.length; i++) {
        const uiValue = childFolderContents.uiValues[i];
        if (uiValue === currentGroup) {
          const parentNodeUid = childFolderContents.dbValues[i];
          if (parentNodeUid) {
            parentNode = await lgepObjectUtils.loadObject2(parentNodeUid);
            break;
          }
        }
      }
    }

    // 폴더 내의 제품 목록 가져오기
    if (parentNode && parentNode.props && parentNode.props.contents && parentNode.props.contents.dbValues.length > 0) {
      const loadObjects = await lgepObjectUtils.loadObjects2(parentNode.props.contents.dbValues);
      const resultObjects = Object.values(loadObjects).filter((loadObject) => {
        if (loadObject.type != standardBOMConstants.L2_Structure) {
          return loadObject;
        }
      });
      await lgepObjectUtils.getProperties(resultObjects, [standardBOMConstants.contents]);
      return resultObjects;
    }
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error(error);
  }

  return [];
}

export function loadStandardBOMFolderTreeData(modelObjects, nodeBeingExpanded) {
  try {
    const treeNodes = [];
    _.forEach(modelObjects, function (modelObject) {
      const vmo = viewModelObjectService.constructViewModelObjectFromModelObject(modelObject);
      const objectName = vmo.props.object_name.dbValues[0];
      if (!vmo.props.contents || vmo.props.contents.dbValues.length < 1) {
        vmo.isLeaf = true;
      }

      // 트리 노드 생성
      const treeNode = awTableService.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        objectName,
        nodeBeingExpanded.levelNdx,
        nodeBeingExpanded.levelNdx + 1,
        vmo.typeIconURL,
      );
      treeNode.alternateID = treeNode.uid + ',' + nodeBeingExpanded.alternateID;
      treeNode.levelNdx = nodeBeingExpanded.levelNdx + 1;
      Object.assign(treeNode, vmo);

      treeNodes.push(treeNode);
    });

    return {
      // parentElement: nodeBeingExpanded.uid,
      parentNode: nodeBeingExpanded,
      childNodes: treeNodes,
      totalChildCount: treeNodes.length,
      startChildNdx: 0,
    };
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error(error);
  }
}

export function getCheckListAssyList() {
  if (ctx.checklist.standardBOM.checkListModuleAssyList || !topTreeNode || !topTreeNode.children) {
    return;
  }
  let checkListModuleAssyList = [];
  for (const checklistModule of topTreeNode.children) {
    // if (checklistModule.props.l2_is_checklist_target.dbValues[0] === 'Y') {
    const checklistModuleInfo = { [checklistModule.id]: { productContext: {}, node: checklistModule } };
    checkListModuleAssyList.push(checklistModuleInfo);
    // }
  }
  ctx.checklist.standardBOM.checkListModuleAssyList = checkListModuleAssyList;
}

function _getIsCheckListModuleNode(selectNode) {
  if (ctx.checklist.standardBOM.checkListModuleAssyList) {
    for (const checklistModuleAssy of ctx.checklist.standardBOM.checkListModuleAssyList) {
      const key = Object.keys(checklistModuleAssy)[0];
      if (selectNode.id === checklistModuleAssy[key].node.id) {
        return checklistModuleAssy;
      }
    }
  }
}
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
let product = {};
let productContext = {};
let topTreeNode;
let topElementUids;
export async function loadStandardBOMTree(ctx, data) {
  if (!selectedTemplateItemRevision) {
    return [];
  }
  product = {
    uid: selectedTemplateItemRevision.uid,
    type: selectedTemplateItemRevision.type,
  };
  let modelObjects = [];
  const parentNode = data.treeLoadInput.parentNode;
  if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
    getCheckListAssyList();
    //해당 노드가 ctx.checklist.standardBOM.checkListModuleAssyList에 속해있는 경우 OCCR 열어야 함
    const isChecklistModuleNode = _getIsCheckListModuleNode(parentNode);
    if (isChecklistModuleNode) {
      const occurrenceList = ctx.checklist.standardBOM.occurrenceList ? ctx.checklist.standardBOM.occurrenceList : [];
      // 이미 있을땐 제끼기
      for (const occurrenceInfo of occurrenceList) {
        if (occurrenceInfo.moduleElement.props.awb0Archetype.dbValues[0] === data.treeLoadInput.parentNode.props.awb0Archetype.dbValues[0]) {
          return;
        }
      }
      product = {
        uid: parentNode.props.awb0Archetype.dbValues[0],
        type: 'L2_StructureRevision',
      };
      const requestParam = L2_StandardBOMService.getOccurrences3Param(product);
      const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);

      // Occurrence
      const parentOccurrence = getOccurrences3Response.parentOccurrence;
      const parentOccurrenceId = parentOccurrence.occurrenceId;
      const parentOccurrenceNumberOfChildren = parentOccurrence.numberOfChildren;

      // Product Context
      const productContext = { uid: getOccurrences3Response.rootProductContext.uid, type: getOccurrences3Response.rootProductContext.type };

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
      const moduleObject = lgepObjectUtils.getObject(modelObject.props.awb0Archetype.dbValues[0]);
      const occurrenceInfo = {
        moduleElement: modelObject,
        moduleObject: moduleObject,
        productContext,
        occurrence: parentOccurrence,
      };
      ctx.checklist.standardBOM.occurrenceList = [...occurrenceList, occurrenceInfo];
    }
    if (!topElementUids) {
      const topObject = ctx.checklist.standardBOM.topObject;
      if (topObject) {
        await lgepObjectUtils.getProperties(topObject, ['ps_children']);
        topElementUids = [...topObject.props.ps_children.dbValues, topObject.uid];
      }
    }

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

      for (const occInfo of occInfos) {
        const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId];
        modelObject.parentNode = parentNode;
        modelObject.numberOfChildren = occInfo.numberOfChildren;
        modelObjects.push(modelObject);
      }
      return modelObjects;
    }
  } else {
    // TEMPLATE인 경우
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
    const topObject = lgepObjectUtils.getObject(modelObject.props.awb0Archetype.dbValues[0]);
    if (!ctx.checklist.standardBOM) {
      ctx.checklist.standardBOM = {};
      ctx.checklist.standardBOM.editmode = {};
    }
    ctx.checklist.standardBOM.topObject = topObject; //Revision
    ctx.checklist.standardBOM.productContext = productContext;
    ctx.checklist.standardBOM.occurrenceId = parentOccurrenceId;
  }

  return modelObjects;
}

export async function loadStandardBOMTreeData(modelObjects, nodeBeingExpanded) {
  const treeNodes = [];
  _.forEach(modelObjects, function (modelObject) {
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

    treeNodes.push(treeNode);
  });

  if (nodeBeingExpanded.uid === 'top' && treeNodes.length > 0) {
    topTreeNode = treeNodes[0];
    ctx.checklist.standardBOM.topElement = topTreeNode;
    if (ctx.checklist.standardBOM.isFirstBomTreeLoad) {
      ctx.checklist.standardBOM.isFirstBomTreeLoad = false;
      awTableStateService.clearAllStates(ctx.checklist.standardBOM.eventData.scope.data, 'standardBOMTree');
      awTableStateService.saveRowExpanded(ctx.checklist.standardBOM.eventData.scope.data, 'standardBOMTree', topTreeNode);
    }
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
  if (!selectedTemplateItemRevision) {
    lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '템플릿을 선택해주세요.');
    return;
  }

  if (!_isChecklistTarget(selectedStructureBOMLine)) {
    lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '체크리스트 대상을 선택해주세요.');
    return;
  }

  const rev = await lgepObjectUtils.loadObject2(selectedStructureBOMLine.props.awb0Archetype.dbValues[0]);
  selectedStructureItemRevision = rev;

  lgepObjectUtils.loadObject2(selectedTemplateItemRevision.uid).then((itemRevision) => {
    ctx.checklist.standardBOM.selectedTemplateItemRevision = itemRevision;
    ctx.checklist.standardBOM.selectedStructureItemRevision = selectedStructureItemRevision;
    ctx.checklist.standardBOM.selectedStructureBOMLine = selectedStructureBOMLine;
    L2_ChecklistCreateService.openPopup(ctx, data);
  });
}

export function onInit(ctx, data) {
  // Policy
  L2_StandardBOMPropertyPolicyService.registerPropertyPolicy();

  // Context
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }

  _ctx = ctx;
  _data = data;
  _dataProvider = data.dataProviders.standardBOMTreeDataProvider;
}

export function onMount(ctx, data) {}

export async function deleteChecklist() {
  await lgepObjectUtils.deleteObject(ctx.checklist.standardBOM.deleteChecklist);
}

export function onUnmount(ctx, data) {
  eventBus.publish('awsidenav.openClose', {});
  delete ctx.checklist.standardBOM;
  if (bomWindow) {
    lgepBomUtils.closeBOMWindow(bomWindow).then((response) => {
      // logger.info(response);
    });
  }

  // Context
  selectedTemplateItemRevision = undefined;
  selectedStructureItemRevision = undefined;
  selectedStructureBOMLine = undefined;

  // Policy
  L2_StandardBOMPropertyPolicyService.unRegisterPropertyPolicy();
}

function openPopup(ctx, data) {
  let caption = data && data.i18n && data.i18n.standardBOMSearchAndSelect;
  if (!caption) {
    caption = '표준 BOM 목록 조회 및 선택';
  }

  popupService.show({
    declView: 'L2_StandardBOMSearchAndSelect',
    locals: {
      anchor: 'closePopupAnchor',
      caption: caption,
      hasCloseButton: true,
    },
    options: {
      clickOutsideToClose: false,
      draggable: true,
      enableResize: true,
      isModal: false,
      width: 1400,
      height: 850,
      hooks: {
        whenClosed: (res) => {
          delete ctx.checklist.openPopup;
        },
        whenOpened: (res) => {
          ctx.checklist.openPopup = true;
        },
      },
    },
  });
}

export async function standardBOMFolderTreeSelectionChangeEvent(ctx, data, eventData) {
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }
  if (ctx.checklist.standardBOM.openMsg) {
    eventBus.publish('removeMessages');
    ctx.checklist.standardBOM.openMsg = false;
  }
  if (ctx.checklist.standardBOM && (ctx.checklist.standardBOM.startBomEditing || ctx.checklist.standardBOM.isEditing)) {
    data.dataProviders.standardBOMFolderTreeDataProvider.selectNone();
    return;
  }

  const selectedObject = data.dataProviders.standardBOMFolderTreeDataProvider.getSelectedObjects()[0];
  if (lgepObjectUtils.instanceOf(selectedObject, 'ItemRevision')) {
    selectedTemplateItemRevision = selectedObject;
  } else {
    selectedTemplateItemRevision = undefined;
  }
  ctx.checklist.standardBOM = {};
  topElementUids = undefined;
  ctx.checklist.standardBOM.isFirstBomTreeLoad = true;
  ctx.checklist.standardBOM.eventData = eventData;
  ctx.checklist.bomTree = true;

  //TODO:::
  const treeProvider = eventData.scope.data.dataProviders.standardBOMTreeDataProvider;
  treeProvider.viewModelCollection.loadedVMObjects = [];
  treeProvider.viewModelCollection.clear();
  await lgepCommonUtils.delay(500);
  ctx.checklist.bomTree = false;
  eventBus.publish('standardBOMTree.plTable.reload');
}

let prevSelect;
//1
export async function standardBOMTreeSelectionChangeEvent(ctx, data, eventData) {
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }
  if (ctx.checklist.standardBOM.openMsg) {
    eventBus.publish('removeMessages');
    ctx.checklist.standardBOM.openMsg = false;
  }
  let selectedObject = eventData.selectedObjects[0];
  if (!prevSelect) {
    prevSelect = selectedObject;
  }
  try {
    ctx.checklist.standardBOM.initComplete = false;
    appCtxService.ctx.checklist.standardBOM.bomTreeEventData = eventData;
    if (selectedObject) {
      ctx.checklist.standardBOM.bomTreeSelection = selectedObject;
      selectedStructureBOMLine = selectedObject;

      if (ctx.checklist.standardBOM.isEditing) {
        // 편집중이면 화면 활성화 전에 해당 정보 저장
        await saveEditInfo(prevSelect, data);
      }
      prevSelect = selectedObject;
      await initEditorSection(selectedObject, data);
    }
  } catch (err) {
    console.log('standardBOMTreeSelectionChangeEvent', err);
  }
}

//2
export async function standardBOMTreeGridSelection(data, eventData) {
  const selectedObject = data.dataProviders.standardBOMTreeDataProvider.getSelectedObjects()[0];
  if (ctx.checklist.standardBOM.startBomEditing) {
    data.dataProviders.standardBOMTreeDataProvider.selectNone();
    ctx.checklist.standardBOM.bomTreeSelection = undefined;
    selectedStructureBOMLine = undefined;
    return;
  }
}

function _isChecklistTarget(modelObject) {
  if (modelObject && modelObject.props && modelObject.props.l2_is_checklist_target) {
    const l2_is_checklist_target = modelObject.props.l2_is_checklist_target.dbValues[0];
    if (l2_is_checklist_target === 'Y') {
      return true;
    }
  }

  return false;
}

export default exports = {
  loadStandardBOMFolderTree,
  loadStandardBOMFolderTreeData,
  loadStandardBOMTree,
  loadStandardBOMTreeData,

  okAction,
  onInit,
  onMount,
  onUnmount,

  openPopup,

  standardBOMFolderTreeSelectionChangeEvent,
  standardBOMTreeSelectionChangeEvent,
  standardBOMTreeGridSelection,
  deleteChecklist,
};
/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectService
 */
app.factory('L2_StandardBOMSearchAndSelectService', () => exports);
