import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import { INFORMATION } from 'js/utils/lgepMessagingUtils';
import { setUidIncontextByTopEl, setValueIncontextByTopEl, removeTagInStr, _changeTopObjectRef } from 'js/L2_ChecklistMasterEditService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import soaService from 'soa/kernel/soaService';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import awTableStateService from 'js/awTableStateService';
import _ from 'lodash';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import viewModelService from 'js/viewModelService';
import { getCheckListAssyList } from 'js/L2_StandardBOMSearchAndSelectService';
import { standardBOMBack } from 'js/L2_StandardBOMSearchDetailService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

let exports = {};

const FUNCTION_EDITOR_IDS = ['function', 'requirement'];
const FAILURE_EDITOR_IDS = ['failureMode', 'failureEffect', 'failureDetail', 'prevention', 'referenceData', 'detectivity', 'classification'];
const STRUCTURE_IDS = ['structureNameText', 'isChecklistTargetValue', 'isChecklistCheckValue', 'templateCheckValue'];

// 편집중일때 각 노드 선택 할때마다 이전 노드의 정보 저장
export async function saveEditInfo(selectNode, data) {
  // 삭제 됐으면 pass
  if (ctx.checklist.standardBOM.deleteNode) {
    if (selectNode.uid === ctx.checklist.standardBOM.deleteNode.uid) {
      delete ctx.checklist.standardBOM.deleteNode;
      return;
    }
  }
  const editInfo = ctx.checklist.standardBOM.editmode.editInfo ? ctx.checklist.standardBOM.editmode.editInfo : {};
  const selectType = await _getType(selectNode);
  if (selectType === 'L2_FunctionRevision') {
    if (!document.querySelector('#function')) {
      return;
    }
    let nodeInfo = { node: selectNode, type: selectType };
    for (const editorId of FUNCTION_EDITOR_IDS) {
      nodeInfo[editorId] = $(`#${editorId}`).summernote('code');
    }
    ctx.checklist.standardBOM.editmode.editInfo = { ...editInfo, ...{ [selectNode.id]: nodeInfo } };
  } else if (selectType === 'L2_FailureRevision') {
    if (!document.querySelector('#failureMode')) {
      return;
    }
    let nodeInfo = { node: selectNode, type: selectType };
    for (const editorId of FAILURE_EDITOR_IDS) {
      nodeInfo[editorId] = $(`#${editorId}`).summernote('code');
    }

    nodeInfo['l2_importance'] = ctx.checklist.standardBOM.viewData.importanceValue.dbValue;

    ctx.checklist.standardBOM.editmode.editInfo = { ...editInfo, ...{ [selectNode.id]: nodeInfo } };
  } else {
    let nodeInfo = { node: selectNode, type: selectType };
    const treeEl = document.querySelector('#standardBOMTree');
    const viewData = viewModelService.getViewModelUsingElement(treeEl);
    for (const id of STRUCTURE_IDS) {
      if (id === 'structureNameText') {
        nodeInfo[id] = viewData[id].dbValues.length === 0 ? '' : viewData[id].dbValues[0];
      } else {
        nodeInfo[id] = viewData[id].newValue ? viewData[id].newValue : viewData[id].dbValues[0];
      }
    }
    ctx.checklist.standardBOM.editmode.editInfo = { ...editInfo, ...{ [selectNode.id]: nodeInfo } };
  }
}

