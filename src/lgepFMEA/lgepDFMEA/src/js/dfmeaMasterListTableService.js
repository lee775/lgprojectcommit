import iconSvc from 'js/iconService';
import treeView from 'js/awTableService';
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import queryUtil from 'js/utils/lgepQueryUtils';

import fmeaTableSortFilterUtils from 'js/utils/fmeaTableSortFilterUtils';
import { showInfoMessage, showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { navigationFmea, getLangIndex, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const commonProps = [prop.OBJECT_NAME, prop.OWNING_USER, prop.CREATION_DATE];

const columns = [constants.COL_OBJECT_NAME_LANG, constants.COL_REVISION_ID, constants.COL_OWNING_USER_LANG, constants.COL_CREATION_DATE_LANG];

/**
 * Tree Table Columns 생성
 * @param {TableDataProvider} dataProvider
 * @returns
 */
const loadColumns = (dataProvider) => {
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
  const headerData = columns.map((column, index) => {
    const isFirstCol = index === 0 ? true : false;
    return {
      name: column[0],
      propertyName: column[0],
      displayName: column[localIndex],
      minWidth: 150,
      width: isFirstCol ? 600 : 200,
      isTreeNavigation: isFirstCol,
      pinnedLeft: isFirstCol ? true : false,
    };
  });
  return headerData;
};

/**
 * 제품명 별 Checklist 검색 결과 리턴
 * @returns {[ModelObject]}
 */
const loadData = async (ctx) => {
  return [];
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
    const productInfo = await initGroupProuct();
    const product = productInfo.value;
    const queryResults = await queryUtil.executeSavedQuery(prop.QUERY_DFMEA_MASTER, prop.QUERY_DFMEA_MASTER_PRODUCT, product);
    const datas = await _getDatas(queryResults, nodeBeingExpanded);
    const resultNodes = await Promise.all(
      datas.map(async (item) => {
        return await _makeTreeNode(item, nodeBeingExpanded);
      }),
    );
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

const _removeDuplicateChildren = (nodeBeingExpanded) => {
  // TODO :: 개정 시 로직 변경 필요
  const children = nodeBeingExpanded.children;
  if (children && children.length >= 2) {
    nodeBeingExpanded.childNodes = [];
  }
};

/**
 * 해당 node getData
 * @param {[ViewModelObject]} result
 * @param {{}} nodeBeingExpanded
 * @returns {[ViewModelObject]}
 */
const _getDatas = async (result, nodeBeingExpanded) => {
  if (nodeBeingExpanded.uid == 'top') {
    return await _getTopNodeDatas(result);
  }
  return await _getDataByTopNode(nodeBeingExpanded);
};

const _getTopNodeDatas = async (result) => {
  await lgepObjectUtils.getProperties(result, commonProps);
  const sortResult = fmeaTableSortFilterUtils.sortDesc(result); // 기본 내림차순
  return sortResult;
};

const _getDataByTopNode = async (nodeBeingExpanded) => {
  const item = await lgepObjectUtils.getObject(nodeBeingExpanded.uid);
  await lgepObjectUtils.getProperties([item], [prop.REVISION_LIST]);
  const revisionUids = item.props[prop.REVISION_LIST].dbValues;
  const result = await Promise.all(
    revisionUids.map(async (uid) => {
      const revision = lgepObjectUtils.getObject(uid);
      await lgepObjectUtils.getProperties([revision], [...commonProps, prop.REVISION_ID]);
      return revision;
    }),
  );
  return result;
};

/**
 * TreeTable 생성
 * @param {*} item
 * @param {*} nodeBeingExpanded
 * @returns
 */
const _makeTreeNode = async (item, nodeBeingExpanded) => {
  const iconURL = iconSvc.getTypeIconURL(item.type);
  const isLeaf = item.type === prop.TYPE_DFMEA_MASTER_ITEM ? false : true;
  const name = isLeaf ? item.props[prop.OBJECT_NAME].dbValues[0] : item.props[prop.OBJECT_STRING].dbValues[0];

  const treeNode = treeView.createViewModelTreeNode(item.uid, item.type, name, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, iconURL);
  const addInfo = {
    isLeaf: isLeaf,
    alternateID: treeNode.uid,
    origin: treeNode.uid,
    uid: treeNode.uid,
    levelNdx: nodeBeingExpanded.levelNdx + 1,
    props: item.props,
  };
  for (const propKey of commonProps) {
    let value = addInfo.props[propKey].dbValues[0];
    if (propKey === prop.OWNING_USER || propKey === prop.CREATION_DATE) {
      value = addInfo.props[propKey].uiValues[0];
    }
    _addTreePropData(addInfo.props, propKey, value);
  }
  if (item.type !== prop.TYPE_DFMEA_MASTER_ITEM) {
    _addTreePropData(addInfo.props, prop.REVISION_ID, addInfo.props[prop.REVISION_ID].dbValues[0]);
  }
  return {
    ...treeNode,
    ...addInfo,
  };
};

/**
 * TreeNode 생성
 * @param {{}} props
 * @param {string} key
 * @param {string} value
 */
const _addTreePropData = (props, key, value) => {
  props[key].type = 'STRING';
  props[key].isEnabled = true;
  props[key].name = key;
  props[key].propertyName = key;
  props[key].value = value;
  props[key].uiValue = value;
  props[key].displayValues = [value];
};

/**
 * 테이블에서 선택한 ViewModelObject uid ctx 저장
 * 페이지 전환
 * @param {ViewModelObject} currentNode
 * @param {*} ctx
 */
const selectTableRowAction = async (currentNode, ctx) => {
  const dfmeaMasterRev = await lgepObjectUtils.getObject(currentNode.uid);
  appCtxService.registerCtx(constants.FMEA_SELECT, dfmeaMasterRev);
  if (currentNode.type === prop.TYPE_DFMEA_MASTER_REVISION) {
    navigationFmea(dfmeaMasterRev);
  }
};

export default {
  loadColumns,
  loadData,
  loadTreeTableData,
  selectTableRowAction,
};
