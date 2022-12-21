import app from 'app';
import SoaService from 'soa/kernel/soaService';
import bomUtils from 'js/utils/lgepBomUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import common from 'js/utils/lgepCommonUtils';
import treeView from 'js/awTableService';
import _ from 'lodash';
import popupService from 'js/popupService';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import fmsUtils from 'js/fmsUtils';
import viewC from 'js/viewModelObjectService';
import uwPropertySvc from 'js/uwPropertyService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
import loding from 'js/utils/lgepLoadingUtils';
import browserUtils from 'js/browserUtils';
import L2_DesignStandardService from 'js/L2_DesignStandardService';

var $ = require('jQuery');
var JSZip = require('jszip');

/**
 * 최근 검색 기능을  통해 검색
 * @param {eventData} eventData - 선택한 최근 검색어
 */
function recentAllSearcing(eventData) {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  searchData.searchingName.dbValue = eventData.selectedObjects[0].dbValue;
}

let tableData;
/**
 * 페이지 전체 검색
 * @param {ctx} ctx - ctx
 */
async function pageAllSearching(ctx) {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let searchWord = searchData.searchingName.dbValue;
  let searchValue = searchWord.replace(/(\s*)/g, '');
  if (searchValue == null || searchValue.length < 1) {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'requiredText'), [], []);
    return;
  }
  if (searchValue.length == 1) {
    let regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if (!regex.test(searchValue)) {
      message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'twoChar'), [], []);
      return;
    }
  }
  // searchWord = searchWord.replace(/\*/gi, ' ');
  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let policyArr = policy.getEffectivePolicy();
  policyArr.types.push({
    name: 'L2_User',
    properties: [
      {
        name: 'l2_dgn2_history',
      },
    ],
  });
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser], policyArr);
  searchingUser = searchingUser[0];

  let sgnStandardHistory = searchingUser.props.l2_dgn2_history.dbValues;
  sgnStandardHistory.push(searchWord);
  sgnStandardHistory = Array.from(new Set(sgnStandardHistory));

  let request = {
    objects: [searchingUser],
    attributes: {
      l2_dgn2_history: {
        stringVec: sgnStandardHistory,
      },
    },
  };

  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);

  let performSearchData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: ['object_name', 'checked_out_user', 'object_desc', 'release_status_list', 'fnd0InProcess', 'l2_reference_book2'],
      internalPropertyName: '',
      maxToLoad: 50,
      maxToReturn: 50,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*' + searchWord + '*',
        // "limitedFilterCategoriesEnabled": "true",
        // "listOfExpandedCategories": "L2_PageRevision.l2_content_string",
        // "forceThreshold": "false",
        // "searchFromLocation": "global",
        // "dcpSortByDataProvider": "true"
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
            stringValue: 'L2_DgnPage2Revision',
          },
        ],
      },
      searchSortCriteria: [],
      columnFilters: [],
      focusObjUid: '',
      pagingType: '',
      startIndex: 0,
    },
    noServiceData: false,
  };
  let performResult = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', performSearchData);
  let performResultJSON = JSON.parse(performResult.searchResultsJSON);
  let modelObjects = [];
  for (var i = 0; i < performResultJSON.objects.length; i++) {
    var uid = performResultJSON.objects[i].uid;
    var obj = performResult.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  tableData = modelObjects;
  // eventBus.publish("searchPageTable.plTable.reload");
  if (modelObjects.length < 1) {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'searchDataNone'));
    return {
      searcNonehData: true,
    };
  } else {
    return {
      searcNonehData: false,
    };
  }
}

/**
 * 전체 검색 후 팝업에 검색어 전달.
 */
async function pageAllSearchingInit() {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let pageSearchData = vms.getViewModelUsingElement(document.getElementById('pageSearchData'));
  let searchWord = searchData.searchingName.dbValue;
  pageSearchData.searchWord.uiValue = searchWord;
}

/**
 * 사전에 전체 검색으로 가져온 테이블 데이터를 넣어준다.
 */
async function getSearchPageTableData() {
  if (!tableData) {
    return;
  }
  await com.getProperties(tableData, ['l2_content_string', 'l2_reference_book']);
  return {
    result: tableData,
    totalFound: tableData.length,
  };
}

/**
 * 어떤 검색을 했는지 확인
 */
async function recentSearchMode() {
  let navData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  let standardRecentData;
  let whileTrue = true;
  while (whileTrue) {
    await common.delay(100);
    standardRecentData = vms.getViewModelUsingElement(document.getElementById('standardRecentData'));
    if (standardRecentData) {
      break;
    }
  }
  if (!navData.navMode) {
    standardRecentData.searchMode = 'all';
  } else if (navData.navMode == 'awTree') {
    standardRecentData.searchMode = 'page';
  }
}

let searchKeyword = [];
let manualRecentSearch = [];
/**
 * 최근 검색어 호출
 */
async function loadSearchList(data, ctx) {
  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
  searchingUser = searchingUser[0];
  await com.getProperties(searchingUser, ['l2_dgn2_history']);

  searchKeyword = searchingUser.props.l2_dgn2_history.dbValues;
  manualRecentSearch.splice(0, manualRecentSearch.length);
  if (searchKeyword.length > 0) {
    for (let i = 0; i < searchKeyword.length; i++) {
      manualRecentSearch.push(uwPropertySvc.createViewModelProperty(searchKeyword[i], null, 'STRING', searchKeyword[i], [searchKeyword[i]]));
    }
  }
  manualRecentSearch.reverse();
  return {
    searchResponse: manualRecentSearch,
  };
}

function arrReset() {
  searchKeyword = [];
  manualRecentSearch = [];
}

