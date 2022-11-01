import app from 'app';
import soaService from 'soa/kernel/soaService';
import com from "js/utils/lgepObjectUtils";
import popupService from 'js/popupService';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import $ from 'jquery';
import uwPropertySvc from 'js/uwPropertyService';
import browserUtils from 'js/browserUtils';
import locale from 'js/utils/lgepLocalizationUtils';

const classification = locale.getLocalizedText("lgepKnowldegeManageMessages", "classification");
const technicalDocument = locale.getLocalizedText("lgepKnowldegeManageMessages", "technicalDocumentationSubLocationTitle");
const askExpert = locale.getLocalizedText("lgepKnowldegeManageMessages", "askExpertSubLocationTitle");
const viewCount = locale.getLocalizedText("lgepKnowldegeManageMessages", "viewCount");


var exports = {};
let searchTxt = "";

let searchKeyword = [];
let dummyList = [];

export let loadChart = function (data) {
    return {
        chartResult: true
    };
};

export let closeChart = function (data) {
    return {
        chartResult: false
    };
};

export async function loadFrequentlyList(data, ctx) {

    let searchInput = {
        "attributesToInflate": ["object_name", "object_desc"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [
                {
                    "searchFilterType": "StringFilter",
                    "stringValue": "L2_QuestionHelpRevision",
                    "colorValue": "",
                    "stringDisplayValue": "",
                    "startDateValue": "",
                    "endDateValue": "",
                    "startNumericValue": 0,
                    "endNumericValue": 0,
                    "count": 0,
                    "selected": false,
                    "startEndRange": ""
                },
                {
                    "searchFilterType": "StringFilter",
                    "stringValue": "L2_QuestionVOCRevision",
                    "colorValue": "",
                    "stringDisplayValue": "",
                    "startDateValue": "",
                    "endDateValue": "",
                    "startNumericValue": 0,
                    "endNumericValue": 0,
                    "count": 0,
                    "selected": false,
                    "startEndRange": ""
                },
            ],
            "POM_application_object.owning_group": [{
                "searchFilterType": "StringFilter",
                "stringValue": ctx.userSession.props.group_name.dbValues[0],
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            }]
        },
        "searchSortCriteria": [],
        "startIndex": 0
    };

    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    let FrequentlyListArray = [];
    listArray.searchResults.sort((a, b) => {
        return b.props.l2_views.dbValues[0] - a.props.l2_views.dbValues[0];
    });
    listArray.searchResults.splice(8);

    for (let item of listArray.searchResults) {
        if(item.props.l2_views.dbValues[0] != 0) {
            item.cellHeader1 = item.props.object_name.uiValue;
            item.cellHeader2 = item.props.creation_date.uiValues[0];
            item.cellProperties = {
                type: {
                    key: viewCount,
                    value: item.props.l2_views.dbValues[0]
                }
            }
            FrequentlyListArray.push(item);
        }
    }

    setTimeout(function() {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
    }, 900);

    return { searchFrequentlyResponse: FrequentlyListArray }
}

export async function loadAllList(data) {

    let itemList = [];
    for (let item of data.dataProviders.searchAllList.viewModelCollection.loadedVMObjects) {
        if (item.type === "L2_QuestionHelpRevision" || item.type=="L2_QuestionVOCRevision") {
            itemList.push(com.getObject(item.props.items_tag.value));
        }
    }
    let param = {
        objects: itemList,
        attributes: ["L2_AnswerRelation"]
    }
    try {
        await soaService.post("Core-2006-03-DataManagement", "getProperties", param);
    } catch (err) {
        //console.log(err);
    }
    
    let vmoArray = [];
    let a = 0;
    for (let item of data.dataProviders.searchAllList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue;
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        let val;
        if (item.type === "L2_QuestionHelpRevision") {
            val = "HelpDesk";
            item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
            a++;
        } else if (item.type === "L2_QuestionVOCRevision") {
            val = "VoC";
            item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
            a++;
        } else if (item.type === "L2_ManualRevision") {
            val = "Manual";
        }
        item.cellProperties = {
            type: {
                key: classification,
                value: val
            }
        }
        vmoArray.push(item);
    }

    vmoArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    return { searchAllResponse: vmoArray }
}

export async function loadQnaList(data) {
    let vmoArray = [];
    let itemList = [];
    for (let item of data.dataProviders.qaAnswerList.viewModelCollection.loadedVMObjects) {
        itemList.push(com.getObject(item.props.items_tag.value));
    }
    let param = {
        objects: itemList,
        attributes: ["L2_AnswerRelation"]
    }
    try {
        await soaService.post("Core-2006-03-DataManagement", "getProperties", param);
    } catch (err) {
        //console.log(err);
    }

    let a = 0;
    for (let item of data.dataProviders.qaAnswerList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: "VoC"
            }
        }
        vmoArray.push(item);
        a++;
    }
    vmoArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    return { searchQnaResponse: vmoArray }
}

export async function loadFaqList(data) {

    let vmoArray = [];
    let itemList = [];
    for (let item of data.dataProviders.qaAnswerList.viewModelCollection.loadedVMObjects) {
        itemList.push(com.getObject(item.props.items_tag.value));
    }
    let param = {
        objects: itemList,
        attributes: ["L2_AnswerRelation"]
    }
    try {
        await soaService.post("Core-2006-03-DataManagement", "getProperties", param);
    } catch (err) {
        //console.log(err);
    }
    let a = 0;
    for (let item of data.dataProviders.faqList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: "HelpDesk"
            }
        }
        vmoArray.push(item);
        a++;
    }
    vmoArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));


    return { searchFaqResponse: vmoArray }
}

