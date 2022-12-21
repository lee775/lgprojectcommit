import app from 'app';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import eventBus from 'js/eventBus';
import awTableStateService from 'js/awTableStateService';
import soaService from 'soa/kernel/soaService';
import viewModelService from 'js/viewModelService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import viewModelObjectService from 'js/viewModelObjectService';
import awTableService from 'js/awTableService';
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
  const selectedStructureBOMLine = ctx.checklist.standardBOM.selectBomTreeNode;
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
        // await _getDeleteItemByType(selectedStructureBOMLine);
        // await _deleteItems();
        delete ctx.checklist.standardBOM.selectBomTreeNode;
        delete ctx.checklist.standardBOM.selectBomTreeNode;
        delete ctx.checklist.standardBOM.selectBomTreeNodeType;
        const existNodes = ctx.checklist.standardBOM.deleteNodes ? ctx.checklist.standardBOM.deleteNodes : [];
        ctx.checklist.standardBOM.deleteNodes = [...existNodes, selectedStructureBOMLine];
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
        productContextInfo: ctx.checklist.standardBOM.currentProductContext,
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
  const isChecklistTarget = data.isChecklistTarget.dbValue ? 'Y' : 'N';
  if (!structureName) {
    notySvc.showInfo('모듈명을 입력해주세요');
    return;
  }

  data.disabledButtonChk.dbValue = true;

  const tepElement = ctx.checklist.standardBOM.templateNode;
  const createObject = await _createItem('L2_Structure', structureName);
  const newItemRevision = createObject.output[0].itemRev;
  const newItem = createObject.output[0].item;
  // 체크리스트 대상, 모듈명
  await lgepObjectUtils.setProperties(newItem, ['l2_is_checklist_target', 'l2_module_name'], [isChecklistTarget, structureName]);
  await _addLine(newItemRevision, tepElement, ctx.checklist.standardBOM.templateProductContext);

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
  if (!parentNode) {
    console.log('_addLine parentNode null');
    return;
  }
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
    const newBomLine = addResult.selectedNewElementInfo.newElements ? addResult.selectedNewElementInfo.newElements[0] : null;
    ctx.checklist.standardBOM.newBomLine = newBomLine;
    let item = lgepObjectUtils.getObject(newItemRevision.props.items_tag.dbValues[0]);
    if (item && item.props && item.props.item_id) {
      newBomLine.props.awb0ArchetypeId = { dbValues: [item.props.item_id.dbValues[0]] };
    }
    return newBomLine;
  } catch (err) {
    console.log('err', err);
  }
}

