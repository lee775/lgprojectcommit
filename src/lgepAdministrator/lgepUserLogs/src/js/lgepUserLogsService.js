import app from 'app';
import _ from 'lodash';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import viewModelService from 'js/viewModelObjectService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
var $ = require('jQuery');

export async function getUserLogList(data) {
    //console.log('이하 DB 조회 및 테이블 구성');

    let userData = [];
    let tableData = {
        type: '',
        uid: '',
        props: {
            user_id: [],
            division: [],
            module_name: [],
            action_name: [],
            targets: [],
            results: [],
            log_comments: [],
            update_date: [],
            client_ip: []
        }
    }

    let serviceData = await lgepPreferenceUtils.getPreference("BatchServerRestfulHosting.URL")
    let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

    await fetch(batchServerAddress + '/userLog/selectAll')
        .then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        }).then((result) => {
            for (var i = 0; i < result.length; i++) {
                let vmo = viewModelService.constructViewModelObjectFromModelObject(tableData);
                userData[i] = vmo;

                userData[i].type = "Logs";
                userData[i].uid = i;

                //이하 테이블 구성

                userData[i].props.user_id.dbValue = result[i].user_id;
                userData[i].props.user_id.uiValue = result[i].user_id;

                userData[i].props.division.dbValue = result[i].division;
                userData[i].props.division.uiValue = result[i].division;

                userData[i].props.module_name.dbValue = result[i].module_name;
                userData[i].props.module_name.uiValue = result[i].module_name;

                userData[i].props.action_name.dbValue = result[i].action_name;
                userData[i].props.action_name.uiValue = result[i].action_name;

                userData[i].props.targets.dbValue = result[i].targets;
                userData[i].props.targets.uiValue = result[i].targets;

                userData[i].props.results.dbValue = result[i].results;
                userData[i].props.results.uiValue = result[i].results;

                userData[i].props.log_comments.dbValue = result[i].log_comments;
                userData[i].props.log_comments.uiValue = result[i].log_comments;

                let dbDate = new Date(result[i].update_date);
                let logDate = dateFormat(dbDate);

                userData[i].props.update_date.dbValue = logDate;
                userData[i].props.update_date.uiValue = logDate;
                
                userData[i].props.client_ip.dbValue = result[i].client_ip;
                userData[i].props.client_ip.uiValue = result[i].client_ip;
            }
        }).catch((error) => {
            //console.log(`error: ${error}`)
        });

    return {
        result: userData,
        totalFound: userData.length
    };
}

export function dateFormat(date) {
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return date.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

export function filterDateFormat(filterDate) {

    let dateArr = filterDate.split("+");
    let dateArr2  = dateArr[0].split("T");
    filterDate = dateArr2[0] + " " + dateArr2[1];
    filterDate = new Date(filterDate);
    let month = filterDate.getMonth() + 1;
    let day = filterDate.getDate();
    let hour = filterDate.getHours();
    let minute = filterDate.getMinutes();
    let second = filterDate.getSeconds();

    month = month >= 10 ? month : '0' + month;
    day = day >= 10 ? day : '0' + day;
    hour = hour >= 10 ? hour : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;

    return filterDate.getFullYear() + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

export function applySortAndFilterRows(response, columnFilters, sortCriteria, startIndex, pageSize) {
    var countries = response.result;
    //console.log(response.result)
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
                if (a.props[sortColName].uiValue > b.props[sortColName].uiValue) return 1;
                if (a.props[sortColName].uiValue === b.props[sortColName].uiValue) return 0;
                if (a.props[sortColName].uiValue < b.props[sortColName].uiValue) return -1;
            });
        } else if (sortDirection === 'DESC') {
            countries.sort(function (a, b) {
                if (a.props[sortColName].uiValue < b.props[sortColName].uiValue) return 1;
                if (a.props[sortColName].uiValue === b.props[sortColName].uiValue) return 0;
                if (a.props[sortColName].uiValue > b.props[sortColName].uiValue) return -1;
            });
        }
    }
    var endIndex = startIndex + pageSize;
    return countries.slice(startIndex, endIndex);
    // return countries;
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
        totalFound: 0
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
        if (country.props[columnName].uiValue) {
            facetsToReturn.push(country.props[columnName].uiValue);
        } else if (country.props[columnName].uiValues) {
            _.forEach(country.props[columnName].uiValue, function (value) {
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


export function getFilterFacetData(fullData) {
    return fullData;
}

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
        let fromDate = new Date(fromValue);
        let toDate = new Date(toValue);
        let countryFilterDate = new Date(country.props[columnFilter.columnName].uiValue);
        return countryFilterDate.getTime() >= fromDate.getTime() && countryFilterDate.getTime() <= toDate.getTime();
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
                if (country.props[columnFilter.columnName].uiValue === columnFilter.values[i] || country.props[columnFilter.columnName].value === Number(columnFilter.values[i])) {
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
                if (country.props[columnFilter.columnName].uiValue == columnFilter.values[i]) {
                    return country.props[columnFilter.columnName].uiValue.toString().includes(columnFilter.values[i]);
                } else if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].uiValue || country.props[columnFilter.columnName].uiValue === null)) {
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
                if (country.props[columnFilter.columnName].uiValue === columnFilter.values[i] || country.props[columnFilter.columnName].value === Number(columnFilter.values[i])) {
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
                } else if (country.props[columnFilter.columnName].uiValue == columnFilter.values[i]) {
                    return false
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
        case 'range':
            countries = processDateRangeFilter(columnFilter, countries);
            break;
        case 'gte':
            countries = processGreaterThanEqualsDateFilter(columnFilter, countries);
            break;
        case 'lte':
            countries = processLessThanEqualsDateFilter(columnFilter, countries);
            break;
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
    console.log((typeof (countries[0].props[columnFilter.columnName].dbValue)).toUpperCase());
    switch ((typeof (countries[0].props[columnFilter.columnName].dbValue)).toUpperCase()) {
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
    getFilterFacetData,
    getFilterFacets,
    getUserLogList
}


app.factory('lgepUserLogsService', () => exports);