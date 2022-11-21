import app from 'app';

import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import { ERROR, show, INFORMATION } from 'js/utils/lgepMessagingUtils';

import { checklistColumns, getLocalizedText } from 'js/utils/checklistUtils';
import { gridSelectionChangedEvent, initializeByFilterClose } from 'js/L2_ChecklistMainService';

import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

let exports;

const BASE_MAX_COUNT = 5; // 처음 가져올 필터 조건 개수
const LOAD_MORE = 'more';
const LOAD_LESS = 'less';
const LOAD_NONE = 'none';
const PANEL_SIZE = 360;

// ModelObject에서 가져올 조건들
const FILTER_MODEL_CONDITIONS = [
  { name: 'Name', propName: 'object_name' },
  { name: 'Project Name', propName: 'l2_current_project' },
  { name: 'Product Type', propName: 'l2_product_type' },
  { name: 'Product Class', propName: 'l2_product_class' },
  { name: 'Module Name', propName: 'l2_module_name' },
];

// row에서 바로 가져올 수 있는 조건들
const FILTER_ROW_CONDITIONS = [
  { name: 'Creation User', propName: 'creator' },
  { name: 'Product ID', propName: 'productId' },
];

let grid;
let originTableWidth;
let filterResult = [];
let selectedList = {
  Name: [],
  'Project Name': [],
  'Creation User': [],
  'Product Type': [],
  'Product Class': [],
  'Product ID': [],
  'Module Name': [],
};

/**
 * 필터 패널 오픈
 */
export function openFilterPanel() {
  const treeGrid = appCtxService.ctx.checklist.list;
  if (!treeGrid.getData()[0].id) {
    show(INFORMATION, getLocalizedText('warnShowFilterPanel'));
    return;
  }
  const gridContainer = document.querySelector(`#${treeGrid.el.id} .tui-grid-container`);
  originTableWidth = gridContainer.offsetWidth;

  const panelId = 'checklist_main_filter';
  const panelView = 'L2_ChecklistFilter';
  const data = {
    id: panelId,
    includeView: panelView,
    closeWhenCommandHidden: true,
    keepOthersOpen: false,
    commandId: panelId,
    config: {
      width: 'STANDARD',
    },
  };
  eventBus.publish('awsidenav.openClose', data);
}

/**
 * 필터 버튼 클릭 시 전체 필터 조건 목록 조회 후 ctx 저장
 */
export function onInit() {
  const treeGrid = appCtxService.ctx.checklist.list;
  const revRows = treeGrid.getData().filter((row) => row.type === 'L2_StructureRevision');

  let filterConditions = {};

  const revList = revRows.map((row) => row.getObject());
  for (const condition of FILTER_MODEL_CONDITIONS) {
    const { name, propName } = condition;
    const list = revList.filter((rev) => rev.props[propName].dbValues[0]).map((v) => v.props[propName].dbValues[0]);
    const filterList = list.filter((v, i) => list.indexOf(v) === i); // 중복 제거
    const conditionObj = {
      [name]: {
        list: filterList,
        currentLoadCount: BASE_MAX_COUNT,
        totalCount: filterList.length,
        moreStatus: _isConditionLoadMore(BASE_MAX_COUNT, filterList.length),
      },
    };
    filterConditions = { ...filterConditions, ...conditionObj };
  }
  // item의 productId가져와서 prop에 넣어주기
  for (const revRow of revRows) {
    const item = _getItemByRev(revRow.id);
    revRow.productId = item.productId;
  }

  for (const condition of FILTER_ROW_CONDITIONS) {
    const { name, propName } = condition;
    const list = revRows.map((row) => row[propName]);
    const filterList = list.filter((v, i) => list.indexOf(v) === i);
    const conditionObj = {
      [name]: {
        list: filterList,
        currentLoadCount: BASE_MAX_COUNT,
        totalCount: filterList.length,
        moreStatus: _isConditionLoadMore(BASE_MAX_COUNT, filterList.length),
      },
    };
    filterConditions = { ...filterConditions, ...conditionObj };
  }

  const originRows = revRows.map((row) => {
    const rev = lgepObjectUtils.getObject(row.id);
    row.prop = rev;
    const originRow = { ...row };
    return originRow;
  });

  appCtxService.ctx.checklist.filterConditions = filterConditions;
  appCtxService.ctx.checklist.filterOriginRows = originRows; // 원본 저장

  const grid = appCtxService.ctx.checklist.list;
  const gridContainer = document.querySelector(`#${grid.el.id} .tui-grid-container`);
  const changeWidth = gridContainer.offsetWidth - PANEL_SIZE;
  gridContainer.style.width = `${changeWidth}px`;
  grid.refreshLayout();
}

