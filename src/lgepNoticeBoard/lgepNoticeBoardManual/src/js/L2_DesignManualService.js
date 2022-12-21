import app from 'app';
import SoaService from 'soa/kernel/soaService';
import query from 'js/utils/lgepQueryUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import com from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import popupService from 'js/popupService';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import viewC from 'js/viewModelObjectService';
import fmsUtils from 'js/fmsUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
import loding from 'js/utils/lgepLoadingUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import browserUtils from 'js/browserUtils';

var $ = require('jQuery');
var JSZip = require('jszip');

const numberOfPost = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'numberOfPost');
let selectedValue;
let bom;
let backArrowTempSelectedValue;
let selectedAwTreeNode = undefined;
let bomParent;
let lastNavMode;
let treeBackArrowState;
let summernoteCodeTemp;
let popupId;
let summernoteSet = {
  tabsize: 0,
  width: '100%',
  styleWithSpan: true,
  toolbar: [
    ['fontsize', ['fontsize']],
    ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
    ['color', ['forecolor', 'color']],
    ['table', ['table']],
    ['para', ['ul', 'ol', 'paragraph']],
    ['insert', ['picture', 'link']],
    ['codeview'],
    ['CustomButton', ['uploadImage', 'uploadVideo']],
  ],
  buttons: {
    uploadImage: lgepSummerNoteUtils.summernoteUploadImage,
    uploadVideo: lgepSummerNoteUtils.summernoteUploadVideo,
  },
  fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
};

let front = document.getElementsByClassName('downArrowSpace')[0];
front.addEventListener('click', function () {
  document.getElementsByClassName('downArrow')[0].click();
});
let back = document.getElementsByClassName('upArrowSpace')[0];
back.addEventListener('click', function () {
  document.getElementsByClassName('upArrow')[0].click();
});
common.userLogsInsert('Page Connection', '', 'S', 'Success');

let inputElWidth;
let id;
$(document).on('click', '#pageAllSearchId', async function () {
  id = 'pageAllSearchId';
  inputElWidth = document.querySelector('#pageAllSearchId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_ManualRecentSearch',
    options: {
      clickOutsideToClose: true,
      isModal: false,
      reference: id,
      placement: 'bottom-start',
      width: inputElWidth,
    },
    outputData: {
      popupId: 'id',
    },
  });
  popupId = popupData.id;
});

$(document).on('click', '#pageSearchId', async function () {
  id = 'pageSearchId';
  inputElWidth = document.querySelector('#pageSearchId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_ManualRecentSearch',
    options: {
      clickOutsideToClose: true,
      isModal: false,
      reference: id,
      placement: 'bottom-start',
      width: inputElWidth,
    },
    outputData: {
      popupId: 'id',
    },
  });
  popupId = popupData.id;
});

$(document).on('click', '#pageSearchingId', async function () {
  id = 'pageSearchingId';
  inputElWidth = document.querySelector('#pageSearchingId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_ManualRecentSearch',
    options: {
      clickOutsideToClose: true,
      isModal: false,
      reference: id,
      placement: 'bottom-start',
      width: inputElWidth,
    },
    outputData: {
      popupId: 'id',
    },
  });
  popupId = popupData.id;
});

async function delLink(data, ctx) {
  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
  searchingUser = searchingUser[0];
  await com.getProperties([searchingUser], ['l2_manual_history']);

  let param = {
    objects: [searchingUser],
    attributes: {
      l2_manual_history: {
        stringVec: [],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    await common.userLogsInsert('Delete Keywords', '', 'S', 'Success');
  } catch (err) {
    //console.log(err);
  }

  popupService.show({
    declView: 'L2_ManualRecentSearch',
    options: {
      clickOutsideToClose: true,
      isModal: false,
      reference: id,
      placement: 'bottom-start',
      width: inputElWidth,
    },
    outputData: {
      popupId: 'id',
    },
  });
}

function updateSliderValue(value, ctx) {
  let plusBtn = document.querySelector('.noColor .aw-widgets-plusButton');
  let minusBtn = document.querySelector('.noColor .aw-widgets-minusButton');
  plusBtn.disabled = true;
  minusBtn.disabled = true;

  setTimeout(function () {
    let tableLayout = document.getElementById('pxToEmChange');
    tableLayout.style.transform = `scale(${value})`;
    tableLayout.style.transformOrigin = 'left top';

    plusBtn.disabled = false;
    minusBtn.disabled = false;
  }, 200);
}

async function selectedItemRelationDataset(fileData) {
  let attachDataset = fileData.get('fmsFile');
  attachDataset = await lgepSummerNoteUtils.uploadFileToDataset(attachDataset);
  let item = selectedAwTreeNode.obj;
  await lgepSummerNoteUtils.linkRelationItem(item, attachDataset);
  eventBus.publish('manualAttachFileTable.plTable.reload');
  eventBus.publish('manualAllAttachFileTable.plTable.reload');
}

function uploadClick() {
  if (selectedAwTreeNode.obj.type.includes('Page')) {
    let btn = document.getElementsByClassName('visibleHidden');
    btn = btn[0];
    btn = btn.children;
    btn = btn[0];
    btn = btn.children;
    btn = btn[2];
    btn.click();
  } else {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'onlyPageAttach'));
  }
}

let defaultFolder;
async function addMainFolder() {
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let data = vms.getViewModelUsingElement(document.getElementById('createFolderData'));
  let name = data.objName.dbValue;
  if (!name || name == '') {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noName'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      state: '0',
    };
  }
  try {
    let createFolder;
    if (
      !designStdTreeData.dataProviders.designStandardTreeTableData.selectedObjects[0] ||
      !designStdTreeData.dataProviders.designStandardTreeTableData.selectedObjects[0].type.includes('Folder')
    ) {
      createFolder = await com.createFolder(name, undefined, defaultFolder);
    } else if (designStdTreeData.dataProviders.designStandardTreeTableData.selectedObjects[0].type.includes('Folder')) {
      createFolder = await com.createFolder(name, undefined, designStdTreeData.dataProviders.designStandardTreeTableData.selectedObjects[0]);
    }
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccess'), [], []);
    eventBus.publish('designStandardTreeTable.plTable.reload');
  } catch {
    return {
      state: '0',
    };
  }
  return {
    state: '1',
  };
}

function searchIconEvent() {
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  if (!bomlineTreeData.searchMode) {
    bomlineTreeData.searchMode = true;
    bomlineTreeData.searchingStart = false;
  } else {
    bomlineTreeData.searchMode = false;
    bomlineTreeData.searchingStart = false;
  }
}

function datasetLinkAction(data) {
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + data.datasetLink.dbValue);
}