// 템플릿의 모듈 제거
function removeModuleAssy() {
  notySvc.setTimeout(lgepMessagingUtils.INFO, 100);
  const selectedStructureBOMLine = ctx.checklist.standardBOM.selectBomTreeNode;
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
              productContextInfo: ctx.checklist.standardBOM.templateProductContext,
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

function _check4Level(node) {
  try {
    if (node.parentNode.parentNode.parentNode) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}
// 모듈에 구조 추가
async function addStructureSave(data) {
  const structureName = data.structureNameText.dbValues[0];
  if (!structureName) {
    notySvc.showInfo('구조명을 입력해주세요');
    return;
  }
  // 4레벨 이상은 xxx,
  const parentNode = ctx.checklist.standardBOM.selectBomTreeNode;
  if (_check4Level(parentNode)) {
    notySvc.showInfo('구조는 3레벨까지만 등록 가능합니다');
    return;
  }
  let view = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
  if (view.dataProviders.standardBOMTreeDetailDataProvider.selectedObjects.length == 0) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }

  data.disabledButtonChk.dbValue = true;

  const createObject = await _createItem('L2_Structure', structureName);
  const newItemRevision = createObject.output[0].itemRev;
  let newObject = await _addLine(newItemRevision, parentNode, ctx.checklist.standardBOM.currentProductContext);
  let index = Object.values(view.dataProviders)[0]
    .viewModelCollection.loadedVMObjects.map((e) => e.uid)
    .indexOf(parentNode.uid);
  let failureTreeNode = createTreeNode(newObject, parentNode);
  childCount = 0;
  getChildrenCountRecursively(parentNode);
  arrayInsertAt(Object.values(view.dataProviders)[0].viewModelCollection.loadedVMObjects, index + childCount + 1, failureTreeNode);
  parentNode.children.push(failureTreeNode);
  // onMount();

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
  const productContext = ctx.checklist.standardBOM.currentProductContext;
  notySvc.setTimeout(lgepMessagingUtils.INFO, 100);

  const selectedStructureBOMLine = ctx.checklist.standardBOM.selectBomTreeNode;
  if (!selectedStructureBOMLine) {
    notySvc.showInfo('로우를 선택해주세요');
    return;
  }
  if (createType === 'L2_Function') {
    // 모듈에는 기능 추가 할 수 없음
    if (ctx.checklist.standardBOM.currentDetailObject.uid === selectedStructureBOMLine.props.awb0Archetype.dbValues[0]) {
      notySvc.showInfo('모듈에는 기능을 추가할 수 없습니다');
      return;
    }
  }
  ctx.checklist.standardBOM.moduleSaving = true;
  const newItemName = _getName(createType);
  const newObjectModel = await _createItem(createType, newItemName);
  const newItemRevision = newObjectModel.output[0].itemRev;
  await _setProperties(createType, newItemRevision, newItemName);
  const addLineNode = await _addLine(newItemRevision, selectedStructureBOMLine, productContext);
  let view = viewModelService.getViewModelUsingElement(document.getElementById('standardBOMTreeDetail'));
  let index = Object.values(view.dataProviders)[0]
    .viewModelCollection.loadedVMObjects.map((e) => e.uid)
    .indexOf(selectedStructureBOMLine.uid);
  let addLineTreeNode = createTreeNode(addLineNode, selectedStructureBOMLine);
  childCount = 0;
  getChildrenCountRecursively(selectedStructureBOMLine);
  let result = index + childCount + 1;
  arrayInsertAt(Object.values(view.dataProviders)[0].viewModelCollection.loadedVMObjects, result, addLineTreeNode);
  selectedStructureBOMLine.children.push(addLineTreeNode);

  // 기능을 생성한 경우 고장도 같이 생성 해야 한다.
  if (createType === 'L2_Function') {
    const newItemName = _getName('L2_Failure');
    const newObjectModel = await _createItem('L2_Failure', newItemName);
    const newItemRevision = newObjectModel.output[0].itemRev;
    await _setProperties('L2_Failure', newItemRevision, newItemName);
    let failureObject = await _addLine(newItemRevision, addLineTreeNode, productContext);
    addLineTreeNode.isExpanded = true;
    let failureTreeNode = createTreeNode(failureObject, addLineTreeNode);
    arrayInsertAt(Object.values(view.dataProviders)[0].viewModelCollection.loadedVMObjects, result + 1, failureTreeNode);
    addLineTreeNode.children.push(failureTreeNode);

    if (!addLineTreeNode.failureChildren) addLineTreeNode.failureChildren = [];
    addLineTreeNode.failureChildren.push(failureTreeNode);
  }

  ctx.checklist.standardBOM.moduleSaving = false;
}

let childCount = 0;
function getChildrenCountRecursively(node) {
  if (node.children) {
    childCount += node.children.length;
    for (const child of node.children) {
      getChildrenCountRecursively(child);
    }
  }
}

async function _setProperties(createType, newItemRevision, newItemName) {
  const propName = createType === 'L2_Function' ? 'l2_function' : 'l2_failure_mode';
  await lgepObjectUtils.setProperties(newItemRevision, [propName], [newItemName]);
}

function createTreeNode(modelObject, parentNode) {
  let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(modelObject);
  let treeVmoChild = awTableService.createViewModelTreeNode(
    vmoChild.uid,
    vmoChild.type,
    vmoChild.props.object_string.dbValues[0],
    parentNode.levelNdx + 1,
    parentNode.levelNdx + 2,
    vmoChild.typeIconURL,
  );
  treeVmoChild.parentNode = parentNode;
  treeVmoChild.props = vmoChild.props;
  treeVmoChild.originalObject = modelObject;
  treeVmoChild.alternateID = treeVmoChild.uid + ',' + parentNode.alternateID;
  treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
  treeVmoChild.isLeaf = true;
  if (parentNode && !parentNode.children) {
    parentNode.children = [];
  }

  if (!parentNode.numberOfChildren) {
    parentNode.numberOfChildren = 1;
  } else {
    parentNode.numberOfChildren += 1;
  }
  if (parentNode.numberOfChildren && parentNode.numberOfChildren > 0) {
    parentNode.isLeaf = false;
  } else {
    parentNode.isLeaf = true;
  }
  return treeVmoChild;
}

function arrayInsertAt(destArray, pos, arrayToInsert) {
  var args = [];
  args.push(pos); // where to insert
  args.push(0); // nothing to remove
  args = args.concat(arrayToInsert); // add on array to insert
  destArray.splice.apply(destArray, args); // splice it in
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