function _getItemByRev(revId) {
  const treeGrid = appCtxService.ctx.checklist.list;
  const itemRows = treeGrid.getData().filter((row) => row.type === 'L2_Structure');
  for (const itemRow of itemRows) {
    const children = itemRow._children;
    for (const child of children) {
      if (revId === child.id) {
        return itemRow;
      }
    }
  }
}

function _isConditionLoadMore(currentLoadCount, totalCount) {
  // 더보여줘야하는지 여부
  if (currentLoadCount < totalCount) {
    // 보여줄게 더 많으면
    return LOAD_MORE;
  } else if (currentLoadCount > totalCount) {
    return LOAD_NONE;
  } else if (currentLoadCount == totalCount) {
    return LOAD_NONE;
  }
}

/**
 * 필터 조건 리스트 리턴
 * @param {*} data
 */
export function loadConditions(data, dataProvider, conditionName) {
  dataProvider.json.response = [];
  const conditions = appCtxService.ctx.checklist.filterConditions[conditionName];
  const conditionList = conditions.list;
  for (let index = 0; index < conditionList.length; index++) {
    const dataName = conditionName + index;
    const condition = conditionList[index];
    const listValue = {
      [dataName]: {
        propertyName: condition,
        propertyDisplayName: condition,
        type: 'BOOLEAN',
        displayValues: [condition],
        isEnabled: true,
        isEditable: true,
        propertyLabelDisplay: 'PROPERTY_LABEL_AT_RIGHT',
      },
    };
    if (!data[dataName]) {
      Object.assign(data, listValue);
    }
    const maxCount = _getConditionLoadCount(conditions);
    if (index < maxCount) {
      dataProvider.json.response.push(`{{data.${dataName}}}`);
    }
  }
}

function _getConditionLoadCount(conditions) {
  // more이면, noen 이면 max 다
  const status = conditions.moreStatus;
  if (status === LOAD_NONE || status === LOAD_MORE) {
    return conditions.currentLoadCount;
  } else {
    // less면 totalCount
    return conditions.totalCount;
  }
}

/**
 * 더보기/더적게 클릭
 * @param {*} conditionName
 */
export function loadChangeConditinos(conditionName) {
  const changeStatus = appCtxService.ctx.checklist.filterConditions[conditionName].moreStatus === LOAD_MORE ? LOAD_LESS : LOAD_MORE;
  appCtxService.ctx.checklist.filterConditions[conditionName].moreStatus = changeStatus;

  eventBus.publish('checklist.filter.viewChange');
}

/**
 * 필터 조건 체크박스 선택 이벤트
 * @param {*} data
 * @param {*} dataProvider
 */
export function selectFilterCondition(data, dataProvider, conditionName) {
  _checkSelected(dataProvider, conditionName);

  if (filterResult.length !== 0) {
    eventBus.publish('checklist.filter.resetReSearch');
  }

  _filtering(data);
  filterResult = _getFilterTreeData();

  _checkDate();

  _refreshFilterTable();
}

/**
 * 날짜 체크
 */
