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
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
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

function recentAllSearcing(eventData) {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  searchData.searchingName.dbValue = eventData.selectedObjects[0].dbValue;
}

let tableData;
async function pageAllSearching(ctx) {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let searchWord = searchData.searchingName.dbValue;
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

async function pageAllSearchingInit() {
  let searchData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let pageSearchData = vms.getViewModelUsingElement(document.getElementById('pageSearchData'));
  let searchWord = searchData.searchingName.dbValue;
  pageSearchData.searchWord.uiValue = searchWord;
}

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

function cancelMode() {
  const reviseHistoryData = vms.getViewModelUsingElement(document.getElementById('reviseHistoryData'));
  reviseHistoryData.tableEditMode = false;
}

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
async function treeALoadData(result, nodeBeingExpanded, input) {
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

  eventBus.publish('compareTreeA.plTable.clientRefresh');
  eventBus.publish('compareTreeB.plTable.clientRefresh');

  await common.delay(500);
  let aTreeHtml = document.getElementById('compareATreeId');
  aTreeHtml = aTreeHtml.children;
  aTreeHtml = aTreeHtml[0];
  aTreeHtml = aTreeHtml.children;
  aTreeHtml = aTreeHtml[0];
  aTreeHtml = aTreeHtml.children;
  aTreeHtml = aTreeHtml[2];
  aTreeHtml = aTreeHtml.children;
  aTreeHtml = aTreeHtml[1];
  aTreeHtml = aTreeHtml.children;
  aTreeHtml = aTreeHtml[0];
  aTreeHtml = aTreeHtml.children;
  for (let i = 0; i < aTreeHtml.length; i++) {
    if (aTreeHtml[i].vmo.props.comparison) {
      if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
        aTreeHtml[i].classList.add('reviseBackground');
      } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
        aTreeHtml[i].classList.add('createBackground');
      } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
        aTreeHtml[i].classList.add('deleteBackground');
      }
    }
  }

  let bTreeHtml = document.getElementById('compareBTreeId');
  bTreeHtml = bTreeHtml.children;
  bTreeHtml = bTreeHtml[0];
  bTreeHtml = bTreeHtml.children;
  bTreeHtml = bTreeHtml[0];
  bTreeHtml = bTreeHtml.children;
  bTreeHtml = bTreeHtml[2];
  bTreeHtml = bTreeHtml.children;
  bTreeHtml = bTreeHtml[1];
  bTreeHtml = bTreeHtml.children;
  bTreeHtml = bTreeHtml[0];
  bTreeHtml = bTreeHtml.children;
  for (let i = 0; i < bTreeHtml.length; i++) {
    if (bTreeHtml[i].vmo.props.comparison) {
      if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
        bTreeHtml[i].classList.add('reviseBackground');
      } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
        bTreeHtml[i].classList.add('createBackground');
      } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
        bTreeHtml[i].classList.add('deleteBackground');
      }
    }
  }
}

let treeADataTemp;
let treeBDataTemp;
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
    await common.delay(500);
    let aTreeHtml = document.getElementById('compareATreeId');
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[2];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[1];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    for (let i = 0; i < aTreeHtml.length; i++) {
      if (aTreeHtml[i].vmo.props.comparison) {
        if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
          aTreeHtml[i].classList.add('reviseBackground');
        } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
          aTreeHtml[i].classList.add('createBackground');
        } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
          aTreeHtml[i].classList.add('deleteBackground');
        }
      }
    }

    let bTreeHtml = document.getElementById('compareBTreeId');
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[2];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[1];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    for (let i = 0; i < bTreeHtml.length; i++) {
      if (bTreeHtml[i].vmo.props.comparison) {
        if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
          bTreeHtml[i].classList.add('reviseBackground');
        } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
          bTreeHtml[i].classList.add('createBackground');
        } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
          bTreeHtml[i].classList.add('deleteBackground');
        }
      }
    }
  } else {
    compareRevData.dataProviders.compareTreeAData.viewModelCollection.loadedVMObjects = treeADataTemp;
    compareRevData.dataProviders.compareTreeBData.viewModelCollection.loadedVMObjects = treeBDataTemp;
    eventBus.publish('compareTreeA.plTable.clientRefresh');
    eventBus.publish('compareTreeB.plTable.clientRefresh');
    await common.delay(500);
    let aTreeHtml = document.getElementById('compareATreeId');
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[2];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[1];
    aTreeHtml = aTreeHtml.children;
    aTreeHtml = aTreeHtml[0];
    aTreeHtml = aTreeHtml.children;
    for (let i = 0; i < aTreeHtml.length; i++) {
      if (aTreeHtml[i].vmo.props.comparison) {
        if (aTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
          aTreeHtml[i].classList.add('reviseBackground');
        } else if (aTreeHtml[i].vmo.props.comparison.dbValue == createM) {
          aTreeHtml[i].classList.add('createBackground');
        } else if (aTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
          aTreeHtml[i].classList.add('deleteBackground');
        }
      }
    }

    let bTreeHtml = document.getElementById('compareBTreeId');
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[2];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[1];
    bTreeHtml = bTreeHtml.children;
    bTreeHtml = bTreeHtml[0];
    bTreeHtml = bTreeHtml.children;
    for (let i = 0; i < bTreeHtml.length; i++) {
      if (bTreeHtml[i].vmo.props.comparison) {
        if (bTreeHtml[i].vmo.props.comparison.dbValue == reviseM) {
          bTreeHtml[i].classList.add('reviseBackground');
        } else if (bTreeHtml[i].vmo.props.comparison.dbValue == createM) {
          bTreeHtml[i].classList.add('createBackground');
        } else if (bTreeHtml[i].vmo.props.comparison.dbValue == deleteM) {
          bTreeHtml[i].classList.add('deleteBackground');
        }
      }
    }
  }
}

