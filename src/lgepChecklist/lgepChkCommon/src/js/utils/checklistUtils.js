
import app from 'app';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import vmoService from 'js/viewModelObjectService';
import { ERROR, INFORMATION, show, WARNING, closeMessages } from 'js/utils/lgepMessagingUtils';
import soaService from 'soa/kernel/soaService';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import appCtxService from 'js/appCtxService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
var $ = require('jQuery');


let exports = {};

const _checklistTitle = lgepLocalizationUtils.getLocalizedText("L2_ChkMainMessages", "openChecklistTitle");
const _revisionIdTitle = lgepLocalizationUtils.getLocalizedText("L2_ChkMainMessages", "openChecklistRevId");
const _lastModUserTitle = lgepLocalizationUtils.getLocalizedText("L2_ChkMainMessages", "openChecklistLastModUser");


/**
 *  아이콘 클래스
 */
 export class IconRenderer {
    /**
     * 아이콘 클래스를 생성한다.
     * @param {*} props 
     */
    constructor(props) {
        const el = document.createElement('div');
        el.type = 'icon';
        this.el = el;
        this.el.style.display = "flex";
        this.render(props);
    }
    /**
     * HTMLElement 를 반환한다.
     * @returns 
     */
    getElement() {
        return this.el;
    }
    /**
     * 테이블이 렌더링 될 때 호출되는 함수
     * @param {*} props 
     */
    render(props) {
        if (!this.el.hasChildNodes() && props.value && props.value != "") {
            // 객체를 불러와 필요한 속성을 할당
            let item = lgepObjectUtils.getObject(props.value);
            item = vmoService.constructViewModelObjectFromModelObject(item);
            let name = item.props.object_string.dbValues[0];
            let path = null;
            if(item.type == "BOMLine") {
                let originalObject = lgepObjectUtils.getObject(item.props.bl_line_object.dbValues[0]);
                item = vmoService.constructViewModelObjectFromModelObject(originalObject);
            }
            path = item.typeIconURL;
            // 테이블 ROW 에 아이콘 생성
            let icon = document.createElement("img");
            icon.width = "14px";
            icon.height = "14px";
            icon.setAttribute("class", "aw-base-icon aw-type-icon aw-splm-tableIcon");
            icon.setAttribute("src", path);
            this.el.appendChild(icon);
            // 테이블 ROW 에 이름 생성
            let div = document.createElement("div");
            div.innerHTML = String(name);
            this.el.appendChild(div);
        }
    }
}

/**
 *  아이콘 클래스
 */
export class IconOnlyRenderer {
    /**
     * 아이콘 클래스를 생성한다.
     * @param {*} props 
     */
    constructor(props) {
        const el = document.createElement('div');
        el.type = 'icon';
        this.el = el;
        this.el.style.display = "flex";
        this.render(props);
    }
    /**
     * HTMLElement 를 반환한다.
     * @returns 
     */
    getElement() {
        return this.el;
    }
    /**
     * 테이블이 렌더링 될 때 호출되는 함수
     * @param {*} props 
     */
    render(props) {
        if (!this.el.hasChildNodes() && props.value && props.value != "") {
            // 객체를 불러와 필요한 속성을 할당
            let item = lgepObjectUtils.getObject(props.value);
            item = vmoService.constructViewModelObjectFromModelObject(item);
            let path = null;
            if(item.type == "BOMLine") {
                let originalObject = lgepObjectUtils.getObject(item.props.bl_line_object.dbValues[0]);
                item = vmoService.constructViewModelObjectFromModelObject(originalObject);
            }
            path = item.typeIconURL;
            // 테이블 ROW 에 아이콘 생성
            let icon = document.createElement("img");
            icon.width = "14px";
            icon.height = "14px";
            icon.setAttribute("class", "aw-base-icon aw-type-icon aw-splm-tableIcon");
            icon.setAttribute("src", path);
            this.el.appendChild(icon);
        }
    }
}