function _checkDate() {
  const startDate = appCtxService.ctx.checklist.filterConditions.startDate;
  const endDate = appCtxService.ctx.checklist.filterConditions.endDate;

  filterResult = filterResult.filter((filterRow) => {
    const filterRowCreateDate = _getDate(filterRow.createDate);
    return _compareDate(startDate, endDate, filterRowCreateDate);
  });
}

function _compareDate(startDate, endDate, filterRowCreateDate) {
  if (!startDate && !endDate) {
    return true;
  }
  if (startDate && !endDate) {
    if (startDate <= filterRowCreateDate) {
      return true;
    }
  }
  if (!startDate && endDate) {
    if (endDate >= filterRowCreateDate) {
      return true;
    }
  }
  if (startDate && endDate) {
    if (startDate <= filterRowCreateDate && endDate >= filterRowCreateDate) {
      return true;
    }
  }

  return false;
}

function _getDate(dateString) {
  if (!dateString) {
    return null;
  }
  return new Date(dateString);
}

/**
 * 체크박스 선택 목록
 * @param {*} dataProvider
 * @param {*} conditionName
 */
function _checkSelected(dataProvider, conditionName) {
  const loadedVMObjects = dataProvider.viewModelCollection.loadedVMObjects;
  let selected = [];
  for (const vmObject of loadedVMObjects) {
    if (!vmObject.dbValue) {
      // 체크박스 제거
      selected = selected.filter((s) => vmObject.propertyName !== s.propertyName);
    } else {
      // 체크박스 추가
      selected.push(vmObject);
    }
  }
  selectedList[conditionName] = selected;
}

/**
 * 체크박스 선택 목록을 기준으로 필터된 테이블 오픈
 */
async function _refreshFilterTable() {
  if (appCtxService.ctx.checklist.browseMode != '2') {
    appCtxService.ctx.checklist.browseMode = '2';
  }
  if (!grid) {
    await _makeTable();
  }
  grid.resetData(filterResult);

  grid.on('click', gridSelectionChangedEvent);
}

function _filtering() {
  filterResult = [];

  // 필터 실행은 했으나 아무 조건도 선택하지 않았을 경우 -> 다시 전체 보여줌
  if (_checkEmptySelected() && filterResult.length === 0) {
    const originRows = appCtxService.ctx.checklist.filterOriginRows;
    for (const originRow of originRows) {
      if (_checkExistRow(originRow)) {
        filterResult.push(originRow);
      }
    }
    return;
  }

  for (const modelCondition of FILTER_MODEL_CONDITIONS) {
    _executeFilter(modelCondition, true);
  }

  for (const rowCondition of FILTER_ROW_CONDITIONS) {
    _executeFilter(rowCondition, false);
  }
}

function _checkEmptySelected() {
  const selectedListKeys = Object.keys(selectedList);
  for (const key of selectedListKeys) {
    if (selectedList[key].length > 0) {
      return false;
    }
  }
  return true;
}

/**
 * 해당 filterRow를 가진 부모 노드 get
 * @returns
 */
function _getFilterTreeData() {
  const treeGrid = appCtxService.ctx.checklist.list;
  const itemRows = treeGrid.getData().filter((row) => row.type === 'L2_Structure');
  let treeData = [];
  for (const itemRow of itemRows) {
    const children = itemRow._children;
    for (const child of children) {
      for (const filterRow of filterResult) {
        if (filterRow.id === child.id) {
          treeData.push(itemRow);
        }
      }
    }
  }

  const treeResultData = treeData.filter((element, index) => treeData.indexOf(element) === index);
  return treeResultData;
}

/**
 * 필터 테이블 생성
 */
