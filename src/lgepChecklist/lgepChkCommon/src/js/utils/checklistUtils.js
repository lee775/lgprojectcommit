import app from 'app';
var $ = require('jQuery');
import browserUtils from 'js/browserUtils';
import appCtxService from 'js/appCtxService';
import soaService from 'soa/kernel/soaService';
import vmoService from 'js/viewModelObjectService';

import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import sodTableListService from 'js/sodTableListService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import L2_ChecklistOpenService from 'js/L2_ChecklistOpenService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import awPromiseService from 'js/awPromiseService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepTicketUtils from 'js/utils/lgepTicketUtils';
import { ERROR, INFORMATION, show, WARNING, closeMessages } from 'js/utils/lgepMessagingUtils';

let exports = {};

let MSG = 'L2_ChkMainMessages';
let i18n = {
  openChecklistTitle: lgepLocalizationUtils.getLocalizedText(MSG, 'openChecklistTitle'),
  openChecklistRevId: lgepLocalizationUtils.getLocalizedText(MSG, 'openChecklistRevId'),
  openChecklistLastModUser: lgepLocalizationUtils.getLocalizedText(MSG, 'openChecklistLastModUser'),
  chkRowOnlyFailureModifiable: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowOnlyFailureModifiable'),
  chkRowModifiedExist: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowModifiedExist'),
  chkRowNotModified: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowNotModified'),
  chkRowModifiedSaved: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowModifiedSaved'),
  chkRowLoadPropertiesFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowLoadPropertiesFailed'),
  chkColumnChecklistName: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnChecklistName'),
  chkColumnRevisionId: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnRevisionId'),
  chkColumnProjectName: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnProjectName'),
  chkColumnProductType: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnProductType'),
  chkColumnProductClass: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnProductClass'),
  chkColumnProductName: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnProductName'),
  chkColumnModuleName: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnModuleName'),
  chkColumnCreateUser: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnCreateUser'),
  chkColumnCreationDate: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnCreationDate'),
  chkColumnIsFreezed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkColumnIsFreezed'),
  chkRowColumnUpperAssy: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnUpperAssy'),
  chkRowColumnLowerAssy: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnLowerAssy'),
  chkRowColumnFunction: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnFunction'),
  chkRowColumnRequirement: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRequirement'),
  chkRowColumnFailureMode: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnFailureMode'),
  chkRowColumnFailureEffect: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnFailureEffect'),
  chkRowColumnFailureDetail: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnFailureDetail'),
  chkRowColumnPrevention: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnPrevention'),
  chkRowColumnReferenceData: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnReferenceData'),
  chkRowColumnDetectivity: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnDetectivity'),
  chkRowColumnClassification: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnClassification'),
  chkRowColumnRefSeverity: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRefSeverity'),
  chkRowColumnRefOccurence: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRefOccurence'),
  chkRowColumnRefDetection: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRefDetection'),
  chkRowColumnRefAP: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRefAP'),
  chkRowColumnInspectionResult: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnInspectionResult'),
  chkRowColumnRecommend: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRecommend'),
  chkRowColumnRecommendResult: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnRecommendResult'),
  chkRowColumnNewSeverity: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnNewSeverity'),
  chkRowColumnNewOccurence: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnNewOccurence'),
  chkRowColumnNewDetection: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnNewDetection'),
  chkRowColumnNewAP: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnNewAP'),
  chkRowColumnSingle: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowColumnSingle'),
};

/**
 *  ????????? ?????????
 */
export class IconRenderer {
  /**
   * ????????? ???????????? ????????????.
   * @param {*} props
   */
  constructor(props) {
    const el = document.createElement('div');
    el.type = 'icon';
    this.el = el;
    this.el.style.display = 'flex';
    this.render(props);
  }
  /**
   * HTMLElement ??? ????????????.
   * @returns
   */
  getElement() {
    return this.el;
  }
  /**
   * ???????????? ????????? ??? ??? ???????????? ??????
   * @param {*} props
   */
  render(props) {
    if (!this.el.hasChildNodes() && props.value && props.value != '') {
      // ????????? ????????? ????????? ????????? ??????
      let item = lgepObjectUtils.getObject(props.value);
      item = vmoService.constructViewModelObjectFromModelObject(item);
      let name = item.props.object_name.dbValues[0];
      let path = null;
      if (item.type == 'BOMLine') {
        let originalObject = lgepObjectUtils.getObject(item.props.bl_line_object.dbValues[0]);
        item = vmoService.constructViewModelObjectFromModelObject(originalObject);
      }
      path = item.typeIconURL;
      // ????????? ROW ??? ????????? ??????
      let icon = document.createElement('img');
      icon.width = '14px';
      icon.height = '14px';
      icon.setAttribute('class', 'aw-base-icon aw-type-icon aw-splm-tableIcon');
      icon.setAttribute('src', path);
      this.el.appendChild(icon);
      // ????????? ROW ??? ?????? ??????
      let div = document.createElement('div');
      div.innerHTML = String(name);
      this.el.appendChild(div);
    }
  }
}

