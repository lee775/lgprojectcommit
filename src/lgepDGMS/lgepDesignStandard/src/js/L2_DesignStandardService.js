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
import iconService from 'js/iconService';
import loding from 'js/utils/lgepLoadingUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import browserUtils from 'js/browserUtils';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import { consolidateObjects } from 'js/declUtils';
import { showPre } from 'js/L2_DesignCheckListService';
import appCtxService from 'js/appCtxService';

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

// 구조트리 검색
$(document).on('click', '#pageAllSearchId', async function () {
  id = 'pageAllSearchId';
  inputElWidth = document.querySelector('#pageAllSearchId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_DesignStandardRecentSearch',
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

// 지침서 트리 검색 긴거
$(document).on('click', '#dgnPageSearchId', async function () {
  id = 'dgnPageSearchId';
  inputElWidth = document.querySelector('#dgnPageSearchId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_DesignStandardRecentSearch',
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

// 지침서 트리 검색 짧은거
$(document).on('click', '#dgnPageSearchingId', async function () {
  id = 'dgnPageSearchingId';
  inputElWidth = document.querySelector('#dgnPageSearchingId').offsetWidth;
  let popupData = await popupService.show({
    declView: 'L2_DesignStandardRecentSearch',
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

// 지침서 클릭시 자세히보기 팝업창
// $(document).on('click', '#pxToEmChange', async function () {
//   await popupService.show({
//     declView: 'svgCloseUp',
//     locals: {
//       caption: ' ',
//       anchor: 'closePopupAnchor',
//     },
//     options: {
//       clickOutsideToClose: true,
//       isModal: true,
//       reference: 'referenceId',
//       placement: 'bottom-start',
//       width: window.innerWidth * 0.9 + 'px',
//       height: window.innerHeight * 0.9 + 'px',
//     },
//     outputData: {
//       popupId: 'id',
//     },
//   });
//   eventBus.publish('closeupViewSuccess');
// });

/**
 * 최근 검색 기록을 모두 지운다.
 */
async function delLink(data, ctx) {
  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
  searchingUser = searchingUser[0];
  await com.getProperties([searchingUser], ['l2_dgn2_history']);

  let param = {
    objects: [searchingUser],
    attributes: {
      l2_dgn2_history: {
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
    declView: 'L2_DesignStandardRecentSearch',
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

/**
 * 지침서 웹에디터를 확대하여 보여준다. 웹에디터 로딩
 */
async function closeupInit() {
  $('#closeupSummernoteDgnStd').summernote({
    tabsize: 0,
    width: '100%',
    toolbar: [],
  });
  $('#closeupSummernoteDgnStd').summernote('code', $('#designStandardSummernote').summernote('code'));
}

/**
 * 설계지침 트리를 선택한 리비전을 바탕으로 다시 뿌림
 */
function treeRevChange() {
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  L2DesignStandardData.pageOpenState = false;
  let changeRev = com.getObject(L2DesignStandardData.revisionListBox.dbValue);
  bomlineTreeSet2(changeRev);
}

/**
 * 지침서가 포함되어있는 구조는 버튼을 삽입해준다.
 *
 * @param {ModelObject} treeNode - 컬럼 데이터
 * @param {htmlElement} htmlElement - 컬럼 HTMLElement
 * @param {String} columnName - 컬럼 명
 */
async function buttonSet(treeNode, htmlElement, columnName) {
  try {
    if (treeNode.props.L2_DesignStandardRel) {
      await com.getProperties(treeNode, ['L2_DesignStandardRel']);
      if (treeNode.props.L2_DesignStandardRel.dbValues.length > 0) {
        let button = document.createElement('button');
        button.type = 'button';
        button.id = 'dgnStdPopupId';
        button.innerHTML = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'guideOpen');
        button.className = 'checkCate btnOwn aw-base-blk-button ng-scope ng-isolate-scope aw-accent-highContrast aw-base-size-auto';
        button.addEventListener('click', dgnStandardBookBomView);
        htmlElement.appendChild(button);
      }
    }
  } catch (e) {
    console.log('error', {
      e,
    });
  }
}

/**
 * 지침서가 2개 이상 구조는 팝업을 띄워주고 1개만 있으면 바로 BomLine Tree로 만들어 보여준다.
 */
async function dgnStandardBookBomView() {
  let treeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let whileTrue = true;
  let selTreeData;
  while (whileTrue) {
    await common.delay(100);
    selTreeData = treeData.dataProviders.designStandardTreeTableData.selectedObjects[0];
    if (selTreeData) {
      break;
    }
  }
  await com.getProperties(selTreeData, ['L2_DesignStandardRel']);
  if (selTreeData.props.L2_DesignStandardRel.dbValues.length > 1) {
    let heightTemp;
    if (selTreeData.props.L2_DesignStandardRel.dbValues.length > 10) {
      heightTemp = 550;
    } else {
      heightTemp = 150 + selTreeData.props.L2_DesignStandardRel.dbValues.length * 40;
    }
    popupService.show({
      declView: 'L2_DgnGuideBookOpenPopup',
      locals: {
        caption: lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'guideBookSet'),
        anchor: 'closePopupAnchor',
      },
      options: {
        clickOutsideToClose: true,
        isModal: true,
        reference: 'referenceId',
        placement: 'bottom-start',
        width: 500,
        height: heightTemp,
      },
      outputData: {
        popupId: 'id',
      },
    });
  } else {
    let book = com.getObject(selTreeData.props.L2_DesignStandardRel.dbValues[0]);
    book = com.getObject(book.props.revision_list.dbValues[book.props.revision_list.dbValues.length - 1]);
    await bomlineTreeSet2(book);
    urlBookUidMapping();
    showPre();
  }
}

/**
 * 지침서가 2개 이상 있는 구조에서 지침서를 선택하여 열었을때 실행되는 메소드
 */
async function guideBookOpen() {
  const data = vms.getViewModelUsingElement(document.getElementById('guideBookSettingData'));
  if (data.dataProviders.guideBookSelectTableData.selectedObjects.length < 1) {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'selectGuideBook'), [], []);
    return {
      state: false,
    };
  }
  let openBook = data.dataProviders.guideBookSelectTableData.selectedObjects[0];
  await bomlineTreeSet2(openBook);
  urlBookUidMapping();
  showPre();
  return {
    state: true,
  };
}

/**
 * SummerNote의 크기를 확대해준다.
 *
 * @param {String} value - 배율
 */
function updateSliderValue(value, ctx) {
  let plusBtn = document.querySelector('.noColor .aw-widgets-plusButton');
  let minusBtn = document.querySelector('.noColor .aw-widgets-minusButton');
  plusBtn.disabled = true;
  minusBtn.disabled = true;
  if (value > 0.95 && value < 1.1) {
    value = 1;
  }

  setTimeout(function () {
    let tableLayout = document.getElementById('pxToEmChange');
    tableLayout.style.transform = `scale(${value})`;
    tableLayout.style.transformOrigin = 'left top';
    plusBtn.disabled = false;
    minusBtn.disabled = false;
  }, 200);
}

/**
 * 페이지에 파일을 첨부해준다. 프리즈 상태이면 개정 후 첨부
 *
 * @param {File} fileData - 첨부된 파일
 */
async function selectedItemRelationDataset(fileData, ctx) {
  let attachDataset = fileData.get('fmsFile');
  let treeState = await revisePrework();
  let releseCheck = treeState.releseCheck;
  let reviseToObj = treeState.reviseToObj;
  if (releseCheck) {
    let fileAttachPage;
    return message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editReviseCheck'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          await com.getProperties(reviseToObj, ['item_id']);
          let request = {
            input: [],
          };
          for (let i of reviseToObj) {
            let item = await com.getItemFromId(i.props.item_id.dbValues[0]);
            request.input.push({
              item: item,
              itemType: item.type,
            });
          }
          let newRevId = await SoaService.post('Core-2006-03-DataManagement', 'generateRevisionIds', request);
          for (let i = 0; i < reviseToObj.length; i++) {
            if (reviseToObj[i].type.includes('Page')) {
              fileAttachPage = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
              reviseObj.push(fileAttachPage);
            } else {
              reviseObj.push(await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId));
            }
          }
          let reviseBook;
          let doubleBom = [];
          for (let i of reviseObj) {
            if (i.type.includes('Book')) {
              reviseBook = i;
            }
            doubleBom.push(await bomUtils.createBOMWindow(null, i));
          }
          let today = new Date();
          let year = today.getFullYear();
          let month = ('0' + (today.getMonth() + 1)).slice(-2);
          let day = ('0' + today.getDate()).slice(-2);
          let dateString = year + '-' + month + '-' + day;
          let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
          let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
          searchingUser = searchingUser[0];
          if (reviseBook) {
            request = {
              objects: [reviseBook],
              attributes: {
                l2_revise_date: {
                  stringVec: [dateString],
                },
                l2_revise_user: {
                  stringVec: [searchingUser.uid],
                },
              },
            };
            await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
          }
          let bomWindowArr = [];
          let bomLineArr = [];
          for (let i of doubleBom) {
            bomWindowArr.push(i.bomWindow);
            bomLineArr.push(i.bomLine);
          }
          await preciseDoubleSet(bomLineArr, bomWindowArr);
          await bomUtils.closeBOMWindows(bomWindowArr);
          reviseObj = [];
          attachDataset = await lgepSummerNoteUtils.uploadFileToDataset(attachDataset);
          let item = fileAttachPage;
          await lgepSummerNoteUtils.linkRelationItem(item, attachDataset);
          eventBus.publish('dgnStandardAttachFileTable.plTable.reload');
          eventBus.publish('dgnStandardAllAttachFileTable.plTable.reload');
        },
        function () {},
      ],
    );
  } else {
    attachDataset = await lgepSummerNoteUtils.uploadFileToDataset(attachDataset);
    let item = selectedAwTreeNode.obj;
    await lgepSummerNoteUtils.linkRelationItem(item, attachDataset);
    eventBus.publish('dgnStandardAttachFileTable.plTable.reload');
    eventBus.publish('dgnStandardAllAttachFileTable.plTable.reload');
  }
}

/**
 * 선택 되어 있는 지침서를 프리즈
 *
 */
async function bookFreeze() {
  let data = vms.getViewModelUsingElement(document.getElementById('FreezeMessageData'));
  if (data.FreezeMessage.dbValue == null || data.FreezeMessage.dbValue == '') {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pleaseFreezeMassage'), [], []);
    return;
  }
  if (selectedValue.uid != selectedValue.props.revision_list.dbValues[selectedValue.props.revision_list.dbValues.length - 1].uid) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'onlyLastRevRelese'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'freeze'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          let lastSelBook = com.getObject(selectedValue.props.revision_list.dbValues[selectedValue.props.revision_list.dbValues.length - 1]);
          let request = {
            objects: [lastSelBook],
            attributes: {
              l2_revise_reason: {
                stringVec: [data.FreezeMessage.dbValue],
              },
            },
          };

          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
          let releseStatus = lastSelBook.props.release_status_list.dbValues[0];
          try {
            if (!releseStatus) {
              await com.createInstance(lastSelBook, 'L2 Design Standard 2 Process');
              common.userLogsInsert('Design Standard Book Freeze', lastSelBook.uid, 'S', 'Success');
            }
          } catch (e) {
            console.log('error', e);
          }
          selectedValue = com.getObject(lastSelBook.uid);
          selectedValue = viewC.constructViewModelObjectFromModelObject(selectedValue);
        },
      ],
    );
  } else {
    let request = {
      objects: [selectedValue],
      attributes: {
        l2_revise_reason: {
          stringVec: [data.FreezeMessage.dbValue],
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    let releseStatus = selectedValue.props.release_status_list.dbValues[0];
    try {
      if (!releseStatus) {
        await com.createInstance(selectedValue, 'L2 Design Standard 2 Process');
        common.userLogsInsert('Design Standard Book Freeze', selectedValue.uid, 'S', 'Success');
      }
    } catch (e) {
      console.log('error', e);
    }
    selectedValue = com.getObject(selectedValue.uid);
    selectedValue = viewC.constructViewModelObjectFromModelObject(selectedValue);
  }

  return {
    result: true,
  };
}

/**
 * 페이지에 파일을 첨부하기 위해 파일 버튼 클릭
 *
 */
function uploadClick() {
  if (!selectedAwTreeNode) {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'onlyPageAttach'));
  } else {
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
}

let defaultFolder;
/**
 * 지침서 페이지에 폴더를 추가
 *
 */
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

/**
 * 페이지 검색을 위해 검색버튼 활성화
 *
 */
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

// function datasetLinkAction(data) {
//   window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + data.datasetLink.dbValue);
// }

let reSearchingArr = [];
let searchPage = [];
let searchValueStyle;
let reSearchValue;
/**
 * 선택된 지침서 내에 있는 페이지를 검색한다.
 *
 * @param {data} data - 검색 데이터
 */
async function awtreeSearching(data, ctx) {
  if (popupId) {
    popupService.hide(popupId);
    popupId = undefined;
  }
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let searchValue = data.searchingName.dbValue;
  let searchValueTemp = searchValue.replace(/(\s*)/g, '');
  if (searchValueTemp == null || searchValueTemp.length < 1) {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'requiredText'), [], []);
    return;
  }
  if (searchValueTemp.length == 1) {
    let regex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if (!regex.test(searchValueTemp)) {
      message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'twoChar'), [], []);
      return;
    }
  }
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

  let dgn2History = searchingUser.props.l2_dgn2_history.dbValues;
  dgn2History.push(searchValue);
  dgn2History = Array.from(new Set(dgn2History));
  let request = {
    objects: [searchingUser],
    attributes: {
      l2_dgn2_history: {
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
    treePageNameArr[i] = treePageNameArr[i].replace(/<[^>]*>?/g, '');
    treePageContentStringArr[i] = treePageContentStringArr[i].replace(/<[^>]*>?/g, '');
  }
  for (let i = 0; i < treePageNameArr.length; i++) {
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

/**
 * 검색이 된 상태에서 위로 올라간다.
 *
 */
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

/**
 * 검색이 된 상태에서 아래로 내려간다.
 *
 */
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

/**
 * svg 파일 및 이미지 파일을 서머노트 크기만큼 늘린다. ( 안씀 )
 */
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

/**
 * 페이지 컨텐츠 디테일 타입을 생성해준다.
 */
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

/**
 * 페이지 컨텐츠 타입을 생성해준다.
 */
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

/**
 * 선택된 지침과 페이지 또는 챕터의 상세정보를 보여줌
 */
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
    selectedValue = com.getObject(selectedValue.uid);
    let getItemId = [selectedValue, selectedTreeNode];
    await com.getProperties(getItemId, ['item_id', 'object_name', 'l2_product_type', 'l2_product_detail_type']);
    let bookItem = await com.getItemFromId(selectedValue.props.item_id.dbValues[0]);
    let pageItem = await com.getItemFromId(selectedTreeNode.props.item_id.dbValues[0]);
    let getProps = [bookItem, pageItem];
    await com.getProperties(getProps, [
      'item_id',
      'object_name',
      'l2_page_index',
      'IMAN_reference',
      'pageIndex',
      'l2_product_detail_type',
      'l2_product_type',
      'l2_content_type',
      'l2_content_detail_type',
      'l2_reference_parts',
      'l2_keywords',
    ]);
    if (selectedTreeNode.type.includes('Page')) {
      data.treeType = 'page';
      data.pageName.dbValue = pageItem.props.object_name.dbValues[0];
      data.pageIndex.dbValue = pageItem.props.l2_page_index.dbValues[0];
      data.contentType.dbValue = pageItem.props.l2_content_type.dbValues[0];
      data.contentDetailType.dbValue = pageItem.props.l2_content_detail_type.dbValues[0];
      data.parts.dbValue = pageItem.props.l2_reference_parts.dbValues[0];
      data.keyword.dbValue = pageItem.props.l2_keywords.dbValues[0];

      data.pageName.uiValue = pageItem.props.object_name.dbValues[0];
      data.pageIndex.uiValue = pageItem.props.l2_page_index.dbValues[0];
      data.contentType.uiValue = pageItem.props.l2_content_type.dbValues[0];
      data.contentDetailType.uiValue = pageItem.props.l2_content_detail_type.dbValues[0];
      data.parts.uiValue = pageItem.props.l2_reference_parts.dbValues[0];
      data.keyword.uiValue = pageItem.props.l2_keywords.dbValues[0];
    } else if (selectedTreeNode.type.includes('Chapter')) {
      data.treeType = 'chapter';
      data.chapterName.dbValue = selectedTreeNode.props.object_name.dbValues[0];

      data.chapterName.uiValue = selectedTreeNode.props.object_name.dbValues[0];
    }
    data.bookId.dbValue = bookItem.props.item_id.dbValues[0];
    data.bookName.dbValue = bookItem.props.object_name.dbValues[0];
    data.productType.dbValue = bookItem.props.l2_product_type.dbValues[0];
    data.productDetailType.dbValue = bookItem.props.l2_product_detail_type.dbValues[0];

    data.bookId.uiValue = bookItem.props.item_id.dbValues[0];
    data.bookName.uiValue = bookItem.props.object_name.dbValues[0];
    data.productType.uiValue = bookItem.props.l2_product_type.dbValues[0];
    data.productDetailType.uiValue = bookItem.props.l2_product_detail_type.dbValues[0];
  } else {
    selectedValue = com.getObject(selectedValue.uid);
    await com.getProperties(selectedValue, ['item_id', 'object_name', 'l2_product_type', 'l2_product_detail_type']);
    let bookItem = await com.getItemFromId(selectedValue.props.item_id.dbValues[0]);
    await com.getProperties(bookItem, ['item_id', 'object_name', 'l2_page_index', 'IMAN_reference', 'pageIndex', 'l2_product_detail_type', 'l2_product_type']);
    data.bookId.dbValue = bookItem.props.item_id.dbValues[0];
    data.bookName.dbValue = bookItem.props.object_name.dbValues[0];
    data.productType.dbValue = bookItem.props.l2_product_type.dbValues[0];
    data.productDetailType.dbValue = bookItem.props.l2_product_detail_type.dbValues[0];

    data.bookId.uiValue = bookItem.props.item_id.dbValues[0];
    data.bookName.uiValue = bookItem.props.object_name.dbValues[0];
    data.productType.uiValue = bookItem.props.l2_product_type.dbValues[0];
    data.productDetailType.uiValue = bookItem.props.l2_product_detail_type.dbValues[0];
  }
}

let createMode;

/**
 * 챕터 생성모드 크기 설정
 */
function chapterMode(data) {
  createMode = 'Chapter';
  return {
    createHeight: '200px',
    createWidth: '400px',
  };
}

/**
 * 페이지 생성모드 크기 설정
 */
function pageMode(data) {
  createMode = 'Page';
  return {
    createHeight: window.innerHeight * 0.8 + 'px',
    createWidth: window.innerWidth * 0.8 + 'px',
  };
}

/**
 * 상세보기 모드에서 뒤로가기 버튼 클릭시 발동
 */
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

/**
 * 상세보기 모드로 전환
 */
function viewDetailChangeAc() {
  let data = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  data.navMode = 'viewDetail';
}

let dataTemp;
/**
 * 네비바를 닫았을때 현재 모드 저장
 */
function navModeTemp() {
  let data = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  dataTemp = data;
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  if (data) {
    lastNavMode = data.navMode;
  }
  if (designStdTreeData) {
    treeBackArrowState = designStdTreeData.backArrowStatus;
  }
}

/**
 * 네비바를 다시 열때 기존 데이터 유지
 * 오후에 해보기
 */
async function treeNavSet(data) {
  if (dataTemp) {
    data = dataTemp;
    dataTemp = undefined;
  }
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
  let bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let selectedValuePage = selectedAwTreeNode.obj;
  let whileTrue = true;
  if (!bomlineTreeData) {
    while (whileTrue) {
      await common.delay(100);
      bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
      if (bomlineTreeData) {
        break;
      }
    }
  }

  if (bomlineTreeData) {
    while (whileTrue) {
      await common.delay(100);
      if (bomlineTreeData.bomLineTree[0]) {
        break;
      }
    }
    console.log('dsfdsfds', { bomlineTreeData });
    treeSelectNone(bomlineTreeData.bomLineTree[0], selectedValuePage);
  }
}

/**
 * 선택된 트리 노드를 BomLine에서 제거, 프리즈 상태 일 경우 개정
 */
async function deleteCmdAction() {
  let selectedDeleteValue = selectedAwTreeNode.obj;
  if (deletePageParent) {
    try {
      bom = await bomUtils.createBOMWindow(null, deletePageParent);
      await com.getProperties(bom.bomLine, ['bl_child_lines']);
      let child = com.getObject(bom.bomLine.props.bl_child_lines.dbValues);
      for (let i of child) {
        if (i.props.object_string.dbValues[0] == selectedDeleteValue.props.object_string.dbValues[0]) {
          child = i;
          break;
        }
      }
      await bomUtils.removeChildrenFromParentLine([child]);
      await bomUtils.saveBOMWindow(bom.bomWindow);
    } catch (e) {
      console.log(e);
    } finally {
      bomUtils.closeBOMWindow(bom.bomWindow);
    }
    bomlineTreeSet2(deleteSuccessBomTreeBook);
    history.pushState(null, null, '#/L2_DesignStandard?' + deleteSuccessBomTreeBook.uid);
    const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
    L2DesignStandardData.pageOpenState = false;
    deletePageParent = undefined;
    deleteSuccessBomTreeBook = undefined;
  } else {
    const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
    try {
      let parent = findParent(bomlineTreeData.bomLineTree[0], selectedDeleteValue.uid);
      bom = await bomUtils.createBOMWindow(null, parent.obj);
      await com.getProperties(bom.bomLine, ['bl_child_lines']);
      let child = com.getObject(bom.bomLine.props.bl_child_lines.dbValues);
      for (let i of child) {
        if (i.props.object_string.dbValues[0] == selectedDeleteValue.props.object_string.dbValues[0]) {
          child = i;
          break;
        }
      }
      await bomUtils.removeChildrenFromParentLine([child]);
      await bomUtils.saveBOMWindow(bom.bomWindow);
    } catch (e) {
      console.log(e);
    } finally {
      bomUtils.closeBOMWindow(bom.bomWindow);
    }
    bomlineTreeSet2(selectedValue);
    const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
    L2DesignStandardData.pageOpenState = false;
  }
  await common.userLogsInsert('Delete dgnPage2', selectedDeleteValue.uid, 'S', 'Success');
}

/**
 * 설계지침 트리에서 부모를 찾는 메소드
 */
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

/**
 * 설계지침서에 웹에디터에 있는 뒤로가기 버튼 클릭시 발동하는 메소드
 */
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

/**
 * 설계지침서 웹에디터에 있는 앞으로가기 버튼 클릭시 발동하는 메소드
 */
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

// async function revisePage() {
//   // let selectedValue = selectedAwTreeNode.obj;
//   // await com.reviseObject(selectedValue);
//   console.log('북먼저 확인', {
//     selectedValue,
//   });
// }

/**
 * 설계지침 트리로 전환
 */
function treeViewChangeAc() {
  return {
    navMode: 'awTree',
  };
}

/**
 * n차원 배열을 1차원 배열로 풀어주는 메소드
 */
function flatAr(arr) {
  let result = arr.slice();
  for (let i = 0; i < result.length; i++) {
    if (Array.isArray(result[i])) {
      result = result.flat();
    }
  }
  return result;
}

/**
 * 지침이나 챕터를 선택하였을때 선택한 아이템 기준으로 하위에 있는 모든 페이지를 가져와 1차원 배열 형태로 만들어 보내준다
 * @param {bomLine} bomLine - 선택된 아이템의 봄라인
 */
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

/**
 * 지침이나 챕터를 열건지 선택 여부를 정해줌 (사용안함)
 * @param {value} value - 선택된 아이템
 */
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

/**
 * 모든 트리의 선택상태를 false로 지정 한 뒤 선택된 아이템만 선택해줌
 * @param {tree} tree - 트리구조
 * @param {value} value - 선택된 아이템
 */
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

/**
 * 선택된 지침서, 챕터, 페이지에 해당하는 내용들을 모두 불러와 웹에디터로 보여줌
 * @param {eventData} eventData - 선택된 아이템이 담긴 Object
 */
async function pageContentView(eventData) {
  $('#designStandardSummernote').summernote('reset');
  const data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  let selectedValuePage = eventData.node.obj;
  let whileTrue = true;

  if (bomlineTreeData) {
    while (whileTrue) {
      await common.delay(100);
      if (bomlineTreeData.bomLineTree[0]) {
        break;
      }
    }
    treeSelectNone(bomlineTreeData.bomLineTree[0], selectedValuePage);
  }

  if (!selectedValuePage.type.includes('Page')) {
    // let yn = await childViewOpen(selectedValuePage);

    // if (!yn) {
    //   return;
    // }
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
      // let changeFont = /font-size="([^"]+(?="))"/g;
      // let matches = fontTemp.matchAll(changeFont);
      // let fontSizes = [];
      // for (let match of matches) {
      //   let tmpNum = Number(match[1]);
      //   fontSizes.push(tmpNum);
      // }
      // const set = new Set(fontSizes);
      // const uniqueArr = [...set];

      // // console.log(uniqueArr);
      // for (let num of uniqueArr) {
      //   let reduce = (num * 0.88).toFixed(1);
      //   //console.log('"'+num+'"');
      //   fontTemp = fontTemp.replaceAll('"' + num + '"', '"' + reduce + '"');
      // }
      let changeFont = /Arial Narrow_MSFontService/g;
      fontTemp = fontTemp.replaceAll(changeFont, 'Arial');
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

    // // let request = {
    // //     objects: item,
    // //     attributes: {
    // //         l2_reference_book: {
    // //             stringVec: [selectedValue.uid]
    // //         }
    // //     }
    // // }

    // // await SoaService.post("Core-2007-01-DataManagement", "setProperties", request);
    // console.log("fdsf",{item})
    // console.log("북",{selectedValue});

    let summernoteContents = await lgepSummerNoteUtils.readHtmlToSummernote(selectedValuePage);
    if (summernoteContents == null) {
      return;
    }
    let temp = summernoteContents;
    // let changeFont = /font-size="([^"]+(?="))"/g;
    // let matches = temp.matchAll(changeFont);
    // let fontSizes = [];
    // for (let match of matches) {
    //   let tmpNum = Number(match[1]);
    //   fontSizes.push(tmpNum);
    // }
    // const set = new Set(fontSizes);
    // const uniqueArr = [...set];

    // // console.log(uniqueArr);
    // for (let num of uniqueArr) {
    //   let reduce = (num * 0.88).toFixed(1);
    //   //console.log('"'+num+'"');
    //   temp = temp.replaceAll('"' + num + '"', '"' + reduce + '"');
    // }
    let changeFont = /Arial Narrow_MSFontService/g;
    temp = temp.replaceAll(changeFont, 'Arial');

    //써머노트에 값 삽입 전 기존에 있던 데이터 초기화
    $('#designStandardSummernote').summernote('reset');
    //써머노트 내용 삽입
    $('#designStandardSummernote').summernote('code', temp + '<br>');
    if (bomlineTreeData) {
      if (bomlineTreeData.searchMode) {
        if (Array.isArray(searchValueStyle)) {
          searchDataLength = 0;
          // let tspanTemp = $('#designStandardSummernote').summernote('code').split("</tspan>");
          // for (let i = 0; i < tspanTemp.length; i++) {
          //     if (tspanTemp[i].toLowerCase().includes(searchValueStyle.toLowerCase())) {
          //         tspanTemp[i] = tspanTemp[i].replace("<tspan", "<tspan fill='#ff00ff'");
          //         if (tspanTemp[i].includes("font-weight")) {
          //             tspanTemp[i] = tspanTemp[i].replace(/font-weight="*"/ig, "font-weight='900'");
          //         } else {
          //             tspanTemp[i] = tspanTemp[i].replace("<tspan", "<tspan font-weight='900'");
          //         }
          //     }
          //     tspanTemp[i] = tspanTemp[i] + "</tspan>";
          // }
          // tspanTemp = tspanTemp.join('');
          let textTemp = $('#designStandardSummernote').summernote('code').split('</text>');
          for (let i = 0; i < textTemp.length; i++) {
            for (let tempWord of searchValueStyle) {
              if (textTemp[i].toLowerCase().includes(tempWord.toLowerCase())) {
                let contentOnly = textTemp[i].replace(/<[^>]*>?/g, '');
                let contentTemp = contentOnly;
                let regexAllCase = new RegExp(tempWord, 'gi');
                let text = textTemp[i].match(regexAllCase);
                text = text[0];
                // if(!textTemp[i].includes("tspan")){
                contentOnly = contentOnly.replace(
                  regexAllCase,
                  "<tspan class='searchFocusClass' style='fill: #ff00ff !important;font-weight: 900 !important;'>" + text + '</tspan>',
                );
                textTemp[i] = textTemp[i].replace(contentTemp, contentOnly);
                // }
                // if (textTemp[i].includes("font-weight")) {
                //     textTemp[i] = textTemp[i].replace(/font-weight="*"/ig, "font-weight='900'");
                // } else {
                //     textTemp[i] = textTemp[i].replace("<text", "<text font-weight='900'");
                // }
              }
            }
            textTemp[i] = textTemp[i] + '</text>';
          }
          textTemp = textTemp.join('');
          $('#designStandardSummernote').summernote('reset');
          $('#designStandardSummernote').summernote('code', textTemp + '<br>');
        }
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
  urlBookUidMapping();
  widthTemp = undefined;
  heightTemp = undefined;
}
let widthTemp;
let heightTemp;

/**
 * 챕터를 생성한다. 지첨서가 개정된 상태면 개정 후 정보를 가져와 생성해준다.
 * @param {data} data - 사용자가 입력한 정보가 담긴 data
 */
async function createDgnChapter(data) {
  loding.openWindow();
  let parentObj = selectedAwTreeNode.obj;
  let name = data.objChapterName.dbValue;
  try {
    let request = {
      properties: [
        {
          name: name,
          type: 'L2_DgnChapter2',
        },
      ],
    };
    let responseData = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
    let createItem = responseData.output[0].item;
    let createItemRev = responseData.output[0].itemRev;
    if (addToParent) {
      bom = await bomUtils.createBOMWindow(null, addToParent);
      let responce = await bomUtils.add(bom.bomLine, createItemRev);
      await bomUtils.saveBOMWindow(bom.bomWindow);
      addToParent = undefined;
    } else {
      bom = await bomUtils.createBOMWindow(null, parentObj);
      let responce = await bomUtils.add(bom.bomLine, createItemRev);
      await bomUtils.saveBOMWindow(bom.bomWindow);
    }
    await common.userLogsInsert('Create dgnChapter2', createItem.uid, 'S', 'Success');
  } catch (err) {
    //console.log(err);
    await bomUtils.closeBOMWindow(bom.bomWindow);
  } finally {
    bomUtils.closeBOMWindow(bom.bomWindow);
  }
  if (newBomTreeBook) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessChapter'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [
        function () {
          bomlineTreeSet2(newBomTreeBook);
          newBomTreeBook = undefined;
        },
      ],
    );
  } else {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessChapter'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [
        function () {
          bomlineTreeSet2(selectedValue);
        },
      ],
    );
  }
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

/**
 * 페이지를 생성한다. 지첨서가 개정된 상태면 개정 후 정보를 가져와 생성해준다.
 * @param {data} data - 사용자가 입력한 정보가 담긴 data
 * @param {ctx} ctx - ctx
 */
async function createDgnPage(data, ctx) {
  let parentObj = selectedAwTreeNode.obj;
  let contentsType = data.contentType.dbValue;
  let contentsDetailType = data.contentDetailType.dbValue;
  let name = data.objName.dbValue;
  let part = data.parts.dbValue;
  let keyword = data.keyword.dbValue;
  let contents = $('#dgnPageCreateSummernote').summernote('code');
  let contentsString = lgepSummerNoteUtils.stripTags(contents);
  // if (contentsType == "" || contentsDetailType == "" || name == "" || contents == "") {
  if (name == '' || contents == '') {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'noEmptyProps'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return {
      state: 0,
    };
  }
  loding.openWindow();
  contentsType = nullCheck(contentsType);
  contentsDetailType = nullCheck(contentsDetailType);
  part = nullCheck(part);
  keyword = nullCheck(keyword);

  let request = {
    properties: [
      {
        name: name,
        type: 'L2_DgnPage2',
      },
    ],
  };
  let responseData = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
  let createItem = responseData.output[0].item;
  let createItemRev = responseData.output[0].itemRev;
  let selectBook = await com.getItemFromId(selectedValue.cellHeader2);
  try {
    await com.getProperties(selectBook, ['l2_product_type', 'l2_product_detail_type']);
  } catch (err) {
    console.log(err);
  }
  if (selectBook.props.l2_product_type.dbValues[0] == null) {
    selectBook.props.l2_product_type.dbValues[0] = '';
  }
  if (selectBook.props.l2_product_detail_type.dbValues[0] == null) {
    selectBook.props.l2_product_detail_type.dbValues[0] = '';
  }
  if (addToParent) {
    bom = await bomUtils.createBOMWindow(null, addToParent);
    addToParent = undefined;
  } else {
    bom = await bomUtils.createBOMWindow(null, parentObj);
  }
  let bomlineView = await bomUtils.expandPSOneLevel([bom.bomLine]);
  let test;
  try {
    request = {
      objects: [createItem],
      attributes: {
        l2_reference_parts: {
          stringVec: [part],
        },
        l2_keywords: {
          stringVec: [keyword],
        },
        l2_product_type: {
          stringVec: [selectBook.props.l2_product_type.dbValues[0]],
        },
        l2_product_detail_type: {
          stringVec: [selectBook.props.l2_product_detail_type.dbValues[0]],
        },
        l2_page_index: {
          stringVec: [String(bomlineView.output[0].children.length + 1)],
        },
        l2_reference_book2: {
          stringVec: [selectBook.uid],
        },
      },
    };
    contentsType
      ? (request.attributes.l2_content_type = {
          stringVec: [contentsType],
        })
      : [''];

    contentsDetailType
      ? (request.attributes.l2_content_detail_type = {
          stringVec: [contentsDetailType],
        })
      : [''];

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
    await lgepSummerNoteUtils.txtFileToDataset(contents, createItemRev);
  } catch (err) {
    // console.log("error",{err});
  }
  await common.userLogsInsert('Create DgnPage2', createItem.uid, 'S', 'Success');
  try {
    let responce = await bomUtils.add(bom.bomLine, createItemRev);
    // let precision = await bomUtils.togglePrecision([bom.bomLine]);
    // //console.log("이거 뭐나와?",{precision});
    await bomUtils.saveBOMWindow(bom.bomWindow);
  } catch (err) {
    await bomUtils.closeBOMWindow(bom.bomWindow);
  } finally {
    bomUtils.closeBOMWindow(bom.bomWindow);
  }
  if (newBomTreeBook) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessPage'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [
        function () {
          bomlineTreeSet2(newBomTreeBook);
          newBomTreeBook = undefined;
        },
      ],
    );
  } else {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'createSuccessPage'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [
        function () {
          bomlineTreeSet2(selectedValue);
        },
      ],
    );
  }
  loding.closeWindow();
  return {
    state: 1,
  };
}