async function _makeTable() {
  const tableId = 'filterGrid';
  let times = 0;

  while (!document.getElementById(tableId) || times > 10) {
    await lgepCommonUtils.delay(100);
    times++;
  }

  const options = {
    el: document.getElementById(tableId),
    bodyHeight: document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 160,
    width: document.getElementsByName('L2_ChecklistMain')[0].offsetWidth - (PANEL_SIZE + 30),
    treeColumnOptions: {
      name: 'name',
      useCascadingCheckbox: true,
    },
    columns: checklistColumns(),
    columnOptions: {
      frozenCount: 1,
      frozenBorderWidth: 2,
      resizable: true,
    },
    rowHeaders: [{ type: 'checkbox' }],
  };

  // Grid.applyTheme('custom', {
  //   row: {
  //     hover: {
  //       background: '#e5f6ff',
  //     },
  //   },
  // });

  if (appCtxService.ctx.theme == 'ui-lgepDark') {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#444a4e',
        background: '#282d33',
      },
      row: {
        hover: {
          background: 'rgb(56, 66, 77)',
        },
      },
    });
  } else {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#eee',
        background: '#fff',
      },
      row: {
        hover: {
          background: '#e5f6ff',
        },
      },
    });
  }

  grid = new Grid(options);
}

/**
 *
 * @param {*} param0
 * @param {boolean} isModelCondition
 * @returns
 */
function _executeFilter({ name, propName }, isModelCondition) {
  const selectedArray = selectedList[name];
  // 다음 조건 선택 하지 않은 경우 ex) Project Name
  if (selectedArray.length === 0) {
    return;
  }

  const originRows = appCtxService.ctx.checklist.filterOriginRows;
  // 체크한 조건 별 필터 실행
  // 아직 아무필터 안걸렸을 경우
  if (filterResult.length === 0) {
    for (const originRow of originRows) {
      let isPush;
      if (isModelCondition) {
        isPush = _filterCheckByModelCondition(selectedArray, originRow, propName);
      } else {
        isPush = _filterCheckByRowCondition(selectedArray, originRow, propName);
      }
      if (isPush) {
        if (_checkExistRow(originRow)) {
          filterResult.push(originRow);
        }
      }
    }
    return;
  }

  // 현재 조건에 필터된 로우가 나머지 조건에 해당되는지 확인
  const otherSelectedList = { ...selectedList };
  delete otherSelectedList[name];

  let removeRows = []; // 제거 대상
  for (const filterRow of filterResult) {
    let isCorrect;
    if (isModelCondition) {
      isCorrect = _filterCheckByModelCondition(selectedArray, filterRow, propName);
    } else {
      isCorrect = _filterCheckByRowCondition(selectedArray, filterRow, propName);
    }
    if (!isCorrect) {
      removeRows.push(filterRow);
    }
  }
  _removeRowFiltering(removeRows);
}

// 최종 필터링
function _removeRowFiltering(removeRows) {
  if (removeRows.length === 0) {
    return;
  }
  filterResult = filterResult.filter((filterRow) => {
    for (const removeRow of removeRows) {
      if (filterRow.id === removeRow.id) {
        return false;
      }
    }
    return true;
  });
}

// 해당 row가 필터 조건에 해당되는지 확인
function _filterCheckByModelCondition(selectedList, row, propName) {
  for (const selectedArray of selectedList) {
    if (selectedArray.propertyName == row.prop.props[propName].dbValues[0]) {
      return true;
    }
  }
  return false;
}

// 해당 row가 필터 조건에 해당되는지 확인
function _filterCheckByRowCondition(selectedArray, row, propName) {
  for (const selected of selectedArray) {
    if (selected.propertyName == row[propName]) {
      return true;
    }
  }
  return false;
}

/**
 * 필터 로우 중복 제거
 * @param {*} originRow
 * @returns
 */
function _checkExistRow(originRow) {
  const existRow = filterResult.filter((filterRow) => filterRow.id === originRow.id);
  if (existRow.length === 0) {
    return true;
  }
  return false;
}

/**
 * 필터 패널 닫기 이벤트
 */
