/**
 * Checklist Create Service
 *
 * @module js/L2_ChecklistCreateService
 */

import app from 'app';
import awTableService from 'js/awTableService';
import awTableStateService from 'js/awTableStateService';
import browserUtils from 'js/browserUtils';
import eventBus from 'js/eventBus';
import lgepMessagingUtils, { INFORMATION } from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import logger from 'js/logger';
import popupService from 'js/popupService';
import soaService from 'soa/kernel/soaService';
import viewModelObjectService from 'js/viewModelObjectService';
import _ from 'lodash';
import vms from 'js/viewModelService';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import L2_StandardBOMPropertyPolicyService from 'js/L2_StandardBOMPropertyPolicyService';
import L2_ChecklistMainService from 'js/L2_ChecklistMainService';
import { checkSave } from 'js/L2_InteractionMatrixAddService';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import viewModelService from 'js/viewModelService';
import appCtxService from 'js/appCtxService';
import { removeTagInStr } from 'js/L2_ChecklistMasterEditService';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import uwPropertySvc from 'js/uwPropertyService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import checklistUtils from 'js/utils/checklistUtils';

let exports = {};

let selectedTemplateItemRevision;
let selectedStructureItemRevision;

let topItem;
let topItemRevision;
let topTreeNode;

let deleteFlag = true;

let product = {};
let productContext = {};

let _data;
let _dataProvider;
let _scope;
let _gridid = 'checklistCreateTree';

/**
 * Deprecated : ViewModelTreeNode를 불러오는 방법이 load/initialize로 세분화(변경)됨에 따라,
 * 이전 Load Action을 Deprecated 처리함.
 * @param {*} ctx
 * @param {*} data
 * @returns
 */
export async function _loadChecklistCreateTree(ctx, data) {
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
    await soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'saveUserWorkingContextState2', inContextParam);

    const getTableViewModelPropertiesResponse = await L2_StandardBOMService.getTableViewModelProperties([parentOccurrenceId]);

    const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[parentOccurrenceId];
    modelObject.numberOfChildren = parentOccurrenceNumberOfChildren;
    modelObjects.push(modelObject);
  }

  return modelObjects;
}

/**
 * Deprecated..? : TreeLoadResult에서 호출되고 있으나, 사용 용도가 애매하여 사용하지 않아도 되는 것으로 보임.
 * 그러나 혹시 몰라 섣불리 지우지 않음.
 * @param {*} modelObjects
 * @param {*} nodeBeingExpanded
 * @returns
 */
