import app from 'app';
import viewModelService from 'js/viewModelObjectService';
import vms from 'js/viewModelService';
import cdmSvc from 'soa/kernel/clientDataModel';
import dmSvc from 'soa/dataManagementService';
import SoaService from 'soa/kernel/soaService';
import popupService from 'js/popupService';
import eventBus from 'js/eventBus';
import notySvc from 'js/NotyModule';
import iconService from 'js/iconService';
import fmsUtils from 'js/fmsUtils';
import browserUtils from 'js/browserUtils';
import com from "js/utils/lgepObjectUtils";
import lgepLocalizationUtils from "js/utils/lgepLocalizationUtils";
import query from 'js/utils/lgepQueryUtils';
var $ = require('jQuery');
import locale from 'js/utils/lgepLocalizationUtils';
import lgepPreferenceUtils from "js/utils/lgepPreferenceUtils"
import common from "js/utils/lgepCommonUtils";
import { consolidateObjects } from 'js/declUtils';

const recentSearches = locale.getLocalizedText("knowledgeSearchMessages", "recentSearches");
const existSameFolder = locale.getLocalizedText("knowledgeSearchMessages", "existSameFolder");
const buttonCancle = locale.getLocalizedText("knowledgeSearchMessages", "buttonCancle");
const buttonDelete = locale.getLocalizedText("knowledgeSearchMessages", "buttonDelete");
const makeFolder = locale.getLocalizedText("knowledgeSearchMessages", "makeFolder");
const editFolder = locale.getLocalizedText("knowledgeSearchMessages", "editFolder");
const checkDeleteFolder = locale.getLocalizedText("knowledgeSearchMessages", "checkDeleteFolder");
const checkDeleteRecent = locale.getLocalizedText("knowledgeSearchMessages", "checkDeleteRecent");
const noRecent = locale.getLocalizedText("knowledgeSearchMessages", "noRecent");
const noDeleteRecent = locale.getLocalizedText("knowledgeSearchMessages", "noDeleteRecent");
const noEditRecent = locale.getLocalizedText("knowledgeSearchMessages", "noEditRecent");
const textNoAnswer = lgepLocalizationUtils.getLocalizedText("knowledgeSearchMessages", "noAnswer");
const textAnswer = lgepLocalizationUtils.getLocalizedText("knowledgeSearchMessages", "textAnswer");
const textReview = lgepLocalizationUtils.getLocalizedText("knowledgeSearchMessages", "reViewNum");
const noName = lgepLocalizationUtils.getLocalizedText("knowledgeSearchMessages", "noName");

let makeFolderFlag = true;
let folderList = [];
let checkImages = {};
let recentFolder;

async function dataLoad(ctx, data) {

    const favoritesFolderUid = await lgepPreferenceUtils.getPreference("L2_DevKnowledge_Favorites");

    // let element = document.getElementsByClassName("marginNobottom");
    // element[0].style.flexBasis = "287px";

    let thumbnailUrl = ctx.user.props.awp0ThumbnailImageTicket.dbValues[0];
    if (ctx.user.props.awp0ThumbnailImageTicket.dbValues[0] == "" || ctx.user.props.awp0ThumbnailImageTicket.dbValues[0] == null) {
        data.image1.dbValue = iconService.getTypeIconFileUrl("avatar-person.svg");
    } else {
        data.image1.dbValue = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
    }
    data.box1.propertyDisplayName = ctx.user.props.user_name.dbValues[0] + "(" + ctx.user.props.userid.dbValues[0] + ")";

    let getFolder = {
        uids: [favoritesFolderUid.Preferences.prefs[0].values[0].value]
    };
    try {
        getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    } catch (err) {
        notySvc.showError("기본 즐겨찾기 폴더 불러오기 실패");
        //console.log(err);
    }
    getFolder = Object.values(getFolder.modelObjects)[0];

    await com.getProperties([getFolder], ["contents", "owning_user"]);

    let flag = false;
    let folders = getFolder.props.contents.dbValues;

    getFolder = {
        uids: folders
    };
    folders = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    folders = Object.values(folders.modelObjects);
    await com.getProperties(folders, ["contents", "owning_user", "creation_date"]);
    folders.sort((a, b) => new Date(a.props.creation_date.dbValues[0]) - new Date(b.props.creation_date.dbValues[0]));

    folderList = [];
    for (let folder of folders) {
        if (folder.props.owning_user.dbValues[0] === ctx.user.uid) {
            folderList.push(folder);
            if (folder.props.object_string.dbValues[0].includes(recentSearches) || folder.props.object_string.dbValues[0].includes("최근 검색")) {
                recentFolder = folder;
            }
        }
    }

    if (folderList.length === 0) {
        flag = true;
    }

    if (flag) {
        try {
            let folderData = {
                folders: [{
                    name: recentSearches,
                }],
                container: {
                    uid: favoritesFolderUid.Preferences.prefs[0].values[0].value
                }
            };
            await SoaService.post("Core-2006-03-DataManagement", "createFolders", folderData);
            eventBus.publish("SPLMTableContextMenu.plTable.reload");
            eventBus.publish("recentList.clear");
        } catch (err) {
            //console.log(err);
            notySvc.showError("최근 검색 폴더 생성 실패");
        }
    }

    data.popupWidth = window.innerWidth * 0.95;
    data.popupHeight = window.innerHeight * 0.95;

    if(folderList.length != 0) {
        await common.userLogsInsert("Load Folders", "", "S", "Success");
    }

    return {
        result: folderList
    }

}

