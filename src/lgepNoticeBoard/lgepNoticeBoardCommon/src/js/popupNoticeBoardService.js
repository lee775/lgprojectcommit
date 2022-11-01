import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from "js/utils/lgepObjectUtils";
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import appCtxSvc from 'js/appCtxService';
import _ from 'lodash';

var $ = require('jQuery');
let maxPoint;
let userList;
let textQuestionPoint = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "questionPoint");
let textPoint = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "point");
let textMax = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "max");
let textTitle = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "title");
let textContent = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "content");
let textQuestionContent = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "questionContent");
let textQuestionTitle = lgepLocalizationUtils.getLocalizedText("lgepNoticeBoardMessages", "questionTitle");
let textAnswerContent = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "answerContent");
let buttonClose = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "close");
let tooManyPoint = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "tooManyPoint");
let setRightPoint = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "setRightPoint");
let createComplete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "createComplete");
let editComplete = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "editComplete");
let characterLimitMsg = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "characterLimitMsg");
let noEmptyContents = lgepLocalizationUtils.getLocalizedText("lgepKnowldegeManageMessages", "noEmptyContents");

//욱채가 만든 메소드
export async function getPoint(tmp, ctx) {
    let data = vms.getViewModelUsingElement(document.getElementById("addPop"));
    let getUserId = ctx.user.props.object_string.dbValue;
    if (getUserId.includes("infodba")) {
        //console.log("관리자");
    } else {
        let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [getUserId]);
        if (searchingUser === null) {
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(getUserId);

            searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
        }
        searchingUser = searchingUser[0];
        await com.getProperties([searchingUser], ["l2_point"]);
        data.questionPoint.uiValue = textQuestionPoint + " (" + textMax + ": " + searchingUser.props.l2_point.dbValues[0] + textPoint + " )";
        data.questionPoint.displayValues[0] = textQuestionPoint + " (" + textMax + ": " + searchingUser.props.l2_point.dbValues[0] + textPoint + " )";
        data.questionPoint.prevDisplayValues[0] = textQuestionPoint + " (" + textMax + ": " + searchingUser.props.l2_point.dbValues[0] + textPoint + " )";
        data.questionPoint.propertyDisplayName = textQuestionPoint + " (" + textMax + ": " + searchingUser.props.l2_point.dbValues[0] + textPoint + " )";
        data.questionPoint.uiValues[0] = textQuestionPoint + " (" + textMax + ": " + searchingUser.props.l2_point.dbValues[0] + textPoint + " )";
        maxPoint = searchingUser.props.l2_point.dbValues[0];
    }
}
//욱채가 만든 메소드



//QnA아이템 생성
export async function createQnaQuestion(data, ctx) {
    var summerContent = $('#qaAddPopSummernote').summernote('code') === null ? "" : $('#qaAddPopSummernote').summernote('code');
    if (summerContent == null || summerContent == "" || summerContent == "<p><br></p>") {
        notySvc.showError(noEmptyContents);
        return;
    } else {
        let qnaPoint = data.questionPoint.dbValue;
        let title = data.questionTitle.dbValue;
        let htmlData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
        let createResult;
        let createItemRevision;
        if (data.listIssue.uiValue == null) {
            data.listIssue.uiValue = "";
        }
        let setType = ""
        if (htmlData.window == "HelpDesk") {
            setType = "L2_QuestionHelp";
        } else if (htmlData.window == "VoC") {
            setType = "L2_QuestionVOC";
        } else {
            setType = "L2_QuestionHelp";
        }
        // Q&A
        try {
            if (title && title != "") {
                let param = {
                    properties: [{
                        name: title,
                        type: setType
                    }]
                }
                createResult = await SoaService.post("Core-2006-03-DataManagement", "createItems", param);
            }

            // 아이템 리비전 정의
            createItemRevision = createResult.output[0].itemRev
            let onlyString = lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
            // 아이템 리비전 속성값 넣기
            param = {
                objects: [createItemRevision],
                attributes: {
                    l2_content_string: {
                        stringVec: [onlyString]
                    },
                    l2_main_category: {
                        stringVec: [data.listPart.uiValue]
                    },
                    l2_subcategory: {
                        stringVec: [data.listIssue.uiValue]
                    }
                }
            }
            try {
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
                await lgepSummerNoteUtils.txtFileToDataset(summerContent, createItemRevision);
            } catch (err) {
                //console.log(err);
            }
        } catch (err) {
            //console.log(err);
            notySvc.showError(characterLimitMsg);
        }

        qnaPoint = parseInt(qnaPoint);
        maxPoint = parseInt(maxPoint);
        if (qnaPoint > maxPoint) {
            message.show(1, tooManyPoint, [buttonClose], [
                function () { }
            ]);
            return;
        }
        if (qnaPoint < 0) {
            message.show(1, setRightPoint, [buttonClose], [
                function () { }
            ]);
            return;
        }

        //이욱채가 추가 한 기능
        qnaPoint = String(qnaPoint);
        let param = {
            objects: [createItemRevision],
            attributes: {
                l2_point: {
                    stringVec: [qnaPoint]
                }
            }
        }
        if (createItemRevision.type == "L2_QuestionExpRevision") {
            param = {
                objects: [createItemRevision],
                attributes: {
                    l2_point: {
                        stringVec: [qnaPoint]
                    },
                    l2_experts: {
                        stringVec: [data.listExpert.dbValue]
                    }
                }
            }
        }
        try {
            await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
        } catch (err) {
            //console.log(err);
        }

        notySvc.showInfo(createComplete);
        return {
            createItemRevision: createItemRevision
        };
    }

}


