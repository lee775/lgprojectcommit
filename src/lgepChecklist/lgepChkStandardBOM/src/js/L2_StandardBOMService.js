/**
 * Standard BOM Service
 *
 * @module js/L2_StandardBOMService
 */

import app from 'app';
import awTableStateService from 'js/awTableStateService';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import logger from 'js/logger';
import popupService from 'js/popupService';
import soaService from 'soa/kernel/soaService';
import _ from 'lodash';
import * as standardBOMConstants from 'js/L2_StandardBOMConstants';
import appCtxService, { ctx } from 'js/appCtxService';
import lgepBomUtils from 'js/utils/lgepBomUtils';

let exports = {};

function dateTo_GMTString(date) {
  date = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  var MM = date.getMonth() + 1;
  MM = MM < 10 ? '0' + MM : MM;
  var dd = date.getDate();
  dd = dd < 10 ? '0' + dd : dd;
  let hh = date.getHours();
  hh = hh < 10 ? '0' + hh : hh;
  var mm = date.getMinutes();
  mm = mm < 10 ? '0' + mm : mm;
  var ss = date.getSeconds();
  ss = ss < 10 ? '0' + ss : ss;
  return date.getFullYear() + '-' + MM + '-' + dd + 'T' + hh + ':' + mm + ':' + ss + date.toString().slice(28, 33);
}

/**
 *
 * @param {*} dataCtxNode - The data context the expansion is occurring within.
 * @param {*} node
 * @returns
 */
export async function expandAll(dataCtxNode, node) {
  if (!dataCtxNode || !node || node.isLeaf) {
    return;
  }
  if (node.isExpanded) {
    const children = node.children;
    if (children) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        await expandAll(dataCtxNode, child);
      }
    }
  } else {
    node.isExpanded = true;
    node.loadingStatus = true;
    node._expandRequested = true;
    awTableStateService.saveRowExpanded(dataCtxNode.data, dataCtxNode.gridid, node);
    try {
      const updatedViewModelCollection = await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
      delete node.loadingStatus;
      delete node._expandRequested;

      const loadedVMObjects = updatedViewModelCollection.loadedVMObjects;
      for (let i = 0; i < loadedVMObjects.length; i++) {
        const loadedVMObject = loadedVMObjects[i];
        if (!loadedVMObject.isExpanded) {
          await expandAll(dataCtxNode, loadedVMObject);
        }
      }
    } catch (error) {
      lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
      logger.error('error: ', error);
    } finally {
      delete node.loadingStatus;
      delete node._expandRequested;
    }
  }
}

export async function expandOneLevel(dataCtxNode, node) {
  if (node.isExpanded) {
    return;
  }
  node.isExpanded = true;
  node.loadingStatus = true;
  node._expandRequested = true;
  awTableStateService.saveRowExpanded(dataCtxNode.data, dataCtxNode.gridid, node);
  try {
    const updatedViewModelCollection = await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
    delete node.loadingStatus;
    delete node._expandRequested;
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
  } finally {
    delete node.loadingStatus;
    delete node._expandRequested;
  }
}

export async function expandTopNode(dataCtxNode, node) {
  node.isExpanded = true;
  node.loadingStatus = true;
  node._expandRequested = true;
  awTableStateService.saveRowExpanded(dataCtxNode.data, dataCtxNode.gridid, node);
  try {
    const updatedViewModelCollection = await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
    delete node.loadingStatus;
    delete node._expandRequested;
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
  } finally {
    delete node.loadingStatus;
    delete node._expandRequested;
  }
}

export async function expandBlow(dataCtxNode, node) {
  if (node.isExpanded) {
    return;
  }
  node.isExpanded = true;
  node.loadingStatus = true;
  node._expandRequested = true;
  awTableStateService.saveRowExpanded(dataCtxNode.data, dataCtxNode.gridid, node);
  try {
    await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
    // children만 열기
    if (node.children) {
      for (const childRow of node.children) {
        expandBlow(dataCtxNode, childRow);
      }
    }
    delete node.loadingStatus;
    delete node._expandRequested;
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
  } finally {
    delete node.loadingStatus;
    delete node._expandRequested;
  }
}

function getInContextParam(parentOccurrenceId) {
  return {
    contextState: {
      openedObject: {
        uid: parentOccurrenceId,
        type: 'Awb0DesignElement',
      },
      sublocationAttributes: {
        awb0ActiveSublocation: ['개요'],
        awb0SelectedElementPath: [parentOccurrenceId],
        awb0OverrideContextElement: [parentOccurrenceId],
      },
      cloneContentSaveSpecifications: [[], []],
    },
    requestPref: {
      isSetCase: ['true'],
    },
  };
}

