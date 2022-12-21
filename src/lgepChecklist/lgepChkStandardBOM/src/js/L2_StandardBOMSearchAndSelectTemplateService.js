import app from 'app';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import eventBus from 'js/eventBus';
import logger from 'js/logger';
import awTableService from 'js/awTableService';
import soaService from 'soa/kernel/soaService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import viewModelObjectService from 'js/viewModelObjectService';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import { duplicateFromItemRev } from 'js/utils/lgepBomUtils';
import viewModelService from 'js/viewModelService';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import _ from 'lodash';

let exports = {};

let templateList = [];

// 템플릿 데이터 로드
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
      const topFolder = await lgepObjectUtils.loadObject2(topFolderUid);
      const childFolderContents = topFolder.props.contents;
      templateList = childFolderContents.dbValues;

      // 현재 그룹에 해당하는 폴더 가져오기
      let currentGroup = ctx.userSession.props.group_name.uiValue;
      // 템플릿 그룹인 경우 모든 폴터 리턴
      if (currentGroup === 'Template') {
        let totalFolders = [];
        for (const parentNodeUid of childFolderContents.dbValues) {
          const parentNode = await lgepObjectUtils.loadObject2(parentNodeUid);
          totalFolders.push(parentNode);
        }
        return totalFolders;
      }

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
    return _getProductsByFolder(parentNode);
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error(error);
  }
}

function _templateFolderCheck(parentNode) {
  for (const templateUid of templateList) {
    if (parentNode.uid === templateUid) {
      return true;
    }
  }
}

async function _getProductsByFolder(parentNode) {
  if (_templateFolderCheck(parentNode)) {
    if (parentNode.props && parentNode.props.contents && parentNode.props.contents.dbValues.length > 0) {
      const loadObjects = await lgepObjectUtils.loadObjects2(parentNode.props.contents.dbValues);
      const resultObjects = Object.values(loadObjects).filter((loadObject) => {
        if (loadObject.type != standardBOMConstants.L2_Structure) {
          if (_templateFolderContentCheck(loadObject.uid, parentNode)) {
            loadObject.parentNode = parentNode;
            return loadObject;
          }
        }
      });
      await lgepObjectUtils.getProperties(resultObjects, [standardBOMConstants.contents]);
      return resultObjects;
    }
    return [];
  }
  if (parentNode && parentNode.props && parentNode.props.contents && parentNode.props.contents.dbValues.length > 0) {
    const loadObjects = await lgepObjectUtils.loadObjects2(parentNode.props.contents.dbValues);
    const resultObjects = Object.values(loadObjects).filter((loadObject) => {
      if (loadObject.type != standardBOMConstants.L2_Structure) {
        loadObject.parentNode = parentNode;
        return loadObject;
      }
    });
    await lgepObjectUtils.getProperties(resultObjects, [standardBOMConstants.contents]);
    return resultObjects;
  }
  return [];
}

function _templateFolderContentCheck(loadObjectUid, parentNode) {
  for (const contentUid of parentNode.props.contents.dbValues) {
    if (contentUid === loadObjectUid) {
      return true;
    }
  }
}

// 데이터 -> 노드 전환
export function loadStandardBOMFolderTreeData(modelObjects, nodeBeingExpanded) {
  try {
    const treeNodes = [];
    let templateList = [];
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
      if (treeNode.type !== 'Folder') {
        templateList.push(treeNode);
      }
    });
    const filterTreeNodes = treeNodes.sort(function (a, b) {
      if (a.displayName <= b.displayName) {
        return -1;
      }
      return 1;
    });

    ctx.checklist.standardBOM.templateList = [...ctx.checklist.standardBOM.templateList, ...templateList];
    return {
      parentNode: nodeBeingExpanded,
      childNodes: filterTreeNodes,
      totalChildCount: filterTreeNodes.length,
      startChildNdx: 0,
    };
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error(error);
  }
}

// 템플릿 트리 선택
export async function standardBOMFolderTreeSelectionChangeEvent(ctx, data, eventData) {
  // initializeContxt();
  ctx.checklist.standardBOM.eventData = eventData;

  // 편집중일 경우 선택 막기
  if (ctx.checklist.standardBOM && (ctx.checklist.standardBOM.startBomEditing || ctx.checklist.standardBOM.isEditing)) {
    data.dataProviders.standardBOMFolderTreeDataProvider.selectNone();
    return;
  }

  const selectedObject = data.dataProviders.standardBOMFolderTreeDataProvider.getSelectedObjects()[0];

  if (lgepObjectUtils.instanceOf(selectedObject, 'ItemRevision')) {
    ctx.checklist.standardBOM.selectedTemplateBomNode = selectedObject;
  } else {
    delete ctx.checklist.standardBOM.selectedTemplateBomNode;
  }
  delete ctx.checklist.standardBOM.templateModelObject;
  delete ctx.checklist.standardBOM.templateNode;
  delete ctx.checklist.standardBOM.currentProductContext;
  delete ctx.checklist.standardBOM.selectBomTreeNodeType;
  delete ctx.checklist.standardBOM.selectBomTreeNode;
  delete ctx.checklist.standardBOM.isEditableNode;
  delete ctx.checklist.standardBOM.occurrenceList;
  delete ctx.checklist.standardBOM.templateProductContext;
  eventBus.publish('standardBOMTree.plTable.reload');
}

