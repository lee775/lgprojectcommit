import app from 'app';
import com from 'js/utils/lgepObjectUtils';
import vms from 'js/viewModelService';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import appCtxSvc from 'js/appCtxService';
import query from 'js/utils/lgepQueryUtils';
import popupService from 'js/popupService';
import eventBus from 'js/eventBus';
import _ from 'lodash';
import browserUtils from 'js/browserUtils';
import notySvc from 'js/NotyModule';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import dmSvc from 'soa/dataManagementService';
import common from 'js/utils/lgepCommonUtils';
var $ = require('jQuery');

let buttonYes = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'yes');
let buttonNo = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'no');
let createComment1 = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComment1');
let createComment2 = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComment2');
let createComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComplete');

let selectRelationTableColumn = null;
let resultRelation = null;
let checkOldList = [];

export async function relationItemTableLoad(data, ctx) {
  if (!ctx) {
    ctx = appCtxSvc.ctx;
  }
  let revisions = await performSearch('L2_IssuePageRevision', data, ctx);
  return {
    treeValue: revisions.modelObjects,
    totalFound: revisions.returnData.totalFound,
  };
}

export function relationing(data) {
  // selectRelationTableColumn = data.dataProviders.relationItemData.selectedObjects;
  resultRelation = selectRelationTableColumn;
}

export function setSelectedItem(data) {
  if (selectRelationTableColumn != null) {
    checkOldList = [];

    let checked = [];
    for (let check of selectRelationTableColumn) {
      for (let list of data.dataProviders.relationItemData.viewModelCollection.loadedVMObjects) {
        if (check.uid === list.uid) {
          checked.push(list);
        }
      }
    }
    data.dataProviders.relationItemData.selectionModel.setSelection(checked);
  }
}

export function applySortAndFilterRows(response, columnFilters, sortCriteria, startIndex, pageSize, data) {
  let datas = response.treeValue;
  if (columnFilters) {
    // Apply filtering
    _.forEach(columnFilters, function (columnFilter) {
      datas = createFilters(columnFilter, datas);
    });
  }
  //정렬
  // let endIndex = null;
  // if (pageSize > data.totalFound) {
  //     endIndex = startIndex + data.totalFound;
  // }
  // endIndex = startIndex + pageSize;
  // let searchResults = null;
  // if (datas != null) {
  //     searchResults = datas.slice(startIndex, endIndex);
  // }
  return datas;
}

//필터링
export let getFilterFacets = function (response, columnFilters, fullData) {
  var countries = response.treeValue;
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
    if (country.props[columnName].uiValues[0]) {
      facetsToReturn.push(country.props[columnName].uiValues[0]);
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

export function backSpacePopupAction(data) {
  let htmlData = vms.getViewModelUsingElement(document.getElementById('questionData'));
  htmlData.linkRepeat.dbValue = [];
  if (!selectRelationTableColumn) {
    selectRelationTableColumn = data.dataProviders.relationItemData.selectedObjects;
  }
  for (let i = 0; i < selectRelationTableColumn.length; i++) {
    htmlData.linkRepeat.dbValue.push({
      displayName: selectRelationTableColumn[i].props.l2_reference_issues.uiValues[0],
      isRequired: 'false',
      uiValue: selectRelationTableColumn[i].props.l2_reference_issues.uiValues[0],
      isNull: 'false',
      uid: selectRelationTableColumn[i].uid,
    });
  }
}

export function resetSelect(data) {
  data.dataProviders.relationItemData.selectionModel.selectNone();
  selectRelationTableColumn = null;
}

export function addSelectRelation(data) {
  let selectObjs = data.dataProviders.relationItemData.selectedObjects;

  let delList = [];
  if (selectObjs.length < checkOldList.length) {
    for (let item of checkOldList) {
      let isDel = true;
      for (let item2 of selectObjs) {
        if (item.uid == item2.uid) {
          isDel = false;
        }
      }
      if (isDel) {
        delList.push(item);
      }
    }
  }

  for (let obj1 of selectObjs) {
    let isIn = false;
    if (selectRelationTableColumn) {
      for (let obj2 of selectRelationTableColumn) {
        if (obj1.uid == obj2.uid) {
          isIn = true;
        }
      }
      if (isIn == false) {
        selectRelationTableColumn.push(obj1);
      }
    } else {
      selectRelationTableColumn = selectObjs;
    }
  }
  let checked = [];

  if (delList.length > 0) {
    for (let item1 of selectRelationTableColumn) {
      for (let item2 of delList) {
        if (item1.uid != item2.uid) {
          checked.push(item1);
        }
      }
    }
    selectRelationTableColumn = checked;
  }
  checkOldList = selectObjs;
}

export function selectRelationSetInit(popupId) {
  selectRelationTableColumn = null;
}

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
 * This function mocks the server logic for filtering numeric data with the 'Range' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNumericRangeFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    var fromValue = columnFilter.values[0];
    var toValue = columnFilter.values[1];
    if (!fromValue) {
      fromValue = 0;
    }
    return country.props[columnFilter.columnName].value >= Number(fromValue) && country.props[columnFilter.columnName].value <= Number(toValue);
  });
};

