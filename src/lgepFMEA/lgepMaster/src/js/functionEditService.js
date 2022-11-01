/**
 * FMEA 마스터 - 기능 (편집)
 * @module js/functionEditService
 */
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import {
  checkEditorTab,
  editActionOnEditors,
  cancelEditEditor,
  cancel,
  save,
  saveEditOnEditors,
  insertLogByEdit,
} from 'js/cmEditService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const EDITORS = [prop.FUNCTION];
const EDITOR_TAB_NAME = 'l2_xrt_tab_function';

/**
 * 편집 취소
 * 에디터 값 초기화 후 disable
 * @param {*} ctx
 */
const cancelEdit = async (ctx) => {
  if (checkEditorTab(ctx, EDITOR_TAB_NAME)) {
    await cancelEditEditor(ctx, EDITORS);
  } else {
    cancel();
  }
};

/**
 * 편집 실행
 * 에디터 enable
 * @param {*} ctx
 */
const editAction = (ctx) => {
  editActionOnEditors(EDITORS);
};

/**
 * 편집 내용 저장
 * 에디터 값 저장
 * @param {*} ctx
 */
const saveEdit = async (ctx) => {
  try {
    if (checkEditorTab(ctx, EDITOR_TAB_NAME)) {
      const masterRev = ctx[constants.ROW_SELECT];
      await saveEditOnEditors(masterRev, prop.FUNCTION);
      insertLogByEdit(masterRev);
    } else {
      save();
    }
  } catch (e) {
    showErrorMessage(e);
  }
};

export default {
  editAction,
  cancelEdit,
  saveEdit,
};
