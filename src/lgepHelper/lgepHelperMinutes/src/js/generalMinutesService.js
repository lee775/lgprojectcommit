import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import dataManagementService from 'soa/dataManagementService';
import vms from 'js/viewModelObjectService';
import vmSer from 'js/viewModelService';
import policy from 'js/soa/kernel/propertyPolicyService';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import L2_StandardBOMService from 'js/L2_StandardBOMService';
import checklist from 'js/utils/checklistUtils';
import advancedSearchUtils from 'js/advancedSearchUtils';
import eventBus from 'js/eventBus';
import appCtxService, { ctx } from 'js/appCtxService';
import iconService from 'js/iconService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import notySvc from 'js/NotyModule';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import fmsUtils from 'js/fmsUtils';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import browserUtils from 'js/browserUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import common from 'js/utils/lgepCommonUtils';
import msg from 'js/utils/lgepMessagingUtils';
import popupService from 'js/popupService';

var $ = require('jQuery');

let firstPage = 1;
let lastPage = 1;
let nowPage = 1;
let dividePage = 5;
let showItem = 19;
let minutesListArray = [];
let AllPage = [];
let nowTableData = [];
let maxPage;

let selecAIUID;
let allMinutes;
let lastModifiedArr = [];
let modifyFileArr = [];
let originFileArr = [];
let newFileArr = [];
let searchingUser;
let resultFilterArr = [];
let dateResultArr = [];
let saveSelectMinutes;
let newTabMainData;
let filteredData = null;

const general = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'general');
const type = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'type');
const msgDelete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'delete');
const cancle = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'cancle');
const msgCreateMinutes = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgCreateMinutes');
const msgEnterComment = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEnterComment');
const msgCreateAI = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgCreateAI');
const msgEditMinutes = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEditMinutes');
const msgEditAI = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEditAI');
const msgSelectMinutesForDelete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgSelectMinutesForDelete');
const msgQuestionDeleteMintues = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgQuestionDeleteMintues');
const msgDeleteMintues = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgDeleteMintues');
const msgSelectAIForDelete = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgSelectAIForDelete');
const msgEnterWoker = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEnterWoker');
const msgQuestionDeleteAI = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgQuestionDeleteAI');
const msgDeleteAI = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgDeleteAI');
const msgSelectCheckList = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgSelectCheckList');
const msgProceedCheckList = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgProceedCheckList');
const proceed = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'proceed');
const msgFillFields = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgFillFields');
const msgEnterStartDate = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEnterStartDate');
const msgEnterEndDate = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEnterEndDate');
const msgEnterDate = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgEnterDate');
const msgNoResult = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'msgNoResult');
const details = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'details');
const detailsView = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'detailsView');
const failLoadItem = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'failLoadItem');
const minutesEdit = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'minutesEdit');
const dontEditOtherDivision = lgepLocalizationUtils.getLocalizedText('lgepKnowldegeManageMessages', 'dontEditOtherDivision');

export async function addMinutes(ctx, data) {
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let minutesName = data.minutesTitle.uiValue;
  let minutesDate = `${data.l2_meeting_date.dateApi.dateValue} ${data.l2_meeting_date.dateApi.timeValue}`;
  let minutesPlace = data.l2_meeting_place.uiValue;
  let minutesParticipants = data.l2_meeting_participants.uiValue;
  let minutesSubjects = data.l2_meeting_agenda.uiValue;
  let minutesDetail = $('#detailsMinutesSummernote').summernote('code');
  let minutesSchedule = data.l2_meeting_related_schedule.uiValue;
  let setDetail = minutesDetail.replace(/<[^>]*>?/g, '');

  minutesDate = L2_StandardBOMService.dateTo_GMTString(minutesDate);

  if (!minutesName || !minutesParticipants || !data.l2_meeting_date.dateApi.dateValue || !data.l2_meeting_date.dateApi.timeValue) {
    notySvc.showWarning(msgFillFields);
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
          stringVec: [setDetail],
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
          stringVec: ['N'],
        },
      },
    };

    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesItemParam);

    let text = {};
    text.detail = minutesDetail;
    let setText = JSON.stringify(text);

    lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, createMinutesItem.output[0].itemRev);

    try {
      await com.getProperties(createMinutesItem.output[0].itemRev, ['TC_Attaches']);
    } catch (err) {
      //console.log(err);
      notySvc.showError(failLoadItem);
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

    setPageNumber(mainData, ctx);
    lgepPopupUtils.closePopup();
    msg.show(0, `${minutesName} ${msgCreateMinutes}`);
  }
}

export async function createActionItem(ctx, data) {
  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let actionItemComment = $('#commonAddCommentSummernote').summernote('code');
  let setPropComment = $('#commonAddCommentSummernote').summernote('code');
  let actionItemFollowUp = $('#commonAddFollowUpSummernote').summernote('code');
  let setPropFollowUp = $('#commonAddFollowUpSummernote').summernote('code');
  let actionItemRemark = $('#commonAddRemarkSummernote').summernote('code');
  let setPropRemark = $('#commonAddRemarkSummernote').summernote('code');
  setPropComment = setPropComment.replaceAll('\n', '');
  setPropFollowUp = setPropFollowUp.replaceAll('\n', '');
  setPropRemark = setPropRemark.replaceAll('\n', '');
  setPropComment = setPropComment.replaceAll('</p>', '\n');
  setPropFollowUp = setPropFollowUp.replaceAll('</p>', '\n');
  setPropRemark = setPropRemark.replaceAll('</p>', '\n');
  setPropComment = setPropComment.replaceAll('<br>', '\n');
  setPropFollowUp = setPropFollowUp.replaceAll('<br>', '\n');
  setPropRemark = setPropRemark.replaceAll('<br>', '\n');
  setPropComment = setPropComment.replace(/<[^>]*>?/g, '');
  setPropFollowUp = setPropFollowUp.replace(/<[^>]*>?/g, '');
  setPropRemark = setPropRemark.replace(/<[^>]*>?/g, '');
  setPropComment = setPropComment.split('\n');
  setPropFollowUp = setPropFollowUp.split('\n');
  setPropRemark = setPropRemark.split('\n');
  setPropComment = setPropComment.filter((element) => element !== '');
  setPropFollowUp = setPropFollowUp.filter((element) => element !== '');
  setPropRemark = setPropRemark.filter((element) => element !== '');
  if (setPropComment.length > 3) {
    if (setPropComment[2] != '') {
      setPropComment = `${setPropComment[0]}\n${setPropComment[1]}\n${setPropComment[2]}...`;
    } else {
      setPropComment[1] != '' ? (setPropComment = `${setPropComment[0]}\n${setPropComment[1]}...`) : (setPropComment = `${setPropComment[0]}...`);
    }
  } else {
    for (let i = setPropComment.length - 1; i >= 0; i--) {
      if (setPropComment.length == 3) {
        setPropComment = `${setPropComment[i - 2]}\n${setPropComment[i - 1]}\n${setPropComment[i]}`;
      }
      if (setPropComment.length == 2) {
        setPropComment = `${setPropComment[i - 1]}\n${setPropComment[i]}`;
      }
      if (setPropComment.length == 1) {
        setPropComment = `${setPropComment[i]}`;
      }
    }
  }
  if (setPropFollowUp.length > 3) {
    if (setPropFollowUp[2] != '') {
      setPropFollowUp = `${setPropFollowUp[0]}\n${setPropFollowUp[1]}\n${setPropFollowUp[2]}...`;
    } else {
      setPropFollowUp[1] != '' ? (setPropFollowUp = `${setPropFollowUp[0]}\n${setPropFollowUp[1]}...`) : (setPropFollowUp = `${setPropFollowUp[0]}...`);
    }
  } else {
    for (let i = setPropFollowUp.length - 1; i >= 0; i--) {
      if (setPropFollowUp.length == 3) {
        setPropFollowUp = `${setPropFollowUp[i - 2]}\n${setPropFollowUp[i - 1]}\n${setPropFollowUp[i]}`;
      }
      if (setPropFollowUp.length == 2) {
        setPropFollowUp = `${setPropFollowUp[i - 1]}\n${setPropFollowUp[i]}`;
      }
      if (setPropFollowUp.length == 1) {
        setPropFollowUp = `${setPropFollowUp[i]}`;
      }
    }
  }
  if (setPropRemark.length > 3) {
    if (setPropRemark[2] != '') {
      setPropRemark = `${setPropRemark[0]}\n${setPropRemark[1]}\n${setPropRemark[2]}...`;
    } else {
      setPropRemark[1] != '' ? (setPropRemark = `${setPropRemark[0]}\n${setPropRemark[1]}...`) : (setPropRemark = `${setPropRemark[0]}...`);
    }
  } else {
    for (let i = setPropRemark.length - 1; i >= 0; i--) {
      if (setPropRemark.length == 3) {
        setPropRemark = `${setPropRemark[i - 2]}\n${setPropRemark[i - 1]}\n${setPropRemark[i]}`;
      }
      if (setPropRemark.length == 2) {
        setPropRemark = `${setPropRemark[i - 1]}\n${setPropRemark[i]}`;
      }
      if (setPropRemark.length == 1) {
        setPropRemark = `${setPropRemark[i]}`;
      }
    }
  }
  let AITitle;
  let AIRemark;
  if (setPropComment.length > 32) {
    AITitle = setPropComment.slice(0, 32);
  } else {
    AITitle = setPropComment;
  }
  if (setPropRemark.length > 64) {
    AIRemark = setPropRemark.slice(0, 64);
  } else {
    AIRemark = setPropRemark;
  }
  console.log(AITitle);
  let actionWorker;
  let actionDate = `${data.l2_expected_date.dateApi.dateValue}`;

  for (let user of searchingUser) {
    if (data.l2_worker.dbValue == user.props.owning_user.dbValues[0]) {
      actionWorker = user;
    }
  }

  actionDate = L2_StandardBOMService.dateTo_GMTString(actionDate);
  let selectedMinutes = homeData.dataProviders.generalMinutesListProvider.selectedObjects[0];
  let selectedMinutesItem = await com.loadObjects([selectedMinutes.props.items_tag.dbValue]);
  selectedMinutesItem = selectedMinutesItem.modelObjects[selectedMinutesItem.plain[0]];

  if (actionItemComment == null || actionItemComment == '<p><br></p>') {
    msg.show(1, msgEnterComment);
  } else if (actionWorker == undefined || actionWorker == null || actionWorker == '') {
    msg.show(1, msgEnterWoker);
  } else {
    let createActionItem = await com.createItem('', 'L2_ActionItem', AITitle, '', '');
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
          stringVec: [AIRemark],
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

    let setText = JSON.stringify(text);

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

    // eventBus.publish('commonMinutesTable.plTable.clientRefresh');
    // eventBus.publish('commonMinutesTable.plTable.updated', {
    //   updatedObjects: homeData.dataProviders.generalMinutesListProvider.selectedObjects,
    // });
    msg.show(0, msgCreateAI);
    lgepPopupUtils.closePopup();
    // homeData.dataProviders.actionItemTableProvider.viewModelCollection.setViewModelObjects(createActionItem.output[0].itemRev);
    // await common.delay(500);
    // await loadActionItem(ctx, homeData);
    eventBus.publish('actionItemTable.plTable.reload');
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

export async function editFileView() {
  await common.delay(200);

  const fileInput = document.querySelector('#editFileUpload');
  const preview = document.querySelector('#editPreview');

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
    const files = document.querySelector('#editFileUpload').files;
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
    document.querySelector('#editFileUpload').files = dataTranster.files;

    removeTarget.remove();
  });
}