export async function controlPage(data) {
    data.dataProviders.recentSearchList.selectionModel.selectNone();
    data.dataProviders.recommendedResult.selectionModel.selectNone();
    data.dataProviders.favoritesList.selectionModel.selectNone();
    if (data.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.object_string.dbValues[0].includes(recentSearches) || data.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.object_string.dbValues[0].includes("최근 검색")) {
        eventBus.publish("recentList.changeUpdated");
        data.flag.mainPanel = false;
        data.flag.recent = true;
        data.flag.recommended = true;
    } else {
        eventBus.publish("favoritesList.changeUpdated");
        data.flag.recent = false;
        data.flag.recommended = false;

        data.captionValue.value = data.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.object_string.dbValues[0];

        data.flag.mainPanel = true;
    }
}

export async function closeRecentAction(data) {
    data.flag.recent = false;
    data.flag.mainPanel = false;
}

export async function closeRecommendedAction(data) {
    data.flag.recommended = false;
}

export async function closeMyQnaAction(data) {
    data.flag.myQna = false;
}

export async function loadQna(data, ctx) {
    let qList;
    let aList;
    let inputData = {
        inflateProperties: true,
        searchInput: {
            attributesToInflate: [
                "object_name",
                "object_desc",
                "l2_category",
                "l2_main_category",
                "l2_subcategory",
                "item_id",
                "items_tag",
                "creation_date",
                "owning_user"
            ],
            internalPropertyName: "",
            maxToLoad: 50,
            maxToReturn: 50,
            startIndex: 0,
            providerName: "Awp0FullTextSearchProvider",
            searchCriteria: {
                searchString: "*",
            },
            searchFilterFieldSortType: "Priority",
            searchFilterMap6: {
                "WorkspaceObject.object_type": [
                    {
                        "searchFilterType": "StringFilter",
                        "stringValue": "L2_QuestionRevision",
                    }
                ],
                "POM_application_object.owning_user": [
                    {
                        "searchFilterType": "StringFilter",
                        "stringValue": ctx.user.props.user_name.dbValue + " ( " + ctx.user.props.userid.dbValue + " )",
                    }
                ],
                "POM_application_object.owning_group": [{
                    "searchFilterType": "StringFilter",
                    "stringValue": ctx.userSession.props.group_name.dbValues[0]
                }]
            }
        },
        noServiceData: false
    }
    let policy = {
        "types": [
            {
                "name": "L2_Question",
                "properties": [
                    { "name": "L2_AnswerRelation" },
                    { "name": "obejct_name" },
                ]
            }],
        "useRefCount": false
    };
    //검색 완료
    let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData, policy);
    let gigi = JSON.parse(abc.searchResultsJSON);
    var modelObjects = [];
    for (var i = 0; i < gigi.objects.length; i++) {
        var uid = gigi.objects[i].uid;
        var obj = abc.ServiceData.modelObjects[uid];
        modelObjects.push(obj);
    }
    let total = [];
    if (abc.ServiceData.modelObjects) {
        total = Object.values(abc.ServiceData.modelObjects);
    }
    //검색 결과에 따라 질문 리비전과 답변 아이템을 구분
    let questionList = [];
    let answerItem = [];
    let divRelation = [];
    for (let mo of total) {
        if (mo.type == "L2_QuestionRevision") {
            questionList.push(mo);
        } else if (mo.type == "L2_Answer") {
            answerItem.push(mo.uid);
        } else if (mo.type == "L2_Question") {
            divRelation.push(mo);
        }
    }
    //답변 아이템 검색
    qList = questionList;

    let param = {
        uids: answerItem
    }
    let policy2 = {
        "types": [{
            "name": "WorkspaceObject",
            "properties": [
                { "name": "contents" },
                { "name": "object_string" },
                { "name": "revision_list" },
                { "name": "owning_user" }
            ]
        }],
        "useRefCount": false
    };
    let idSearchList = []
    try {
        let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
        for (let uid of answerItem) {
            idSearchList.push(serachResult.modelObjects[uid]);
        }
    } catch (err) {
        //console.log(err);
        notySvc.showError("내 질문 불러오기 실패");
    }
    // 답변 리비전조회
    let answerList = [];
    for (let mo of idSearchList) {
        answerList.push(mo.props.revision_list.dbValues[0]);
    }
    param = {
        uids: answerList
    }
    policy2 = {
        "types": [{
            "name": "L2_AnswerRevision",
            "properties": [
                { "name": "object_string" },
                { "name": "l2_content" },
                { "name": "l2_content_string" },
                { "name": "owning_user" },
                { "name": "creation_date" },
                { "name": "items_tag" }
            ]
        }],
        "useRefCount": false
    };
    let answerRevisions = []
    try {
        let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
        for (let uid of answerList) {
            answerRevisions.push(serachResult.modelObjects[uid]);
        }
        answerRevisions.sort(function(a,b){
            if(a.props.creation_date.dbValues[0] <= b.props.creation_date.dbValues[0]){
                return 1;
            } else {
                return-1;
            }
        })
        aList = answerRevisions;
    } catch (err) {
        //console.log(err);
        notySvc.showError("내 질문에 달린 댓글 불러오기 실패");
    }
    let vmoArray1 = [];
    let searchQList = {};
    for (let mo of qList) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
        vmo.cellHeader1 = mo.props.object_name.uiValues[0];
        vmo.sendURL = browserUtils.getBaseURL() + "#/questionAnswer?question=" + vmo.uid;
        vmoArray1.push(vmo);
        searchQList[mo.props.items_tag.dbValues[0]] = vmo;
    }
    qList = vmoArray1;
    let vmoArray2 = [];
    for (let mo of aList) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
        vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
        vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
        let showAnswer = {};
        showAnswer[textAnswer] = {
            key: textAnswer,
            value: mo.props.l2_content_string.dbValues[0]
        }
        vmo.cellProperties = showAnswer;
        let obj1 = await cdmSvc.getObject(vmo.props.owning_user.dbValues[0]);
        await dmSvc.getProperties([vmo.props.owning_user.dbValues[0]], ["awp0ThumbnailImageTicket"]);
        let thumbnailUrl = obj1.props.awp0ThumbnailImageTicket.dbValues[0];
        if (thumbnailUrl == "" || thumbnailUrl == null) {
            vmo.typeIconURL = iconService.getTypeIconFileUrl("avatar-person.svg");
        } else {
            vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
        }

        vmoArray2.push(vmo);
    }
    aList = vmoArray2;
    //관계 식별을 위해 uid값을 키값으로 넣기
    let qaRelation = {}
    let haveAList = {}
    for (let mo of divRelation) {
        let vals = mo.props.L2_AnswerRelation.dbValues
        haveAList[mo.uid] = vals;
        for (let uid of vals) {
            qaRelation[uid] = mo.uid;
        }
    }
    let showAList = [];
    for (let Qitem of qList) {
        if (haveAList[Qitem.props.items_tag.dbValues[0]].length > 0) {
            for (let a of aList) {
                if (qaRelation[a.props.items_tag.dbValues[0]] == Qitem.props.items_tag.dbValue) {
                    a.cellHeader1 = a.props.owning_user.uiValues[0];
                    a.cellHeader2 = a.props.creation_date.uiValues[0];
                    let showAnswer = {};
                    showAnswer[textAnswer] = {
                        key: textAnswer,
                        value: a.props.l2_content_string.dbValues[0]
                    }
                    a.cellProperties = showAnswer;
                    a.sendURL = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].sendURL;
                    a.qName = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].cellHeader1;
                    a.qDate = Date.parse(searchQList[qaRelation[a.props.items_tag.dbValues[0]]].props.creation_date.dbValues[0]);
                    a.qUID = qaRelation[a.props.items_tag.dbValues[0]];
                    let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
                    if (thumbnailUrl == "" || thumbnailUrl == null) {
                        a.typeIconURL = iconService.getTypeIconFileUrl("avatar-person.svg");
                    } else {
                        a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
                    }
                    // return true;
                    showAList.push(a);
                }
            }
        } else {
            Qitem.qName = Qitem.cellHeader1;
            Qitem.cellHeader1 = "";
            Qitem.cellHeader2 = textNoAnswer;
            Qitem.cellProperties = "";
            Qitem.qUID = Qitem.props.items_tag.dbValue;
            Qitem.qDate = Date.parse(Qitem.props.creation_date.dbValues[0]);
            showAList.push(Qitem);
        }
    }
    showAList.sort(function (a, b) {
        if (a.qDate <= b.qDate) {
            return 1;
        }
        return -1;
    })
    return {
        qnaAnswer: showAList,
        qnaTotalFound: showAList.length
    }
}

