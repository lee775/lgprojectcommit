import app from 'app';
import popupService from 'js/popupService';
import { ctx } from 'js/appCtxService';
import eventBus from 'js/eventBus';
import notySvc from 'js/NotyModule';
import soaService from 'soa/kernel/soaService';
import { INFORMATION, show } from 'js/utils/lgepMessagingUtils';
import L2_ChecklistOpenService from 'js/L2_ChecklistOpenService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import viewModelService from 'js/viewModelService';
import { saveViewModelEditAndSubmitWorkflow2, saveUserWorkingContextState2, dateTo_GMTString } from 'js/utils/lgepBomUtils';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

let exports;

const STRUCTURE_LEVEL_TOP = 'top';
const STRUCTURE_LEVEL_PARENT = 'parent';
const STRUCTURE_LEVEL_SUB = 'sub';
const STRUCTURE_LEVEL_SINGLE = 'single';
const EDITOR_IDS = ['function', 'requirement', 'failureMode', 'failureEffect', 'failureDetail', 'prevention', 'referenceData', 'detectivity', 'classification'];

export function addChecklistFailure(data, ctx) {
  // 1. click validation
  // 1) tree view
  notySvc.setTimeout(INFORMATION, 10);

  if (ctx.checklist.tableMode !== '3') {
    show(
      INFORMATION,
      '고장 추가 기능은 트리뷰로 이동해야 합니다\n이동하시겠습니까?',
      ['예', '아니오'],
      [
        function () {
          // 트리뷰로 이동
          L2_ChecklistOpenService.tableModeChanges(3);
          const listEl = document.querySelector('.checklist-draggable-false.ng-scope.ng-isolate-scope');
          const viewData = viewModelService.getViewModelUsingElement(listEl);
          viewData.tableMode.dbValue = '3';
          viewData.tableMode.dispValue = 'Tree View';
          viewData.tableMode.displayValues = ['Tree View'];
          viewData.tableMode.uiOriginalValue = 'Tree View';
          viewData.tableMode.uiValues = ['Tree View'];
          viewData.tableMode.uiValue = 'Tree View';
        },
        function () {
          return;
        },
      ],
    );
    return;
  }

  // 2) select row
  if (!ctx.checklist.selectedRow) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }

  if (ctx.checklist.selectedRow.type === 'L2_FailureRevision') {
    notySvc.showInfo('고장은 선택할 수 없습니다');
    return;
  }

  // 2. popup open
  // 2-1. 팝업 초기화
  const inputParam = {
    declView: 'L2_ChecklistAdd',
    locals: {
      caption: '추가',
      anchor: 'closePopupAnchor',
    },
    options: {
      width: 900,
      height: 850,
      isModal: false,
      clickOutsideToClose: false,
      draggable: true,
      hooks: {
        whenOpened: () => {
          ctx.checklist.addInfo = {};
          _initStructureInfo();
          _makeEditors();
        },
        whenClosed: () => {
          delete ctx.checklist.addInfo;
          eventBus.publish('awsidenav.openClose', {});
        },
      },
    },
  };
  popupService.show(inputParam);
}

// 선택한 트리노드 분석
function _initStructureInfo() {
  const data = viewModelService.getViewModelUsingElement(document.getElementById('checklistadd-popup'));
  const selectedRowInfo = _getSelectedRowInfo();

  ctx.checklist.addInfo[STRUCTURE_LEVEL_TOP] = selectedRowInfo[STRUCTURE_LEVEL_TOP];
  ctx.checklist.addInfo[STRUCTURE_LEVEL_PARENT] = selectedRowInfo[STRUCTURE_LEVEL_PARENT];
  ctx.checklist.addInfo[STRUCTURE_LEVEL_SUB] = selectedRowInfo[STRUCTURE_LEVEL_SUB];
  ctx.checklist.addInfo[STRUCTURE_LEVEL_SINGLE] = selectedRowInfo[STRUCTURE_LEVEL_SINGLE];

  if (selectedRowInfo[STRUCTURE_LEVEL_PARENT]) {
    data.parentName.dbValue = selectedRowInfo[STRUCTURE_LEVEL_PARENT].name;
  }
  if (selectedRowInfo[STRUCTURE_LEVEL_SUB]) {
    data.subName.dbValue = selectedRowInfo[STRUCTURE_LEVEL_SUB].name;
  }
  if (selectedRowInfo[STRUCTURE_LEVEL_SINGLE]) {
    data.singleItemName.dbValue = selectedRowInfo[STRUCTURE_LEVEL_SINGLE].name;
  }
}