let cloneBookState;
let cloneBookRelItem;
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
  cloneBookState = true;
  cloneBookRelItem = selStdTreeData;
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'selItemPlease'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [],
  );
}

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

  loding.openWindow();
  let nodeItem = await com.getItemFromId(selStdTreeData.props.awb0BomLineItemId.dbValues[0]);
  let nodeItemRev = com.getObject(nodeItem.props.revision_list.dbValues[nodeItem.props.revision_list.dbValues.length - 1]);
  let nodeItemClone = await com.getItemFromId(cloneBookRelItem.props.awb0BomLineItemId.dbValues[0]);
  let nodeItemCloneRev = com.getObject(nodeItemClone.props.revision_list.dbValues[nodeItemClone.props.revision_list.dbValues.length - 1]);
  await com.getProperties(nodeItemCloneRev, ['L2_DesignStandardRel']);
  let book = com.getObject(nodeItemCloneRev.props.L2_DesignStandardRel.dbValues[0]);
  book = com.getObject(book.props.revision_list.dbValues[book.props.revision_list.dbValues.length - 1]);
  let cloneBookRev = await bomUtils.duplicateFromItemRev(book);
  cloneBookRev = cloneBookRev.clonedItemRev;
  await com.getProperties(cloneBookRev, ['item_id']);
  let cloneBookTemp = await com.getItemFromId(cloneBookRev.props.item_id.dbValues[0]);
  let propsArr = [nodeItemRev, cloneBookTemp];
  await com.getProperties(propsArr, ['L2_DesignStandardRel', 'object_name']);
  loding.closeWindow();
  if (nodeItemRev.props.L2_DesignStandardRel.dbValues.length > 0) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'yesDgnStd'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'change'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          let request = {
            objects: [nodeItemRev],
            attributes: {
              L2_DesignStandardRel: {
                stringVec: [cloneBookTemp.uid],
              },
            },
          };
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
          eventBus.publish('designStandardTreeTable.plTable.reload');
          cloneBookTemp = undefined;
          cloneBookState = undefined;
          cloneBookRelItem = undefined;
        },
        function () {},
      ],
    );
    return;
  } else {
    message.show(
      1,
      selStdTreeData.props.object_string.dbValues[0] + '에 ' + cloneBookTemp.props.object_name.dbValues[0] + '을(를) 추가 하시겠습니까?',
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'added'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          let request = {
            objects: [nodeItemRev],
            attributes: {
              L2_DesignStandardRel: {
                stringVec: [cloneBookTemp.uid],
              },
            },
          };
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
          eventBus.publish('designStandardTreeTable.plTable.reload');
          cloneBookTemp = undefined;
          cloneBookState = undefined;
          cloneBookRelItem = undefined;
        },
        function () {},
      ],
    );
  }
}

function folderNameSet() {
  const designStdData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const data = vms.getViewModelUsingElement(document.getElementById('folderNameData'));
  let selNode = designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  data.objName.dbValue = selNode.props.object_name.dbValues[0];
}

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
};

app.factory('L2_DesignStandardPopupService', () => exports);