/**
 *  ???????????? ?????? ?????????
 */
export class IconOnlyRenderer {
  /**
   * ????????? ???????????? ????????????.
   * @param {*} props
   */
  constructor(props) {
    const el = document.createElement('div');
    el.type = 'icon';
    this.el = el;
    this.el.style.display = 'flex';
    this.render(props);
  }
  /**
   * HTMLElement ??? ????????????.
   * @returns
   */
  getElement() {
    return this.el;
  }
  /**
   * ???????????? ????????? ??? ??? ???????????? ??????
   * @param {*} props
   */
  render(props) {
    if (!this.el.hasChildNodes() && props.value && props.value != '') {
      // ????????? ????????? ????????? ????????? ??????
      let item = lgepObjectUtils.getObject(props.value);
      item = vmoService.constructViewModelObjectFromModelObject(item);
      let path = null;
      if (item.type == 'BOMLine') {
        let originalObject = lgepObjectUtils.getObject(item.props.bl_line_object.dbValues[0]);
        item = vmoService.constructViewModelObjectFromModelObject(originalObject);
      }
      path = item.typeIconURL;
      // ????????? ROW ??? ????????? ??????
      let icon = document.createElement('img');
      icon.width = '14px';
      icon.height = '14px';
      icon.setAttribute('class', 'aw-base-icon aw-type-icon aw-splm-tableIcon');
      icon.setAttribute('src', path);
      this.el.appendChild(icon);
    }
  }
}

/**
 * ????????? ??? ????????? ?????????
 * ????????? ???????????? ???????????? ????????? ??????.
 * ?????? ???????????? ?????? ??????, ????????? ???????????? ?????????.
 */
export class ImageCellRenderer {
  constructor(props) {
    const el = document.createElement('div');
    el.type = 'image';
    el.classList.add('checklist-cell-padding');
    this.el = el;
    this.render(props);
  }
  getElement() {
    return this.el;
  }
  render(props) {
    let row = props.grid.getRowAt(props.grid.getIndexOfRow(props.rowKey));
    if (row.type != 'L2_FailureRevision') {
      return;
    }
    if (props.value) {
      let string = props.value.replaceAll('\\\\\\', '');
      string = props.value.replaceAll('\\"', '');
      this.el.innerHTML = String(string);
    }
  }
}

/**
 * ????????? ?????? ????????? ????????? ?????????
 * ?????? ?????? ??? Popup??? ?????? summernote ??????????????? ????????????.
 *
 */
