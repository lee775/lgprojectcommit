import app from 'app';
import SoaService from 'soa/kernel/soaService'
import policy from 'js/soa/kernel/propertyPolicyService';
import query from 'js/utils/lgepQueryUtils';
import com from "js/utils/lgepObjectUtils";
import lgepPreferenceUtils from "js/utils/lgepPreferenceUtils"
import popupService from 'js/popupService';
import common from "js/utils/lgepCommonUtils";
import _ from 'lodash';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepLocalizationUtils from "js/utils/lgepLocalizationUtils";
import uwPropertySvc from 'js/uwPropertyService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
import loding from 'js/utils/lgepLoadingUtils';
import browserUtils from 'js/browserUtils';

var $ = require('jQuery');
var JSZip = require('jszip');

function recentAllSearcing(eventData) {
    let searchData = vms.getViewModelUsingElement(document.getElementById("designStdData"));
    searchData.searchingName.dbValue = eventData.selectedObjects[0].dbValue;
}

let tableData;
async function pageAllSearching(ctx) {
    let searchData = vms.getViewModelUsingElement(document.getElementById("designStdData"));
    let searchWord = searchData.searchingName.dbValue;
    let owningUser = ctx.user.props.user_name.dbValue + " (" + ctx.user.props.userid.dbValue + ")";
    let policyArr = policy.getEffectivePolicy();
    policyArr.types.push({
        "name": "L2_User",
        "properties": [{
            "name": "l2_manual_history"
        }]
    });
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser], policyArr);
    searchingUser = searchingUser[0];

    let manualHistory = searchingUser.props.l2_manual_history.dbValues;
    manualHistory.push(searchWord);
    manualHistory = Array.from(new Set(manualHistory));
    
    let request = {
        objects: [searchingUser],
        attributes: {
            l2_manual_history: {
                stringVec: manualHistory
            }
        }
    }

    await SoaService.post("Core-2007-01-DataManagement", "setProperties", request);

    let performSearchData = {
        "inflateProperties": true,
        "searchInput": {
            "attributesToInflate": [
                "object_name",
                "checked_out_user",
                "object_desc",
                "release_status_list",
                "fnd0InProcess",
                "l2_reference_book"
            ],
            "internalPropertyName": "",
            "maxToLoad": 50,
            "maxToReturn": 50,
            "providerName": "Awp0FullTextSearchProvider",
            "searchCriteria": {
                "searchString": "*" + searchWord + "*",
                // "limitedFilterCategoriesEnabled": "true",
                // "listOfExpandedCategories": "L2_PageRevision.l2_content_string",
                // "forceThreshold": "false",
                // "searchFromLocation": "global",
                // "dcpSortByDataProvider": "true"
            },
            "searchFilterFieldSortType": "Priority",
            "cursor": {
                "startIndex": 0,
                "endIndex": 0,
                "startReached": false,
                "endReached": false
            },
            "searchFilterMap6": {
                "WorkspaceObject.object_type": [{
                    "searchFilterType": "StringFilter",
                    "stringValue": "L2_ManualPageRevision",
                }]
            },
            "searchSortCriteria": [],
            "columnFilters": [],
            "focusObjUid": "",
            "pagingType": "",
            "startIndex": 0
        },
        "noServiceData": false
    }
    let performResult = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', performSearchData);
    let performResultJSON = JSON.parse(performResult.searchResultsJSON);
    let modelObjects = [];
    for (var i = 0; i < performResultJSON.objects.length; i++) {
        var uid = performResultJSON.objects[i].uid;
        var obj = performResult.ServiceData.modelObjects[uid];
        modelObjects.push(obj);
    }
    tableData = modelObjects;
    // eventBus.publish("searchPageTable.plTable.reload");
    if (modelObjects.length < 1) {
        message.show(0, lgepLocalizationUtils.getLocalizedText("L2_DesignStandardMessages", "searchDataNone"));
        return {
            searcNonehData: true
        };
    } else {
        return {
            searcNonehData: false
        };
    }
}

async function pageAllSearchingInit() {
    let searchData = vms.getViewModelUsingElement(document.getElementById("designStdData"));
    let pageSearchData = vms.getViewModelUsingElement(document.getElementById("pageSearchData"));
    let searchWord = searchData.searchingName.dbValue;
    pageSearchData.searchWord.uiValue = searchWord;
}

async function getSearchPageTableData() {
    if (!tableData) {
        return;
    }
    await com.getProperties(tableData, ["l2_content_string", "l2_reference_book"]);
    return {
        result: tableData,
        totalFound: tableData.length
    };
}

async function recentSearchMode() {
    let navData = vms.getViewModelUsingElement(document.getElementById("stdTreeNavData"));
    let manualRecentData;
    let whileTrue = true;
    while (whileTrue) {
        await common.delay(100);
        manualRecentData = vms.getViewModelUsingElement(document.getElementById("manualRecentData"));
        if (manualRecentData) {
            break;
        }
    }
    if (!navData.navMode) {
        manualRecentData.searchMode = "all";
    } else if (navData.navMode == "awTree") {
        manualRecentData.searchMode = "page";
    }
}

let searchKeyword = [];
let manualRecentSearch = [];
async function loadSearchList(data, ctx) {
    let owningUser = ctx.user.props.user_name.dbValue + " (" + ctx.user.props.userid.dbValue + ")";
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ["l2_manual_history"]);

    searchKeyword = searchingUser.props.l2_manual_history.dbValues;
    manualRecentSearch.splice(0, manualRecentSearch.length);
    if (searchKeyword.length > 0) {
        for (let i = 0; i < searchKeyword.length; i++) {
            manualRecentSearch.push(uwPropertySvc.createViewModelProperty(searchKeyword[i], null, 'STRING', searchKeyword[i], [searchKeyword[i]]));
        }
    }
    manualRecentSearch.reverse();
    return {
        searchResponse: manualRecentSearch
    }
}

function arrReset() {
    searchKeyword = [];
    manualRecentSearch = [];
}

function useTextSearch(data, ctx) {
    // $(".inputSearch").val(data.dataProviders.searchedWordList.selectedObjects[0].dbValue);
    // doSearch(data, ctx);
    // popupService.hide(data.popupId);

}

function filterRowsWithSort(response, sortCriteria, startIndex, pageSize) {
    let countries = response.result;
    let endIndex = startIndex + pageSize;

    if (sortCriteria && sortCriteria.length > 0) {
        let criteria = sortCriteria[0];
        let sortDirection = criteria.sortDirection;
        let sortColName = criteria.fieldName;

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

    let searchResults = countries.slice(startIndex, endIndex);
    return searchResults;
}

let exports = {};

export default exports = {
    pageAllSearchingInit,
    filterRowsWithSort,
    getSearchPageTableData,
    pageAllSearching,
    loadSearchList,
    arrReset,
    useTextSearch,
    recentSearchMode,
    recentAllSearcing
};

app.factory('L2_DesignManualPopupService', () => exports);