function useTextSearch(data, ctx) {
  // $(".inputSearch").val(data.dataProviders.searchedWordList.selectedObjects[0].dbValue);
  // doSearch(data, ctx);
  // popupService.hide(data.popupId);
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

/**
 * 개정이력 테이블 데이터 조회
 */
async function reviseHistoryTableSet() {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  let selValue = standardNavData.selValue;
  selValue = com.getObject(selValue.uid);
  await com.getProperties(selValue, ['revision_list']);
  let bookRevList = [];
  for (let i of selValue.props.revision_list.dbValues) {
    bookRevList.push(com.getObject(i));
  }
  await com.getProperties(bookRevList, ['item_revision_id', 'l2_revise_reason', 'l2_revise_date', 'l2_revise_user', 'release_status_list']);
  let tableData = [];
  let uidArr = [];
  for (let i of bookRevList) {
    tableData.push(viewC.constructViewModelObjectFromModelObject(i));
    uidArr.push(i.uid);
  }
  return {
    result: tableData,
    totalFound: tableData.length,
    uid: uidArr,
  };
}

/**
 * 프리즈 되지 않은 개정 이력을 수정 가능하도록 변경
 */
function tableEditStartAction() {
  const reviseHistoryData = vms.getViewModelUsingElement(document.getElementById('reviseHistoryData'));
  let tableData = reviseHistoryData.dataProviders.reviseHistoryTableData.viewModelCollection.loadedVMObjects;
  reviseHistoryData.tableEditMode = true;
  for (let i of tableData) {
    if (!i.props.release_status_list.dbValue.length > 0) {
      i.props.l2_revise_reason.isPropertyModifiable = true;
      i.props.item_revision_id.isPropertyModifiable = false;
      i.props.l2_revise_date.isPropertyModifiable = false;
      i.props.l2_revise_user.isPropertyModifiable = false;
    } else {
      i.props.l2_revise_reason.isPropertyModifiable = false;
      i.props.item_revision_id.isPropertyModifiable = false;
      i.props.l2_revise_date.isPropertyModifiable = false;
      i.props.l2_revise_user.isPropertyModifiable = false;
    }
  }
}

/**
 * 개정 이력 수정 저장
 */
async function tableEditSaveAction() {
  const reviseHistoryData = vms.getViewModelUsingElement(document.getElementById('reviseHistoryData'));
  let tableData = reviseHistoryData.dataProviders.reviseHistoryTableData.viewModelCollection.loadedVMObjects;
  reviseHistoryData.tableEditMode = false;
  let setPropsArr = [];
  let noneReleasedTableData = [];
  let idxArr = [];
  for (let i = 0; i < tableData.length; i++) {
    if (!tableData[i].props.release_status_list.dbValue.length > 0) {
      noneReleasedTableData.push(tableData[i]);
      idxArr.push(i);
    }
    setPropsArr.push(tableData[i].props.l2_revise_reason.dbValue ? tableData[i].props.l2_revise_reason.dbValue : '');
  }
  let setReviseMassageArr = [];
  for (let i of idxArr) {
    setReviseMassageArr.push(setPropsArr[i]);
  }
  let request = {
    objects: noneReleasedTableData,
    attributes: {
      l2_revise_reason: {
        stringVec: setReviseMassageArr,
      },
    },
  };
  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
}

/**
 * 테이블 개정 이력 편집모드 취소
 */
function cancelMode() {
  const reviseHistoryData = vms.getViewModelUsingElement(document.getElementById('reviseHistoryData'));
  reviseHistoryData.tableEditMode = false;
}

/**
 * 리비전 비교 팝업 크기 설정
 */
function revisionCompareSizeSet() {
  return {
    compareWidth: window.innerWidth * 0.6 + 'px',
    compareHeight: window.innerHeight * 0.6 + 'px',
    sizeSet: true,
  };
}

function loadData() {
  return {
    result: undefined,
  };
}

let treeABook;
let treeBBook;
/**
 * 리비전 비교의 기준 트리 데이터 설정
 */
async function treeALoadData(result, nodeBeingExpanded, input, ctx) {
  ctx.decoratorToggle = true;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }
  if (nodeBeingExpanded.uid == 'top') {
    if (!treeABook) {
      return {
        parentNode: nodeBeingExpanded,
        childNodes: [],
        totalChildCount: 0,
        startChildNdx: 0,
      };
    }
    const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
    let topNode = treeABook;
    await com.getProperties(topNode, ['item_revision_id', 'l2_revise_date', 'l2_revise_user', 'l2_revise_reason']);
    compareRevData.AOwningUser.uiValue = topNode.props.l2_revise_user.uiValues[0];
    compareRevData.ARevDate.uiValue = topNode.props.l2_revise_date.uiValues[0];
    compareRevData.ARevReason.uiValue = topNode.props.l2_revise_reason.uiValues[0];
    let topNodeBom = await bomUtils.createBOMWindow(null, topNode);
    // console.log("???",{topNodeBom});
    let viewArr = [];
    let nodeName = topNode.props.object_name.dbValues[0];
    let vmo = viewC.constructViewModelObjectFromModelObject(topNode);
    let temp = vmo;
    let treeVMO = treeView.createViewModelTreeNode(
      vmo.uid,
      vmo.type,
      nodeName,
      nodeBeingExpanded.levelNdx + 1,
      nodeBeingExpanded.levelNdx + 2,
      vmo.typeIconURL,
    );
    Object.assign(treeVMO, temp);
    let getBomChild = await bomUtils.expandPSOneLevel([topNodeBom.bomLine]);
    if (getBomChild.output[0].children.length > 0) {
      vmo.isLeaf = false;
    } else {
      vmo.isLeaf = true;
    }
    treeVMO.isLeaf = false;
    treeVMO.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
    treeVMO.levelNdx = nodeBeingExpanded.levelNdx + 1;
    viewArr.push(treeVMO);
    bomUtils.closeBOMWindow(topNodeBom.bomWindow);
    treeABook = undefined;
    return {
      parentNode: nodeBeingExpanded,
      childNodes: viewArr,
      totalChildCount: viewArr.length,
      startChildNdx: 0,
    };
  } else {
    homeUid = nodeBeingExpanded.uid;
    let parentObj = com.getObject(homeUid);
    let parentObjBom = await bomUtils.createBOMWindow(null, parentObj);
    let getBomChild = await bomUtils.expandPSOneLevel([parentObjBom.bomLine]);
    bomUtils.closeBOMWindow(parentObjBom.bomWindow);
    let response = [];
    let resBomline = [];
    for (let i of getBomChild.output[0].children) {
      response.push(i.itemRevOfBOMLine);
      resBomline.push(i.bomLine);
    }
    await com.getProperties(response, ['item_revision_id', 'revision_list']);
    let viewArr = [];
    let idx = 0;
    let childTemp = await bomUtils.expandPSOneLevel(resBomline);
    for (let treeNode of response) {
      let nodeName = treeNode.props.object_name.dbValues[0];
      let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
      Object.assign(vmo, temp);
      if (childTemp.output[idx].children.length > 0) {
        vmo.isLeaf = false;
      } else {
        vmo.isLeaf = true;
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
      idx++;
    }
    return {
      parentNode: nodeBeingExpanded,
      childNodes: viewArr,
      totalChildCount: viewArr.length,
      startChildNdx: 0,
    };
  }
}

/**
 * 리비전 비교의 비교 대상 트리 데이터 설정
 */
async function treeBLoadData(result, nodeBeingExpanded, input) {
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }
  if (nodeBeingExpanded.uid == 'top') {
    if (!treeBBook) {
      return {
        parentNode: nodeBeingExpanded,
        childNodes: [],
        totalChildCount: 0,
        startChildNdx: 0,
      };
    }
    const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
    let topNode = treeBBook;
    await com.getProperties(topNode, ['item_revision_id', 'l2_revise_date', 'l2_revise_user', 'l2_revise_reason']);
    compareRevData.BOwningUser.uiValue = topNode.props.l2_revise_user.uiValues[0];
    compareRevData.BRevDate.uiValue = topNode.props.l2_revise_date.uiValues[0];
    compareRevData.BRevReason.uiValue = topNode.props.l2_revise_reason.uiValues[0];
    topNode = com.getObject(topNode.uid);
    let topNodeBom = await bomUtils.createBOMWindow(null, topNode);
    // console.log("???",{topNodeBom});
    let viewArr = [];
    let nodeName = topNode.props.object_name.dbValues[0];
    let vmo = viewC.constructViewModelObjectFromModelObject(topNode);
    let temp = vmo;
    let treeVMO = treeView.createViewModelTreeNode(
      vmo.uid,
      vmo.type,
      nodeName,
      nodeBeingExpanded.levelNdx + 1,
      nodeBeingExpanded.levelNdx + 2,
      vmo.typeIconURL,
    );
    Object.assign(treeVMO, temp);
    let getBomChild = await bomUtils.expandPSOneLevel([topNodeBom.bomLine]);
    if (getBomChild.output[0].children.length > 0) {
      vmo.isLeaf = false;
    } else {
      vmo.isLeaf = true;
    }
    treeVMO.isLeaf = false;
    treeVMO.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
    treeVMO.levelNdx = nodeBeingExpanded.levelNdx + 1;
    viewArr.push(treeVMO);
    bomUtils.closeBOMWindow(topNodeBom.bomWindow);
    treeBBook = undefined;
    return {
      parentNode: nodeBeingExpanded,
      childNodes: viewArr,
      totalChildCount: viewArr.length,
      startChildNdx: 0,
    };
  } else {
    homeUid = nodeBeingExpanded.uid;
    let parentObj = com.getObject(homeUid);
    let parentObjBom = await bomUtils.createBOMWindow(null, parentObj);
    let getBomChild = await bomUtils.expandPSOneLevel([parentObjBom.bomLine]);
    bomUtils.closeBOMWindow(parentObjBom.bomWindow);
    let response = [];
    let resBomline = [];
    for (let i of getBomChild.output[0].children) {
      response.push(i.itemRevOfBOMLine);
      resBomline.push(i.bomLine);
    }
    await com.getProperties(response, ['item_revision_id', 'revision_list']);
    let viewArr = [];
    let idx = 0;
    let childTemp = await bomUtils.expandPSOneLevel(resBomline);
    for (let treeNode of response) {
      let nodeName = treeNode.props.object_name.dbValues[0];
      let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
      Object.assign(vmo, temp);
      if (childTemp.output[idx].children.length > 0) {
        vmo.isLeaf = false;
      } else {
        vmo.isLeaf = true;
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
      idx++;
    }
    return {
      parentNode: nodeBeingExpanded,
      childNodes: viewArr,
      totalChildCount: viewArr.length,
      startChildNdx: 0,
    };
  }
}

/**
 * 리비전 비교의 리스트를 만들어줌
 */
function revisionCompareInit() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  compareRevData.compareAListValues.dbValues = [];
  compareRevData.compareAListValues.dbValues.push({
    propDisplayValue: null,
    propInternalValue: null,
  });
  let book = L2_DesignStandardService.getSelectBook();
  book = com.getObject(book.uid);
  let disAValue = book.props.revision_list.dbValues;
  let interAValueTemp = book.props.revision_list.uiValues;
  for (let i = 0; i < interAValueTemp.length; i++) {
    let temp = interAValueTemp[i].split('/');
    temp = temp[1].split(';');
    temp = temp[0];
    compareRevData.compareAListValues.dbValues.push({
      propDisplayValue: temp,
      propInternalValue: disAValue[i],
    });
  }
  compareRevData.compareAListValues.dbValue = compareRevData.compareAListValues.dbValues;
}

