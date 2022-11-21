import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import viewC from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
var $ = require('jQuery');

export async function modelMgmtTable(ctx) {
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Model_Classification_Folder');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let loadObj;
  try {
    let getPropertiesParam = {
      uids: [homeFolder],
    };
    loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }
  homeFolder = loadObj.modelObjects[homeFolder];
  await com.getProperties(homeFolder, ['contents']);
  let response = com.getObject(homeFolder.props.contents.dbValues);
  let temp;
  for (let i = 0; i < response.length; i++) {
    if (response[i].props.object_string.uiValues[0] == userGroup) {
      temp = response[i];
    }
  }
  response = temp;
  await com.getProperties(response, ['contents']);
  if (response == undefined) {
    return;
  }
  response = com.getObject(response.props.contents.dbValues);
  //테이블에서 보여줄 속성 불러오는 부분
  await com.getProperties(response, ['contents']);
  return {
    result: response,
    totalFound: response.length,
  };
}

export let applySortAndFilterRows = function (response, columnFilters, sortCriteria, startIndex, pageSize) {
  var countries = response.result;
  if (columnFilters) {
    // Apply filtering
    _.forEach(columnFilters, function (columnFilter) {
      countries = createFilters(columnFilter, countries);
    });
  }

  // Apply sort
  if (sortCriteria && sortCriteria.length > 0) {
    var criteria = sortCriteria[0];
    var sortDirection = criteria.sortDirection;
    var sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      countries.sort(function (a, b) {
        if (a.props[sortColName].value <= b.props[sortColName].value) {
          return -1;
        }

        return 1;
      });
    } else if (sortDirection === 'DESC') {
      countries.sort(function (a, b) {
        if (a.props[sortColName].value >= b.props[sortColName].value) {
          return -1;
        }

        return 1;
      });
    }
  }

  var endIndex = startIndex + pageSize;

  return countries.slice(startIndex, endIndex);
};

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
  var countries = response.data.countries;
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

async function dataLoad() {
  return {
    result: undefined,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let firstCheck = false;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = 'wmiJNEHAZx_JkD';
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
  if (firstCheck) {
    let temp = [];
    for (let i = 0; i < response.length; i++) {
      if (response[i].props.object_string.uiValues[0] == userGroup) {
        temp.push(response[i]);
        //console.log("돌아써");
      }
    }
    response = temp;
  }
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
    if (treeNode.type == 'Folder') {
      let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.object_string.dbValue,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      let propsTemp = vmo.props;
      vmo.props = propsTemp;
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
          if (t.type == 'Folder') {
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

let exports = {};

export default exports = {
  dataLoad,
  loadEmployeeTreeTableData,
  modelMgmtTable,
  applySortAndFilterRows,
  getFilterFacets,
  getFilterFacetData,
};

app.factory('modelMgmtService', () => exports);
