import app from 'app';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import locale from 'js/utils/lgepLocalizationUtils';
import notySvc from 'js/NotyModule';
var $ = require('jQuery');

const noSearch = locale.getLocalizedText("lgepKnowldegeManageMessages", "noSearch");

let nowQnaPage = 0;
let showQnaPage = 4;
let maxQnaPage = 0;
let AllQnaPage = [];
let QnaListArray = [];

let nowAllPage = 0;
let showAllPage = 7;
let maxAllPage = 0;
let AllPage = [];
let AllListArray = [];

let nowTechDocPage = 0;
let showTechDocPage = 3;
let maxTechDocPage = 0;
let AllTechDocPage = [];
let TechDocListArray = [];

let nowFaqPage = 0;
let showFaqPage = 4;
let maxFaqPage = 0;
let AllFaqPage = [];
let FaqListArray = [];

let nowAskExpertPage = 0;
let showAskExpertPage = 3;
let maxAskExpertPage = 0;
let AllAskExpertPage = [];
let AskExpertListArray = [];


export async function setQnaPageNumber(data, ctx) {

    let searchInput = {
        "attributesToInflate": ["object_name", "object_desc"],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [{
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
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    QnaListArray = listArray.searchResults;

    let num = Math.ceil(listArray.totalFound / showQnaPage);
    maxQnaPage = num > 15 ? 10 : 5;
    let pageQnaResponse = [];
    for (let i = 1; i <= num; i++) {
        pageQnaResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i)
            }
        );
    }

    AllQnaPage = [];
    for (let i = 0; i < pageQnaResponse.length; i += maxQnaPage) AllQnaPage.push(pageQnaResponse.slice(i, i + maxQnaPage));

    pageQnaResponse = AllQnaPage[0];
    let QnaListArrayPage = QnaListArray.slice(0, showQnaPage);
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects(QnaListArrayPage);
    eventBus.publish("paging.QnalistLoaded");

    if (pageQnaResponse === undefined || pageQnaResponse.length <= 1) {
        data.beforeQna.uiValue = ""
        data.firstPageQna.uiValue = ""
        data.afterQna.uiValue = ""
        data.lastPageQna.uiValue = ""
    } else {
        data.afterQna.uiValue = ">"
        data.lastPageQna.uiValue = "≫"
    }

    return {
        pageQnaResponse: pageQnaResponse
    }
}

export async function clickedQnaPageAction(data, ctx, chip) {

    if (chip.labelDisplayName != "1") {
        data.beforeQna.uiValue = "<"
        data.firstPageQna.uiValue = "≪"
    } else {
        data.beforeQna.uiValue = ""
        data.firstPageQna.uiValue = ""
    }

    if (chip.labelDisplayName != AllQnaPage[AllQnaPage.length - 1][AllQnaPage[AllQnaPage.length - 1].length - 1].labelDisplayName) {
        data.afterQna.uiValue = ">"
        data.lastPageQna.uiValue = "≫"
    } else {
        data.afterQna.uiValue = ""
        data.lastPageQna.uiValue = ""
    }

    nowQnaPage = (Number(chip.labelDisplayName) * showQnaPage) - showQnaPage;

    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowQnaPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    

    for (let chips of data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects) {
        chips.selected = false;
        if (chips.labelDisplayName === chip.labelDisplayName) {
            chips.selected = true;
        }
    }

    eventBus.publish("paging.QnalistLoaded");

}

