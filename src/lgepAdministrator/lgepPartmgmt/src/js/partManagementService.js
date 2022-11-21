import app from 'app';
import com from 'js/utils/lgepObjectUtils';
import editHandlerService from 'js/editHandlerService';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import msg from 'js/utils/lgepMessagingUtils';
import appCtxService from 'js/appCtxService';
import vms from 'js/viewModelService';
import vmoService from 'js/viewModelObjectService';
import uwPropertyService from 'js/uwPropertyService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import { cancel, editing, save } from 'js/cmEditService';

let repeat = false;
let noreturn;
let count = 1;
let results = [];
export async function partMgmtTree(ctx, data) {
  // let partManagement = "wmiJNEHAZx_JkD";
  // let partManagement = "AfmJ_w4OZx_JkD";

  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  //console.log({ popData });
  //console.log({ data });
  let uid = [];
  let a = popData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects;
  let b;

  for (let i = 0; i < a.length; i++) {
    uid.push(a[i].uid);
    //console.log(Object.values(a[i].props));
    b = Object.values(a[i].props);
    uwPropertyService.setIsEditable(b, true);
    uwPropertyService.setIsPropertyModifiable(b, true);
  }
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Part');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;

  //console.log(ctx);

  let topFolder = await com.loadObject(homeFolder);

  await com.getProperties(topFolder, ['contents']);
  //console.log({topFolder});
  let underFolder = [];
  let groupFolder;
  let userGroup = appCtxService.ctx.userSession.props.group.uiValues[0];
  //console.log(userGroup);
  let tpFolder = topFolder.modelObjects[homeFolder];
  //console.log(tpFolder);
  await com.getProperties(tpFolder, ['contents']);
  for (let i = 0; i < tpFolder.props.contents.dbValues.length; i++) {
    underFolder.push(com.getObject(tpFolder.props.contents.dbValues[i]));
  }
  //console.log(underFolder);
  for (let i = 0; i < underFolder.length; i++) {
    if (underFolder[i].props.object_string.dbValues[0] === userGroup) {
      groupFolder = underFolder[i];
    }
  }
  //console.log(groupFolder);
  return {
    uid: uid,
  };
}

export async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input) {
  //console.log({ ctx });
  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));

  //console.log(appCtxService);
  let userGroup = appCtxService.ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];

  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Part');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;

  let firstCheck = false;
  let homeUid;

  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.displayName == 'top') {
    homeUid = homeFolder;
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }

  let loadObj;
  loadObj = await com.loadObject(homeUid);

  let treeObj = await com.getObject(homeUid);
  let attributesOftreeObj = ['contents'];
  await com.getProperties(treeObj, attributesOftreeObj);
  let response = await com.getObject(treeObj.props.contents.dbValues);
  if (firstCheck) {
    let temp = [];
    for (let i = 0; i < response.length; i++) {
      if (response[i].props.object_string.uiValues[0] == userGroup) {
        temp.push(response[i]);
        await com.getProperties(temp, ['contents']);
        temp = await com.getObject(temp[0].props.contents.dbValues);
      }
    }
    response = temp;
  }

  let attributesOfresponse = [
    'contents',
    'object_name',
    'object_desc',
    'fnd0InProcess',
    'ics_subclass_name',
    'object_type',
    'checked_out',
    'owning_user',
    'owning_group',
    'last_mod_date',
    'release_statuses',
  ];
  await com.getProperties(response, attributesOfresponse);

  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if (treeNode.type == 'L2_ClsfyMgmtFolder' || treeNode.type == 'Folder') {
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.object_name.dbValue,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      Object.assign(vmo, temp);
      //console.log({vmo});
      if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
        vmo.isLeaf = true;
      } else if (temp.props.contents.dbValues.length > 0) {
        let check = com.getObject(temp.props.contents.dbValues);
        if (!Array.isArray(check)) {
          check = [check];
        }
        let resultType = true;
        _.forEach(check, function (t) {
          if (t.type == 'L2_ClsfyMgmtFolder' || t.type == 'Folder') {
            resultType = false;
          }
        });
        vmo.isLeaf = resultType;
      }

      for (const prop of Object.values(vmo.props)) {
        //console.log({prop});
        uwPropertyService.setIsEditable(prop, true);
        uwPropertyService.setIsPropertyModifiable(prop, true);
      }

      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
    }
  });
  if (sortCriteria && sortCriteria.length > 0) {
    var criteria = sortCriteria[0];
    var sortDirection = criteria.sortDirection;
    var sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      viewArr.sort(function (a, b) {
        if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return 1;
        if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
        if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return -1;
      });
    } else if (sortDirection === 'DESC') {
      viewArr.sort(function (a, b) {
        if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return 1;
        if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
        if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return -1;
      });
    }
  }
  repeat = true;

  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
}

