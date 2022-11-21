// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import logger from 'js/logger';
import propertyPolicyService from 'soa/kernel/propertyPolicyService';
import soaService from 'soa/kernel/soaService';
import viewModelObjectService from 'js/viewModelObjectService';
import _ from 'lodash';

let exports = {};

/**
 * Query 가져오기
 *
 * @param {String} queryName - Query 이름
 * @returns
 */
export const findSavedQuery = function (queryName) {
  return findSavedQueries([queryName]).then((response) => {
    if (response.savedQueries && response.savedQueries[0]) {
      return response.savedQueries[0];
    }

    return null;
  });
};

/**
 * Query 가져오기
 *
 * @param {String[]} queryNames - Names of saved queries to be found.
 * @param {String[]} queryDescs - Descrptions of saved queries to be found.
 * @param {int} queryType - The type of the saved queries.
 * @returns
 */
export const findSavedQueries = function (queryNames, queryDescs, queryType) {
  let requestParam = {
    inputCriteria: [
      {
        queryNames: queryNames,
        queryDescs: queryDescs,
        queryType: queryType,
      },
    ],
  };
  return soaService.post('Query-2010-04-SavedQuery', 'findSavedQueries', requestParam);
};

/**
 * SavedQuery 검색
 *
 * @param {IModelObject} queryName
 * @param {String[]} entries
 * @param {String[]} values
 * @param {Object} soaPolicy - SoaPolicy Object
 * @returns
 */
export const executeSavedQuery = function (queryName, entries, values, soaPolicy) {
  if (entries && !Array.isArray(entries)) {
    entries = [entries];
  }

  if (values && !Array.isArray(values)) {
    values = [values];
  }

  return findSavedQuery(queryName).then((savedQuery) => {
    let requestParam = {
      query: savedQuery,
      entries: entries,
      values: values,
      // limit: "int"
    };

    return soaService.post('Query-2006-03-SavedQuery', 'executeSavedQuery', requestParam, soaPolicy).then((response) => {
      if (response.nFound > 0) {
        return response.objects;
      }

      return null;
    });
  });
};

/**
 * FullTextSearch 검색
 *
 * @param {String} boTypeName - 검색될 개체의 유형
 * @param {String} searchString - 검색할 단어
 * @returns
 */
export const performSearch = function (boTypeName = '*', searchString = '*') {
  let requestParam = {
    input: [
      {
        boTypeName: boTypeName,
        exclusionBOTypeNames: [],
      },
    ],
  };

  return soaService
    .post('Core-2010-04-DataManagement', 'findDisplayableSubBusinessObjectsWithDisplayNames', requestParam)
    .then((displayNamesResponse) => {
      let typeNames = [];
      if (displayNamesResponse.output) {
        for (let i = 0; i < displayNamesResponse.output.length; i++) {
          let displayableBOTypeNames = displayNamesResponse.output[i].displayableBOTypeNames;
          for (let j = 0; j < displayableBOTypeNames.length; j++) {
            typeNames.push({
              searchFilterType: 'StringFilter',
              stringValue: displayableBOTypeNames[j].boName,
            });
          }
        }
      }

      let performSearchRequestParam = {
        columnConfigInput: {
          clientName: 'AWClient',
          clientScopeURI: 'Awp0SearchResults',
          columnsToExclude: [],
          hostingClientName: '',
          operationType: 'intersection',
        },
        saveColumnConfigData: {
          columnConfigId: '',
          clientScopeURI: '',
          columns: [],
          scope: '',
          scopeName: '',
        },
        searchInput: {
          providerName: 'Awp0FullTextSearchProvider',
          searchCriteria: {
            searchString: searchString,
          },
          startIndex: 0,
          searchFilterMap: {
            'WorkspaceObject.object_type': typeNames,
          },
          attributesToInflate: [''],
          internalPropertyName: '',
        },
      };

      return soaService.post('Internal-AWS2-2016-03-Finder', 'performSearch', performSearchRequestParam).then((performSearchResponse) => {
        if (performSearchResponse.searchResults) {
          return performSearchResponse.searchResults;
        }

        return null;
      });
    })
    .catch((e) => {
      logger.error(e.message);
    });
};

/**
 *
 * @param {Object} columnConfigInput
 * @param {Object} searchInput
 * @param {Object} propertyPolicy - ex. {types: [{"name": "WorkspaceObject", "properties": [{name: "object_name"}, {name: "object_string"}]}], "useRefCount": false}
 * @returns
 */
