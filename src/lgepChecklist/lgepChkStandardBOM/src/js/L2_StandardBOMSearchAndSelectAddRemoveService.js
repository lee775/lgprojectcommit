import app from 'app';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import eventBus from 'js/eventBus';
import awTableStateService from 'js/awTableStateService';
import soaService from 'soa/kernel/soaService';
import viewModelService from 'js/viewModelService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import { onMount } from 'js/L2_StandardBOMSearchDetailService';

let exports;

let structures = [];
let functions = [];
let failures = [];

// 구조 패널 고정
function pinPanel() {
  ctx.checklist.standardBOM.isPin = true;
}

// 구조 패널 고정 해제
function unPinPanel() {
  ctx.checklist.standardBOM.isPin = false;
}

// 모듈 내의 구조/기능/고장 삭제
async function removeStandardBom(data, ctx) {
  const selectedStructureBOMLine = ctx.checklist.standardBOM.bomTreeSelection;
  if (!selectedStructureBOMLine) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }

  // TODO :: 체크리스트에 연결된적 없는것만 삭제 가능
  lgepMessagingUtils.show(
    lgepMessagingUtils.INFORMATION,
    '제거 하시겠습니까?',
    ['예', '아니오'],
    [
      async function () {
        await _removeNodes(selectedStructureBOMLine);
        await _getDeleteItemByType(selectedStructureBOMLine);
        await _deleteItems();
        delete ctx.checklist.standardBOM.bomTreeSelection;
        delete ctx.checklist.standardBOM.selectBomTreeNode;
        delete ctx.checklist.standardBOM.selectBomTreeNodeType;
        ctx.checklist.standardBOM.deleteNode = selectedStructureBOMLine;
      },
      function () {
        return;
      },
    ],
  );
}

async function _removeNodes(selectedStructureBOMLine) {
  const requestParam = {
    input: [
      {
        element: {
          type: 'Awb0DesignElement',
          uid: selectedStructureBOMLine.uid,
        },
        productContextInfo: ctx.checklist.standardBOM.productContext,
      },
    ],
  };
  await soaService.post('Internal-ActiveWorkspaceBom-2021-12-OccurrenceManagement', 'removeElements2', requestParam);
}

async function _getDeleteItemByType(node) {
  try {
    if (node.children && node.children.length !== 0) {
      for (const childNode of node.children) {
        await _getDeleteItemByType(childNode);
      }
    } else {
      const rev = lgepObjectUtils.getObject(node.props.awb0Archetype.dbValues[0]);
      const item = await lgepObjectUtils.getItemByItemRevision(rev);
      if (item.type === 'L2_Structure') {
        structures.push(item);
      } else if (item.type === 'L2_Function') {
        functions.push(item);
      } else if (item.type === 'L2_Failure') {
        failures.push(item);
      }
    }
  } catch (err) {
    console.log('_getDeleteItemByType err');
  }
}

async function _deleteItems() {
  try {
    for (const item of structures) {
      await lgepObjectUtils.deleteObject(item);
    }
    for (const item of functions) {
      await lgepObjectUtils.deleteObject(item);
    }
    for (const item of failures) {
      await lgepObjectUtils.deleteObject(item);
    }
  } catch (err) {
    console.log('deleteItems err', err);
  }
}

// 모듈/구조 추가 패널 오픈
function openStructurePanel(includeView) {
  if (includeView === 'L2_ModuleAdd') {
    ctx.checklist.standardBOM.isTopEditing = true;
  }
  const panelData = {
    id: 'checklist_createStructure',
    includeView,
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_createStructure',
    config: {
      width: 'STANDARD',
      height: 'LARGE',
    },
  };
  eventBus.publish('awsidenav.openClose', panelData);
}

// 템플릿에 모듈 추가
async function addModuleAssy(data) {
  const structureName = data.structureNameText.dbValues[0];
  const isChecklistTarget = data.isChecklistTarget.dbValue;
  if (!structureName) {
    notySvc.showInfo('모듈명을 입력해주세요');
    return;
  }

  data.disabledButtonChk.dbValue = true;

  const tepElement = ctx.checklist.standardBOM.topElement;
  const createObject = await _createItem('L2_Structure', structureName);
  const newItemRevision = createObject.output[0].itemRev;
  const newItem = createObject.output[0].item;
  // 체크리스트 대상, 모듈명
  await lgepObjectUtils.setProperties(newItem, ['l2_is_checklist_target', 'l2_module_name'], [isChecklistTarget, structureName]);
  await _addLine(newItemRevision, tepElement, ctx.checklist.standardBOM.productContext);

  ctx.checklist.standardBOM.isFirstBomTreeLoad = true;
  eventBus.publish('standardBOMTree.plTable.reload');
  delete ctx.checklist.standardBOM.isTopEditing;
  eventBus.publish('awsidenav.openClose', {});
}