/**
 * 챕터를 편집한다. 지첨서가 개정된 상태면 개정 후 정보를 가져와 편집해준다.
 * @param {data} data - 사용자가 입력한 정보가 담긴 data
 * @param {ctx} ctx - ctx
 */
async function editDgnChapter(data, ctx) {
  let name = data.objName.dbValue;
  let reviseBook;

  if (reviseToEditObj) {
    let today = new Date();
    let year = today.getFullYear();
    let month = ('0' + (today.getMonth() + 1)).slice(-2);
    let day = ('0' + today.getDate()).slice(-2);
    let dateString = year + '-' + month + '-' + day;
    let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
    let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
    searchingUser = searchingUser[0];
    let request = {
      objects: [reviseToEditObj],
      attributes: {
        object_name: {
          stringVec: [name],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);

    await lgepSummerNoteUtils.txtFileToDataset($('#dgnPageEditSummernote').summernote('code'), reviseToEditObj);
    let doubleBom = [];
    for (let i of reviseObj) {
      if (i.type.includes('Book')) {
        reviseBook = i;
      }
      doubleBom.push(await bomUtils.createBOMWindow(null, i));
    }
    if (reviseBook) {
      request = {
        objects: [reviseBook],
        attributes: {
          l2_revise_date: {
            stringVec: [dateString],
          },
          l2_revise_user: {
            stringVec: [searchingUser.uid],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    }
    let bomWindowArr = [];
    let bomLineArr = [];
    for (let i of doubleBom) {
      bomWindowArr.push(i.bomWindow);
      bomLineArr.push(i.bomLine);
    }
    await preciseDoubleSet(bomLineArr, bomWindowArr);
    await bomUtils.closeBOMWindows(bomWindowArr);
    history.pushState(null, null, '#/L2_DesignStandard?page=' + reviseToEditObj.uid);
    reviseObj = [];
    reviseToEditObj = undefined;
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editSuccessChapter'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [
        function () {
          location.reload();
        },
      ],
    );
  } else {
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
          if (reviseBook) {
            bomlineTreeSet2(reviseBook);
          } else {
            bomlineTreeSet2(selectedValue);
          }
        },
      ],
    );
    return {
      state: 1,
    };
  }
}

