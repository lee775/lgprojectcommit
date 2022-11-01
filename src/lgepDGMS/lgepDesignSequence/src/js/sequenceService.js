import app from 'app';
import SoaService from 'soa/kernel/soaService'
import query from 'js/utils/lgepQueryUtils';
import com from "js/utils/lgepObjectUtils";
import policy from 'js/soa/kernel/propertyPolicyService';
import common from "js/utils/lgepCommonUtils"
import _ from 'lodash';
import viewC from "js/viewModelObjectService";
import treeView from "js/awTableService";
import {
    navigationFmea,
    pageUnMount,
    getProductNameByGroup
} from 'js/utils/fmeaCommonUtils';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
import * as prop from 'js/constants/fmeaProperty';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import browserUtils from 'js/browserUtils';

var $ = require('jQuery');
var acceessableCount = 1;
let selTreeNode;
let searchState;
let stateCheck;
let category;
let getURLData = [];
let parameterCount = [];
let count = 0;
let selectItem;
let thumbnailURLTemp = [];
let showTapSize = "0px";
let editState = false;

async function toggleCssAction(data) {
    if (data.themeToggle.dbValue) {
        $(".note-editable").attr('style', 'background-color: white !important;');
        $(".note-editable>div>p").attr('style', 'color: black !important;');
    } else {
        $(".note-editable").attr('style', 'background-color: black !important;');
        $(".note-editable>div>p").attr('style', 'color: white !important;');
    }
}

function updateSliderValue(value, ctx) {
    let plusBtn = document.querySelector('.noColor .aw-widgets-plusButton');
    let minusBtn = document.querySelector('.noColor .aw-widgets-minusButton');
    plusBtn.disabled = true;
    minusBtn.disabled = true;
    
    setTimeout(function() {
      let tableLayout = document.querySelector('#summernoteScale > div:nth-child(2)');
      tableLayout.style.transform = `scale(${value})`;
      tableLayout.style.transformOrigin = "left top";
      
      plusBtn.disabled = false;
      minusBtn.disabled = false;
  
    }, 200);
}

function deleteObj(value) {
    message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "folderDelete"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "delete"), lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
        async function () {
                childDel(value);
                let request = {
                    objects: [value]
                };
                try {
                    await SoaService.post("Core-2006-03-DataManagement", "deleteObjects", request);
                } catch (err) {
                    //console.log(err);
                }
                message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "deleteCompletion"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
                    function () {}
                ]);
            },
            function () {}
    ]);
}

async function childDel(obj) {
    if (!Array.isArray(obj)) {
        obj = [obj];
    }
    try {
        let getPropertiesParam = {
            objects: obj,
            attributes: ["contents"]
        };
        await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

    } catch (err) {
        //console.log(err);
    }

    _.forEach(obj, function (factor) {
        if (factor.type == "Folder" || factor.type == "L2_ClsfyMgmtFolder") {
            if (factor.props.contents.dbValues.length > 0) {
                let childObj = com.getObject(factor.props.contents.dbValues);
                childDel(childObj);
                try {
                    let deleteObj = {
                        objects: [factor]
                    };
                    SoaService.post("Core-2006-03-DataManagement", "deleteObjects", deleteObj);
                } catch (err) {
                    //console.log(err);
                }
            } else {
                try {
                    let deleteObj = {
                        objects: [factor]
                    };
                    SoaService.post("Core-2006-03-DataManagement", "deleteObjects", deleteObj);
                } catch (err) {
                    //console.log(err);
                }
            }
        }
    });
}

const onMount = async (ctx) => {
    const productValue = getProductNameByGroup();
    const checkPopupData = vms.getViewModelUsingElement(document.getElementById("checkPopupData"));
    checkPopupData.productGroup.dbValue = productValue;
    eventBus.publish("dfmeaListTable.plTable.reload");

    // return { productValue };
};

function checklistOpen(data) {
    //console.log("datar", {
        // data
    // });
    let value = data.dataProviders.checkListCopyData.selectedObjects;
    if (value.length > 1 || value == undefined) {
        message.show(1, "한 개만 선택해주세요.", [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
    } else if (value.length == 1) {
        window.open(browserUtils.getBaseURL() + "#/dchecklistm?s_uid=" + value[0].uid);
    }
}

const loadData = async (product) => {
    const queryResults = await _allSearch(product);
    if (!queryResults) {
        return [];
    }
    return queryResults;
};
const _allSearch = async (entryValue) => {
    const queryResults = await query.executeSavedQuery(
        prop.QUERY_DFMEA_MASTER,
        prop.QUERY_DFMEA_MASTER_PRODUCT,
        entryValue
    );
    return queryResults;
};

export async function editStartOREnd() {
    const sequenceData = vms.getViewModelUsingElement(document.getElementById("designSequenceViewData"));
    if (sequenceData.summerNoteWidthMax.dbValue == "" || sequenceData.summerNoteWidthMax.dbValues[0] == false) {
        if (!editState) {
            $('#sequenceSummernote').summernote('enable');
            let toolbarData = document.getElementsByClassName("note-toolbar");
            toolbarData = toolbarData[0];
            toolbarData.classList.remove("noneToolbar");
            editState = true;
        } else {
            let selNode = selectItem;
            let contentsString = $('#sequenceSummernote').summernote('code');
            contentsString = await lgepSummerNoteUtils.imgAndsvgOnlyString(contentsString);
            let selNodeContent = await lgepSummerNoteUtils.txtFileToDataset($('#sequenceSummernote').summernote('code'), selNode);
            try {
                let param = {
                    objects: [selNode],
                    attributes: {
                        l2_content: {
                            stringVec: [selNodeContent.resultTag]
                        },
                        l2_content_string: {
                            stringVec: [contentsString]
                        }
                    }
                }
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
            } catch (err) {
                //console.log(err);
            }
            sequenceData.sequenceHeaderProps[0].property.uiValue = selNode.props.object_name.dbValues[0];
            message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "editComplete"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
                function () {
                    let toolbarData = document.getElementsByClassName("note-toolbar");
                    toolbarData = toolbarData[0];
                    toolbarData.classList.add("noneToolbar");
                    editState = false;
                    window.location.reload();
                }
            ]);
        }
    } else {
        message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "noSummerNoteWidthMax"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return;
    }
}

export function tabShowORHide() {
    let addorDeleteClassHtml = document.getElementsByClassName("noneDisGetSet");
    let classList = [];
    for (let i = 0; i < addorDeleteClassHtml.length; i++) {
        classList.push(addorDeleteClassHtml[i].className);
    }
    if (classList[0].includes("noneDisplay")) {
        for (let i = 0; i < addorDeleteClassHtml.length; i++) {
            addorDeleteClassHtml[i].classList.remove("noneDisplay");
        }
        const mainView = document.getElementById("summernoteId");
        let mainViewSize = showTapSize.replace("px", "");
        mainViewSize = (1004 - Number(mainViewSize)) + "px";
        mainView.style.flexBasis = mainViewSize;
        addorDeleteClassHtml[1].style.flexBasis = showTapSize;
    } else {
        showTapSize = addorDeleteClassHtml[1].style.flexBasis;
        if (showTapSize == "") {
            showTapSize = "214px"
        }
        for (let i = 0; i < addorDeleteClassHtml.length; i++) {
            addorDeleteClassHtml[i].classList.add("noneDisplay");
        }
        const mainView = document.getElementById("summernoteId");
        mainView.style.flexBasis = "1204px";
    }
}

