import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import com from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import msg from 'js/utils/lgepMessagingUtils';
import common from 'js/utils/lgepCommonUtils';
import vms from 'js/viewModelObjectService';
import vmSer from 'js/viewModelService';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import browserUtils from 'js/browserUtils';
import * as fs from 'fs';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import _ from 'lodash';
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
  const selectRow = appCtxService.ctx.checklist.selectedRow;
  let ctx = appCtxService.ctx;
  if (!ctx.panelOn) {
    ctx.panelOn = true;
  }

  if (!selectRow) {
    // 전체 회의록 조회
    ctx.show_minutes_mode = 0;
  } else if (selectRow.type == 'L2_StructureRevision') {
    // 전체 회의록 조회
    ctx.show_minutes_mode = 0;
  } else {
    // 선택된 체크리스트의 회의록 조회
    ctx.show_minutes_mode = 1;
  }

  const popupData = {
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

  // let selectedRow = appCtxService.ctx.checklist.selectedRow;
  // let selectType = appCtxService.ctx.checklist.selectedRow.type;
  // if (selectType == "L2_FailureRevision") {
  //   if (selectType != "L2_FailureRevision") {
  //     msg.show(2, afterSelectingTheFailure, [close], [
  //       function () { }
  //     ]);
  //   } else {
  //     const data = {
  //       id: "checklist_minutes",
  //       includeView: "minutesMain",
  //       closeWhenCommandHidden: true,
  //       keepOthersOpen: true,
  //       commandId: "checklist_minutes",
  //       config: {
  //         width: "WIDE",
  //       },
  //       outputData: {
  //         popupId: "mainMinutes"
  //       }
  //     };
  //     eventBus.publish("awsidenav.openClose", data);
  //   }
  // } else {
  //   msg.show(2, afterSelectingTheFailure, [close], [
  //     function () { }
  //   ]);
  // }
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

export function backMinutes(ctx) {
  let test = vmSer.getViewModelUsingElement(document.getElementById('mainModeNav'));

  console.log(test);

  if (test.viewName == 'all') {
    appCtxService.registerCtx('show_minutes_mode', 0);
  } else {
    appCtxService.registerCtx('show_minutes_mode', 1);
  }

  // const createData = {
  //   id: "checklist_createMinutes",
  //   includeView: "createMinutes",
  //   closeWhenCommandHidden: true,
  //   keepOthersOpen: true,
  //   commandId: "checklist_createMinutes",
  //   config: {
  //     width: "WIDE",
  //   },
  // };
  // eventBus.publish("awsidenav.openClose", createData);

  // const data = {
  //   id: "checklist_minutes",
  //   includeView: "minutesMain",
  //   closeWhenCommandHidden: true,
  //   keepOthersOpen: true,
  //   commandId: "checklist_minutes",
  //   config: {
  //     width: "WIDE",
  //   },
  // };
  // eventBus.publish("awsidenav.openClose", data);
}

export function openCreateMinutes() {
  appCtxService.registerCtx('show_minutes_mode', 2);

  // const mainData = {
  //   id: "checklist_minutes",
  //   includeView: "minutesMain",
  //   closeWhenCommandHidden: true,
  //   keepOthersOpen: true,
  //   commandId: "checklist_minutes",
  //   config: {
  //     width: "WIDE",
  //   }
  // };
  // eventBus.publish("awsidenav.openClose", mainData);

  // const data = {
  //   id: "checklist_createMinutes",
  //   includeView: "createMinutes",
  //   closeWhenCommandHidden: true,
  //   keepOthersOpen: true,
  //   commandId: "checklist_createMinutes",
  //   config: {
  //     width: "WIDE",
  //   },
  // };
  // eventBus.publish("awsidenav.openClose", data);
}

export function openCreateMinutesInShowAllMinutes() {
  appCtxService.registerCtx('show_minutes_mode', 4);
}

export function openCreateActionItem() {
  appCtxService.registerCtx('show_minutes_mode', 5);
}

export async function loadMinutes(data) {
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
  //console.log("BeforeLoadOBJ", { selectLoadObj });
  let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

  try {
    await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }
  //console.log("AfterLoadOBJ", { selectLoadObjRev });

  let uidLength = selectLoadObjRev.props.L2_MinutesRelation.dbValues.length;
  let minutesRelationArr = [];
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
  // arr.push(com.getObject(selectLoadObjRev.props.L2_MinutesRelation.dbValues));
  // let target = appCtxService.ctx.checklist.target;
  await com.getProperties(arr, ['creation_date', 'items_tag']);

  let i = 0;
  for (let rev of arr) {
    let item = com.getObject(rev.props.items_tag.dbValues[0]);
    await com.getProperties(item, [
      'l2_meeting_date',
      'item_revision',
      'creation_date',
      'l2_meeting_date',
      'l2_meeting_place',
      'l2_meeting_participants',
      'l2_meeting_details',
      'l2_meeting_agenda',
      'l2_meeting_related_schedule',
      'IMAN_reference',
      'L2_ActionItemRelation',
    ]);
    arr2.push(vms.constructViewModelObjectFromModelObject(rev));
    arr2[i].props['meeting_date'] = makeVmProperty('meeting_date', item.props.l2_meeting_date.uiValues[0]);
    arr2[i].props['item_revision_id'] = makeVmProperty('item_revision_id', topObjRev.props.item_revision_id.uiValues[0]);
    arr2[i].props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', item.props.L2_ActionItemRelation);
    minutesRelationArr.push(arr2[i]);
    i++;
  }

  minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

  data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);

  let firstItem = data.dataProviders.minutesListProvider.viewModelCollection.loadedVMObjects[0];
  data.dataProviders.minutesListProvider.selectionModel.setSelection(firstItem);
  // let revUID = data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
  // let setParentsApi = {
  //   infos: [{
  //     itemId: revUID
  //   }]
  // }
  // let revItemParant = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", setParentsApi);

  // let selectMinutes = revItemParant.output[0].item;
  // await com.getProperties(selectMinutes, ["l2_related_failure", "creation_date", "l2_meeting_date", "l2_meeting_place", "l2_meeting_participants",
  //   "l2_meeting_details", "l2_meeting_agenda", "l2_meeting_related_schedule"]);
  // console.log(selectMinutes);

  // let failureArr = data.dataProviders.minutesListProvider.selectedObjects[0].props.l2_related_failure.dbValues;
  // cconsole.log(failureArr);

  await common.userLogsInsert('Load Dashboard', '', 'S', 'Success');
  return {
    minutes: minutesRelationArr,
    minutesLength: minutesRelationArr.length,
  };
}

