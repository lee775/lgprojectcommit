/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterDetailService
 */
import appCtxService from "js/appCtxService";

import lgepCommonUtils from "js/utils/lgepCommonUtils";

import { showErrorMessage } from "js/utils/fmeaMessageUtils";
import * as constants from "js/constants/fmeaConstants";
import * as prop from 'js/constants/fmeaProperty';
import { makeEditor, setValue } from 'js/utils/fmeaEditorUtils';
/**
 * imageTable 모드일 때 상세 보기 실행
 * @param {*} ctx
 * @returns
 */
export const onMountByImageTable = async (ctx) => {
  const selectRow = ctx[constants.ROW_SELECT];
  if (!selectRow) {
    return;
  }
  try {
    await lgepCommonUtils.delay(100);
    loadDetail(selectRow);
    appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  } catch (err) {
    showErrorMessage(err);
  }
};

export const loadDetail = (selectRow) => {
  const props = [
    prop.FUNCTION,
    prop.POTENTIAL_FAILURE_MODE,
  ];

  for (const prop of props) {
    const {
      [prop]: { value: propValue },
    } = selectRow.props;
    _setEditValue(prop, propValue);
  }
};

const _setEditValue = (prop, value) => {
  makeEditor(prop, 'disable');
  setValue(prop, value);
};
