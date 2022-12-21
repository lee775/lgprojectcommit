/**
 * Standard BOM Search And Select Service
 *
 * @module js/L2_StandardBOMSearchAndSelectService
 */
import app from 'app';
import awTableService from 'js/awTableService';
import eventBus from 'js/eventBus';
import soaService from 'soa/kernel/soaService';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import viewModelService from 'js/viewModelService';
import awTableStateService from 'js/awTableStateService';
import viewModelObjectService from 'js/viewModelObjectService';
import popupService from 'js/popupService';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import _ from 'lodash';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import L2_StandardBOMPropertyPolicyService from 'js/L2_StandardBOMPropertyPolicyService';
import L2_ChecklistCreateService from 'js/L2_ChecklistCreateService';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import { initEditorSection, saveEditInfo } from 'js/L2_StandardBOMSearchAndSelectEditService';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

let exports = {};
let selectedStructureBOMLine;

let product = {};
let productContext = {};
let topTreeNode;

let clickGroupCmd;

export async function loadStandardBOMTree(ctx, data) {
  const selectedTemplateNode = ctx.checklist.standardBOM.selectedTemplateBomNode;
  if (!selectedTemplateNode) {
    return [];
  }
  product = {
    uid: selectedTemplateNode.uid,
    type: selectedTemplateNode.type,
  };
  let modelObjects = [];
  const parentNode = data.treeLoadInput.parentNode;
  if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
    // _getModuleListByTemplate();

    //해당 노드가 ctx.checklist.standardBOM.moduleList에 속해있는 경우 OCCR 열어야 함
    // const isChecklistModuleNode = _getIsCheckListModuleNode(parentNode);
    // if (isChecklistModuleNode) {
    //   const occurrenceList = ctx.checklist.standardBOM.occurrenceList ? ctx.checklist.standardBOM.occurrenceList : [];
    //   // 이미 있을땐 제끼기
    //   for (const occurrenceInfo of occurrenceList) {
    //     if (occurrenceInfo.moduleElement.props.awb0Archetype.dbValues[0] === data.treeLoadInput.parentNode.props.awb0Archetype.dbValues[0]) {

    //       return;
    //     }
    //   }
    product = {
      uid: parentNode.props.awb0Archetype.dbValues[0],
      type: 'L2_StructureRevision',
    };
    //   const requestParam = L2_StandardBOMService.getOccurrences3Param(product);
    //   const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);

    //   // Occurrence
    //   const parentOccurrence = getOccurrences3Response.parentOccurrence;
    //   const parentOccurrenceId = parentOccurrence.occurrenceId;
    //   const parentOccurrenceNumberOfChildren = parentOccurrence.numberOfChildren;

    //   // Product Context
    //   const productContext = { uid: getOccurrences3Response.rootProductContext.uid, type: getOccurrences3Response.rootProductContext.type };

    //   // In Context
    //   const inContextParam = L2_StandardBOMService.getInContextParam(parentOccurrenceId);
    //   await soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'saveUserWorkingContextState2', inContextParam);

    //   const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);

    //   const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];

    //   modelObject.numberOfChildren = parentOccurrenceNumberOfChildren;
    //   const moduleObject = lgepObjectUtils.getObject(modelObject.props.awb0Archetype.dbValues[0]);
    //   const occurrenceInfo = {
    //     moduleElement: modelObject,
    //     moduleObject: moduleObject,
    //     productContext,
    //     parentOccurrenceId,
    //     occurrence: parentOccurrence,
    //   };
    //   ctx.checklist.standardBOM.occurrenceList = [...occurrenceList, occurrenceInfo];
    // }
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
      await _getPropOnFunctionNode(modelObjects, product, productContext);
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
    await soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'saveUserWorkingContextState2', inContextParam);

    const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);

    const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];

    modelObject.numberOfChildren = parentOccurrenceNumberOfChildren;
    modelObjects.push(modelObject);
    const topObject = lgepObjectUtils.getObject(modelObject.props.awb0Archetype.dbValues[0]);

    ctx.checklist.standardBOM.templateModelObject = topObject;
    ctx.checklist.standardBOM.currentProductContext = productContext;
    ctx.checklist.standardBOM.templateProductContext = productContext;
  }

  return modelObjects;
}

// 기능 노드의 경우 하위 failure에서 funciton 정보 미리 갖고 있어야 함
async function _getPropOnFunctionNode(modelObjects, product, productContext) {
  for (const modelObject of modelObjects) {
    // 기능 노드인 경우
    const nodeRev = lgepObjectUtils.getObject(modelObject.props.awb0Archetype.dbValues[0]);
    if (nodeRev.type === 'L2_FunctionRevision') {
      const requestParam = L2_StandardBOMService.getOccurrences3Param(product, productContext, modelObject.uid);
      const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);
      const parentChildrenInfos = getOccurrences3Response.parentChildrenInfos;
      if (Array.isArray(parentChildrenInfos) && parentChildrenInfos.length > 0) {
        const childrenInfo = parentChildrenInfos[0].childrenInfo;
        const occInfos = childrenInfo.map((childInfo) => {
          return {
            occurrenceId: childInfo.occurrenceId,
            numberOfChildren: childInfo.numberOfChildren,
          };
        });

        const occurrenceIds = occInfos.map((occInfo) => occInfo.occurrenceId);
        const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties(occurrenceIds);
        const failures = occInfos.map((occInfo) => getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId]);
        modelObject.failureChildren = failures;
      }
    }
  }
}