export async function pagingBeforeQnaAction(data, ctx) {

    let num;
    let idx = -2;
    for (let chip of data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = Number(chip.labelDisplayName) - 1;
            chip.selected = false;
            break;
        }
    }
    if (num - 1 === 0) {
        data.beforeQna.uiValue = ""
        data.firstPageQna.uiValue = ""
    }
    data.afterQna.uiValue = ">"
    data.lastPageQna.uiValue = "≫"

    if (num < data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllQnaPage) {
            if (num === Number(pageList[maxQnaPage - 1].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[maxQnaPage - 1].selected = true;
    } else {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowQnaPage = (num * showQnaPage) - showQnaPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowQnaPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    
    eventBus.publish("paging.QnalistLoaded");
}

export async function pagingAfterQnaAction(data, ctx) {

    let num;
    let idx = 0;
    for (let chip of data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = chip.labelDisplayName;
            chip.selected = false;
            break;
        }
    }
    if ((Number(num) + 1) === Number(AllQnaPage[AllQnaPage.length - 1][AllQnaPage[AllQnaPage.length - 1].length - 1].labelDisplayName)) {
        data.afterQna.uiValue = ""
        data.lastPageQna.uiValue = ""
    }
    data.beforeQna.uiValue = "<"
    data.firstPageQna.uiValue = "≪"

    if (num === data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].labelDisplayName) {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllQnaPage) {
            if ((Number(num) + 1) === Number(pageList[0].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
    } else {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowQnaPage = (num * showQnaPage);
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowQnaPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4(null, searchInput, params);
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.QnalistLoaded");
}

export async function firstPageQnaAction(data, ctx) {

    for (let chip of data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllQnaPage[0]) {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    eventBus.publish("paging.QnalistLoaded");

    data.beforeQna.uiValue = ""
    data.firstPageQna.uiValue = ""
    data.afterQna.uiValue = ">"
    data.lastPageQna.uiValue = "≫"

}

export async function lastPageQnaAction(data, ctx) {

    for (let chip of data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    nowQnaPage = (Number(AllQnaPage[AllQnaPage.length - 1][AllQnaPage[AllQnaPage.length - 1].length - 1].labelDisplayName) - 1) * showQnaPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showQnaPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowQnaPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.qaAnswerList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllQnaPage[AllQnaPage.length - 1]) {
        data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.qnaChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].selected = true;

    eventBus.publish("paging.QnalistLoaded");

    data.afterQna.uiValue = ""
    data.lastPageQna.uiValue = ""
    data.beforeQna.uiValue = "<"
    data.firstPageQna.uiValue = "≪"

}

export async function setAllPageNumber(data, ctx) {

    let pageAllResponse = [];
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
                {
                    "searchFilterType": "StringFilter",
                    "stringValue": "L2_ManualRevision",
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
                }
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);
    AllListArray = listArray.searchResults;

    // AllListArray.splice(7);

    let num = Math.ceil(AllListArray.length / showAllPage);
    maxAllPage = num > 15 ? 10 : 5;
    for (let i = 1; i <= num; i++) {
        pageAllResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i)
            }
        );
    }

    AllPage = [];
    for (let i = 0; i < pageAllResponse.length; i += maxAllPage) AllPage.push(pageAllResponse.slice(i, i + maxAllPage));
    pageAllResponse = AllPage[0];
    let AllListArrayPage = AllListArray.slice(0, showAllPage);
    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);
    eventBus.publish("paging.AlllistLoaded");

    if (pageAllResponse === undefined || pageAllResponse.length <= 1) {
        data.beforeAll.uiValue = ""
        data.firstPageAll.uiValue = ""
        data.afterAll.uiValue = ""
        data.lastPageAll.uiValue = ""
    } else {
        data.afterAll.uiValue = ">"
        data.lastPageAll.uiValue = "≫"
    }

    return {
        pageAllResponse: pageAllResponse
    }

}

