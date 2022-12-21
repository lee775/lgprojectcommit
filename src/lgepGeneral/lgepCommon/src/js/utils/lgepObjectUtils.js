// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import appCtxService from 'js/appCtxService';
import cdm from 'soa/kernel/clientDataModel';
import lgepTcConstants from 'js/constants/lgepTcConstants';
import logger from 'js/logger';
import soaService from 'soa/kernel/soaService';

let exports = {};

/**
 *
 * @param {IModelObject} parentObj - A parent object to which the child objects would be added or removed.
 * @param {IModelObject[]} childrenObj - List of objects which are added or removed as children to parent object.
 * @param {String} propertyName - The name of the property that relates the child objects to the parent.
 *                                The property can be a relation property or reference property or empty.
 * @returns
 */
export const addChildren = function (parentObj, childrenObj, propertyName) {
  let requestParam = {
    inputData: [
      {
        // clientId: "String",
        parentObj: parentObj,
        childrenObj: childrenObj,
        propertyName: propertyName,
      },
    ],
  };
  return soaService.post('Core-2014-10-DataManagement', 'addChildren', requestParam);
};

/**
 * 체크 아웃 취소
 *
 * @param {IModelObject[]} objects
 * @returns
 */
export const cancelCheckout = function (objects) {
  let requestParam = {
    objects: objects,
  };
  return soaService.post('Core-2006-03-Reservation', 'cancelCheckout', requestParam);
};

/**
 * 소유자 변경
 *
 * @param {IModelObject} object - Teamcenter Business object.
 * @param {IModelObject} owner - New owning user of the business object.
 * @param {IModelObject} group - New owning group of the business object.
 * @returns
 */
export const changeOwnership = function (object, owner, group) {
  let requestParam = {
    input: [
      {
        object: object,
        owner: owner,
        group: group,
      },
    ],
  };
  return soaService.post('Core-2006-03-DataManagement', 'changeOwnership', requestParam);
};

/**
 * 액세스 권한 판정
 *
 * @param {IModelObject} groupMember - The GroupMember whose access privileges on the given business objects need to be determined.
 * @param {IModelObject[]} objects - The list of business objects on which access privileges are being evaluated for the given groupMember.
 *                                   The business object can be any POM_object.
 * @param {String[]} privilegeNames - This is a list of valid Access Manager privilege names whose verdicts for the given groupMember on the given business objects need to be determined.
 *                                    The privilege names must be the internal names.
 *
 *                                    ADD_CONTENT, ASSIGN_TO_PROJECT, Administer_ADA_Licenses, BATCH_PRINT, CHANGE, CHANGE_OWNER, CICO, COPY
 *                                    DELETE, DEMOTE, DIGITAL_SIGN, EXPORT, IMPORT, IP_ADMIN, IP_Classifier, ITAR_ADMIN, ITAR_Classifier
 *                                    MARKUP, PROMOTE, PUBLISH, READ, REMOTE_CICO, REMOVE_CONTENT, REMOVE_FROM_PROJECT, SUBSCRIBE
 *                                    TRANSFER_IN, TRANSFER_OUT, TRANSLATION, UNMANAGE, WRITE, WRITE_ICOS
 * @returns
 */
export const checkAccessorsPrivileges = function (groupMember, objects, privilegeNames) {
  let requestParam = {
    groupMember: groupMember,
    objects: objects,
    privilegeNames: privilegeNames,
  };
  return soaService.post('Administration-2006-03-IRM', 'checkAccessorsPrivileges', requestParam);
};

/**
 * 삭제 권한 여부
 *
 * @param {IModelObject} object
 * @returns
 */
export const checkDeletePrivilege = function (object) {
  return checkAccessorsPrivileges(cdm.getGroupMember(), [object], ['DELETE']).then((response) => {
    return response.privilegeReports[0].privilegeInfos[0].verdict;
  });
};

/**
 * 쓰기 권한 여부
 *
 * @param {IModelObject} object
 * @returns
 */
