import app from 'app';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import { setUidIncontextByTopEl, setValuesIncontextByTopEl, removeTagInStr, _changeTopObjectRef } from 'js/L2_ChecklistMasterEditService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import _ from 'lodash';
import viewModelService from 'js/viewModelService';
import { standardBOMBack } from 'js/L2_StandardBOMSearchDetailService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import eventBus from 'js/eventBus';
import { checkSave2 } from 'js/L2_InteractionMatrixAddService';
import browserUtils from 'js/browserUtils';
import awPromiseService from 'js/awPromiseService';
import lgepTicketUtils from 'js/utils/lgepTicketUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

let exports = {};

const FUNCTION_EDITOR_IDS = ['function', 'requirement'];
const FAILURE_EDITOR_IDS = ['failureMode', 'failureEffect', 'failureDetail', 'prevention', 'referenceData', 'detectivity', 'classification'];
const STRUCTURE_IDS = ['structureNameText', 'isChecklistTargetValue', 'isChecklistCheckValue', 'templateCheckValue', 'l2_comments'];

// 해당 노드가 지워졌는지 확인
function _deleteNodeCheck(targetNodeUid) {
  if (ctx.checklist.standardBOM.deleteNodes) {
    for (const deleteNode of ctx.checklist.standardBOM.deleteNodes) {
      if (targetNodeUid === deleteNode.uid) {
        return true;
      }
    }
  }
}

// 해당 노드가 지워졌는지 확인
function _deleteNodeCheck2(targetNodeUid) {
  if (ctx.checklist.standardBOM.deleteNodes) {
    for (const deleteNode of ctx.checklist.standardBOM.deleteNodes) {
      if (targetNodeUid === deleteNode.props.awb0Archetype.dbValues[0]) {
        return true;
      }
    }
  }
}

// 편집중일때 각 노드 선택 할때마다 이전 노드의 정보 저장
export async function saveEditInfo(selectNode, data) {
  // 삭제 됐으면 passd
  if (!selectNode) {
    return;
  }
  try {
    if (_deleteNodeCheck(selectNode.uid)) {
      return;
    }
    let nodeInfo;
    const selectType = await _getType(selectNode);
    if (selectType === 'L2_FunctionRevision') {
      const viewData = ctx.checklist.standardBOM.viewData;
      if (!document.querySelector('#function')) {
        return;
      }
      nodeInfo = { node: selectNode, type: selectType };
      for (const editorId of FUNCTION_EDITOR_IDS) {
        nodeInfo[editorId] = $(`#${editorId}`).summernote('code');
      }
      nodeInfo['l2_comments'] = _replaceEmpty(viewData.comments.dbValue);
      nodeInfo['files'] = await saveAttach2(selectNode, nodeInfo);
    } else if (selectType === 'L2_FailureRevision') {
      const viewData = ctx.checklist.standardBOM.viewData;
      if (!document.querySelector('#failureMode')) {
        return;
      }
      nodeInfo = { node: selectNode, type: selectType };
      for (const editorId of FAILURE_EDITOR_IDS) {
        nodeInfo[editorId] = $(`#${editorId}`).summernote('code');
      }
      nodeInfo['files'] = await saveAttach2(selectNode, nodeInfo);
      nodeInfo['l2_comments'] = _replaceEmpty(viewData.comments.dbValue);
      nodeInfo['l2_importance'] = ctx.checklist.standardBOM.viewData.importanceValue.dbValue;
    } else {
      nodeInfo = { node: selectNode, type: selectType };
      const viewData = ctx.checklist.standardBOM.viewData;
      for (const id of STRUCTURE_IDS) {
        if (id === 'structureNameText' || id === 'l2_comments') {
          nodeInfo[id] = viewData[id].dbValues.length === 0 ? '' : viewData[id].dbValues[0];
        } else {
          nodeInfo[id] = viewData[id].newValue ? viewData[id].newValue : viewData[id].dbValues[0];
        }
      }
    }
    nodeInfo['l2_images'] = $('#inputImage').summernote('code');
    selectNode.editorInfo = nodeInfo;
    if (ctx.checklist.standardBOM.editNodes) {
      const editNodes = ctx.checklist.standardBOM.editNodes.filter((nodeInfo) => {
        // 기존 제거
        if (selectNode.id !== nodeInfo.node.id) {
          return true;
        }
      });
      ctx.checklist.standardBOM.editNodes = [...editNodes, nodeInfo];
    } else {
      ctx.checklist.standardBOM.editNodes = [nodeInfo];
    }
  } catch (e) {
    console.log('saveEditInfo', e);
    return;
  }
}