let reSearchingArr = [];
let searchPage = [];
let searchValueStyle;
let reSearchValue;
async function awtreeSearching(data, ctx) {
  if (popupId) {
    popupService.hide(popupId);
    popupId = undefined;
  }
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let searchValue = data.searchingName.dbValue;
  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let policyArr = policy.getEffectivePolicy();
  policyArr.types.push({
    name: 'L2_User',
    properties: [
      {
        name: 'l2_manual_history',
      },
    ],
  });
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser], policyArr);
  searchingUser = searchingUser[0];

  let dgn2History = searchingUser.props.l2_manual_history.dbValues;
  dgn2History.push(searchValue);
  dgn2History = Array.from(new Set(dgn2History));
  let request = {
    objects: [searchingUser],
    attributes: {
      l2_manual_history: {
        stringVec: dgn2History,
      },
    },
  };
  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);

  searchValue = searchValue.toLowerCase();
  if (reSearchValue == searchValue) {
    awtreeSearchingfront();
    return;
  } else {
    reSearchValue = searchValue;
  }
  searchPage = [];
  let PageNameTemp;
  let pageContentTemp;
  bomlineTreeData.searchingStart = true;
  let count = 0;
  let specialCheck = false;
  for (let i = 0; i < treePageNameArr.length; i++) {
    if (treePageNameArr[i] == null) {
      treePageNameArr[i] = '';
    }
    if (treePageContentStringArr[i] == null) {
      treePageContentStringArr[i] = '';
    }
    let state = false;
    if (searchValue.toLowerCase().includes(' and ')) {
      specialCheck = true;
      let searchWordArr = searchValue.split(/ and /);
      let searchRegTemp = '';
      for (let temp = 0; temp < searchWordArr.length; temp++) {
        if (temp == searchWordArr.length - 1) {
          searchRegTemp += '(?=.*' + searchWordArr[temp] + ').*';
        } else {
          searchRegTemp += '(?=.*' + searchWordArr[temp] + ')';
        }
      }
      let regexAndCase = new RegExp(searchRegTemp, 'gi');
      if (regexAndCase.test(treePageNameArr[i].toLowerCase())) {
        count++;
        state = true;
      }
      if (!state) {
        if (regexAndCase.test(treePageContentStringArr[i].toLowerCase())) {
          count++;
        }
      }
    } else if (searchValue.toLowerCase().includes(' or ')) {
      specialCheck = true;
      let searchWordArr = searchValue.split(/ or /);
      let searchRegTemp = '(';
      for (let temp = 0; temp < searchWordArr.length; temp++) {
        if (temp == searchWordArr.length - 1) {
          searchRegTemp += searchWordArr[temp] + ')';
        } else {
          searchRegTemp += searchWordArr[temp] + '|';
        }
      }
      let regexOrCase = new RegExp(searchRegTemp, 'gi');
      if (regexOrCase.test(treePageNameArr[i].toLowerCase())) {
        count++;
        state = true;
      }
      if (!state) {
        if (regexOrCase.test(treePageContentStringArr[i].toLowerCase())) {
          count++;
        }
      }
    } else if (searchValue.toLowerCase().includes('*')) {
      specialCheck = true;
      let searchWordArr = searchValue.split(/\*/);
      let searchRegTemp = '';
      for (let temp = 0; temp < searchWordArr.length; temp++) {
        if (temp == searchWordArr.length - 1) {
          searchRegTemp += searchWordArr[temp];
        } else {
          searchRegTemp += searchWordArr[temp] + '.*';
        }
      }
      let regexAllCase = new RegExp(searchRegTemp, 'gi');
      if (regexAllCase.test(treePageNameArr[i].toLowerCase())) {
        count++;
        state = true;
      }
      if (!state) {
        if (regexAllCase.test(treePageContentStringArr[i].toLowerCase())) {
          count++;
        }
      }
    } else {
      if (treePageNameArr[i].toLowerCase().includes(searchValue.toLowerCase())) {
        count++;
        state = true;
      }
      if (!state) {
        if (treePageContentStringArr[i].toLowerCase().includes(searchValue.toLowerCase())) {
          count++;
        }
      }
    }
  }
  let searchSuccess = false;
  let preCount = 0;
  for (let i = 0; i < treePageNameArr.length; i++) {
    if (treePageContentStringArr[i] == null) {
      treePageContentStringArr[i] = '';
    }
    if (searchValue == '' || searchValue == null) {
      bomlineTreeData.searchingStart = false;
      break;
    }
    pageContentTemp = treePageContentStringArr[i].toLowerCase();
    pageContentTemp = pageContentTemp.replace(/(\s*)/g, '');
    PageNameTemp = treePageNameArr[i].toLowerCase();
    PageNameTemp = PageNameTemp.replace(/(\s*)/g, '');
    if (specialCheck) {
      let searchWordArr;
      if (searchValue.toLowerCase().includes(' and ')) {
        let searchWordArr = searchValue.split(/ and /);
        let searchRegTemp = '';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += '(?=.*' + searchWordArr[temp] + ').*';
          } else {
            searchRegTemp += '(?=.*' + searchWordArr[temp] + ')';
          }
        }
        let regexAndCase = new RegExp(searchRegTemp, 'gi');
        let andState;
        if (regexAndCase.test(PageNameTemp) || regexAndCase.test(pageContentTemp)) {
          andState = true;
        }
        if (andState) {
          andState = undefined;
          searchValueStyle = searchWordArr;
          for (let j = 0; j < reSearchingArr.length; j++) {
            if (reSearchingArr[j].uid == treePageArr[i].uid) {
              preCount = j;
              break;
            }
          }
          searchSuccess = true;
          bomlineTreeData.page = preCount + 1;
          bomlineTreeData.pageLength = count;
          reSearchingArr.push(treePageArr[i]);
          eventBus.publish('awtree.updateSelection', {
            name: 'bomLineTree',
            selectionValue: treePageArr[i].uid,
          });
          let data = {
            node: {
              obj: treePageArr[i],
            },
          };
          let selTreeTemp = {
            obj: treePageArr[i],
          };
          selectedAwTreeNode = selTreeTemp;
          if (bomlineTreeData.page > bomlineTreeData.pageLength) {
            bomlineTreeData.page = 1;
          }
          pageContentView(data);
          break;
        }
      } else if (searchValue.toLowerCase().includes(' or ')) {
        let searchWordArr = searchValue.split(/ or /);
        let searchRegTemp = '(';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += searchWordArr[temp] + ')';
          } else {
            searchRegTemp += searchWordArr[temp] + '|';
          }
        }
        let regexOrCase = new RegExp(searchRegTemp, 'gi');
        let orState;
        if (regexOrCase.test(PageNameTemp) || regexOrCase.test(pageContentTemp)) {
          orState = true;
        }
        if (orState) {
          searchValueStyle = searchWordArr;
          for (let j = 0; j < reSearchingArr.length; j++) {
            if (reSearchingArr[j].uid == treePageArr[i].uid) {
              preCount = j;
              break;
            }
          }
          searchSuccess = true;
          bomlineTreeData.page = preCount + 1;
          bomlineTreeData.pageLength = count;
          reSearchingArr.push(treePageArr[i]);
          eventBus.publish('awtree.updateSelection', {
            name: 'bomLineTree',
            selectionValue: treePageArr[i].uid,
          });
          let data = {
            node: {
              obj: treePageArr[i],
            },
          };
          let selTreeTemp = {
            obj: treePageArr[i],
          };
          selectedAwTreeNode = selTreeTemp;
          if (bomlineTreeData.page > bomlineTreeData.pageLength) {
            bomlineTreeData.page = 1;
          }
          pageContentView(data);
          break;
        }
      } else if (searchValue.toLowerCase().includes('*')) {
        searchWordArr = searchValue.split(/\*/);
        let searchRegTemp = '';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += searchWordArr[temp];
          } else {
            searchRegTemp += searchWordArr[temp] + '.*';
          }
        }
        let regexAllCase = new RegExp(searchRegTemp, 'gi');
        if (regexAllCase.test(PageNameTemp) || regexAllCase.test(pageContentTemp)) {
          searchValueStyle = searchWordArr;
          for (let j = 0; j < reSearchingArr.length; j++) {
            if (reSearchingArr[j].uid == treePageArr[i].uid) {
              preCount = j;
              break;
            }
          }
          searchSuccess = true;
          bomlineTreeData.page = preCount + 1;
          bomlineTreeData.pageLength = count;
          reSearchingArr.push(treePageArr[i]);
          eventBus.publish('awtree.updateSelection', {
            name: 'bomLineTree',
            selectionValue: treePageArr[i].uid,
          });
          let data = {
            node: {
              obj: treePageArr[i],
            },
          };
          let selTreeTemp = {
            obj: treePageArr[i],
          };
          selectedAwTreeNode = selTreeTemp;
          if (bomlineTreeData.page > bomlineTreeData.pageLength) {
            bomlineTreeData.page = 1;
          }
          pageContentView(data);
          break;
        }
      }
    } else {
      if (PageNameTemp.includes(searchValue) || pageContentTemp.includes(searchValue)) {
        searchValueStyle = [searchValue];
        for (let j = 0; j < reSearchingArr.length; j++) {
          if (reSearchingArr[j].uid == treePageArr[i].uid) {
            preCount = j;
            break;
          }
        }
        searchSuccess = true;
        bomlineTreeData.page = preCount + 1;
        bomlineTreeData.pageLength = count;
        reSearchingArr.push(treePageArr[i]);
        eventBus.publish('awtree.updateSelection', {
          name: 'bomLineTree',
          selectionValue: treePageArr[i].uid,
        });
        let data = {
          node: {
            obj: treePageArr[i],
          },
        };
        let selTreeTemp = {
          obj: treePageArr[i],
        };
        selectedAwTreeNode = selTreeTemp;
        if (bomlineTreeData.page > bomlineTreeData.pageLength) {
          bomlineTreeData.page = 1;
        }
        pageContentView(data);
        break;
      }
    }
    if (i == treePageNameArr.length - 1 && reSearchingArr.length > 0) {
      i = 0;
      reSearchingArr = [];
    }
  }
  for (let i = 0; i < treePageNameArr.length; i++) {
    if (searchValue == '' || searchValue == null) {
      break;
    }
    pageContentTemp = treePageContentStringArr[i].toLowerCase();
    pageContentTemp = pageContentTemp.replace(/(\s*)/g, '');
    PageNameTemp = treePageNameArr[i].toLowerCase();
    PageNameTemp = PageNameTemp.replace(/(\s*)/g, '');
    if (specialCheck) {
      let searchWordArr;
      if (searchValue.toLowerCase().includes(' and ')) {
        let searchWordArr = searchValue.split(/ and /);
        let searchRegTemp = '';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += '(?=.*' + searchWordArr[temp] + ').*';
          } else {
            searchRegTemp += '(?=.*' + searchWordArr[temp] + ')';
          }
        }
        let regexAndCase = new RegExp(searchRegTemp, 'gi');
        let andState;
        if (regexAndCase.test(PageNameTemp) || regexAndCase.test(pageContentTemp)) {
          andState = true;
        }
        if (andState) {
          searchPage.push(treePageArr[i]);
        }
      } else if (searchValue.toLowerCase().includes(' or ')) {
        let searchWordArr = searchValue.split(/ or /);
        let searchRegTemp = '(';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += searchWordArr[temp] + ')';
          } else {
            searchRegTemp += searchWordArr[temp] + '|';
          }
        }
        let regexOrCase = new RegExp(searchRegTemp, 'gi');
        let orState;
        if (regexOrCase.test(PageNameTemp) || regexOrCase.test(pageContentTemp)) {
          orState = true;
        }
        if (orState) {
          searchPage.push(treePageArr[i]);
        }
      } else if (searchValue.toLowerCase().includes('*')) {
        searchWordArr = searchValue.split(/\*/);
        let searchRegTemp = '';
        for (let temp = 0; temp < searchWordArr.length; temp++) {
          if (temp == searchWordArr.length - 1) {
            searchRegTemp += searchWordArr[temp];
          } else {
            searchRegTemp += searchWordArr[temp] + '.*';
          }
        }
        let regexAllCase = new RegExp(searchRegTemp, 'gi');
        if (regexAllCase.test(PageNameTemp) || regexAllCase.test(pageContentTemp)) {
          searchPage.push(treePageArr[i]);
        }
      }
    } else {
      if (PageNameTemp.includes(searchValue) || pageContentTemp.includes(searchValue)) {
        searchPage.push(treePageArr[i]);
      }
    }
  }
  if (!searchSuccess) {
    bomlineTreeData.searchingStart = false;
    reSearchValue = undefined;
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'searchDataNone'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
  }
}

function listPageSearching(eventData, ctx) {
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  bomlineTreeData.searchingName.dbValue = eventData.selectedObjects[0].dbValue;
  awtreeSearching(bomlineTreeData, ctx);
}

function awtreeSearchingBack() {
  if (searchPage.length == 1) {
    return;
  }
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let selTreeNode = selectedAwTreeNode.obj;
  for (let i = 0; i < searchPage.length; i++) {
    if (searchPage[i].uid == selTreeNode.uid) {
      if (i == 0) {
        i = searchPage.length;
        bomlineTreeData.page = bomlineTreeData.pageLength + 1;
      }
      eventBus.publish('awtree.updateSelection', {
        name: 'bomLineTree',
        selectionValue: searchPage[i - 1].uid,
      });
      let data = {
        node: {
          obj: searchPage[i - 1],
        },
      };
      let selTreeTemp = {
        obj: searchPage[i - 1],
      };
      bomlineTreeData.page = bomlineTreeData.page - 1;
      selectedAwTreeNode = selTreeTemp;
      pageContentView(data);
      break;
    }
  }
}

