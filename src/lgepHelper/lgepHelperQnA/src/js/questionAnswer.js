import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import dataManagementService from 'soa/dataManagementService';
import query from 'js/utils/lgepQueryUtils';
import eventBus from 'js/eventBus';
import com from 'js/utils/lgepObjectUtils';
import message from 'js/utils/lgepMessagingUtils';
import vms from 'js/viewModelService';
import notySvc from 'js/NotyModule';
import viewModelService from 'js/viewModelObjectService';
import iconService from 'js/iconService';
import fmsUtils from 'js/fmsUtils';
import browserUtils from 'js/browserUtils';
import popupService from 'js/popupService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import _ from 'lodash';
import common from 'js/utils/lgepCommonUtils';
import advancedSearchUtils from 'js/advancedSearchUtils';
import { consolidateObjects } from 'js/declUtils';
import appCtxService from 'js/appCtxService';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';

var $ = require('jQuery');

let selectAnswer = null;
let checkEdit = false;
let selectRelationTableColumn = null;
let createComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComplete');
let textAnswer = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'answer');
let textAdopt = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'adopt');
let textAdopted = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'adopted');
let createComment1 = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComment1');
let createComment2 = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComment2');
let deleteComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'deleteComplete');
let checkDeleteQuestion = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'checkDeleteQuestion');
let notQuestionCreator = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'notQuestionCreator');
let cannotDelete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cannotDelete');
let checkClickDislike = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'checkClickDislike');
let checkClickLike = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'checkClickLike');
let checkDislike = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'checkDislike');
let checkDeleteAnswer = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'checkDeleteAnswer');
let notAnswerCreator = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'notAnswerCreator');
let buttonDelete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'delete');
let buttonCancle = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cancle');
let buttonYes = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'yes');
let buttonNo = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'no');
let cantDeleteAdoptedQuestion = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cantDeleteAdoptedQuestion');
let cantDeleteAdoptedAnswer = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cantDeleteAdoptedAnswer');
let cantDeleteQuestion = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cantDeleteQuestion');
let cantDeleteAnswer = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cantDeleteAnswer');
let cantAddAnswer = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cantAddAnswer');
let noExistExpert = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'noExistExpert');
let noExpert = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'noExpert');
let editComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'editComplete');
let noEmptyContents = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'noEmptyContents');

let firstPage = 1;
let lastPage = 1;
let nowPage = 1;
let dividePage = 5;
let showItem = 20;

//욱채가 만든 메소드
export function qnaLinkEventAction(data) {
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + data.eventData.scope.prop.uid);
}