// 템플릿 편집 부분
export async function initEditorSection(modelObject, data) {
  const selectType = await _getType(modelObject);
  if (!selectType) {
    return;
  }

  if (selectType === 'L2_FunctionRevision' && !modelObject.children) {
    return;
  }
  ctx.checklist.standardBOM.selectBomTreeNode = modelObject;
  ctx.checklist.standardBOM.selectBomTreeNodeType = selectType;
  if (selectType === 'L2_FunctionRevision') {
    let times = 0;
    while (!document.getElementById(`${FUNCTION_EDITOR_IDS[0]}`) || times > 20) {
      await lgepCommonUtils.delay(50);
      times++;
    }

    if (ctx.checklist.standardBOM.isEditing && ctx.checklist.standardBOM.editmode && ctx.checklist.standardBOM.editmode.editInfo) {
      const editInfoValues = ctx.checklist.standardBOM.editmode.editInfo[modelObject.id];
      if (editInfoValues) {
        for (const id of FUNCTION_EDITOR_IDS) {
          _makeEditor(id, editInfoValues);
        }
        ctx.checklist.standardBOM.initComplete = true;
        return;
      }
    }

    const failure = modelObject.children[0];
    const values = await _readPropertiesFromTextFile(failure.props.l2_reference_dataset.dbValues[0]);
    ctx.checklist.standardBOM.values = values;
    for (const id of FUNCTION_EDITOR_IDS) {
      _makeEditor(id, values);
    }
  } else if (selectType === 'L2_FailureRevision') {
    const importanceValue = modelObject.props.l2_importance.dbValues[0] ? modelObject.props.l2_importance.dbValues[0] : '';
    if (ctx.checklist.standardBOM.isEditing) {
      ctx.checklist.standardBOM.viewData.importanceValue.dbValue = importanceValue;
      ctx.checklist.standardBOM.viewData.importanceValue.dbValues = [importanceValue];
      ctx.checklist.standardBOM.viewData.importanceValue.uiValue = importanceValue;
    } else {
      ctx.checklist.standardBOM.viewData.importance.dbValue = importanceValue;
    }

    let times = 0;
    while (!document.getElementById(`${FAILURE_EDITOR_IDS[0]}`) || times > 20) {
      await lgepCommonUtils.delay(50);
      times++;
    }
    if (ctx.checklist.standardBOM.isEditing && ctx.checklist.standardBOM.editmode && ctx.checklist.standardBOM.editmode.editInfo) {
      const editorValue = ctx.checklist.standardBOM.editmode.editInfo[modelObject.id];
      if (editorValue !== null && editorValue !== undefined) {
        for (const id of FAILURE_EDITOR_IDS) {
          _makeEditor(id, editorValue);
        }
        ctx.checklist.standardBOM.initComplete = true;
        return;
      }
    }
    const values = await _readPropertiesFromTextFile(modelObject.props.l2_reference_dataset.dbValues[0]);
    ctx.checklist.standardBOM.values = values;
    for (const id of FAILURE_EDITOR_IDS) {
      _makeEditor(id, values);
    }
  } else if (selectType === 'L2_StructureRevision') {
    const rev = await lgepObjectUtils.loadObject2(modelObject.props.awb0Archetype.dbValue);
    const item = await lgepObjectUtils.loadObject2(rev.props.items_tag.dbValues[0]);
    await lgepObjectUtils.getProperties(item, ['l2_is_checklist', 'l2_is_checklist_target', 'l2_is_template', 'l2_product_type', 'l2_product_class']);
    if (ctx.checklist.standardBOM.previousView) {
      data = ctx.checklist.standardBOM.previousView;
    }
    if (ctx.checklist.standardBOM.isEditing) {
      if (ctx.checklist.standardBOM.isEditing && ctx.checklist.standardBOM.editmode && ctx.checklist.standardBOM.editmode.editInfo) {
        const editorValue = ctx.checklist.standardBOM.editmode.editInfo[modelObject.id];
        if (editorValue !== null && editorValue !== undefined) {
          for (const id of STRUCTURE_IDS) {
            if (id === 'structureNameText') {
              data.structureNameText.dbValue = editorValue[id];
              data.structureNameText.dbValues = [editorValue[id]];
            } else {
              let propName;
              if (id === 'isChecklistTargetValue') {
                propName = 'l2_is_checklist_target';
              } else if (id === 'isChecklistCheckValue') {
                propName = 'l2_is_checklist';
              } else if (id === 'templateCheckValue') {
                propName = 'l2_is_template';
              }
              let value = editorValue[id] === 'Y' ? 'Yes' : 'No';
              data[id].dbValue = editorValue[id] ? editorValue[id] : item.props[propName].dbValues[0] ? item.props[propName].dbValues[0] : 'N';
              data[id].dbValues = [editorValue[id] ? editorValue[id] : item.props[propName].dbValues[0] ? item.props[propName].dbValues[0] : 'N'];
              data[id].uiValue = editorValue[id] ? value : _getValue(item.props[propName].dbValues[0]);
            }
          }
          ctx.checklist.standardBOM.initComplete = true;
          return;
        }
      }
      data.structureNameText.dbValue = rev.props.object_name.dbValues[0];
      data.structureNameText.dbValues = [rev.props.object_name.dbValues[0]];
      data.isChecklistCheckValue.dbValue = item.props.l2_is_checklist.dbValues[0] ? item.props.l2_is_checklist.dbValues[0] : 'N';
      data.isChecklistCheckValue.dbValues = [item.props.l2_is_checklist.dbValues[0] ? item.props.l2_is_checklist.dbValues[0] : 'N'];
      data.isChecklistCheckValue.uiValue = _getValue(item.props.l2_is_checklist.dbValues[0]);
      data.isChecklistTargetValue.dbValue = item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N';
      data.isChecklistTargetValue.dbValues = [item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N'];
      data.isChecklistTargetValue.uiValue = _getValue(item.props.l2_is_checklist_target.dbValues[0]);
      data.templateCheckValue.dbValue = item.props.l2_is_template.dbValues[0] ? item.props.l2_is_template.dbValues[0] : 'N';
      data.templateCheckValue.dbValues = [item.props.l2_is_template.dbValues[0] ? item.props.l2_is_template.dbValues[0] : 'N'];
      data.templateCheckValue.uiValue = _getValue(item.props.l2_is_template.dbValues[0]);
      data.productTypeBox.dbValue = item.props.l2_product_type.dbValues[0];
      data.productTypeBox.dbValues = item.props.l2_product_type.dbValues[0];
      data.productClassBox.dbValue = item.props.l2_product_class.dbValues[0];
      data.productClassBox.dbValues = [item.props.l2_product_class.dbValues[0]];
    } else {
      data.structureName.dbValue = modelObject.displayName;
      data.structureIsChecklist.dbValue = _getValue(item.props.l2_is_checklist.dbValues[0]);
      data.structureTargetChecklist.dbValue = _getValue(item.props.l2_is_checklist_target.dbValues[0]);
      data.structureTemplate.dbValue = _getValue(item.props.l2_is_template.dbValues[0]);
      data.productType.dbValue = item.props.l2_product_type.dbValues[0];
      data.productClass.dbValue = item.props.l2_product_class.dbValues[0];
    }
  }
  ctx.checklist.standardBOM.initComplete = true;
}

function _getValue(dbValue) {
  if (!dbValue) {
    return 'No';
  }
  return dbValue === 'Y' ? 'Yes' : 'No';
}

function _makeEditor(editorId, values, height) {
  $(`#${editorId}`).summernote({
    lang: 'ko-KR',
    tabsize: 3,
    height: height ? height : 350,
    toolbar: [
      ['fontsize', ['fontsize']],
      ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
      ['color', ['forecolor', 'color']],
      ['para', ['ul', 'ol', 'paragraph']],
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });

  $(`#${editorId}`).summernote('code', values[editorId]);

  const isAble = appCtxService.ctx.checklist.standardBOM.isEditing ? 'enable' : 'disable';
  $(`#${editorId}`).summernote(isAble);
}

let currentProductContext; // 현재 편집중인 탑모듈 productContext
let currentEditModuleAssy;
export let topElementUids = [];
// 탑이 아닌 경우 occruence 열어서 ctx.productContext 수정해야 함
async function _getOccurecne(selectedStructureBOMLine) {
  const topObject = ctx.checklist.standardBOM.topObject;
  await lgepObjectUtils.getProperties(topObject, ['ps_children']);
  topElementUids = [...topObject.props.ps_children.dbValues, topObject.uid];
  // 선택한 노드의 모듈 찾기 (부모 moduleAssy없으면 자기자신임)
  currentEditModuleAssy = selectedStructureBOMLine.moduleAssy ? selectedStructureBOMLine.moduleAssy : selectedStructureBOMLine;
  // top 아니면 occ열기
  if (ctx.checklist.standardBOM.topElement.uid !== currentEditModuleAssy.uid) {
    // 이미 열려있는 occ있으면 찾아보기
    if (ctx.checklist.standardBOM.occurrenceList) {
      for (const occurrenceInfo of ctx.checklist.standardBOM.occurrenceList) {
        if (occurrenceInfo.moduleElement.props.awb0Archetype.dbValues[0] === currentEditModuleAssy.props.awb0Archetype.dbValues[0]) {
          currentProductContext = ctx.checklist.standardBOM.productContext;
          currentEditModuleAssy = ctx.checklist.standardBOM.topElement;
          ctx.checklist.standardBOM.editmode = { occurrenceInfo: occurrenceInfo };
          return;
        }
      }
    }
    const revUid = currentEditModuleAssy.props.awb0UnderlyingObject.dbValues[0];
    const product = {
      uid: revUid,
      type: 'L2_StructureRevision',
    };
    const requestParam = L2_StandardBOMService.getOccurrences3Param(product);
    const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);
    // Occurrence
    const parentOccurrence = getOccurrences3Response.parentOccurrence;
    const parentOccurrenceId = parentOccurrence.occurrenceId;
    // Product Context
    currentProductContext = {
      uid: getOccurrences3Response.rootProductContext.uid,
      type: getOccurrences3Response.rootProductContext.type,
    };
    // In Context
    const inContextParam = L2_StandardBOMService.getInContextParam(parentOccurrenceId);
    const saveUserWorkingContextState2Response = await soaService.post(
      'Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement',
      'saveUserWorkingContextState2',
      inContextParam,
    );
    const occurrenceInfo = {
      moduleElement: currentEditModuleAssy,
      moduleObject: currentEditModuleAssy,
      productContext: currentProductContext,
      occurrence: parentOccurrenceId,
    };
    const occurrenceList = ctx.checklist.standardBOM.occurrenceList ? ctx.checklist.standardBOM.occurrenceList : [];
    ctx.checklist.standardBOM.occurrenceList = [...occurrenceList, occurrenceInfo];
    ctx.checklist.standardBOM.editmode = { occurrenceInfo: occurrenceInfo };
  } else {
    currentProductContext = ctx.checklist.standardBOM.productContext;
    currentEditModuleAssy = ctx.checklist.standardBOM.topElement;
  }
}

export function getModule(bomLine, topElementUids) {
  return ctx.checklist.standardBOM.detailTop;
}

let editNodes = [];

// 편집 실행
async function editStandardBomRow(data, ctx) {
  ctx.checklist.standardBOM.startBomEditing = true;
  getCheckListAssyList();
  notySvc.setTimeout(lgepMessagingUtils.INFORMATION, 100);
  const selectedStructureBOMLine = ctx.checklist.standardBOM.bomTreeSelection;

  ctx.checklist.standardBOM.isDetailView = true;

  if (ctx.checklist.standardBOM.isTopEditing) {
    delete ctx.checklist.standardBOM.isTopEditing;
  }

  await _getOccurecne(selectedStructureBOMLine);

  // 해당 탑노드만 열기
  awTableStateService.clearAllStates(appCtxService.ctx.checklist.standardBOM.eventData.scope.data, 'standardBOMTree');
  await L2_StandardBOMService.expand2(appCtxService.ctx.checklist.standardBOM.eventData.scope, currentEditModuleAssy);
  _getEditNode(currentEditModuleAssy);
  if (!ctx.checklist.standardBOM.editmode) {
    ctx.checklist.standardBOM.editmode = {};
  }
  ctx.checklist.standardBOM.editmode.editInfo = { editTopModule: currentEditModuleAssy };

  // 에디터 열려있는 경우 enable시킴
  const selectType = await _getType(selectedStructureBOMLine);
  if (selectType === 'L2_FunctionRevision') {
    for (const editorId of FUNCTION_EDITOR_IDS) {
      if (document.querySelector(`#${editorId}`)) {
        $(`#${editorId}`).summernote('enable');
      }
    }
  } else if (selectType === 'L2_FailureRevision') {
    for (const editorId of FAILURE_EDITOR_IDS) {
      if (document.querySelector(`#${editorId}`)) {
        $(`#${editorId}`).summernote('enable');
      }
    }
  } else {
    const modelObject = ctx.checklist.standardBOM.bomTreeSelection;
    if (!modelObject) {
      return;
    }
    const rev = await lgepObjectUtils.loadObject2(modelObject.props.awb0Archetype.dbValue);
    const item = await lgepObjectUtils.loadObject2(rev.props.items_tag.dbValues[0]);
    const treeEl = document.querySelector('#standardBOMTree');
    const viewData = viewModelService.getViewModelUsingElement(treeEl);
    viewData.structureNameText.dbValue = rev.props.object_name.dbValues[0];
    viewData.structureNameText.dbValues = [rev.props.object_name.dbValues[0]];
    viewData.isChecklistCheckValue.dbValue = item.props.l2_is_checklist.dbValues[0] ? item.props.l2_is_checklist.dbValues[0] : 'N';
    viewData.isChecklistCheckValue.dbValues = [item.props.l2_is_checklist.dbValues[0] ? item.props.l2_is_checklist.dbValues[0] : 'N'];
    viewData.isChecklistCheckValue.uiValue = _getValue(item.props.l2_is_checklist.dbValues[0]);
    viewData.isChecklistTargetValue.dbValue = item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N';
    viewData.isChecklistTargetValue.dbValues = [item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N'];
    viewData.isChecklistTargetValue.uiValue = _getValue(item.props.l2_is_checklist_target.dbValues[0]);
    viewData.templateCheckValue.dbValue = item.props.l2_is_template.dbValues[0] ? item.props.l2_is_template.dbValues[0] : 'N';
    viewData.templateCheckValue.dbValues = [item.props.l2_is_template.dbValues[0] ? item.props.l2_is_template.dbValues[0] : 'N'];
    viewData.templateCheckValue.uiValue = _getValue(item.props.l2_is_template.dbValues[0]);
  }
  ctx.checklist.standardBOM.isEditing = true;
  delete ctx.checklist.standardBOM.startBomEditing;
}

function _getEditNode(node) {
  editNodes.push(node);

  if (node.children) {
    for (const childRow of node.children) {
      _getEditNode(childRow);
    }
  }
}

function editOpen(data, ctx) {
  data.isEditing.dbValue = true;
  const editorIds = ctx.checklist.standardBOM.selectBomTreeNodeType === 'L2_FunctionRevision' ? FUNCTION_EDITOR_IDS : FAILURE_EDITOR_IDS;

  for (const editorId of editorIds) {
    $(`#${editorId}`).summernote('enable');
  }
}

// 편집 저장
async function saveEdit(data, ctx) {
  ctx.checklist.standardBOM.moduleSaving = true;
  // 마지막 정보도 저장
  await saveEditInfo(ctx.checklist.standardBOM.selectBomTreeNode, data);
  let editNode;
  for (const editInfo of Object.values(ctx.checklist.standardBOM.editmode.editInfo)) {
    if (editInfo.constructor.name == 'ViewModelTreeNode') {
      editNode = editInfo;
      continue;
    }
    let editorIds;
    const selectType = editInfo.type;
    if (selectType === 'L2_FunctionRevision') {
      editorIds = FUNCTION_EDITOR_IDS;
      const functionNode = editInfo.node;
      const failures = functionNode.children;

      let removeDatasets = [];
      let txtDatasets = [];
      for (const failure of failures) {
        const existDatasetUid = failure.props.l2_reference_dataset.dbValues[0];
        let existProperties;
        if (existDatasetUid) {
          existProperties = await _readPropertiesFromTextFile(existDatasetUid);
          const existDataset = lgepObjectUtils.getObject(existDatasetUid);
          if (existDataset) {
            removeDatasets.push(existDataset);
          }
        }
        // failure
        const itemId = failure.props.awb0ArchetypeId.dbValues[0];

        let editInfoCopy = editInfo;

        const txtDataset = await _makeTxtDataset2(existProperties, editorIds, itemId, editInfoCopy);
        await setUidIncontextByTopEl(failure, txtDataset, ctx.checklist.standardBOM.detailTop);
        txtDatasets.push(txtDataset);
      }

      // 일반속성 set
      const functionObject = lgepObjectUtils.getObject(functionNode.props.awb0Archetype.dbValues[0]);
      const editorValue = editInfo.function;
      const stringContents = editorValue ? removeTagInStr(editorValue) : '';
      lgepObjectUtils.setProperties(functionObject, ['l2_function'], [stringContents]);

      functionNode.displayName = '[기능] ' + stringContents;

      let topObject = await lgepObjectUtils.loadObject2(ctx.checklist.standardBOM.detailTop.props.awb0UnderlyingObject.dbValues[0]);
      _changeTopObjectRef(topObject, removeDatasets, txtDatasets);
    } else if (selectType === 'L2_FailureRevision') {
      try {
        editorIds = FAILURE_EDITOR_IDS;
        const failure = editInfo.node;
        const itemId = failure.props.awb0ArchetypeId.dbValues[0];
        const existDatasetUid = failure.props.l2_reference_dataset.dbValues[0];
        let existProperties;
        existProperties = await _readPropertiesFromTextFile(existDatasetUid);

        let editInfoCopy = editInfo;
        const txtDataset = await _makeTxtDataset2(existProperties, editorIds, itemId, editInfoCopy);

        const importanceValue = editInfo['l2_importance'];
        await setUidIncontextByTopEl(failure, txtDataset, ctx.checklist.standardBOM.detailTop);
        await setValueIncontextByTopEl(failure, importanceValue, ctx.checklist.standardBOM.detailTop);

        // 일반속성도 set
        const failureObject = lgepObjectUtils.getObject(failure.props.awb0Archetype.dbValues[0]);
        const editorValue = editInfo.failureMode;
        const stringContents = editorValue ? removeTagInStr(editorValue) : '';
        lgepObjectUtils.setProperties(failureObject, ['l2_failure_mode'], [stringContents]);

        failure.displayName = '[고장] ' + stringContents;

        // top set
        let topObject = await lgepObjectUtils.loadObject2(ctx.checklist.standardBOM.detailTop.props.awb0UnderlyingObject.dbValues[0]);
        const existDataset = lgepObjectUtils.getObject(existDatasetUid);
        const removeDatasets = existDataset ? [existDataset] : null;
        _changeTopObjectRef(topObject, removeDatasets, [txtDataset]);
      } catch (err) {
        console.log('L2_FailureRevision save', err);
      }
    } else if (selectType == 'L2_StructureRevision') {
      editorIds = STRUCTURE_IDS;
      const structureNode = editInfo.node;
      const structureObject = lgepObjectUtils.getObject(structureNode.props.awb0Archetype.dbValues[0]);
      const structureItemObject = await lgepObjectUtils.getItemByItemRevision(structureObject);

      // 임시...
      let props = [];
      let values = [];
      if (editInfo.isChecklistTargetValue) {
        props.push('l2_is_checklist_target');
        values.push(editInfo.isChecklistTargetValue);
      }
      if (editInfo.isChecklistCheckValue) {
        props.push('l2_is_checklist');
        values.push(editInfo.isChecklistCheckValue);
      }
      if (editInfo.templateCheckValue) {
        props.push('l2_is_template');
        values.push(editInfo.templateCheckValue);
      }
      lgepObjectUtils.setProperties(structureItemObject, props, values);
      if (editInfo.structureNameText) {
        lgepObjectUtils.setProperties(structureObject, ['object_name'], [editInfo.structureNameText]);
        structureNode.displayName = '[구조] ' + editInfo.structureNameText;
      }
    }
    _afterSave(data, editorIds);
  }
  notySvc.setTimeout(INFORMATION, 100);
  notySvc.showInfo('저장 했습니다');
  delete ctx.checklist.standardBOM.moduleSaving;
  ctx.checklist.standardBOM.editmode.editInfo = { editNode };
}

function _afterSave(data, editorIds) {
  for (const editorId of editorIds) {
    $(`#${editorId}`).summernote('disable');
  }
  editNodes = [];
}

// 편집 취소
async function cancelEdit() {
  delete ctx.checklist.standardBOM.editmode;
  editNodes = [];
  // 에디터 refresh
  const currentSelection = ctx.checklist.standardBOM.bomTreeSelection;
  await initEditorSection(currentSelection, ctx.checklist.standardBOM.viewData);
  ctx.checklist.standardBOM.isEditing = false;
  standardBOMBack();
}

async function _getType(bomLineNode) {
  const rev = await lgepObjectUtils.loadObject2(bomLineNode.props.awb0UnderlyingObject.dbValues[0]);
  return rev.type;
}

function _getName(createType) {
  if (createType === 'L2_Structure') {
    return 'Structure';
  } else if (createType === 'L2_Function') {
    return 'Function';
  } else {
    return 'Failure';
  }
}

export function _makeTxtDataset2(existProperties, editorIds, itemId, editInfo) {
  if (!existProperties) {
    existProperties = {};
    existProperties.function = '';
    existProperties.requirement = '';
    existProperties.failureMode = '';
    existProperties.failureEffect = '';
    existProperties.failureDetail = '';
    existProperties.prevention = '';
    existProperties.referenceData = '';
    existProperties.detectivity = '';
    existProperties.classification = '';
  }
  for (const editorId of editorIds) {
    existProperties[editorId] = editInfo[editorId];
  }
  return _stringToDataset(itemId, JSON.stringify(existProperties));
}

async function _stringToDataset(name, content, targetDataset) {
  let files = [];
  files.push(
    new File([content], targetDataset ? targetDataset.props.ref_list.uiValues[0] : name + '.TXT', {
      type: 'text',
    }),
  );
  let dataset = await lgepSummerNoteUtils.uploadFileToDataset(files);
  lgepObjectUtils.setProperties(dataset[0], ['object_name'], [name]);
  return dataset[0];
}

export default exports = {
  editOpen,
  saveEdit,
  cancelEdit,
  editStandardBomRow,
};

/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectService
 */
app.factory('L2_StandardBOMSearchAndSelectService', () => exports);
