import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import dataManagementService from 'soa/dataManagementService';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import notySvc from 'js/NotyModule';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import viewModelService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import query from 'js/utils/lgepQueryUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import common from "js/utils/lgepCommonUtils";
import message from 'js/utils/lgepMessagingUtils';
import advancedSearchUtils from 'js/advancedSearchUtils';

var $ = require('jQuery');

let firstPage = 1;
let lastPage = 1;
let nowPage = 1;
let dividePage = 5;
let showItem = 20;

let qnaFolder = null; //qna폴더 모델 오브젝트
// let textAnswer = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "answer"); 
let textDelete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "delete");
let textDeleteComplete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "deleteComplete");
let textCancle = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cancle");
let checkDeleteQuestion = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkDeleteQuestion");
let notQuestionCreator = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "notQuestionCreator");

export async function loadQaList(data, ctx) {
    let element = document.getElementsByClassName("leftPadding");
    let tableSize = localStorage.getItem('tableSize');
    element[0].style.flexBasis = tableSize != "" ? tableSize : "630px";
    initialize();
    data.checkEdit = false;

    let searchingQuestion = [];
    try{
        let returnData = await searchQuestion(ctx.userSession.props.group_name.dbValue,showItem,ctx.searchString,(nowPage-1)*showItem);
        searchingQuestion = returnData.modelObjects;
        await common.userLogsInsert("Load FAQ", "", "S", "Success");
    }catch(err){
        await common.userLogsInsert("Load FAQ", "", "F", "Fail");
        message.show(1,"질문 로드 중 오류가 발생했습니다.")
    }
    

    // searchingQuestion.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));
    return {
        qaList: searchingQuestion,
        totalFound: searchingQuestion.length
    }
}

export function filterList(response, data) {
    response = response.qaList;

    return response
}
export function inputWinodwAdd(data) {
    let inputWindow = "faqAdd"
    return inputWindow
}
export function inputWinodwEdit(data) {
    let inputWindow = "faqEdit"
    return inputWindow
}