export async function loadChecklistCreateTreeData(modelObjects, nodeBeingExpanded) {
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

    console.log('treeNode', treeNode);

    treeNodes.push(treeNode);
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

/**
 * 체크리스트 생성 화면에서 선택 후, 확인 버튼을 누른 뒤 오퍼레이션
 * 선택한 객체를 기준으로 해당 스크립트 내에서의 전역 변수인 selectionList를 통해, 어떤 객체가 선택되었는지를 확인할 수 있다.
 * @param {*} ctx
 * @param {*} data
 * @returns
 */
export async function okAction(ctx, data) {
  //혹시 메시지박스가 출력되고 있을지 모르니 없앰.
  eventBus.publish('removeMessages');

  //전역변수인 selectionList로부터 고장 리비전(L2_FailureRevison)이면서도 선택된 객체를 필터링한다.
  let failureList = selectionList.filter(
    (e) =>
      lgepObjectUtils.getObject(lgepObjectUtils.getObject(e.uid).props.awb0UnderlyingObject.dbValues[0]).type == 'L2_FailureRevision' && e.selected == true,
  );
  // 고장 리비전이 없는 경우, 선택하도록 유도한다.
  if (failureList.length == 0) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, '체크리스트 생성을 위해서는 고장 열을 하나 이상 체크하셔야 합니다.');
    return;
  }
  // 특정 타입만 조회하도록 설정되어 있는 경우, 그 객체를 불러오지 않도록 처리한다.
  await setIncludeTypes(ctx, data);

  //메시지를 통해서, 불러온 고장의 개수를 확인시켜주고 실제로 진행할 것인지를 묻는다.
  lgepMessagingUtils.show(
    lgepMessagingUtils.INFORMATION,
    '선택된 고장 열은 총 ' + failureList.length + '개 입니다.\n체크리스트를 생성하시겠습니까?',
    ['YES', 'NO'],
    [
      async () => {
        // 버튼 비활성화
        data.disabledButtonChk.dbValue = true;
        // 선택한 객체를 SAVE AS 를 통해 복사한 뒤, BOM 을 열어준다.
        let objectName = topItemRevision.props.object_name.dbValues[0];
        const saveAsNewItemResponse = await L2_StandardBOMService.saveAsNewItem(topItemRevision, objectName);
        topItem = saveAsNewItemResponse.item;
        topItemRevision = saveAsNewItemResponse.itemRev;
        const saveAsBomLines = await L2_StandardBOMService.expandBySaveAsBom(
          topItemRevision,
          _dataProvider,
          lgepObjectUtils.createPolicies(checklistUtils.checklistProperties, [
            'L2_FunctionRevision',
            'L2_FailureRevision',
            'L2_Structure',
            'L2_StructureRevision',
            'Awb0DesignElement',
          ]),
        );

        try {
          const productId = data.productIdTextBox.uiValue;
          const projectId = data.projectIdTextBox.uiValue;

          let inputs = [];
          // 체크리스트 속성 업데이트
          await lgepObjectUtils.setProperties(
            topItem,
            [standardBOMConstants.l2_is_checklist, standardBOMConstants.l2_is_template, standardBOMConstants.l2_product_id],
            ['Y', '', productId],
          );
          await lgepObjectUtils.setProperty(topItemRevision, standardBOMConstants.l2_current_project, projectId);
          // TOP 객체로부터 등록된 DATASET의 리스트를 반환받는다.
          let saveAsDatasets = await L2_StandardBOMService.getRefrenceDatasets(topItemRevision);

          //dpData는 Interaction Matrix의 체크 여부를 저장하고 있는 변수이다.
          let dpData = appCtxService.ctx.checklist.dpData;
          for (let i = 0; i < selectionList.length; i++) {
            if (i == 0) continue; //0번째는 TOP이므로 Skip한다.

            //bomLine은 현재 로드되어있는 ViewModelTreeNode를 의미한다
            let bomLine = _dataProvider.viewModelCollection.loadedVMObjects[i];
            //original은 전역변수 selectionList에서 가져온 값을 의미하는데, selectionList는 TreeTable의 체크 Y/N 을 저장한 값의 배열이다.
            let original = selectionList[i];

            let newBomLine = saveAsBomLines.filter((e) => e.props.awb0UnderlyingObject.dbValues[0] == bomLine.props.awb0UnderlyingObject.dbValues[0])[0];
            let dpDataRow = [];
            if (dpData) dpDataRow = dpData.filter((e) => e.uid == bomLine.uid);

            let input = {
              obj: {
                uid: newBomLine.uid,
                type: 'Awb0DesignElement',
              },
              // 체크한 대상의 l2_is_selected 속성을 Y (displayValue: Yes) 혹은 N으로 설정
              viewModelProperties: [
                {
                  propertyName: 'l2_is_selected',
                  dbValues: [original.selected ? 'Y' : 'N'],
                  uiValues: [original.selected ? 'Yes' : 'No'],
                  intermediateObjectUids: [],
                  srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
                  isModifiable: true,
                },
              ],
              isPessimisticLock: false,
              workflowData: {},
            };
            // 인터랙션 매트릭스 대상으로 체크된 객체도 마찬가지로 Y/N 설정
            if (dpDataRow.length > 0 && dpDataRow[0].interactionCheck) {
              input.viewModelProperties.push({
                propertyName: 'l2_is_IM_target',
                dbValues: [dpDataRow[0].interactionCheck == 'Y' ? 'Y' : 'N'],
                uiValues: [dpDataRow[0].interactionCheck == 'Y' ? 'Yes' : 'No'],
                intermediateObjectUids: [],
                srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
                isModifiable: true,
              });
            }
            // 참조 데이터셋이 있는 경우 (데이터셋의 이름과 현재 객체의 ITEM ID가 같은 경우.) 해당 UID를 입력시켜준다.
            if (saveAsDatasets && saveAsDatasets.length > 0) {
              for (const saveAsDataset of saveAsDatasets) {
                let datasetName = saveAsDataset.props.object_name.dbValues[0];
                let itemId = bomLine.props.awb0ArchetypeId.dbValues[0];
                if (datasetName == itemId) {
                  input.viewModelProperties.push({
                    propertyName: 'l2_reference_dataset',
                    dbValues: [saveAsDataset.uid],
                    uiValues: [saveAsDataset.uid],
                    intermediateObjectUids: [],
                    srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
                    isModifiable: true,
                  });
                  break;
                }
              }
            }
            inputs.push(input);
          }
          const saveViewModelEditAndSubmitWorkflow2Param2 = {
            inputs: inputs,
          };
          await soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', saveViewModelEditAndSubmitWorkflow2Param2);

          // 다쓰고나서 CTX에 넣었던 값 Delete 처리
          delete appCtxService.ctx.checklist.created;
          delete appCtxService.ctx.checklist.dpData;

          // 인터랙션 매트릭스 대상 정보 저장 => 위의 saveViewModelEditAndSubmitWorkflow2로 합침으로써 주석 처리
          // await checkSave(saveAsBomLines, selectedObjects);

          // 메시지박스 제거
          eventBus.publish('removeMessages');
          // 생성된 객체로 이동할지, 목록으로 이동할지 묻는 메시지
          const objectString = topItemRevision.props.items_tag.uiValues[0];
          const message = '"' + objectString + '"' + '이(가) 저장되었습니다.\n어디로 이동하시겠습니까?';
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
          // 버튼 다시 활성화
          data.disabledButtonChk.dbValue = false;
        }
      },
      () => {
        return;
      },
    ],
  );
}