/**
 * 페이지를 편집한다. 지첨서가 개정된 상태면 개정 후 정보를 가져와 편집해준다.
 * @param {data} data - 사용자가 입력한 정보가 담긴 data
 * @param {ctx} ctx - ctx
 */
async function editDgnPage(data, ctx) {
  let name = data.objName.dbValue;
  let contents = $('#dgnPageEditSummernote').summernote('code');
  let contentsString = lgepSummerNoteUtils.stripTags(contents);
  let reviseBook;
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
  let viewObj;
  if (reviseToEditObj) {
    let today = new Date();
    let year = today.getFullYear();
    let month = ('0' + (today.getMonth() + 1)).slice(-2);
    let day = ('0' + today.getDate()).slice(-2);
    let dateString = year + '-' + month + '-' + day;
    let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
    let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
    searchingUser = searchingUser[0];
    viewObj = reviseToEditObj;
    let request = {
      objects: [reviseToEditObj],
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

    await lgepSummerNoteUtils.txtFileToDataset($('#dgnPageEditSummernote').summernote('code'), reviseToEditObj);
    let doubleBom = [];
    for (let i of reviseObj) {
      if (i.type.includes('Book')) {
        reviseBook = i;
      }
      doubleBom.push(await bomUtils.createBOMWindow(null, i));
    }
    if (reviseBook) {
      request = {
        objects: [reviseBook],
        attributes: {
          l2_revise_date: {
            stringVec: [dateString],
          },
          l2_revise_user: {
            stringVec: [searchingUser.uid],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
    }
    let bomWindowArr = [];
    let bomLineArr = [];
    for (let i of doubleBom) {
      bomWindowArr.push(i.bomWindow);
      bomLineArr.push(i.bomLine);
    }
    await preciseDoubleSet(bomLineArr, bomWindowArr);
    await bomUtils.closeBOMWindows(bomWindowArr);
    history.pushState(null, null, '#/L2_DesignStandard?page=' + reviseToEditObj.uid);
    reviseObj = [];
    reviseToEditObj = undefined;
    location.reload();
  } else {
    viewObj = editItemRevision;
    try {
      let request = {
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
          if (reviseBook) {
            bomlineTreeSet2(reviseBook);
          } else {
            bomlineTreeSet2(selectedValue);
          }
        },
      ],
    );
    let tempData = {
      node: {
        obj: viewObj,
      },
    };
    pageContentView(tempData);
    return {
      state: 1,
    };
  }
}

/**
 * 페이지를 생성할때 설계 세부 속성 LOV를 가져와 리스트 박스에 값을 넣어준다.
 */
async function typeOrDetailTypeSet() {
  let data = vms.getViewModelUsingElement(document.getElementById('dgnPageCreateData'));
  data.createType = createMode;
  let summernoteSetTemp = summernoteSet;
  summernoteSetTemp.height = '700px';
  $('#dgnPageCreateSummernote').summernote(summernoteSetTemp);
  try {
    let contentType = await com.getInitialLOVValues('L2_DgnPageRevision', 'Create', 'l2_content_type');
    let contentDetailType = await com.getInitialLOVValues('L2_DgnPageRevision', 'Create', 'l2_content_detail_type');
    contentType = contentType.lovValues;
    contentDetailType = contentDetailType.lovValues;
    for (let i = 0; i < contentType.length; i++) {
      data.contentTypeValues.dbValue.push({
        propDisplayValue: contentType[i].propDisplayValues.object_name[0],
        propInternalValue: contentType[i].propInternalValues.object_name[0],
      });
    }
    for (let i = 0; i < contentDetailType.length; i++) {
      data.contentDetailTypeValues.dbValue.push({
        propDisplayValue: contentDetailType[i].propDisplayValues.object_name[0],
        propInternalValue: contentDetailType[i].propInternalValues.object_name[0],
      });
    }
  } catch (err) {
    //console.log(err);
  }
  createMode = undefined;
}

/**
 * 챕터를 편집하기 전, 기존 챕터의 내용을 화면에 보여준다.
 */
async function editChapterSet() {
  let selectedObj = selectedAwTreeNode.obj;
  let data = vms.getViewModelUsingElement(document.getElementById('dgnChapterEditData'));
  data.objName.dbValue = selectedObj.props.object_name.dbValues[0];
}

/**
 * 페이지를 편집하기 전, 기존 페이지의 내용을 화면에 보여준다.
 */
async function editPageSet() {
  let selectedObj = selectedAwTreeNode.obj;
  let data = vms.getViewModelUsingElement(document.getElementById('dgnPageEditData'));
  await com.getProperties(selectedObj, ['l2_content_type', 'l2_content_detail_type', 'l2_reference_parts', 'l2_keywords', 'item_id']);
  try {
    let contentType = await com.getInitialLOVValues('L2_DgnPageRevision', 'Create', 'l2_content_type');
    let contentDetailType = await com.getInitialLOVValues('L2_DgnPageRevision', 'Create', 'l2_content_detail_type');
    contentType = contentType.lovValues;
    contentDetailType = contentDetailType.lovValues;
    for (let i = 0; i < contentType.length; i++) {
      data.contentTypeValues.dbValue.push({
        propDisplayValue: contentType[i].propDisplayValues.object_name[0],
        propInternalValue: contentType[i].propInternalValues.object_name[0],
      });
    }
    for (let i = 0; i < contentDetailType.length; i++) {
      data.contentDetailTypeValues.dbValue.push({
        propDisplayValue: contentDetailType[i].propDisplayValues.object_name[0],
        propInternalValue: contentDetailType[i].propInternalValues.object_name[0],
      });
    }
  } catch (err) {
    //console.log(err);
  }
  let content = await lgepSummerNoteUtils.readHtmlToSummernoteEdit(selectedObj);
  data.objName.dbValue = selectedObj.props.object_name.dbValues[0];
  data.parts.dbValue = selectedObj.props.l2_reference_parts.dbValues[0];
  data.keyword.dbValue = selectedObj.props.l2_keywords.dbValues[0];
  data.contentType.dbValue = selectedObj.props.l2_content_type.dbValues[0];
  data.contentType.uiValue = selectedObj.props.l2_content_type.dbValues[0];
  data.contentDetailType.dbValue = selectedObj.props.l2_content_detail_type.dbValues[0];
  data.contentDetailType.uiValue = selectedObj.props.l2_content_detail_type.dbValues[0];
  let summernoteSetTemp = summernoteSet;
  summernoteSetTemp.height = '700px';
  $('#dgnPageEditSummernote').summernote(summernoteSetTemp);

  $('#dgnPageEditSummernote').summernote('reset');
  $('#dgnPageEditSummernote').summernote('code', content);
}

/**
 * 선택된 지침서 트리 아이템을 전역 변수에 담아준다.
 * @param {eventData} eventData - 선택된 트리
 */
function selectedTreeNode(eventData) {
  selectedAwTreeNode = eventData.node;
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  L2DesignStandardData.selectedTreeNodeType = !selectedAwTreeNode.obj.type.includes('Chapter');
  if (!bomlineTreeData.searchMode) {
    searchValueStyle = undefined;
  }
}

/**
 * 봄 구조를 추가 하기 전 선택된 아이템이 페이지인지 확인하여 걸러준다.
 */
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

/**
 * 선택된 아이템에 추가 및 편집, 삭제 기능을 실행하기 전 최상위 지침서를 가져와 프리즈 상태인지 확인한다. 개정여부를 판단하여 개정이 필요한 아이템만 담아서 넘겨준다.
 */
function revisePrework() {
  if (selectedAwTreeNode == undefined) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'dgnPagenoSelect'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return;
  }
  let data = vms.getViewModelUsingElement(document.getElementById('dgnStdViewDetailData'));
  // L2_DesignStandardLIstOrTreeView.html
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let parentArr = [];
  let whileTrue = true;
  let idx = -1;
  while (whileTrue) {
    if (idx < 0) {
      parentArr.push(findParent(bomlineTreeData.bomLineTree[0], selectedAwTreeNode.obj.uid));
    } else {
      parentArr.push(findParent(bomlineTreeData.bomLineTree[0], parentArr[idx].obj.uid));
    }
    idx++;
    if (parentArr[parentArr.length - 1] == undefined) {
      break;
    }
  }
  parentArr = parentArr.filter((element, i) => element != null);
  parentArr.unshift(selectedAwTreeNode);
  let releseCheck;
  let reviseToObj = [];
  for (let i of parentArr) {
    if (i.obj.props.release_status_list.uiValues[0] == 'Released') {
      releseCheck = true;
      reviseToObj.unshift(i.obj);
    }
  }
  let result = {
    releseCheck: releseCheck,
    reviseToObj: reviseToObj,
  };
  return result;
}

let reviseToEditObj;
let reviseObj = [];

/**
 * 선택된 아이템 편집 전 개정 여부를 확인하고, 개정이 필요하면 개정먼저 진행 한뒤 편집한다.
 */
function reviseCheck() {
  let result = revisePrework();
  let releseCheck = result.releseCheck;
  let reviseToObj = result.reviseToObj;

  if (releseCheck) {
    return message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editReviseCheck'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          await com.getProperties(reviseToObj, ['item_id']);
          // console.log("북",{selectedValue});
          let request = {
            input: [],
          };
          for (let i of reviseToObj) {
            let item = await com.getItemFromId(i.props.item_id.dbValues[0]);
            request.input.push({
              item: item,
              itemType: item.type,
            });
          }
          let newRevId = await SoaService.post('Core-2006-03-DataManagement', 'generateRevisionIds', request);
          eventBus.publish('reviseToEditMode');
          for (let i = 0; i < reviseToObj.length; i++) {
            if (reviseToObj[i].uid == reviseToObj[reviseToObj.length - 1].uid) {
              reviseToEditObj = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
              reviseObj.push(reviseToEditObj);
            } else {
              reviseObj.push(await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId));
            }
          }
        },
        function () {},
      ],
    );
  } else {
    eventBus.publish('reviseToEditMode');
  }
}