export class ImageCellRenderer {
    constructor(props) {
        const el = document.createElement('div');
        el.type = 'image';
        this.el = el;
        this.render(props);
    }
    getElement() {
        return this.el;
    }
    render(props) {
        if(props.value) {
            let string = props.value.replaceAll("\\\\\\", "");
            string = props.value.replaceAll("\\\"", "");
            this.el.innerHTML = String(string);
        }
    }
}
export class ImageCellEditor {
    constructor(props) {
        const el = document.createElement('div');
        const summernote = document.createElement('div');
        summernote.classList.add("summernote");
        el.appendChild(summernote);
        this.summernote = summernote;
        this.grid = props.grid;
        this.el = el;
        if(props.value) {
            this.string = props.value.replaceAll("\\\\\\", "");
            this.string = props.value.replaceAll("\\\"", "");
        } else {
            this.string = "";
        }
        this.rowKey = props.rowKey;
        this.columnName = props.columnInfo.name;
    }
    getElement() {
        return this.el;
    }

    getValue() {
        return this.string;
    }

    mounted() {
        let element = this.getElement();
        let width = element.parentElement.getBoundingClientRect().width > 400 ? element.parentElement.getBoundingClientRect().width : 400;
        let height = element.parentElement.getBoundingClientRect().height > 300 ? element.parentElement.getBoundingClientRect().height : 300;
        lgepPopupUtils.openPopup2("L2_ChecklistEditor", "", width, height, true, false, false, null, null, null, _editorCloseHook, false).then( async () => {
            await lgepCommonUtils.delay(100);
            document.getElementsByTagName("aw-popup-panel2")[document.getElementsByTagName("aw-popup-panel2").length-1].children[1].setAttribute("style", "top: " + element.getBoundingClientRect().top + "px; left: " + element.getBoundingClientRect().left + "px;");
            return;
        }).then( () => {
            if(!appCtxService.ctx.checklist.editingStacks) 
                appCtxService.ctx.checklist.editingStacks = [];
            appCtxService.ctx.checklist.editingStacks.push({
                type: "Edit",
                rowKey: this.rowKey,
                columnName: this.columnName,
                context: this.getValue()
            });
            document.getElementsByTagName("aw-popup-panel2")[document.getElementsByTagName("aw-popup-panel2").length-1].children[0].addEventListener("click", function() {
                try {
                    if(document.getElementById("noty_bottom_layout_container"))
                        document.getElementById("noty_bottom_layout_container").parentElement.removeChild(document.getElementById("noty_bottom_layout_container"));
                    if(document.getElementById("post-noty_bottom_layout_container"))
                        document.getElementById("post-noty_bottom_layout_container").parentElement.removeChild(document.getElementById("post-noty_bottom_layout_container"));
                    if(document.getElementById("pre-noty_bottom_layout_container"))
                        document.getElementById("pre-noty_bottom_layout_container").parentElement.removeChild(document.getElementById("pre-noty_bottom_layout_container"));
                    if( appCtxService.ctx.checklist.editingStacks[appCtxService.ctx.checklist.editingStacks.length - 1].context != $('.summernote').summernote('code') ) {
                        show(WARNING, "변경된 내용이 있습니다. 저장하지 않고 닫으시겠습니까?", ["YES", "NO"], [
                            function() {
                                lgepPopupUtils.closePopup();
                            },
                            function() {}
                        ])
                    } else {
                        lgepPopupUtils.closePopup();
                    }
                } catch(error) {
                    show(ERROR, error.message);
                } finally {
                    for(let dom of document.getElementsByClassName("noty_modal")) {
                        dom.parentElement.removeChild(dom);
                    }
                }
            })

            document.getElementById("editorPopup").appendChild(this.summernote);
            $(this.summernote).summernote({
                lang: 'ko-KR',
                tabsize: 3,
                height: height>99? height-99 : height,
                toolbar: [
                        ['fontsize', ['fontsize']],
                        ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
                        ['color', ['forecolor', 'color']],
                        ['table', ['table']],
                        ['para', ['ul', 'ol', 'paragraph']],
                        ['insert', ['picture', 'link']],
                        ['codeview', ['fullscreen']],
                        ["CustomButton", ["saveButton", "cancelButton"]]
                    ],
                    buttons: {
                        saveButton: _saveEditorCell(appCtxService.ctx.checklist.editingStacks.length - 1)
                    },
                fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
            });
            $(this.summernote).summernote('code', this.getValue());
            //TODO: 실행취소 기능 개발 시 추가할 것
            appCtxService.ctx.checklist.currentCell = {rowKey: this.rowKey, columnName: this.columnName};
            // for (const stacks of appCtxService.ctx.checklist.editingStacks) {
                
            // }
            
        })
    }
}

