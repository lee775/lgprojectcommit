import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from 'js/utils/lgepObjectUtils';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import appCtxSvc from 'js/appCtxService';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';

var $ = require('jQuery');
let maxPoint;
let userList;
let textQuestionPoint = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'questionPoint');
let textPoint = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'point');
let textMax = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'max');
let textTitle = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'title');
let textContent = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'content');
let textQuestionContent = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'questionContent');
let textQuestionTitle = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'questionTitle');
let textAnswerContent = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'answerContent');
let buttonClose = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'close');
let tooManyPoint = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'tooManyPoint');
let setRightPoint = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'setRightPoint');
let createComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'createComplete');
let editComplete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'editComplete');
let characterLimitMsg = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'characterLimitMsg');
let noEmptyContents = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'noEmptyContents');

let createResult;
let createItemRevision;

//욱채가 만든 메소드
export async function getPoint(tmp, ctx) {
  let data = vms.getViewModelUsingElement(document.getElementById('addPop'));
  let getUserId = ctx.user.props.object_string.dbValue;
  if (getUserId.includes('infodba')) {
    //console.log("관리자");
  } else {
    let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [getUserId]);
    if (searchingUser === null) {
      var regExp = /\(([^)]+)\)/;
      var matches = regExp.exec(getUserId);

      searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
    }
    searchingUser = searchingUser[0];
    await com.getProperties([searchingUser], ['l2_point']);
    data.questionPoint.uiValue = textQuestionPoint + ' (' + textMax + ': ' + searchingUser.props.l2_point.dbValues[0] + textPoint + ' )';
    data.questionPoint.displayValues[0] = textQuestionPoint + ' (' + textMax + ': ' + searchingUser.props.l2_point.dbValues[0] + textPoint + ' )';
    data.questionPoint.prevDisplayValues[0] = textQuestionPoint + ' (' + textMax + ': ' + searchingUser.props.l2_point.dbValues[0] + textPoint + ' )';
    data.questionPoint.propertyDisplayName = textQuestionPoint + ' (' + textMax + ': ' + searchingUser.props.l2_point.dbValues[0] + textPoint + ' )';
    data.questionPoint.uiValues[0] = textQuestionPoint + ' (' + textMax + ': ' + searchingUser.props.l2_point.dbValues[0] + textPoint + ' )';
    maxPoint = searchingUser.props.l2_point.dbValues[0];
  }
}
//욱채가 만든 메소드

//QnA아이템 생성
export async function createQnaQuestion(data, ctx) {
  var summerContent = $('#qaAddPopSummernote').summernote('code') === null ? '' : $('#qaAddPopSummernote').summernote('code');
  let title = data.questionTitle.dbValue;
  if (summerContent == null || summerContent == '' || summerContent == '<p><br></p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else if (!title || title == '') {
    notySvc.showError('제목을 입력해주세요.');
    return;
  } else {
    let qnaPoint = data.questionPoint.dbValue;
    let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));

    if (data.listIssue.uiValue == null) {
      data.listIssue.uiValue = '';
    }

    // 중복 생성 방지
    let addBtn = document.querySelector('#addQuestion');
    addBtn.disabled = true;

    if (data.checkExpertQ.dbValue === true) {
      // AskExpert
      try {
        let param = {
          properties: [
            {
              name: title,
              type: 'L2_QuestionExp',
            },
          ],
        };
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
        notySvc.showError(characterLimitMsg);
        return;
      }

      // 아이템 리비전 정의
      createItemRevision = createResult.output[0].itemRev;
      await com.getProperties([createItemRevision], ['item_id']);

      try {
        let onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
        // 아이템 리비전 속성값 넣기
        let param = {
          objects: [createItemRevision],
          attributes: {
            l2_main_category: {
              stringVec: [data.listPart.uiValue],
            },
            l2_subcategory: {
              stringVec: [data.listIssue.uiValue],
            },
            l2_content_string: {
              stringVec: [onlyString],
            },
            l2_experts: {
              stringVec: [data.listExpert.dbValue],
            },
          },
        };
        try {
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
          await common.userLogsInsert('Create Expert Question', createItemRevision.uid, 'S', 'Success');
          await lgepSummerNoteUtils.txtFileToDataset2(summerContent, createItemRevision);

          let target = com.getObject(data.listExpert.dbValue);
          if (target) {
            message.sendAlarmMessage(
              '[' + title + '] 질문의 전문가로 지목되었습니다.',
              '전문가 지목',
              createItemRevision.uid,
              target.props.owning_user.dbValues[0],
            );
          }
        } catch (err) {
          //console.log(err);
          notySvc.showError('질문 내용 저장 실패');
          delItem(createResult.output[0].item);
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
        await com.getProperties([searchingUser], ['l2_knowledge_count']);
        let userknowledgeCount = searchingUser.props.l2_knowledge_count.dbValues[0];
        userknowledgeCount = parseInt(userknowledgeCount);
        userknowledgeCount++;
        userknowledgeCount = String(userknowledgeCount);
        param = {
          objects: [searchingUser],
          attributes: {
            l2_knowledge_count: {
              stringVec: [userknowledgeCount],
            },
          },
        };
        try {
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        } catch (err) {
          //console.log(err);
          notySvc.showError('유저 정보 수정 실패');
          delItem(createResult.output[0].item);
        }
        // if (htmlData != undefined) {
        //     history.pushState(null, null, '#/askExpert?question=' + createItemRevision.uid);
        //     htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(createItemRevision);
        // }
      } catch (err) {
        // 잘못 만들어진 아이템 삭제
        notySvc.showError('아이템 생성 실패');
        delItem(createResult.output[0].item);
      }
    } else {
      // Q&A
      try {
        let param = {
          properties: [
            {
              name: title,
              type: 'L2_Question',
            },
          ],
        };
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
        notySvc.showError(characterLimitMsg);
        return;
      }

      try {
        // 아이템 리비전 정의
        createItemRevision = createResult.output[0].itemRev;
        await com.getProperties([createItemRevision], ['item_id']);
        let onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
        // 아이템 리비전 속성값 넣기
        param = {
          objects: [createItemRevision],
          attributes: {
            l2_content_string: {
              stringVec: [onlyString],
            },
            l2_main_category: {
              stringVec: [data.listPart.uiValue],
            },
            l2_subcategory: {
              stringVec: [data.listIssue.uiValue],
            },
          },
        };
        try {
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
          await common.userLogsInsert('Create Question', createItemRevision.uid, 'S', 'Success');
          await lgepSummerNoteUtils.txtFileToDataset2(summerContent, createItemRevision);
        } catch (err) {
          //console.log(err);
          notySvc.showError('질문 내용 저장 실패');
          delItem(createResult.output[0].item);
        }
      } catch (err) {
        // 잘못 만들어진 아이템 삭제
        notySvc.showError('질문 생성 실패');
        delItem(createResult.output[0].item);
      }
    }

    qnaPoint = parseInt(qnaPoint);
    maxPoint = parseInt(maxPoint);
    if (qnaPoint > maxPoint) {
      message.show(1, tooManyPoint, [buttonClose], [function () {}]);
      return;
    }
    if (qnaPoint < 0) {
      message.show(1, setRightPoint, [buttonClose], [function () {}]);
      return;
    }

    //이욱채가 추가 한 기능
    qnaPoint = String(qnaPoint);
    let param = {
      objects: [createItemRevision],
      attributes: {
        l2_point: {
          stringVec: [qnaPoint],
        },
      },
    };
    if (createItemRevision.type == 'L2_QuestionExpRevision') {
      param = {
        objects: [createItemRevision],
        attributes: {
          l2_point: {
            stringVec: [qnaPoint],
          },
          l2_experts: {
            stringVec: [data.listExpert.dbValue],
          },
        },
      };
    }
    try {
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      // message.sendAlarmMessage('[' + title + '] 질문의 전문가로 지목되었습니다.', '전문가 지목', createItemRevision.uid, data.listExpert.dbValue);
    } catch (err) {
      //console.log(err);
      notySvc.showError('전문가 포인트 등록 실패');
    }
    if (!window.location.href.includes('knowledgeWarehouse')) {
      notySvc.showInfo(createComplete);
    }
    return {
      createItemRevision: createItemRevision,
    };
  }
}

