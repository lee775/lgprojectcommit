import iconSvc from "js/iconService";
import treeView from "js/awTableService";
import appCtxService from "js/appCtxService";

import { tableRefresh } from "js/utils/fmeaViewCommonUtils";
import fmeaPopupUtils from "js/utils/fmeaPopupUtils";
import { loadObjectByPolicy } from "js/utils/fmeaTcUtils";
import { showErrorMessage } from "js/utils/fmeaMessageUtils";
import { getLangIndex } from "js/utils/fmeaCommonUtils";
import { loadTableDatas } from "js/dfmeaMasteTableInitLoadService";
import * as prop from "js/constants/fmeaProperty";
import * as constants from "js/constants/fmeaConstants";

/**
 * Tree Table Columns 생성
 * @param {TableDataProvider} dataProvider
 * @returns
 */
const loadColumns = (dataProvider) => {
  const columns = [constants.COL_OBJECT_NAME_LANG];
  const columnHeader = _getTreeHeaderData(columns);
  dataProvider.columnConfig = {
    columns: columnHeader,
  };
};

/**
 * 트리 테이블용 컬럼 생성
 * @param {string[]} columns
 * @returns
 */
const _getTreeHeaderData = (columns) => {
  const localIndex = getLangIndex();
  const headerData = columns.map((column) => {
    return {
      name: column[0],
      propertyName: column[0],
      displayName: column[localIndex],
      minWidth: 750,
      width: 750,
      isTreeNavigation: true,
    };
  });
  return headerData;
};

const loadData = async (ctx) => {
  const tableList = ctx[constants.FMEA_TABLE_LIST];
  if (!tableList || tableList.length === 0) {
    return [];
  }
  return tableList;
};

const reLoad = async (ctx) => {
  await loadTableDatas(ctx);
  tableRefresh("dfmeaTreeTable");
  fmeaPopupUtils.closePopup();
};

/**
 * TreeTable 리턴
 * @param {*} result
 * @param {*} nodeBeingExpanded
 * @returns {
 * childNodes : [ViewModelObject]
 * totalChildCount : number
 * }
 */
const loadTreeTableData = async (result, nodeBeingExpanded) => {
  try {
    const datas = _getDatas(result, nodeBeingExpanded);
    const moList = await _makeModelObject(datas);
    const resultNodes = await _makeTreeNode(moList, nodeBeingExpanded);

    return {
      parentNode: nodeBeingExpanded,
      childNodes: resultNodes,
      totalChildCount: resultNodes.length,
      startChildNdx: 0,
    };
  } catch (e) {
    showErrorMessage(e);
  }
};

/**
 * 해당 node getData
 * @param {[ViewModelObject]} result
 * @param {{}} nodeBeingExpanded
 * @returns {[ViewModelObject]}
 */
const _getDatas = (result, nodeBeingExpanded) => {
  if (nodeBeingExpanded.uid == "top") {
    const parentList = _getNodeInfoList(result);
    return parentList;
  } else {
    const childList = _getChildRow(nodeBeingExpanded);
    const nodeList = _getFilterChildList(childList);
    return nodeList;
  }
};

const _getFilterChildList = (tableList) => {
  const result = [];
  for (const row of tableList) {
    const isDuplicateLevel = _checkDuplicateLevel(result, row);
    if (!isDuplicateLevel) {
      const rowTypeLevel = row.typeLevel; // l2_parent_assy
      const rowType = _getType(rowTypeLevel); // L2_FMEA_FUNC_REV
      const treeInfo = {
        type: rowType,
        props: _getProps(rowType),
        typeLevel: rowTypeLevel,
      };
      row.treeInfo = treeInfo;
      result.push(row);
    }
  }
  return result;
};

const _getType = (typeLevel) => {
  switch (typeLevel) {
    case prop.PARENT_ASSY:
    case prop.SUB_ASSY:
    case constants.SINGLE_ITEM:
      return prop.TYPE_FMEA_STRUCTURE_REV;
    case prop.FUNCTION:
      return prop.TYPE_FMEA_FUNC_REVISION;
    default:
      return prop.TYPE_FMEA_FAILURE_REVISION;
  }
};

const propsInfo = [
  {
    type: prop.TYPE_FMEA_STRUCTURE_REV,
    props: [prop.OBJECT_NAME],
  },
  {
    type: prop.TYPE_FMEA_FUNC_REVISION,
    props: [prop.FUNCTION_SHORT, prop.FUNCTION, prop.REQUIREMENT],
  },
  {
    type: prop.TYPE_FMEA_FAILURE_REVISION,
    props: [
      prop.POTENTIAL_FAILURE_MODE_SHORT,
      prop.POTENTIAL_FAILURE_MODE,
      prop.CAUSE_OF_FAILURE,
      prop.FAILURE_EFFECT,
      prop.PRECATUIONS_ACTION,
      prop.DETECTION_ACTION,
    ],
  },
];

const _getProps = (type) => {
  for (const propInfo of propsInfo) {
    if (type === propInfo.type) {
      return propInfo.props;
    }
  }
};

// 레벨 같은 애들 찾아서 uid 비교
const _checkDuplicateLevel = (tableList, baseRow) => {
  const baseLevel = baseRow.typeLevel;
  const baseUid = baseRow[baseLevel].uid;
  for (const row of tableList) {
    const rowLevel = row.typeLevel;
    if (baseLevel === rowLevel) {
      if (baseUid === row[baseLevel].uid) {
        return row;
      }
    }
  }
  return null;
};