function _saveEditorCell(index) {
    return function(context) {
        console.log({context});
        var ui = $.summernote.ui;
        var button = ui.button({
            contents: '<div class="fa fa-pencil"/>SAVE</div>',
            click: function (event) {
                let contents = $('.summernote').summernote('code');
                // let contentsString = lgepSummerNoteUtils.stripTags(contents);
                if(appCtxService.ctx.checklist.editingStacks[index].context == contents) {
                    closeMessages();
                    show(INFORMATION, "변경된 내용이 없습니다.");
                    return;
                }
                appCtxService.ctx.checklist.editingStacks[index].context = contents;
                // let row = appCtxService.ctx.checklist.grid.getRowAt(appCtxService.ctx.checklist.grid.getIndexOfRow(appCtxService.ctx.checklist.editingStacks[index].rowKey));
                // row[appCtxService.ctx.checklist.editingStacks[index].columnName] = contents;
                appCtxService.ctx.checklist.grid.finishEditing(appCtxService.ctx.checklist.editingStacks[index].rowKey, appCtxService.ctx.checklist.editingStacks[index].columnName, contents);
                closeMessages();
                show(INFORMATION, "저장되었습니다.");
                return;
            },
        });
        return button.render();
    }
}

function _editorCloseHook() {
    let focusCell = appCtxService.ctx.checklist.grid.getFocusedCell();
    appCtxService.ctx.checklist.grid.focusAt(0, 0, false);
    let rowKey =  appCtxService.ctx.checklist.grid.getIndexOfRow(focusCell.rowKey);
    let columnName = focusCell.columnName;

    let columns = appCtxService.ctx.checklist.grid.getColumns();
    for(let i=0; i<columns.length; i++) {
        if(columns[i].name == columnName) {
            appCtxService.ctx.checklist.grid.focusAt(rowKey, i-1, false);
            if(appCtxService.ctx.checklist.tableMode == 3)
                appCtxService.ctx.checklist.grid.focusAt(rowKey, i, false);
            break;
        }
    }
}

export function getUrlParameter(target) {
    let params = new URL(document.URL).hash.split("?")[1].split("&");
    for (const param of params) {
        if(param.startsWith(target + "=")) {
            return param.replace(target + "=", "");
        }
    }
    return null;
}

export function setSublocationTitle() {
    let targetUid = getUrlParameter("uid");
    return lgepObjectUtils.loadObject(targetUid,
        lgepObjectUtils.createPolicies(checklistProperties, ["L2_StructureRevision"])
    ).then( () => {
        let targetObject = lgepObjectUtils.getObject(targetUid);
        const headerTitleEl = document.querySelector('aw-sublocation-title');
        headerTitleEl.innerHTML = "";
     
        const div = document.createElement('div');
        div.classList.add('product-title');
      
        const checklistName = targetObject.props.object_name.dbValues[0];
        const revisionId = targetObject.props.item_revision_id.uiValues[0];
        const lastModUser = targetObject.props.last_mod_user.uiValues[0];
      
        const text = `
        ${_checklistTitle} :  \u00a0\u00a0 ${checklistName} \u00a0\u00a0\u00a0\u00a0 / 
        \u00a0\u00a0\u00a0\u00a0 ${_revisionIdTitle} :  \u00a0\u00a0 ${revisionId} \u00a0\u00a0\u00a0\u00a0 / 
        \u00a0\u00a0\u00a0\u00a0 ${_lastModUserTitle}  :  \u00a0\u00a0 ${lastModUser}
        `;
      
        div.textContent = text;
        headerTitleEl.appendChild(div);
        return targetObject;
    }).catch( (error) => {
        show(ERROR, error.message);
        console.error(error)
    })
}

export function resetSublocationTitle() {
    const headerTitleEl = document.querySelector('aw-sublocation-title');
    headerTitleEl.innerHTML = "";
    return;
}