function getOccurrences3Param(product, productContext, parentElement, scopeForExpandBelow) {
  return {
    inputData: {
      config: {
        effectivityDate: '0001-01-01T00:00:00',
        unitNo: -1,
        productContext: productContext,
        revisionRule: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        occurrenceScheme: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        sourceContext: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        changeContext: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        appliedArrangement: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        closureRule: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        viewType: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        serializedRevRule: '',
        effectivityGroups: [],
        endItem: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        variantRules: [],
        svrOwningProduct: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        effectivityRanges: [],
      },
      cursor: {
        startReached: false,
        endReached: false,
        startIndex: 0,
        endIndex: 0,
        pageSize: 250,
        startOccUid: '',
        endOccUid: '',
        cursorData: [],
      },
      expansionCriteria: {
        expandBelow: true,
        levelNExpand: 0,
        loadTreeHierarchyThreshold: 500,
        scopeForExpandBelow: '',
      },
      filter: {
        searchFilterCategories: [],
        searchFilterMap: {},
        fetchUpdatedFilters: false,
        recipe: [],
        searchFilterFieldSortType: 'Priority',
        searchSortCriteria: [],
      },
      focusOccurrenceInput: {
        element: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        cloneStableIdChain: '',
      },
      parentElement: parentElement,
      product: product,
      requestPref: {
        calculateFilters: ['false'],
        defaultClientScopeUri: ['Awb0OccurrenceManagement'],
        displayMode: ['Tree'],
        // expandBelow: ["true"],
        includePath: ['true'],
        loadTreeHierarchyThreshold: ['500'],
        savedSessionMode: ['restore'],
        showExplodedLines: ['false'],
        showMarkup: ['false'],
        startFreshNavigation: ['true'],
        viewType: [''],
      },
      sortCriteria: {
        propertyName: '',
        sortingOrder: '',
      },
    },
  };
}

function getSaveViewModelEditAndSubmitWorkflow2Param(loadedVMObjects, saveAsDatasets) {
  let inputs = [];

  const srcObjLsd = dateTo_GMTString(new Date());
  _.forEach(loadedVMObjects, function (loadedVMObject, index) {
    // Top 제외
    if (index === 0) {
      return;
    }

    let matchedDataset;
    try {
      const itemId = loadedVMObject.props.awb0ArchetypeId.dbValues[0];
      if (saveAsDatasets && Array.isArray(saveAsDatasets)) {
        for (let i = 0; i < saveAsDatasets.length; i++) {
          const saveAsDataset = saveAsDatasets[i];
          if (itemId === saveAsDataset.props.object_name.dbValues[0]) {
            matchedDataset = saveAsDataset;
            break;
          }
        }
      }
    } catch (error) {
      logger.error('error: ', error);
    }

    let viewModelProperties = [
      {
        propertyName: standardBOMConstants.l2_is_selected,
        dbValues: loadedVMObject.selected ? ['Y'] : ['N'],
        uiValues: loadedVMObject.selected ? ['Yes'] : ['No'],
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      },
    ];

    if (matchedDataset) {
      viewModelProperties.push({
        propertyName: standardBOMConstants.l2_reference_dataset,
        dbValues: [matchedDataset.uid],
        uiValues: [matchedDataset.uid],
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      });
    }

    inputs.push({
      obj: {
        uid: loadedVMObject.uid,
        type: loadedVMObject.type,
      },
      viewModelProperties: viewModelProperties,
      isPessimisticLock: false,
      workflowData: {},
    });
  });

  return inputs;
}