// 에디터 초기화
export async function initEditorSection(modelObject, data) {
  const selectType = await _getType(modelObject);
  if (!selectType) {
    return;
  }
  ctx.checklist.standardBOM.selectBomTreeNode = modelObject;
  ctx.checklist.standardBOM.selectBomTreeNodeType = selectType;
  const viewData = ctx.checklist.standardBOM.viewData;
  if (selectType === 'L2_FunctionRevision') {
    if (modelObject.editorInfo) {
      const editInfoValues = modelObject.editorInfo;
      for (const id of FUNCTION_EDITOR_IDS) {
        _makeEditor(id, editInfoValues);
      }
      viewData.comments.dbValue = editInfoValues['l2_comments'];
      viewData.comments.dbValues[0] = editInfoValues['l2_comments'];
      viewData.comments.uiValue = editInfoValues['l2_comments'];
      ctx.checklist.standardBOM.initComplete = true;
      return;
    }
    let failure;
    if (modelObject.children && modelObject.children.length > 0) {
      failure = modelObject.children[0];
    } else {
      failure = modelObject.failureChildren[0];
    }
    const values = await _readPropertiesFromTextFile(failure.props.l2_reference_dataset.dbValues[0]);
    ctx.checklist.standardBOM.values = values;
    for (const id of FUNCTION_EDITOR_IDS) {
      _makeEditor(id, values);
    }
    viewData.comments.dbValue = modelObject.props.l2_comments.dbValues[0];
    viewData.comments.dbValues[0] = modelObject.props.l2_comments.dbValues[0];
    viewData.comments.uiValue = modelObject.props.l2_comments.dbValues[0];
    if (!ctx.checklist.standardBOM.isEditing) {
      viewData.comments.isEditable = false;
    } else {
      viewData.comments.isEditable = true;
    }
  } else if (selectType === 'L2_FailureRevision') {
    const importanceValue = modelObject.props.l2_importance.dbValues[0] ? modelObject.props.l2_importance.dbValues[0] : '';
    if (ctx.checklist.standardBOM.isEditing) {
      ctx.checklist.standardBOM.viewData.importanceValue.dbValue = importanceValue;
      ctx.checklist.standardBOM.viewData.importanceValue.dbValues = [importanceValue];
      ctx.checklist.standardBOM.viewData.importanceValue.uiValue = importanceValue;
      viewData.comments.isEditable = true;
    } else {
      ctx.checklist.standardBOM.viewData.importance.dbValue = importanceValue;
      viewData.comments.isEditable = false;
    }

    if (modelObject.editorInfo) {
      const editInfoValues = modelObject.editorInfo;
      for (const id of FAILURE_EDITOR_IDS) {
        _makeEditor(id, editInfoValues);
      }
      ctx.checklist.standardBOM.initComplete = true;
      viewData.comments.dbValue = editInfoValues['l2_comments'];
      viewData.comments.dbValues[0] = editInfoValues['l2_comments'];
      return;
    }
    const values = await _readPropertiesFromTextFile(modelObject.props.l2_reference_dataset.dbValues[0]);
    ctx.checklist.standardBOM.values = values;
    for (const id of FAILURE_EDITOR_IDS) {
      _makeEditor(id, values);
    }
    viewData.comments.dbValue = modelObject.props.l2_comments.dbValues[0];
    viewData.comments.dbValues[0] = modelObject.props.l2_comments.dbValues[0];
    viewData.comments.uiValue = modelObject.props.l2_comments.dbValues[0];
  } else if (selectType === 'L2_StructureRevision') {
    const rev = await lgepObjectUtils.loadObject2(modelObject.props.awb0Archetype.dbValue);
    const item = await lgepObjectUtils.loadObject2(rev.props.items_tag.dbValues[0]);
    await lgepObjectUtils.getProperties(item, ['l2_is_checklist', 'l2_is_checklist_target', 'l2_is_template', 'l2_product_type', 'l2_product_class']);
    if (ctx.checklist.standardBOM.previousView) {
      data = ctx.checklist.standardBOM.previousView;
    }

    if (ctx.checklist.standardBOM.isEditing) {
      $('#inputImage').summernote('destroy');
      $('#inputImage').summernote({
        width: '100%',
        height: 300,
        toolbar: [['insert', ['picture', 'link']], ['codeview']],
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
      });
      $('#inputImage').summernote('enable');
      if (ctx.checklist.standardBOM.isEditing && ctx.checklist.standardBOM.editNodes) {
        let editorValue;
        for (let node of ctx.checklist.standardBOM.editNodes) {
          if (node.node.id == modelObject.id) {
            editorValue = node;
          }
        }
        if (editorValue !== null && editorValue !== undefined) {
          for (const id of STRUCTURE_IDS) {
            if (id === 'structureNameText') {
              data.structureNameText.dbValue = rev.props.object_name.dbValues[0];
              data.structureNameText.dbValues = [rev.props.object_name.dbValues[0]];
            } else {
              let propName;
              if (id === 'isChecklistTargetValue') {
                propName = 'l2_is_checklist_target';
              } else if (id === 'isChecklistCheckValue') {
                propName = 'l2_is_checklist';
              } else if (id === 'templateCheckValue') {
                propName = 'l2_is_template';
              } else {
                propName = id;
              }
              if (id === 'l2_comments') {
                data[id].dbValue = editorValue[id] ? editorValue[id] : rev.props[propName].dbValues[0] ? rev.props[propName].dbValues[0] : '';
                data[id].dbValues = [editorValue[id] ? editorValue[id] : rev.props[propName].dbValues[0] ? rev.props[propName].dbValues[0] : ''];
              } else {
                let value = editorValue[id] === 'Y' ? 'Yes' : 'No';
                data[id].dbValue = editorValue[id] ? editorValue[id] : item.props[propName].dbValues[0] ? item.props[propName].dbValues[0] : 'N';
                data[id].dbValues = [editorValue[id] ? editorValue[id] : item.props[propName].dbValues[0] ? item.props[propName].dbValues[0] : 'N'];
                data[id].uiValue = editorValue[id] ? value : _getValue(item.props[propName].dbValues[0]);
              }
            }
          }
          $('#inputImage').summernote('code', editorValue.l2_images);
          ctx.checklist.standardBOM.initComplete = true;
          return;
        }
      }
      data.structureNameText.dbValue = rev.props.object_name.dbValues[0];
      data.structureNameText.dbValues = [rev.props.object_name.dbValues[0]];
      data.isChecklistTargetValue.dbValue = item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N';
      data.isChecklistTargetValue.dbValues = [item.props.l2_is_checklist_target.dbValues[0] ? item.props.l2_is_checklist_target.dbValues[0] : 'N'];
      data.isChecklistTargetValue.uiValue = _getValue(item.props.l2_is_checklist_target.dbValues[0]);
      data.comments.dbValue = rev.props.l2_comments.dbValues[0];
      data.comments.dbValues = [rev.props.l2_comments.dbValues[0]];
      data.l2_comments.dbValue = rev.props.l2_comments.dbValues[0];
      data.l2_comments.dbValues = [rev.props.l2_comments.dbValues[0]];
      let urls = await lgepTicketUtils.getFileTicket(rev);
      let value = '';
      if (urls) {
        for (let url of urls) {
          let tag1 = `<img src=${url}><br>`;
          value += tag1;
        }
      }
      $('#inputImage').summernote('code', value);
    } else {
      data.structureName.dbValue = modelObject.displayName;
      data.structureTargetChecklist.dbValue = _getValue(item.props.l2_is_checklist_target.dbValues[0]);
      data.productType.dbValue = item.props.l2_product_type.dbValues[0];
      data.productClass.dbValue = item.props.l2_product_class.dbValues[0];
      data.comments.dbValue = rev.props.l2_comments.dbValues[0];
      data.comments.dbValues = [rev.props.l2_comments.dbValues[0]];
      data.l2_comments.dbValue = rev.props.l2_comments.dbValues[0];
      data.l2_comments.dbValues = [rev.props.l2_comments.dbValues[0]];
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
      ['CustomButton', ['attachButton']],
    ],
    buttons: {
      attachButton: attachButton(editorId),
    },
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });

  $(`#${editorId}`).summernote('code', values[editorId]);

  const isAble = ctx.checklist.standardBOM.isEditing ? 'enable' : 'disable';
  $(`#${editorId}`).summernote(isAble);
}