export class ImageCellEditor {
  constructor(props) {
    const el = document.createElement('div');
    const summernote = document.createElement('div');
    summernote.classList.add('summernote');
    el.appendChild(summernote);
    this.summernote = summernote;
    this.grid = props.grid;
    this.el = el;
    if (props.value) {
      this.string = props.value.replaceAll('\\\\\\', '');
      this.string = props.value.replaceAll('\\"', '');
    } else {
      this.string = '';
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
    let row = this.grid.getRowAt(this.grid.getIndexOfRow(this.rowKey));
    if (row.type != 'L2_FailureRevision') {
      show(INFORMATION, i18n.chkRowOnlyFailureModifiable);
      return;
    }
    let element = this.getElement();
    appCtxService.ctx.checklist.currentColumn = getColumnBalloonData(this.columnName);
    let width = element.parentElement.getBoundingClientRect().width > 400 ? element.parentElement.getBoundingClientRect().width : 400;
    let height = element.parentElement.getBoundingClientRect().height > 300 ? element.parentElement.getBoundingClientRect().height : 300;
    lgepPopupUtils
      .openPopup2('L2_ChecklistEditor', '', width, height + 33, true, false, false, null, null, null, _editorCloseHook, false)
      .then(async () => {
        document.getElementsByClassName('aw-popup-screenMask')[0].style['background-color'] = 'transparent';
        await lgepCommonUtils.delay(100);
        let topPoint = element.getBoundingClientRect().top;
        let leftPoint = element.getBoundingClientRect().left;
        let openGridTop = document.getElementsByClassName('tui-grid-cell tui-grid-cell-header')[0].getBoundingClientRect().top;
        let openGridLeft = document.getElementsByName('L2_ChecklistMain')[0].getBoundingClientRect().left;
        let viewPortHeight = document.getElementsByName('L2_ChecklistMain')[0].offsetHeight;
        let viewPortWidth = document.getElementsByName('L2_ChecklistMain')[0].offsetWidth;

        // console.log(topPoint, leftPoint, viewPortHeight, viewPortWidth)
        if (viewPortHeight - topPoint < height) {
          topPoint = viewPortHeight - height;
        } else if (topPoint < openGridTop) {
          topPoint = openGridTop;
        }
        if (viewPortWidth - leftPoint < width) {
          leftPoint = leftPoint - (width - (viewPortWidth - leftPoint));
        } else if (leftPoint < openGridLeft) {
          leftPoint = openGridLeft;
        }

        document.getElementsByClassName('aw-layout-panelContent')[0].style.height = height;
        document.getElementsByClassName('aw-layout-panelContent')[0].style.width = width;
        document
          .getElementsByTagName('aw-popup-panel2')
          [document.getElementsByTagName('aw-popup-panel2').length - 1].children[1].setAttribute(
            'style',
            'top: ' + topPoint + 'px; left: ' + leftPoint + 'px;',
          );
        return;
      })
      .then(() => {
        if (!appCtxService.ctx.checklist.editingStacks) appCtxService.ctx.checklist.editingStacks = [];
        appCtxService.ctx.checklist.editingStacks.push({
          type: 'Edit',
          rowKey: this.rowKey,
          columnName: this.columnName,
          context: this.getValue(),
        });
        document
          .getElementsByTagName('aw-popup-panel2')
          [document.getElementsByTagName('aw-popup-panel2').length - 1].children[0].addEventListener('click', function () {
            try {
              if (document.getElementById('noty_bottom_layout_container'))
                document.getElementById('noty_bottom_layout_container').parentElement.removeChild(document.getElementById('noty_bottom_layout_container'));
              if (document.getElementById('post-noty_bottom_layout_container'))
                document
                  .getElementById('post-noty_bottom_layout_container')
                  .parentElement.removeChild(document.getElementById('post-noty_bottom_layout_container'));
              if (document.getElementById('pre-noty_bottom_layout_container'))
                document
                  .getElementById('pre-noty_bottom_layout_container')
                  .parentElement.removeChild(document.getElementById('pre-noty_bottom_layout_container'));

              if (
                appCtxService.ctx.checklist.editingStacks[appCtxService.ctx.checklist.editingStacks.length - 1].context != $('.summernote').summernote('code')
              ) {
                show(
                  WARNING,
                  i18n.chkRowModifiedExist,
                  ['YES', 'NO'],
                  [
                    function () {
                      lgepPopupUtils.closePopup();
                      for (let dom of document.getElementsByClassName('noty_modal')) {
                        dom.parentElement.removeChild(dom);
                      }
                    },
                    function () {},
                  ],
                );
              } else {
                lgepPopupUtils.closePopup();
              }
            } catch (error) {
              show(ERROR, error.message);
            }
          });

        document.getElementById('editorPopup').appendChild(this.summernote);
        $(this.summernote).summernote({
          lang: 'ko-KR',
          tabsize: 3,
          height: height > 99 ? height - 99 : height,
          toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link']],
            ['codeview', ['fullscreen']],
            ['CustomButton', ['saveButton', 'attachButton']],
          ],
          buttons: {
            saveButton: _saveEditorCell(appCtxService.ctx.checklist.editingStacks.length - 1),
            attachButton: attachButton,
          },
          fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
        });
        $(this.summernote).summernote('code', this.getValue());
        $(this.summernote).summernote('focus');
        appCtxService.ctx.checklist.currentCell = {
          rowKey: this.rowKey,
          columnName: this.columnName,
        };
      });
  }
}

/**
 *  SOD ??? ?????????
 *  ?????? ????????? ????????? ????????? SOD ???????????? ????????????,
 *  ?????? ???????????? ROW ?????? ??? SOD ?????? ?????? ????????????.
 */
