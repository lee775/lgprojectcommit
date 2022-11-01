/**
 * FMEA MASTER (구조/기능/고장) 편집 모듈 유틸
 * @module js/cmDeleteService
 */
import appCtxService from 'js/appCtxService';
import editHandlerService from 'js/editHandlerService';

import { insertLog } from 'js/utils/fmeaCommonUtils';
import { eidtRevProperties } from 'js/functionCreateService';
import { eidtRevisionProperties } from 'js/failureCreateService';
import {
  getEditorValueById,
  changeEnableEditors,
  setValue,
} from 'js/utils/fmeaEditorUtils';
import { checkEmptyByEditor } from 'js/utils/fmeaValidationUtils';
import {
  showEditSuccessMsg,
  showErrorMessage,
} from 'js/utils/fmeaMessageUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 스타일 시트 편집 취소
 */
export const cancel = () => {
  editHandlerService.cancelEdits();
  _noEditing();
};

/**
 * ctx editing 값 true (편집중)
 */
export const editing = () => {
  appCtxService.registerCtx(constants.EDITING, true);
};

/**
 * ctx editing 값 false (편집중x)
 */
const _noEditing = () => {
  appCtxService.registerCtx(constants.EDITING, false);
};

/**
 * 편집 저장 완료 후 나머지 액션
 * ctx(편집중) 수정 및 완료 메시지 호출
 */
export const saveEditAfterAction = () => {
  _noEditing();
  showEditSuccessMsg();
};

/**
 * 현재 스타일 시트 탭이 에디터 탭인지 체크
 * @param {*} ctx
 * @param {string} tabName
 * @returns {boolean}
 */
export const checkEditorTab = (ctx, tabName) => {
  if (ctx.xrtPageContext['secondaryXrtPageID'] === tabName) {
    return true;
  }
  return false;
};

/**
 * 에디터 포함된 편집 실행
 * @param {string[]} props
 e*/
export const editActionOnEditors = (props) => {
  const editorValeus = props.map((id) => {
    const value = getEditorValueById(id);
    return {
      id,
      value,
    };
  });
  appCtxService.registerCtx(constants.DFMEA_ROW_EDIT_INIT_VALUES, editorValeus);
  editing();
  changeEnableEditors('enable', props);
};

/**
 * 에디터 포함된 편집 취소
 * 내용 리셋 후 DISABLED
 * @param {*} ctx
 * @param {string[]} props - editor ids
 */
export const cancelEditEditor = async (ctx, editors) => {
  const editorValeus = ctx[constants.DFMEA_ROW_EDIT_INIT_VALUES];
  for (const valueObj of editorValeus) {
    const { id, value } = valueObj;
    setValue(id, value);
  }
  changeEnableEditors('disable', editors);
  _noEditing();
};

/**
 * 에디터 미포함 스타일 시트 편집 저장
 */
export const save = () => {
  editHandlerService.saveEdits();
  saveEditAfterAction();
};

/**
 * 에디터 포함 스타일 시트 편집 저장
 * 단일 에디터인 경우에만 사용
 * @param {ModelObject} masterRev
 * @param {string} editorId
 */
export const saveEditOnEditors = async (masterRev, editorId) => {
  try {
    checkEmptyByEditor(editorId);
    await _setValue(masterRev, editorId);

    changeEnableEditors('disable', [editorId]);
    saveEditAfterAction();
  } catch (e) {
    showErrorMessage(e);
  }
};

/**
 *
 * @param {ModelObject} masterRev
 * @param {string} editorId
 */
const _setValue = async (masterRev, editorId) => {
  if (masterRev.type === prop.TYPE_FMEA_FUNC_REVISION) {
    await eidtRevProperties(masterRev, editorId);
  } else {
    await eidtRevisionProperties(masterRev, editorId);
  }
};

export const insertLogByEdit = (master) => {
  insertLog(`Edit Checklist Master : ${master.type}`, master.uid);
};
