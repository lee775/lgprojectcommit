/**
 * FMEA MASTER (구조/기능/고장) 삭제 모듈 유틸
 * @module js/cmDeleteService
 */

import appCtxService from 'js/appCtxService';

import messageUtil from 'js/utils/lgepMessagingUtils';

import {
  showErrorMessage,
  getLocalizedMessage,
  TYPE_INFO,
  showInfoMessage,
} from 'js/utils/fmeaMessageUtils';
import {
  deleteItem,
  deleteAllDatasetOnSpecification,
  deleteWorkspcaeObject,
} from 'js/utils/fmeaTcUtils';
import { insertLog } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';

const MSG_QUEST_DELETE = 'questionsDelete';
const MSG_SUCCESS_DELETE = 'successDeleteMaster';
const YES = 'Yes';
const NO = 'No';

/**
 * reference 연결 없는 마스터 아이템 삭제
 * @param {*} ctx
 */
export const deleteAction = async (ctx) => {
  messageUtil.showWithParams(
    TYPE_INFO,
    getLocalizedMessage(MSG_QUEST_DELETE),
    [],
    [YES, NO],
    [
      function () {
        const selectMaster = ctx[constants.ROW_SELECT];
        try {
          deleteAllDatasetOnSpecification(selectMaster);
          deleteItem(selectMaster);
          _deleteAfterAction();
          return;
        } catch (e) {
          showErrorMessage(e);
        }
      },
      function () {
        return;
      },
    ]
  );
};

/**
 * WorkspaceObject 삭제
 * @param {*} ctx
 */
export const deleteWorkspaceObject = async (ctx) => {
  messageUtil.showWithParams(
    TYPE_INFO,
    getLocalizedMessage(MSG_QUEST_DELETE),
    [],
    [YES, NO],
    [
      function () {
        const workspaceObject = ctx[constants.ROW_SELECT];
        try {
          deleteWorkspcaeObject(workspaceObject);
          _deleteAfterAction();
          return;
        } catch (e) {
          showErrorMessage(e);
        }
      },
      function () {
        return;
      },
    ]
  );
};

/**
 * 삭제 후 공통 후처리
 * 삭제 완료 메시지 호출, ctx 삭제
 */
const _deleteAfterAction = () => {
  showInfoMessage(MSG_SUCCESS_DELETE);
  const master = appCtxService.ctx[constants.ROW_SELECT];
  insertLog(`Delete Checklist Master : ${master.type}`, master.uid);
  delete appCtxService.ctx[constants.ROW_SELECT];
};
