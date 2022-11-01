import app from 'app';

import appCtxService, { ctx } from 'js/appCtxService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import { setSublocationTitle, recursiveTreeExpand, blankTreeRow, checklistRowColumns, checklistRowProperties, readPropertiesFromTextFile } from 'js/utils/checklistUtils';
import { ERROR, INFORMATION, WARNING, show } from 'js/utils/lgepMessagingUtils';
import { getInteractionStructureInfo } from 'js/L2_ChecklistInteractionUtils';

import $ from 'jquery';

import lgepBomUtils from 'js/utils/lgepBomUtils'

import vmoService from 'js/viewModelObjectService';

import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

let exports;

var _expandStacks = [];

/**
 *  체크리스트 클래스
 */
 export class ChecklistRow {
    /**
     * 
     * @param {viewModelObject} viewModelObject 
     */
    constructor(viewModelObject, parent) {
        try {
            this.getObject = function() {
                return viewModelObject;
            }
            this.getOriginalObject = function() {
                let originalUid = viewModelObject.props.bl_line_object.dbValues[0];
                let originalObject = lgepObjectUtils.getObject(originalUid);
                return vmoService.constructViewModelObjectFromModelObject(originalObject);
            }
            this.setParent = function(parent) {
                this.parent = parent;
            }
            this.getParent = function(parent) {
                return this.parent;
            }
            this.setChildren = function(children) {
                this._children = children;
            }
            this.getChildren = function() {
                return this._children;
            }
            
            this.id = viewModelObject.uid;
            this.icon = this.getOriginalObject().uid;
            this.name = viewModelObject.props.bl_rev_object_name.dbValues[0];
            this.revisionId = viewModelObject.props.item_revision_id ? viewModelObject.props.item_revision_id.dbValues[0] : "";
            this.type = viewModelObject.props.fnd0bl_line_object_type.dbValues[0];
            this.iconUrl = this.getOriginalObject().typeIconURL;
            this.parent = parent;
            
            if(this.type == "L2_StructureRevision") {
                if(this.getParent()) {
                    this.upperAssy = this.getParent().getObject().props.bl_rev_object_name.dbValues[0];
                    this.lowerAssy = viewModelObject.props.bl_rev_object_name.dbValues[0];
                } else {
                    this.upperAssy = this.name;
                    this.lowerAssy = "";
                }
            } else if (this.type == "L2_FunctionRevision") {
                this.upperAssy = this.getParent().getParent().getObject().props.bl_rev_object_name.dbValues[0];
                this.lowerAssy = this.getParent().getObject().props.bl_rev_object_name.dbValues[0];
                this.function = viewModelObject.props.l2_function.dbValues[0];
                this.requirement = viewModelObject.props.l2_requirements.dbValues[0];
            } else if (this.type == "L2_FailureRevision") {
                this.upperAssy = this.getParent().getParent().getParent().getObject().props.bl_rev_object_name.dbValues[0];
                this.lowerAssy = this.getParent().getParent().getObject().props.bl_rev_object_name.dbValues[0];
                this.function = this.getParent().getObject().props.l2_function.dbValues[0];
                this.requirement = this.getParent().getObject().props.l2_requirements.dbValues[0];
            }
    
            this.failureMode = viewModelObject.props.l2_failure_mode.dbValues[0];
            this.refSeverity = viewModelObject.props.L2_Ref_Severity.dbValues[0];
            this.refOccurence = viewModelObject.props.L2_Ref_Occurence.dbValues[0];
            this.refDetection = viewModelObject.props.L2_Ref_Detection.dbValues[0];
            this.AP = viewModelObject.props.L2_Ref_AP.dbValues[0];
            this.newSeverity = viewModelObject.props.L2_Result_Severity.dbValues[0];
            this.newOccurence = viewModelObject.props.L2_Result_Occurence.dbValues[0];
            this.newDetection = viewModelObject.props.L2_Result_Detection.dbValues[0]
            this.newAP = viewModelObject.props.L2_Result_AP.dbValues[0];
            this._attributes = { expanded: true };

            if(viewModelObject.props.L2_IsSelected)
                this.isSelected = viewModelObject.props.L2_IsSelected.dbValues[0];
            if(viewModelObject.props.L2_ReferenceDataset)
                this.refDatasetUid = viewModelObject.props.L2_ReferenceDataset.dbValues[0];

        } catch(error) {
            show(ERROR, error.message);
        }
    }
}

export function initialize(data, ctx) {
    if(!ctx.checklist) {
        ctx.checklist = {};
    }
    ctx.checklist.tableMode = "1";
    setSublocationTitle().then( (targetObject) => {
        ctx.checklist.target = targetObject;
        recursiveTreeExpand(targetObject);

        _openChecklistGrid().then( async (grid) => {
            ctx.checklist.grid = grid;
            while(!ctx.checklist.target) {
                await lgepCommonUtils.delay(100);
            }
            return createImageGridRows(ctx.checklist.target, grid);
        }).then( () => {
            ctx.checklist.grid.refreshLayout();
        }).catch( (error) => {
            show(ERROR, "체크리스트 내용을 불러오는데 실패했습니다." + "\n" + error.message);
        })
    })
}