export function zxcv(data) {
    const sequenceTreeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
    let abc;
    for (let i of sequenceTreeData.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects) {
        if (i.uid == "iskJ7YksZx_JkD") {
            abc = i;
        }
    }
    if (abc.isExpanded) {
        abc.isExpanded = false;
        eventBus.publish("sequenceTree.plTable.toggleTreeNode", abc);
    } else {
        abc.isExpanded = true;
        eventBus.publish("sequenceTree.plTable.toggleTreeNode", abc);
    }
}

export async function breadcrumListDataSelect(data, ctx) {
    const sequenceTreeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
    let selectedListData = data.eventData.selectedObjects[0];
    let selectExpectedData;
    if (sequenceTreeData != undefined) {
        for (let i of sequenceTreeData.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects) {
            if (selectedListData.uid == i.uid) {
                selectExpectedData = i;
                break;
            }
        }
        await sequenceTreeData.dataProviders.sequenceDataProvider.selectionModel.selectNone();
        await sequenceTreeData.dataProviders.sequenceDataProvider.selectionModel.addToSelection(selectExpectedData);
    } else {
        for (let i of ctx.recentTreeData) {
            if (i.uid == selectedListData.uid) {
                selectedListData = i;
                break;
            }
        }
        let mainData = vms.getViewModelUsingElement(document.getElementById("designSequenceViewData"));
        let contentLoadResult = await contentLoad(selectedListData, mainData.sequenceHeaderProps, mainData.summerNoteWidthMax, mainData.provider);
        mainData.selValue = contentLoadResult;
    }
}

export function getSelectProcedureList(data) {
    const sequenceData = vms.getViewModelUsingElement(document.getElementById("designSequenceViewData"));
    let searchData = sequenceData.provider.crumbs;
    let returnValue = data.eventData.displayName;
    for (let i of searchData) {
        if (i.displayName == returnValue) {
            returnValue = i.crumbsValue;
            break;
        }
    }
    returnValue = com.getObject(returnValue.props.contents.dbValues);
    let returnViewModel = [];
    for (let i of returnValue) {
        returnViewModel.push(viewC.constructViewModelObjectFromModelObject(i));
    }
    let temp = returnViewModel;
    returnViewModel = [];
    for (let i of temp) {
        let tempItem;
        if (i.type != "Folder" && i.type != "L2_ClsfyMgmtFolder") {
            tempItem = com.getObject(i.props.revision_list.dbValues[i.props.revision_list.dbValues.length - 1]);
        } else {
            tempItem = i;
        }
        returnViewModel.push(tempItem);
    }

    return {
        procedureBreadcrumList: returnViewModel,
        totalFound: returnValue.length
    };
}

export async function summerNoteImageWidthMax(data) {
    const value = selectItem;
    let contents = await lgepSummerNoteUtils.readHtmlToSummernoteProtoOne(value);
    let temp = contents;
    if (temp.includes("<svg")) {
        let sizeTemp = temp.split('width=');
        let width = sizeTemp[1];
        width = width.split('"');
        let height = Number(width[3]);
        if (Object.is((height), NaN)) {
            height = 720;
        }
        width = Number(width[1]);
        if (Object.is((width), NaN)) {
            width = 1040;
        }
        temp = temp.replace(/<svg (.*?) width=/ig, "<svg viewBox='0 0 " + width + " " + height + "' preserveAspectRatio='none' width=");
        temp = temp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/ig, 'preserveAspectRatio="none" width="100%" height="100%"');
        if (data.summerNoteWidthMax.dbValue == true) {
            //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
            $('#sequenceSummernote').summernote('reset');
            //써머노트 내용 삽입
            $('#sequenceSummernote').summernote('code', temp + '<br>');
        } else {
            //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
            $('#sequenceSummernote').summernote('reset');
            //써머노트 내용 삽입
            $('#sequenceSummernote').summernote('code', contents);
        }
    } else {
        if (data.summerNoteWidthMax.dbValue == true) {
            temp = temp.replace(/style="width: [^"]+"/gi, "style='width: 100%;'");
            //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
            $('#sequenceSummernote').summernote('reset');
            //써머노트 내용 삽입
            $('#sequenceSummernote').summernote('code', temp + '<br>');
        } else {
            //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
            $('#sequenceSummernote').summernote('reset');
            //써머노트 내용 삽입
            $('#sequenceSummernote').summernote('code', contents);
        }
    }
}

export function editInitializeSummer() {
    $('#sequenceItemEditor').summernote({
        tabsize: 3,
        height: 700,
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
    const editData = vms.getViewModelUsingElement(document.getElementById("itemEditPopupData"));
    let selNode = selectItem;
    editData.technicalTitle.dbValue = selNode.props.object_name.dbValue;
    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
    $('#sequenceItemEditor').summernote('reset');
    if (selNode.props.l2_content.dbValues[0] != null) {
        //써머노트 내용 삽입
        $('#sequenceItemEditor').summernote('code', selNode.props.l2_content.dbValues[0] + '<br>');
    }
}

export async function sequenceEdit() {
    const editData = vms.getViewModelUsingElement(document.getElementById("itemEditPopupData"));
    const sequenceData = vms.getViewModelUsingElement(document.getElementById("designSequenceViewData"));
    let selNode = selectItem;
    let contentsString = $('#sequenceItemEditor').summernote('code');
    contentsString = await lgepSummerNoteUtils.imgAndsvgOnlyString(contentsString);
    let selNodeContent = await lgepSummerNoteUtils.textFileToDataset($('#sequenceItemEditor').summernote('code'), selNode);
    let l2content = selNodeContent.resultTag;
    if (l2content == undefined) {
        l2content = "";
    }
    try {
        let param = {
            objects: [selNode],
            attributes: {
                object_name: {
                    stringVec: [editData.technicalTitle.dbValue]
                },
                l2_content: {
                    stringVec: [l2content]
                },
                l2_content_string: {
                    stringVec: [contentsString]
                }
            }
        }
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }
    sequenceData.sequenceHeaderProps[0].property.uiValue = editData.technicalTitle.dbValue;
    message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "editComplete"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
        function () {
            window.location.reload();
        }
    ]);
    sequenceData.editValue = false;
}

