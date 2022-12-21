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
import checklist from 'js/utils/checklistUtils';
import popupService from 'js/popupService';
import * as fs from 'fs';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import notySvc from 'js/NotyModule';
import locale from 'js/utils/lgepLocalizationUtils';
import { makeVmProperty } from 'js/utils/fmeaTableMakeUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import _ from 'lodash';

var $ = require('jQuery');

const selectMinutesInChecklist = locale.getLocalizedText('lgepChkMinutesMessages', 'selectMinutesInChecklist');
const noChecklist = locale.getLocalizedText('lgepChkMinutesMessages', 'noChecklist');

let resultFilterArr = [];
let selectViewItem;
let selectViewItemRev;
let topStructureItem;

export async function initialize() {
  await common.delay(200);

  $('#showAllMinutesInCheckListSummernote').summernote({
    height: 450,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#showAllMinutesInCheckListSummernote').summernote('disable');
  $('#showAllMinutesInCheckListSummernote').css('background-color', 'white');
}

export async function openAllMinutes(ctx) {
  if (!ctx.checklist.listRows) {
    msg.show(0, noChecklist);
  } else {
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
}

export function backPage() {
  appCtxService.registerCtx('show_allMinutes_mode', 0);
}

export async function loadAllMinutes(ctx, data) {
  let allCheckList = ctx.checklist.listRows;
  let allCheckListObj = [];
  let allCheckListRev = [];
  let allCheckListRevObj = [];
  let allCheckListRevVMObj = [];
  let allMinutesObj = [];
  let allMinutesUID = [];
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
        allMinutesUID.push(obj.props.L2_MinutesRelation.dbValues[i]);
      }
    }
  }
  allMinutesUID = allMinutesUID.filter((v, i) => allMinutesUID.indexOf(v) === i);
  allMinutesObj.push(com.getObject(allMinutesUID));

  await com.getProperties(allMinutesObj[0], ['IMAN_reference']);

  for (let i of allMinutesObj[0]) {
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
              allMin.props['top_checklist'] = {
                dbValue: allchec.uid,
                uiValue: allchec.props.object_string.uiValues[0],
              };
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

function sortActionItem(response, startIndex, pageSize) {
  let countries = response.actionItem;
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
    msg.show(1, selectMinutesInChecklist);
  } else {
    selectViewItemRev = data.dataProviders.allMinutesListInCheckListDataProvider.selectedObjects[0];
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
  data.dataProviders.actionItemTableProvider.selectedObjects = [];
  if (selectViewItem[0].props.l2_related_failure.dbValues.length == 0) {
    return null;
  } else {
    let relateFailureUID = selectViewItem[0].props.l2_related_failure.dbValues;

    let parentOccurrence = null;
    let bomTreeMap = new Map();
    let datasetArr = [];
    let selectedMinutes = JSON.parse(localStorage.getItem('selectedMinutes'));
    let revisionID = selectedMinutes.props.item_revision_id.dbValue;
    let revisionIDNum = revisionID.charCodeAt(0);

    let topStructureItemUID = selectedMinutes.props.top_checklist.dbValue;
    topStructureItem = await com.getObject(topStructureItemUID);
    let relatedStrucRevisionUID = topStructureItem.props.revision_list.dbValues[revisionIDNum - 65];
    let revisionStructure = await com.getObject(relatedStrucRevisionUID);
    console.log(revisionStructure);
    //1. 첫번째 getOccurrence3에서는 topLine의 productContext등을 불러오기 위해서 사용한다
    return lgepBomUtils
      .getOccurrences3(revisionStructure)
      .then((response) => {
        let rootProductContext = response.rootProductContext;
        parentOccurrence = response.parentOccurrence;
        let topLine = com.getObject(parentOccurrence.occurrenceId);
        return com
          .loadObjects(
            [parentOccurrence.occurrenceId],
            com.createPolicy(
              [
                'awb0CsidPath',
                'l2_awb0uggeometry',
                'awp0CellProperties',
                'awp0ThumbnailImageTicket',
                'awb0OverrideContexts',
                'awb0OverriddenProperties',
                'awb0IsPacked',
                'awb0UnderlyingObject',
                'is_modifiable',
                'awb0Archetype',
                'object_string',
                'awb0IsVi',
                'awb0ArchetypeId',
                'awb0ArchetypeRevDescription',
                'awb0ArchetypeRevOwningUser',
                'awb0ArchetypeRevId',
                'awb0ArchetypeRevLastModUser',
                'awb0AbsOccId',
                'awb0ArchetypeRevOwningGroup',
                'awb0ArchetypeRevRelStatus',
                'awb0ArchetypeRevReleaseDate',
                'awb0ElementEffId',
                'awb0ArchetypeRevEffText',
                'awb0ArchetypeRevName',
                'awb0HasReflection',
                'l2_ref_ap',
                'awb0UoM',
                'l2_function',
                'l2_result_detection',
                'l2_ref_detection',
                'l2_result_occurence',
                'l2_failure_mode',
                'l2_requirement',
                'awb0Sequence',
                'awb0Quantity',
                'l2_result_ap',
                'awb0TraceLinkFlag',
                'l2_ref_occurence',
                'l2_ref_severity',
                'awb0LogicalDesignator',
                'l2_is_selected',
                'awb0IsPrecise',
                'l2_reference_dataset',
                'awb0OccName',
                'l2_result_severity',
                'awb0UnderlyingObjectType',
                'l2_comments',
              ],
              'Awb0DesignElement',
            ),
          )
          .then(() => {
            //2. 두번째 getOccurrence3 에서는 이제 전체 AWC BOM을 펼친다.
            return lgepBomUtils.getOccurrences3(revisionStructure, rootProductContext, topLine);
          });
      })
      .then((BOMResult) => {
        console.log('BOMResult', { BOMResult });
        parentOccurrence = BOMResult.parentOccurrence;
        // getOccurrence3의 response들을 분석하여, 부모-자식 관계를 Map에 할당한다.
        let infos = BOMResult.parentChildrenInfos;
        let allObjectUids = [];
        for (const info of infos) {
          if (!allObjectUids.includes(info.parentInfo.occurrenceId)) allObjectUids.push(info.parentInfo.occurrenceId);
          if (info.parentInfo.numberOfChildren > 0) {
            let _children = [];
            for (const childInfo of info.childrenInfo) {
              if (!allObjectUids.includes(childInfo.occurrenceId)) allObjectUids.push(childInfo.occurrenceId);
              _children.push(childInfo.occurrenceId);
            }
            bomTreeMap.set(info.parentInfo.occurrenceId, _children);
          }
        }
        // 3. 해당 BOM을 In-Context 모드로 변경한다.
        return lgepBomUtils.saveUserWorkingContextState2(parentOccurrence.occurrenceId).then(() => {
          return lgepBomUtils.getTableViewModelProperties(
            allObjectUids,
            com.createPolicy(
              [
                'awb0CsidPath',
                'l2_awb0uggeometry',
                'awp0CellProperties',
                'awp0ThumbnailImageTicket',
                'awb0OverrideContexts',
                'awb0OverriddenProperties',
                'awb0IsPacked',
                'awb0UnderlyingObject',
                'is_modifiable',
                'awb0Archetype',
                'object_string',
                'awb0IsVi',
                'awb0ArchetypeId',
                'awb0ArchetypeRevDescription',
                'awb0ArchetypeRevOwningUser',
                'awb0ArchetypeRevId',
                'awb0ArchetypeRevLastModUser',
                'awb0AbsOccId',
                'awb0ArchetypeRevOwningGroup',
                'awb0ArchetypeRevRelStatus',
                'awb0ArchetypeRevReleaseDate',
                'awb0ElementEffId',
                'awb0ArchetypeRevEffText',
                'awb0ArchetypeRevName',
                'awb0HasReflection',
                'l2_ref_ap',
                'awb0UoM',
                'l2_function',
                'l2_result_detection',
                'l2_ref_detection',
                'l2_result_occurence',
                'l2_failure_mode',
                'l2_requirement',
                'awb0Sequence',
                'awb0Quantity',
                'l2_result_ap',
                'awb0TraceLinkFlag',
                'l2_ref_occurence',
                'l2_ref_severity',
                'awb0LogicalDesignator',
                'l2_is_selected',
                'awb0IsPrecise',
                'l2_reference_dataset',
                'awb0OccName',
                'l2_result_severity',
                'awb0UnderlyingObjectType',
                'l2_comments',
              ],
              'Awb0DesignElement',
            ),
          );
        });
      })
      .then(async (getTableResult) => {
        console.log(getTableResult);
        let object = getTableResult.ServiceData.modelObjects;
        for (let i = 0; i < getTableResult.ServiceData.plain.length; i++) {
          for (let j = 0; j < relateFailureUID.length; j++) {
            if (object[getTableResult.ServiceData.plain[i]].props.awb0UnderlyingObject.dbValues == relateFailureUID[j]) {
              for (let a = 0; a < object[getTableResult.ServiceData.plain[i]].props.l2_reference_dataset.dbValues.length; a++) {
                datasetArr.push(await checklist.readPropertiesFromTextFile(object[getTableResult.ServiceData.plain[i]].props.l2_reference_dataset.dbValues[a]));
              }
            }
          }
        }
        console.log('데이터셋', { datasetArr });
        let relateFailureObj = [];
        relateFailureObj.push(await com.loadObjects(relateFailureUID));
        let failureItem = [];
        let failureVMO = [];
        for (let item of relateFailureObj) {
          failureItem.push(item.modelObjects[item.plain[0]]);
        }
        await com.getProperties(failureItem, ['l2_base_structure']);
        for (let item of failureItem) {
          failureVMO.push(vmos.constructViewModelObjectFromModelObject(item));
        }
        for (let item of failureVMO) {
          for (let i = 0; i < failureItem.length; i++) {
            for (let j = 0; j < datasetArr.length; j++) {
              let effect = datasetArr[j].failureEffect;
              let mechanism = datasetArr[j].failureDetail;
              if (effect) {
                effect = effect.replace(/<[^>]*>?/g, ' ');
              }
              if (mechanism) {
                mechanism = mechanism.replace(/<[^>]*>?/g, ' ');
              } else {
                mechanism = '-';
              }
              item.cellHeader1 = failureItem[i].props.object_string.dbValues[0];
              item.cellHeader2 = effect;
              item.cellProperties.리비전 = {
                key: '메커니즘',
                value: mechanism,
              };
            }
          }
        }
        data.dataProviders.failureList.viewModelCollection.setViewModelObjects(failureVMO);
      });
  }
}

export async function loadActionItem(data) {
  await common.delay(200);
  ctx.selectActionItemRev = null;

  // 회의록 불러오기
  let parentUID = [selectViewItemRev.props.items_tag.dbValue];
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
    arr2.push(vmos.constructViewModelObjectFromModelObject(haveActionItemRevObj[i]));
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
  let actionTable = vms.getViewModelUsingElement(document.getElementById('actionItemTable'));

  actionItemArr.sort((a, b) => new Date(b.props.creation_date.dbValue) - new Date(a.props.creation_date.dbValue));
  actionTable.dataProviders.actionItemTableProvider.viewModelCollection.setViewModelObjects(actionItemArr);
  let actionTableView = document.getElementById('actionItemTable');
  // await common.delay(200);
  // let selectRow = actionTableView.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children;
  // let rowLength = actionTableView.children[1].children[0].children[0].children[1].children[2].children[1].children[0].children.length;
  // let selectRowIcon = actionTableView.children[1].children[0].children[0].children[1].children[1].children[1].children[0].children;
  // for (let i = 0; i < rowLength; i++) {
  //   selectRow[i].style.backgroundColor = 'rgb(255, 255, 255)';
  //   selectRowIcon[i].style.backgroundColor = 'rgb(255, 255, 255)';
  // }

  $('#commentDetailsSummernote').summernote({
    height: 200,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#commentDetailsSummernote').summernote('disable');
  $('#commentDetailsSummernote').css('background-color', 'white');

  $('#followUpDetailsSummernote').summernote({
    height: 200,
    width: '100%',
    styleWithSpan: true,
    toolbar: [],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });
  $('#followUpDetailsSummernote').summernote('disable');
  $('#followUpDetailsSummernote').css('background-color', 'white');

  return {
    actionItem: actionItemArr,
    actionItemLength: actionItemArr.length,
  };
}

export async function loadActionItemDetails(ctx, data) {
  let selectActionItem = data.dataProviders.actionItemTableProvider.selectedObjects[0];
  await com.getProperties(selectActionItem, ['IMAN_specification']);
  let datesetUID = selectActionItem.props.IMAN_specification.dbValue[0];
  let text = await checklist.readPropertiesFromTextFile(datesetUID);

  let parentUID = selectActionItem.props.items_tag.dbValue;
  let actionItem = await com.getObject([parentUID]);

  data.l2_workerLbl.uiValue = selectActionItem.props.l2_worker.uiValue;
  data.l2_expected_dateLbl.uiValue = selectActionItem.props.l2_expected_date.uiValue;
  let commentDetails = selectActionItem.props.l2_comment.uiValue;
  let followUpDetails = selectActionItem.props.l2_follow_up.uiValue;
  commentDetails = `<pre>${commentDetails}</pre>`;
  followUpDetails = `<pre>${followUpDetails}</pre>`;

  $('#commentDetailsSummernote').summernote('reset');
  $('#followUpDetailsSummernote').summernote('reset');
  $('#commentDetailsSummernote').summernote('code', text.comment + '<br>');
  $('#followUpDetailsSummernote').summernote('code', text.followUp + '<br>');
}

export function selectMainTable(ctx, data) {
  let item = data.dataProviders.allMinutesListInCheckListDataProvider.selectedObjects[0];
  let itemJson = JSON.stringify(item);
  localStorage.setItem('selectedMinutes', itemJson);
}

let exports = {};

export default exports = {
  backPage,
  checkboxAction,
  failureLoad,
  initialize,
  loadActionItem,
  loadActionItemDetails,
  loadAllMinutes,
  loadCheckboxList,
  //   loadMinutesDetails,
  minutesView,
  openAllMinutes,
  returnToView,
  selectMainTable,
  sortAction,
  sortActionItem,
};

app.factory('showAllMinutesInCheckListService', () => exports);