function attachButton(editorId) {
  return function (context) {
    var ui = $.summernote.ui;
    var button = ui.button({
      contents: '<div class="fa fa-pencil"/>UPLOAD</div>',
      click: async function (event) {
        let files = await openFileChooser();
        let contents = $(`#${editorId}`).summernote('code');
        for (let file of files) {
          let fileName = file.name;
          let dataset = await lgepSummerNoteUtils.uploadFileToDataset(file);
          let url = browserUtils.getBaseURL() + '#/lgepXcelerator?uid=' + dataset.uid;
          let aTag = `<a href=${url} dataUid=${dataset.uid} target="_blank">${fileName}<\a>`;
          let attach = ctx.checklist.standardBOM.attachFile;
          let totalAttach = ctx.checklist.standardBOM.totalAttachFile;
          if (attach) {
            attach.push(dataset.uid);
          } else {
            let attachFile = [dataset.uid];
            ctx.checklist.standardBOM['attachFile'] = attachFile;
          }
          if (totalAttach) {
            totalAttach.push(dataset.uid);
          } else {
            let attachFile = [dataset.uid];
            ctx.checklist.standardBOM['totalAttachFile'] = attachFile;
          }
          // await lgepObjectUtils.deleteObject(dataset);
          contents = contents.replaceAll('<a></a>', '');
          contents += aTag;
        }
        $(`#${editorId}`).summernote('code', contents);
      },
    });
    return button.render();
  };
}

