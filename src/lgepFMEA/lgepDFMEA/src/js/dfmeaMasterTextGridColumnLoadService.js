import { getLangIndex } from "js/utils/fmeaCommonUtils";
import { lineBreak } from "js/dfmeaMasterImageTableColumnLoadService";
import * as constants from "js/constants/fmeaConstants";

// export const COLUMNS = [
//   constants.COL_PARENT_ASSY_LANG,
//   constants.COL_SUB_ASSY_LANG,
//   constants.COL_SINGLE_ITEM_LANG,
//   constants.COL_SHORT_FUNCTION_LANG,
//   constants.COL_REQUIREMENT_SHORT_LANG,
//   constants.COL_FAILURE_SHORT_LANG,
//   constants.COL_FAILURE_EFFECT_SHORT_LANG,
//   constants.COL_CAUSE_OF_FAILURE_SHORT_LANG,
//   constants.COL_PRECATUIONS_ACTION_SHORT_LANG,
//   constants.COL_RELATED_SOURCES_LANG,
//   constants.COL_DETECTION_ACTION_LANG_SHORT_LANG,
//   constants.COL_CLASSIFICATION_LANG,
//   constants.COL_SEVERITY_LANG, // 12
//   constants.COL_OCCURENCE_LANG,
//   constants.COL_DETECTION_LANG,
//   constants.COL_AP_LANG,
//   constants.COL_INSPECTION_RESULTS_LANG,
//   constants.COL_RECOMMENDED_ACTION_LANG,
//   constants.COL_RECOMMENDED_ACTION_RESULT_LANG,
//   constants.COL_RESULT_SEVERITY_LANG,
//   constants.COL_RESULT_OCCURENCE_LANG,
//   constants.COL_RESULT_DETECTION_LANG,
//   constants.COL_RESULT_AP_LANG,
// ];

export const COLUMNS = [
  constants.COL_PARENT_ASSY_LANG,
  constants.COL_SUB_ASSY_LANG,
  constants.COL_SINGLE_ITEM_LANG,
  constants.COL_FAILURE_FUNCTION_LANG,
  constants.COL_REQUIREMENT_SHORT_LANG,
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

let langIndex;

export const getColumns = () => {
  langIndex = getLangIndex();
  const gridColumns = COLUMNS.map((column) => {
    return _getLangColumn(column);
  });
  return gridColumns;
};

const _getLangColumn = (column) => {
  let resultColumn = {
    title: column[0],
    name: column[langIndex],
    width: _getColumnWidth(column[0]),
    sortable: true,
    filter: {
      type: "text",
      showApplyBtn: true,
      showClearBtn: true,
    },
    renderer: {
      type: CellRender,
    },
  };
  return resultColumn;
};

const _getColumnWidth = (column) => {
  switch (column) {
    case constants.COL_PARENT_ASSY_LANG[0]:
    case constants.COL_SUB_ASSY_LANG[0]:
      return 250;
    case constants.COL_FAILURE_FUNCTION_LANG[0]:
    case constants.COL_REQUIREMENT_SHORT_LANG[0]:
    case constants.COL_FAILURE_LANG[0]:
    case constants.COL_CAUSE_OF_FAILURE_LANG[0]:
    case constants.COL_FAILURE_EFFECT_LANG[0]:
    case constants.COL_PRECATUIONS_ACTION_LANG[0]:
    case constants.COL_DETECTION_ACTION_LANG[0]:
    case constants.COL_INSPECTION_RESULTS_LANG[0]:
    case constants.COL_RECOMMENDED_ACTION_LANG[0]:
    case constants.COL_RECOMMENDED_ACTION_RESULT_LANG[0]:
      return 650;
    case constants.COL_RELATED_SOURCES_LANG[0]:
      return 150;
    default:
      return 120;
  }
};
class CellRender {
  constructor(props) {
    const el = document.createElement("div");
    this.el = el;
    this.render(props);
  }

  getElement() {
    return this.el;
  }

  render(props) {
    let value = lineBreak(props.value);
    this.el.innerHTML = String(value);
  }
}
