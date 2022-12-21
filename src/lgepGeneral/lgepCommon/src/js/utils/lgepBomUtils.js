// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import policy from 'js/soa/kernel/propertyPolicyService';
import soaService from 'soa/kernel/soaService';

let exports = {};

/**
 * BOMLine 추가
 *
 * @param {IModelObject} parent - The parent where the objects are added.
 * @param {IModelObject} itemRev - The item revision to be added. It can be null.
 * @returns
 */
export const add = function (parent, itemRev) {
  let requestParam = {
    input: [
      {
        parent: parent,
        toBeAdded: [
          {
            // item: "IModelObject",
            itemRev: itemRev,
            // bomView: "IModelObject",
            // element: "IModelObject",
            // line: "IModelObject",
            // initialValues: {
            //     SampleStringKey: "String"
            // }
          },
        ],
        // flags: "int",
      },
    ],
  };
  return soaService.post('StructureManagement-2012-09-Structure', 'add', requestParam);
};

/**
 * BOMWindow 닫음
 *
 * @param {IModelObject} bomWindow
 * @returns
 */
export const closeBOMWindow = function (bomWindow) {
  return closeBOMWindows([bomWindow]);
};

/**
 * BOMWindow 닫음
 *
 * @param {IModelObject[]} bomWindows
 * @returns
 */
export const closeBOMWindows = function (bomWindows) {
  let requestParam = {
    bomWindows: bomWindows,
  };
  return soaService.post('Cad-2007-01-StructureManagement', 'closeBOMWindows', requestParam);
};

/**
 * BOMWindow 생성
 * createBOMWindow(item); - item만 파라미터로 입력해도 BOMWindow 생성된다.
 * createBOMWindow(null, itemRev); - itemRev만 파라미터로 입력해도 BOMWindow 생성된다.
 *
 * @param {IModelObject} item
 * @param {IModelObject} itemRev
 * @param {IModelObject} bomView
 * @param {*} revRuleConfigInfo
 * @param {*} policy
 * @returns
 */
export const createBOMWindow = function (item, itemRev, bomView, revRuleConfigInfo, policy) {
  let requestParam = {
    info: [
      {
        // clientId: "String",
        item: item,
        itemRev: itemRev,
        bomView: bomView,
        revRuleConfigInfo: revRuleConfigInfo,
        // revRuleConfigInfo: {
        //     clientId: "String",
        //     revRule: "IModelObject",
        //     props: {
        //         unitNo: "int",
        //         date: "Date",
        //         today: "bool",
        //         endItem: "IModelObject",
        //         endItemRevision: "IModelObject",
        //         overrideFolders: [{
        //             ruleEntry: "IModelObject",
        //             folder: "IModelObject"
        //         }]
        //     }
        // },
        // objectForConfigure: "IModelObject",
        // activeAssemblyArrangement: "IModelObject"
      },
    ],
  };
  return soaService.post('Cad-2007-01-StructureManagement', 'createBOMWindows', requestParam, policy).then((response) => {
    return response.output[0];
  });
};

/**
 * Cut lines of the selected Item Revisions in a window and delete the Item Revisions.
 * If the selected Item Revision is the last revision of the Item , then the Item will be deleted.
 *
 * @param {IModelObject} parent - The BOMWindow where the selected items to be deleted appear.
 * @param {IModelObject[]} objs - A list of selected items to be deleted.
 * @returns
 */
export const cutItems = function (parent, objs) {
  let requestParam = {
    input: [
      {
        parent: parent,
        objs: objs,
      },
    ],
  };
  return soaService.post('StructureManagement-2012-10-Structure', 'cutItems', requestParam);
};

/**
 * BOM 복제
 *
 * @param {IModelObject} topLine - The top BOMLine of the structure to be cloned.
 * @returns
 */
export const duplicate = function (topLine) {
  let requestParam = {
    inputs: [
      {
        topLine: topLine,
        // clonedIdMap: {
        //     SampleStringKey: {
        //         newItemId: "String",
        //         newItemName: "String"
        //     }
        // },
        // defaultName: {
        //     autogen: "bool",
        //     prefix: "String",
        //     suffix: "String",
        //     from: "String",
        //     to: "String"
        // },
        // renameCadFile: "bool",
        // options: ["NoDep", "Drawing", "PartFamilyMaster", "PartFamilyMember", "Required", "AllDep", "ExcludeFromBom"],
      },
    ],
  };
  return soaService.post('StructureManagement-2008-06-Structure', 'duplicate', requestParam);
};

/**
 * BOM 복제
 *
 * @param {IModelObject} item
 * @returns
 */
export const duplicateFromItem = function (item) {
  return createBOMWindow(item).then((createBOMWindowResponse) => {
    const bomWindow = createBOMWindowResponse.bomWindow;
    const bomLine = createBOMWindowResponse.bomLine;
    return duplicate(bomLine).then((duplicateResponse) => {
      closeBOMWindow(bomWindow);

      return duplicateResponse;
    });
  });
};