function _getSelectedRowInfo() {
  const selectedRow = ctx.checklist.selectedRow;
  // 선택한 로우 구분 top, parent, sub, function
  if (selectedRow.type === 'L2_FunctionRevision') {
    ctx.checklist.addInfo.function = selectedRow;
    const functionContentDiv = document.querySelector('#functioncontent');
    const functionContent = _getFunctionContentByFailureNode(selectedRow);
    functionContentDiv.innerHTML = functionContent;
    ctx.checklist.addInfo.functionContent = functionContent;
    // parent에 붙은 기능인 경우
    if (!selectedRow.parent.parent.parent) {
      return {
        level: STRUCTURE_LEVEL_PARENT,
        [STRUCTURE_LEVEL_TOP]: selectedRow.parent.parent,
        [STRUCTURE_LEVEL_PARENT]: selectedRow.parent,
        [STRUCTURE_LEVEL_SUB]: null,
        [STRUCTURE_LEVEL_SINGLE]: null,
      };
    } else if (!selectedRow.parent.parent.parent.parent) {
      // sub에 붙은 기능인 경우
      return {
        level: STRUCTURE_LEVEL_SUB,
        [STRUCTURE_LEVEL_TOP]: selectedRow.parent.parent.parent,
        [STRUCTURE_LEVEL_PARENT]: selectedRow.parent.parent,
        [STRUCTURE_LEVEL_SUB]: selectedRow.parent,
        [STRUCTURE_LEVEL_SINGLE]: null,
      };
    } else {
      // 단품에 붙은 기능인 경우
      return {
        level: STRUCTURE_LEVEL_SINGLE,
        [STRUCTURE_LEVEL_TOP]: selectedRow.parent.parent.parent.parent,
        [STRUCTURE_LEVEL_PARENT]: selectedRow.parent.parent.parent,
        [STRUCTURE_LEVEL_SUB]: selectedRow.parent.parent,
        [STRUCTURE_LEVEL_SINGLE]: selectedRow.parent,
      };
    }
  }
  if (!selectedRow.parent) {
    return { level: STRUCTURE_LEVEL_TOP, [STRUCTURE_LEVEL_TOP]: selectedRow, [STRUCTURE_LEVEL_PARENT]: null, [STRUCTURE_LEVEL_SUB]: null };
  } else {
    if (!selectedRow.parent.parent) {
      // 상위임
      return { level: STRUCTURE_LEVEL_PARENT, [STRUCTURE_LEVEL_TOP]: selectedRow.parent, [STRUCTURE_LEVEL_PARENT]: selectedRow, [STRUCTURE_LEVEL_SUB]: null };
    } else {
      if (!selectedRow.parent.parent.parent) {
        return {
          level: STRUCTURE_LEVEL_SUB,
          [STRUCTURE_LEVEL_TOP]: selectedRow.parent.parent,
          [STRUCTURE_LEVEL_PARENT]: selectedRow.parent,
          [STRUCTURE_LEVEL_SUB]: selectedRow,
        };
      }
      return {
        level: STRUCTURE_LEVEL_SINGLE,
        [STRUCTURE_LEVEL_TOP]: selectedRow.parent.parent.parent,
        [STRUCTURE_LEVEL_PARENT]: selectedRow.parent.parent,
        [STRUCTURE_LEVEL_SUB]: selectedRow.parent,
        [STRUCTURE_LEVEL_SINGLE]: selectedRow,
      };
    }
  }
}

function _getFunctionContentByFailureNode(functionRow) {
  const grid = ctx.checklist.grid;
  for (const row of grid.getData()) {
    const parentRow = row.getParent();
    if (!parentRow) {
      continue;
    }
    if (functionRow.id === parentRow.id) {
      return row.function;
    }
  }
}

// 에디터들 초기화
function _makeEditors() {
  for (const EDITOR_ID of EDITOR_IDS) {
    _makeEditor(EDITOR_ID);
  }
  ctx.checklist.addInfo.initComplete = true;
}