export async function loadActionItem(data) {
  // await common.delay(200);
  ctx.selectActionItemRev = null;

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
  await com.getProperties(haveActionItemObj, ['l2_number', 'l2_comment', 'l2_follow_up', 'l2_worker', 'l2_expected_date', 'l2_finish_date', 'l2_state']);

  for (let i = 0; i < haveActionItemRevObj.length; i++) {
    arr2.push(vms.constructViewModelObjectFromModelObject(haveActionItemRevObj[i]));
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
  console.log(actionTable);
  actionTable.dataProviders.actionItemTableProvider.viewModelCollection.setViewModelObjects(actionItemArr);
  let actionTableView = document.getElementById('actionItemTable');
  let selectRow = actionTableView.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children;
  let rowLength = actionTableView.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children.length;
  let selectRowIcon = actionTableView.children[1].children[0].children[0].children[1].children[1].children[1].children[0].children;
  for (let i = 0; i < rowLength; i++) {
    selectRow[i].style.backgroundColor = 'rgb(255, 255, 255)';
    selectRowIcon[i].style.backgroundColor = 'rgb(255, 255, 255)';
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

  let a = vmSer.getViewModelUsingElement(document.getElementById('minutesTable'));
  if (!a) {
    failureLoad2(ctx, data);
  } else {
    if (a.dataProviders.minutesListProvider.selectedObjects.length == 1) {
      if (ctx.tabKey == 1) {
        let revUID = a.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
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
            let vmo = vms.constructViewModelObjectFromModelObject(failureArr[0][i]);
            let failureName = vmo.props.object_string.dbValue.replaceAll('\n', ' ');
            vmo.cellHeader1 = failureName;
            failureVMOArr.push(vmo);
          }
          a.dataProviders.failureList.viewModelCollection.setViewModelObjects(failureVMOArr);
        } else {
          a.dataProviders.failureList.viewModelCollection.clear();
          // msg.show(1, noFailure, [close], [
          //   function () { }
          // ]);
        }
      }
    } else {
      a.dataProviders.failureList.viewModelCollection.clear();
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
  let a = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  let tableMinutesRev = data.dataProviders.minutesListProvider.selectedObjects[0];
  ctx.selectedminutes = tableMinutesRev;
  try {
    await com.getProperties(tableMinutesRev, ['IMAN_reference']);
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
      'IMAN_reference',
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
    ]);

    let titleData = preRevItem.props.object_name.uiValues[0];
    let dateData = preRevItem.props.l2_meeting_date.dbValues[0];
    let placeData = preRevItem.props.l2_meeting_place.uiValues[0];
    let writerData = preRevItem.props.owning_user.uiValues[0];
    let participants = preRevItem.props.l2_meeting_participants.uiValues[0];
    let agendaData = preRevItem.props.l2_meeting_agenda.uiValues[0];
    let scheduleData = preRevItem.props.l2_meeting_related_schedule.uiValues[0];
    let detailsData = preRevItem.props.l2_meeting_details.uiValues[0];
    let fileValue = tableMinutesRev.props.IMAN_reference;

    dateData = dateData.split('T');
    let dateData1 = dateData[0];
    let dateData2 = dateData[1].split('+');
    let dateDataTime = dateData2[0].split(':');
    let dateDataT = dateDataTime[0] + ':' + dateDataTime[1];
    dateData = dateData1 + ' ' + dateDataT;

    detailsData = detailsData.replaceAll('\n', '<br>');
    detailsData = detailsData.replaceAll('<pre>', '');
    detailsData = detailsData.replaceAll('</pre>', '');
    detailsData = `<pre>${detailsData}</pre>`;

    data.object_nameLbl.uiValue = titleData;
    data.l2_meeting_dateLbl.uiValue = dateData;
    data.l2_meeting_placeLbl.uiValue = placeData;
    data.proceedWriterLink.uiValue = writerData;
    data.l2_meeting_participantsLbl.uiValue = participants;
    data.l2_meeting_agendaLbl.uiValue = agendaData;
    data.proceedDetails.uiValue = detailsData;
    data.l2_meeting_related_scheduleLbl.uiValue = scheduleData;

    let datasetLinkArr = [];

    for (let i = 0; i < fileValue.uiValues.length; i++) {
      datasetLinkArr.push(fileValue.uiValues[i]);
    }

    let referenceUID = data.dataProviders.minutesListProvider.selectedObjects[0].props.IMAN_reference.dbValues;
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

    $('#minutesMainSummernote').summernote('reset');
    $('#minutesMainSummernote').summernote('code', detailsData + '<br>');
  }
}

