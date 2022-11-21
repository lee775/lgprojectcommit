import app from 'app';
import appCtxService, { ctx } from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import com from 'js/utils/lgepObjectUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import msg from 'js/utils/lgepMessagingUtils';
import common from 'js/utils/lgepCommonUtils';
import vmos from 'js/viewModelObjectService';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import * as fs from 'fs';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import _ from 'lodash';

var $ = require('jQuery');
let fileArr = [];

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

let selectOrigin;
let preRevItem;

export function backMinutes() {
  appCtxService.registerCtx('show_minutes_mode', 0);
}

export function openCreateMinutes() {
  const mainData = {
    id: 'checklist_minutes',
    includeView: 'minutesMain',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_minutes',
    config: {
      width: 'WIDE',
    },
  };
  eventBus.publish('awsidenav.openClose', mainData);

  const data = {
    id: 'checklist_createMinutes',
    includeView: 'createMinutes',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_createMinutes',
    config: {
      width: 'WIDE',
    },
  };
  eventBus.publish('awsidenav.openClose', data);
}

export async function loadMinutes(ctx, data) {
  let test = vms.getViewModelUsingElement(document.getElementById('mainModeNav'));
  test.viewName = 'all';

  selectOrigin = appCtxService.ctx.checklist.target;
  console.log('selectOrigin', selectOrigin);
  data.allRevisionsMinutes.dbValue = ctx.checked_all_revision;

  try {
    await com.getProperties(selectOrigin, ['L2_MinutesRelation']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }

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
    arr2.push(vmos.constructViewModelObjectFromModelObject(arr[i]));

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

  // console.log("minutesRelationArr", minutesRelationArr);
  minutesRelationArr.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

  // data.dataProviders.minutesListProvider.viewModelCollection.setViewModelObjects(minutesRelationArr);

  // await common.userLogsInsert("Load Dashboard", "", "S", "Success");

  return {
    example: minutesRelationArr,
    totalFound: minutesRelationArr.length,
  };
}

function sortAction(response, startIndex, pageSize) {
  let countries = response.example;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;

    let searchResults = countries.slice(startIndex, endIndex);

    return searchResults;
  }
}

export async function loadMinutesDetails(target, rev) {
  appCtxService.registerCtx('show_minutes_mode', 3);
  console.log('selectedData', target);
  ctx.target_uid = target;
  preRevItem = com.getObject([target]);

  await com.getProperties(preRevItem, ['object_string', 'object_name', 'owning_user']);

  console.log('preRevItem', preRevItem);

  let titleData = preRevItem[0].props.object_name.uiValues[0];
  let dateData = preRevItem[0].props.l2_meeting_date;
  let placeData = preRevItem[0].props.l2_meeting_place;
  let writerData = preRevItem[0].props.owning_user.uiValues[0];
  let participants = preRevItem[0].props.l2_meeting_participants;
  let agendaData = preRevItem[0].props.l2_meeting_agenda;
  let scheduleData = preRevItem[0].props.l2_meeting_related_schedule;
  let detailsData = preRevItem[0].props.l2_meeting_details;
  let fileValue = preRevItem[0].props.item_IMAN_reference;

  detailsData = detailsData.replaceAll('\n', '<br>');
  detailsData = detailsData.replaceAll('<pre>', '');
  detailsData = detailsData.replaceAll('</pre>', '');
  detailsData = `<pre>${detailsData}</pre>`;

  common.delay(200);
  initialize();
  let a = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes'));

  a.object_nameLbl.uiValue = titleData;
  a.l2_meeting_dateLbl.uiValue = dateData;
  a.l2_meeting_placeLbl.uiValue = placeData;
  a.proceedWriterLink.uiValue = writerData;
  a.l2_meeting_participantsLbl.uiValue = participants;
  a.l2_meeting_agendaLbl.uiValue = agendaData;
  a.proceedDetails.uiValue = detailsData;
  a.l2_meeting_related_scheduleLbl.uiValue = scheduleData;
  a.current_revision_id = rev;

  a.datasetLink.uiValues = fileValue.uiValues;
  a.datasetLink.propertyDisplayName = fileValue.uiValues[0];
  a.datasetLink.dbValues = fileValue.dbValues;

  $('#showAllMinutesMainSummernote').summernote('reset');
  $('#showAllMinutesMainSummernote').summernote('code', detailsData + '<br>');
}

