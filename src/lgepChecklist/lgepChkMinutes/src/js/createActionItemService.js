import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import com from 'js/utils/lgepObjectUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import msg from 'js/utils/lgepMessagingUtils';
import common from 'js/utils/lgepCommonUtils';
import vmos from 'js/viewModelObjectService';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import * as fs from 'fs';
import query from 'js/utils/lgepQueryUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import _ from 'lodash';

var $ = require('jQuery');
let searchingUser;

const close = locale.getLocalizedText('lgepChkMinutesMessages', 'close');
const editedMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'editedMinutes');
const afterSelectingTheFailure = locale.getLocalizedText('lgepChkMinutesMessages', 'afterSelectingTheFailure');
const cancelEdit = locale.getLocalizedText('lgepChkMinutesMessages', 'cancelEdit');
const deleteMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'deleteMinutes');
const deleteItem = locale.getLocalizedText('lgepChkMinutesMessages', 'delete');
const cancel = locale.getLocalizedText('lgepChkMinutesMessages', 'cancel');
const deletedMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'deletedMinutes');
const pleaseSelectMinutesForModify = locale.getLocalizedText('lgepChkMinutesMessages', 'pleaseSelectMinutesForModify');
const noFailure = locale.getLocalizedText('lgepChkMinutesMessages', 'noFailure');
const failureList = locale.getLocalizedText('lgepChkMinutesMessages', 'failureList');
const createdItemMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'createdItem');
const enterCommentMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'enterCommentMsg');
const enterWorkerMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'enterWorkerMsg');
const createdActionItemMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'createdActionItem');
const deletedActionItem = locale.getLocalizedText('lgepChkMinutesMessages', 'deletedActionItem');

