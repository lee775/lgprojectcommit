/**
 * Structure Master Edit Service
 * @module js/structureEditService
 */

import editHandlerService from 'js/editHandlerService';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { cancel, editing, save } from 'js/cmEditService';

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
  } catch (e) {
    showErrorMessage(e);
  }
};

const setTabInSummary = () => {
  cancel();
};

export default {
  editAction,
  cancelEdit,
  saveEdit,
  setTabInSummary,
};
