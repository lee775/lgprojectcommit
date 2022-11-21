import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import vmoService from 'js/viewModelObjectService';
import locale from 'js/utils/lgepLocalizationUtils';
import exceljs from 'exceljs';
import dmSvc from 'soa/dataManagementService';
import browserUtils from 'js/browserUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import cdmSvc from 'soa/kernel/clientDataModel';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';

let tableResult = [];
let searchData = [];
let searchResult = [];
let divisionResult = [];
let divisionCheckBox = [];

//UserLog
common.userLogsInsert('Page Connection', '', 'S', 'Success');

async function specMgmtTable(ctx, data) {
  tableResult = [];
  let userGroup = ctx.userSession.props.group.uiValues[0];

  try {
    let inputData = {
      searchInput: {
        attributesToInflate: [
          // 확장할 속성 목록 ( inflateProperties 속성을 true로 해줘야 사용가능 )
          'object_name',
          'checked_out_user',
          'object_desc',
          'release_status_list',
          'fnd0InProcess',
          'l2_division',
          'l2_source',
          'l2_issue_date',
          'l2_model_name',
        ],
        internalPropertyName: '', // 그룹화에 사용되는 속성의 내부 이름
        maxToLoad: 5000,
        maxToReturn: 5000,
        providerName: 'Awp0FullTextSearchProvider',
        //Awp0FullTextSearchProvider : 전체 텍스트 검색
        //Awp0SavedQuerySearchProvider : 기존 SavedQuery처럼 검색 타입을 지정해서 검색( 이때 searchInput에 들어갈 속성들도 다르다 )
        searchCriteria: {
          searchString: '*',
          limitedFilterCategoriesEnabled: 'true',
          listOfExpandedCategories: '',
          forceThreshold: 'false',
          searchFromLocation: 'global',
          dcpSortByDataProvider: 'true',
        },
        searchFilterFieldSortType: 'Priority',
        cursor: {
          startIndex: 0,
          endIndex: 0,
          startReached: false,
          endReached: false,
        },
        searchFilterMap6: {
          //object type, owning user 등과 같은 필터링 기준이 표시
          'WorkspaceObject.object_type': [
            {
              searchFilterType: 'StringFilter',
              stringValue: 'L2_IssuePageRevision',
            },
          ],
          'L2_PostRevision.l2_division': [],
        },
        searchSortCriteria: [],
        columnFilters: [],
        focusObjUid: '',
        pagingType: '',
        startIndex: 0,
      },
      inflateProperties: true,
      noServiceData: false,
      columnConfigInput: {
        clientName: '',
        hostingClientName: '',
        clientScopeURI: '',
        operationType: '',
        columnsToExclude: [],
      },
      saveColumnConfigData: {
        scope: '',
        scopeName: '',
        clientScopeURI: '',
        columnConfigId: '',
        columns: [],
      },
    };

    let inputDivision = [
      {
        searchFilterType: 'StringFilter',
        stringValue: userGroup,
      },
    ];

    let infoDivision;
    let inputDivisionArr = [];

    if (userGroup == 'H&A') {
      for (let i = 0; i < divisionResult.length; i++) {
        infoDivision = {
          searchFilterType: 'StringFilter',
          stringValue: divisionResult[i],
        };
        inputDivisionArr.push(infoDivision);
      }
      inputData.searchInput.searchFilterMap6['L2_PostRevision.l2_division'] = inputDivisionArr;
    } else {
      inputData.searchInput.searchFilterMap6['L2_PostRevision.l2_division'] = inputDivision;
    }

    let performServiceData = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
    let object = JSON.parse(performServiceData.searchResultsJSON); //JSON형식으로 되어있는 객체를 오브젝트 형식으로 바꿔줌
    for (var i = 0; i < object.objects.length; i++) {
      var uid = object.objects[i].uid; //uid와 객체 타입만 정의 되어있기 때문에 uid 를 저장해준다.
      var obj = performServiceData.ServiceData.modelObjects[uid]; //uid에 해당하는 객체를 서비스 데이터에서 지정하여 가져온다.
      // await dmSvc.getProperties([uid], ["l2_division"]);
      if (ctx.userSession.props.group.uiValue == 'H&A') {
        searchData.push(obj);
      } else if (ctx.userSession.props.group.uiValue == obj.props.l2_division.dbValues[0]) {
        searchData.push(obj);
      }
    }
    tableResult = searchData;
  } catch (err) {
    //console.log(err);
  }
  searchData = searchData.filter((element, index) => {
    return searchData.indexOf(element) === index;
  });
  searchData.sort();
  //console.log("searchData", { searchData });
  eventBus.publish('specMgmtCheckBoxListReload');
  return {
    result: searchData,
    totalFound: searchData.length,
  };
}

