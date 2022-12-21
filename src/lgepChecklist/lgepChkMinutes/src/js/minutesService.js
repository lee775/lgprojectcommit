import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import com from 'js/utils/lgepObjectUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import msg from 'js/utils/lgepMessagingUtils';
import common from 'js/utils/lgepCommonUtils';
import vms from 'js/viewModelObjectService';
import vmSer from 'js/viewModelService';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import browserUtils from 'js/browserUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import query from 'js/utils/lgepQueryUtils';
import _ from 'lodash';
import checklist from 'js/utils/checklistUtils';
import { failureLoad2 } from 'js/showAllMinutesService';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import AwPromiseService from 'js/awPromiseService';
import AwHttpService from 'js/awHttpService';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

var $ = require('jQuery');
let datasetUid = null;
ctx.panelOn = false;
let lastModifiedArr = [];
let modifyFileArr = [];
let originFileArr = [];
let newFileArr = [];

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
const notFailureMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'notFailureMsg');
const proceed = locale.getLocalizedText('lgepChkMinutesMessages', 'proceed');
const deselectFailureMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'deselectFailureMsg');
const enterTitleMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'enterTitleMsg');
const pleaseSelectActionItemForModify = locale.getLocalizedText('lgepChkMinutesMessages', 'pleaseSelectActionItemForModify');
const selectMinutesToFailure = locale.getLocalizedText('lgepChkMinutesMessages', 'selectMinutesToFailure');

export function changePanelStatus(ctx) {
  if (!ctx.panelOn) {
    ctx.panelOn = true;
  } else {
    ctx.panelOn = false;
  }

  for (let row of appCtxService.ctx.checklist.grid.getData()) {
    appCtxService.ctx.checklist.grid.removeRowClassName(row.rowKey, 'select');
  }
}

export async function openMinutes() {
  let ctx = appCtxService.ctx;
  if (!ctx.panelOn) {
    ctx.panelOn = true;
  }

  ctx.show_minutes_mode = 1;

  const popupData = {
    id: 'checklist_minutes',
    includeView: 'minutesShowMode',
    closeWhenCommandHidden: false,
    keepOthersOpen: true,
    commandId: 'checklist_minutes',
    config: {
      width: 'WIDE',
    },
    outputData: {
      popupId: 'mainMinutes',
    },
  };
  eventBus.publish('awsidenav.openClose', popupData);
}

export async function panelReload() {
  let ctx = appCtxService.ctx;
  const selectRow = appCtxService.ctx.checklist.selectedRow;
  let popupData;
  if (ctx.panelOn) {
    popupData = {
      id: 'checklist_minutes',
      includeView: 'minutesShowMode',
      closeWhenCommandHidden: true,
      keepOthersOpen: true,
      commandId: 'checklist_minutes',
      config: {
        width: 'WIDE',
      },
      outputData: {
        popupId: 'mainMinutes',
      },
    };
    eventBus.publish('awsidenav.openClose', popupData);
    let times = 0;
    while (document.getElementsByName('minutesShowMode').length > 0 && times <= 20) {
      await lgepCommonUtils.delay(100);
      times++;
    }
    openMinutes();
  } else {
    return;
  }
}

export function cancelActionItemEdit(ctx, data) {
  if (data.actionItemEditMode) {
    data.actionItemEditMode = false;
  } else {
    data.actionItemEditMode = true;
  }

  data.l2_workerValues.dbValue = [];

  let commentDetail = ctx.selectActionItemRev.props.l2_comment.uiValue;
  $('#commentDetailsSummernote').summernote('reset');
  $('#commentDetailsSummernote').summernote('code', commentDetail);
  $('#commentDetailsSummernote').summernote('disable');

  let followUpDetail = ctx.selectActionItemRev.props.l2_follow_up.uiValue;
  $('#followUpDetailsSummernote').summernote('reset');
  $('#followUpDetailsSummernote').summernote('code', followUpDetail);
  $('#followUpDetailsSummernote').summernote('disable');
}

export function backMinutes(ctx) {
  appCtxService.registerCtx('show_minutes_mode', 1);
}

export function openCreateMinutes() {
  if (!appCtxService.ctx.checklist.selectedRow) {
    msg.show(
      1,
      notFailureMsg,
      [proceed, cancel],
      async function () {
        appCtxService.registerCtx('show_minutes_mode', 2);
      },
      function () {},
    );
  } else {
    appCtxService.registerCtx('show_minutes_mode', 2);
  }
}

export function openCreateMinutesInShowAllMinutes() {
  appCtxService.registerCtx('show_minutes_mode', 4);
}

export function openCreateActionItem() {
  appCtxService.registerCtx('show_minutes_mode', 5);
}

