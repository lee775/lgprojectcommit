import app from 'app';
import soaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import eventBus from 'js/eventBus';
import vms from 'js/viewModelService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
var $ = require('jQuery');

export async function getL2UserList(data) {
  await common.userLogsInsert('Connection', '', 'S', 'Success');
  //action_name 작업명, targets 작업객체(없을 경우 ""), results(작업 결과 S / E ), log_commets(결과 메시지 - ex) Success)

  // let l2UserList = await cuteSavedQuery("일반...", ["유형"], ["사용자"]);
  let l2UserList = await query.executeSavedQuery('L2UserSearch', ['User ID'], ['*']);

  // let getFolder = {
  //     uids: ["bOvJY503Zx_JkD"]
  //     // uids: ["QKpJugGkZx1kZA"]
  // };

  // try {
  //     getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
  // } catch (err) {
  //     //console.log(err);
  // }
  // getFolder = Object.values(getFolder.modelObjects)[0];
  // await com.getProperties([getFolder], ["contents"]);

  // let userData = com.getObject(getFolder.props.contents.dbValues);
  if (!Array.isArray(l2UserList)) {
    l2UserList = [l2UserList];
  }
  await com.getProperties(l2UserList, [
    'object_name',
    'l2_is_expert',
    'l2_answer_count',
    'l2_point',
    'l2_knowledge_count',
    'l2_user_name',
    'l2_user_id',
    'l2_selected_knowledge_count',
    'l2_good_count',
    'l2_expert_coverages',
  ]);
  for (let data of l2UserList) {
    if (data.props.l2_is_expert.uiValues[0] == 'False') {
      data.props.l2_is_expert.uiValues[0] = 'X';
    } else if (data.props.l2_is_expert.uiValues[0] == 'True') {
      data.props.l2_is_expert.uiValues[0] = 'O';
    }
  }

  if (l2UserList.length != 0) {
    await common.userLogsInsert('Load', '', 'S', 'Success');
    //action_name 작업명, targets 작업객체(없을 경우 ""), results(작업 결과 S / E ), log_commets(결과 메시지 - ex) Success)
  }

  return {
    result: l2UserList,
  };
}

export function userSelectedCheck(value) {
  if (value.userDataProvider.selectedObjects.length <= 0) {
    message.show(1, lgepLocalizationUtils.getLocalizedText('lgepTechnicalMessages', 'noneSelUser'), ['Close'], [function () {}]);
    return {
      userSelectedState: false,
    };
  } else {
    return {
      userSelectedState: true,
    };
  }
}

export function editPopupInitialize() {
  const userData = vms.getViewModelUsingElement(document.getElementById('userManagementData'));
  let selectedUser = userData.dataProviders.userDataProvider.selectedObjects[0];
  const approvalData = vms.getViewModelUsingElement(document.getElementById('approvalData'));

  approvalData.userName.uiValue = selectedUser.props.object_name.dbValues[0];
  approvalData.userName.dbValue = selectedUser.props.object_name.dbValues[0];
  approvalData.userPoint.uiValue = selectedUser.props.l2_point.uiValues[0];
  approvalData.userPoint.dbValue = selectedUser.props.l2_point.uiValues[0];
  approvalData.expertState.uiValue = selectedUser.props.l2_is_expert.uiValues[0];
  approvalData.expertState.dbValue = selectedUser.props.l2_is_expert.uiValues[0];

  let expertCoveragesList = [];
  let valModels = selectedUser.props.l2_expert_coverages.displayValsModel;
  for (var i = 0; i < valModels.length; i++) {
    let expertName = valModels[i].displayValue;
    expertCoveragesList.push(expertName);
  }
  approvalData.expertCoveragesList.dbValue = expertCoveragesList;
  approvalData.expertCoveragesList.uiValues = expertCoveragesList;
  approvalData.expertCoveragesList.displayValsModel = valModels;

  // approvalData.expertCoveragesList.newDisplayValues = selectedUser.props.l2_expert_coverages.dbValue;
  // approvalData.expertCoveragesList.newValue = selectedUser.props.l2_expert_coverages.dbValue;
  // approvalData.expertCoveragesList.value = selectedUser.props.l2_expert_coverages.dbValue;
}