/**
 * 처음 페이지가 열렸을 때 동작하는 함수
 * @param {*} ctx
 * @param {*} data
 */
export function onInit(ctx, data) {
  // localStorage의 awTreeTable의 Expand/Collapse 등을 저장하는 곳을 불러온다
  let awTreeTableState = JSON.parse(localStorage.getItem('awTreeTableState:/'));
  // 해당 페이지의 awTreeTable 의 Expand/Collapse 저장 상태를 초기화한다.
  awTreeTableState.L2_ChecklistCreate = undefined;
  // 초기화 한 내용을 SetItem 하여 적용한다.
  let stringified = JSON.stringify(awTreeTableState);
  localStorage.setItem('awTreeTableState:/', stringified);

  // Policy
  L2_StandardBOMPropertyPolicyService.registerPropertyPolicy();

  // Context
  if (!ctx.checklist.standardBOM) {
    ctx.checklist.standardBOM = {};
  }
  ctx.checklist.standardBOM.isSelectAll = false;
  ctx.checklist.standardBOM.isAllLineView = false;
  ctx.checklist.standardBOM.selectedTemplateItemRevision = selectedTemplateItemRevision;
  ctx.checklist.standardBOM.selectedStructureItemRevision = selectedStructureItemRevision;
  ctx.checklist.standardBOM.topItem = topItem;
  ctx.checklist.standardBOM.topItemRevision = topItemRevision;

  _data = data;
  _dataProvider = data.dataProviders.checklistCreateTreeDataProvider;
  deleteFlag = true;

  product = {
    uid: topItemRevision.uid,
    type: topItemRevision.type,
  };
}

//전역 변수로 initialized 와 selectionList를 선언한다.
let initialized = false;
let selectionList = [];
export function onMount(ctx, data) {
  logger.info('onMount');
}

/**
 * 페이지를 벗어났을 때 해당 함수를 호출해서, 전역 변수들을 초기화시켜준다.
 * @param {*} ctx
 * @param {*} data
 */
export function onUnmount(ctx, data) {
  // Context
  topItem = undefined;
  topItemRevision = undefined;
  selectedTemplateItemRevision = undefined;
  selectedStructureItemRevision = undefined;
  ctx.checklist.standardBOM = undefined;
  ctx.checklist.standardBOM = { templateList: [] };
  selectionList = [];
  initialized = false;

  // Policy
  L2_StandardBOMPropertyPolicyService.unRegisterPropertyPolicy();
}

