/**
 * @module js/tableSortFilterUtil
 */
import _ from 'lodash';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const sortDesc = (vmObjects) => {
  return vmObjects.sort(function (a, b) {
    if (a.props[prop.CREATION_DATE].value >= b.props[prop.CREATION_DATE].value) {
      return -1;
    }
    return 1;
  });
};

const applySortAndFilterRows = function (response, columnFilters, sortCriteria, startIndex, pageSize = 20) {
  let searchResults = response.searchResults;
  if (columnFilters) {
    _.forEach(columnFilters, function (columnFilter) {
      searchResults = createFilters(columnFilter, searchResults);
    });
  }

  if (sortCriteria && sortCriteria.length > 0) {
    let criteria = sortCriteria[0];
    let sortDirection = criteria.sortDirection;
    let sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      searchResults.sort(function (a, b) {
        if (!a.props[sortColName]) {
          return -1;
        }
        if (!b.props[sortColName]) {
          return 1;
        }
        if (a.props[sortColName].value <= b.props[sortColName].value) {
          return -1;
        }

        return 1;
      });
    } else if (sortDirection === 'DESC') {
      searchResults.sort(function (a, b) {
        if (!a.props[sortColName]) {
          return 1;
        }
        if (!b.props[sortColName]) {
          return -1;
        }
        if (a.props[sortColName].value >= b.props[sortColName].value) {
          return -1;
        }
        return 1;
      });
    }
  }

  let endIndex = startIndex + pageSize;
  // TODO ::위험
  // appCtxService.registerCtx(
  //   FMEA_CTX_TABLE,
  //   searchResults.slice(startIndex, endIndex)
  // );
  return searchResults.slice(startIndex, endIndex);
};

const filterRowsWithSort = function (response, sortCriteria, startIndex, pageSize = 40) {
  let searchResults = response.searchResults;
  let endIndex = startIndex + pageSize;

  if (sortCriteria && sortCriteria.length > 0) {
    let criteria = sortCriteria[0];
    let sortDirection = criteria.sortDirection;
    let sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      searchResults.sort(function (a, b) {
        if (a.props[sortColName].value <= b.props[sortColName].value) {
          return -1;
        }
        return 1;
      });
    } else if (sortDirection === 'DESC') {
      searchResults.sort(function (a, b) {
        if (a.props[sortColName].value >= b.props[sortColName].value) {
          return -1;
        }
        return 1;
      });
    }
  }
  let sortResults = searchResults.slice(startIndex, endIndex);
  return sortResults;
};

/** 필터 조건 목록 */
const getFilterFacets = function (response, columnFilters, fullData) {
  let datas = response.searchResults;
  let updateFilters = fullData.columnFilters;
  let columnName = fullData.column.propertyName;
  let filterFacetResults = {
    values: [],
    totalFound: 0,
  };
  if (columnFilters) {
    _.forEach(columnFilters, function (columnFilter) {
      if (columnName !== columnFilter.columnName) {
        datas = createFilters(columnFilter, datas);
      }
    });
  }

  if (updateFilters) {
    _.forEach(updateFilters, function (columnFilter) {
      datas = createFilters(columnFilter, datas);
    });
  }

  let facetsToReturn = [];
  _.forEach(datas, function (data) {
    if (data.props[columnName].displayValue) {
      facetsToReturn.push(data.props[columnName].displayValue);
    } else if (data.props[columnName].displayValues) {
      _.forEach(data.props[columnName].displayValues, function (value) {
        facetsToReturn.push(value);
      });
    } else {
      facetsToReturn.push('');
    }
  });

  facetsToReturn = _.uniq(facetsToReturn);

  filterFacetResults.totalFound = facetsToReturn.length;

  let startIndex = fullData.startIndex;
  let endIndex = startIndex + fullData.maxToReturn;

  facetsToReturn = facetsToReturn.slice(startIndex, endIndex + 1);

  filterFacetResults.values = facetsToReturn;
  return filterFacetResults;
};

const getFilterFacetData = function (fullData) {
  return fullData;
};

