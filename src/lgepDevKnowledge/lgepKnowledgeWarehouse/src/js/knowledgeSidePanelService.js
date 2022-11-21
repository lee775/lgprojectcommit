import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import appCtx from 'js/appCtxService';
import awTableSvc from 'js/awTableService';
import dmSvc from 'soa/dataManagementService';
import com from 'js/utils/lgepObjectUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import common from 'js/utils/lgepCommonUtils';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import message from 'js/utils/lgepMessagingUtils';
import viewModelService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
var $ = require('jQuery');

let homeFolder = null;
let checkAttr = null;
let partWarning = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'partWarning');
let loadOutputData;

export async function loadLists(data) {
  data.listPeriodValues.dbValue = [
    {
      propDisplayValue: null,
      propInternalValue: null,
    },
    {
      propDisplayValue: 1 + data.i18n.day,
      propInternalValue: 259200000,
    },
    {
      propDisplayValue: 5 + data.i18n.day,
      propInternalValue: 432000000,
    },
    {
      propDisplayValue: 1 + data.i18n.week,
      propInternalValue: 604800000,
    },
    {
      propDisplayValue: 1 + data.i18n.month,
      propInternalValue: 2592000000,
    },
  ];
  let qnaData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
  let treeArray = qnaData.treeArray;
  let keys = Object.keys(treeArray);

  let inputTrees = [
    {
      propDisplayValue: '',
      propInternalValue: '',
    },
  ];
  for (let folder of keys) {
    let addInputTree = {
      propDisplayValue: folder,
      propInternalValue: folder,
    };
    inputTrees.push(addInputTree);
  }
  data.listPartValues.dbValue = inputTrees;
}

export async function changeIssue(data) {
  if (data.listExpert) {
    data.checkExpertQ.dbValue = false;
  }
  await common.delay(20);
  let qnaData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
  let treeArray;
  if (!data.treeArray) {
    treeArray = qnaData.treeArray;
  } else {
    treeArray = data.treeArray;
  }
  if (data.listPart.dbValue != null) {
    data.listIssue.dbValue = '';
    data.listIssue.uiValue = '';
    if (data.listExpert) {
      let expertList = [];
      for (let user of data.userData) {
        if (user.props.l2_expert_coverages.uiValues != '' && user.props.l2_expert_coverages.uiValues.includes(data.listPart.dbValue)) {
          let lists = {
            propDisplayValue: user.props.l2_user_name.dbValues[0],
            propInternalValue: user.uid,
          };
          expertList.push(lists);
        } else if (data.listPart.dbValue == '') {
          if (user.props.l2_is_expert.uiValues[0] == 'O') {
            let lists = {
              propDisplayValue: user.props.l2_user_name.dbValues[0],
              propInternalValue: user.uid,
            };
            expertList.push(lists);
          }
        }
      }
      data.listExpertValues.dbValue = expertList;
      data.listExpert.uiValue = '';
      data.listExpert.dbValue = '';
      if (expertList.length < 1) {
        document.querySelector('.expert').setAttribute('id', 'issueDisalbe');
      } else {
        document.querySelector('.expert').setAttribute('id', '');
      }
      // data.checkExpertQ.dbValue = false;
    }
    let inputList = [{ propDisplayValue: null, propInternalValue: null }];
    if (data.listPart.dbValue != '') {
      for (let folder of treeArray[data.listPart.dbValue]) {
        // if (folder.type.includes("Folder")) {
        let addInputTree = {
          propDisplayValue: folder,
          propInternalValue: folder,
        };
        inputList.push(addInputTree);
      }
    }
    data.listIssueValues.dbValue = inputList;
    document.querySelector('.issue').removeAttribute('id');
  } else {
    document.querySelector('.issue').setAttribute('id', 'issueDisable');
  }
  let popUpData = vms.getViewModelUsingElement(document.getElementById('addPop'));
  if (checkAttr && checkAttr.child) {
    for (let list of data.listIssueValues.dbValue) {
      if (list.propDisplayValue == checkAttr.child) {
        data.listIssue.uiValue = checkAttr.child;
        data.listIssue.dbValue = list.propInternalValue;
      }
    }
    checkAttr = null;
  } else {
    if (popUpData) {
      checkAttr = popUpData.attrs;
    }
    for (let list of data.listIssueValues.dbValue) {
      if (checkAttr && list.propDisplayValue == checkAttr.child) {
        data.listIssue.uiValue = checkAttr.child;
        data.listIssue.dbValue = list.propInternalValue;
      }
    }
    checkAttr = null;
  }
  if (loadOutputData && !popUpData) {
    if (loadOutputData.parent != null) {
      data.listIssue.uiValue = loadOutputData.target;
      data.listIssue.dbValue = loadOutputData.target;
    }
  }
  if (data.listExpert) {
    data.checkExpertQ.dbValue = true;
  }
}