/**
 * 선택된 아이템 편집 전 편집 모드를 지정해준다.
 */
function bomlineEdit() {
  if (selectedAwTreeNode.obj.type.includes('Chapter')) {
    return {
      treeSelect: 'DgnChapter',
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

let deletePageParent;
let deleteSuccessBomTreeBook;

/**
 * 선택된 아이템 삭제 전 개정 여부를 확인하고, 개정이 필요하면 개정먼저 진행 후 삭제한다.
 * @param {ctx} ctx - 선택된 트리
 */
function reviseCheckToDelete(ctx) {
  let result = revisePrework();
  let releseCheck = result.releseCheck;
  let reviseToObj = result.reviseToObj;
  reviseToObj.pop();
  if (releseCheck) {
    return message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editReviseCheck'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          loding.openWindow();
          await com.getProperties(reviseToObj, ['item_id']);
          // console.log("북",{selectedValue});
          let request = {
            input: [],
          };
          for (let i of reviseToObj) {
            let item = await com.getItemFromId(i.props.item_id.dbValues[0]);
            request.input.push({
              item: item,
              itemType: item.type,
            });
          }
          let newRevId = await SoaService.post('Core-2006-03-DataManagement', 'generateRevisionIds', request);
          for (let i = 0; i < reviseToObj.length; i++) {
            if (reviseToObj[i].uid == reviseToObj[reviseToObj.length - 1].uid) {
              deletePageParent = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
              reviseObj.push(deletePageParent);
              if (deletePageParent.type.includes('Book')) {
                deleteSuccessBomTreeBook = deletePageParent;
              }
            } else {
              if (reviseToObj[i].type.includes('Book')) {
                deleteSuccessBomTreeBook = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
                reviseObj.push(deleteSuccessBomTreeBook);
              } else {
                reviseObj.push(await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId));
              }
            }
          }
          let today = new Date();
          let year = today.getFullYear();
          let month = ('0' + (today.getMonth() + 1)).slice(-2);
          let day = ('0' + today.getDate()).slice(-2);
          let dateString = year + '-' + month + '-' + day;
          let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
          let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
          searchingUser = searchingUser[0];
          request = {
            objects: [deleteSuccessBomTreeBook],
            attributes: {
              l2_revise_date: {
                stringVec: [dateString],
              },
              l2_revise_user: {
                stringVec: [searchingUser.uid],
              },
            },
          };
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);

          let doubleBom = [];
          for (let i of reviseObj) {
            doubleBom.push(await bomUtils.createBOMWindow(null, i));
          }
          let bomWindowArr = [];
          let bomLineArr = [];
          for (let i of doubleBom) {
            bomWindowArr.push(i.bomWindow);
            bomLineArr.push(i.bomLine);
          }
          loding.closeWindow();
          preciseDoubleSet(bomLineArr, bomWindowArr);
          bomUtils.closeBOMWindows(bomWindowArr);
          deleteCmdAction();
        },
        function () {},
      ],
    );
  } else {
    deleteCmdAction();
  }
}