/**
 * 리비전 비교 기준 트리의 리비전이 바뀌면 테이블을 새로 로드 해주는 코드
 */
async function standardRevSet() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let bTableReset = compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects;
  for (let i of bTableReset) {
    if (i.props.comparison) {
      i.props.comparison = {};
    }
  }
  eventBus.publish('compareTreeB.plTable.clientRefresh');
  let stdBook = com.getObject(compareRevData.compareAList.dbValue);
  treeABook = stdBook;
  document.getElementById('listboxB').classList.remove('compareRevlistSet');
  eventBus.publish('compareTreeA.plTable.reload');
  eventBus.publish('compareBSeting');
  await stdTreeOpen();
  aTreeLengthCheck = 0;
}
let aTreeLengthCheck = 0;
async function stdTreeOpen() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let whileTrue = true;
  let maxCount = 0;
  while (whileTrue) {
    if (maxCount > 20) {
      break;
    }
    await common.delay(100);
    if (compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects.length > aTreeLengthCheck) {
      break;
    }
    maxCount++;
  }
  if (maxCount < 20) {
    aTreeLengthCheck = compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects.length;
    let treeOpenState = false;
    let treeData = compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects;
    for (let i of treeData) {
      if (!i.isLeaf) {
        if (!i.isExpanded) {
          i.isExpanded = true;
          treeOpenState = true;
          eventBus.publish('compareTreeA.plTable.toggleTreeNode', i);
          break;
        }
      }
    }
    if (treeOpenState) {
      await stdTreeOpen();
    }
  }
}