/**
 * This function mocks the server logic for filtering text data with the 'Contains' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processContainsFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processNotContainsFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processStartsWithFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEndsWithFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNumericRangeFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    let fromValue = columnFilter.values[0];
    let toValue = columnFilter.values[1];
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processDateRangeFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    let fromValue = columnFilter.values[0];
    let toValue = columnFilter.values[1];
    let fromDate = new Date(fromValue);
    let toDate = new Date(toValue);
    return country.props[columnFilter.columnName].value >= fromDate.getTime() && country.props[columnFilter.columnName].value <= toDate.getTime();
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Greater than' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processGreaterThanFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
let processLessThanFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processGreaterThanEqualsNumericFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processGreaterThanEqualsDateFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    let filterDateValue = new Date(columnFilter.values[0]);
    let countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
    if (countryDateValue.getTime() >= filterDateValue.getTime()) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Less than or equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processLessThanEqualsNumericFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processLessThanEqualsDateFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    let filterDateValue = new Date(columnFilter.values[0]);
    let countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
    if (countryDateValue.getTime() <= filterDateValue.getTime()) {
      return true;
    }
  });
};

/**
 * This function mocks the server logic for filtering numeric data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsNumericFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsDateFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
      let filterDateValue = new Date(columnFilter.values[i]);
      let countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processEqualsTextFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
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

const _getColumnFilterValue = (columnFilterValue) => {
  switch (columnFilterValue) {
    case constants.COL_SINGLE_ITEM_LANG[1]:
      return constants.COL_SINGLE_ITEM_LANG[2];
    case constants.COL_SUB_ASSY_LANG[1]:
      return constants.COL_SUB_ASSY_LANG[2];
    case constants.COL_PARENT_ASSY_LANG[2]:
      return constants.COL_PARENT_ASSY_LANG[2];
    default:
      return columnFilterValue;
  }
};

const _getDataValue = (columnName, data) => {
  if (columnName === prop.OWNING_USER) {
    return data.props[columnName].uiValues[0];
  }
  return data.props[columnName].value;
};

/**
 * This function mocks the server logic for filtering text data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processCaseSensitiveEqualsTextFilter = function (columnFilter, datas) {
  return datas.filter(function (data) {
    for (let i = 0; i < columnFilter.values.length; i++) {
      const columnFilterValue = _getColumnFilterValue(columnFilter.values[i]);
      const dataValue = _getDataValue(columnFilter.columnName, data);
      if (!data.props[columnFilter.columnName].isArray) {
        if (dataValue && columnFilterValue) {
          return dataValue.toString().includes(columnFilterValue);
        } else if (columnFilterValue === '' && (!dataValue || dataValue === null)) {
          return true;
        }
      } else {
        if (data.props[columnFilter.columnName].uiValues && columnFilterValue) {
          return data.props[columnFilter.columnName].uiValues.toString().includes(columnFilterValue);
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsNumericFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsDateFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
      let filterDateValue = new Date(columnFilter.values[i]);
      let countryDateValue = new Date(country.props[columnFilter.columnName].uiValue);
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processNotEqualsTextFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
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
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const processCaseSensitiveNotEqualsFilter = function (columnFilter, datas) {
  return datas.filter(function (country) {
    for (let i = 0; i < columnFilter.values.length; i++) {
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

const processNumericFilters = function (columnFilter, datas) {
  switch (columnFilter.operation) {
    case 'range':
      datas = processNumericRangeFilter(columnFilter, datas);
      break;
    case 'gt':
      datas = processGreaterThanFilter(columnFilter, datas);
      break;
    case 'lt':
      datas = processLessThanFilter(columnFilter, datas);
      break;
    case 'gte':
      datas = processGreaterThanEqualsNumericFilter(columnFilter, datas);
      break;
    case 'lte':
      datas = processLessThanEqualsNumericFilter(columnFilter, datas);
      break;
    case 'equals':
    case 'caseSensitiveEquals':
      datas = processEqualsNumericFilter(columnFilter, datas);
      break;
    case 'notEquals':
    case 'caseSensitiveNotEquals':
      datas = processNotEqualsNumericFilter(columnFilter, datas);
      break;
    default:
      break;
  }
  return datas;
};

const processDateFilters = function (columnFilter, datas) {
  switch (columnFilter.operation) {
    case 'range':
      datas = processDateRangeFilter(columnFilter, datas);
      break;
    case 'gte':
      datas = processGreaterThanEqualsDateFilter(columnFilter, datas);
      break;
    case 'lte':
      datas = processLessThanEqualsDateFilter(columnFilter, datas);
      break;
    case 'equals':
    case 'caseSensitiveEquals':
      datas = processEqualsDateFilter(columnFilter, datas);
      break;
    case 'notEquals':
    case 'caseSensitiveNotEquals':
      datas = processNotEqualsDateFilter(columnFilter, datas);
      break;
    default:
      break;
  }
  return datas;
};

const processTextFilters = function (columnFilter, datas) {
  switch (columnFilter.operation) {
    case 'contains':
      datas = processContainsFilter(columnFilter, datas);
      break;
    case 'notContains':
      datas = processNotContainsFilter(columnFilter, datas);
      break;
    case 'startsWith':
      datas = processStartsWithFilter(columnFilter, datas);
      break;
    case 'endsWith':
      datas = processEndsWithFilter(columnFilter, datas);
      break;
    case 'equals':
      datas = processEqualsTextFilter(columnFilter, datas);
      break;
    case 'caseSensitiveEquals':
      datas = processCaseSensitiveEqualsTextFilter(columnFilter, datas);
      break;
    case 'notEquals':
      datas = processNotEqualsTextFilter(columnFilter, datas);
      break;
    case 'caseSensitiveNotEquals':
      datas = processCaseSensitiveNotEqualsFilter(columnFilter, datas);
      break;
    default:
      break;
  }
  return datas;
};

/**
 * This function mocks the server logic for filtering data using the created filters from client.
 * This is called from the main function that gets the filter facets. Since this function is mocking server logic,
 * it should not be implemented on client.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} datas The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
const createFilters = function (columnFilter, datas) {
  //console.log(columnFilter, datas);
  switch (datas[0].props[columnFilter.columnName].type) {
    case 'INTEGER':
    case 'DOUBLE':
    case 'FLOAT':
      datas = processNumericFilters(columnFilter, datas);
      break;
    case 'DATE':
      datas = processDateFilters(columnFilter, datas);
      break;
    case 'STRING':
      datas = processTextFilters(columnFilter, datas);
      break;
    default:
      datas = processTextFilters(columnFilter, datas);
      break;
  }
  return datas;
};

export default {
  filterRowsWithSort,
  applySortAndFilterRows,
  getFilterFacets,
  getFilterFacetData,
  sortDesc,
};