export async function initialize() {
  $('#minutesMainSummernote').summernote({
    height: 450,
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

export async function saveMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let a = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  let revMinutes = data.dataProviders.minutesListProvider.selectedObjects[0];
  let fileValue = revMinutes.props.IMAN_reference;
  let savedFile = data.datasetLink.dbValue; // A배열
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
    await com.getProperties(selectedTableMinutes, ['IMAN_reference']);
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
          relationType: 'IMAN_reference',
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
  let deleteDataset = [];

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
  $('#minutesMainSummernote').summernote('disable');

  msg.show(0, `${data.object_name.dbValue} ${editedMinutes}`);
}

export async function createMinutesInShowAllMinutes(ctx, data) {
  console.log('회의록 생성');

  if (appCtxService.ctx.checklist.selectedRow) {
    msg.show(1, '체크리스트 하위에 있는 고장 선택을 해제해주세요.');
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
        msg.show(1, '회의록 제목을 입력해주세요.');
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
        msg.show(0, `${minutesName} ${createdItemMsg}`, [close], [function () {}]);
      }
      appCtxService.registerCtx('show_minutes_mode', 0);
    } catch (err) {
      console.log(err);
    }
  }
}

export async function editMinutesMain(ctx, data) {
  eventBus.publish('start.editMode');
  // let fileUploadTag = document.getElementById('fileUpload');
  // fileUploadTag.setAttribute('class', 'aw-file-upload-fileInput ng-valid ng-valid-required ng-touched ng-dirty ng-valid-parse ng-pristine ng-untouched ng-empty');
  let fileInput = document.getElementById('fileUpload');
  let selectedFile = [...fileInput.files];

  let selectOrigin = appCtxService.ctx.checklist.selectedRow.getOriginalObject();
  console.log(selectOrigin);

  if (data.dataProviders.minutesListProvider.selectedObjects.length == 0) {
    msg.show(0, pleaseSelectMinutesForModify);
  } else {
    if (data.editMode) {
      data.editMode = false;
    } else {
      data.editMode = true;
    }
    let a = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
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

    let savedFileUID = data.dataProviders.minutesListProvider.selectedObjects[0].props.IMAN_reference.dbValue;
    let savedFileName = data.dataProviders.minutesListProvider.selectedObjects[0].props.IMAN_reference.uiValues;
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
  let a = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));

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

  let a = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
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

      let selectOrigin = appCtxService.ctx.checklist.selectedRow.getOriginalObject();
      let selectUID = [selectOrigin.uid];
      let selectLoadObj = await com.loadObjects(selectUID);
      let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

      // 첨부파일 삭제
      let datasetRelation = com.getObject(revParent.props.IMAN_reference.dbValues);

      for (let i = 0; i < datasetRelation.length; i++) {
        let param = {
          input: [
            {
              clientId: '',
              relationType: 'item_IMAN_reference',
              primaryObject: revParent,
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
      let testParam = {
        objects: datasetRelation,
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
      } catch (err) {
        //console.log(err)
      }

      let topOrigin = appCtxService.ctx.checklist.structure[0].getOriginalObject();
      let topUID = [topOrigin.uid];
      let topObj = await com.loadObjects(topUID);
      let topObjRev = topObj.modelObjects[topObj.plain[0]];

      try {
        await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation']);
        await com.getProperties(topObjRev, ['L2_MinutesRelation']);
        await com.getProperties(revParent, ['L2_ActionItemRelation']);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }
      let deleteActionItem = [];
      let actionItemID;
      let revActionItem;
      let actionItemName = revParent.props.L2_ActionItemRelation.uiValues;
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
      console.log(deleteActionItem);
      let relationUIDLeng = selectLoadObjRev.props.L2_MinutesRelation.dbValues.length;
      let relationArr = selectLoadObjRev.props.L2_MinutesRelation.dbValues;
      let relationUID;
      for (let i = 0; i < relationUIDLeng; i++) {
        if (data.dataProviders.minutesListProvider.selectedObjects[0].uid == selectLoadObjRev.props.L2_MinutesRelation.dbValues[i]) {
          relationUID = selectLoadObjRev.uid;
          for (let i = 0; i < relationUIDLeng; i++) {
            if (relationArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].uid) {
              relationArr.splice(i, 1);
              i--;
            }
          }
        }
      }

      let relationTopUIDLeng = topObjRev.props.L2_MinutesRelation.dbValues.length;
      let relationTopArr = topObjRev.props.L2_MinutesRelation.dbValues;
      let relationTopUID;
      for (let i = 0; i < relationTopUIDLeng; i++) {
        if (data.dataProviders.minutesListProvider.selectedObjects[0].uid == topObjRev.props.L2_MinutesRelation.dbValues[i]) {
          relationTopUID = topObjRev.uid;
          for (let i = 0; i < relationTopUIDLeng; i++) {
            if (relationTopArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].uid) {
              relationTopArr.splice(i, 1);
              i--;
            }
          }
        }
      }

      let relationActionItemUIDLeng = revParent.props.L2_ActionItemRelation.dbValues.length;
      let relationActionItemArr = revParent.props.L2_ActionItemRelation.dbValues;
      let relationActionItemUID;
      for (let i = 0; i < relationActionItemUIDLeng; i++) {
        if (
          data.dataProviders.minutesListProvider.selectedObjects[0].props.L2_ActionItemRelation.dbValue.dbValues[i] ==
          revParent.props.L2_ActionItemRelation.dbValues[i]
        ) {
          relationActionItemUID = revParent.uid;
          for (let i = 0; i < relationActionItemUIDLeng; i++) {
            if (
              relationActionItemArr[i] === data.dataProviders.minutesListProvider.selectedObjects[0].props.L2_ActionItemRelation.dbValue.dbValues[i] &&
              i != 0
            ) {
              relationActionItemArr.splice(i, 1);
              i--;
            }
          }
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

      let relation = com.getObject([relationUID]);

      let deleteOjt = {
        objects: [revItemParant.output[0].item],
      };
      let deleteActionItemOjt = {
        objects: deleteActionItem,
      };
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
      let topRelation = com.getObject([topTargetUID]);

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
      msg.show(0, `"${data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader1}" ${deletedMinutes}`);
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
      await com.deleteObject(deleteOjt.objects[0]);
      for (let i = 0; i < deleteActionItem.length; i++) {
        await com.deleteObject(deleteActionItemOjt.objects[i]);
      }
    },
    function () {},
  );
}

export function failureAddPopupAction() {
  console.log('고장 추가');
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
  console.log('오브젝트', { originFailureObj });
  console.log('UID', { originFailureUID });
  objToOriginFailure.push(com.getObject(originFailureUID));
  console.log('after오브젝트', { objToOriginFailure });

  await com.getProperties(objToOriginFailure[0], [
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
  for (let i = 0; i < objToOriginFailure[0].length; i++) {
    let vmo = vms.constructViewModelObjectFromModelObject(objToOriginFailure[0][i]);
    let failureName = vmo.props.object_string.dbValue.replaceAll('\n', ' ');
    vmo.cellHeader1 = failureName;
    lastFailureArr.push(vmo);
  }

  console.log('last', { lastFailureArr });
  data.dataProviders.failureControlList.viewModelCollection.setViewModelObjects(lastFailureArr);
}

export async function failureAddAction(ctx, data) {
  let a = vmSer.getViewModelUsingElement(document.getElementById('minutesTable'));
  if (!a) {
    // a = vmSer.getViewModelUsingElement(document.getElementById("show-all-minutes"));
    // console.log(a);
    let selectTableItem = com.getObject([ctx.target_uid]);
    // let revUID = selectTableItem.cellHeader2;
    //   let setParentsApi = {
    //     infos: [{
    //       itemId: revUID
    //     }]
    //   }
    //   let revItemParant = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", setParentsApi);

    //   let selectMinutes = revItemParant.output[0].item;
    // await com.getProperties(selectMinutes, ["l2_related_failure"]);
    // console.log(selectMinutes);

    // await com.getProperties(selectTableItem, ["object_string", "object_name", "owning_user", "l2_meeting_agenda",
    //   "l2_meeting_date", "l2_meeting_details", "l2_meeting_participants", "l2_meeting_place", "l2_meeting_title",
    //   "l2_meeting_related_schedule", "l2_minutes_writer", "l2_related_failure"]);

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
    console.log(a);
    let selectTableItem = a.dataProviders.minutesListProvider.selectedObjects[0];
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
    console.log(selectedFile);
    console.dir(editFileInput);
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
  data.l2_meeting_date.dateApi.dateValue = `${years}-${month}-${days}`;
  data.l2_meeting_date.dateApi.timeValue = initTime;
  data.l2_expected_date.dateApi.dateValue = `${years}-${month}-${days}`;
  data.l2_expected_date.dateApi.timeValue = initTime;
}

export async function tableSelect(ctx, data, eventData) {
  await lgepCommonUtils.delay(100);
  ctx.selectActionItemRev = eventData.selectedVmo;
  let actionTable = document.getElementById('actionItemTable');
  let selectRow = actionTable.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children;
  let rowLength = actionTable.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children.length;
  let selectRowIcon = actionTable.children[1].children[0].children[0].children[1].children[1].children[1].children[0].children;
  for (let i = 0; i < rowLength; i++) {
    selectRow[i].style.backgroundColor = 'rgb(255, 255, 255)';
    selectRowIcon[i].style.backgroundColor = 'rgb(255, 255, 255)';
    if (eventData.selectedVmo.uid == selectRow[i].vmo.uid) {
      selectRow[i].style.backgroundColor = 'rgb(240, 240, 240)';
      selectRowIcon[i].style.backgroundColor = 'rgb(240, 240, 240)';
    }
  }
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('mainNav'));
  console.log('click~~', { mainData });
  mainData.l2_workerLbl.uiValue = ctx.selectActionItemRev.props.l2_worker.uiValue;
  mainData.l2_expected_dateLbl.uiValue = ctx.selectActionItemRev.props.l2_expected_date.uiValue;
  let commentDetails = ctx.selectActionItemRev.props.l2_comment.uiValue;
  let followUpDetails = ctx.selectActionItemRev.props.l2_follow_up.uiValue;
  commentDetails = `<pre>${commentDetails}</pre>`;
  followUpDetails = `<pre>${followUpDetails}</pre>`;

  $('#commentDetailsSummernote').summernote('reset');
  $('#followUpDetailsSummernote').summernote('reset');
  $('#commentDetailsSummernote').summernote('code', commentDetails + '<br>');
  $('#followUpDetailsSummernote').summernote('code', followUpDetails + '<br>');
}

let exports = {};

export default exports = {
  backMinutes,
  cancelMinutesMain,
  changePanelStatus,
  createMinutesInShowAllMinutes,
  createInitialize,
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
  saveMinutesMain,
  sortAction,
  sortActionItem,
  tableSelect,
};

app.factory('minutesService', () => exports);