export function unMount(data, ctx) {
    delete ctx.checklist.tableMode;
    delete ctx.checklist.target;
    delete ctx.checklist.grid;
    delete ctx.checklist.structure;
    delete ctx.checklist.function;
    delete ctx.checklist.failure;
    delete ctx._editing;
}


async function _openChecklistGrid() {
    // DOM이 fullyLoad 되지 않을 경우 대비하여 hang 추가
    let times = 0;
    while(!document.getElementById("openGrid") || times > 30) {
        await lgepCommonUtils.delay(100);
        times++;
    }

    const grid = new Grid({
        el: document.getElementById("openGrid"),
        data: blankTreeRow,
        bodyHeight: document.getElementsByName("L2_ChecklistMain")[0].offsetHeight - 150,
        width: document.getElementsByName("L2_ChecklistMain")[0].offsetWidth - 30,
        treeColumnOptions: {
            name: 'icon',
            useCascadingCheckbox: true
        },
        rowHeight: 'auto',
        columns: checklistRowColumns,
        columnOptions: {
            frozenCount: 3,
            frozenBorderWidth: 2,
            resizable: true
        }
    });
    Grid.applyTheme('custom', { 
        row: { 
            hover: { 
                background: '#e5f6ff' 
            }
        }
    });

    grid.on('click', _gridSelectionChangedEvent);
    $(window).on("resize", function() { 
        grid.setBodyHeight(document.getElementsByName("L2_ChecklistMain")[0].offsetHeight - 150);
        grid.setWidth(document.getElementsByName("L2_ChecklistMain")[0].offsetWidth - 30);
        grid.refreshLayout();
    });

    return grid;
}

function _expandAllLevels(checklistRow, grid) {
    _expandStacks.push(true);
    if(checklistRow.type == "L2_StructureRevision") {
        if( !appCtxService.ctx.checklist.structure ) {
            appCtxService.ctx.checklist.structure = [];
        }
        appCtxService.ctx.checklist.structure.push(checklistRow);
    }
    if(checklistRow.type == "L2_FunctionRevision") {
        if( !appCtxService.ctx.checklist.function ) {
            appCtxService.ctx.checklist.function = [];
        }
        appCtxService.ctx.checklist.function.push(checklistRow);
    }
    if(checklistRow.type == "L2_FailureRevision") {
        if( !appCtxService.ctx.checklist.failure ) {
            appCtxService.ctx.checklist.failure = [];
        }
        appCtxService.ctx.checklist.failure.push(checklistRow);
    }
        
    return lgepBomUtils.expandPSOneLevel([checklistRow.getObject()], null,
        lgepObjectUtils.createPolicies(checklistRowProperties, ["BOMLine", "L2_AbsStructureRevision"])
    ).then( async (response) => {
        for (const output of response.output) {
            for (const child of output.children) {
                let childMo = lgepObjectUtils.getObject(child.bomLine.uid);
                let childRow = new ChecklistRow(childMo, checklistRow);
                new Promise( (resolve) => {
                    if(childRow.refDatasetUid && childRow.refDatasetUid.length > 0) {
                        readPropertiesFromTextFile(childRow.refDatasetUid).then( (properties) => {
                            childRow.failureEffect = properties.failureEffect;
                            childRow.failureDetail = properties.failureDetail;
                            childRow.prevention = properties.prevention;
                            childRow.referenceData = properties.referenceData;
                            childRow.detectivity = properties.detectivity;
                            childRow.classification = properties.classification;
                            childRow.refResult = properties.refRecommend;
                            childRow.refRecommend = properties.refRecommend;
                            childRow.refRecommendResult = properties.refRecommendResult;
                            return;
                        }).then( () => {
                            resolve(true);
                        })
                    } else if (childRow.type == "L2_FailureRevision" && (!childRow.refDatasetUid || childRow.refDatasetUid.length == 0)) {
                        let properties = {
                            functionDetail: "",
                            requirementDetail: "",
                            failureModeDetail: "",
                            failureEffect: "",
                            failureDetail: "",
                            prevention: "",
                            referenceData: "",
                            detectivity: "",
                            classification: "",
                            refResult: "",
                            refRecommend: "",
                            refRecommendResult: ""
                        }
                        lgepSummerNoteUtils.stringToDataset("detail", JSON.stringify(properties)).then( (dataset) => {
                            dataset = dataset[0];
                            lgepObjectUtils.setProperties([{uid: childRow.id, type:"BOMLine"}], ["L2_ReferenceDataset"], [dataset.uid]).then( () => {
                                resolve(true);
                            })
                        })
                    } else {
                        resolve(true);
                    }
                }).then( () => {
                    for (const dataRow of grid.getData()) {
                        if(dataRow.id == checklistRow.id) {
                            grid.appendRow( childRow, {parentRowKey: dataRow.rowKey});
                            break;
                        }
                    }
                    _expandAllLevels(childRow, grid);
                })
            }
        }
        grid.refreshLayout();
        _expandStacks.pop();
    })
}