export async function loadTechDocList(data) {

    let vmoArray = [];
    for (let item of data.dataProviders.techDocList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue;
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: technicalDocument
            }
        }
        vmoArray.push(item);
    }
    vmoArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));


    return { searchTechResponse: vmoArray }
}

export async function loadAskExpertList(data) {

    let vmoArray = [];
    for (let item of data.dataProviders.askExpertList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue;
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: askExpert
            }
        }
        vmoArray.push(item);
    }
    vmoArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));


    return { searchAskResponse: vmoArray }
}

export let doSearch = async function (data, ctx) {
    searchTxt = $(".inputSearch").val();

    
    let owningUser = ctx.user.props.user_name.dbValue + " (" + ctx.user.props.userid.dbValue + ")";
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ["l2_recently_searches"]);

    searchKeyword = searchingUser.props.l2_recently_searches.dbValues;
    searchKeyword.unshift(searchTxt);
    searchKeyword = Array.from(new Set(searchKeyword));
    searchKeyword.splice(10);

    let param = {
        objects: [searchingUser],
        attributes: {
            l2_recently_searches: {
                stringVec: searchKeyword
            }
        }
    }
    try {
        await soaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    localStorage.setItem('resultSearch', searchTxt);
    eventBus.publish("searchAllList.searchUpdated");
}

export let useTextSearch = async function (data, ctx) {

    $(".inputSearch").val(data.dataProviders.searchedWordList.selectedObjects[0].dbValue);
    doSearch(data, ctx);
    popupService.hide(data.popupId);

};

export let loadSearchList = async function (data, ctx) {

    let owningUser = ctx.user.props.user_name.dbValue + " (" + ctx.user.props.userid.dbValue + ")";
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ["l2_recently_searches"]);

    searchKeyword = searchingUser.props.l2_recently_searches.dbValues;
    dummyList.splice(0, dummyList.length);
    if(searchKeyword.length > 0) {
        for (let i = 0; i < searchKeyword.length; i++) {
            dummyList.push(uwPropertySvc.createViewModelProperty(searchKeyword[i], null, 'STRING', searchKeyword[i], [searchKeyword[i]]));
        }
    }
    return {
        searchResponse: dummyList
    }
}

export let delLink = async function (data, ctx) {

    let owningUser = ctx.user.props.user_name.dbValue + " (" + ctx.user.props.userid.dbValue + ")";
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ["l2_recently_searches"]);

    let param = {
        objects: [searchingUser],
        attributes: {
            l2_recently_searches: {
                stringVec: []
            }
        }
    }
    try {
        await soaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    searchKeyword = [];
    dummyList = [];
    $(".inputSearch").val("");

    const inputElWidth = document.querySelector("input.inputSearch").offsetWidth;
    popupService.show({
        declView: "searchPopup",
        options: {
            clickOutsideToClose: true,
            isModal: false,
            reference: "referenceId",
            placement: "bottom-start",
            width: inputElWidth
        },
        outputData: {
            popupId: "id"
        }
    });

};

export let goAllPage = function (data) {

    let selectedObj;
    let value;

    if (data.dataProviders.searchAllList.selectedObjects.length === 0) {
        selectedObj = data.dataProviders.frequentlyList.selectedObjects[0].uid;
        value = data.dataProviders.frequentlyList.selectedObjects[0].type;
    } else {
        selectedObj = data.dataProviders.searchAllList.selectedObjects[0].uid;
        value = data.dataProviders.searchAllList.selectedObjects[0].cellProperties.type.value;
    }

    if (value === "HelpDesk" || value === "L2_QuestionHelpRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/lgepNoticeBoardHelpDesk?question=' + selectedObj;
    } else if (value === "VoC" || value === "L2_QuestionVOCRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/lgepNoticeBoardVoc?question=' + selectedObj;
    } else if (value === "Manual" || value === "L2_ManualRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/lgepNoticeBoardManual?tech=' + selectedObj;
    }

};

export let goQuestionAnswerPage = function (data) {

    let selectedObj = data.dataProviders.qaAnswerList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/lgepNoticeBoardVoc?question=' + selectedObj;

};

export let goFaqPage = function (data) {

    let selectedObj = data.dataProviders.faqList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/lgepNoticeBoardHelpDesk?question=' + selectedObj;

};

export let goTechnicalDocumentationPage = function (data) {

    let selectedObj = data.dataProviders.techDocList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/technicalDocumentation?tech=' + selectedObj;

};

export let goAskExpertPage = function (data) {

    let selectedObj = data.dataProviders.askExpertList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/askExpert?question=' + selectedObj;

};

$(document).on("click", "input.inputSearch", function () {
    const inputElWidth = document.querySelector("input.inputSearch").offsetWidth;
    popupService.show({
        declView: "searchPopup",
        options: {
            clickOutsideToClose: true,
            isModal: false,
            reference: "referenceId",
            placement: "bottom-start",
            width: inputElWidth
        },
        outputData: {
            popupId: "id"
        }
    });
});


export default exports = {
    loadChart,
    closeChart,
    loadFrequentlyList,
    loadAllList,
    loadQnaList,
    loadFaqList,
    loadTechDocList,
    loadAskExpertList,
    doSearch,
    useTextSearch,
    goAllPage,
    goQuestionAnswerPage,
    goFaqPage,
    goTechnicalDocumentationPage,
    goAskExpertPage,
    loadSearchList,
    delLink
};

app.factory('dashboardList', () => exports);