/**
 * BOM 복제
 *
 * @param {IModelObject} revision
 * @returns
 */
export const duplicateFromItemRev = function (revision) {
  return createBOMWindow(null, revision).then((createBOMWindowResponse) => {
    const bomWindow = createBOMWindowResponse.bomWindow;
    const bomLine = createBOMWindowResponse.bomLine;
    return duplicate(bomLine).then((duplicateResponse) => {
      closeBOMWindow(bomWindow);
      return duplicateResponse;
    });
  });
};

/**
 * 부모 bomlines가 주어진 모든 수준에서 자식을 찾습니다.
 * 또한 필요한 경우 부모와 자식에 연결된 지정된 유형 및 관계의 개체를 가져옵니다.
 *
 * @param {IModelObject[]} parentBomLines
 * @param {*} pref
 * @param {*} paramPolicy
 * @returns
 */
export const expandPSAllLevels = function (parentBomLines, pref, paramPolicy) {
  let requestParam = {
    input: {
      parentBomLines: parentBomLines,
      excludeFilter: 'None',
    },
    pref: pref,
    // pref: {
    //     expItemRev: "bool",
    //     info: [{
    //         relationName: "String",
    //         relationTypeNames: "String[]"
    //     }]
    // }
  };
  return soaService.post('Cad-2007-01-StructureManagement', 'expandPSAllLevels', requestParam, paramPolicy);
};

/**
 * 주어진 부모 bomlines의 첫 번째 수준 자식을 찾습니다.
 * 또한 필요한 경우 부모와 자식에 연결된 지정된 유형 및 관계의 개체를 가져옵니다.
 *
 * @param {IModelObject[]} parentBomLines
 * @param {*} pref
 * @param {*} paramPolicy
 * @returns
 */
export const expandPSOneLevel = function (parentBomLines, pref, paramPolicy) {
  let requestParam = {
    input: {
      parentBomLines: parentBomLines,
      excludeFilter: 'None',
    },
    pref: pref,
    // pref: {
    //     expItemRev: "bool",
    //     info: [{
    //         relationName: "String",
    //         relationTypeNames: "String[]"
    //     }]
    // }
  };
  return soaService.post('Cad-2007-01-StructureManagement', 'expandPSOneLevel', requestParam, paramPolicy);
};

/**
 * 리비전 규칙 가져오기
 *
 * @param {String} revRuleName - 리비전 규칙 이름 (ex. Latest Working)
 * @returns
 */
export const getRevisionRule = function (revRuleName) {
  return getRevisionRules().then((response) => {
    let revRule = null;

    response.output.forEach((element) => {
      const value = element.revRule.props.object_string.dbValues[0];
      if (revRuleName === value) {
        revRule = element.revRule;
      }
    });

    return revRule;
  });
};

/**
 * 모든 리비전 규칙 가져오기
 *
 * @returns
 */
export const getRevisionRules = function () {
  return soaService.post('Cad-2007-01-StructureManagement', 'getRevisionRules');
};

/**
 * BOMLine 제거
 *
 * @param {IModelObject[]} bomlines - This is a vector of Teamcenter::BOMLine and contains all the BOMLines that need to be deleted from an assembly/product structure
 * @returns
 */
export const removeChildrenFromParentLine = function (bomlines) {
  let requestParam = {
    bomlines: bomlines,
  };
  return soaService.post('Bom-2008-06-StructureManagement', 'removeChildrenFromParentLine', requestParam);
};

/**
 * BOMWindow 저장
 *
 * @param {IModelObject} bomWindow
 * @returns
 */
export const saveBOMWindow = function (bomWindow) {
  return saveBOMWindows([bomWindow]);
};

/**
 * BOMWindow 저장
 *
 * @param {IModelObject[]} bomWindows
 * @returns
 */
export const saveBOMWindows = function (bomWindows) {
  let requestParam = {
    bomWindows: bomWindows,
  };
  return soaService.post('Cad-2008-06-StructureManagement', 'saveBOMWindows', requestParam);
};

/**
 *
 * @param {*} bomlines
 * @returns
 */
export const togglePrecision = function (bomlines) {
  let requestParam = {
    inputs: bomlines,
  };
  return soaService.post('StructureManagement-2014-10-Structure', 'togglePrecision', requestParam);
};

/**
 * AWC BOM을 펼친다.
 * @param {*} product
 * @param {*} productContext
 * @param {*} parentElement
 * @param {*} policy
 * @returns
 */