export function recursiveTreeExpand(targetObject) {
    // let childUids = targetObject.props.ps_children?.dbValues;
    // if(childUids) {
    //     return lgepObjectUtils.loadObjects(childUids, 
    //         lgepObjectUtils.createPolicies(checklistRowProperties, ["L2_AbsStructureRevision", "BOMLine"])
    //     ).then( () => {
    //         if( childUids.length > 0 ) {
    //             console.log(lgepObjectUtils.getObjects(childUids));
    //             for (const childUid of childUids) {
    //                 let child = lgepObjectUtils.getObject(childUid);
    //                 recursiveTreeExpand(child);
    //             }
    //         }
    //         return;
    //     }).catch( (error) => {
    //         show(ERROR, error.message);
    //     });
    // }

    return lgepBomUtils.createBOMWindow(null, targetObject, null, null, 
        lgepObjectUtils.createPolicies(checklistRowProperties, ["BOMLine", "L2_AbsStructureRevision"])
    ).then( (response) => {
        appCtxService.ctx.checklist.bomWindow = lgepObjectUtils.getObject(response.bomWindow.uid);
        appCtxService.ctx.checklist.topLine = lgepObjectUtils.getObject(response.bomLine.uid);
    }).then( () => {
        return lgepBomUtils.expandPSAllLevels([appCtxService.ctx.checklist.topLine], null,
            lgepObjectUtils.createPolicies(checklistRowProperties, ["BOMLine", "L2_AbsStructureRevision"])
        ).then( (response) => {
            let output = response.output;
            for (const relation of output) {
                let parentUid = relation.parent.bomLine.uid;
                response.modelObjects[parentUid]._children = [];
                for (const child of relation.children) {
                    response.modelObjects[parentUid]._children.push(response.modelObjects[child.bomLine.uid]);
                }
            }
        })
    }).finally( () => {
        if(appCtxService.ctx.checklist.bomWindow)
            return lgepBomUtils.saveBOMWindow(appCtxService.ctx.checklist.bomWindow).then( () => {
                return lgepBomUtils.closeBOMWindow(appCtxService.ctx.checklist.bomWindow).then( () => {
                    delete appCtxService.ctx.checklist.topLine;
                    delete appCtxService.ctx.checklist.bomWindow;
                })
            })
    })
}

export function readPropertiesFromTextFile(targetUid) {
    return lgepObjectUtils.loadObject(targetUid, 
        lgepObjectUtils.createPolicy(["ref_list"], "Dataset")
    ).then( () => {
        let dataset = lgepObjectUtils.getObject(targetUid);
        let imanFileUid = dataset.props.ref_list.dbValues[0];
        let imanFile = lgepObjectUtils.getObject(imanFileUid);
        let request = {
            files: [imanFile]
        };
        return soaService.post("Core-2006-03-FileManagement", "getFileReadTickets", request).then( (response) => {
            return fetch('fms/fmsdownload/?ticket=' + response.tickets[1][0]).then( (res) => {
                return res.arrayBuffer().then( (arrayBuffer) => {
                    const chars = new Uint8Array(arrayBuffer);
                    var string = new TextDecoder().decode(chars);
                    return string;
                });
            });
        });
    }).then( (string) => {
        let properties = JSON.parse(string);
        console.log({properties});
        return properties;
    }).catch((error) => {
        show(ERROR, "속성을 불러오는데 실패했습니다." + "\n" + error.message);
    });
}

/**
 *  테이블 ROW 속성명
 */
export const checklistProperties = [
    "object_string", "object_name", "last_mod_user", "last_mod_date", "item_revision_id", "revision_list", "ps_children",
    "l2_function", "l2_requirements", "l2_failure_mode", "L2_Ref_Severity", "L2_Ref_Occurence", "L2_Ref_Detection",
    "L2_Result_Severity", "L2_Result_Occurence", "L2_Result_Detection", "L2_Result_AP", "L2_ReferenceDataset", "L2_IsSelected",
    "fnd0bl_line_object_type", "L2_Ref_AP", "bl_line_object", "l2_is_template", "l2_is_checklist", "l2_interaction_table",
    "bl_rev_object_name"
];
/**
 *  테이블 ROW 속성명
 */
 export const checklistRowProperties = [
    "object_string", "object_name", "last_mod_user", "last_mod_date", "item_revision_id", "revision_list", "ps_children",
    "l2_function", "l2_requirements", "l2_failure_mode", "L2_Ref_Severity", "L2_Ref_Occurence", "L2_Ref_Detection",
    "L2_Result_Severity", "L2_Result_Occurence", "L2_Result_Detection", "L2_Result_AP", "L2_ReferenceDataset", "L2_IsSelected",
    "fnd0bl_line_object_type", "L2_Ref_AP", "bl_line_object", "l2_is_template", "l2_is_checklist", "l2_interaction_table",
    "bl_rev_object_name"
];
/**
 *  tree blank row data 
 */
export const blankTreeRow = [{
    id: "",
    name: "",
    revisionId: "",
    creator: "",
    createDate: "",
    _attributes: {
        expanded: false
    },
    _children: []
}]