export async function loadExpert(data, ctx) {

    let eqList;
    let eaList;
    //카테고리 선택에 따라 질문리비전 검색
    let prop1 = "";
    let prop2 = "";
    if (data.eventData) {
        if (data.eventData.node) {
            if (data.eventData.node.parent) {
                prop1 = data.eventData.node.parent;
                prop2 = data.eventData.node.label;
            } else {
                prop1 = data.eventData.node.label;
                prop2 = "";
            }
        } else if (data.eventData.folder) {
            if (data.eventData.parent) {
                prop1 = data.eventData.parent;
                prop2 = data.eventData.target;
            } else {
                prop1 = data.eventData.target;
                prop2 = "";
            }
        }
    }

    let inputData = {
        inflateProperties: true,
        searchInput: {
            attributesToInflate: [
                "object_name",
                "object_desc",
                "l2_category",
                "l2_main_category",
                "l2_subcategory",
                "item_id",
                "items_tag",
                "creation_date"
            ],
            internalPropertyName: "",
            maxToLoad: 50,
            maxToReturn: 50,
            startIndex: 0,
            providerName: "Awp0FullTextSearchProvider",
            searchCriteria: {
                searchString: "*",
            },
            searchFilterFieldSortType: "Priority",
            searchFilterMap6: {
                "WorkspaceObject.object_type": [
                    {
                        "searchFilterType": "StringFilter",
                        "stringValue": "L2_QuestionExpRevision",
                    }
                ],
                "POM_application_object.owning_user": [
                    {
                        "searchFilterType": "StringFilter",
                        "stringValue": ctx.user.props.user_name.dbValue + " ( " + ctx.user.props.userid.dbValue + " )",
                    }
                ],
                "POM_application_object.owning_group": [{
                    "searchFilterType": "StringFilter",
                    "stringValue": ctx.userSession.props.group_name.dbValues[0]
                }]
            }
        },
        noServiceData: false
    };
    let policy = {
        "types": [
            {
                "name": "L2_Question",
                "properties": [
                    { "name": "L2_AnswerRelation" },
                    { "name": "obejct_name" },
                ]
            }],
        "useRefCount": false
    };
    //검색 완료
    let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData, policy);
    let gigi = JSON.parse(abc.searchResultsJSON);
    var modelObjects = [];
    for (var i = 0; i < gigi.objects.length; i++) {
        var uid = gigi.objects[i].uid;
        var obj = abc.ServiceData.modelObjects[uid];
        modelObjects.push(obj);
    }
    let total = [];
    if (abc.ServiceData.modelObjects) {
        total = Object.values(abc.ServiceData.modelObjects);
    }
    //검색 결과에 따라 질문 리비전과 답변 아이템을 구분
    let questionList = [];
    let answerItem = [];
    let divRelation = [];
    for (let mo of total) {
        if (mo.type == "L2_QuestionExpRevision") {
            questionList.push(mo);
        } else if (mo.type == "L2_AnswerExp") {
            answerItem.push(mo.uid);
        } else if (mo.type == "L2_QuestionExp") {
            divRelation.push(mo);
        }
    }
    //답변 아이템 검색
    eqList = questionList;
    let param = {
        uids: answerItem
    }
    let policy2 = {
        "types": [{
            "name": "WorkspaceObject",
            "properties": [
                { "name": "contents" },
                { "name": "object_string" },
                { "name": "revision_list" }
            ]
        }],
        "useRefCount": false
    };
    let idSearchList = []
    try {
        let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
        for (let uid of answerItem) {
            idSearchList.push(serachResult.modelObjects[uid]);
        }
    } catch (err) {
        //console.log(err);
        notySvc.showError("내 전문가 질문 불러오기 실패");
    }
    // 답변 리비전조회
    let answerList = [];
    for (let mo of idSearchList) {
        answerList.push(mo.props.revision_list.dbValues[0]);
    }
    param = {
        uids: answerList
    }
    policy2 = {
        "types": [{
            "name": "L2_AnswerExpRevision",
            "properties": [
                { "name": "object_string" },
                { "name": "l2_content" },
                { "name": "l2_content_string" },
                { "name": "owning_user" },
                { "name": "creation_date" },
                { "name": "items_tag" }
            ]
        }],
        "useRefCount": false
    };
    let answerRevisions = []
    try {
        let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
        for (let uid of answerList) {
            answerRevisions.push(serachResult.modelObjects[uid]);
        }
        eaList = answerRevisions;
    } catch (err) {
        //console.log(err);
        notySvc.showError("내 전문가 질문의 댓글 불러오기 실패");
    }
    let vmoArray1 = [];
    let searchQList = {};
    for (let mo of eqList) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
        vmo.cellHeader1 = mo.props.object_name.uiValues[0];
        vmo.sendURL = browserUtils.getBaseURL() + "#/askExpert?question=" + vmo.uid;
        vmoArray1.push(vmo);
        searchQList[mo.props.items_tag.dbValues[0]] = vmo;
    }
    eqList = vmoArray1;
    let vmoArray2 = [];
    for (let mo of eaList) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
        vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
        vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
        let showAnswer = {};
        showAnswer[textAnswer] = {
            key: textAnswer,
            value: mo.props.l2_content_string.dbValues[0]
        }
        vmo.cellProperties = showAnswer;
        let obj1 = await cdmSvc.getObject(vmo.props.owning_user.dbValues[0]);
        await dmSvc.getProperties([vmo.props.owning_user.dbValues[0]], ["awp0ThumbnailImageTicket"]);
        let thumbnailUrl = obj1.props.awp0ThumbnailImageTicket.dbValues[0];
        if (thumbnailUrl == "" || thumbnailUrl == null) {
            vmo.typeIconURL = iconService.getTypeIconFileUrl("avatar-person.svg");
        } else {
            vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
        }
        vmoArray2.push(vmo);
    }
    eaList = vmoArray2;
    //관계 식별을 위해 uid값을 키값으로 넣기
    let qaRelation = {}
    let haveAList = {}
    for (let mo of divRelation) {
        let vals = mo.props.L2_AnswerRelation.dbValues
        haveAList[mo.uid] = vals;
        for (let uid of vals) {
            qaRelation[uid] = mo.uid;
        }
    }
    let showAList = [];
    for (let Qitem of eqList) {
        if (haveAList[Qitem.props.items_tag.dbValues[0]].length > 0) {
            for (let a of eaList) {
                if (qaRelation[a.props.items_tag.dbValues[0]] == Qitem.props.items_tag.dbValue) {
                    a.cellHeader1 = a.props.owning_user.uiValues[0];
                    a.cellHeader2 = a.props.creation_date.uiValues[0];
                    let showAnswer = {};
                    showAnswer[textAnswer] = {
                        key: textAnswer,
                        value: a.props.l2_content_string.dbValues[0]
                    }
                    a.cellProperties = showAnswer;
                    a.sendURL = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].sendURL;
                    a.qName = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].cellHeader1;
                    a.qUID = qaRelation[a.props.items_tag.dbValues[0]];
                    a.qDate = Date.parse(searchQList[qaRelation[a.props.items_tag.dbValues[0]]].props.creation_date.dbValues[0]);
                    let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
                    if (thumbnailUrl == "" || thumbnailUrl == null) {
                        a.typeIconURL = iconService.getTypeIconFileUrl("avatar-person.svg");
                    } else {
                        a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
                    }
                    // return true;
                    showAList.push(a);
                }
            }
        } else {
            Qitem.qName = Qitem.cellHeader1;
            Qitem.cellHeader1 = "";
            Qitem.cellHeader2 = textNoAnswer;
            Qitem.cellProperties = "";
            Qitem.qUID = Qitem.props.items_tag.dbValue;
            Qitem.qDate = Date.parse(Qitem.props.creation_date.dbValues[0]);
            showAList.push(Qitem);
        }
    }
    showAList.sort(function (a, b) {
        if (a.qDate <= b.qDate) {
            return 1;
        }
        return -1;
    })

    return {
        expertAnswer: showAList
    }

}


