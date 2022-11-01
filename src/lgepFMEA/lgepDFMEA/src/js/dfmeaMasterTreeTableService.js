import appCtxService from 'js/appCtxService';

import { initTreeSelectRow } from 'js/dfmeaMasterTreeTableInteractionService';
import { makeEditor, setValue } from 'js/utils/fmeaEditorUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

const selectTableRowAction = async (selectionRow) => {
  appCtxService.registerCtx(constants.ROW_SELECT, selectionRow);
  if (selectionRow.type === prop.TYPE_FMEA_STRUCTURE_REV) {
    appCtxService.registerCtx(
      constants.FMEA_SELECT_STRUCTURE_MODEL,
      selectionRow.modelObject
    );
    appCtxService.registerCtx(constants.FMEA_SELECT_STRUCTURE, true);
    return;
  }

  await _beforeLoadDetail();
  loadDetail(selectionRow);
  await _afterLoadDetail();
};

const _beforeLoadDetail = async () => {
  delete appCtxService.ctx[constants.FMEA_SELECT_STRUCTURE];
  delete appCtxService.ctx[constants.FMEA_SELECT_STRUCTURE_MODEL];
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, false);
  appCtxService.registerCtx(constants.FMEA_LABEL_INIT, false);
  await lgepCommonUtils.delay(500);
};

const _afterLoadDetail = async () => {
  appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  await lgepCommonUtils.delay(100);
  appCtxService.registerCtx(constants.FMEA_LABEL_INIT, true);
};

export const loadDetail = (selectRow) => {
  const typeLevel = selectRow.typeLevel;
  const props = _getProps(typeLevel);

  for (const prop of props) {
    const props = selectRow.props;
    const propValue = _getPropValue(props, prop);
    _setEditValue(prop, propValue);
  }
};

const _getPropValue = (props, propName) => {
  for (const prop of props) {
    if (prop.hasOwnProperty(propName)) {
      return prop[propName] ? prop[propName] : '';
    }
  }
};

const _getProps = (typeLevel) => {
  if (typeLevel === prop.FUNCTION) {
    const props = [prop.FUNCTION, prop.REQUIREMENT];
    return props;
  } else if (typeLevel === prop.POTENTIAL_FAILURE_MODE) {
    const props = [
      prop.POTENTIAL_FAILURE_MODE,
      prop.CAUSE_OF_FAILURE,
      prop.FAILURE_EFFECT,
      prop.PRECATUIONS_ACTION,
      prop.DETECTION_ACTION,
    ];
    return props;
  }
};

const _setEditValue = (prop, value) => {
  makeEditor(prop, 'disable');
  setValue(prop, value);
};

// Interaction 호출 시 선택한 파트 ctx 등록 및 css
const initSelectRow = () => {
  const initSelect = appCtxService.ctx[constants.ROW_SELECT];
  appCtxService.registerCtx(constants.INTERACTION_INIT_ROW_SELECT, initSelect);
  initTreeSelectRow();
};

export default {
  selectTableRowAction,
  initSelectRow,
};