export async function setSearchAllPageNumber(data, ctx) {

    let pageAllResponse = [];
    let searchedList = localStorage.getItem('resultSearch');
    let searchInput = {
        "attributesToInflate": ["object_name", "object_desc"],
        "maxToLoad": -1,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": searchedList
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [
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
                {
                    "searchFilterType": "StringFilter",
                    "stringValue": "L2_ManualRevision",
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
                }
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    AllListArray = listArray.searchResults;
    if (listArray.totalFound === 0) {
        notySvc.showError(noSearch);
    } else {

        let num = Math.ceil(AllListArray.length / showAllPage);
        maxAllPage = num > 15 ? 10 : 5;
        for (let i = 1; i <= num; i++) {
            pageAllResponse.push(
                {
                    "chipType": "SELECTION",
                    "labelDisplayName": String(i)
                }
            );
        }

        AllPage = [];
        for (let i = 0; i < pageAllResponse.length; i += maxAllPage) AllPage.push(pageAllResponse.slice(i, i + maxAllPage));

        pageAllResponse = AllPage[0];

        let AllListArrayPage = AllListArray.slice(0, showAllPage);
        data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);

        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let page of AllPage[0]) {
            data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
        }
        for (let chip of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
            if (chip.selected) {
                chip.selected = false;
                break;
            }
        }
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

        eventBus.publish("paging.AlllistLoaded");

        if (data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.length <= 1) {
            data.beforeAll.uiValue = ""
            data.firstPageAll.uiValue = ""
            data.afterAll.uiValue = ""
            data.lastPageAll.uiValue = ""
        } else {
            data.afterAll.uiValue = ">"
            data.lastPageAll.uiValue = "≫"
        }
    }
}

export async function clickedAllPageAction(data, ctx, chip) {

    if (chip.labelDisplayName != "1") {
        data.beforeAll.uiValue = "<"
        data.firstPageAll.uiValue = "≪"
    } else {
        data.beforeAll.uiValue = ""
        data.firstPageAll.uiValue = ""
    }

    if (chip.labelDisplayName != AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) {
        data.afterAll.uiValue = ">"
        data.lastPageAll.uiValue = "≫"
    } else {
        data.afterAll.uiValue = ""
        data.lastPageAll.uiValue = ""
    }

    nowAllPage = (Number(chip.labelDisplayName) * showAllPage) - showAllPage;

    let AllListArrayPage = AllListArray.slice(nowAllPage, nowAllPage + showAllPage);
    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);

    for (let chips of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
        chips.selected = false;
        if (chips.labelDisplayName === chip.labelDisplayName) {
            chips.selected = true;
        }
    }

    eventBus.publish("paging.AlllistLoaded");
}

export async function pagingBeforeAllAction(data, ctx) {

    let num;
    let idx = -2;
    for (let chip of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = Number(chip.labelDisplayName) - 1;
            chip.selected = false;
            break;
        }
    }
    if (num - 1 === 0) {
        data.beforeAll.uiValue = ""
        data.firstPageAll.uiValue = ""
    }
    data.afterAll.uiValue = ">"
    data.lastPageAll.uiValue = "≫"

    if (num < data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllPage) {
            if (num === Number(pageList[maxAllPage - 1].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[maxAllPage - 1].selected = true;
    } else {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowAllPage = (num * showAllPage) - showAllPage;

    let AllListArrayPage = AllListArray.slice(nowAllPage, nowAllPage + showAllPage);

    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);
    eventBus.publish("paging.AlllistLoaded");
}

export async function pagingAfterAllAction(data, ctx) {

    let num;
    let idx = 0;
    for (let chip of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = chip.labelDisplayName;
            chip.selected = false;
            break;
        }
    }
    if ((Number(num) + 1) === Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName)) {
        data.afterAll.uiValue = ""
        data.lastPageAll.uiValue = ""
    }
    data.beforeAll.uiValue = "<"
    data.firstPageAll.uiValue = "≪"

    if (num === data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].labelDisplayName) {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllPage) {
            if ((Number(num) + 1) === Number(pageList[0].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
    } else {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowAllPage = (num * showAllPage);
    let AllListArrayPage = AllListArray.slice(nowAllPage, nowAllPage + showAllPage);

    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);

    eventBus.publish("paging.AlllistLoaded");
}

export async function firstPageAllAction(data, ctx) {

    for (let chip of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    let AllListArrayPage = AllListArray.slice(0, showAllPage);
    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);

    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllPage[0]) {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    eventBus.publish("paging.AlllistLoaded");

    data.beforeAll.uiValue = ""
    data.firstPageAll.uiValue = ""
    data.afterAll.uiValue = ">"
    data.lastPageAll.uiValue = "≫"

}

export async function lastPageAllAction(data, ctx) {

    for (let chip of data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    nowAllPage = (Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) - 1) * showAllPage;
    let AllListArrayPage = AllListArray.slice(nowAllPage, nowAllPage + showAllPage);
    data.dataProviders.searchAllList.viewModelCollection.setViewModelObjects(AllListArrayPage);

    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllPage[AllPage.length - 1]) {
        data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.searchChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].selected = true;

    eventBus.publish("paging.AlllistLoaded");

    data.afterAll.uiValue = ""
    data.lastPageAll.uiValue = ""
    data.beforeAll.uiValue = "<"
    data.firstPageAll.uiValue = "≪"

}