function awtreeSearchingfront() {
  if (searchPage.length == 1) {
    return;
  }
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let selTreeNode = selectedAwTreeNode.obj;
  for (let i = 0; i < searchPage.length; i++) {
    if (searchPage[i].uid == selTreeNode.uid) {
      if (i == searchPage.length - 1) {
        i = -1;
        bomlineTreeData.page = 0;
      }
      eventBus.publish('awtree.updateSelection', {
        name: 'bomLineTree',
        selectionValue: searchPage[i + 1].uid,
      });
      let data = {
        node: {
          obj: searchPage[i + 1],
        },
      };
      let selTreeTemp = {
        obj: searchPage[i + 1],
      };
      bomlineTreeData.page = bomlineTreeData.page + 1;
      if (bomlineTreeData.page > bomlineTreeData.pageLength) {
        bomlineTreeData.page = 1;
      }
      selectedAwTreeNode = selTreeTemp;
      pageContentView(data);
      break;
    }
  }
}

export async function summerNoteImageWidthMax(data) {
  let contents = summernoteCodeTemp;
  let temp = contents;
  if (temp.includes('<svg')) {
    let maxCount = temp.split('</svg>');
    maxCount = maxCount.length - 1;
    for (let i = 0; i < maxCount; i++) {
      if (i > 0) {
        let width = temp.split('<svg width=');
        width = width[1];
        width = width.split('"');
        let height = width[3];
        width = width[1];
        temp = temp.replace('<svg width=', "<svg viewBox='0 0 " + width + ' ' + height + "' preserveAspectRatio='none' width=");
        temp = temp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/gi, 'preserveAspectRatio="none" width="100%" height="100%"');
      } else {
        let width = temp.split('width=');
        width = width[1];
        width = width.split('"');
        let height = width[3];
        width = width[1];
        temp = temp.replace('<svg', "<svg viewBox='0 0 " + width + ' ' + height + "' preserveAspectRatio='none'");
        temp = temp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/gi, 'preserveAspectRatio="none" width="100%" height="100%"');
      }
    }
    if (data.summerNoteWidthMax.dbValue == true) {
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', temp + '<br>');
    } else {
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', contents);
    }
  } else if (temp.includes('<img')) {
    if (data.summerNoteWidthMax.dbValue == true) {
      temp = temp.replace(/style="width: [^"]+"/gi, "style='width: 100%;'");
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', temp + '<br>');
    } else {
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', contents);
    }
  } else if (temp.includes('<video')) {
    if (data.summerNoteWidthMax.dbValue == true) {
      temp = temp.replace(/<video controls="[^"]+"/gi, "<video controls='true' width='100%' height='100%'");
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', temp + '<br>');
    } else {
      //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
      $('#designStandardSummernote').summernote('reset');
      //써머노트 내용 삽입
      $('#designStandardSummernote').summernote('code', contents);
    }
  }
}

async function contentDetailTypeAdd(data) {
  let newLOVName = data.contentDetailType.dbValues[0];
  let createObj = await com.createRelateAndSubmitObjects2('L2_DgnGuideBookContentType', {
    object_name: [newLOVName],
    l2_type: ['2'],
  });
  data.contentDetailTypeValues.dbValue.push({
    propDisplayValue: newLOVName,
    propInternalValue: newLOVName,
  });
  data.contentDetailType.dbValue = newLOVName;
  data.contentDetailType.dbValues[0] = newLOVName;
  data.contentDetailType.uiValue = newLOVName;
  data.contentDetailType.uiValues[0] = newLOVName;
  data.contentDetailType.displayValues = newLOVName;
  data.contentDetailType.newDisplayValues[0] = newLOVName;
  data.contentDetailType.newValue = newLOVName;
  data.contentDetailType.dbOriginalValue = newLOVName;
}

async function contentTypeAdd(data) {
  let newLOVName = data.contentType.dbValues[0];
  let createObj = await com.createRelateAndSubmitObjects2('L2_DgnGuideBookContentType', {
    object_name: [newLOVName],
    l2_type: ['1'],
  });
  data.contentTypeValues.dbValue.push({
    propDisplayValue: newLOVName,
    propInternalValue: newLOVName,
  });
  data.contentType.dbValue = newLOVName;
  data.contentType.dbValues[0] = newLOVName;
  data.contentType.uiValue = newLOVName;
  data.contentType.uiValues[0] = newLOVName;
  data.contentType.displayValues = newLOVName;
  data.contentType.newDisplayValues[0] = newLOVName;
  data.contentType.newValue = newLOVName;
  data.contentType.dbOriginalValue = newLOVName;
}

async function selectedBookViewDetail() {
  const WHILETRUE = true;
  let data;
  while (WHILETRUE) {
    await common.delay(100);
    data = vms.getViewModelUsingElement(document.getElementById('dgnStdViewDetailData'));
    if (data) {
      break;
    }
  }
  let selectedTreeNode;
  if (selectedAwTreeNode) {
    selectedTreeNode = selectedAwTreeNode.obj;
  }
  let getItemId = [selectedValue, selectedTreeNode];
  await com.getProperties(getItemId, ['item_id', 'object_name', 'l2_product_type', 'l2_product_detail_type']);
  let bookItem = await com.getItemFromId(selectedValue.props.item_id.dbValues[0]);
  let pageItem = await com.getItemFromId(selectedTreeNode.props.item_id.dbValues[0]);
  let getProps = [bookItem, pageItem];
  await com.getProperties(getProps, ['item_id', 'object_name', 'l2_page_index', 'IMAN_reference', 'pageIndex']);

  if (selectedAwTreeNode) {
    if (selectedTreeNode.type.includes('Page')) {
      data.treeType = 'page';
      data.pageName.dbValue = pageItem.props.object_name.dbValues[0];
      data.pageIndex.dbValue = pageItem.props.l2_page_index.dbValues[0];

      data.pageName.uiValue = pageItem.props.object_name.dbValues[0];
      data.pageIndex.uiValue = pageItem.props.l2_page_index.dbValues[0];
    } else if (selectedTreeNode.type.includes('Chapter')) {
      data.treeType = 'chapter';
      data.chapterName.dbValue = selectedTreeNode.props.object_name.dbValues[0];

      data.chapterName.uiValue = selectedTreeNode.props.object_name.dbValues[0];
    }
  }
  data.bookId.dbValue = selectedValue.props.item_id.dbValues[0];
  data.bookName.dbValue = selectedValue.props.object_name.dbValues[0];
  // data.datasetLink.dbValue = bookItem.props.IMAN_reference.dbValues[0];

  data.bookId.uiValue = selectedValue.props.item_id.dbValues[0];
  data.bookName.uiValue = selectedValue.props.object_name.dbValues[0];
  // data.datasetLink.uiValue = bookItem.props.IMAN_reference.uiValues[0];
}

function chapterSvgAddAc(data) {
  data.chapterSvgAdd = true;
  let editView = document.getElementsByClassName('aw-layout-panelContent');
  editView = editView[editView.length - 1];
  editView.style.width = window.innerWidth * 0.6 + 'px';
  editView.style.height = window.innerHeight * 0.6 + 'px';
  let summernoteSetTemp = summernoteSet;
  summernoteSetTemp.height = '500px';

  $('#dgnChapterCreateSummernote').summernote(summernoteSetTemp);
}

let createMode;

function chapterMode(data) {
  createMode = 'Chapter';
  return {
    createHeight: '200px',
    createWidth: '400px',
  };
}

function pageMode(data) {
  createMode = 'Page';
  return {
    createHeight: window.innerHeight * 0.8 + 'px',
    createWidth: window.innerWidth * 0.8 + 'px',
  };
}

async function backArrowViewDetailAc() {
  let data = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  data.navMode = 'awTree';
  bomlineTreeSet3();
  await common.delay(500);
  let selectedTreeNode;
  if (selectedAwTreeNode) {
    selectedTreeNode = selectedAwTreeNode.obj;
    eventBus.publish('awtree.updateSelection', {
      name: 'bomLineTree',
      selectionValue: selectedTreeNode.uid,
    });
  }
}

function viewDetailChangeAc() {
  let data = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  data.navMode = 'viewDetail';
}

function navModeTemp() {
  let data = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  if (data) {
    lastNavMode = data.navMode;
  }
  if (designStdTreeData) {
    treeBackArrowState = designStdTreeData.backArrowStatus;
  }
}

function treeNavSet(data) {
  data.navMode = lastNavMode;
  if (!lastNavMode) {
    return;
  } else if (lastNavMode == 'awTree') {
    if (selectedValue) {
      if (selectedValue.type == 'Folder') {
        return;
      }
      bomlineTreeSet3();
    } else {
      return;
    }
  }
  // else if(lastNavMode == "bookmark"){
  // }
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
}

async function deleteCmdAction() {
  let selectedValue = selectedAwTreeNode.obj;

  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  try {
    let parent = findParent(bomlineTreeData.bomLineTree[0], selectedValue.uid);
    bom = await bomUtils.createBOMWindow(null, parent.obj);
    await com.getProperties(bom.bomLine, ['bl_child_lines']);
    let child = com.getObject(bom.bomLine.props.bl_child_lines.dbValues);
    for (let i of child) {
      let string = i.props.object_string.dbValues[0].split('-');
      string = string[string.length - 1];
      if (i.props.object_string.dbValues[0] == selectedValue.props.object_string.dbValues[0]) {
        child = i;
        break;
      }
    }
    await bomUtils.removeChildrenFromParentLine([child]);
    await bomUtils.saveBOMWindow(bom.bomWindow);
  } catch (e) {
    //console.log(e);
  } finally {
    bomUtils.closeBOMWindow(bom.bomWindow);
  }
  bomlineTreeSet2();
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  L2DesignStandardData.pageOpenState = false;
  await common.userLogsInsert('Delete ManualPage', selectedValue.uid, 'S', 'Success');
}

function findParent(parent, uid) {
  let result;
  for (let i of parent.children) {
    if (i.obj.uid == uid) {
      result = parent;
      return result;
    }
  }
  if (result == undefined) {
    for (let i of parent.children) {
      if (i.children.length > 0) {
        result = findParent(i, uid);
        if (result != undefined) {
          return result;
        }
      }
    }
  }
}

