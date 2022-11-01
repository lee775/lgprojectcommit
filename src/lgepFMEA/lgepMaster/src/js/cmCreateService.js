/**
 * FMEA MASTER (구조/기능/고장) 생성 모듈 유틸
 * @module js/cmCreateService
 */
import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import fmeaPanelUtils from 'js/utils/fmeaPanelUtils';
import { reset, initeEditorByCreate } from 'js/utils/fmeaEditorUtils';
import { showSaveMessage } from 'js/utils/fmeaMessageUtils';
import { tableRefresh, afterSaveAction } from 'js/utils/fmeaViewCommonUtils';
import { getProductNameByGroup, insertLog } from 'js/utils/fmeaCommonUtils';

import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 마스터 생성시 구조/기능/고장 공통으로 is_master 속성 true
 * @param {ModelObject} item
 */
export const setMasterItemProperty = async (item) => {
  await lgepObjectUtils.setProperties(item, [prop.IS_MASTER], ['true']);
};

/**
 * 마스터 아이템 생성 후 처리 액션
 * 테이블 새로고침, 생성 창 자동 닫기 여부...
 * @param {string} tableId
 * @param {boolean} isPin
 * @param {string[]} createEditors
 * @param {*} data
 */
export const masterCreateAfterActionByPopup = (
  tableId,
  isPin,
  createEditors,
  data
) => {
  tableRefresh(tableId);
  if (!isPin) {
    fmeaPopupUtils.closePopup();
    showSaveMessage();
    return;
  }
  _refreshEditors(createEditors);
  showSaveMessage();
  afterSaveAction(data);
};

/**
 * 해당 아이디를 가진 에디터 내용 초기화
 * @param {string[]} createEditors - 에디터 아이디 배열
 */
const _refreshEditors = (createEditors) => {
  for (const editorId of createEditors) {
    reset(editorId);
  }
};

/**
 * 에디터가 포함되어 있는 생성창 초기화.
 * 패널 고정/해제 커맨드 추가
 * 에디터 추가
 * popup ctx true
 * @param {string} type - Create Item Type
 */
export const initActionInEditors = (type) => {
  const ids = _getInitEditor(type);
  _initCreateEditor(ids);
};

/**
 * {master} Create.html 초기화
 * @param {string[]} editorIds
 * @returns
 */
const _initCreateEditor = (editorAttrs) => {
  editorAttrs.forEach((id) => {
    initeEditorByCreate(id);
  });
};

/**
 * 주어진 타입에 따라 에디터 list 반환
 * @param {string} type
 * @returns
 */
const _getInitEditor = (type) => {
  switch (type) {
    case prop.TYPE_FMEA_FUNC:
      return [prop.FUNCTION];
    case prop.TYPE_FMEA_FAILURE:
      return [prop.POTENTIAL_FAILURE_MODE];
    default:
      return [];
  }
};

/**
 * popup창 close시 ctx 초기화
 */
export const unMount = () => {
  delete appCtxService.ctx[constants.IS_PIN];
};

/**
 * 생성창 호출 시 제품 LOV 초기화
 * @returns {[{aw-list}]}
 */
export const initAction = async () => {
  appCtxService.registerCtx(constants.FMEA_POPUP, true);
  const productValue = getProductNameByGroup();
  return { productValue };
};

/**
 * 마스터 아이템 생성 후 처리 액션 (패널 창)
 * @param {string} tableId - 리프레시할 테이블 id
 */
export const masterCreateAfterActionByPanel = (tableId) => {
  tableRefresh(tableId);

  const isPin = appCtxService.ctx[constants.IS_PIN];
  if (!isPin) {
    fmeaPanelUtils.closePanel();
  }

  eventBus.publish('awpanel.viewRefresh');
  showSaveMessage();
};

export const insertLogByCreate = (master) => {
  insertLog(`Create Checklist Master : ${master.item.type}`, master.item.uid);
};