export async function addPartData(ctx, data) {
  //console.log("폴더 만들기");

  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  //console.log({ data });
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Part');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let childrenOfHome = [];
  let userName = ctx.userSession.props.group.displayValues[0];
  let folderGroup;
  let home = com.getObject(homeFolder);

  let tpFolder = home;
  for (let i = 0; i < home.props.contents.dbValues.length; i++) {
    childrenOfHome.push(com.getObject(home.props.contents.dbValues[i]));
  }
  for (let i = 0; i < childrenOfHome.length; i++) {
    if (childrenOfHome[i].props.object_string.dbValues[0] === userName) {
      folderGroup = childrenOfHome[i];
    }
  }

  let parentFolderUID;
  let folderName = data.addPartTitle.dbValue;
  let parentFolderUIDLength;

  parentFolderUIDLength = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects.length;

  let created = null;

  if (parentFolderUIDLength == 0) {
    await com.createFolder(folderName, '', folderGroup);
    eventBus.publish('partMgmtTree.plTable.reload');
  } else {
    parentFolderUID = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].uid;
    let parentFolder = await com.getObject(parentFolderUID);

    created = await com.createFolder(folderName, '', parentFolder);
    created = created.output[0].folder;
    //console.log(parentFolder);
    let vmo = vmoService.constructViewModelObjectFromModelObject(created);
    vmo.cellHeader1 = vmo.props.object_name.dbValues[0];
    vmo.cellHeader2 = vmo.props.object_name.dbValues[0] + 1;

    let beforeData;
    let beforeDataNum;
    let newLoaded1 = popData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects;
    //console.log(newLoaded1);
    for (let i = 0; i < newLoaded1.length; i++) {
      if (parentFolderUID == newLoaded1[i].uid) beforeDataNum = i;
    }

    for (let i = 0; i < newLoaded1.length; i++) {
      if (parentFolderUID == newLoaded1[i].uid) beforeData = newLoaded1[i];
    }
    beforeData.isLeaf = false;

    vmo.levelNdx = beforeData.levelNdx + 1;
    vmo.isLeaf = true;
    newLoaded1.splice(beforeDataNum + 1, 0, vmo);
  }
  // let selectedTree = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0];
  // created = created.output[0].folder;
  // let createdVmo = vmoService.constructViewModelObjectFromModelObject(created);
  // let treeVmo = treeView.createViewModelTreeNode(createdVmo.uid, createdVmo.type, createdVmo.props.object_name.dbValue, selectedTree.levelNdx + 1, selectedTree.levelNdx + 2, createdVmo.typeIconURL);
  // treeVmo.alternateID = treeVmo.uid + "," + selectedTree.alternateID;
  // selectedTree.children.push(treeVmo);
  //console.log({createdVmo});

  msg.show(
    0,
    `${folderName} 폴더가 생성되었습니다.`,
    ['닫기'],
    [
      function () {
        // popData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects.push(treeVmo);

        eventBus.publish('partMgmtTree.plTable.updated', {
          updatedObjects: popData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects,
        });
        eventBus.publish('partMgmtTree.plTable.reload');
      },
    ],
  );
}