export function loadStandardBOMTreeData(modelObjects, nodeBeingExpanded) {
  const treeNodes = [];
  for (const modelObject of modelObjects) {
    if (_isTemplateInChildren(modelObject)) {
      continue;
    }
    const numberOfChildren = modelObject.numberOfChildren;
    const parentNode = modelObject.parentNode;
    const failureChildren = modelObject.failureChildren;

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
    if (failureChildren) {
      treeNode.failureChildren = failureChildren;
    }
    Object.assign(treeNode, vmo);
    treeNodes.push(treeNode);
  }

  if (nodeBeingExpanded.uid === 'top' && treeNodes.length > 0) {
    topTreeNode = treeNodes[0];
    ctx.checklist.standardBOM.templateNode = topTreeNode;
    awTableStateService.clearAllStates(ctx.checklist.standardBOM.eventData.scope.data, 'standardBOMTree');
    awTableStateService.saveRowExpanded(ctx.checklist.standardBOM.eventData.scope.data, 'standardBOMTree', topTreeNode);
  }

  return {
    parentNode: nodeBeingExpanded,
    childNodes: treeNodes,
    totalChildCount: treeNodes.length,
    startChildNdx: 0,
  };
}

function _isTemplateInChildren(modelObject) {
  try {
    for (const template of ctx.checklist.standardBOM.templateList) {
      const modelObjectString = modelObject.props.object_string.dbValues[0];
      if (modelObjectString === template.props.object_string.dbValues[0]) {
        if (modelObjectString !== ctx.checklist.standardBOM.selectedTemplateBomNode.props.object_string.dbValues[0]) {
          return true;
        }
      }
    }
  } catch (err) {
    return true;
  }
}

// 특정 템플릿의 모듈 리스트
function _getModuleListByTemplate() {
  if (ctx.checklist.standardBOM.moduleList || !ctx.checklist.standardBOM.templateNode || !ctx.checklist.standardBOM.templateNode.children) {
    return;
  }
  let moduleList = [];
  for (const checklistModule of ctx.checklist.standardBOM.templateNode.children) {
    const checklistModuleInfo = { [checklistModule.id]: { productContext: {}, node: checklistModule } };
    moduleList.push(checklistModuleInfo);
  }
  ctx.checklist.standardBOM.moduleList = moduleList;
}

// 템플릿으로부터 체크리스트 생성
export async function okAction(ctx, data) {
  const selectedTemplateNode = ctx.checklist.standardBOM.selectedTemplateBomNode;
  if (!selectedTemplateNode) {
    lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '템플릿을 선택해주세요.');
    return;
  }

  const selectBomTreeNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!selectBomTreeNode || !selectBomTreeNode.props.l2_is_checklist_target || selectBomTreeNode.props.l2_is_checklist_target.dbValues[0] !== 'Y') {
    lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '체크리스트 대상을 선택해주세요.');

    return;
  }

  const rev = await lgepObjectUtils.loadObject2(selectedStructureBOMLine.props.awb0Archetype.dbValues[0]);
  const item = await lgepObjectUtils.getItemByItemRevision(rev);

  lgepObjectUtils.loadObject2(selectedTemplateNode.uid).then((itemRevision) => {
    ctx.checklist.standardBOM.selectedTemplateItemRevision = itemRevision;
    ctx.checklist.standardBOM.selectedStructureItemRevision = rev;
    ctx.checklist.standardBOM.selectedStructureBOMLine = selectedStructureBOMLine;
    ctx.checklist.standardBOM.selectedStructureItem = item;
    L2_ChecklistCreateService.openPopup(ctx, data);
  });
}

export function onInit(ctx, data) {
  // Policy
  L2_StandardBOMPropertyPolicyService.registerPropertyPolicy();

  // Context
  if (!ctx.checklist.standardBOM) {
    initializeContxt();
  }
}

export function initializeContxt() {
  ctx.checklist.standardBOM = {};
  ctx.checklist.standardBOM.editmode = {};
  ctx.checklist.standardBOM.templateList = [];
  ctx.checklist.standardBOM.editNodes = [];
  ctx.checklist.standardBOM.occurrenceList = [];
  ctx.checklist.standardBOM.partSaveNodes = [];
}

export function onMount(ctx, data) {}

export async function deleteChecklist() {
  await lgepObjectUtils.deleteObject(ctx.checklist.standardBOM.deleteChecklist);
}