export class SodCellEditor {
  constructor(props) {
    const el = document.createElement('div');
    this.grid = props.grid;
    this.el = el;
    this.rowKey = props.rowKey;
    this.columnName = props.columnInfo.name;
    this.string = props.value;
  }
  getElement() {
    return this.el;
  }

  getValue() {
    return this.string;
  }

  mounted() {
    let row = this.grid.getRowAt(this.grid.getIndexOfRow(this.rowKey));
    if (row.type != 'L2_FailureRevision') {
      show(INFORMATION, i18n.chkRowOnlyFailureModifiable);
      return;
    }
    let element = this.getElement();
    let width = element.parentElement.getBoundingClientRect().width > 1200 ? element.parentElement.getBoundingClientRect().width : 1200;
    let height = element.parentElement.getBoundingClientRect().height > 800 ? element.parentElement.getBoundingClientRect().height : 800;
    sodTableListService.setVmoXrt().then(() => {
      //console.log(appCtxService.ctx);
      let popupName = 'L2_Checklist';
      popupName += this.columnName.slice(3);
      appCtxService.ctx.checklist.currentCell = {
        rowKey: this.rowKey,
        columnName: this.columnName,
      };
      lgepPopupUtils.openPopup2(popupName, '', width, height, true, false, false, null, null, null, _editorCloseHook, true).then(async () => {
        await lgepCommonUtils.delay(100);
        let typeName = 'l2_' + this.columnName.slice(3).toLowerCase() + '_table';
        let tableRowUids = appCtxService.ctx.fmea_set_vmo[0].props[typeName].dbValues;
        let policy;
        let columns;
        if (typeName == 'l2_severity_table') {
          columns = ['l2_grade', 'l2_cause_effect', 'l2_effect', 'l2_evaluation_standard'];
          policy = lgepObjectUtils.createPolicy(columns);
        } else if (typeName == 'l2_occurence_table') {
          columns = ['l2_grade', 'l2_possibility_of_failure', 'l2_design_life_reliability'];
          policy = lgepObjectUtils.createPolicy(columns);
        } else {
          columns = ['l2_grade', 'l2_detection_opportunity', 'l2_detection_range', 'l2_detectability'];
          policy = lgepObjectUtils.createPolicy(columns);
        }
        await lgepObjectUtils.loadObjects(tableRowUids, policy);
        let tableRows = lgepObjectUtils.getObjects(tableRowUids);
        //console.log({tableRows});
        let tableColumns = [];
        for (const column of columns) {
          let width;
          if (column == 'l2_grade') width = 50;
          if (column == 'l2_detection_opportunity') width = 255;
          if (column == 'l2_detection_range') width = 610;
          if (column == 'l2_detectability') width = 200;
          if (column == 'l2_cause_effect') width = 175;
          if (column == 'l2_effect') width = 100;
          if (column == 'l2_evaluation_standard') width = 780;
          if (column == 'l2_detection_opportunity') width = 265;
          if (column == 'l2_detection_range') width = 590;
          if (column == 'l2_detectability') width = 195;
          tableColumns.push({
            header: tableRows[0].modelType.propertyDescriptorsMap[column].displayName,
            name: column,
            width: width,
          });
        }
        let datas = [];
        for (const tableRow of tableRows) {
          let data = {};
          for (const column of columns) {
            data[column] = tableRow.props[column].dbValues[0];
          }
          datas.push(data);
        }
        let grid = new Grid({
          el: document.getElementById('sod_' + this.columnName.slice(3).toLowerCase() + '_select'),
          columns: tableColumns,
          rowHeight: 'auto',
          data: datas,
          columnOptions: {
            resizable: true,
          },
        });
        grid.on('click', _gridSelectionChangedEvent);
        document
          .getElementsByTagName('aw-popup-panel2')
          [document.getElementsByTagName('aw-popup-panel2').length - 1].children[0].addEventListener('click', function () {
            try {
              lgepPopupUtils.closePopup();
            } catch (error) {
              show(ERROR, error.message);
            }
          });
        return;
      });
    });
  }
}

/**
 * ????????? CELL ??? ??????????????? ???, ????????? ROW??? ??????????????? ??????.
 * ?????? URL??? ??????????????? ????????? ??????, ?????? ?????? ?????? ???????????????.
 * @param {*} ev
 * @returns
 */