export async function getChildrenData(ctx, data) {
  common.delay(200);
  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  //console.log(popData);
  //console.log({data});

  if (popData.dataProviders.partMgmtTreeDataProvider.selectedObjects.length == 1) {
    //console.log("예열중");
    let userid = com.getObject(popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].uid);

    let attributesOfuserid = [
      'object_string',
      'object_name',
      'contents',
      'object_type',
      'owning_group',
      'owning_user',
      'checked_out',
      'last_mod_date',
      'release_status_list',
      'IMAN_specification',
      'revision_list',
    ];
    await com.getProperties(userid, attributesOfuserid);
    let getHomeChildren = userid.props.contents.dbValues;
    let getInfoHomeChildren = com.getObject(getHomeChildren);

    let revisionUid = [];

    let attributesOfInfoHomeChildren = ['object_name', 'revision_list', 'contents'];
    await com.getProperties(getInfoHomeChildren, attributesOfInfoHomeChildren);

    let specManageSrc = [];

    if (popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].levelNdx == 0) {
      let specManageSrc = [];

      //console.log("나");

      let childContents = [];
      _.forEach(getInfoHomeChildren, function (value) {
        childContents.push(com.getObject(value.props.contents.dbValues));
      });

      childContents = childContents.flat();
      let attributesofchildContents = ['object_name', 'revision_list', 'contents'];
      await com.getProperties(childContents, attributesofchildContents);

      for (let i = 0; i < childContents.length; i++) {
        if (childContents[i].type == 'Item') {
          revisionUid.push(childContents[i].props.revision_list.dbValues[0]);
        }
      }

      for (let i = 0; i < revisionUid.length; i++) {
        specManageSrc.push(com.getObject(revisionUid[i]));
      }

      let attributesOfspecManageSrc = [
        'object_name',
        'contents',
        'object_type',
        'owning_group',
        'owning_user',
        'l2_model_name',
        'l2_division',
        'l2_model_type',
        'l2_model_maker',
        'l2_reference_models',
        'l2_reference_parts',
        'l2_spec_diameter',
        'l2_spec_length',
        'l2_spec_weight',
        'l2_spec_rpm',
        'l2_spec_voltage',
        'l2_spec_material',
        'IMAN_specification',
        'revision_list',
      ];
      await com.getProperties(specManageSrc, attributesOfspecManageSrc);
      let arr = [];
      let itemName = [];

      _.forEach(specManageSrc, function (value) {
        arr.push(value);
      });

      for (let i = 0; i < arr.length; i++) {
        uwPropertyService.setIsEditable(Object.values(arr[i].props), true);
        uwPropertyService.setIsPropertyModifiable(Object.values(arr[i].props), true);
      }
      //console.log(arr);
      return {
        example: arr,
        totalFound: arr.length,
      };
    } else if (popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].levelNdx == 1) {
      //console.log("levelNdx1");

      //console.log("여기니?");

      let getInfoHomeChildrenRevision;
      for (let i = 0; i < getInfoHomeChildren.length; i++) {
        if (getInfoHomeChildren[i].type == 'Item') {
          getInfoHomeChildrenRevision = await com.getObject(getInfoHomeChildren[i].props.revision_list.dbValues[0]);
        }
      }
      specManageSrc.push(getInfoHomeChildrenRevision);

      let attributesOfspecManageSrc = [
        'object_name',
        'contents',
        'object_type',
        'item_id',
        'owning_group',
        'owning_user',
        'l2_model_name',
        'l2_division',
        'l2_model_type',
        'l2_model_maker',
        'l2_reference_models',
        'l2_reference_parts',
        'l2_spec_diameter',
        'l2_spec_length',
        'l2_spec_weight',
        'l2_spec_rpm',
        'l2_spec_voltage',
        'l2_spec_material',
        'IMAN_specification',
        'revision_list',
      ];
      await com.getProperties(specManageSrc, attributesOfspecManageSrc);

      let arr = [];
      let itemName = [];

      _.forEach(specManageSrc, function (value) {
        arr.push(value);
      });
      //console.log(arr);

      if (arr[0] == undefined) {
        return {
          example: arr,
          totalFound: arr.length,
        };
      } else {
        for (let i = 0; i < arr.length; i++) {
          uwPropertyService.setIsEditable(Object.values(arr[i].props), true);
          uwPropertyService.setIsPropertyModifiable(Object.values(arr[i].props), true);
        }

        return {
          example: arr,
          totalFound: arr.length,
        };
      }
    }
  } else if (popData.dataProviders.partMgmtTreeDataProvider.selectedObjects.length == 0) {
    let arr = [];

    // return {
    //     result: undefined
    // }
  }
}

