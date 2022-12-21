import app from 'app';
import _ from 'lodash';
var $ = require('jQuery');
import appCtxService from 'js/appCtxService';
import soaService from 'soa/kernel/soaService';
import viewModelService from 'js/viewModelService';

import Grid from 'tui-grid';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

import lgepBomUtils from 'js/utils/lgepBomUtils';
import checklistUtils from 'js/utils/checklistUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import { show, ERROR } from 'js/utils/lgepMessagingUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import { loadAndRefreshOpenGrid } from 'js/L2_ChecklistOpenService';
import { fixedOff, autoResize, tableResize } from 'js/L2_ExportExcelService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

let MSG = 'L2_ChkMainMessages';
let i18n = {
  chkRowEditFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowEditFailed'),
  chkRowSaveFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowSaveFailed'),
};

let exports;

/**
 * 체크리스트 열 내용을 수정한다.
 * 단순히 Context의 _editing 값을 변경하지만,
 * 테이블 모드에 따라서 특정 Column Show/Hide 해야한다.
 *
 * @param {*} data
 * @param {*} ctx
 */
export async function openChecklistBomEdit(data, ctx) {
  fixedOff(data, ctx);
  delete ctx.hideColumn;
  delete ctx.fixed;
  if (ctx.theme == 'ui-lgepDark') {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#444a4e',
        background: '#282d33',
      },
      row: {
        hover: {
          background: 'rgb(56, 66, 77)',
        },
      },
    });
  } else {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#eee',
        background: '#fff',
      },
      row: {
        hover: {
          background: '#e5f6ff',
        },
      },
    });
  }

  ctx.checklist.grid.setFrozenColumnCount(0);
  try {
    let listboxElem = document.getElementById('checklist-tableMode-listbox');
    let listboxView = viewModelService.getViewModelUsingElement(listboxElem);
    listboxView.tableMode.isEnabled = false;

    ctx._editing = true;
    ctx.checklist.grid.setColumns(checklistUtils.checklistRowEditingColumns);
    if (appCtxService.ctx.checklist.grid && appCtxService.ctx.checklist.tableMode == '3') {
      appCtxService.ctx.checklist.grid.showColumn('icon');
    } else {
      appCtxService.ctx.checklist.grid.hideColumn('icon');
    }

    await lgepCommonUtils.delay(100);
    await tableResize();
    await autoResize(null, ctx);
  } catch (error) {
    show(ERROR, i18n.chkRowEditFailed + error.name + ': ' + error.message);
  }
}

/**
 * 체크리스트 열 내용을 저장한다.
 * 수정->저장의 순서로만 사용이 가능하다.
 * 고장 리비전의 목록을 불러와, 현재 Toast Grid Row(ChecklistRow)에 담긴 내용을 읽고,
 * 기존 데이터셋에 담긴 내용을 저장한다.
 *
 * @param {*} data
 * @param {*} ctx
 * @returns
 */