export async function loadrecentSearch(ctx, data) {

    const favoritesFolderUid = await lgepPreferenceUtils.getPreference("L2_DevKnowledge_Favorites");
    let getFolder = {
        uids: [favoritesFolderUid.Preferences.prefs[0].values[0].value]
    };
    try {
        getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    } catch (err) {
        //console.log(err);
        notySvc.showError("즐겨찾기 폴더 불러오기 실패");
    }
    getFolder = Object.values(getFolder.modelObjects)[0];

    await com.getProperties([getFolder], ["contents", "owning_user"]);

    let folders = getFolder.props.contents.dbValues;

    getFolder = {
        uids: folders
    };
    folders = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    folders = Object.values(folders.modelObjects);
    await com.getProperties(folders, ["contents", "owning_user", "creation_date", "object_string"]);

    recentFolder = [];
    for (let folder of folders) {
        if (folder.props.owning_user.dbValues[0] === ctx.user.uid && (folder.props.object_string.dbValues[0].includes(recentSearches) || folder.props.object_string.dbValues[0].includes("최근 검색"))) {
            recentFolder = folder;
            break;
        }
    }

    await com.getProperties(recentFolder, ["contents"]);

    let favoriteList = [];
    let vmoList = [];

    if (recentFolder) {
        for (let obj of recentFolder.props.contents.dbValues) {
            let item = cdmSvc.getObject(obj);
            if(item){
                favoriteList.push(item);
            }
        }
        let param = {
            objects: favoriteList,
            attributes: ["l2_like_count", "l2_average_rating", "IMAN_reference", "owning_user", "l2_reference_issues", "l2_creator",
                "l2_division", "l2_page_type", "l2_issue_class", "l2_issue_classes", "l2_item", "item_id", "l2_issue_date", "l2_source", "l2_image_path", "l2_page_index", "l2_file_name", "l2_issue_pred","l2_content_string"],
        }
        try {
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        } catch (err) {
            //console.log(err);
            notySvc.showError("아이템 속성 불러오기 실패");
        }
        let imageList = {};
        for (let mo of favoriteList) {
            if (mo.props.IMAN_reference != undefined && mo.props.IMAN_reference.dbValues.length > 0 && mo.type == "L2_IssuePageRevision") {
                let image = cdmSvc.getObject(mo.props.IMAN_reference.dbValues[0]);
                imageList[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
                checkImages[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
            }
        }

        for (let check of favoriteList) {
            if (check.type == "L2_IssuePageRevision") {
                let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
                if (vmo.props.l2_average_rating.dbValue > 0) {
                    vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
                }
                vmo.reviewCount = vmo.props.l2_like_count.dbValue;
                vmo.textReview = textReview;
                vmo.percent = (vmo.props.l2_average_rating.dbValue * 100 / 5).toFixed(1) + '%'
                let thumbnailUrl = imageList[vmo.props.IMAN_reference.dbValues[0]];
                if ((thumbnailUrl != "" || thumbnailUrl != null) && (thumbnailUrl)) {
                    vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
                    vmo.image = vmo.thumbnailURL;
                } else {
                    vmo.thumbnailURL = iconService.getTypeIconFileUrl("cmdLargeImageView24.svg");
                    vmo.image = vmo.thumbnailURL;
                }
                vmoList.push(vmo);
            }
        }
    }

    return {
        recentSearchValue: vmoList,
        totalFound: vmoList.length
    }
}


export function recentSearchData(response, startIndex, pageSize) {
    let datas = response.recentSearchValue;
    let endIndex = startIndex + pageSize;
    let searchResults = null;
    if (datas != null) {
        searchResults = datas.slice(startIndex, endIndex);
    }
    return searchResults;
}

export async function loadRecommended(data, ctx) {

    let recommendData;

    let serviceData = await lgepPreferenceUtils.getPreference("BatchServerRestfulHosting.URL")
    let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

    try {
        await fetch(batchServerAddress + '/userRecommend/selectUserRecommend?user_id=' + ctx.userSession.props.user_id.dbValue)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok.');
            }).then((result) => {
                recommendData = result;
                // console.log(result);
            }).catch((error) => {
                // console.log(`error: ${error}`)
            });

        recommendData.sort(function (a, b) {
            if (a.recommend_score >= b.recommend_score) {
                return -1;
            }
            return 1;
        });

        // 추후 테스트 할 쿼리문
        let serviceData2 = await lgepPreferenceUtils.getPreference("BatchServerRestfulHosting.URL")
        let batchServerAddress2 = serviceData2.Preferences.prefs[0].values[0].value;

        let list = [];

        for (let clsf of recommendData) {
            if (clsf.division == ctx.userSession.props.group_name.dbValue) {
                list.push(clsf.recommend_page);
            }
        }
        let searchValue = [];
        await fetch(batchServerAddress2 + '/l2IssuePage/selectl2IssuePageRev', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                clsfNoList: list
            })
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok.');
        }).then((result) => {
            for (let val of result) {
                searchValue.push(val.puid);
            }
        }).catch((error) => {
            // console.log('error: ${error}')
        });
        let param = {
            uids:searchValue
        }

        let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param);

        let mos = com.getObjects(searchValue);
        param = {
            objects: mos,
            attributes: ["l2_like_count", "l2_average_rating", "IMAN_reference", "owning_user", "l2_reference_issues", "l2_creator", "l2_clsf_no",
                "l2_division", "l2_page_type", "l2_issue_class", "l2_issue_classes", "l2_item", "item_id", "l2_issue_date", "l2_source", "l2_image_path", "l2_page_index", "l2_file_name", "l2_issue_pred","l2_content_string"],
        }
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        let imageList = {};
        for (let mo of mos) {
            let image = cdmSvc.getObject(mo.props.IMAN_reference.dbValues[0]);
            imageList[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
            checkImages[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
        }
        let vmoList = [];
        for (let check of mos) {
            let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
            if (vmo.props.l2_average_rating.dbValue > 0) {
                vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
            }
            vmo.reviewCount = vmo.props.l2_like_count.dbValue;
            vmo.textReview = textReview;
            vmo.percent = (vmo.props.l2_average_rating.dbValue * 100 / 5).toFixed(1) + '%'
            let thumbnailUrl = imageList[vmo.props.IMAN_reference.dbValues[0]];
            if ((thumbnailUrl != "" || thumbnailUrl != null) && (thumbnailUrl)) {
                vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
                vmo.image = vmo.thumbnailURL;
            } else {
                vmo.thumbnailURL = iconService.getTypeIconFileUrl("cmdLargeImageView24.svg");
                vmo.image = vmo.thumbnailURL;
            }
            if(vmo.props.is_modifiable.dbValues[0] == "1"){
                vmoList.push(vmo);
            }
        }
        return {
            recommendedValue: vmoList,
            totalFound: vmoList.length
        }

    } catch (err) {
        // console.log(err);
        notySvc.showError("지식 추천 불러오기 실패");
    }



    // let userFolder = null;
    // let targetUID = "QhuJO0KPZx_JkD";

    // //user1계정에 지정한 QnA폴더 위치 로드
    // let param = {
    //     uids: [targetUID]
    // }
    // let policy = {
    //     "types": [
    //         {
    //             "name": "Folder",
    //             "properties": [
    //                 { "name": "contents" },
    //             ]
    //         }],
    //     "useRefCount": false
    // };
    // try {
    //     let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy);
    //     userFolder = serachResult.modelObjects[targetUID];
    // } catch (err) {
    //     //console.log(err);
    // }
    // //QnA폴더에 하부에 있는 자료들 가져오기
    // let items = [];
    // param = {
    //     uids: userFolder.props.contents.dbValues,
    // }
    // try {
    //     let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param);
    //     for (let uid of userFolder.props.contents.dbValues) {
    //         items.push(serachResult.modelObjects[uid]);
    //     }
    // } catch (err) {
    //     //console.log(err);
    // }

    // param = {
    //     objects: items,
    //     attributes: ["l2_like_count", "l2_average_rating", "IMAN_reference", "owning_user", "l2_reference_issues",
    //         "l2_division", "l2_page_type", "l2_issue_class", "item_id", "l2_issue_date", "l2_image_path"],
    // }
    // try {
    //     await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
    // } catch (err) {
    //     //console.log(err);
    // }
    // let imageList = {};
    // for (let mo of items) {
    //     let image = cdmSvc.getObject(mo.props.IMAN_reference.dbValues[0]);
    //     imageList[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
    //     checkImages[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
    // }
    // let vmoList = [];
    // for (let check of items) {
    //     let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
    //     if (vmo.props.l2_average_rating.dbValue > 0) {
    //         vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
    //     }
    //     vmo.reviewCount = vmo.props.l2_like_count.dbValue;
    //     vmo.textReview = textReview;
    //     vmo.percent = (vmo.props.l2_average_rating.dbValue * 100 / 5).toFixed(1) + '%'
    //     let thumbnailUrl = imageList[vmo.props.IMAN_reference.dbValues[0]];
    //     if ((thumbnailUrl != "" || thumbnailUrl != null) && (thumbnailUrl)) {
    //         vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
    //         vmo.image = vmo.thumbnailURL;
    //     } else {
    //         vmo.thumbnailURL = iconService.getTypeIconFileUrl("cmdLargeImageView24.svg");
    //         vmo.image = vmo.thumbnailURL;
    //     }
    //     vmoList.push(vmo);
    // }

    // let vmoList = [];

    // return {
    //     recommendedValue: vmoList,
    //     totalFound: vmoList.length
    // }
}