function reload() {
  eventBus.publish('partMgmtTable.plTable.reload');
  //console.log("tableReloaded loaded");
}

function sortAction(response, sortCriteria, startIndex, pageSize, columnFilters) {
  //  common.delay(200);
  let searchResults = [];
  //console.log(response);
  if (response == undefined) {
    return (searchResults = null);
  } else {
    let countries = [];

    countries = response.example;

    let endIndex = startIndex + pageSize;
    if (columnFilters) {
      // Apply filtering
      _.forEach(columnFilters, function (columnFilter) {
        countries = createFilters(columnFilter, countries);
      });
    }

    if (sortCriteria && sortCriteria.length > 0) {
      let criteria = sortCriteria[0];
      let sortDirection = criteria.sortDirection;
      let sortColName = criteria.fieldName;

      if (sortDirection === 'ASC') {
        countries.sort(function (a, b) {
          if (a.props[sortColName].dbValues[0] <= b.props[sortColName].dbValues[0]) {
            return -1;
          }
          return 1;
        });
      } else if (sortDirection === 'DESC') {
        countries.sort(function (a, b) {
          if (a.props[sortColName].dbValues[0] >= b.props[sortColName].dbValues[0]) {
            return -1;
          }
          return 1;
        });
      }
    }
    searchResults = countries.slice(startIndex, endIndex);

    return searchResults;
  }
}

/**
 * This function mocks the server response for the getFilterFacets action and should not
 * be implemented on client. It mocks the server filtering
 *
 * @param {Object} response - The data to filter
 * @param {Object} columnFilters - existing column filters
 * @param {Object} fullData - contains the column menu's temporary filter data to refine facets
 * @returns {Object} The facet data to display
 */
// export let getFilterFacets = function (response, columnFilters, fullData) {
//     var countries = response.example.flat();
//     var updateFilters = fullData.columnFilters;
//     var columnName = fullData.column.name;
//     var facetValues = {
//         values: [],
//         totalFound: 0
//     };

//     // This mocks the server filtering data using existing column filters
//     if (columnFilters) {
//         // Apply filtering
//         _.forEach(columnFilters, function (columnFilter) {
//             if (columnName !== columnFilter.columnName) {
//                 countries = createFilters(columnFilter, countries);
//             }
//         });
//     }

//     // This is mocking the server filtering data using temporary information on the individual column menu
//     if (updateFilters) {
//         _.forEach(updateFilters, function (columnFilter) {
//             countries = createFilters(columnFilter, countries);
//         });
//     }

//     var facetsToReturn = [];

//     _.forEach(countries, function (country) {
//         if (country.props[columnName].displayValue) {
//             facetsToReturn.push(country.props[columnName].displayValue);
//         } else if (country.props[columnName].displayValues) {
//             _.forEach(country.props[columnName].displayValues, function (value) {
//                 facetsToReturn.push(value);
//             });
//         } else {
//             facetsToReturn.push('');
//         }
//     });

//     facetsToReturn = _.uniq(facetsToReturn);

//     facetValues.totalFound = facetsToReturn.length;

//     var startIndex = fullData.startIndex;
//     var endIndex = startIndex + fullData.maxToReturn;

//     facetsToReturn = facetsToReturn.slice(startIndex, endIndex + 1);

//     facetValues.values = facetsToReturn;

//     return facetValues;
// };