export async function openChecklistBomSave(data, ctx) {
  fixedOff(data, ctx);
  delete ctx._editing;
  delete ctx.hideColumn;
  delete ctx.fixed;
  ctx.checklist.grid.setFrozenColumnCount(0);
  try {
    lgepLoadingUtils.openWindow();
    let propertyMap = new Map();
    let inputs = [];
    //현 시점 Checklist Row들의 Raw Data를 불러온다.
    let rawDatas = ctx.checklist.grid.store.data.rawData;
    //그 중 고장에 해당하는 내용만 추린다.
    let datas = rawDatas.filter((e) => e.type == 'L2_FailureRevision');
    for (let i = 0; i < datas.length; i++) {
      let row = ctx.checklist.failure[i];
      let propName = ['l2_ref_severity', 'l2_ref_occurence', 'l2_ref_detection', 'l2_result_severity', 'l2_result_occurence', 'l2_result_detection'];
      let values = [datas[i].refSeverity, datas[i].refOccurence, datas[i].refDetection, datas[i].newSeverity, datas[i].newOccurence, datas[i].newDetection];
      let input = {
        obj: {
          uid: row.getObject().uid,
          type: row.getObject().type,
        },
        viewModelProperties: [],
        isPessimisticLock: false,
        workflowData: {},
      };
      //saveViewModelEditAndSubmitWorkflow2 사용에 필요한 InputParameter를 만든다.
      for (let j = 0; j < propName.length; j++) {
        if (values[j]) {
          let prop = {
            propertyName: propName[j],
            dbValues: [values[j]],
            uiValues: [values[j]],
            intermediateObjectUids: [],
            srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
            isModifiable: true,
          };
          input.viewModelProperties.push(prop);
        }
      }
      inputs.push(input);
    }
    const saveViewModelEditAndSubmitWorkflow2Param = {
      inputs: inputs,
    };
    //saveViewModelEditAndSubmitWorkflow2를 통해, SOD 및 NEW SOD 변경 내용을 저장한다.
    await soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', saveViewModelEditAndSubmitWorkflow2Param);

    //rawDatas에서 첨부된 파일이 있을 경우 target에 l2_files에 저장한다.
    const FUNCTION_EDITOR_IDS = ['function', 'requirement'];
    const FAILURE_EDITOR_IDS = ['failureMode', 'failureEffect', 'failureDetail', 'prevention', 'referenceData', 'detectivity', 'classification'];

    let regEx = /(?<=datauid=")(.*?)(?=")/g;
    let attachFiles = [];

    for (let row of rawDatas) {
      for (let key of FAILURE_EDITOR_IDS) {
        if (row[key]) {
          let uids = row[key].match(regEx);
          if (uids) {
            for (let uid of uids) {
              attachFiles.push(uid);
            }
          }
        }
      }
      for (let key of FUNCTION_EDITOR_IDS) {
        if (row[key]) {
          let uids = row[key].match(regEx);
          if (uids) {
            for (let uid of uids) {
              attachFiles.push(uid);
            }
          }
        }
      }
    }
    if (attachFiles.length > 0) {
      let target = ctx.checklist.target;
      lgepObjectUtils.setProperties([target], ['l2_files'], [attachFiles]);
    }

    //Dataset의 내용을 수정하기 위해, editingStack를 조사한다.
    //editingStack 은 checklistUtils에서 확인 가능하며, 내용이 편집될때마다 stack이 한칸씩 쌓인다.
    if (ctx.checklist.editingStacks) {
      let doneList = [];
      for (const stack of ctx.checklist.editingStacks) {
        if (doneList.includes(ctx.checklist.grid.getIndexOfRow(stack.rowKey))) {
          continue;
        }
        doneList.push(ctx.checklist.grid.getIndexOfRow(stack.rowKey));
        let row = ctx.checklist.grid.getRowAt(ctx.checklist.grid.getIndexOfRow(stack.rowKey));

        let textUid = '';
        let text = null;
        let bomLine = row.getObject();
        //Text Dataset의 내용에 저장하기 위한 JSON 객체를 생성한다.
        let properties = {};
        properties.function = row.function;
        properties.requirement = row.requirement;
        properties.failureMode = row.failureMode;
        properties.failureEffect = row.failureEffect;
        properties.failureDetail = row.failureDetail;
        properties.prevention = row.prevention;
        properties.referenceData = row.referenceData;
        properties.detectivity = row.detectivity;
        properties.classification = row.classification;
        properties.refResult = row.refResult;
        properties.refRecommend = row.refRecommend;
        properties.refRecommendResult = row.refRecommendResult;
        //만약, l2_reference_dataset에 이미 uid값이 있으면 해당 객체를 덮어씌우고,
        //없다면 새로 생성하여 Text 파일을 Dataset에 덮어씌운다.
        try {
          textUid = bomLine.props.l2_reference_dataset.dbValues[0];
          text = lgepObjectUtils.getObject(textUid);
          await lgepSummerNoteUtils.stringToDataset(text.props.object_name.dbValues[0], JSON.stringify(properties), text);
        } catch (e) {
          //
        }
        if (textUid == '' || !text) {
          text = await lgepSummerNoteUtils.stringToDataset(bomLine.props.awb0ArchetypeId.dbValues[0], JSON.stringify(properties));
          propertyMap.set(bomLine.uid, text.uid);
        }
        if (!appCtxService.ctx.checklist.target.props.IMAN_reference.dbValues.includes(text.uid))
          await lgepObjectUtils.createRelation('IMAN_reference', appCtxService.ctx.checklist.target, text);
      }
    }
    delete ctx.checklist.editingStacks;

    //새로 생성된 Dataset이 있는 경우, l2_reference_dataset에 해당 Dataset의 uid를 할당한다.
    if (propertyMap.size > 0) {
      let inputs = [];
      for (const key of propertyMap.keys()) {
        let input = {
          obj: {
            uid: key,
            type: lgepObjectUtils.getObject(key).type,
          },
          viewModelProperties: [
            {
              propertyName: 'l2_reference_dataset',
              dbValues: [propertyMap.get(key)],
              uiValues: [propertyMap.get(key)],
              intermediateObjectUids: [],
              srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
              isModifiable: true,
            },
          ],
          isPessimisticLock: false,
          workflowData: {},
        };
        inputs.push(input);
      }
      const saveViewModelEditAndSubmitWorkflow2Param = {
        inputs: inputs,
      };
      const saveViewModelEditAndSubmitWorkflow2Response = await soaService.post(
        'Internal-AWS2-2018-05-DataManagement',
        'saveViewModelEditAndSubmitWorkflow2',
        saveViewModelEditAndSubmitWorkflow2Param,
      );
    } else {
      return;
    }
  } catch (error) {
    show(ERROR, i18n.chkRowSaveFailed + error.name + ': ' + error.message);
  } finally {
    loadAndRefreshOpenGrid();

    await lgepCommonUtils.delay(100);
    await autoResize(null, ctx);

    lgepLoadingUtils.closeWindow();
    try {
      let listboxElem = document.getElementById('checklist-tableMode-listbox');
      let listboxView = viewModelService.getViewModelUsingElement(listboxElem);
      listboxView.tableMode.isEnabled = true;
    } catch (error) {
      //
    }
  }
}

/**
 * 편집을 취소한다.
 * 그리고 다시 테이블을 로드한다.
 *
 * @param {*} data
 * @param {*} ctx
 */
export function openChecklistBomCancelEdit(data, ctx) {
  fixedOff(data, ctx);
  delete ctx._editing;
  delete ctx.hideColumn;
  delete ctx.fixed;
  ctx.checklist.grid.setFrozenColumnCount(0);
  try {
    loadAndRefreshOpenGrid();
    let listboxElem = document.getElementById('checklist-tableMode-listbox');
    let listboxView = viewModelService.getViewModelUsingElement(listboxElem);
    listboxView.tableMode.isEnabled = true;
  } catch (error) {
    show(ERROR, i18n.chkRowEditFailed + error.name + ': ' + error.message);
  }
}

export default exports = {
  openChecklistBomEdit,
  openChecklistBomSave,
  openChecklistBomCancelEdit,
};
app.factory('L2_ChecklistRowEditService', () => exports);