async function openPopup(ctx, data) {
  try {
    selectedTemplateItemRevision = ctx.checklist.standardBOM.selectedTemplateItemRevision;
    selectedStructureItemRevision = ctx.checklist.standardBOM.selectedStructureItemRevision;

    if (!selectedTemplateItemRevision || !selectedStructureItemRevision) {
      lgepMessagingUtils.show(lgepMessagingUtils.WARNING, '표준 BOM을 선택해주세요.');
      return;
    }

    // lgepLoadingUtils.openWindow();

    // let objectName = ctx.checklist.standardBOM.selectedStructureItemRevision.props.object_name.dbValues[0];

    // Save As
    // const saveAsNewItemResponse = await L2_StandardBOMService.saveAsNewItem(selectedStructureItemRevision, objectName);
    // topItem = saveAsNewItemResponse.item;
    // topItemRevision = saveAsNewItemResponse.itemRev;
    // const saveAsNewItemResponse = await L2_StandardBOMService.saveAsNewItem(selectedStructureItemRevision, objectName);
    topItem = ctx.checklist.standardBOM.selectedStructureItem;
    topItemRevision = selectedStructureItemRevision;
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
    return;
  } finally {
    // lgepLoadingUtils.closeWindow();
  }

  // Popup Caption
  let caption = data && data.i18n && data.i18n.checklistCreateCaption;
  if (!caption) {
    caption = '체크리스트 생성';
  }

  popupService.show({
    declView: 'L2_ChecklistCreate',
    locals: {
      anchor: 'closePopupAnchor',
      caption: caption,
      hasCloseButton: true,
    },
    options: {
      clickOutsideToClose: false,
      draggable: true,
      enableResize: true,
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
  initialized = false;
  // logger.info("treeAllLineView");

  ctx.checklist.standardBOM.isAllLineView = !ctx.checklist.standardBOM.isAllLineView;
  eventBus.publish('checklistCreateTree.plTable.reload');
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
  const selectedVmo = eventData.selectedVmo;
  if (!selectedVmo) {
    return;
  }
  if (selectedVmo.selected) {
    // 선택
    selectionList.filter((e) => e.uid == selectedVmo.uid)[0].selected = true;
    L2_StandardBOMService.recursiveAddToSelectionForChildren(_dataProvider, selectedVmo);
    L2_StandardBOMService.recursiveAddToSelectionForParent(_dataProvider, selectedVmo);
    recursiveAddToSelectionListForChildren(selectionList, selectedVmo.uid);
    recursiveAddToSelectionListForParent(selectionList, selectedVmo.uid);
  } else {
    // 해제
    selectionList.filter((e) => e.uid == selectedVmo.uid)[0].selected = false;
    L2_StandardBOMService.recursiveRemoveFromSelectionForChildren(_dataProvider, selectedVmo);
    L2_StandardBOMService.recursiveRemoveFromSelectionForParent(_dataProvider, selectedVmo);
    recursiveRemoveFromSelectionListForChildren(selectionList, selectedVmo.uid);
    recursiveRemoveFromSelectionListForParent(selectionList, selectedVmo.uid);
  }
}

function recursiveAddToSelectionListForChildren(selectionList, node) {
  let children = selectionList.filter((e) => e.uid == node)[0].children;
  if (children) {
    _.forEach(children, function (child) {
      let selectChild = selectionList.filter((e) => e.uid == child)[0];
      selectChild.selected = true;
      recursiveAddToSelectionListForChildren(selectionList, selectChild.uid);
    });
  }
}

function recursiveAddToSelectionListForParent(selectionList, node) {
  let parentNode = selectionList.filter((e) => e.uid == node)[0].parentNode;
  if (parentNode) {
    let selectParentNode = selectionList.filter((e) => e.uid == parentNode)[0];
    selectParentNode.selected = true;
    recursiveAddToSelectionListForParent(selectionList, selectParentNode.uid);
  }
}

function recursiveRemoveFromSelectionListForChildren(selectionList, node) {
  let children = selectionList.filter((e) => e.uid == node)[0].children;
  if (children) {
    _.forEach(children, function (child) {
      let selectChild = selectionList.filter((e) => e.uid == child)[0];
      selectChild.selected = false;
      recursiveRemoveFromSelectionListForChildren(selectionList, selectChild.uid);
    });
  }
}

function recursiveRemoveFromSelectionListForParent(selectionList, node) {
  let parentNode = selectionList.filter((e) => e.uid == node)[0].parentNode;
  if (parentNode) {
    let isChildrenAllUnchecked = true;

    let children = selectionList.filter((e) => e.uid == parentNode)[0].children;
    if (children) {
      _.forEach(children, function (child) {
        const isSelected = selectionList.filter((e) => e.uid == child)[0].selected;
        if (isSelected) {
          isChildrenAllUnchecked = false;
          return;
        }
      });
    }

    if (isChildrenAllUnchecked) {
      let selectParentNode = selectionList.filter((e) => e.uid == parentNode)[0];
      selectParentNode.selected = false;
      recursiveRemoveFromSelectionListForParent(selectionList, selectParentNode.uid);
    }
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

export function initializeChecklistCreateTree(ctx, data, expandLevel, expandType) {
  ctx.decoratorToggle = true;
  let targetObject = ctx.checklist.standardBOM?.topItemRevision;
  if (!targetObject) {
    if (!data || !data.dataProviders) {
      data = viewModelService.getViewModelUsingElement(document.getElementById('checklistCreateTree'));
    }
    let uid = data.dataProviders.checklistCreateTreeDataProvider.viewModelCollection.loadedVMObjects[0].props.awb0UnderlyingObject.dbValues[0];
    targetObject = lgepObjectUtils.getObject(uid);
  }
  let bomTreeMap = new Map();
  let parentOccurrence;
  return lgepBomUtils
    .getOccurrences3(targetObject)
    .then((response) => {
      let rootProductContext = response.rootProductContext;
      data.rootProductContext = rootProductContext;
      let parentOccurrenceObject = lgepObjectUtils.getObject(response.parentOccurrence.occurrenceId);
      return lgepBomUtils.getOccurrences3(targetObject, rootProductContext, parentOccurrenceObject);
    })
    .then((response) => {
      parentOccurrence = response.parentOccurrence;
      // ctx.checklist.standardBOM.currentProductContext = {
      //   uid: response.rootProductContext.uid,
      //   type: response.rootProductContext.type,
      // };
      // getOccurrence3의 response들을 분석하여, 부모-자식 관계를 Map에 할당한다.
      let infos = response.parentChildrenInfos;
      if (infos.length == 0) {
        return {
          ServiceData: {
            modelObjects: [lgepObjectUtils.getObject(parentOccurrence.occurrenceId)],
          },
        };
      }
      let allObjectUids = [];
      for (const info of infos) {
        if (!allObjectUids.includes(info.parentInfo.occurrenceId)) allObjectUids.push(info.parentInfo.occurrenceId);
        if (info.parentInfo.numberOfChildren > 0) {
          let _children = [];
          for (const childInfo of info.childrenInfo) {
            if (!allObjectUids.includes(childInfo.occurrenceId)) allObjectUids.push(childInfo.occurrenceId);
            _children.push(childInfo.occurrenceId);
          }
          bomTreeMap.set(info.parentInfo.occurrenceId, _children);
        }
      }
      // 3. 해당 BOM을 In-Context 모드로 변경한다.
      return lgepBomUtils.saveUserWorkingContextState2(parentOccurrence.occurrenceId).then(() => {
        return lgepBomUtils.getTableViewModelProperties(allObjectUids);
      });
    })
    .then((getTableViewModelPropsResp) => {
      //4. 부모-자식 관계가 담긴 Map으부터 내용을 읽어와 ChecklistRow를 알맞게 생성한다.
      //topLine은 생성되지 않는 경우가 있기 때문에 예외적으로 별도로 생성한다.
      let responseModelObjects = getTableViewModelPropsResp.ServiceData.modelObjects;
      let modelObjects = Object.values(responseModelObjects);
      let topLine = lgepObjectUtils.getObject(parentOccurrence.occurrenceId);
      let allObjects = [];

      //modelObject에 부모-자식 관계를 할당한다.
      for (const modelObject of modelObjects) {
        if (modelObject.type == 'Awb0DesignElement') {
          allObjects.push(modelObject);
          let children = bomTreeMap.get(modelObject.uid);
          if (children) {
            modelObject._children = [];
            for (const childUid of children) {
              let child = responseModelObjects[childUid];
              if (child) {
                modelObject._children.push(child);
                child.parent = modelObject;
              }
            }
          }
        }
      }
      return allObjects.filter((e) => e.uid == parentOccurrence.occurrenceId);
    })
    .then(async (response) => {
      let vmo = viewModelObjectService.constructViewModelObjectFromModelObject(response[0]);
      let topTreeVmo = awTableService.createViewModelTreeNode(vmo.uid, vmo.type, vmo.props.object_string.dbValues[0], 0, 1, vmo.typeIconURL);
      topTreeVmo.props = vmo.props;
      topTreeVmo.originalObject = response[0];
      if (!data || !data.dataProviders) {
        data = viewModelService.getViewModelUsingElement(document.getElementById('checklistCreateTree'));
      }
      topTreeVmo.isExpanded = true;
      topTreeVmo.alternateID = topTreeVmo.uid + ',' + 'top';
      topTreeVmo.displayName = vmo.props.object_string.dbValues[0];
      let treeNodeArray = [topTreeVmo];
      // ctx.checklist.standardBOM.detailTop = topTreeVmo;
      await _recursiveCreateTreeNode(topTreeVmo, treeNodeArray, expandLevel, expandType);
      // _recursiveCreateTreeNode(topTreeVmo, treeNodeArray);
      data.dataProviders['checklistCreateTreeDataProvider'].viewModelCollection.loadedVMObjects = treeNodeArray;
      // data.dataProviders[dpName].selectionModel.addToSelection(topTreeVmo);
      if (!initialized) {
        initialized = true;
        _dataProvider.selectionModel.addToSelection(_dataProvider.viewModelCollection.loadedVMObjects[0]);
        _.forEach(_dataProvider.viewModelCollection.loadedVMObjects, function (childNode) {
          const selected = childNode.props.l2_is_selected ? (childNode.props.l2_is_selected.dbValues[0] === 'Y' ? true : false) : false;
          if (selected) {
            childNode.selected = true;
            _dataProvider.selectionModel.addToSelection(childNode);
          }
        });
        for (const vmo of _dataProvider.viewModelCollection.loadedVMObjects) {
          selectionList.push(createSelectionObject(vmo));
        }
      } else {
        let selectedObjects = selectionList.filter((e) => e.selected == true);
        _dataProvider.selectionModel.addToSelection(_dataProvider.viewModelCollection.loadedVMObjects[0]);
        for (const selected of _dataProvider.viewModelCollection.loadedVMObjects.filter((e) => selectedObjects.map((e) => e.uid).includes(e.uid))) {
          _dataProvider.selectionModel.addToSelection(selected);
        }
        eventBus.publish('checklistStructureEditTree.plTable.clientRefresh');
      }
      return {
        treeLoadResult: {
          parentNode: topTreeVmo,
        },
      };
    });
}

function createSelectionObject(vmo) {
  if (vmo)
    return {
      uid: vmo.uid,
      selected: vmo.selected,
      parentNode: vmo.parentNode ? vmo.parentNode.uid : null,
      children: vmo.children ? vmo.children.map((e) => e.uid) : null,
    };
}

async function _recursiveCreateTreeNode(targetTreeNode, treeNodeArray, expandLevel, type) {
  if (targetTreeNode.originalObject) {
    let mo = targetTreeNode.originalObject;
    if (mo._children && mo._children.length > 0) {
      if (
        appCtxService.ctx.checklist.standardBOM &&
        appCtxService.ctx.checklist.standardBOM.includeType &&
        appCtxService.ctx.checklist.standardBOM.includeType.length > 0
      ) {
        let filterArray = mo._children.filter((e) =>
          appCtxService.ctx.checklist.standardBOM.includeType.includes(lgepObjectUtils.getObject(e.props.awb0UnderlyingObject.dbValues[0]).type),
        );
        if (filterArray.length > 0) {
          targetTreeNode.isLeaf = false;
        } else {
          targetTreeNode.isLeaf = true;
          return;
        }
      } else {
        targetTreeNode.isLeaf = false;
      }
    } else {
      targetTreeNode.isLeaf = true;
    }
    if (type) {
      let typeArray = type.split(',');
      if (!typeArray.includes(lgepObjectUtils.getObject(targetTreeNode.props.awb0UnderlyingObject.dbValues[0]).type)) return;
    }
    if ((mo._children && mo._children.length > 0 && targetTreeNode.levelNdx < expandLevel) || (mo._children && mo._children.length > 0 && !expandLevel)) {
      targetTreeNode.isExpanded = true;
      targetTreeNode.childNdx = mo._children.length;
      let children = [];
      for (const moChild of mo._children) {
        if (
          appCtxService.ctx.checklist.standardBOM &&
          appCtxService.ctx.checklist.standardBOM.includeType &&
          appCtxService.ctx.checklist.standardBOM.includeType.length > 0 &&
          !appCtxService.ctx.checklist.standardBOM.includeType.includes(lgepObjectUtils.getObject(moChild.props.awb0UnderlyingObject.dbValues[0]).type)
        ) {
          continue;
        }
        let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(moChild);
        let treeVmoChild = awTableService.createViewModelTreeNode(
          vmoChild.uid,
          vmoChild.type,
          vmoChild.props.object_string.dbValues[0],
          targetTreeNode.levelNdx + 1,
          targetTreeNode.levelNdx + 2,
          vmoChild.typeIconURL,
        );
        treeVmoChild.parentNode = targetTreeNode;
        treeVmoChild.props = vmoChild.props;
        treeVmoChild.originalObject = moChild;
        treeVmoChild.alternateID = treeVmoChild.uid + ',' + targetTreeNode.alternateID;
        treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
        treeNodeArray.push(treeVmoChild);
        await _recursiveCreateTreeNode(treeVmoChild, treeNodeArray, expandLevel, type);

        if (treeVmoChild.isLeaf) {
          const values = await _readPropertiesFromTextFile(treeVmoChild.props.l2_reference_dataset.dbValues[0]);
          const failureEffectValue = removeTagInStr(values['failureEffect']);
          const failureEffectProperty = uwPropertySvc.createViewModelProperty('failrue_effect', failureEffectValue, 'STRING', failureEffectValue, [
            failureEffectValue,
          ]);
          treeVmoChild.props['failrue_effect'] = failureEffectProperty;

          const failureMechanismValue = removeTagInStr(values['failureDetail']);
          const failureMechanismProperty = uwPropertySvc.createViewModelProperty('failrue_effect', failureMechanismValue, 'STRING', failureMechanismValue, [
            failureMechanismValue,
          ]);
          treeVmoChild.props['failure_mechanism'] = failureMechanismProperty;
        }

        children.push(treeVmoChild);
      }
      targetTreeNode.children = children;

      return targetTreeNode;
    }
  }
}

export function loadChecklistCreateTree(ctx, data) {
  let modelObjects = [];
  const parentNode = data.treeLoadInput.parentNode;
  if (data.treeLoadInput && data.treeLoadInput.parentNode && data.treeLoadInput.parentNode.uid !== 'top') {
    let product = {
      uid: parentNode.props.awb0Archetype.dbValues[0],
      type: 'L2_StructureRevision',
    };
    const requestParam = L2_StandardBOMService.getOccurrences3Param(product, data.rootProductContext, parentNode.uid);
    requestParam.inputData.requestPref.startFreshNavigation = ['false'];
    delete requestParam.inputData.requestPref.includePath;
    delete requestParam.inputData.requestPref.loadTreeHierarchyThreshold;
    return soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam).then((getOccurrences3Response) => {
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
        return L2_StandardBOMService.getTableViewModelProperties(occurrenceIds).then((getTableViewModelPropertiesResponse) => {
          for (const occInfo of occInfos) {
            const modelObject = getTableViewModelPropertiesResponse.ServiceData.modelObjects[occInfo.occurrenceId];
            let vmoChild = viewModelObjectService.constructViewModelObjectFromModelObject(modelObject);
            let treeVmoChild = awTableService.createViewModelTreeNode(
              vmoChild.uid,
              vmoChild.type,
              vmoChild.props.object_string.dbValues[0],
              data.treeLoadInput.parentNode.levelNdx + 1,
              data.treeLoadInput.parentNode.levelNdx + 2,
              vmoChild.typeIconURL,
            );
            treeVmoChild.parentNode = data.treeLoadInput.parentNode;
            treeVmoChild.props = vmoChild.props;
            treeVmoChild.originalObject = modelObject;
            treeVmoChild.alternateID = treeVmoChild.uid + ',' + data.treeLoadInput.parentNode.alternateID;
            treeVmoChild.displayName = treeVmoChild.props.object_string.dbValues[0];
            treeVmoChild.numberOfChildren = occInfo.numberOfChildren;
            if (treeVmoChild.numberOfChildren && treeVmoChild.numberOfChildren > 0) {
              treeVmoChild.isLeaf = false;
            } else {
              treeVmoChild.isLeaf = true;
            }
            modelObjects.push(treeVmoChild);
          }
          let index = data.dataProviders['checklistCreateTreeDataProvider'].viewModelCollection.loadedVMObjects
            .map((e) => e.uid)
            .indexOf(data.treeLoadInput.parentNode.uid);
          for (let i = modelObjects.length - 1; i >= 0; i--) {
            let uidArray = data.dataProviders['checklistCreateTreeDataProvider'].viewModelCollection.loadedVMObjects.map((e) => e.uid);
            if (!uidArray.includes(modelObjects[i].uid)) {
              arrayInsertAt(data.dataProviders['checklistCreateTreeDataProvider'].viewModelCollection.loadedVMObjects, index + 1, modelObjects[i]);
            }
          }
          let selectedObjects = selectionList.filter((e) => e.selected == true);
          _dataProvider.selectionModel.addToSelection(_dataProvider.viewModelCollection.loadedVMObjects[0]);
          for (const selected of _dataProvider.viewModelCollection.loadedVMObjects.filter((e) => selectedObjects.map((e) => e.uid).includes(e.uid))) {
            _dataProvider.selectionModel.addToSelection(selected);
          }
          eventBus.publish('checklistStructureEditTree.plTable.clientRefresh');
        });
      }
    });
  }
}

function arrayInsertAt(destArray, pos, arrayToInsert) {
  var args = [];
  args.push(pos); // where to insert
  args.push(0); // nothing to remove
  args = args.concat(arrayToInsert); // add on array to insert
  destArray.splice.apply(destArray, args); // splice it in
}

export function setIncludeTypes(ctx, data, includeType) {
  if (!appCtxService.ctx.checklist.standardBOM) {
    appCtxService.ctx.checklist.standardBOM = {};
  }
  if (includeType) {
    let array = includeType.split(',');
    appCtxService.ctx.checklist.standardBOM.includeType = array;
  } else {
    appCtxService.ctx.checklist.standardBOM.includeType = [];
  }
  initializeChecklistCreateTree(ctx, data);
}

function treeSearchBackground(ctx, data) {
  let checklistStructureCreateData = vms.getViewModelUsingElement(document.getElementById('checklistStructureCreateData'));
  if (checklistStructureCreateData.searchMode) {
    checklistStructureCreateData.searchMode = false;
  } else {
    checklistStructureCreateData.searchMode = true;
  }
}

async function searchStart() {
  let checklistStructureCreateData = vms.getViewModelUsingElement(document.getElementById('checklistStructureCreateData'));
  let searchValue = checklistStructureCreateData.searchTextBox.dbValue;
  if (!searchValue || searchValue == '') {
    return;
  }
  searchValue = searchValue.toLowerCase();
  searchValue = searchValue.replace(/(\s*)/g, '');
  let treeData = checklistStructureCreateData.dataProviders.checklistCreateTreeDataProvider.viewModelCollection.loadedVMObjects;
  let columnData = checklistStructureCreateData.columnProviders.checklistCreateTreeColumnProvider.columns;
  let resultIndex = [];
  let idx = 0;
  checklistStructureCreateData.dataProviders.checklistCreateTreeDataProvider.viewModelCollection.loadedVMObjects = [];
  for (let node of treeData) {
    node.gridDecoratorStyle = '';
    for (let column of columnData) {
      if (!node.props[column.name] || !node.props[column.name].dbValue) {
        continue;
      }
      let searchData = node.props[column.name].dbValue;
      searchData = searchData.toLowerCase();
      searchData = searchData.replace(/(\s*)/g, '');
      if (searchData.includes(searchValue)) {
        resultIndex.push(idx);
        break;
      }
    }
    idx++;
  }
  for (let index of resultIndex) {
    treeData[index].gridDecoratorStyle = 'aw-charts-chartColor2';
  }
  await lgepCommonUtils.delay(100);
  checklistStructureCreateData.dataProviders.checklistCreateTreeDataProvider.viewModelCollection.loadedVMObjects = treeData;
}

export default exports = {
  initializeChecklistCreateTree,
  loadChecklistCreateTree,
  loadChecklistCreateTreeData,
  setIncludeTypes,

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
  treeSearchBackground,

  searchStart,
};
/**
 * @memberof NgServices
 * @member L2_ChecklistCreateService
 */
app.factory('L2_ChecklistCreateService', () => exports);