/**
 *  tree column
 */
export const checklistColumns = [
    {
        header: 'Name',
        name: 'name',
        renderer: {
            type: IconRenderer,
        },
        width: 1000,
    },
    {
        header: 'Revision ID',
        name: 'revisionId',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'Creator',
        name: 'creator',
        width: 200,
        rowSpan: true,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'Create Date',
        name: 'createDate',
        width: 300,
        renderer: {
            classNames: ['checklist-center'],
        }
    }
]

/**
 *  tree column
 */
 export const checklistRowEditingColumns = [
    {
        header: ' ',
        name: 'icon',
        width: 150,
        renderer: {
            type: IconOnlyRenderer,
        },
        rowSpan: true
    },
    {
        header: '상위 Assembly',
        name: 'upperAssy',
        width: 300,
        rowSpan: true
    },
    {
        header: '하위 Assembly',
        name: 'lowerAssy',
        width: 300,
        rowSpan: true
    },
    {
        header: '기능',
        name: 'function',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '요구사항',
        name: 'requirement',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장 모드',
        name: 'failureMode',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장의 영향',
        name: 'failureEffect',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장 매커니즘',
        name: 'failureDetail',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '예방',
        name: 'prevention',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '관련 자료',
        name: 'referenceData',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '검출',
        name: 'detectivity',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '분류',
        name: 'classification',
        width: 150,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '심각도(Severity)',
        name: 'refSeverity',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '발생도(Occurence)',
        name: 'refOccurence',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '검출도(Detection)',
        name: 'refDetection',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '조치우선순위(AP)',
        name: 'AP',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '점검 결과',
        name: 'refResult',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        },
        editor: {
            type: ImageCellEditor,
        },
    },
    {
        header: '권고조치사항',
        name: 'refRecommend',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        },
        editor: {
            type: ImageCellEditor,
        },
    },
    {
        header: '권고조치결과',
        name: 'refRecommendResult',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        },
        editor: {
            type: ImageCellEditor,
        },
    },
    {
        header: 'NEW SEV',
        name: 'newSeverity',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW OCC',
        name: 'newOccurence',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW DET',
        name: 'newDetection',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW AP',
        name: 'newAP',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    }
]

/**
 *  tree column
 */
 export const checklistRowColumns = [
    {
        header: ' ',
        name: 'icon',
        width: 150,
        renderer: {
            type: IconOnlyRenderer,
        },
        rowSpan: true
    },
    {
        header: '상위 Assembly',
        name: 'upperAssy',
        width: 300,
        rowSpan: true
    },
    {
        header: '하위 Assembly',
        name: 'lowerAssy',
        width: 300,
        rowSpan: true
    },
    {
        header: '기능',
        name: 'function',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '요구사항',
        name: 'requirement',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장 모드',
        name: 'failureMode',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장의 영향',
        name: 'failureEffect',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '고장 매커니즘',
        name: 'failureDetail',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '예방',
        name: 'prevention',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '관련 자료',
        name: 'referenceData',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '검출',
        name: 'detectivity',
        width: 600,
        rowSpan: true,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '분류',
        name: 'classification',
        width: 150,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '심각도(Severity)',
        name: 'refSeverity',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '발생도(Occurence)',
        name: 'refOccurence',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '검출도(Detection)',
        name: 'refDetection',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '조치우선순위(AP)',
        name: 'AP',
        width: 150,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: '점검 결과',
        name: 'refResult',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '권고조치사항',
        name: 'refRecommend',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: '권고조치결과',
        name: 'refRecommendResult',
        width: 600,
        renderer: {
            type: ImageCellRenderer,
        }
    },
    {
        header: 'NEW SEV',
        name: 'newSeverity',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW OCC',
        name: 'newOccurence',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW DET',
        name: 'newDetection',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    },
    {
        header: 'NEW AP',
        name: 'newAP',
        width: 100,
        renderer: {
            classNames: ['checklist-center'],
        }
    }
]


export default exports = {
    getUrlParameter,
    setSublocationTitle,
    resetSublocationTitle,
    recursiveTreeExpand,
    readPropertiesFromTextFile,
    blankTreeRow,
    checklistColumns,
    checklistRowColumns,
    checklistRowEditingColumns,
    checklistProperties,
    checklistRowProperties,
}
app.factory('checklistUtils', () => exports);