let addToParent;
let newBomTreeBook;
/**
 * 선택된 아이템 추가 전 개정 여부를 확인하고, 개정이 필요하면 개정먼저 진행 후 추가한다.
 * @param {ctx} ctx - 선택된 트리
 */
async function reviseCheckToChildAdd(ctx) {
  if (selectedAwTreeNode.obj.type.includes('Page')) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pageAddBookChapter'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
    return;
  }
  let result = revisePrework();
  let releseCheck = result.releseCheck;
  let reviseToObj = result.reviseToObj;
  if (releseCheck) {
    return message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'editReviseCheck'),
      [
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'revise'),
        lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close'),
      ],
      [
        async function () {
          loding.openWindow();
          await com.getProperties(reviseToObj, ['item_id']);
          let request = {
            input: [],
          };
          for (let i of reviseToObj) {
            let item = await com.getItemFromId(i.props.item_id.dbValues[0]);
            request.input.push({
              item: item,
              itemType: item.type,
            });
          }
          let newRevId = await SoaService.post('Core-2006-03-DataManagement', 'generateRevisionIds', request);
          for (let i = 0; i < reviseToObj.length; i++) {
            if (reviseToObj[i].uid == reviseToObj[reviseToObj.length - 1].uid) {
              addToParent = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
              reviseObj.push(addToParent);
              if (addToParent.type.includes('Book')) {
                newBomTreeBook = addToParent;
              }
            } else {
              if (reviseToObj[i].type.includes('Book')) {
                newBomTreeBook = await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId);
                reviseObj.push(newBomTreeBook);
              } else {
                reviseObj.push(await com.revise2(reviseToObj[i], newRevId.outputRevisionIds[i].newRevId));
              }
            }
          }
          try {
            let today = new Date();
            let year = today.getFullYear();
            let month = ('0' + (today.getMonth() + 1)).slice(-2);
            let day = ('0' + today.getDate()).slice(-2);
            let dateString = year + '-' + month + '-' + day;
            let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
            let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
            searchingUser = searchingUser[0];
            request = {
              objects: [newBomTreeBook],
              attributes: {
                l2_revise_date: {
                  stringVec: [dateString],
                },
                l2_revise_user: {
                  stringVec: [searchingUser.uid],
                },
              },
            };
            await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
          } catch (err) {
            // console.log("여기에러", {err});
          }

          let doubleBom = [];
          for (let i of reviseObj) {
            doubleBom.push(await bomUtils.createBOMWindow(null, i));
          }
          let bomWindowArr = [];
          let bomLineArr = [];
          for (let i of doubleBom) {
            bomWindowArr.push(i.bomWindow);
            bomLineArr.push(i.bomLine);
          }
          loding.closeWindow();
          await preciseDoubleSet(bomLineArr, bomWindowArr);
          bomUtils.closeBOMWindows(bomWindowArr);
          eventBus.publish('addToReviseSuccess');
        },
        function () {},
      ],
    );
  } else {
    eventBus.publish('addToReviseSuccess');
  }
}