function _makeEditor(editorId, height) {
  $(`#${editorId}`).summernote({
    lang: 'ko-KR',
    tabsize: 3,
    height: height ? height : 320,
    toolbar: [
      ['fontsize', ['fontsize']],
      ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
      ['color', ['forecolor', 'color']],
      ['para', ['ul', 'ol', 'paragraph']],
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $(`#${editorId}`).summernote('enable');
}

async function _getProductContext(product) {
  const requestParam = L2_StandardBOMService.getOccurrences3Param(product);
  const getOccurrences3Response = await soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam);

  // Occurrence
  const parentOccurrence = getOccurrences3Response.parentOccurrence;
  const parentOccurrenceId = parentOccurrence.occurrenceId;

  // Product Context
  const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);

  const topObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];
  const productContext = { uid: getOccurrences3Response.rootProductContext.uid, type: getOccurrences3Response.rootProductContext.type };
  return {
    productContext,
    parentOccurrenceId: parentOccurrenceId,
    topObject: topObject,
  };
}
// 라인 추가
async function okAction(data) {
  data.disabledButtonChk.dbValue = true;
  notySvc.setTimeout(INFORMATION, 300);
  try {
    // validation - 기능과 고장은 값이 있어야 함
    const validationCheckEditorIds = ['function', 'failureMode'];
    for (const id of validationCheckEditorIds) {
      const value = $(`#${id}`).summernote('code');
      if (value === '<p><br></p>') {
        notySvc.showInfo('기능/고장모드 속성은 필수 입력 값입니다');
        data.disabledButtonChk.dbValue = false;
        return;
      }
    }
    if (!ctx.checklist.addInfo[STRUCTURE_LEVEL_PARENT] && !data.parentNameTextbox.dbValues[0]) {
      data.disabledButtonChk.dbValue = false;
      notySvc.showInfo('상위 Assy는 등록해야 합니다');
      return;
    }
    show(INFORMATION, '생성중입니다\n잠시 기다려주세요');

    const product = {
      uid: ctx.checklist.addInfo[STRUCTURE_LEVEL_TOP].getOriginalObject().uid,
      type: 'L2_StructureRevision',
    };

    const productContextInfo = await _getProductContext(product);
    const productContext = productContextInfo.productContext;
    await saveUserWorkingContextState2(productContextInfo.topObject.uid);

    // 2. 구조 생성
    let parentAssy;
    let subAssy;
    let singleItem;

    if (ctx.checklist.addInfo[STRUCTURE_LEVEL_PARENT]) {
      const tempParentAssyUid = ctx.checklist.addInfo[STRUCTURE_LEVEL_PARENT].getOriginalObject().uid;
      for (const parentAssyNode of productContextInfo.topObject._children) {
        if (tempParentAssyUid === parentAssyNode.props.awb0Archetype.dbValues[0]) {
          parentAssy = parentAssyNode;
        }
      }
    } else {
      const newParentAssy = await lgepObjectUtils.createItem('', 'L2_Structure', data.parentNameTextbox.dbValues[0]);
      parentAssy = await addLine(newParentAssy.output[0].itemRev, productContextInfo.topObject, productContext);
      await saveViewModelEditAndSubmitWorkflow2ForIsSelected(parentAssy);
    }

    if (ctx.checklist.addInfo[STRUCTURE_LEVEL_SUB]) {
      const tempSubAssyUid = ctx.checklist.addInfo[STRUCTURE_LEVEL_SUB].getOriginalObject().uid;
      for (const subAssyNode of parentAssy._children) {
        if (tempSubAssyUid === subAssyNode.props.awb0Archetype.dbValues[0]) {
          subAssy = subAssyNode;
        }
      }
    } else {
      const newName = data.subNameTextbox.dbValues[0];
      if (newName) {
        const newSubAssy = await lgepObjectUtils.createItem('', 'L2_Structure', newName);
        subAssy = await addLine(newSubAssy.output[0].itemRev, parentAssy, productContext);
        await saveViewModelEditAndSubmitWorkflow2ForIsSelected(subAssy);
      }
    }

    if (ctx.checklist.addInfo[STRUCTURE_LEVEL_SINGLE]) {
      const tempSingleItemUid = ctx.checklist.addInfo[STRUCTURE_LEVEL_SINGLE].getOriginalObject().uid;
      for (const singleNode of subAssy._children) {
        if (tempSingleItemUid === singleNode.props.awb0Archetype.dbValues[0]) {
          subAssy = singleNode;
        }
      }
    } else {
      const newName = data.singleItemNameTextbox.dbValues[0];
      if (newName) {
        const newSingleItem = await lgepObjectUtils.createItem('', 'L2_Structure', newName);
        singleItem = await addLine(newSingleItem.output[0].itemRev, subAssy, productContext);
        await saveViewModelEditAndSubmitWorkflow2ForIsSelected(singleItem);
      }
    }

    // 1. 값 가져와서 properties 생성
    let properties = {};
    for (const EDITOR_ID of EDITOR_IDS) {
      const value = $(`#${EDITOR_ID}`).summernote('code');
      properties[EDITOR_ID] = value;
    }

    // 3. 기능 생성
    let functionNode;
    if (ctx.checklist.addInfo.function) {
      const tempFunctionUid = ctx.checklist.addInfo.function.getOriginalObject().uid;
      for (const tempFnNode of subAssy._children) {
        if (tempFunctionUid === tempFnNode.props.awb0Archetype.dbValues[0]) {
          functionNode = tempFnNode;
        }
      }
    } else {
      const newFunctionModel = await lgepObjectUtils.createItem('', 'L2_Function');
      // 3-2. 기능 setProperty
      lgepObjectUtils.setProperty(newFunctionModel.output[0].itemRev, 'l2_function', _removeTagInStr(properties['function']));
      const addParentNode = singleItem ? singleItem : subAssy ? subAssy : parentAssy;
      functionNode = await addLine(newFunctionModel.output[0].itemRev, addParentNode, productContext);
      await saveViewModelEditAndSubmitWorkflow2ForIsSelected(functionNode);
    }

    // // 4. 고장 생성
    const newFailureModel = await lgepObjectUtils.createItem('', 'L2_Failure');
    const failureRev = newFailureModel.output[0].itemRev;
    const failureItem = newFailureModel.output[0].item;
    await lgepObjectUtils.getProperties(failureItem, 'item_id');
    // 4-2. 고장 setProperty
    lgepObjectUtils.setProperty(failureRev, 'l2_failure_mode', _removeTagInStr(properties['failureMode']));
    const failureNode = await addLine(failureRev, functionNode, productContext);
    await saveViewModelEditAndSubmitWorkflow2ForIsSelected(failureNode);

    // 5. SOD
    // saveViewModelEditAndSubmitWorkflow2ForSod(failureNode, data);

    // 7. dataset 고장에 add
    const txtDataset = await _stringToDataset(failureItem.props.item_id.dbValues[0], JSON.stringify(properties));
    await saveViewModelEditAndSubmitWorkflow2([failureNode], ['l2_reference_dataset'], [txtDataset.uid]);

    // 7-2. IMAN_Refrence
    lgepObjectUtils.addChildren(ctx.checklist.target, [txtDataset], 'IMAN_reference');

    // 8. 팝업 닫고 체크리스트 리프레시
    show(INFORMATION, '추가 완료되었습니다.');
    popupService.hide();
    L2_ChecklistOpenService.loadAndRefreshOpenGrid();
  } catch (err) {
    data.disabledButtonChk.dbValue = false;
    console.log('err', err);
  }
}

