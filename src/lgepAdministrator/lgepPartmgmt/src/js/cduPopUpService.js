import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import uwPropertyService from 'js/uwPropertyService';
import msg from 'js/utils/lgepMessagingUtils';
import vmoService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';

var $ = require('jQuery');
let results = [];

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  //console.log({ ctx });
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Classification_Part');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let firstCheck = false;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  } else {
    nodeBeingExpanded.uid == nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = homeFolder;
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }
  let loadObj;
  loadObj = await com.loadObject(homeUid);

  let treeObj = loadObj.modelObjects[homeUid];

  let attributesOftreeObj = ['contents'];
  await com.getProperties(treeObj, attributesOftreeObj);
  let response = com.getObject(treeObj.props.contents.dbValues);
  if (firstCheck) {
    let temp = [];
    for (let i = 0; i < response.length; i++) {
      if (response[i].props.object_string.uiValues[0] == userGroup) {
        temp.push(response[i]);
        await com.getProperties(temp, 'contents');
        temp = com.getObject(temp[0].props.contents.dbValues);
      }
    }
    response = temp;
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
  ];
  await com.getProperties(response, attributesOfresponse);

  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if (treeNode.type == 'L2_ClsfyMgmtFolder' || treeNode.type == 'Folder') {
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, vmo.props.object_name.dbValue, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2);
      Object.assign(vmo, temp);
      if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
        vmo.isLeaf = true;
      } else if (temp.props.contents.dbValues.length > 0) {
        let check = com.getObject(temp.props.contents.dbValues);
        if (!Array.isArray(check)) {
          check = [check];
        }
        let resultType = true;
        _.forEach(check, function (t) {
          if (t.type == 'L2_ClsfyMgmtFolder' || t.type == 'Folder') {
            resultType = false;
          }
        });
        vmo.isLeaf = resultType;
      }

      for (const prop of Object.values(vmo.props)) {
        //console.log({prop});
        uwPropertyService.setIsEditable(prop, true);
        uwPropertyService.setIsPropertyModifiable(prop, true);
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
      results.push(vmo);
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
// export async function addPartData(data,ctx) {
//     //console.log("폴더 만들기");
//     const popData = vms.getViewModelUsingElement(document.getElementById("partTree"));
//     //console.log({popData});
//     //console.log({data});
//     //console.log({ctx});

//     let tempUid = await lgepPreferenceUtils.getPreference("L2_Classification_Part");
//     let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
//     let childrenOfHome = [];
//     let userName = ctx.userSession.props.group.displayValues[0];
//     let folderGroup;
//     let home = com.getObject(homeFolder);
//     //console.log(home);

//     for(let i=0; i<home.props.contents.dbValues.length;i++){
//         childrenOfHome.push(com.getObject(home.props.contents.dbValues[i]));
//     }
//     //console.log(childrenOfHome);
//     //console.log(userName);
//     for(let i=0; i<childrenOfHome.length;i++){
//         if(childrenOfHome[i].props.object_string.dbValues[0] ===userName){
//         folderGroup = childrenOfHome[i]
//         }
//     }
//     //console.log(folderGroup);

//     let parentFolderUID;
//     let folderName = data.addPartTitle.dbValue;
//     let parentFolderUIDLength;

//     parentFolderUIDLength = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects.length;
//     //console.log(parentFolderUIDLength);
//     if(parentFolderUIDLength == 0){
//          com.createFolder(folderName, "", folderGroup);
//          eventBus.publish("partMgmtTree.plTable.clientRefresh");
//          eventBus.publish("partMgmtTable.plTable.clientRefresh")
//     } else {

//      parentFolderUID = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].uid;
//     let parentFolder = com.getObject(parentFolderUID);
//     //console.log({folderName, parentFolder});

//       com.createFolder(folderName, "", parentFolder);
//       eventBus.publish("partMgmtTree.plTable.clientRefresh");
//     }
//     msg.show(0, `${folderName} 폴더가 생성되었습니다.`, ["닫기"], [
//         function () { }
//     ]);
//     eventBus.publish("partMgmtTree.plTable.clientRefresh");
// }

export function refreshTree(data) {
  eventBus.publish('partMgmtTree.plTable.clientRefresh');
  //console.log({data});
}

export async function getInfoTree(data, ctx) {
  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  //console.log({popData});
  //console.log({data});
  //console.log({ctx});

  let tempUid = await lgepPreferenceUtils.getPreference('L2_Part_Classification_Folder');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let childrenOfHome = [];
  let userName = ctx.userSession.props.group.displayValues[0];
  let folderGroup;
  let home = com.getObject(homeFolder);
  //console.log(home);

  for (let i = 0; i < home.props.contents.dbValues.length; i++) {
    childrenOfHome.push(com.getObject(home.props.contents.dbValues[i]));
  }
  //console.log(childrenOfHome);
  //console.log(userName);
  for (let i = 0; i < childrenOfHome.length; i++) {
    if (childrenOfHome[i].props.object_string.dbValues[0] === userName) {
      folderGroup = childrenOfHome[i];
    }
  }
  //console.log(folderGroup);
}

let exports = {};

export default exports = {
  loadEmployeeTreeTableData,
  getInfoTree,
  refreshTree,
};

app.factory('cduPopUpService', () => exports);
