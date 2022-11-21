import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc, { showInfo } from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import msg from 'js/utils/lgepMessagingUtils';
import appCtxService from 'js/appCtxService';
import vmoService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import bomUtils from 'js/utils/lgepBomUtils';
import eventBus from 'js/eventBus';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import uwPropertyService from 'js/uwPropertyService';
import { addModelViewDataset } from 'js/viewerSecondaryModelInteractionService';
import { convertObjSearchResponseToLovEntries } from 'js/aceInlineAuthoringHandler';

var $ = require('jQuery');

export async function productStructureTree(ctx, data) {
  let va = vms.getViewModelUsingElement(document.getElementById('proStr'));
  //console.log({va});
  let uid = [];
  let a = va.dataProviders.productStructureTreeDataProvider.viewModelCollection.loadedVMObjects;
  let b;

  for (let i = 0; i < a.length; i++) {
    uid.push(a[i].uid);
    //console.log(Object.values(a[i].props));
    b = Object.values(a[i].props);
    // uwPropertyService.setIsPropertyModifiable(b, true);
  }
  // uwPropertyService.setIsEditable(b, true);

  let vaSelected = va.dataProviders.productStructureTreeDataProvider.selectedObjects[0];
  ctx.selected = vaSelected;

  return {
    uid: uid,
  };
}

