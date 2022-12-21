import app from 'app';
import SoaService from 'soa/kernel/soaService';
import query from 'js/utils/lgepQueryUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import com, { loadObject } from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import appCtxService from 'js/appCtxService';
import fmsUtils from 'js/fmsUtils';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import _ from 'lodash';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import eventBus from 'js/eventBus';
import vms from 'js/viewModelService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import message from 'js/utils/lgepMessagingUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import browserUtils from 'js/browserUtils';

var $ = require('jQuery');

export async function goToCheckList(ctx, data) {
  lgepLoadingUtils.openWindow();

  let tableInfo = document.getElementById('occTreeTable');

  let headData;
  if (tableInfo._tableInstance.dataProvider.selectedObjects.length == 0) {
    headData = await com.getLatestItemRevisionByItemId(
      tableInfo._tableInstance.dataProvider.viewModelCollection.loadedVMObjects[0].props.awb0ArchetypeId.dbValues[0],
    );
  } else {
    headData = await com.getLatestItemRevisionByItemId(tableInfo._tableInstance.dataProvider.selectedObjects[0].props.awb0ArchetypeId.dbValues[0]);
  }

  let findRefer = await com.whereReferenced([headData], 8);

  let itemGroup = [];
  for (let i = 0; i < findRefer.output[0].info.length; i++) {
    if (findRefer.output[0].info[i].referencer.type == 'ItemRevision') {
      itemGroup.push(findRefer.output[0].info[i].referencer);
    }
  }

  await com.getProperties(itemGroup, ['ps_parents']);

  let topItem;
  for (let i = 0; i < itemGroup.length; i++) {
    if (itemGroup[i].props.ps_parents.dbValues.length == 0) {
      topItem = itemGroup[i];
    }
  }

  let parentData;

  await com.getProperties(headData, ['ps_parents']);
  if (headData.props.ps_parents.dbValues.length == 0) {
    message.show(
      1,
      '하위 레벨의 아이템을 선택해주세요',
      ['닫기'],
      [
        function () {
          lgepLoadingUtils.closeWindow();
        },
      ],
    );
  }

  let hello = await bomUtils.getOccurrences3(topItem).then((response) => {
    let rootProductContext = response.rootProductContext;
    let parentOccurrenceObject = com.getObject(response.parentOccurrence.occurrenceId);
    return bomUtils.getOccurrences3(topItem, rootProductContext, parentOccurrenceObject);
  });

  parentData = hello.ServiceData.modelObjects[hello.parentOccurrence.occurrenceId];

  lgepCommonUtils.delay(200);
  await com.getProperties(parentData, ['awb0ArchetypeRevDescription']);
  // if (parentData.props.awb0ArchetypeRevDescription == undefined) {
  //   goToCheckList();
  // }

  if (parentData.props.awb0ArchetypeRevDescription.dbValues[0] == '') {
    return message.show(
      1,
      '상위 레벨의 아이템을  선택해주세요',
      ['닫기'],
      [
        function () {
          lgepLoadingUtils.closeWindow();
        },
      ],
    );
  }

  // let searchInput = {
  //   attributesToInflate: ['object_name', 'object_desc', 'L2_DesignStandardRel', 'awb0ArchetypeRevDescription', 'item_id', 'l2_current_project'],
  //   maxToLoad: 50,
  //   maxToReturn: 50,
  //   providerName: 'Awp0FullTextSearchProvider',
  //   searchCriteria: {
  //     searchString: tableInfo._tableInstance.dataProvider.selectedObjects[0].props.awb0ArchetypeName.dbValues[0],
  //   },
  //   searchFilterFieldSortType: 'Priority',
  //   searchFilterMap6: {
  //     'WorkspaceObject.object_type': [
  //       {
  //         searchFilterType: 'StringFilter',
  //         stringValue: 'L2_StructureRevision',
  //         colorValue: '',
  //         stringDisplayValue: '',
  //         startDateValue: '',
  //         endDateValue: '',
  //         startNumericValue: 0,
  //         endNumericValue: 0,
  //         count: 0,
  //         selected: false,
  //         startEndRange: '',
  //       },
  //     ],
  //   },
  //   searchSortCriteria: [],
  //   startIndex: 0,
  // };

  // let params = {
  //   types: [
  //     {
  //       name: 'WorkspaceObject',
  //       properties: [
  //         { name: 'object_name' },
  //         { name: 'creation_date' },
  //         { name: 'items_tag' },
  //         { name: 'l2_current_project' },
  //         { name: 'item_id' },
  //         { name: 'awb0ArchetypeRevDescription' },
  //         { name: 'l2_product_class' },
  //       ],
  //     },
  //   ],
  // };
  let selectornot;
  if (tableInfo._tableInstance.dataProvider.selectedObjects.length == 0) {
    selectornot = tableInfo._tableInstance.dataProvider.viewModelCollection.loadedVMObjects[0];
  } else {
    selectornot = tableInfo._tableInstance.dataProvider.selectedObjects[0];
  }

  // let result = await query.performSearchViewModel4(null, searchInput, params);
  let result1 = await query.executeSavedQuery('일반...', ['이름'], selectornot.props.awb0ArchetypeName.dbValues[0]);
  let checkList;

  com.getProperties(result1, ['l2_current_project']);

  //코드 수정 예정
  // for (let i = 0; i < result.searchResults.length; i++) {
  //   if (result.searchResults[i].props.l2_current_project !== undefined) {
  //     if (result.searchResults[i].props.l2_current_project.dbValues[0] === parentData.props.awb0ArchetypeRevDescription.dbValues[0]) {
  //       //result[i]가 되어야 함
  //       checkList = result.searchResults[0];
  //       break;
  //     }
  //   }
  // }
  let revGroup = [];
  let test;
  for (let i = 0; i < result1.length; i++) {
    if (result1[i].type == 'L2_StructureRevision') {
      revGroup.push(result1[i]);
    }
  }
  test = revGroup[0];

  for (let i = 0; i < revGroup.length; i++) {
    await com.getProperties(revGroup[i], ['l2_current_project']);
    if (revGroup[i].props.l2_current_project !== undefined) {
      if (revGroup[i].props.l2_current_project.dbValues[0] == parentData.props.awb0ArchetypeRevDescription.dbValues[0]) {
        checkList = revGroup[i];
      }
    }
  }

  if (checkList !== undefined) {
    await com.getProperties(checkList, ['item_id']);
    let checkRev = await com.getLatestItemRevisionByItemId(checkList.props.item_id.dbValues[0]);
    let url = window.location.href;
    url = url.split('/');
    lgepLoadingUtils.closeWindow();
    window.open('http://' + url[2] + '/#/checklistMain?uid=' + checkRev.uid);
    lgepLoadingUtils.closeWindow();
  } else {
    lgepLoadingUtils.closeWindow();
    message.show(1, '체크리스트가 없습니다.', ['닫기'], [function () {}]);
  }
  // console.log(com.whereReferenced([test], 1));
  // let hi;
  // try {
  //   let getPropertiesParam = {
  //     objects: [testD],
  //     numLevels: 2,
  //     whereUsedPrecise: 'bool',
  //   };
  //   await SoaService.post('Core-2007-01-DataManagement', 'whereUsed', getPropertiesParam);
  // } catch (err) {
  //   //console.log(err);
  // }

  // console.log(hi);
  // console.log({ test });
}

