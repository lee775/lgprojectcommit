import app from 'app';
import soaService from 'soa/kernel/soaService';
import com from "js/utils/lgepObjectUtils";
import popupService from 'js/popupService';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import $ from 'jquery';
import _ from 'lodash';
import iconService from 'js/iconService';
import uwPropertySvc from 'js/uwPropertyService';
import browserUtils from 'js/browserUtils';
import locale from 'js/utils/lgepLocalizationUtils';
import fmsUtils from 'js/fmsUtils';
import loadUtils from 'js/dashboardLoading';
import vms from 'js/viewModelService';
import dmSvc from 'soa/dataManagementService';
import appCtxService from 'js/appCtxService';
import common from "js/utils/lgepCommonUtils";
import notySvc from 'js/NotyModule';

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

export async function loadProfile(data, ctx) {

    let thumbnailUrl = ctx.user.props.awp0ThumbnailImageTicket.dbValues[0];
    if (ctx.user.props.awp0ThumbnailImageTicket.dbValues[0] == "" || ctx.user.props.awp0ThumbnailImageTicket.dbValues[0] == null) {
        data.image1.dbValue = iconService.getTypeIconFileUrl("avatar-person.svg");
    } else {
        data.image1.dbValue = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
    }
    data.box1.propertyDisplayName = ctx.user.props.user_name.dbValues[0] + "(" + ctx.user.props.userid.dbValues[0] + ")";

    let questionSearchInput = {
        "attributesToInflate": ["object_name", "object_desc", "owning_user"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [{
                "searchFilterType": "StringFilter",
                "stringValue": "L2_QuestionRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            }],
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

    let qExpertSearchInput = {
        "attributesToInflate": ["object_name", "object_desc", "owning_user"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [{
                "searchFilterType": "StringFilter",
                "stringValue": "L2_QuestionExpRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            }],
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

    let techDocRearchInput = {
        "attributesToInflate": ["object_name", "object_desc", "owning_user"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [{
                "searchFilterType": "StringFilter",
                "stringValue": "L2_TechDocRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            }],
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

    let answeRearchInput = {
        "attributesToInflate": ["object_name", "object_desc", "owning_user"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [{
                "searchFilterType": "StringFilter",
                "stringValue": "L2_AnswerRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            }],
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
                    { "name": "owning_user" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let params2 = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "owning_user" },
                    { "name": "owning_group" },
                    { "name": "l2_is_selected" }
                ]
            }
        ],
    }

    let [qlistArray, elistArray, techDoclistArray, answerlistArray] =  await Promise.all([
        await query.performSearchViewModel4(null, questionSearchInput, params),
        await query.performSearchViewModel4(null, qExpertSearchInput, params),
        await query.performSearchViewModel4(null, techDocRearchInput, params),
        await query.performSearchViewModel4(null, answeRearchInput, params2)  
    ]);

    let questionArray = [];
    let qExpertArray = [];
    let techDocArray = [];
    let answerArray = [];
    let selectedArray = [];
    let qResult = qlistArray.searchResults;
    let eResult = elistArray.searchResults;
    let techResult = techDoclistArray.searchResults;
    let answerResult = answerlistArray.searchResults;
    let userN = ctx.userSession.props.user.uiValues[0];
    let userG = ctx.userSession.props.group_name.uiValues[0];

    await Promise.all([
        _.forEach(qResult, function(value) {
            if(value.type == "L2_QuestionRevision" && value.props.owning_group.uiValues[0] == userG && value.props.owning_user.uiValues[0] == userN) {
                questionArray.push(value);
            }
        }),
        _.forEach(eResult, function(value) {
            if(value.type == "L2_QuestionExpRevision" && value.props.owning_group.uiValues[0] == userG && value.props.owning_user.uiValues[0] == userN) {
                qExpertArray.push(value);
            }
        }),
        _.forEach(techResult, function(value) {
            if(value.type == "L2_TechDocRevision" && value.props.owning_group.uiValues[0] == userG && value.props.owning_user.uiValues[0] == userN) {
                techDocArray.push(value);
            }
        }),
        _.forEach(answerResult, function(value) {
            if(value.type == "L2_AnswerRevision" && value.props.owning_group.uiValues[0] == userG && value.props.owning_user.uiValues[0] == userN) {
                answerArray.push(value);
            }
        }),
        _.forEach(answerResult, function(value) {
            if(value.type == "L2_AnswerRevision" && value.props.l2_is_selected.value == "Y" && value.props.owning_group.uiValues[0] == userG && value.props.owning_user.uiValues[0] == userN) {
                selectedArray.push(value);
            }
        })
    ]);

    let l2User = ctx.l2_user;
    let l2UserProps = await com.getProperties(l2User, ["l2_is_expert", "l2_expert_coverages", "l2_point", "l2_knowledge_count", "l2_answer_count", "l2_selected_knowledge_count", "l2_good_count"]);
    let coveragesLength = l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_expert_coverages.uiValues.length;
    let coveragesString = "";

    if(l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_expert_coverages.uiValues[0] == "*") {
        coveragesString = "모든 분야";
    } else {
        for(let i = 0; i < coveragesLength; i++) {
            if(i < coveragesLength - 1) {
                coveragesString += l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_expert_coverages.uiValues[i];
                coveragesString += ", ";
            } else if( i == coveragesLength - 1) {            
                coveragesString += l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_expert_coverages.uiValues[i];
            }
        }
    }

    await Promise.all([
        data.isExpert.uiValue = (l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_is_expert.uiValues[0] == "True") ? "O" : "X",
        data.expertCoveragesValue.uiValue = coveragesString,
        data.pointValue.uiValue = l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_point.uiValues[0] + " P",
        data.knowledgeCountValue.uiValue = questionArray.length == 0 ? "0" : questionArray.length,
        data.qExpertCountValue.uiValue = qExpertArray.length == 0 ? "0" : qExpertArray.length,
        data.techDocumentCountValue.uiValue = techDocArray.length == 0 ? "0" : techDocArray.length,
        data.answerCountValue.uiValue = answerArray.length == 0 ? "0" : answerArray.length,
        data.selectedCountValue.uiValue = selectedArray.length == 0 ? "0" : selectedArray.length,
        data.goodValue.uiValue = l2UserProps.modelObjects[l2UserProps.plain[0]].props.l2_good_count.uiValues[0]
    ]);
    
    loadUtils.closeDashboardWindow(data);

}

export async function loadFrequentlyList(data, ctx) {

    let itemList = [];
    for (let item of data.dataProviders.frequentlyList.viewModelCollection.loadedVMObjects) {
        if (item.type === "L2_QuestionRevision") {
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
        notySvc.showError("아이템 속성 불러오기 실패");
    }

    let vmoArray = [];

    for (let item of data.dataProviders.frequentlyList.viewModelCollection.loadedVMObjects) {
        if (item.props.l2_views.dbValues[0] != 0) {
            item.cellHeader1 = item.props.object_name.uiValue;
            item.cellHeader2 = item.props.creation_date.uiValues[0];
            item.cellProperties = {
                type: {
                    key: viewCount,
                    value: item.props.l2_views.dbValues[0]
                }
            }
            vmoArray.push(item);
        }
    }

    vmoArray.sort((a, b) => new Number(b.props.l2_views.dbValues[0]) - new Number(a.props.l2_views.dbValues[0]));
    await common.userLogsInsert("Load Dashboard", "", "S", "Success");

    return { searchFrequentlyResponse: vmoArray }
}

export async function loadAllList(data) {

    let itemList = [];
    for (let item of data.dataProviders.searchAllList.viewModelCollection.loadedVMObjects) {
        if (item.type === "L2_QuestionRevision") {
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
        notySvc.showError("아이템 속성 불러오기 실패");
    }

    let vmoArray = [];
    let a = 0;
    for (let item of data.dataProviders.searchAllList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue;
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        let val;
        if (item.type === "L2_QuestionRevision") {
            item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
            val = "Q&A";
            a++;
        } else if (item.type === "L2_FAQRevision") {
            val = "FAQ";
        } else if (item.type === "L2_TechDocRevision") {
            val = technicalDocument;
        } else if (item.type === "L2_QuestionExpRevision") {
            val = askExpert;
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
    await common.userLogsInsert("Load Dashboard", "", "S", "Success");

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
        notySvc.showError("아이템 속성 불러오기 실패");
    }

    let a = 0;
    for (let item of data.dataProviders.qaAnswerList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue + " (" + itemList[a].props.L2_AnswerRelation.dbValues.length + ")";
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: "Q&A"
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
    for (let item of data.dataProviders.faqList.viewModelCollection.loadedVMObjects) {
        item.cellHeader1 = item.props.object_name.dbValue;
        item.cellHeader2 = item.props.creation_date.uiValues[0];
        item.cellProperties = {
            type: {
                key: classification,
                value: "FAQ"
            }
        }
        vmoArray.push(item);
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

    setTimeout(function () {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.frequencyChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.frequencyChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0] != undefined ? data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true : '';
    }, 900);

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
        await common.userLogsInsert("Search", searchTxt, "S", "Success");
    } catch (err) {
        //console.log(err);
        notySvc.showError("최근 검색 단어 등록 실패");
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
    if (searchKeyword.length > 0) {
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
        await common.userLogsInsert("Delete Keywords", "", "S", "Success");
    } catch (err) {
        //console.log(err);
        notySvc.showError("최근 검색 목록 삭제 실패");
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

    if (value === "Q&A" || value === "L2_QuestionRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/questionAnswer?question=' + selectedObj;
    } else if (value === "FAQ" || value === "L2_FAQRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/faq?question=' + selectedObj;
    } else if (value === technicalDocument || value === "L2_TechDocRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/technicalDocumentation?tech=' + selectedObj;
    } else if (value === askExpert || value === "L2_QuestionExpRevision") {
        window.location.href = browserUtils.getBaseURL() + '#/askExpert?question=' + selectedObj;
    }

};

export let goQuestionAnswerPage = function (data) {

    let selectedObj = data.dataProviders.qaAnswerList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/questionAnswer?question=' + selectedObj;

};

export let goFaqPage = function (data) {

    let selectedObj = data.dataProviders.faqList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/faq?question=' + selectedObj;

};

export let goTechnicalDocumentationPage = function (data) {

    let selectedObj = data.dataProviders.techDocList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/technicalDocumentation?tech=' + selectedObj;

};

export let goAskExpertPage = function (data) {

    let selectedObj = data.dataProviders.askExpertList.selectedObjects[0].uid;
    window.location.href = browserUtils.getBaseURL() + '#/askExpert?question=' + selectedObj;

};

export let goMyQuestion = async function (ctx) {

    let userName1 = ctx.user.cellHeader1;
    let userName2 = ctx.user.cellHeader2;
    let userGroup = ctx.userSession.props.group_name.uiValues[0];

    window.location.href = `${browserUtils.getBaseURL()}#/teamcenter.search.search?searchCriteria=*&filter=POM_application_object.owning_user%3D${userName1}%20(%20${userName2}%20)~~POM_application_object.owning_group%3D${userGroup}~~WorkspaceObject.object_type%3DL2_QuestionRevision&savedSearchLocale=&refresh=`;

    // await common.delay(2000);
    // eventBus.publish( "connectSearch" );

};

export let goMyExpertQuestion = function (ctx) {    
    let userName1 = ctx.user.cellHeader1;
    let userName2 = ctx.user.cellHeader2;
    let userGroup = ctx.userSession.props.group_name.uiValues[0];

    window.location.href = `${browserUtils.getBaseURL()}#/teamcenter.search.search?searchCriteria=*&filter=POM_application_object.owning_user%3D${userName1}%20(%20${userName2}%20)~~POM_application_object.owning_group%3D${userGroup}~~WorkspaceObject.object_type%3DL2_QuestionExpRevision&savedSearchLocale=&refresh=`
}

export let goMyTechDoc = function (ctx) {
    let userName1 = ctx.user.cellHeader1;
    let userName2 = ctx.user.cellHeader2;
    let userGroup = ctx.userSession.props.group_name.uiValues[0];
    
    window.location.href = `${browserUtils.getBaseURL()}#/teamcenter.search.search?searchCriteria=*&filter=POM_application_object.owning_user%3D${userName1}%20(%20${userName2}%20)~~POM_application_object.owning_group%3D${userGroup}~~WorkspaceObject.object_type%3DL2_TechDocRevision&savedSearchLocale=&refresh=`
}

export let goMyAnswer = function (ctx) {
    let userName1 = ctx.user.cellHeader1;
    let userName2 = ctx.user.cellHeader2;
    let userGroup = ctx.userSession.props.group_name.uiValues[0];

    window.location.href = `${browserUtils.getBaseURL()}#/teamcenter.search.search?searchCriteria=*&filter=POM_application_object.owning_user%3D${userName1}%20(%20${userName2}%20)~~POM_application_object.owning_group%3D${userGroup}~~WorkspaceObject.object_type%3DL2_AnswerRevision&savedSearchLocale=&refresh=`
}

export let goMySelectedAnswer = function (ctx) {
    let userName1 = ctx.user.cellHeader1;
    let userName2 = ctx.user.cellHeader2;
    let userGroup = ctx.userSession.props.group_name.uiValues[0];

    window.location.href = `${browserUtils.getBaseURL()}#/teamcenter.search.search?searchCriteria=*&filter=POM_application_object.owning_user%3D${userName1}%20(%20${userName2}%20)~~POM_application_object.owning_group%3D${userGroup}~~WorkspaceObject.object_type%3DL2_AnswerRevision~~L2_AnswerRevision.l2_is_selected%3DY&savedSearchLocale=&refresh=`
}

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

export async function setL2UserAction(data, ctx) {
    if (!ctx.user) {
        location.reload();
    }
    if (!ctx.l2_user) {
        let owningUser = ctx.user.props.object_string.dbValues[0];
        let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);

        let createResult;
        if (searchingUser === null) {
            createResult = await com.createRelateAndSubmitObjects2("L2_User", {
                "object_name": [ctx.user.props.user_name.dbValues[0]],
                "l2_user_id": [owningUser],
                "l2_point": ["100"]
            });
            searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
        }
        ctx.l2_user = searchingUser[0];
    }
    com.getProperties([ctx.l2_user], ["object_name", "owning_user", "l2_user_id", "l2_point"]);
}

export function startLoadingPopup(data) {
    loadUtils.openDashboardWindow();
}

export default exports = {
    closeChart,
    delLink,
    doSearch,
    goAllPage,
    goAskExpertPage,
    goFaqPage,
    goMyAnswer,
    goMyExpertQuestion,
    goMyQuestion,
    goMySelectedAnswer,
    goMyTechDoc,
    goQuestionAnswerPage,
    goTechnicalDocumentationPage,
    loadAllList,
    loadAskExpertList,
    loadChart,
    loadFaqList,
    loadFrequentlyList,
    loadQnaList,
    loadProfile,
    loadTechDocList,
    loadSearchList,
    setL2UserAction,
    startLoadingPopup,
    useTextSearch
};

app.factory('dashboardList', () => exports);
