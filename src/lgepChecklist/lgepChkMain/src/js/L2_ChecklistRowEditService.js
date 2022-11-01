import app from 'app';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import lgepQueryUtils from 'js/utils/lgepQueryUtils';
import viewModelObjectService from 'js/viewModelObjectService'
import appCtxService from 'js/appCtxService';
import checklistUtils from 'js/utils/checklistUtils';
import { ChecklistRow, createImageGridRows } from 'js/L2_ChecklistOpenService';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';

let exports;

export function initialize(data, ctx) {
    let topLine = ctx.checklist.structure[0];
    let children = topLine.getChildren();
    data.upperAssyValues.dbValue = [];
    let createNew = {
        "propDisplayValue": "Create New...",
        "propDisplayDescription": "Create a new structure and add it to checklist.",
        "propInternalValue": "Create New...",
        "iconName": "cmdAdd24.svg"
    }
    data.upperAssyValues.dbValue.push(createNew);
    for (const child of children) {
        let vmo = viewModelObjectService.createViewModelObject(child.getOriginalObject());
        let rowValue = {
            "propDisplayValue": vmo.props.object_string.dbValues[0],
            "propDisplayDescription": "",
            "propInternalValue": vmo.uid,
            "iconName": vmo.typeIconURL.split("/")[vmo.typeIconURL.split("/").length-1],
            "checklistRow": child
        }
        data.upperAssyValues.dbValue.push(rowValue);
    }
    lgepQueryUtils.executeSavedQuery("FunctionRevSearch", ["L2_function"], ["*"], 
        lgepObjectUtils.createPolicies(["l2_function", "l2_requirement", "object_string"], ["L2_FunctionRevision"])
    ).then( (queryResults) => {
        console.log({queryResults});
        for (const mo of queryResults) {
            let vmo = viewModelObjectService.createViewModelObject(mo);
            let rowValue = {
                "propDisplayValue": vmo.props.object_string.dbValues[0],
                "propDisplayDescription": "",
                "propInternalValue": vmo.uid,
                "iconName": vmo.typeIconURL.split("/")[vmo.typeIconURL.split("/").length-1]
            }
            data.functionValues.dbValue.push(rowValue);
        }
    })
    lgepQueryUtils.executeSavedQuery("FailureRevSearch", ["L2_failure_mode"], ["*"], 
        lgepObjectUtils.createPolicies(["l2_classficiation", "l2_failure_mode", "l2_source", "object_string"], ["L2_FailureRevision"])
    ).then( (queryResults) => {
        console.log({queryResults});
        for (const mo of queryResults) {
            let vmo = viewModelObjectService.createViewModelObject(mo);
            let rowValue = {
                "propDisplayValue": vmo.props.object_string.dbValues[0],
                "propDisplayDescription": "",
                "propInternalValue": vmo.uid,
                "iconName": vmo.typeIconURL.split("/")[vmo.typeIconURL.split("/").length-1]
            }
            data.failureValues.dbValue.push(rowValue);
        }
        return;
    })
}

export function getChildrenListboxElements(data, parentListBoxName, childListBoxName) {
    let children = [];
    if(data[parentListBoxName].selectedLovEntries.length > 0) {
        children = data[parentListBoxName].selectedLovEntries[0].checklistRow.getChildren();
    }
    data[childListBoxName + "Values"].dbValue = [];
    let createNew = {
        "propDisplayValue": "Create New...",
        "propDisplayDescription": "Create a new structure and add it to checklist.",
        "propInternalValue": "Create New...",
        "iconName": "cmdAdd24.svg"
    }
    data[childListBoxName + "Values"].dbValue.push(createNew);
    for (const child of children) {
        let vmo = viewModelObjectService.createViewModelObject(child.getOriginalObject());
        let rowValue = {
            "propDisplayValue": vmo.props.object_string.dbValues[0],
            "propDisplayDescription": "",
            "propInternalValue": vmo.uid,
            "iconName": vmo.typeIconURL.split("/")[vmo.typeIconURL.split("/").length-1],
            "checklistRow": child
        }
        data[childListBoxName + "Values"].dbValue.push(rowValue);
    }
}

export function upperAssyChanges(data) {
    getChildrenListboxElements(data, "upperAssy", "lowerAssy");
}

export function lowerAssyChanges(data) {
}