export function recommendedData(response, startIndex, pageSize) {
    let datas = response.recommendedValue;
    let endIndex = startIndex + pageSize;
    let searchResults = null;
    if (datas != null) {
        searchResults = datas.slice(startIndex, endIndex);
    }
    return searchResults;
}

export async function loadFavoritesList(data, ctx) {

    let favoriteList = [];
    for (let obj of data.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.contents.dbValues) {
        let item = cdmSvc.getObject(obj);
        favoriteList.push(item);
    }
    let param = {
        objects: favoriteList,
        attributes: ["l2_like_count", "l2_average_rating", "IMAN_reference", "owning_user", "l2_reference_issues", "l2_creator",
            "l2_division", "l2_page_type", "l2_issue_class", "l2_issue_classes", "l2_item", "item_id", "l2_issue_date", "l2_source", "l2_image_path", "l2_page_index", "l2_file_name", "l2_issue_pred","l2_content_string"],
    }
    try {
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
    } catch (err) {
        //console.log(err);
        notySvc.showError("즐겨찾기 한 리스트 불러오기 실패");
    }
    let imageList = {};
    for (let mo of favoriteList) {
        if (mo.props.IMAN_reference.dbValues[0] != null && mo.type == "L2_IssuePageRevision") {
            let image = cdmSvc.getObject(mo.props.IMAN_reference.dbValues[0]);
            imageList[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
            checkImages[mo.props.IMAN_reference.dbValues[0]] = image.props.awp0ThumbnailImageTicket.dbValues[0];
        }
    }

    let vmoList = [];
    for (let check of favoriteList) {
        if (check.type == "L2_IssuePageRevision") {
            let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
            if (vmo.props.l2_average_rating.dbValue > 0) {
                vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
            }
            vmo.textReview = textReview;
            vmo.percent = (vmo.props.l2_average_rating.dbValue * 100 / 5).toFixed(1) + '%'
            let thumbnailUrl = imageList[vmo.props.IMAN_reference.dbValues[0]];
            if ((thumbnailUrl != "" || thumbnailUrl != null) && (thumbnailUrl)) {
                vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
                vmo.image = vmo.thumbnailURL;
            } else {
                vmo.thumbnailURL = iconService.getTypeIconFileUrl("cmdLargeImageView24.svg");
                vmo.image = vmo.thumbnailURL;
            }
            vmoList.push(vmo);
        }
    }

    return {
        favoritesValue: vmoList,
        totalFound: vmoList.length
    }
}


export function favoritesData(response, startIndex, pageSize) {
    let datas = response.favoritesValue;
    let endIndex = startIndex + pageSize;
    let searchResults = null;
    if (datas != null) {
        searchResults = datas.slice(startIndex, endIndex);
    }
    return searchResults;
}

export let getLastRevision = async function (response) {
    try {
        let getPropertiesParam = {
            objects: response,
            attributes: ["revision_list"]
        };
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

    } catch (err) {
        //console.log(err);
        notySvc.showError("아이템 속성 불러오기 실패");
    }

    // revision_list 중 최신것만 배열로 담기
    let targetRevisioList = [];
    for (let mo of response) {
        let revisionUid = mo.props.revision_list.dbValues[(mo.props.revision_list.dbValues.length) - 1];
        let revision = cdmSvc.getObject(revisionUid);
        targetRevisioList.push(revision);
    }

    // 담아온 리비전들에서 필요한 속성을 불러옴
    try {
        let getParam = {
            objects: targetRevisioList,
            attributes: ["creation_date", "owning_user", "l2_knowledge_type", "l2_good_count", "l2_view_count", "l2_point", "l2_title", "l2_content", "l2_content_string", "last_mod_date", "l2_material", "l2_part_type"],
        }
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", getParam);
    } catch (err) {
        //console.log(err);
        notySvc.showError("아이템 속성 불러오기 실패");
    }

    return targetRevisioList
}

export async function initFolderName(data) {
    if (makeFolderFlag) {
        data.box1.dbValue = "";
        data.box1.dispValue = "";
    } else {
        const htmlData = vms.getViewModelUsingElement(document.getElementById("folderNameData"));
        const folderName = htmlData.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.object_string.dbValues[0];
        data.box1.dbValue = folderName;
        data.box1.dispValue = folderName;
    }
}

export async function createFolder(data) {
    makeFolderFlag = true;
    popupService.show({
        declView: "controlFolder",
        locals: {
            caption: makeFolder
        },
        options: {
            clickOutsideToClose: false,
            isModal: false
        },
        outputData: {
            popupId: "id"
        }
    });
}

export async function setFolderName(data, ctx) {

    const favoritesFolderUid = await lgepPreferenceUtils.getPreference("L2_DevKnowledge_Favorites");

    if (makeFolderFlag) {
        let flag = false;
        if (data.box1.dbValue) {
            for (let folder of folderList) {
                if (data.box1.dbValue === folder.props.object_string.dbValues[0]) {
                    flag = true;
                    break;
                }
            }

            if (flag) {
                notySvc.showError(existSameFolder);
            } else {
                try {
                    let folderData = {
                        folders: [{
                            name: data.box1.dbValue,
                        }],
                        container: {
                            uid: favoritesFolderUid.Preferences.prefs[0].values[0].value
                        }
                    };
                    let createdFolder = await SoaService.post("Core-2006-03-DataManagement", "createFolders", folderData);
                    await common.userLogsInsert("Create Folder", createdFolder.uid, "S", "Success");
                    eventBus.publish("SPLMTableContextMenu.plTable.reload");

                } catch (err) {
                    //console.log(err);
                    notySvc.showError("즐겨찾기 폴더 생성 실패");
                }
            }
            popupService.hide(data.popupId);
        } else {
            notySvc.showError(noName);
        }

    } else {
        const htmlData = vms.getViewModelUsingElement(document.getElementById("folderNameData"));

        let flag = false;
        if (data.box1.dbValue) {
            for (let folder of folderList) {
                if (data.box1.dbValue === folder.props.object_string.dbValues[0]) {
                    flag = true;
                    break;
                }
            }

            if (flag) {
                notySvc.showError(existSameFolder);
            } else {
                try {
                    let setPropsItem = {
                        objects: [htmlData.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0]],
                        attributes: {
                            object_name: {
                                stringVec: [data.box1.dbValue]
                            }
                        }
                    }

                    await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                    await common.userLogsInsert("Update Folder", htmlData.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].uid, "S", "Success");
                    eventBus.publish("SPLMTableContextMenu.plTable.reload");

                } catch (err) {
                    //console.log(err);
                    notySvc.showError("즐겨찾기 폴더 수정 실패");
                }
            }
            htmlData.captionValue.value = data.box1.dbValue;
            popupService.hide(data.popupId);
        } else {
            notySvc.showError(noName);
        }
    }

}