export function onUnmount(ctx, data) {
  eventBus.publish('awsidenav.openClose', {});
  let totalAttach = ctx.checklist.standardBOM.totalAttachFile;
  if (totalAttach && totalAttach.length > 0) {
    lgepObjectUtils.deleteObjects(totalAttach);
  }
  delete ctx.checklist.standardBOM;

  // Context
  selectedStructureBOMLine = undefined;

  // Policy
  L2_StandardBOMPropertyPolicyService.unRegisterPropertyPolicy();

  clickGroupCmd = null;
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

let prevSelect;
export async function standardselectBomTreeNodeChangeEvent(ctx, data, eventData) {
  let selectedObject = eventData.selectedObjects[0];
  if (!prevSelect) {
    prevSelect = selectedObject;
  }
  if (!ctx.checklist.standardBOM.viewData) {
    const viewData = viewModelService.getViewModelUsingElement(document.querySelector('#standardBOMTree'));
    ctx.checklist.standardBOM.viewData = viewData;
  }
  try {
    ctx.checklist.standardBOM.initComplete = false;
    if (selectedObject) {
      ctx.checklist.standardBOM.selectBomTreeNode = selectedObject;
      selectedStructureBOMLine = selectedObject;
      if (ctx.checklist.standardBOM.isEditing) {
        // 편집중이면 화면 활성화 전에 해당 정보 저장
        await saveEditInfo(prevSelect, data);
      }
      if (ctx.checklist.test) {
        data.dataProviders.standardBOMTreeDetailDataProvider.selectNone();
        return;
      }
      prevSelect = selectedObject;
      await initEditorSection(selectedObject, data);
    }
  } catch (err) {
    console.log('standardselectBomTreeNodeChangeEvent', err);
  }
}

export async function standardBOMTreeGridSelection(data, eventData) {
  if (ctx.checklist.standardBOM.startBomEditing) {
    data.dataProviders.standardBOMTreeDataProvider.selectNone();
    ctx.checklist.standardBOM.selectBomTreeNode = undefined;
    selectedStructureBOMLine = undefined;
    return;
  }
}
async function standardBomExpand() {
  const selectBomTreeNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!selectBomTreeNode && selectBomTreeNode !== ctx.checklist.standardBOM.templateNode) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }
  selectBomTreeNode.isExpanded = false;

  await expandBlow(ctx.checklist.standardBOM.eventData.scope, 'standardBOMTree', selectBomTreeNode);
}

async function standardBomCollapse() {
  const selectBomTreeNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!selectBomTreeNode) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }
}

export async function expandBlow(dataCtxNode, gridId, node) {
  if (node.isExpanded) {
    return;
  }
  node.isExpanded = true;
  node.loadingStatus = true;
  node._expandRequested = true;
  awTableStateService.saveRowExpanded(dataCtxNode.data, gridId, node);
  try {
    await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
    if (node.children) {
      for (const childRow of node.children) {
        await expandBlow(dataCtxNode, gridId, childRow);
      }
    }
    delete node.loadingStatus;
    delete node._expandRequested;
  } catch (error) {
    console.log('expandBlow: ', error);
  } finally {
    delete node.loadingStatus;
    delete node._expandRequested;
  }
}

window.addEventListener(
  'keyup',
  (e) => {
    const key = e.key || e.keyCode;
    if (ctx.checklist.standardBOM && (key === 'Escape' || key === 27)) {
      e.stopPropagation();
    }
  },
  true,
);

window.addEventListener(
  'click',
  (e) => {
    if (!ctx.checklist.standardBOM || !ctx.checklist.standardBOM.isDetailView) {
      return;
    }
    const targetEl = e.target;
    if (_checkClickGroupCmd(targetEl)) {
      e.stopPropagation();
    }
  },
  true,
);

function _checkClickGroupCmd(targetEl) {
  if (clickGroupCmd) {
    const BUTTON = `button[button-id="${clickGroupCmd.id}"][aria-label="${clickGroupCmd.label}"]`;
    if (targetEl.closest(BUTTON)) {
      return true;
    }
  }
  const groupCmds = [
    { id: 'filterGroupCommand', label: lgepLocalizationUtils.getLocalizedText('L2_ChkMainMessages', 'filterChecklist') },
    { id: 'standardBomTreeAddGroup', label: lgepLocalizationUtils.getLocalizedText('L2_ChkMainMessages', 'standardBomTreeAdd') },
    { id: 'expandGroupCommand', label: lgepLocalizationUtils.getLocalizedText('L2_ChkStandardBOMMessages', 'unfold') },
  ];
  for (const groupCmd of groupCmds) {
    const { id, label } = groupCmd;
    const BUTTON = `button[button-id="${id}"][aria-label="${label}"]`;
    if (targetEl.closest(BUTTON)) {
      clickGroupCmd = groupCmd;
      return;
    }
  }
  clickGroupCmd = null;
}

export default exports = {
  loadStandardBOMTree,
  loadStandardBOMTreeData,

  okAction,
  onInit,
  onMount,
  onUnmount,

  openPopup,

  standardselectBomTreeNodeChangeEvent,
  standardBOMTreeGridSelection,
  deleteChecklist,
  standardBomExpand,
  standardBomCollapse,
};
/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectService
 */
app.factory('L2_StandardBOMSearchAndSelectService', () => exports);