export async function unMount(data, ctx) {
  filterResult = [];
  selectedList = {
    Name: [],
    'Project Name': [],
    'Creation User': [],
    'Product Type': [],
    'Product Class': [],
    'Product ID': [],
    'Module Name': [],
  };

  delete appCtxService.ctx.checklist.filterOriginRows;
  delete appCtxService.ctx.checklist.filterConditions;
  delete appCtxService.ctx.checklist.moreConditions;

  initializeByFilterClose(data, ctx);
  refreshOriginTable();

  if (grid) {
    grid.destroy();
    grid = null;
  }
}

export async function refreshOriginTable() {
  let times = 0;
  while (!document.getElementById('grid') || times > 10) {
    await lgepCommonUtils.delay(100);
    times++;
  }
  const treeGrid = appCtxService.ctx.checklist.list;
  const gridContainer = document.querySelector(`#${treeGrid.el.id} .tui-grid-container`);
  gridContainer.style.width = `${originTableWidth}px`;
  treeGrid.refreshLayout();
}

/**
 * 날짜 검색 버튼 클릭
 * 아이템 기준
 */
function filteringByDate(data) {
  const startDate = _getDate(data.startDate.uiValue);
  const endDate = _getDate(data.endDate.uiValue);
  if (startDate && endDate && startDate > endDate) {
    show(ERROR, getLocalizedText('invalidDate', 'UIMessages'));
    return;
  }

  appCtxService.ctx.checklist.filterConditions.startDate = startDate;
  appCtxService.ctx.checklist.filterConditions.endDate = endDate;

  if (filterResult.length !== 0) {
    eventBus.publish('checklist.filter.resetReSearch');
  }

  _filtering();

  filterResult = _getFilterTreeData();

  _checkDate();
  _refreshFilterTable();
}

function searchFilterAttr(data) {
  let researchValue = data.attrSearchBox.dbValue;

  _filtering();
  filterResult = _getFilterTreeData();
  _checkDate();
  _refreshFilterTable();

  // 기존 검색 조건대로 필터링 한 후에
  // filter 결과 있을 경우에만 재검색 가능
  if (filterResult.length == 0) {
    return;
  }

  if (researchValue) {
    researchValue = researchValue.toLowerCase();
    filterResult = filterResult.filter((filterRow) => {
      const rowValueFilterResult = _reSearchByFilterRowValue(filterRow, researchValue);
      if (filterRow.getObject().props.object_name.dbValues[0].toLowerCase().includes(researchValue)) {
        return true;
      }
      if (rowValueFilterResult) {
        return true;
      }
      if (!rowValueFilterResult) {
        return _reSearchByFilterRevValue(filterRow, researchValue);
      }
    });
    _refreshFilterTable();
  }
}

function _reSearchByFilterRowValue(filterRow, researchValue) {
  for (const rowCondition of FILTER_ROW_CONDITIONS) {
    const { propName } = rowCondition;
    const rowValue = filterRow[propName];
    if (rowValue && rowValue.toLowerCase().includes(researchValue)) {
      return true;
    }
  }
  return false;
}

function _reSearchByFilterRevValue(filterRow, researchValue) {
  for (const childRow of filterRow._children) {
    for (const modelCondition of FILTER_MODEL_CONDITIONS) {
      const { propName } = modelCondition;
      const rowValue = childRow.getObject().props[propName].dbValues[0];
      if (rowValue && rowValue.toLowerCase().includes(researchValue)) {
        return true;
      }
    }
  }
}

function resetReSearchValue(data) {
  data.attrSearchBox.dbValue = '';
}

export default exports = {
  onInit,
  openFilterPanel,
  loadConditions,
  selectFilterCondition,
  loadChangeConditinos,
  unMount,
  filteringByDate,
  searchFilterAttr,
  resetReSearchValue,
};

app.factory('lgepChecklistMainService', () => exports);