export async function folderEdit(data) {
    const htmlData = vms.getViewModelUsingElement(document.getElementById("folderNameData"));
    if (htmlData.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects[0].props.object_string.dbValues[0] === recentSearches) {
        notySvc.showInfo(noEditRecent);
    } else {
        makeFolderFlag = false;
        popupService.show({
            declView: "controlFolder",
            locals: {
                caption: editFolder
            },
            options: {
                clickOutsideToClose: true,
                isModal: true
            },
            outputData: {
                popupId: "id"
            }
        });
    }
}

export async function folderDel(data, ctx) {
    const htmlData = vms.getViewModelUsingElement(document.getElementById("folderNameData"));

    const selectedObjects = htmlData.dataProviders.SPLMTableContxMenuDataProvider.selectedObjects;

    if (selectedObjects[0].props.object_string.dbValues[0] === recentSearches) {
        notySvc.showError(noDeleteRecent);
    } else {
        if (Array.isArray(selectedObjects) && selectedObjects.length > 0) {

            var buttonArray = [];
            buttonArray.push({
                addClass: 'btn btn-notify',
                text: buttonDelete,
                onClick: async function ($noty) {
                    $noty.close();
                    
                    try {
                        let deleteItem = {
                            objects: selectedObjects
                        }

                        await SoaService.post("Core-2006-03-DataManagement", "deleteObjects", deleteItem);
                        await common.userLogsInsert("Delete Folder", selectedObjects.uid, "S", "Success");
                    } catch(err) {
                        notySvc.showError("즐겨찾기 폴더 삭제 실패");
                    }


                    htmlData.flag.mainPanel = false;
                    htmlData.flag.recent = true;
                    htmlData.flag.recommended = true;
                }
            });
            buttonArray.push({
                addClass: 'btn btn-notify',
                text: buttonCancle,
                onClick: function ($noty) {
                    $noty.close();
                }
            });
            notySvc.showWarning(checkDeleteFolder, buttonArray);
        }
    }

}