export function toolTipSelectedTab(data) {
    let tabset = document.getElementById("tabSetID");
    tabset = tabset.children;
    tabset = tabset[0];
    tabset = tabset.children;
    tabset = tabset[0];
    tabset = tabset.children;
    tabset = tabset[0];
    tabset = tabset.children;
    tabset = tabset[0];
    tabset = tabset.children;
    let checklistInnerHtml = tabset[0].children;
    // let designStandardInnerHtml = tabset[1].children;
    // let datasetInnerHtml = tabset[2].children;
    checklistInnerHtml[0].setAttribute('title', lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "checkListTooltip"));
    // designStandardInnerHtml[0].setAttribute('title', lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "designTooltip"));
    // datasetInnerHtml[0].setAttribute('title', lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "datasetTooltip"));

    $('#sequenceSummernote').summernote({
        tabsize: 0,
        width: "100%",
        toolbar: [
            // [groupName, [list of button]]
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['height', ['height']],
            ['insert', ['picture', 'link', 'video', 'uploadImage']],
            ['view', ['codeview', 'fullscreen', 'help']]
        ],
        buttons: {
            uploadImage: function (context) {
                var ui = $.summernote.ui;
                // 이벤트 지정
                var button = ui.button({
                    // 툴바 표시 내용
                    contents: '<i class="fa fa-pencil"/> SVG',
                    // 툴바 툴팁 표현 내용 
                    // tooltip: '',
                    // 클릭시 이벤트 작동
                    click: function (event) {
                        //console.log("눌렀다.");
                        var input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = 'multiple';
                        input.accept = '.svg';

                        let promiseArray = [];
                        input.onchange = e => {
                            var files = e.target.files;
                            //console.log("파일 보기", { files });
                            for (const value of files) {
                                let promise = new Promise((resolve) => {
                                    var reader = new FileReader();
                                    reader.readAsText(value, 'UTF-8');
                                    reader.onload = readerEvent => {
                                        var content = readerEvent.target.result;
                                        resolve(content);
                                    }
                                });
                                promiseArray.push(promise);
                            }
                            Promise.all(promiseArray).then((svgArr) => {
                                //console.log(svgArr);
                                let temp;
                                for (let i = 0; i < svgArr.length; i++) {
                                    svgArr[i] = svgArr[i].replaceAll('id=\"', `id=\"${i}_`);
                                    svgArr[i] = svgArr[i].replaceAll('#clip', `#${i}_clip`);
                                    svgArr[i] = svgArr[i].replaceAll('#img', `#${i}_img`);
                                    if (i > 0) {
                                        temp = temp + svgArr[i] + '<br>';
                                    }
                                    else {
                                        temp = svgArr[i] + '<br>';
                                    }
                                }
                                $('#sequenceSummernote').summernote('code', temp);
                            })
                        }
                        input.click();
                    },
                });
                return button.render();
            }
        },
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
    });
    $('#sequenceSummernote').summernote('disable');
    // document.getElementsByClassName("note-toolbar").classList.add("noneToolbar"); 
}

export async function getDataUrlSetting(data) {
    let infinite = true;
    let url = document.URL;
    let basicUrl = browserUtils.getBaseURL();
    url = url.replace(basicUrl + "#/lgepDesignStandards", "");
    url = url.replace("?", "");
    url = url.split('&');
    for (let i = 0; i < url.length; i++) {
        url[i] = url[i].replace("=", "");
        url[i] = url[i].replace("p", "");
        parameterCount.push(url[i].charAt(0));
        url[i] = url[i].substring(1);
    }
    getURLData = url;
    getURLData = getURLData.filter(Boolean);
    let clickHtml = null;
    let whileCheck = 0;

    if (getURLData.length > 0) {
        //로컬 스토리지 안에있는 시퀀스 트리의 데이터를 가져온다.
        let awTreeTableStateLocalStorage = localStorage.getItem("awTreeTableState:/");
        awTreeTableStateLocalStorage = JSON.parse(awTreeTableStateLocalStorage);
        if(awTreeTableStateLocalStorage){
            awTreeTableStateLocalStorage.designSequenceTree.sequenceTree.top.nodeStates = {};
            awTreeTableStateLocalStorage = JSON.stringify(awTreeTableStateLocalStorage);
            localStorage.setItem("awTreeTableState:/", awTreeTableStateLocalStorage);
        }
        // //console.log("로컬스토리지 삭제");
        for (let p = 0; p < getURLData.length; p++) {
            // //console.log("시작피",{p});
            if (getURLData.length == 1) {
                // //console.log("마지막 uid", {getURLData});
                while (infinite == true) {
                    if (whileCheck > 1000) {
                        break;
                    }
                    await common.delay(100);
                    let treeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
                    let selectedObj = treeData.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects;
                    for (let i = 0; i < selectedObj.length; i++) {
                        if (selectedObj[i].uid == getURLData[0]) {
                            // //console.log("선택발생");
                            treeData.dataProviders.sequenceDataProvider.selectionModel.addToSelection(selectedObj[i]);
                            infinite = false;
                            break;
                        }
                    }
                    whileCheck++;
                }
            } else {
                while (infinite == true) {
                    if (whileCheck > 1000) {
                        break;
                    }
                    await common.delay(100);
                    let treeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
                    if (treeData == undefined) {
                        continue;
                    }
                    let treeNodeData = treeData.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects;
                    for (let i = 0; i < treeNodeData.length; i++) {
                        if (treeNodeData[i].uid == getURLData[0]) {
                            let treeHtml = document.getElementById("sequenceTreeData");
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[1];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[2];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[1];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[i];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            treeHtml = treeHtml.childNodes;
                            treeHtml = treeHtml[0];
                            clickHtml = treeHtml;
                            if (treeNodeData[i].isExpanded == undefined || treeNodeData[i].isExpanded == false) {
                                clickHtml.click();
                                break;
                            } else {
                                break;
                            }
                        }
                    }
                    if (clickHtml != null) {
                        clickHtml = null;
                        break;
                    }
                    whileCheck++;
                }
                whileCheck = 0;
                getURLData.splice(0, 1);
                parameterCount.splice(0, 1);
                p--;
            }
        }
    }
}

export async function datasetDownLoad(data) {
    let selDataset = [];
    for (let i = 0; i < data.dataProviders.dataSetData.selectedObjects.length; i++) {
        window.open(browserUtils.getBaseURL() + "#/downloadFile?uid=" + data.dataProviders.dataSetData.selectedObjects[i].props.ref_list.dbValue[0]);
    }
}

export function designStdTableReLoadSequencePage() {
    eventBus.publish("deStandardTable.plTable.reload");
}

export async function createInitialize() {
    $('#sequenceCreateSummernote').summernote({
        lang: 'ko-KR',
        tabsize: 3,
        height: 500,
        width: "100%",
        toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link']],
            ['codeview'],
            ["CustomButton", ["uploadImage"]]
        ],
        buttons: {
            uploadImage: function (context) {
                var ui = $.summernote.ui;
                // 이벤트 지정
                var button = ui.button({
                    // 툴바 표시 내용
                    contents: '<i class="fa fa-pencil"/> SVG',
                    // 툴바 툴팁 표현 내용 
                    // tooltip: '',
                    // 클릭시 이벤트 작동
                    click: function (event) {
                        //console.log("눌렀다.");
                        var input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = 'multiple';
                        input.accept = '.svg';

                        let promiseArray = [];
                        input.onchange = e => {
                            var files = e.target.files;
                            //console.log("파일 보기", {
                                // files
                            // });
                            for (const value of files) {
                                let promise = new Promise((resolve) => {
                                    var reader = new FileReader();
                                    reader.readAsText(value, 'UTF-8');
                                    reader.onload = readerEvent => {
                                        var content = readerEvent.target.result;
                                        resolve(content);
                                    }
                                });
                                promiseArray.push(promise);
                            }
                            Promise.all(promiseArray).then((svgArr) => {
                                //console.log(svgArr);
                                let temp;
                                for (let i = 0; i < svgArr.length; i++) {
                                    svgArr[i] = svgArr[i].replaceAll('id=\"', `id=\"${i}_`);
                                    svgArr[i] = svgArr[i].replaceAll('#clip', `#${i}_clip`);
                                    svgArr[i] = svgArr[i].replaceAll('#img', `#${i}_img`);
                                    if (i > 0) {
                                        temp = temp + svgArr[i] + '<br>';
                                    }
                                    else {
                                        temp = svgArr[i] + '<br>';
                                    }
                                }
                                $('#sequenceCreateSummernote').summernote('code', temp);
                            })
                        }
                        input.click();
                    },
                });
                return button.render();
            }
        },
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
    });
}