export const checkWritePrivilege = function (object) {
  return checkAccessorsPrivileges(cdm.getGroupMember(), [object], ['WRITE']).then((response) => {
    return response.privilegeReports[0].privilegeInfos[0].verdict;
  });
};

/**
 * 체크인
 *
 * @param {IModelObject[]} objects - Set of previously checked-out valid business objects. (e.g. Dataset, Item ItemRevision)
 * @returns
 */
export const checkin = function (objects) {
  let requestParam = {
    objects: objects,
  };
  return soaService.post('Core-2006-03-Reservation', 'checkin', requestParam);
};

/**
 * 체크아웃
 *
 * @param {IModelObject[]} objects - A list of business objects to be checked out.
 * @param {String} comment - A comment describing the reason for the check-out. An empty string is allowed.
 * @param {String} changeId - A string value to identify the change. Empty string allowed.
 * @returns
 */
export const checkout = function (objects, comment, changeId) {
  let requestParam = {
    objects: objects,
    comment: comment,
    changeId: changeId,
  };
  return soaService.post('Core-2006-03-Reservation', 'checkout', requestParam);
};

/**
 *
 * @param {String} name - 이름
 * @param {String} description - 설명
 * @param {IModelObject} container - 부모
 * @param {String} relationType - 관계
 * @returns
 */
export const createFolder = function (name, description, container, relationType = 'contents') {
  let requestParam = {
    folders: [
      {
        // clientId: "String",
        name: name,
        desc: description,
      },
    ],
    container: container ? container : '',
    relationType: container ? relationType : '',
  };
  return soaService.post('Core-2006-03-DataManagement', 'createFolders', requestParam);
};

/**
 *
 * @param {String} itemId - 아이템 아이디 (빈 값으로 줄 경우 자동 채번됨)
 * @param {String} type - 유형
 * @param {String} name - 이름
 * @param {String} description - 설명
 * @param {IModelObject} container - 부모
 * @param {String} relationType - 관계(부모와 생성될 오브젝트의 관계)
 * @returns
 */
export const createItem = function (itemId, type, name, description, container, relationType = 'contents') {
  let requestParam = {
    properties: [
      {
        // clientId: "String",
        itemId: itemId,
        type: type,
        name: name,
        description: description,
        // revId: "String",
        // uom: "String",
        /* extendedAttributes: [
                {
                    objectType: "String",
                    attributes: {
                        SampleStringKey: "String"
                    }
                }
            ] */
      },
    ],
    container: container ? container : '',
    relationType: container ? relationType : '',
  };
  return soaService
    .post('Core-2006-03-DataManagement', 'createItems', requestParam)
    .then((response) => {
      return response;
    })
    .catch((e) => {
      logger.error(e.message);
    });
};

/**
 *
 */
export const createAttachAndSubmitObjects = function (boName, propertyNameValues, revPropertyNameValues) {
  let requestParam = {
    inputs: [
      {
        // clientId: "String",
        createData: {
          boName: boName,
          propertyNameValues: propertyNameValues,
          compoundCreateInput: revPropertyNameValues
            ? {
                revision: [
                  {
                    boName: boName + 'Revision',
                    propertyNameValues: revPropertyNameValues,
                    compoundCreateInput: {},
                  },
                ],
              }
            : undefined,
        },
      },
    ],
  };
  return soaService.post('Core-2016-09-DataManagement', 'createAttachAndSubmitObjects', requestParam);
};

/**
 *
 * @param {String} boName - Business Object type name.
 * @param {String/String[]} propertyNameValues - Map (string/list of strings) of property name (key) and to property values (values) in string format, to be set on new object being created. Note: The calling client is responsible for converting the different property types (int, float, date .etc) to a string using the appropriate function(s) in the client framework Property class (i.e. Property.toDateString).
 * @param {IModelObject} targetObject - Target to which the created object will be pasted.
 */
