import Grid from 'tui-grid';

import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import dfmeaMasterImageTableService from 'js/dfmeaMasterImageTableService';
import dfmeaMasterTextGridTableService from 'js/dfmeaMasterTextGridTableService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * table 새로고침
 * @param {string} tableId
 */
export const tableRefresh = (tableId) => {
  eventBus.publish(`${tableId}.plTable.reload`);
};

/**
 * LOV 가져와서 aw-list의 values 형식 생성
 * 3개 이상 서비스에서 사용해서 utils로 뺌
 * @returns [{aw-list}]
 */
export const initProductLovs = async () => {
  const productLovResult = await lgepObjectUtils.getInitialLOVValues(prop.TYPE_FMEA_REVISION, 'Create', prop.PRODUCT_CATEGORY);

  const productValues = productLovResult.lovValues.map((lov) => {
    const {
      propDisplayValues: { lov_values: dispValues },
      propInternalValues: { lov_values: propValues },
    } = lov;
    const row = {
      propDisplayValue: dispValues[0],
      dispValue: dispValues[0],
      propInternalValue: propValues[0],
    };
    return row;
  });
  return productValues;
};

/**
 * 생성 액션이 끝나면 생성 버튼 활성화, 프로그레스 멈춤
 * @param {*} data
 */
export const afterSaveAction = (data) => {
  data.disabledButtonChk.dbValue = false;
  eventBus.publish('fmeaPopupProgIndicator-progress.end', {
    excludeLocalDataCtx: true,
  });
  // fmeaPopupUtils.closePopup();
};

/**
 * 생성 등의 액션 처리 전 버튼 비활성화, 프로그레스 시작
 * @param {*} data
 */
export const beforeSaveAction = (data) => {
  eventBus.publish('fmeaPopupProgIndicator-progress.start', {
    excludeLocalDataCtx: true,
  });
  data.disabledButtonChk.dbValue = true;
};

/**
 * 패널/팝업 고정 해제
 */
export const setUnPin = () => {
  appCtxService.registerCtx(constants.IS_PIN, false);
};

/**
 * 패널/팝업 고정
 */
export const setPin = () => {
  appCtxService.registerCtx(constants.IS_PIN, true);
};

/**
 * aw-list에서 선택한 uid로 객체 반환
 * @param {[object]} list
 * @param {object} selectItem
 * @returns {ModelObject}
 */
export const getSelectItemRev = async (list, selectItem) => {
  const selectValue = selectItem.dbValue;
  if (selectValue === '') {
    return null;
  }
  for (const data of list) {
    if (selectValue === data.propInternalValue) {
      return await lgepObjectUtils.getObject(data.dispValue);
    }
  }
};

/**
 * 현재 텍스트테이블/이미지 테이블 확인
 * @param {object} ctx
 * @returns
 */
export const isTreeTable = () => {
  const tableMode = appCtxService.ctx[constants.DFMEA_TABLE_MODE];
  if (!tableMode || tableMode !== constants.DFMEA_TABLE_MODE_KEY_TREE) {
    return false;
  }
  return true;
};

export const getTableMode = () => {
  const ctx = appCtxService.ctx;
  if (ctx[constants.DFMEA_TABLE_MODE]) {
    if (ctx[constants.DFMEA_TABLE_MODE] === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
      return constants.DFMEA_TABLE_MODE_KEY_TEXT;
    } else if (ctx[constants.DFMEA_TABLE_MODE] === constants.DFMEA_TABLE_MODE_KEY_TREE) {
      return constants.DFMEA_TABLE_MODE_KEY_TREE;
    } else {
      return constants.DFMEA_TABLE_MODE_KEY_IMAGE;
    }
  } else {
    return constants.DFMEA_TABLE_MODE_KEY_IMAGE;
  }
};

export const initToastGrid = () => {
  Grid.applyTheme('default', {
    cell: {
      normal: {
        background: '#fff',
        border: '#e0e0e0',
        showVerticalBorder: true,
        showHorizontalBorder: true,
      },
      header: {
        background: '#fff',
        border: '#e0e0e0',
      },
      selectedHeader: {
        background: '#e0e0e0',
      },
    },
  });
};

export const tableRefreshByTableMode = async () => {
  const ctx = appCtxService.ctx;
  const tableMode = getTableMode();
  if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TEXT) {
    await dfmeaMasterTextGridTableService.reLoad(ctx);
  } else if (tableMode === constants.DFMEA_TABLE_MODE_KEY_TREE) {
    eventBus.publish('dfmeaTreeTable.reLoad');
  } else {
    await dfmeaMasterImageTableService.reLoad(ctx);
  }
};