const _getChildRow = (node) => {
  const tableList = appCtxService.ctx[constants.FMEA_TABLE_LIST];

  const nodeType = node.typeLevel;

  const filterRows = _getRowsByUid(tableList, node);
  const childRows = filterRows.map((row) => {
    const result = _getChildRowByType(row, nodeType);
    return result;
  });
  return childRows;
};

const _getChildRowByType = (row, parentType) => {
  try {
    const childType = _getChildType(parentType);
    if (row[childType] && row[childType].uid) {
      return {
        ...row,
        typeLevel: childType,
      };
    }
    return _getChildRowByType(row, childType);
  } catch (e) {
    //console.log('_getChildRowByType', e);
  }
};

const _getRowsByUid = (tableList, node) => {
  const nodeUid = node.uid;
  const nodeType = node.typeLevel;
  const filterRows = tableList.filter((tableRow) => {
    if (tableRow[nodeType]) {
      return nodeUid === tableRow[nodeType].uid;
    }
  });
  return filterRows;
};

const _getChildType = (parentType) => {
  switch (parentType) {
    case prop.PARENT_ASSY:
      return prop.SUB_ASSY;
    case prop.SUB_ASSY:
      return constants.SINGLE_ITEM;
    case constants.SINGLE_ITEM:
      return prop.FUNCTION;
    case prop.FUNCTION:
      return prop.POTENTIAL_FAILURE_MODE;
    default:
      return null;
  }
};

const _getNodeInfoList = (tableList) => {
  const type = prop.PARENT_ASSY;
  const rowList = [];
  for (const tableRow of tableList) {
    const parentUid = tableRow[type].uid;
    const isAdd = _checkAblaeAdd(rowList, parentUid, type);
    if (isAdd) {
      const treeInfo = {
        type: prop.TYPE_FMEA_STRUCTURE_REV,
        props: [prop.OBJECT_NAME],
        typeLevel: type,
      };
      tableRow.treeInfo = treeInfo;
      rowList.push(tableRow);
    }
  }
  return rowList;
};

const _checkAblaeAdd = (rowList, uid, type) => {
  for (const row of rowList) {
    if (row[type].uid === uid) {
      return false;
    }
  }
  return true;
};

const _makeModelObject = async (rowList) => {
  const moList = [];
  for (const row of rowList) {
    const type = row.treeInfo.type;
    const treeInfoProps = _makeProps(row);
    const props = treeInfoProps;
    row.treeInfo.props = props;

    const typeLevel = row.treeInfo.typeLevel;
    const modelObject = await loadObjectByPolicy(row[typeLevel].uid, type);
    modelObject.treeInfo = row.treeInfo;
    moList.push(modelObject);
  }
  return moList;
};

const _makeProps = (row) => {
  const propNames = row.treeInfo.props;

  return propNames.map((propName) => {
    if (propName === prop.OBJECT_NAME) {
      const typeLevel = row.treeInfo.typeLevel;
      return {
        [typeLevel]: row[typeLevel].value,
      };
    }
    return {
      [propName]: row[propName].value,
    };
  });
};

const _getTreeName = (type, modelObject) => {
  switch (type) {
    case prop.TYPE_FMEA_STRUCTURE_REV:
      return modelObject.props[prop.OBJECT_NAME].dbValues[0];
    case prop.TYPE_FMEA_FUNC_REVISION:
      return _getShortPropValue(
        modelObject.treeInfo.props,
        prop.FUNCTION_SHORT
      );
    default:
      return _getShortPropValue(
        modelObject.treeInfo.props,
        prop.POTENTIAL_FAILURE_MODE_SHORT
      );
  }
};

const _getShortPropValue = (props, propName) => {
  for (const propData of props) {
    if (propData[propName]) {
      return propData[propName];
    }
  }
};

const _getModelType = (modelObject) => {
  if (modelObject.type === "BOMLine") {
    return prop.TYPE_FMEA_FAILURE_REVISION;
  }
  return modelObject.type;
};

/**
 * TreeTable 생성
 * @param {*} item
 * @param {*} nodeBeingExpanded
 * @returns
 */
const _makeTreeNode = async (moList, nodeBeingExpanded) => {
  const resultTreeNodes = [];
  for (const modelObject of moList) {
    const treeInfo = modelObject.treeInfo;
    const modelType = _getModelType(modelObject);

    const iconURL = iconSvc.getTypeIconURL(modelType);
    const isLeaf = modelType === prop.TYPE_FMEA_FAILURE_REVISION ? true : false;
    const name = _getTreeName(modelType, modelObject);

    const treeNode = treeView.createViewModelTreeNode(
      modelObject.uid,
      modelType,
      name,
      nodeBeingExpanded.levelNdx + 1,
      nodeBeingExpanded.levelNdx + 2,
      iconURL
    );
    const addInfo = {
      isLeaf: isLeaf,
      alternateID: treeNode.uid,
      origin: treeNode.uid,
      uid: treeNode.uid,
      levelNdx: nodeBeingExpanded.levelNdx + 1,
      props: treeInfo.props,
      typeLevel: treeInfo.typeLevel,
      modelObject: modelObject,
    };
    resultTreeNodes.push({
      ...treeNode,
      ...addInfo,
    });
  }
  return resultTreeNodes;
};

export default {
  loadColumns,
  loadData,
  loadTreeTableData,
  reLoad,
};