export async function checkListCopyDelete(data) {
    const treeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
    let selectedTreeNode = treeData.dataProviders.sequenceDataProvider.selectedObjects[0];
    let selectedTableData = [];
    for (let i = 0; i < data.dataProviders.checkListCopyData.selectedObjects.length; i++) {
        selectedTableData.push(data.dataProviders.checkListCopyData.selectedObjects[i].uid);
    }
    if (data.dataProviders.checkListCopyData.selectedObjects.length < 1) {
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "noSelectCheckList"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "cancle")], [function () {}]);
        return;
    }

    message.show(1, selectedTableData.length + lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "itemDeleteMessage"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "cancle"), lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "confirm")], [function () {}, async function () {
        await com.getProperties(selectedTreeNode, ["l2_checklists"]);
        let defaultCheckList = selectedTreeNode.props.l2_checklists.dbValues;
        for (let i = 0; i < defaultCheckList.length; i++) {
            for (let j = 0; j < selectedTableData.length; j++) {
                if (defaultCheckList[i] == selectedTableData[j]) {
                    defaultCheckList.splice(i, 1);
                    i--;
                }
            }
        }

        let param = {
            objects: [selectedTreeNode],
            attributes: {
                l2_checklists: {
                    stringVec: defaultCheckList
                }
            }
        }
        try {
            await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
        } catch (err) {
            //console.log(err);
        }

        eventBus.publish("checkListCopyTable.plTable.reload");
    }]);
}

export async function checkListCopyResult(value) {
    if (value != undefined) {
        try {
            let getPropertiesParam = {
                uids: ["DfpJZuDYZx_JkD"]
            }
            let getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getPropertiesParam);
        } catch (err) {
            //console.log(err);
        }
        let getFolder = com.getObject("DfpJZuDYZx_JkD");
        await com.getProperties(getFolder, ["contents"]);
        let getObj = com.getObject(getFolder.props.contents.dbValues);
        await com.getProperties(getObj, ["l2_main_category", "l2_middle_category", "l2_subcategory", "l2_check_content", "l2_classification", "l2_type"]);
        return {
            result: getObj
        };
    } else {
        return {
            result: undefined
        };
    }

}

export async function checkListItemCopy(data) {
    await com.getProperties(selTreeNode, ["l2_checklists"]);
    let defaultCheckList = selTreeNode.props.l2_checklists.dbValues;
    let selectedCheckList = data.dataProviders.dfmeaListTableProvider.selectedObjects;
    let check = false;
    for (let i = 0; i < selectedCheckList.length; i++) {
        if (selectedCheckList[i].type == "L2_DFMEA") {
            message.show(1, "아이템 리비전만 선택해주세요.", [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
                function () {}
            ]);
            return {
                noSelectItem: false
            };
        }
        if (!defaultCheckList.indexOf(selectedCheckList[i].uid) >= 0) {
            defaultCheckList.push(selectedCheckList[i].uid);
        }
    }

    let param = {
        objects: [selTreeNode],
        attributes: {
            l2_checklists: {
                stringVec: defaultCheckList
            }
        }
    }
    try {
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }
    eventBus.publish("checkListCopyTable.plTable.reload");
    return {
        noSelectItem: true
    };
}

export function checkListReload() {
    eventBus.publish("checkListCopyTable.plTable.reload");
}

export async function checkListdataSet(data) {
    let search = [];
    let searchValue = [];
    if (data.largeList.dbValue != "") {
        search.push("L2_main_category");
        searchValue.push(data.largeList.dbValue);
    }
    if (data.mediumList.dbValue != "") {
        search.push("L2_middle_category");
        searchValue.push(data.mediumList.dbValue);
    }
    if (data.smallList.dbValue != "") {
        search.push("L2_subcategory");
        searchValue.push(data.smallList.dbValue);
    }
    let checkList
    if (search.length == 0 && searchValue.length == 0) {
        checkList = await query.executeSavedQuery("DesignChecklistSearch", ["L2_main_category"], ["*"]);
    } else {
        checkList = await query.executeSavedQuery("DesignChecklistSearch", search, searchValue);
    }
    0
    await com.getProperties(checkList, ["l2_main_category", "l2_middle_category", "l2_subcategory", "l2_check_content", "l2_classification", "l2_type"]);
    return {
        result: checkList
    };
}

export async function getListBox(data) {
    let checkList = await query.executeSavedQuery("DesignChecklistSearch", ["L2_main_category"], ["*"]);
    await com.getProperties(checkList, ["l2_main_category", "l2_middle_category", "l2_subcategory"]);
    let check = false;
    for (let i = 0; i < checkList.length; i++) {
        for (let j = 0; j < data.largeListValues.dbValue.length; j++) {
            if (data.largeListValues.dbValue[j].propDisplayValue == checkList[i].props.l2_main_category.dbValues[0]) {
                check = true;
                break;
            }
        }
        if (!check) {
            data.largeListValues.dbValue.push({
                "propDisplayValue": checkList[i].props.l2_main_category.dbValues[0],
                "propInternalValue": checkList[i].props.l2_main_category.dbValues[0]
            });
            check = false;
        }
    }
}

export async function getSecondListBox(data) {
    let largeValue = data.largeList.dbValue;
    let secondCheckList = await query.executeSavedQuery("DesignChecklistSearch", ["L2_main_category"], [largeValue]);
    await com.getProperties(secondCheckList, ["l2_middle_category"]);
    let check = false;
    data.mediumList.dbValue = "";
    data.mediumList.uiValue = "";
    data.smallList.dbValue = "";
    data.smallList.uiValue = "";
    data.mediumListValues.dbValue.length = 0;
    data.smallListValues.dbValue.length = 0;
    for (let i = 0; i < secondCheckList.length; i++) {
        for (let j = 0; j < data.mediumListValues.dbValue.length; j++) {
            if (data.mediumListValues.dbValue[j].propDisplayValue == secondCheckList[i].props.l2_middle_category.dbValues[0]) {
                check = true;
                break;
            }
        }
        if (!check) {
            data.mediumListValues.dbValue.push({
                "propDisplayValue": secondCheckList[i].props.l2_middle_category.dbValues[0],
                "propInternalValue": secondCheckList[i].props.l2_middle_category.dbValues[0]
            });
            check = false;
        }
    }
    document.getElementById('second').classList.remove('second');
    document.getElementById('last').classList.add('last');
}

export async function getLastListBox(data) {
    let largeValue = data.largeList.dbValue;
    let mediumValue = data.mediumList.dbValue;
    let lastCheckList = await query.executeSavedQuery("DesignChecklistSearch", ["L2_main_category", "L2_middle_category"], [largeValue, mediumValue]);
    await com.getProperties(lastCheckList, ["l2_subcategory"]);
    let check = false;
    for (let i = 0; i < lastCheckList.length; i++) {
        for (let j = 0; j < data.smallListValues.dbValue.length; j++) {
            if (data.smallListValues.dbValue[j].propDisplayValue == lastCheckList[i].props.l2_subcategory.dbValues[0]) {
                check = true;
                break;
            }
        }
        if (!check) {
            data.smallListValues.dbValue.push({
                "propDisplayValue": lastCheckList[i].props.l2_subcategory.dbValues[0],
                "propInternalValue": lastCheckList[i].props.l2_subcategory.dbValues[0]
            });
            check = false;
        }
    }
    document.getElementById('last').classList.remove('last');
}

export function checkTableReLoad() {
    eventBus.publish("dfmeaListTable.plTable.reload");
}