export async function loadMinutes(data) {
  let minutesRelationArr = [];
  if (!appCtxService.ctx.checklist.selectedRow) {
    appCtxService.registerCtx('checked_all_revision', false);
    let test = vmSer.getViewModelUsingElement(document.getElementById('mainModeNav'));
    test.viewName = 'all';

    let selectOrigin = appCtxService.ctx.checklist.target;
    data.allRevisionsMinutes.dbValue = appCtxService.ctx.checked_all_revision;

    try {
      await com.getProperties(selectOrigin, ['L2_MinutesRelation']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    let arr = [];
    let arr2 = [];

    // 모든 리비전의 회의록을 아이템으로 변환하여 담아줌.
    let a = 0;
    for (let rev of com.getObject(selectOrigin.props.L2_MinutesRelation.dbValues)) {
      let item = com.getObject(rev.props.items_tag.dbValues[0]);

      try {
        await com.getProperties(item, [
          'IMAN_reference',
          'creation_date',
          'l2_meeting_date',
          'l2_meeting_place',
          'l2_meeting_participants',
          'l2_meeting_details',
          'l2_meeting_agenda',
          'l2_meeting_related_schedule',
          'l2_related_failure',
          'L2_ActionItemRelation',
        ]);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }

      arr.push(rev);
      // const property = makeVmProperty("checklist_rev_id", itemsRevList[i][0]);
      arr[a].props.checklist_rev_id = appCtxService.ctx.checklist.target.props.item_revision_id.uiValues[0];
      arr[a].props.l2_meeting_date = item.props.l2_meeting_date.uiValues[0];
      arr[a].props.l2_meeting_place = item.props.l2_meeting_place.dbValues[0];
      arr[a].props.l2_meeting_participants = item.props.l2_meeting_participants.dbValues[0];
      arr[a].props.l2_meeting_details = item.props.l2_meeting_details.dbValues[0];
      arr[a].props.l2_meeting_agenda = item.props.l2_meeting_agenda.dbValues[0];
      arr[a].props.l2_meeting_related_schedule = item.props.l2_meeting_related_schedule.dbValues[0];
      arr[a].props.l2_related_failure = item.props.l2_related_failure.dbValues;
      arr[a].props.item_IMAN_reference = item.props.IMAN_reference;
      arr[a].props.L2_ActionItemRelation = item.props.L2_ActionItemRelation;

      a++;
    }

    try {
      await com.getProperties(arr, ['creation_date']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    for (let i = 0; i < arr.length; i++) {
      arr2.push(vms.constructViewModelObjectFromModelObject(arr[i]));

      arr2[i].props['checklist_rev_id'] = makeVmProperty('checklist_rev_id', arr[i].props.checklist_rev_id);
      arr2[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', arr[i].props.l2_meeting_date);
      arr2[i].props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', arr[i].props.l2_meeting_place);
      arr2[i].props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', arr[i].props.l2_meeting_participants);
      arr2[i].props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', arr[i].props.l2_meeting_details);
      arr2[i].props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', arr[i].props.l2_meeting_agenda);
      arr2[i].props['l2_meeting_related_schedule'] = makeVmProperty('l2_meeting_related_schedule', arr[i].props.l2_meeting_related_schedule);
      arr2[i].props['l2_related_failure'] = makeVmProperty('l2_related_failure', arr[i].props.l2_related_failure);
      arr2[i].props['item_IMAN_reference'] = makeVmProperty('item_IMAN_reference', arr[i].props.item_IMAN_reference);
      arr2[i].props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', arr[i].props.L2_ActionItemRelation);

      minutesRelationArr.push(arr2[i]);
    }

    minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);

    let firstItem = data.dataProviders.minutesListProvider.viewModelCollection.loadedVMObjects[0];
    data.dataProviders.minutesListProvider.selectionModel.setSelection(firstItem);
  } else {
    let test = vmSer.getViewModelUsingElement(document.getElementById('mainModeNav'));
    test.viewName = 'selected';

    let topObjRev = appCtxService.ctx.checklist.target;
    console.log('topObjRev', topObjRev);

    try {
      await com.getProperties(topObjRev, ['L2_MinutesRelation']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    ctx.tabKey;
    let selectOrigin = appCtxService.ctx.checklist.selectedRow.getOriginalObject();
    let selectUID = [selectOrigin.uid];
    let selectLoadObj = await com.loadObjects(selectUID);
    let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

    try {
      await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    let uidLength = selectLoadObjRev.props.L2_MinutesRelation.dbValues.length;
    let minutesRevRelationArr = [];
    let arr = [];
    let arr2 = [];
    for (let i = 0; i < topObjRev.props.L2_MinutesRelation.dbValues.length; i++) {
      for (let j = 0; j < uidLength; j++) {
        if (topObjRev.props.L2_MinutesRelation.dbValues[i] == selectLoadObjRev.props.L2_MinutesRelation.dbValues[j]) {
          arr.push(com.getObject(selectLoadObjRev.props.L2_MinutesRelation.dbValues[j]));
        }
      }
    }
    await com.getProperties(arr, ['creation_date', 'items_tag']);

    let i = 0;
    for (let rev of arr) {
      let item = com.getObject(rev.props.items_tag.dbValues[0]);
      await com.getProperties(item, [
        'l2_meeting_date',
        'item_revision',
        'creation_date',
        'l2_meeting_place',
        'l2_meeting_participants',
        'l2_meeting_details',
        'l2_meeting_agenda',
        'l2_meeting_related_schedule',
        'IMAN_reference',
        'L2_ActionItemRelation',
      ]);
      arr2.push(vms.constructViewModelObjectFromModelObject(rev));
      arr2[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', item.props.l2_meeting_date.uiValues[0]);
      arr2[i].props['checklist_rev_id'] = makeVmProperty('checklist_rev_id', topObjRev.props.item_revision_id.uiValues[0]);
      arr2[i].props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', item.props.L2_ActionItemRelation);
      minutesRelationArr.push(arr2[i]);
      i++;
    }

    minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);

    let firstItem = data.dataProviders.minutesListProvider.viewModelCollection.loadedVMObjects[0];
    data.dataProviders.minutesListProvider.selectionModel.setSelection(firstItem);

    await common.userLogsInsert('Load Dashboard', '', 'S', 'Success');
  }
  return {
    minutes: minutesRelationArr,
    minutesLength: minutesRelationArr.length,
  };
}

export async function showAllRevisionsMinutes(ctx, data) {
  let selectOrigin = appCtxService.ctx.checklist.target;
  if (data.allRevisionsMinutes.dbValue) {
    console.log('모든 리비전 보여줘');
    appCtxService.registerCtx('checked_all_revision', true);

    let allUidList = [];
    let itemsRevList = [];
    let items = [];

    // 최상위 구조의 리비전 리스트를 담아줌.
    items.push(com.getObject(selectOrigin.props.revision_list.dbValues));

    console.log('items', items);
    // 최상위 구조의 모든 리비전의 회의록과 리비전 ID를 불러옴.
    try {
      await com.getProperties(items[0], ['L2_MinutesRelation', 'item_revision_id']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    // 최상위 구조의 모든 리비전의 회의록과 리비전 ID를 담아줌.
    for (let item of items[0]) {
      allUidList.push(item.props.L2_MinutesRelation.dbValues);
      itemsRevList.push(item.props.item_revision_id.dbValues);
    }

    let minutesRelationArr = [];
    let arr = [];
    let arr2 = [];

    // 모든 리비전의 회의록을 아이템으로 변환하여 한 배열에 체크리스트의 리비전 아이디와 함께 담아줌.
    let a = 0;
    for (let i = 0; i < allUidList.length; i++) {
      if (allUidList[i].length > 0) {
        for (let rev of com.getObject(allUidList[i])) {
          let item = com.getObject(rev.props.items_tag.dbValues[0]);

          try {
            await com.getProperties(item, [
              'IMAN_reference',
              'creation_date',
              'l2_meeting_date',
              'l2_meeting_place',
              'l2_meeting_participants',
              'l2_meeting_details',
              'l2_meeting_agenda',
              'l2_meeting_related_schedule',
              'l2_related_failure',
            ]);
          } catch (err) {
            //console.log(err);
            notySvc.showError('아이템 속성 불러오기 실패');
          }

          arr.push(rev);
          // const property = makeVmProperty("checklist_rev_id", itemsRevList[i][0]);
          arr[a].props.checklist_rev_id = itemsRevList[i][0];
          arr[a].props.l2_meeting_date = item.props.l2_meeting_date.uiValues[0];
          arr[a].props.l2_meeting_place = item.props.l2_meeting_place.dbValues[0];
          arr[a].props.l2_meeting_participants = item.props.l2_meeting_participants.dbValues[0];
          arr[a].props.l2_meeting_details = item.props.l2_meeting_details.dbValues[0];
          arr[a].props.l2_meeting_agenda = item.props.l2_meeting_agenda.dbValues[0];
          arr[a].props.l2_meeting_related_schedule = item.props.l2_meeting_related_schedule.dbValues[0];
          arr[a].props.l2_related_failure = item.props.l2_related_failure.dbValues;
          arr[a].props.item_IMAN_reference = item.props.IMAN_reference;

          a++;
        }
      }
    }

    console.log('회의록 객체', arr);

    try {
      await com.getProperties(arr, ['creation_date']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    for (let i = 0; i < arr.length; i++) {
      // arr[0][i].props.checklist_rev_id.dbValue = "A";
      arr2.push(vms.constructViewModelObjectFromModelObject(arr[i]));

      arr2[i].props['checklist_rev_id'] = makeVmProperty('checklist_rev_id', arr[i].props.checklist_rev_id);
      arr2[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', arr[i].props.l2_meeting_date);
      arr2[i].props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', arr[i].props.l2_meeting_place);
      arr2[i].props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', arr[i].props.l2_meeting_participants);
      arr2[i].props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', arr[i].props.l2_meeting_details);
      arr2[i].props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', arr[i].props.l2_meeting_agenda);
      arr2[i].props['l2_meeting_related_schedule'] = makeVmProperty('l2_meeting_related_schedule', arr[i].props.l2_meeting_related_schedule);
      arr2[i].props['l2_related_failure'] = makeVmProperty('l2_related_failure', arr[i].props.l2_related_failure);
      arr2[i].props['item_IMAN_reference'] = makeVmProperty('item_IMAN_reference', arr[i].props.item_IMAN_reference);

      minutesRelationArr.push(arr2[i]);
    }
    minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);
  } else {
    console.log('현재것만 보여줘');
    appCtxService.registerCtx('checked_all_revision', false);

    console.log(selectOrigin);

    let minutesRelationArr = [];
    let arr = [];
    let arr2 = [];

    // 모든 리비전의 회의록을 아이템으로 변환하여 담아줌.
    let a = 0;
    for (let rev of com.getObject(selectOrigin.props.L2_MinutesRelation.dbValues)) {
      let item = com.getObject(rev.props.items_tag.dbValues[0]);

      try {
        await com.getProperties(item, [
          'IMAN_reference',
          'creation_date',
          'l2_meeting_date',
          'l2_meeting_place',
          'l2_meeting_participants',
          'l2_meeting_details',
          'l2_meeting_agenda',
          'l2_meeting_related_schedule',
          'l2_related_failure',
        ]);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }

      arr.push(rev);
      // const property = makeVmProperty("checklist_rev_id", itemsRevList[i][0]);
      arr[a].props.checklist_rev_id = appCtxService.ctx.checklist.target.props.item_revision_id.uiValues[0];
      arr[a].props.l2_meeting_date = item.props.l2_meeting_date.uiValues[0];
      arr[a].props.l2_meeting_place = item.props.l2_meeting_place.dbValues[0];
      arr[a].props.l2_meeting_participants = item.props.l2_meeting_participants.dbValues[0];
      arr[a].props.l2_meeting_details = item.props.l2_meeting_details.dbValues[0];
      arr[a].props.l2_meeting_agenda = item.props.l2_meeting_agenda.dbValues[0];
      arr[a].props.l2_meeting_related_schedule = item.props.l2_meeting_related_schedule.dbValues[0];
      arr[a].props.l2_related_failure = item.props.l2_related_failure.dbValues;
      arr[a].props.item_IMAN_reference = item.props.IMAN_reference;

      a++;
    }

    try {
      await com.getProperties(arr, ['creation_date']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }

    for (let i = 0; i < arr.length; i++) {
      arr2.push(vms.constructViewModelObjectFromModelObject(arr[i]));

      arr2[i].props['checklist_rev_id'] = makeVmProperty('checklist_rev_id', arr[i].props.checklist_rev_id);
      arr2[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', arr[i].props.l2_meeting_date);
      arr2[i].props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', arr[i].props.l2_meeting_place);
      arr2[i].props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', arr[i].props.l2_meeting_participants);
      arr2[i].props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', arr[i].props.l2_meeting_details);
      arr2[i].props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', arr[i].props.l2_meeting_agenda);
      arr2[i].props['l2_meeting_related_schedule'] = makeVmProperty('l2_meeting_related_schedule', arr[i].props.l2_meeting_related_schedule);
      arr2[i].props['l2_related_failure'] = makeVmProperty('l2_related_failure', arr[i].props.l2_related_failure);
      arr2[i].props['item_IMAN_reference'] = makeVmProperty('item_IMAN_reference', arr[i].props.item_IMAN_reference);

      minutesRelationArr.push(arr2[i]);
    }

    // console.log("minutesRelationArr", minutesRelationArr);
    minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

    data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);

    // await common.userLogsInsert("Load Dashboard", "", "S", "Success");
  }
}

export async function loadActionItem(data) {
  await common.delay(200);
  ctx.selectActionItemRev = null;

  if (data.dataProviders.minutesListProvider.selectedObjects[0]) {
    // 회의록 불러오기
    let parentUID = [data.dataProviders.minutesListProvider.selectedObjects[0].props.items_tag.dbValue];
    let parentsObj = await com.loadObjects(parentUID);
    parentsObj = parentsObj.modelObjects[parentsObj.plain[0]];
    await com.getProperties(parentsObj, ['L2_ActionItemRelation']);

    // 액션 아이템 불러오기

    let haveActionItemRevUID = parentsObj.props.L2_ActionItemRelation.dbValues;
    let haveActionItemRevObj = await com.getObject(haveActionItemRevUID);
    let haveActionItemUID = [];
    for (let i = 0; i < haveActionItemRevObj.length; i++) {
      haveActionItemUID.push(haveActionItemRevObj[i].props.items_tag.dbValues);
    }
    let haveActionItemObj = await com.getObject(haveActionItemUID);
    let arr2 = [];
    let actionItemArr = [];
    await com.getProperties(haveActionItemObj, [
      'creation_date',
      'l2_number',
      'l2_comment',
      'l2_follow_up',
      'l2_worker',
      'l2_expected_date',
      'l2_finish_date',
      'l2_state',
    ]);

    for (let i = 0; i < haveActionItemRevObj.length; i++) {
      arr2.push(vms.constructViewModelObjectFromModelObject(haveActionItemRevObj[i]));
      arr2[i].props['creation_date'] = makeVmProperty('creation_date', haveActionItemObj[i].props.creation_date.dbValues[0]);
      arr2[i].props['l2_number'] = makeVmProperty('l2_number', haveActionItemObj[i].props.l2_number.uiValues[0]);
      arr2[i].props['l2_comment'] = makeVmProperty('l2_comment', haveActionItemObj[i].props.l2_comment.uiValues[0]);
      arr2[i].props['l2_follow_up'] = makeVmProperty('l2_follow_up', haveActionItemObj[i].props.l2_follow_up.uiValues[0]);
      arr2[i].props['l2_worker'] = makeVmProperty('l2_worker', haveActionItemObj[i].props.l2_worker.uiValues[0]);
      arr2[i].props['l2_expected_date'] = makeVmProperty('l2_expected_date', haveActionItemObj[i].props.l2_expected_date.uiValues[0]);
      arr2[i].props['l2_finish_date'] = makeVmProperty('l2_finish_date', haveActionItemObj[i].props.l2_finish_date.uiValues[0]);
      arr2[i].props['l2_state'] = makeVmProperty('l2_state', haveActionItemObj[i].props.l2_state.uiValues[0]);
      actionItemArr.push(arr2[i]);
    }
    let actionTable = vmSer.getViewModelUsingElement(document.getElementById('actionItemTable'));
    actionItemArr.sort((a, b) => new Date(b.props.creation_date.dbValue) - new Date(a.props.creation_date.dbValue));
    actionTable.dataProviders.actionItemTableProvider.viewModelCollection.setViewModelObjects(actionItemArr);
    let actionTableView = document.getElementById('actionItemTable');
    if (actionTableView.children[1].children[0].children[0].children.length != 0) {
      let selectRow = actionTableView.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children;
      let rowLength = actionTableView.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children.length;
      let selectRowIcon = actionTableView.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children;
      for (let i = 0; i < rowLength; i++) {
        selectRow[i].style.backgroundColor = 'rgb(255, 255, 255)';
        selectRowIcon[i].style.backgroundColor = 'rgb(255, 255, 255)';
      }
    }

    $('#commentDetailsSummernote').summernote({
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
    $('#commentDetailsSummernote').summernote('disable');
    $('#commentDetailsSummernote').css('background-color', 'white');

    $('#followUpDetailsSummernote').summernote({
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
    $('#followUpDetailsSummernote').summernote('disable');
    $('#followUpDetailsSummernote').css('background-color', 'white');

    return {
      actionItem: actionItemArr,
      actionItemLength: actionItemArr.length,
    };
  }
}

export async function failureLoad(ctx, data) {
  for (let row of appCtxService.ctx.checklist.grid.getData()) {
    appCtxService.ctx.checklist.grid.removeRowClassName(row.rowKey, 'select');
  }

  data.editMode = false;
  let tabDetails = data.tabDetails;
  ctx.tabKey;
  _.forEach(tabDetails, function (v) {
    if (v.selectedTab) {
      if (v.name == failureList) {
        if (v.pageId == 1) {
          ctx.tabKey = 1;
        } else {
          ctx.tabKey = 0;
        }
      } else {
        ctx.tabKey = 0;
      }
    }
  });

  let minutesTable = vmSer.getViewModelUsingElement(document.getElementById('minutesTable'));
  if (!minutesTable) {
    failureLoad2(ctx, data);
  } else {
    if (minutesTable.dataProviders.minutesListProvider.selectedObjects.length == 1) {
      if (ctx.tabKey == 1) {
        let revUID = minutesTable.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
        let setParentsApi = {
          infos: [
            {
              itemId: revUID,
            },
          ],
        };
        let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);

        let selectMinutes = revItemParant.output[0].item;
        await com.getProperties(selectMinutes, [
          'l2_related_failure',
          'creation_date',
          'l2_meeting_date',
          'l2_meeting_place',
          'l2_meeting_participants',
          'l2_meeting_details',
          'l2_meeting_agenda',
          'l2_meeting_related_schedule',
        ]);
        let failureUIDArr = selectMinutes.props.l2_related_failure.dbValues;
        let failureArr = [];
        let failureVMOArr = [];
        failureArr.push(com.getObject(failureUIDArr));
        if (failureUIDArr.length != 0) {
          await com.getProperties(failureArr[0], [
            'L2_MinutesRelation',
            'awp0CellProperties',
            'awp0ConfiguredRevision',
            'awp0ThumbnailImageTicket',
            'checked_out_date',
            'checked_out_user',
            'fnd0InProcess',
            'fnd0MyWorkflowTasks',
            'is_modifiable',
            'is_vi',
            'items_tag',
            'object_desc',
            'object_name',
            'object_string',
            'owning_project',
            'owning_user',
            'release_status_list',
          ]);
          for (let i = 0; i < failureArr[0].length; i++) {
            if (failureArr[0][i]) {
              let vmo = vms.constructViewModelObjectFromModelObject(failureArr[0][i]);
              let failureName = vmo.props.object_string.dbValue.replaceAll('\n', ' ');
              vmo.cellHeader1 = failureName;
              failureVMOArr.push(vmo);
            }
          }
          let failureData = ctx.checklist.grid.store.data.rawData;
          let failureDataArr = [];

          for (let fail of failureData) {
            failureDataArr.push(fail.getOriginalObject());
          }
          for (let i = 0; i < failureVMOArr.length; i++) {
            for (let j = 0; j < failureDataArr.length; j++) {
              if (failureVMOArr[i].uid == failureDataArr[j].uid) {
                let effect = failureData[j].failureEffect;
                let detail = failureData[j].failureDetail;
                if (effect) {
                  effect = effect.replace(/<[^>]*>?/g, ' ');
                }
                if (detail) {
                  detail = detail.replace(/<[^>]*>?/g, ' ');
                } else {
                  detail = '-';
                }
                failureVMOArr[i].cellHeader2 = effect;
                failureVMOArr[i].cellProperties.리비전 = {
                  key: '메커니즘',
                  value: detail,
                };
              }
            }
          }
          minutesTable.dataProviders.failureList.viewModelCollection.setViewModelObjects(failureVMOArr);
        } else {
          minutesTable.dataProviders.failureList.viewModelCollection.clear();
          // msg.show(1, noFailure, [close], [
          //   function () { }
          // ]);
        }
      }
    } else {
      minutesTable.dataProviders.failureList.viewModelCollection.clear();
    }
  }
}

function sortAction(response, startIndex, pageSize) {
  let countries = response.minutes;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;

    let minutesResults = countries.slice(startIndex, endIndex);

    return minutesResults;
  }
}

function sortActionItem(response, startIndex, pageSize) {
  let countries = response.actionItem;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;

    let actionItemResults = countries.slice(startIndex, endIndex);

    return actionItemResults;
  }
}

export async function loadMinutesDetails(ctx, data) {
  let tableMinutesRev = data.dataProviders.minutesListProvider.selectedObjects[0];
  ctx.selectedminutes = tableMinutesRev;
  try {
    await com.getProperties(tableMinutesRev, ['TC_Attaches']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }
  if (data.dataProviders.minutesListProvider.selectedObjects.length != 0) {
    let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
    let setParentsApi = {
      infos: [
        {
          itemId: revUID,
        },
      ],
    };
    let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
    //console.log(revItemParant.output[0].item);

    let preRevItem = revItemParant.output[0].item;

    await com.getProperties(preRevItem, [
      'TC_Attaches',
      'object_string',
      'object_name',
      'owning_user',
      'l2_meeting_agenda',
      'l2_meeting_date',
      'l2_meeting_details',
      'l2_meeting_participants',
      'l2_meeting_place',
      'l2_meeting_title',
      'l2_meeting_related_schedule',
      'l2_minutes_writer',
      'l2_related_failure',
    ]);

    await com.getProperties(tableMinutesRev, ['IMAN_specification', 'TC_Attaches']);

    let titleData = preRevItem.props.object_name.uiValues[0];
    let dateData = preRevItem.props.l2_meeting_date.dbValues[0];
    let placeData = preRevItem.props.l2_meeting_place.uiValues[0];
    let writerData = preRevItem.props.owning_user.uiValues[0];
    let participants = preRevItem.props.l2_meeting_participants.uiValues[0];
    let agendaData = preRevItem.props.l2_meeting_agenda.uiValues[0];
    let scheduleData = preRevItem.props.l2_meeting_related_schedule.uiValues[0];
    let fileValue = tableMinutesRev.props.TC_Attaches;

    dateData = dateData.split('T');
    let dateData1 = dateData[0];
    let dateData2 = dateData[1].split('+');
    let dateDataTime = dateData2[0].split(':');
    let dateDataT = dateDataTime[0] + ':' + dateDataTime[1];
    dateData = dateData1 + ' ' + dateDataT;

    let datesetUID = tableMinutesRev.props.IMAN_specification.dbValue[0];
    let text = await checklist.readPropertiesFromTextFile(datesetUID);
    console.log(text);

    data.object_nameLbl.uiValue = titleData;
    data.l2_meeting_dateLbl.uiValue = dateData;
    data.l2_meeting_placeLbl.uiValue = placeData;
    data.proceedWriterLink.uiValue = writerData;
    data.l2_meeting_participantsLbl.uiValue = participants;
    data.l2_meeting_agendaLbl.uiValue = agendaData;
    data.l2_meeting_related_scheduleLbl.uiValue = scheduleData;

    let datasetLinkArr = [];

    if (fileValue.uiValues.length != 0) {
      for (let i = 0; i < fileValue.uiValues.length; i++) {
        datasetLinkArr.push(fileValue.uiValues[i]);
      }

      let referenceUID = data.dataProviders.minutesListProvider.selectedObjects[0].props.TC_Attaches.dbValues;
      data.datasetLink.dbValue = [];
      for (let i = 0; i < fileValue.uiValues.length; i++) {
        data.datasetLink.dbValue.push({
          displayName: datasetLinkArr[i],
          isRequired: 'false',
          uiValue: datasetLinkArr[i],
          isNull: 'false',
          uid: referenceUID[i],
        });
      }
    }

    $('#minutesMainSummernote').summernote('reset');
    $('#minutesMainSummernote').summernote('code', text.detail + '<br>');
  }
}

export async function initialize() {
  await common.delay(200);

  $('#minutesMainSummernote').summernote({
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
  $('#minutesMainSummernote').summernote('disable');
  $('#minutesMainSummernote').css('background-color', 'white');
}

export async function createMinutesInitialize() {
  await common.delay(200);

  $('#createMinutesSummernote').summernote({
    height: 'auto',
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
  $('#createMinutesSummernote').summernote('enable');
  $('#createMinutesSummernote').css('background-color', 'white');
}

export async function createInitialize() {
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
}

export async function saveActionItem(ctx, data) {
  if (data.actionItemEditMode) {
    data.actionItemEditMode = false;
  } else {
    data.actionItemEditMode = true;
  }

  let workerData = data.l2_worker.dbValue;
  let lblWorkerData = data.l2_worker.uiValue;
  let DateData = data.l2_expected_date.dateApi.dateValue;
  DateData = L2_StandardBOMService.dateTo_GMTString(DateData);
  let lblDate = DateData.split('T');
  lblDate = lblDate[0];
  let modifyComment = $('#commentDetailsSummernote').summernote('code');
  let modifyFollowUp = $('#followUpDetailsSummernote').summernote('code');

  let setPropComment = $('#commentDetailsSummernote').summernote('code');
  let setPropFollowUp = $('#followUpDetailsSummernote').summernote('code');
  setPropComment = setPropComment.replace(/<[^>]*>?/g, '');
  setPropFollowUp = setPropFollowUp.replace(/<[^>]*>?/g, '');

  let datesetUID = ctx.selectActionItemRev.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);
  console.log(text);

  text.comment = modifyComment;
  text.followUp = modifyFollowUp;
  console.log(text);

  let setText = JSON.stringify(text);
  console.log(setText);

  await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, ctx.selectActionItemRev);

  let actionItemRevID = ctx.selectActionItemRev.cellHeader2;

  let setParentsApi = {
    infos: [
      {
        itemId: actionItemRevID,
      },
    ],
  };
  let actionItemObj = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
  let actionItem = actionItemObj.output[0].item;

  let actionItemParam = {
    objects: [actionItem],
    attributes: {
      l2_worker: {
        stringVec: [workerData],
      },
      l2_expected_date: {
        stringVec: [DateData],
      },
      l2_comment: {
        stringVec: [setPropComment],
      },
      l2_follow_up: {
        stringVec: [setPropFollowUp],
      },
    },
  };

  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemParam);

  data.l2_workerLbl.uiValue = lblWorkerData;
  data.l2_expected_dateLbl.uiValue = lblDate;

  $('#commentDetailsSummernote').summernote('reset');
  $('#commentDetailsSummernote').summernote('code', modifyComment);
  $('#commentDetailsSummernote').summernote('disable');

  $('#followUpDetailsSummernote').summernote('reset');
  $('#followUpDetailsSummernote').summernote('code', modifyFollowUp);
  $('#followUpDetailsSummernote').summernote('disable');

  loadActionItem(data);

  data.l2_workerValues.dbValue = [];
}

export async function saveMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
  let setParentsApi = {
    infos: [
      {
        itemId: revUID,
      },
    ],
  };
  let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
  let preRevItem = revItemParant.output[0].item;

  await com.getProperties(preRevItem, [
    'object_string',
    'object_name',
    'l2_meeting_agenda',
    'l2_meeting_date',
    'l2_meeting_details',
    'l2_meeting_participants',
    'l2_meeting_place',
    'l2_meeting_title',
    'l2_meeting_related_schedule',
    'l2_minutes_writer',
  ]);

  let titleData = data.object_name.dbValue;
  let placeData = data.l2_meeting_place.dbValue;
  let participants = data.l2_meeting_participants.dbValue;
  let dateValue = data.l2_meeting_date.dateApi.dateValue;
  let timeValue = data.l2_meeting_date.dateApi.timeValue;
  let dateData = `${dateValue}T${timeValue}+0900`;
  let agendaData = data.l2_meeting_agenda.dbValue;
  let scheduleData = data.l2_meeting_related_schedule.dbValue;
  let modifyDetails = $('#minutesMainSummernote').summernote('code');
  let detailsData = data.proceedDetails.uiValue + '<br>';
  let clearIMAN = [];

  let minutesParam = {
    objects: [preRevItem],
    attributes: {
      object_name: {
        stringVec: [titleData],
      },
      l2_meeting_agenda: {
        stringVec: [agendaData],
      },
      l2_meeting_date: {
        stringVec: [dateData],
      },
      l2_meeting_participants: {
        stringVec: [participants],
      },
      l2_meeting_details: {
        stringVec: [modifyDetails],
      },
      l2_meeting_place: {
        stringVec: [placeData],
      },
      l2_meeting_related_schedule: {
        stringVec: [scheduleData],
      },
    },
  };

  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);

  let selectedTableMinutes = data.dataProviders.minutesListProvider.selectedObjects[0];
  try {
    await com.getProperties(selectedTableMinutes, ['IMAN_reference', 'TC_Attaches']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }

  const preview = document.querySelector('#preview');
  let datasetRelationArr = [];
  for (let data of preview.children) {
    let StringDataID = String(data.id);
    datasetRelationArr.push(StringDataID);
  }
  let difference = datasetRelationArr.filter((x) => !lastModifiedArr.includes(x));
  let resultFileArr = [];
  for (let file of difference) {
    resultFileArr.push(com.getObject(file));
  }
  for (let file of modifyFileArr) {
    resultFileArr.push(file);
  }
  console.log(resultFileArr);

  let newFileUIDArr = [];

  for (let i of resultFileArr) {
    newFileUIDArr.push(i.uid);
  }
  let deleteSameUID = originFileArr.filter((x) => !newFileUIDArr.includes(x));

  let originFile = await com.getObject(deleteSameUID);

  for (let i = 0; i < deleteSameUID.length; i++) {
    let param = {
      input: [
        {
          clientId: '',
          relationType: 'TC_Attaches',
          primaryObject: selectedTableMinutes,
          secondaryObject: originFile[i],
        },
      ],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
    } catch (err) {
      //console.log(err)
    }
  }

  let fileDataset = await lgepSummerNoteUtils.uploadFileToDataset(newFileArr);
  if (Array.isArray(fileDataset)) {
    for (let i = 0; i < fileDataset.length; i++) {
      var jsoObj = {
        input: [
          {
            clientId: '',
            relationType: 'TC_Attaches',
            primaryObject: selectedTableMinutes,
            secondaryObject: fileDataset[i],
          },
        ],
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
      } catch (err) {
        //console.log(err);
      }
    }
  } else {
    var jsoObj = {
      input: [
        {
          clientId: '',
          relationType: 'TC_Attaches',
          primaryObject: selectedTableMinutes,
          secondaryObject: fileDataset,
        },
      ],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
    } catch (err) {
      //console.log(err);
    }
  }
  newFileArr = [];

  if (deleteSameUID.length != 0) {
    let deleteDatasetOjt = {
      objects: com.getObject(deleteSameUID),
    };

    for (let i = 0; i < deleteSameUID.length; i++) {
      await com.deleteObject(deleteDatasetOjt.objects[i]);
    }
  }

  let datasetLinkArr = [];
  let datasetLinkUIDArr = [];

  for (let i = 0; i < resultFileArr.length; i++) {
    datasetLinkArr.push(resultFileArr[i].props.object_name.dbValues[0]);
    datasetLinkUIDArr.push(resultFileArr[i].uid);
  }

  data.datasetLink.dbValue = [];
  for (let i = 0; i < resultFileArr.length; i++) {
    data.datasetLink.dbValue.push({
      displayName: datasetLinkArr[i],
      isRequired: 'false',
      uiValue: datasetLinkArr[i],
      isNull: 'false',
      uid: datasetLinkUIDArr[i],
    });
  }
  originFileArr = [];
  lastModifiedArr = [];

  data.object_nameLbl.uiValue = titleData;
  data.l2_meeting_placeLbl.uiValue = placeData;
  data.l2_meeting_participantsLbl.uiValue = participants;
  data.l2_meeting_agendaLbl.uiValue = agendaData;
  data.l2_meeting_related_scheduleLbl.uiValue = scheduleData;
  $('#minutesMainSummernote').summernote('reset');
  $('#minutesMainSummernote').summernote('code', modifyDetails);
  await common.delay(100);
  $('#minutesMainSummernote').summernote('disable');

  msg.show(0, `${data.object_name.dbValue} ${editedMinutes}`);
}

export async function createMinutesInShowAllMinutes(ctx, data) {
  console.log('회의록 생성');

  if (appCtxService.ctx.checklist.selectedRow) {
    msg.show(1, deselectFailureMsg);
  } else {
    let topObjRev = ctx.checklist.target;

    try {
      await com.getProperties(topObjRev, ['L2_MinutesRelation']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }
    console.log('AfterLoadOBJ', { topObjRev });

    let minutesName = data.object_name.uiValue;
    let minutesDate = data.l2_meeting_date.uiValue;
    let minutesPlace = data.l2_meeting_place.uiValue;
    let minutesParticipants = data.l2_meeting_participants.uiValue;
    let minutesSubjects = data.l2_meeting_agenda.uiValue;
    let minutesDetail = data.l2_meeting_details.uiValue;
    let minutesSchedule = data.l2_meeting_related_schedule.uiValue;

    minutesDate = L2_StandardBOMService.dateTo_GMTString(minutesDate);

    try {
      if (minutesName == null || minutesName == undefined || minutesName == '') {
        msg.show(1, enterTitleMsg);
        return;
      } else {
        let createMinutesItem = await com.createItem('', 'L2_Minutes', minutesName, minutesSchedule, '');
        let createdItem = createMinutesItem.output[0].item;

        // let topFolder = await com.getObject(homeFolder.props.contents.dbValues);
        await com.getProperties(createdItem, [
          'object_string',
          'contents',
          'object_name',
          'l2_meeting_agenda',
          'l2_meeting_date',
          'l2_meeting_details',
          'l2_meeting_participants',
          'l2_meeting_place',
          'l2_meeting_title',
          'l2_meeting_related_schedule',
          'l2_minutes_writer',
          'IMAN_reference',
        ]);

        let minutesItemParam = {
          objects: [createdItem],
          attributes: {
            object_name: {
              stringVec: [minutesName],
            },
            object_desc: {
              stringVec: [minutesSubjects],
            },
            l2_meeting_agenda: {
              stringVec: [minutesSubjects],
            },
            l2_meeting_date: {
              stringVec: [minutesDate],
            },
            l2_meeting_details: {
              stringVec: [minutesDetail],
            },
            l2_meeting_participants: {
              stringVec: [minutesParticipants],
            },
            l2_meeting_place: {
              stringVec: [minutesPlace],
            },
            l2_meeting_related_schedule: {
              stringVec: [minutesSchedule],
            },
          },
        };

        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesItemParam);

        let createUID = createMinutesItem.output[0].itemRev.uid;
        let allbeforeUID = topObjRev.props.L2_MinutesRelation.dbValues;
        let allMinutesArr = [];

        if (allbeforeUID.length != 0) {
          allMinutesArr.push(allbeforeUID);
          allMinutesArr.push(createUID);
          allMinutesArr = allMinutesArr.filter((element, index) => {
            return allMinutesArr.indexOf(element) === index;
          });
        } else {
          allMinutesArr.push(createUID);
        }

        allMinutesArr = allMinutesArr.flat();

        let allMinutesRelationParam = {
          objects: [topObjRev],
          attributes: {
            L2_MinutesRelation: {
              stringVec: allMinutesArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', allMinutesRelationParam);
        var jsoObj = {
          input: [
            {
              clientId: '',
              relationType: 'IMAN_reference',
              primaryObject: createdItem,
              secondaryObject: com.getObject(datasetUid),
            },
          ],
        };
        try {
          let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
        } catch (err) {
          //console.log(err);
        }
        datasetUid = null;
        msg.show(0, `${minutesName} ${notFailureMsg}`, [close], [function () {}]);
      }
      appCtxService.registerCtx('show_minutes_mode', 0);
    } catch (err) {
      console.log(err);
    }
  }
}

export async function actionItemEditMode(ctx, data) {
  let actionTable = vmSer.getViewModelUsingElement(document.getElementById('actionItemTable'));
  console.log(actionTable);

  if (!ctx.selectActionItemRev || ctx.selectActionItemRev == null) {
    msg.show(0, pleaseSelectActionItemForModify);
  } else {
    if (data.actionItemEditMode) {
      data.actionItemEditMode = false;
    } else {
      data.actionItemEditMode = true;
    }
    console.log(ctx.selectActionItemRev);
    let policyArr = policy.getEffectivePolicy();
    policyArr.types.push({
      name: 'L2_User',
      properties: [
        {
          name: 'l2_divisions',
        },
      ],
    });
    let searchingUser = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], ['*'], policyArr);
    console.log(searchingUser);

    for (let user of searchingUser) {
      data.l2_workerValues.dbValue.push({
        propDisplayValue: user.props.l2_user_id.dbValues[0],
        propInternalValue: user.uid,
      });
    }

    let originUser;

    for (let user of searchingUser) {
      if (ctx.selectActionItemRev.props.l2_worker.dbValue == user.props.object_name.dbValues[0]) {
        originUser = user.props.owning_user.uiValues[0];
      }
    }

    data.l2_worker.dbValue = originUser;
    data.l2_worker.dbValues[0] = originUser;
    data.l2_worker.uiValue = originUser;
    data.l2_worker.uiValues[0] = originUser;
    data.l2_expected_date.dateApi.dateValue = ctx.selectActionItemRev.props.l2_expected_date.dbValue;

    $('#commentDetailsSummernote').summernote('enable');
    $('#followUpDetailsSummernote').summernote('enable');
  }
}

export async function editMinutesMain(ctx, data) {
  eventBus.publish('start.editMode');
  // let fileUploadTag = document.getElementById('fileUpload');
  // fileUploadTag.setAttribute('class', 'aw-file-upload-fileInput ng-valid ng-valid-required ng-touched ng-dirty ng-valid-parse ng-pristine ng-untouched ng-empty');
  let fileInput = document.getElementById('fileUpload');
  let selectedFile = [...fileInput.files];

  // let selectOrigin = appCtxService.ctx.checklist.selectedRow.getOriginalObject();

  if (data.dataProviders.minutesListProvider.selectedObjects.length == 0) {
    msg.show(0, pleaseSelectMinutesForModify);
  } else {
    if (data.editMode) {
      data.editMode = false;
    } else {
      data.editMode = true;
    }
    let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
    let setParentsApi = {
      infos: [
        {
          itemId: revUID,
        },
      ],
    };
    let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
    let preRevItem = revItemParant.output[0].item;

    await com.getProperties(preRevItem, [
      'object_string',
      'object_name',
      'l2_meeting_agenda',
      'l2_meeting_date',
      'l2_meeting_details',
      'l2_meeting_participants',
      'l2_meeting_place',
      'l2_meeting_title',
      'l2_meeting_related_schedule',
      'l2_minutes_writer',
    ]);

    let titleData = preRevItem.props.object_name.uiValues[0];
    let placeData = preRevItem.props.l2_meeting_place.uiValues[0];
    let participants = preRevItem.props.l2_meeting_participants.uiValues[0];
    let minutesDate = preRevItem.props.l2_meeting_date.uiValues[0];
    let fileData = preRevItem.props.IMAN_reference.uiValues[0];
    let agendaData = preRevItem.props.l2_meeting_agenda.uiValues[0];
    let scheduleData = preRevItem.props.l2_meeting_related_schedule.uiValues[0];

    let minutesDateArr = minutesDate.split(' ');
    let minutesDateValue = minutesDateArr[0];
    let minutesTimaValue = minutesDateArr[1];

    if (fileData != undefined || fileData != null) {
      let splitFileName = fileData.split('.');
      data.fileExt = splitFileName[1];
      data.fileNameNoExt = splitFileName[0];
      data.fileName = fileData;
    }

    data.object_name.dbValue = titleData;
    data.l2_meeting_place.dbValue = placeData;
    data.l2_meeting_participants.dbValue = participants;
    data.l2_meeting_agenda.dbValue = agendaData;
    data.l2_meeting_date.dateApi.dateValue = minutesDateValue;
    data.l2_meeting_date.dateApi.timeValue = minutesTimaValue + ':00';
    data.l2_meeting_related_schedule.dbValue = scheduleData;

    $('#minutesMainSummernote').summernote('enable');

    const preview = document.querySelector('#preview');

    let savedFileUID = data.dataProviders.minutesListProvider.selectedObjects[0].props.TC_Attaches.dbValue;
    let savedFileName = data.dataProviders.minutesListProvider.selectedObjects[0].props.TC_Attaches.uiValues;
    for (let i = 0; i < savedFileName.length; i++) {
      originFileArr.push(savedFileUID[i]);
      preview.innerHTML += `
            <p id="${savedFileUID[i]}" class='uploadFileList'>
                ${savedFileName[i]}
                <button data-index='${savedFileUID[i]}' class='file-remove'>X</button>
            </p>`;
    }
  }
}

export function resetDetails(ctx, data) {
  if (data.dataProviders.minutesListProvider.selectedObjects.length == 0) {
    data.object_nameLbl.uiValue = '';
    data.l2_meeting_placeLbl.uiValue = '';
    data.l2_meeting_participantsLbl.uiValue = '';
    data.l2_meeting_agendaLbl.uiValue = '';
    data.l2_meeting_related_scheduleLbl.uiValue = '';
    data.datasetLink.uiValues = '';
    data.datasetLink.propertyDisplayName = '';
    data.datasetLink.dbValues = '';
    data.l2_meeting_dateLbl.uiValue = '';
    data.proceedWriterLink.uiValue = '';
    data.proceedDetails.uiValue = '';
    $('#minutesMainSummernote').summernote('reset');
    $('#minutesMainSummernote').summernote('disable');
  }
}

export async function cancelMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }
  originFileArr = [];
  lastModifiedArr = [];

  let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
  let setParentsApi = {
    infos: [
      {
        itemId: revUID,
      },
    ],
  };
  let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
  let preRevItem = revItemParant.output[0].item;

  await com.getProperties(preRevItem, [
    'object_string',
    'contents',
    'object_name',
    'l2_meeting_agenda',
    'l2_meeting_date',
    'l2_meeting_details',
    'l2_meeting_participants',
    'l2_meeting_place',
    'l2_meeting_title',
    'l2_meeting_related_schedule',
    'l2_minutes_writer',
  ]);

  let detailsData = preRevItem.props.l2_meeting_details.uiValues[0];
  $('#minutesMainSummernote').summernote('reset');
  $('#minutesMainSummernote').summernote('code', detailsData);
  $('#minutesMainSummernote').summernote('disable');
  msg.show(0, cancelEdit);
}

export async function deleteMinutesMain(ctx, data) {
  msg.show(
    1,
    deleteMinutes,
    [deleteItem, cancel],
    async function () {
      let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
      let revObj = data.dataProviders.minutesListProvider.selectedObjects[0];
      let setParentsApi = {
        infos: [
          {
            itemId: revUID,
          },
        ],
      };

      let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
      let revParent = revItemParant.output[0].item;

      // 열려있는 체크리스트에서 최상위 불러오기
      let topObjRev = ctx.checklist.target;
      try {
        await com.getProperties(topObjRev, ['L2_MinutesRelation']);
        await com.getProperties(revParent, ['L2_ActionItemRelation']);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }

      // 선택한 고장 불러오기
      if (ctx.checklist.selectedRow) {
        let selectOrigin = ctx.checklist.selectedRow.getOriginalObject();
        let selectUID = [selectOrigin.uid];
        let selectLoadObj = await com.loadObjects(selectUID);
        let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

        try {
          await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation']);
        } catch (err) {
          //console.log(err);
          notySvc.showError('아이템 속성 불러오기 실패');
        }

        // 선택한 고장과의 릴레이션 제거
        let relationUIDLeng = selectLoadObjRev.props.L2_MinutesRelation.dbValues.length;
        let relationArr = selectLoadObjRev.props.L2_MinutesRelation.dbValues;
        let relationUID = selectLoadObjRev.uid;

        for (let i = relationUIDLeng - 1; i >= 0; i--) {
          if (relationArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].uid) {
            relationArr.splice(i, 1);
          }
        }

        let minutesRelationParam = {
          objects: [selectLoadObjRev],
          attributes: {
            L2_MinutesRelation: {
              stringVec: relationArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesRelationParam);

        let relation = await com.getObject([relationUID]);
        let param = {
          input: [
            {
              clientId: '',
              relationType: 'L2_MinutesRelation',
              primaryObject: relation[0],
              secondaryObject: revParent,
            },
          ],
        };
        try {
          await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
        } catch (err) {
          //console.log(err)
        }
      } else {
        let selectUID = data.dataProviders.minutesListProvider.selectedObjects[0].props.l2_related_failure.dbValue;
        let selectLoadObj = await com.loadObjects(selectUID);
        let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

        try {
          await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation']);
        } catch (err) {
          //console.log(err);
          notySvc.showError('아이템 속성 불러오기 실패');
        }

        // 선택한 고장과의 릴레이션 제거
        let relationUIDLeng = selectLoadObjRev.props.L2_MinutesRelation.dbValues.length;
        let relationArr = selectLoadObjRev.props.L2_MinutesRelation.dbValues;
        let relationUID = selectLoadObjRev.uid;

        for (let i = relationUIDLeng - 1; i >= 0; i--) {
          if (relationArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].uid) {
            relationArr.splice(i, 1);
          }
        }

        let minutesRelationParam = {
          objects: [selectLoadObjRev],
          attributes: {
            L2_MinutesRelation: {
              stringVec: relationArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesRelationParam);

        let relation = await com.getObject([relationUID]);
        let param = {
          input: [
            {
              clientId: '',
              relationType: 'L2_MinutesRelation',
              primaryObject: relation[0],
              secondaryObject: revParent,
            },
          ],
        };
        try {
          await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
        } catch (err) {
          //console.log(err)
        }
      }

      // 현재 열려있는 체크리스트와의 릴레이션 제거
      let relationTopUIDLeng = topObjRev.props.L2_MinutesRelation.dbValues.length;
      let relationTopArr = topObjRev.props.L2_MinutesRelation.dbValues;
      let relationTopUID = topObjRev.uid;
      for (let i = relationTopUIDLeng - 1; i >= 0; i--) {
        if (relationTopArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].uid) {
          relationTopArr.splice(i, 1);
        }
      }

      let topMinutesRelationParam = {
        objects: [topObjRev],
        attributes: {
          L2_MinutesRelation: {
            stringVec: relationTopArr,
          },
        },
      };
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', topMinutesRelationParam);

      let topTargetUID = ctx.checklist.target.uid;
      let topRelation = await com.getObject([topTargetUID]);

      let topParam = {
        input: [
          {
            clientId: '',
            relationType: 'L2_MinutesRelation',
            primaryObject: topRelation[0],
            secondaryObject: com.getObject([revObj.uid]),
          },
        ],
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', topParam);
      } catch (err) {
        //console.log(err)
      }

      // 연결된 액션 아이템 불러오기
      let deleteActionItem = [];
      let actionItemID;
      let revActionItem;
      let actionItemName = revParent.props.L2_ActionItemRelation.uiValues;
      let actionItemRevUID = revParent.props.L2_ActionItemRelation.dbValues;
      for (let i = 0; i < actionItemName.length; i++) {
        actionItemID = actionItemName[i].split('/');
        actionItemID = actionItemID[0];
        let setActionItemApi = {
          infos: [
            {
              itemId: actionItemID,
            },
          ],
        };
        revActionItem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setActionItemApi);
        deleteActionItem.push(revActionItem.output[0].item);
      }
      let actionItemRev = await com.getObject(actionItemRevUID);

      if (actionItemRev.length != 0) {
        for (let i = 0; i < actionItemRev.length; i++) {
          await com.getProperties(actionItemRev[i], ['IMAN_specification']);
        }
        console.log(actionItemRev);
        let textObj;

        for (let i = 0; i < actionItemRev.length; i++) {
          let textObjUID = actionItemRev[i].props.IMAN_specification.dbValues[0];
          textObj = await com.getObject(textObjUID);
          let actionItemParam = {
            input: [
              {
                clientId: '',
                relationType: 'IMAN_specification',
                primaryObject: actionItemRev[i],
                secondaryObject: textObj,
              },
            ],
          };
          try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', actionItemParam);
          } catch (err) {
            //console.log(err)
          }
          // 텍스트 삭제
          let deleteTextOjt = {
            objects: [textObj],
          };
          await com.deleteObject(deleteTextOjt.objects[0]);
        }
      }

      // 연결된 액션아이템과의 릴레이션 제거
      if (revParent.props.L2_ActionItemRelation.dbValues.length != 0) {
        let relationActionItemArr = revParent.props.L2_ActionItemRelation.dbValues;
        let relationActionItemUIDLeng = relationActionItemArr.length;
        for (let j = relationActionItemUIDLeng - 1; j >= 0; j--) {
          if (relationActionItemArr[j] === data.dataProviders.minutesListProvider.selectedObjects[0].props.L2_ActionItemRelation.dbValue.dbValues[j]) {
            relationActionItemArr.splice(j, 1);
          }
        }

        let actionItemRelationParam = {
          objects: [revParent],
          attributes: {
            L2_ActionItemRelation: {
              stringVec: relationActionItemArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);

        if (revActionItem != undefined || revActionItem != null) {
          let actionItemParam = {
            input: [
              {
                clientId: '',
                relationType: 'L2_ActionItemRelation',
                primaryObject: revParent,
                secondaryObject: revActionItem.output[0].item,
              },
            ],
          };
          try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', actionItemParam);
          } catch (err) {
            //console.log(err)
          }
        }
      }

      // 첨부파일 릴레이션 제거
      await com.getProperties(revParent, ['TC_Attaches']);
      console.log(revParent);
      if (revObj.props.TC_Attaches.dbValues.length != 0) {
        let datasetRelation = await com.getObject(revObj.props.TC_Attaches.dbValues);

        for (let i = 0; i < datasetRelation.length; i++) {
          let param = {
            input: [
              {
                clientId: '',
                relationType: 'TC_Attaches',
                primaryObject: revObj,
                secondaryObject: datasetRelation[i],
              },
            ],
          };
          try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
          } catch (err) {
            //console.log(err)
          }
        }

        // 첨부파일 삭제
        let testParam = {
          objects: datasetRelation,
        };
        try {
          await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
        } catch (err) {
          //console.log(err)
        }
      }

      data.object_nameLbl.uiValue = '';
      data.l2_meeting_placeLbl.uiValue = '';
      data.l2_meeting_participantsLbl.uiValue = '';
      data.l2_meeting_dateLbl.uiValue = '';
      data.proceedWriterLink.uiValue = '';
      data.l2_meeting_agendaLbl.uiValue = '';
      data.l2_meeting_related_scheduleLbl.uiValue = '';
      data.datasetLink.dbValue = [];
      $('#minutesMainSummernote').summernote('reset');
      $('#minutesMainSummernote').summernote('disable');

      // 회의록 삭제
      let deleteOjt = {
        objects: [revItemParant.output[0].item],
      };
      await com.deleteObject(deleteOjt.objects[0]);

      // 액션 아이템 삭제
      let deleteActionItemOjt = {
        objects: deleteActionItem,
      };
      for (let i = 0; i < deleteActionItem.length; i++) {
        await com.deleteObject(deleteActionItemOjt.objects[i]);
      }
      eventBus.publish('minutesTable.plTable.reload');
      msg.show(0, `"${data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader1}" ${deletedMinutes}`);
    },
    function () {},
  );
}

export function failureAddPopupAction(ctx, data) {
  if (data.dataProviders.minutesListProvider.selectedObjects.length != 0) {
    popupService.show({
      declView: 'popupFailureList',
      options: {
        clickOutsideToClose: true,
        isModal: false,
        reference: 'referenceId',
        placement: 'center',
        width: 500,
        height: 500,
      },
      outputData: {
        popupId: 'id',
      },
    });
  } else {
    msg.show(0, selectMinutesToFailure);
  }
}

export async function failureLoadAction(ctx, data) {
  let originFailure = ctx.checklist.failure;
  let originFailureUID = [];
  let originFailureObj = [];
  let objToOriginFailure = [];
  let lastFailureArr = [];
  for (let i = 0; i < originFailure.length; i++) {
    originFailureObj.push(originFailure[i].getOriginalObject());
    originFailureUID.push(originFailureObj[i].uid);
  }
  objToOriginFailure.push(com.getObject(originFailureUID));

  let mainData = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  let relatedFailure = mainData.dataProviders.failureList.viewModelCollection.loadedVMObjects;

  await com.getProperties(objToOriginFailure[0], [
    'L2_MinutesRelation',
    'IMAN_reference',
    'awp0CellProperties',
    'awp0ConfiguredRevision',
    'awp0ThumbnailImageTicket',
    'checked_out_date',
    'checked_out_user',
    'fnd0InProcess',
    'fnd0MyWorkflowTasks',
    'is_modifiable',
    'is_vi',
    'items_tag',
    'object_desc',
    'object_name',
    'object_string',
    'owning_project',
    'owning_user',
    'release_status_list',
  ]);

  for (let i = 0; i < objToOriginFailure[0].length; i++) {
    let vmo = vms.constructViewModelObjectFromModelObject(objToOriginFailure[0][i]);
    let failureName = vmo.props.object_string.dbValue.replaceAll('\n', ' ');
    vmo.cellHeader1 = failureName;
    lastFailureArr.push(vmo);
  }

  let lastFailureUIDArr = [];
  let relatedFailureUIDArr = [];
  let realLastFailureArr = [];
  for (let all of lastFailureArr) {
    lastFailureUIDArr.push(all.uid);
  }
  for (let rel of relatedFailure) {
    relatedFailureUIDArr.push(rel.uid);
  }

  let realLastFailureUIDArr = lastFailureUIDArr.filter((x) => !relatedFailureUIDArr.includes(x));

  for (let i = 0; i < lastFailureArr.length; i++) {
    for (let j = 0; j < realLastFailureUIDArr.length; j++) {
      if (lastFailureArr[i].uid == realLastFailureUIDArr[j]) {
        realLastFailureArr.push(lastFailureArr[i]);
      }
    }
  }
  let failureData = ctx.checklist.grid.store.data.rawData;
  let failureDataArr = [];

  for (let fail of failureData) {
    failureDataArr.push(fail.getOriginalObject());
  }
  for (let i = 0; i < realLastFailureArr.length; i++) {
    for (let j = 0; j < failureDataArr.length; j++) {
      if (realLastFailureArr[i].uid == failureDataArr[j].uid) {
        let effect = failureData[j].failureEffect;
        let detail = failureData[j].failureDetail;
        if (effect) {
          effect = effect.replace(/<[^>]*>?/g, ' ');
        }
        if (detail) {
          detail = detail.replace(/<[^>]*>?/g, ' ');
        } else {
          detail = '-';
        }
        realLastFailureArr[i].cellHeader2 = effect;
        realLastFailureArr[i].cellProperties.리비전 = {
          key: '메커니즘',
          value: detail,
        };
      }
    }
  }

  data.dataProviders.failureControlList.viewModelCollection.setViewModelObjects(realLastFailureArr);
}

export async function failureAddAction(ctx, data) {
  let minutesTable = vmSer.getViewModelUsingElement(document.getElementById('minutesTable'));
  if (!minutesTable) {
    let selectTableItem = com.getObject([ctx.target_uid]);

    let selectListUIDArr = [];
    let originFailureUIDArr = selectTableItem[0].props.l2_related_failure;
    let addArr = data.dataProviders.failureControlList.selectedObjects;

    for (let i = 0; i < addArr.length; i++) {
      selectListUIDArr.push(addArr[i].uid);
    }
    console.log('선택한 UID', { selectListUIDArr });
    originFailureUIDArr.push(selectListUIDArr);
    originFailureUIDArr = originFailureUIDArr.flat();
    originFailureUIDArr = originFailureUIDArr.filter((v, i) => originFailureUIDArr.indexOf(v) === i);
    console.log('원래있던거 + 선택한거 중복제거', { originFailureUIDArr });

    let minutesParam = {
      objects: com.getObject(selectTableItem[0].props.items_tag.dbValues),
      attributes: {
        l2_related_failure: {
          stringVec: originFailureUIDArr,
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);
    selectTableItem[0].props.l2_related_failure = originFailureUIDArr;
  } else {
    let selectTableItem = minutesTable.dataProviders.minutesListProvider.selectedObjects[0];
    let topObjRev = appCtxService.ctx.checklist.target;
    let revUID = selectTableItem.cellHeader2;
    let setParentsApi = {
      infos: [
        {
          itemId: revUID,
        },
      ],
    };
    let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);

    let selectMinutes = revItemParant.output[0].item;
    await com.getProperties(selectMinutes, ['l2_related_failure']);
    console.log(selectMinutes);
    let selectListUIDArr = [];
    let originFailureUIDArr = selectMinutes.props.l2_related_failure.dbValues;
    let addArr = data.dataProviders.failureControlList.selectedObjects;

    for (let i = 0; i < addArr.length; i++) {
      selectListUIDArr.push(addArr[i].uid);
    }
    console.log('선택한 UID', { selectListUIDArr });
    originFailureUIDArr.push(selectListUIDArr);
    originFailureUIDArr = originFailureUIDArr.flat();
    originFailureUIDArr = originFailureUIDArr.filter((v, i) => originFailureUIDArr.indexOf(v) === i);
    console.log('원래있던거 + 선택한거 중복제거', { originFailureUIDArr });

    let minutesParam = {
      objects: [selectMinutes],
      attributes: {
        l2_related_failure: {
          stringVec: originFailureUIDArr,
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);

    let addFailure = await com.getObject(originFailureUIDArr);

    for (let i = 0; i < addFailure.length; i++) {
      let addFailureArr = addFailure[i].props.L2_MinutesRelation.dbValues;
      if (addFailureArr) {
        addFailure[i].props.L2_MinutesRelation.dbValues.push(selectTableItem.uid);
        addFailure[i].props.L2_MinutesRelation.dbValues.flat();
        addFailureArr = addFailureArr.filter((v, i) => addFailureArr.indexOf(v) === i);
        let addMinutesInFailureParam = {
          objects: [addFailure[i]],
          attributes: {
            L2_MinutesRelation: {
              stringVec: addFailureArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', addMinutesInFailureParam);
      }
    }
    let targetArr = topObjRev.props.L2_MinutesRelation.dbValues;
    targetArr.push(selectTableItem.uid);
    targetArr = targetArr.filter((v, i) => targetArr.indexOf(v) === i);
    console.log(targetArr);
    let addMinutesInTargetParam = {
      objects: [topObjRev],
      attributes: {
        L2_MinutesRelation: {
          stringVec: targetArr,
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', addMinutesInTargetParam);
  }
}

export async function failureDeleteAction(ctx, data) {
  let selectTableItem = data.dataProviders.minutesListProvider.selectedObjects[0];
  let revUID = selectTableItem.cellHeader2;
  let topObjRev = appCtxService.ctx.checklist.target;
  let setParentsApi = {
    infos: [
      {
        itemId: revUID,
      },
    ],
  };
  let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);

  let selectMinutes = revItemParant.output[0].item;
  await com.getProperties(selectMinutes, ['l2_related_failure']);

  let allFailure = data.dataProviders.failureList.viewModelCollection.loadedVMObjects;
  let selectFailure = data.dataProviders.failureList.selectedObjects;
  let deletedArr = [];
  deletedArr.push(allFailure.filter((x) => !selectFailure.includes(x)));
  deletedArr = deletedArr[0];
  let deletedUIDArr = [];
  for (let i = 0; i < deletedArr.length; i++) {
    deletedUIDArr.push(deletedArr[i].uid);
  }

  let minutesParam = {
    objects: [selectMinutes],
    attributes: {
      l2_related_failure: {
        stringVec: deletedUIDArr,
      },
    },
  };
  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);
  let failArr;
  let failfilter;

  for (let i = 0; i < selectFailure.length; i++) {
    failArr = selectFailure[i].props.L2_MinutesRelation.dbValues;
    failfilter = failArr.filter((element) => element !== selectTableItem.uid);
  }

  console.log('잘지워졌나~~', { failfilter });
  let addMinutesInTargetParam = {
    objects: selectFailure,
    attributes: {
      L2_MinutesRelation: {
        stringVec: failfilter,
      },
    },
  };
  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', addMinutesInTargetParam);

  for (let row of appCtxService.ctx.checklist.grid.getData()) {
    appCtxService.ctx.checklist.grid.removeRowClassName(row.rowKey, 'select');
  }

  msg.show(0, `${selectFailure.length}개의 고장이 제거되었습니다.`);
}

export function datasetLinkAction(data) {
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + data.eventData.scope.prop.uid);
}

export async function highlightTuiGrid() {
  let data = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  let ctx = appCtxService.ctx.checklist;
  let rows = ctx.grid.getData();
  let selected = data.dataProviders.failureList.selectedObjects;

  for (let row of rows) {
    ctx.grid.removeRowClassName(row.rowKey, 'select');
    for (let item of selected) {
      if (row.icon == item.uid) {
        ctx.grid.addRowClassName(row.rowKey, 'select');
      }
    }
  }
}

export async function fileUpload(data) {
  const fileInput = document.getElementById('fileUpload');
  let selectedTableMinutes = data.dataProviders.minutesListProvider.selectedObjects[0];
  try {
    await com.getProperties(selectedTableMinutes, ['IMAN_reference']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }
  // 또는 const fileInput = $("#fileUpload").get(0);
  const selectedFile = [...fileInput.files];
  modifyFileArr = [];
  console.log('들어간 파일', { newFileArr });
  let fileDataset = await lgepSummerNoteUtils.uploadFileToDataset(newFileArr);
  for (let file of fileDataset) {
    modifyFileArr.push(file);
  }
  await lgepSummerNoteUtils.linkRelationItem(selectedTableMinutes, fileDataset);
  newFileArr = [];
}

export async function editFileView(data) {
  await common.delay(200);

  const editFileInput = document.querySelector('#fileUpload');
  const preview = document.querySelector('#preview');

  editFileInput.addEventListener('change', async (e) => {
    const selectedFile = [...editFileInput.files];
    const files = Array.from(editFileInput.files);
    files.forEach((file) => {
      lastModifiedArr.push(String(file.lastModified));
      newFileArr.push(file);
      preview.innerHTML += `
          <p id="${file.lastModified}" class='uploadFileList'>
              ${file.name}
              <button data-index='${file.lastModified}' class='file-remove'>X</button>
          </p>`;
    });
  });

  preview.addEventListener('click', (e) => {
    if (e.target.className !== 'file-remove') return;
    const removeTargetId = e.target.dataset.index;
    const removeTarget = document.getElementById(removeTargetId);
    const files = document.querySelector('#fileUpload').files;
    const dataTranster = new DataTransfer();

    Array.from(files)
      .filter((file) => file.lastModified != removeTargetId)
      .forEach((file) => {
        dataTranster.items.add(file);
      });
    newFileArr = [];
    for (let file of dataTranster.files) {
      newFileArr.push(file);
    }
    console.log(newFileArr);
    document.querySelector('#fileUpload').files = dataTranster.files;

    removeTarget.remove();
  });
}

export async function loadCreateMinutes(ctx, data) {
  await common.delay(200);
  let date = new Date();
  let years = date.getFullYear();
  let month = date.getMonth() + 1;
  let days = date.getDate();
  let initTime = '08:00:00';
  if (days < 10) {
    data.l2_meeting_date.dateApi.dateValue = `${years}-${month}-0${days}`;
  } else {
    data.l2_meeting_date.dateApi.dateValue = `${years}-${month}-${days}`;
  }
  // if (days < 10) {
  //   data.l2_expected_date.dateApi.dateValue = `${years}-${month}-0${days}`;
  // } else {
  //   data.l2_expected_date.dateApi.dateValue = `${years}-${month}-${days}`;
  // }
  data.l2_meeting_date.dateApi.timeValue = initTime;
  // data.l2_expected_date.dateApi.timeValue = initTime;
}

export async function tableSelect(ctx, data, eventData) {
  await lgepCommonUtils.delay(100);
  ctx.selectActionItemRev = eventData.selectedVmo;
  let actionTable = document.getElementById('actionItemTable');
  let selectRow = actionTable.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children;
  let rowLength = actionTable.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children.length;
  let selectRowIcon = actionTable.children[1].children[0].children[0].children[0].children[1].children[2].children[1].children[0].children;
  console.dir(selectRow);

  for (let i = 0; i < rowLength; i++) {
    selectRow[i].style.backgroundColor = 'rgb(255, 255, 255)';
    selectRowIcon[i].style.backgroundColor = 'rgb(255, 255, 255)';
    if (eventData.selectedVmo.uid == selectRow[i].vmo.uid) {
      selectRow[i].style.backgroundColor = 'rgb(240, 240, 240)';
      selectRowIcon[i].style.backgroundColor = 'rgb(240, 240, 240)';
    }
  }
  // 데이터셋 불러올 때 사용
  // let parseText = JSON.parse(setText);
  // console.log(parseText);

  await com.getProperties(ctx.selectActionItemRev, ['IMAN_reference', 'IMAN_specification']);
  let datesetUID = ctx.selectActionItemRev.props.IMAN_specification.dbValue[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  let parentUID = ctx.selectActionItemRev.props.items_tag.dbValue;
  let actionItem = await com.getObject([parentUID]);
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  mainData.l2_workerLbl.uiValue = ctx.selectActionItemRev.props.l2_worker.uiValue;
  mainData.l2_expected_dateLbl.uiValue = ctx.selectActionItemRev.props.l2_expected_date.uiValue;
  let commentDetails = ctx.selectActionItemRev.props.l2_comment.uiValue;
  let followUpDetails = ctx.selectActionItemRev.props.l2_follow_up.uiValue;
  commentDetails = `<pre>${commentDetails}</pre>`;
  followUpDetails = `<pre>${followUpDetails}</pre>`;

  $('#commentDetailsSummernote').summernote('reset');
  $('#followUpDetailsSummernote').summernote('reset');
  $('#commentDetailsSummernote').summernote('code', text.comment + '<br>');
  $('#followUpDetailsSummernote').summernote('code', text.followUp + '<br>');
}

let exports = {};

export default exports = {
  actionItemEditMode,
  backMinutes,
  cancelActionItemEdit,
  cancelMinutesMain,
  changePanelStatus,
  createInitialize,
  createMinutesInitialize,
  createMinutesInShowAllMinutes,
  datasetLinkAction,
  deleteMinutesMain,
  editMinutesMain,
  editFileView,
  failureAddAction,
  failureLoadAction,
  failureAddPopupAction,
  failureDeleteAction,
  failureLoad,
  fileUpload,
  highlightTuiGrid,
  initialize,
  loadActionItem,
  loadCreateMinutes,
  loadMinutes,
  loadMinutesDetails,
  openCreateActionItem,
  openCreateMinutes,
  openCreateMinutesInShowAllMinutes,
  openMinutes,
  panelReload,
  resetDetails,
  saveActionItem,
  showAllRevisionsMinutes,
  saveMinutesMain,
  sortAction,
  sortActionItem,
  tableSelect,
};

app.factory('minutesService', () => exports);