export async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input) {
  //console.log({ ctx });
  // const popData = vms.getViewModelUsingElement(document.getElementById("partTree"));

  //console.log(appCtxService);
  let userGroup = appCtxService.ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];

  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Product');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  appCtxService.registerCtx('folderUid', homeFolder);
  let firstCheck = false;
  let homeUid;

  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.displayName == 'top') {
    homeUid = homeFolder;
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }

  let loadObj;
  loadObj = await com.loadObject(homeUid);

  let treeObj = await com.getObject(homeUid);
  let tesBom = [];
  let response;
  let expandResult = [];
  let eResult;
  let exResult;
  if (nodeBeingExpanded.type == 'L2_ProdStructureRevision') {
    let test = await bomUtils.createBOMWindow(null, treeObj);
    expandResult = await bomUtils.expandPSOneLevel([test.bomLine]);
    await com.getProperties(test.bomline, ['bl_child_lines', 'object_name', 'bl_item_object_name']);

    if (expandResult.output[0].children.length > 0) {
      eResult = expandResult.output[0].children;
    }
    for (let i = 0; i < eResult.length; i++) {
      await com.getProperties(eResult[i].bomLine, [
        'bl_child_lines',
        'object_name',
        'bl_item_object_name',
        'bl_rev_item_revision',
        'bl_rev_item_revision_id',
        'bl_item',
        'bl_rev_current_id_uid',
        'bl_rev_revision_list',
      ]);
    }
    await bomUtils.saveBOMWindow(test.bomWindow);
    await bomUtils.closeBOMWindow(test.bomWindow);
    response = eResult;
  } else if (nodeBeingExpanded.type == 'BOMLine') {
    //console.log("확인");
    //console.log({treeObj});
    tesBom.push(com.getObject(treeObj.props.bl_child_lines.dbValues[0]));
    response = tesBom;
    await com.getProperties(response, [
      'bl_child_lines',
      'object_name',
      'bl_item_object_name',
      'bl_rev_item_revision',
      'bl_rev_item_revision_id',
      'bl_item',
      'bl_rev_current_id_uid',
      'bl_rev_revision_list',
    ]);
    //console.log({response});
  } else {
    let attributesOftreeObj = ['contents'];
    await com.getProperties(treeObj, attributesOftreeObj);
    response = await com.getObject(treeObj.props.contents.dbValues);
    if (firstCheck) {
      let temp = [];
      for (let i = 0; i < response.length; i++) {
        if (response[i].props.object_string.uiValues[0] == userGroup) {
          temp.push(response[i]);
          await com.getProperties(temp, ['contents']);
          temp = await com.getObject(temp[0].props.contents.dbValues);
          break;
        }
      }
      response = temp;
      //console.log({temp});
    }

    let attributesOfresponse = [
      'contents',
      'object_name',
      'object_desc',
      'fnd0InProcess',
      'ics_subclass_name',
      'object_type',
      'checked_out',
      'owning_user',
      'owning_group',
      'last_mod_date',
      'release_statuses',
      'revision_list',
      'item_id',
      'ps_children',
    ];

    await com.getProperties(response, attributesOfresponse);

    let revi = [];

    for (let i = 0; i < response.length; i++) {
      if (response[i].type == 'L2_ProdStructure') {
        revi.push(await com.getLatestItemRevisionByItemId(response[i].props.item_id.dbValues[0]));
        //console.log({revi});
      }
    }

    for (let i = 0; i < response.length; i++) {
      if (response[i].type == 'L2_ProdStructure') {
        response = revi;
      }
    }
    await com.getProperties(response, attributesOfresponse);

    //console.log({response});

    for (let i = 0; i < response.length; i++) {
      if (response[i].type == 'L2_ProdStructureRevision') {
        let test = await bomUtils.createBOMWindow(null, response[i]);
        expandResult = await bomUtils.expandPSOneLevel([test.bomLine]);
        await bomUtils.saveBOMWindow(test.bomWindow);
        await bomUtils.closeBOMWindow(test.bomWindow);

        if (expandResult.output[0].children.length > 0) eResult = expandResult.output[0].children;
      }
    }
  }
  await com.getProperties(eResult, ['bl_child_lines', 'bl_rev_ps_parents', 'bl_bomview', 'bl_parent', 'bl_item']);
  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if ((treeNode.type == 'L2_ProdStructure', treeNode.type == 'L2_ProdStructureRevision')) {
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.object_name.dbValue,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      Object.assign(vmo, temp);
      //console.log({vmo});
      if (temp.type == 'L2_ProdStructureRevision') {
        //console.log({eResult});
        if (temp.props.ps_children.dbValues.length == 0) {
          vmo.isLeaf = true;
        } else if (temp.props.ps_children.dbValues.length > 0) {
          if (eResult == undefined) {
            vmo.isLeaf == true;
          } else {
            let check = eResult[0].bomLine;
            //console.log(check);
            if (!Array.isArray(check)) {
              check = [check];
            }
            let resultType = true;
            _.forEach(check, function (t) {
              if (
                t.type == 'BOMLine' ||
                t.type == 'L2_ProdStructureRevision' ||
                t.type == 'L2_ProdStructure' ||
                treeNode.type == 'Item' ||
                treeNode.type == 'ItemRevision'
              ) {
                resultType = false;
              }
            });
            vmo.isLeaf = resultType;
          }
        }
      } else {
        if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
          vmo.isLeaf = true;
        } else if (temp.props.contents.dbValues.length > 0 || temp.props.ps_children.length > 0) {
          let check = com.getObject(temp.props.contents.dbValues);
          if (!Array.isArray(check)) {
            check = [check];
          }
          let resultType = true;
          _.forEach(check, function (t) {
            if (t.type == 'L2_ProdStructure' || t.type == 'L2_ProdStructureRevision') {
              resultType = false;
            }
          });
          vmo.isLeaf = resultType;
        }
      }

      for (const prop of Object.values(vmo.props)) {
        //console.log({prop});
        uwPropertyService.setIsEditable(prop, true);
        uwPropertyService.setIsPropertyModifiable(prop, true);
      }

      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
      //console.log({viewArr});
    } else if (treeNode.type == 'BOMLine') {
      com.getProperties(treeNode, ['bl_child_lines', 'bl_rev_ps_parents', 'bl_bomview', 'bl_parent', 'bl_item_object_name', 'bl_item_pid']);
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      //console.log({vmo});
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.bl_item_object_name.dbValues,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      Object.assign(vmo, temp);
      if (treeNode.props.bl_child_lines.dbValues.length == 0 || treeNode.props.bl_child_lines.dbValues == 'undefined') {
        vmo.isLeaf = true;
      } else if (treeNode.props.bl_child_lines.dbValues.length > 1) {
        let check = treeNode;
        //console.log(check);
        if (!Array.isArray(check)) {
          check = [check];
        }
        let resultType = true;
        _.forEach(check, function (t) {
          if (t.type == 'BOMLine') {
            resultType = false;
          }
        });
        vmo.isLeaf = true;
      }
      for (const prop of Object.values(vmo.props)) {
        //console.log({prop});
        uwPropertyService.setIsEditable(prop, true);
        uwPropertyService.setIsPropertyModifiable(prop, true);
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.cellHeader2 = nodeBeingExpanded.uid;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      vmo.props.object_name = vmo.props.bl_item_object_name;
      viewArr.push(vmo);
      //console.log({viewArr});
    } else if (treeNode.bomLine.type == 'BOMLine') {
      com.getProperties(treeNode.bomLine, ['bl_child_lines', 'bl_rev_ps_parents', 'bl_bomview', 'bl_parent', 'bl_item_object_name', 'bl_item_pid']);
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode.bomLine);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.bl_item_object_name.dbValues,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
      Object.assign(vmo, temp);
      if (treeNode.bomLine.props.bl_child_lines.dbValues.length == 0 || treeNode.bomLine.props.bl_child_lines.dbValues == 'undefined') {
        vmo.isLeaf = true;
      } else if (treeNode.bomLine.props.bl_child_lines.dbValues.length > 1) {
        let check = treeNode.bomLine;
        //console.log(check);
        if (!Array.isArray(check)) {
          check = [check];
        }
        let resultType = true;
        _.forEach(check, function (t) {
          if (t.type == 'BOMLine') {
            resultType = false;
          }
        });
        vmo.isLeaf = true;
      }
      for (const prop of Object.values(vmo.props)) {
        //console.log({prop});
        uwPropertyService.setIsEditable(prop, true);
        uwPropertyService.setIsPropertyModifiable(prop, true);
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.cellHeader2 = nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      vmo.props.object_name = vmo.props.bl_item_object_name;
      viewArr.push(vmo);
      //console.log({viewArr});
    }
  });
  if (sortCriteria && sortCriteria.length > 0) {
    var criteria = sortCriteria[0];
    var sortDirection = criteria.sortDirection;
    var sortColName = criteria.fieldName;

    if (sortDirection === 'ASC') {
      viewArr.sort(function (a, b) {
        if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return 1;
        if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
        if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return -1;
      });
    } else if (sortDirection === 'DESC') {
      viewArr.sort(function (a, b) {
        if (a.props[sortColName].uiValues[0] < b.props[sortColName].uiValues[0]) return 1;
        if (a.props[sortColName].uiValues[0] === b.props[sortColName].uiValues[0]) return 0;
        if (a.props[sortColName].uiValues[0] > b.props[sortColName].uiValues[0]) return -1;
      });
    }
  }

  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
}