function backPage() {
  let selTreeNode = selectedAwTreeNode.obj;
  for (let i = 0; i < treePageArr.length; i++) {
    if (treePageArr[i].uid == selTreeNode.uid) {
      if (i == 0) {
        i = treePageArr.length;
      }
      eventBus.publish('awtree.updateSelection', {
        name: 'bomLineTree',
        selectionValue: treePageArr[i - 1].uid,
      });
      let data = {
        node: {
          obj: treePageArr[i - 1],
        },
      };
      let selTreeTemp = {
        obj: treePageArr[i - 1],
      };
      selectedAwTreeNode = selTreeTemp;
      pageContentView(data);
      break;
    }
  }
}

function frontPage() {
  let selTreeNode = selectedAwTreeNode.obj;
  for (let i = 0; i < treePageArr.length; i++) {
    if (treePageArr[i].uid == selTreeNode.uid) {
      if (i == treePageArr.length - 1) {
        i = 0;
      }
      eventBus.publish('awtree.updateSelection', {
        name: 'bomLineTree',
        selectionValue: treePageArr[i + 1].uid,
      });
      let data = {
        node: {
          obj: treePageArr[i + 1],
        },
      };
      let selTreeTemp = {
        obj: treePageArr[i + 1],
      };
      selectedAwTreeNode = selTreeTemp;
      pageContentView(data);
      break;
    }
  }
}

async function revisePage() {
  let selectedValue = selectedAwTreeNode.obj;
  await com.reviseObject(selectedValue);
}

function treeViewChangeAc() {
  return {
    navMode: 'awTree',
  };
}

function flatAr(arr) {
  let result = arr.slice();
  for (let i = 0; i < result.length; i++) {
    if (Array.isArray(result[i])) {
      result = result.flat();
    }
  }
  return result;
}

async function getBomChildPage(bomLine) {
  let getBomChild = await bomUtils.expandPSOneLevel([bomLine]);
  if (getBomChild.output[0].children.length < 1) {
    return;
  }
  let result = [];
  for (let i of getBomChild.output[0].children) {
    if (!i.itemRevOfBOMLine.type.includes('Page')) {
      result.push(await getBomChildPage(i.bomLine));
    } else {
      result.push(i.itemRevOfBOMLine);
    }
  }
  return flatAr(result);
}

async function childViewOpen(value) {
  if (!value.type.includes('Page')) {
    let state;
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'childListView'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'open'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        function () {
          state = true;
        },
        function () {
          state = false;
        },
      ],
    );
    let tr = true;
    while (tr) {
      await common.delay(100);
      if (state != undefined) {
        break;
      }
    }
    return state;
  }
  return true;
}

function treeSelectNone(tree, value) {
  if (tree.obj.uid == value.uid) {
    tree.selected = true;
  } else {
    tree.selected = false;
  }
  for (let i = 0; i < tree.children.length; i++) {
    treeSelectNone(tree.children[i], value);
  }
}