export function functionChanges(data) {
    let summernoteInitArray = ["functionDetail", "requirementDetail"];
    for (const summernoteId of summernoteInitArray) {
        $("#" + summernoteId).summernote(summernoteInit(data, summernoteId));
        $("#" + summernoteId).summernote('reset');
        $("#" + summernoteId).summernote('enable');
        if( data.function.dbValue != 'Create New...' && summernoteId == "functionDetail") {
            let loadedObject = lgepObjectUtils.getObject(data.function.dbValue);
            $("#" + summernoteId).summernote('code', loadedObject.props.l2_function.dbValues[0]);
            $("#" + summernoteId).summernote('disable');
        }
        if( data.function.dbValue != 'Create New...' && summernoteId == "requirementDetail") {
            let loadedObject = lgepObjectUtils.getObject(data.function.dbValue);
            $("#" + summernoteId).summernote('code', loadedObject.props.l2_requirement.dbValues[0]);
            $("#" + summernoteId).summernote('disable');
        }
    }
}

export function failureChanges(data) {
    let summernoteInitArray = ["failureEffect", "failureDetail", "prevention", "detectivity"];
    for (const summernoteId of summernoteInitArray) {
        $("#" + summernoteId).summernote(summernoteInit(data, summernoteId));
        $("#" + summernoteId).summernote('reset');
        $("#" + summernoteId).summernote('enable');
        if( data.failure.dbValue != 'Create New...' && summernoteId == "failureDetail") {
            let loadedObject = lgepObjectUtils.getObject(data.failure.dbValue);
            $("#" + summernoteId).summernote('code', loadedObject.props.l2_failure_mode.dbValues[0]);
            $("#" + summernoteId).summernote('disable');
        }
    }
}