export async function editUserProps(data) {
  const userData = vms.getViewModelUsingElement(document.getElementById('userManagementData'));
  let selectedUser = userData.dataProviders.userDataProvider.selectedObjects[0];
  let userName = selectedUser.props.object_name.dbValues[0];

  // 전문가 명칭
  let expertCoverages = [];
  let valModels = data.expertCoveragesList.displayValsModel;
  for (var i = 0; i < valModels.length; i++) {
    let expertName = valModels[i].displayValue;
    expertCoverages.push(expertName);
  }
  //포인트 지급
  if (isNaN(data.userPoint.dbValue)) {
    message.show(1, lgepLocalizationUtils.getLocalizedText('lgepUserManagementMessages', 'onlyNumber'), ['Close'], [function () {}]);
    return {
      isNumber: false,
    };
  }
  //전문가 여부
  let state;
  if (data.expertState.dbValue == 'O') {
    state = '1';
  } else if (data.expertState.dbValue == 'X') {
    state = '0';
    expertCoverages = '';
  }

  let param = {
    objects: [selectedUser],
    attributes: {
      l2_point: {
        stringVec: [data.userPoint.dbValue],
      },
      l2_is_expert: {
        stringVec: [state],
      },
      l2_expert_coverages: {
        //expertCoverages 팝업에 추가.
        stringVec: expertCoverages,
      },
    },
  };

  let response = await soaService.post('Core-2007-01-DataManagement', 'setProperties', param);

  if (response.updated.length > 0) {
    await common.userLogsInsert('User Props Update', userName, 'S', 'Success');
    //action_name 작업명, targets 작업객체(없을 경우 ""), results(작업 결과 S / E ), log_commets(결과 메시지 - ex) Success)
  }

  message.show(0, lgepLocalizationUtils.getLocalizedText('lgepTechnicalMessages', 'editSuccess'), ['close'], [function () {}]);
  eventBus.publish('userList.plTable.reload');
  return {
    isNumber: true,
  };
}

export function getFilterFacetData(fullData) {
  return fullData;
}

export function applySortAndFilterRows(response, columnFilters, sortCriteria, startIndex, pageSize) {
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
        if (sortColName == 'l2_point') {
          if (parseInt(a.props[sortColName].uiValues[0]) > parseInt(b.props[sortColName].uiValues[0])) return 1;
          if (parseInt(a.props[sortColName].uiValues[0]) === parseInt(b.props[sortColName].uiValues[0])) return 0;
          if (parseInt(a.props[sortColName].uiValues[0]) < parseInt(b.props[sortColName].uiValues[0])) return -1;
        } else {
          if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return 1;
          if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
          if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return -1;
        }
      });
    } else if (sortDirection === 'DESC') {
      countries.sort(function (a, b) {
        if (sortColName == 'l2_point') {
          if (parseInt(a.props[sortColName].uiValues[0]) < parseInt(b.props[sortColName].uiValues[0])) return 1;
          if (parseInt(a.props[sortColName].uiValues[0]) === parseInt(b.props[sortColName].uiValues[0])) return 0;
          if (parseInt(a.props[sortColName].uiValues[0]) > parseInt(b.props[sortColName].uiValues[0])) return -1;
        } else {
          if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return 1;
          if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
          if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return -1;
        }
      });
    }
  }
  var endIndex = startIndex + pageSize;
  return countries.slice(startIndex, endIndex);
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
  var countries = response.result;
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
    } else if (country.props[columnName].uiValues) {
      _.forEach(country.props[columnName].uiValues[0], function (value) {
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
      return country.props[columnFilter.columnName].uiValue.toLowerCase().startsWith(columnFilter.values[0].toLowerCase());
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
      return country.props[columnFilter.columnName].uiValue.toLowerCase().endsWith(columnFilter.values[0].toLowerCase());
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
          (!country.props[columnFilter.columnName].uiValue || country.props[columnFilter.columnName].uiValue === null)
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
        if (
          columnFilter.values[i] === '' &&
          (!country.props[columnFilter.columnName].uiValues[0] || country.props[columnFilter.columnName].uiValues[0] === null)
        ) {
          return false;
        } else if (country.props[columnFilter.columnName].uiValues[0] == columnFilter.values[i]) {
          return false;
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
  //console.log((typeof (countries[0].props[columnFilter.columnName].dbValues[0])).toUpperCase());
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

let exports = {};

export default exports = {
  applySortAndFilterRows,
  editPopupInitialize,
  editUserProps,
  getFilterFacetData,
  getFilterFacets,
  getL2UserList,
  userSelectedCheck,
};

app.factory('lgepUserManagementService', () => exports);