export async function designcheckListTableLoad(value) {
    const sequenceTreeData = vms.getViewModelUsingElement(document.getElementById("procedureData"));
    if (value === undefined) {
        return undefined;
    }
    if (value.type == "Folder" || value.type == "L2_ClsfyMgmtFolder") {
        return {
            result: undefined
        };
    }
    let getCheck = com.getObject(value.props.l2_checklists.dbValues);
    await com.getProperties(getCheck, ["l2_main_category", "l2_middle_category", "l2_subcategory", "l2_check_content", "l2_type", "owning_user", "creation_date", "object_name", "item_revision_id"]);
    if (getCheck.length == 0) {
        return {
            result: undefined
        };
    }
    return {
        result: getCheck,
        checklistTotalFound: getCheck.length
    };
}

export async function contentLoad(ctx, data) {
    const sequenceData = vms.getViewModelUsingElement(document.getElementById("designSequenceViewData"));
    let value = sequenceData.eventData.selectedObjects[0];
    let dataHeader = sequenceData.sequenceHeaderProps;
    let summerNoteWidthMax = sequenceData.summerNoteWidthMax;
    let provider = sequenceData.provider;
    editState = false;
    selectItem = value;
    let propsTemp;
    if (value != undefined) {
        propsTemp = await com.getProperties(value, ["object_name", "l2_content", "creation_date", "l2_checklists"]);
        if (data != undefined) {
            ctx.recentTreeData = data.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects;
        }
        let pUid = value.alternateID.split(",");
        pUid.pop();
        let pageUrl = "";
        let j = 1;
        for (let i = pUid.length - 1; i > -1; i--) {
            if (pUid.length > 1 && i < pUid.length - 1 && i > 0) {
                pageUrl += String("&p" + j + "=" + pUid[i]);
            } else if (pUid.length > 1 && i == 0) {
                pageUrl += String("&p" + j + "=" + pUid[i]);
            } else {
                pageUrl += String("p" + j + "=" + pUid[i]);
            }
            j++;
        }
        history.pushState(null, null, "#/lgepDesignStandards?" + pageUrl);
        let treeLevel = value.alternateID.split(",");
        treeLevel.pop();
        let treeNode = [];
        for (let i = treeLevel.length - 1; i >= 0; i--) {
            treeNode.push(com.getObject(treeLevel[i]));
        }
        let locationTemp = document.getElementsByClassName("aw-layout-breadCrumbs");
        let locationParent = locationTemp[0].parentNode;
        locationTemp[0].classList.add("noneToolbar");
        let moveBreadCrumbs = document.getElementById("locationToBread");
        locationParent.appendChild(moveBreadCrumbs);
        provider.crumbs = [];
        for (let i = 0; i < treeNode.length; i++) {
            if (i == treeNode.length - 1) {
                provider.crumbs.push({
                    "clicked": false,
                    "displayName": treeNode[i].props.object_name.dbValues[0],
                    "selectedCrumb": true,
                    "showArrow": false,
                    "crumbsValue": treeNode[i]
                });
            } else {
                provider.crumbs.push({
                    "clicked": false,
                    "displayName": treeNode[i].props.object_name.dbValues[0],
                    "selectedCrumb": false,
                    "showArrow": true,
                    "crumbsValue": treeNode[i]
                });
            }
        }
    }
    sequenceData.writer.dbValue = value.props.owning_user.uiValues[0];
    sequenceData.createData.dbValue = value.props.creation_date.uiValues[0];
    sequenceData.lastModify.dbValue = value.props.last_mod_date.uiValues[0];
    sequenceData.writer.uiValue = value.props.owning_user.uiValues[0];
    sequenceData.createData.uiValue = value.props.creation_date.uiValues[0];
    sequenceData.lastModify.uiValue = value.props.last_mod_date.uiValues[0];

    if (value != undefined) {
        if (value.type != "Folder" && value.type != "L2_ClsfyMgmtFolder") {
            sequenceData.itemTitle.uiValue = value.props.object_name.dbValues[0];
            propsTemp = propsTemp.modelObjects[value.uid].props;
            dataHeader[0].property.uiValue = value.props.owning_user.uiValues[0];
            dataHeader[1].property.uiValue = value.props.last_mod_date.uiValues[0];
            //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
            $('#sequenceSummernote').summernote({
                tabsize: 0,
                width: "100%",
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
            $('#sequenceSummernote').summernote('disable');
            let toolbarData = document.getElementsByClassName("note-toolbar");
            toolbarData = toolbarData[0];
            toolbarData.classList.add("noneToolbar");
            $('#sequenceSummernote').summernote('reset');
            Object.assign(value.props, propsTemp);
            let contents = await lgepSummerNoteUtils.readHtmlToSummernoteProtoOne(value);
            let temp = contents;
            if (temp.includes("<svg")) {
                    let sizeTemp = temp.split('width=');
                    let width = sizeTemp[1];
                    width = width.split('"');
                    let height = Number(width[3]);
                    if (Object.is((height), NaN)) {
                        height = 720;
                    }
                    width = Number(width[1]);
                    if (Object.is((width), NaN)) {
                        width = 1040;
                    }
                    temp = temp.replace(/<svg (.*?) width=/ig, "<svg viewBox='0 0 " + width + " " + height + "' preserveAspectRatio='none' width=");
                    temp = temp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/ig, 'preserveAspectRatio="none" width="100%" height="100%"');
                // let changeFont = /font-size="([^"]+(?="))"/g;
                // let matches = temp.matchAll(changeFont);
                // let i = 0
                // let fontSizes = [];
                // for(let match of matches){
                //     i++;
                //     let tmpNum = Number(match[1]);
                //     fontSizes.push(tmpNum);
                // }
                // const set = new Set(fontSizes);

                // const uniqueArr = [...set];

                // //console.log(uniqueArr);
                // for(let num of uniqueArr){
                //     let reduce = (num*0.88).toFixed(1);
                //     //console.log('"'+num+'"');
                //     temp = temp.replaceAll('"'+num+'"','"'+reduce+'"');
                // }
                // temp = temp.replaceAll(/font-size="([^"]+(?="))"/g,"font-size=12");
                if (sequenceData.summerNoteWidthMax.dbValue == true) {
                    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
                    $('#sequenceSummernote').summernote('reset');
                    //써머노트 내용 삽입
                    $('#sequenceSummernote').summernote('code', temp + '<br>');
                } else {
                    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
                    $('#sequenceSummernote').summernote('reset');
                    //써머노트 내용 삽입
                    $('#sequenceSummernote').summernote('code', contents);
                }
            } else {
                if (sequenceData.summerNoteWidthMax.dbValue == true) {
                    temp = temp.replace(/style="width: [^"]+"/gi, "style='width: 100%;'");
                    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
                    $('#sequenceSummernote').summernote('reset');
                    //써머노트 내용 삽입
                    $('#sequenceSummernote').summernote('code', temp + '<br>');
                } else {
                    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
                    $('#sequenceSummernote').summernote('reset');
                    //써머노트 내용 삽입
                    $('#sequenceSummernote').summernote('code', contents);
                }
            }
            return {
                selValue: value
            };
        } else {
            dataHeader[0].property.uiValue = "";
            dataHeader[1].property.uiValue = "";
            $('#sequenceSummernote').summernote('reset');
            const sequenceTreeData = vms.getViewModelUsingElement(document.getElementById("sequenceTreeData"));
            let expandedFolder;
            for (let i of sequenceTreeData.dataProviders.sequenceDataProvider.viewModelCollection.loadedVMObjects) {
                if (i.uid == value.uid) {
                    expandedFolder = i;
                    break;
                }
            }
            if(!expandedFolder.isLeaf){
                if (expandedFolder.isExpanded) {
                    expandedFolder.isExpanded = false;
                    eventBus.publish("sequenceTree.plTable.toggleTreeNode", expandedFolder);
                } else {
                    expandedFolder.isExpanded = true;
                    eventBus.publish("sequenceTree.plTable.toggleTreeNode", expandedFolder);
                }
            }
            return {
                selValue: undefined
            };
        }
    }
}

export function editSequenceCheck() {
    let editValue = false;
    if (selectItem == undefined) {
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "onlyProcedure"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return {
            editValue: editValue
        };
    }
    if (selectItem.type != "Folder" || selectItem.type != "L2_ClsfyMgmtFolder") {
        editValue = true;
        return {
            editValue: editValue
        };
    } else {
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "onlyProcedure"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return {
            editValue: editValue
        };
    }
}

export function popupCheck() {
    if (stateCheck == "2") {
        return {
            popupState: true
        };
    } else {
        return {
            popupState: false
        };
    }
}

async function getTreeNodeArr(node) {
    let nameArr = [];
    if (node.uid != "AOtNxVg95p7XAC") {
        nameArr.push(node.uid);
    }

    if (node.props.contents != undefined) {
        if (node.props.contents.dbValues.length > 0) {
            let temp = com.getObject(node.props.contents.dbValues);
            for (let i = 0; i < temp.length; i++) {
                let tempTemp;
                tempTemp = await getTreeNodeArr(temp[i]);
                nameArr.push(tempTemp);
                // }
            }
        }
    }
    return nameArr;
}

function flatAr(arr) {
    let result = arr.slice();
    for (let i = 0; i < result.length; i++) {
        if (Array.isArray(result[i])) {
            result = result.flat();
        }
    }
    return result;
}

export async function searchData(value) {
    if (common.isEmpty(value)) {
        return;
    }
    searchState = value;
    if (value != undefined && value != null && value != "") {
        let result = [];
        let searchData = await query.executeSavedQuery(lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "General"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "generalName")], ["*" + value + "*"]);
        let comparison = com.getObject("AOtNxVg95p7XAC");

        let treeName = await getTreeNodeArr(comparison);
        treeName = flatAr(treeName);

        _.forEach(searchData, function (tempSearch) {
            _.forEach(treeName, function (treeData) {
                if (treeData == tempSearch.uid) {
                    result.push(tempSearch);
                }
            });
        });

        for (let i = 0; i < result.length; i++) {
            if (result[i].type == "L2_DgnPage") {
                result[i] = com.getObject(result[i].props.revision_list.dbValues[result[i].props.revision_list.dbValues.length - 1]);
            }
        }
        //console.log("이건머임?", {
            // result
        // });

        return {
            searchState: true,
            result: result
        };
    }

    return {
        searchState: false,
        result: undefined
    };
}