export const createRelateAndSubmitObjects2 = function (boName, propertyNameValues, targetObject) {
  let requestParam = {
    createInputs: [
      {
        // clientId: "String",
        createData: {
          boName: boName,
          propertyNameValues: propertyNameValues,
          // compoundCreateInput: {
          //     SampleStringKey: [{
          //         boName: "String",
          //         propertyNameValues: {
          //             SampleStringKey: "String[]"
          //         },
          //         compoundCreateInput: "Teamcenter::Soa::Core::_2015_07::DataManagement::CreateInputMap2"
          //     }]
          // }
        },
        // dataToBeRelated: {
        //     SampleStringKey: "String[]"
        // },
        // workflowData: {
        //     SampleStringKey: "String[]"
        // },
        targetObject: targetObject,
        // pasteProp: "String"
      },
    ],
  };
  return soaService.post('Core-2015-07-DataManagement', 'createRelateAndSubmitObjects2', requestParam);
};

/**
 *
 * @param {String} relationType
 * @param {IModelObject} primaryObject
 * @param {IModelObject} secondaryObject
 * @param {IModelObject} userData
 * @returns
 */
export const createRelation = function (relationType, primaryObject, secondaryObject, userData, policy) {
  let requestParam = {
    input: [
      {
        // clientId: "String",
        relationType: relationType,
        primaryObject: primaryObject,
        secondaryObject: secondaryObject,
        userData: userData,
      },
    ],
  };
  return soaService.post('Core-2006-03-DataManagement', 'createRelations', requestParam, policy);
};

/**
 * This operation deletes the input objects.
 *
 * @param {IModelObject} object
 * @returns
 */
export const deleteObject = function (object) {
  return deleteObjects([object]);
};

/**
 * This operation deletes the input objects.
 * In the case of Item, it also deletes all ItemRevision objects, associated ItemMaster, ItemRevisionMaster forms, and Dataset objects
 * The input object can be an ImanRelation.
 *
 * @param {IModelObject[]} objects
 * @returns
 */
export const deleteObjects = function (objects) {
  let requestParam = {
    objects: objects,
  };
  return soaService.post('Core-2006-03-DataManagement', 'deleteObjects', requestParam);
};

/**
 * Deletes the specified relation between the primary and secondary object for each input structure.
 *
 * @param {String} relationType - Name of the relation type to create, required.
 *                                This could be an empty string, in which case the relation name will be searched in the preference, ParentTypeName_ChildTypeName_default_relation or ParentTypeName_default_relation.
 * @param {IModelObject} primaryObject - The primary object to create the relation from
 * @param {IModelObject} secondaryObject - The secondary object to create the relation to.
 * @returns
 */
export const deleteRelations = function (relationType, primaryObject, secondaryObject) {
  let requestParam = {
    input: [
      {
        // clientId: "String",
        relationType: relationType,
        primaryObject: primaryObject,
        secondaryObject: secondaryObject,
        // userData: "IModelObject"
      },
    ],
  };
  return soaService.post('Core-2006-03-DataManagement', 'deleteRelations', requestParam);
};

/**
 * 하위 비즈니스 개체 이름과 입력으로 제공된 각 기본 비즈니스 개체에 대한 표시 이름을 반환합니다.
 *
 * @param {String} boTypeName - Primary Business Object name for which hierarchies of displayable Business Objects are returned.
 * @param {String[]} exclusionBOTypeNames - List of Business Object names to be excluded from the returned list.
 * @returns
 */
export const findDisplayableSubBusinessObjectsWithDisplayNames = function (boTypeName, exclusionBOTypeNames) {
  let requestParam = {
    input: [
      {
        boTypeName: boTypeName,
        exclusionBOTypeNames: exclusionBOTypeNames,
      },
    ],
  };
  return soaService.post('Core-2010-04-DataManagement', 'findDisplayableSubBusinessObjectsWithDisplayNames', requestParam);
};

/**
 *
 * @param {IModelObject} item
 * @returns
 */
export const generateRevisionIds = function (item) {
  let requestParam = {
    input: [
      {
        item: item,
        itemType: item.modelType.name,
      },
    ],
  };
  return soaService.post('Core-2006-03-DataManagement', 'generateRevisionIds', requestParam).then((response) => {
    return response.outputRevisionIds[0].newRevId;
  });
};