var openFileChooser = () => {
  var deferred = awPromiseService.instance.defer();
  var input = document.createElement('input');
  input.type = 'file';
  input.multiple = 'multiple';

  input.onchange = (e) => {
    var file = e.target.files;
    deferred.resolve(file);
  };
  input.click();
  return deferred.promise;
};

// 편집 실행
async function editStandardBomRow(data, ctx) {
  ctx.checklist.standardBOM.startBomEditing = true;
  notySvc.setTimeout(lgepMessagingUtils.INFO, 100);
  const selectedStructureBOMLine = ctx.checklist.standardBOM.selectBomTreeNode;

  ctx.checklist.standardBOM.isDetailView = true;

  if (ctx.checklist.standardBOM.isTopEditing) {
    delete ctx.checklist.standardBOM.isTopEditing;
  }

  // await _getOccurecne(selectedStructureBOMLine);

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
    const modelObject = ctx.checklist.standardBOM.selectBomTreeNode;
    if (!modelObject) {
      return;
    }
    const rev = await lgepObjectUtils.loadObject2(modelObject.props.awb0Archetype.dbValue);
    const item = await lgepObjectUtils.loadObject2(rev.props.items_tag.dbValues[0]);
    const treeEl = document.querySelector('#standardBOMFolderTree');
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

function _replaceEmpty(value) {
  if (!value) {
    return '';
  }
  return value;
}

// 편집 취소
async function cancelEdit() {
  let totalAttach = ctx.checklist.standardBOM.totalAttachFile;
  if (totalAttach) {
    lgepObjectUtils.deleteObjects(totalAttach);
    delete ctx.checklist.standardBOM.totalAttachFile;
  }
  delete ctx.checklist.standardBOM.attachFile;
  delete ctx.checklist.standardBOM.editNodes;
  delete ctx.checklist.interactionMatrixEditing;
  // 에디터 refresh
  const currentSelection = ctx.checklist.standardBOM.selectBomTreeNode;
  try {
    await initEditorSection(currentSelection, ctx.checklist.standardBOM.viewData);
  } catch (e) {
    console.log('cancelEdit', e);
  }
  ctx.checklist.standardBOM.isEditing = false;
  standardBOMBack();
}

async function _getType(bomLineNode) {
  const rev = await lgepObjectUtils.loadObject2(bomLineNode.props.awb0UnderlyingObject.dbValues[0]);
  return rev.type;
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

// 편집 전체 저장
async function saveEdit(data, ctx) {
  let totalAttach = ctx.checklist.standardBOM.totalAttachFile;
  if (totalAttach) {
    delete ctx.checklist.standardBOM.totalAttachFile;
  }

  ctx.checklist.standardBOM.moduleSaving = true;
  // 마지막 정보도 저장
  notySvc.showInfo('저장 중입니다');
  try {
    // 인터랙션 매트릭스 대상 정보 저장
    const dpData = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
    checkSave2(dpData.dataProviders.standardBOMTreeDetailDataProvider.viewModelCollection.loadedVMObjects);

    await saveEditInfo(ctx.checklist.standardBOM.selectBomTreeNode, data);
    for (const editInfo of ctx.checklist.standardBOM.editNodes) {
      const editNode = editInfo.node;
      try {
        if (_deleteNodeCheck2(editNode.props.awb0Archetype.dbValues[0])) {
          continue;
        }
        if (!_checkNonPartSave(editNode.props.awb0Archetype.dbValues[0], editInfo)) {
          continue;
        }
        const selectType = editInfo.type;
        if (selectType === 'L2_FunctionRevision') {
          await _saveFunctionNode(editInfo.node, editInfo);
        } else if (selectType === 'L2_FailureRevision') {
          editInfo['l2_importance'] = ctx.checklist.standardBOM.viewData.importanceValue.dbValue;
          await _saveFailureNode(editInfo.node, editInfo);
        } else if (selectType == 'L2_StructureRevision') {
          const structureNode = editInfo.node;
          const structureObject = lgepObjectUtils.getObject(structureNode.props.awb0Archetype.dbValues[0]);
          const structureItemObject = await lgepObjectUtils.getItemByItemRevision(structureObject);

          const values = [
            _replaceEmpty(editInfo.isChecklistTargetValue),
            _replaceEmpty(editInfo.isChecklistCheckValue),
            _replaceEmpty(editInfo.templateCheckValue),
          ];
          editInfo.l2_comments = _replaceEmpty(editInfo.l2_comments);

          lgepObjectUtils.setProperties(structureItemObject, ['l2_is_checklist_target', 'l2_is_checklist', 'l2_is_template'], values);
          if (editInfo.structureNameText) {
            lgepObjectUtils.setProperties(structureObject, ['object_name', 'l2_comments'], [editInfo.structureNameText, editInfo.l2_comments]);
            structureNode.displayName = '[구조] ' + editInfo.structureNameText;
          }
          if (editInfo.l2_images.includes('<img')) {
            let datasets = await lgepSummerNoteUtils.imgFileToDataset(editInfo.l2_images, structureObject);
            let datasetUid = [];
            for (let dataset of datasets) {
              datasetUid.push(dataset.uid);
            }
            lgepObjectUtils.setProperties(structureObject, ['l2_images'], [datasetUid]);
          } else {
            let uids = structureObject.props.l2_images.dbValues;
            let objs = await lgepObjectUtils.getObjects(uids);
            if (objs.length > 1) {
              lgepObjectUtils.deleteObjects(objs);
            }
          }
        }
      } catch (e) {
        console.log('editInfo error', editInfo);
      }
    }
    ctx.checklist.standardBOM.editNodes = [];
    notySvc.showInfo('저장 했습니다');
    eventBus.publish('removeMessages');
    delete ctx.checklist.standardBOM.moduleSaving;
  } catch (e) {
    ctx.checklist.standardBOM.editNodes = [];
    ctx.checklist.standardBOM.moduleSaving = false;
    console.log('saveEdit', e);
  }
}

// 파트 세이브 안했던것만
function _checkNonPartSave(targetNodeUid, editInfo) {
  for (const partSaveInfo of ctx.checklist.standardBOM.partSaveNodes) {
    if (targetNodeUid === partSaveInfo.node.props.awb0Archetype.dbValues[0]) {
      const ids =
        partSaveInfo.type === 'L2_FailureRevision' ? FAILURE_EDITOR_IDS : partSaveInfo.type === 'L2_FunctionRevision' ? FUNCTION_EDITOR_IDS : STRUCTURE_IDS;
      return _check(partSaveInfo.editInfo, editInfo, ids);
    }
  }
  return true;
}

function _check(partSaveInfo, editInfo, ids) {
  for (const id of ids) {
    if (partSaveInfo[id] !== editInfo[id]) {
      return true;
    }
  }
}

// 부분 저장
async function savePart() {
  try {
    let totalAttach = ctx.checklist.standardBOM.totalAttachFile;
    let nowAttach = ctx.checklist.standardBOM.attachFile;
    if (totalAttach && nowAttach) {
      totalAttach = totalAttach.filter(function (e) {
        if (!nowAttach.find((a) => a == e)) {
          return true;
        }
      });
    }
    const viewData = ctx.checklist.standardBOM.viewData;
    ctx.checklist.standardBOM.moduleSaving = true;
    viewData.partSaveDisabledButtonChk.dbValue = true;

    notySvc.showInfo('저장 중입니다');

    // 파트 저장한 현재 노드
    const selectNode = ctx.checklist.standardBOM.selectBomTreeNode;
    const selectNodeType = ctx.checklist.standardBOM.selectBomTreeNodeType;
    let editInfo = {};

    if (selectNodeType === 'L2_FailureRevision') {
      for (const editorId of FAILURE_EDITOR_IDS) {
        editInfo[editorId] = $(`#${editorId}`).summernote('code');
      }
      editInfo['files'] = await saveAttach(selectNode);
      editInfo['l2_importance'] = viewData.importanceValue.dbValue;
      editInfo['l2_comments'] = _replaceEmpty(viewData.comments.dbValue);
      await _saveFailureNode(selectNode, editInfo);
    } else if (selectNodeType === 'L2_FunctionRevision') {
      for (const editorId of FUNCTION_EDITOR_IDS) {
        editInfo[editorId] = $(`#${editorId}`).summernote('code');
      }
      editInfo['files'] = await saveAttach(selectNode);
      editInfo['l2_comments'] = _replaceEmpty(viewData.comments.dbValue);
      await _saveFunctionNode(selectNode, editInfo);
    } else {
      for (const id of STRUCTURE_IDS) {
        if (id === 'structureNameText') {
          editInfo[id] = viewData[id].dbValues.length === 0 ? '' : viewData[id].dbValues[0];
        } else {
          editInfo[id] = viewData[id].newValue ? viewData[id].newValue : viewData[id].dbValues[0];
        }
      }
      let image = $('#inputImage').summernote('code');
      editInfo['l2_images'] = image;
      await _saveStructure(selectNode, editInfo);
    }
    selectNode.editInfo = editInfo;
    viewData.partSaveDisabledButtonChk.dbValue = false;
    ctx.checklist.standardBOM.moduleSaving = false;
    const partSaveInfo = { node: selectNode, editInfo, type: selectNodeType };
    if (!ctx.checklist.standardBOM.partSaveNodes) {
      ctx.checklist.standardBOM.partSaveNodes = [];
    }
    ctx.checklist.standardBOM.partSaveNodes = [...ctx.checklist.standardBOM.partSaveNodes, partSaveInfo];
    notySvc.showInfo('저장 했습니다');
    eventBus.publish('removeMessages');
  } catch (err) {
    console.log('savePart', err);
  } finally {
    eventBus.publish('removeMessages');
  }
}

async function _saveFailureNode(failureNode, editInfo) {
  try {
    const itemId = failureNode.props.awb0ArchetypeId.dbValues[0];
    const existDatasetUid = failureNode.props.l2_reference_dataset.dbValues[0];
    let existProperties;
    existProperties = await _readPropertiesFromTextFile(existDatasetUid);

    let editInfoCopy = editInfo;
    const txtDataset = await _makeTxtDataset2(existProperties, FAILURE_EDITOR_IDS, itemId, editInfoCopy);

    const importanceValue = editInfo['l2_importance'];

    await setValuesIncontextByTopEl(
      failureNode,
      ['l2_reference_dataset', 'l2_importance'],
      [txtDataset.uid, importanceValue],
      ctx.checklist.standardBOM.detailTop,
    );

    // 일반속성도 set
    const failureObject = lgepObjectUtils.getObject(failureNode.props.awb0Archetype.dbValues[0]);
    const editorValue = editInfo.failureMode;
    const comments = editInfo.l2_comments;
    const setFile = editInfo.files.attach;
    const deleteFile = editInfo.files.delete;
    const stringContents = editorValue ? removeTagInStr(editorValue) : '';
    lgepObjectUtils.setProperties(failureObject, ['l2_failure_mode', 'l2_comments', 'l2_files'], [stringContents, comments, setFile]);
    // lgepObjectUtils.setProperties(failureObject, ['l2_failure_mode', 'l2_comments'], [stringContents, comments]);
    if (deleteFile.length > 0) {
      lgepObjectUtils.deleteObjects(deleteFile);
    }

    failureNode.displayName = '[고장] ' + stringContents;

    // top set
    let topObject = await lgepObjectUtils.loadObject2(ctx.checklist.standardBOM.detailTop.props.awb0UnderlyingObject.dbValues[0]);
    const existDataset = lgepObjectUtils.getObject(existDatasetUid);
    const removeDatasets = existDataset ? [existDataset] : null;
    _changeTopObjectRef(topObject, removeDatasets, [txtDataset]);
  } catch (err) {
    console.log('_saveFailureNode save', err);
  }
}

// 기능 객체 저장
async function _saveFunctionNode(functionNode, editInfo) {
  const failures = functionNode.children;
  const removeDatasets = [];
  const txtDatasets = [];
  try {
    for (const failure of failures) {
      if (_deleteNodeCheck2(failure.props.awb0Archetype.dbValues[0])) {
        continue;
      }
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
      const txtDataset = await _makeTxtDataset2(existProperties, FUNCTION_EDITOR_IDS, itemId, editInfo);
      await setUidIncontextByTopEl(failure, txtDataset, ctx.checklist.standardBOM.detailTop);
      txtDatasets.push(txtDataset);
    }

    // 일반속성 set
    const functionObject = lgepObjectUtils.getObject(functionNode.props.awb0Archetype.dbValues[0]);
    const editorValue = editInfo.function;
    const stringContents = editorValue ? removeTagInStr(editorValue) : '';
    const comments = editInfo.l2_comments;
    const setFile = editInfo.files.attach;
    const deleteFile = editInfo.files.delete;
    lgepObjectUtils.setProperties(functionObject, ['l2_function', 'l2_comments', 'l2_files'], [stringContents, comments, setFile]);
    // lgepObjectUtils.setProperties(functionObject, ['l2_function', 'l2_comments'], [stringContents, comments]);
    if (deleteFile.length > 0) {
      lgepObjectUtils.deleteObjects(deleteFile);
    }

    functionNode.displayName = '[기능] ' + stringContents;

    let topObject = await lgepObjectUtils.loadObject2(ctx.checklist.standardBOM.detailTop.props.awb0UnderlyingObject.dbValues[0]);
    _changeTopObjectRef(topObject, removeDatasets, txtDatasets);
  } catch (err) {
    console.log('_saveFunctionNode', err);
  }
}

async function _saveStructure(structureNode, editInfo) {
  const structureObject = lgepObjectUtils.getObject(structureNode.props.awb0Archetype.dbValues[0]);
  const structureItemObject = await lgepObjectUtils.getItemByItemRevision(structureObject);

  const values = [_replaceEmpty(editInfo.isChecklistTargetValue), _replaceEmpty(editInfo.isChecklistCheckValue), _replaceEmpty(editInfo.templateCheckValue)];
  lgepObjectUtils.setProperties(structureItemObject, ['l2_is_checklist_target', 'l2_is_checklist', 'l2_is_template'], values);
  editInfo.l2_comments = _replaceEmpty(editInfo.l2_comments);
  if (editInfo.structureNameText) {
    lgepObjectUtils.setProperties(structureObject, ['object_name', 'l2_comments'], [editInfo.structureNameText, editInfo.l2_comments]);
    structureNode.displayName = '[구조] ' + editInfo.structureNameText;
  }
  if (editInfo.l2_images.includes('<img')) {
    let datasets = await lgepSummerNoteUtils.imgFileToDataset(editInfo.l2_images, structureObject);
    let datasetUid = [];
    for (let dataset of datasets) {
      datasetUid.push(dataset.uid);
    }
    lgepObjectUtils.setProperties(structureObject, ['l2_images'], [datasetUid]);
  } else {
    let uids = structureObject.props.l2_images.dbValues;
    let objs = await lgepObjectUtils.getObjects(uids);
    if (objs.length > 1) {
      lgepObjectUtils.deleteObjects(objs);
    }
  }
}

async function editIsChecklist() {
  const selectNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!_isModuleNode(selectNode)) {
    notySvc.showInfo('모듈만 수정 가능 합니다');
    return;
  }
  const templateRev = lgepObjectUtils.getObject(selectNode.props.awb0Archetype.dbValues[0]);
  const templateItem = await lgepObjectUtils.getItemByItemRevision(templateRev);
  await lgepObjectUtils.getProperties(templateItem, ['l2_is_checklist_target']);
  const isChecklistTargetCurrentValue = templateItem.props.l2_is_checklist_target.dbValues[0];
  const isChecklistTargetNewValue = isChecklistTargetCurrentValue === 'Y' ? 'N' : 'Y';
  await lgepObjectUtils.setProperties(templateItem, ['l2_is_checklist_target'], [isChecklistTargetNewValue]);

  eventBus.publish('standardBOMTree.plTable.reload');

  delete ctx.checklist.standardBOM.selectBomTreeNode;
  delete ctx.checklist.standardBOM.selectBomTreeNodeType;
  delete selectNode.editInfo;
  const viewData = viewModelService.getViewModelUsingElement(document.querySelector('#standardBOMFolderTree'));
  await initEditorSection(selectNode, viewData);
  notySvc.setTimeout(lgepMessagingUtils.INFO, 10);
  notySvc.showInfo('수정 했습니다');
}

function _isModuleNode(selectNode) {
  const templateNode = ctx.checklist.standardBOM.templateNode;
  if (templateNode.children) {
    for (const module of templateNode.children) {
      if (module.uid === selectNode.uid) {
        return true;
      }
    }
  }
  return false;
}

async function saveAttach(selectNode) {
  //현재 화면에서 첨부되어있는 파일들을 찾아 top StructureRevision에 l2_files속성에 추가
  let div = $(`.cheklist-input > div`).not(`div.hidden`).find('a[datauid]');
  let nowAttach = [];
  for (let aTag of div) {
    if (aTag.getAttribute('datauid')) {
      nowAttach.push(aTag.getAttribute('datauid'));
    }
  }
  let selectUid = selectNode.props.awb0UnderlyingObject.dbValues[0];
  let obj = lgepObjectUtils.getObject(selectUid);
  lgepObjectUtils.getProperties([obj], ['l2_files']);
  let attached = obj.props.l2_files.dbValues;
  if (!attached) {
    attached = [];
  }
  let newAttach = ctx.checklist.standardBOM.attachFile;
  let deleteUid = [];
  if (attached.length > 0) {
    for (let uid of attached) {
      let find = nowAttach.find((item) => item == uid);
      if (!find) {
        deleteUid.push(uid);
      }
    }
  }
  if (newAttach && newAttach.length > 0) {
    for (let uid of newAttach) {
      let find = nowAttach.find((item) => item == uid);
      if (!find) {
        deleteUid.push(uid);
      }
    }
  }
  if (deleteUid.length > 0) {
    lgepObjectUtils.deleteObjects(deleteUid);
  }

  ctx.checklist.standardBOM.attachFile = [];

  return {
    attach: nowAttach,
    delete: deleteUid,
  };
}

async function saveAttach2(selectNode, nodeInfo) {
  //현재 화면에서 첨부되어있는 파일들을 찾아 top StructureRevision에 l2_files속성에 추가
  let keys;
  let nowAttach = [];
  if (nodeInfo.type == 'L2_FailureRevision') {
    keys = FAILURE_EDITOR_IDS;
  } else if (nodeInfo.type == 'L2_FunctionRevision') {
    keys = FUNCTION_EDITOR_IDS;
  }
  for (let key of keys) {
    let regEx = /(?<=datauid=")(.*?)(?=")/g;
    let uids = nodeInfo[key].match(regEx);
    if (uids) {
      for (let uid of uids) {
        nowAttach.push(uid);
      }
    }
  }
  let selectUid = selectNode.props.awb0UnderlyingObject.dbValues[0];
  let obj = lgepObjectUtils.getObject(selectUid);
  lgepObjectUtils.getProperties([obj], ['l2_files']);
  let attached = obj.props.l2_files.dbValues;
  if (!attached) {
    attached = [];
  }
  let newAttach = ctx.checklist.standardBOM.attachFile;
  let deleteUid = [];
  if (attached.length > 0) {
    for (let uid of attached) {
      let find = nowAttach.find((item) => item == uid);
      if (!find) {
        deleteUid.push(uid);
      }
    }
  }
  if (newAttach && newAttach.length > 0) {
    for (let uid of newAttach) {
      let find = nowAttach.find((item) => item == uid);
      if (!find) {
        deleteUid.push(uid);
      }
    }
  }
  if (deleteUid.length > 0) {
    lgepObjectUtils.deleteObjects(deleteUid);
  }

  ctx.checklist.standardBOM.attachFile = [];

  return {
    attach: nowAttach,
    delete: deleteUid,
  };
}

export default exports = {
  saveEdit,
  cancelEdit,
  editStandardBomRow,
  savePart,
  editIsChecklist,
};

/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectService
 */
app.factory('L2_StandardBOMSearchAndSelectService', () => exports);