export async function initialize() {
  $('#showAllMinutesMainSummernote').summernote({
    height: 350,
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
  $('#showAllMinutesMainSummernote').summernote('disable');
  $('#showAllMinutesMainSummernote').css('background-color', 'white');
}

export async function saveMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let a = vms.getViewModelUsingElement(document.getElementById('mainNav'));

  // await com.getProperties(preRevItem, ["object_string", "object_name", "l2_meeting_agenda",
  //   "l2_meeting_date", "l2_meeting_details", "l2_meeting_participants", "l2_meeting_place", "l2_meeting_title",
  //   "l2_meeting_related_schedule", "l2_minutes_writer"]);

  let titleData = data.object_name.dbValue;
  let placeData = data.l2_meeting_place.dbValue;
  let participants = data.l2_meeting_participants.dbValue;
  let agendaData = data.l2_meeting_agenda.dbValue;
  let scheduleData = data.l2_meeting_related_schedule.dbValue;
  let modifyDetails = $('#showAllMinutesMainSummernote').summernote('code');
  let detailsData = data.proceedDetails.uiValue + '<br>';

  let minutesParam = {
    objects: com.getObject(preRevItem[0].props.items_tag.dbValues),
    attributes: {
      object_name: {
        stringVec: [titleData],
      },
      l2_meeting_agenda: {
        stringVec: [agendaData],
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

  minutesParam = {
    objects: preRevItem,
    attributes: {
      object_name: {
        stringVec: [titleData],
      },
    },
  };

  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);

  data.object_nameLbl.uiValue = titleData;
  data.l2_meeting_placeLbl.uiValue = placeData;
  data.l2_meeting_participantsLbl.uiValue = participants;
  data.l2_meeting_agendaLbl.uiValue = agendaData;
  data.l2_meeting_related_scheduleLbl.uiValue = scheduleData;
  $('#showAllMinutesMainSummernote').summernote('reset');
  $('#showAllMinutesMainSummernote').summernote('code', modifyDetails);
  $('#showAllMinutesMainSummernote').summernote('disable');

  msg.show(0, `${data.object_name.dbValue} ${editedMinutes}`);
}

export async function editMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let a = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes'));

  // await com.getProperties(preRevItem, ["object_string", "object_name", "l2_meeting_agenda",
  //   "l2_meeting_date", "l2_meeting_details", "l2_meeting_participants", "l2_meeting_place", "l2_meeting_title",
  //   "l2_meeting_related_schedule", "l2_minutes_writer"]);

  let titleData = preRevItem[0].props.object_name.uiValues[0];
  let placeData = preRevItem[0].props.l2_meeting_place;
  let participants = preRevItem[0].props.l2_meeting_participants;
  let agendaData = preRevItem[0].props.l2_meeting_agenda;
  let scheduleData = preRevItem[0].props.l2_meeting_related_schedule;

  data.object_name.dbValue = titleData;
  data.l2_meeting_place.dbValue = placeData;
  data.l2_meeting_participants.dbValue = participants;
  data.l2_meeting_agenda.dbValue = agendaData;
  data.l2_meeting_related_schedule.dbValue = scheduleData;

  $('#showAllMinutesMainSummernote').summernote('enable');
}

export async function cancelMinutesMain(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let a = vms.getViewModelUsingElement(document.getElementById('mainNav'));

  // await com.getProperties(preRevItem, ["object_string", "contents", "object_name", "l2_meeting_agenda",
  //   "l2_meeting_date", "l2_meeting_details", "l2_meeting_participants", "l2_meeting_place", "l2_meeting_title",
  //   "l2_meeting_related_schedule", "l2_minutes_writer"]);

  let detailsData = preRevItem[0].props.l2_meeting_details;
  $('#showAllMinutesMainSummernote').summernote('reset');
  $('#showAllMinutesMainSummernote').summernote('code', detailsData);
  $('#showAllMinutesMainSummernote').summernote('disable');
  msg.show(0, cancelEdit);
}

export async function deleteMinutesMain(ctx, data) {
  console.log('삭제', data.dataProviders.minutesListProvider.selectedObjects);

  if (data.dataProviders.minutesListProvider.selectedObjects.length > 0) {
    msg.show(
      1,
      '회의록을 모든 고장에서 지우겠습니까?',
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

        let deleteOjt = {
          objects: [revItemParant.output[0].item],
        };
        let deleteActionItemOjt = {
          objects: deleteActionItem,
        };

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
        eventBus.publish('showAllMinutesTable.plTable.reload');
        msg.show(0, `"${data.dataProviders.minutesListProvider.selectedObjects[0].cellHeader1}" ${deletedMinutes}`);
        await com.deleteObject(deleteOjt.objects[0]);
        for (let i = 0; i < deleteActionItem.length; i++) {
          await com.deleteObject(deleteActionItemOjt.objects[i]);
        }
      },
      function () {},
    );
  } else {
    notySvc.showError('삭제할 회의록을 선택해주세요.');
  }
}

export async function showAllRevisionsMinutes(ctx, data) {
  let display = vms.getViewModelUsingElement(document.getElementById('show-all-minutes'));
  if (display.allRevisionsMinutes.dbValue) {
    console.log('모든 리비전 보여줘');
    appCtxService.registerCtx('checked_all_revision', true);

    console.log(selectOrigin);

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
      arr2.push(vmos.constructViewModelObjectFromModelObject(arr[i]));

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
      arr2.push(vmos.constructViewModelObjectFromModelObject(arr[i]));

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

async function linkedName(treeNode, htmlElement, columnName) {
  let a = document.createElement('a');
  a.type = 'a';
  a.innerHTML = treeNode.cellHeader1;
  a.className = 'aw-widgets-propertyValueLink ng-isolate-scope';
  a.accessKey = treeNode.uid;
  a.addEventListener('click', function (event) {
    console.log('호이호이', event.target.accessKey);
    loadMinutesDetails(event.target.accessKey, treeNode.props.checklist_rev_id.dbValue);
  });
  htmlElement.appendChild(a);
}

export async function failureLoad2(ctx, data) {
  if (!data.dataProviders.failureList) {
    data = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes'));
  }

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
  if (preRevItem) {
    if (ctx.tabKey == 1) {
      let failureUIDArr = preRevItem[0].props.l2_related_failure;
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
          let vmo = vmos.constructViewModelObjectFromModelObject(failureArr[0][i]);
          let failureName = vmo.props.object_string.dbValue.replaceAll('\n', ' ');
          vmo.cellHeader1 = failureName;
          failureVMOArr.push(vmo);
        }
        console.log('asdfailureVMOArr', failureVMOArr);
        data.dataProviders.failureList.viewModelCollection.setViewModelObjects(failureVMOArr);
      } else {
        data.dataProviders.failureList.viewModelCollection.clear();
        // msg.show(1, noFailure, [close], [
        //   function () { }
        // ]);
      }
    }
  } else {
    data.dataProviders.failureList.viewModelCollection.clear();
  }
}

export async function failureDeleteAction(ctx, data) {
  // let selectTableItem = data.dataProviders.minutesListProvider.selectedObjects[0];
  // let revUID = selectTableItem.cellHeader2;
  //   let setParentsApi = {
  //     infos: [{
  //       itemId: revUID
  //     }]
  //   }
  //   let revItemParant = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", setParentsApi);

  //   let selectMinutes = revItemParant.output[0].item;
  // await com.getProperties(selectMinutes, ["l2_related_failure"]);

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
    objects: com.getObject(preRevItem[0].props.items_tag.dbValues),
    attributes: {
      l2_related_failure: {
        stringVec: deletedUIDArr,
      },
    },
  };
  await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesParam);
  preRevItem[0].props.l2_related_failure = deletedUIDArr;

  for (let row of appCtxService.ctx.checklist.grid.getData()) {
    appCtxService.ctx.checklist.grid.removeRowClassName(row.rowKey, 'select');
  }

  msg.show(0, `${selectFailure.length}개의 고장이 제거되었습니다.`);
}