/**
 *
 * @param {IModelObject} obj - The object for which to retrieve children.
 * @param {String[]} propertyNames - The properties to use to retrieve children.
 *                                   Only the properties defined in this list are used.
 *                                   If this list is empty then the children are returned based on the _DefaultChildProperties and _PseudoFolders preferences.
 * @returns
 */
export const getChildren = function (obj, propertyNames) {
  let requestParam = {
    inputs: [
      {
        // clientId: "String",
        obj: obj,
        propertyNames: propertyNames,
      },
    ],
  };
  return soaService.post('Core-2013-05-DataManagement', 'getChildren', requestParam);
};

/**
 *
 * @returns
 */
export const getHomeFolder = function () {
  const ctx = appCtxService.ctx;
  if (ctx.user.props.home_folder) {
    return getObject(ctx.user.props.home_folder.dbValue);
  }

  const user = getObject(ctx.user.uid);
  return getProperties(user, 'home_folder').then(() => {
    return getObject(user.props.home_folder.dbValues[0]);
  });
};

/**
 * LOV 가져오기 (ex. getInitialLOVValues("Item", "Create", "owning_group"))
 *
 * @param {String} boName - Name of the source business object.
 *                     For example, Item is the source business object for Item Descriptors.
 *                     If the owningObject is not null, then it can be empty.
 *                     Server can determine the business object name from the owningObject.
 *                     It is mandatory for Create operation where owningObject is null
 * @param {String} operationName - Name of the operation being performed.
 *                            Valid names are Create, Revise, SaveAs, Edit, Search, Save
 * @param {String} propertyName - The name of the Property for which LOV is being evaluated.
 * @returns
 */
export const getInitialLOVValues = function (boName, operationName = 'Create', propertyName) {
  let soaInputParam = {
    initialData: {
      propertyName: propertyName,
      filterData: {
        filterString: '',
        maxResults: 2000,
        numberToReturn: 25,
        order: 1,
        sortPropertyName: '',
      },
      lov: {
        uid: 'AAAAAAAAAAAAAA',
        type: 'unknownType',
      },
      lovInput: {
        owningObject: null,
        operationName: operationName,
        boName: boName,
        propertyValues: {},
      },
    },
  };
  return soaService.post('Core-2013-05-LOV', 'getInitialLOVValues', soaInputParam);
};

/**
 *
 * @param {IModelObject} itemRevision
 * @returns
 */
export const getItemByItemRevision = async function (itemRevision) {
  if (!itemRevision.props.items_tag) {
    await getProperties(itemRevision, 'items_tag');
  }

  return getObject(itemRevision.props.items_tag.dbValues[0]);
};

/**
 *
 * @param {String/String} itemAttributes - {item_id: xxxxxx}
 * @param {*} nRev -
 *                   nRev < 0 retrieve all available ItemRevision objects
 *                   nRev = 0 retrieve no ItemRevision objects
 *                   nRev > 0 retrieve the most recent nRev number of ItemRevision objects
 * @param {*} prefs
 * @returns
 */
export const getItemFromAttribute = function (itemAttributes, nRev = -1, prefs) {
  let requestParam = {
    infos: [
      {
        itemAttributes: itemAttributes,
        // revIds: "String[]"
      },
    ],
    nRev: nRev,
    pref: {
      // prefs: [{
      //     relationTypeName: "String",
      //     objectTypeNames: "String[]"
      // }]
      prefs: prefs,
    },
  };
  return soaService.post('Core-2009-10-DataManagement', 'getItemFromAttribute', requestParam).then((response) => {
    return response.output[0];
  });
};

/**
 *
 * @param {String} itemId
 * @returns
 */
export const getItemFromId = function (itemId) {
  let requestParam = {
    infos: [
      {
        itemId: itemId,
        // revIds: "String[]",
      },
    ],
    // nRev: "int",
    // pref: {
    //     prefs: [{
    //         relationTypeName: "String",
    //         objectTypeNames: "String[]"
    //     }]
    // }
  };
  return soaService.post('Core-2007-01-DataManagement', 'getItemFromId', requestParam).then((response) => {
    return response.output[0].item;
  });
};