export async function setTechDocPageNumber(data, ctx) {

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
            "WorkspaceObject.object_type": [{
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
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
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    TechDocListArray = listArray.searchResults;
    let num = Math.ceil(listArray.totalFound / showTechDocPage);
    maxTechDocPage = num > 15 ? 10 : 5;
    let pageTechDocResponse = [];
    for (let i = 1; i <= num; i++) {
        pageTechDocResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i)
            }
        );
    }

    AllTechDocPage = [];
    for (let i = 0; i < pageTechDocResponse.length; i += maxTechDocPage) AllTechDocPage.push(pageTechDocResponse.slice(i, i + maxTechDocPage));

    pageTechDocResponse = AllTechDocPage[0];
    let TechDocListArrayPage = TechDocListArray.slice(0, showTechDocPage);
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects(TechDocListArrayPage);

    if (pageTechDocResponse === undefined || pageTechDocResponse.length <= 1) {
        data.beforeTechDoc.uiValue = ""
        data.firstPageTechDoc.uiValue = ""
        data.afterTechDoc.uiValue = ""
        data.lastPageTechDoc.uiValue = ""
    } else {
        data.afterTechDoc.uiValue = ">"
        data.lastPageTechDoc.uiValue = "≫"
    }

    eventBus.publish("paging.TechDoclistLoaded");

    return {
        pageTechDocResponse: pageTechDocResponse
    }
}

export async function clickedTechDocPageAction(data, ctx, chip) {

    if (chip.labelDisplayName != "1") {
        data.beforeTechDoc.uiValue = "<"
        data.firstPageTechDoc.uiValue = "≪"
    } else {
        data.beforeTechDoc.uiValue = ""
        data.firstPageTechDoc.uiValue = ""
    }

    if (chip.labelDisplayName != AllTechDocPage[AllTechDocPage.length - 1][AllTechDocPage[AllTechDocPage.length - 1].length - 1].labelDisplayName) {
        data.afterTechDoc.uiValue = ">"
        data.lastPageTechDoc.uiValue = "≫"
    } else {
        data.afterTechDoc.uiValue = ""
        data.lastPageTechDoc.uiValue = ""
    }

    nowTechDocPage = (Number(chip.labelDisplayName) * showTechDocPage) - showTechDocPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showTechDocPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            } ],
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
        "startIndex": nowTechDocPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    for (let chips of data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects) {
        chips.selected = false;
        if (chips.labelDisplayName === chip.labelDisplayName) {
            chips.selected = true;
        }
    }
    eventBus.publish("paging.TechDoclistLoaded");
}

export async function pagingBeforeTechDocAction(data, ctx) {

    let num;
    let idx = -2;
    for (let chip of data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = Number(chip.labelDisplayName) - 1;
            chip.selected = false;
            break;
        }
    }
    if (num - 1 === 0) {
        data.beforeTechDoc.uiValue = ""
        data.firstPageTechDoc.uiValue = ""
    }
    data.afterTechDoc.uiValue = ">"
    data.lastPageTechDoc.uiValue = "≫"

    if (num < data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllTechDocPage) {
            if (num === Number(pageList[maxTechDocPage - 1].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[maxTechDocPage - 1].selected = true;
    } else {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowTechDocPage = (num * showTechDocPage) - showTechDocPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showTechDocPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            } ],
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
        "startIndex": nowTechDocPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.TechDoclistLoaded");
}