function _gridSelectionChangedEvent(ev) {
  try {
    let grid = ev.instance;
    let rowKey = grid.getIndexOfRow(ev.rowKey);
    if (grid.getSelectionRange()) {
      rowKey = grid.getSelectionRange().end[0];
    }
    if (rowKey == -1) return;
    let selectionRow = grid.getRowAt(rowKey);

    appCtxService.ctx.checklist.grid.finishEditing(
      appCtxService.ctx.checklist.currentCell.rowKey,
      appCtxService.ctx.checklist.currentCell.columnName,
      selectionRow.l2_grade,
    );
    delete appCtxService.ctx.checklist.currentCell;
    L2_ChecklistOpenService.sodApMappingProcess();
    L2_ChecklistOpenService.sodApMappingProcess('new');
    lgepPopupUtils.closePopup();
  } catch (error) {
    // show(ERROR, "GRID CELL ?????? ?????? ???????????? ????????? ????????????." + "\n" + error.message);
  }
}

/**
 * ????????? ?????? ????????? ??????, ????????? ???????????? ????????? ????????? ??????
 * summernote??? ????????? ??????????????? ??? ????????? ????????????.
 * @param {*} index
 * @returns
 */
function _saveEditorCell(index) {
  return function (context) {
    var ui = $.summernote.ui;
    var button = ui.button({
      contents: '<div class="fa fa-pencil"/>SAVE</div>',
      click: function (event) {
        let contents = $('.summernote').summernote('code');

        if (document.getElementById('noty_bottom_layout_container'))
          document.getElementById('noty_bottom_layout_container').parentElement.removeChild(document.getElementById('noty_bottom_layout_container'));
        if (document.getElementById('post-noty_bottom_layout_container'))
          document.getElementById('post-noty_bottom_layout_container').parentElement.removeChild(document.getElementById('post-noty_bottom_layout_container'));
        if (document.getElementById('pre-noty_bottom_layout_container'))
          document.getElementById('pre-noty_bottom_layout_container').parentElement.removeChild(document.getElementById('pre-noty_bottom_layout_container'));

        if (appCtxService.ctx.checklist.editingStacks[index].context == contents) {
          closeMessages();
          show(INFORMATION, i18n.chkRowNotModified);
          return;
        }
        appCtxService.ctx.checklist.editingStacks[index].context = contents;
        appCtxService.ctx.checklist.grid.finishEditing(
          appCtxService.ctx.checklist.editingStacks[index].rowKey,
          appCtxService.ctx.checklist.editingStacks[index].columnName,
          contents,
        );
        closeMessages();
        show(INFORMATION, i18n.chkRowModifiedSaved);
        return;
      },
    });
    return button.render();
  };
}

/**
 * summernote??? ???????????? close ??? ???, Toast Grid??? ????????? ?????? ????????????.
 */
function _editorCloseHook() {
  let focusCell = appCtxService.ctx.checklist.grid.getFocusedCell();
  appCtxService.ctx.checklist.grid.focusAt(0, 0, false);
  let rowKey = appCtxService.ctx.checklist.grid.getIndexOfRow(focusCell.rowKey);
  let columnName = focusCell.columnName;

  let columns = appCtxService.ctx.checklist.grid.getColumns();
  for (let i = 0; i < columns.length; i++) {
    if (columns[i].name == columnName) {
      appCtxService.ctx.checklist.grid.focusAt(rowKey, i - 1, false);
      if (appCtxService.ctx.checklist.tableMode == 3) appCtxService.ctx.checklist.grid.focusAt(rowKey, i, false);
      break;
    }
  }
}

/**
 * ?????? ????????? URL????????? ????????? ????????????.
 * @param {*} target
 * @returns
 */
export function getUrlParameter(target) {
  let params = new URL(document.URL).hash.split('?')[1].split('&');
  for (const param of params) {
    if (param.startsWith(target + '=')) {
      return param.replace(target + '=', '');
    }
  }
  return null;
}

/**
 * ????????????????????? ???????????? ????????????.
 * @returns
 */
