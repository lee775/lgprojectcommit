import app from 'app';
import SoaService from 'soa/kernel/soaService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import msg from 'js/utils/lgepMessagingUtils';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import * as fs from 'fs';
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import browserUtils from 'js/browserUtils';
import appCtxService from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import AwPromiseService from 'js/awPromiseService';

const createMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'createMinutes');
const createdItemMsg = locale.getLocalizedText('lgepChkMinutesMessages', 'createdItem');
const noEditedData = locale.getLocalizedText('lgepChkMinutesMessages', 'noEditedData');
const editedMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'editedMinutes');
const cancelEdit = locale.getLocalizedText('lgepChkMinutesMessages', 'cancelEdit');
const deleteMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'deleteMinutes');
const deleteItem = locale.getLocalizedText('lgepChkMinutesMessages', 'delete');
const cancel = locale.getLocalizedText('lgepChkMinutesMessages', 'cancel');
const deletedMinutes = locale.getLocalizedText('lgepChkMinutesMessages', 'deletedMinutes');
const close = locale.getLocalizedText('lgepChkMinutesMessages', 'close');

var $ = require('jQuery');
let datasetUid = null;
let newFileArr = [];
let lastModifiedArr = [];
let originFileArr = [];

export async function initialize() {
  $('#DetailsSummernote').summernote({
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
  $('#DetailsSummernote').summernote('disable');
  $('#DetailsSummernote').css('background-color', 'white');
}

export async function loadData(ctx, data) {
  let selected = ctx.selected;
  try {
    let getPropertiesParam = {
      objects: [selected],
      attributes: [
        'item_id',
        'creation_date',
        'l2_meeting_agenda',
        'l2_meeting_date',
        'l2_meeting_details',
        'l2_meeting_participants',
        'l2_meeting_place',
        'l2_meeting_title',
        'l2_meeting_related_schedule',
        'l2_minutes_writer',
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let revUID = selected.props.item_id.dbValue;
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

  let titleData = preRevItem.props.object_name.uiValues[0];
  let dateData = preRevItem.props.l2_meeting_date.uiValues[0];
  let placeData = preRevItem.props.l2_meeting_place.uiValues[0];
  let writerData = ctx.selected.props.owning_user.uiValues[0];
  let participants = preRevItem.props.l2_meeting_participants.uiValues[0];
  let agendaData = preRevItem.props.l2_meeting_agenda.uiValues[0];
  let scheduleData = preRevItem.props.l2_meeting_related_schedule.uiValues[0];
  let detailsData = preRevItem.props.l2_meeting_details.uiValues[0];

  detailsData = detailsData.replaceAll('\n', '<br>');
  detailsData = detailsData.replaceAll('<pre>', '');
  detailsData = detailsData.replaceAll('</pre>', '');
  detailsData = `<pre>${detailsData}</pre>`;

  data.proceedTitle.uiValue = titleData;
  data.proceedDate.uiValue = dateData;
  data.proceedPlace.uiValue = placeData;
  data.proceedWriterLink.uiValue = writerData;
  data.proceedParticipants.uiValue = participants;
  data.proceedSubject.uiValue = agendaData;
  data.proceedDetails.uiValue = detailsData;
  data.proceedSchedule.uiValue = scheduleData;

  $('#DetailsSummernote').summernote('reset');
  $('#DetailsSummernote').summernote('code', detailsData + '<br>');

  eventBus.publish('proceedings.initialize');
}

function popupProceed() {
  // const createProceedCaption = locale.getLocalizedText("lgepSpecManagementMessages", "findRefModel");
  popupService.show({
    declView: 'popupProceed',
    locals: {
      caption: createMinutes,
    },
    options: {
      isModal: true,
      draggable: true,
      placement: 'center',
      width: '600',
      height: '800',
    },
  });
}

export async function createproceed(ctx, data) {
  console.log('회의록 생성');

  if (!appCtxService.ctx.checklist.selectedRow) {
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
    let minutesDetail = $('#createMinutesSummernote').summernote('code');
    let minutesDetailString = $('#createMinutesSummernote').summernote('code');
    minutesDetailString = minutesDetailString.replace(/<[^>]*>?/g, '');
    let minutesSchedule = data.l2_meeting_related_schedule.uiValue;

    try {
      minutesDate = L2_StandardBOMService.dateTo_GMTString(minutesDate);
    } catch (err) {
      console.log(err);
    }

    if (minutesName == null || minutesName == undefined || minutesName == '') {
      notySvc.showWarning('회의록의 제목을 입력해 주세요.');
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
        'TC_Attaches',
        'L2_ActionItemRelation',
        'l2_is_checklist_minutes',
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
            stringVec: [minutesDetailString],
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
          l2_is_checklist_minutes: {
            stringVec: ['Y'],
          },
        },
      };

      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesItemParam);

      let text = {};
      text.detail = minutesDetail;

      let setText = JSON.stringify(text);

      lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, createMinutesItem.output[0].itemRev);

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
      const fileInput = document.getElementById('createFileUpload');
      console.log(createdItem);
      try {
        await com.getProperties(createMinutesItem.output[0].itemRev, ['IMAN_reference', 'TC_Attaches']);
      } catch (err) {
        //console.log(err);
        notySvc.showError('아이템 속성 불러오기 실패');
      }
      let fileDataset = await lgepSummerNoteUtils.uploadFileToDataset(newFileArr);
      if (Array.isArray(fileDataset)) {
        for (let i = 0; i < fileDataset.length; i++) {
          var jsoObj = {
            input: [
              {
                clientId: '',
                relationType: 'TC_Attaches',
                primaryObject: createMinutesItem.output[0].itemRev,
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
              primaryObject: createMinutesItem.output[0].itemRev,
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

      msg.show(0, `${minutesName} ${createdItemMsg}`);
      appCtxService.registerCtx('show_minutes_mode', 1);
    }
  } else {
    let selectOrigin = appCtxService.ctx.checklist.selectedRow.getOriginalObject();
    try {
      await com.getProperties(selectOrigin, ['current_id_uid']);
    } catch (err) {
      //console.log(err);
      notySvc.showError('아이템 속성 불러오기 실패');
    }
    let selectUID = [selectOrigin.uid];
    let selectLoadObj = await com.loadObjects(selectUID);
    console.log('BeforeLoadOBJ', { selectLoadObj });
    let selectLoadObjRev = selectLoadObj.modelObjects[selectLoadObj.plain[0]];

    let topObjRev = ctx.checklist.target;

    try {
      await com.getProperties(selectLoadObjRev, ['L2_MinutesRelation', 'l2_related_failure']);
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
    let minutesDetail = $('#createMinutesSummernote').summernote('code');
    let minutesDetailString = $('#createMinutesSummernote').summernote('code');
    minutesDetailString = minutesDetailString.replace(/<[^>]*>?/g, '');
    let minutesSchedule = data.l2_meeting_related_schedule.uiValue;
    let failureUID = selectLoadObjRev.uid;

    minutesDate = L2_StandardBOMService.dateTo_GMTString(minutesDate);

    try {
      if (minutesName == null || minutesName == undefined || minutesName == '') {
        notySvc.showWarning('회의록의 제목을 입력해 주세요.');
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
          'TC_Attaches',
          'L2_ActionItemRelation',
          'l2_is_checklist_minutes',
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
              stringVec: [minutesDetailString],
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
            l2_related_failure: {
              stringVec: [failureUID],
            },
            l2_is_checklist_minutes: {
              stringVec: ['Y'],
            },
          },
        };

        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesItemParam);

        let text = {};
        text.detail = minutesDetail;

        let setText = JSON.stringify(text);

        lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, createMinutesItem.output[0].itemRev);

        let createUID = createMinutesItem.output[0].itemRev.uid;
        let beforeUID = selectLoadObjRev.props.L2_MinutesRelation.dbValues;
        let allbeforeUID = topObjRev.props.L2_MinutesRelation.dbValues;
        let minutesArr = [];
        let allMinutesArr = [];
        if (beforeUID.length != 0) {
          minutesArr.push(beforeUID);
          minutesArr.push(createUID);
          minutesArr = minutesArr.filter((element, index) => {
            return minutesArr.indexOf(element) === index;
          });
        } else {
          minutesArr.push(createUID);
        }

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

        let minutesRelationParam = {
          objects: [selectLoadObjRev],
          attributes: {
            L2_MinutesRelation: {
              stringVec: minutesArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesRelationParam);

        let allMinutesRelationParam = {
          objects: [topObjRev],
          attributes: {
            L2_MinutesRelation: {
              stringVec: allMinutesArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', allMinutesRelationParam);
        const fileInput = document.getElementById('createFileUpload');
        console.log(createdItem);
        try {
          await com.getProperties(createMinutesItem.output[0].itemRev, ['IMAN_reference', 'TC_Attaches']);
        } catch (err) {
          //console.log(err);
          notySvc.showError('아이템 속성 불러오기 실패');
        }
        let fileDataset = await lgepSummerNoteUtils.uploadFileToDataset(newFileArr);
        if (Array.isArray(fileDataset)) {
          for (let i = 0; i < fileDataset.length; i++) {
            var jsoObj = {
              input: [
                {
                  clientId: '',
                  relationType: 'TC_Attaches',
                  primaryObject: createMinutesItem.output[0].itemRev,
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
                primaryObject: createMinutesItem.output[0].itemRev,
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

        msg.show(0, `${minutesName} ${createdItemMsg}`);
        appCtxService.registerCtx('show_minutes_mode', 1);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

export async function fileView() {
  await common.delay(200);

  const fileInput = document.querySelector('#createFileUpload');
  const preview = document.querySelector('#createPreview');

  fileInput.addEventListener('change', async (e) => {
    const selectedFile = [...fileInput.files];
    const files = Array.from(fileInput.files);
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
    const files = document.querySelector('#createFileUpload').files;
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
    document.querySelector('#createFileUpload').files = dataTranster.files;

    removeTarget.remove();
  });
}

export async function editProceed(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let revUID = ctx.selected.props.item_id.dbValue;
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

  let titleData = preRevItem.props.object_name.uiValues[0];
  let placeData = preRevItem.props.l2_meeting_place.uiValues[0];
  let participants = preRevItem.props.l2_meeting_participants.uiValues[0];
  let agendaData = preRevItem.props.l2_meeting_agenda.uiValues[0];
  let scheduleData = preRevItem.props.l2_meeting_related_schedule.uiValues[0];

  data.titleTxt.dbValue = titleData;
  data.placeTxt.dbValue = placeData;
  data.participantsTxt.dbValue = participants;
  data.subjectTxt.dbValue = agendaData;
  data.scheduleTxt.dbValue = scheduleData;

  let detailsSummernote = vms.getViewModelUsingElement(document.getElementById('DetailsSummernote'));

  lastModifiedArr = [];
  $('#DetailsSummernote').summernote('enable');
}

export async function saveProceed(ctx, data) {
  await com.setProperties(ctx.selected, ['object_name', 'object_desc'], [data.titleTxt.dbValue, data.placeTxt.dbValue]);

  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let revUID = ctx.selected.props.item_id.dbValue;
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

  let titleData = data.titleTxt.dbValue;
  let placeData = data.placeTxt.dbValue;
  let participants = data.participantsTxt.dbValue;
  let agendaData = data.subjectTxt.dbValue;
  let scheduleData = data.scheduleTxt.dbValue;
  let modifyDetails = $('#DetailsSummernote').summernote('code');
  let detailsData = data.proceedDetails.uiValue + '<br>';

  let selectObjUID = ctx.selected.uid;

  let selectObj = await com.getObject(selectObjUID);

  let minutesParam = {
    objects: [preRevItem],
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

  let sameString;
  if (detailsData == modifyDetails) {
    sameString = true;
  } else {
    sameString = false;
  }
  // if (data.object_name.valueUpdated == false && data.placeTxt.valueUpdated == false && data.participantsTxt.valueUpdated == false && data.subjectTxt.valueUpdated == false && data.scheduleTxt.valueUpdated == false && sameString == true) {
  //     msg.show(0, noEditedData);
  // } else {
  data.proceedTitle.uiValue = titleData;
  data.proceedPlace.uiValue = placeData;
  data.proceedParticipants.uiValue = participants;
  data.proceedSubject.uiValue = agendaData;
  data.proceedSchedule.uiValue = scheduleData;
  $('#DetailsSummernote').summernote('reset');
  $('#DetailsSummernote').summernote('code', modifyDetails);
  $('#DetailsSummernote').summernote('disable');

  msg.show(0, `${data.object_name.dbValue} ${editedMinutes}`);
  // }
}

export async function cancelProceed(ctx, data) {
  if (data.editMode) {
    data.editMode = false;
  } else {
    data.editMode = true;
  }

  let selected = ctx.selected;
  try {
    let getPropertiesParam = {
      objects: [selected],
      attributes: [
        'item_id',
        'creation_date',
        'l2_meeting_agenda',
        'l2_meeting_date',
        'l2_meeting_details',
        'l2_meeting_participants',
        'l2_meeting_place',
        'l2_meeting_title',
        'l2_meeting_related_schedule',
        'l2_minutes_writer',
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let revUID = selected.props.item_id.dbValue;
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
  $('#DetailsSummernote').summernote('reset');
  $('#DetailsSummernote').summernote('code', detailsData);
  $('#DetailsSummernote').summernote('disable');
  msg.show(0, cancelEdit);
}

export async function deleteProceed(ctx, data) {
  msg.show(
    1,
    deleteMinutes,
    [deleteItem, cancel],
    async function () {
      let homeUID = ctx.user.props.home_folder.dbValue;
      let revUID = ctx.selected.cellHeader2;
      let setParentsApi = {
        infos: [
          {
            itemId: revUID,
          },
        ],
      };
      let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
      let deleteOjt = {
        objects: [revItemParant.output[0].item],
      };
      msg.show(0, `"${ctx.selected.cellHeader1}" ${deletedMinutes}`);
      await com.deleteObject(deleteOjt.objects[0]);
      window.location.href = browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?s_uid=' + homeUID;
    },
    function () {},
  );
}

export async function goUserDetail(ctx, data) {
  let a = vms.getViewModelUsingElement(document.getElementById('mainNav'));
  let revUID = a.dataProviders.minutesListProvider.selectedObjects[0].cellHeader2;
  let setParentsApi = {
    infos: [
      {
        itemId: revUID,
      },
    ],
  };
  let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
  console.log(revItemParant.output[0].item);

  let preRevItem = revItemParant.output[0].item;

  await com.getProperties(preRevItem, ['object_name', 'owning_user']);
  let userUID = preRevItem.props.owning_user.dbValues[0];
  window.location.href = browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + userUID;
}

let exports = {};

export default exports = {
  cancelProceed,
  createproceed,
  deleteProceed,
  editProceed,
  fileView,
  goUserDetail,
  initialize,
  loadData,
  popupProceed,
  saveProceed,
};

app.factory('proceedingService', () => exports);