/**
 * 최신 아이템 리비전 가져오기
 *
 * @param {IModelObject} item
 * @returns
 */
export const getLatestItemRevision = function (item) {
  if (item.props.item_id) {
    return getLatestItemRevisionByItemId(item.props.item_id.dbValues[0]);
  }

  return getProperties(item, lgepTcConstants.PROP_ITEM_ID).then(() => {
    return getLatestItemRevisionByItemId(item.props.item_id.dbValues[0]);
  });
};

/**
 * 최신 아이템 리비전 가져오기
 * @param {String} itemId
 * @returns
 */
export const getLatestItemRevisionByItemId = function (itemId) {
  return getItemFromAttribute(
    {
      item_id: itemId,
    },
    1,
  ).then((response) => {
    return response.itemRevOutput[0].itemRevision;
  });
};

/**
 * 최신 릴리스 아이템 리비전 가져오기
 * @param {String} itemId
 * @returns
 */
export const getLatestReleasedItemRevision = function (itemId) {
  return getItemFromAttribute({
    item_id: itemId,
  }).then((response) => {
    let latestReleasedItemRevision = null;

    const itemRevOutputs = response.itemRevOutput;
    if (itemRevOutputs || itemRevOutputs.length > 0) {
      itemRevOutputs.forEach((itemRevOutput) => {
        const itemRevision = itemRevOutput.itemRevision;
        const release_status_list = itemRevision.props.release_status_list.dbValues[0];
        if (release_status_list) {
          latestReleasedItemRevision = itemRevision;
        }
      });
    }

    return latestReleasedItemRevision;
  });
};

/**
 * 아이디 할당
 *
 * @param {String} typeName - 유형 (Item)
 * @param {String} propName - 속성 (item_id)
 * @param {String} pattern - 패턴 ('"XX-"nnnnnnnnn')
 * @returns
 */
export const getNextIds = function (typeName, propName, pattern) {
  let requestParam = {
    vInfoForNextId: [
      {
        typeName: typeName,
        propName: propName,
        pattern: pattern,
      },
    ],
  };
  return soaService.post('Core-2008-06-DataManagement', 'getNextIds', requestParam).then((response) => {
    return response.nextIds[0];
  });
};

/**
 * Get model object.
 *
 * @param {String} uid - UID of ModelObject
 * @returns {ModelObject} The ModelObject; null if not cached
 */
export const getObject = function (uid) {
  if (Array.isArray(uid)) return getObjects(uid); //기존 모듈 호환을 위하여 업데이트
  return cdm.getObject(uid);
};

/**
 * Get model objects.
 *
 * @param {String[]} uids - array of ModelObject UIDs
 * @return {ModelObject} The ModelObject Array; null if not cached
 */
export const getObjects = function (uids) {
  return cdm.getObjects(uids);
};

/**
 * 액세스 권한에 대한 내부 이름과 해당 표시 값을 가져오기
 *
 * @returns
 */
export const getPrivilegeNames = function () {
  return soaService.post('Administration-2010-04-IRM', 'getPrivilegeNames').then((response) => {
    return response.privNameInfos;
  });
};

/**
 * 속성 가져오기
 *
 * @param {IModelObject[]} modelObjects
 * @param {String[]} attributeNames
 * @returns
 */
export const getProperties = function (modelObjects, attributeNames) {
  if (!Array.isArray(modelObjects)) {
    modelObjects = [modelObjects];
  }
  if (!Array.isArray(attributeNames)) {
    attributeNames = [attributeNames];
  }

  let requestParam = {
    objects: modelObjects,
    attributes: attributeNames,
  };
  return soaService.post('Core-2006-03-DataManagement', 'getProperties', requestParam);
};

/**
 * Session 정보 가져오기
 *
 * @returns
 */
export const getTCSessionInfo = function () {
  return soaService.post('Core-2007-01-Session', 'getTCSessionInfo');
};

/**
 * 객체가 어떤 타입인지를 검사하는 함수.
 *
 * @param {IModelObject} modelObject
 * @param {String} typeName
 * @returns
 */