function getSaveViewModelEditAndSubmitWorkflow2ParamForSodCopy(loadedVMObjects, saveAsDatasets) {
  let inputs = [];

  const srcObjLsd = dateTo_GMTString(new Date());
  _.forEach(loadedVMObjects, function (loadedVMObject, index) {
    // Top 제외
    if (index === 0) {
      return;
    }

    let matchedDataset;
    try {
      const itemId = loadedVMObject.props.awb0ArchetypeId.dbValues[0];
      if (saveAsDatasets && Array.isArray(saveAsDatasets)) {
        for (let i = 0; i < saveAsDatasets.length; i++) {
          const saveAsDataset = saveAsDatasets[i];
          if (itemId === saveAsDataset.props.object_name.dbValues[0]) {
            matchedDataset = saveAsDataset;
            break;
          }
        }
      }
    } catch (error) {
      logger.error('error: ', error);
    }

    let viewModelProperties = [
      {
        propertyName: standardBOMConstants.l2_is_selected,
        dbValues: loadedVMObject.selected ? ['Y'] : ['N'],
        uiValues: loadedVMObject.selected ? ['Yes'] : ['No'],
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      },
      {
        propertyName: standardBOMConstants.l2_ref_detection,
        dbValues: loadedVMObject.props[standardBOMConstants.l2_result_detection].dbValues,
        uiValues: loadedVMObject.props[standardBOMConstants.l2_result_detection].dbValues,
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      },
      {
        propertyName: standardBOMConstants.l2_ref_occurence,
        dbValues: loadedVMObject.props[standardBOMConstants.l2_result_occurence].dbValues,
        uiValues: loadedVMObject.props[standardBOMConstants.l2_result_occurence].dbValues,
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      },
      {
        propertyName: standardBOMConstants.l2_ref_severity,
        dbValues: loadedVMObject.props[standardBOMConstants.l2_result_severity].dbValues,
        uiValues: loadedVMObject.props[standardBOMConstants.l2_result_severity].dbValues,
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      },
    ];
    if (matchedDataset) {
      viewModelProperties.push({
        propertyName: standardBOMConstants.l2_reference_dataset,
        dbValues: [matchedDataset.uid],
        uiValues: [matchedDataset.uid],
        intermediateObjectUids: [],
        srcObjLsd: srcObjLsd,
        isModifiable: true,
      });
    }

    inputs.push({
      obj: {
        uid: loadedVMObject.uid,
        type: loadedVMObject.type,
      },
      viewModelProperties: viewModelProperties,
      isPessimisticLock: false,
      workflowData: {},
    });
  });

  return inputs;
}

function getTableViewModelProperties(objectUids) {
  const requestParam = {
    input: {
      objectUids: objectUids,
      columnConfigInput: {
        clientName: 'AWClient',
        hostingClientName: '',
        clientScopeURI: 'Awb0OccurrenceManagement',
        operationType: 'Union',
        columnsToExclude: [
          'Awb0ConditionalElement.awb0PendingAction',
          'Awb0PositionedElement.pma1UpdateAction',
          'Awb0DesignElement.pma1LastAlignedPart',
          'Awb0DesignElement.REF(pma1LastAlignedPart,ItemRevision).release_status_list',
          'Awb0PartElement.pma1LastAlignedDesign',
          'Awb0PartElement.REF(pma1LastAlignedDesign,ItemRevision).release_status_list',
          'Awb0ConditionalElement.awb0MarkupType',
        ],
      },
      requestPreference: {
        typesToInclude: ['Awb0DesignElement'],
      },
    },
  };
  return soaService.post('Internal-AWS2-2017-12-DataManagement', 'getTableViewModelProperties', requestParam);
}

function recursiveAddToSelectionForChildren(dataProvider, node) {
  const children = node.children;
  if (children) {
    _.forEach(children, function (child) {
      dataProvider.selectionModel.addToSelection(child);
      recursiveAddToSelectionForChildren(dataProvider, child);
    });
  }
}

function recursiveAddToSelectionForParent(dataProvider, node) {
  const parentNode = node.parentNode;
  if (parentNode) {
    dataProvider.selectionModel.addToSelection(parentNode);
    recursiveAddToSelectionForParent(dataProvider, parentNode);
  }
}

function recursiveRemoveFromSelectionForChildren(dataProvider, node) {
  const children = node.children;
  if (children) {
    _.forEach(children, function (child) {
      recursiveRemoveFromSelectionForChildren(dataProvider, child);
      dataProvider.selectionModel.removeFromSelection(child);
    });
  }
}

function recursiveRemoveFromSelectionForParent(dataProvider, node) {
  const parentNode = node.parentNode;
  if (parentNode) {
    let isChildrenAllUnchecked = true;

    const children = parentNode.children;
    if (children) {
      _.forEach(children, function (child) {
        const isSelected = dataProvider.selectionModel.isSelected(child);
        if (isSelected) {
          isChildrenAllUnchecked = false;
          return;
        }
      });
    }

    if (isChildrenAllUnchecked) {
      dataProvider.selectionModel.removeFromSelection(parentNode);
      recursiveRemoveFromSelectionForParent(dataProvider, parentNode);
    }
  }
}