export async function folderCopy(data) {
    //console.log("copy");
}

export async function addRecentSearch(data, ctx) {

    const favoritesFolderUid = await lgepPreferenceUtils.getPreference("L2_DevKnowledge_Favorites");

    let getFolder = {
        uids: [favoritesFolderUid.Preferences.prefs[0].values[0].value]
    };
    try {
        getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    } catch (err) {
        //console.log(err);
        notySvc.showError("즐겨찾기 폴더 불러오기 실패");
    }
    getFolder = Object.values(getFolder.modelObjects)[0];

    await com.getProperties([getFolder], ["contents", "owning_user"]);

    let folders = getFolder.props.contents.dbValues;

    getFolder = {
        uids: folders
    };
    folders = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    folders = Object.values(folders.modelObjects);
    await com.getProperties(folders, ["contents", "owning_user", "creation_date", "object_string"]);

    recentFolder = [];
    for (let folder of folders) {
        if (folder.props.owning_user.dbValues[0] === ctx.user.uid && (folder.props.object_string.dbValues[0].includes(recentSearches) || folder.props.object_string.dbValues[0].includes("최근 검색"))) {
            recentFolder = folder;
        }
    }

    await com.getProperties(recentFolder, ["contents"]);



    let recentList = [];
    let i = 0;
    if (recentFolder.props.contents.dbValues.length > 0) {
        for (let recent of recentFolder.props.contents.dbValues) {
            if(recent){
                recentList.push(recent);
            }
            if (recent === data.eventData.selectedUids[0].uid) {
                recentList.splice(i, 1);
            }
            i++;
        }
    }
    recentList.unshift(data.eventData.selectedUids[0].uid);
    recentList = recentList.slice(0, 10);

    try {
        let setPropsItem = {
            objects: [recentFolder],
            attributes: {
                contents: {
                    stringVec: recentList
                }
            }
        }

        await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
        await common.userLogsInsert("Load Page", data.eventData.selectedUids[0].uid, "S", "Success");

    } catch (err) {
        // console.log(err);
        notySvc.showError("최근 검색 페이지 등록 실패");
    }

}

