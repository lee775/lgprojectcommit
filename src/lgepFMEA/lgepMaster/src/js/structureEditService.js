/**
 * FMEA 마스터 - 구조 (편집)
 * @module js/structureEditService
 */

import appCtxService from 'js/appCtxService';
import editHandlerService from 'js/editHandlerService';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { cancel, editing, save, insertLogByEdit } from 'js/cmEditService';
import * as constants from 'js/constants/fmeaConstants';

/**
 * 편집 취소
 */
const cancelEdit = () => {
  cancel();
};

/**
 * 편집 실행
 */
const editAction = () => {
  editing();
  editHandlerService.startEdit();
};

/**
 * 편집 내용 저장
 */
const saveEdit = async () => {
  try {
    save();
    const masterRev = appCtxService.ctx[constants.ROW_SELECT];
    insertLogByEdit(masterRev);
  } catch (e) {
    showErrorMessage(e);
  }
};

export default {
  editAction,
  cancelEdit,
  saveEdit,
};