// 템플릿 추가 패널 오픈
function addTemplate() {
  notySvc.setTimeout(lgepMessagingUtils.INFO, 100);
  if (
    !ctx.checklist.standardBOM.eventData ||
    !ctx.checklist.standardBOM.eventData ||
    !ctx.checklist.standardBOM.eventData.selectedObjects ||
    ctx.checklist.standardBOM.eventData.selectedObjects[0].type !== 'Folder'
  ) {
    notySvc.showInfo('폴더를 선택해주세요');
    return;
  }
  ctx.checklist.standardBOM.addTemplateFolder = ctx.checklist.standardBOM.eventData.selectedObjects[0];
  ctx.checklist.standardBOM.addTemplate = true;
  ctx.checklist.standardBOM.isTopEditing = true;
  const panelData = {
    id: 'checklist_addStructure',
    includeView: 'L2_TemplateAdd',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_addStructure',
    config: {
      width: 'STANDARD',
      height: 'LARGE',
    },
  };
  eventBus.publish('awsidenav.openClose', panelData);
}

// 템플릿 추가 실행
async function addTemplateSave(templateName) {
  const productType = ctx.userSession.props.group_name.dbValues[0];
  const templateFolder = ctx.checklist.standardBOM.addTemplateFolder;
  const productClass = templateFolder.displayName;
  const props = ['l2_is_checklist', 'l2_is_checklist_target', 'l2_is_template', 'l2_product_type', 'l2_product_class'];
  const container = await lgepObjectUtils.loadObject2(templateFolder.id);
  const newObject = await lgepObjectUtils.createItem('', 'L2_Structure', templateName, '', container);
  const newItem = newObject.output[0].item;

  lgepObjectUtils.setProperties(newItem, props, ['N', 'N', 'Y', productType, productClass]);

  delete ctx.checklist.standardBOM.addTemplate;
  eventBus.publish('standardBOMFolderTree.plTable.reload');
  eventBus.publish('awsidenav.openClose', {});
}

// panel close event
function onUnmountOnStructureCreatePanel() {
  delete ctx.checklist.standardBOM.isTopEditing;
  delete ctx.checklist.standardBOM.addTemplate;
  delete ctx.checklist.standardBOM.duplicating;
}

// 템플릿 복제
async function duplicateTemplate() {
  // 1. 로우 안누르고 복제 누르면 메시지 호출
  const selectedTemplateBomNode = ctx.checklist.standardBOM.selectedTemplateBomNode;
  if (!selectedTemplateBomNode) {
    notySvc.showInfo('템플릿을 선택해주세요');
    return;
  }
  try {
    const data = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTree'));
    data.disabledButtonChk.dbValue = true;
    ctx.checklist.standardBOM.isTopEditing = true;
    ctx.checklist.standardBOM.templateDuplicating = true;

    const panelData = {
      id: 'checklist_addStructure',
      includeView: 'L2_TemplateAdd',
      closeWhenCommandHidden: true,
      keepOthersOpen: true,
      commandId: 'checklist_addStructure',
      config: {
        width: 'STANDARD',
        height: 'LARGE',
      },
    };
    eventBus.publish('awsidenav.openClose', panelData);
  } catch (err) {
    console.log('duplicateTemplate open', err);
  }
}

// TODO :: 완성 필요
async function _duplicateTeplate(templateName) {
  try {
    eventBus.publish('awsidenav.openClose', {});
    notySvc.showInfo('템플릿 복제중입니다\n잠시 기다려주세요');

    // 2. 로우 누르고 복제 누르면 봄 복제 (다 새객체?)
    const templateModelObject = ctx.checklist.standardBOM.templateModelObject;
    const duplicateTemplate = await duplicateFromItemRev(templateModelObject);
    const duplicateTemplateRev = duplicateTemplate.clonedItemRev;
    const duplicateTemplateItem = await lgepObjectUtils.getItemByItemRevision(duplicateTemplateRev);
    lgepObjectUtils.setProperties(duplicateTemplateItem, ['object_name'], [templateName]);
    lgepObjectUtils.setProperties(duplicateTemplateRev, ['object_name'], [templateName]);

    const saveAsBomLines = await L2_StandardBOMService.expandSaveasBom(duplicateTemplateRev);

    // 3. 데이터셋
    let saveAsDatasets = await L2_StandardBOMService.getRefrenceDatasets(templateModelObject);

    const saveViewModelEditAndSubmitWorkflow2Param = {
      inputs: L2_StandardBOMService.getSaveViewModelEditAndSubmitWorkflow2Param(saveAsBomLines, saveAsDatasets),
    };

    await soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', saveViewModelEditAndSubmitWorkflow2Param);

    // 4. 폴더에 붙임
    const folder = lgepObjectUtils.getObject(templateModelObject.parentNode.uid);
    lgepObjectUtils.addChildren(folder, [duplicateTemplateItem], 'contents');

    notySvc.showInfo('복제 완료되었습니다');
    eventBus.publish('standardBOMFolderTree.plTable.reload');
    const data = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTree'));
    ctx.checklist.standardBOM.isTopEditing = false;
    ctx.checklist.standardBOM.duplicating = false;
    data.disabledButtonChk.dbValue = false;
  } catch (err) {
    console.log('duplicateTemplate', err);
  }
}

async function editTemplateSave(data) {
  const templateName = data.nameBox.dbValues[0];
  if (!templateName) {
    notySvc.showInfo('템플릿명을 입력해주세요');
    return;
  }
  if (!ctx.checklist.standardBOM.templateDuplicating) {
    await addTemplateSave(templateName);
    return;
  }
  await _duplicateTeplate(templateName);
}

export default exports = {
  loadStandardBOMFolderTree,
  loadStandardBOMFolderTreeData,
  standardBOMFolderTreeSelectionChangeEvent,
  addTemplate,
  onUnmountOnStructureCreatePanel,
  addTemplateSave,
  duplicateTemplate,
  editTemplateSave,
};

/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectTemplateService
 */
app.factory('L2_StandardBOMSearchAndSelectTemplateService', () => exports);