async function checkBoxDivision(data) {
  _.forEach(tableResult, function (value) {
    if (value.props.l2_division.dbValues[0] != null) {
      divisionResult.push(value.props.l2_division.dbValues[0]);
    }
  });

  divisionResult = divisionResult.filter((element, index) => {
    return divisionResult.indexOf(element) === index;
  });
  divisionResult.sort();
  //console.log("결과는??", { divisionResult });
  //console.log("체크박스 드가라아아");
  divisionCheckBox = [];
  data.dataProviders.categoryDivision.json.response = [];
  let divisionLength = 0;
  let division;
  for (let i = 0; i < divisionResult.length; i++) {
    division = 'division' + i;
    divisionCheckBox.push({
      [division]: {
        propertyName: division,
        propertyDisplayName: divisionResult[i],
        type: 'BOOLEAN',
        dbValue: '',
        displayValues: [divisionResult[i]],
        isNull: false,
        editable: true,
        isEnabled: true,
        isRichText: false,
        isRequired: false,
        isLocalizable: false,
        isDisplayable: true,
        isAutoAssignable: false,
        hasInitialValue: false,
        isArray: false,
        valueUpdated: false,
        displayValueUpdated: false,
        editableInViewModel: false,
        isPropertyModifiable: true,
        isEditable: true,
        arrayLength: -1,
        error: null,
        propertyLabelDisplay: 'PROPERTY_LABEL_AT_RIGHT',
        editLayoutSide: true,
        uiValue: divisionResult[i],
        overlayType: 'viewModelPropertyOverlay',
        value: '',
        prevDisplayValues: [divisionResult[i]],
        dateApi: {
          isDateEnabled: true,
          isTimeEnabled: true,
        },
        radioBtnApi: {},
        propertyRadioTrueText: 'True',
        propertyRadioFalseText: 'False',
        propApi: {},
        hasLov: false,
        uwAnchor: '',
        renderingHint: '',
        referenceTypeName: '',
        initialize: false,
        parentUid: '',
        dbValues: [],
        uiValues: [divisionResult[i]],
      },
    });
    await Object.assign(data, divisionCheckBox[i]);
    data.dataProviders.categoryDivision.json.response.push(`{{data.${division}}}`);
    divisionLength++;
  }
  data.divisionLength = divisionLength;
  data.dataProviders.categoryDivision.json.totalFound = divisionCheckBox.length;

  //console.log("뭐드갔나", { divisionCheckBox });
}

function filterRowsWithSort(response, sortCriteria, startIndex, pageSize) {
  let countries = response.result;
  let endIndex = startIndex + pageSize;

  if (sortCriteria && sortCriteria.length > 0) {
    let criteria = sortCriteria[0];
    let sortDirection = criteria.sortDirection;
    let sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      countries.sort(function (a, b) {
        if (a.props[sortColName].value <= b.props[sortColName].value) {
          return -1;
        }
        return 1;
      });
    } else if (sortDirection === 'DESC') {
      countries.sort(function (a, b) {
        if (a.props[sortColName].value >= b.props[sortColName].value) {
          return -1;
        }
        return 1;
      });
    }
  }

  let searchResults = countries.slice(startIndex, endIndex);
  return searchResults;
}

