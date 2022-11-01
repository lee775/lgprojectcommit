import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import dataManagementService from 'soa/dataManagementService';
import vms from 'js/viewModelService';
import query from 'js/utils/lgepQueryUtils';
import com from "js/utils/lgepObjectUtils";
import eventBus from 'js/eventBus';
import iconService from 'js/iconService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import notySvc from 'js/NotyModule';
import message from 'js/utils/lgepMessagingUtils';
import viewModelService from 'js/viewModelObjectService';
import fmsUtils from 'js/fmsUtils';
import browserUtils from 'js/browserUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import common from "js/utils/lgepCommonUtils";
import advancedSearchUtils from 'js/advancedSearchUtils';
var $ = require('jQuery');

let selectAnswer = [];
let checkEdit = false;

let textAnswer = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "answer");
let textAdopt = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "adopt");
let deleteComplete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "deleteComplete");
let checkDeleteQuestion = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkDeleteQuestion");
let notQuestionCreator = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "notQuestionCreator");
let cannotDelete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cannotDelete");
let checkClickDislike = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkClickDislike");
let checkClickLike = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkClickLike");
let checkDislike = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkDislike");
let checkDeleteAnswer = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "checkDeleteAnswer");
let notAnswerCreator = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "notAnswerCreator");
let buttonDelete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "delete");
let buttonCancle = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cancle");
let buttonClose = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "close");
let noExistExpert = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "noExistExpert");
let noExpert = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "noExpert");
let yes = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "yes");
let no = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "no");
let cantDeleteAdoptedQuestion = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cantDeleteAdoptedQuestion");
let cantDeleteAdoptedAnswer = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cantDeleteAdoptedAnswer");
let cantDeleteQuestion = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cantDeleteQuestion");
let cantDeleteAnswer = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "cantDeleteAnswer");

let firstPage = 1;
let lastPage = 1;
let nowPage = 1;
let dividePage = 5;
let showItem = 20;

export function qnaLinkEventAction(data) {
    window.open(browserUtils.getBaseURL() + "#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=" + data.eventData.scope.prop.uid);
}