export async function showQuestionProp(data) {
    let propId = data.qaID;
    let propTitle = data.qaTitle;
    let propContent = data.qaContent;
    let propWriter = data.qaWriter;
    let propWriteDate = data.qaWriteDate;
    let selected = data.dataProviders.qaListDataProvider.selectedObjects[0];
    let viewCount = selected.props.l2_views.dbValues[0];
    propId.uiValue = selected.cellHeader2;
    propId.dbValue = selected.cellHeader2;
    propTitle.uiValue = selected.props.object_name.uiValue;
    let content = ""
    try{
        content = await lgepSummerNoteUtils.readHtmlToSummernote(selected);
    }catch(err){
        //console.log(err);
    }
    //써머노트 내용 삽입
    $('#qaContentSummernoteQ').summernote('reset');
    $('#qaContentSummernoteQ').summernote('code', content + '<br>');
    // $('#qaContentSummernoteA').summernote('reset');
    // if (selected.props.object_desc.dbValues[0] == null) {
    //     selected.props.object_desc.dbValues[0] = "";
    // }
    // $('#qaContentSummernoteA').summernote('code', selected.props.object_desc.dbValues[0] + '<br>');
    propContent.dbValue = selected.props.l2_content.dbValues[0];
    propWriter.uiValue = selected.props.owning_user.uiValue;
    propWriteDate.uiValue = selected.props.creation_date.uiValue;
    if (typeof (history.pushState) != "undefined") { 
        history.pushState(null, null, '#/faq?question=' + selected.uid); 
    }

    viewCount = Number(viewCount);
    viewCount++;

    let param = {
        objects: [selected],
        attributes: {
            l2_views: {
                stringVec: [String(viewCount)]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }
}
export async function faqDelete(data,id,title,writer,writerDate,ctx) {
    let selectedQ = data.qaListDataProvider.selectedObjects[0];
    if (selectedQ != undefined && selectedQ.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
        let index = data.qaListDataProvider.selectedObjects[0];
        let selectedQId = index.props.item_id.dbValue;
        //noty
        var buttonArray = [];
        buttonArray.push({
            addClass: 'btn btn-notify',
            text: textDelete,
            onClick: async function ($noty) {
                $noty.close();
                await lgepSummerNoteUtils.deleteRelation(selectedQ);
                let item = {
                    infos: [{
                        itemId: selectedQId,
                    }]
                };
                try {
                    item = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", item);
                    item = item.output[0].item;
                } catch (err) {
                    //console.log(err);
                }
                let Param = {
                    objects: [cdmSvc.getObject(item.uid)]
                }
                try {
                    await common.userLogsInsert("Delete FAQ", item.uid, "S", "Success");
                    await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', Param);
                } catch (err) {
                    //console.log(err)
                }
                
                id.uiValue="";
                title.uiValue="";
                //써머노트 내용 삽입
                $('#qaContentSummernoteQ').summernote('reset');
                $('#qaContentSummernoteQ').summernote('code', "" + '<br>');
                $('#qaContentSummernoteA').summernote('reset');
                $('#qaContentSummernoteA').summernote('code', "" + '<br>');
                writer.uiValue="";
                writerDate.uiValue="";
                history.pushState(null, null, '#/faq'); 
                notySvc.showInfo(textDeleteComplete);
            }
        });
        buttonArray.push({
            addClass: 'btn btn-notify',
            text: textCancle,
            onClick: function ($noty) {
                $noty.close();
            }
        });
        notySvc.showWarning(checkDeleteQuestion, buttonArray);
    } else {
        notySvc.showWarning(notQuestionCreator);
    }

}

export function initialize() {
    $('#qaContentSummernoteQ').summernote({
        tabsize: 0,
        height: 430,
        width: '100%',
        styleWithSpan: true,
        toolbar: []
    });
    $('#qaContentSummernoteQ').summernote('disable');
    $("#qaContentSummernoteQ").css("background-color", "white");

    $('#qaContentSummernoteA').summernote({
        tabsize: 0,
        height: 450,
        width: '100%',
        styleWithSpan: true,
        toolbar: []
    });
    $('#qaContentSummernoteA').summernote('disable');
    $("#qaContentSummernoteA").css("background-color", "white");
}

async function setPageNumber(data,ctx){
    let returnData = await searchQuestion(ctx.userSession.props.group_name.dbValue,1,ctx.searchString,0);
    let service = returnData.serviceData;
    lastPage = Math.ceil(service.totalFound/showItem);
    let frontPage = Math.floor((nowPage-1)/dividePage)*dividePage+1;
    let behindPage = (frontPage-1)+dividePage;
    if(behindPage>lastPage){
        behindPage = lastPage;
    }
    let pageResponse = [];
    for (let i = frontPage; i <= behindPage; i++) {
        let select;
        if(i == nowPage){
            select = true
        } else {
            select = false
        }
        pageResponse.push(
            {
                "chipType": "SELECTION",
                "labelDisplayName": String(i),
                "selected":select
            }
        )
    }
    if (nowPage != 1) {
        data.beforePage.uiValue = "<"
        data.firstPage.uiValue = "≪"
    } else {
        data.beforePage.uiValue = ""
        data.firstPage.uiValue = ""
    }

    if (nowPage != lastPage) {
        data.afterPage.uiValue = ">"
        data.lastPage.uiValue = "≫"
    } else {
        data.afterPage.uiValue = ""
        data.lastPage.uiValue = ""
    }

    if(lastPage == 0){
        data.beforePage.uiValue = ""
        data.firstPage.uiValue = ""
        data.afterPage.uiValue = ""
        data.lastPage.uiValue = ""
    }

    return{
        pageResponse:pageResponse,
        pageLength:pageResponse.length
    }
}

function clickedPageAction(data,ctx,chip){
    nowPage = Number(chip.labelDisplayName);
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

function firstPageAction(data,ctx){
    nowPage = firstPage;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

function pagingBeforeAction(data){
    nowPage -= 1;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

function pagingAfterAction(data){
    nowPage += 1;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

function lastPageAction(data){
    nowPage = lastPage;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

/**
*PerformSearch로 질문 목록 가져오기
*
* @param {string} group - 그룹명
* @param {number} searchNum - 한번에 불러올 검색 갯수
* @param {string} searchString - 검색값
* @param {number} startIndex - 페이징 처리시 처음 불러올 부분
*/
async function searchQuestion(group, searchNum, searchString, startIndex) {
    if(searchString){
        searchString = "*" + searchString + "*"
    } else {
        searchString = "*"
    }
    let param = {
        "columnConfigInput": {
            "clientName": "AWClient",
            "clientScopeURI": "Awp0AdvancedSearch",
            "operationType": "Intersection",
            "hostingClientName": "",
            "columnsToExclude": []
        },
        "saveColumnConfigData": {
            "columnConfigId": "",
            "clientScopeURI": "",
            "columns": [],
            "scope": "",
            "scopeName": ""
        },
        "searchInput": {
            "maxToLoad": searchNum,
            "maxToReturn": searchNum,
            "providerName": "Awp0SavedQuerySearchProvider",
            "searchCriteria": {
                "Name":searchString,
                "queryUID": "Q0hJ_1nr5p7XAC",
                "searchID": advancedSearchUtils.getSearchId( "Q0hJ_1nr5p7XAC" ),
                "typeOfSearch": "ADVANCED_SEARCH",
                "utcOffset": "540",
                "lastEndIndex": "",
                "totalObjectsFoundReportedToClient": "",
                "Type": "L2_FAQRevision",
                "OwningGroup": group
            },
            "searchFilterFieldSortType": "Priority",
            "startIndex": startIndex,
            "searchFilterMap6": {},
            "searchSortCriteria": [{
                fieldName: "creation_date",
                sortDirection: "DESC"
            }],
            "attributesToInflate": [
                "object_name",
                "owning_user",
                "last_mod_user",
                "last_mod_date",
                "object_desc",
                "release_status_list",
                "item_revision_id",
                "creation_date", 
                "owning_user", 
                "l2_content", 
                "item_id", 
                "l2_views", 
                "items_tag", 
                "l2_point", 
                "l2_complete", 
                "owning_group", 
                "l2_reference_targets"
            ],
            "internalPropertyName": "",
            "columnFilters": [],
            "cursor": {
                "startIndex": 0,
                "endIndex": 0,
                "startReached": false,
                "endReached": false
            },
            "focusObjUid": "",
            "pagingType": ""
        },
        "inflateProperties": true,
        "noServiceData": false
    }
    let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);
    var modelObjects = [];
    var modelUid = abc.ServiceData.plain
    if(modelUid && modelUid.length>0){
        for (let uid of modelUid) {
            var obj = abc.ServiceData.modelObjects[uid];
            modelObjects.push(obj);
        }
    }
    return {
        "modelObjects":modelObjects,
        "serviceData":abc
    }
}

function questionSearch(data,ctx){
    ctx.searchString = data.searchBox.dbValue;
    nowPage = 1;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

let exports = {};

export default exports = {
    loadQaList,
    filterList,
    inputWinodwAdd,
    inputWinodwEdit,
    showQuestionProp,
    faqDelete,
    initialize,
    setPageNumber,
    clickedPageAction,
    firstPageAction,
    pagingBeforeAction,
    pagingAfterAction,
    lastPageAction,
    questionSearch
};
app.factory('questionAnswer', () => exports);