/**
 * 리비전 비교의 기준 트리를 설정 완료하면 비교 트리의 리스트 박스 잠금이 풀리며 기준 리비전보다 하위인 리비전을 보여줌
 */
function compareBSeting() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  compareRevData.compareBListValues.dbValues = [];
  compareRevData.compareBListValues.dbValues.push({
    propDisplayValue: null,
    propInternalValue: null,
  });
  let stdbook = treeABook;
  let revList;
  for (let i = 0; i < stdbook.props.revision_list.dbValues.length; i++) {
    if (stdbook.props.revision_list.dbValues[i] == stdbook.uid) {
      revList = stdbook.props.revision_list.dbValues.slice(i + 1);
      break;
    }
  }
  revList = com.getObject(revList);
  for (let i = 0; i < revList.length; i++) {
    let temp = revList[i].props.object_string.dbValues[0].split('/');
    temp = temp[1].split(';');
    temp = temp[0];
    compareRevData.compareBListValues.dbValues.push({
      propDisplayValue: temp,
      propInternalValue: revList[i].uid,
    });
  }
  compareRevData.compareBListValues.dbValue = compareRevData.compareBListValues.dbValues;
}

/**
 * 리비전 비교의 비교 트리가 리비전이 선택되면 비교트리를 새로 로드해줌
 */
async function compareRevSet() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let aTableReset = compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects;
  for (let i of aTableReset) {
    if (i.props.comparison) {
      i.props.comparison = {};
    }
  }
  eventBus.publish('compareTreeA.plTable.clientRefresh');
  let comBook = com.getObject(compareRevData.compareBList.dbValue);
  treeBBook = comBook;
  eventBus.publish('compareTreeB.plTable.reload');
  await comTreeOpen();
  bTreeLengthCheck = 0;
}

let bTreeLengthCheck = 0;
async function comTreeOpen() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let whileTrue = true;
  let maxCount = 0;
  while (whileTrue) {
    if (maxCount > 20) {
      break;
    }
    await common.delay(100);
    if (compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects.length > bTreeLengthCheck) {
      break;
    }
    maxCount++;
  }
  if (maxCount < 20) {
    bTreeLengthCheck = compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects.length;
    let treeOpenState = false;
    let treeData = compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects;
    for (let i of treeData) {
      if (!i.isLeaf) {
        if (!i.isExpanded) {
          i.isExpanded = true;
          treeOpenState = true;
          eventBus.publish('compareTreeB.plTable.toggleTreeNode', i);
          break;
        }
      }
    }
    if (treeOpenState) {
      await comTreeOpen();
    }
  }
}

/**
 * 리비전의 bom구조 변경점을 시각적으로 확인하는 코드
 */