export function createImageGridRows(targetRevision, grid, hookFunction) {
    let gridData = null;
    let topChecklistRow = null;
    lgepBomUtils.createBOMWindow(null, targetRevision, null, null, 
        lgepObjectUtils.createPolicies(checklistRowProperties, ["BOMLine", "L2_AbsStructureRevision"])
    ).then( (response) => {
        appCtxService.ctx.checklist.bomWindow = lgepObjectUtils.getObject(response.bomWindow.uid);
        appCtxService.ctx.checklist.topLine = lgepObjectUtils.getObject(response.bomLine.uid);
    }).then( (response) => {
        return lgepObjectUtils.getProperties(appCtxService.ctx.checklist.bomWindow, ["absocc_specific_edit_mode", "absocc_ctxtline"]).then( () => {
            return lgepObjectUtils.setProperties([appCtxService.ctx.checklist.bomWindow], ["absocc_specific_edit_mode"], ["1"]).then( () => {
                return lgepObjectUtils.setProperties([appCtxService.ctx.checklist.bomWindow], ["absocc_ctxtline"], [appCtxService.ctx.checklist.topLine.uid])
            })
        })
    }).then( async () => {
        if(hookFunction) {
            await hookFunction();
            return;
        }
        
        topChecklistRow = new ChecklistRow(appCtxService.ctx.checklist.topLine);
        grid.resetData([topChecklistRow]);
        grid.refreshLayout();

        return _expandAllLevels(topChecklistRow, grid).then( async () => {
            while(_expandStacks.length != 0) {
                await lgepCommonUtils.delay(100);
            }
            _GridLoadedCompleteEvent(grid);
            return;
        })
    }).finally( (response) => {
        if(appCtxService.ctx.checklist.bomWindow)
            return lgepBomUtils.saveBOMWindow(appCtxService.ctx.checklist.bomWindow).then( () => {
                return lgepBomUtils.closeBOMWindow(appCtxService.ctx.checklist.bomWindow).then( () => {
                    delete appCtxService.ctx.checklist.topLine;
                    delete appCtxService.ctx.checklist.bomWindow;
                    // if(hookFunction) {
                    //     document.location.reload();
                    // }
                })
            })
    })
}

/**
 * 테이블 CELL 이 선택되었을 때, 테이블 ROW가 선택되도록 한다.
 * 또한 URL을 변경하거나 페이지 이동, 트리 펼침 등을 동작시킨다.
 * @param {*} ev 
 * @returns 
 */
 function _gridSelectionChangedEvent(ev) {
    try {
        let grid = ev.instance;
        let rowKey = grid.getIndexOfRow(ev.rowKey);
        if(grid.getSelectionRange()) {
            rowKey = grid.getSelectionRange().end[0];
        }
        if (rowKey == -1) return;
        let selectionRow = grid.getRowAt(rowKey);
        appCtxService.ctx.checklist.selectedRow = selectionRow;
    
        // 테이블 ROW 가 선택되었을 때 펼침/접힘을 동작시킨다.
        // if (selectionRow._children && selectionRow._children.length > 0  && !selectionRow._attributes.expanded) {
        //     grid.expand(selectionRow.rowKey);
        // } else if (selectionRow._children && selectionRow._children.length > 0  && selectionRow._attributes.expanded) {
        //     grid.collapse(selectionRow.rowKey);
        // }
    
        // 셀이 선택되었을 때, 해당 ROW가 선택되도록 한다.
        // grid.setSelectionRange({
        //     start: [rowKey, 0],
        //     end: [rowKey, grid.getColumns().length]
        // });
        // grid.focusAt(rowKey, 0, false);
    }catch(error) {
        show(ERROR, "GRID CELL 선택 시의 이벤트에 문제가 있습니다." + "\n" + error.message);
    }
}

function _GridLoadedCompleteEvent(grid) {
    appCtxService.ctx.checklist.grid.resetData(appCtxService.ctx.checklist.failure);
    appCtxService.ctx.checklist.grid.hideColumn("icon");
    appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    grid.refreshLayout();
    getInteractionStructureInfo(); // Interaction 기능 위함
}

export function openInteractionMatrix() {
    alert("openInteractionMatrix")
}

export function openChecklistSod() {
    alert("openChecklistSod")
}

export function openChecklistBomClone(data, ctx) {
    alert("openChecklistBomClone")
}

export function openChecklistFreeze(data, ctx) {
    ctx.checklist.freezed = true;
    alert("openChecklistFreeze")
}

export function openChecklistBomRevise(data, ctx) {
    delete ctx.checklist.freezed;
    alert("openChecklistBomRevise")
}

export default exports = {
    initialize,
    unMount,
    openChecklistBomClone,
    openChecklistFreeze,
    openChecklistBomRevise,
    ChecklistRow,
    createImageGridRows
}

app.factory('lgepChecklistOpenService', () => exports);