/**
 * This function mocks the server logic for filtering date data with the 'Range' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processDateRangeFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    var fromValue = columnFilter.values[0];
    var toValue = columnFilter.values[1];
    var fromDate = new Date(fromValue);
    var toDate = new Date(toValue);
    return country.props[columnFilter.columnName].value >= fromDate.getTime() && country.props[columnFilter.columnName].value <= toDate.getTime();
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Greater than' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processGreaterThanFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].value && country.props[columnFilter.columnName].value > Number(columnFilter.values[0])) {
      return true;
    }
    if (country.props[columnFilter.columnName].uiValue === '0' && Number(country.props[columnFilter.columnName].uiValue) > Number(columnFilter.values[0])) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Less than' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processLessThanFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].value && country.props[columnFilter.columnName].value < Number(columnFilter.values[0])) {
      return true;
    }
    if (country.props[columnFilter.columnName].uiValue === '0' && Number(country.props[columnFilter.columnName].uiValue) < Number(columnFilter.values[0])) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Greater than or equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processGreaterThanEqualsNumericFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].value >= Number(columnFilter.values[0])) {
      return true;
    }
    if (country.props[columnFilter.columnName].uiValue === '0' && Number(country.props[columnFilter.columnName].uiValue) >= Number(columnFilter.values[0])) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering date data with the 'Greater than or equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processGreaterThanEqualsDateFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    var filterDateValue = new Date(columnFilter.values[0]);
    var countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
    if (countryDateValue.getTime() >= filterDateValue.getTime()) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Less than or equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processLessThanEqualsNumericFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].value <= Number(columnFilter.values[0]) && country.props[columnFilter.columnName].uiValue !== '') {
      return true;
    }
    if (country.props[columnFilter.columnName].uiValue === '0' && Number(country.props[columnFilter.columnName].uiValue) <= Number(columnFilter.values[0])) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering date data with the 'Less than or equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processLessThanEqualsDateFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    var filterDateValue = new Date(columnFilter.values[0]);
    var countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
    if (countryDateValue.getTime() <= filterDateValue.getTime()) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsNumericFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (country.props[columnFilter.columnName].value === null && columnFilter.values[i] === '') {
        return true;
      }
      if (country.props[columnFilter.columnName].uiValue !== '0') {
        if (
          country.props[columnFilter.columnName].uiValue === columnFilter.values[i] ||
          country.props[columnFilter.columnName].value === Number(columnFilter.values[i])
        ) {
          return true;
        }
      } else {
        if (country.props[columnFilter.columnName].uiValue === columnFilter.values[i]) {
          return true;
        }
      }
    }
    return false;
  });
};

/**
 * This function mocks the server logic for filtering date data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsDateFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      var filterDateValue = new Date(columnFilter.values[i]);
      var countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
      if (filterDateValue.getTime() === countryDateValue.getTime()) {
        return true;
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
        if (country.props[columnFilter.columnName].uiValues[0] == columnFilter.values[i]) {
          return country.props[columnFilter.columnName].uiValues[0].toString().includes(columnFilter.values[i]);
        } else if (
          columnFilter.values[i] === '' &&
          (!country.props[columnFilter.columnName].uiValues[0] || country.props[columnFilter.columnName].uiValues[0] === null)
        ) {
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
 * This function mocks the server logic for filtering numeric data with the 'Does not equal' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsNumericFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      if (country.props[columnFilter.columnName].value === null && columnFilter.values[i] === '') {
        return false;
      }
      if (country.props[columnFilter.columnName].uiValue !== '0') {
        if (
          country.props[columnFilter.columnName].uiValue === columnFilter.values[i] ||
          country.props[columnFilter.columnName].value === Number(columnFilter.values[i])
        ) {
          return false;
        }
      } else {
        if (country.props[columnFilter.columnName].uiValue === columnFilter.values[i]) {
          return false;
        }
      }
    }
    return true;
  });
};

/**
 * Mocks server logic for filtering date facets with 'notEquals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsDateFilter = function (columnFilter, countries) {
  return countries.filter(function (country) {
    for (var i = 0; i < columnFilter.values.length; i++) {
      var filterDateValue = new Date(columnFilter.values[i]);
      var countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
      if (countryDateValue.getTime() === filterDateValue.getTime()) {
        return false;
      }
    }
    return true;
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
        } else if (country.props[columnFilter.columnName].uiValues[0] == columnFilter.values[i]) {
          return !country.props[columnFilter.columnName].uiValues[0].includes(columnFilter.values[i]);
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

const processNumericFilters = function (columnFilter, countries) {
  switch (columnFilter.operation) {
    case 'range':
      countries = processNumericRangeFilter(columnFilter, countries);
      break;
    case 'gt':
      countries = processGreaterThanFilter(columnFilter, countries);
      break;
    case 'lt':
      countries = processLessThanFilter(columnFilter, countries);
      break;
    case 'gte':
      countries = processGreaterThanEqualsNumericFilter(columnFilter, countries);
      break;
    case 'lte':
      countries = processLessThanEqualsNumericFilter(columnFilter, countries);
      break;
    case 'equals':
    case 'caseSensitiveEquals':
      countries = processEqualsNumericFilter(columnFilter, countries);
      break;
    case 'notEquals':
    case 'caseSensitiveNotEquals':
      countries = processNotEqualsNumericFilter(columnFilter, countries);
      break;
    default:
      break;
  }
  return countries;
};

const processDateFilters = function (columnFilter, countries) {
  switch (columnFilter.operation) {
    case 'range':
      countries = processDateRangeFilter(columnFilter, countries);
      break;
    case 'gte':
      countries = processGreaterThanEqualsDateFilter(columnFilter, countries);
      break;
    case 'lte':
      countries = processLessThanEqualsDateFilter(columnFilter, countries);
      break;
    case 'equals':
    case 'caseSensitiveEquals':
      countries = processEqualsDateFilter(columnFilter, countries);
      break;
    case 'notEquals':
    case 'caseSensitiveNotEquals':
      countries = processNotEqualsDateFilter(columnFilter, countries);
      break;
    default:
      break;
  }
  return countries;
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
  switch ((typeof countries[0].props[columnFilter.columnName].dbValues[0]).toUpperCase()) {
    case 'INTEGER':
    case 'DOUBLE':
    case 'FLOAT':
      countries = processNumericFilters(columnFilter, countries);
      break;
    case 'DATE':
      countries = processDateFilters(columnFilter, countries);
      break;
    case 'STRING':
      countries = processTextFilters(columnFilter, countries);
      break;
    default:
      break;
  }
  return countries;
};

export async function relationItemSetting(value, data) {
  //console.log("realtionItemSetting");
  if (resultRelation != null) {
    for (let i = 0; i < resultRelation.length; i++) {
      var jsoObj = {
        input: [
          {
            clientId: '',
            relationType: 'l2_reference_targets',
            primaryObject: value,
            secondaryObject: resultRelation[i],
          },
        ],
      };
      try {
        let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
      } catch (err) {
        //console.log(err);
        notySvc.showError('참조아이템 등록 실패');
      }
    }
  }
  resultRelation = null;
  if (window.location.href.includes('knowledgeWarehouse')) {
    var buttonArray = [];
    buttonArray.push({
      addClass: 'btn btn-notify',
      text: buttonYes,
      onClick: function ($noty) {
        $noty.close();
        if (data.checkExpertQ.dbValue) {
          window.location.href = browserUtils.getBaseURL() + '#/askExpert?question=' + value.uid;
        } else {
          window.location.href = browserUtils.getBaseURL() + '#/questionAnswer?question=' + value.uid;
        }
      },
    });
    buttonArray.push({
      addClass: 'btn btn-notify',
      text: buttonNo,
      onClick: async function ($noty) {
        $noty.close();
        await common.delay(5500);
        eventBus.publish('knowledge.questionReload');
      },
    });
    notySvc.showInfo(value.props.object_name.dbValues[0] + createComment1 + '\n' + createComment2, null, null, buttonArray);
  } else {
    let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
    if (htmlData.window == 'askExpert') {
      eventBus.publish('pageChipDataProvider.reset');
      history.pushState(null, null, '#/askExpert?question=' + value.uid);
      htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(value);
    } else if (htmlData.window == 'qna') {
      eventBus.publish('qaList.plTable.reload');
      eventBus.publish('pageChipDataProvider.reset');
      history.pushState(null, null, '#/questionAnswer?question=' + value.uid);
      htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(value);
    } else {
      eventBus.publish('qaList.plTable.reload');
      eventBus.publish('pageChipDataProvider.reset');
    }
  }
  if (value) {
    popupService.hide(data.popupId);
  }
}

let performSearch = async function (type, data, ctx) {
  let inputData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: [
        'object_name',
        'checked_out_user',
        'object_desc',
        'release_status_list',
        'fnd0InProcess',
        'l2_like_count',
        'l2_average_rating',
        'l2_division',
        'l2_page_type',
        'l2_page_index',
        'l2_keywords',
        'l2_issue_class',
        'l2_comments',
        'l2_comments_attachments',
        'l2_comments_string',
        'l2_content',
        'l2_content_string',
        'l2_pjt_name',
        'l2_platform_name',
        'l2_reference_issues',
        'l2_reference_posts',
        'l2_sub_title',
        'item_id',
        'IMAN_reference',
        'l2_doc_no',
        'l2_model',
        'l2_model_name',
        'l2_part',
        'l2_part_classification',
        'l2_source',
        'l2_creator',
        'l2_item',
        'l2_file_name',
      ],
      internalPropertyName: '',
      startIndex: 0,
      maxToLoad: 50,
      maxToReturn: 50,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: type,
          },
        ],
        'POM_application_object.owning_group': [
          {
            searchFilterType: 'StringFilter',
            stringValue: ctx.userSession.props.group_name.dbValues[0],
          },
        ],
      },
      cursor: {
        startIndex: data.dataProviders.relationItemData.startIndex,
      },
      searchSortCriteria: data.columnProviders.relationItemColumn.sortCriteria,
    },
    noServiceData: false,
  };
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
  let gigi = JSON.parse(abc.searchResultsJSON);
  var modelObjects = [];
  for (var i = 0; i < gigi.objects.length; i++) {
    var uid = gigi.objects[i].uid;
    var obj = abc.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  return {
    modelObjects: modelObjects,
    returnData: abc,
  };
};

let exports = {};

export default exports = {
  relationItemTableLoad,
  relationing,
  getFilterFacetData,
  getFilterFacets,
  applySortAndFilterRows,
  setSelectedItem,
  backSpacePopupAction,
  resetSelect,
  selectRelationSetInit,
  relationItemSetting,
  addSelectRelation,
};
app.factory('relationSideNavService', () => exports);