async function compareTreeDataSet() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let aTreeData = compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects;
  let bTreeData = compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects;
  let reviseM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise');
  let createM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'added');
  let deleteM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'delete');
  for (let i = 0; i < aTreeData.length; i++) {
    for (let j = 0; j < bTreeData.length; j++) {
      if (aTreeData[i].props.revision_list.dbValues.includes(bTreeData[j].uid)) {
        if (aTreeData[i].props.revision_list.dbValues.indexOf(aTreeData[i].uid) < aTreeData[i].props.revision_list.dbValues.indexOf(bTreeData[j].uid)) {
          aTreeData[i].props.comparison = {
            dbValue: reviseM,
            uiValue: reviseM,
          };
          bTreeData[j].props.comparison = {
            dbValue: reviseM,
            uiValue: reviseM,
          };
          break;
        }
      }
    }
  }
  let aTreeUidArr = [];
  let bTreeUidArr = [];
  for (let i of aTreeData) {
    aTreeUidArr.push(i.uid);
  }
  for (let i of bTreeData) {
    bTreeUidArr.push(i.uid);
  }
  let aTreeDataTemp = aTreeData.filter((x) => !bTreeUidArr.includes(x.uid));
  let tempA = aTreeDataTemp.filter((x) => !x.props.comparison);
  if (tempA.length == 0) {
    aTreeDataTemp = aTreeDataTemp.filter((x) => !x.props.comparison.dbValue);
  } else {
    aTreeDataTemp = tempA;
  }
  for (let i of aTreeData) {
    for (let j of aTreeDataTemp) {
      if (i.uid == j.uid) {
        i.props.comparison = {
          dbValue: deleteM,
          uiValue: deleteM,
        };
      }
    }
  }
  let bTreeDataTemp = bTreeData.filter((x) => !aTreeUidArr.includes(x.uid));
  let tempB = bTreeDataTemp.filter((x) => !x.props.comparison);
  if (tempB.length == 0) {
    bTreeDataTemp = bTreeDataTemp.filter((x) => !x.props.comparison.dbValue);
  } else {
    bTreeDataTemp = tempB;
  }
  for (let i of bTreeData) {
    for (let j of bTreeDataTemp) {
      if (i.uid == j.uid) {
        i.props.comparison = {
          dbValue: createM,
          uiValue: createM,
        };
      }
    }
  }

  for (let i of aTreeData) {
    if (i.props.comparison) {
      if (i.props.comparison.dbValue == reviseM) {
        i.gridDecoratorStyle = 'reviseBackground';
      } else if (i.props.comparison.dbValue == createM) {
        i.gridDecoratorStyle = 'createBackground';
      } else if (i.props.comparison.dbValue == deleteM) {
        i.gridDecoratorStyle = 'deleteBackground';
      }
    }
  }
  for (let i of bTreeData) {
    if (i.props.comparison) {
      if (i.props.comparison.dbValue == reviseM) {
        i.gridDecoratorStyle = 'reviseBackground';
      } else if (i.props.comparison.dbValue == createM) {
        i.gridDecoratorStyle = 'createBackground';
      } else if (i.props.comparison.dbValue == deleteM) {
        i.gridDecoratorStyle = 'deleteBackground';
      }
    }
  }
  compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = [];
  compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = [];
  await common.delay(100);
  compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = aTreeData;
  compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = bTreeData;

  // eventBus.publish('compareTreeA.plTable.clientRefresh');
  // eventBus.publish('compareTreeB.plTable.clientRefresh');

  // await common.delay(500);
  // let aTreeHtml = document.getElementById('compareATreeId');
  // aTreeHtml = aTreeHtml.children;
  // aTreeHtml = aTreeHtml[0];
  // aTreeHtml = aTreeHtml.children;
  // aTreeHtml = aTreeHtml[0];
  // aTreeHtml = aTreeHtml.children;
  // aTreeHtml = aTreeHtml[2];
  // aTreeHtml = aTreeHtml.children;
  // aTreeHtml = aTreeHtml[1];
  // aTreeHtml = aTreeHtml.children;
  // aTreeHtml = aTreeHtml[0];
  // aTreeHtml = aTreeHtml.children;
  // for (let i = 0; i < aTreeHtml.length; i++) {
  //   if (aTreeHtml[i].vmo.props.comparison) {
  //     if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
  //       aTreeHtml[i].classList.add('reviseBackground');
  //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
  //       aTreeHtml[i].classList.add('createBackground');
  //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
  //       aTreeHtml[i].classList.add('deleteBackground');
  //     }
  //   }
  // }

  // let bTreeHtml = document.getElementById('compareBTreeId');
  // bTreeHtml = bTreeHtml.children;
  // bTreeHtml = bTreeHtml[0];
  // bTreeHtml = bTreeHtml.children;
  // bTreeHtml = bTreeHtml[0];
  // bTreeHtml = bTreeHtml.children;
  // bTreeHtml = bTreeHtml[2];
  // bTreeHtml = bTreeHtml.children;
  // bTreeHtml = bTreeHtml[1];
  // bTreeHtml = bTreeHtml.children;
  // bTreeHtml = bTreeHtml[0];
  // bTreeHtml = bTreeHtml.children;
  // for (let i = 0; i < bTreeHtml.length; i++) {
  //   if (bTreeHtml[i].vmo.props.comparison) {
  //     if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
  //       bTreeHtml[i].classList.add('reviseBackground');
  //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
  //       bTreeHtml[i].classList.add('createBackground');
  //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
  //       bTreeHtml[i].classList.add('deleteBackground');
  //     }
  //   }
  // }
}

let treeADataTemp;
let treeBDataTemp;
/**
 * 리비전 비교 변경 내용만 보기 기능 코드
 */
async function tableOnlyChanges() {
  const compareRevData = vms.getViewModelUsingElement(document.getElementById('compareRevData'));
  let reviseM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise');
  let createM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'added');
  let deleteM = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'delete');
  if (compareRevData.onlyChanges.dbValue) {
    let aTreeData = compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects;
    let bTreeData = compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects;

    treeADataTemp = aTreeData;
    treeBDataTemp = bTreeData;

    aTreeData = aTreeData.filter((x) => x.props.comparison);
    bTreeData = bTreeData.filter((x) => x.props.comparison);
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = aTreeData;
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = bTreeData;
    eventBus.publish('compareTreeA.plTable.clientRefresh');
    eventBus.publish('compareTreeB.plTable.clientRefresh');
    for (let i of aTreeData) {
      if (i.props.comparison) {
        if (i.props.comparison.dbValue == reviseM) {
          i.gridDecoratorStyle = 'reviseBackground';
        } else if (i.props.comparison.dbValue == createM) {
          i.gridDecoratorStyle = 'createBackground';
        } else if (i.props.comparison.dbValue == deleteM) {
          i.gridDecoratorStyle = 'deleteBackground';
        }
      }
    }
    for (let i of bTreeData) {
      if (i.props.comparison) {
        if (i.props.comparison.dbValue == reviseM) {
          i.gridDecoratorStyle = 'reviseBackground';
        } else if (i.props.comparison.dbValue == createM) {
          i.gridDecoratorStyle = 'createBackground';
        } else if (i.props.comparison.dbValue == deleteM) {
          i.gridDecoratorStyle = 'deleteBackground';
        }
      }
    }
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = [];
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = [];
    await common.delay(100);
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = aTreeData;
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = bTreeData;
    // await common.delay(500);
    // let aTreeHtml = document.getElementById('compareATreeId');
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[2];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[1];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // for (let i = 0; i < aTreeHtml.length; i++) {
    //   if (aTreeHtml[i].vmo.props.comparison) {
    //     if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
    //       aTreeHtml[i].classList.add('reviseBackground');
    //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
    //       aTreeHtml[i].classList.add('createBackground');
    //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
    //       aTreeHtml[i].classList.add('deleteBackground');
    //     }
    //   }
    // }

    // let bTreeHtml = document.getElementById('compareBTreeId');
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[2];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[1];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // for (let i = 0; i < bTreeHtml.length; i++) {
    //   if (bTreeHtml[i].vmo.props.comparison) {
    //     if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
    //       bTreeHtml[i].classList.add('reviseBackground');
    //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
    //       bTreeHtml[i].classList.add('createBackground');
    //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
    //       bTreeHtml[i].classList.add('deleteBackground');
    //     }
    //   }
    // }
  } else {
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = treeADataTemp;
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = treeBDataTemp;
    eventBus.publish('compareTreeA.plTable.clientRefresh');
    eventBus.publish('compareTreeB.plTable.clientRefresh');
    for (let i of treeADataTemp) {
      if (i.props.comparison) {
        if (i.props.comparison.dbValue == reviseM) {
          i.gridDecoratorStyle = 'reviseBackground';
        } else if (i.props.comparison.dbValue == createM) {
          i.gridDecoratorStyle = 'createBackground';
        } else if (i.props.comparison.dbValue == deleteM) {
          i.gridDecoratorStyle = 'deleteBackground';
        }
      }
    }
    for (let i of treeBDataTemp) {
      if (i.props.comparison) {
        if (i.props.comparison.dbValue == reviseM) {
          i.gridDecoratorStyle = 'reviseBackground';
        } else if (i.props.comparison.dbValue == createM) {
          i.gridDecoratorStyle = 'createBackground';
        } else if (i.props.comparison.dbValue == deleteM) {
          i.gridDecoratorStyle = 'deleteBackground';
        }
      }
    }
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = [];
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = [];
    await common.delay(100);
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = treeADataTemp;
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = treeBDataTemp;
    // await common.delay(500);
    // let aTreeHtml = document.getElementById('compareATreeId');
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[2];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[1];
    // aTreeHtml = aTreeHtml.children;
    // aTreeHtml = aTreeHtml[0];
    // aTreeHtml = aTreeHtml.children;
    // for (let i = 0; i < aTreeHtml.length; i++) {
    //   if (aTreeHtml[i].vmo.props.comparison) {
    //     if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
    //       aTreeHtml[i].classList.add('reviseBackground');
    //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
    //       aTreeHtml[i].classList.add('createBackground');
    //     } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
    //       aTreeHtml[i].classList.add('deleteBackground');
    //     }
    //   }
    // }

    // let bTreeHtml = document.getElementById('compareBTreeId');
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[2];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[1];
    // bTreeHtml = bTreeHtml.children;
    // bTreeHtml = bTreeHtml[0];
    // bTreeHtml = bTreeHtml.children;
    // for (let i = 0; i < bTreeHtml.length; i++) {
    //   if (bTreeHtml[i].vmo.props.comparison) {
    //     if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
    //       bTreeHtml[i].classList.add('reviseBackground');
    //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
    //       bTreeHtml[i].classList.add('createBackground');
    //     } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
    //       bTreeHtml[i].classList.add('deleteBackground');
    //     }
    //   }
    // }
  }
}

