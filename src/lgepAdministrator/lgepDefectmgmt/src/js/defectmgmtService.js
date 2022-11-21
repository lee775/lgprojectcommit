import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import vmoService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';

let tableSearchresult;
let tableResult = [];

export async function defectMgmtTree() {
  // let defectManagement = "wmiJNEHAZx_JkD";
  let defectManagement = 'wqrJdOqOZx_JkD';

  return {
    result: undefined,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Failure');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let firstCheck = false;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = homeFolder;
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }
  let loadObj;
  try {
    let getPropertiesParam = {
      uids: [homeUid],
    };
    loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }
  let treeObj = loadObj.modelObjects[homeUid];

  try {
    let getPropertiesParam = {
      objects: [treeObj],
      attributes: ['contents'],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let response = com.getObject(treeObj.props.contents.dbValues);

  try {
    let getPropertiesParam = {
      objects: response,
      attributes: [
        'object_string',
        'contents',
        'object_desc',
        'fnd0InProcess',
        'ics_subclass_name',
        'object_type',
        'checked_out',
        'owning_user',
        'owning_group',
        'last_mod_date',
        'release_statuses',
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if (treeNode.type == 'L2_ClsfyMgmtFolder' || treeNode.type == 'Folder') {
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.object_string.dbValue,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      Object.assign(vmo, temp);
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

  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
}

async function getChildrenData(data, ctx, eventTable) {
  if (eventTable.selectedObjects.length != 0) {
    let userid = com.getObject(eventTable.selectedObjects[0].uid);

    try {
      let getResult = {
        objects: [userid],
        attributes: [
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
        ],
      };

      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }

    let getHomeChildren = userid.props.contents.dbValues;

    let getInfoHomeChildren = com.getObject(getHomeChildren);

    let revisionUid = [];

    try {
      let getResult = {
        objects: getInfoHomeChildren,
        attributes: ['object_name', 'revision_list', 'contents'],
      };
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }
    let specManageSrc = [];

    for (let i = 0; i < getInfoHomeChildren.length; i++) {
      specManageSrc.push(getInfoHomeChildren[i]);
    }

    try {
      let getResult = {
        objects: specManageSrc,
        attributes: [
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
        ],
      };

      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }

    if (tableSearchresult !== undefined) {
      if (tableSearchresult == null) {
        return {
          totalFound: 0,
          example: null,
        };
      }
      let arr = [];
      specManageSrc = specManageSrc.filter((element, index) => {
        return specManageSrc.indexOf(element) === index;
      });
      _.forEach(specManageSrc, function (value) {
        arr.push(vmoService.constructViewModelObjectFromModelObject(value));
      });
      data.dataProviders.defectMgmtTableDataProvider.viewModelCollection.setViewModelObjects(arr);
    } else if (tableSearchresult == undefined) {
      let arr = [];
      specManageSrc = specManageSrc.filter((element, index) => {
        return specManageSrc.indexOf(element) === index;
      });
      _.forEach(specManageSrc, function (value) {
        arr.push(vmoService.constructViewModelObjectFromModelObject(value));
      });
      data.dataProviders.defectMgmtTableDataProvider.viewModelCollection.setViewModelObjects(arr);
    }
  } else if (eventTable.selectedObjects.length == 0) {
    return {
      totalFound: 0,
      example: null,
    };
  }
}

function reload() {
  eventBus.publish('defectMgmtTable.plTable.clientRefresh');
}

function sortAction(response, sortCriteria, startIndex, pageSize, columnFilters) {
  let countries = tableResult;
  if (countries == null) {
    return null;
  } else {
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

    let searchResults = countries.slice(startIndex, endIndex);

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
export let getFilterFacets = function (response, columnFilters, fullData) {
  var countries = response.example.flat();
  var updateFilters = fullData.columnFilters;
  var columnName = fullData.column.name;
  var facetValues = {
    values: [],
    totalFound: 0,
  };

  // This mocks the server filtering data using existing column filters
  if (columnFilters) {
    // Apply filtering
    _.forEach(columnFilters, function (columnFilter) {
      if (columnName !== columnFilter.columnName) {
        countries = createFilters(columnFilter, countries);
      }
    });
  }

  // This is mocking the server filtering data using temporary information on the individual column menu
  if (updateFilters) {
    _.forEach(updateFilters, function (columnFilter) {
      countries = createFilters(columnFilter, countries);
    });
  }

  var facetsToReturn = [];

  _.forEach(countries, function (country) {
    if (country.props[columnName].displayValue) {
      facetsToReturn.push(country.props[columnName].displayValue);
    } else if (country.props[columnName].displayValues) {
      _.forEach(country.props[columnName].displayValues, function (value) {
        facetsToReturn.push(value);
      });
    } else {
      facetsToReturn.push('');
    }
  });

  facetsToReturn = _.uniq(facetsToReturn);

  facetValues.totalFound = facetsToReturn.length;

  var startIndex = fullData.startIndex;
  var endIndex = startIndex + fullData.maxToReturn;

  facetsToReturn = facetsToReturn.slice(startIndex, endIndex + 1);

  facetValues.values = facetsToReturn;

  return facetValues;
};

/**
 * This function is intentionally serving as a bypass function to set the column filters
 * on data section. In real world applications, this should not be needed as getting data based on column
 * filter facets will happen on the server. Since showcase doesn't have any backend, we are splitting
 * the logic into two functions.
 *
 * @param {Object} fullData - The current column menu filter data to refine facets
 * @returns {Object} the current column menu filter data
 */
export let getFilterFacetData = function (fullData) {
  return fullData;
};

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
  data.classificationLbl.uiValue = data.dataProviders.defectMgmtTreeDataProvider.selectedObjects[0].displayName;
}

export async function getSelectDefectList(ctx, data) {
  const defectMgmtData = vms.getViewModelUsingElement(document.getElementById('defectMgmtData'));
  let searchData = defectMgmtData.provider.crumbs;
  let returnValue = data.eventData.displayName;
  for (let i of searchData) {
    if (i.displayName == returnValue) {
      returnValue = i.crumbsValue;
      break;
    }
  }
  if (returnValue == undefined || returnValue == null) {
    // let divisionUID = ctx.userSession.props.group.value;
    let tempUid = await lgepPreferenceUtils.getPreference('L2_Defect_Classification_Folder');
    let homeFolderUID = tempUid.Preferences.prefs[0].values[0].value;
    let homeFolder = com.getObject(homeFolderUID);

    let divisionUID = [];
    for (let i = 0; i < homeFolder.props.contents.dbValues.length; i++) {
      divisionUID.push(homeFolder.props.contents.dbValues[i]);
    }

    let division = com.getObject(divisionUID);

    returnValue = division;
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
    defectMgmtBreadcrumList: returnViewModel,
    totalFound: returnValue.length,
  };
}

export async function breadcrumListDataSelect(data) {
  const defectTreeData = vms.getViewModelUsingElement(document.getElementById('defectTree'));
  let selectedListData = data.eventData.selectedObjects[0];
  let selectExpectedData;
  for (let i of defectTreeData.dataProviders.defectMgmtTreeDataProvider.viewModelCollection.loadedVMObjects) {
    if (selectedListData.uid == i.uid) {
      selectExpectedData = i;
      break;
    }
  }
  await defectTreeData.dataProviders.defectMgmtTreeDataProvider.selectionModel.selectNone();
  await defectTreeData.dataProviders.defectMgmtTreeDataProvider.selectionModel.addToSelection(selectExpectedData);
}

async function dataLoad() {
  return {
    result: undefined,
  };
}

let exports = {};

export default exports = {
  defectMgmtTree,
  dataLoad,
  getChildrenData,
  getFilterFacets,
  getFilterFacetData,
  loadEmployeeTreeTableData,
  reload,
  sortAction,
  breadcrumListDataSelect,
  getSelectDefectList,
  makeGroupBreadcrumb,
  makeBreadcrumb,
};

app.factory('defectmgmtService', () => exports);
