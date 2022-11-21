import app from 'app';
import appCtxService from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import viewModelService from 'js/viewModelService';
import { saveViewModelEditAndSubmitWorkflow2, saveUserWorkingContextState2 } from 'js/utils/lgepBomUtils';

import { ERROR, INFORMATION, show } from 'js/utils/lgepMessagingUtils';
import { readPropertiesFromTextFile } from 'js/utils/checklistUtils';
import { makeBaseProperteisObj, getDataset } from 'js/L2_ChecklistMasterCreateService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

var exports = {};

// // // // // // // // // // 예외처리 // // // // // // // // // // // // //

/** 편집 실행 */
export function editOpen(isEditing, editorIds) {
  isEditing.dbValue = true;
  // editor 활성화
  for (const editorId of editorIds) {
    $(`#${editorId}`).summernote('enable');
  }
}

export async function setUidIncontext(failure, txtDataset) {
  await saveUserWorkingContextState2(appCtxService.ctx.occmgmtContext.rootElement.uid);
  await saveViewModelEditAndSubmitWorkflow2([failure], ['l2_reference_dataset'], [txtDataset.uid]);
}

export async function setValueIncontextByTopEl(failure, value, top) {
  await saveUserWorkingContextState2(top.uid);
  await saveViewModelEditAndSubmitWorkflow2([failure], ['l2_importance'], [value]);
}

export async function setUidIncontextByTopEl(failure, txtDataset, top) {
  await saveUserWorkingContextState2(top.uid);
  await saveViewModelEditAndSubmitWorkflow2([failure], ['l2_reference_dataset'], [txtDataset.uid]);
}

export const removeTagInStr = (value) => {
  let replaceSpace = value.replaceAll('<p>', ' ');
  let nonTagValue = replaceSpace.replaceAll(/[<][^>]*[>]/gi, '');
  // 그 외 예외처리
  let replaceValue = nonTagValue.replaceAll('&nbsp;', ' ');
  return replaceValue;
};

/** 편집 저장 */
export async function saveEdit(data, editorIds) {
  data.disabledButtonChk.dbValue = true;
  const existInfo = appCtxService.ctx.checklist.masterOriginProperties;
  const topModelObject = lgepObjectUtils.getObject(appCtxService.ctx.occmgmtContext.rootElement.props.awb0Archetype.dbValues[0]);
  try {
    if (existInfo.selectRowType === 'L2_FunctionRevision') {
      // function. faillure들 전부 update
      // 1. function의 failure들 모두 가져옴
      const viewData = viewModelService.getViewModelUsingElement(document.getElementById('occTreeTable'));
      const failures = viewData.dataProviders.occDataProvider.selectedObjects[0].children;
      // 2. failure들의 ref dataset 수정해야 함
      let removeDatasets = [];
      let txtDatasets = [];
      for (const failure of failures) {
        const existDatasetUid = failure.props.l2_reference_dataset.dbValues[0];
        let existProperties;
        if (existDatasetUid) {
          existProperties = await readPropertiesFromTextFile(existDatasetUid);
          const existDataset = lgepObjectUtils.getObject(existDatasetUid);
          if (existDataset) {
            removeDatasets.push(existDataset);
          }
        }
        // failure
        const itemId = failure.props.awb0ArchetypeId.dbValues[0];
        const txtDataset = await makeTxtDataset(existProperties, editorIds, itemId);
        await setUidIncontext(failure, txtDataset);
        txtDatasets.push(txtDataset);
      }

      // 일반속성 set
      const functionObject = lgepObjectUtils.getObject(appCtxService.ctx.selected.props.awb0Archetype.dbValues[0]);
      const props = ['l2_function', 'l2_requirement'];
      for (let i = 0; i < editorIds.length; i++) {
        const editorId = editorIds[i];
        const editorValue = $(`#${editorId}`).summernote('code');
        const stringContents = removeTagInStr(editorValue);
        lgepObjectUtils.setProperties(functionObject, [props[i]], [stringContents]);
      }
      await _changeTopObjectRef(topModelObject, removeDatasets, txtDatasets);

      // // 4. 성공 메시지 등
      _afterSave(data, editorIds);
    } else {
      // failure.
      const existProperties = existInfo.uid ? existInfo.properties : null;
      const failure = appCtxService.ctx.selected;
      const itemId = failure.props.awb0ArchetypeId.dbValues[0];

      const txtDataset = await makeTxtDataset(existProperties, editorIds, itemId);

      await setUidIncontext(failure, txtDataset);
      // // 일반속성도 set
      const failureObject = lgepObjectUtils.getObject(failure.props.awb0Archetype.dbValues[0]);
      const editorValue = $(`#${editorIds[0]}`).summernote('code');
      const stringContents = removeTagInStr(editorValue);
      lgepObjectUtils.setProperties(failureObject, ['l2_failure_mode'], [stringContents]);

      // top set
      const removeDataset = await getDataset(existInfo.uid);
      const removeDatasets = removeDataset ? [removeDataset] : null;
      _changeTopObjectRef(topModelObject, removeDatasets, [txtDataset]);

      // 4. 성공 메시지 등
      _afterSave(data, editorIds);
    }
  } catch (e) {
    //console.log(e);
    show(ERROR, e.message);
  }
}