let cloneBookState;
let cloneBookRelItem;
/**
 * 지침 복사 모드를 실행
 */
async function stdBomCopyMode() {
  let treeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selStdTreeData = treeData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  if (!selStdTreeData || !selStdTreeData.props.dgnStdStatus || selStdTreeData.props.dgnStdStatus.dbValue != 'O') {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'copyOnlyStdBook'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return;
  }
  await com.getProperties(selStdTreeData, ['L2_DesignStandardRel']);
  if (selStdTreeData.props.L2_DesignStandardRel.dbValues.length > 1) {
    popupService.show({
      declView: 'L2_DgnGuideBookCopyPopup',
      locals: {
        caption: lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'guideBookSet'),
        anchor: 'closePopupAnchor',
      },
      options: {
        clickOutsideToClose: true,
        isModal: false,
        reference: 'referenceId',
        placement: 'bottom-start',
        width: 500,
      },
      outputData: {
        popupId: 'id',
      },
    });
  } else {
    cloneBookState = true;
    cloneBookRelItem = selStdTreeData;
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'selItemPlease'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
  }
}

let tableGuideBook;
/**
 * 복사 대상 지침서 지정
 */
function guideBookCopy() {
  let guideBookCopyData = vms.getViewModelUsingElement(document.getElementById('guideBookCopyData'));
  let treeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selStdTreeData = treeData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  cloneBookState = true;
  cloneBookRelItem = selStdTreeData;
  tableGuideBook = guideBookCopyData.dataProviders.guideBookSelectCopyTableData.selectedObjects[0];
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'selItemPlease'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [],
  );
}

/**
 * 지침서의 bom구조를 포함하여 모두 복사한다. 이때 복사된 객체는 서로 다른 uid를 가지며 붙여넣기한 구조에 복사된 설계 지침이 삽입된다.
 */