async function referenceDatasetsDelete(itemRevision) {
  if (!itemRevision.props[standardBOMConstants.IMAN_reference]) {
    await lgepObjectUtils.getProperties(itemRevision, [standardBOMConstants.IMAN_reference]);
  }
  const deleteReference = await lgepObjectUtils.loadObjects2(itemRevision.props[standardBOMConstants.IMAN_reference].dbValues);
  const deleteReferenceObjects = Object.values(deleteReference);
  for (const deleteReferenceObject of deleteReferenceObjects) {
    if (deleteReferenceObject.type === standardBOMConstants.Text) {
      lgepObjectUtils.deleteRelations(standardBOMConstants.IMAN_reference, itemRevision, deleteReferenceObject);
    }
  }
}

// async function referenceDatasetsDelete(itemRevision) {
//     if (!itemRevision.props[standardBOMConstants.IMAN_reference]) {
//         await lgepObjectUtils.getProperties(itemRevision, [standardBOMConstants.IMAN_reference]);
//     }
//     const deleteReference = await lgepObjectUtils.loadObjects2(itemRevision.props[standardBOMConstants.IMAN_reference].dbValues);
//     const deleteReferenceObjects = Object.values(deleteReference);
//     let deleteRelationsInput = [];
//     _.forEach(deleteReferenceObjects, function (deleteReferenceObject) {
//         if (deleteReferenceObject.type === standardBOMConstants.Text) {
//             deleteRelationsInput.push({
//                 clientId: itemRevision.uid,
//                 relationType: standardBOMConstants.IMAN_reference,
//                 primaryObject: itemRevision,
//                 secondaryObject: deleteReferenceObject
//             });
//         }
//     });
//     const deleteRelationsParam = {
//         input: deleteRelationsInput
//     };
//     const deleteRelationsResponse = await soaService.post("Core-2006-03-DataManagement", "deleteRelations", deleteRelationsParam);
//     logger.info("deleteRelationsResponse: ", deleteRelationsResponse);
// }

async function referenceDatasetsSaveAs(srcItemRevision, destItemRevision) {
  let saveAsDatasets = [];

  if (!srcItemRevision.props[standardBOMConstants.IMAN_reference]) {
    await lgepObjectUtils.getProperties(srcItemRevision, [standardBOMConstants.IMAN_reference]);
  }
  const saveAsReference = await lgepObjectUtils.loadObjects2(srcItemRevision.props[standardBOMConstants.IMAN_reference].dbValues);

  const saveAsInputParam = {
    saveAsInput: [],
    relateInfo: [
      {
        target: destItemRevision,
        propertyName: standardBOMConstants.IMAN_reference,
        relate: true,
      },
    ],
  };

  const saveAsReferenceObjects = Object.values(saveAsReference);
  for (const saveAsReferenceObject of saveAsReferenceObjects) {
    if (saveAsReferenceObject.type === standardBOMConstants.Text) {
      saveAsInputParam.saveAsInput = [
        {
          targetObject: saveAsReferenceObject,
          saveAsInput: {
            boName: saveAsReferenceObject.type,
          },
        },
      ];
      const saveAsObjectAndRelateResponse = await soaService.post('Core-2012-09-DataManagement', 'saveAsObjectAndRelate', saveAsInputParam);

      saveAsDatasets.push(saveAsObjectAndRelateResponse.output[0].objects[0]);
    }
  }

  return saveAsDatasets;
}

function saveAsNewItem(itemRevision, name, policy) {
  const requestParam = {
    info: [
      {
        clientId: itemRevision.uid,
        itemRevision: itemRevision,
        name: name,
        // itemId: "String",
        // revId: "String",
        // name: "String",
        // description: "String",
        // folder: "IModelObject"
      },
    ],
  };
  return soaService.post('Core-2007-01-DataManagement', 'saveAsNewItem', requestParam, policy).then((response) => {
    const inputToNewItem = response.inputToNewItem[itemRevision.uid];
    return inputToNewItem;
  });
}

function getSelectFailureNodes(loadedVMObjects) {
  const selectFailureNodes = [];
  _.forEach(loadedVMObjects, function (loadedVMObject, index) {
    // Top 제외
    if (index === 0) {
      return;
    }
    // 고장이면서 선택한것만
    if (loadedVMObject.isLeaf && loadedVMObject.selected) {
      selectFailureNodes.push(loadedVMObject);
    }
  });
  return selectFailureNodes;
}

