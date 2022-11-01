import app from 'app';

import browserUtils from 'js/browserUtils';
import vmoService from 'js/viewModelObjectService';
import appCtxService from 'js/appCtxService';

import { executeSavedQuery } from 'js/utils/lgepQueryUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import { ERROR, show } from 'js/utils/lgepMessagingUtils';
import { resetSublocationTitle, checklistProperties, blankTreeRow, checklistColumns } from 'js/utils/checklistUtils';

import $ from 'jquery';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

let exports;

/**
 *  체크리스트 클래스
 */
 export class Checklist {
    /**
     * 
     * @param {viewModelObject} viewModelObject 
     */
    constructor(viewModelObject) {
        try {
            this.id = viewModelObject.uid;
            this.name = viewModelObject.uid;
            this.revisionId = viewModelObject.props.item_revision_id ? viewModelObject.props.item_revision_id.dbValues[0] : "";
            this.creator = viewModelObject.props.last_mod_user.uiValues[0] ?? "";
            this.createDate = viewModelObject.props.last_mod_date.uiValues[0] ?? "";
            this.type = viewModelObject.type;
            this.iconUrl = viewModelObject.typeIconURL;
            this.revisions = viewModelObject.type.includes("Revision") ? [] : viewModelObject.props.revision_list.dbValues;
            this._children = viewModelObject.type.includes("Revision") ? undefined : [];
            this._attributes = { expanded: true };
            if(!this.type.includes("Revision") && viewModelObject.props.revision_list.dbValues && viewModelObject.props.revision_list.dbValues.length > 0) {
                this._children = [];
                for (const dbValue of viewModelObject.props.revision_list.dbValues) {
                    let child = lgepObjectUtils.getObject(dbValue);
                    this._children.push(new Checklist(child))
                }
            }
        }catch(error) {
            show(ERROR, "체크리스트 ROW를 만드는 데 실패했습니다." + "\n" + error.message);
        }
    }
}


/**
 * 페이지 로드 시 발생시키는 스크립트
 * browseMode 를 0 으로 설정한 후, TOAST-GRID 를 로드한다.
 * 
 * browseMode는 CTX에 설정하여 0~1 으로 입력되며
 * 0일 경우에는 Checklist 선택 모드
 * 1일 경우에는 Checklist 조회 및 편집 모드로 전환된다.
 * 
 * 해당 CONTEXT 값을 통해, HTML의 VISIBLE-WHEN 조건에 따라 화면이 전환됨.
 * 
 * @param {*} data 
 * @param {*} ctx 
 */
export function initialize(data, ctx) {
    if(!ctx.checklist) {
        ctx.checklist = {};
    }
    ctx.checklist.browseMode = "0";
    _initializeGrid();
    let urls = new URL(document.URL).hash;
    if(urls.includes("uid")) {
        ctx.checklist.browseMode = "1";
    }
}

var _treeInitialized = false;

/**
 * TOAST GRID 를 로드한다.
 */
async function _initializeGrid() {
    try {
        // DOM이 여러차례 Load 되는 경우 대비하여 FLAG 추가
        if(_treeInitialized) {
            return
        }
        _treeInitialized = true;

        // DOM이 fullyLoad 되지 않을 경우 대비하여 hang 추가
        let times = 0;
        while(!document.getElementById("grid") || times > 10) {
            await lgepCommonUtils.delay(1000);
            times++;
        }

        //0. GRID 초기 초기 설정 값 할당
        const grid = new Grid({
            el: document.getElementById('grid'),
            data: blankTreeRow,
            bodyHeight: document.getElementsByName("L2_ChecklistMain")[0].offsetHeight - 120,
            width: document.getElementsByName("L2_ChecklistMain")[0].offsetWidth - 30,
            treeColumnOptions: {
                name: 'name',
                useCascadingCheckbox: true
            },
            columns: checklistColumns,
            columnOptions: {
                frozenCount: 1,
                frozenBorderWidth: 2,
                resizable: true
            }
        });

        appCtxService.ctx.checklist.list = grid;

        //1. Mouse Hover 이벤트 할당
        Grid.applyTheme('custom', { 
            row: { 
                hover: { 
                    background: '#e5f6ff' 
                }
            }
        });
        grid.tree
        //2. TREE 클릭 시 이벤트 할당
        grid.on('click', _gridSelectionChangedEvent);
        
        // 창 크기 변경 자동 감지

        $(window).on("resize", function() { 
            grid.setBodyHeight(document.getElementsByName("L2_ChecklistMain")[0].offsetHeight - 120);
            grid.setWidth(document.getElementsByName("L2_ChecklistMain")[0].offsetWidth - 30);
            grid.refreshLayout();
        });

        //5. 초기 데이터 로드
        _loadDatas(grid);
    } catch(error) {
        show(ERROR, "체크리스트를 불러오는데 실패했습니다." + "\n" + error.message);
    }
}