async function pageContentView(eventData) {
  $('#designStandardSummernote').summernote('reset');
  const data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  let selectedValuePage = eventData.node.obj;
  treeSelectNone(bomlineTreeData.bomLineTree[0], selectedValuePage);
  // let yn = await childViewOpen(selectedValuePage);

  // if (!yn) {
  //     return;
  // }
  if (!selectedValuePage.type.includes('Page')) {
    if (data.chapterMergeView.dbValue == true) {
      loding.openWindow();
      $('#designStandardSummernote').summernote(summernoteSet);
      bom = await bomUtils.createBOMWindow(null, selectedValuePage);
      let selectedBomLineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
      bomUtils.closeBOMWindow(bom.bomWindow);
      if (selectedBomLineView.output[0].children.length < 1) {
        loding.closeWindow();
        return;
      }
      let childmobj = [];
      for (let i of selectedBomLineView.output[0].children) {
        childmobj.push(i.itemRevOfBOMLine);
      }
      let summernoteContents = [];
      let tempContents = [];
      for (let i = 0; i < childmobj.length; i++) {
        if (childmobj[i].type.includes('Page')) {
          let contents = await lgepSummerNoteUtils.readHtmlToSummernoteChapterAndBook(childmobj[i]);
          tempContents.push(contents);
        } else {
          let temp = await getBomChildPage(selectedBomLineView.output[0].children[i].bomLine);
          if (temp) {
            // let kIndex = 0;
            // let backNum = i;
            for (let k of temp) {
              let contents = await lgepSummerNoteUtils.readHtmlToSummernoteChapterAndBook(k);
              tempContents.push(contents);
              // kIndex++;
            }
          }
        }
      }
      for (let i = 0; i < tempContents.length; i++) {
        let tempLength = tempContents[i].split('</svg>');
        for (let j = 0; j < tempLength.length - 1; j++) {
          tempLength[j] = tempLength[j].replaceAll('id="', `id=\"${i}_copy_${j}_`);
          tempLength[j] = tempLength[j].replaceAll('#clip', `#${i}_copy_${j}_clip`);
          tempLength[j] = tempLength[j].replaceAll('#img', `#${i}_copy_${j}_img`);
          tempLength[j] = tempLength[j].replace(/(?<=clipPath id=")(.*?)(?=clip)/g, `${i}_copy_${j}_`);
          tempLength[j] = tempLength[j].replace(/url\(+.*?(?=clip)/g, `url\(#${i}_copy_${j}_`);
          tempLength[j] = tempLength[j].replace(/xlink:href="#+.*?(?=img)/g, `xlink:href="#${i}_copy_${j}_`);
          tempLength[j] = tempLength[j].replace(/" id="+.*?(?=img[0-9999])/g, `" id="${i}_copy_${j}_`);
        }
        tempContents[i] = tempLength.join('');
        summernoteContents.push(tempContents[i]);
      }
      if (summernoteContents.length < 1) {
        return;
      }

      $('#designStandardSummernote').summernote('disable');
      let toolbarData = document.getElementsByClassName('note-toolbar');
      toolbarData = toolbarData[0];
      toolbarData.classList.add('noneToolbar');
      $('#designStandardSummernote').summernote('reset');
      for (let i = 0; i < summernoteContents.length; i++) {
        if (i == 0) {
          $('#designStandardSummernote').summernote('code', summernoteContents[i]);
        } else {
          let tempCode = $('#designStandardSummernote').summernote('code');
          $('#designStandardSummernote').summernote('code', tempCode + '<br><br><hr><br><br>' + summernoteContents[i]);
        }
      }
      let fontTemp = $('#designStandardSummernote').summernote('code');
      let changeFont = /font-size="([^"]+(?="))"/g;
      let matches = fontTemp.matchAll(changeFont);
      let fontSizes = [];
      for (let match of matches) {
        let tmpNum = Number(match[1]);
        fontSizes.push(tmpNum);
      }
      const set = new Set(fontSizes);
      const uniqueArr = [...set];

      //console.log(uniqueArr);
      for (let num of uniqueArr) {
        let reduce = (num * 0.88).toFixed(1);
        //console.log('"'+num+'"');
        fontTemp = fontTemp.replaceAll('"' + num + '"', '"' + reduce + '"');
      }
      $('#designStandardSummernote').summernote('code', fontTemp);
      summernoteCodeTemp = $('#designStandardSummernote').summernote('code');
      L2DesignStandardData.pageOpenState = true;
      loding.closeWindow(data);
    } else {
      await common.delay(200);
      if (selectedAwTreeNode.children.length < 1) {
        return;
      }
      let treeData = {
        node: {
          obj: selectedAwTreeNode.children[0].obj,
        },
      };
      selectedAwTreeNode = selectedAwTreeNode.children[0];
      await pageContentView(treeData);
      return;
    }
  } else if (selectedValuePage.type.includes('Page')) {
    $('#designStandardSummernote').summernote(summernoteSet);
    L2DesignStandardData.pageOpenState = true;
    $('#designStandardSummernote').summernote('disable');
    let toolbarData = document.getElementsByClassName('note-toolbar');
    toolbarData = toolbarData[0];
    toolbarData.classList.add('noneToolbar');
    // await com.getProperties(treePageArr,["item_id"]);
    // let item = [];
    // for(let i=0;i<treePageArr.length;i++){
    //     item.push(await com.getItemFromId(treePageArr[i].props.item_id.dbValues[0]));
    // }
    //console.log("fdsf",{item});
    //console.log("북",{selectedValue});
    // await com.getProperties(selectedValue,["item_id"]);
    // let bookItem = await com.getItemFromId(selectedValue.props.item_id.dbValues[0]);

    // let request = {
    //     objects: item,
    //     attributes: {
    //         l2_reference_book: {
    //             stringVec: [bookItem.uid]
    //         }
    //     }
    // }

    // await SoaService.post("Core-2007-01-DataManagement", "setProperties", request);

    let summernoteContents = await lgepSummerNoteUtils.readHtmlToSummernote(selectedValuePage);
    if (summernoteContents == null) {
      return;
    }
    let temp = summernoteContents;
    let changeFont = /font-size="([^"]+(?="))"/g;
    let matches = temp.matchAll(changeFont);
    let fontSizes = [];
    for (let match of matches) {
      let tmpNum = Number(match[1]);
      fontSizes.push(tmpNum);
    }
    const set = new Set(fontSizes);
    const uniqueArr = [...set];

    //console.log(uniqueArr);
    for (let num of uniqueArr) {
      let reduce = (num * 0.88).toFixed(1);
      //console.log('"'+num+'"');
      temp = temp.replaceAll('"' + num + '"', '"' + reduce + '"');
    }

    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
    $('#designStandardSummernote').summernote('reset');
    //써머노트 내용 삽입
    $('#designStandardSummernote').summernote('code', temp + '<br>');
    if (bomlineTreeData.searchMode) {
      if (Array.isArray(searchValueStyle)) {
        let textTemp = $('#designStandardSummernote').summernote('code').split('</text>');
        for (let i = 0; i < textTemp.length; i++) {
          for (let tempWord of searchValueStyle) {
            if (textTemp[i].toLowerCase().includes(tempWord.toLowerCase())) {
              let regexAllCase = new RegExp(tempWord, 'gi');
              // if(!textTemp[i].includes("tspan")){
              textTemp[i] = textTemp[i].replace(
                regexAllCase,
                "<tspan class='searchFocusClass' style='fill: #ff00ff !important;font-weight: 900 !important;'>" + tempWord + '</tspan>',
              );
            }
          }
          textTemp[i] = textTemp[i] + '</text>';
        }
        textTemp = textTemp.join('');
        $('#designStandardSummernote').summernote('reset');
        $('#designStandardSummernote').summernote('code', textTemp + '<br>');
      }
    }
    summernoteCodeTemp = $('#designStandardSummernote').summernote('code');

    // let pageSize = document.getElementById("pxToEmChange");
    // let width = pageSize.offsetWidth;
    // let height = pageSize.offsetHeight;
    // pageSize.style.width = width+'px';
    // pageSize.style.height = height+'px';
  } else {
    L2DesignStandardData.pageOpenState = false;
  }
  // loding.closeWindow(data);
  widthTemp = undefined;
  heightTemp = undefined;
}
let widthTemp;
let heightTemp;

async function createDgnChapter(data) {
  loding.openWindow();
  let parentObj = selectedAwTreeNode.obj;
  let name = data.objChapterName.dbValue;
  try {
    let request = {
      properties: [
        {
          name: name,
          type: 'L2_ManualChapter',
        },
      ],
    };
    let responseData = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
    let createItem = responseData.output[0].item;
    let createItemRev = responseData.output[0].itemRev;
    // if (data.chapterSvgAdd) {
    // 챕터 내용 넣기
    // }
    bom = await bomUtils.createBOMWindow(null, parentObj);
    let responce = await bomUtils.add(bom.bomLine, createItemRev);
    await bomUtils.saveBOMWindow(bom.bomWindow);
    await common.userLogsInsert('Create ManualChapter', createItem.uid, 'S', 'Success');
  } catch (err) {
    //console.log(err);
    await bomUtils.closeBOMWindow(bom.bomWindow);
  } finally {
    bomUtils.closeBOMWindow(bom.bomWindow);
  }
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessChapter'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [
      function () {
        bomlineTreeSet2();
      },
    ],
  );
  loding.closeWindow();
  return {
    state: 1,
  };
}

function nullCheck(value) {
  if (value == null) {
    return '';
  } else {
    return value;
  }
}

async function createDgnPage(data, ctx) {
  let parentObj = selectedAwTreeNode.obj;
  let name = data.objName.dbValue;
  let contents = $('#dgnPageCreateSummernote').summernote('code');
  let contentsString = lgepSummerNoteUtils.stripTags(contents);
  if (name == '' || contents == '') {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noEmptyProps'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      state: 0,
    };
  }
  loding.openWindow();

  let request = {
    properties: [
      {
        name: name,
        type: 'L2_ManualPage',
      },
    ],
  };
  let responseData = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
  let createItem = responseData.output[0].item;
  let createItemRev = responseData.output[0].itemRev;
  bom = await bomUtils.createBOMWindow(null, parentObj);
  let bomlineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
  await com.getProperties(selectedValue, ['item_id']);
  let selectBook = await com.getItemFromId(selectedValue.props.item_id.dbValues[0]);

  try {
    request = {
      objects: [createItem],
      attributes: {
        l2_page_index: {
          stringVec: [String(bomlineView.output[0].children.length + 1)],
        },
        l2_reference_book: {
          stringVec: [selectBook.uid],
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    request = {
      objects: [createItemRev],
      attributes: {
        l2_content_string: {
          stringVec: [contentsString],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    if (contents.includes('<video')) {
      let result = await lgepSummerNoteUtils.base64ToFileToDatasetVideo(contents, createItemRev);
      contents = result.resultTag;
      await lgepSummerNoteUtils.videoAndTextDataSet(contents, createItemRev);
    } else {
      await lgepSummerNoteUtils.txtFileToDataset(contents, createItemRev);
    }
  } catch (err) {
    //console.log(err);
  }
  await common.userLogsInsert('Create ManualPage', createItem.uid, 'S', 'Success');
  try {
    let responce = await bomUtils.add(bom.bomLine, createItemRev);
    // let precision = await bomUtils.togglePrecision([bom.bomLine]);
    await bomUtils.saveBOMWindow(bom.bomWindow);
    loding.closeWindow();
  } catch (err) {
    //console.log(err);
    bomUtils.closeBOMWindow(bom.bomWindow).then(() => {
      bomlineTreeSet2();
    });
  } finally {
    bomUtils.closeBOMWindow(bom.bomWindow).then(() => {
      bomlineTreeSet2();
    });
  }
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessPage'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [function () {}],
  );
  return {
    state: 1,
  };
}

async function editDgnChapter(data) {
  let name = data.objName.dbValue;

  let editItemRevision = selectedAwTreeNode.obj;
  await com.getProperties(editItemRevision, ['item_id']);
  let editItem = await com.getItemFromId(editItemRevision.props.item_id.dbValues[0]);
  try {
    let request = {
      objects: [editItem],
      attributes: {
        object_name: {
          stringVec: [name],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    request = {
      objects: [editItemRevision],
      attributes: {
        object_name: {
          stringVec: [name],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
  } catch (err) {
    //console.log(err);
  }
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editSuccessChapter'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [
      function () {
        bomlineTreeSet2();
      },
    ],
  );
  return {
    state: 1,
  };
}

async function editDgnPage(data) {
  let name = data.objName.dbValue;
  let contents = $('#dgnPageEditSummernote').summernote('code');
  let contentsString = lgepSummerNoteUtils.stripTags(contents);
  if (name == '' || name == null) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noEmptyProps'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      state: 0,
    };
  }

  let editItemRevision = selectedAwTreeNode.obj;
  let editItem = await com.getItemFromId(editItemRevision.props.item_id.dbValues[0]);
  try {
    let request = {
      objects: [editItem],
      attributes: {
        object_name: {
          stringVec: [name],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    request = {
      objects: [editItemRevision],
      attributes: {
        object_name: {
          stringVec: [name],
        },
        l2_content_string: {
          stringVec: [contentsString],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);

    await lgepSummerNoteUtils.txtFileToDataset($('#dgnPageEditSummernote').summernote('code'), editItemRevision);
  } catch (err) {
    //console.log(err);
  }
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editSuccessPage'),
    [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
    [
      function () {
        bomlineTreeSet2();
      },
    ],
  );
  let tempData = {
    node: {
      obj: editItemRevision,
    },
  };
  pageContentView(tempData);
  return {
    state: 1,
  };
}

async function typeOrDetailTypeSet() {
  let data = vms.getViewModelUsingElement(document.getElementById('dgnPageCreateData'));
  data.createType = createMode;
  let summernoteSetTemp = summernoteSet;
  summernoteSetTemp.height = '700px';
  $('#dgnPageCreateSummernote').summernote(summernoteSetTemp);
}

async function editChapterSet() {
  let selectedObj = selectedAwTreeNode.obj;
  let data = vms.getViewModelUsingElement(document.getElementById('dgnChapterEditData'));
  data.objName.dbValue = selectedObj.props.object_name.dbValues[0];
}

async function editPageSet() {
  let selectedObj = selectedAwTreeNode.obj;
  let data = vms.getViewModelUsingElement(document.getElementById('dgnPageEditData'));
  await com.getProperties(selectedObj, ['l2_content_type', 'l2_content_detail_type', 'l2_reference_parts', 'l2_keywords', 'item_id']);
  let content = await lgepSummerNoteUtils.readHtmlToSummernote(selectedObj);
  data.objName.dbValue = selectedObj.props.object_name.dbValues[0];
  let summernoteSetTemp = summernoteSet;
  summernoteSetTemp.height = '700px';
  $('#dgnPageEditSummernote').summernote(summernoteSetTemp);

  $('#dgnPageEditSummernote').summernote('reset');
  $('#dgnPageEditSummernote').summernote('code', content);
}

function selectedTreeNode(eventData) {
  selectedAwTreeNode = eventData.node;
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  L2DesignStandardData.selectedTreeNodeType = !selectedAwTreeNode.obj.type.includes('Chapter');
  searchValueStyle = undefined;
  reSearchValue = undefined;
}

function bomlineAdd() {
  if (selectedAwTreeNode == undefined) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pageAddPosition'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      treeSelect: false,
    };
  } else {
    let parentObj = selectedAwTreeNode.obj;
    if (parentObj.type.includes('Page')) {
      message.show(
        0,
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pageAddBookChapter'),
        [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
        [],
      );
      return {
        treeSelect: false,
      };
    } else {
      return {
        treeSelect: true,
      };
    }
  }
}

function bomlineEdit() {
  let data = vms.getViewModelUsingElement(document.getElementById('dgnStdViewDetailData'));
  if (selectedAwTreeNode == undefined) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'dgnPagenoSelect'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      treeSelect: false,
    };
  }
  if (selectedAwTreeNode.obj.type.includes('Chapter')) {
    return {
      treeSelect: 'ManualChapter',
    };
  }
  if (!selectedAwTreeNode.obj.type.includes('Page')) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'dgnPagenoSelect'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      treeSelect: false,
    };
  }
  return {
    treeSelect: true,
  };
}

function selFolderCheck() {
  let value = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  value = value.dataProviders.designStandardTreeTableData.selectedObjects[0];
  if (value != undefined && value.type == 'Folder') {
    return {
      folder: true,
    };
  } else {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'bookAddFolder'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      folder: false,
    };
  }
}

async function createDgnBook(data, file) {
  let itemName = data.objName.dbValues[0];
  if (itemName != '') {
    loding.openWindow();
    let value = vms.getViewModelUsingElement(document.getElementById('designStdData'));
    if (
      !value.dataProviders.designStandardTreeTableData.selectedObjects[0] ||
      !value.dataProviders.designStandardTreeTableData.selectedObjects[0].type.includes('Folder')
    ) {
      value = defaultFolder;
    } else {
      value = value.dataProviders.designStandardTreeTableData.selectedObjects[0];
    }

    try {
      let request = {
        properties: [
          {
            name: itemName,
            type: 'L2_ManualBook',
          },
        ],
        container: value,
      };
      let createItem = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
      let createItemRev = createItem.output[0].itemRev;
      createItem = createItem.output[0].item;
      // let fileToDataset = await lgepSummerNoteUtils.uploadFileToDataset(file[0]);
      // lgepSummerNoteUtils.linkRelationItem(createItem, fileToDataset);
      await common.userLogsInsert('Create ManualBook', createItem.uid, 'S', 'Success');
      loding.closeWindow();
      message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'manualCreated'), [], []);
      eventBus.publish('designStandardTreeTable.plTable.reload');
    } catch (err) {
      message.show(
        2,
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'manualCreateFail') + '\n ' + err.message,
        [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
        [],
      );
    }
    return {
      state: 1,
    };
  } else {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noProperty'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      state: 0,
    };
  }
}

let bookmarkModeTemp;

function backArrowBookmark() {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  standardNavData.navMode = bookmarkModeTemp;
}

async function bookmark() {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  bookmarkModeTemp = standardNavData.bookMarkMode;
  standardNavData.navMode = 'bookmark';
  let policyArr = policy.getEffectivePolicy();
  policyArr.types.push({
    name: 'Folder',
    properties: [
      {
        name: 'contents',
      },
    ],
  });

  let loadObj;
  let bookmarkFolderUid = await lgepPreferenceUtils.getPreference('L2_DesignGuide_DesignStandards');
  bookmarkFolderUid = bookmarkFolderUid.Preferences.prefs[0].values[0].value;
  try {
    let getPropertiesParam = {
      uids: [bookmarkFolderUid],
    };
    loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam, policyArr);
  } catch (err) {
    //console.log(err);
  }
  let bookmarkFolder = loadObj.modelObjects[bookmarkFolderUid];
}

function forwardArrow() {
  selectedValue = selectedValueTemp;
  selectedValueTemp = undefined;
  selectedAwTreeNode = selectedAwTreeNodeTemp;
  selectedAwTreeNodeTemp = undefined;
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  const designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  standardNavData.selValue = backArrowTempSelectedValue;
  designStdTreeData.backArrowStatus = undefined;
  L2DesignStandardData.selectedBook = selectBookTemp;
  designStdTreeData.dataProviders.designStandardTreeTableData.selectedObjects[0] = selectedValue;
  bomlineTreeSet2(undefined);
}
let selectBookTemp;
let selectedValueTemp;
let selectedAwTreeNodeTemp;

function backArrow() {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  const designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  backArrowTempSelectedValue = standardNavData.selValue;
  standardNavData.navMode = undefined;
  standardNavData.selValue = undefined;
  designStdTreeData.backArrowStatus = true;
  selectBookTemp = L2DesignStandardData.selectedBook;
  L2DesignStandardData.selectedBook = undefined;
  selectedValueTemp = selectedValue;
  selectedValue = undefined;
  selectedAwTreeNodeTemp = selectedAwTreeNode;
  selectedAwTreeNode = undefined;
}

async function getLastRevision(response) {
  await com.getProperties(response, ['revision_list']);

  // revision_list 중 최신것만 배열로 담기
  let targetRevisioList = [];
  for (let mo of response) {
    let revisionUid = mo.props.revision_list.dbValues[mo.props.revision_list.dbValues.length - 1];
    let revision = com.getObject(revisionUid);
    targetRevisioList.push(revision);
  }

  return targetRevisioList;
}

async function getColumnChartData(data) {
  await common.delay(200);
  let arrayOfSeriesDataForChartLine = [];
  //차트 데이터가 들어가는 배열
  let keyValueDataForChart = [];
  //차트 항목
  let chartData = [];
  //차트 항목당 개수
  let chartCount = [];

  //데이터에서 차트의 항목이 되는 데이터별로 개수를 세어서 배열에 담아줌
  let count = {};
  //키 : 값 형태로 되어있는 항목 개수의 값만 따로 배열로 가져옴
  chartCount = Object.values(count);

  //모든 차트 데이터 삽입
  // for (let i = 0; i < chartData.length; i++) {
  keyValueDataForChart.push({
    label: 'hihihi',
    value: 5,
  });
  // }

  //내림차순 정렬
  // keyValueDataForChart.sort((a, b) => {
  //     return b.value - a.value;
  // });

  //상위 10개의 데이터만 잘라서 가져옴
  const lineList = keyValueDataForChart.slice(0, 10);

  //상위 10개의 데이터만 최종 차트 데이터로 삽입
  arrayOfSeriesDataForChartLine.push({
    seriesName: '개수',
    keyValueDataForChart: lineList,
    chartPointsConfig: 'colorOverrides',
  });

  return arrayOfSeriesDataForChartLine;
}

async function getUserList() {
  let userData = await query.executeSavedQuery('KnowledgeUserSearch', 'L2_user_id', '*');
  return {
    userList: userData,
  };
}

async function loadPostList(data) {
  return {
    postTotalFound: data.userList.length,
  };
}

async function setPostList(response, data) {
  response = data.userList;
  if (data.dataProviders.postList.viewModelCollection.loadedVMObjects.length === 0) {
    response.sort((a, b) => {
      return b.props.l2_total_post - a.props.l2_total_post;
    });
    let vmoArray = [];
    for (let i = 0; i < 3; i++) {
      let vmo = viewC.constructViewModelObjectFromModelObject(response[i]);
      vmo.cellProperties = {
        type: {
          key: numberOfPost,
          value: String(response[i].props.l2_total_post),
        },
      };
      vmo.rank = i + 1;
      vmoArray.push(vmo);
    }
    response = vmoArray;

    return response;
  } else {
    return '';
  }
}

async function loadList() {
  let listData = com.getObject(selectedValue.props.IMAN_reference.dbValues);
  let listViewData = [];
  for (let i of listData) {
    listViewData.push(viewC.constructViewModelObjectFromModelObject(i));
  }
  return {
    lists: listViewData,
    listsFound: listViewData.length,
  };
}
let TreeNodeTemp = [];
async function bomlineTreeSet(data) {
  try {
    const standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
    selectedValue = standardData.dataProviders.designStandardTreeTableData.selectedObjects[0];
    if (selectedValue.type == 'Folder') {
      return;
    }
    bom = await bomUtils.createBOMWindow(null, selectedValue);
    await com.getProperties(bom.bomLine, ['bl_is_precise']);
    if (bom.bomLine.props.bl_is_precise.uiValues[0] != 'True') {
      await bomUtils.togglePrecision([bom.bomLine]);
      await bomUtils.saveBOMWindow(bom.bomWindow);
    }
    let bomlineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
    let topNode;
    TreeNodeTemp = [];
    treeChild(bomlineView).then((response) => {
      topNode = response;
      TreeNodeTemp.push(topNode);
    });

    message.show(
      0,
      selectedValue.props.object_name.dbValues[0] + lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'openBook'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'open'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'cancle'),
      ],
      [
        function () {
          const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
          standardNavData.selValue = selectedValue;
          eventBus.publish('treeViewChange');
          standardData.dataProviders.designStandardTreeTableData.selectNone();
        },
        function () {},
      ],
    );
  } catch (err) {
    await bomUtils.closeBOMWindow(bom.bomWindow);
  } finally {
    if (bom != undefined) {
      bomUtils.closeBOMWindow(bom.bomWindow);
    }
  }
}
let limit = 1;
async function bomlineTreeSet2(forwardCheck) {
  const standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  if (!selectedValue) {
    if (
      !standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] ||
      standardData.dataProviders.designStandardTreeTableData.selectedObjects[0].type == 'Folder'
    ) {
      L2DesignStandardData.selectedBook = undefined;
      return;
    }
  }
  if (limit > 0) {
    limit--;
    try {
      let tempValue;
      if (standardData.dataProviders.designStandardTreeTableData.selectedObjects[0]) {
        selectedValue = standardData.dataProviders.designStandardTreeTableData.selectedObjects[0];
        tempValue = selectedValue;
      }
      L2DesignStandardData.selectedBook = selectedValue;
      if (!tempValue) {
        tempValue = selectedValue;
      }
      loding.openWindow();
      bom = await bomUtils.createBOMWindow(null, tempValue);
      await com.getProperties(bom.bomLine, ['bl_is_precise']);
      if (bom.bomLine.props.bl_is_precise.uiValues[0] != 'True') {
        await bomUtils.togglePrecision([bom.bomLine]);
        await bomUtils.saveBOMWindow(bom.bomWindow);
      }
      //let bomlineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
      let policyArr = policy.getEffectivePolicy();
      let policyAdd = [
        {
          name: 'L2_DgnPage',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
        {
          name: 'L2_DgnBook',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
        {
          name: 'L2_DgnChapter',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
        {
          name: 'L2_DgnPageRevision',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
        {
          name: 'L2_DgnBookRevision',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
        {
          name: 'L2_DgnChapterRevision',
          properties: [
            {
              name: 'object_name',
            },
          ],
        },
      ];
      policyArr.types.push(policyAdd[0]);
      let bomChild = await bomUtils.expandPSAllLevels([bom.bomLine], undefined);
      let tree = await treeChild2(bomChild.output, undefined);
      TreeNodeTemp = tree;
      const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
      standardNavData.selValue = tempValue;
    } catch (err) {
      //console.log("error", err);
    } finally {
      if (bom != undefined) {
        bomUtils.closeBOMWindow(bom.bomWindow);
        eventBus.publish('treeViewChange');
      }
      loding.closeWindow();
      await common.delay(2000);
      limit++;
    }
  }
}

async function bomlineTreeSet3() {
  let whileTrue = true;
  let bomlineTreeData;
  while (whileTrue) {
    bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
    if (!bomlineTreeData) {
      await common.delay(100);
    } else {
      break;
    }
  }
  bomlineTreeData.bomLineTree = TreeNodeTemp;
  return true;
}

//스타일시트에서 버튼 클릭시 실행되는 메소드
async function bomlineTreeSet4(value) {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  const designStdData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let treeData;
  let wht = true;
  while (wht) {
    treeData = designStdData.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects;
    if (treeData.length > 1) {
      break;
    }
    await common.delay(100);
  }
  for (let i of treeData) {
    if (i.uid == value.uid) {
      value = i;
      break;
    }
  }
  try {
    selectedValue = value;
    if (selectedValue.type == 'Folder') {
      return;
    }
    bom = await bomUtils.createBOMWindow(null, selectedValue);
    let bomlineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
    let topNode;
    TreeNodeTemp = [];
    treeChild(bomlineView).then((response) => {
      topNode = response;
      TreeNodeTemp.push(topNode);
    });
    standardNavData.selValue = selectedValue;
    eventBus.publish('treeViewChange');
    eventBus.publish('treeLoadAction');
  } catch (err) {
    await bomUtils.closeBOMWindow(bom.bomWindow);
  } finally {
    if (bom != undefined) {
      bomUtils.closeBOMWindow(bom.bomWindow);
    }
  }
}

async function treeChild(obj) {
  let name = obj.output[0].parent.bomLine.props.object_string.dbValues[0].split('-');
  if (name.length > 3) {
    name = obj.output[0].parent.itemRevOfBOMLine.props.object_name.dbValues[0];
  } else {
    name = name[name.length - 1];
  }
  let result = {
    label: name,
    expanded: true,
    value: name.replace(/ /g, ''),
    children: [],
    obj: obj.output[0].parent.itemRevOfBOMLine,
  };
  let child = [];
  if (obj.output[0].children.length > 0) {
    for (let i = 0; i < obj.output[0].children.length; i++) {
      child.push(await treeChild(await bomUtils.expandPSOneLevel([obj.output[0].children[i].bomLine])));
    }
  }
  result.children = child;

  return result;
}

let tempObj;
let childIndexTemp;
let treePageArr = [];
let treePageNameArr = [];
let treePageContentStringArr = [];
async function treeChild2(obj, recursiveValue) {
  let name;
  let result = [];
  let propsTemp = [];
  if (recursiveValue) {
    let resultT;
    obj = recursiveValue;
    name = obj.parent.itemRevOfBOMLine.props.object_name.dbValues[0];
    let imgTicketURL = viewC.constructViewModelObjectFromModelObject(obj.parent.itemRevOfBOMLine);
    resultT = {
      label: name,
      expanded: true,
      value: obj.parent.itemRevOfBOMLine.uid,
      children: [],
      obj: obj.parent.itemRevOfBOMLine,
      iconURL: imgTicketURL.typeIconURL,
    };
    // let tempIdx = childIndexTemp;
    for (let i = obj.children.length - 1; i >= 0; i--) {
      // let recrecIdx = tempIdx - (i+1);
      childIndexTemp--;
      resultT.children.push(await treeChild2(undefined, tempObj[childIndexTemp]));
    }
    return resultT;
  } else {
    treePageArr = [];
    treePageNameArr = [];
    reSearchingArr = [];
    for (let i = 0; i < obj.length; i++) {
      propsTemp.push(obj[i].parent.itemRevOfBOMLine);
      if (obj[i].parent.itemRevOfBOMLine.type.includes('Page')) {
        treePageArr.push(obj[i].parent.itemRevOfBOMLine);
      }
    }
    for (let i of treePageArr) {
      treePageNameArr.push(i.props.object_name.dbValues[0]);
    }
    await com.getProperties(propsTemp, ['object_string', 'object_name', 'l2_content_string']);
    for (let i of propsTemp) {
      if (i.type.includes('Page')) {
        treePageContentStringArr.push(i.props.l2_content_string.dbValues[0]);
      }
    }

    let tempIndex;
    tempObj = obj;
    for (let i = obj.length - 1; i >= 0; i--) {
      name = obj[i].parent.itemRevOfBOMLine.props.object_name.dbValues[0];
      let imgTicketURL = viewC.constructViewModelObjectFromModelObject(obj[i].parent.itemRevOfBOMLine);
      let resultIndex = result.push({
        label: name,
        expanded: true,
        value: obj[i].parent.itemRevOfBOMLine.uid,
        children: [],
        obj: obj[i].parent.itemRevOfBOMLine,
        iconURL: imgTicketURL.typeIconURL,
      });
      tempIndex = i;
      for (let j = 0; j < obj[tempIndex].children.length; j++) {
        i--;
        childIndexTemp = i;
        result[resultIndex - 1].children.push(await treeChild2(undefined, obj[i]));
        i = childIndexTemp;
      }
    }
    return result;
  }
}

async function designStdContentLoad(ctx, data) {
  await common.delay(200);
  const standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  if (selectedValue == undefined) {
    return {
      selPage: undefined,
    };
  }
  // TreeNodeTemp[0].children.reverse();
  treeReverse(TreeNodeTemp[0]);

  bomlineTreeData.bomLineTree = TreeNodeTemp;
  if (selectedAwTreeNode) {
    treeSelect(bomlineTreeData.bomLineTree[0], selectedAwTreeNode.obj.uid);
  }
  standardNavData.selValue = selectedValue;
  standardData.backArrowStatus = undefined;
  L2DesignStandardData.selPage = true;
  L2DesignStandardData.revisionListBoxValues.dbValues.push({
    propDisplayValue: null,
    propInternalValue: null,
  });
  for (let i = 0; i < selectedValue.props.revision_list.dbValues.length; i++) {
    L2DesignStandardData.revisionListBoxValues.dbValues.push({
      propDisplayValue: 'Revision ' + String.fromCharCode(65 + i),
      propInternalValue: selectedValue.props.revision_list.dbValues[i],
    });
  }
  L2DesignStandardData.revisionListBox.uiValue =
    L2DesignStandardData.revisionListBoxValues.dbValues[L2DesignStandardData.revisionListBoxValues.dbValues.length - 1].propDisplayValue;
  standardData.dataProviders.designStandardTreeTableData.selectNone();
  return {
    selPage: true,
  };
}

function treeSelect(tree, selectValue) {
  if (tree.value == selectValue) {
    tree.selected = true;
  } else {
    if (tree.children.length > 0) {
      for (let i = 0; i < tree.children.length; i++) {
        treeSelect(tree.children[i], selectValue);
      }
    }
  }
}

function treeReverse(tree) {
  if (tree.children.length > 0) {
    for (let i = 0; i < tree.children.length; i++) {
      treeReverse(tree.children[i]);
    }
    tree.children.reverse();
  }
}

async function loadData() {
  return {
    result: undefined,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let firstCheck = false;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = await lgepPreferenceUtils.getPreference('L2_DesignGuide_HelpManual');
    homeUid = homeUid.Preferences.prefs[0].values[0].value;
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }
  let loadObj;
  try {
    let getPropertiesParam = {
      uids: [homeUid],
    };
    loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }
  let treeObj = loadObj.modelObjects[homeUid];
  try {
    let getPropertiesParam = {
      objects: [treeObj],
      attributes: ['contents'],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let response = com.getObject(treeObj.props.contents.dbValues);
  if (firstCheck) {
    let temp = [];
    let groupFolder = false;
    for (let i = 0; i < response.length; i++) {
      if (response[i].props.object_string.uiValues[0] == userGroup) {
        temp.push(response[i]);
        groupFolder = true;
        break;
      }
    }
    response = temp;
    if (!groupFolder) {
      try {
        let folderData = {
          folders: [
            {
              name: userGroup,
            },
          ],
          container: treeObj,
        };
        let createGroupFolder = await SoaService.post('Core-2006-03-DataManagement', 'createFolders', folderData);
        response = [createGroupFolder.output[0].folder];
      } catch (err) {
        //console.log(err);
      }
    }
    await com.getProperties(response, ['contents']);
    defaultFolder = response[0];
    if (response[0].props.contents.dbValues.length < 1) {
      try {
        let folderData = {
          folders: [
            {
              name: '매뉴얼',
            },
          ],
          container: response[0],
        };
        let createGroupFolder = await SoaService.post('Core-2006-03-DataManagement', 'createFolders', folderData);
        response = [createGroupFolder.output[0].folder];
      } catch (err) {
        //console.log(err);
      }
    } else {
      response = com.getObject(response[0].props.contents.dbValues);
    }
  }

  await com.getProperties(response, [
    'object_string',
    'contents',
    'l2_reference_book',
    'object_desc',
    'fnd0InProcess',
    'ics_subclass_name',
    'object_type',
    'checked_out',
    'owning_user',
    'owning_group',
    'last_mod_date',
    'release_statuses',
    'object_name',
    'revision_list',
  ]);

  let viewArr = [];
  response = response.filter((element, i) => element != null);
  _.forEach(response, function (treeNode) {
    if (!treeNode.type.includes('Folder')) {
      if (treeNode.props.revision_list != undefined) {
        let propsTemp = treeNode;
        treeNode = com.getObject(treeNode.props.revision_list.dbValues[treeNode.props.revision_list.dbValues.length - 1]);
        Object.assign(treeNode.props, propsTemp.props);
      }
    }
    let nodeName = treeNode.props.object_name.dbValues[0];
    let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
    let temp = vmo;
    vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
    Object.assign(vmo, temp);
    if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
      vmo.isLeaf = true;
    } else if (temp.props.contents.dbValues.length > 0) {
      vmo.isLeaf = false;
    }
    vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
    vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
    viewArr.push(vmo);
  });

  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
}

async function attachAllFileTableSet() {
  await com.getProperties(treePageArr, ['IMAN_reference']);
  let result = [];
  for (let i of treePageArr) {
    if (i.props.IMAN_reference.dbValues) {
      result.push(com.getObject(i.props.IMAN_reference.dbValues));
    }
  }
  result = flatAr(result);
  await com.getProperties(result, ['object_name', 'ref_list', 'creation_date', 'owning_user']);
  let imanFile = [];
  for (let i of result) {
    imanFile.push(com.getObject(i.props.ref_list.dbValues[0]));
  }
  await com.getProperties(imanFile, ['file_ext']);
  for (let i = 0; i < result.length; i++) {
    result[i].props.file_ext = imanFile[i].props.file_ext;
  }
  return {
    result: result,
    totalFound: result.length,
  };
}

async function attachFileTableSet() {
  let value = selectedAwTreeNode.obj;
  if (value.type.includes('Page')) {
    await com.getProperties(value, ['IMAN_reference']);
    let result = com.getObject(value.props.IMAN_reference.dbValues);
    await com.getProperties(result, ['object_name', 'ref_list', 'creation_date', 'owning_user']);
    let imanFile = [];
    for (let i of result) {
      imanFile.push(com.getObject(i.props.ref_list.dbValues[0]));
    }
    await com.getProperties(imanFile, ['file_ext']);
    for (let i = 0; i < result.length; i++) {
      // Object.assign(result[i].props,imanFile[i].props);
      result[i].props.file_ext = imanFile[i].props.file_ext;
    }
    return {
      result: result,
      totalFound: result.length,
    };
  }
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

function attachPopupStart() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let value = selectedAwTreeNode.obj;
  data.objName.uiValue = value.props.object_name.dbValues[0];
  // eventBus.publish("manualAttachFileTable.plTable.reload");
}

async function selectDown() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.manualAttachFileTableData.selectedObjects;
  if (downloadFile.length > 1) {
    loding.openWindow();
    let file = [];
    let textTicket = [];
    for (let i of downloadFile) {
      file.push(com.getObject(i.props.ref_list.dbValues[0]));
    }
    try {
      let inputParam = {
        files: file,
      };
      let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
      for (let i = 0; i < file.length; i++) {
        textTicket.push(serachResult.tickets[1][i]);
      }
    } catch (err) {
      //console.log(err);
    }
    let idx = 0;
    let zip = new JSZip();
    for (let i of textTicket) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(i) + '?ticket=' + i;
      let res = await fetch(url);
      let arrayBuffer = await res.arrayBuffer();
      // download.push(new File([arrayBuffer], downloadFile[idx].props.object_name.dbValues[0],{type: 'mime'}));
      zip.file(downloadFile[idx].props.object_name.dbValues[0], arrayBuffer);
      idx++;
    }
    let base64Text = await zip.generateAsync({
      type: 'base64',
    });
    loding.closeWindow();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/octastream;base64,' + base64Text);
    element.setAttribute('download', 'manual.zip');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } else {
    let file = downloadFile[0];
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
}

async function downloadAll() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.manualAttachFileTableData.viewModelCollection.loadedVMObjects;
  if (downloadFile.length > 1) {
    loding.openWindow();
    let file = [];
    let textTicket = [];
    for (let i of downloadFile) {
      file.push(com.getObject(i.props.ref_list.dbValues[0]));
    }
    try {
      let inputParam = {
        files: file,
      };
      let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
      for (let i = 0; i < file.length; i++) {
        textTicket.push(serachResult.tickets[1][i]);
      }
    } catch (err) {
      //console.log(err);
    }
    let idx = 0;
    let zip = new JSZip();
    for (let i of textTicket) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(i) + '?ticket=' + i;
      let res = await fetch(url);
      let arrayBuffer = await res.arrayBuffer();
      // download.push(new File([arrayBuffer], downloadFile[idx].props.object_name.dbValues[0],{type: 'mime'}));
      zip.file(downloadFile[idx].props.object_name.dbValues[0], arrayBuffer);
      idx++;
    }
    let base64Text = await zip.generateAsync({
      type: 'base64',
    });
    loding.closeWindow();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/octastream;base64,' + base64Text);
    element.setAttribute('download', 'manual.zip');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } else {
    let file = downloadFile[0];
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
}

async function selectDownAllFile() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.manualAllAttachFileTableData.selectedObjects;
  if (downloadFile.length > 1) {
    loding.openWindow();
    let file = [];
    let textTicket = [];
    for (let i of downloadFile) {
      file.push(com.getObject(i.props.ref_list.dbValues[0]));
    }
    try {
      let inputParam = {
        files: file,
      };
      let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
      for (let i = 0; i < file.length; i++) {
        textTicket.push(serachResult.tickets[1][i]);
      }
    } catch (err) {
      //console.log(err);
    }
    let idx = 0;
    let zip = new JSZip();
    for (let i of textTicket) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(i) + '?ticket=' + i;
      let res = await fetch(url);
      let arrayBuffer = await res.arrayBuffer();
      // download.push(new File([arrayBuffer], downloadFile[idx].props.object_name.dbValues[0],{type: 'mime'}));
      zip.file(downloadFile[idx].props.object_name.dbValues[0], arrayBuffer);
      idx++;
    }
    let base64Text = await zip.generateAsync({
      type: 'base64',
    });
    loding.closeWindow();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/octastream;base64,' + base64Text);
    element.setAttribute('download', 'manual.zip');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } else {
    let file = downloadFile[0];
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
}

async function downloadAllPage() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.manualAllAttachFileTableData.viewModelCollection.loadedVMObjects;
  if (downloadFile.length > 1) {
    loding.openWindow();
    let file = [];
    let textTicket = [];
    for (let i of downloadFile) {
      file.push(com.getObject(i.props.ref_list.dbValues[0]));
    }
    try {
      let inputParam = {
        files: file,
      };
      let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
      for (let i = 0; i < file.length; i++) {
        textTicket.push(serachResult.tickets[1][i]);
      }
    } catch (err) {
      //console.log(err);
    }
    let idx = 0;
    let zip = new JSZip();
    for (let i of textTicket) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(i) + '?ticket=' + i;
      let res = await fetch(url);
      let arrayBuffer = await res.arrayBuffer();
      // download.push(new File([arrayBuffer], downloadFile[idx].props.object_name.dbValues[0],{type: 'mime'}));
      zip.file(downloadFile[idx].props.object_name.dbValues[0], arrayBuffer);
      idx++;
    }
    let base64Text = await zip.generateAsync({
      type: 'base64',
    });
    loding.closeWindow();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:application/octastream;base64,' + base64Text);
    element.setAttribute('download', 'manual.zip');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } else {
    let file = downloadFile[0];
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
}

function urlBookUidMapping() {
  if (selectedValue) {
    // let pUid = selectedValue.alternateID.split(",");
    // pUid.pop();
    // let pageUrl = "";
    // let j = 1;
    // for (let i = pUid.length - 1; i > -1; i--) {
    //     if (pUid.length > 1 && i < pUid.length - 1 && i > 0) {
    //         pageUrl += String("&p" + j + "=" + pUid[i]);
    //     } else if (pUid.length > 1 && i == 0) {
    //         pageUrl += String("&p" + j + "=" + pUid[i]);
    //     } else {
    //         pageUrl += String("p" + j + "=" + pUid[i]);
    //     }
    //     j++;
    // }
    history.pushState(null, null, '#/lgepNoticeBoardManual?' + selectedValue.uid);
  }
}

async function parameterCheck() {
  let url = document.URL;
  let basicUrl = browserUtils.getBaseURL();
  url = url.replace(basicUrl + '#/lgepNoticeBoardManual', '');
  if (!url.includes('?')) {
    return;
  }
  url = url.replace('?', '');
  let loop = true;
  let standardData;
  while (loop) {
    await common.delay(100);
    standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
    if (standardData) {
      break;
    }
  }
  if (url == '' || url == null) {
    return;
  }
  let book = await com.loadObjects2([url]);
  book = book[url];
  let maxDelay = 0;
  let fail = false;
  while (loop) {
    await common.delay(100);
    for (let i of standardData.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects) {
      if (i.uid == book.uid) {
        loop = false;
        break;
      }
    }
    maxDelay++;
    if (maxDelay == 100) {
      fail = true;
      break;
    }
  }
  if (fail) {
    return;
  }
  standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] = book;
  bomlineTreeSet2();
}

async function pageMove() {
  let standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let searchWord = standardData.searchingName.dbValue;
  let pageSearchData = vms.getViewModelUsingElement(document.getElementById('pageSearchData'));
  let movePage = pageSearchData.dataProviders.searchPageTableData.selectedObjects[0];
  let moveManual = com.getObject(movePage.props.l2_reference_book.dbValues[0]);
  await com.getProperties(moveManual, ['revision_list']);
  let moveManualRevision = com.getObject(moveManual.props.revision_list.dbValues[0]);
  standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] = moveManualRevision;
  await bomlineTreeSet2();
  let bomlineTreeData;
  let whileTrue = true;
  while (whileTrue) {
    await common.delay(100);
    bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
    if (bomlineTreeData) {
      break;
    }
  }
  bomlineTreeData.searchMode = true;
  searchWord = searchWord.split(/\*|\||\&| OR | AND /);
  searchValueStyle = searchWord;
  movePage = com.getObject(movePage.uid);
  let page = {
    node: {
      obj: movePage,
    },
  };
  pageContentView(page);
}