async function _createItem(createType, newItemName) {
  const createObject = await lgepObjectUtils.createItem('', createType, newItemName);
  return createObject;
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

async function _addLine(newItemRevision, parentNode, productContext) {
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
          uid: parentNode.uid,
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
    const addResult = await soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'addObject2', requestParam);
    const newBomLine = addResult.selectedNewElementInfo.newElements[0];
    ctx.checklist.standardBOM.newBomLine = newBomLine;
    return newBomLine;
  } catch (err) {
    console.log('err', err);
  }
}

// 템플릿의 모듈 제거
function removeModuleAssy() {
  notySvc.setTimeout(lgepMessagingUtils.INFORMATION, 100);
  const selectedStructureBOMLine = ctx.checklist.standardBOM.bomTreeSelection;
  if (!selectedStructureBOMLine) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }

  lgepMessagingUtils.show(
    lgepMessagingUtils.INFORMATION,
    '제거 하시겠습니까?',
    ['예', '아니오'],
    [
      async function () {
        const requestParam = {
          input: [
            {
              element: {
                type: 'Awb0DesignElement',
                uid: selectedStructureBOMLine.uid,
              },
              productContextInfo: ctx.checklist.standardBOM.productContext,
            },
          ],
        };
        await soaService.post('Internal-ActiveWorkspaceBom-2021-12-OccurrenceManagement', 'removeElements2', requestParam);
      },
      function () {
        return;
      },
    ],
  );
}

// 모듈에 구조 추가
async function addStructureSave(data) {
  const structureName = data.structureNameText.dbValues[0];
  if (!structureName) {
    notySvc.showInfo('구조명을 입력해주세요');
    return;
  }

  data.disabledButtonChk.dbValue = true;

  const parentNode = ctx.checklist.standardBOM.bomTreeSelection;
  const createObject = await _createItem('L2_Structure', structureName);
  const newItemRevision = createObject.output[0].itemRev;
  await _addLine(newItemRevision, parentNode, ctx.checklist.standardBOM.productContext);

  onMount();

  if (!ctx.checklist.standardBOM.isPin) {
    eventBus.publish('awsidenav.openClose', {});
  }
  data.structureNameText.dbValues = [];
  data.structureNameText.dbValue = '';
  data.structureNameText.uiValue = '';
  data.disabledButtonChk.dbValue = false;
}

function unmountModulePanel() {
  delete ctx.checklist.standardBOM.isTopEditing;
}

// 기능, 고장 추가
async function addStandardBom(data, ctx, createType) {
  const productContext = ctx.checklist.standardBOM.editmode.occurrenceInfo.productContext;
  notySvc.setTimeout(lgepMessagingUtils.INFORMATION, 100);
  const selectedStructureBOMLine = ctx.checklist.standardBOM.bomTreeSelection;
  const selectNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!selectedStructureBOMLine) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }
  ctx.checklist.standardBOM.moduleSaving = true;
  // 1. 아이템 생성 후
  const newItemName = _getName(createType);
  const newObjectModel = await _createItem(createType, newItemName);
  const newItemRevision = newObjectModel.output[0].itemRev;
  await _setProperties(createType, newItemRevision, newItemName);
  const addLineNode = await _addLine(newItemRevision, selectedStructureBOMLine, productContext);

  // 기능을 생성한 경우 고장도 같이 생성 해야 한다.
  if (createType === 'L2_Function') {
    const newItemName = _getName('L2_Failure');
    const newObjectModel = await _createItem('L2_Failure', newItemName);
    const newItemRevision = newObjectModel.output[0].itemRev;
    await _setProperties('L2_Failure', newItemRevision, newItemName);
    await _addLine(newItemRevision, addLineNode, productContext);
  }

  onMount();
  ctx.checklist.standardBOM.moduleSaving = false;
}

async function _setProperties(createType, newItemRevision, newItemName) {
  const propName = createType === 'L2_Function' ? 'l2_function' : 'l2_failure_mode';
  await lgepObjectUtils.setProperties(newItemRevision, [propName], [newItemName]);
}

export default exports = {
  pinPanel,
  unPinPanel,
  removeStandardBom,
  openStructurePanel,
  removeModuleAssy,
  addModuleAssy,
  addStructureSave,
  unmountModulePanel,
  addStandardBom,
};

/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectAddRemoveService
 */
app.factory('L2_StandardBOMSearchAndSelectAddRemoveService', () => exports);