/**
 *  뒤로 가기 함수
 *  browseMode 를 0으로 할당함으로써 이전 페이지로 돌아간다.
 */
export async function backToSelectionPage() {
    resetSublocationTitle();
    appCtxService.ctx.checklist.browseMode = "0";
    while(!document.getElementById("gridFlag")) {
        await lgepCommonUtils.delay(100);
    }
    window.location.href = browserUtils.getBaseURL() + "#/checklistMain";
    appCtxService.ctx.checklist.list.refreshLayout();
}

export function tableModeChanges(currentValue) {
    appCtxService.ctx.checklist.tableMode = currentValue;
    delete appCtxService.ctx.checklist.selectedRow;
    if(appCtxService.ctx.checklist.grid && currentValue == "1") {
        appCtxService.ctx.checklist.grid.resetData(appCtxService.ctx.checklist.failure);
        appCtxService.ctx.checklist.grid.hideColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    } else if(currentValue == "2") {
        appCtxService.ctx.checklist.grid.resetData(appCtxService.ctx.checklist.failure);
        appCtxService.ctx.checklist.grid.hideColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(2);
    } else {
        appCtxService.ctx.checklist.grid.resetData([appCtxService.ctx.checklist.structure[0]]);
        appCtxService.ctx.checklist.grid.showColumn("icon");
        appCtxService.ctx.checklist.grid.setFrozenColumnCount(3);
    }
}


/**
 *  체크리스트 이름 편집 UI 를 호출한다.
 */
export function modifyChecklist() {
    alert("modify")
}
/**
 * 페이지를 벗어났을 때 전역 변수를 초기화시켜준다.
 * @param {*} data 
 * @param {*} ctx 
 */
export function unMount(data, ctx) {
    _treeInitialized = false;
    delete ctx.checklist;
}

/**
 * 페이지가 로드되었을 때 체크리스트를 조회한다.
 * 필요한 객체들을 찾아와 테이블 ROW로 만들어준다
 * 
 * @param {*} grid 
 * @returns 
 */
function _loadDatas(grid) {
    return executeSavedQuery("StructureSearch", ["L2_is_checklist"], ["*"], 
        lgepObjectUtils.createPolicies(checklistProperties, ["L2_Structure", "L2_StructureRevision"])
    ).then((res) => {
        let treeDatas = [];
        let objectUids = [];
        let uids = res.map( (mo) => mo.uid );
        return lgepObjectUtils.loadObjects(uids).then( () => {
            let vmo = null;
            for (const sheet of res) {
                vmo = vmoService.constructViewModelObjectFromModelObject(sheet);
                for (const dbValue of vmo.props.revision_list.dbValues) {
                    objectUids.push({uid:dbValue, type:"L2_StructureRevision"});
                }
            }
            return lgepObjectUtils.getProperties(objectUids, checklistProperties).then( (loaded) => {
                console.log({loaded});
                treeDatas.push(new Checklist(vmo));
                grid.resetData(treeDatas);
                grid.refreshLayout();
            });
        })
    }).catch((error)=> {
        show(ERROR, "체크리스트 ROW를 불러오는데 실패했습니다." + "\n" + error.message);
    });
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
        let selectionUid = selectionRow.id;
        let selectionType = selectionRow.type;
    
        // 리비전인 경우에는 URL에 UID를 매핑하고, 이외에는 UID를 제거한다.
        if (selectionType.includes("Revision")) {
            window.location.href = browserUtils.getBaseURL() + "#/checklistMain?uid=" + selectionUid;
            appCtxService.ctx.checklist.browseMode = "1";
            return;
        } else {
            window.location.href = browserUtils.getBaseURL() + "#/checklistMain";
        }
    
        // 테이블 ROW 가 선택되었을 때 펼침/접힘을 동작시킨다.
        if (selectionRow._children && selectionRow._children.length > 0  && !selectionRow._attributes.expanded) {
            grid.expand(selectionRow.rowKey);
        } else if (selectionRow._children && selectionRow._children.length > 0  && selectionRow._attributes.expanded) {
            grid.collapse(selectionRow.rowKey);
        }
        
        // 셀이 선택되었을 때, 해당 ROW가 선택되도록 한다.
        grid.setSelectionRange({
            start: [rowKey, 0],
            end: [rowKey, grid.getColumns().length]
        });
        // grid.focusAt(rowKey, grid.getColumns().length-1, false);
    }catch (error) {
        show(ERROR, "GRID CELL 선택 시의 이벤트에 문제가 있습니다." + "\n" + error.message);
    }
}

export default exports = {
    initialize,
    unMount,
    modifyChecklist,
    backToSelectionPage,
    tableModeChanges
}

app.factory('lgepChecklistMainService', () => exports);