export function selectedCtx(ctx) {
  let va = vms.getViewModelUsingElement(document.getElementById('proStr'));
  //console.log(va);
  let vaSelected = va.dataProviders.productStructureTreeDataProvider.selectedObjects[0];
  ctx.selected = vaSelected;
}

export function saveEmployeeEdits() {
  //console.log("안녕");

  let popData = vms.getViewModelUsingElement(document.getElementById('proStr'));
  let modelDa = popData.dataProviders.productStructureTreeDataProvider.viewModelCollection.loadedVMObjects;
  //console.log({modelDa});
  for (let i = 0; i < modelDa.length; i++) {
    if (modelDa[i].type != 'L2_ProdStructureRevision') {
      com.setProperty(modelDa[i], 'bl_item_object_name', modelDa[i].props.bl_item_object_name.dbValues[0]);
    } else {
      com.setProperty(modelDa[i], 'object_name', modelDa[i].props.object_name.dbValues[0]);
    }
  }
}

export async function addModel(ctx, data) {
  let popData = vms.getViewModelUsingElement(document.getElementById('proStr'));

  let tempUid = ctx.folderUid;
  let userGroup = appCtxService.ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];

  let putFolder = com.getObject(tempUid);
  let attributesOftreeObj = ['contents'];
  com.getProperties(putFolder, attributesOftreeObj);
  let response1 = com.getObject(putFolder.props.contents.dbValues);
  let pFolder = [];
  for (let i = 0; i < response1.length; i++) {
    if (response1[i].props.object_string.uiValues[0] == userGroup) {
      pFolder.push(response1[i]);
      pFolder = com.getObject(pFolder[0].uid);
    }
  }
  //console.log(pFolder);
  if (popData.dataProviders.productStructureTreeDataProvider.selectedObjects.length == 0) {
    let check = com.createItem('', 'L2_ProdStructure', data.addModelTitleText.dbValues[0], '', pFolder);
    msg.show(0, `${data.addModelTitleText.dbValues[0]} 아이템이 생성되었습니다.`, ['닫기'], [function () {}]);
  } else {
    let pObj = popData.dataProviders.productStructureTreeDataProvider.selectedObjects[0];
    //console.log({pObj});

    let modelObj = com.getObject(pObj.uid);
    let modelItem = await com.createItem('', 'L2_ProdStructure', data.addModelTitleText.dbValues[0]);
    let modelItemRevforBom = modelItem.output[0].itemRev;
    //console.log(modelItemRevforBom);
    if (pObj.type == 'L2_ProdStructureRevision') {
      let pRev = await bomUtils.createBOMWindow(null, modelObj);
      await bomUtils.add(pRev.bomLine, modelItemRevforBom);
      //    //console.log(pRev.bomLine);
      await bomUtils.saveBOMWindow(pRev.bomWindow);
      await bomUtils.closeBOMWindow(pRev.bomWindow);
    } else {
      try {
        let changeModelObj = com.getObject(pObj.props.bl_item.dbValues[0]);
        //console.log(changeModelObj)
        let mRevision = await com.getLatestItemRevision(changeModelObj);
        //console.log({mRevision});

        let pRev = await bomUtils.createBOMWindow(null, mRevision);
        //console.log(pRev);
        await bomUtils.add(pRev.bomLine, modelItemRevforBom);
        await bomUtils.saveBOMWindow(pRev.bomLine.bomWindow);
        await bomUtils.closeBOMWindow(pRev.bomLine.bomWindow);
      } catch (err) {
        com.deleteObject(modelItem);
        //console.log("만든 아이템 삭제");
      }
    }

    msg.show(0, `${data.addModelTitleText.dbValues[0]} Bom 객체가 생성되었습니다.`, ['닫기'], [function () {}]);
  }

  eventBus.publish('productStructureTree.plTable.reload');
}