export const instanceOf = function (modelObject, typeName) {
  if (!modelObject) {
    return false;
  }

  let typeHierarchyArray = modelObject.modelType.typeHierarchyArray;
  if (typeHierarchyArray.includes('Awb0Element')) {
    modelObject = getObject(modelObject.props.awb0UnderlyingObject.dbValues[0]);
    typeHierarchyArray = modelObject.modelType.typeHierarchyArray;
  }

  if (typeHierarchyArray.includes(typeName)) {
    return true;
  }

  return false;
};

/**
 * 결재중 여부
 *
 * @param {*} obj
 * @returns
 */
export const isInProcess = async function (obj) {
  if (!obj.props.fnd0InProcess) {
    await getProperties(obj, lgepTcConstants.PROP_FND0INPROCESS);
  }

  if (obj.props.fnd0InProcess.dbValues[0] === '1') {
    return true;
  } else {
    return false;
  }
};

/**
 * 릴리스 여부
 * @param {*} obj
 * @returns
 */
export const isReleased = async function (obj) {
  if (!obj.props.release_status_list) {
    await getProperties(obj, lgepTcConstants.PROP_RELEASE_STATUS_LIST);
  }

  if (obj.props.release_status_list.dbValues.length > 0) {
    return true;
  }

  return false;
};

/**
 * 개체 가져오기
 *
 * @param {String} uid
 * @param {*} propertyPolicy
 * @returns
 */
export const loadObject = function (uid, propertyPolicy) {
  return loadObjects([uid], propertyPolicy);
};

/**
 * 개체 가져오기
 *
 * @param {String} uid
 * @param {*} propertyPolicy
 * @returns
 */
export const loadObject2 = function (uid, propertyPolicy) {
  return loadObjects([uid], propertyPolicy).then((response) => {
    return response.modelObjects[uid];
  });
};

/**
 * 개체 가져오기
 *
 * @param {String[]} uids
 * @param {*} propertyPolicy - ex. {types: [{"name": "WorkspaceObject", "properties": [{name: "object_name"}, {name: "object_string"}]}], "useRefCount": false}
 * @returns
 */
export const loadObjects = function (uids, propertyPolicy) {
  let requestParam = {
    uids: uids,
  };
  return soaService.post('Core-2007-09-DataManagement', 'loadObjects', requestParam, propertyPolicy);
};

/**
 * 개체 가져오기
 *
 * @param {String[]} uids
 * @param {*} propertyPolicy
 * @returns
 */
export const loadObjects2 = function (uids, propertyPolicy) {
  return loadObjects(uids, propertyPolicy).then((response) => {
    return response.modelObjects;
  });
};

/**
 * 데이터베이스에서 개체의 메모리 내 표현을 다시 로드하는 데 사용됩니다.
 *
 * @param {IModelObject} object
 * @returns
 */
export const refreshObject = function (object) {
  return refreshObjects([object]);
};

/**
 * 데이터베이스에서 개체의 메모리 내 표현을 다시 로드하는 데 사용됩니다.
 *
 * @param {IModelObject[]} objects
 * @returns
 */
export const refreshObjects = function (objects) {
  let requestParam = {
    objects: objects,
  };
  return soaService.post('Core-2007-01-DataManagement', 'refreshObjects', requestParam);
};

/**
 * 관계 또는 참조 속성으로 관련될 수 있는 상위 개체 목록에 대한 하위 개체 목록을 제거합니다.
 * 속성 이름이 입력으로 제공되지 않으면 ParentTypeName>_ChildTypeName>_default_relation에서 지정한 부모와 자식 간의 기본 관계 속성이 사용됩니다.
 *
 * @param {IModelObject} parentObj - A parent object to which the child objects would be added or removed.
 * @param {IModelObject[]} childrenObj - List of objects which are added or removed as children to parent object.
 * @param {String} propertyName - The name of the property that relates the child objects to the parent.
 *                                The property can be a relation property or reference property or empty.
 * @returns
 */