let stackUid = 0;
export function createChecklistRow(data, ctx) {
    if(!appCtxService.ctx.checklist.editingStacks) 
        appCtxService.ctx.checklist.editingStacks = [];
    if(!appCtxService.ctx.checklist.addRowStack) 
        appCtxService.ctx.checklist.addRowStack = [];

    let upperAssyUid = data.upperAssy.dbValue;
    let upperAssyValue = "";
    let lowerAssyUid = data.lowerAssy.dbValue;
    let lowerAssyValue = "";
    let functionUid = data.function.dbValue;
    let functionValue = "";
    let requirementValue = "";
    let failureUid = data.failure.dbValue;
    let failureModeValue = "";
    let classificationValue = "";
    let sourceValue = "";

    stackUid++;
    let addRowStack = {id: stackUid};
    
    // 상위 어셈블리
    if(upperAssyUid == "Create New...") {
        upperAssyValue = data.upperAssyName.dbValue;
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                name: upperAssyValue,
                type: "L2_Structure",
                subtype: "upperAssy"
            },
        });
        addRowStack.upperAssy = null;
    } else {
        upperAssyValue = lgepObjectUtils.getObject(upperAssyUid).props.object_name.dbValues[0];
        addRowStack.upperAssy = lgepObjectUtils.getObject(upperAssyUid);
    }

    // 하위 어셈블리
    if(lowerAssyUid == "Create New...") {
        lowerAssyValue = data.lowerAssyName.dbValue;
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                name: lowerAssyValue,
                type: "L2_Structure",
                subtype: "lowerAssy"
            }
        });
        addRowStack.lowerAssy = null;
    } else {
        lowerAssyValue = lgepObjectUtils.getObject(lowerAssyUid).props.object_name.dbValues[0];
        addRowStack.lowerAssy = lgepObjectUtils.getObject(lowerAssyUid);
    }
    
    // 기능
    functionValue = data.functionDetail_summernote;
    requirementValue = data.functionDetail_summernote;
    if(functionUid == "Create New...") {
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                revision: {
                    l2_function: functionValue,
                    l2_requirement: requirementValue,
                },
                type: "L2_Function",
            }
        });
        addRowStack.L2_Function = null;
    } else {
        functionValue = lgepObjectUtils.getObject(functionUid).props.object_name.dbValues[0];
        addRowStack.L2_Function = lgepObjectUtils.getObject(functionUid);
    }

    // 고장
    classificationValue = data.classification.dbValue;
    failureModeValue = lgepSummerNoteUtils.stripTags(data.failureDetail_summernote);
    sourceValue = "";
    if(failureUid == "Create New...") {
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                type: "L2_Failure",
                revision: {
                    l2_classification: classificationValue,
                    l2_failureMode: failureModeValue,
                    l2_source: sourceValue,
                }
            }
        });
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                type: "Text",
                content: {
                    functionDetail: data.functionDetail_summernote,
                    requirementDetail: data.requirementDetail_summernote,
                    failureModeDetail: data.failureDetail_summernote,
                    failureEffect: data.failureEffect_summernote,
                    prevention: data.prevention_summernote,
                    detectivity: data.detectivity_summernote
                }
            }
        });
        addRowStack.L2_Failure = null;
        addRowStack.Text = null;
    } else {
        appCtxService.ctx.checklist.editingStacks.push({
            target: stackUid,
            type: "Create",
            context: {
                type: "Text",
                content: {
                    functionDetail: data.functionDetail_summernote,
                    requirementDetail: data.requirementDetail_summernote,
                    failureModeDetail: data.failureDetail_summernote,
                    failureEffect: data.failureEffect_summernote,
                    prevention: data.prevention_summernote,
                    detectivity: data.detectivity_summernote
                }
            }
        });
        addRowStack.L2_Failure = lgepObjectUtils.getObject(failureUid);
        addRowStack.Text = null;
    }
    
    addRowStack.L2_Ref_Severity = data.severity.dbValue;
    addRowStack.L2_Ref_Occurence = data.occurence.dbValue;
    addRowStack.L2_Ref_Detection = data.detection.dbValue;

    appCtxService.ctx.checklist.addRowStack.push(addRowStack);

    // 임시 테이블 업데이트
    if(!appCtxService.ctx.checklist.AddedTableRows)
        appCtxService.ctx.checklist.AddedTableRows = [];
    if(!appCtxService.ctx.checklist.AddedTreeRows)
        appCtxService.ctx.checklist.AddedTreeRows = [];

    let tableRow = {
        icon: "AAAAAAAAAAAAAA", 
        upperAssy: upperAssyValue, 
        lowerAssy: lowerAssyValue,
        function: functionValue,
        requirement: requirementValue,
        refSeverity: data.severity.dbValue,
        refOccurence: data.occurence.dbValue,
        refDetection: data.detection.dbValue,
        functionDetail: data.functionDetail_summernote,
        requirementDetail: data.requirementDetail_summernote,
        failureModeDetail: data.failureDetail_summernote,
        failureEffect: data.failureEffect_summernote,
        prevention: data.prevention_summernote,
        detectivity: data.detectivity_summernote,
        iconUrl: app.getBaseUrlPath() + "/image/typeQcFMEASystemElementSpecification48.svg"
    }
    appCtxService.ctx.checklist.AddedTableRows.push(tableRow);
    
    let functionRow;
    if( appCtxService.ctx.checklist.function.filter( (e)=> e.getOriginalObject().uid == functionUid).length > 0 ) {
        functionRow = appCtxService.ctx.checklist.function.filter( (e)=> e.getOriginalObject().uid == functionUid)[0];
        functionRow._children.push(tableRow);
    } else {
        functionRow = {
            icon: "AAAAAAAAAAAAAA", 
            upperAssy: upperAssyValue, 
            iconUrl: app.getBaseUrlPath() + "/image/typeQcFMEASystemElementSpecification48.svg",
            _children: [tableRow]
        }
    }

    let lowerAssy;
    if( appCtxService.ctx.checklist.structure.filter( (e)=> e.getOriginalObject().uid == lowerAssyUid).length > 0 ) {
        lowerAssy = appCtxService.ctx.checklist.structure.filter( (e)=> e.getOriginalObject().uid == lowerAssyUid)[0];
        lowerAssy._children.push(tableRow);
    } else {
        lowerAssy = {
            icon: "AAAAAAAAAAAAAA", 
            upperAssy: upperAssyValue, 
            iconUrl: app.getBaseUrlPath() + "/image/typeQcFMEASystemElementSpecification48.svg",
            _children: [tableRow]
        }
    }

    let upperAssy;
    if( appCtxService.ctx.checklist.structure.filter( (e)=> e.getOriginalObject().uid == upperAssyUid).length > 0 ) {
        upperAssy = appCtxService.ctx.checklist.structure.filter( (e)=> e.getOriginalObject().uid == upperAssyUid)[0];
        upperAssy._children.push(tableRow);
    } else {
        upperAssy = {
            icon: "AAAAAAAAAAAAAA", 
            upperAssy: upperAssyValue, 
            iconUrl: app.getBaseUrlPath() + "/image/typeQcFMEASystemElementSpecification48.svg",
            _children: [tableRow]
        }
    }

    appCtxService.ctx.checklist.AddedTreeRows.push(upperAssy);

    if(appCtxService.ctx.checklist.grid && appCtxService.ctx.checklist.tableMode == "3") {
        appCtxService.ctx.checklist.grid.appendRow(upperAssy,  {parentRowKey: 0});
    } else {
        appCtxService.ctx.checklist.grid.appendRow(tableRow);
    }


}

