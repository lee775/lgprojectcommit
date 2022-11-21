/**
 *
 * @module js/chipForPaginationService
 */
import app from 'app';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
var $ = require('jQuery');

let nowPage = 0;
let showPage = 0;
let maxPage = 0;
let AllPage = [];

export async function setInitPageNumber(subPanelContext) {
  //console.log("subPanelContext", subPanelContext);
  showPage = subPanelContext.subContext.value;

  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 100,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: 0,
  };

  let params = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [],
      },
    ],
    // "useRefCount": false
  };

  for (let prop of subPanelContext.propsName) {
    params.types[0].properties.push({ name: prop });
  }

  let listArray = await query.performSearchViewModel4(null, searchInput, params);

  // 날짜 최신순으로 정렬 가능
  // listArray.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

  let num = Math.ceil(listArray.totalFound / showPage);
  maxPage = num > 15 ? 10 : 5;
  let pageResponse = [];
  for (let i = 1; i <= num; i++) {
    pageResponse.push({
      chipType: 'SELECTION',
      labelDisplayName: String(i),
    });
  }
  // default select page는 페이지 구성 중 추가하지 말고, 페이징을 사용 할 js파일에서 기본 실행되는 코드에서 선택되도록 코드를 작성하는것이 좋을 것 같습니다.

  AllPage = [];
  for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));

  pageResponse = AllPage[0];
  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);

  eventBus.publish('paging.listLoaded');

  return {
    pageResponse: pageResponse,
  };
}

export async function clickedPageAction(data, chip, subPanelContext) {
  if (chip.labelDisplayName != '1') {
    data.before.uiValue = '<';
    data.firstPage.uiValue = '≪';
  } else {
    data.before.uiValue = '';
    data.firstPage.uiValue = '';
  }

  if (chip.labelDisplayName != AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) {
    data.after.uiValue = '>';
    data.lastPage.uiValue = '≫';
  } else {
    data.after.uiValue = '';
    data.lastPage.uiValue = '';
  }

  nowPage = Number(chip.labelDisplayName) * showPage - showPage;
  // nowPage = ( Number(chip.labelDisplayName ) - 1 ) * showPage;
  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: nowPage,
  };

  let listArray = await query.performSearchViewModel4(null, searchInput, null);
  //console.log(chip.labelDisplayName + " 페이지 결과", listArray.searchResults);

  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);

  for (let chips of data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects) {
    if (chips.selected) {
      chips.selected = false;
      break;
    }
  }
  if (!chip.selected) {
    chip.selected = true;
  }

  eventBus.publish('paging.listLoaded');
}

export async function pagingBeforeAction(data, subPanelContext) {
  let num;
  let idx = -2;
  for (let chip of data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects) {
    idx += 1;
    if (chip.selected) {
      num = Number(chip.labelDisplayName) - 1;
      chip.selected = false;
      break;
    }
  }
  if (num - 1 === 0) {
    data.before.uiValue = '';
    data.firstPage.uiValue = '';
  }
  data.after.uiValue = '>';
  data.lastPage.uiValue = '≫';

  if (num < data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let pageList of AllPage) {
      if (num === Number(pageList[maxPage - 1].labelDisplayName)) {
        for (let page of pageList) {
          data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.push(page);
        }
        break;
      }
    }
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[maxPage - 1].selected = true;
  } else {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
  }

  nowPage = num * showPage - showPage;
  // nowPage = (num - 1) * showPage;
  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: nowPage,
  };

  let listArray = await query.performSearchViewModel4(null, searchInput, null);
  //console.log(idx + 1 + " 페이지 결과", listArray.searchResults);

  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);
  eventBus.publish('paging.listLoaded');
}

export async function pagingAfterAction(data, subPanelContext) {
  let num;
  let idx = 0;
  for (let chip of data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects) {
    idx += 1;
    if (chip.selected) {
      num = chip.labelDisplayName;
      chip.selected = false;
      break;
    }
  }
  if (Number(num) + 1 === Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName)) {
    data.after.uiValue = '';
    data.lastPage.uiValue = '';
  }
  data.before.uiValue = '<';
  data.firstPage.uiValue = '≪';

  if (
    num ===
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[
      data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.length - 1
    ].labelDisplayName
  ) {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let pageList of AllPage) {
      if (Number(num) + 1 === Number(pageList[0].labelDisplayName)) {
        for (let page of pageList) {
          data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.push(page);
        }
        break;
      }
    }
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
  } else {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
  }

  nowPage = num * showPage;
  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: nowPage,
  };

  let listArray = await query.performSearchViewModel4(null, searchInput, null);
  //console.log(idx + 1 + " 페이지 결과", listArray.searchResults);

  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);
  eventBus.publish('paging.listLoaded');
}

export async function firstPageAction(data, subPanelContext) {
  for (let chip of data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects) {
    if (chip.selected) {
      chip.selected = false;
      break;
    }
  }

  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: 0,
  };

  let listArray = await query.performSearchViewModel4(null, searchInput, null);

  data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.splice(0);
  for (let page of AllPage[0]) {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.push(page);
  }
  data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);
  eventBus.publish('paging.listLoaded');

  data.before.uiValue = '';
  data.firstPage.uiValue = '';
  data.after.uiValue = '>';
  data.lastPage.uiValue = '≫';
}

export async function lastPageAction(data, subPanelContext) {
  for (let chip of data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects) {
    if (chip.selected) {
      chip.selected = false;
      break;
    }
  }

  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: showPage,
    maxToReturn: 50,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: subPanelContext.subContext.type,
          colorValue: '',
          stringDisplayValue: '',
          startDateValue: '',
          endDateValue: '',
          startNumericValue: 0,
          endNumericValue: 0,
          count: 0,
          selected: false,
          startEndRange: '',
        },
      ],
    },
    searchSortCriteria: [],
    startIndex: (Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) - 1) * showPage,
  };

  let listArray = await query.performSearchViewModel4(null, searchInput, null);

  data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.splice(0);
  for (let page of AllPage[AllPage.length - 1]) {
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.push(page);
  }
  data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects[
    data.dataProviders.chipPagingDataProvider.viewModelCollection.loadedVMObjects.length - 1
  ].selected = true;

  subPanelContext.dataProviders[subPanelContext.subContext.dataProvider].viewModelCollection.setViewModelObjects(listArray.searchResults);
  eventBus.publish('paging.listLoaded');

  data.after.uiValue = '';
  data.lastPage.uiValue = '';
  data.before.uiValue = '<';
  data.firstPage.uiValue = '≪';
}

var exports = {};

export default exports = {
  setInitPageNumber,
  clickedPageAction,
  pagingBeforeAction,
  pagingAfterAction,
  firstPageAction,
  lastPageAction,
};

app.factory('chipForPaginationService', () => exports);