export async function deleteItem() {
  let popData = vms.getViewModelUsingElement(document.getElementById('proStr'));
  if (popData.dataProviders.productStructureTreeDataProvider.selectedObjects.length == 0) {
    msg.show(1, '객체를 선택하세요', ['닫기'], [function () {}]);
  }
  let selectedBom = popData.dataProviders.productStructureTreeDataProvider.selectedObjects[0];
  //console.log(selectedBom);
  com.getObject(selectedBom.cellHeader2);

  let pItemRev;
  if (selectedBom.type == 'L2_ProdStructureRevision') {
    let revtoItem = await com.getItemByItemRevision(selectedBom);
    //console.log({revtoItem});
    msg.show(
      1,
      '아이템을 삭제하시겠습니까?',
      ['삭제', '취소'],
      async function () {
        await com.deleteObject(revtoItem);
        notySvc.showInfo('아이템삭제 완료');
        eventBus.publish('productStructureTree.plTable.reload');
      },
      function () {},
    );
  } else {
    let pItem = selectedBom.cellHeader2;
    let pId = pItem.split(',');
    if (selectedBom.childNdx == 2) {
      pItemRev = await com.getObject(pId[0]);
      //console.log(pItemRev);
    } else {
      pItemRev = com.getObject(pItem);
      let getItem = com.getObject(pItemRev.props.bl_item.dbValues[0]);
      pItemRev = await com.getLatestItemRevision(getItem);
      //console.log(pItemRev);
    }

    let bom = await bomUtils.createBOMWindow(null, pItemRev);
    //console.log(bom);
    await com.getProperties(bom.bomLine, ['bl_child_lines']);
    let child = com.getObject(bom.bomLine.props.bl_child_lines.dbValues);
    //console.log({child});
    for (let i of child) {
      let string = i.props.object_string.dbValues[0].split('-');
      string = string[string.length - 1];
      if (i.props.object_string.dbValues[0] == selectedBom.props.object_string.dbValues[0]) {
        child = i;
        break;
      }
    }

    msg.show(
      1,
      'Bom을 제거하시겠습니까?',
      ['삭제', '취소'],
      async function () {
        await bomUtils.removeChildrenFromParentLine([child]);
        await bomUtils.saveBOMWindow(bom.bomWindow);
        await bomUtils.closeBOMWindow(bom.bomWindow);
        notySvc.showInfo('Bom제거 완료');
        eventBus.publish('productStructureTree.plTable.reload');
      },
      function () {},
    );

    // await bomUtils.removeChildrenFromParentLine(selectedBom);
  }
  // bomUtils.removeChildrenFromParentLine(selectedBom);
}

let exports = {};

export default exports = {
  productStructureTree,
  loadEmployeeTreeTableData,
  selectedCtx,
  saveEmployeeEdits,
  addModel,
  deleteItem,
};

app.factory('lgepProductStructureService', () => exports);