export function openChecklistBomEdit(data, ctx) {
    ctx._editing = true;
    ctx.checklist.grid.setColumns(checklistUtils.checklistRowEditingColumns);
    if(appCtxService.ctx.checklist.grid && appCtxService.ctx.checklist.tableMode == "3") {
        appCtxService.ctx.checklist.grid.showColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(3);
    } else {
        appCtxService.ctx.checklist.grid.hideColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    }
}

export function openChecklistBomAdd(data, ctx) {
    lgepPopupUtils.openPopup2("L2_ChecklistAddRow", "추가", "1000", "700", true, false, true, null, null);
}

export function openChecklistBomRemove(data, ctx) {
    alert("openChecklistBomRemove")
}

export async function openChecklistBomSave(data, ctx) {
    delete ctx._editing
    if(!ctx.checklist.editingStacks || ctx.checklist.editingStacks.length == 0) {
        alert("No Changes!");
    } else {
        for (const stack of ctx.checklist.editingStacks) {
            // Stack 중 Create 에 해당하는 Stack 처리
            let response = null;
            if(stack.type == "Create") {
                if(stack.context.type != "Text") {
                    if(stack.context.type == "L2_Structure") {
                        response = await lgepObjectUtils.createAttachAndSubmitObjects(
                            stack.context.type, 
                            {object_name: [stack.context.name]}
                        )
                        stack.context.type = stack.context.subtype;
                    } else if(stack.context.type == "L2_Function") {
                        response = await lgepObjectUtils.createAttachAndSubmitObjects(
                            stack.context.type, 
                            {object_name: ["auto_generated"]}, 
                            {l2_function: [stack.context.revision.l2_function], l2_requirement: [stack.context.revision.l2_requirement]}
                        )
                    } else if(stack.context.type == "L2_Failure") {
                        response = await lgepObjectUtils.createAttachAndSubmitObjects(
                            stack.context.type, 
                            {object_name: ["auto_generated"]}, 
                            {
                                l2_classification: [stack.context.revision.l2_classification], 
                                l2_failure_mode: [stack.context.revision.l2_failureMode],
                                l2_source: [stack.context.revision.l2_source],
                            }
                        )
                    }
                    let filteredMo = response.output[0].objects.filter( (e) => e.type.includes("Revision") );
                    let targetAddRowStack =  ctx.checklist.addRowStack.filter( (e) => e.id == stack.target );
                    targetAddRowStack[0][stack.context.type] = filteredMo[0];
                } else {
                    response = await lgepSummerNoteUtils.stringToDataset("details", JSON.stringify(stack.context.content));
                    let targetAddRowStack =  ctx.checklist.addRowStack.filter( (e) => e.id == stack.target );
                    targetAddRowStack[0][stack.context.type] = response[0];
                }
            }
        }
        appCtxService.ctx.checklist.grid.showColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(3);

        createImageGridRows(ctx.checklist.target, ctx.checklist.grid, async function() {
            let bomWindow = appCtxService.ctx.checklist.bomWindow;
            let topLine = appCtxService.ctx.checklist.topLine;
            if(ctx.checklist.addRowStack && ctx.checklist.addRowStack.length > 0) {
                for (const addRowStack of ctx.checklist.addRowStack) {
    
                    let upperAssyLine = await lgepBomUtils.add(topLine, addRowStack.upperAssy);
                    upperAssyLine = upperAssyLine.addedLines[0];
                    let lowerAssyLine = await lgepBomUtils.add(upperAssyLine, addRowStack.lowerAssy);
                    lowerAssyLine = lowerAssyLine.addedLines[0];
                    let functionLine = await lgepBomUtils.add(lowerAssyLine, addRowStack.L2_Function);
                    functionLine = functionLine.addedLines[0];
                    let failureLine = await lgepBomUtils.add(functionLine, addRowStack.L2_Failure);
                    failureLine = failureLine.addedLines[0];
                    
                    lgepObjectUtils.setProperties(failureLine, 
                        ["L2_Ref_Detection", "L2_Ref_Occurence", "L2_Ref_Severity", "L2_ReferenceDataset"], 
                        [addRowStack.L2_Ref_Detection, addRowStack.L2_Ref_Occurence, addRowStack.L2_Ref_Severity, addRowStack.Text.uid]
                    )
                }
                delete ctx.checklist.addRowStack;
            }
            if(ctx.checklist.editingStacks && ctx.checklist.editingStacks.length > 0) {
                for (const stack of ctx.checklist.editingStacks) {
                    if (stack.type == "Edit" && stack.columnName.startsWith("ref")) {
                        let row = ctx.checklist.grid.getRowAt(ctx.checklist.grid.getIndexOfRow(stack.rowKey));
                        if(row.refDatasetUid) {
                            let textDataset = lgepObjectUtils.getObject(row.refDatasetUid);
                            let properties = await checklistUtils.readPropertiesFromTextFile(row.refDatasetUid);
                            properties[stack.columnName] = stack.context;
                            await lgepSummerNoteUtils.modifyDataset("detail", JSON.stringify(properties), textDataset);
                        } else {
                            // let properties = {
                            //     functionDetail: "",
                            //     requirementDetail: "",
                            //     failureModeDetail: "",
                            //     failureEffect: "",
                            //     failureDetail: "",
                            //     prevention: "",
                            //     referenceData: "",
                            //     detectivity: "",
                            //     classification: "",
                            //     refResult: "",
                            //     refRecommend: "",
                            //     refRecommendResult: ""
                            // }
                            // properties[stack.columnName] = stack.context;
                            
                            // let dataset = await lgepSummerNoteUtils.stringToDataset("detail", JSON.stringify(properties));
                            // dataset = dataset[0];
                            // await lgepObjectUtils.setProperties([{uid: row.id, type:"BOMLine"}], ["L2_ReferenceDataset"], [dataset.uid]);
                        }
                    }
                }
                delete ctx.checklist.editingStacks;
            }
            return;
        })

    }
    ctx.checklist.grid.setColumns(checklistUtils.checklistRowColumns);
    if(appCtxService.ctx.checklist.grid && appCtxService.ctx.checklist.tableMode == "3") {
        appCtxService.ctx.checklist.grid.showColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(3);
    } else {
        appCtxService.ctx.checklist.grid.hideColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    }
}