export async function closePopup(data) {

    const htmlData = vms.getViewModelUsingElement(document.getElementById("test1"));
    if (htmlData != undefined) {
        popupService.hide(htmlData.popupId);
    }

}

export async function clearRecentAction(data, ctx) {

    if (data.recentSearchValue.length != 0) {

        var buttonArray = [];
        buttonArray.push({
            addClass: 'btn btn-notify',
            text: buttonDelete,
            onClick: async function ($noty) {
                $noty.close();

                try {
                    let setPropsItem = {
                        objects: [recentFolder],
                        attributes: {
                            contents: {
                                stringVec: []
                            }
                        }
                    }

                    await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                    await common.userLogsInsert("Delete Recent List All", "", "S", "Success");
                } catch (err) {
                    //console.log(err);
                    notySvc.showError("최근 검색 목록 삭제 실패");
                }

                eventBus.publish("recentList.clear");

            }
        });
        buttonArray.push({
            addClass: 'btn btn-notify',
            text: buttonCancle,
            onClick: function ($noty) {
                $noty.close();
            }
        });
        notySvc.showWarning(checkDeleteRecent, buttonArray);
    } else {
        notySvc.showError(noRecent);
    }
}

export async function setSelectedNone(data, param) {

    data.dataProviders[param].selectionModel.selectNone();

}

export function vmReload(data, ctx) {
    let dataPros = Object.values(data.dataProviders);
    if (dataPros.length > 0) {
        for (let dataPro of dataPros) {
            if (dataPro.viewModelCollection.loadedVMObjects.length > 0 && dataPro.viewModelCollection.loadedVMObjects[0].type == "L2_IssuePageRevision") {
                let vmos = dataPro.viewModelCollection.loadedVMObjects;
                for (let vmo of vmos) {
                    vmo.reviewCount = vmo.props.l2_like_count.dbValue;
                    vmo.percent = (vmo.props.l2_average_rating.dbValue * 100 / 5).toFixed(1) + '%';
                }
                dataPro.viewModelCollection.loadedVMObjects = vmos;
            }
        }
    }
}

let exports = {};

export default exports = {
    controlPage,
    dataLoad,
    createFolder,
    initFolderName,
    setFolderName,
    closeRecentAction,
    closeRecommendedAction,
    closeMyQnaAction,
    loadQna,
    loadExpert,
    loadrecentSearch,
    recentSearchData,
    loadRecommended,
    recommendedData,
    loadFavoritesList,
    favoritesData,
    folderEdit,
    folderDel,
    folderCopy,
    addRecentSearch,
    closePopup,
    clearRecentAction,
    setSelectedNone,
    vmReload
};
app.factory('knowledgeMyDocumentService', () => exports);