export async function createActionItem(ctx, data) {
  let actionItemComment = $('#commentSummernote').summernote('code');
  let setPropComment = $('#commentSummernote').summernote('code');
  let actionItemFollowUp = $('#followUpSummernote').summernote('code');
  let setPropFollowUp = $('#followUpSummernote').summernote('code');
  let actionItemRemark = $('#remarkSummernote').summernote('code');
  let setPropRemark = $('#remarkSummernote').summernote('code');
  setPropComment = setPropComment.replace(/<[^>]*>?/g, '');
  setPropFollowUp = setPropFollowUp.replace(/<[^>]*>?/g, '');
  setPropRemark = setPropRemark.replace(/<[^>]*>?/g, '');
  let actionWorker;
  let actionDate = `${data.l2_expected_date.dateApi.dateValue}`;

  for (let user of searchingUser) {
    if (data.l2_worker.dbValue == user.props.owning_user.dbValues[0]) {
      actionWorker = user;
    }
  }

  actionDate = L2_StandardBOMService.dateTo_GMTString(actionDate);
  let selectedMinutes = ctx.selectedminutes;
  let selectedMinutesItem = await com.loadObjects([selectedMinutes.props.items_tag.dbValue]);
  selectedMinutesItem = selectedMinutesItem.modelObjects[selectedMinutesItem.plain[0]];
  console.log(selectedMinutesItem);

  if (actionItemComment == null || actionItemComment == '<p><br></p>') {
    msg.show(1, enterCommentMsg);
  } else if (actionWorker == undefined || actionWorker == null || actionWorker == '') {
    msg.show(1, enterWorkerMsg);
  } else {
    let createActionItem = await com.createItem('', 'L2_ActionItem', setPropComment, '', '');
    let createdActionItem = createActionItem.output[0].item;

    await com.getProperties(createdActionItem, [
      'IMAN_reference',
      'object_string',
      'contents',
      'object_name',
      'object_desc',
      'l2_number',
      'l2_expected_date',
      'l2_comment',
      'l2_follow_up',
      'l2_worker',
      'l2_finish_date',
      'l2_state',
    ]);

    let ActionItemParam = {
      objects: [createdActionItem],
      attributes: {
        l2_comment: {
          stringVec: [setPropComment],
        },
        l2_follow_up: {
          stringVec: [setPropFollowUp],
        },
        l2_expected_date: {
          stringVec: [actionDate],
        },
        object_desc: {
          stringVec: [setPropRemark],
        },
        l2_worker: {
          stringVec: [actionWorker.uid],
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', ActionItemParam);

    let text = {};
    text.comment = actionItemComment;
    text.followUp = actionItemFollowUp;
    text.remark = actionItemRemark;
    console.log(text);

    let setText = JSON.stringify(text);
    console.log(setText);

    lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, createActionItem.output[0].itemRev);

    let createActionUID = createActionItem.output[0].itemRev.uid;
    let actionArr = [];
    if (selectedMinutesItem.props.L2_ActionItemRelation.dbValues.length == 0) {
      let actionItemRelationParam = {
        objects: [selectedMinutesItem],
        attributes: {
          L2_ActionItemRelation: {
            stringVec: [createActionUID],
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);
    } else {
      for (let i = 0; i < selectedMinutesItem.props.L2_ActionItemRelation.dbValues.length; i++) {
        actionArr.push(selectedMinutesItem.props.L2_ActionItemRelation.dbValues[i]);
      }
      actionArr.push(createActionUID);

      let actionItemRelationParam = {
        objects: [selectedMinutesItem],
        attributes: {
          L2_ActionItemRelation: {
            stringVec: actionArr,
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);
    }

    msg.show(0, createdActionItemMsg);
    appCtxService.registerCtx('show_minutes_mode', 1);
  }
}

export function deleteActionItem(ctx, data) {
  let selectActionItemRev = ctx.selectActionItemRev;
  let selectMinutesRev = data.dataProviders.minutesListProvider.selectedObjects[0];
  let minutesHaveActionItemUID = selectMinutesRev.props.L2_ActionItemRelation.dbValue.dbValues;
  msg.show(
    1,
    deleteMinutes,
    [deleteItem, cancel],
    async function () {
      let revUID = selectActionItemRev.cellHeader2;
      let setParentsApi = {
        infos: [
          {
            itemId: revUID,
          },
        ],
      };
      let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
      let revParent = revItemParant.output[0].item;
      let selectMinutesItem = await com.getObject([selectMinutesRev.props.items_tag.dbValue]);

      try {
        await com.getProperties(revParent, ['L2_ActionItemRelation']);
        await com.getProperties(selectActionItemRev, ['IMAN_specification']);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }

      let dataset = await com.getObject(selectActionItemRev.props.IMAN_specification.dbValues[0]);

      let param = {
        input: [
          {
            clientId: '',
            relationType: 'IMAN_specification',
            primaryObject: selectActionItemRev,
            secondaryObject: dataset,
          },
        ],
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
      } catch (err) {
        //console.log(err)
      }

      let filteredActionItemArr = minutesHaveActionItemUID.filter((element) => element !== selectActionItemRev.uid);

      let actionItemRelationParam = {
        objects: [selectMinutesItem[0]],
        attributes: {
          L2_ActionItemRelation: {
            stringVec: filteredActionItemArr,
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);

      console.log(selectMinutesRev);
      let deleteOjt = {
        objects: [revParent],
      };
      let deleteDatasetOjt = {
        objects: [dataset],
      };

      await com.deleteObject(deleteDatasetOjt.objects[0]);
      await com.deleteObject(deleteOjt.objects[0]);

      ctx.selectActionItemRev = null;
      msg.show(0, deletedActionItem);
    },
    function () {},
  );
}

export function backPage(data) {
  appCtxService.registerCtx('show_minutes_mode', 1);
}

export async function createActionItemInitialize(data) {
  await common.delay(200);
  let date = new Date();
  let years = date.getFullYear();
  let month = date.getMonth() + 1;
  let days = date.getDate();
  let initTime = '08:00:00';
  if (days < 10) {
    data.l2_expected_date.dateApi.dateValue = `${years}-${month}-0${days}`;
  } else {
    data.l2_expected_date.dateApi.dateValue = `${years}-${month}-${days}`;
  }
  data.l2_expected_date.dateApi.timeValue = initTime;
}

export async function createInitialize(ctx, data) {
  await common.delay(200);

  $('#commentSummernote').summernote({
    height: 200,
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
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#commentSummernote').summernote('enable');
  $('#commentSummernote').css('background-color', 'white');

  $('#followUpSummernote').summernote({
    height: 200,
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
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#followUpSummernote').summernote('enable');
  $('#followUpSummernote').css('background-color', 'white');

  $('#remarkSummernote').summernote({
    height: 200,
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
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#remarkSummernote').summernote('enable');
  $('#remarkSummernote').css('background-color', 'white');

  let owningUser = ctx.user.props.user_name.dbValue + ' (' + ctx.user.props.userid.dbValue + ')';
  let policyArr = policy.getEffectivePolicy();
  policyArr.types.push({
    name: 'L2_User',
    properties: [
      {
        name: 'l2_divisions',
      },
    ],
  });
  searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], ['*'], policyArr);
  console.log(searchingUser);

  for (let user of searchingUser) {
    data.l2_workerValues.dbValue.push({
      propDisplayValue: user.props.l2_user_id.dbValues[0],
      propInternalValue: user.props.owning_user.dbValues[0],
    });
  }
}

let exports = {};

export default exports = {
  backPage,
  createActionItem,
  createActionItemInitialize,
  createInitialize,
  deleteActionItem,
};

app.factory('createActionItemService', () => exports);