export async function editMinutes(ctx, data) {
  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let selectedTableMinutes = homeData.dataProviders.generalMinutesListProvider.selectedObjects[0];

  let revUID = homeData.dataProviders.generalMinutesListProvider.selectedObjects[0].cellHeader2;
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

  let titleData = data.minutesTitle.dbValue;
  let placeData = data.l2_meeting_place.dbValue;
  let participants = data.l2_meeting_participants.dbValue;
  let dateValue = data.l2_meeting_date.dateApi.dateValue;
  let timeValue = data.l2_meeting_date.dateApi.timeValue;
  let dateData = `${dateValue}T${timeValue}+0900`;
  let agendaData = data.l2_meeting_agenda.dbValue;
  let scheduleData = data.l2_meeting_related_schedule.dbValue;
  let modifyDetails = $('#editMinutesSummernote').summernote('code');
  let pureDetails = modifyDetails.replace(/<[^>]*>?/g, '');

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
        stringVec: [pureDetails],
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

  let datesetUID = selectedTableMinutes.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  text.detail = modifyDetails;

  let setText = JSON.stringify(text);

  await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, selectedTableMinutes);

  const preview = document.querySelector('#editPreview');
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

  lgepPopupUtils.closePopup();

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

  homeData.datasetLink.dbValue = [];
  for (let i = 0; i < resultFileArr.length; i++) {
    homeData.datasetLink.dbValue.push({
      displayName: datasetLinkArr[i],
      isRequired: 'false',
      uiValue: datasetLinkArr[i],
      isNull: 'false',
      uid: datasetLinkUIDArr[i],
    });
  }
  originFileArr = [];
  lastModifiedArr = [];

  await setPageNumber(homeData, ctx);
  let mainTable = homeData.dataProviders.generalMinutesListProvider.viewModelCollection.loadedVMObjects;

  for (let item of mainTable) {
    if (selectedTableMinutes.uid == item.uid) {
      homeData.dataProviders.generalMinutesListProvider.selectionModel.setSelection(item);
    }
  }

  console.log(preRevItem);

  msg.show(0, msgEditMinutes);
}