export function saveViewModelEditAndSubmitWorkflow2ForSod(vmo, data) {
  const { l2Severity, l2Occurence, l2Detection } = data;
  const srcObjLsd = dateTo_GMTString(new Date());
  const requestParam = {
    inputs: [],
  };
  let input = {
    obj: {
      uid: vmo.uid,
      type: vmo.type,
    },
    viewModelProperties: [],
    isPessimisticLock: false,
    workflowData: {},
  };
  let viewModelProperties = [
    {
      propertyName: 'l2_ref_severity',
      dbValues: [l2Severity.dbValue],
      uiValues: [l2Severity.dbValue],
      intermediateObjectUids: [],
      srcObjLsd: srcObjLsd,
      isModifiable: true,
    },
    {
      propertyName: 'l2_ref_occurence',
      dbValues: [l2Occurence.dbValue],
      uiValues: [l2Occurence.dbValue],
      intermediateObjectUids: [],
      srcObjLsd: srcObjLsd,
      isModifiable: true,
    },
    {
      propertyName: 'l2_ref_detection',
      dbValues: [l2Detection.dbValue],
      uiValues: [l2Detection.dbValue],
      intermediateObjectUids: [],
      srcObjLsd: srcObjLsd,
      isModifiable: true,
    },
  ];
  input.viewModelProperties = viewModelProperties;
  requestParam.inputs.push(input);
  return soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', requestParam);
}