export function getOccurrences3(product, productContext, parentElement, policy) {
  let requestParam = {
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
      focusOccurrenceInput: {
        element: {
          uid: 'AAAAAAAAAAAAAA',
          type: 'unknownType',
        },
        cloneStableIdChain: '',
      },
      filter: {
        searchFilterCategories: [],
        searchFilterMap: {},
        fetchUpdatedFilters: false,
        recipe: [],
        searchFilterFieldSortType: 'Priority',
        searchSortCriteria: [],
      },
      requestPref: {
        includePath: ['true'],
        loadTreeHierarchyThreshold: ['50'],
        displayMode: ['Tree'],
        showExplodedLines: ['false'],
        savedSessionMode: ['restore'],
        calculateFilters: ['false'],
        viewType: [''],
        startFreshNavigation: ['true'],
        defaultClientScopeUri: ['Awb0OccurrenceManagement'],
      },
      expansionCriteria: {
        expandBelow: true,
        levelNExpand: 0,
        loadTreeHierarchyThreshold: 500,
        scopeForExpandBelow: parentElement ? parentElement.uid : '',
      },
      sortCriteria: {
        propertyName: '',
        sortingOrder: '',
      },
      product: product,
      parentElement: parentElement ? parentElement.uid : '',
    },
  };
  return soaService.post('Internal-ActiveWorkspaceBom-2019-12-OccurrenceManagement', 'getOccurrences3', requestParam, policy);
}

/**
 * 특정 clientScopeUri 대상으로 TableViewModelProperty를 가져온다.
 * @param {*} objectUids
 * @param {*} policy
 * @param {*} clientScopeURI
 * @param {*} columns
 * @returns
 */
function getTableViewModelProperties(
  objectUids,
  policy,
  clientScopeURI = 'Awb0OccurrenceManagement',
  columns = [
    'Awb0ConditionalElement.awb0PendingAction',
    'Awb0PositionedElement.pma1UpdateAction',
    'Awb0DesignElement.pma1LastAlignedPart',
    'Awb0DesignElement.REF(pma1LastAlignedPart,ItemRevision).release_status_list',
    'Awb0PartElement.pma1LastAlignedDesign',
    'Awb0PartElement.REF(pma1LastAlignedDesign,ItemRevision).release_status_list',
    'Awb0ConditionalElement.awb0MarkupType',
  ],
) {
  const requestParam = {
    input: {
      objectUids: objectUids,
      columnConfigInput: {
        clientName: 'AWClient',
        hostingClientName: '',
        clientScopeURI: clientScopeURI,
        operationType: 'Union',
        columnsToExclude: columns,
      },
      requestPreference: {
        typesToInclude: ['Awb0DesignElement'],
      },
    },
  };
  return soaService.post('Internal-AWS2-2017-12-DataManagement', 'getTableViewModelProperties', requestParam, policy);
}

/**
 *
 * @param {*} date
 * @returns
 */
export function dateTo_GMTString(date) {
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
 * ViewModelObject를 대상으로 특정 속성에 값을 저장한다.
 * 일반적으로 dbValue와 uiValue가 다른 경우는 드물지만,
 * UiValue 가 별도로 지정되는 경우에는 uiValues에도 값을 넣어야한다.
 * @param {*} loadedVMObjects
 * @param {*} properties
 * @param {*} values
 * @param {*} policy
 * @param {*} uiValues
 * @returns
 */
export function saveViewModelEditAndSubmitWorkflow2(loadedVMObjects, properties, values, policy, uiValues) {
  const requestParam = {
    inputs: [],
  };
  for (const vmo of loadedVMObjects) {
    let input = {
      obj: {
        uid: vmo.uid,
        type: vmo.type,
      },
      viewModelProperties: [],
      isPessimisticLock: false,
      workflowData: {},
    };
    for (let i = 0; i < properties.length; i++) {
      let viewModelProperty = {
        propertyName: properties[i],
        dbValues: [values[i]],
        uiValues: uiValues ? uiValues[i] : [values[i]],
        intermediateObjectUids: [],
        srcObjLsd: dateTo_GMTString(new Date()),
        // srcObjLsd: "2022-10-27T16:30:30+09:00",
        isModifiable: true,
      };
      input.viewModelProperties.push(viewModelProperty);
    }
    requestParam.inputs.push(input);
  }
  return soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', requestParam, policy);
}

/**
 *
 * @param {*} parentOccurrenceId
 * @param {*} policy
 * @returns
 */
export function saveUserWorkingContextState2(parentOccurrenceId, policy) {
  let requestParam = {
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
  return soaService.post('Internal-ActiveWorkspaceBom-2019-06-OccurrenceManagement', 'saveUserWorkingContextState2', requestParam, policy);
}
export default exports = {
  add,
  closeBOMWindow,
  closeBOMWindows,
  createBOMWindow,
  cutItems,
  duplicate,
  duplicateFromItem,
  expandPSAllLevels,
  expandPSOneLevel,
  getRevisionRule,
  getRevisionRules,
  removeChildrenFromParentLine,
  saveBOMWindow,
  saveBOMWindows,
  duplicateFromItemRev,
  togglePrecision,
  getOccurrences3,
  getTableViewModelProperties,
  dateTo_GMTString,
  saveUserWorkingContextState2,
  saveViewModelEditAndSubmitWorkflow2,
};
app.factory('lgepBomUtils', () => exports);