export const performSearchViewModel4 = function (columnConfigInput, searchInput, propertyPolicy) {
  const soaPath = 'Internal-AWS2-2019-06-Finder';
  const soaName = 'performSearchViewModel4';

  if (!columnConfigInput) {
    columnConfigInput = {
      clientName: 'AWClient',
      clientScopeURI: 'Awp0SearchResults',
    };
  }
  if (!searchInput) {
    searchInput = {
      attributesToInflate: ['object_name', 'checked_out_user', 'object_desc', 'release_status_list', 'fnd0InProcess'],
      maxToLoad: 50,
      maxToReturn: 50,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {},
      searchSortCriteria: [],
      startIndex: 0,
    };
  }

  // object_name 을 위한 임시코드
  if (!propertyPolicy) {
    propertyPolicy = getEffectivePolicy();
  }

  let requestParam = {
    columnConfigInput: columnConfigInput,
    searchInput: searchInput,
  };

  return soaService.post(soaPath, soaName, requestParam, propertyPolicy).then((response) => {
    if (response.searchResultsJSON) {
      response.searchResults = JSON.parse(response.searchResultsJSON);
      delete response.searchResultsJSON;
    }

    // Create view model objects
    response.searchResults =
      response.searchResults && response.searchResults.objects
        ? response.searchResults.objects.map(function (vmo) {
            return viewModelObjectService.createViewModelObject(vmo.uid, 'EDIT', null, vmo);
          })
        : [];

    // Collect all the prop Descriptors
    var propDescriptors = [];
    _.forEach(response.searchResults, function (vmo) {
      _.forOwn(vmo.propertyDescriptors, function (value) {
        propDescriptors.push(value);
      });
    });

    // Weed out the duplicate ones from prop descriptors
    response.propDescriptors = _.uniq(propDescriptors, false, function (propDesc) {
      return propDesc.name;
    });

    //Fix weird SOA naming
    response.searchFilterMap = response.searchFilterMap6;
    // delete response.searchFilterMap6;

    return response;
  });
};

/**
 *
 * @param {String} searchString
 * @param {String} objectType
 * @param {int} startIndex
 * @returns
 */
export const performSearchViewModel4_1 = function (searchString = '*', objectType, startIndex = 0) {
  return performSearchViewModel4_2(searchString, objectType, [], startIndex);
};

/**
 *
 * @param {String} searchString
 * @param {String} objectType
 * @param {Object[]]} searchSortCriteria - [{fieldName: "WorkspaceObject.object_name", sortDirection: "ASC"}]
 * @param {int} startIndex
 * @returns
 */
export const performSearchViewModel4_2 = function (searchString = '*', objectType, searchSortCriteria, startIndex = 0) {
  const searchInput = {
    attributesToInflate: ['object_name', 'checked_out_user', 'object_desc', 'release_status_list', 'fnd0InProcess'],
    maxToLoad: 50,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: searchString,
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: objectType,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: searchSortCriteria && Array.isArray(searchSortCriteria) ? searchSortCriteria : [],
    startIndex: startIndex,
  };

  return performSearchViewModel4(null, searchInput, null);
};

/**
 *
 * @param {String} objectType
 * @param {int} startIndex
 * @returns
 */
export const performSearchViewModel4ByType = function (objectType, startIndex = 0) {
  const searchInput = {
    attributesToInflate: ['object_name', 'checked_out_user', 'object_desc', 'release_status_list', 'fnd0InProcess'],
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
          stringValue: objectType,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: startIndex,
  };
  return performSearchViewModel4(null, searchInput, null);
};

export const getEffectivePolicy = function () {
  let effectivePolicy = propertyPolicyService.getEffectivePolicy(null, true);

  // 임시 코드(propertyPolicyService 검토 - merge 부분?)
  // 기존 Policy에 object_name 추가
  if (effectivePolicy.types) {
    _.forEach(effectivePolicy.types, function (type) {
      let isExistObjectName = false;
      _.forEach(type.properties, function (property) {
        if (property.name === 'object_name') {
          isExistObjectName = true;
        }
      });

      if (!isExistObjectName) {
        type.properties.push({
          name: 'object_name',
        });
      }
    });
  }

  return effectivePolicy;
};

/**
 * 팀센터 검색 기능을 처리하기 위한 클래스.
 */
export default exports = {
  findSavedQuery,
  findSavedQueries,
  executeSavedQuery,
  performSearch,
  performSearchViewModel4,
  performSearchViewModel4_1,
  performSearchViewModel4_2,
  performSearchViewModel4ByType,
  getEffectivePolicy,
};
app.factory('lgepQueryUtils', () => exports);
