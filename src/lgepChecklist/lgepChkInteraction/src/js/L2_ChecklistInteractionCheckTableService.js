import appCtxService from 'js/appCtxService';
import viewModelObjectService from 'js/viewModelObjectService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import { getHeaderData, makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import {
  getInteractionTable,
  PROP_PRIMARY,
  PROP_SECONDARY,
  INTERACTION_TARGET_ROW,
  TOP,
  STRUCTURE_INFO,
  PROP_GRADE,
  getInteractionType,
  INTERACTION_CHECK_ROW_CLASSNAME,
  INTERACTION_CHECK_ROW_KEYS,
  getSubAssy,
} from 'js/L2_ChecklistInteractionUtils';

const PART_NAME = 'part_name';
const INNTERACTION_TYPE = 'l2_interaction_type';

const loadColumns = (dataProvider) => {
  const COL_PART = [PART_NAME, '파트', 'Part'];
  const COL_EFFECT_TYPE = ['l2_interaction_type', '영향', 'Effect Type'];

  const columns = [COL_PART, COL_EFFECT_TYPE];
  const columnHeader = getHeaderData(columns, 220);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

// 영향 주는 측
const loadDataInfluencing = async (data) => {
  const tableRows = await _getInteractionTable(PROP_PRIMARY, PROP_SECONDARY, data);
  let results = deduplication(tableRows);
  return {
    influencingResults: results,
    influencingTotalFound: results.length,
  };
};

// 영향 받는 측
const loadDataAffected = async (data) => {
  const tableRows = await _getInteractionTable(PROP_SECONDARY, PROP_PRIMARY, data);
  let results = deduplication(tableRows);
  return {
    affectedResults: results,
    affecteTotalFound: results.length,
  };
};

function isDuplicate(tableRows) {
  const isDup = tableRows.some(function (x) {
    return tableRows.indexOf(x) !== tableRows.lastIndexOf(x);
  });
  console.log('isDup', isDup);
  return isDup;
}

// 임시
const deduplication = (tableRows) => {
  let dupMap = new Map();
  for (const tableRow of tableRows) {
    dupMap.set(tableRow.uid, tableRow);
  }
  return Array.from(dupMap.values());
};

// const deduplication = (tableRows) => {
//   console.log('tableRows', tableRows);
//   let dupMap = new Map();
//   for (const tableRow of tableRows) {
//     dupMap.set(tableRow.uid, tableRow);
//   }
//   return Array.from(dupMap.values());
// };

const _checkEffectType = (targetEffectType, effectTypes) => {
  for (const effectType of effectTypes) {
    if (targetEffectType === effectType) {
      return true;
    }
  }

  return false;
};

const _delete = async (interactionTable) => {
  for (const interactionRow of interactionTable) {
    console.log('interactionRow', interactionRow);
    const result = await lgepObjectUtils.deleteObject(interactionRow);
    console.log('result', result);
  }
};

const _getInteractionTable = async (targetType, tableRowType, data) => {
  const effectTypes = data.effectType.dbValue;

  const topObject = appCtxService.ctx.checklist[STRUCTURE_INFO][TOP].getOriginalObject();

  const targetUid = getSubAssy(appCtxService.ctx.checklist[INTERACTION_TARGET_ROW]).uid;

  const interactionTable = await getInteractionTable(topObject);

  const interactionResult = interactionTable.filter((tableRow) => {
    if (targetUid === tableRow.props[targetType].dbValues[0]) {
      if (_checkEffectType(tableRow.props[PROP_GRADE].dbValues[0], effectTypes)) return tableRow;
    }
  });

  const tableRows = await _makeTableRows(interactionResult, tableRowType);
  const filterRows = _getInteractionTableRowByCurrentRow(tableRows);

  const sortTableRows = _sortTable(filterRows);

  return sortTableRows;
};

// 구조 편집되어 현재는 없는 행 존재 가능성 있음
const _getInteractionTableRowByCurrentRow = (tableRows) => {
  const grid = appCtxService.ctx.checklist.grid;
  const rows = grid.getData();
  return tableRows.filter((tableRow) => {
    for (const currentRow of rows) {
      if (tableRow.uid === getSubAssy(currentRow).uid) {
        return true;
      }
    }
  });
};

const _sortTable = (tableRows) => {
  return tableRows.sort(function (a, b) {
    if (a.props[INNTERACTION_TYPE].value <= b.props[INNTERACTION_TYPE].value) {
      return -1;
    }
    return 1;
  });
};

const _makeTableRows = async (interactionResult, type) => {
  if (!interactionResult || interactionResult.length === 0) {
    return [];
  }
  const tableRows = Promise.all(
    interactionResult.map(async (interaction) => {
      const structureObject = await loadObjectByPolicy(interaction.props[type].dbValues[0], 'L2_StructureRevision', ['object_name']);
      const tableRow = viewModelObjectService.createViewModelObject(structureObject);

      // add partname
      const partName = tableRow.props.object_name.dbValues[0];
      const property = makeVmProperty(PART_NAME, partName);
      tableRow.props[PART_NAME] = property;

      // add effect type
      const effectType = getInteractionType(interaction.props[PROP_GRADE].dbValues[0]);
      const effectTypeProperty = makeVmProperty(INNTERACTION_TYPE, effectType);
      tableRow.props[INNTERACTION_TYPE] = effectTypeProperty;

      return tableRow;
    }),
  );

  return tableRows;
};

// 영향성 체크 테이블 행 선택 이벤트
const selectTableRowAction = (interactionRow, ctx) => {
  resetCheckRows(ctx);
  const grid = ctx.checklist.grid;
  const rows = grid.getData();

  // 하이라이트 및 스크롤
  const checkKeys = rows.filter((row) => {
    if (interactionRow.uid === getSubAssy(row).uid) {
      grid.addRowClassName(row.rowKey, INTERACTION_CHECK_ROW_CLASSNAME);
      return row;
    }
  });

  ctx.checklist[INTERACTION_CHECK_ROW_KEYS] = checkKeys;
  grid.focusAt(grid.getIndexOfRow(checkKeys[0].rowKey), 0, true);
};

// 영향성 체크 행 리셋 (ctx, css)
export const resetCheckRows = (ctx) => {
  const grid = ctx.checklist.grid;
  const rowKeys = ctx.checklist[INTERACTION_CHECK_ROW_KEYS];
  if (!rowKeys) {
    return;
  }
  for (const row of rowKeys) {
    grid.removeRowClassName(row.rowKey, INTERACTION_CHECK_ROW_CLASSNAME);
  }

  delete ctx.checklist[INTERACTION_CHECK_ROW_KEYS];
};

export default {
  loadColumns,
  loadDataInfluencing,
  loadDataAffected,
  selectTableRowAction,
};