export async function makeTxtDataset(existProperties, editorIds, itemId) {
  // 기존 uid있는 경우
  if (existProperties) {
    // update 후
    for (const editorId of editorIds) {
      const editorValue = $(`#${editorId}`).summernote('code');
      existProperties[editorId] = editorValue;
    }
    return await stringToDataset(itemId, JSON.stringify(existProperties));
  }

  let properties = makeBaseProperteisObj();
  for (const editorId of editorIds) {
    const editorValue = $(`#${editorId}`).summernote('code');
    properties[editorId] = editorValue;
  }
  return await stringToDataset(itemId, JSON.stringify(properties));
}

// 탑의 IMAN_reference 수정
export async function _changeTopObjectRef(topModelObject, removeDatasets, txtDatsets) {
  // 3-1. 기존 txtDataset 관계 삭제
  try {
    if (removeDatasets) {
      await lgepObjectUtils.getProperties(topModelObject, 'IMAN_reference');
      for (const removeDataset of removeDatasets) {
        const isRemove = topModelObject.props.IMAN_reference.dbValues.filter((uid) => uid === removeDataset.uid).length;
        if (isRemove > 0) {
          await lgepObjectUtils.deleteRelations('IMAN_reference', topModelObject, removeDataset);
          await lgepObjectUtils.deleteObject(removeDataset); // 실제 객체 삭제
        }
      }
    }

    // 새 추가
    lgepObjectUtils.addChildren(topModelObject, txtDatsets, 'IMAN_reference');
  } catch (e) {
    console.log('_changeTopObjectRef', e);
  }
}

function _afterSave(data, editorIds) {
  data.disabledButtonChk.dbValue = false;
  for (const editorId of editorIds) {
    $(`#${editorId}`).summernote('disable');
  }
  data.isEditing.dbValue = false;
  notySvc.setTimeout(INFORMATION, 500);
  notySvc.showInfo(data.i18n.editorSave);
}

/** 편집 취소 */
export function cancelEdit(isEditing, editorIds) {
  isEditing.dbValue = false;
  if (!appCtxService.ctx.checklist || !appCtxService.ctx.checklist.masterOriginProperties || !appCtxService.ctx.checklist.masterOriginProperties.properties) {
    return;
  }
  for (const editorId of editorIds) {
    // editor에 origin value set
    $(`#${editorId}`).summernote('code', appCtxService.ctx.checklist.masterOriginProperties.properties[editorId]);
    // editor 비활성화
    $(`#${editorId}`).summernote('disable');
  }
}

export function unMount(isEditing, editorIds) {
  // editCancel 실행
  cancelEdit(isEditing, editorIds);
  delete appCtxService.ctx.checklist;
}

async function stringToDataset(name, content, targetDataset) {
  let files = [];
  files.push(
    new File([content], targetDataset ? targetDataset.props.ref_list.uiValues[0] : name + '.TXT', {
      type: 'text',
    }),
  );
  let dataset = await lgepSummerNoteUtils.uploadFileToDataset(files);
  lgepObjectUtils.setProperties(dataset[0], ['object_name'], [name]);
  return dataset[0];
}

export default exports = {
  editOpen,
  saveEdit,
  cancelEdit,
  unMount,
};

app.factory('L2_ChecklistMasterCreateService', () => exports);