//욱채가 만든 메소드
export async function adopt(data, value, valueQuestion) {
    let selectedQ = data.dataProviders.qaListDataProvider.selectedObjects[0];
    let selectedA = data.dataProviders.qaAnswerList.selectedObjects[0];
    let owningUser = selectedA.props.owning_user.uiValue;
    let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
    if(searchingUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningUser);

        searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
    }
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ["l2_point", "l2_selected_knowledge_count"]);

    let setPoint = data.qaPoint.uiValue;
    setPoint = parseInt(setPoint);
    let userPoint = searchingUser.props.l2_point.uiValues[0];
    userPoint = parseInt(userPoint);
    setPoint = setPoint + userPoint;
    setPoint = String(setPoint);

    let minusUserId = selectedQ.props.owning_user.uiValue;
    let minusUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [minusUserId]);
    if(minusUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(minusUserId);

        minusUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
    }
    minusUser = minusUser[0];
    await com.getProperties([minusUser], ["l2_point"]);
    let minusUserPoint = parseInt(minusUser.props.l2_point.uiValues[0]) - parseInt(data.qaPoint.uiValue);
    minusUserPoint = String(minusUserPoint);

    let userAdopt = searchingUser.props.l2_selected_knowledge_count.uiValues[0];
    userAdopt = parseInt(userAdopt);
    userAdopt++;
    userAdopt = String(userAdopt);

    let param = {
        objects: [selectedA],
        attributes: {
            l2_is_selected: {
                stringVec: ["Y"]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    param = {
        objects: [selectedQ],
        attributes: {
            l2_complete: {
                stringVec: ["Y"]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    param = {
        objects: [searchingUser],
        attributes: {
            l2_point: {
                stringVec: [setPoint]
            },
            l2_selected_knowledge_count: {
                stringVec: [userAdopt]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    param = {
        objects: [minusUser],
        attributes: {
            l2_point: {
                stringVec: [minusUserPoint]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    param = {
        objects: [valueQuestion],
        attributes: {
            l2_complete: {
                stringVec: ["Y"]
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }

    data.adoptState = true;
    eventBus.publish("qaAnswerList.listUpdated");
    eventBus.publish("chartReLoad");
}
//욱채가 만든 메소드

export async function loadQaList(data, ctx) {
    data.showCategory = "show";
    data.window = "askExpert";

    let element = document.getElementsByClassName("leftPadding");
    let tableSize = localStorage.getItem('tableSize');
    element[0].style.flexBasis = tableSize != "" ? tableSize : "630px";
    initialize();
    let searchingQuestion = [];
    try{
        let returnData = await searchQuestion(ctx.userSession.props.group_name.dbValue,showItem,ctx.searchString,(nowPage-1)*showItem);
        searchingQuestion = returnData.modelObjects;
    }catch(err){
        message.show(1,"질문 로드 중 오류가 발생했습니다.")
    }

    let userData = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], ["*"]);
    await com.getProperties(userData, ["l2_user_id", "l2_is_expert"]);
    let expertList = [];
    for (let user of userData) {
        if (user.props.l2_is_expert.dbValues[0] == '1') {
            expertList.push(user.props.l2_user_id.dbValues[0]);
        }
    }

    await common.userLogsInsert("Load Expert Q&A", "", "S", "Success");

    return {
        qaList: searchingQuestion,
        totalFound: searchingQuestion.length,
        window: "askExpert",
        expert: expertList
    }
}
//필터기능
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
    data.answerAdd = false;
    $('#qnaAnswerContent').summernote('reset');
    
    let propId = data.qaID;
    let propTitle = data.qaTitle;
    let propPoint = data.qaPoint;
    let propContent = data.qaContent;
    let propWriter = data.qaWriter;
    let propWriteDate = data.qaWriteDate;
    let selected = data.dataProviders.qaListDataProvider.selectedObjects[0];
    let viewCount = selected.props.l2_views.dbValues[0];
    let expertUser = com.getObject(selected.props.l2_experts.dbValues[0]);
    await com.getProperties(expertUser, ["l2_expert_coverages", "l2_user_name"]);

    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(selected.props.owning_user.uiValue);
    propId.uiValue = matches[1];
    
    propTitle.uiValue = selected.props.object_name.uiValue;
    await com.getProperties([selected], ["l2_reference_targets"]);
    let relationItem = com.getObjects(selected.props.l2_reference_targets.dbValues);
    let param1 = {
        objects: relationItem,
        attributes: ["object_name"]
    }
    try {
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", param1);
    } catch (err) {
        //console.log(err);
    }
    backSpacePopupAction(data,relationItem);
    //써머노트 내용 삽입 
    if (selected.props.l2_content.dbValues[0] == null) {
        selected.props.l2_content.dbValues[0] = ""
    }
    let content = await lgepSummerNoteUtils.readHtmlToSummernote(selected);
    $('#qaContentSummernote').summernote('reset');
    $('#qaContentSummernote').summernote('code', content);
    propContent.dbValue = selected.props.l2_content.dbValues[0];
    propWriter.uiValue = selected.props.owning_user.uiValue;
    propWriteDate.uiValue = selected.props.creation_date.uiValue;
    data.expertField.uiValue = selected.props.l2_main_category.dbValues[0];
    propPoint.uiValue = selected.props.l2_point.dbValue === null ? "0" : String(selected.props.l2_point.dbValue);
    if (data.dataProviders.qaAnswerList.selectedObjects[0] != undefined) {
        checkEdit = false;
    }
    data.checkEdit = checkEdit;

    if (typeof (history.pushState) != "undefined") {
        history.pushState(null, null, '#/askExpert?question=' + selected.uid);
    }

    if (expertUser != null) {
        data.expertName.uiValue = expertUser.props.object_name.uiValues[0];
    } else {
        data.expertName.uiValue = "";
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

    eventBus.publish("initSummernote");
}

export function initialize() {
    $('#qaContentSummernote').summernote({
        tabsize: 0,
        height: 350,
        width: '100%',
        styleWithSpan: true,
        toolbar: []
    });
    $('#qaContentSummernote').summernote('disable');
    $("#qaContentSummernote").css("background-color", "white");
    $('#qnaAnswerContent').summernote({
        width: "100%",
        height: 200,
        toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline','strikethrough', 'clear']],
            ['color', ['forecolor','color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert',['picture','link']],
            ['codeview']
        ],
        fontSizes: ['8','9','10','11','12','14','16','18','20','22','24','28','30','36','50','72']
    });
    $('#qnaAnswerContent').summernote('enable');
}
export async function setAnswerListStyle(data, ctx) {
    
    let listHtml = document.querySelectorAll('.listClass > div > div > div > ul > li');
    let listHtml2 = document.querySelectorAll('.listClass .aw-widgets-cellListCellImage');
    let listHtml3 = document.querySelectorAll('.listClass .aw-widgets-cellListItemContainer .aw-widgets-cellListItemCell');

    let i = 0;
    for(let li of listHtml) {
        if(li.innerText.includes(ctx.user.props.object_string.dbValue)) {
            li.style.backgroundColor = ctx.theme == "ui-lgepDark" ? "#31393f" : "#f0f0f0";
            li.style.alignSelf = "self-end";
            li.style.textAlignLast = "end";
            listHtml2[i].style.display = "none";
            listHtml3[i].style.marginLeft = "22px";
        }
        i++;
    }

}
export async function setAnswerListBgStyle(data, ctx) {

    let listHtml = document.querySelectorAll('.listClass > div > div > div > ul > li');

    for(let li of listHtml) {
        if(li.innerText.includes(ctx.user.props.object_string.dbValue)) {
            li.style.backgroundColor = ctx.theme == "ui-lgepDark" ? "#31393f" : "#f0f0f0";
        }
    }
    
}
export async function loadAnswerList(data, ctx) {

    let adoptState = false;
    let selected = data.dataProviders.qaListDataProvider.selectedObjects[0];
    if (selected != undefined) {
        let itemList = [];
        itemList.push(com.getObject(selected.props.items_tag.value));
        let param = {
            objects: itemList,
            attributes: ["L2_AnswerRelation"]
        }
        try {
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        } catch (err) {
            //console.log(err);
        }

        let qaRevisionList = [];
        for (let item of itemList[0].props.L2_AnswerRelation.uiValues) {
            let searchingQuestion = await query.executeSavedQuery("PostSearch", ["L2_object_type", "L2_item_id"], ["L2_AnswerExpRevision", item]);
            qaRevisionList.push(searchingQuestion[0]);
        }

        param = {
            objects: qaRevisionList,
            attributes: ["object_name", "creation_date", "owning_user", "l2_content", "l2_content_string", "item_id", "l2_is_selected", "items_tag","IMAN_specification","l2_reference_targets"]
        }
        try {
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        } catch (err) {
            //console.log(err);
        }

        qaRevisionList.sort((a, b) => new Date(a.props.creation_date.dbValues[0]) - new Date(b.props.creation_date.dbValues[0]));

        for(let check of qaRevisionList) {
            if(check.props.l2_is_selected.dbValues[0] === "Y") {
                adoptState = true;
            }
        }

        return {
            answerList: qaRevisionList,
            totalFound: qaRevisionList.length,
            adoptState: adoptState
        }
    }
}

export async function answerList(response, data) {
    response = response.answerList;

    //모델 오브젝트를 뷰모델 오브젝트로 전환
    let vmoArray = [];
    for (let mo of response) {
        let iman = cdmSvc.getObjects(mo.props.IMAN_specification.dbValues);
        let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
        vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
        vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
        // let showAnswer = {}
        // showAnswer[textAnswer] = {
        //     key: textAnswer,
        //     value: mo.props.l2_content.dbValues[0]
        // }
        vmo.cellProperties = "";

        let count = await query.executeSavedQuery("ReplySearch", ["L2_item_id", "L2_object_type"], [mo.props.item_id.uiValues[0], "L2_LikeRevision"]);
        vmo.props.l2_good_count = count != null ? count.length : 0;

        let param = {
            objects: [cdmSvc.getObject(mo.props.owning_user.dbValues[0])],
            attributes: ["object_name"]
        }
        try {
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        } catch (err) {
            //console.log(err);
        }
        if(iman!=null && Array.isArray(iman)){
            for(let img of iman){
                // let linkTicket = img.props.awp0ThumbnailImageTicket.dbValues[0];
                // let link = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(linkTicket) + '?ticket=' + linkTicket;
                // vmo.props.l2_content.dbValues[0] = vmo.props.l2_content.dbValues[0].replace('src=""', 'src="' + link + '"');
                vmo.props.l2_content.dbValues[0] = await lgepSummerNoteUtils.readHtmlToSummernote(mo);
            }
        } else if(iman!=null && !Array.isArray(iman)){
            // let linkTicket = iman.props.awp0ThumbnailImageTicket.dbValues[0];
            // let link = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(linkTicket) + '?ticket=' + linkTicket;
            vmo.props.l2_content.dbValues[0] = await lgepSummerNoteUtils.readHtmlToSummernote(mo);
        }
        let thumbnailUrl = cdmSvc.getObject(mo.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
        if (thumbnailUrl === null || thumbnailUrl === "") {
            vmo.typeIconURL = iconService.getTypeIconFileUrl("avatar-person.svg");
            vmo.thumbnailURL = "";
            vmo.hasThumbnail = false;
        } else {
            vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
            vmo.thumbnailURL = "";
            vmo.hasThumbnail = false;
        }
        vmoArray.push(vmo);
    }
    let temp;
    for (let i = 0; i < vmoArray.length; i++) {
        if (vmoArray[i].props.l2_is_selected.uiValues[0] == "Y") {
            temp = vmoArray.splice(i, 1);
            break;
        }
    }

    if (temp != undefined) {
        vmoArray.unshift(temp[0]);
    }

    response = vmoArray;
    return response
}

//질문삭제
export async function askExpertDelete(data, lists, ctx, id, title, writer, writerDate, point, expertField, expertName) {
    let selectedQ = data.qaListDataProvider.selectedObjects[0];
    let selectedA = data.qaAnswerList.selectedObjects[0];
    let owningQuestionUser = selectedQ.props.owning_user.uiValues[0];
    let questionUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningQuestionUser]);
    if(questionUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningQuestionUser);

        questionUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
    }
    questionUser = questionUser[0];
    await com.getProperties([questionUser], ["l2_knowledge_count"]);
    let questionCnt = Number(questionUser.props.l2_knowledge_count.dbValues[0]);

    //질문만 선택된 경우
    if (selectedQ != undefined && selectedA == undefined) {
        if(selectedQ.props.l2_complete.dbValues[0] === "Y") {
            notySvc.showError(cantDeleteAdoptedQuestion);
        } else if(selectedQ.props.owning_user.dbValues[0] != ctx.user.uid) {
            notySvc.showError(cantDeleteQuestion);
        } else {
    
            if (selectedQ.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
                var buttonArray = [];
                buttonArray.push({
                    addClass: 'btn btn-notify',
                    text: buttonDelete,
                    onClick: async function ($noty) {
                        $noty.close();
                        await lgepSummerNoteUtils.deleteRelation(selectedQ);
                        let selectedQId = selectedQ.props.item_id.dbValue;
                        let selectedQtem = {
                            infos: [{
                                itemId: selectedQId,
                            }]
                        };
                        try {
                            selectedQtem = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", selectedQtem);
                            selectedQtem = selectedQtem.output[0].item;
                        } catch (err) {
                            //console.log(err);
                        }
                        let replyList = [];
                        replyList = com.getObject(selectedQtem.props.L2_AnswerRelation.dbValues);
    
                        for (let reply of replyList) {
                            let param = {
                                input:
                                    [{
                                        clientId: "",
                                        relationType: "L2_AnswerRelation",
                                        primaryObject: selectedQtem,
                                        secondaryObject: reply
                                    }]
                            }
                            try {
                                await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
                            } catch (err) {
                                //console.log(err)
                            }
                        }
    
                        let param = {
                            objects: replyList
                        }
                        try {
                            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', param);
                        } catch (err) {
                            //console.log(err)
                        }
                        //질문 삭제
                        let Param = {
                            objects: [selectedQtem]
                        }
                        try {
                            await common.userLogsInsert("Delete Expert Question", selectedQ.uid, "S", "Success");
                            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', Param);
                        } catch (err) {
                            //console.log(err)
                        }
    
                        questionCnt--;
    
                        try {
                            let setPropsItem = {
                                objects: [questionUser],
                                attributes: {
                                    l2_knowledge_count: {
                                        stringVec: [String(questionCnt)]
                                    }
                                }
                            }
                            await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                        } catch (err) {
                            //console.log(err);
                        }
                        id.uiValue = "";
                        title.uiValue = "";
                        //써머노트 내용 삽입
                        $('#qaContentSummernote').summernote('reset');
                        $('#qaContentSummernote').summernote('code', "" + '<br>');
                        writer.uiValue = "";
                        writerDate.uiValue = "";
                        point.uiValue = "";
                        expertField.uiValue="";
                        expertName.uiValue="";
                        history.pushState(null, null, '#/askExpert');
                        eventBus.publish("qaAnswerList.listUpdated");
                        eventBus.publish("qaList.plTable.reload");
                        notySvc.showInfo(deleteComplete);
                    }
                });
                buttonArray.push({
                    addClass: 'btn btn-notify',
                    text: buttonCancle,
                    onClick: function ($noty) {
                        $noty.close();
                    }
                });
                notySvc.showWarning(checkDeleteQuestion, buttonArray);
    
            } else {
                notySvc.showInfo(notQuestionCreator);
            }

        }
        //답변이 선택된 경우
    } else if (selectedQ != undefined && selectedA != undefined) {

        if(selectedA.props.l2_is_selected.dbValues[0] === 'Y') {
            notySvc.showError(cantDeleteAdoptedAnswer);
        } else if(selectedA.props.owning_user.dbValues[0] != ctx.user.uid) {
            notySvc.showError(cantDeleteAnswer);
        } else {

            let owningAnswerUser = selectedA.props.owning_user.uiValues[0];
            let answerUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningAnswerUser]);
            if(answerUser === null) {
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(owningAnswerUser);

                answerUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
            }
            answerUser = answerUser[0];
            await com.getProperties([answerUser], ["l2_answer_count"]);
            let answerCnt = Number(answerUser.props.l2_answer_count.dbValues[0]);
            
            if (selectedA.props.l2_is_selected.dbValues[0] == "Y") {
                message.show(1, cannotDelete, [buttonClose], [
                    function () { }
                ]);
            }
            else {
                if (selectedA.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
                    let selectedAId = selectedA.props.items_tag.displayValues[0];
    
                    //noty
                    var buttonArray = [];
                    buttonArray.push({
                        addClass: 'btn btn-notify',
                        text: buttonDelete,
                        onClick: async function ($noty) {
                            $noty.close();
                            try{
                                await lgepSummerNoteUtils.deleteRelation(selectedA);
                            }catch(err){
                                //console.log(err);
                            }
                            let selectedQId = selectedQ.props.item_id.dbValue;
                            let selectedQtem = {
                                infos: [{
                                    itemId: selectedQId,
                                }]
                            };
                            try {
                                selectedQtem = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", selectedQtem);
                                selectedQtem = selectedQtem.output[0].item;
                            } catch (err) {
                                //console.log(err);
                            }
    
                            let item = {
                                infos: [{
                                    itemId: selectedAId,
                                }]
                            };
                            try {
                                item = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", item);
                                item = item.output[0].item;
                            } catch (err) {
                                //console.log(err);
                            }
    
                            let param = {
                                input:
                                    [{
                                        clientId: "",
                                        relationType: "L2_AnswerRelation",
                                        primaryObject: selectedQtem,
                                        secondaryObject: item
                                    }]
                            }
                            try {
                                await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
                            } catch (err) {
                                //console.log(err)
                            }
                            param = {
                                objects: [item]
                            }
                            try {
                                await common.userLogsInsert("Delete Expert Answer", selectedA.uid, "S", "Success");
                                await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', param);
                            } catch (err) {
                                //console.log(err)
                            }
    
                            answerCnt--;
    
                            try {
                                let setPropsItem = {
                                    objects: [answerUser],
                                    attributes: {
                                        l2_answer_count: {
                                            stringVec: [String(answerCnt)]
                                        }
                                    }
                                }
                                await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                            } catch (err) {
                                //console.log(err);
                            }
                            data.qaAnswerList.selectedObjects[0] = undefined;
                            eventBus.publish("qaAnswerList.listUpdated");
                            notySvc.showInfo(deleteComplete);
                        }
                    });
                    buttonArray.push({
                        addClass: 'btn btn-notify',
                        text: buttonCancle,
                        onClick: function ($noty) {
                            $noty.close();
                        }
                    });
                    notySvc.showWarning(checkDeleteAnswer, buttonArray);
                } else {
                    notySvc.showInfo(notAnswerCreator);
                }
            }

        }
    }
}

export async function likeAdd(data, ctx) {

    if (selectAnswer) {
        let selectedA = selectAnswer;

        let owningUser = selectedA.props.owning_user.uiValues[0];
        let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
        if(searchingUser === null) {
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(owningUser);
    
            searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
        }
        searchingUser = searchingUser[0];
        await com.getProperties([searchingUser], ["l2_point", "l2_good_count"]);
        let goodCnt = Number(searchingUser.props.l2_good_count.dbValues[0]);

        let likeOverlap;
        let count = await query.executeSavedQuery("ReplySearch", ["L2_item_id", "L2_object_type"], [selectedA.props.item_id.uiValue, "L2_LikeRevision"]);

        let param = {
            objects: count,
            attributes: ["owning_user", "l2_reference_post"]
        }
        try {
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", param);
        } catch (err) {
            //console.log(err);
        }

        let delItem;
        if (count != null) {
            for (let reply of count) {
                if (reply.props.owning_user.dbValues[0] === ctx.user.uid) {
                    delItem = reply;
                    likeOverlap = true;
                    break;
                } else {
                    likeOverlap = false;
                }
            }
        }

        if (likeOverlap) {
            // 이 답변의 좋아요를 취소합니다.

            var buttonArray = [];
                buttonArray.push({
                    addClass: 'btn btn-notify',
                    text: yes,
                    onClick: async function ($noty) {
                        $noty.close();

                        let deleteItem = {
                            objects: [com.getObject(delItem.props.items_tag.dbValues[0])]
                        }
                        
                        await SoaService.post( "Core-2006-03-DataManagement", "deleteObjects", deleteItem );
            
                        goodCnt--;
            
                        try {
                            let setPropsItem = {
                                objects: [searchingUser],
                                attributes: {
                                    l2_good_count: {
                                        stringVec: [String(goodCnt)]
                                    }
                                }
                            }
                            await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                        } catch (err) {
                            //console.log(err);
                        }
                        notySvc.showInfo(checkClickDislike);
                        eventBus.publish("qaAnswerList.listUpdated");

                    }
                });
                buttonArray.push({
                    addClass: 'btn btn-notify',
                    text: no,
                    onClick: function ($noty) {
                        $noty.close();
                    }
                });
                notySvc.showWarning(checkDislike, buttonArray);

        } else {
            // 이 답변을 좋아합니다.
            let createItems = {
                properties:
                    [{
                        name: "Like",
                        type: "L2_Like",
                        revId: "A"
                    }]
            };
            let createItemRev = await SoaService.post("Core-2006-03-DataManagement", "createItems", createItems);
            try {

                let setUpdateItem = {
                    objects: [createItemRev.output[0].itemRev],
                    attributes: {
                        l2_reference_post: {
                            stringVec: selectedA.props.items_tag.dbValues
                        }
                    }
                }

                await SoaService.post("Core-2007-01-DataManagement", "setProperties", setUpdateItem);

                goodCnt++;

                let setPropsItem = {
                    objects: [searchingUser],
                    attributes: {
                        l2_good_count: {
                            stringVec: [String(goodCnt)]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
    
                notySvc.showInfo(checkClickLike);
                eventBus.publish("qaAnswerList.listUpdated");

            } catch (err) {
                //console.log(err);
            }
            
        }
    }
}

export function loadSelection(data) {
    if (data.dataProviders.qaAnswerList.selectedObjects.length > 0) {
        selectAnswer = data.dataProviders.qaAnswerList.selectedObjects[0];
        selectAnswer.adopt = textAdopt;
        checkEdit = true;
    } else {
        checkEdit = false;
    }
    data.checkEdit = checkEdit;
}

export function checkUser(data, ctx) {
    let selected = null;
    if (data.qaListDataProvider.selectedObjects[0] && !data.qaAnswerList.selectedObjects[0]) {
        selected = data.qaListDataProvider.selectedObjects[0];
        if (selected.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
            eventBus.publish("editPopup.open");
        } else {
            notySvc.showInfo(notQuestionCreator);
        }
    } else if (data.qaListDataProvider.selectedObjects[0] && data.qaAnswerList.selectedObjects[0]) {
        selected = data.qaAnswerList.selectedObjects[0];
        if (selected.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
            // eventBus.publish("editPopup.open");
            if (ctx.editUid == undefined || ctx.editUid == null) {
                $('#' + selected.props.item_id.dbValue).summernote('destroy');
                $('#' + selected.props.item_id.dbValue).summernote({
                    toolbar: [
                        ['fontsize', ['fontsize']],
                        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                        ['color', ['forecolor', 'color']],
                        ['table', ['table']],
                        ['para', ['ul', 'ol', 'paragraph']],
                        ['insert', ['picture', 'link']],
                        ['codeview']
                    ],
                    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
                });
                $('#' + selected.props.item_id.dbValue).summernote('enable');
                $('#' + selected.props.item_id.dbValue).next().addClass("changeWhite");
                $("." + selected.props.item_id.dbValue).css("display", "inline-block");
                ctx.editUid = selected.props.item_id.dbValue;
                ctx.editObj = selected;
            } else {
                notySvc.showInfo("편집중인 댓글이 있습니다.");    
            }
        } else {
            notySvc.showInfo(notAnswerCreator);
        }
    }
}

export function checkExpert(data, ctx) {
    let checkExpert = false;
    const qnaData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    if (qnaData.expert.length > 0) {
        for (let expert of qnaData.expert) {
            if (expert == ctx.user.props.object_string.dbValue) {
                checkExpert = true;
                eventBus.publish("addAnswerPopup.open");
            }
        }
    } else if (qnaData.expert.length < 1) {
        notySvc.showInfo(noExistExpert);
    }
    if (checkExpert == false) {
        notySvc.showInfo(noExpert);
    }
}

let backSpacePopupAction = function(data,relationItem) {
    data.linkRepeat.dbValue = [];
    for (let i = 0; i < relationItem.length; i++) {
        if(!relationItem[i].props.object_name.dbValues[0].includes(".txt")){
            data.linkRepeat.dbValue.push({
                "displayName": relationItem[i].props.object_name.dbValues[0],
                "isRequired": "false",
                "uiValue": relationItem[i].props.object_name.dbValues[0],
                "isNull": "false",
                "uid": relationItem[i].uid
            });
        }
    }
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
                "Type": "L2_QuestionExpRevision",
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
                "l2_reference_targets",
                "l2_experts",
                "l2_main_category"
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
    console.log("검색값:",data.searchBox.dbValue);
    ctx.searchString = data.searchBox.dbValue;
    nowPage = 1;
    eventBus.publish("pageChipDataProvider.reset");
    eventBus.publish("qaList.plTable.reload");
}

let exports = {};

export default exports = {
    qnaLinkEventAction,
    loadQaList,
    filterList,
    inputWinodwAdd,
    inputWinodwEdit,
    showQuestionProp,
    initialize,
    setAnswerListStyle,
    setAnswerListBgStyle,
    loadAnswerList,
    answerList,
    askExpertDelete,
    likeAdd,
    loadSelection,
    checkUser,
    checkExpert,
    adopt,
    setPageNumber,
    clickedPageAction,
    firstPageAction,
    pagingBeforeAction,
    pagingAfterAction,
    lastPageAction,
    questionSearch
};
app.factory('questionAnswer', () => exports);