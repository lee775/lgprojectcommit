/**
 * interaction Table Load Service
 */
import lgepQueryUtils from 'js/utils/lgepQueryUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import viewModelObjectService from 'js/viewModelObjectService';

import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import { isTreeTable } from 'js/utils/fmeaViewCommonUtils';
import { getHeaderData, makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 *
 * @param {*} dataProvider
 */
const loadColumns = (dataProvider) => {
  const columns = [constants.COL_PART, constants.COL_EFFECT_TYPE];
  const columnHeader = getHeaderData(columns, 220);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

// 영향 주는 측
const loadDataInfluencing = async (ctx, data) => {
  const type = prop.SECONDARY_OBJECT;
  const interactionResult = await _getInteractionResult(ctx, data, type);
  const tableRows = await _makeTableRows(interactionResult, type);

  return {
    influencingResults: tableRows,
    influencingTotalFound: tableRows.length,
  };
};

// 영향 받는 측
const loadDataAffected = async (ctx, data) => {
  const type = prop.PRIMARY_OBJECT;
  const interactionResult = await _getInteractionResult(ctx, data, type);
  const tableRows = await _makeTableRows(interactionResult, type);

  return {
    affectedResults: tableRows,
    affecteTotalFound: tableRows.length,
  };
};

const _getInteractionResult = async (ctx, data, type) => {
  const selectRow = ctx[constants.INTERACTION_INIT_ROW_SELECT];
  const subAssy = await _getSubAssy(selectRow);
  const entries = _getEntries(type);
  const effectTypes = data.effectType.dbValue;

  let interactionResult = [];
  for (const effectType of effectTypes) {
    const queryResult = await _queryInteraction(entries, subAssy, effectType);
    if (queryResult) {
      interactionResult = [...interactionResult, ...queryResult];
    }
  }

  return interactionResult;
};

const _getPartName = (selectRow) => {
  if (selectRow[prop.SUB_ASSY]) {
    return selectRow[prop.SUB_ASSY].value;
  } else {
    return selectRow[prop.PARENT_ASSY].value;
  }
};

const _getEntries = (type) => {
  if (type === prop.SECONDARY_OBJECT) {
    return [prop.QUERY_ENTRY_PRIMARY_ID, prop.QUERY_ENTRY_PRIMARY_REV_ID, prop.QUERY_ENTRY_PRIMARY_NAME, prop.QUERY_ENTRY_SECONDARY_REV_ID];
  } else {
    return [prop.QUERY_ENTRY_SECONDARY_ID, prop.QUERY_ENTRY_SECONDARY_REV_ID, prop.QUERY_ENTRY_SECONDARY_NAME, prop.QUERY_ENTRY_PRIMARY_REV_ID];
  }
};

const _getSubAssy = async (selectRow) => {
  const props = [prop.ITEM_ID, prop.REVISION_ID, prop.OBJECT_NAME, prop.REVISION_ID];
  const type = prop.TYPE_FMEA_STRUCTURE_REV;
  const subAssyUid = _getStructureUidByTableMode(selectRow);
  const subAssy = await loadObjectByPolicy(subAssyUid, type, props);
  return subAssy;
};

const _getStructureUidByTableMode = (selectRow) => {
  if (isTreeTable()) {
    return selectRow.uid;
  } else {
    return selectRow.props[prop.SUB_ASSY].uid;
  }
};

const _makeTableRows = async (interactionResult, typeName) => {
  if (!interactionResult || interactionResult.length === 0) {
    return [];
  }

  let tableRows = [];
  for (const structure of interactionResult) {
    const uid = structure.props[typeName].dbValues[0];
    const structureObject = await loadObjectByPolicy(uid, prop.TYPE_FMEA_STRUCTURE_REV, [prop.OBJECT_NAME]);

    const tableRow = viewModelObjectService.createViewModelObject(structureObject);

    // add partname
    const partName = tableRow.props[prop.OBJECT_NAME].dbValues[0];
    const property = makeVmProperty(constants.PART_NAME, partName);
    tableRow.props[constants.PART_NAME] = property;

    // add effect type
    const effectType = structure.props[prop.INNTERACTION_TYPE].uiValues[0];
    const effectTypeProperty = makeVmProperty(prop.INNTERACTION_TYPE, effectType);
    tableRow.props[prop.INNTERACTION_TYPE] = effectTypeProperty;

    tableRows.push(tableRow);
  }

  return tableRows;
};

const _queryInteraction = async (entries, subAssy, effectType) => {
  const interactionResult = await lgepQueryUtils.executeSavedQuery(
    prop.QUERY_INTERACTION_RELATION,
    [...entries, prop.TYPE_INTERACTION],
    [
      subAssy.props[prop.ITEM_ID].dbValues[0],
      subAssy.props[prop.REVISION_ID].dbValues[0],
      subAssy.props[prop.OBJECT_NAME].dbValues[0],
      subAssy.props[prop.REVISION_ID].dbValues[0],
      effectType,
    ],
  );
  return interactionResult;
};

export default {
  loadColumns,
  loadDataInfluencing,
  loadDataAffected,
};