export async function pagingAfterTechDocAction(data, ctx) {

    let num;
    let idx = 0;
    for (let chip of data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = chip.labelDisplayName;
            chip.selected = false;
            break;
        }
    }
    if ((Number(num) + 1) === Number(AllTechDocPage[AllTechDocPage.length - 1][AllTechDocPage[AllTechDocPage.length - 1].length - 1].labelDisplayName)) {
        data.afterTechDoc.uiValue = ""
        data.lastPageTechDoc.uiValue = ""
    }
    data.beforeTechDoc.uiValue = "<"
    data.firstPageTechDoc.uiValue = "≪"

    if (num === data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].labelDisplayName) {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllTechDocPage) {
            if ((Number(num) + 1) === Number(pageList[0].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
    } else {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowTechDocPage = (num * showTechDocPage);
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showTechDocPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            } ],
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
        "startIndex": nowTechDocPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4(null, searchInput, params);
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.TechDoclistLoaded");
}

export async function firstPageTechDocAction(data, ctx) {

    for (let chip of data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showTechDocPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            } ],
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllTechDocPage[0]) {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    eventBus.publish("paging.TechDoclistLoaded");

    data.beforeTechDoc.uiValue = ""
    data.firstPageTechDoc.uiValue = ""
    data.afterTechDoc.uiValue = ">"
    data.lastPageTechDoc.uiValue = "≫"

}

export async function lastPageTechDocAction(data, ctx) {

    for (let chip of data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    nowTechDocPage = (Number(AllTechDocPage[AllTechDocPage.length - 1][AllTechDocPage[AllTechDocPage.length - 1].length - 1].labelDisplayName) - 1) * showTechDocPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showTechDocPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
                "searchFilterType": "StringFilter",
                "stringValue": "L2_ManualRevision",
                "colorValue": "",
                "stringDisplayValue": "",
                "startDateValue": "",
                "endDateValue": "",
                "startNumericValue": 0,
                "endNumericValue": 0,
                "count": 0,
                "selected": false,
                "startEndRange": ""
            } ],
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
        "startIndex": nowTechDocPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.techDocList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllTechDocPage[AllTechDocPage.length - 1]) {
        data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.techDocChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].selected = true;

    eventBus.publish("paging.TechDoclistLoaded");

    data.afterTechDoc.uiValue = ""
    data.lastPageTechDoc.uiValue = ""
    data.beforeTechDoc.uiValue = "<"
    data.firstPageTechDoc.uiValue = "≪"

}

export async function setFaqPageNumber(data, ctx) {

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
            "WorkspaceObject.object_type": [{
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
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    FaqListArray = listArray.searchResults;
    let num = Math.ceil(listArray.totalFound / showFaqPage);
    maxFaqPage = num > 15 ? 10 : 5;
    let pageFaqResponse = [];
    for (let i = 1; i <= num; i++) {
        pageFaqResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i)
            }
        );
    }

    AllFaqPage = [];
    for (let i = 0; i < pageFaqResponse.length; i += maxFaqPage) AllFaqPage.push(pageFaqResponse.slice(i, i + maxFaqPage));

    pageFaqResponse = AllFaqPage[0];
    let FaqListArrayPage = FaqListArray.slice(0, showFaqPage);
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects(FaqListArrayPage);

    if (pageFaqResponse === undefined || pageFaqResponse.length <= 1) {
        data.beforeFaq.uiValue = ""
        data.firstPageFaq.uiValue = ""
        data.afterFaq.uiValue = ""
        data.lastPageFaq.uiValue = ""
    } else {
        data.afterFaq.uiValue = ">"
        data.lastPageFaq.uiValue = "≫"
    }

    eventBus.publish("paging.FaqlistLoaded");

    return {
        pageFaqResponse: pageFaqResponse
    }
}

