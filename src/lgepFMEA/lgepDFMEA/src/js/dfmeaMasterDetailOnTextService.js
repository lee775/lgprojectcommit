/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterDetailService
 */
import appCtxService from 'js/appCtxService';

import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { loadDetail, setEmptyEditorValue } from 'js/dfmeaMasterDetailCommonService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

/**
 * textTable 모드일 때 상세 보기 실행
 * @param {*} selectRow
 * @returns
 */
export const onMountByTextTable = async (ctx) => {
  const selectRow = ctx[constants.ROW_SELECT];
  if (!selectRow) {
    return;
  }
  try {
    if (!selectRow.props[prop.FUNCTION]) {
      await setEmptyEditorValue();
      return;
    }
    await loadDetail(selectRow);
  } catch (err) {
    showErrorMessage(err);
  }
};