export async function createObject(data) {
    let folderName = data.objName.uiValue;
    if(!folderName || folderName == ""){
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "noneFolderName"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return;
    }
    try {
        let folderData = {
            folders: [{
                name: data.objName.uiValue
            }],
            container: {
                uid: selTreeNode.uid
            }
        };
        await SoaService.post("Core-2006-03-DataManagement", "createFolders", folderData);
    } catch (err) {
        //console.log(err);
    }
    message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "folderCreationComplete"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
        function () {}
    ]);
    treeReload();
    return {
        state: stateCheck
    };
}

export async function selDataSetItem(data) {
    if (!data || !data.type.includes("Folder")) {
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "sequenceAddFolder"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return {
            result: false,
        };
    } else {
        selTreeNode = data;

        let setWidth = 0;
        let setHeight = 0;
        if (setWidth > window.innerWidth && setHeight > window.innerHeight) {
            setWidth = (window.innerWidth * 0.8) + "px";
            setHeight = (window.innerHeight * 0.8) + "px";
        } else if (setWidth > window.innerWidth) {
            setWidth = (window.innerWidth * 0.8) + "px";
        } else if (setHeight > window.innerHeight) {
            setHeight = (window.innerHeight * 0.8) + "px";
        } else if (window.innerHeight >= 800 && window.innerWidth >= 1300) {
            setWidth = "1300px";
            setHeight = "800px";
        } else if (setWidth < window.innerWidth * 0.8 && setHeight < window.innerHeight * 0.8) {
            setWidth = (window.innerWidth * 0.8) + "px";
            setHeight = (window.innerHeight * 0.8) + "px";
        } else if (setWidth < window.innerWidth * 0.8) {
            setWidth = (window.innerWidth * 0.8) + "px";
        } else if (setHeight < window.innerHeight * 0.8) {
            setHeight = (window.innerHeight * 0.8) + "px";
        }

        return {
            result: true,
            setWidth: setWidth,
            setHeight: setHeight
        };
    }
}

export async function selectCheckItem(data) {
    if (data == undefined || data.type != "L2_DgnPageRevision") {
        message.show(1, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "itemCheck"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
            function () {}
        ]);
        return {
            resultItem: false,
        };
    } else {
        selTreeNode = data;
        return {
            resultItem: true,
        };
    }
}

function stringSlice(tag) {
    let temp = tag;
    if (tag.includes("<svg")) {
        if (tag.includes("<image")) {
            tag = tag.match(/\<image.*\<\/image>/gi);
            tag = tag[0];
            tag = tag.split('"');
            let base64Arr = [];
            for (let i = 0; i < tag.length; i++) {
                if (tag[i].includes("xlink:href")) {
                    base64Arr.push(tag[i + 1]);
                }
            }
            for (let i of base64Arr) {
                temp = temp.replace(i, "");
            }
            // //console.log("xlink:href=''", {temp});
        }
        return temp;
    } else if (tag.includes("<img")) {
        let tagTemp = [];
        tag = tag.match(/\<img.*>/gi);
        tag = tag[0];
        tag = tag.replace(/<p[^>]+>/gi, '');
        tag = tag.replace(/[</p^>]+>/gi, '');
        tag = tag.replace(/<[/br^>]+>/gi, '');
        tag = tag.replace(/<br[^>]+>/gi, '');
        tag = tag.replace(/<br/gi, '');
        tag = tag.split('"');
        for (let i = 0; i < tag.length; i++) {
            if (tag[i].includes("src=")) {
                tagTemp.push(tag[i + 1]);
            }
        }
        for (let i of tagTemp) {
            temp = temp.replace(i, "");
        }
        // //console.log("src=''", {temp});
        return temp;
    }
}

export async function createSequence(data) {
    let contentsString = lgepSummerNoteUtils.stripTags($('#sequenceCreateSummernote').summernote('code'));
    let createResult
    let createItem;
    let createItemRev;
    if (contentsString == undefined) {
        contentsString = "";
    }
    try {
        let param = {
            properties: [{
                name: data.sequenceTitle.dbValue,
                type: "L2_DgnPage",
            }],
            container: {
                uid: selTreeNode.uid
            }
        };
        createResult = await SoaService.post("Core-2006-03-DataManagement", "createItems", param);
        createItem = createResult.output[0].item;
        createItemRev = createResult.output[0].itemRev;
    } catch (err) {
        //console.log(err);
    }
    await lgepSummerNoteUtils.txtFileToDataset($('#sequenceCreateSummernote').summernote('code'), createItemRev);
    try {
        let param = {
            objects: [createItemRev],
            attributes: {
                l2_content_string: {
                    stringVec: [contentsString]
                }
            }
        };
        await SoaService.post("Core-2007-01-DataManagement", "setProperties", param);
    } catch (err) {
        //console.log(err);
    }
    message.show(0, lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "procedureCreateSuccess"), [lgepLocalizationUtils.getLocalizedText("lgepDesignSequenceMessages", "close")], [
        function () {
            eventBus.publish("sequenceTree.plTable.reload");
        }
    ]);
}