/**
 * This function is intentionally serving as a bypass function to set the column filters
 * on data section. In real world applications, this should not be needed as getting data based on column
 * filter facets will happen on the server. Since showcase doesn't have any backend, we are splitting
 * the logic into two functions.
 *
 * @param {Object} fullData - The current column menu filter data to refine facets
 * @returns {Object} the current column menu filter data
 */

/**
 * This function mocks the server logic for filtering text data with the 'Contains' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processContainsFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].uiValue) {
      return country.props[columnFilter.columnName].uiValue.toLowerCase().includes(columnFilter.values[0].toLowerCase());
    } else if (country.props[columnFilter.columnName].uiValues) {
      return country.props[columnFilter.columnName].uiValues.toString().toLowerCase().includes(columnFilter.values[0].toLowerCase());
    }
  });
};

/**
 * This function mocks the server logic for filtering text data with the 'Does not contain' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processNotContainsFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].uiValue) {
      return !country.props[columnFilter.columnName].uiValue.toLowerCase().includes(columnFilter.values[0].toLowerCase());
    } else if (country.props[columnFilter.columnName].uiValues) {
      return !country.props[columnFilter.columnName].uiValues.toString().toLowerCase().includes(columnFilter.values[0].toLowerCase());
    }
  });
};

/**
 * This function mocks the server logic for filtering text data with the 'Begins with' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processStartsWithFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].uiValue) {
      return country.props[columnFilter.columnName].uiValue.toLowerCase().startsWith(columnFilter.values[0].toLowerCase());
    } else if (country.props[columnFilter.columnName].uiValues) {
      return country.props[columnFilter.columnName].uiValues[0].toLowerCase().startsWith(columnFilter.values[0].toLowerCase());
    }
  });
};

/**
 * This function mocks the server logic for filtering text data with the 'Ends with' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEndsWithFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].uiValue) {
      return country.props[columnFilter.columnName].uiValue.toLowerCase().endsWith(columnFilter.values[0].toLowerCase());
    } else if (country.props[columnFilter.columnName].uiValues) {
      return country.props[columnFilter.columnName].uiValues[0].toLowerCase().endsWith(columnFilter.values[0].toLowerCase());
    }
  });
};

/**
 * This function mocks the server logic for filtering text data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsTextFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (!country.props[columnFilter.columnName].isArray) {
        if (country.props[columnFilter.columnName].value && columnFilter.values[i]) {
          return country.props[columnFilter.columnName].value.toString().toLowerCase().includes(columnFilter.values[i].toLowerCase());
        } else if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
          return true;
        }
      } else {
        if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
          return country.props[columnFilter.columnName].uiValues.toString().toLowerCase().includes(columnFilter.values[i].toLowerCase());
        }
      }
    }
    return false;
  });
};

/**
 * This function mocks the server logic for filtering text data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processCaseSensitiveEqualsTextFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (!country.props[columnFilter.columnName].isArray) {
        if (country.props[columnFilter.columnName].value && columnFilter.values[i]) {
          return country.props[columnFilter.columnName].value.toString().includes(columnFilter.values[i]);
        } else if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
          return true;
        }
      } else {
        if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
          return country.props[columnFilter.columnName].uiValues.toString().includes(columnFilter.values[i]);
        }
      }
    }
    return false;
  });
};

/**
 * Mocks server logic for filtering Text data with 'Does not equal' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsTextFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (!country.props[columnFilter.columnName].isArray) {
        if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
          return false;
        } else if (country.props[columnFilter.columnName].uiValue && columnFilter.values[i]) {
          return !country.props[columnFilter.columnName].uiValue.toLowerCase().includes(columnFilter.values[i].toLowerCase());
        }
      } else {
        if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
          _.forEach(country.props[columnFilter.columnName].uiValues, function (uiValue) {
            //If one or more values in the array do not satisfy filter criteria, notEquals filter does not apply and the row is shown
            if (uiValue.toLowerCase() !== columnFilter.values[i].toLowerCase()) {
              return true;
            }
          });
          return false;
        }
      }
    }
    return true;
  });
};

/**
 * Mocks server logic for filtering Text facets with 'caseSensitiveNotEquals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processCaseSensitiveNotEqualsFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (!country.props[columnFilter.columnName].isArray) {
        if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
          return false;
        } else if (country.props[columnFilter.columnName].uiValue && columnFilter.values[i]) {
          return !country.props[columnFilter.columnName].uiValue.includes(columnFilter.values[i]);
        }
      } else {
        if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
          let matchFound = false;
          _.forEach(country.props[columnFilter.columnName].uiValues, function (uiValue) {
            if (uiValue !== columnFilter.values[i]) {
              matchFound = true;
            }
          });
          return matchFound;
        }
      }
    }
    return true;
  });
};

const processTextFilters = function (columnFilter, countries) {
  switch (columnFilter.operation) {
    case 'contains':
      countries = processContainsFilter(columnFilter, countries);
      break;
    case 'notContains':
      countries = processNotContainsFilter(columnFilter, countries);
      break;
    case 'startsWith':
      countries = processStartsWithFilter(columnFilter, countries);
      break;
    case 'endsWith':
      countries = processEndsWithFilter(columnFilter, countries);
      break;
    case 'equals':
      countries = processEqualsTextFilter(columnFilter, countries);
      break;
    case 'caseSensitiveEquals':
      countries = processCaseSensitiveEqualsTextFilter(columnFilter, countries);
      break;
    case 'notEquals':
      countries = processNotEqualsTextFilter(columnFilter, countries);
      break;
    case 'caseSensitiveNotEquals':
      countries = processCaseSensitiveNotEqualsFilter(columnFilter, countries);
      break;
    default:
      break;
  }
  return countries;
};

/**
 * This function mocks the server logic for filtering data using the created filters from client.
 * This is called from the main function that gets the filter facets. Since this function is mocking server logic,
 * it should not be implemented on client.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const createFilters = function (columnFilter, countries) {
  countries = processTextFilters(columnFilter, countries);
  return countries;
};

function makeGroupBreadcrumb(ctx, data) {
  data.provider.crumbs = [];
  let crumbGroupData = {
    clicked: false,
    displayName: ctx.userSession.props.group_name.dbValue,
    selectedCrumb: false,
    showArrow: true,
  };
  data.provider.crumbs.push(crumbGroupData);
}

function makeBreadcrumb(ctx, data, value) {
  let treeLevel = value.alternateID.split(',');
  treeLevel.pop();
  let treeNode = [];
  for (let i = treeLevel.length; i >= 0; i--) {
    treeNode.push(com.getObject(treeLevel[i]));
  }
  treeNode.shift();

  let locationTemp = document.getElementsByClassName('aw-layout-fxbreadCrumbs');
  let locationParent = locationTemp[1].parentNode;
  locationTemp[1].classList.add('noneToolbar');
  let moveBreadCrumbs = document.getElementById('locationToBread');

  data.provider.crumbs = [];
  let crumbGroupData = {
    clicked: false,
    displayName: ctx.userSession.props.group_name.dbValue,
    selectedCrumb: false,
    showArrow: true,
  };

  data.provider.crumbs.push(crumbGroupData);
  for (let i = 0; i < treeNode.length; i++) {
    if (i + 1 == treeNode.length) {
      data.provider.crumbs.push({
        clicked: false,
        displayName: treeNode[i].props.object_string.dbValues[0],
        selectedCrumb: true,
        showArrow: false,
        crumbsValue: treeNode[i],
      });
    } else {
      data.provider.crumbs.push({
        clicked: false,
        displayName: treeNode[i].props.object_string.dbValues[0],
        selectedCrumb: false,
        showArrow: true,
        crumbsValue: treeNode[i],
      });
    }
  }
  data.classificationLbl.uiValue = data.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].displayName;
}

export async function getSelectPartList(ctx, data) {
  const partMgmtData = vms.getViewModelUsingElement(document.getElementById('partMgmtData'));
  let searchData = partMgmtData.provider.crumbs;
  let returnValue = data.eventData.displayName;
  for (let i of searchData) {
    if (i.displayName == returnValue) {
      returnValue = i.crumbsValue;
      break;
    }
  }
  if (returnValue == undefined || returnValue == null) {
    let tempUid = await lgepPreferenceUtils.getPreference('L2_Part_Classification_Folder');
    let homeFolderUID = tempUid.Preferences.prefs[0].values[0].value;
    let homeFolder = com.getObject(homeFolderUID);

    let divisionUID;
    for (let i = 0; i < homeFolder.props.contents.dbValues.length; i++) {
      if (homeFolder.props.contents.uiValues[i] == ctx.userSession.props.group.uiValue) {
        divisionUID = homeFolder.props.contents.dbValues[i];
      }
    }

    let division = com.getObject(divisionUID);

    returnValue = com.getObject(division.props.contents.dbValues);
  } else {
    returnValue = com.getObject(returnValue.props.contents.dbValues);
  }
  let returnViewModel = [];
  for (let i of returnValue) {
    returnViewModel.push(vmoService.constructViewModelObjectFromModelObject(i));
  }
  let temp = returnViewModel;
  returnViewModel = [];
  for (let i of temp) {
    let tempItem = i;
    returnViewModel.push(tempItem);
  }

  return {
    partMgmtBreadcrumList: returnViewModel,
    totalFound: returnValue.length,
  };
}

export async function breadcrumListDataSelect(data) {
  const partTreeData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  let selectedListData = data.eventData.selectedObjects[0];
  let selectExpectedData;
  for (let i of partTreeData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects) {
    if (selectedListData.uid == i.uid) {
      selectExpectedData = i;
      break;
    }
  }
  await partTreeData.dataProviders.partMgmtTreeDataProvider.selectionModel.selectNone();
  await partTreeData.dataProviders.partMgmtTreeDataProvider.selectionModel.addToSelection(selectExpectedData);
}
async function deletePartData(data, ctx) {
  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));

  let selectedObject = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].uid;

  let getObjectofSelectedObject = await com.getObject(selectedObject);

  msg.show(
    1,
    '삭제하시겠습니까?',
    ['삭제', '취소'],
    async function () {
      await com.deleteObject(getObjectofSelectedObject);
    },
    function () {},
  );

  eventBus.publish('partMgmtTree.plTable.clientRefresh');
}

export function saveEmployeeEdits() {
  //console.log("안녕");

  let popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  let modelDa = popData.dataProviders.partMgmtTreeDataProvider.viewModelCollection.loadedVMObjects;

  for (let i = 0; i < modelDa.length; i++) {
    if (modelDa[i].props.object_desc.dbValues[0] == null) {
      com.setProperty(modelDa[i], 'object_name', modelDa[i].props.object_name.dbValues[0]);
    }
  }

  eventBus.publish('partMgmtTree.plTable.clientRefresh');
}

export function saveEmployeeItemEdits(ctx) {
  let popData = vms.getViewModelUsingElement(document.getElementById('partTableman'));
  //console.log(popData);
  let modelDa = popData.dataProviders.partMgmtTableDataProvider.viewModelCollection.loadedVMObjects;

  for (let i = 0; i < modelDa.length; i++) {
    com.setProperty(modelDa[i], 'object_name', modelDa[i].props.object_name.dbValues[0]);
    com.setProperty(modelDa[i], 'object_desc', modelDa[i].props.object_desc.dbValues[0]);
  }

  eventBus.publish('partMgmtTable.plTable.clientRefresh');
}

let exports = {};

export default exports = {
  breadcrumListDataSelect,
  getChildrenData,
  getSelectPartList,
  loadEmployeeTreeTableData,
  makeBreadcrumb,
  makeGroupBreadcrumb,
  partMgmtTree,
  addPartData,
  reload,
  sortAction,
  deletePartData,
  saveEmployeeEdits,
  saveEmployeeItemEdits,
};

app.factory('partManagementService', () => exports);