export async function adopt(data, value, valueQuestion) {
  let selectedQ = data.dataProviders.qaListDataProvider.selectedObjects[0];
  let selectedA = data.dataProviders.qaAnswerList.selectedObjects[0];
  let owningUser = selectedA.props.owning_user.uiValue;
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
  if (searchingUser === null) {
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(owningUser);

    searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
  }
  searchingUser = searchingUser[0];
  await com.getProperties([searchingUser], ['l2_point', 'l2_selected_knowledge_count']);

  let setPoint = data.qaPoint.uiValue;
  setPoint = parseInt(setPoint);
  let userPoint = searchingUser.props.l2_point.uiValues[0];
  userPoint = parseInt(userPoint);
  setPoint = setPoint + userPoint;
  setPoint = String(setPoint);

  let minusUserId = selectedQ.props.owning_user.uiValue;
  let minusUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [minusUserId]);
  if (minusUser === null) {
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(minusUserId);

    minusUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
  }
  minusUser = minusUser[0];
  await com.getProperties([minusUser], ['l2_point']);
  let minusUserPoint = parseInt(minusUser.props.l2_point.uiValues[0]) - parseInt(data.qaPoint.uiValue);
  minusUserPoint = String(minusUserPoint);

  let userAdopt = searchingUser.props.l2_selected_knowledge_count.uiValues[0];
  userAdopt = parseInt(userAdopt);
  userAdopt++;
  userAdopt = String(userAdopt);

  let param = {
    objects: [selectedA],
    attributes: {
      l2_is_selected: {
        stringVec: ['Y'],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [selectedQ],
    attributes: {
      l2_complete: {
        stringVec: ['Y'],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [searchingUser],
    attributes: {
      l2_point: {
        stringVec: [setPoint],
      },
      l2_selected_knowledge_count: {
        stringVec: [userAdopt],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [minusUser],
    attributes: {
      l2_point: {
        stringVec: [minusUserPoint],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [valueQuestion],
    attributes: {
      l2_complete: {
        stringVec: ['Y'],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  data.adoptState = true;
  eventBus.publish('qaAnswerList.listUpdated');
  eventBus.publish('chartReLoad');
}
//욱채가 만든 메소드
let backSpacePopupAction = function (data, relationItem) {
  data.linkRepeat.dbValue = [];
  for (let i = 0; i < relationItem.length; i++) {
    if (!relationItem[i].props.object_name.dbValues[0].includes('.txt')) {
      data.linkRepeat.dbValue.push({
        displayName: relationItem[i].props.object_name.dbValues[0],
        isRequired: 'false',
        uiValue: relationItem[i].props.object_name.dbValues[0],
        isNull: 'false',
        uid: relationItem[i].uid,
      });
    }
  }
};

export async function adopted(data, value) {
  let selectedA = data.dataProviders.qaAnswerList.selectedObjects[0];
  let owningUser = value.props.owning_user.uiValues[0];
  let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
  if (searchingUser === null) {
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(owningUser);

    searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
  }
  searchingUser = searchingUser[0];
  await com.getProperties([searchingUser], ['l2_point', 'l2_selected_knowledge_count']);

  let setPoint = data.qaPoint.uiValue;
  setPoint = parseInt(setPoint);
  let userPoint = searchingUser.props.l2_point.uiValues[0];
  userPoint = parseInt(userPoint);
  setPoint = userPoint - setPoint;
  setPoint = String(setPoint);

  let minusUserId = selectedA.props.owning_user.uiValue;
  let minusUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [minusUserId]);
  if (minusUser === null) {
    var regExp = /\(([^)]+)\)/;
    var matches = regExp.exec(minusUserId);

    minusUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
  }
  minusUser = minusUser[0];
  await com.getProperties([minusUser], ['l2_point']);
  let minusUserPoint = parseInt(minusUser.props.l2_point.uiValues[0]) + parseInt(data.qaPoint.uiValue);
  minusUserPoint = String(minusUserPoint);

  let userAdopt = searchingUser.props.l2_selected_knowledge_count.uiValues[0];
  userAdopt = parseInt(userAdopt);
  userAdopt--;
  userAdopt = String(userAdopt);

  let param = {
    objects: [selectedA],
    attributes: {
      l2_is_selected: {
        stringVec: [''],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [searchingUser],
    attributes: {
      l2_point: {
        stringVec: [setPoint],
      },
      l2_selected_knowledge_count: {
        stringVec: [userAdopt],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [minusUser],
    attributes: {
      l2_point: {
        stringVec: [minusUserPoint],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  data.adoptState = false;
  eventBus.publish('qaAnswerList.listUpdated');
}

export async function loadQaList(data, ctx) {
  lgepLoadingUtils.openWindow();

  let element = document.getElementsByClassName('leftPadding');
  let tableSize = localStorage.getItem('tableSize');
  element[0].style.flexBasis = tableSize != '' ? tableSize : '630px';

  data.editing = data.i18n.editing;
  data.window = 'qna';
  initialize();

  // let searchingQuestion = await query.executeSavedQuery2("PostSearch", ["L2_object_type"], ["L2_QuestionRevision"],null,1);
  let searchingQuestion = [];
  try {
    let returnData = await searchQuestion(ctx.userSession.props.group_name.dbValue, showItem, ctx.searchString, (nowPage - 1) * showItem);
    searchingQuestion = returnData.modelObjects;
  } catch (err) {
    message.show(1, '질문 로드 중 오류가 발생했습니다.');
  }

  // questionList.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));
  await common.userLogsInsert('Load Q&A', '', 'S', 'Success');

  lgepLoadingUtils.closeWindow();
  ctx.qnaList = searchingQuestion.length;

  return {
    qaList: searchingQuestion,
    totalFound: searchingQuestion.length,
    window: 'qna',
  };
}
export async function setAnswerListStyle(data, ctx) {
  let listHtml = document.querySelectorAll('.listClass > div > div > div > ul > li');
  let listHtml2 = document.querySelectorAll('.listClass .aw-widgets-cellListCellImage');
  let listHtml3 = document.querySelectorAll('.listClass .aw-widgets-cellListItemContainer .aw-widgets-cellListItemCell');

  let i = 0;
  for (let li of listHtml) {
    if (li.innerText.includes(ctx.user.props.object_string.dbValue)) {
      li.style.backgroundColor = ctx.theme == 'ui-lgepDark' ? '#31393f' : '#f0f0f0';
      li.style.alignSelf = 'self-end';
      li.style.textAlignLast = 'end';
      listHtml2[i].style.display = 'none';
      listHtml3[i].style.marginLeft = '22px';
    }
    i++;
  }
}
export async function setAnswerListBgStyle(data, ctx) {
  let listHtml = document.querySelectorAll('.listClass > div > div > div > ul > li');

  for (let li of listHtml) {
    if (li.innerText.includes(ctx.user.props.object_string.dbValue)) {
      li.style.backgroundColor = ctx.theme == 'ui-lgepDark' ? '#31393f' : '#f0f0f0';
    }
  }
}

export async function answerList(response, data) {
  response = response.answerList;

  //모델 오브젝트를 뷰모델 오브젝트로 전환
  let vmoArray = [];
  for (let mo of response) {
    let iman = cdmSvc.getObjects(mo.props.IMAN_specification.dbValues);
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
    vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
    vmo.cellProperties = '';
    let count = await query.executeSavedQuery('ReplySearch', ['L2_item_id', 'L2_object_type'], [mo.props.item_id.uiValues[0], 'L2_LikeRevision']);
    vmo.props.l2_good_count = count != null ? count.length : 0;
    let param = {
      objects: [cdmSvc.getObject(mo.props.owning_user.dbValues[0])],
      attributes: ['object_name'],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
    } catch (err) {
      //console.log(err);
    }
    if (iman != null && Array.isArray(iman)) {
      for (let img of iman) {
        // let linkTicket = img.props.awp0ThumbnailImageTicket.dbValues[0];
        // let link = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(linkTicket) + '?ticket=' + linkTicket;
        // vmo.props.l2_content.dbValues[0] = vmo.props.l2_content.dbValues[0].replace('src=""', 'src="' + link + '"');
        vmo.props.l2_content.dbValues[0] = await lgepSummerNoteUtils.readHtmlToSummernote(mo);
      }
    } else if (iman != null && !Array.isArray(iman)) {
      // let linkTicket = iman.props.awp0ThumbnailImageTicket.dbValues[0];
      // let link = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(linkTicket) + '?ticket=' + linkTicket;
      vmo.props.l2_content.dbValues[0] = await lgepSummerNoteUtils.readHtmlToSummernote(mo);
    }
    let thumbnailUrl = cdmSvc.getObject(mo.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
    if (thumbnailUrl === null || thumbnailUrl === '') {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('typePerson48_custom.svg');
      vmo.thumbnailURL = '';
      vmo.hasThumbnail = false;
    } else {
      vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
      vmo.thumbnailURL = '';
      vmo.hasThumbnail = false;
    }
    vmoArray.push(vmo);
  }

  let temp;
  for (let i = 0; i < vmoArray.length; i++) {
    if (vmoArray[i].props.l2_is_selected.uiValues[0] == 'Y') {
      temp = vmoArray.splice(i, 1);
      break;
    }
  }

  if (temp != undefined) {
    vmoArray.unshift(temp[0]);
  }
  response = vmoArray;
  return response;
}

export function filterList(response, data) {
  response = response.qaList;
  return response;
}

export function initialize() {
  $('#qaContentSummernote').summernote({
    tabsize: 0,
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#qaContentSummernote').summernote('disable');
  $('#qaContentSummernote').css('background-color', 'white');
  $('#qnaAnswerContent').summernote({
    width: '100%',
    height: 200,
    toolbar: [
      ['fontsize', ['fontsize']],
      ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
      ['color', ['forecolor', 'color']],
      ['table', ['table']],
      ['para', ['ul', 'ol', 'paragraph']],
      ['insert', ['picture', 'link']],
      ['codeview'],
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#qnaAnswerContent').summernote('enable');
}

export function questionAdd(data, ctx) {}

export function answerAdd(data, ctx) {}

export async function createQnaQuestion(data, ctx) {
  let title = data.questionTitle.dbValue;
  let content = data.questionContent.dbValue;
  // QnA 지식유형의 아이템 생성
  let param = {
    properties: [
      {
        name: title,
        type: 'L2_Question',
      },
    ],
  };
  let createResult;
  try {
    createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
  } catch (err) {
    //console.log(err);
  }
  // 아이템 리비전 정의
  let createItemRevision = createResult.output[0].itemRev;
  // 아이템 리비전 속성값 넣기
  param = {
    objects: [createItemRevision],
    attributes: {
      l2_content: {
        stringVec: [content],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    await common.userLogsInsert('Create Question', createItemRevision.uid, 'S', 'Success');
  } catch (err) {
    //console.log(err);
  }
}

//클릭한 값 보이게하기
export async function showQuestionProp(data, ctx) {
  ctx.editUid = null;
  data.answerAdd = false;
  $('#qnaAnswerContent').summernote('reset');
  let propId = data.qaID;
  let propTitle = data.qaTitle;
  let propPoint = data.qaPoint;
  let propWriter = data.qaWriter;
  let propWriteDate = data.qaWriteDate;
  let selected = data.dataProviders.qaListDataProvider.selectedObjects[0];
  let viewCount = selected.props.l2_views.dbValues[0];

  var regExp = /\(([^)]+)\)/;
  var matches = regExp.exec(selected.props.owning_user.uiValue);
  propId.uiValue = matches[1];

  propPoint.uiValue = selected.props.l2_point.dbValue === null ? '0' : String(selected.props.l2_point.dbValue);
  propPoint.dbValue = selected.props.l2_point.dbValue === null ? '0' : String(selected.props.l2_point.dbValue);
  propTitle.uiValue = selected.props.object_name.uiValue;
  propTitle.dbValue = selected.props.object_name.uiValue;
  await com.getProperties([selected], ['l2_reference_targets']);
  let relationItem = com.getObjects(selected.props.l2_reference_targets.dbValues);
  let param1 = {
    objects: relationItem,
    attributes: ['object_name'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param1);
  } catch (err) {
    //console.log(err);
  }
  backSpacePopupAction(data, relationItem);

  //써머노트 내용 삽입
  if (selected.props.l2_content.dbValues[0] == null) {
    selected.props.l2_content.dbValues[0] = '';
  }
  let content = await lgepSummerNoteUtils.readHtmlToSummernote(selected);
  $('#qaContentSummernote').summernote('reset');
  $('#qaContentSummernote').summernote('code', content);
  propWriter.uiValue = selected.props.owning_user.uiValue;
  propWriteDate.uiValue = selected.props.creation_date.uiValue;
  if (data.dataProviders.qaAnswerList.selectedObjects[0] != undefined) {
    checkEdit = false;
  }
  data.checkEdit = checkEdit;

  if (typeof history.pushState != 'undefined') {
    history.pushState(null, null, '#/questionAnswer?question=' + selected.uid);
  }

  viewCount = Number(viewCount);
  viewCount++;

  let param = {
    objects: [selected],
    attributes: {
      l2_views: {
        stringVec: [String(viewCount)],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
  } catch (err) {
    //console.log(err);
  }

  eventBus.publish('initSummernote');
}

export async function loadAnswerList(data, ctx) {
  let adoptState = false;
  let selected = data.dataProviders.qaListDataProvider.selectedObjects[0];
  if (selected != undefined) {
    let itemList = [];
    itemList.push(com.getObject(selected.props.items_tag.value));
    let param = {
      objects: itemList,
      attributes: ['L2_AnswerRelation'],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
    } catch (err) {
      //console.log(err);
    }

    let qaRevisionList = [];
    for (let item of itemList[0].props.L2_AnswerRelation.uiValues) {
      let searchingQuestion = await query.executeSavedQuery('PostSearch', ['L2_object_type', 'L2_item_id'], ['L2_AnswerRevision', item]);
      qaRevisionList.push(searchingQuestion[0]);
    }

    param = {
      objects: qaRevisionList,
      attributes: [
        'object_name',
        'creation_date',
        'owning_user',
        'l2_content',
        'l2_content_string',
        'item_id',
        'l2_is_selected',
        'items_tag',
        'IMAN_specification',
      ],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
    } catch (err) {
      //console.log(err);
    }

    qaRevisionList.sort((a, b) => new Date(a.props.creation_date.dbValues[0]) - new Date(b.props.creation_date.dbValues[0]));

    for (let check of qaRevisionList) {
      if (check.props.l2_is_selected.dbValues[0] === 'Y') {
        adoptState = true;
      }
    }

    return {
      answerList: qaRevisionList,
      totalFound: qaRevisionList.length,
      window: 'qna',
      adoptState: adoptState,
    };
  }
}
//질문삭제
export async function questionDelete(data, lists, ctx, id, title, writer, writerDate, point) {
  let selectedQ = data.qaListDataProvider.selectedObjects[0];
  let selectedA = data.qaAnswerList.selectedObjects[0];
  //질문만 선택된 경우
  if (selectedQ != undefined && selectedA == undefined) {
    if (selectedQ.props.l2_complete.dbValues[0] === 'Y') {
      notySvc.showError(cantDeleteAdoptedQuestion);
    } else if (selectedQ.props.owning_user.dbValues[0] != ctx.user.uid) {
      notySvc.showError(cantDeleteQuestion);
    } else {
      if (selectedQ.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
        //noty
        var buttonArray = [];
        buttonArray.push({
          addClass: 'btn btn-notify',
          text: buttonDelete,
          onClick: async function ($noty) {
            $noty.close();
            await lgepSummerNoteUtils.deleteRelation(selectedQ);
            let selectedQId = selectedQ.cellHeader2;
            let selectedQtem = {
              infos: [
                {
                  itemId: selectedQId,
                },
              ],
            };
            try {
              selectedQtem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', selectedQtem);
              selectedQtem = selectedQtem.output[0].item;
            } catch (err) {
              //console.log(err);
            }

            let replyList = [];
            replyList = com.getObject(selectedQtem.props.L2_AnswerRelation.dbValues);

            for (let reply of replyList) {
              let param = {
                input: [
                  {
                    clientId: '',
                    relationType: 'L2_AnswerRelation',
                    primaryObject: selectedQtem,
                    secondaryObject: reply,
                  },
                ],
              };
              try {
                await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
              } catch (err) {
                //console.log(err)
              }
            }
            data.qaListDataProvider.selectNone();
            let param = {
              objects: replyList,
            };
            try {
              await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', param);
            } catch (err) {
              //console.log(err)
            }

            //질문 삭제
            let Param = {
              objects: [selectedQtem],
            };
            try {
              await common.userLogsInsert('Delete Question', selectedQtem.uid, 'S', 'Success');
              await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', Param);
            } catch (err) {
              //console.log(err)
            }
            id.uiValue = '';
            title.uiValue = '';
            //써머노트 내용 삽입
            $('#qaContentSummernote').summernote('reset');
            $('#qaContentSummernote').summernote('code', '' + '<br>');
            writer.uiValue = '';
            writerDate.uiValue = '';
            point.uiValue = '';
            history.pushState(null, null, '#/questionAnswer');
            // eventBus.publish("qaAnswerList.listUpdated");
            eventBus.publish('qaList.plTable.reload');
            notySvc.showInfo(deleteComplete);
          },
        });
        buttonArray.push({
          addClass: 'btn btn-notify',
          text: buttonCancle,
          onClick: function ($noty) {
            $noty.close();
          },
        });
        notySvc.showWarning(checkDeleteQuestion, buttonArray);
      } else {
        notySvc.showInfo(notQuestionCreator);
      }
    }
    //답변이 선택된 경우
  } else if (selectedQ != undefined && selectedA != undefined) {
    if (selectedA.props.l2_is_selected.dbValues[0] === 'Y') {
      notySvc.showError(cantDeleteAdoptedAnswer);
    } else if (selectedA.props.owning_user.dbValues[0] != ctx.user.uid) {
      notySvc.showError(cantDeleteAnswer);
    } else {
      let owningAnswerUser = selectedA.props.owning_user.uiValues[0];
      let answerUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningAnswerUser]);
      if (answerUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningAnswerUser);

        answerUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
      }
      answerUser = answerUser[0];
      await com.getProperties([answerUser], ['l2_answer_count']);
      let answerCnt = Number(answerUser.props.l2_answer_count.dbValues[0]);

      if (selectedA.props.l2_is_selected.dbValues[0] == 'Y') {
        message.show(1, cannotDelete, [data.i18n.close], [function () {}]);
      } else {
        if (selectedA.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
          let selectedAId = selectedA.props.item_id.dbValues[0];
          //noty
          var buttonArray = [];
          buttonArray.push({
            addClass: 'btn btn-notify',
            text: buttonDelete,
            onClick: async function ($noty) {
              $noty.close();
              try {
                await lgepSummerNoteUtils.deleteRelation(selectedA);
              } catch (err) {
                //console.log(err);
              }
              let selectedQId = selectedQ.cellHeader2;
              let selectedQtem = {
                infos: [
                  {
                    itemId: selectedQId,
                  },
                ],
              };
              try {
                selectedQtem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', selectedQtem);
                selectedQtem = selectedQtem.output[0].item;
              } catch (err) {
                //console.log(err);
              }

              let item = {
                infos: [
                  {
                    itemId: selectedAId,
                  },
                ],
              };
              try {
                item = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item);
                item = item.output[0].item;
              } catch (err) {
                //console.log(err);
              }

              let param = {
                input: [
                  {
                    clientId: '',
                    relationType: 'L2_AnswerRelation',
                    primaryObject: selectedQtem,
                    secondaryObject: item,
                  },
                ],
              };
              try {
                await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
              } catch (err) {
                //console.log(err)
              }
              param = {
                objects: [item],
              };
              try {
                await common.userLogsInsert('Delete Answer', item.uid, 'S', 'Success');
                await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', param);
              } catch (err) {
                //console.log(err)
              }

              answerCnt--;

              try {
                let setPropsItem = {
                  objects: [answerUser],
                  attributes: {
                    l2_answer_count: {
                      stringVec: [String(answerCnt)],
                    },
                  },
                };
                await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setPropsItem);
              } catch (err) {
                //console.log(err);
              }
              data.qaAnswerList.selectedObjects[0] = undefined;
              eventBus.publish('answerCreate.complete');
              notySvc.showInfo(deleteComplete);
            },
          });
          buttonArray.push({
            addClass: 'btn btn-notify',
            text: buttonCancle,
            onClick: function ($noty) {
              $noty.close();
            },
          });
          notySvc.showWarning(checkDeleteAnswer, buttonArray);
        } else {
          notySvc.showInfo(notAnswerCreator);
        }
      }
    }
  }
}

export async function likeAdd(data, ctx) {
  if (selectAnswer) {
    let selectedA = selectAnswer;
    let owningUser = selectedA.props.owning_user.uiValues[0];
    let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
    if (searchingUser === null) {
      var regExp = /\(([^)]+)\)/;
      var matches = regExp.exec(owningUser);

      searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
    }
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ['l2_point', 'l2_good_count']);
    let goodCnt = Number(searchingUser.props.l2_good_count.dbValues[0]);

    let likeOverlap;
    let count = await query.executeSavedQuery('ReplySearch', ['L2_item_id', 'L2_object_type'], [selectedA.props.item_id.uiValue, 'L2_LikeRevision']);

    let param = {
      objects: count,
      attributes: ['owning_user', 'l2_reference_post'],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
    } catch (err) {
      //console.log(err);
    }

    let delItem;
    if (count != null) {
      for (let reply of count) {
        if (reply.props.owning_user.dbValues[0] === ctx.user.uid) {
          delItem = reply;
          likeOverlap = true;
          break;
        } else {
          likeOverlap = false;
        }
      }
    }

    if (likeOverlap) {
      // 이 답변의 좋아요를 취소합니다.
      var buttonArray = [];
      buttonArray.push({
        addClass: 'btn btn-notify',
        text: buttonYes,
        onClick: async function ($noty) {
          $noty.close();

          let deleteItem = {
            objects: [com.getObject(delItem.props.items_tag.dbValues[0])],
          };

          await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteItem);

          goodCnt--;

          try {
            let setPropsItem = {
              objects: [searchingUser],
              attributes: {
                l2_good_count: {
                  stringVec: [String(goodCnt)],
                },
              },
            };
            await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setPropsItem);
          } catch (err) {
            //console.log(err);
          }
          notySvc.showInfo(checkClickDislike);
          eventBus.publish('qaAnswerList.listUpdated');
        },
      });
      buttonArray.push({
        addClass: 'btn btn-notify',
        text: buttonNo,
        onClick: function ($noty) {
          $noty.close();
        },
      });
      notySvc.showWarning(checkDislike, buttonArray);
    } else {
      // 이 답변을 좋아합니다.
      let createItems = {
        properties: [
          {
            name: 'Like',
            type: 'L2_Like',
            revId: 'A',
          },
        ],
      };
      let createItemRev = await SoaService.post('Core-2006-03-DataManagement', 'createItems', createItems);
      try {
        let setUpdateItem = {
          objects: [createItemRev.output[0].itemRev],
          attributes: {
            l2_reference_post: {
              stringVec: selectedA.props.items_tag.dbValues,
            },
          },
        };

        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setUpdateItem);

        goodCnt++;

        let setPropsItem = {
          objects: [searchingUser],
          attributes: {
            l2_good_count: {
              stringVec: [String(goodCnt)],
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setPropsItem);

        notySvc.showInfo(checkClickLike);
        eventBus.publish('qaAnswerList.listUpdated');
      } catch (err) {
        //console.log(err);
      }
    }
  }
}

export function loadSelection(data) {
  if (data.dataProviders.qaAnswerList.selectedObjects.length > 0) {
    selectAnswer = data.dataProviders.qaAnswerList.selectedObjects[0];
    selectAnswer.adopt = textAdopt;
    selectAnswer.adopted = textAdopted;
    checkEdit = true;
  } else {
    checkEdit = false;
  }
  data.checkEdit = checkEdit;
}

export function checkUser(data, ctx) {
  let selected = null;
  if (data.qaListDataProvider.selectedObjects[0] && !data.qaAnswerList.selectedObjects[0]) {
    selected = data.qaListDataProvider.selectedObjects[0];
    if (selected.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
      eventBus.publish('editPopup.open');
    } else {
      notySvc.showInfo(notQuestionCreator);
    }
  } else if (data.qaListDataProvider.selectedObjects[0] && data.qaAnswerList.selectedObjects[0]) {
    selected = data.qaAnswerList.selectedObjects[0];
    if (selected.props.owning_user.uiValue == ctx.user.props.object_string.dbValue) {
      // eventBus.publish("editPopup.open");
      if (ctx.editUid == undefined || ctx.editUid == null) {
        $('#' + selected.props.item_id.dbValue).summernote('destroy');
        $('#' + selected.props.item_id.dbValue).summernote({
          toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link']],
            ['codeview'],
          ],
          fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
        });
        $('#' + selected.props.item_id.dbValue).summernote('enable');
        $('#' + selected.props.item_id.dbValue)
          .next()
          .addClass('changeWhite');
        $('.' + selected.props.item_id.dbValue).css('display', 'inline-block');
        ctx.editUid = selected.props.item_id.dbValue;
        ctx.editObj = selected;
      } else {
        notySvc.showInfo('편집중인 댓글이 있습니다.');
      }
    } else {
      notySvc.showInfo(notAnswerCreator);
    }
  }
}

let count = 0;
export function checkURLData(data, providerName) {
  //1번만 실행
  if (count < 1) {
    let url = window.location.href;
    let url1 = decodeURI(url);
    let urlAttrSearch = url1.split('?');
    if (urlAttrSearch.length > 1) {
      let urlAttr = urlAttrSearch[1];
      urlAttr = urlAttr.split('&');
      let attrs = {};
      let attrName;
      if (urlAttr.length > 0) {
        for (let attr of urlAttr) {
          attr = attr.split('=');
          attrs[attr[0]] = attr[1];
          attrName = attr[0];
        }
      }
      let selectVm;
      let loadVm = data.dataProviders[providerName].viewModelCollection.loadedVMObjects;
      for (let vmo of loadVm) {
        if (vmo.uid == attrs[attrName]) {
          selectVm = vmo;
        }
      }
      data.dataProviders[providerName].selectionModel.setSelection(selectVm);
      count += 1;
    }
  }
}

export function resetCount(data) {
  count = 0;
}

export function setSplitterAction(data) {
  let element = document.getElementsByClassName('leftPadding');
  localStorage.setItem('tableSize', element[0].style.flexBasis);
}

export function initSummer(data) {
  //summernote 기동
  let summerId = [];
  let answers = {};
  for (let answer of data.listResponse) {
    summerId.push(answer.props.item_id.dbValue);
    answers[answer.props.item_id.dbValue] = answer;
  }

  for (let id of summerId) {
    $('#' + id).summernote({
      width: '100%',
      styleWithSpan: true,
      toolbar: [],
    });
    $('#' + id).summernote('disable');
    $('#' + id).summernote('code', answers[id].props.l2_content.dbValues[0]);
  }
}

export async function answerAddNow(data) {
  let alarmLink;

  let answer = $('#qnaAnswerContent').summernote('code') === null ? '' : $('#qnaAnswerContent').summernote('code');
  if (answer == null || answer == '' || answer == '<p><br></p>' || answer == '</p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else {
    const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
    let title = '';
    let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
    let addAnswer = null;
    if (data.window == 'askExpert') {
      addAnswer = '전문가답변';
      // QnA 지식유형의 아이템 생성
      param = {
        properties: [
          {
            name: '',
            type: 'L2_AnswerExp',
          },
        ],
      };
      let createResult;
      try {
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
      }
      // 아이템 리비전 정의
      let createItemRevision = createResult.output[0].itemRev;
      //  이미지 relation
      let returnValue;
      let onlyString = '';
      let text;
      text = await lgepSummerNoteUtils.txtFileToDataset(answer, createItemRevision);
      onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
      // if (returnValue) {
      //     answer = returnValue.resultTag;
      // }
      // 아이템 리비전 속성값 넣기
      let param = {
        objects: [createItemRevision],
        attributes: {
          // l2_content: {
          //     stringVec: [answer]
          // },
          l2_content_string: {
            stringVec: [onlyString],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      } catch (err) {
        //console.log(err);
      }

      let item = com.getObject(selected.props.items_tag.dbValue);
      let uidList = [];
      for (let uid of item.props.L2_AnswerRelation.dbValues) {
        uidList.push(uid);
      }
      uidList.push(createResult.output[0].item.uid);
      param = {
        objects: [com.getObject(selected.props.items_tag.dbValue)],
        attributes: {
          L2_AnswerRelation: {
            stringVec: uidList,
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Add Expert Answer', createItemRevision.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
      }
      //이욱채가 추가 한 기능
      await com.getProperties([createItemRevision], ['owning_user']);
      let owningUser = createItemRevision.props.owning_user.uiValues[0];
      let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
      if (searchingUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningUser);

        searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
      }
      searchingUser = searchingUser[0];
      await com.getProperties([searchingUser], ['l2_answer_count']);
      let userAnswerCount = searchingUser.props.l2_answer_count.dbValues[0];
      userAnswerCount = parseInt(userAnswerCount);
      userAnswerCount++;
      userAnswerCount = String(userAnswerCount);
      param = {
        objects: [searchingUser],
        attributes: {
          l2_answer_count: {
            stringVec: [userAnswerCount],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      } catch (err) {
        //console.log(err);
      }

      alarmLink = browserUtils.getBaseURL() + '#/askExpert?question=' + selected.uid;
    } else if (data.window == 'qna') {
      addAnswer = '답변';

      // QnA 지식유형의 아이템 생성
      let param = {
        properties: [
          {
            name: title,
            type: 'L2_Answer',
          },
        ],
      };
      let createResult;
      try {
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
      }
      // 아이템 리비전 정의
      let createItemRevision = createResult.output[0].itemRev;

      //  이미지 relation
      let returnValue;
      let onlyString = '';
      try {
        let text = await lgepSummerNoteUtils.txtFileToDataset(answer, createItemRevision);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
      } catch (err) {
        //console.log(err)
      }
      if (returnValue) {
        answer = returnValue.resultTag;
      }
      // 아이템 리비전 속성값 넣기
      let param1 = {
        objects: [createItemRevision],
        attributes: {
          // l2_content: {
          //     stringVec: [answer]
          // },
          l2_content_string: {
            stringVec: [onlyString],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param1);
      } catch (err) {
        //console.log(err);
      }

      let item = com.getObject(selected.props.items_tag.dbValue);
      let uidList = [];
      for (let uid of item.props.L2_AnswerRelation.dbValues) {
        uidList.push(uid);
      }
      uidList.push(createResult.output[0].item.uid);
      param = {
        objects: [com.getObject(selected.props.items_tag.dbValue)],
        attributes: {
          L2_AnswerRelation: {
            stringVec: uidList,
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Add Question Answer', createItemRevision.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
      }

      //이욱채가 추가 한 기능
      await com.getProperties([createItemRevision], ['owning_user']);
      let owningUser = createItemRevision.props.owning_user.uiValues[0];
      let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
      if (searchingUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningUser);

        searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
      }
      searchingUser = searchingUser[0];
      await com.getProperties([searchingUser], ['l2_answer_count']);
      let userAnswerCount = searchingUser.props.l2_answer_count.dbValues[0];
      userAnswerCount = parseInt(userAnswerCount);
      userAnswerCount++;
      userAnswerCount = String(userAnswerCount);
      param = {
        objects: [searchingUser],
        attributes: {
          l2_answer_count: {
            stringVec: [userAnswerCount],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      } catch (err) {
        //console.log(err);
      }

      alarmLink = browserUtils.getBaseURL() + '#/questionAnswer?question=' + selected.uid;
    }
    notySvc.showInfo(createComplete);

    if (selected.props.owning_user.dbValues[0] != appCtxService.ctx.user.uid) {
      message.sendAlarmMessage('[' + selected.cellHeader1 + '] 에 댓글이 달렸습니다.', alarmLink, selected.uid, selected.props.owning_user.dbValues[0]);
    }

    eventBus.publish('qaAnswerList.listUpdated');
  }
}

export function answerChange(data, ctx) {
  let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  if (htmlData.window == 'askExpert') {
    let checkExpert = false;
    if (htmlData.expert.length > 0) {
      for (let expert of htmlData.expert) {
        if (expert == ctx.user.props.object_string.dbValue) {
          checkExpert = true;
        }
      }
    } else if (htmlData.expert.length < 1) {
      notySvc.showInfo(noExistExpert);
    }
    if (checkExpert == false) {
      notySvc.showInfo(noExpert);
    } else if (htmlData.dataProviders.qaListDataProvider.selectedObjects[0].props.l2_complete.dbValues[0] === 'Y') {
      notySvc.showError(cantAddAnswer);
    } else if (
      htmlData.dataProviders.qaListDataProvider.selectedObjects[0].props.l2_experts.uiValue &&
      htmlData.dataProviders.qaListDataProvider.selectedObjects[0].props.l2_experts.uiValue !== ctx.user.props.user_name.dbValue
    ) {
      notySvc.showError('요청한 전문가가 아닙니다.');
    } else {
      htmlData.answerAdd = true;
    }
  } else if (htmlData.dataProviders.qaListDataProvider.selectedObjects[0].props.l2_complete.dbValues[0] === 'Y') {
    notySvc.showError(cantAddAnswer);
  } else {
    htmlData.answerAdd = true;
  }
}

export function answerAddCancel() {
  // 댓글 추가 취소 기능
  let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  htmlData.answerAdd = false;
}

export function editCancel(data, ctx) {
  //댓글 편집 취소 기능
  let selected = ctx.editUid;
  $('#' + selected).summernote('destroy');
  $('#' + selected).summernote({
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#' + selected).summernote('disable');
  $('#' + selected)
    .next()
    .removeClass('changeWhite');
  $('.' + selected).css('display', 'none');
  ctx.editUid = null;
  ctx.editObj = null;
}

export async function answerEdit(data, ctx) {
  // 댓글 편집 적용 기능
  let selected = ctx.editUid;
  if (
    $('#' + selected).summernote('code') == null ||
    $('#' + selected).summernote('code') == '' ||
    $('#' + selected).summernote('code') == '<p><br></p>' ||
    $('#' + selected).summernote('code') == '<br>'
  ) {
    notySvc.showError(noEmptyContents);
    return;
  } else {
    let answer = $('#' + selected).summernote('code');
    let selectedA = ctx.editObj;
    let returnValue;
    let onlyString = '';
    try {
      let text = await lgepSummerNoteUtils.txtFileToDataset(answer, selectedA);
      onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
    } catch (err) {
      //console.log(err)
    }
    if (returnValue) {
      answer = returnValue.resultTag;
    }
    // 아이템 리비전 속성값 넣기
    let param = {
      objects: [selectedA],
      attributes: {
        // l2_content: {
        //     stringVec: [answer]
        // },
        l2_content_string: {
          stringVec: [onlyString],
        },
      },
    };
    try {
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      await common.userLogsInsert('Edit Answer', selectedA.uid, 'S', 'Success');
    } catch (err) {
      //console.log(err);
    }
    ctx.editUid = null;
    ctx.editObj = null;
    notySvc.showInfo(editComplete);
    try {
      eventBus.publish('qaListDataProvider.selectionChangeEvent');
    } catch (err) {
      //console.log(err);
    }
  }
}

async function setPageNumber(data, ctx) {
  let returnData = await searchQuestion(ctx.userSession.props.group_name.dbValue, 1, ctx.searchString, 0);
  let service = returnData.serviceData;
  lastPage = Math.ceil(service.totalFound / showItem);
  let frontPage = Math.floor((nowPage - 1) / dividePage) * dividePage + 1;
  let behindPage = frontPage - 1 + dividePage;
  if (behindPage > lastPage) {
    behindPage = lastPage;
  }
  let pageResponse = [];
  for (let i = frontPage; i <= behindPage; i++) {
    let select;
    if (i == nowPage) {
      select = true;
    } else {
      select = false;
    }
    pageResponse.push({
      chipType: 'SELECTION',
      labelDisplayName: String(i),
      selected: select,
    });
  }
  if (nowPage != 1) {
    data.beforePage.uiValue = '<';
    data.firstPage.uiValue = '≪';
  } else {
    data.beforePage.uiValue = '';
    data.firstPage.uiValue = '';
  }

  if (nowPage != lastPage) {
    data.afterPage.uiValue = '>';
    data.lastPage.uiValue = '≫';
  } else {
    data.afterPage.uiValue = '';
    data.lastPage.uiValue = '';
  }

  if (lastPage == 0) {
    data.beforePage.uiValue = '';
    data.firstPage.uiValue = '';
    data.afterPage.uiValue = '';
    data.lastPage.uiValue = '';
  }

  return {
    pageResponse: pageResponse,
    pageLength: pageResponse.length,
  };
}

function clickedPageAction(data, ctx, chip) {
  nowPage = Number(chip.labelDisplayName);
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

function firstPageAction(data, ctx) {
  nowPage = firstPage;
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

function pagingBeforeAction(data) {
  nowPage -= 1;
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

function pagingAfterAction(data) {
  nowPage += 1;
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

function lastPageAction(data) {
  nowPage = lastPage;
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

/**
 *PerformSearch로 질문 목록 가져오기
 *
 * @param {string} group - 그룹명
 * @param {number} searchNum - 한번에 불러올 검색 갯수
 * @param {string} searchString - 검색값
 * @param {number} startIndex - 페이징 처리시 처음 불러올 부분
 */
async function searchQuestion(group, searchNum, searchString, startIndex) {
  if (searchString) {
    searchString = '*' + searchString + '*';
  } else {
    searchString = '*';
  }
  let param = {
    columnConfigInput: {
      clientName: 'AWClient',
      clientScopeURI: 'Awp0AdvancedSearch',
      operationType: 'Intersection',
      hostingClientName: '',
      columnsToExclude: [],
    },
    saveColumnConfigData: {
      columnConfigId: '',
      clientScopeURI: '',
      columns: [],
      scope: '',
      scopeName: '',
    },
    searchInput: {
      maxToLoad: searchNum,
      maxToReturn: searchNum,
      providerName: 'Awp0SavedQuerySearchProvider',
      searchCriteria: {
        Name: searchString,
        queryUID: 'Q0hJ_1nr5p7XAC',
        searchID: advancedSearchUtils.getSearchId('Q0hJ_1nr5p7XAC'),
        typeOfSearch: 'ADVANCED_SEARCH',
        utcOffset: '540',
        lastEndIndex: '',
        totalObjectsFoundReportedToClient: '',
        Type: 'L2_QuestionRevision',
        OwningGroup: group,
      },
      searchFilterFieldSortType: 'Priority',
      startIndex: startIndex,
      searchFilterMap6: {},
      searchSortCriteria: [
        {
          fieldName: 'creation_date',
          sortDirection: 'DESC',
        },
      ],
      attributesToInflate: [
        'object_name',
        'owning_user',
        'last_mod_user',
        'last_mod_date',
        'object_desc',
        'release_status_list',
        'item_revision_id',
        'creation_date',
        'owning_user',
        'l2_content',
        'item_id',
        'l2_views',
        'items_tag',
        'l2_point',
        'l2_complete',
        'owning_group',
        'l2_reference_targets',
      ],
      internalPropertyName: '',
      columnFilters: [],
      cursor: {
        startIndex: 0,
        endIndex: 0,
        startReached: false,
        endReached: false,
      },
      focusObjUid: '',
      pagingType: '',
    },
    inflateProperties: true,
    noServiceData: false,
  };
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);
  var modelObjects = [];
  var modelUid = abc.ServiceData.plain;
  if (modelUid && modelUid.length > 0) {
    for (let uid of modelUid) {
      var obj = abc.ServiceData.modelObjects[uid];
      modelObjects.push(obj);
    }
  }
  return {
    modelObjects: modelObjects,
    serviceData: abc,
  };
}

function questionSearch(data, ctx) {
  //console.log("검색값:",data.searchBox.dbValue);
  ctx.searchString = data.searchBox.dbValue;
  nowPage = 1;
  eventBus.publish('pageChipDataProvider.reset');
  eventBus.publish('qaList.plTable.reload');
}

let exports = {};

export default exports = {
  loadQaList,
  setAnswerListStyle,
  setAnswerListBgStyle,
  answerList,
  filterList,
  questionAdd,
  answerAdd,
  initialize,
  createQnaQuestion,
  showQuestionProp,
  loadAnswerList,
  questionDelete,
  likeAdd,
  loadSelection,
  adopt,
  adopted,
  checkUser,
  qnaLinkEventAction,
  checkURLData,
  resetCount,
  setSplitterAction,
  initSummer,
  answerAddNow,
  answerChange,
  answerAddCancel,
  editCancel,
  answerEdit,
  setPageNumber,
  clickedPageAction,
  firstPageAction,
  pagingBeforeAction,
  pagingAfterAction,
  lastPageAction,
  questionSearch,
};
app.factory('questionAnswer', () => exports);