export const removeChildren = function (parentObj, childrenObj, propertyName) {
  let requestParam = {
    inputData: [
      {
        // clientId: "String",
        parentObj: parentObj,
        childrenObj: childrenObj,
        propertyName: propertyName,
      },
    ],
  };
  return soaService.post('Core-2014-10-DataManagement', 'removeChildren', requestParam);
};

/**
 * 개정
 *
 * @param {IModelObject} baseItemRevision
 * @param {String} newRevId
 * @param {String} name
 * @param {String} description
 * @returns
 */
export const revise2 = function (baseItemRevision, newRevId, name, description, policy) {
  let requestParam = {
    info: [
      {
        // clientId: "String",
        baseItemRevision: baseItemRevision,
        newRevId: newRevId,
        name: name,
        description: description,
        // deepCopyInfo: [{
        //     otherSideObjectTag: "IModelObject",
        //     relationTypeName: "String",
        //     newName: "String",
        //     action: "int",
        //     isTargetPrimary: "bool",
        //     isRequired: "bool",
        //     copyRelations: "bool"
        // }],
        // newItemRevisionMasterProperties: {
        //     form: "IModelObject",
        //     propertyValueInfo: [{
        //         propertyName: "String",
        //         propertyValues: "String[]"
        //     }]
        // }
      },
    ],
  };
  return soaService.post('Core-2008-06-DataManagement', 'revise2', requestParam, policy).then((response) => {
    return response.reviseOutputMap[''].newItemRev;
  });
};

/**
 * 개정
 *
 * @param {IModelObject} itemRevision
 * @returns
 */
export const reviseObject = function (itemRevision) {
  let requestParam = {
    reviseIn: [
      {
        targetObject: itemRevision,
      },
    ],
  };
  return soaService.post('Core-2013-05-DataManagement', 'reviseObjects', requestParam).then((response) => {
    return response.output[0].objects[0];
  });
};

/**
 * 속성 값 설정
 *
 * @param {IModelObject} modelObject
 * @param {String} attributeName
 * @param {String} value
 * @returns
 */
export const setProperty = function (modelObject, attributeName, value) {
  return setProperties(modelObject, [attributeName], [value]);
};

/**
 * 속성 값 설정
 *
 * @param {IModelObject} modelObject
 * @param {String[]} attributeNames
 * @param {String[]} values
 * @returns
 */
export const setProperties = function (modelObject, attributeNames, values, options) {
  if (attributeNames.length !== values.length) {
    return;
  }

  let vecNameVal = [];
  for (let i = 0; i < attributeNames.length; i++) {
    const attributeName = attributeNames[i];
    const value = values[i];

    vecNameVal.push({
      name: attributeName,
      values: Array.isArray(value) ? value : [value],
    });
  }
  let requestParam = {
    info: [],
    // options: "String[]"
  };
  if (options) requestParam.options = options;

  if (Array.isArray(modelObject)) {
    for (const obj of modelObject) {
      requestParam.info.push({
        object: obj,
        vecNameVal: vecNameVal,
        // timestamp: "Date"
      });
    }
  } else {
    requestParam.info.push({
      object: modelObject,
      vecNameVal: vecNameVal,
      // timestamp: "Date"
    });
  }
  return soaService.post('Core-2010-09-DataManagement', 'setProperties', requestParam);
};

/**
 * 속성 값 설정
 *
 * @param {IModelObject} modelObject
 * @param {String[]} attributeNames
 * @param {String[]} values
 * @returns
 */
export const setPropertyMultiple = function (modelObjects, attributeName, values, policy) {
  let requestParam = {
    info: [],
  };
  for (let i = 0; i < values.length; i++) {
    requestParam.info.push({
      object: modelObjects[i],
      vecNameVal: [
        {
          name: attributeName,
          values: [values[i]],
        },
      ],
    });
  }
  return soaService.post('Core-2010-09-DataManagement', 'setProperties', requestParam, policy);
};

/**
 *
 * @param {IModelObject[]} objects
 * @param {int} numLevels
 * @returns
 */
export const whereReferenced = function (objects, numLevels) {
  let requestParam = {
    objects: objects,
    numLevels: numLevels,
  };
  return soaService.post('Core-2007-01-DataManagement', 'whereReferenced', requestParam);
};