export function openChecklistBomCancelEdit(data, ctx) {
    delete ctx._editing
    ctx.checklist.grid.setColumns(checklistUtils.checklistRowColumns);
    if(appCtxService.ctx.checklist.grid && appCtxService.ctx.checklist.tableMode == "3") {
        appCtxService.ctx.checklist.grid.showColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    } else {
        appCtxService.ctx.checklist.grid.hideColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(3);
    }
}

export function getUpperAssyRevisions(data, ctx) {
    let topLine = ctx.checklist.structure[0];
    let children = topLine.getChildren();
    let searchResults = [];
    for (const child of children) {
        let vmo = viewModelObjectService.createViewModelObject(child.getOriginalObject());
        searchResults.push(vmo);
    }
    data.dataProviders.upperAssyDp.viewModelCollection.setViewModelObjects(searchResults);
    if(!data.upperAssy)
        data.upperAssy = {};
    data.upperAssy.searchResults = searchResults;
    data.upperAssy.totalFound = searchResults.length;
    return {
        searchResults: data.upperAssy.searchResults,
        totalFound: data.upperAssy.totalFound 
    };
}

function summernoteInit(data, savePoint) {
    return {
        lang: 'ko-KR',
        tabsize: 3,
        height: 300,
        toolbar: [
                ['fontsize', ['fontsize']],
                ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                ['color', ['forecolor', 'color']],
                ['table', ['table']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['picture', 'link']],
                ['codeview', ['fullscreen']],
            ],
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
        callbacks: {
            onChange: function(contents, $editable) {
                data[savePoint + "_summernote"] = contents;
            }
        }
    }
}


export default exports = {
    initialize,
    upperAssyChanges,
    lowerAssyChanges,
    functionChanges,
    failureChanges,
    createChecklistRow,
    openChecklistBomEdit,
    openChecklistBomAdd,
    openChecklistBomRemove,
    openChecklistBomSave,
    openChecklistBomCancelEdit,
    getUpperAssyRevisions
}

app.factory('L2_ChecklistRowEditService', () => exports);