async function searchItem(ctx, data) {
  searchResult = [];
  let searchResult2 = [];
  let modelName = data.modelTxt.uiValue;
  let userGroup = ctx.userSession.props.group.uiValues[0];

  try {
    //new input Data
    let inputData = {
      searchInput: {
        attributesToInflate: [
          'object_name',
          'checked_out_user',
          'object_desc',
          'release_status_list',
          'fnd0InProcess',
          'l2_division',
          'l2_source',
          'l2_issue_date',
          'l2_model_name',
        ],
        internalPropertyName: '',
        maxToLoad: 5000,
        maxToReturn: 5000,
        providerName: 'Awp0FullTextSearchProvider',
        searchCriteria: {
          searchString: modelName,
          limitedFilterCategoriesEnabled: 'true',
          listOfExpandedCategories: '',
          forceThreshold: 'false',
          searchFromLocation: 'global',
          dcpSortByDataProvider: 'true',
        },
        searchFilterFieldSortType: 'Priority',
        cursor: {
          startIndex: 0,
          endIndex: 0,
          startReached: false,
          endReached: false,
        },
        searchFilterMap6: {
          'WorkspaceObject.object_type': [
            {
              searchFilterType: 'StringFilter',
              stringValue: 'L2_IssuePageRevision',
            },
          ],
          'L2_PostRevision.l2_division': [],
        },
        searchSortCriteria: [],
        columnFilters: [],
        focusObjUid: '',
        pagingType: '',
        startIndex: 0,
      },
      inflateProperties: true,
      noServiceData: false,
    };

    let inputDivision = [
      {
        searchFilterType: 'StringFilter',
        stringValue: userGroup,
      },
    ];

    let infoDivision;
    let inputDivisionArr = [];

    if (userGroup == 'H&A') {
      for (let i = 0; i < divisionResult.length; i++) {
        infoDivision = {
          searchFilterType: 'StringFilter',
          stringValue: divisionResult[i],
        };
        inputDivisionArr.push(infoDivision);
      }
      inputData.searchInput.searchFilterMap6['L2_PostRevision.l2_division'] = inputDivisionArr;
    } else {
      inputData.searchInput.searchFilterMap6['L2_PostRevision.l2_division'] = inputDivision;
    }

    let performServiceData = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
    let object = JSON.parse(performServiceData.searchResultsJSON); //JSON형식으로 되어있는 객체를 오브젝트 형식으로 바꿔줌
    for (var i = 0; i < object.objects.length; i++) {
      var uid = object.objects[i].uid;
      var obj = performServiceData.ServiceData.modelObjects[uid];
      searchData.push(obj);
    }
  } catch (err) {
    //console.log(err);
  }

  for (let i = 0; i < divisionCheckBox.length; i++) {
    _.forEach(divisionCheckBox[i], function (value) {
      _.forEach(searchData, function (v) {
        if (value.dbValues[0]) {
          let tfCheck = v.props.l2_division.dbValues[0];
          value.dbValues[0] && value.uiValues[0] == tfCheck ? searchResult.push(v) : null;
        }
      });
    });
  }
  if (searchResult.length > 0) {
    if (modelName != '' && searchResult.length > 0) {
      _.forEach(searchResult, function (val) {
        let txtBoxValue = val.props.object_string.dbValues[0];
        if (txtBoxValue.includes(modelName)) {
          searchResult2.push(val);
        }
      });
    } else if (modelName != '' && searchResult.length == 0) {
      _.forEach(searchData[0], function (val) {
        let txtBoxValue = val.props.object_string.dbValues[0];
        if (txtBoxValue.includes(modelName)) {
          searchResult2.push(val);
        }
      });
    } else {
      searchResult2.push(...searchResult);
    }
  } else {
    if (modelName != '') {
      _.forEach(searchData, function (val) {
        let txtBoxValue = val.props.object_string.dbValues[0];
        if (txtBoxValue.includes(modelName)) {
          searchResult2.push(val);
        }
      });
    }
  }
  //console.log("검색하면 사라지니??", {tableResult});
  searchResult2 = searchResult2.filter((element, index) => {
    return searchResult2.indexOf(element) === index;
  });

  //console.log("검색결과", { searchResult2 });
  let vmoSearchResult = [];
  _.forEach(searchResult2, function (mo) {
    vmoSearchResult.push(vmoService.constructViewModelObjectFromModelObject(mo));
  });
  data.dataProviders.specMgmtTableDataProvider.viewModelCollection.setViewModelObjects(vmoSearchResult);
  eventBus.publish('specMgmtTable.plTable.clientRefresh');

  if (data.dataProviders.specMgmtTableDataProvider.viewModelCollection.loadedVMObjects.length == 0) {
    const noResultNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'noResult');
    notySvc.showInfo(noResultNoty);
  }
}

function technicalInitialization(data) {
  let checkboxStatus = data.dataProviders.categoryDivision.viewModelCollection.loadedVMObjects;

  for (let i = 0; i < checkboxStatus.length; i++) {
    checkboxStatus[i].dbValue ? (checkboxStatus[i].dbValue = false) : null;
    checkboxStatus[i].dbValues[0] ? (checkboxStatus[i].dbValues[0] = false) : null;
  }
  data.categoryDVZ.dbValue ? (data.categoryDVZ.dbValue = false) : null;
  if (data.modelTxt.uiValue != '' || data.modelTxt != undefined) {
    data.modelTxt.dbValue = '';
    data.modelTxt.uiValue = '';
  }
  data.dataProviders.specMgmtTableDataProvider.selectedObjects = [];

  let initResult = [];
  _.forEach(tableResult, function (mo) {
    initResult.push(vmoService.constructViewModelObjectFromModelObject(mo));
  });
  data.dataProviders.specMgmtTableDataProvider.viewModelCollection.setViewModelObjects(initResult);
  //console.log("초기화 결과", { initResult });
}