export function setSublocationTitle() {
  let targetUid = getUrlParameter('uid');
  return lgepObjectUtils
    .loadObject(targetUid, lgepObjectUtils.createPolicies(checklistProperties, ['L2_StructureRevision']))
    .then(() => {
      let targetObject = lgepObjectUtils.getObject(targetUid);
      const headerTitleEl = document.querySelector('aw-sublocation-title');
      headerTitleEl.innerHTML = '';

      const div = document.createElement('div');
      div.classList.add('product-title');

      const checklistName = targetObject.props.object_name.dbValues[0];
      const released = targetObject.props.fnd0AllWorkflows.uiValues[0];
      const revisionId = targetObject.props.item_revision_id.uiValues[0];
      const lastModUser = targetObject.props.last_mod_user.uiValues[0];

      const text = `
        ${i18n.openChecklistTitle} :  \u00a0\u00a0 ${checklistName}  \u00a0\u00a0\u00a0\u00a0 / 
        \u00a0\u00a0\u00a0\u00a0 ${i18n.openChecklistRevId} :  \u00a0\u00a0 ${revisionId} \u00a0\u00a0\u00a0\u00a0 / 
        \u00a0\u00a0\u00a0\u00a0 ${i18n.openChecklistLastModUser}  :  \u00a0\u00a0 ${lastModUser}
        `;

      div.textContent = text;
      headerTitleEl.appendChild(div);
      return targetObject;
    })
    .catch((error) => {
      show(ERROR, error.message);
      //console.error(error)
    });
}

/**
 * ????????????????????? ???????????? ???????????????.
 * @returns
 */
export function resetSublocationTitle() {
  const headerTitleEl = document.querySelector('aw-sublocation-title');
  headerTitleEl.innerHTML = '';
  return;
}

/**
 * Text Dataset???????????? Property??? ????????????.
 * Text Dataset??? JSON ????????? ??????????????? ????????????, ?????? stringify?????? ????????????.
 * @param {*} targetUid
 * @returns
 */
export function readPropertiesFromTextFile(targetUid) {
  if (targetUid) {
    return lgepObjectUtils
      .loadObject(targetUid, lgepObjectUtils.createPolicy(['object_name', 'ref_list'], 'Dataset'))
      .then(() => {
        let dataset = lgepObjectUtils.getObject(targetUid);
        let imanFileUid = dataset.props.ref_list.dbValues[0];
        let imanFile = lgepObjectUtils.getObject(imanFileUid);
        let request = {
          files: [imanFile],
        };
        return soaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', request).then((response) => {
          return fetch('fms/fmsdownload/?ticket=' + response.tickets[1][0]).then((res) => {
            return res.arrayBuffer().then((arrayBuffer) => {
              const chars = new Uint8Array(arrayBuffer);
              var string = new TextDecoder().decode(chars);
              return string;
            });
          });
        });
      })
      .then((string) => {
        let properties = JSON.parse(string);
        return properties;
      })
      .catch((error) => {
        show(ERROR, i18n.chkRowLoadPropertiesFailed + '\n' + error.message);
      });
  } else {
    let properties = {};
    properties.function = '';
    properties.requirement = '';
    properties.failureMode = '';
    properties.failureEffect = '';
    properties.failureDetail = '';
    properties.prevention = '';
    properties.referenceData = '';
    properties.detectivity = '';
    properties.classification = '';
    properties.refResult = '';
    properties.refRecommend = '';
    properties.refRecommendResult = '';
    return new Promise((resolve) => {
      resolve(properties);
    });
  }
}

/**
 *  ????????? ROW ?????????
 */
export const checklistProperties = [
  'object_string',
  'object_name',
  'last_mod_user',
  'last_mod_date',
  'item_id',
  'item_revision_id',
  'items_tag',
  'revision_list',
  'ps_children',
  'l2_function',
  'l2_requirements',
  'l2_failure_mode',
  'L2_Ref_Severity',
  'L2_Ref_Occurence',
  'L2_Ref_Detection',
  'L2_Result_Severity',
  'L2_Result_Occurence',
  'L2_Result_Detection',
  'L2_Result_AP',
  'L2_ReferenceDataset',
  'L2_IsSelected',
  'fnd0bl_line_object_type',
  'L2_Ref_AP',
  'bl_line_object',
  'l2_is_template',
  'l2_is_checklist',
  'l2_interaction_table',
  'bl_rev_object_name',
  'l2_current_project',
  'owning_user',
  'fnd0AllWorkflows',
  'l2_product_type',
  'l2_product_class',
  'l2_module_name',
  'release_status_list',
  'l2_product_name',
  'IMAN_reference',
  'owning_group',
  'awb0ArchetypeId',
  'l2_product_id',
  'l2_event_phase',
  'l2_is_IM_target',
  'l2_image',
  'l2_images',
  'l2_attached_files',
  'based_on',
  'IMAN_based_on',
  'awb0Archetype',
  'awb0UnderlyingObject',
  'l2_comments',
  'l2_files',
];
/**
 *  ????????? ROW ?????????
 */