export async function saveActionItem(ctx, data) {
  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let selectActionItem = homeData.dataProviders.actionItemTableProvider.selectedObjects[0];

  let workerData = data.l2_worker.dbValue;
  let lblWorkerData = data.l2_worker.uiValue;
  let DateData = data.l2_expected_date.dateApi.dateValue;
  DateData = L2_StandardBOMService.dateTo_GMTString(DateData);
  let lblDate = DateData.split('T');
  lblDate = lblDate[0];
  let modifyComment = $('#commonEditCommentSummernote').summernote('code');
  let modifyFollowUp = $('#commonEditFollowUpSummernote').summernote('code');

  let setPropComment = $('#commonEditCommentSummernote').summernote('code');
  let setPropFollowUp = $('#commonEditFollowUpSummernote').summernote('code');
  // \<br[^>]*>?
  setPropComment = setPropComment.replaceAll('\n', '');
  setPropFollowUp = setPropFollowUp.replaceAll('\n', '');
  setPropComment = setPropComment.replaceAll('</p>', '\n');
  setPropFollowUp = setPropFollowUp.replaceAll('</p>', '\n');
  setPropComment = setPropComment.replaceAll('<br>', '\n');
  setPropFollowUp = setPropFollowUp.replaceAll('<br>', '\n');
  setPropComment = setPropComment.replace(/<[^>]*>?/g, '');
  setPropFollowUp = setPropFollowUp.replace(/<[^>]*>?/g, '');
  setPropComment = setPropComment.split('\n');
  setPropFollowUp = setPropFollowUp.split('\n');
  setPropComment = setPropComment.filter((element) => element !== '');
  setPropFollowUp = setPropFollowUp.filter((element) => element !== '');
  if (setPropComment.length > 3) {
    if (setPropComment[2] != '') {
      setPropComment = `${setPropComment[0]}\n${setPropComment[1]}\n${setPropComment[2]}...`;
    } else {
      setPropComment[1] != '' ? (setPropComment = `${setPropComment[0]}\n${setPropComment[1]}...`) : (setPropComment = `${setPropComment[0]}...`);
    }
  } else {
    for (let i = setPropComment.length - 1; i >= 0; i--) {
      if (setPropComment.length == 3) {
        setPropComment = `${setPropComment[i - 2]}\n${setPropComment[i - 1]}\n${setPropComment[i]}`;
      }
      if (setPropComment.length == 2) {
        setPropComment = `${setPropComment[i - 1]}\n${setPropComment[i]}`;
      }
      if (setPropComment.length == 1) {
        setPropComment = `${setPropComment[i]}`;
      }
    }
  }
  if (setPropFollowUp.length > 3) {
    if (setPropFollowUp[2] != '') {
      setPropFollowUp = `${setPropFollowUp[0]}\n${setPropFollowUp[1]}\n${setPropFollowUp[2]}...`;
    } else {
      setPropFollowUp[1] != '' ? (setPropFollowUp = `${setPropFollowUp[0]}\n${setPropFollowUp[1]}...`) : (setPropFollowUp = `${setPropFollowUp[0]}...`);
    }
  } else {
    for (let i = setPropFollowUp.length - 1; i >= 0; i--) {
      if (setPropFollowUp.length == 3) {
        setPropFollowUp = `${setPropFollowUp[i - 2]}\n${setPropFollowUp[i - 1]}\n${setPropFollowUp[i]}`;
      }
      if (setPropFollowUp.length == 2) {
        setPropFollowUp = `${setPropFollowUp[i - 1]}\n${setPropFollowUp[i]}`;
      }
      if (setPropFollowUp.length == 1) {
        setPropFollowUp = `${setPropFollowUp[i]}`;
      }
    }
  }

  let datesetUID = selectActionItem.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  text.comment = modifyComment;
  text.followUp = modifyFollowUp;

  let setText = JSON.stringify(text);

  await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, selectActionItem);

  let actionItemRevID = selectActionItem.cellHeader2;

  let setParentsApi = {
    infos: [
      {
        itemId: actionItemRevID,
      },
    ],
  };
  let actionItemObj = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
  let actionItem = actionItemObj.output[0].item;

  let originUser;
  let originUserUID;

  for (let user of searchingUser) {
    if (data.l2_worker.uiValue == user.props.owning_user.uiValues[0]) {
      originUserUID = user.uid;
      originUser = user.props.owning_user.uiValues[0];
    }
  }

  let actionItemParam = {
    objects: [actionItem],
    attributes: {
      l2_worker: {
        stringVec: [originUserUID],
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
  let dateForLabel = DateData.split('T');
  dateForLabel = dateForLabel[0];

  eventBus.publish('actionItemTable.plTable.reload');
  homeData.workerLink.uiValue = originUser;
  homeData.l2_expected_dateLbl.uiValue = dateForLabel;
  $('#commonCommentSummernote').summernote('reset');
  $('#commonCommentSummernote').summernote('code', modifyComment + '<br>');
  $('#commonFollowUpSummernote').summernote('reset');
  $('#commonFollowUpSummernote').summernote('code', modifyFollowUp + '<br>');
  msg.show(0, msgEditAI);
}

export async function deleteMinutes(ctx, data) {
  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  if (homeData.dataProviders.generalMinutesListProvider.selectedObjects.length == 0) {
    msg.show(1, msgSelectMinutesForDelete);
  } else {
    msg.show(
      1,
      msgQuestionDeleteMintues,
      [msgDelete, cancle],
      async function () {
        let selectMinutes = homeData.dataProviders.generalMinutesListProvider.selectedObjects[0];
        let minutesRevID = selectMinutes.cellHeader2;
        // let actionItemRevID = selectActionItem.cellHeader2;
        let setMintuesParentsApi = {
          infos: [
            {
              itemId: minutesRevID,
            },
          ],
        };
        let minutesObj = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setMintuesParentsApi);
        let selectMinutesParent = minutesObj.output[0].item;
        let AIArr = [];
        let afterRelationArr = [];

        let actionItemRelationParam = {
          objects: [selectMinutesParent],
          attributes: {
            L2_ActionItemRelation: {
              stringVec: afterRelationArr,
            },
          },
        };

        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);

        // 액션아이템 지우기
        if (selectMinutesParent.props.L2_ActionItemRelation.dbValues.length != 0) {
          let AIRelationArr = selectMinutesParent.props.L2_ActionItemRelation.dbValues;
          for (let arr of AIRelationArr) {
            AIArr.push(await com.loadObjects([arr]));
          }
          for (let arr of AIArr) {
            AIArr = [];
            AIArr.push(arr.modelObjects[arr.modelObjects[arr.plain[0]].props.items_tag.dbValues[0]]);
          }
          for (let delAI of AIArr) {
            let deleteAIOjt = {
              objects: [delAI],
            };
            await com.deleteObject(deleteAIOjt.objects[0]);
          }
        }

        // 첨부파일 지우기
        if (selectMinutes.props.TC_Attaches.dbValues.length != 0) {
          let datasetRelation = await com.getObject(selectMinutes.props.TC_Attaches.dbValues);

          for (let i = 0; i < datasetRelation.length; i++) {
            let param = {
              input: [
                {
                  clientId: '',
                  relationType: 'TC_Attaches',
                  primaryObject: selectMinutes,
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

        let deleteMinutesOjt = {
          objects: [selectMinutesParent],
        };
        await com.deleteObject(deleteMinutesOjt.objects[0]);

        // eventBus.publish('commonMinutesTable.plTable.reload');
        msg.show(0, msgDeleteMintues);
        await setPageNumber(homeData, ctx);
        homeData.dataProviders.generalMinutesListProvider.selectedObjects = [];
      },
      function () {},
    );
  }
}

export async function deleteActionItem(ctx, data) {
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  if (mainData.dataProviders.actionItemTableProvider.selectedObjects.length == 0) {
    msg.show(1, msgSelectAIForDelete);
  } else {
    msg.show(
      1,
      msgQuestionDeleteAI,
      [msgDelete, cancle],
      async function () {
        let selectMinutes = mainData.dataProviders.generalMinutesListProvider.selectedObjects[0];
        let selectActionItem = mainData.dataProviders.actionItemTableProvider.selectedObjects[0];
        let minutesRevID = selectMinutes.cellHeader2;
        let actionItemRevID = selectActionItem.cellHeader2;

        let setMintuesParentsApi = {
          infos: [
            {
              itemId: minutesRevID,
            },
          ],
        };
        let setAIParentsApi = {
          infos: [
            {
              itemId: actionItemRevID,
            },
          ],
        };
        let minutesObj = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setMintuesParentsApi);
        let actionItemObj = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setAIParentsApi);
        let selectMinutesParent = minutesObj.output[0].item;
        let selectActionItemParent = actionItemObj.output[0].item;
        let AIRelationArr = selectMinutesParent.props.L2_ActionItemRelation.dbValues;
        let afterRelationArr;

        for (let i = 0; i < AIRelationArr.length; i++) {
          if (selectActionItem.uid == AIRelationArr[i]) {
            afterRelationArr = AIRelationArr.filter((element) => element !== selectActionItem.uid);
          }
        }

        let actionItemRelationParam = {
          objects: [selectMinutesParent],
          attributes: {
            L2_ActionItemRelation: {
              stringVec: afterRelationArr,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', actionItemRelationParam);

        let deleteAIOjt = {
          objects: [selectActionItemParent],
        };
        await com.deleteObject(deleteAIOjt.objects[0]);

        eventBus.publish('actionItemTable.plTable.reload');
        eventBus.publish('commonMinutesTable.plTable.clientRefresh');
        mainData.workerLink.uiValue = '';
        mainData.l2_expected_dateLbl.uiValue = '';
        $('#commonCommentSummernote').summernote('reset');
        $('#commonFollowUpSummernote').summernote('reset');
        msg.show(0, msgDeleteAI);
      },
      function () {},
    );
  }
}

export async function initialize() {
  await common.delay(200);

  $('#commonMinutesSummernote').summernote({
    height: 295,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#commonMinutesSummernote').summernote('disable');
  $('#commonMinutesSummernote').css('background-color', 'white');
  newTabMainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  ctx.mainData = newTabMainData;
}

export async function initializeAddPopup(data) {
  await common.delay(200);

  $('#detailsMinutesSummernote').summernote({
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
  $('#detailsMinutesSummernote').summernote('enable');
  $('#detailsMinutesSummernote').css('background-color', 'white');
}

export async function initDate(data) {
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
  data.l2_meeting_date.dateApi.timeValue = initTime;
}

export async function initializeActionItemEditPopup(data) {
  await common.delay(200);

  $('#commonEditCommentSummernote').summernote({
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
  $('#commonEditCommentSummernote').summernote('enable');
  $('#commonEditCommentSummernote').css('background-color', 'white');

  $('#commonEditFollowUpSummernote').summernote({
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
  $('#commonEditFollowUpSummernote').summernote('enable');
  $('#commonEditFollowUpSummernote').css('background-color', 'white');

  $('#commonEditRemarkSummernote').summernote({
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
  $('#commonEditRemarkSummernote').summernote('enable');
  $('#commonEditRemarkSummernote').css('background-color', 'white');

  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let selectActionItem = homeData.dataProviders.actionItemTableProvider.selectedObjects[0];

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

  let originUser;

  for (let user of searchingUser) {
    if (selectActionItem.props.l2_worker.dbValue == user.props.object_name.dbValues[0]) {
      originUser = user.props.owning_user.uiValues[0];
    }
  }

  data.l2_expected_date.dateApi.dateValue = selectActionItem.props.l2_expected_date.dbValue;

  for (let user of searchingUser) {
    data.l2_workerValues.dbValue.push({
      propDisplayValue: user.props.l2_user_id.dbValues[0],
      propInternalValue: user.props.owning_user.dbValues[0],
    });
    if (homeData.dataProviders.actionItemTableProvider.selectedObjects[0].props.l2_worker.dbValue == user.uid) {
      data.l2_worker.dbValue = user.props.owning_user.dbValues[0];
      data.l2_worker.dbValues[0] = user.props.owning_user.dbValues[0];
      data.l2_worker.uiValue = user.props.l2_user_id.dbValues[0];
      data.l2_worker.uiValues[0] = user.props.l2_user_id.dbValues[0];
    }
  }

  await com.getProperties(selectActionItem, ['IMAN_specification']);

  let datesetUID = selectActionItem.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  $('#commonEditCommentSummernote').summernote('code', text.comment + '<br>');
  $('#commonEditFollowUpSummernote').summernote('code', text.followUp + '<br>');
  $('#commonEditRemarkSummernote').summernote('code', text.remark + '<br>');

  // await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, selectActionItem);
}

export async function initializeActionItemNewTab(data) {
  $('#newTabCommentDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#newTabCommentDetailsSummernote').summernote('disable');
  $('#newTabCommentDetailsSummernote').css('background-color', 'white');

  $('#newTabFollowUpDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#newTabFollowUpDetailsSummernote').summernote('disable');
  $('#newTabFollowUpDetailsSummernote').css('background-color', 'white');

  $('#newTabRemarkDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#newTabRemarkDetailsSummernote').summernote('disable');
  $('#newTabRemarkDetailsSummernote').css('background-color', 'white');

  eventBus.publish('newTab.initComplete');
  // await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, selectActionItem);
}

export async function inputDataNewTab(data) {
  await common.delay(500);

  let selectedActionItem = JSON.parse(localStorage.getItem('selectedActionItem'));

  let worker_data = selectedActionItem.props.l2_worker.uiValue;
  let expectedDate_data = selectedActionItem.props.l2_expected_date.uiValue;

  data.workerLink.dbValue = worker_data;
  data.workerLink.uiValue = worker_data;
  data.l2_expected_dateLbl.dbValue = expectedDate_data;
  data.l2_expected_dateLbl.uiValue = expectedDate_data;

  let parentAI = await com.loadObject(selectedActionItem.props.items_tag.dbValue);
  await com.getProperties(parentAI.modelObjects[parentAI.plain[0]], ['l2_worker']);
  selecAIUID = parentAI.modelObjects[parentAI.plain[0]].props.l2_worker.dbValues[0];

  let text = JSON.parse(localStorage.getItem('text'));

  $('#newTabCommentDetailsSummernote').summernote('code', text.comment + '<br>');
  $('#newTabFollowUpDetailsSummernote').summernote('code', text.followUp + '<br>');
  $('#newTabRemarkDetailsSummernote').summernote('code', text.remark + '<br>');
}

export async function initializeActionItemViewPopup(data) {
  await common.delay(200);

  $('#commonEditCommentDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#commonEditCommentDetailsSummernote').summernote('disable');
  $('#commonEditCommentDetailsSummernote').css('background-color', 'white');

  $('#commonEditFollowUpDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#commonEditFollowUpDetailsSummernote').summernote('disable');
  $('#commonEditFollowUpDetailsSummernote').css('background-color', 'white');

  $('#commonEditRemarkDetailsSummernote').summernote({
    height: 350,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
  });
  $('#commonEditRemarkDetailsSummernote').summernote('disable');
  $('#commonEditRemarkDetailsSummernote').css('background-color', 'white');

  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let selectActionItem = homeData.dataProviders.actionItemTableProvider.selectedObjects[0];
  await com.getProperties(selectActionItem, ['IMAN_specification', 'owning_user', 'l2_expected_date', 'items_tag']);

  let originOser = com.getObject(selectActionItem.props.l2_worker.dbValue);
  console.log(originOser);
  let worker_data = originOser.props.owning_user.uiValues[0];
  let expectedDate_data = selectActionItem.props.l2_expected_date.uiValue;

  data.workerLink.dbValue = worker_data;
  data.workerLink.uiValue = worker_data;
  data.l2_expected_dateLbl.dbValue = expectedDate_data;
  data.l2_expected_dateLbl.uiValue = expectedDate_data;

  let parentAI = await com.loadObject(selectActionItem.props.items_tag.dbValue);
  selecAIUID = parentAI.modelObjects[parentAI.plain[0]].props.l2_worker.dbValues[0];

  await com.getProperties(selectActionItem, ['IMAN_specification']);

  let datesetUID = selectActionItem.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  $('#commonEditCommentDetailsSummernote').summernote('code', text.comment + '<br>');
  $('#commonEditFollowUpDetailsSummernote').summernote('code', text.followUp + '<br>');
  $('#commonEditRemarkDetailsSummernote').summernote('code', text.remark + '<br>');

  // await lgepSummerNoteUtils.txtFileToDatasetNoDelete(setText, selectActionItem);
}

export async function initializeActionItemAddPopup(data) {
  await common.delay(200);

  $('#commonAddCommentSummernote').summernote({
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
  $('#commonAddCommentSummernote').summernote('enable');
  $('#commonAddCommentSummernote').css('background-color', 'white');

  $('#commonAddFollowUpSummernote').summernote({
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
  $('#commonAddFollowUpSummernote').summernote('enable');
  $('#commonAddFollowUpSummernote').css('background-color', 'white');

  $('#commonAddRemarkSummernote').summernote({
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
  $('#commonAddRemarkSummernote').summernote('enable');
  $('#commonAddRemarkSummernote').css('background-color', 'white');

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

  for (let user of searchingUser) {
    data.l2_workerValues.dbValue.push({
      propDisplayValue: user.props.l2_user_id.dbValues[0],
      propInternalValue: user.props.owning_user.dbValues[0],
    });
  }
}

export async function initializeEditPopup(data) {
  await common.delay(200);

  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let selectData = homeData.dataProviders.generalMinutesListProvider.selectedObjects[0];

  let dateData = selectData.props.l2_meeting_date.dbValue.uiValues[0];
  dateData = dateData.split(' ');

  let minutesTitle = selectData.props.object_name2.uiValue;
  let minutesDate = dateData[0];
  let minutesTime = `${dateData[1]}:00`;
  let minutesPlace = selectData.props.l2_meeting_place.dbValue.uiValues[0];
  let minutesParticipants = selectData.props.l2_meeting_participants.dbValue.uiValues[0];
  let minutesAgenda = selectData.props.l2_meeting_agenda.dbValue.uiValues[0];
  let minutesSchedule = selectData.props.l2_meeting_related_schedule.dbValue.uiValues[0];

  data.minutesTitle.dbValue = minutesTitle;
  data.l2_meeting_date.dateApi.dateValue = minutesDate;
  data.l2_meeting_date.dateApi.timeValue = minutesTime;
  data.l2_meeting_place.dbValue = minutesPlace;
  data.l2_meeting_participants.dbValue = minutesParticipants;
  data.l2_meeting_agenda.dbValue = minutesAgenda;
  data.l2_meeting_related_schedule.dbValue = minutesSchedule;

  $('#editMinutesSummernote').summernote({
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
  $('#editMinutesSummernote').summernote('enable');
  $('#editMinutesSummernote').css('background-color', 'white');

  if (selectData.props.IMAN_specification.dbValues.length != 0) {
    let datesetUID = selectData.props.IMAN_specification.dbValues[0];
    let text = await checklist.readPropertiesFromTextFile(datesetUID);

    $('#editMinutesSummernote').summernote('code', text.detail + '<br>');
  } else {
    $('#commonMinutesSummernote').summernote('reset');
  }

  const preview = document.querySelector('#editPreview');

  let savedFileUID = selectData.props.TC_Attaches.dbValue;
  let savedFileName = selectData.props.TC_Attaches.uiValues;
  for (let i = 0; i < savedFileName.length; i++) {
    originFileArr.push(savedFileUID[i]);
    preview.innerHTML += `
            <p id="${savedFileUID[i]}" class='uploadFileList'>
                ${savedFileName[i]}
                <button data-index='${savedFileUID[i]}' class='file-remove'>X</button>
            </p>`;
  }
}

export async function loadGeneralMinutes(ctx, data) {
  let minutesRevVMResult = [];
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let loaded;
  if (!data) {
    loaded = mainData.dataProviders.generalMinutesListProvider.viewModelCollection.loadedVMObjects;
  } else {
    loaded = data.dataProviders.generalMinutesListProvider.viewModelCollection.loadedVMObjects;
  }
  for (let item of loaded) {
    minutesRevVMResult.push(item);
  }

  return {
    generalMinutes: minutesRevVMResult,
    generalMinutesLength: minutesRevVMResult.length,
  };
}

function sortAction(response, startIndex, pageSize) {
  let countries = response.generalMinutes;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;

    let minutesResults = countries.slice(startIndex, endIndex);

    return minutesResults;
  }
}

export async function loadActionItem(ctx, data) {
  let selectMinutes = data.dataProviders.generalMinutesListProvider.selectedObjects[0];
  let minutesItemUID = selectMinutes.props.items_tag.dbValue;
  let minutesItem = await com.loadObject(minutesItemUID);
  minutesItem = minutesItem.modelObjects[minutesItem.plain[0]];
  let actionItemUIDInMinutes = minutesItem.props.L2_ActionItemRelation.dbValues;
  let actionItemRevInMinutes = [];
  for (let i = 0; i < actionItemUIDInMinutes.length; i++) {
    let loadAI = await com.loadObject(actionItemUIDInMinutes[i]);
    actionItemRevInMinutes.push(loadAI.modelObjects[loadAI.plain[0]]);
  }

  let actionItem = [];
  let actionItemRevVMProceed = [];
  let actionItemRevVMResult = [];
  for (let i = 0; i < actionItemRevInMinutes.length; i++) {
    actionItem.push(com.getObject(actionItemRevInMinutes[i].props.items_tag.dbValues[0]));
    await com.getProperties(actionItem[i], [
      'creation_date',
      'l2_number',
      'l2_comment',
      'l2_follow_up',
      'l2_worker',
      'l2_expected_date',
      'l2_finish_date',
      'l2_state',
    ]);
  }
  for (let i = 0; i < actionItemRevInMinutes.length; i++) {
    actionItemRevVMProceed.push(vms.constructViewModelObjectFromModelObject(actionItemRevInMinutes[i]));

    actionItemRevVMProceed[i].props['creation_date'] = makeVmProperty('creation_date', actionItem[i].props.creation_date.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_number'] = makeVmProperty('l2_number', actionItem[i].props.l2_number.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_comment'] = makeVmProperty('l2_comment', actionItem[i].props.l2_comment.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_follow_up'] = makeVmProperty('l2_follow_up', actionItem[i].props.l2_follow_up.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_worker'] = {
      dbValue: actionItem[i].props.l2_worker.dbValues[0],
      uiValue: actionItem[i].props.l2_worker.uiValues[0],
    };
    actionItemRevVMProceed[i].props['l2_expected_date'] = makeVmProperty('l2_expected_date', actionItem[i].props.l2_expected_date.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_finish_date'] = makeVmProperty('l2_finish_date', actionItem[i].props.l2_finish_date.uiValues[0]);
    actionItemRevVMProceed[i].props['l2_state'] = makeVmProperty('l2_state', actionItem[i].props.l2_state.uiValues[0]);

    actionItemRevVMResult.push(actionItemRevVMProceed[i]);
  }
  actionItemRevVMResult.sort((a, b) => new Date(b.props.l2_expected_date.dbValue) - new Date(a.props.l2_expected_date.dbValue));

  $('#commonCommentSummernote').summernote({
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
  $('#commonCommentSummernote').summernote('disable');
  $('#commonCommentSummernote').css('background-color', 'white');

  $('#commonFollowUpSummernote').summernote({
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
  $('#commonFollowUpSummernote').summernote('disable');
  $('#commonFollowUpSummernote').css('background-color', 'white');

  data.workerLink.uiValue = '';
  data.l2_expected_dateLbl.uiValue = '';
  $('#commonCommentSummernote').summernote('reset');
  $('#commonFollowUpSummernote').summernote('reset');

  return {
    actionItem: actionItemRevVMResult,
    actionItemLength: actionItemRevVMResult.length,
  };
}

function tableRefresh() {
  eventBus.publish('actionItemTable.plTable.reload');
}

function minutesTableRefresh() {
  eventBus.publish('commonMinutesTable.plTable.reload');
}

function sortActionItem(response, startIndex, pageSize) {
  let countries = response.actionItem;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;

    let minutesResults = countries.slice(startIndex, endIndex);

    return minutesResults;
  }
}
async function setPageNumber(data, ctx) {
  lgepLoadingUtils.openWindow();
  let AllListArrayPage;
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
      maxToLoad: 10000,
      maxToReturn: 10000,
      providerName: 'Awp0SavedQuerySearchProvider',
      searchCriteria: {
        Name: '*',
        queryUID: 'Q0hJ_1nr5p7XAC',
        searchID: advancedSearchUtils.getSearchId('Q0hJ_1nr5p7XAC'),
        typeOfSearch: 'ADVANCED_SEARCH',
        utcOffset: '540',
        lastEndIndex: '',
        totalObjectsFoundReportedToClient: '',
        Type: 'L2_Minutes',
      },
      searchFilterFieldSortType: 'Priority',
      startIndex: 0,
      searchFilterMap6: {},
      searchSortCriteria: [
        {
          fieldName: 'creation_date',
          sortDirection: 'DESC',
        },
      ],
      attributesToInflate: [
        'object_name',
        'object_type',
        'owning_user',
        'last_mod_user',
        'last_mod_date',
        'object_desc',
        'release_status_list',
        'item_revision_id',
        'creation_date',
        'owning_user',
        'item_id',
        'items_tag',
        'owning_group',
        'l2_meeting_agenda',
        'l2_meeting_date',
        'l2_meeting_details',
        'l2_meeting_participants',
        'l2_meeting_place',
        'l2_meeting_related_schedule',
        'l2_meeting_writer',
        'L2_ActionItemRelation',
        'l2_is_checklist_minutes',
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
  let performSearchMinutes = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);

  let performSearchResult = [];
  performSearchMinutes = performSearchMinutes.ServiceData;
  for (let i = 0; i < performSearchMinutes.plain.length; i++) {
    if (performSearchMinutes.modelObjects[performSearchMinutes.plain[i]].props.l2_is_checklist_minutes.dbValues[0] == 'N')
      performSearchResult.push(performSearchMinutes.modelObjects[performSearchMinutes.plain[i]]);
    minutesListArray.push(performSearchMinutes.modelObjects[performSearchMinutes.plain[i]]);
  }
  let minutesRevUIDArr = [];
  let minutesRevResult;
  let revListLeng;

  for (let rev of performSearchResult) {
    revListLeng = rev.props.revision_list.dbValues.length;
    minutesRevUIDArr.push(rev.props.revision_list.dbValues[revListLeng - 1]);
  }

  minutesRevResult = com.getObject(minutesRevUIDArr);
  await com.getProperties(minutesRevResult, ['IMAN_specification', 'TC_Attaches', 'revision_number', 'creation_date', 'owning_user', 'owning_group']);
  let minutesVMProceed = [];
  let minutesRevVMResult = [];
  let divisionMinutesResult = [];
  let noFilteredMinutes = [];

  for (let i = 0; i < minutesRevResult.length; i++) {
    minutesVMProceed.push(vms.constructViewModelObjectFromModelObject(minutesRevResult[i]));

    minutesVMProceed[i].props['object_name2'] = {
      dbValue: performSearchResult[i].props.object_name.dbValues[0],
      uiValue: performSearchResult[i].props.object_name.uiValues[0],
    };
    minutesVMProceed[i].props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', performSearchResult[i].props.L2_ActionItemRelation);
    minutesVMProceed[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', performSearchResult[i].props.l2_meeting_date);
    minutesVMProceed[i].props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', performSearchResult[i].props.l2_meeting_place);
    minutesVMProceed[i].props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', performSearchResult[i].props.l2_meeting_participants);
    minutesVMProceed[i].props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', performSearchResult[i].props.l2_meeting_details);
    minutesVMProceed[i].props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', performSearchResult[i].props.l2_meeting_agenda);
    minutesVMProceed[i].props['l2_meeting_related_schedule'] = makeVmProperty(
      'l2_meeting_related_schedule',
      performSearchResult[i].props.l2_meeting_related_schedule,
    );
    minutesVMProceed[i].props['l2_is_checklist_minutes'] = makeVmProperty('l2_is_checklist_minutes', performSearchResult[i].props.l2_is_checklist_minutes);

    if (minutesVMProceed[i].props.l2_is_checklist_minutes.dbValue.dbValues[0] == 'N') {
      noFilteredMinutes.push(minutesVMProceed[i]);
    }
    if (
      minutesVMProceed[i].props.l2_is_checklist_minutes.dbValue.dbValues[0] == 'N' &&
      minutesVMProceed[i].props.owning_group.uiValue == ctx.userSession.props.group_name.dbValue
    ) {
      minutesRevVMResult.push(minutesVMProceed[i]);
      nowTableData.push(minutesVMProceed[i]);
    }
  }
  minutesRevVMResult.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

  let pageResponse = [];
  let num = Math.ceil(minutesRevVMResult.length / showItem);
  maxPage = num > 15 ? 10 : 5;
  for (let i = 1; i <= num; i++) {
    if (i == 1) {
      pageResponse.push({
        chipType: 'SELECTION',
        labelDisplayName: String(i),
        selected: true,
      });
    } else {
      pageResponse.push({
        chipType: 'SELECTION',
        labelDisplayName: String(i),
      });
    }
  }

  AllPage = [];
  for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
  pageResponse = AllPage[0];
  AllListArrayPage = null;
  AllListArrayPage = minutesRevVMResult.slice(0, showItem);
  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

  if (pageResponse === undefined || pageResponse.length <= 1) {
    data.beforePage.uiValue = '';
    data.firstPage.uiValue = '';
    data.afterPage.uiValue = '';
    data.lastPage.uiValue = '';
  } else {
    data.afterPage.uiValue = '>';
    data.lastPage.uiValue = '≫';
  }
  allMinutes = minutesRevVMResult;
  resultFilterArr = [];
  resultFilterArr.push(noFilteredMinutes);
  lgepLoadingUtils.closeWindow();

  return {
    pageResponse: pageResponse,
    pageLength: pageResponse.length,
  };
}

function clickedPageAction(data, ctx, chip) {
  if (chip.labelDisplayName != '1') {
    data.beforePage.uiValue = '<';
    data.firstPage.uiValue = '≪';
  } else {
    data.beforePage.uiValue = '';
    data.firstPage.uiValue = '';
  }

  if (chip.labelDisplayName != AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) {
    data.afterPage.uiValue = '>';
    data.lastPage.uiValue = '≫';
  } else {
    data.afterPage.uiValue = '';
    data.lastPage.uiValue = '';
  }

  nowPage = Number(chip.labelDisplayName) * showItem - showItem;

  let AllListArrayPage = nowTableData.slice(nowPage, nowPage + showItem);
  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

  for (let chips of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    chips.selected = false;
    if (chips.labelDisplayName === chip.labelDisplayName) {
      chips.selected = true;
    }
  }
}

function firstPageAction(data, ctx) {
  for (let chip of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    if (chip.selected) {
      chip.selected = false;
      break;
    }
  }

  let AllListArrayPage = nowTableData.slice(0, showItem);
  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

  data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
  for (let page of AllPage[0]) {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
  }
  data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

  data.beforePage.uiValue = '';
  data.firstPage.uiValue = '';
  data.afterPage.uiValue = '>';
  data.lastPage.uiValue = '≫';
}

function pagingBeforeAction(data) {
  let num;
  let idx = -2;
  for (let chip of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    idx += 1;
    if (chip.selected) {
      num = Number(chip.labelDisplayName) - 1;
      chip.selected = false;
      break;
    }
  }
  if (num - 1 === 0) {
    data.beforePage.uiValue = '';
    data.firstPage.uiValue = '';
  }
  data.afterPage.uiValue = '>';
  data.lastPage.uiValue = '≫';

  if (num < data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].labelDisplayName) {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let pageList of AllPage) {
      if (num === Number(pageList[maxPage - 1].labelDisplayName)) {
        for (let page of pageList) {
          data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
        }
        break;
      }
    }
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[maxPage - 1].selected = true;
  } else {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
  }

  nowPage = num * showItem - showItem;

  let AllListArrayPage = nowTableData.slice(nowPage, nowPage + showItem);

  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
}

function pagingAfterAction(data) {
  let num;
  let idx = 0;
  for (let chip of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    idx += 1;
    if (chip.selected) {
      num = chip.labelDisplayName;
      chip.selected = false;
      break;
    }
  }
  if (Number(num) + 1 === Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName)) {
    data.afterPage.uiValue = '';
    data.lastPage.uiValue = '';
  }
  data.beforePage.uiValue = '<';
  data.firstPage.uiValue = '≪';

  if (
    num ===
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[
      data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.length - 1
    ].labelDisplayName
  ) {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let pageList of AllPage) {
      if (Number(num) + 1 === Number(pageList[0].labelDisplayName)) {
        for (let page of pageList) {
          data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
        }
        break;
      }
    }
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;
  } else {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[idx].selected = true;
  }

  nowPage = num * showItem;
  let AllListArrayPage = nowTableData.slice(nowPage, nowPage + showItem);

  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
}

function lastPageAction(data) {
  for (let chip of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    if (chip.selected) {
      chip.selected = false;
      break;
    }
  }

  nowPage = (Number(AllPage[AllPage.length - 1][AllPage[AllPage.length - 1].length - 1].labelDisplayName) - 1) * showItem;
  let AllListArrayPage = nowTableData.slice(nowPage, nowPage + showItem);
  data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

  data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
  for (let page of AllPage[AllPage.length - 1]) {
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
  }
  data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.length - 1
  ].selected = true;

  data.afterPage.uiValue = '';
  data.lastPage.uiValue = '';
  data.beforePage.uiValue = '<';
  data.firstPage.uiValue = '≪';
}

export async function loadMinutesDetails(ctx, data) {
  let selectMinutes = data.dataProviders.generalMinutesListProvider.selectedObjects[0];
  let titleData = selectMinutes.props.object_name2.uiValue;
  let dateData = selectMinutes.props.l2_meeting_date.dbValue.uiValues[0];
  let placeData = selectMinutes.props.l2_meeting_place.dbValue.uiValues[0];
  let writerData = selectMinutes.props.owning_user.uiValues[0];
  let participants = selectMinutes.props.l2_meeting_participants.dbValue.uiValues[0];
  let agendaData = selectMinutes.props.l2_meeting_agenda.dbValue.uiValues[0];
  let scheduleData = selectMinutes.props.l2_meeting_related_schedule.dbValue.uiValues[0];
  let detailsData = selectMinutes.props.l2_meeting_details.dbValue.uiValues[0];
  let fileValue = selectMinutes.props.TC_Attaches;
  let createMinutesDate = selectMinutes.props.creation_date.uiValues[0];
  // setPropComment = setPropComment.replace(/<[^>]*>?/g, '');

  data.object_nameLbl.uiValue = titleData;
  data.l2_meeting_dateLbl.uiValue = dateData;
  data.l2_meeting_placeLbl.uiValue = placeData;
  data.proceedWriterLink.uiValue = writerData;
  data.createDateLbl.uiValue = createMinutesDate;
  data.l2_meeting_participantsLbl.uiValue = participants;
  data.l2_meeting_agendaLbl.uiValue = agendaData;
  data.l2_meeting_related_scheduleLbl.uiValue = scheduleData;

  if (selectMinutes.props.IMAN_specification.dbValue.length == 0) {
    $('#commonMinutesSummernote').summernote('reset');
    $('#commonMinutesSummernote').summernote('code', '<pre>입력된 내용이 없습니다.</pre>' + '<br>');
  } else {
    let datesetUID = selectMinutes.props.IMAN_specification.dbValue[0];
    let text = await checklist.readPropertiesFromTextFile(datesetUID);

    $('#commonMinutesSummernote').summernote('reset');
    $('#commonMinutesSummernote').summernote('code', text.detail + '<br>');
  }

  let datasetLinkArr = [];
  const bar = document.querySelector('#barCSS');

  if (fileValue.uiValues.length != 0) {
    for (let i = 0; i < fileValue.uiValues.length; i++) {
      datasetLinkArr.push(fileValue.uiValues[i]);
    }

    let referenceUID = data.dataProviders.generalMinutesListProvider.selectedObjects[0].props.TC_Attaches.dbValues;
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
  } else {
    data.datasetLink.dbValue = [];
    if (!bar.innerHTML) {
      bar.innerHTML = '&nbsp;-&nbsp;';
    }
  }
}

export async function loadActionItemDetails(ctx, data) {
  let item = data.dataProviders.actionItemTableProvider.selectedObjects[0];
  await com.getProperties(item, ['IMAN_specification']);
  let itemJson = JSON.stringify(item);
  localStorage.setItem('selectedActionItem', itemJson);

  let datesetUID = item.props.IMAN_specification.dbValues[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);
  text = JSON.stringify(text);
  localStorage.setItem('text', text);
}

export async function minutesSearch(data, ctx) {
  let searchName = data.searchBox.dbValue;
  let pageResponse = [];
  if (!searchName) {
    if (!filteredData) {
      setPageNumber(data, ctx);
    } else {
      data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(filteredData);
    }
  } else {
    console.log(filteredData);
    if (!filteredData) {
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
          maxToLoad: 10000,
          maxToReturn: 10000,
          providerName: 'Awp0SavedQuerySearchProvider',
          searchCriteria: {
            Name: `*${searchName}*`,
            queryUID: 'Q0hJ_1nr5p7XAC',
            searchID: advancedSearchUtils.getSearchId('Q0hJ_1nr5p7XAC'),
            typeOfSearch: 'ADVANCED_SEARCH',
            utcOffset: '540',
            lastEndIndex: '',
            totalObjectsFoundReportedToClient: '',
            Type: 'L2_Minutes',
          },
          searchFilterFieldSortType: 'Priority',
          startIndex: 0,
          searchFilterMap6: {},
          searchSortCriteria: [
            {
              fieldName: 'creation_date',
              sortDirection: 'DESC',
            },
          ],
          attributesToInflate: [
            'object_name',
            'object_type',
            'owning_user',
            'last_mod_user',
            'last_mod_date',
            'object_desc',
            'release_status_list',
            'item_revision_id',
            'creation_date',
            'owning_user',
            'item_id',
            'items_tag',
            'owning_group',
            'l2_meeting_agenda',
            'l2_meeting_date',
            'l2_meeting_details',
            'l2_meeting_participants',
            'l2_meeting_place',
            'l2_meeting_related_schedule',
            'l2_meeting_writer',
            'L2_ActionItemRelation',
            'l2_is_checklist_minutes',
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
      let performSearchMinutes = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);

      let performSearchResult = [];
      performSearchMinutes = performSearchMinutes.ServiceData;
      for (let i = 0; i < performSearchMinutes.plain.length; i++) {
        if (performSearchMinutes.modelObjects[performSearchMinutes.plain[i]].props.l2_is_checklist_minutes.dbValues[0] == 'N')
          performSearchResult.push(performSearchMinutes.modelObjects[performSearchMinutes.plain[i]]);
        minutesListArray.push(performSearchMinutes.modelObjects[performSearchMinutes.plain[i]]);
      }
      let minutesRevUIDArr = [];
      let minutesRevResult;
      let revListLeng;

      for (let rev of performSearchResult) {
        revListLeng = rev.props.revision_list.dbValues.length;
        minutesRevUIDArr.push(rev.props.revision_list.dbValues[revListLeng - 1]);
      }

      minutesRevResult = com.getObject(minutesRevUIDArr);
      await com.getProperties(minutesRevResult, ['IMAN_specification', 'TC_Attaches', 'revision_number', 'creation_date', 'owning_user', 'owning_group']);
      let minutesVMProceed = [];
      let minutesRevVMResult = [];
      let divisionMinutesResult = [];
      let noFilteredMinutes = [];

      for (let i = 0; i < minutesRevResult.length; i++) {
        minutesVMProceed.push(vms.constructViewModelObjectFromModelObject(minutesRevResult[i]));

        minutesVMProceed[i].props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', performSearchResult[i].props.L2_ActionItemRelation);
        minutesVMProceed[i].props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', performSearchResult[i].props.l2_meeting_date);
        minutesVMProceed[i].props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', performSearchResult[i].props.l2_meeting_place);
        minutesVMProceed[i].props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', performSearchResult[i].props.l2_meeting_participants);
        minutesVMProceed[i].props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', performSearchResult[i].props.l2_meeting_details);
        minutesVMProceed[i].props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', performSearchResult[i].props.l2_meeting_agenda);
        minutesVMProceed[i].props['l2_meeting_related_schedule'] = makeVmProperty(
          'l2_meeting_related_schedule',
          performSearchResult[i].props.l2_meeting_related_schedule,
        );
        minutesVMProceed[i].props['l2_is_checklist_minutes'] = makeVmProperty('l2_is_checklist_minutes', performSearchResult[i].props.l2_is_checklist_minutes);

        if (minutesVMProceed[i].props.l2_is_checklist_minutes.dbValue.dbValues[0] == 'N') {
          noFilteredMinutes.push(minutesVMProceed[i]);
        }
        if (
          minutesVMProceed[i].props.l2_is_checklist_minutes.dbValue.dbValues[0] == 'N' &&
          minutesVMProceed[i].props.owning_group.uiValue == ctx.userSession.props.group_name.dbValue
        ) {
          minutesRevVMResult.push(minutesVMProceed[i]);
        }
      }
      minutesRevVMResult.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

      let num = Math.ceil(minutesRevVMResult.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = minutesRevVMResult.slice(0, showItem);
      data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
    } else {
      let minutesRevVMResult = [];

      for (let item of filteredData) {
        if (item.cellHeader1.includes(searchName)) {
          minutesRevVMResult.push(item);
        }
      }
      minutesRevVMResult.sort((a, b) => new Date(b.props.creation_date.dbValues[0]) - new Date(a.props.creation_date.dbValues[0]));

      let num = Math.ceil(minutesRevVMResult.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = minutesRevVMResult.slice(0, showItem);
      data.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
    }

    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
    for (let page of AllPage[0]) {
      data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
    }
    for (let chip of data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
      if (chip.selected) {
        chip.selected = false;
        break;
      }
    }
    data.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

    if (pageResponse === undefined || pageResponse.length <= 1) {
      data.beforePage.uiValue = '';
      data.firstPage.uiValue = '';
      data.afterPage.uiValue = '';
      data.lastPage.uiValue = '';
    } else {
      data.afterPage.uiValue = '>';
      data.lastPage.uiValue = '≫';
    }
  }
}

export function goUserDetailMinutes(data) {
  let userUID = data.dataProviders.generalMinutesListProvider.selectedObjects[0].props.owning_user.dbValue;
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + userUID);
}

export function goUserDetailAI(data) {
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + selecAIUID);
}

export function datasetLinkAction(data) {
  window.open(browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + data.eventData.scope.prop.uid);
}

export function checklistConnectPopup() {
  msg.show(
    1,
    msgProceedCheckList,
    [proceed, cancle],
    async function () {
      popupService.show({
        declView: 'popupConnectCheckList',
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
    },
    function () {},
  );
}

export async function checklistLoad(ctx, data) {
  console.time();
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
      maxToLoad: 1000,
      maxToReturn: 1000,
      providerName: 'Awp0SavedQuerySearchProvider',
      searchCriteria: {
        Name: '*',
        queryUID: 'Q0hJ_1nr5p7XAC',
        searchID: advancedSearchUtils.getSearchId('Q0hJ_1nr5p7XAC'),
        typeOfSearch: 'ADVANCED_SEARCH',
        utcOffset: '540',
        lastEndIndex: '',
        totalObjectsFoundReportedToClient: '',
        Type: 'L2_Structure',
        OwningGroup: ctx.userSession.props.group_name.dbValue,
      },
      searchFilterFieldSortType: 'Priority',
      startIndex: 0,
      searchFilterMap6: {
        'L2_Structure.l2_is_checklist': [
          {
            searchFilterType: 'StringFilter',
            stringValue: 'Y',
          },
        ],
      },
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
        'item_id',
        'items_tag',
        'owning_group',
        'IMAN_reference',
        'fnd0AllWorkflows',
        'l2_is_checklist',
        'l2_is_template',
        'l2_module_name',
        'l2_product_class',
        'l2_product_id',
        'l2_product_type',
        'l2_is_checklist_minutes',
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
  let performSearchChecklist = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);
  let performSearchResult = [];
  performSearchChecklist = performSearchChecklist.ServiceData;
  for (let i = 0; i < performSearchChecklist.plain.length; i++) {
    if (
      performSearchChecklist.modelObjects[performSearchChecklist.plain[i]].props.l2_is_checklist.dbValues[0] == 'Y' &&
      performSearchChecklist.modelObjects[performSearchChecklist.plain[i]].type == 'L2_Structure'
    ) {
      performSearchResult.push(performSearchChecklist.modelObjects[performSearchChecklist.plain[i]]);
    }
  }

  let checklistRevUIDArr = [];
  let checklistRevResult = [];
  let checklistRevVMOResult = [];
  for (let rev of performSearchResult) {
    let revisionLength = rev.props.revision_list.dbValues.length;
    checklistRevUIDArr.push(rev.props.revision_list.dbValues[revisionLength - 1]);
  }

  checklistRevResult.push(await com.getObject(checklistRevUIDArr));
  await com.getProperties(checklistRevResult[0], [
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
    'l2_current_project',
    'is_vi',
    'items_tag',
    'object_desc',
    'object_name',
    'object_string',
    'owning_project',
    'owning_user',
    'release_status_list',
  ]);
  for (let vmo of checklistRevResult[0]) {
    checklistRevVMOResult.push(vms.constructViewModelObjectFromModelObject(vmo));
  }

  for (let i = 0; i < performSearchResult.length; i++) {
    checklistRevVMOResult[i].props['l2_product_id'] = {
      dbValue: performSearchResult[i].props.l2_product_id.dbValues[0],
      uiValue: performSearchResult[i].props.l2_product_id.uiValues[0],
    };
  }

  for (let vmo of checklistRevVMOResult) {
    vmo.cellHeader2 = vmo.props.l2_current_project.dbValues[0];
    vmo.cellProperties.리비전 = {
      key: 'Product Code',
      value: vmo.props.l2_product_id.dbValue,
    };
  }

  data.dataProviders.connectChecklist.viewModelCollection.setViewModelObjects(checklistRevVMOResult);
  console.timeEnd();
}

export async function connectChecklistAction(ctx, data) {
  if (data.dataProviders.connectChecklist.selectedObjects.length == 0) {
    msg.show(1, msgSelectCheckList);
  } else {
    let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
    let selectChectlist = data.dataProviders.connectChecklist.selectedObjects[0];
    let originArr = selectChectlist.props.L2_MinutesRelation.dbValues;
    let selectMinutes = mainData.dataProviders.generalMinutesListProvider.selectedObjects[0];
    let minutesUID = mainData.dataProviders.generalMinutesListProvider.selectedObjects[0].uid;
    originArr.push(minutesUID);
    originArr = originArr.filter((v, i) => originArr.indexOf(v) === i);
    let minutesRelationParam = {
      objects: [selectChectlist],
      attributes: {
        L2_MinutesRelation: {
          stringVec: originArr,
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', minutesRelationParam);

    let minutesParent = await com.getObject(selectMinutes.props.items_tag.dbValue);

    let is_checklist_minutesRelationParam = {
      objects: [minutesParent],
      attributes: {
        l2_is_checklist_minutes: {
          stringVec: ['Y'],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', is_checklist_minutesRelationParam);
    setPageNumber(mainData, ctx);
    lgepPopupUtils.closePopup();
    mainData.dataProviders.generalMinutesListProvider.selectedObjects = [];
  }
}

export function selectMinutes(data) {
  saveSelectMinutes = data.dataProviders.generalMinutesListProvider.selectedObjects[0];
}

export function openFilter(ctx, data) {
  const popupData = {
    id: 'commonMinutes_filter',
    includeView: 'commonMinutesFilter',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'commonMinutes_filter',
    config: {
      width: 'WIDE',
    },
    outputData: {
      popupId: 'commonMinutesFilter',
    },
  };
  eventBus.publish('awsidenav.openClose', popupData);
}

export function openEditPopup(data) {
  let homeData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  if (homeData.dataProviders.generalMinutesListProvider.selectedObjects[0].props.owning_group.uiValue != ctx.userSession.props.group.uiValue) {
    msg.show(1, dontEditOtherDivision);
  } else {
    popupService.show({
      declView: 'PopupMinutesEdit',
      locals: {
        caption: minutesEdit,
        anchor: 'closePopupAnchor',
      },
      options: {
        reference: 'referenceId',
        isModal: true,
        clickOutsideToClose: false,
        draggable: true,
        placement: 'bottom-start',
        height: 900,
        width: 1100,
      },
    });
  }
}

export async function loadCheckBoxFilter(ctx, data) {
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let tableData = mainData.dataProviders.generalMinutesListProvider.viewModelCollection.loadedVMObjects;

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
      maxToLoad: 10000,
      maxToReturn: 10000,
      providerName: 'Awp0SavedQuerySearchProvider',
      searchCriteria: {
        Name: '*',
        queryUID: 'Q0hJ_1nr5p7XAC',
        searchID: advancedSearchUtils.getSearchId('Q0hJ_1nr5p7XAC'),
        typeOfSearch: 'ADVANCED_SEARCH',
        utcOffset: '540',
        lastEndIndex: '',
        totalObjectsFoundReportedToClient: '',
        Type: 'L2_Minutes',
      },
      searchFilterFieldSortType: 'Priority',
      startIndex: 0,
      searchFilterMap6: {},
      searchSortCriteria: [
        {
          fieldName: 'creation_date',
          sortDirection: 'DESC',
        },
      ],
      attributesToInflate: [
        'object_name',
        'object_type',
        'owning_user',
        'last_mod_user',
        'last_mod_date',
        'object_desc',
        'release_status_list',
        'item_revision_id',
        'creation_date',
        'owning_user',
        'item_id',
        'items_tag',
        'owning_group',
        'l2_meeting_agenda',
        'l2_meeting_date',
        'l2_meeting_details',
        'l2_meeting_participants',
        'l2_meeting_place',
        'l2_meeting_related_schedule',
        'l2_meeting_writer',
        'L2_ActionItemRelation',
        'l2_is_checklist_minutes',
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
  let performSearchMinutes = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', param);
  let itemForCheckBox = [];
  let itemMinutes = [];
  let itemMinutesFilter = [];

  for (let i = 0; i < performSearchMinutes.ServiceData.plain.length; i++) {
    if (
      performSearchMinutes.ServiceData.modelObjects[performSearchMinutes.ServiceData.plain[i]].type == 'L2_Minutes' &&
      performSearchMinutes.ServiceData.modelObjects[performSearchMinutes.ServiceData.plain[i]].props.l2_is_checklist_minutes.dbValues[0] == 'N'
    ) {
      itemMinutes.push(performSearchMinutes.ServiceData.modelObjects[performSearchMinutes.ServiceData.plain[i]]);
    }
  }

  let divisionArr = [];
  let writerArr = [];
  let createDateArr = [];
  for (let data of itemMinutes) {
    divisionArr.push(data.props.owning_group.uiValues[0]);
    writerArr.push(data.props.owning_user.uiValues[0]);
  }
  divisionArr.sort();
  writerArr.sort();
  divisionArr = divisionArr.filter((v, i) => divisionArr.indexOf(v) === i);
  writerArr = writerArr.filter((v, i) => writerArr.indexOf(v) === i);
  let divisionCheckBox = [];
  let writerCheckBox = [];
  let divisionCheckBoxArr = [];
  let writerCheckBoxArr = [];

  data.dataProviders.divisionConditions.json.response = [];
  let divisionLength = 0;
  let division;
  for (let i = 0; i < divisionArr.length; i++) {
    division = 'division' + i;
    divisionCheckBox.push({
      [division]: {
        propertyName: division,
        propertyDisplayName: divisionArr[i],
        type: 'BOOLEAN',
        dbValue: '',
        displayValues: [divisionArr[i]],
        isNull: false,
        editable: true,
        isEnabled: true,
        isRichText: false,
        isRequired: false,
        isLocalizable: false,
        isDisplayable: true,
        isAutoAssignable: false,
        hasInitialValue: false,
        isArray: false,
        valueUpdated: false,
        displayValueUpdated: false,
        editableInViewModel: false,
        isPropertyModifiable: true,
        isEditable: true,
        arrayLength: -1,
        error: null,
        propertyLabelDisplay: 'PROPERTY_LABEL_AT_RIGHT',
        editLayoutSide: true,
        uiValue: divisionArr[i],
        overlayType: 'viewModelPropertyOverlay',
        value: '',
        prevDisplayValues: [divisionArr[i]],
        dateApi: {
          isDateEnabled: true,
          isTimeEnabled: true,
        },
        radioBtnApi: {},
        propertyRadioTrueText: 'True',
        propertyRadioFalseText: 'False',
        propApi: {},
        hasLov: false,
        uwAnchor: '',
        renderingHint: '',
        referenceTypeName: '',
        initialize: false,
        parentUid: '',
        dbValues: [],
        uiValues: [divisionArr[i]],
      },
    });
    await Object.assign(data, divisionCheckBox[i]);
    data.dataProviders.divisionConditions.json.response.push(`{{data.${division}}}`);
    divisionCheckBoxArr.push(divisionCheckBox[i]);
    divisionLength++;
  }

  data.dataProviders.writerConditions.json.response = [];
  let writerLength = 0;
  let writer;
  for (let i = 0; i < writerArr.length; i++) {
    writer = 'writer' + i;
    writerCheckBox.push({
      [writer]: {
        propertyName: writer,
        propertyDisplayName: writerArr[i],
        type: 'BOOLEAN',
        dbValue: '',
        displayValues: [writerArr[i]],
        isNull: false,
        editable: true,
        isEnabled: true,
        isRichText: false,
        isRequired: false,
        isLocalizable: false,
        isDisplayable: true,
        isAutoAssignable: false,
        hasInitialValue: false,
        isArray: false,
        valueUpdated: false,
        displayValueUpdated: false,
        editableInViewModel: false,
        isPropertyModifiable: true,
        isEditable: true,
        arrayLength: -1,
        error: null,
        propertyLabelDisplay: 'PROPERTY_LABEL_AT_RIGHT',
        editLayoutSide: true,
        uiValue: writerArr[i],
        overlayType: 'viewModelPropertyOverlay',
        value: '',
        prevDisplayValues: [writerArr[i]],
        dateApi: {
          isDateEnabled: true,
          isTimeEnabled: true,
        },
        radioBtnApi: {},
        propertyRadioTrueText: 'True',
        propertyRadioFalseText: 'False',
        propApi: {},
        hasLov: false,
        uwAnchor: '',
        renderingHint: '',
        referenceTypeName: '',
        initialize: false,
        parentUid: '',
        dbValues: [],
        uiValues: [writerArr[i]],
      },
    });
    await Object.assign(data, writerCheckBox[i]);
    data.dataProviders.writerConditions.json.response.push(`{{data.${writer}}}`);
    writerCheckBoxArr.push(writerCheckBox[i]);
    writerLength++;
  }

  data.divisionLength = divisionLength;
  data.dataProviders.divisionConditions.json.totalFound = divisionCheckBox.length;
  data.writerLength = writerLength;
  data.dataProviders.writerConditions.json.totalFound = writerCheckBox.length;
  for (let i = 0; i < divisionLength; i++) {
    data.dataProviders.divisionConditions.viewModelCollection.loadedVMObjects.push(divisionCheckBox[i][`division${i}`]);
  }
  for (let i = 0; i < writerLength; i++) {
    data.dataProviders.writerConditions.viewModelCollection.loadedVMObjects.push(writerCheckBox[i][`writer${i}`]);
  }
  let checkboxObj = data.dataProviders.divisionConditions.viewModelCollection.loadedVMObjects;
  for (let box of checkboxObj) {
    if (box.uiValues[0] == ctx.userSession.props.group_name.dbValue) {
      box.dbValue = true;
    }
  }
}

export function checkboxAction(ctx, data) {
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let divisionData = data.dataProviders.divisionConditions.viewModelCollection.loadedVMObjects;
  let writerData = data.dataProviders.writerConditions.viewModelCollection.loadedVMObjects;
  let divisionName = [];
  let writerName = [];
  let checkedItem = [];
  let divisionItem = [];
  let writerItem = [];
  for (let i = 0; i < divisionData.length; i++) {
    if (divisionData[i].dbValue) {
      divisionName.push(divisionData[i].uiValues[0]);
    }
  }
  for (let i = 0; i < writerData.length; i++) {
    if (writerData[i].dbValue) {
      writerName.push(writerData[i].uiValues[0]);
    }
  }

  if (dateResultArr.length == 0) {
    if (divisionName.length == 0 && writerName.length == 0) {
      checkedItem.push(resultFilterArr[0]);
      nowTableData = [];
      for (let item of checkedItem[0]) {
        nowTableData.push(item);
      }
      let pageResponse = [];
      let num = Math.ceil(checkedItem[0].length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem[0].slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem[0];

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length != 0 && writerName.length != 0) {
      for (let item of resultFilterArr[0]) {
        for (let i = 0; i < divisionName.length; i++) {
          if (divisionName[i] == item.props.owning_group.uiValue) {
            divisionItem.push(item);
          }
        }
        for (let i = 0; i < writerName.length; i++) {
          if (writerName[i] == item.props.owning_user.uiValue) {
            writerItem.push(item);
          }
        }
      }
      checkedItem.push(divisionItem.filter((it) => writerItem.includes(it)));
      nowTableData = [];
      for (let item of checkedItem[0]) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem[0].length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem[0].slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem[0];

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length != 0 && writerName.length == 0) {
      for (let item of resultFilterArr[0]) {
        for (let i = 0; i < divisionName.length; i++) {
          if (divisionName[i] == item.props.owning_group.uiValue) {
            checkedItem.push(item);
          }
        }
      }
      nowTableData = [];
      for (let item of checkedItem) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem.slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem;

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length == 0 && writerName.length != 0) {
      for (let item of resultFilterArr[0]) {
        for (let i = 0; i < writerName.length; i++) {
          if (writerName[i] == item.props.owning_user.uiValue) {
            checkedItem.push(item);
          }
        }
      }
      nowTableData = [];
      for (let item of checkedItem) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem.slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

      filteredData = null;
      filteredData = checkedItem;

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    }
  } else {
    if (divisionName.length == 0 && writerName.length == 0) {
      checkedItem.push(dateResultArr);
      nowTableData = [];
      for (let item of checkedItem[0]) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem[0].length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem[0].slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem[0];

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length != 0 && writerName.length != 0) {
      for (let item of dateResultArr) {
        for (let i = 0; i < divisionName.length; i++) {
          if (divisionName[i] == item.props.owning_group.uiValue) {
            divisionItem.push(item);
          }
        }
        for (let i = 0; i < writerName.length; i++) {
          if (writerName[i] == item.props.owning_user.uiValue) {
            writerItem.push(item);
          }
        }
      }
      checkedItem.push(divisionItem.filter((it) => writerItem.includes(it)));
      nowTableData = [];
      for (let item of checkedItem[0]) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem[0].length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem[0].slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem[0];

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length != 0 && writerName.length == 0) {
      for (let item of dateResultArr) {
        for (let i = 0; i < divisionName.length; i++) {
          if (divisionName[i] == item.props.owning_group.uiValue) {
            checkedItem.push(item);
          }
        }
      }
      nowTableData = [];
      for (let item of checkedItem) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem.slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem;

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    } else if (divisionName.length == 0 && writerName.length != 0) {
      for (let item of dateResultArr) {
        for (let i = 0; i < writerName.length; i++) {
          if (writerName[i] == item.props.owning_user.uiValue) {
            checkedItem.push(item);
          }
        }
      }
      nowTableData = [];
      for (let item of checkedItem) {
        nowTableData.push(item);
      }

      let pageResponse = [];
      let num = Math.ceil(checkedItem.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = checkedItem.slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = checkedItem;

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    }
  }
  eventBus.publish('mainTable.valueChanged');
}

export function filterDate(ctx, data) {
  dateResultArr = [];
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let startDate = data.startDate.dbValue;
  let endDate = data.endDate.dbValue;
  let itemDateArr = [];
  let items = mainData.dataProviders.generalMinutesListProvider.viewModelCollection.loadedVMObjects;
  if (startDate < 0) {
    msg.show(1, msgEnterStartDate);
    dateResultArr = [];
  } else if (endDate < 0) {
    msg.show(1, msgEnterEndDate);
    dateResultArr = [];
  } else if (startDate > endDate) {
    msg.show(1, msgEnterDate);
    dateResultArr = [];
  } else {
    for (let item of nowTableData) {
      itemDateArr.push(item.props.creation_date.dbValue);
    }
    for (let i = 0; i < itemDateArr.length; i++) {
      if (startDate <= itemDateArr[i] && endDate + 86400000 > itemDateArr[i]) {
        dateResultArr.push(nowTableData[i]);
      }
    }
    if (dateResultArr.length == 0) {
      msg.show(1, msgNoResult);
    } else {
      let pageResponse = [];
      let num = Math.ceil(dateResultArr.length / showItem);
      maxPage = num > 15 ? 10 : 5;
      for (let i = 1; i <= num; i++) {
        if (i == 1) {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
            selected: true,
          });
        } else {
          pageResponse.push({
            chipType: 'SELECTION',
            labelDisplayName: String(i),
          });
        }
        if (i == num) break;
      }

      AllPage = [];
      for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
      pageResponse = AllPage[0];
      let AllListArrayPage = dateResultArr.slice(0, showItem);
      mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);
      filteredData = null;
      filteredData = dateResultArr;

      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
      for (let page of AllPage[0]) {
        mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
      }
      for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
        if (chip.selected) {
          chip.selected = false;
          break;
        }
      }
      mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

      if (pageResponse === undefined || pageResponse.length <= 1) {
        mainData.beforePage.uiValue = '';
        mainData.firstPage.uiValue = '';
        mainData.afterPage.uiValue = '';
        mainData.lastPage.uiValue = '';
      } else {
        mainData.afterPage.uiValue = '>';
        mainData.lastPage.uiValue = '≫';
      }
    }
  }
}

export async function buttonSet(treeNode, htmlElement, columnName) {
  let button = document.createElement('button');
  button.type = 'button';
  button.id = 'actionItemDetailId';
  button.innerHTML = detailsView;
  button.className = 'checkCate mama aw-base-blk-button ng-scope ng-isolate-scope aw-accent-highContrast aw-base-size-auto';
  button.addEventListener('click', openActionItemDetailView);
  htmlElement.appendChild(button);
}

async function openActionItemDetailView() {
  let data = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  if (!data.detailStatusRadio.dbValue) {
    popupService.show({
      declView: 'actionItemDetail',
      locals: {
        caption: details,
        anchor: 'closePopupAnchor',
      },
      options: {
        clickOutsideToClose: true,
        isModal: false,
        reference: 'referenceId',
        placement: 'center',
        width: 1300,
        height: 950,
      },
      outputData: {
        popupId: 'id',
      },
    });
  } else {
    window.open(browserUtils.getBaseURL() + '#/actionItemDetails');
  }
}

export function filterReset(ctx, data) {
  let checkboxDivisionObj = data.dataProviders.divisionConditions.viewModelCollection.loadedVMObjects;
  let checkboxWriterObj = data.dataProviders.writerConditions.viewModelCollection.loadedVMObjects;

  for (let box of checkboxDivisionObj) {
    box.dbValue = false;
  }
  for (let box of checkboxWriterObj) {
    box.dbValue = false;
  }
  for (let box of checkboxDivisionObj) {
    if (box.uiValues[0] == ctx.userSession.props.group_name.dbValue) {
      box.dbValue = true;
    }
  }
  data.startDate.dateApi.dateValue = '';
  data.endDate.dateApi.dateValue = '';
  dateResultArr = [];

  closeFilterAction();
}

export function closeFilterAction() {
  let mainData = vmSer.getViewModelUsingElement(document.getElementById('commonMinutes'));
  let pageResponse = [];
  let num = Math.ceil(allMinutes.length / showItem);
  maxPage = num > 15 ? 10 : 5;
  for (let i = 1; i <= num; i++) {
    if (i == 1) {
      pageResponse.push({
        chipType: 'SELECTION',
        labelDisplayName: String(i),
        selected: true,
      });
    } else {
      pageResponse.push({
        chipType: 'SELECTION',
        labelDisplayName: String(i),
      });
    }
    if (i == num) break;
  }

  AllPage = [];
  for (let i = 0; i < pageResponse.length; i += maxPage) AllPage.push(pageResponse.slice(i, i + maxPage));
  pageResponse = AllPage[0];
  let AllListArrayPage = allMinutes.slice(0, showItem);
  mainData.dataProviders.generalMinutesListProvider.viewModelCollection.setViewModelObjects(AllListArrayPage);

  mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.splice(0);
  for (let page of AllPage[0]) {
    mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects.push(page);
  }
  for (let chip of mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects) {
    if (chip.selected) {
      chip.selected = false;
      break;
    }
  }
  mainData.dataProviders.pageChipDataProvider.viewModelCollection.loadedVMObjects[0].selected = true;

  if (pageResponse === undefined || pageResponse.length <= 1) {
    mainData.beforePage.uiValue = '';
    mainData.firstPage.uiValue = '';
    mainData.afterPage.uiValue = '';
    mainData.lastPage.uiValue = '';
  } else {
    mainData.afterPage.uiValue = '>';
    mainData.lastPage.uiValue = '≫';
  }
  filteredData = null;
}

let exports = {};

export default exports = {
  addMinutes,
  buttonSet,
  checkboxAction,
  checklistConnectPopup,
  checklistLoad,
  clickedPageAction,
  closeFilterAction,
  connectChecklistAction,
  createActionItem,
  datasetLinkAction,
  deleteMinutes,
  deleteActionItem,
  editFileView,
  editMinutes,
  fileView,
  filterDate,
  filterReset,
  firstPageAction,
  goUserDetailAI,
  goUserDetailMinutes,
  initDate,
  initialize,
  initializeActionItemAddPopup,
  initializeActionItemEditPopup,
  initializeActionItemNewTab,
  initializeActionItemViewPopup,
  initializeAddPopup,
  initializeEditPopup,
  inputDataNewTab,
  lastPageAction,
  loadActionItem,
  loadCheckBoxFilter,
  loadGeneralMinutes,
  loadMinutesDetails,
  loadActionItemDetails,
  minutesSearch,
  minutesTableRefresh,
  openEditPopup,
  openFilter,
  pagingAfterAction,
  pagingBeforeAction,
  saveActionItem,
  selectMinutes,
  setPageNumber,
  sortAction,
  sortActionItem,
  tableRefresh,
};
app.factory('generalMinutesService', () => exports);