function marketingInitialization(data) {
  let checkboxStatus = data.dataProviders.categoryDivision.viewModelCollection.loadedVMObjects;
  for (let i = 0; i < checkboxStatus.length; i++) {
    checkboxStatus[i].dbValue ? (checkboxStatus[i].dbValue = false) : null;
    checkboxStatus[i].dbValues[0] ? (checkboxStatus[i].dbValues[0] = false) : null;
  }
  data.categoryDVZ.dbValue ? (data.categoryDVZ.dbValue = false) : null;
  data.categoryCode0Obj.dbValue ? (data.categoryCode0Obj.dbValue = false) : null;
  data.categoryCode0.dbValue ? (data.categoryCode0.dbValue = false) : null;
  data.categoryCode0Turbo.dbValue ? (data.categoryCode0Turbo.dbValue = false) : null;
  data.categoryCode0Bed.dbValue ? (data.categoryCode0Bed.dbValue = false) : null;
  data.categoryCyking.dbValue ? (data.categoryCyking.dbValue = false) : null;
  data.categoryCykingPower.dbValue ? (data.categoryCykingPower.dbValue = false) : null;
  data.categoryRoboking.dbValue ? (data.categoryRoboking.dbValue = false) : null;
  data.categoryVacuum.dbValue ? (data.categoryVacuum.dbValue = false) : null;
  data.categoryHandy.dbValue ? (data.categoryHandy.dbValue = false) : null;
  data.categoryRobot.dbValue ? (data.categoryRobot.dbValue = false) : null;
  data.categoryRestaurant.dbValue ? (data.categoryRestaurant.dbValue = false) : null;
  data.categoryHP.dbValue ? (data.categoryHP.dbValue = false) : null;
  data.categoryBed.dbValue ? (data.categoryBed.dbValue = false) : null;
  data.categorySuction1.dbValue ? (data.categorySuction1.dbValue = false) : null;
  data.categorySuction2.dbValue ? (data.categorySuction2.dbValue = false) : null;
  data.categorySuction3.dbValue ? (data.categorySuction3.dbValue = false) : null;
  data.categorySuction4.dbValue ? (data.categorySuction4.dbValue = false) : null;
  data.categorySuction5.dbValue ? (data.categorySuction5.dbValue = false) : null;
  data.categorySuction6.dbValue ? (data.categorySuction6.dbValue = false) : null;
  data.categoryWhite.dbValue ? (data.categoryWhite.dbValue = false) : null;
  data.categoryBlack.dbValue ? (data.categoryBlack.dbValue = false) : null;
  data.categoryGray.dbValue ? (data.categoryGray.dbValue = false) : null;
  data.categoryGold.dbValue ? (data.categoryGold.dbValue = false) : null;
  data.categorySilver.dbValue ? (data.categorySilver.dbValue = false) : null;
  data.categoryBrown.dbValue ? (data.categoryBrown.dbValue = false) : null;
  data.categoryNavy.dbValue ? (data.categoryNavy.dbValue = false) : null;
  data.categoryOne.dbValue ? (data.categoryOne.dbValue = false) : null;
  data.categoryTwo.dbValue ? (data.categoryTwo.dbValue = false) : null;
  data.categoryThree.dbValue ? (data.categoryThree.dbValue = false) : null;
  data.categoryFour.dbValue ? (data.categoryFour.dbValue = false) : null;
  data.categoryFive.dbValue ? (data.categoryFive.dbValue = false) : null;
  if (data.modelTxt.uiValue != '' || data.modelTxt != undefined) {
    data.modelTxt.dbValue = '';
    data.modelTxt.uiValue = '';
  }
  data.dataProviders.specMgmtTableDataProvider.selectedObjects = [];

  let initResult = [];
  _.forEach(tableResult, function (mo) {
    initResult.push(vmoService.constructViewModelObjectFromModelObject(mo));
  });
  data.dataProviders.specMgmtTableDataProvider.viewModelCollection.setViewModelObjects(initResult);
  //console.log("초기화 결과", { initResult });
}

