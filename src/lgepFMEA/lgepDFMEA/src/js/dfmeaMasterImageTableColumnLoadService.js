import { replaceEmptyValue, getLangIndex } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';

export const COLUMNS = [
  constants.COL_PARENT_ASSY_LANG,
  constants.COL_SUB_ASSY_LANG,
  constants.COL_SINGLE_ITEM_LANG,
  constants.COL_FAILURE_FUNCTION_LANG,
  constants.COL_FAILURE_REQUIREMENT_LANG,
  constants.COL_FAILURE_LANG,
  constants.COL_FAILURE_EFFECT_LANG,
  constants.COL_CAUSE_OF_FAILURE_LANG,
  constants.COL_PRECATUIONS_ACTION_LANG,
  constants.COL_RELATED_SOURCES_LANG,
  constants.COL_DETECTION_ACTION_LANG,
  constants.COL_CLASSIFICATION_LANG,
  constants.COL_SEVERITY_LANG, // 12
  constants.COL_OCCURENCE_LANG,
  constants.COL_DETECTION_LANG,
  constants.COL_AP_LANG,
  constants.COL_INSPECTION_RESULTS_LANG,
  constants.COL_RECOMMENDED_ACTION_LANG,
  constants.COL_RECOMMENDED_ACTION_RESULT_LANG,
  constants.COL_RESULT_SEVERITY_LANG,
  constants.COL_RESULT_OCCURENCE_LANG,
  constants.COL_RESULT_DETECTION_LANG,
  constants.COL_RESULT_AP_LANG,
];

export const getColumns = () => {
  const langIndex = getLangIndex();
  const gridColumns = COLUMNS.map((column, index) => {
    return _getLangColumn(column, langIndex, index);
  });
  return gridColumns;
};

const SPLIT_NUMBER = 60;

class EditorRender {
  constructor(props) {
    const el = document.createElement('div');
    el.classList.add('selectable-all');
    el.style.width = '595px';
    el.style.minHeight = '200px';

    this.el = el;

    this.render(props);
  }

  getElement() {
    return this.el;
  }

  render(props) {
    let value = lineBreak(props.value);
    if (value) {
      if (value.includes('<img')) {
        value = value.replaceAll('<img', '<img style="width:auto; height:auto; max-width:400px; max-height:auto;"');
      }
      if (value.includes('<p>')) {
        this.el.innerHTML = String(value);
        return;
      } else if (!value.includes('<img') && !value.includes('<table')) {
        if (value.length > SPLIT_NUMBER) {
          const newValue = _getSubstringValue(value);
          this.el.innerHTML = String(newValue);
          return;
        }
      }
      this.el.innerHTML = String(value);
    }
  }
}

export const lineBreak = (value) => {
  let resultValue = value.replaceAll('&nbsp;', '<p></p>');
  return resultValue;
};

class CellRender {
  constructor(props) {
    const el = document.createElement('div');
    el.style.width = '595px';
    el.style.minHeight = '200px';

    this.el = el;

    this.render(props);
  }

  getElement() {
    return this.el;
  }

  render(props) {
    let value = lineBreak(props.value);
    if (value) {
      if (value.includes('<img')) {
        value = value.replaceAll('<img', '<img style="width:auto; height:auto; max-width:400px; max-height:auto;"');
      }
      if (value.includes('<p>')) {
        this.el.innerHTML = String(value);
        return;
      } else if (!value.includes('<img') && !value.includes('<table')) {
        if (value.length > SPLIT_NUMBER) {
          const newValue = _getSubstringValue(value);
          this.el.innerHTML = String(newValue);
          return;
        }
      }
      this.el.innerHTML = String(value);
    }
  }
}

const _getSubstringValue = (value) => {
  const valueLength = value.length;
  const loop = Math.ceil(valueLength / SPLIT_NUMBER);
  let subCnt = 0;
  let result;
  for (let index = 0; index < loop; index++) {
    if (index === loop) {
      const subStringValue = _makeValue(value.substring(subCnt));
      subCnt = subCnt + SPLIT_NUMBER;
      result += subStringValue;
    } else {
      const subStringValue = _makeValue(value.substring(subCnt, subCnt + SPLIT_NUMBER));
      subCnt = subCnt + SPLIT_NUMBER;
      result += subStringValue;
    }
  }

  const result2 = _makeValue(result);
  return result2.replaceAll('<p>undefined', '');
};

const _makeValue = (txt) => {
  return '<p>' + txt + '</p>';
};

const _getLangColumn = (column, langIndex, index) => {
  //console.log('column', column); //L2_Precautions', '권고조치사항', 'Precautions
  let resultColumn = {
    title: column[0],
    name: column[langIndex],
    width: _getColumnWidth(index),
    resizable: false,
    sortable: true,
    filter: {
      type: 'text',
      showApplyBtn: true,
      showClearBtn: true,
    },
  };
  if (index === 16 || index === 17 || index === 18) {
    resultColumn.renderer = {
      type: EditorRender,
    };
  } else {
    resultColumn.renderer = {
      type: CellRender,
    };
  }

  return resultColumn;
};

const _getColumnWidth = (index) => {
  if (index === 0 || index === 1) {
    // 상위, 하위
    return 250;
  } else if (index === 2 || index === 9 || index === 11) {
    // 단품, 관련자료, 출처
    return 150;
  } else if ((index >= 3 && index <= 8) || index === 10 || index === 16 || index === 17 || index === 18) {
    // 기능 ~ 예방
    return 600;
  }
  if (index === 2 || index === 12 || index === 13 || index === 14 || index === 15 || index === 21 || index === 22 || index === 23 || index === 24) {
    return 110;
  } else {
    return 160;
  }
};