export async function clickedFaqPageAction(data, ctx, chip) {

    if (chip.labelDisplayName != "1") {
        data.beforeFaq.uiValue = "<"
        data.firstPageFaq.uiValue = "≪"
    } else {
        data.beforeFaq.uiValue = ""
        data.firstPageFaq.uiValue = ""
    }

    if (chip.labelDisplayName != AllFaqPage[AllFaqPage.length - 1][AllFaqPage[AllFaqPage.length - 1].length - 1].labelDisplayName) {
        data.afterFaq.uiValue = ">"
        data.lastPageFaq.uiValue = "≫"
    } else {
        data.afterFaq.uiValue = ""
        data.lastPageFaq.uiValue = ""
    }

    nowFaqPage = (Number(chip.labelDisplayName) * showFaqPage) - showFaqPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showFaqPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowFaqPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects( listArray.searchResults );

    for (let chips of data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects) {
        chips.selected = false;
        if (chips.labelDisplayName === chip.labelDisplayName) {
            chips.selected = true;
        }
    }
    eventBus.publish("paging.FaqlistLoaded");
}

export async function pagingBeforeFaqAction(data, ctx) {

    let num;
    let idx = -2;
    for (let chip of data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = Number(chip.labelDisplayName) - 1;
            chip.selected = false;
            break;
        }
    }
    if (num - 1 === 0) {
        data.beforeFaq.uiValue = ""
        data.firstPageFaq.uiValue = ""
    }
    data.afterFaq.uiValue = ">"
    data.lastPageFaq.uiValue = "≫"

    if (num < data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllFaqPage) {
            if (num === Number(pageList[maxFaqPage - 1].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[maxFaqPage - 1].selected = true;
    } else {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowFaqPage = (num * showFaqPage) - showFaqPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showFaqPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowFaqPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.FaqlistLoaded");
}

export async function pagingAfterFaqAction(data, ctx) {

    let num;
    let idx = 0;
    for (let chip of data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = chip.labelDisplayName;
            chip.selected = false;
            break;
        }
    }
    if ((Number(num) + 1) === Number(AllFaqPage[AllFaqPage.length - 1][AllFaqPage[AllFaqPage.length - 1].length - 1].labelDisplayName)) {
        data.afterFaq.uiValue = ""
        data.lastPageFaq.uiValue = ""
    }
    data.beforeFaq.uiValue = "<"
    data.firstPageFaq.uiValue = "≪"

    if (num === data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].labelDisplayName) {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllFaqPage) {
            if ((Number(num) + 1) === Number(pageList[0].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
    } else {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowFaqPage = (num * showFaqPage);
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showFaqPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowFaqPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4(null, searchInput, params);
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects( listArray.searchResults );

    eventBus.publish("paging.FaqlistLoaded");
}

export async function firstPageFaqAction(data, ctx) {

    for (let chip of data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showFaqPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllFaqPage[0]) {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    eventBus.publish("paging.FaqlistLoaded");

    data.beforeFaq.uiValue = ""
    data.firstPageFaq.uiValue = ""
    data.afterFaq.uiValue = ">"
    data.lastPageFaq.uiValue = "≫"

}

export async function lastPageFaqAction(data, ctx) {

    for (let chip of data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    nowFaqPage = (Number(AllFaqPage[AllFaqPage.length - 1][AllFaqPage[AllFaqPage.length - 1].length - 1].labelDisplayName) - 1) * showFaqPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showFaqPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowFaqPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.faqList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllFaqPage[AllFaqPage.length - 1]) {
        data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.faqChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].selected = true;

    eventBus.publish("paging.FaqlistLoaded");

    data.afterFaq.uiValue = ""
    data.lastPageFaq.uiValue = ""
    data.beforeFaq.uiValue = "<"
    data.firstPageFaq.uiValue = "≪"

}

export async function setAskExpertPageNumber(data, ctx) {

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

    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }

    let listArray = await query.performSearchViewModel4(null, searchInput, params);

    AskExpertListArray = listArray.searchResults;
    let num = Math.ceil(listArray.totalFound / showAskExpertPage);
    maxAskExpertPage = num > 15 ? 10 : 5;
    let pageAskExpertResponse = [];
    for (let i = 1; i <= num; i++) {
        pageAskExpertResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i)
            }
        );
    }

    AllAskExpertPage = [];
    for (let i = 0; i < pageAskExpertResponse.length; i += maxAskExpertPage) AllAskExpertPage.push(pageAskExpertResponse.slice(i, i + maxAskExpertPage));

    pageAskExpertResponse = AllAskExpertPage[0];
    let AskExpertListArrayPage = AskExpertListArray.slice(0, showAskExpertPage);
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects(AskExpertListArrayPage);

    if (pageAskExpertResponse === undefined || pageAskExpertResponse.length <= 1) {
        data.beforeAskExpert.uiValue = ""
        data.firstPageAskExpert.uiValue = ""
        data.afterAskExpert.uiValue = ""
        data.lastPageAskExpert.uiValue = ""
    } else {
        data.afterAskExpert.uiValue = ">"
        data.lastPageAskExpert.uiValue = "≫"
    }

    eventBus.publish("paging.AskExpertlistLoaded");
    eventBus.publish("paging.setDefaultPage");

    return {
        pageAskExpertResponse: pageAskExpertResponse
    }
}