async function copyAndPasteBook() {
  if (!cloneBookState || !cloneBookRelItem) {
    return;
  }
  let treeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selStdTreeData = treeData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  if (!selStdTreeData) {
    return;
  }
  if (selStdTreeData.type.includes('Folder')) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noneFolder'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return;
  }

  await com.getProperties(cloneBookRelItem, ['L2_DesignStandardRel']);
  let book;
  if (tableGuideBook) {
    book = com.getObject(tableGuideBook.uid);
  } else {
    book = com.getObject(cloneBookRelItem.props.L2_DesignStandardRel.dbValues[0]);
  }
  await com.getProperties(book, ['object_name']);
  message.show(
    1,
    selStdTreeData.props.object_string.dbValues[0] + '에 ' + book.props.object_name.dbValues[0] + '을(를) 추가 하시겠습니까?',
    [
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'added'),
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'copyCancel'),
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
    ],
    [
      async function () {
        loding.openWindow();
        if (!book.props.revision_list) {
          await com.getProperties(book, ['revision_list']);
        }
        book = com.getObject(book.props.revision_list.dbValues[book.props.revision_list.dbValues.length - 1]);
        let cloneBookRev = await bomUtils.duplicateFromItemRev(book);
        cloneBookRev = cloneBookRev.clonedItemRev;
        await com.getProperties(cloneBookRev, ['item_id']);
        let cloneBookTemp = await com.getItemFromId(cloneBookRev.props.item_id.dbValues[0]);
        let propsArr = [selStdTreeData, cloneBookTemp];
        await com.getProperties(propsArr, ['L2_DesignStandardRel', 'object_name']);
        loding.closeWindow();
        let guideBookArr = selStdTreeData.props.L2_DesignStandardRel.dbValues;
        guideBookArr.unshift(cloneBookTemp.uid);
        let request = {
          objects: [selStdTreeData],
          attributes: {
            L2_DesignStandardRel: {
              stringVec: guideBookArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
        eventBus.publish('designStandardTreeTable.plTable.reload');
        cloneBookTemp = undefined;
        cloneBookState = undefined;
        cloneBookRelItem = undefined;
        tableGuideBook = undefined;
      },
      function () {
        cloneBookState = undefined;
        cloneBookRelItem = undefined;
        tableGuideBook = undefined;
      },
      function () {},
    ],
  );
}

/**
 * 구조트리 폴더 이름 변경 전, 기존 폴더명 설정
 */
function folderNameSet() {
  const designStdData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const data = vms.getViewModelUsingElement(document.getElementById('folderNameData'));
  let selNode = designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  data.objName.dbValue = selNode.props.object_name.dbValues[0];
}

/**
 * 구조 트리 폴더명 변경
 */
async function folderNameEdit() {
  const data = vms.getViewModelUsingElement(document.getElementById('folderNameData'));
  const designStdData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let editName = data.objName.dbValue;
  designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0].props.object_name.dbValue = editName;
  designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0].props.object_name.uiValue = editName;
  designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0].displayName = editName;
  try {
    let param = {
      objects: [designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0]],
      attributes: {
        object_name: {
          stringVec: [editName],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    eventBus.publish('designStandardTreeTable.plTable.clientRefresh');
    return {
      state: 1,
    };
  } catch (e) {
    console.log(e);
  }
}

/**
 * 설계 지침에 첨부된 지침서 ppt를 가져와준다.
 */
async function attachPPTFileTableSet() {
  let book = L2_DesignStandardService.getSelectBook();
  book = com.getObject(book.uid);
  await com.getProperties(book, ['item_id']);
  book = await com.getItemFromId(book.props.item_id.dbValues[0]);
  await com.getProperties(book, ['IMAN_reference']);
  let tableData = com.getObject(book.props.IMAN_reference.dbValues);
  return {
    result: tableData,
    totalFound: tableData.length,
  };
}

/**
 * 파일 업로드 버튼을 임의로 눌러줌.
 */
function uploadClickBook() {
  let btn = document.getElementsByClassName('visibleHidden');
  btn = btn[0];
  btn = btn.children;
  btn = btn[0];
  btn = btn.children;
  btn = btn[2];
  btn.click();
}

/**
 * 지침서의 첨부된 ppt를 바꿔준다.
 */
async function selectedBookReferenceAdd(fileData, ctx) {
  let attachDataset = fileData.get('fmsFile');
  console.log(attachDataset);
  let book = L2_DesignStandardService.getSelectBook();
  book = com.getObject(book.uid);
  await com.getProperties(book, ['item_id']);
  book = await com.getItemFromId(book.props.item_id.dbValues[0]);
  attachDataset = await lgepSummerNoteUtils.uploadFileToDataset(attachDataset);
  await lgepSummerNoteUtils.deleteRelationReference(book);
  await lgepSummerNoteUtils.linkRelationItem(book, attachDataset);
  eventBus.publish('dgnStandardBookPPTTable.plTable.reload');
}

/**
 * 지침서에 첨부된 ppt 다운로드
 */
async function pptDown() {
  let data = vms.getViewModelUsingElement(document.getElementById('pptFileData'));
  let downloadFile = data.dataProviders.dgnStandardBookPPTTableData.viewModelCollection.loadedVMObjects;
  let file = downloadFile[0];
  await com.getProperties(file, ['ref_list']);
  file = com.getObject(file.props.ref_list.dbValues[0]);
  let textTicket;
  try {
    let inputParam = {
      files: [file],
    };
    let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
    textTicket = serachResult.tickets[1][0];
  } catch (err) {
    //console.log(err);
  }
  let URL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;
  const anchorElement = document.createElement('a');
  document.body.appendChild(anchorElement);
  anchorElement.download = file.props.object_string.dbValues[0]; // a tag에 download 속성을 줘서 클릭할 때 다운로드가 일어날 수 있도록 하기
  anchorElement.href = URL; // href에 url 달아주기
  anchorElement.click(); // 코드 상으로 클릭을 해줘서 다운로드를 트리거
  document.body.removeChild(anchorElement); // cleanup - 쓰임을 다한 a 태그 삭제
}

let treeArr = [];
/**
 * 리비전 비교 트리 자식 노드 포함 일괄 출력 실험 코드 사용X
 */
async function ctxOfTreeSet(ctx, nodeBeingExpanded, input) {
  ctx.decoratorToggle = true;
  if (!treeABook) {
    return {
      treeLoadResult: {
        parentNode: nodeBeingExpanded,
        childNodes: [],
        totalChildCount: 0,
        startChildNdx: 0,
      },
    };
  }
  let revBom = await bomUtils.createBOMWindow(null, treeABook);
  let revBomChild = await bomUtils.expandPSAllLevels([revBom.bomLine], undefined);
  let modelObjects = [];
  let childrenArr = [];
  let viewModelArr = [];
  let treeNodeArr = [];
  for (let i of revBomChild.output) {
    modelObjects.push(i.parent.itemRevOfBOMLine);
    childrenArr.push(i.children);
  }
  bomUtils.closeBOMWindow(revBom.bomWindow);
  await com.getProperties(modelObjects, ['object_name', 'item_revision_id']);
  let propsTemp = [];
  for (let i of modelObjects) {
    viewModelArr.push(viewC.constructViewModelObjectFromModelObject(i));
    propsTemp.push(i);
  }
  for (let i = 0; i < viewModelArr.length; i++) {
    let temp = treeView.createViewModelTreeNode(
      viewModelArr[i].uid,
      viewModelArr[i].type,
      viewModelArr[i].props.object_name.dbValues[0],
      nodeBeingExpanded.levelNdx + 1,
      nodeBeingExpanded.levelNdx + 2,
      viewModelArr[i].typeIconURL,
    );
    Object.assign(temp, propsTemp[i]);
    treeNodeArr.push(temp);
  }
  // console.log('트리오비지 모임', { treeNodeArr });
  // console.log('자식 모임', { childrenArr });
  treeArr = treeNodeArr;
  treeArr[treeArr.length - 1].$$treeLevel = 0;
  treeArr[treeArr.length - 1].childNdx = 1;
  treeArr[treeArr.length - 1].alternateID = treeArr[treeArr.length - 1].uid + ',top';
  for (let i of treeArr) {
    if (i.type.includes('Page')) {
      i.isLeaf = true;
    } else {
      i.isLeaf = false;
    }
    i.children = [];
    i.isExpanded = true;
  }
  await treeChildSet(childrenArr);
  // treeArr.reverse()
  treeArr = [treeArr[treeArr.length - 1]];
  console.log('리턴', { treeArr });
  treeABook = undefined;
  return {
    treeLoadResult: {
      parentNode: nodeBeingExpanded,
      childNodes: treeArr,
      totalChildCount: treeArr.length,
      startChildNdx: 0,
    },
  };
  // let homeUid;
  // if (nodeBeingExpanded.uid == input.rootNode.uid) {
  //   nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  // }
  // if (nodeBeingExpanded.uid == 'top') {
  //   if (!treeABook) {
  //     return {
  //       treeLoadResult: {
  //         parentNode: nodeBeingExpanded,
  //         childNodes: [],
  //         totalChildCount: 0,
  //         startChildNdx: 0,
  //       },
  //     };
  //   } else {
  //     return {
  //       result: undefined,
  //     };
  //   }
  // } else {
  //   return {
  //     result: undefined,
  //   };
  // }
}

let childIndexTemp;
/**
 * 사용X
 */
async function treeChildSet(child, recursiveValue) {
  if (recursiveValue) {
    let indexT = childIndexTemp;
    for (let i = 0; child[indexT].length; i++) {
      childIndexTemp--;
      if (!treeArr[childIndexTemp]) return;
      treeArr[childIndexTemp].$$treeLevel = treeArr[indexT].$$treeLevel + 1;
      treeArr[childIndexTemp].childNdx = treeArr[indexT].childNdx + 1;
      treeArr[childIndexTemp].alternateID = treeArr[childIndexTemp].uid + treeArr[indexT].alternateID;
      treeArr[indexT].children.push(treeArr[childIndexTemp]);
      if (child[childIndexTemp].length > 0) {
        await treeChildSet(child, treeArr[childIndexTemp]);
      }
    }
  } else {
    for (let i = treeArr.length - 1; i >= 0; i--) {
      let tempIndex = i;
      for (let j = 0; j < child[tempIndex].length; j++) {
        i--;
        childIndexTemp = i;
        if (!treeArr[i]) return;
        treeArr[i].$$treeLevel = treeArr[tempIndex].$$treeLevel + 1;
        treeArr[i].childNdx = treeArr[tempIndex].childNdx + 1;
        treeArr[i].alternateID = treeArr[i].uid + treeArr[tempIndex].alternateID;
        treeArr[tempIndex].children.push(treeArr[i]);
        if (child[childIndexTemp].length > 0) {
          await treeChildSet(child, treeArr[childIndexTemp]);
        }
        i = childIndexTemp;
      }
    }
  }
}

/**
 * 구조에 포함 된 설계 지침이 2개 이상일때 모든 설계 지침을 보여주는 코드
 */
async function guideBookSelectTableSetting() {
  const data = vms.getViewModelUsingElement(document.getElementById('guideBookSettingData'));
  const tableData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selectTreeValue = tableData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  await com.getProperties(selectTreeValue, ['L2_DesignStandardRel']);
  let bookPropsArr = com.getObject(selectTreeValue.props.L2_DesignStandardRel.dbValues);
  await com.getProperties(bookPropsArr, ['revision_list']);
  let returnArr = [];
  for (let i of bookPropsArr) {
    let rev = com.getObject(i.props.revision_list.dbValues[i.props.revision_list.dbValues.length - 1]);
    returnArr.push(rev);
  }
  await com.getProperties(returnArr, ['item_revision_id', 'object_name']);
  return {
    result: returnArr,
    totalFound: returnArr.length,
  };
}

/**
 * 지침 복사를 사용할때 구조에 포함된 설계 지침이 2개 이상일때 모든 설계지침을 보여주는 코드
 */
async function guideBookSelectCopyTableSetting() {
  const data = vms.getViewModelUsingElement(document.getElementById('guideBookSettingData'));
  const tableData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selectTreeValue = tableData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  await com.getProperties(selectTreeValue, ['L2_DesignStandardRel']);
  let bookPropsArr = com.getObject(selectTreeValue.props.L2_DesignStandardRel.dbValues);
  await com.getProperties(bookPropsArr, ['revision_list']);
  let returnArr = [];
  for (let i of bookPropsArr) {
    let rev = com.getObject(i.props.revision_list.dbValues[i.props.revision_list.dbValues.length - 1]);
    returnArr.push(rev);
  }
  await com.getProperties(returnArr, ['item_revision_id', 'object_name']);
  return {
    result: returnArr,
    totalFound: returnArr.length,
  };
}

let exports = {};

export default exports = {
  pageAllSearchingInit,
  filterRowsWithSort,
  getSearchPageTableData,
  pageAllSearching,
  loadSearchList,
  arrReset,
  useTextSearch,
  recentSearchMode,
  recentAllSearcing,
  reviseHistoryTableSet,
  tableEditStartAction,
  tableEditSaveAction,
  cancelMode,
  revisionCompareSizeSet,
  loadData,
  treeALoadData,
  treeBLoadData,
  revisionCompareInit,
  standardRevSet,
  compareBSeting,
  compareRevSet,
  compareTreeDataSet,
  tableOnlyChanges,
  stdBomCopyMode,
  copyAndPasteBook,
  folderNameSet,
  folderNameEdit,
  attachPPTFileTableSet,
  uploadClickBook,
  selectedBookReferenceAdd,
  pptDown,
  ctxOfTreeSet,
  guideBookSelectTableSetting,
  guideBookSelectCopyTableSetting,
  guideBookCopy,
};

app.factory('L2_DesignStandardPopupService', () => exports);