//QnA 답변 생성
export async function createQnaAnswer(ctx) {
  let data = vms.getViewModelUsingElement(document.getElementById('answerAddPop'));
  let answer = data.answerContent.dbValue;
  if (answer == null || answer == '' || answer == '<p><br></p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else {
    const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
    let title = data.questionTitle.dbValue;
    let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
    if (data.window == 'askExpert') {
      // QnA 지식유형의 아이템 생성
      param = {
        properties: [
          {
            name: '',
            type: 'L2_AnswerExp',
          },
        ],
      };

      try {
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
        notySvc.showError('댓글 등록 실패');
      }
      // 아이템 리비전 정의
      createItemRevision = createResult.output[0].itemRev;
      // 아이템 리비전 속성값 넣기
      let param = {
        objects: [createItemRevision],
        attributes: {
          l2_content: {
            stringVec: [answer],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      } catch (err) {
        //console.log(err);
        notySvc.showError('댓글 내용 등록 실패');
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
        await common.userLogsInsert('Create Expert Answer', createItemRevision.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
        notySvc.showError('전문가 댓글 등록 실패');
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
        notySvc.showError('유저 댓글 수 갱신 실패');
      }
      //이욱채가 추가 한 기능
    } else if (data.window == 'qna') {
      // QnA 지식유형의 아이템 생성
      param = {
        properties: [
          {
            name: title,
            type: 'L2_Answer',
          },
        ],
      };

      try {
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        //console.log(err);
        notySvc.showError('댓글 등록 실패');
      }
      // 아이템 리비전 정의
      createItemRevision = createResult.output[0].itemRev;
      // 아이템 리비전 속성값 넣기
      let param = {
        objects: [createItemRevision],
        attributes: {
          l2_content: {
            stringVec: [answer],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Create Question Answer', createItemRevision.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
        notySvc.showError('댓글 내용 등록 실패');
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
      } catch (err) {
        //console.log(err);
        notySvc.showError('댓글 등록 실패');
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
        notySvc.showError('유저 댓글 수 갱신 실패');
      }
      //이욱채가 추가 한 기능
    }

    eventBus.publish('awPopup.close');
    notySvc.showInfo(createComplete);
    eventBus.publish('qaAnswerList.listUpdated');
  }
}

//QnA 편집기능
export async function editQna(data, ctx) {
  const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
  if (qnaData.dataProviders.qaAnswerList.selectedObjects[0]) {
    //답변이 선택된 경우
    if (
      $('#answerSummernote').summernote('code') == null ||
      $('#answerSummernote').summernote('code') == '' ||
      $('#answerSummernote').summernote('code') == '<p><br></p>' ||
      $('#answerSummernote').summernote('code') == '<br>'
    ) {
      notySvc.showError(noEmptyContents);
      return;
    } else {
      let answer = $('#answerSummernote').summernote('code');
      let selectedA = qnaData.dataProviders.qaAnswerList.selectedObjects[0];
      let returnValue;
      let onlyString = '';
      try {
        returnValue = await lgepSummerNoteUtils.txtFileToDataset2(answer, selectedA);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
      } catch (err) {
        //console.log(err)
        notySvc.showError('질문 내용 저장 실패');
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
        await common.userLogsInsert('Update Question Answer', selectedA.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
        notySvc.showError('질문 수정 실패');
      }
      eventBus.publish('awPopup.close');
      notySvc.showInfo(editComplete);
      try {
        eventBus.publish('qaListDataProvider.selectionChangeEvent');
      } catch (err) {
        //console.log(err);
      }
    }
  } else {
    var summerContent = $('#qaEditPopSummernote').summernote('code');
    if (summerContent == null || summerContent == '' || summerContent == '<p><br></p>') {
      notySvc.showError(noEmptyContents);
      return;
    } else if (!data.questionTitle.dbValue || data.questionTitle.dbValue == '') {
      notySvc.showError('제목을 입력해주세요.');
      return;
    } else {
      let returnValue;
      let onlyString = '';
      try {
        returnValue = await lgepSummerNoteUtils.txtFileToDataset2(summerContent, selected);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
      } catch (err) {
        //console.log(err)
        notySvc.showError('전문가 질문 내용 저장 실패');
      }
      if (selected.props.l2_main_category != undefined) {
        try {
          let param = {
            objects: [selected],
            attributes: {
              object_name: {
                stringVec: [data.questionTitle.dbValue],
              },
              l2_content_string: {
                stringVec: [onlyString],
              },
            },
          };
          await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
          await common.userLogsInsert('Update Question', selected.uid, 'S', 'Success');
          eventBus.publish('awPopup.close');
          notySvc.showInfo(editComplete);
          try {
            eventBus.publish('qaListDataProvider.selectionChangeEvent');
          } catch (err) {
            //console.log(err);
          }
        } catch (err) {
          //console.log(err);
          notySvc.showError(characterLimitMsg);
        }
      }
    }
  }
}
//편집창 클릭시 데이터 로드
export async function loadBeforeData(data, ctx) {
  $('#qaEditPopSummernote').summernote({
    width: '100%',
    height: 450,
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
  $('#qaEditPopSummernote').summernote('enable');

  const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
  data.window = qnaData.window;
  data.checkEdit = qnaData.checkEdit;
  let content = await lgepSummerNoteUtils.readHtmlToSummernote(selected);
  if (qnaData.window == 'qna') {
    //qna창에서 열 경우
    let faqData = vms.getViewModelUsingElement(document.getElementById('faqDatas'));
    if (!data.questionTitle) {
      data = faqData;
    }
    if (qnaData.dataProviders.qaAnswerList.selectedObjects[0]) {
      $('#answerSummernote').summernote({
        width: '100%',
        height: 450,
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
      $('#answerSummernote').summernote('enable');
      let selectedAnswer = qnaData.dataProviders.qaAnswerList.selectedObjects[0];
      data.questionTitle.propertyDisplayName = textQuestionContent;
      data.answerContent.propertyDisplayName = textAnswerContent;
      $('#qaEditQuestionSummernote').summernote('reset');
      $('#qaEditQuestionSummernote').summernote('code', content);
      $('#answerSummernote').summernote('reset');
      $('#answerSummernote').summernote('code', selectedAnswer.props.l2_content.dbValues[0] + '<br>');
      data.questionTitle.isEditable = false;
    } else {
      data.questionTitle.propertyDisplayName = textQuestionTitle;
      data.answerContent.propertyDisplayName = textQuestionContent;
      data.questionTitle.dbValue = selected.props.object_name.dbValue;
      $('#qaEditPopSummernote').summernote('reset');
      $('#qaEditPopSummernote').summernote('code', content);
    }
  } else if (qnaData.window == 'faqAdd') {
    let faqData = vms.getViewModelUsingElement(document.getElementById('faqDatas'));
    if (!data.questionTitle) {
      data = faqData;
    }
    data.questionTitle.propertyDisplayName = textTitle;
    data.answerContent.propertyDisplayName = textContent;
    data.faqAnswerContent.propertyDisplayName = textAnswerContent;
  } else if (qnaData.window == 'faqEdit') {
    let faqData = vms.getViewModelUsingElement(document.getElementById('faqDatas'));
    if (!data.questionTitle) {
      data = faqData;
    }
    data.questionTitle.propertyDisplayName = textTitle;
    data.answerContent.propertyDisplayName = textContent;
    data.faqAnswerContent.propertyDisplayName = textAnswerContent;
    data.questionTitle.dbValue = selected.props.object_name.dbValue;
    $('#qaEditPopSummernote').summernote('reset');
    $('#qaEditPopSummernote').summernote('code', content + '<br>');
    $('#qaFaqAnswerSummernote').summernote('reset');
    $('#qaFaqAnswerSummernote').summernote('code', content + '<br>');
  } else if (qnaData.window == 'askExpert') {
    let faqData = vms.getViewModelUsingElement(document.getElementById('faqDatas'));
    if (!data.questionTitle) {
      data = faqData;
    }
    if (qnaData.dataProviders.qaAnswerList.selectedObjects[0]) {
      $('#answerSummernote').summernote({
        width: '100%',
        height: 450,
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
      $('#answerSummernote').summernote('enable');
      let selectedAnswer = qnaData.dataProviders.qaAnswerList.selectedObjects[0];
      data.questionTitle.propertyDisplayName = textQuestionContent;
      data.answerContent.propertyDisplayName = textAnswerContent;
      $('#qaEditQuestionSummernote').summernote('reset');
      $('#qaEditQuestionSummernote').summernote('code', content + '<br>');
      data.questionTitle.isEditable = false;
      $('#answerSummernote').summernote('reset');
      $('#answerSummernote').summernote('code', selectedAnswer.props.l2_content.dbValues[0] + '<br>');
    } else if (qnaData.dataProviders.qaListDataProvider.selectedObjects[0].props.l2_main_category.dbValue != undefined) {
      data.questionTitle.propertyDisplayName = textQuestionTitle;
      data.answerContent.propertyDisplayName = textQuestionContent;
      data.questionTitle.dbValue = selected.props.object_name.dbValue;
      $('#qaEditPopSummernote').summernote('reset');
      $('#qaEditPopSummernote').summernote('code', content + '<br>');
    } else {
      data.questionTitle.propertyDisplayName = textQuestionTitle;
      data.answerContent.propertyDisplayName = textQuestionContent;
      data.questionTitle.dbValue = selected.props.object_name.dbValue;
      $('#qaEditPopSummernote').summernote('reset');
      $('#qaEditPopSummernote').summernote('code', content + '<br>');
    }
  }
  eventBus.publish('tryResizing');
}

export async function loadBeforeAddData(test) {
  let ctx = appCtxSvc.ctx;
  let data = vms.getViewModelUsingElement(document.getElementById('addPop'));
  let qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let homeFolder;
  let checkWareHouse = false;
  //지식창고에서 질문 생성할 경우
  if (qnaData == undefined) {
    qnaData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
    checkWareHouse = true;
  }
  data.window = qnaData.window;
  data.showCategory = qnaData.showCategory;
  if (qnaData.showCategory == 'show' || checkWareHouse == true) {
    let preferTest = await lgepPreferenceUtils.getPreference('L2_DevKnowledge_Interface');
    let homeUID = preferTest.Preferences.prefs[0].values[0].value;

    //테스트 폴더 찾기
    let testFolder;

    //폴더 밑에 대분류 폴더 조회
    let param = {
      uids: [homeUID],
    };
    let policy2 = {
      types: [
        {
          name: 'WorkspaceObject',
          properties: [{ name: 'contents' }, { name: 'object_name' }],
        },
      ],
      useRefCount: false,
    };
    try {
      let serachResult2 = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
      testFolder = serachResult2.modelObjects[homeUID];
    } catch (err) {
      //console.log(err);
      notySvc.showError('객체가 있는 폴더 내용 불러오기 실패');
    }
    let bigFolderList = [];
    // 폴더 밑에 대분류 폴더 목록 조회 예) DFZ , CFZ ...
    for (let i in testFolder.props.contents.uiValues) {
      bigFolderList[testFolder.props.contents.uiValues[i]] = testFolder.props.contents.dbValues[i];
    }
    // 대분류 폴더 목록에 그룹명 확인
    let folderUID = bigFolderList[ctx.userSession.props.group_name.dbValue];
    let searchFolders = [];
    if (!folderUID) {
      //그룹명에 해당하는 폴더가 없을 때
      searchFolders = Object.values(bigFolderList);
    } else {
      searchFolders = [folderUID];
    }
    param = {
      uids: searchFolders,
    };
    try {
      let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
      let searchUIDS = serachResult.plain;
      if (searchUIDS.length > 1) {
        homeFolder = [];
        for (let uid of searchUIDS) {
          homeFolder.push(serachResult.modelObjects[uid]);
        }
      } else {
        homeFolder = serachResult.modelObjects[searchUIDS[0]];
      }
    } catch (err) {
      //console.log(err);
      notySvc.showError('대분류 리스트 불러오기 실패');
    }
    let treeArray = {};
    let midFolderuids = [];
    // if (homeFolder.length > 1) {    //해당 폴더가 없을 시 전체 폴더 조회
    //     for (let folder of homeFolder) {
    //         for (let i in folder.props.contents.uiValues) {
    //             midFolderuids.push(folder.props.contents.dbValues[i]);
    //         }
    //     }
    //     param = {
    //         uids: midFolderuids
    //     }
    //     let midFolders = [];
    //     try {
    //         let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
    //         for (let uid of midFolderuids) {
    //             if (serachResult.modelObjects[uid])
    //                 midFolders.push(serachResult.modelObjects[uid]);
    //         }
    //     } catch (err) {
    //         //console.log(err);
    //     }
    //     let littleUids = [];
    //     for (let folder of midFolders) {    // 중분류 하부에 있는 아이템들 집어 넣기
    //         if (folder.type.includes("Folder")) {
    //             if (!treeArray[folder.props.object_name.dbValues[0]]) {
    //                 treeArray[folder.props.object_name.dbValues[0]] = folder.props.contents.dbValues
    //             } else {
    //                 if (Array.isArray(treeArray[folder.props.object_name.dbValues[0]])) {
    //                     for (let name of folder.props.contents.dbValues) {
    //                         treeArray[folder.props.object_name.dbValues[0]].push(name);
    //                     }
    //                 }
    //             }
    //             if (folder.props.contents.dbValues.length > 0) {
    //                 for (let uid of folder.props.contents.dbValues) {
    //                     littleUids.push(uid);
    //                 }
    //             }
    //         }
    //     }
    //     param = {
    //         uids: littleUids
    //     }
    //     let smallItems = {};
    //     let smallFolders = {};
    //     try {
    //         let serachResult = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", param, policy2);
    //         for (let lttileUid of littleUids) {
    //             if (serachResult.modelObjects[lttileUid].type.includes("Folder")) {
    //                 smallFolders[lttileUid] = serachResult.modelObjects[lttileUid];
    //             } else {
    //                 smallItems[lttileUid] = (serachResult.modelObjects[lttileUid]);
    //             }
    //         }
    //     } catch (err) {
    //         //console.log(err);
    //     }
    //     let countNum = {};
    //     let vals = Object.keys(treeArray);
    //     for (let key of vals) {
    //         countNum[key] = {};
    //         let names = [];
    //         let folderCount = 0;
    //         let itemCount = 0;
    //         if (treeArray[key].length > 0) {
    //             for (let val of treeArray[key]) {
    //                 if (smallFolders[val]) {
    //                     names.push(smallFolders[val].props.object_name.dbValues[0]);
    //                     countNum[key][smallFolders[val].props.object_name.dbValues[0]] = [];
    //                     folderCount++;
    //                 } else {
    //                     countNum[key]["item"] = itemCount;
    //                     itemCount++;
    //                 }
    //             }
    //         }
    //         let set = new Set(names);
    //         let uniqueName = [...set];
    //         treeArray[key] = uniqueName;
    //     }
    // } else {
    // 대분류 폴더 밑에 중분류 폴더 목록 조회 예) Base, Tub, Gasket 기타 등등
    for (let i in homeFolder.props.contents.uiValues) {
      midFolderuids.push(homeFolder.props.contents.dbValues[i]);
    }
    param = {
      uids: midFolderuids,
    };
    let midFolders = [];
    try {
      let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
      for (let uid of midFolderuids) {
        if (serachResult.modelObjects[uid]) midFolders.push(serachResult.modelObjects[uid]);
      }
    } catch (err) {
      //console.log(err);
      notySvc.showError('중분류 리스트 불러오기 실패');
    }
    let littleUids = [];
    for (let folder of midFolders) {
      // 중분류 하부에 있는 아이템들 집어 넣기
      if (folder.type.includes('Folder')) {
        if (!treeArray[folder.props.object_name.dbValues[0]]) {
          treeArray[folder.props.object_name.dbValues[0]] = folder.props.contents.uiValues;
        } else {
          if (Array.isArray(treeArray[folder.props.object_name.dbValues[0]])) {
            for (let name of folder.props.contents.uiValues) {
              treeArray[folder.props.object_name.dbValues[0]].push(name);
            }
          }
        }
      }
    }
    let vals = Object.keys(treeArray);
    for (let key of vals) {
      treeArray[key].sort();
    }
    // }
    const ordered = {};
    Object.keys(treeArray)
      .sort()
      .forEach(function (key) {
        ordered[key] = treeArray[key];
      });
    let keys = Object.keys(ordered);
    // let keys = Object.keys(treeArray);
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
    data.treeArray = treeArray;
    let userData = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], ['*']);
    if (userData.length < 2 && userData.length > 0) {
      userData = [userData];
    }
    await com.getProperties(userData, [
      'l2_is_expert',
      'l2_answer_count',
      'l2_point',
      'l2_knowledge_count',
      'l2_user_name',
      'l2_user_id',
      'l2_selected_knowledge_count',
      'l2_good_count',
      'l2_expert_coverages',
    ]);
    _.forEach(userData, function (data) {
      if (data.props.l2_is_expert.uiValues[0] == 'False') {
        data.props.l2_is_expert.uiValues[0] = 'X';
      } else if (data.props.l2_is_expert.uiValues[0] == 'True') {
        data.props.l2_is_expert.uiValues[0] = 'O';
      }
    });
    data.userData = userData;
    userList = userData;
    data.showCategory = 'show';
    if (qnaData.eventMap) {
      for (let list of data.listPartValues.dbValue) {
        if (qnaData.eventMap['partTree.treeNodeSelected']) {
          if (
            qnaData.eventMap['partTree.treeNodeSelected'].node.children &&
            list.propDisplayValue == qnaData.eventMap['partTree.treeNodeSelected'].node.label
          ) {
            data.listPart.uiValue = list.propDisplayValue;
            data.listPart.dbValue = list.propInternalValue;
          } else if (list.propDisplayValue == qnaData.eventMap['partTree.treeNodeSelected'].node.parent) {
            data.listPart.uiValue = list.propDisplayValue;
            data.listPart.dbValue = list.propInternalValue;
          }
        } else if (qnaData.eventMap['panelSearch']) {
          if (qnaData.eventMap['panelSearch'].parent && list.propDisplayValue == qnaData.eventMap['panelSearch'].parent) {
            data.listPart.uiValue = list.propDisplayValue;
            data.listPart.dbValue = list.propInternalValue;
          } else if (list.propDisplayValue == qnaData.eventMap['panelSearch'].target) {
            data.listPart.uiValue = list.propDisplayValue;
            data.listPart.dbValue = list.propInternalValue;
          }
        }
      }
    }
    if (data.listPart.dbValue == '') {
      data.checkExpertQ.dbValue = true;
    }
  }
  data.showCategory = qnaData.showCategory;
}

export function loadBeforeAnswerData(ctx) {
  let data = vms.getViewModelUsingElement(document.getElementById('answerPop'));
  let qnaDatas = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let selected = qnaDatas.dataProviders.qaListDataProvider.selectedObjects[0];
  data.window = qnaDatas.window;
  $('#answerContentSummernote').summernote('reset');
  $('#answerContentSummernote').summernote('code', selected.props.l2_content.dbValues[0] + '<br>');
  eventBus.publish('popupResizeTest');
}

//faq 추가
export async function addFaq(data, ctx) {
  let title = data.questionTitle.dbValue;
  let content = $('#qaEditPopSummernote').summernote('code');
  if (content == null || content == '' || content == '<p><br></p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else if (!title || title == '') {
    notySvc.showError('제목을 입력해주세요.');
    return;
  } else {
    // 중복 생성 방지
    let addBtn = document.querySelector('#addQuestion');
    addBtn.disabled = true;

    let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
    try {
      let param = {
        properties: [
          {
            name: title,
            type: 'L2_FAQ',
          },
        ],
      };

      createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
    } catch (err) {
      //console.log(err);
      notySvc.showError(characterLimitMsg);
      return;
    }

    try {
      // 아이템 리비전 정의
      createItemRevision = createResult.output[0].itemRev;
      await com.getProperties([createItemRevision], ['item_id']);
      let onlyString = '';

      try {
        await lgepSummerNoteUtils.txtFileToDataset2(content, createItemRevision);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(content);
      } catch (err) {
        notySvc.showError('FAQ 내용 추출 실패');
        delItem(createResult.output[0].item);
      }

      // 아이템 리비전 속성값 넣기
      let param = {
        objects: [createItemRevision],
        attributes: {
          l2_content_string: {
            stringVec: [onlyString],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Create FAQ', createItemRevision.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
        notySvc.showError('FAQ 내용 저장 실패');
        delItem(createResult.output[0].item);
      }

      eventBus.publish('awPopup.close');
      eventBus.publish('qaList.plTable.reload');
      history.pushState(null, null, '#/faq?question=' + createItemRevision.uid);
      notySvc.showInfo(createComplete);
      htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(createItemRevision);
    } catch (err) {
      // 잘못 만들어진 아이템 삭제
      notySvc.showError('FAQ 생성 실패');
      delItem(createResult.output[0].item);
    }
  }
}

export async function editFaq(data, ctx) {
  const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
  let content = $('#qaEditPopSummernote').summernote('code');
  if (content == null || content == '' || content == '<p><br></p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else if (!data.questionTitle.dbValue || data.questionTitle.dbValue == '') {
    notySvc.showError('제목을 입력해주세요.');
    return;
  } else {
    let onlyString = '';

    try {
      await lgepSummerNoteUtils.txtFileToDataset2(content, selected);
      onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(content);
    } catch (err) {
      notySvc.showError('FAQ 수정 내용 추출 실패');
    }
    try {
      let param = {
        objects: [selected],
        attributes: {
          object_name: {
            stringVec: [data.questionTitle.dbValue],
          },
          l2_content_string: {
            stringVec: [onlyString],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
      await common.userLogsInsert('Update FAQ', selected.uid, 'S', 'Success');
      eventBus.publish('awPopup.close');
      notySvc.showInfo(editComplete);
      try {
        eventBus.publish('qaListDataProvider.selectionChangeEvent');
      } catch (err) {
        //console.log(err);
      }
    } catch (err) {
      //console.log(err);
      notySvc.showError(characterLimitMsg);
    }
  }
}

//전문가에게 물어봐요 입력
export async function createAskExpert(data, ctx) {
  var summerContent = $('#qaAddPopSummernote').summernote('code') === null ? '' : $('#qaAddPopSummernote').summernote('code');
  let title = data.questionTitle.dbValue;

  if (summerContent == null || summerContent == '' || summerContent == '<p><br></p>') {
    notySvc.showError(noEmptyContents);
    return;
  } else if (!title || title == '') {
    notySvc.showError('제목을 입력해주세요.');
    return;
  } else {
    let htmlData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
    let qnaPoint = data.questionPoint.dbValue;
    qnaPoint = parseInt(qnaPoint);
    maxPoint = parseInt(maxPoint);
    if (qnaPoint > maxPoint) {
      message.show(1, tooManyPoint, [buttonClose], [function () {}]);
      return;
    }
    if (qnaPoint < 0) {
      message.show(1, setRightPoint, [buttonClose], [function () {}]);
      return;
    }

    // 중복 생성 방지
    let addBtn = document.querySelector('#addQuestion');
    addBtn.disabled = true;

    // QnA 지식유형의 아이템 생성
    try {
      let owningUser = ctx.user.props.object_string.uiValue;
      let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [owningUser]);
      let param;
      if (searchingUser === null) {
        var regExp = /\(([^)]+)\)/;
        var matches = regExp.exec(owningUser);

        searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], [matches[1]]);
      }

      searchingUser = searchingUser[0];
      if (data.listIssue.uiValue == null) {
        data.listIssue.uiValue = '';
      }
      try {
        param = {
          properties: [
            {
              name: title,
              type: 'L2_QuestionExp',
            },
          ],
        };
        createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);
      } catch (err) {
        notySvc.showError(characterLimitMsg);
        return;
      }

      try {
        // 아이템 리비전 정의
        createItemRevision = createResult.output[0].itemRev;
        await com.getProperties([createItemRevision], ['item_id']);
        let returnValue;
        let onlyString = '';
        try {
          returnValue = await lgepSummerNoteUtils.txtFileToDataset2(summerContent, createItemRevision);
          onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
        } catch (err) {
          // console.log(err);
          notySvc.showError('텍스트 추출 실패');
          delItem(createResult.output[0].item);
        }
        // 아이템 리비전 속성값 넣기
        param = {
          objects: [createItemRevision],
          attributes: {
            l2_content_string: {
              stringVec: [onlyString],
            },
          },
        };
        if (data.checkExpertQ.dbValue == true) {
          param.attributes['l2_main_category'] = { stringVec: [data.listPart.uiValue] };
          param.attributes['l2_subcategory'] = { stringVec: [data.listIssue.uiValue] };
          param.attributes['l2_experts'] = { stringVec: [data.listExpert.dbValue] };
        }
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Create Expert Question', createItemRevision.uid, 'S', 'Success');

        let target = com.getObject(data.listExpert.dbValue);
        if (target) {
          message.sendAlarmMessage(
            '[' + title + '] 질문의 전문가로 지목되었습니다.',
            '전문가 지목',
            createItemRevision.uid,
            target.props.owning_user.dbValues[0],
          );
        }

        //이욱채가 추가 한 기능
        await com.getProperties([searchingUser], ['l2_knowledge_count']);
        let userknowledgeCount = searchingUser.props.l2_knowledge_count.dbValues[0];
        userknowledgeCount = parseInt(userknowledgeCount);
        userknowledgeCount++;
        userknowledgeCount = String(userknowledgeCount);
        param = {
          objects: [searchingUser],
          attributes: {
            l2_knowledge_count: {
              stringVec: [userknowledgeCount],
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        //이욱채가 추가 한 기능
        qnaPoint = String(qnaPoint);
        param = {
          objects: [createItemRevision],
          attributes: {
            l2_point: {
              stringVec: [qnaPoint],
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        eventBus.publish('awPopup.close');
        if (!window.location.href.includes('knowledgeWarehouse')) {
          eventBus.publish('qaList.plTable.reload');
          history.pushState(null, null, '#/askExpert?question=' + createItemRevision.uid);
          htmlData.dataProviders.qaListDataProvider.selectionModel.setSelection(createItemRevision);
        }

        notySvc.showInfo(createComplete);
        return {
          createItemRevision: createItemRevision,
        };
      } catch (err) {
        // 잘못 만들어진 아이템 삭제
        notySvc.showError('질문 생성 실패');
        delItem(createResult.output[0].item);
      }
    } catch (err) {
      notySvc.showWarning(String(err));
      delItem(createResult.output[0].item);
    }
  }
}
//전문가에게 물어봐요 편집
export async function editExpert(data, ctx) {
  const qnaData = vms.getViewModelUsingElement(document.getElementById('qnaDatas'));
  let selected = qnaData.dataProviders.qaListDataProvider.selectedObjects[0];
  if (qnaData.dataProviders.qaAnswerList.selectedObjects[0]) {
    if (
      $('#answerSummernote').summernote('code') == null ||
      $('#answerSummernote').summernote('code') == '' ||
      $('#answerSummernote').summernote('code') == '<p><br></p>' ||
      $('#answerSummernote').summernote('code') == '<br>'
    ) {
      notySvc.showError(noEmptyContents);
      return;
    } else {
      let answer = $('#answerSummernote').summernote('code');
      let selectedA = qnaData.dataProviders.qaAnswerList.selectedObjects[0];
      let returnValue;
      let onlyString = '';
      try {
        returnValue = await lgepSummerNoteUtils.base64ToFileToDataset(answer, selectedA);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(answer);
      } catch (err) {
        //console.log(err)
        notySvc.showError('질문 내용 가져오기 실패');
      }
      if (returnValue) {
        answer = returnValue.resultTag;
      }
      // 아이템 리비전 속성값 넣기
      let param = {
        objects: [selectedA],
        attributes: {
          l2_content: {
            stringVec: [answer],
          },
          l2_content_string: {
            stringVec: [onlyString],
          },
        },
      };
      try {
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Update Expert Answer', selectedA.uid, 'S', 'Success');
      } catch (err) {
        //console.log(err);
        notySvc.showError('질문 내용 수정 실패');
      }
      eventBus.publish('awPopup.close');
      notySvc.showInfo(editComplete);
      try {
        eventBus.publish('qaListDataProvider.selectionChangeEvent');
      } catch (err) {
        //console.log(err);
      }
    }
  } else {
    var summerContent = $('#qaEditPopSummernote').summernote('code');
    if (summerContent == null || summerContent == '' || summerContent == '<p><br></p>') {
      notySvc.showError(noEmptyContents);
      return;
    } else if (!data.questionTitle.dbValue || data.questionTitle.dbValue == '') {
      notySvc.showError('제목을 입력해주세요.');
      return;
    } else {
      let returnValue;
      let onlyString = '';
      try {
        returnValue = await lgepSummerNoteUtils.txtFileToDataset2(summerContent, selected);
        onlyString = await lgepSummerNoteUtils.imgAndsvgOnlyString(summerContent);
      } catch (err) {
        // console.log(err);
        notySvc.showError('텍스트 추출 실패');
      }
      try {
        let param = {
          objects: [selected],
          attributes: {
            object_name: {
              stringVec: [data.questionTitle.dbValue],
            },
            l2_content_string: {
              stringVec: [onlyString],
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
        await common.userLogsInsert('Update Expert Question', selected.uid, 'S', 'Success');
        eventBus.publish('awPopup.close');
        notySvc.showInfo(editComplete);
        try {
          eventBus.publish('qaListDataProvider.selectionChangeEvent');
        } catch (err) {
          //console.log(err);
        }
      } catch (err) {
        //console.log(err);
        notySvc.showError(characterLimitMsg);
      }
    }
  }
}

export function initializeAdd() {
  $('#qaAddPopSummernote').summernote({
    width: '100%',
    height: 450,
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
  $('#qaAddPopSummernote').summernote('enable');
}

export function initializeEdit() {
  $('#qaEditPopSummernote').summernote({
    width: '100%',
    height: 450,
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
  $('#qaEditPopSummernote').summernote('enable');
}

export function initializeEditAnswer() {
  $('#qaFaqAnswerSummernote').summernote({
    width: '100%',
    height: 450,
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
  $('#qaFaqAnswerSummernote').summernote('enable');
  $('#qaEditQuestionSummernote').summernote({
    width: '100%',
    height: 450,
    toolbar: [],
  });
  $('#qaEditQuestionSummernote').summernote('disable');
}

export function initializeAddAnswer() {
  $('#answerContentSummernote').summernote({
    width: '100%',
    height: 450,
    toolbar: [],
  });
  $('#answerContentSummernote').summernote('disable');
}

export function changeExpert(data) {
  let expertList = [];
  for (let user of userList) {
    if (user.props.l2_is_expert.uiValues[0] == 'O') {
      let data = {
        propDisplayValue: user.props.l2_user_name.dbValues[0],
        propInternalValue: user.uid,
      };
      expertList.push(data);
    }
  }
  if (expertList.length > 0) {
    document.querySelector('.expert').setAttribute('id', '');
  } else {
    document.querySelector('.expert').setAttribute('id', 'issueDisalbe');
    data.listExpert.uiValue = '';
    data.listExpert.dbValue = '';
  }
  data.listExpertValues.dbValue = expertList;
}

export function checkExpert(data) {
  let expertList = [];
  for (let user of userList) {
    if (user.props.l2_expert_coverages.uiValues[0] == null) {
      user.props.l2_expert_coverages.uiValues[0] = '';
    }
    if (
      user.props.l2_is_expert.uiValues[0] == 'O' &&
      (user.props.l2_expert_coverages.uiValues[0].includes(data.listPart.uiValue) || user.props.l2_expert_coverages.uiValues[0].includes('*'))
    ) {
      let data = {
        propDisplayValue: user.props.object_name.dbValues[0],
        propInternalValue: user.uid,
      };
      expertList.push(data);
    }
  }
  if (expertList.length > 0 && data.checkExpertQ.dbValue == true) {
    document.querySelector('.expert').setAttribute('id', '');
  } else if (data.checkExpertQ.dbValue == false) {
    document.querySelector('.expert').setAttribute('id', 'issueDisalbe');
    expertList = [
      {
        propDisplayValue: '',
        propInternalValue: '',
      },
    ];
    data.listExpert.uiValue = '';
    data.listExpert.dbValue = '';
  }
  data.listExpertValues.dbValue = expertList;
}

export function popViewResizing(data) {
  let test = document.getElementsByClassName('aw-layout-panelContent');
  let test1;
  if (data.window == 'askExpert') {
    // 전문가질문에서 열 때
    test1 = test[0];
  } else if (data.showCategory || data.window == 'faqAdd') {
    //지식창고에서 열 떄
    test1 = test[1];
  } else {
    //  공통모듈에서 열 때
    test1 = test[0];
  }
  // 화면 크기 계산을 위한 split
  let width = test1.style.width.split('px');
  let height = test1.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  if (width > window.innerWidth && height > window.innerHeight) {
    test1.style.width = window.innerWidth * 0.8 + 'px';
    test1.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width > window.innerWidth) {
    test1.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height > window.innerHeight) {
    test1.style.height = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 900 && window.innerWidth >= 1300) {
    test1.style.width = '1300px';
    test1.style.height = '900px';
  } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
    test1.style.width = window.innerWidth * 0.8 + 'px';
    test1.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width < window.innerWidth * 0.8) {
    test1.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height < window.innerHeight * 0.8) {
    test1.style.height = window.innerHeight * 0.8 + 'px';
  }
}
let checkAttr;
export function checkURL() {
  let data = vms.getViewModelUsingElement(document.getElementById('addPop'));
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
    data.attrs = checkAttr;
    for (let list of data.listPartValues.dbValue) {
      if (list.propDisplayValue == attrs.parent) {
        data.listPart.uiValue = attrs.parent;
        data.listPart.dbValue = list.propInternalValue;
      }
    }
  }
}

export async function delItem(item) {
  try {
    let deleteObj = {
      objects: [item],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteObj);

    let addBtn = document.querySelector('#addQuestion');
    addBtn.disabled = false;
    return;
  } catch (err) {
    console.log('잘못된 아이템 삭제 실패');
  }
}

let exports = {};

export default exports = {
  createQnaQuestion,
  editQna,
  loadBeforeData,
  addFaq,
  editFaq,
  loadBeforeAddData,
  createAskExpert,
  editExpert,
  loadBeforeAnswerData,
  createQnaAnswer,
  getPoint,
  initializeAdd,
  initializeEdit,
  initializeEditAnswer,
  initializeAddAnswer,
  changeExpert,
  checkExpert,
  popViewResizing,
  checkURL,
};
app.factory('popUpsService', () => exports);