/**
 * 설계지침 추가 전 선택되어 있는 아이템이 구조 아이템인지 확인한다.
 */
async function selFolderCheck() {
  let value = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  value = value.dataProviders.designStandardTreeTableData.selectedObjects[0];
  if (!value) {
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'structureSel'),
      [lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'close')],
      [],
    );
  }
  if (!value.props.revision_list) {
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
  await com.getProperties(value, ['L2_DesignStandardRel']);
  if (value && value.type.includes('Structure')) {
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

/**
 * 설계지침을 추가한다.
 * @param {data} data - 사용자가 입력한 데이터
 * @param {ctx} ctx - 선택된 트리
 */
async function createDgnBook(data, ctx) {
  let itemName = data.objName.dbValues[0];
  let type = data.objType.dbValues[0];
  let detailType = data.objDetailType.dbValues[0];
  // if (itemName && type && detailType && itemName != "" && type != "" && detailType != "") {
  if (!type) {
    type = '';
  }
  if (!detailType) {
    detailType = '';
  }
  if (itemName && itemName != '') {
    let value = vms.getViewModelUsingElement(document.getElementById('designStdData'));
    value = value.dataProviders.designStandardTreeTableData.selectedObjects[0];
    await com.getProperties(value, ['L2_DesignStandardRel']);
    let bookPropsArr = value.props.L2_DesignStandardRel.dbValues;
    try {
      let request = {
        properties: [
          {
            name: itemName,
            type: 'L2_DgnBook2',
          },
        ],
      };
      let createItem = await SoaService.post('Core-2006-03-DataManagement', 'createItems', request);
      let createItemRev = createItem.output[0].itemRev;
      createItem = createItem.output[0].item;
      request = {
        objects: [createItem],
        attributes: {
          l2_product_type: {
            stringVec: [type],
          },
          l2_product_detail_type: {
            stringVec: [detailType],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
      let today = new Date();
      let year = today.getFullYear();
      let month = ('0' + (today.getMonth() + 1)).slice(-2);
      let day = ('0' + today.getDate()).slice(-2);
      let dateString = year + '-' + month + '-' + day;
      let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
      let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
      searchingUser = searchingUser[0];
      request = {
        objects: [createItemRev],
        attributes: {
          l2_revise_date: {
            stringVec: [dateString],
          },
          l2_revise_user: {
            stringVec: [searchingUser.uid],
          },
          l2_revise_reason: {
            stringVec: ['Create Book'],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
      bookPropsArr.unshift(createItem.uid);
      request = {
        objects: [value],
        attributes: {
          L2_DesignStandardRel: {
            stringVec: bookPropsArr,
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', request);
      common.userLogsInsert('Create DgnBook2', createItem.uid, 'S', 'Success');
    } catch (err) {
      console.log('error', { err });
    }
    eventBus.publish('designStandardTreeTable.plTable.reload');
    return {
      state: 1,
    };
  } else {
    message.show(
      1,
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
// 즐겨찾기용 메서드
// function backArrowBookmark() {
//   const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
//   standardNavData.navMode = bookmarkModeTemp;
// }

// async function bookmark() {
//   const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
//   bookmarkModeTemp = standardNavData.bookMarkMode;
//   standardNavData.navMode = 'bookmark';
//   let policyArr = policy.getEffectivePolicy();
//   policyArr.types.push({
//     name: 'Folder',
//     properties: [
//       {
//         name: 'contents',
//       },
//     ],
//   });

//   let loadObj;
//   let bookmarkFolderUid = await lgepPreferenceUtils.getPreference('L2_DesignGuide_DesignStandards');
//   bookmarkFolderUid = bookmarkFolderUid.Preferences.prefs[0].values[0].value;
//   try {
//     let getPropertiesParam = {
//       uids: [bookmarkFolderUid],
//     };
//     loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam, policyArr);
//   } catch (err) {
//     //console.log(err);
//   }
//   let bookmarkFolder = loadObj.modelObjects[bookmarkFolderUid];
// }

/**
 * 지침서 트리 화면에서 뒤로가기를 누른 후 앞으로 가기를 다시 누른 상태
 */
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
  L2DesignStandardData.pageOpenState = true;
  bomlineTreeSet2(selectedValue);
}
let selectBookTemp;
let selectedValueTemp;
let selectedAwTreeNodeTemp;

/**
 * 지침서 트리 화면에서 뒤로가기를 누른 상태
 */
async function backArrow() {
  const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
  const designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  backArrowTempSelectedValue = standardNavData.selValue;
  standardNavData.navMode = undefined;
  standardNavData.selValue = undefined;
  designStdTreeData.backArrowStatus = true;
  selectBookTemp = L2DesignStandardData.selectedBook;
  L2DesignStandardData.selectedBook = undefined;
  L2DesignStandardData.pageOpenState = false;
  selectedValueTemp = selectedValue;
  selectedValue = undefined;
  selectedAwTreeNodeTemp = selectedAwTreeNode;
  selectedAwTreeNode = undefined;
  if (pageAllSearchState) {
    await popupService.show({
      declView: 'L2_DesignStandardPageSearchingTable',
      locals: {
        caption: lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pageAllSearcing'),
        anchor: 'closePopupAnchor',
      },
      options: {
        reference: 'referenceId',
        isModal: true,
        clickOutsideToClose: false,
        draggable: true,
        placement: 'bottom-start',
        height: '450',
        width: '800',
      },
      outputData: {
        popupId: 'id',
      },
    });
    let allSearchData = vms.getViewModelUsingElement(document.getElementById('pageSearchData'));
    allSearchData.searchWord.dbValue = tempSearchText;
    allSearchData.searchWord.uiValue = tempSearchText;
    if (allSearchData.dataProviders.searchPageTableData.viewModelCollection.loadedVMObjects.length != searchTableDataTemp.length) {
      allSearchData.dataProviders.searchPageTableData.viewModelCollection.setViewModelObjects(searchTableDataTemp);
    }
    pageAllSearchState = undefined;
    searchTableDataTemp = [];
    tempSearchText = undefined;
  }
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

// async function getColumnChartData(data) {
//   await common.delay(200);
//   let arrayOfSeriesDataForChartLine = [];
//   //차트 데이터가 들어가는 배열
//   let keyValueDataForChart = [];
//   //차트 항목
//   let chartData = [];
//   //차트 항목당 개수
//   let chartCount = [];

//   //데이터에서 차트의 항목이 되는 데이터별로 개수를 세어서 배열에 담아줌
//   let count = {};
//   //키 : 값 형태로 되어있는 항목 개수의 값만 따로 배열로 가져옴
//   chartCount = Object.values(count);

//   //모든 차트 데이터 삽입
//   // for (let i = 0; i < chartData.length; i++) {
//   keyValueDataForChart.push({
//     label: 'hihihi',
//     value: 5,
//   });
//   // }

//   //내림차순 정렬
//   // keyValueDataForChart.sort((a, b) => {
//   //     return b.value - a.value;
//   // });

//   //상위 10개의 데이터만 잘라서 가져옴
//   const lineList = keyValueDataForChart.slice(0, 10);

//   //상위 10개의 데이터만 최종 차트 데이터로 삽입
//   arrayOfSeriesDataForChartLine.push({
//     seriesName: '개수',
//     keyValueDataForChart: lineList,
//     chartPointsConfig: 'colorOverrides',
//   });

//   return arrayOfSeriesDataForChartLine;
// }

/**
 * 모든 유저 정보를 가져옴
 */
async function getUserList() {
  let userData = await query.executeSavedQuery('KnowledgeUserSearch', 'L2_user_id', '*');
  return {
    userList: userData,
  };
}

/**
 * 모든 유저의 수를 가져옴
 */
async function loadPostList(data) {
  return {
    postTotalFound: data.userList.length,
  };
}

/**
 * 사용X
 */
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

/**
 * 선택된 지침서에 첨부된 데이터셋을 가져옴
 */
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
/**
 * 선택 된 지침서를 bomline형태로 만든 뒤 aw-tree로 만들어줌(구)
 * @param {data} data - 사용자 데이터
 */
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
/**
 * 선택 된 지침서를 bomline형태로 만든 뒤 aw-tree로 만들어줌
 * @param {ModelObject} passItem - 임의로 넣어준 지침서
 */
async function bomlineTreeSet2(passItem) {
  const standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  const L2DesignStandardData = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  let bomChild;
  if (!passItem) {
    if (!selectedValue) {
      if (
        !standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] ||
        !standardData.dataProviders.designStandardTreeTableData.selectedObjects[0].type.includes('Book')
      ) {
        // if (!standardData.dataProviders.designStandardTreeTableData.selectedObjects[0]) {
        L2DesignStandardData.selectedBook = undefined;
        return;
      }
    }
  }
  // if (standardData.dataProviders.designStandardTreeTableData.selectedObjects[0].props.dgnStdStatus.dbValues[0] == "O" || passItem) {
  if (limit > 0) {
    limit--;
    try {
      let tempValue;
      if (!passItem) {
        if (standardData.dataProviders.designStandardTreeTableData.selectedObjects[0]) {
          // selectedValue = standardData.dataProviders.designStandardTreeTableData.selectedObjects[0];
          // tempValue = selectedValue;
          let selItem = standardData.dataProviders.designStandardTreeTableData.selectedObjects[0];
          await com.getProperties(selItem, ['L2_DesignStandardRel']);
          let dgnStdTemp = com.getObject(selItem.props.L2_DesignStandardRel.dbValues[0]);
          dgnStdTemp = com.getObject(dgnStdTemp.props.revision_list.dbValues[dgnStdTemp.props.revision_list.dbValues.length - 1]);
          selectedValue = dgnStdTemp;
          tempValue = selectedValue;
        }
        L2DesignStandardData.selectedBook = selectedValue;
        if (!tempValue) {
          tempValue = selectedValue;
        }
      } else {
        await com.getProperties(passItem, ['revision_list']);
        passItem = viewC.constructViewModelObjectFromModelObject(passItem);
        selectedValue = passItem;
        L2DesignStandardData.selectedBook = passItem;
        tempValue = passItem;
      }
      loding.openWindow();
      bom = await bomUtils.createBOMWindow(null, tempValue);
      // console.log("봄",{bom});
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
      bomChild = await bomUtils.expandPSAllLevels([bom.bomLine], undefined);
      let tree = await treeChild2(bomChild.output, undefined);
      TreeNodeTemp = tree;
      const standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
      standardNavData.selValue = tempValue;
    } catch (err) {
      console.log('error', err);
    } finally {
      if (bom != undefined) {
        eventBus.publish('treeViewChange');
        await preciseSet(bomChild, bom);
        bomUtils.closeBOMWindow(bom.bomWindow);
      }
      loding.closeWindow();
      // await common.delay(2000);
      limit++;
    }
  }
  // }
}

/**
 * 모든 Bom 구조를 precise로 만들어줌
 * @param {BomLineArr} allLevels - 전체 봄라인
 * @param {BomLine} bomTemp - 전체 봄라인을 가져온 봄라인
 */
async function preciseSet(allLevels, bomTemp) {
  let bomLineArr = [];
  for (let i of allLevels.output) {
    bomLineArr.push(i.parent.bomLine);
  }
  await com.getProperties(bomLineArr, ['bl_is_precise']);
  for (let i = bomLineArr.length - 1; i >= 0; i--) {
    if (allLevels.output[i].children.length > 0) {
      if (bomLineArr[i - 1].props.bl_is_precise.uiValues[0] != 'True') {
        await bomUtils.togglePrecision([bomLineArr[i]]);
      }
    }
  }
  await bomUtils.saveBOMWindow(bomTemp.bomWindow);
}

/**
 * 개정 작업이 끝난 후 봄구조를 업데이트 해줌
 * @param {bomLineArr} bomLineArr - 전체 봄라인
 * @param {bomWindowArr} bomWindowArr - 전체 봄라인을 가져온 봄라인
 */
async function preciseDoubleSet(bomLineArr, bomWindowArr) {
  await bomUtils.togglePrecision(bomLineArr);
  await bomUtils.togglePrecision(bomLineArr);
  await bomUtils.saveBOMWindows(bomWindowArr);
}

/**
 * 뒤로가기 이후 기존 봄라인으로 돌아오기 위한 작업
 */
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

/**
 * 봄 구조의 부모 자식관계를 맺어줌(구)
 * @param {ModelObject} obj - 전체 봄라인
 */
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
/**
 * 봄 구조의 부모 자식관계를 맺어줌
 * @param {ModelObject} obj - 최상위 봄라인 아이템
 * @param {ModelObject} recursiveValue - 재귀 아이템
 */
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
    let bomlineArr = [];
    for (let i of obj) {
      bomlineArr.push(i.parent.bomLine);
    }
    await com.getProperties(bomlineArr, ['bl_is_precise']);
    let noPreciseArr = [];
    for (let i of bomlineArr) {
      if (i.props.bl_is_precise.uiValues[0] != 'True') {
        noPreciseArr.push(i);
      }
    }
    let a = await bomUtils.togglePrecision(noPreciseArr);
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

/**
 * 선택된 설계 지침을 로딩하면서 해당 지침의 리비전 리스트를 로딩해줌
 * @param {ctx} ctx - ctx
 * @param {data} data - 사용자 데이터
 */
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
  L2DesignStandardData.revisionListBoxValues.dbValues = [];
  L2DesignStandardData.revisionListBoxValues.dbValues.push({
    propDisplayValue: null,
    propInternalValue: null,
  });
  let reviseDate = lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'reviseDate');
  let bookItemRev = com.getObject(selectedValue.uid);
  await com.getProperties(bookItemRev, ['revision_list', 'l2_revise_date', 'current_revision_id', 'item_revision_id', 'object_name']);
  L2DesignStandardData.selBookName = bookItemRev.props.object_name.dbValues[0];
  let revArr = com.getObject(bookItemRev.props.revision_list.dbValues);
  await com.getProperties(revArr, ['revision_list', 'l2_revise_date', 'current_revision_id', 'item_revision_id']);
  for (let i = 0; i < bookItemRev.props.revision_list.dbValues.length; i++) {
    L2DesignStandardData.revisionListBoxValues.dbValues.push({
      propDisplayValue: 'Revision ' + String.fromCharCode(65 + i),
      propDisplayDescription: reviseDate + revArr[i].props.l2_revise_date.uiValues[0],
      propInternalValue: bookItemRev.props.revision_list.dbValues[i],
    });
  }
  L2DesignStandardData.revisionListBoxValues.dbValue = L2DesignStandardData.revisionListBoxValues.dbValues;
  await common.delay(100);
  L2DesignStandardData.revisionListBox.uiValue = 'Revision ' + bookItemRev.props.item_revision_id.uiValues[0];
  while (L2DesignStandardData.revisionListBox.uiValue == null) {
    await common.delay(100);
    L2DesignStandardData.revisionListBox.uiValue = 'Revision ' + bookItemRev.props.item_revision_id.uiValues[0];
  }
  // standardData.dataProviders.designStandardTreeTableData.selectNone();
  return {
    selPage: true,
  };
}

/**
 * 선택되어있는 아이템이 있으면 선택 된 상태를 유지해줌
 * @param {tree} tree - 봄라인 트리
 * @param {ModelObject} selectValue - 선택된 아이템
 */
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

/**
 * 트리의 순서를 뒤집어줌
 * @param {tree} tree - 봄라인 트리
 */
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
    homeUid = await lgepPreferenceUtils.getPreference('L2_Checklist_Structure');
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
  let response;
  await com.getProperties(treeObj, ['bl_all_child_lines', 'bl_child_item', 'bl_child_lines', 'nx0AllChildren', 'contents', 'ps_children']);
  if (treeObj.props.contents) {
    response = com.getObject(treeObj.props.contents.dbValues);
    await com.getProperties(response, ['revision_list']);
    let temp = response;
    response = [];
    for (let i of temp) {
      if (i.props.revision_list) {
        response.push(com.getObject(i.props.revision_list.dbValues[i.props.revision_list.dbValues.length - 1]));
      } else {
        response.push(i);
      }
    }
  } else {
    response = com.getObject(treeObj.props.ps_children.dbValues);
  }
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
              name: 'DesignStandard',
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
    'l2_reference_book2',
    'object_desc',
    'object_type',
    'checked_out',
    'owning_user',
    'owning_group',
    'last_mod_date',
    'release_statuses',
    'object_name',
    'revision_list',
    'ps_children',
  ]);

  let viewArr = [];
  response = response.filter((element, i) => element != null);
  let resTemp = response;
  response = [];
  for (let i of resTemp) {
    if (!i.type.includes('Function') && !i.type.includes('Failure')) {
      response.push(i);
    }
  }
  await com.getProperties(response, ['L2_DesignStandardRel', 'l2_is_checklist', 'item_id']);
  for (let treeNode of response) {
    let nodeName = treeNode.props.object_name.dbValues[0];
    let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
    let temp = vmo;
    if (treeNode.props.L2_DesignStandardRel) {
      temp.props.dgnStdStatus = {};
      if (treeNode.props.L2_DesignStandardRel.dbValues.length > 0) {
        temp.props.dgnStdStatus.dbValues = [];
        temp.props.dgnStdStatus.uiValues = [];
        temp.props.dgnStdStatus.dbValues[0] = 'O';
        temp.props.dgnStdStatus.dbValue = 'O';
        temp.props.dgnStdStatus.uiValue = 'O';
        temp.props.dgnStdStatus.uiValues[0] = 'O';
      } else {
        temp.props.dgnStdStatus.dbValues = [];
        temp.props.dgnStdStatus.uiValues = [];
        temp.props.dgnStdStatus.dbValues[0] = 'X';
        temp.props.dgnStdStatus.dbValue = 'X';
        temp.props.dgnStdStatus.uiValue = 'X';
        temp.props.dgnStdStatus.uiValues[0] = 'X';
      }
    }
    vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
    Object.assign(vmo, temp);
    if (vmo.type.includes('Structure') && treeNode.props.L2_DesignStandardRel.dbValues.length > 0) {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('typeElementGreen48.svg');
    } else if (vmo.type.includes('Structure')) {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('typeElementGray48.svg');
    }

    if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
      if (temp.props.ps_children) {
        if (temp.props.ps_children.dbValues.length > 0) {
          let childT = com.getObject(temp.props.ps_children.dbValues);
          let state = false;
          for (let i = 0; i < childT.length; i++) {
            if (!childT[i].props.object_string.dbValues[0].includes('[기능]') && !childT[i].props.object_string.dbValues[0].includes('[고장]')) {
              state = true;
              break;
            }
          }
          if (state) {
            vmo.isLeaf = false;
          } else {
            vmo.isLeaf = true;
          }
        } else {
          vmo.isLeaf = true;
        }
      } else {
        vmo.isLeaf = true;
      }
    } else if (temp.props.contents.dbValues.length > 0) {
      vmo.isLeaf = false;
    }
    // if (treeNode.props.awb0BomLineItemId) {
    //     let objItem = await com.getItemFromId(treeNode.props.awb0BomLineItemId.dbValues[0]);
    //     let objItemRev = com.getObject(objItem.props.revision_list.dbValues[objItem.props.revision_list.dbValues.length - 1]);
    //     await com.getProperties(objItemRev, ["L2_DesignStandardRel"]);
    //     if (objItemRev.props.L2_DesignStandardRel.dbValues.length > 0) {
    //         vmo.isLeaf = false;
    //     }
    // }
    vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
    vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
    viewArr.push(vmo);
  }
  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
  // }
}

/**
 * 지침서 하위에 있는 모든 페이지의 첨부파일을 가져와줌
 */
async function attachAllFileTableSet() {
  await com.getProperties(treePageArr, ['IMAN_reference']);
  let result = [];
  for (let i of treePageArr) {
    if (i.props.IMAN_reference.dbValues) {
      result.push(com.getObject(i.props.IMAN_reference.dbValues));
    }
  }
  result = flatAr(result);
  await com.getProperties(result, ['object_name', 'ref_list', 'creation_date', 'owning_user', 'bl_child_lines']);
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

/**
 * 선택되어있는 페이지의 첨부파일을 가져와줌
 */
async function attachFileTableSet() {
  let value = selectedAwTreeNode.obj;
  if (value.type.includes('Page')) {
    await com.getProperties(value, ['IMAN_reference']);
    let result = com.getObject(value.props.IMAN_reference.dbValues);
    await com.getProperties(result, ['object_name', 'ref_list', 'creation_date', 'owning_user', 'bl_child_lines']);
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

/**
 * 페이지 첨부파일 팝업을 띄우기 전 선택된 페이지 데이터를 넣어준다.
 */
function attachPopupStart() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let value = selectedAwTreeNode.obj;
  data.objName.uiValue = value.props.object_name.dbValues[0];
  // eventBus.publish("manualAttachFileTable.plTable.reload");
}

/**
 * 페이지 첨부파일에서 선택된 아이템을 다운로드 2개이상 일시 .zip으로 만들어줌
 */
async function selectDown() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.dgnStandardAttachFileTableData.selectedObjects;
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
    element.setAttribute('download', 'designGuide.zip');
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

/**
 * 테이블에 표시되어 있는 모든 첨부파일을 다운로드 해준다. 2개이상이면 zip파일로 압축
 */
async function downloadAll() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.dgnStandardAttachFileTableData.viewModelCollection.loadedVMObjects;
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
    element.setAttribute('download', 'designGuide.zip');
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

/**
 * 선택되어있는 아이템을 다운로드 해준다. 2개 이상이면 zip파일로 압축
 */
async function selectDownAllFile() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.dgnStandardAllAttachFileTableData.selectedObjects;
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
    element.setAttribute('download', 'designGuide.zip');
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

/**
 * 테이블에 표시되어 있는 모든 아이템을 다운로드 해준다. 2개이상이면 zip파일로 압축
 */
async function downloadAllPage() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let downloadFile = data.dataProviders.dgnStandardAllAttachFileTableData.viewModelCollection.loadedVMObjects;
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
    element.setAttribute('download', 'designGuide.zip');
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
/**
 * 지침서 또는 페이지를 선택할때 URL에 uid를 매핑해줌
 */
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
    if (selectedAwTreeNode) {
      if (selectedAwTreeNode.obj.type.includes('Page')) {
        history.pushState(null, null, '#/L2_DesignStandard?page=' + selectedAwTreeNode.obj.uid);
      } else {
        history.pushState(null, null, '#/L2_DesignStandard?' + selectedValue.uid);
      }
    } else {
      history.pushState(null, null, '#/L2_DesignStandard?' + selectedValue.uid);
    }
  }
}

/**
 * 페이지 로드시 uid를 확인하여 지침 트리를 바로 열어준다. 페이지 선택이 페이지 또한 선택 해준다.
 */
async function parameterCheck() {
  let url = document.URL;
  let basicUrl = browserUtils.getBaseURL();
  url = url.replace(basicUrl + '#/L2_DesignStandard', '');
  if (!url.includes('?')) {
    return;
  }
  url = url.replace('?', '');
  let pageUID = '';
  let bookUID;
  let page;
  if (url.includes('page')) {
    url = url.split('page=');
    pageUID = url[1];
    page = await com.loadObjects2([pageUID]);
    page = page[pageUID];
    await com.getProperties(page, ['l2_reference_book2']);
    page.props.l2_reference_book2.dbValues[0];
    let book = com.getObject(page.props.l2_reference_book2.dbValues[0]);
    book = com.getObject(book.props.revision_list.dbValues[book.props.revision_list.dbValues.length - 1]);
    await bomlineTreeSet2(book);
    if (pageUID && pageUID != '') {
      let pageObject = {
        node: {
          obj: page,
        },
      };
      selectedTreeNode(pageObject);
      pageContentView(pageObject);
    }
    showPre();
  } else {
    bookUID = url;
    if (!bookUID) {
      return;
    }
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
    let book = await com.loadObjects2([bookUID]);
    book = book[bookUID];
    // let maxDelay = 0;
    // let fail = false;
    // while (loop) {
    //     await common.delay(100);
    //     for (let i of standardData.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects) {
    //         if (i.uid == book.uid) {
    //             loop = false;
    //             break;
    //         }
    //     }
    //     maxDelay++;
    //     if (maxDelay == 100) {
    //         fail = true;
    //         break;
    //     }
    // }
    // if (fail) {
    //     return;
    // }
    // standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] = book;
    await bomlineTreeSet2(book);
    showPre();
  }
}

let searchTableDataTemp = [];
let tempSearchText;
let pageAllSearchState;
/**
 * 페이지 전체 검색에서 선택한 페이지로 이동.
 */
async function pageMove() {
  let standardData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let searchWord = standardData.searchingName.dbValue;
  let pageSearchData = vms.getViewModelUsingElement(document.getElementById('pageSearchData'));
  searchTableDataTemp = pageSearchData.dataProviders.searchPageTableData.viewModelCollection.loadedVMObjects;
  tempSearchText = searchWord;
  pageAllSearchState = true;
  let movePage = pageSearchData.dataProviders.searchPageTableData.selectedObjects[0];
  let moveManual = com.getObject(movePage.props.l2_reference_book2.dbValues[0]);
  await com.getProperties(moveManual, ['revision_list']);
  let moveManualRevision = com.getObject(moveManual.props.revision_list.dbValues[0]);
  // standardData.dataProviders.designStandardTreeTableData.selectedObjects[0] = moveManualRevision;
  await bomlineTreeSet2(moveManualRevision);
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

/**
 * 검색 모드 시작
 */
function pageSearchModeStart() {
  let designStdTreeData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  designStdTreeData.pageSearchMode = true;
}

/**
 * 페이지 첨부파일 테이블에서 선택된 파일을 삭제
 */
async function fileDelete() {
  let data = vms.getViewModelUsingElement(document.getElementById('attachFileData'));
  let item = selectedAwTreeNode.obj;
  if (data.selectedTab.tabKey == 'page') {
    let deleteFile = data.dataProviders.dgnStandardAttachFileTableData.selectedObjects;
    await lgepSummerNoteUtils.selectFileRelationDelete(item, deleteFile);
    eventBus.publish('dgnStandardAttachFileTable.plTable.reload');
    eventBus.publish('dgnStandardAllAttachFileTable.plTable.reload');
  }
  // else if(data.selectedTab.tabKey == "book"){
  //     let deleteFile = data.dataProviders.manualAllAttachFileTableData.selectedObjects
  //     await lgepSummerNoteUtils.selectFileRelationDelete(item,deleteFile);
  //     eventBus.publish("manualAllAttachFileTable.plTable.reload");
  // }
}

/**
 * 최근 검색기록으로 검색
 */
function listPageSearching(eventData, ctx) {
  const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  bomlineTreeData.searchingName.dbValue = eventData.selectedObjects[0].dbValue;
  awtreeSearching(bomlineTreeData, ctx);
}

/**
 * 선택된 지침서를 보내준다.
 */
function getSelectBook() {
  return selectedValue;
}

let searchDataLength = 0;

/**
 * 현재 보고있는 검색어를 강조 해준다.
 */
function pageInSearching() {
  let searchData = document.getElementsByClassName('searchFocusClass');
  for (let i of searchData) {
    i.style.fill = 'rgb(255, 0, 255)';
  }
  searchData[searchDataLength].focus();
  searchData[searchDataLength].scrollIntoView();
  searchData[searchDataLength].style.fill = 'rgb(255, 127, 0)';
  searchDataLength++;
  if (searchData.length == searchDataLength) {
    searchDataLength = 0;
  }
}

let standardTreeNode;
/**
 * 페이지 순서를 변경하기 위해 실행
 */
function changePositionSet() {
  if (selectedAwTreeNode) {
    standardTreeNode = selectedAwTreeNode.obj;
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'pagePositionChangeSet'));
  }
}

/**
 * 페이지 순서 변경
 */
async function pagePositionChange() {
  if (standardTreeNode) {
    let bomLineTemp = [];
    const bomlineTreeData = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
    let parentTreeNode = findParent(bomlineTreeData.bomLineTree[0], standardTreeNode.uid);
    let stdIdxNum;
    let chanIdxNum;
    for (let i = 0; i < parentTreeNode.children.length; i++) {
      if (parentTreeNode.children[i].obj.uid == standardTreeNode.uid) {
        stdIdxNum = i;
      }
      if (parentTreeNode.children[i].obj.uid == selectedAwTreeNode.obj.uid) {
        chanIdxNum = i;
      }
    }
    let parentBom = await bomUtils.createBOMWindow(null, parentTreeNode.obj);
    let parentBomChild = await bomUtils.expandPSOneLevel([parentBom.bomLine]);
    for (let i of parentBomChild.output[0].children) {
      bomLineTemp.push(i.bomLine);
    }
    await com.getProperties(bomLineTemp, ['bl_sequence_no']);
    let standardNode;
    let changeNode;
    for (let i of parentBomChild.output[0].children) {
      if (standardTreeNode.uid == i.itemRevOfBOMLine.uid) {
        standardNode = i.bomLine;
      }
      if (selectedAwTreeNode.obj.uid == i.itemRevOfBOMLine.uid) {
        changeNode = i.bomLine;
      }
    }
    let stdBl_sequence_no = standardNode.props.bl_sequence_no.dbValues[0];
    let chanBl_sequence_no = changeNode.props.bl_sequence_no.dbValues[0];
    try {
      let param = {
        objects: [standardNode],
        attributes: {
          bl_sequence_no: {
            stringVec: [chanBl_sequence_no],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      param = {
        objects: [changeNode],
        attributes: {
          bl_sequence_no: {
            stringVec: [stdBl_sequence_no],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      let temp = parentTreeNode.children[stdIdxNum];
      parentTreeNode.children[stdIdxNum] = parentTreeNode.children[chanIdxNum];
      parentTreeNode.children[chanIdxNum] = temp;
    } catch (err) {
      console.log(err);
    }
    await bomUtils.closeBOMWindows([parentBom.bomWindow]);
    standardTreeNode = undefined;
  }
}

/**
 * 구조 트리의 폴더의 이름을 변경 전 선택된 아이템이 폴더인지 확인
 */
function folderNameEditCheck() {
  const designStdData = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let selNode = designStdData.dataProviders.designStandardTreeTableData.selectedObjects[0];
  if (selNode && selNode.type.includes('Folder')) {
    return {
      folderNameEditMode: true,
    };
  } else {
    message.show(0, lgepLocalizationUtils.getLocalizedText('L2_DesignStandardMessages', 'selectedFolderPlease'), [], []);
    return {
      folderNameEditMode: false,
    };
  }
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
  // getColumnChartData,
  loadList,
  backArrow,
  forwardArrow,
  // bookmark,
  // backArrowBookmark,
  createDgnBook,
  selFolderCheck,
  bomlineAdd,
  selectedTreeNode,
  typeOrDetailTypeSet,
  createDgnPage,
  pageContentView,
  treeViewChangeAc,
  bomlineTreeSet2,
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
  // datasetLinkAction,
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
  preciseSet,
  bookFreeze,
  buttonSet,
  reviseCheck,
  treeRevChange,
  listPageSearching,
  reviseCheckToDelete,
  reviseCheckToChildAdd,
  getSelectBook,
  pageInSearching,
  closeupInit,
  delLink,
  changePositionSet,
  pagePositionChange,
  folderNameEditCheck,
  guideBookOpen,
  dgnStandardBookBomView,
};

app.factory('L2_DesignStandardService', () => exports);
