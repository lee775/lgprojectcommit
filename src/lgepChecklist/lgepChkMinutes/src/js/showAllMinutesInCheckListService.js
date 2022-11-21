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
import _ from 'lodash';

var $ = require('jQuery');

let resultFilterArr = [];
let selectViewItem;

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

export async function openAllMinutes(ctx) {
  ctx.show_allMinutes_mode = 0;

  const popupData = {
    id: 'all_minutes_checklist',
    includeView: 'showAllMinutesMode',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'all_minutes_checklist',
    config: {
      width: 'WIDE',
    },
    outputData: {
      popupId: 'allMinutesView',
    },
  };
  eventBus.publish('awsidenav.openClose', popupData);
}

export async function loadAllMinutes(ctx, data) {
  let allCheckList = ctx.checklist.listRows;
  let allCheckListObj = [];
  let allCheckListRev = [];
  let allCheckListRevObj = [];
  let allCheckListRevVMObj = [];
  let allMinutesObj = [];
  let allMinutesVMObj = [];
  let pjtCode = [];
  let prodCode = [];
  for (let all of allCheckList) {
    allCheckListObj.push(all.getObject());
    for (let i = 0; i < all._children.length; i++) {
      allCheckListRev.push(all._children[i]);
    }
  }
  let allCheckListRevLeng = allCheckListRev.length;
  for (let i = 0; i < allCheckListRevLeng; i++) {
    allCheckListRevObj.push(com.getObject(allCheckListRev[i].id));
  }
  await com.getProperties(allCheckListRevObj, ['L2_MinutesRelation']);

  for (let i = 0; i < allCheckListRevObj.length; i++) {
    allCheckListRevVMObj.push(vmos.constructViewModelObjectFromModelObject(allCheckListRevObj));
  }

  for (let i = 0; i < allCheckListRevObj.length; i++) {
    Object.assign(allCheckListRevVMObj[i].props, allCheckListRevObj[i].props);
  }

  // await common.delay(1000);

  for (let obj of allCheckListRevVMObj) {
    if (obj.props.L2_MinutesRelation.dbValues.length != 0) {
      for (let i = 0; i < obj.props.L2_MinutesRelation.dbValues.length; i++) {
        allMinutesObj.push(com.getObject(obj.props.L2_MinutesRelation.dbValues[i]));
      }
    }
  }

  await com.getProperties(allMinutesObj, ['IMAN_reference']);

  for (let i of allMinutesObj) {
    allMinutesVMObj.push(vmos.constructViewModelObjectFromModelObject(i));
  }

  let allMinutesItems = [];
  let allMinutesItemObj;
  for (let i = 0; i < allMinutesVMObj.length; i++) {
    allMinutesItemObj = com.getObject(allMinutesVMObj[i].props.items_tag.dbValues[0]);
    allMinutesItems.push(allMinutesItemObj);
  }

  await com.getProperties(allMinutesItems, [
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
    'l2_related_failure',
    'L2_ActionItemRelation',
  ]);

  let resultArr = [];
  let i = 0;
  for (let rev of allCheckListRevVMObj) {
    for (let j = 0; j < rev.props.L2_MinutesRelation.dbValues.length; j++) {
      for (let allMin of allMinutesVMObj) {
        if (rev.props.L2_MinutesRelation.dbValues[j] == allMin.uid) {
          allMin.props['project_code'] = makeVmProperty('project_code', rev.props.l2_current_project.uiValues[0]);
          allMin.props['item_revision_id'] = makeVmProperty('item_revision_id', rev.props.item_revision_id.uiValues[0]);
          allMin.props['l2_meeting_date'] = makeVmProperty('l2_meeting_date', allMinutesItemObj.props.l2_meeting_date);
          allMin.props['l2_meeting_place'] = makeVmProperty('l2_meeting_place', allMinutesItemObj.props.l2_meeting_place);
          allMin.props['l2_meeting_participants'] = makeVmProperty('l2_meeting_participants', allMinutesItemObj.props.l2_meeting_participants);
          allMin.props['l2_meeting_details'] = makeVmProperty('l2_meeting_details', allMinutesItemObj.props.l2_meeting_details);
          allMin.props['l2_meeting_agenda'] = makeVmProperty('l2_meeting_agenda', allMinutesItemObj.props.l2_meeting_agenda);
          allMin.props['l2_meeting_related_schedule'] = makeVmProperty('l2_meeting_related_schedule', allMinutesItemObj.props.l2_meeting_related_schedule);
          allMin.props['l2_related_failure'] = makeVmProperty('l2_related_failure', allMinutesItemObj.props.l2_related_failure);
          allMin.props['item_IMAN_reference'] = makeVmProperty('item_IMAN_reference', allMinutesItemObj.props.item_IMAN_reference);
          allMin.props['L2_ActionItemRelation'] = makeVmProperty('L2_ActionItemRelation', allMinutesItemObj.props.L2_ActionItemRelation);
          for (let allchec of allCheckListObj) {
            if (allchec.uid == rev.props.items_tag.dbValues[0]) {
              allMin.props['l2_product_code'] = makeVmProperty('l2_product_code', allchec.props.l2_product_id.uiValues[0]);
              allMin.props['top_checklist'] = makeVmProperty('top_checklist', allchec.props.object_string.uiValues[0]);
            }
          }
          resultArr.push(allMin);
        }
      }
    }
    i++;
  }

  eventBus.publish('loadCheckBoxList');
  resultFilterArr = [];
  resultFilterArr.push(allMinutesVMObj);
  data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.setViewModelObjects(allMinutesVMObj);
  return {
    example: allMinutesVMObj,
    totalFound: 1,
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

export async function minutesView(ctx, data) {
  let tableMinutes = data.dataProviders.allMinutesListInCheckListDataProvider.selectedObjects;
  if (tableMinutes.length == 0) {
    msg.show(1, '조회할 회의록을 선택해 주세요.');
  } else {
    appCtxService.registerCtx('show_allMinutes_mode', 1);
    let parentUID = data.dataProviders.allMinutesListInCheckListDataProvider.selectedObjects[0].props.items_tag.dbValue;
    let parentObj = com.getObject([parentUID]);
    await com.getProperties(parentObj, [
      'object_name',
      'object_desc',
      'owning_user',
      'owning_group',
      'l2_meeting_agenda',
      'l2_meeting_date',
      'l2_meeting_details',
      'l2_meeting_participants',
      'l2_meeting_place',
      'l2_meeting_related_schedule',
      'l2_minutes_writer',
      'l2_related_failure',
      'IMAN_reference',
      'L2_ActionItemRelation',
    ]);
    console.log('회의록 아이템', { parentObj });
    selectViewItem = parentObj;
    let titleData = parentObj[0].props.object_name.uiValues[0];
    let dateData = parentObj[0].props.l2_meeting_date.uiValues[0];
    let placeData = parentObj[0].props.l2_meeting_place.uiValues[0];
    let writerData = parentObj[0].props.owning_user.uiValues[0];
    let participants = parentObj[0].props.l2_meeting_participants.uiValues[0];
    let agendaData = parentObj[0].props.l2_meeting_agenda.uiValues[0];
    let scheduleData = parentObj[0].props.l2_meeting_related_schedule.uiValues[0];
    let detailsData = parentObj[0].props.l2_meeting_details.uiValues[0];
    let fileValues = tableMinutes[0].props.IMAN_reference.dbValues;
    let fileNames = tableMinutes[0].props.IMAN_reference.uiValues;

    detailsData = detailsData.replaceAll('\n', '<br>');
    detailsData = detailsData.replaceAll('<pre>', '');
    detailsData = detailsData.replaceAll('</pre>', '');
    detailsData = `<pre>${detailsData}</pre>`;

    common.delay(200);
    initialize();
    let a = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes-checklist'));

    console.log(a);

    a.object_nameLbl.uiValue = titleData;
    a.l2_meeting_dateLbl.uiValue = dateData;
    a.l2_meeting_placeLbl.uiValue = placeData;
    a.proceedWriterLink.uiValue = writerData;
    a.l2_meeting_participantsLbl.uiValue = participants;
    a.l2_meeting_agendaLbl.uiValue = agendaData;
    a.proceedDetails.uiValue = detailsData;
    a.l2_meeting_related_scheduleLbl.uiValue = scheduleData;

    let datasetLinkArr = [];
    let details = vms.getViewModelUsingElement(document.getElementById('show-all-minutes-detailes-checklist'));

    for (let i = 0; i < fileNames.length; i++) {
      datasetLinkArr.push(fileNames[i]);
    }

    let referenceUID = tableMinutes[0].props.IMAN_reference.dbValues;
    details.datasetLink.dbValue = [];
    for (let i = 0; i < fileNames.length; i++) {
      details.datasetLink.dbValue.push({
        displayName: datasetLinkArr[i],
        isRequired: 'false',
        uiValue: datasetLinkArr[i],
        isNull: 'false',
        uid: referenceUID[i],
      });
    }

    $('#showAllMinutesInCheckListSummernote').summernote('reset');
    $('#showAllMinutesInCheckListSummernote').summernote('code', detailsData + '<br>');
  }
}

export async function loadCheckboxList(ctx, data) {
  let tableItem = data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.loadedVMObjects;
  let pjtCodeArr = [];
  let prodCodeArr = [];
  for (let i = 0; i < tableItem.length; i++) {
    pjtCodeArr.push(tableItem[i].props.project_code.dbValue);
    prodCodeArr.push(tableItem[i].props.l2_product_code.dbValue);
  }

  pjtCodeArr.sort();
  prodCodeArr.sort();
  pjtCodeArr = pjtCodeArr.filter((v, i) => pjtCodeArr.indexOf(v) === i);
  prodCodeArr = prodCodeArr.filter((v, i) => prodCodeArr.indexOf(v) === i);
  let pjtCodeCheckBox = [];
  let prodCodeCheckBox = [];
  let pjtCodeCheckBoxArr = [];
  let prodCodeCheckBoxArr = [];
  data.dataProviders.projectCode.json.response = [];
  let pjtCodeLength = 0;
  let pjtCode;
  for (let i = 0; i < pjtCodeArr.length; i++) {
    pjtCode = 'pjtCode' + i;
    pjtCodeCheckBox.push({
      [pjtCode]: {
        propertyName: pjtCode,
        propertyDisplayName: pjtCodeArr[i],
        type: 'BOOLEAN',
        dbValue: '',
        displayValues: [pjtCodeArr[i]],
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
        uiValue: pjtCodeArr[i],
        overlayType: 'viewModelPropertyOverlay',
        value: '',
        prevDisplayValues: [pjtCodeArr[i]],
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
        uiValues: [pjtCodeArr[i]],
      },
    });
    await Object.assign(data, pjtCodeCheckBox[i]);
    data.dataProviders.projectCode.json.response.push(`{{data.${pjtCode}}}`);
    pjtCodeCheckBoxArr.push(pjtCodeCheckBox[i]);
    pjtCodeLength++;
  }

  data.dataProviders.productCode.json.response = [];
  let prodCodeLength = 0;
  let prodCode;
  for (let i = 0; i < prodCodeArr.length; i++) {
    prodCode = 'prodCode' + i;
    prodCodeCheckBox.push({
      [prodCode]: {
        propertyName: prodCode,
        propertyDisplayName: prodCodeArr[i],
        type: 'BOOLEAN',
        dbValue: '',
        displayValues: [prodCodeArr[i]],
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
        uiValue: prodCodeArr[i],
        overlayType: 'viewModelPropertyOverlay',
        value: '',
        prevDisplayValues: [prodCodeArr[i]],
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
        uiValues: [prodCodeArr[i]],
      },
    });
    await Object.assign(data, prodCodeCheckBox[i]);
    data.dataProviders.productCode.json.response.push(`{{data.${prodCode}}}`);
    prodCodeCheckBoxArr.push(prodCodeCheckBox[i]);
    prodCodeLength++;
  }

  data.pjtCodeLength = pjtCodeLength;
  data.dataProviders.projectCode.json.totalFound = pjtCodeCheckBox.length;
  data.prodCodeLength = prodCodeLength;
  data.dataProviders.productCode.json.totalFound = prodCodeCheckBox.length;
}

export function checkboxAction(ctx, data) {
  let pjtData = data.dataProviders.projectCode.viewModelCollection.loadedVMObjects;
  let prodData = data.dataProviders.productCode.viewModelCollection.loadedVMObjects;
  let pjtName = [];
  let prodName = [];
  let checkedItem = [];
  let pjtItem = [];
  let prodItem = [];
  for (let i = 0; i < pjtData.length; i++) {
    if (pjtData[i].dbValue) {
      pjtName.push(pjtData[i].uiValues[0]);
    }
  }
  for (let i = 0; i < prodData.length; i++) {
    if (prodData[i].dbValue) {
      prodName.push(prodData[i].uiValues[0]);
    }
  }
  if (pjtName.length == 0 && prodName.length == 0) {
    checkedItem.push(resultFilterArr[0]);
    data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.setViewModelObjects(checkedItem[0]);
  } else if (pjtName.length != 0 && prodName.length != 0) {
    for (let item of resultFilterArr[0]) {
      for (let i = 0; i < pjtName.length; i++) {
        if (pjtName[i] == item.props.project_code.dbValue) {
          pjtItem.push(item);
        }
      }
      for (let i = 0; i < prodName.length; i++) {
        if (prodName[i] == item.props.l2_product_code.dbValue) {
          prodItem.push(item);
        }
      }
    }
    checkedItem.push(pjtItem.filter((it) => prodItem.includes(it)));
    data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.setViewModelObjects(checkedItem[0]);
  } else if (pjtName.length != 0 && prodName.length == 0) {
    for (let item of resultFilterArr[0]) {
      for (let i = 0; i < pjtName.length; i++) {
        if (pjtName[i] == item.props.project_code.dbValue) {
          checkedItem.push(item);
        }
      }
    }
    data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.setViewModelObjects(checkedItem);
  } else if (pjtName.length == 0 && prodName.length != 0) {
    for (let item of resultFilterArr[0]) {
      for (let i = 0; i < prodName.length; i++) {
        if (prodName[i] == item.props.l2_product_code.dbValue) {
          checkedItem.push(item);
        }
      }
    }
    data.dataProviders.allMinutesListInCheckListDataProvider.viewModelCollection.setViewModelObjects(checkedItem);
  }

  eventBus.publish('allMinutesTable.plTable.clientRefresh');
}

export function returnToView() {
  appCtxService.registerCtx('show_allMinutes_mode', 0);
}

export async function failureLoad(ctx, data) {
  let relrateFailure = selectViewItem[0].props.l2_related_failure.dbValues;

  let relrateFailureObj = [];
  relrateFailureObj.push(await com.loadObjects(relrateFailure));
  let failureItem = [];
  let failureVMO = [];
  for (let item of relrateFailureObj) {
    failureItem.push(item.modelObjects[item.plain[0]]);
  }
  for (let item of failureItem) {
    failureVMO.push(vmos.constructViewModelObjectFromModelObject(item));
  }
  data.dataProviders.failureList.viewModelCollection.setViewModelObjects(failureVMO);
}

let exports = {};

export default exports = {
  checkboxAction,
  failureLoad,
  initialize,
  loadAllMinutes,
  loadCheckboxList,
  //   loadMinutesDetails,
  minutesView,
  openAllMinutes,
  returnToView,
  sortAction,
};

app.factory('showAllMinutesInCheckListService', () => exports);