export const whereReferencedByRelationName = function (target, relationName, referenceObjectTypes, numLevel) {
  let requestParam = {
    inputs: [
      {
        object: target,
        filter: [
          {
            relationTypeName: relationName,
            otherSideObjectTypes: referenceObjectTypes,
          },
        ],
      },
    ],
    numLevels: numLevel,
  };
  return soaService.post('Core-2007-06-DataManagement', 'whereReferencedByRelationName', requestParam);
};

export const getManagedRelations = function (primaryObjects, secondaryObjects, primaryType, subType) {
  let requestParam = {
    inputdata: {
      primaryTags: primaryObjects,
      secondaryTags: secondaryObjects,
      primaryType: primaryType,
      subtype: subType,
    },
  };
  return soaService.post('Core-2008-06-ManagedRelations', 'getManagedRelations', requestParam);
};

/**
 * SOA 콜 할때 policy 넣을 때 필요한 객체를 반환
 * @param {string | string[]} properties
 * @param {string} objectType
 * @returns
 */
export function createPolicy(properties, objectType = 'WorkspaceObject') {
  properties = Array.isArray(properties) ? properties : [properties];
  let policy = {
    types: [
      {
        name: objectType,
        properties: [],
      },
    ],
    useRefCount: false,
  };
  let propertyContainer = policy.types[0].properties;
  for (const property of properties) {
    propertyContainer.push({ name: property });
  }
  return policy;
}

/**
 * SOA 콜 할때 policy 넣을 때 필요한 객체를 반환
 * @param {string | string[]} properties
 * @param {string | string[]} objectTypes
 * @returns
 */
export function createPolicies(properties, objectTypes = []) {
  properties = Array.isArray(properties) ? properties : [properties];
  let policy = {
    types: [],
    useRefCount: false,
  };
  for (const objectType of objectTypes) {
    let propertyContainer = [];
    for (const property of properties) {
      propertyContainer.push({ name: property });
    }
    policy.types.push({
      name: objectType,
      properties: propertyContainer,
    });
  }
  return policy;
}

export function createInstance(modelObject, workflowName) {
  let soaInputParam = {
    name: workflowName + ': ' + modelObject.props.object_string.dbValue,
    description: workflowName + ': ' + modelObject.props.object_string.dbValue,
    contextData: {
      attachmentCount: 1,
      attachments: [modelObject.uid],
      processTemplate: workflowName,
      attachmentTypes: [1],
    },
  };
  return soaService.post('Workflow-2008-06-Workflow', 'createInstance', soaInputParam);
}

export default exports = {
  addChildren,
  cancelCheckout,
  changeOwnership,
  checkAccessorsPrivileges,
  checkDeletePrivilege,
  checkWritePrivilege,
  checkin,
  checkout,
  createFolder,
  createItem,
  createAttachAndSubmitObjects,
  createRelateAndSubmitObjects2,
  createRelation,
  deleteObject,
  deleteObjects,
  deleteRelations,
  findDisplayableSubBusinessObjectsWithDisplayNames,
  generateRevisionIds,
  getChildren,
  getHomeFolder,
  getInitialLOVValues,
  getItemByItemRevision,
  getItemFromAttribute,
  getItemFromId,
  getLatestItemRevision,
  getLatestItemRevisionByItemId,
  getLatestReleasedItemRevision,
  getNextIds,
  getObject,
  getObjects,
  getPrivilegeNames,
  getProperties,
  getTCSessionInfo,
  instanceOf,
  isInProcess,
  isReleased,
  loadObject,
  loadObject2,
  loadObjects,
  loadObjects2,
  refreshObject,
  refreshObjects,
  removeChildren,
  revise2,
  reviseObject,
  setProperty,
  setProperties,
  setPropertyMultiple,
  whereReferenced,
  getManagedRelations,
  whereReferencedByRelationName,
  createPolicy,
  createPolicies,
  createInstance,
};
app.factory('lgepObjectUtils', () => exports);