export const checklistRowProperties = checklistProperties;

/**
 *  tree column
 */
export const checklistColumns = () => {
  return [
    {
      header: i18n.chkColumnChecklistName,
      name: 'name',
      renderer: {
        type: IconRenderer,
      },
      minWidth: 500,
    },
    {
      header: i18n.chkColumnRevisionId,
      name: 'revisionId',
      width: 150,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnProjectName,
      name: 'projectName',
      width: 200,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnProductType,
      name: 'productType',
      width: 150,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnProductClass,
      name: 'productClass',
      width: 150,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnProductName,
      name: 'productId',
      width: 150,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnModuleName,
      name: 'moduleName',
      width: 150,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnCreateUser,
      name: 'creator',
      width: 200,
      rowSpan: false,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnCreationDate,
      name: 'createDate',
      width: 300,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
    {
      header: i18n.chkColumnIsFreezed,
      name: 'isReleased',
      width: 100,
      renderer: {
        classNames: ['checklist-center'],
      },
    },
  ];
};

/**
 *  tree column
 */
export const checklistRowEditingColumns = [
  {
    header: ' ',
    name: 'icon',
    width: 190,
    renderer: {
      type: IconOnlyRenderer,
    },
    rowSpan: false,
  },
  {
    header: i18n.chkRowColumnUpperAssy,
    name: 'upperAssy',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnLowerAssy,
    name: 'lowerAssy',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnSingle,
    name: 'single',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnFunction,
    name: 'function',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnRequirement,
    name: 'requirement',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnFailureMode,
    name: 'failureMode',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnFailureEffect,
    name: 'failureEffect',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnFailureDetail,
    name: 'failureDetail',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnPrevention,
    name: 'prevention',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnReferenceData,
    name: 'referenceData',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnDetectivity,
    name: 'detectivity',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnClassification,
    name: 'classification',
    width: 150,
    renderer: {
      type: ImageCellRenderer,
    },
    editor: {
      type: ImageCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnRefSeverity,
    name: 'refSeverity',
    width: 150,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnRefOccurence,
    name: 'refOccurence',
    width: 150,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnRefDetection,
    name: 'refDetection',
    width: 150,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnRefAP,
    name: 'AP',
    width: 150,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnInspectionResult,
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
    header: i18n.chkRowColumnRecommend,
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
    header: i18n.chkRowColumnRecommendResult,
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
    header: i18n.chkRowColumnNewSeverity,
    name: 'newSeverity',
    width: 100,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnNewOccurence,
    name: 'newOccurence',
    width: 100,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnNewDetection,
    name: 'newDetection',
    width: 100,
    editor: {
      type: SodCellEditor,
    },
  },
  {
    header: i18n.chkRowColumnNewAP,
    name: 'newAP',
    width: 100,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
];

/**
 *  tree column
 */
export const checklistRowColumns = [
  {
    header: ' ',
    name: 'icon',
    width: 190,
    renderer: {
      type: IconOnlyRenderer,
    },
    rowSpan: false,
  },
  {
    header: i18n.chkRowColumnUpperAssy,
    name: 'upperAssy',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnLowerAssy,
    name: 'lowerAssy',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnSingle,
    name: 'single',
    width: 300,
    rowSpan: false,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnFunction,
    name: 'function',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnRequirement,
    name: 'requirement',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnFailureMode,
    name: 'failureMode',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnFailureEffect,
    name: 'failureEffect',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnFailureDetail,
    name: 'failureDetail',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnPrevention,
    name: 'prevention',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnReferenceData,
    name: 'referenceData',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnDetectivity,
    name: 'detectivity',
    width: 600,
    rowSpan: false,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnClassification,
    name: 'classification',
    width: 150,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnRefSeverity,
    name: 'refSeverity',
    width: 150,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnRefOccurence,
    name: 'refOccurence',
    width: 150,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnRefDetection,
    name: 'refDetection',
    width: 150,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnRefAP,
    name: 'AP',
    width: 150,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnInspectionResult,
    name: 'refResult',
    width: 600,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnRecommend,
    name: 'refRecommend',
    width: 600,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnRecommendResult,
    name: 'refRecommendResult',
    width: 600,
    renderer: {
      type: ImageCellRenderer,
    },
  },
  {
    header: i18n.chkRowColumnNewSeverity,
    name: 'newSeverity',
    width: 100,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnNewOccurence,
    name: 'newOccurence',
    width: 100,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnNewDetection,
    name: 'newDetection',
    width: 100,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
  {
    header: i18n.chkRowColumnNewAP,
    name: 'newAP',
    width: 100,
    renderer: {
      classNames: ['checklist-center'],
    },
  },
];

/**
 * ????????? ??????????????? ?????????
 * @param {string} text - ????????? key
 * @param {string} fileName - i18n json ??????
 * @returns
 */
export const getLocalizedText = (text, fileName = 'L2_ChkMainMessages') => {
  const message = lgepLocalizationUtils.getLocalizedText(fileName, text);
  return message;
};

/**
 *  ??????????????? ???????????? navigate ?????????.
 */
export async function navigateToMaster() {
  const getPreferenceValues = await lgepPreferenceUtils.getPreferenceValues('L2_Checklist_Structure');
  let topFolderUid = getPreferenceValues[0].value;
  window.location.href = browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + topFolderUid;
}

export function getColumnBalloonData(columnName) {
  let columnDatas = {
    upperAssy: '????????????/????????????',
    lowerAssy: '????????????/????????????',
    single: '????????????/????????????',
    function: '???????????? ????????? ????????? ????????? ??????',
    requirement: '??? ????????? ?????? ??????????????? ??????????????? ?????????',
    failureMode: '?????? ???????????? ?????? (????????????) ????????? ????????? ??????\n??? ??????(??????)????????? ??????, ???????????? ?????? ????????? ??? ?????? ?????? ????????? ??????',
    failureEffect: '???????????? ?????? ???????????? ??????????????? ??????',
    failureDetail: '????????? ?????? ?????? ??? ??????????????? ??????',
    prevention: '??????????????? ??????????????? ?????? ?????? ????????? ??????',
    referenceData: 'DGMS, QMS, ??????, ?????? ???',
    detectivity: '?????? ???????????? ????????????, ??????????????? ??????????????? ??????',
    classification: 'CTQ',
    refSeverity: '???????????? ????????? ???????????????',
    refOccurence: '????????? ?????? ????????? ????????? ???????????? ??????',
    refDetection: '????????? ?????????????????? ????????? ???????????? ??????',
    AP: ' ',
    refResult: '????????? ?????? ?????? ??????',
    refRecommend: '????????? ??????????????? ??????????????? ?????? ??????????????? ????????? ?????? ?????? ??????',
    refRecommendResult: '?????? ????????? ?????? ????????? ????????? ?????? ???????????? ??????',
    newSeverity: '??????????????? ?????? ????????? ????????????',
    newOccurence: '??????????????? ?????? ????????? ????????????',
    newDetection: '??????????????? ?????? ????????? ????????????',
    newAP: '??????????????? ?????? ????????? ????????????',
  };
  return columnDatas[columnName];
}

var attachButton = function (context) {
  var ui = $.summernote.ui;
  var button = ui.button({
    contents: '<div class="fa fa-pencil"/>UPLOAD</div>',
    click: async function (event) {
      let file = await openFileChooser();
      let fileName = file.name;
      let dataset = await lgepSummerNoteUtils.uploadFileToDataset(file);
      let url = browserUtils.getBaseURL() + '#/lgepXcelerator?uid=' + dataset.uid;
      let aTag = `<a href=${url} dataUid=${dataset.uid} target="_blank">${fileName}<\a>`;
      let contents = $('.summernote').summernote('code');
      contents = contents.replaceAll('<a></a>', '');
      contents += aTag;
      $('.summernote').summernote('code', contents);
    },
  });
  return button.render();
};

var openFileChooser = () => {
  var deferred = awPromiseService.instance.defer();
  var input = document.createElement('input');
  input.type = 'file';

  input.onchange = (e) => {
    var file = e.target.files[0];
    deferred.resolve(file);
  };
  input.click();
  return deferred.promise;
};

export default exports = {
  getUrlParameter,
  setSublocationTitle,
  resetSublocationTitle,
  readPropertiesFromTextFile,
  checklistColumns,
  navigateToMaster,
  getColumnBalloonData,
  checklistRowColumns,
  checklistRowEditingColumns,
  checklistProperties,
  checklistRowProperties,
};
app.factory('checklistUtils', () => exports);