function pageSearchModeStart() {
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  designStdTreeData.pageSearchMode = true;
}

async function fileDelete() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let item = selectedAwTreeNode.obj;
  if (data.selectedTab.tabKey == 'page') {
    let deleteFile = data.dataProviders.manualAttachFileTableData.selectedObjects;
    await lgepSummerNoteUtils.selectFileRelationDelete(item, deleteFile);
    eventBus.publish('manualAttachFileTable.plTable.reload');
  }
  // else if(data.selectedTab.tabKey == "book"){
  //     let deleteFile = data.dataProviders.manualAllAttachFileTableData.selectedObjects
  //     await lgepSummerNoteUtils.selectFileRelationDelete(item,deleteFile);
  //     eventBus.publish("manualAllAttachFileTable.plTable.reload");
  // }
}

let exports = {};

export default exports = {
  loadData,
  loadEmployeeTreeTableData,
  designStdContentLoad,
  bomlineTreeSet,
  loadPostList,
  setPostList,
  getUserList,
  getColumnChartData,
  loadList,
  backArrow,
  forwardArrow,
  bookmark,
  backArrowBookmark,
  createDgnBook,
  selFolderCheck,
  bomlineAdd,
  selectedTreeNode,
  typeOrDetailTypeSet,
  createDgnPage,
  pageContentView,
  treeViewChangeAc,
  bomlineTreeSet2,
  revisePage,
  deleteCmdAction,
  bomlineEdit,
  editPageSet,
  editDgnPage,
  treeNavSet,
  navModeTemp,
  viewDetailChangeAc,
  backArrowViewDetailAc,
  chapterMode,
  pageMode,
  createDgnChapter,
  editChapterSet,
  editDgnChapter,
  selectedBookViewDetail,
  contentTypeAdd,
  contentDetailTypeAdd,
  summerNoteImageWidthMax,
  chapterSvgAddAc,
  datasetLinkAction,
  backPage,
  frontPage,
  treeChild,
  bomlineTreeSet4,
  awtreeSearching,
  searchIconEvent,
  updateSliderValue,
  filterRowsWithSort,
  attachFileTableSet,
  attachAllFileTableSet,
  addMainFolder,
  uploadClick,
  selectedItemRelationDataset,
  attachPopupStart,
  selectDown,
  downloadAll,
  urlBookUidMapping,
  awtreeSearchingBack,
  awtreeSearchingfront,
  parameterCheck,
  selectDownAllFile,
  downloadAllPage,
  pageSearchModeStart,
  fileDelete,
  pageMove,
  delLink,
  listPageSearching,
};

app.factory('L2_DesignManualService', () => exports);