function realGetCompareData(data, ctx) {
  return {
    response: undefined,
    totalFound: 0,
  };
}

async function originCompare(ctx, data) {
  const popComparePageData = vms.getViewModelUsingElement(document.getElementById('compareData'));
  const popCompareTableData = vms.getViewModelUsingElement(document.getElementById('specMgmtTable'));
  let compareTableData = popCompareTableData.dataProviders.specMgmtTableDataProvider.selectedObjects;
  await common.delay(200);
  popComparePageData.dataProviders.specManagementCompareDataProvider.viewModelCollection.setViewModelObjects(compareTableData);
}

async function loadBOM(ctx, data) {
  let tableValue = vms.getViewModelUsingElement(document.getElementById('specMgmtTable'));
  let getUID = tableValue.dataProviders.specMgmtTableDataProvider.selectedObjects[0].uid;
  let getURL = `${browserUtils.getBaseURL()}#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=${getUID}`;
  let URLElementValue = document.getElementById('loadBOMValue');
  await common.delay(200);
  let splitURL = URLElementValue.innerHTML.split(`\"`);
  splitURL[3] = getURL;
  splitURL[9] = getURL;
  let joinURL = splitURL.join(`\"`);
  let joinURL2 = joinURL.split(';');
  URLElementValue.innerHTML = joinURL2[0];

  //UserLog
  await common.userLogsInsert('Load StyleSheet', '', 'S', 'Success');
}

function exportToExcel() {
  let headerData = [''];
  let columnData = [];
  let resultColumnData = [];
  let tableData = [];
  // Header Label
  let popData = document.getElementById('compareData');
  let stringData = document.getElementsByClassName('aw-splm-tableContainer');
  let stringHeaderData = document.getElementsByClassName('aw-splm-tableHeaderCellLabel');
  let deleteHeaderData = document.getElementsByClassName('aw-splm-tableHeaderCellInner');
  var arr = Array.prototype.slice.call(stringHeaderData);
  var arr2 = Array.prototype.slice.call(deleteHeaderData);
  let resultHeaderData = arr.filter((x) => !arr2.includes(x));

  for (let i = 0; i < resultHeaderData.length; i++) {
    headerData.push(resultHeaderData[i].innerText);
  }

  // column Label
  for (let j = 1; j < 4; j++) {
    for (let i = 2; i < stringData[1].parentNode._tableInstance.dataProvider.cols.length + 2; i++) {
      columnData.push(document.getElementById(`specCompare_row${i}_col${j}`).innerText);
    }
    resultColumnData.push(columnData);
    columnData = [];
  }

  tableData.push(headerData);
  tableData.push(...resultColumnData);

  // 테이블의 테스트 데이터
  let rawDate = [
    { header: headerData[0], data: tableData[1] },
    { header: headerData[1], data: tableData[2] },
    { header: headerData[2], data: tableData[3] },
  ];
  // excel 파일 생성

  let workbook = new exceljs.Workbook();

  //차트 시트탭 2개를 만듬
  const dataSheet = workbook.addWorksheet('DataSheet');

  //테이블의 경우, 데이터를 넣어줌
  rawDate.forEach((item, index) => {
    dataSheet.getColumn(index + 1).values = [item.header, ...item.data];
  });

  // 차트 라이브러리의 div를 찾아와 이미지로 변환
  let promise = [];

  // excel로 만드는건 비동기처리로
  Promise.all(promise).then(() => {
    workbook.xlsx.writeBuffer().then((b) => {
      let a = new Blob([b]);
      let url = window.URL.createObjectURL(a);

      let elem = document.createElement('a');
      elem.href = url;
      elem.download = `DataCompare.xlsx`;
      document.body.appendChild(elem);
      elem.style = 'display: none';
      elem.click();
      elem.remove();
    });
  });

  return workbook;
}

function actionList() {
  //console.log("찍었다");
}

function reload() {
  eventBus.publish('specMgmtTable.plTable.reload');
}

function setBoxWidth(data) {
  data.screenWidth = document.body.offsetWidth;
}

let exports = {};

export default exports = {
  actionList,
  checkBoxDivision,
  exportToExcel,
  filterRowsWithSort,
  loadBOM,
  marketingInitialization,
  originCompare,
  realGetCompareData,
  reload,
  searchItem,
  specMgmtTable,
  technicalInitialization,
  setBoxWidth,
};

app.factory('protoTypeSpecManagementService', () => exports);