export async function hideButton(ctx, data) {
  appCtxService.registerCtx('hide', false);
  let tableInfo = document.getElementById('occTreeTable');
  let data1 = vms.getViewModelUsingElement(document.getElementById('occTreeTable'));
  // let data2 = vms.getViewModelUsingElement(document.getElementsByClassName('aw-layout-include aw-layout-flexbox ng-scope'));

  let headData;
  if (tableInfo._tableInstance.dataProvider.selectedObjects.length == 0) {
    headData = await com.getLatestItemRevisionByItemId(
      tableInfo._tableInstance.dataProvider.viewModelCollection.loadedVMObjects[0].props.awb0ArchetypeId.dbValues[0],
    );
  } else {
    headData = await com.getLatestItemRevisionByItemId(tableInfo._tableInstance.dataProvider.selectedObjects[0].props.awb0ArchetypeId.dbValues[0]);
  }

  let findRefer = await com.whereReferenced([headData], 8);

  let itemGroup = [];
  for (let i = 0; i < findRefer.output[0].info.length; i++) {
    if (findRefer.output[0].info[i].referencer.type == 'ItemRevision') {
      itemGroup.push(findRefer.output[0].info[i].referencer);
    }
  }

  if (itemGroup.length == 0) {
    appCtxService.registerCtx('hide', false);
  } else {
    appCtxService.registerCtx('hide', true);
  }

  // let parentData;
  // await com.getProperties(itemGroup, ['ps_parents']);

  // let topItem;
  // for (let i = 0; i < itemGroup.length; i++) {
  //   if (itemGroup[i].props.ps_parents.dbValues.length == 0) {
  //     topItem = itemGroup[i];
  //   }
  // }
  // await com.getProperties(tt, ['ps_parents']);
  // if (tt.props.ps_parents.dbValues.length == 0) {
  //   appCtxService.registerCtx('hide', false);
  //   return;
  // }
  // let hi = com.getObject(tt.props.ps_parents.dbValues[0]);
  // console.log({ hi });

  // let hello = await bomUtils.getOccurrences3(hi);
  // console.log({ hello });
  // parentData = hello.ServiceData.modelObjects[hello.parentOccurrence.occurrenceId];

  // lgepCommonUtils.delay(200);
  // com.getProperties(parentData, ['awb0ArchetypeRevDescription']);
  // // console.log(parentData.props.awb0ArchetypeRevDescription);
  // // if (parentData.props.awb0ArchetypeRevDescription == undefined) {
  // //   goToCheckList();
  // // }
  // console.log({ parentData });
  // if (parentData.props.awb0ArchetypeRevDescription.dbValues[0] == '') {
  //   appCtxService.registerCtx('hide', false);
  // }
  // let searchInput = {
  //   attributesToInflate: ['object_name', 'object_desc', 'L2_DesignStandardRel', 'awb0ArchetypeRevDescription', 'item_id', 'l2_current_project'],
  //   maxToLoad: -1,
  //   maxToReturn: -1,
  //   providerName: 'Awp0FullTextSearchProvider',
  //   searchCriteria: {
  //     searchString: '*' + parentData.props.awb0ArchetypeRevDescription.dbValues[0] + '*',
  //   },
  //   searchFilterFieldSortType: 'Priority',
  //   searchFilterMap6: {
  //     'WorkspaceObject.object_type': [
  //       {
  //         searchFilterType: 'StringFilter',
  //         stringValue: 'L2_StructureRevision',
  //         colorValue: '',
  //         stringDisplayValue: '',
  //         startDateValue: '',
  //         endDateValue: '',
  //         startNumericValue: 0,
  //         endNumericValue: 0,
  //         count: 0,
  //         selected: false,
  //         startEndRange: '',
  //       },
  //     ],
  //   },
  //   searchSortCriteria: [],
  //   startIndex: 0,
  // };

  // let params = {
  //   types: [
  //     {
  //       name: 'WorkspaceObject',
  //       properties: [
  //         { name: 'object_name' },
  //         { name: 'creation_date' },
  //         { name: 'items_tag' },
  //         { name: 'l2_current_project' },
  //         { name: 'item_id' },
  //         { name: 'awb0ArchetypeRevDescription' },
  //       ],
  //     },
  //   ],
  // };

  // let result = await query.performSearchViewModel4(null, searchInput, params);
  // let checkList;
  // let name;
  // let selectornot;

  // if (tableInfo._tableInstance.dataProvider.selectedObjects.length == 0) {
  //   selectornot = tableInfo._tableInstance.dataProvider.viewModelCollection.loadedVMObjects[0];
  // } else {
  //   selectornot = tableInfo._tableInstance.dataProvider.selectedObjects[0];
  // }
  // //코드 수정 예정
  // // for (let i = 0; i < result.searchResults.length; i++) {
  // //   if (result.searchResults[i].props.l2_current_project !== undefined) {
  // //     if (result.searchResults[i].props.l2_current_project.dbValues[0] === parentData.props.awb0ArchetypeRevDescription.dbValues[0]) {
  // //       //result[i]가 되어야 함
  // //       checkList = result.searchResults[0];
  // //       break;
  // //     }
  // //   }
  // // }
  // console.log(result);
  // for (let i = 0; i < result.searchResults.length; i++) {
  //   if (result.searchResults[i].props.l2_current_project !== undefined) {
  //     if (result.searchResults[i].props.l2_current_project.dbValues[0] === parentData.props.awb0ArchetypeRevDescription.dbValues[0]) {
  //       name = result.searchResults[i].props.object_name.dbValues[0].split('_')[1];
  //       if (result.searchResults[i].props.object_name.dbValues[0].split('_')[1] === selectornot.props.awb0ArchetypeName.dbValues[0]) {
  //         checkList = result.searchResults[i];
  //         appCtxService.registerCtx('hide', true);
  //         break;
  //       } else {
  //         appCtxService.registerCtx('hide', false);
  //         return;
  //       }
  //     }
  //   }
  // }
}

let exports = {};

export default exports = {
  goToCheckList,
  hideButton,
};

app.factory('L2_DesignProjectService', () => exports);
