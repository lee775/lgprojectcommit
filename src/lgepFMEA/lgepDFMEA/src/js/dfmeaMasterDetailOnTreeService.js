import * as prop from 'js/constants/fmeaProperty';
import { makeEditor, setValue } from 'js/utils/fmeaEditorUtils';

export const loadDetail = (selectRow) => {
  const props = [
    prop.FUNCTION,
    prop.REQUIREMENT,
    prop.POTENTIAL_FAILURE_MODE,
    prop.CAUSE_OF_FAILURE,
    prop.FAILURE_EFFECT,
    prop.PRECATUIONS_ACTION,
    prop.DETECTION_ACTION,
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