export async function clickedAskExpertPageAction(data, ctx, chip) {

    if (chip.labelDisplayName != "1") {
        data.beforeAskExpert.uiValue = "<"
        data.firstPageAskExpert.uiValue = "≪"
    } else {
        data.beforeAskExpert.uiValue = ""
        data.firstPageAskExpert.uiValue = ""
    }

    if (chip.labelDisplayName != AllAskExpertPage[AllAskExpertPage.length - 1][AllAskExpertPage[AllAskExpertPage.length - 1].length - 1].labelDisplayName) {
        data.afterAskExpert.uiValue = ">"
        data.lastPageAskExpert.uiValue = "≫"
    } else {
        data.afterAskExpert.uiValue = ""
        data.lastPageAskExpert.uiValue = ""
    }

    nowAskExpertPage = (Number(chip.labelDisplayName) * showAskExpertPage) - showAskExpertPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showAskExpertPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowAskExpertPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    for (let chips of data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects) {
        chips.selected = false;
        if (chips.labelDisplayName === chip.labelDisplayName) {
            chips.selected = true;
        }
    }
    eventBus.publish("paging.AskExpertlistLoaded");
}

export async function pagingBeforeAskExpertAction(data, ctx) {

    let num;
    let idx = -2;
    for (let chip of data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = Number(chip.labelDisplayName) - 1;
            chip.selected = false;
            break;
        }
    }
    if (num - 1 === 0) {
        data.beforeAskExpert.uiValue = ""
        data.firstPageAskExpert.uiValue = ""
    }
    data.afterAskExpert.uiValue = ">"
    data.lastPageAskExpert.uiValue = "≫"

    if (num < data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllAskExpertPage) {
            if (num === Number(pageList[maxAskExpertPage - 1].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[maxAskExpertPage - 1].selected = true;
    } else {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowAskExpertPage = (num * showAskExpertPage) - showAskExpertPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showAskExpertPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowAskExpertPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.AskExpertlistLoaded");
}

export async function pagingAfterAskExpertAction(data, ctx) {

    let num;
    let idx = 0;
    for (let chip of data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects) {
        idx += 1;
        if (chip.selected) {
            num = chip.labelDisplayName;
            chip.selected = false;
            break;
        }
    }
    if ((Number(num) + 1) === Number(AllAskExpertPage[AllAskExpertPage.length - 1][AllAskExpertPage[AllAskExpertPage.length - 1].length - 1].labelDisplayName)) {
        data.afterAskExpert.uiValue = ""
        data.lastPageAskExpert.uiValue = ""
    }
    data.beforeAskExpert.uiValue = "<"
    data.firstPageAskExpert.uiValue = "≪"

    if (num === data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].labelDisplayName) {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
        for (let pageList of AllAskExpertPage) {
            if ((Number(num) + 1) === Number(pageList[0].labelDisplayName)) {
                for (let page of pageList) {
                    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
                }
                break;
            }
        }
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
    } else {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
    }

    nowAskExpertPage = (num * showAskExpertPage);
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showAskExpertPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowAskExpertPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4(null, searchInput, params);
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    eventBus.publish("paging.AskExpertlistLoaded");
}

export async function firstPageAskExpertAction(data, ctx) {

    for (let chip of data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showAskExpertPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllAskExpertPage[0]) {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    eventBus.publish("paging.AskExpertlistLoaded");

    data.beforeAskExpert.uiValue = ""
    data.firstPageAskExpert.uiValue = ""
    data.afterAskExpert.uiValue = ">"
    data.lastPageAskExpert.uiValue = "≫"

}

export async function lastPageAskExpertAction(data, ctx) {

    for (let chip of data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
            chip.selected = false;
            break;
        }
    }

    nowAskExpertPage = (Number(AllAskExpertPage[AllAskExpertPage.length - 1][AllAskExpertPage[AllAskExpertPage.length - 1].length - 1].labelDisplayName) - 1) * showAskExpertPage;
    let searchInput = {
        "attributesToInflate": [ "object_name", "object_desc" ],
        "maxToLoad": showAskExpertPage,
        "maxToReturn": -1,
        "providerName": "Awp0FullTextSearchProvider",
        "searchCriteria": {
            "searchString": "*"
        },
        "searchFilterFieldSortType": "Priority",
        "searchFilterMap6": {
            "WorkspaceObject.object_type": [ {
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
            } ],
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
        "startIndex": nowAskExpertPage
    };
    let params = {
        "types": [
            {
                "name": "WorkspaceObject",
                "properties": [
                    { "name": "object_name" },
                    { "name": "creation_date" },
                    { "name": "items_tag" },
                    { "name": "l2_views" },
                    { "name": "owning_group" }
                ]
            }
        ],
    }
    let listArray = await query.performSearchViewModel4( null, searchInput, params );
    data.dataProviders.askExpertList.viewModelCollection.setViewModelObjects( listArray.searchResults );
    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllAskExpertPage[AllAskExpertPage.length - 1]) {
        data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects[data.dataProviders.askExpertChipDataProvider.viewModelCollection.loadedVMObjects.length - 1].selected = true;

    eventBus.publish("paging.AskExpertlistLoaded");

    data.afterAskExpert.uiValue = ""
    data.lastPageAskExpert.uiValue = ""
    data.beforeAskExpert.uiValue = "<"
    data.firstPageAskExpert.uiValue = "≪"

}

var exports = {};

export default exports = {
    setQnaPageNumber,
    setAllPageNumber,
    setTechDocPageNumber,
    setFaqPageNumber,
    setAskExpertPageNumber,
    clickedQnaPageAction,
    pagingBeforeQnaAction,
    pagingAfterQnaAction,
    firstPageQnaAction,
    lastPageQnaAction,
    clickedAllPageAction,
    pagingBeforeAllAction,
    pagingAfterAllAction,
    firstPageAllAction,
    lastPageAllAction,
    clickedTechDocPageAction,
    pagingBeforeTechDocAction,
    pagingAfterTechDocAction,
    firstPageTechDocAction,
    lastPageTechDocAction,
    clickedFaqPageAction,
    pagingBeforeFaqAction,
    pagingAfterFaqAction,
    firstPageFaqAction,
    lastPageFaqAction,
    clickedAskExpertPageAction,
    pagingBeforeAskExpertAction,
    pagingAfterAskExpertAction,
    firstPageAskExpertAction,
    lastPageAskExpertAction,
    setSearchAllPageNumber
}

app.factory('chipForPaginationService', () => exports);