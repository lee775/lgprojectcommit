import appCtxService from 'js/appCtxService';

import { langIndex } from 'js/dfmeaMasterImageTableService';
import { addChangeRow, setChangeEditRows } from 'js/dfmeaMasterRowEditService';
import { calculateAp } from 'js/calculationActionPriority';
import * as constants from 'js/constants/fmeaConstants';

// 등급 get
export const getGradeValue = (selectRow) => {
  const selectGrade = selectRow[constants.COL_GRADE[langIndex]];
  return selectGrade;
};

export const addChangeRowByGrade = (gradeValue, mainGrid) => {
  const toastGridCell = mainGrid.getFocusedCell();

  const propName = _getPropName(toastGridCell.columnName);
  _addChangeRow(propName, gradeValue);

  const row = mainGrid.getRow(toastGridCell.rowKey);
  _setResultAp(row, mainGrid);
};

const _setResultAp = (row, mainGrid) => {
  // sev, occ, det 값이 전부 다 들어있을 경우
  const resultSeverity = row[constants.COL_RESULT_SEVERITY_LANG[langIndex]];
  const resultOccurence = row[constants.COL_RESULT_OCCURENCE_LANG[langIndex]];
  const resultDetection = row[constants.COL_RESULT_DETECTION_LANG[langIndex]];

  if (
    resultSeverity === '' ||
    resultOccurence === '' ||
    resultDetection === ''
  ) {
    return;
  }

  const resultAP = calculateAp(
    resultSeverity,
    resultOccurence,
    resultDetection
  );

  mainGrid.setValue(
    row.rowKey,
    constants.COL_RESULT_AP_LANG[langIndex],
    resultAP
  );

  _addChangeRow(constants.COL_RESULT_AP_LANG[0], resultAP);
};

const _addChangeRow = (propName, value) => {
  const changeRow = {
    [propName]: { value },
    row: appCtxService.ctx[constants.ROW_SELECT],
  };
  addChangeRow(changeRow, propName);
};

const _setEmptyValueOnChangeRow = (changeRow, propName) => {
  if (!changeRow) {
    _addChangeRow(propName, '');
    return;
  } else {
    changeRow[propName] = { value: '' };
  }
};

const _checkDeleteChangeRow = (changeRow) => {
  if (!changeRow) {
    return false;
  }
  const keys = Object.keys(changeRow);
  if (keys.length <= 1) {
    return true;
  }
  return false;
};

const _getPropName = (columnName) => {
  switch (columnName) {
    case constants.COL_SEVERITY_LANG[langIndex]:
      return constants.COL_SEVERITY_LANG[0];
    case constants.COL_OCCURENCE_LANG[langIndex]:
      return constants.COL_OCCURENCE_LANG[0];
    case constants.COL_DETECTION_LANG[langIndex]:
      return constants.COL_DETECTION_LANG[0];
    case constants.COL_RESULT_SEVERITY_LANG[langIndex]:
      return constants.COL_RESULT_SEVERITY_LANG[0];
    case constants.COL_RESULT_OCCURENCE_LANG[langIndex]:
      return constants.COL_RESULT_OCCURENCE_LANG[0];
    case constants.COL_RESULT_DETECTION_LANG[langIndex]:
      return constants.COL_RESULT_DETECTION_LANG[0];
  }
};

/** Reset Btn Event */
export const resetBtnEvent = (mainGrid) => {
  const selectCell = mainGrid.getFocusedCell();
  _resetChangeRowByGrade(selectCell.columnName);
  mainGrid.setValue(selectCell.rowKey, selectCell.columnName, ' ');

  mainGrid.setValue(
    selectCell.rowKey,
    constants.COL_RESULT_AP_LANG[langIndex],
    ' '
  );

  _addChangeRow(constants.COL_RESULT_AP_LANG[0], '');
};

const _resetChangeRowByGrade = (resetColumn) => {
  const propName = _getPropName(resetColumn);
  const currentSelectRow = appCtxService.ctx[constants.ROW_SELECT];

  const changeRows =
    appCtxService.ctx[constants.CHANGE_INFO][constants.CHANGE_EDIT_ROWS];
  const currentChagneRow = _getCurrentChangeRow(changeRows, currentSelectRow);

  // 2. set empty value / delete prop
  _setEmptyValueOnChangeRow(currentChagneRow, propName);

  // 3. 그 외 아무 속성 없으면 해당 체인지 로우 삭제
  const isDeleteRow = _checkDeleteChangeRow(currentChagneRow);
  if (isDeleteRow) {
    const resultChangeRows = changeRows.filter(
      (row) => row.row.props.uid !== currentChagneRow.row.props.uid
    );
    setChangeEditRows(resultChangeRows);
  }
};

const _getCurrentChangeRow = (changeRows, currentSelectRow) => {
  for (const changeRow of changeRows) {
    if (changeRow.row.props.uid === currentSelectRow.props.uid) {
      return changeRow;
    }
  }
};