export async function highlightTuiGrid() {
  let data = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes'));
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

export async function removeHighlight() {
  for (let row of appCtxService.ctx.checklist.grid.getData()) {
    appCtxService.ctx.checklist.grid.removeRowClassName(row.rowKey, 'select');
  }
}

export async function createshowAllMinutes(ctx, data) {
  console.log('전체 회의록 생성');
  let topObjRev = ctx.checklist.target;

  try {
    await com.getProperties(topObjRev, ['L2_MinutesRelation']);
  } catch (err) {
    //console.log(err);
    notySvc.showError('아이템 속성 불러오기 실패');
  }

  let minutesName = data.object_name.uiValue;
  let minutesDate = `${data.l2_meeting_date.dateApi.dateValue} ${data.l2_meeting_date.dateApi.timeValue}`;
  let minutesPlace = data.l2_meeting_place.uiValue;
  let minutesParticipants = data.l2_meeting_participants.uiValue;
  let minutesSubjects = data.l2_meeting_agenda.uiValue;
  let minutesDetail = data.l2_meeting_details.uiValue;
  let minutesSchedule = data.l2_meeting_related_schedule.uiValue;
  let actionItemName = $('#commentSummernote').summernote('code');
  actionItemName = actionItemName.replaceAll('<p>', '');
  actionItemName = actionItemName.replaceAll('</p>', '');
  let actionItemFollowUp = $('#followUpSummernote').summernote('code');
  actionItemFollowUp = actionItemFollowUp.replaceAll('<p>', '');
  actionItemFollowUp = actionItemFollowUp.replaceAll('</p>', '');
  let actionItemRemark = $('#remarkSummernote').summernote('code');
  actionItemRemark = actionItemRemark.replaceAll('<p>', '');
  actionItemRemark = actionItemRemark.replaceAll('</p>', '');
  let actionWorker = data.l2_workerTxt.uiValue;
  let actionDate = `${data.l2_expected_date.dateApi.dateValue} ${data.l2_expected_date.dateApi.timeValue}`;

  minutesDate = L2_StandardBOMService.dateTo_GMTString(minutesDate);
  actionDate = L2_StandardBOMService.dateTo_GMTString(actionDate);

  try {
    if (minutesName == null || minutesName == undefined || minutesName == '') {
      // const createItemNameNoty = locale.getLocalizedText("lgepSpecManagementMessages", "createItemNameNoty");
      msg.show(0, '회의록 제목을 입력해 주세요.');
    } else {
      let createMinutesItem = await com.createItem('', 'L2_Minutes', minutesName, minutesSchedule, '');
      let createdItem = createMinutesItem.output[0].item;

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
        'L2_ActionItemRelation',
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
      let minutesArr = [];
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

      minutesArr = minutesArr.flat();
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
      const fileInput = document.getElementById('showAllCreateFileUpload');
      console.log(createdItem);
      try {
        await com.getProperties(createMinutesItem.output[0].itemRev, ['IMAN_reference']);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }
      const selectedFile = [...fileInput.files];

      let fileDataset = await lgepSummerNoteUtils.uploadFileToDataset(selectedFile);
      await lgepSummerNoteUtils.linkRelationItem(createMinutesItem.output[0].itemRev, fileDataset);

      if (actionItemName != null || actionItemName != '') {
        let createActionItem = await com.createItem('', 'L2_ActionItem', actionItemName, '', '');
        let createdActionItem = createActionItem.output[0].item;

        await com.getProperties(createdActionItem, [
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
              stringVec: [actionItemName],
            },
            l2_follow_up: {
              stringVec: [actionItemFollowUp],
            },
            l2_expected_date: {
              stringVec: [actionDate],
            },
            object_desc: {
              stringVec: [actionItemRemark],
            },
          },
        };

        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', ActionItemParam);

        let createActionUID = createActionItem.output[0].itemRev.uid;

        let actionItemRelationParam = {
          objects: [createdItem],
          attributes: {
            L2_ActionItemRelation: {
              stringVec: [createActionUID],
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);
      } else {
        msg.show(0, '코멘트를 입력해 주세요');
      }

      msg.show(0, `${minutesName} ${createdItemMsg}`);
      appCtxService.registerCtx('show_minutes_mode', 0);
    }
  } catch (err) {
    console.log(err);
  }
}

export async function allFileView() {
  await common.delay(200);

  const fileInput = document.querySelector('#showAllCreateFileUpload');
  console.dir({ fileInput });

  fileInput.addEventListener('change', async (e) => {
    const preview = document.querySelector('#createAllPreview');
    const selectedFile = [...fileInput.files];
    console.log(selectedFile);
    console.dir(fileInput);
    const files = Array.from(fileInput.files);
    files.forEach((file) => {
      preview.innerHTML += `
          <p id="${file.lastModified}" class='uploadFileList'>
              ${file.name}
              <button data-index='${file.lastModified}' class='file-remove'>X</button>
          </p>`;
    });
    fileArr.push(selectedFile);
    console.log(fileArr);

    document.addEventListener('click', (e) => {
      if (e.target.className !== 'file-remove') return;
      const removeTargetId = e.target.dataset.index;
      const removeTarget = document.getElementById(removeTargetId);
      const files = document.querySelector('#showAllCreateFileUpload').files;
      const dataTranster = new DataTransfer();

      Array.from(files)
        .filter((file) => file.lastModified != removeTargetId)
        .forEach((file) => {
          dataTranster.items.add(file);
        });

      document.querySelector('#showAllCreateFileUpload').files = dataTranster.files;

      removeTarget.remove();
    });
  });
}

let exports = {};

export default exports = {
  backMinutes,
  editMinutesMain,
  loadMinutes,
  sortAction,
  loadMinutesDetails,
  openCreateMinutes,
  // initialize,
  cancelMinutesMain,
  saveMinutesMain,
  deleteMinutesMain,
  showAllRevisionsMinutes,
  linkedName,
  failureLoad2,
  failureDeleteAction,
  highlightTuiGrid,
  removeHighlight,
  createshowAllMinutes,
  allFileView,
};

app.factory('showAllMinutesService', () => exports);