export async function expand2(dataCtxNode, node) {
  try {
    if (!node.isExpanded) {
      node.isExpanded = true;
      node.loadingStatus = true;
      node._expandRequested = true;
      awTableStateService.saveRowExpanded(dataCtxNode.data, dataCtxNode.gridid, node);
      await dataCtxNode.dataprovider.expandObject(dataCtxNode, node);
      delete node.loadingStatus;
      delete node._expandRequested;
    }
    if (node.children) {
      for (const childRow of node.children) {
        await expand2(dataCtxNode, childRow);
      }
    }
  } catch (error) {
    lgepMessagingUtils.show(lgepMessagingUtils.ERROR, error.toString());
    logger.error('error: ', error);
  } finally {
    delete node.loadingStatus;
    delete node._expandRequested;
  }
}

export async function expandBySaveAsBom(topItemRevision, dataProvider, policy) {
  const saveAsBomLines = await expandSaveasBom(topItemRevision, policy);

  const loadedVMObjects = dataProvider.getViewModelCollection().loadedVMObjects;
  for (const saveAsBomLine of saveAsBomLines) {
    const saveAsBomlineRevUid = saveAsBomLine.props.awb0Archetype.dbValues[0];
    const loadedVMObject = _getCheckVmo(loadedVMObjects, saveAsBomlineRevUid);
    if (loadedVMObject) {
      saveAsBomLine.selected = loadedVMObject.selected;
    } else {
      saveAsBomLine.selected = false;
    }
  }
  return saveAsBomLines;
}

export async function expandSaveasBom(topItemRevision, policy) {
  let parentOccurrence;

  return lgepBomUtils
    .getOccurrences3(topItemRevision)
    .then((response) => {
      let rootProductContext = response.rootProductContext;
      let parentOccurrenceObject = lgepObjectUtils.getObject(response.parentOccurrence.occurrenceId);
      return lgepBomUtils.getOccurrences3(topItemRevision, rootProductContext, parentOccurrenceObject);
    })
    .then((response) => {
      parentOccurrence = response.parentOccurrence;
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
        }
      }
      // 3. 해당 BOM을 In-Context 모드로 변경한다.
      return lgepBomUtils.saveUserWorkingContextState2(parentOccurrence.occurrenceId).then(() => {
        return lgepBomUtils.getTableViewModelProperties(allObjectUids, policy);
      });
    })
    .then((getTableViewModelPropsResp) => {
      let responseModelObjects = getTableViewModelPropsResp.ServiceData.modelObjects;
      let modelObjects = Object.values(responseModelObjects);
      let allObjects = modelObjects.filter((mo) => mo.type === 'Awb0DesignElement');
      appCtxService.ctx.checklist.created = allObjects;
      return allObjects.filter((mo) => mo.props.awb0UnderlyingObject.dbValues[0] !== topItemRevision.uid);
    });
}

function _getCheckVmo(loadedVMObjects, saveAsBomlineRevUid) {
  for (const loadedVMObject of loadedVMObjects) {
    const loadedVmoRevUid = loadedVMObject.props.awb0Archetype.dbValues[0];
    if (saveAsBomlineRevUid === loadedVmoRevUid) {
      return loadedVMObject;
    }
  }
}

export async function getRefrenceDatasets(itemRev) {
  let saveAsDatasets;
  await lgepObjectUtils.getProperties(itemRev, [standardBOMConstants.IMAN_reference, 'item_id']);
  const saveAsReference = await lgepObjectUtils.loadObjects2(itemRev.props[standardBOMConstants.IMAN_reference].dbValues);
  if (saveAsReference) {
    saveAsDatasets = Object.values(saveAsReference);
  }
  return saveAsDatasets;
}

export default exports = {
  dateTo_GMTString,
  expandAll,
  expandOneLevel,
  expand2,
  expandTopNode,
  getInContextParam,
  getOccurrences3Param,
  getSaveViewModelEditAndSubmitWorkflow2Param,
  getSaveViewModelEditAndSubmitWorkflow2ParamForSodCopy,
  getTableViewModelProperties,

  recursiveAddToSelectionForChildren,
  recursiveAddToSelectionForParent,
  recursiveRemoveFromSelectionForChildren,
  recursiveRemoveFromSelectionForParent,

  referenceDatasetsDelete,
  referenceDatasetsSaveAs,

  saveAsNewItem,
  getSelectFailureNodes,
  expandBySaveAsBom,
  expandSaveasBom,
  getRefrenceDatasets,
};
/**
 * @memberof NgServices
 * @member L2_StandardBOMService
 */
app.factory('L2_StandardBOMService', () => exports);