export async function selDataSet(data, state) {
    if (data == undefined) {
        selTreeNode = com.getObject("AOtNxVg95p7XAC");
        stateCheck = state;
    } else {
        selTreeNode = data;
        stateCheck = state;
    }
    return {
        result: true,
    };
}

function treeReload() {
    searchState = undefined;
    eventBus.publish("sequenceTree.plTable.reload");
    return {
        searchState: false
    };
}

async function dataLoad(ctx) {
    return {
        result: undefined
    };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, data, ctx) {
    count++;
    let firstCheck = false;
    // Simulates server call/response
    let basicUrl = browserUtils.getBaseURL();
    let homeUid;
    if (acceessableCount > 0) {
        acceessableCount--;

        if (nodeBeingExpanded.uid == input.rootNode.uid) {
            nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
        }

        if (nodeBeingExpanded.uid == "top") {
            homeUid = "AGpNCJJd5p7XAC";
            firstCheck = true;
        } else {
            homeUid = nodeBeingExpanded.uid;
        }

        let loadObj;
        try {
            let getPropertiesParam = {
                uids: [homeUid]
            };
            loadObj = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getPropertiesParam);
        } catch (err) {
            //console.log(err);
        }
        
        let treeObj = loadObj.modelObjects[homeUid];
        //console.log("여기서한번",{treeObj});

        try {
            let getPropertiesParam = {
                objects: [treeObj],
                attributes: ["contents"]
            };
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

        } catch (err) {
            //console.log(err);
        }

        let response = com.getObject(treeObj.props.contents.dbValues);
        if (firstCheck) {
            let userGroup = ctx.userSession.props.group_name.uiValue;
            let groupFolder = false;
            for (let i = 0; i < response.length; i++) {
                if (response[i].props.object_string.uiValues[0] == userGroup) {
                    groupFolder = true;
                    response = [response[i]];
                    try {
                        let getPropertiesParam = {
                            objects: response,
                            attributes: ["contents"]
                        };
                        await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

                    } catch (err) {
                        //console.log(err);
                    }
                    response = com.getObject(response[0].props.contents.dbValues);
                    break;
                }
            }
            if (!groupFolder) {
                try {
                    let folderData = {
                        folders: [{
                            name: userGroup
                        }],
                        container: treeObj
                    };
                    let createGroupFolder = await SoaService.post("Core-2006-03-DataManagement", "createFolders", folderData);
                    response = [createGroupFolder.output[0].folder];
                    try {
                        let getPropertiesParam = {
                            objects: response,
                            attributes: ["contents"]
                        };
                        await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

                    } catch (err) {
                        //console.log(err);
                    }
                    response = com.getObject(response[0].props.contents.dbValues);
                } catch (err) {
                    //console.log(err);
                }
            }
            firstCheck = false;
        }
        try {
            let getPropertiesParam = {
                objects: response,
                attributes: ["object_string", "contents", "object_name", "fnd0InProcess", "ics_subclass_name", "object_type", "checked_out", "owning_user", "owning_group", "last_mod_date", "release_statuses", "revision_list", "IMAN_specification", "object_desc"]
            };
            await SoaService.post("Core-2006-03-DataManagement", "getProperties", getPropertiesParam);

        } catch (err) {
            //console.log(err);
        }
        for (let i = 0; i < response.length; i++) {
            if (response[i].type != "Folder" && response[i].type != "L2_ClsfyMgmtFolder") {
                let temp = response[i].props;
                let revision = com.getObject(response[i].props.revision_list.dbValues[response[i].props.revision_list.dbValues.length - 1]);
                Object.assign(revision.props, temp);
                response[i] = revision;
            }
        }
        await com.getProperties(response, ["object_name", "IMAN_specification", "object_desc", "l2_checklists"]);
        let viewArr = [];

        _.forEach(response, function (treeNode) {
            //if (treeNode.type == "Folder") {
            let nodeName = treeNode.props.object_name.dbValues[0];
            let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
            let temp = vmo;
            vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
            Object.assign(vmo, temp);
            if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
                vmo.isLeaf = true;
            } else if (temp.props.contents.dbValues.length > 0) {
                vmo.isLeaf = false;
            }
            vmo.alternateID = vmo.uid + "," + nodeBeingExpanded.alternateID;
            vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
            vmo.basicUrl = basicUrl;
            viewArr.push(vmo);
            //}
        });
        if (sortCriteria && sortCriteria.length > 0) {
            var criteria = sortCriteria[0];
            var sortDirection = criteria.sortDirection;
            var sortColName = criteria.fieldName;

            if (sortDirection === 'ASC') {
                viewArr.sort(function (a, b) {
                    if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return 1;
                    if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
                    if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return -1;
                });
            } else if (sortDirection === 'DESC') {
                viewArr.sort(function (a, b) {
                    if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return 1;
                    if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
                    if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return -1;
                });
            }
        }

        acceessableCount++;
        return {
            parentNode: nodeBeingExpanded,
            childNodes: viewArr,
            totalChildCount: viewArr.length,
            startChildNdx: 0
        };
    } else {
        return {
            parentNode: nodeBeingExpanded,
            childNodes: null,
            totalChildCount: null,
            startChildNdx: 0
        };
    }
}

export function initialize() {
    $('#sequenceSummernote').summernote({
        tabsize: 0,
        width: "100%",
        toolbar: [
            ['fontsize', ['fontsize']],
            ['fontname'],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link', 'uploadImage']],
            ['codeview']
        ],
        buttons: {
            uploadImage: function (context) {
                var ui = $.summernote.ui;
                // 이벤트 지정
                var button = ui.button({
                    // 툴바 표시 내용
                    contents: '<i class="fa fa-pencil"/> SVG',
                    // 툴바 툴팁 표현 내용 
                    // tooltip: '',
                    // 클릭시 이벤트 작동
                    click: function (event) {
                        //console.log("눌렀다.");
                        var input = document.createElement('input');
                        input.type = 'file';
                        input.multiple = 'multiple';
                        input.accept = '.svg';

                        let promiseArray = [];
                        input.onchange = e => {
                            var files = e.target.files;
                            //console.log("파일 보기", { files });
                            for (const value of files) {
                                let promise = new Promise((resolve) => {
                                    var reader = new FileReader();
                                    reader.readAsText(value, 'UTF-8');
                                    reader.onload = readerEvent => {
                                        var content = readerEvent.target.result;
                                        resolve(content);
                                    }
                                });
                                promiseArray.push(promise);
                            }
                            Promise.all(promiseArray).then((svgArr) => {
                                //console.log(svgArr);
                                let temp;
                                for (let i = 0; i < svgArr.length; i++) {
                                    svgArr[i] = svgArr[i].replaceAll('id=\"', `id=\"${i}_`);
                                    svgArr[i] = svgArr[i].replaceAll('#clip', `#${i}_clip`);
                                    svgArr[i] = svgArr[i].replaceAll('#img', `#${i}_img`);
                                    if (i > 0) {
                                        temp = temp + svgArr[i] + '<br>';
                                    }
                                    else {
                                        temp = svgArr[i] + '<br>';
                                    }
                                }
                                $('#sequenceSummernote').summernote('code', temp);
                            })
                        }
                        input.click();
                    },
                });
                return button.render();
            }
        },
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
    });
    $('#sequenceSummernote').summernote('disable');
    // document.getElementsByClassName("note-toolbar").classList.add("noneToolbar"); 
    tabShowORHide();
}