export function saveViewModelEditAndSubmitWorkflow2ForIsSelected(vmo) {
  const requestParam = {
    inputs: [],
  };
  let input = {
    obj: {
      uid: vmo.uid,
      type: vmo.type,
    },
    viewModelProperties: [],
    isPessimisticLock: false,
    workflowData: {},
  };
  let viewModelProperty = {
    propertyName: 'l2_is_selected',
    dbValues: ['Y'],
    uiValues: ['Yes'],
    intermediateObjectUids: [],
    srcObjLsd: dateTo_GMTString(new Date()),
    isModifiable: true,
  };
  input.viewModelProperties.push(viewModelProperty);
  requestParam.inputs.push(input);
  return soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', requestParam);
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

async function addLine(newItemRevision, selectedStructureBOMLine, productContext) {
  try {
    // 봄라인 추가
    let requestParam = {
      input: {
        addObjectIntent: '',
        fetchPagedOccurrences: true,
        inputCtxt: {
          changeContext: {
            uid: 'AAAAAAAAAAAAAA',
            type: 'unknownType',
          },
          configuration: {
            effectivityDate: '',
            effectivityRanges: [],
            endItem: {
              uid: 'AAAAAAAAAAAAAA',
              type: 'unknownType',
            },
            now: false,
            revisionRule: {
              uid: 'AAAAAAAAAAAAAA',
              type: 'unknownType',
            },
            svrOwningProduct: {
              uid: 'AAAAAAAAAAAAAA',
              type: 'unknownType',
            },
            unitNo: 0,
            variantRule: {
              uid: 'AAAAAAAAAAAAAA',
              type: 'unknownType',
            },
          },
          pageSize: 0,
          productContext: productContext,
          requestPref: {},
        },
        objectsToBeAdded: [
          {
            uid: newItemRevision.uid,
            type: 'L2_StructureRevision',
          },
        ],
        numberOfElements: 1,
        parentElement: {
          type: 'Awb0DesignElement',
          uid: selectedStructureBOMLine.uid,
        },
        requestPref: {
          displayMode: ['Tree'],
        },
        siblingElement: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        sortCriteria: {
          propertyName: '',
          sortingOrder: '',
        },
      },
    };
    // 봄 라인 추가
    const addResult = await soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'addObject2', requestParam);
    const newBomLine = addResult.selectedNewElementInfo.newElements[0];
    return newBomLine;
  } catch (err) {
    console.log('err', err);
  }
}

function _removeTagInStr(value) {
  let replaceSpace = value.replaceAll('<p>', ' ');
  let nonTagValue = replaceSpace.replaceAll(/[<][^>]*[>]/gi, '');
  // 그 외 예외처리
  let replaceValue = nonTagValue.replaceAll('&nbsp;', ' ');
  return replaceValue;
}

function openStructure(structureLv) {
  ctx.checklist.addInfo.structureLv = structureLv;
  const panelData = {
    id: 'checklist_addStructure',
    includeView: 'L2_StructureAdd',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_addStructure',
    config: {
      width: 'STANDARD',
    },
  };
  eventBus.publish('awsidenav.openClose', panelData);
}

function addStructure(data) {
  const structureName = data.nameBox.dbValues[0];
  const viewData = viewModelService.getViewModelUsingElement(document.getElementById('checklistadd-popup'));
  const newStructures = ctx.checklist.addInfo.newStructures ? ctx.checklist.addInfo.newStructures : [];
  if (ctx.checklist.addInfo.structureLv === STRUCTURE_LEVEL_PARENT) {
    viewData.parentName.dbValue = structureName;
    ctx.checklist.addInfo.newStructures = [...newStructures, { level: STRUCTURE_LEVEL_PARENT, name: structureName }];
  } else {
    viewData.subName.dbValue = structureName;
    ctx.checklist.addInfo.newStructures = [...newStructures, { level: STRUCTURE_LEVEL_SUB, name: structureName }];
  }

  eventBus.publish('awsidenav.openClose', {});
}

function unMountStructurePanel() {}

export default exports = {
  addChecklistFailure,
  okAction,
  openStructure,
  addStructure,
  unMountStructurePanel,
};

app.factory('lgepChecklistMainService', () => exports);