//QnA 편집기능
export async function editQna(data, ctx) {
    const qnaData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
    var summerContent = $('#qaEditPopSummernote').summernote('code');
    if (summerContent == null || summerContent == "" || summerContent == "<p><br></p>") {
        notySvc.showError(noEmptyContents);
        return;
    } else {
        let returnValue;
        let onlyString = "";
        try {
            returnValue = await lgepSummerNoteUtils.txtFileToDataset(summerContent, selected);
            onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
        } catch (err) {
            //console.log(err)
        }
        if (selected.props.l2_main_category != undefined) {
            try {
                let param = {
                    objects: [selected],
                    attributes: {
                        object_name: {
                            stringVec: [data.questionTitle.dbValue]
                        },
                        l2_content_string: {
                            stringVec: [onlyString]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
                eventBus.publish('awPopup.close');
                notySvc.showInfo(editComplete);
                try {
                    eventBus.publish("qaListDataProvider.selectionChangeEvent");
                } catch (err) {
                    //console.log(err);
                }
            } catch (err) {
                //console.log(err);
                notySvc.showError(characterLimitMsg);
            }
        }
    }
}
//편집창 클릭시 데이터 로드
export async function loadBeforeData(data, ctx) {
    $('#qaEditPopSummernote').summernote({
        width: "100%",
        height: 450,
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
    $('#qaEditPopSummernote').summernote('enable');

    const qnaData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    const popData = vms.getViewModelUsingElement(document.getElementById("faqDatas"));
    let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
    popData.window = qnaData.window;
    let content = await lgepSummerNoteUtils.readHtmlToSummernote(selected);
    if (qnaData.window == "HelpDesk" || qnaData.window == "VoC") { //qna창에서 열 경우
        let faqData = vms.getViewModelUsingElement(document.getElementById("faqDatas"));
        if (!data.questionTitle) {
            data = faqData;
        }
        data.questionTitle.propertyDisplayName = textQuestionTitle;
        data.questionTitle.dbValue = selected.props.object_name.dbValue;
        $('#qaEditPopSummernote').summernote('reset');
        $('#qaEditPopSummernote').summernote('code', content);
    }
    eventBus.publish("tryResizing");
}

export async function loadBeforeAddData(test) {
    let ctx = appCtxSvc.ctx
    let data = vms.getViewModelUsingElement(document.getElementById("addPop"));
    let qnaData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    //지식창고에서 질문 생성할 경우
    data.window = qnaData.window;
}


//전문가에게 물어봐요 입력
export async function createAskExpert(data, ctx) {
    var summerContent = $('#qaAddPopSummernote').summernote('code') === null ? "" : $('#qaAddPopSummernote').summernote('code');
    if (summerContent == null || summerContent == "" || summerContent == "<p><br></p>") {
        notySvc.showError(noEmptyContents);
        return;
    } else {
        let title = data.questionTitle.dbValue;
        let htmlData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
        let qnaPoint = data.questionPoint.dbValue;
        // QnA 지식유형의 아이템 생성
        try {
            let owningUser = ctx.user.props.object_string.uiValue;
            let searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [owningUser]);
            if (searchingUser === null) {
                var regExp = /\(([^)]+)\)/;
                var matches = regExp.exec(owningUser);

                searchingUser = await query.executeSavedQuery("KnowledgeUserSearch", ["L2_user_id"], [matches[1]]);
            }

            searchingUser = searchingUser[0];
            if (data.listIssue.uiValue == null) {
                data.listIssue.uiValue = "";
            }
            try {
                let createResult;
                let param;
                if (title && title != "") {
                    param = {
                        properties: [{
                            name: title,
                            type: "L2_QuestionVoc"
                        }]
                    }
                    createResult = await SoaService.post("Core-2006-03-DataManagement", "createItems", param);
                }

                // 아이템 리비전 정의
                let createItemRevision = createResult.output[0].itemRev
                let returnValue;
                let onlyString = "";
                try {
                    returnValue = await lgepSummerNoteUtils.txtFileToDataset(summerContent, createItemRevision);
                    onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
                } catch (err) {
                    //console.log(err)
                }
                // 아이템 리비전 속성값 넣기
                param = {
                    objects: [createItemRevision],
                    attributes: {
                        l2_content_string: {
                            stringVec: [onlyString]
                        }
                    }
                }
                if (data.checkExpertQ.dbValue == true) {
                    param.attributes["l2_main_category"] = { stringVec: [data.listPart.uiValue] };
                    param.attributes["l2_subcategory"] = { stringVec: [data.listIssue.uiValue] };
                    param.attributes["l2_experts"] = { stringVec: [data.listExpert.dbValue] };
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);

                //이욱채가 추가 한 기능
                await com.getProperties([searchingUser], ["l2_knowledge_count"]);
                let userknowledgeCount = searchingUser.props.l2_knowledge_count.dbValues[0];
                userknowledgeCount = parseInt(userknowledgeCount);
                userknowledgeCount++;
                userknowledgeCount = String(userknowledgeCount);
                param = {
                    objects: [searchingUser],
                    attributes: {
                        l2_knowledge_count: {
                            stringVec: [userknowledgeCount]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
                //이욱채가 추가 한 기능
                qnaPoint = String(qnaPoint);
                param = {
                    objects: [createItemRevision],
                    attributes: {
                        l2_point: {
                            stringVec: [qnaPoint]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
                eventBus.publish('awPopup.close');
                if (!window.location.href.includes("knowledgeWarehouse")) {
                    eventBus.publish("qaList.plTable.reload");
                    history.pushState(null, null, '#/askExpert?question=' + createItemRevision.uid);
                    htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(createItemRevision);
                }
                notySvc.showInfo(createComplete);
                return {
                    createItemRevision: createItemRevision
                };
            } catch (err) {
                notySvc.showError(characterLimitMsg);
            }


        } catch (err) {
            notySvc.showWarning(String(err));
        }
    }
}
//전문가에게 물어봐요 편집
export async function editExpert(data, ctx) {
    const qnaData = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
    if (qnaData.dataProviders.qaAnswerList.selectedObjects[0]) {
        if ($('#answerSummernote').summernote('code') == null || $('#answerSummernote').summernote('code') == "" || $('#answerSummernote').summernote('code') == "<p><br></p>" || $('#answerSummernote').summernote('code') == "<br>") {
            notySvc.showError(noEmptyContents);
            return;
        } else {
            let answer = $('#answerSummernote').summernote('code');
            let selectedA = qnaData.dataProviders.qaAnswerList.selectedObjects[0];
            let returnValue;
            let onlyString = "";
            try {
                returnValue = await lgepSummerNoteUtils.base64ToFileToDataset(answer, selectedA);
                onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
            } catch (err) {
                //console.log(err)
            }
            if (returnValue) {
                answer = returnValue.resultTag;
            }
            // 아이템 리비전 속성값 넣기
            let param = {
                objects: [selectedA],
                attributes: {
                    l2_content: {
                        stringVec: [answer]
                    },
                    l2_content_string: {
                        stringVec: [onlyString]
                    }
                }
            }
            try {
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
            } catch (err) {
                //console.log(err);
            }
            eventBus.publish('awPopup.close');
            notySvc.showInfo(editComplete);
            try {
                eventBus.publish("qaListDataProvider.selectionChangeEvent");
            } catch (err) {
                //console.log(err);
            }
        }
    } else {
        var summerContent = $('#qaEditPopSummernote').summernote('code');
        if (summerContent == null || summerContent == "" || summerContent == "<p><br></p>") {
            notySvc.showError(noEmptyContents);
            return;
        } else {
            let returnValue;
            let onlyString = "";
            try {
                returnValue = await lgepSummerNoteUtils.txtFileToDataset(summerContent, selected);
                onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
            } catch (err) {
                //console.log(err)
            }
            try {
                let param = {
                    objects: [selected],
                    attributes: {
                        object_name: {
                            stringVec: [data.questionTitle.dbValue]
                        },
                        l2_content_string: {
                            stringVec: [onlyString]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
                eventBus.publish('awPopup.close');
                notySvc.showInfo(editComplete);
                try {
                    eventBus.publish("qaListDataProvider.selectionChangeEvent");
                } catch (err) {
                    //console.log(err);
                }
            } catch (err) {
                //console.log(err);
                notySvc.showError(characterLimitMsg);
            }
        }
    }
}

export function initializeAdd() {
    $('#qaAddPopSummernote').summernote({
        width: "100%",
        height: 450,
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
    $('#qaAddPopSummernote').summernote('enable');
}

export function initializeEdit() {
    $('#qaEditQuestionSummernote').summernote({
        width: "100%",
        height: 450,
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
    $('#qaEditQuestionSummernote').summernote('enable');
}

export function initializeAddAnswer() {
    $('#answerContentSummernote').summernote({
        width: "100%",
        height: 450,
        toolbar: [],
    });
    $('#answerContentSummernote').summernote('disable');
}

export function popViewResizing(data) {
    let test = document.getElementsByClassName("aw-layout-panelContent");
    let test1;
    if (data.window == "askExpert") { // 전문가질문에서 열 때
        test1 = test[0];
    } else if (data.showCategory || data.window == "faqAdd") {  //지식창고에서 열 떄
        test1 = test[1];
    } else {    //  공통모듈에서 열 때
        test1 = test[0];
    }
    // 화면 크기 계산을 위한 split
    let width = test1.style.width.split("px");
    let height = test1.style.height.split("px");
    width = Number(width[0]);
    height = Number(height[0]);
    if (width > window.innerWidth && height > window.innerHeight) {
        test1.style.width = (window.innerWidth * 0.8) + "px";
        test1.style.height = (window.innerHeight * 0.8) + "px";
    } else if (width > window.innerWidth) {
        test1.style.width = (window.innerWidth * 0.8) + "px";
    } else if (height > window.innerHeight) {
        test1.style.height = (window.innerHeight * 0.8) + "px";
    } else if (window.innerHeight >= 900 && window.innerWidth >= 1300) {
        test1.style.width = "1300px";
        test1.style.height = "900px";
    } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
        test1.style.width = (window.innerWidth * 0.8) + "px";
        test1.style.height = (window.innerHeight * 0.8) + "px";
    } else if (width < window.innerWidth * 0.8) {
        test1.style.width = (window.innerWidth * 0.8) + "px";
    } else if (height < window.innerHeight * 0.8) {
        test1.style.height = (window.innerHeight * 0.8) + "px";
    }
}
let checkAttr;
export function checkURL() {
    let data = vms.getViewModelUsingElement(document.getElementById("addPop"));
    let url = window.location.href;
    let url1 = decodeURI(url);
    let urlAttrSearch = url1.split("?");
    if (urlAttrSearch.length > 1) {
        let urlAttr = urlAttrSearch[1];
        urlAttr = urlAttr.split("&");
        let attrs = {};
        if (urlAttr.length > 0) {
            for (let attr of urlAttr) {
                attr = attr.split("=");
                attrs[attr[0]] = attr[1];
            }
        }
        checkAttr = attrs;
        for (let list of data.listPartValues.dbValue) {
            if (list.propDisplayValue == attrs.parent) {
                data.listPart.uiValue = attrs.parent;
                data.listPart.dbValue = list.propInternalValue;
            }
        }
    }
}


let exports = {};

export default exports = {
    createQnaQuestion,
    editQna,
    loadBeforeData,
    loadBeforeAddData,
    createAskExpert,
    editExpert,
    getPoint,
    initializeAdd,
    initializeEdit,
    initializeAddAnswer,
    popViewResizing,
    checkURL
};
app.factory('popupNoticeBoardService', () => exports);