export function searchList(data) {
  if (data.listPart.uiValue == '' || data.listPart.uiValue == null) {
    notySvc.showWarning(partWarning);
  } else {
    let qnaData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
    let folderObjs = qnaData.folderObjs;
    let parent = null;
    let part = data.listPart.uiValue;
    let issue = data.listIssue.uiValue;
    let folder = null;
    let target = null;
    if (part != null && (issue == null || issue == '')) {
      folder = folderObjs[part].uid;
      var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
      // test() ㅡ 찾는 문자열이 들어있는지 확인
      if (regExp.test(folder)) {
        folder = folder.replace(regExp, ''); // 찾은 특수 문자를 제거
      }
      target = part;
    } else if (part != null && (issue != null || issue != '')) {
      folder = folderObjs[part].uid + issue;
      var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
      // test() ㅡ 찾는 문자열이 들어있는지 확인
      if (regExp.test(folder)) {
        folder = folder.replace(regExp, ''); // 찾은 특수 문자를 제거
      }
      target = issue;
      parent = part;
    }
    let outputData = {
      folder: folder,
      target: target,
      parent: parent,
      pno: data.inputPNo.dbValue,
      mno: data.inputModelNo.dbValue,
      source: data.listSource.dbValue,
      modelNo: data.inputModelNo.dbValue,
      periodString: data.listPeriod.uiValue,
      period: data.listPeriod.dbValue,
      allign: data.listAllign.dbValue,
      allignUi: data.listAllign.uiValue,
    };
    loadOutputData = outputData;
    eventBus.publish('panelSearch', outputData);
    eventBus.publish('removeMessages');
  }
}

export function checkURL(data) {
  let periodValues = [
    {
      propDisplayValue: '',
      propInternalValue: '',
    },
    {
      propDisplayValue: 1 + data.i18n.day,
      propInternalValue: 259200000,
    },
    {
      propDisplayValue: 5 + data.i18n.day,
      propInternalValue: 432000000,
    },
    {
      propDisplayValue: 1 + data.i18n.week,
      propInternalValue: 604800000,
    },
    {
      propDisplayValue: 1 + data.i18n.month,
      propInternalValue: 2592000000,
    },
  ];
  data.listPeriodValues.dbValue = periodValues;
  let sourceValues = [
    {
      propDisplayValue: null,
      propInternalValue: null,
    },
    {
      propDisplayValue: 'DGMS',
      propInternalValue: 'DGMS',
    },
    {
      propDisplayValue: 'DQMS',
      propInternalValue: 'DQMS',
    },
    {
      propDisplayValue: 'GPDM',
      propInternalValue: 'GPDM',
    },
  ];
  data.listSourceValues.dbValue = sourceValues;
  let allignValues = [
    {
      propDisplayValue: null,
      propInternalValue: null,
    },
    {
      propDisplayValue: data.i18n.recent,
      propInternalValue: 'recent',
    },
    {
      propDisplayValue: '별점순',
      propInternalValue: 'starPoint',
    },
    {
      propDisplayValue: '정확도순',
      propInternalValue: 'accuracy',
    },
  ];
  data.listAllignValues.dbValue = allignValues;
  let qnaData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
  let treeArray = qnaData.treeArray;
  let keys = Object.keys(treeArray);

  let inputTrees = [
    {
      propDisplayValue: null,
      propInternalValue: null,
    },
  ];
  for (let folder of keys) {
    let addInputTree = {
      propDisplayValue: folder,
      propInternalValue: folder,
    };
    inputTrees.push(addInputTree);
  }
  data.listPartValues.dbValue = inputTrees;
  let url = window.location.href;
  let url1 = decodeURI(url);
  let urlAttrSearch = url1.split('?');
  if (urlAttrSearch.length > 1) {
    let urlAttr = urlAttrSearch[1];
    urlAttr = urlAttr.split('&');
    let attrs = {};
    if (urlAttr.length > 0) {
      for (let attr of urlAttr) {
        attr = attr.split('=');
        attrs[attr[0]] = attr[1];
      }
    }
    checkAttr = attrs;
    if (checkAttr.child) {
      checkAttr.child = checkAttr.child.replace('%2F', '/');
    }
    for (let list of data.listPartValues.dbValue) {
      if (list.propDisplayValue == attrs.parent) {
        data.listPart.uiValue = attrs.parent;
        data.listPart.dbValue = list.propInternalValue;
      }
    }
  }
  data.listAllign.dbValue = 'accuracy';
  data.listAllign.uiValue = '정확도순';
  let popUpData = vms.getViewModelUsingElement(document.getElementById('addPop'));
  if (loadOutputData && !popUpData) {
    if (loadOutputData.parent == null && loadOutputData.target != '') {
      data.listPart.uiValue = loadOutputData.target;
      data.listPart.dbValue = loadOutputData.target;
    } else if (loadOutputData.parent != null) {
      data.listPart.uiValue = loadOutputData.parent;
      data.listPart.dbValue = loadOutputData.parent;
    }
    data.listSource.uiValue = loadOutputData.source;
    data.listSource.dbValue = loadOutputData.source;
    data.listPeriod.uiValue = loadOutputData.periodString;
    data.listPeriod.dbValue = loadOutputData.period;
    data.inputModelNo.dbValue = loadOutputData.modelNo;
    data.inputPNo.dbValue = loadOutputData.pno;
    data.listAllign.dbValue = loadOutputData.allign;
    data.listAllign.uiValue = loadOutputData.allignUi;
  }
}

export function panelDataReset(data) {
  data.listPart.uiValue = '';
  data.listPart.dbValue = '';
  data.listIssue.dbValue = '';
  data.listIssue.uiValue = '';
  data.listSource.uiValue = '';
  data.listSource.dbValue = '';
  data.listPeriod.uiValue = '';
  data.listPeriod.dbValue = '';
  data.inputModelNo.dbValue = '';
  data.inputPNo.dbValue = '';
  data.listAllign.dbValue = '';
  data.listAllign.uiValue = '';
  loadOutputData = undefined;
}

let exports = {};

export default exports = {
  loadLists,
  changeIssue,
  searchList,
  checkURL,
  panelDataReset,
};
app.factory('knowledgeSidePanelService', () => exports);