export function applySortAndFilterRows(response, columnFilters, sortCriteria, startIndex, pageSize) {
    if (response.result == undefined || response.result == null) return;
    var countries = response.result;
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
                if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return 1;
                if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
                if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return -1;
            });
        } else if (sortDirection === 'DESC') {
            countries.sort(function (a, b) {
                if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return 1;
                if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
                if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return -1;
            });
        }
    }

    var endIndex = startIndex + pageSize;

    return countries.slice(startIndex, endIndex);
}

export function getFilterFacets(response, columnFilters, fullData) {
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

    if (updateFilters) {
        _.forEach(updateFilters, function (columnFilter) {
            countries = createFilters(columnFilter, countries);
        });
    }

    var facetsToReturn = [];

    _.forEach(countries, function (country) {
        if (country.props[columnName].uiValues[0]) {
            _.forEach(country.props[columnName].uiValues[0], function (value) {
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
}

export function getFilterFacetData(fullData) {
    return fullData;
}

function processCaseSensitiveNotEqualsFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        for (var i = 0; i < columnFilter.values.length; i++) {
            if (!country.props[columnFilter.columnName].isArray) {
                if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
                    return false;
                } else if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
                    return !country.props[columnFilter.columnName].uiValues[0].indexOf(columnFilter.values[i]) >= 0;
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
}


function processContainsFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        if (country.props[columnFilter.columnName].uiValue) {
            return country.props[columnFilter.columnName].uiValue.toLowerCase().indexOf(columnFilter.values[0].toLowerCase()) >= 0;
        } else if (country.props[columnFilter.columnName].uiValues) {
            return country.props[columnFilter.columnName].uiValues.toString().toLowerCase().indexOf(columnFilter.values[0].toLowerCase()) >= 0;
        }
    });
}

/**
 * This function mocks the server logic for filtering text data with the 'Does not contain' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
function processNotContainsFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        if (country.props[columnFilter.columnName].uiValue) {
            return !country.props[columnFilter.columnName].uiValue.toLowerCase().indexOf(columnFilter.values[0].toLowerCase()) >= 0;
        } else if (country.props[columnFilter.columnName].uiValues) {
            return !country.props[columnFilter.columnName].uiValues.toString().toLowerCase().indexOf(columnFilter.values[0].toLowerCase()) >= 0;
        }
    });
}

/**
 * This function mocks the server logic for filtering text data with the 'Begins with' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
function processStartsWithFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        if (country.props[columnFilter.columnName].uiValue) {
            return country.props[columnFilter.columnName].uiValue.toLowerCase().startsWith(columnFilter.values[0].toLowerCase());
        } else if (country.props[columnFilter.columnName].uiValues) {
            return country.props[columnFilter.columnName].uiValues[0].toLowerCase().startsWith(columnFilter.values[0].toLowerCase());
        }
    });
}

/**
 * This function mocks the server logic for filtering text data with the 'Ends with' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
function processEndsWithFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        if (country.props[columnFilter.columnName].uiValue) {
            return country.props[columnFilter.columnName].uiValue.toLowerCase().endsWith(columnFilter.values[0].toLowerCase());
        } else if (country.props[columnFilter.columnName].uiValues) {
            return country.props[columnFilter.columnName].uiValues[0].toLowerCase().endsWith(columnFilter.values[0].toLowerCase());
        }
    });
}

function processEqualsTextFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        for (var i = 0; i < columnFilter.values.length; i++) {
            if (!country.props[columnFilter.columnName].isArray) {
                if (country.props[columnFilter.columnName].value && columnFilter.values[i]) {
                    return country.props[columnFilter.columnName].value.toString().toLowerCase().indexOf(columnFilter.values[i].toLowerCase()) >= 0;
                } else if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
                    return true;
                }
            } else {
                if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
                    return country.props[columnFilter.columnName].uiValues.toString().toLowerCase().indexOf(columnFilter.values[i].toLowerCase()) >= 0;
                }
            }
        }
        return false;
    });
}

/**
 * This function mocks the server logic for filtering text data with the 'Equals' operation.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
function processCaseSensitiveEqualsTextFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        for (var i = 0; i < columnFilter.values.length; i++) {
            if (!country.props[columnFilter.columnName].isArray) {
                if (country.props[columnFilter.columnName].value && columnFilter.values[i]) {
                    return country.props[columnFilter.columnName].value.toString().indexOf(columnFilter.values[i]) >= 0;
                } else if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
                    return true;
                }
            } else {
                if (country.props[columnFilter.columnName].uiValues && columnFilter.values[i]) {
                    return country.props[columnFilter.columnName].uiValues.toString().indexOf(columnFilter.values[i]) >= 0;
                }
            }
        }
        return false;
    });
}

function processNotEqualsTextFilter(columnFilter, countries) {
    return countries.filter(function (country) {
        for (var i = 0; i < columnFilter.values.length; i++) {
            if (!country.props[columnFilter.columnName].isArray) {
                if (columnFilter.values[i] === '' && (!country.props[columnFilter.columnName].value || country.props[columnFilter.columnName].value === null)) {
                    return false;
                } else if (country.props[columnFilter.columnName].uiValue && columnFilter.values[i]) {
                    return !country.props[columnFilter.columnName].uiValue.toLowerCase().indexOf(columnFilter.values[i].toLowerCase()) >= 0;
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
}

function processTextFilters(columnFilter, countries) {
    switch (columnFilter.operation) {
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
}

export async function filterRowsWithSort(response, sortCriteria, startIndex, pageSize) {
    let countries = response.data.countries;
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

function createFilters(columnFilter, countries) {

    countries = processTextFilters(columnFilter, countries);

    return countries;
}

let exports = {};

export default exports = {
    initialize,
    dataLoad,
    loadEmployeeTreeTableData,
    selDataSet,
    createObject,
    treeReload,
    searchData,
    filterRowsWithSort,
    getFilterFacetData,
    getFilterFacets,
    applySortAndFilterRows,
    popupCheck,
    contentLoad,
    checkListdataSet,
    checkTableReLoad,
    getListBox,
    designcheckListTableLoad,
    checkListItemCopy,
    checkListCopyResult,
    checkListCopyDelete,
    createInitialize,
    selDataSetItem,
    createSequence,
    selectCheckItem,
    checkListReload,
    getSecondListBox,
    sequenceEdit,
    getLastListBox,
    designStdTableReLoadSequencePage,
    datasetDownLoad,
    // testing,
    // testtest,
    editInitializeSummer,
    getDataUrlSetting,
    toolTipSelectedTab,
    editSequenceCheck,
    summerNoteImageWidthMax,
    getSelectProcedureList,
    breadcrumListDataSelect,
    zxcv,
    tabShowORHide,
    editStartOREnd,
    loadData,
    checklistOpen,
    onMount,
    deleteObj,
    toggleCssAction,
    updateSliderValue
};

app.factory('sequenceService', () => exports);