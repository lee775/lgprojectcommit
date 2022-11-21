import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from 'js/utils/lgepObjectUtils';
import query from 'js/utils/lgepQueryUtils';
import _ from 'lodash';
import viewC from 'js/viewModelObjectService';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import vms from 'js/viewModelService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import message from 'js/utils/lgepMessagingUtils';
var $ = require('jQuery');
let selTreeNode;
let selStdData;

export function designStdPopupGetSize() {
  let setWidth = 0;
  let setHeight = 0;
  if (setWidth > window.innerWidth && setHeight > window.innerHeight) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (setWidth > window.innerWidth) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight > window.innerHeight) {
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 800 && window.innerWidth >= 1000) {
    setWidth = '1000px';
    setHeight = '800px';
  } else if (setWidth < window.innerWidth * 0.8 && setHeight < window.innerHeight * 0.8) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (setWidth < window.innerWidth * 0.8) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight < window.innerHeight * 0.8) {
    setHeight = window.innerHeight * 0.8 + 'px';
  }

  return {
    setWidth: setWidth,
    setHeight: setHeight,
  };
}

export function checkListPopupGetSize() {
  let setWidth = 0;
  let setHeight = 0;
  if (setWidth > window.innerWidth && setHeight > window.innerHeight) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (setWidth > window.innerWidth) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight > window.innerHeight) {
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 700 && window.innerWidth >= 1200) {
    setWidth = '1200px';
    setHeight = '700px';
  } else if (setWidth < window.innerWidth * 0.8 && setHeight < window.innerHeight * 0.8) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight * 0.8 + 'px';
  } else if (setWidth < window.innerWidth * 0.8) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight < window.innerHeight * 0.8) {
    setHeight = window.innerHeight * 0.8 + 'px';
  }

  return {
    setWidth: setWidth,
    setHeight: setHeight,
  };
}

export function itemEditPopupGetSize() {
  let setWidth = 0;
  let setHeight = 0;
  if (setWidth > window.innerWidth && setHeight > window.innerHeight) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight + 'px';
  } else if (setWidth > window.innerWidth) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight > window.innerHeight) {
    setHeight = window.innerHeight + 'px';
  } else if (window.innerHeight >= 1000 && window.innerWidth >= 1500) {
    setWidth = '1500px';
    setHeight = '1000px';
  } else if (setWidth < window.innerWidth * 0.8 && setHeight < window.innerHeight) {
    setWidth = window.innerWidth * 0.8 + 'px';
    setHeight = window.innerHeight + 'px';
  } else if (setWidth < window.innerWidth * 0.8) {
    setWidth = window.innerWidth * 0.8 + 'px';
  } else if (setHeight < window.innerHeight) {
    setHeight = window.innerHeight + 'px';
  }

  return {
    setWidth: setWidth,
    setHeight: setHeight,
  };
}

export function popupDesignStdSizeUpdate() {
  let editView = document.getElementsByClassName('aw-layout-panelContent');
  editView = editView[editView.length - 1];
  let width = editView.style.width.split('px');
  let height = editView.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  if (width > window.innerWidth && height > window.innerHeight) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width > window.innerWidth) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height > window.innerHeight) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 800 && window.innerWidth >= 1000) {
    editView.style.width = '1000px';
    editView.style.height = '800px';
  } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width < window.innerWidth * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height < window.innerHeight * 0.8) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  }
}

export function popupCheckListSizeUpdate() {
  let editView = document.getElementsByClassName('aw-layout-panelContent');
  editView = editView[editView.length - 1];
  let width = editView.style.width.split('px');
  let height = editView.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  if (width > window.innerWidth && height > window.innerHeight) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width > window.innerWidth) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height > window.innerHeight) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 700 && window.innerWidth >= 1200) {
    editView.style.width = '1200px';
    editView.style.height = '700px';
  } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width < window.innerWidth * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height < window.innerHeight * 0.8) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  }
}

export function popupSizeUpdate() {
  let editView = document.getElementsByClassName('aw-layout-panelContent');
  editView = editView[editView.length - 1];
  let width = editView.style.width.split('px');
  let height = editView.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  if (width > window.innerWidth && height > window.innerHeight) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width > window.innerWidth) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height > window.innerHeight) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 800 && window.innerWidth >= 1350) {
    editView.style.width = '1350px';
    editView.style.height = '800px';
  } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width < window.innerWidth * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height < window.innerHeight * 0.8) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  }
}

export function createResize() {
  let editView = document.getElementsByClassName('aw-layout-panelContent');
  editView = editView[2];
  let width = editView.style.width.split('px');
  let height = editView.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  if (width > window.innerWidth && height > window.innerHeight) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width > window.innerWidth) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height > window.innerHeight) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (window.innerHeight >= 800 && window.innerWidth >= 1300) {
    editView.style.width = '1300px';
    editView.style.height = '800px';
  } else if (width < window.innerWidth * 0.8 && height < window.innerHeight * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
    editView.style.height = window.innerHeight * 0.8 + 'px';
  } else if (width < window.innerWidth * 0.8) {
    editView.style.width = window.innerWidth * 0.8 + 'px';
  } else if (height < window.innerHeight * 0.8) {
    editView.style.height = window.innerHeight * 0.8 + 'px';
  }
}

export function settingLabel(data) {
  data.type.uiValue = selStdData.props.l2_document_type.dbValue;
  // data.rev.uiValue =
  data.docNumber.uiValue = selStdData.props.item_id.dbValue;
  data.title.uiValue = selStdData.props.object_name.dbValue;
  data.user.uiValue = selStdData.props.owning_user.uiValue;
  data.createDate.uiValue = selStdData.props.creation_date.uiValue;
  data.system.uiValue = selStdData.props.l2_classification.dbValue;
}

export function information(data) {
  selStdData = data.dataProviders.designStdData.selectedObjects[0];
  let name = data.dataProviders.designStdData.selectedObjects[0].props.object_name.dbValue;
  if (data.dataProviders.designStdData.selectedObjects.length > 1) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'oneSelectCheck'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    return {
      informationState: false,
    };
  } else if (data.dataProviders.designStdData.selectedObjects.length < 1) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'itemSelectCheck'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    return {
      informationState: false,
    };
  } else {
    return {
      informationState: true,
      name: name,
    };
  }
}

export async function editTreeObject(data) {
  let folderName = data.objName.uiValue;
  if (!folderName || folderName == '') {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'noneFolderName'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    data.folderNotName = true;
    return;
  }
  let value = com.getObject(selTreeNode.uid);
  let param = {
    objects: [value],
    attributes: {
      object_name: {
        stringVec: [folderName],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    message.show(
      0,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'editComplete'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
  } catch (err) {
    //console.log(err);
  }
  eventBus.publish('sequenceTree.plTable.reload');
}

export function editInitialize(data) {
  data.objName.dbValue = selTreeNode.props.object_string.dbValues[0];
  data.objDesc.dbValue = selTreeNode.props.object_desc.dbValues[0];
}

export async function selEditData(data) {
  if (data != undefined) {
    selTreeNode = data;
  } else {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'editCheck'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    return {
      result: false,
    };
  }
  return {
    result: true,
  };
}

async function dataLoad(ctx) {
  return {
    result: undefined,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  let firstCheck = false;
  let homeUid;

  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = 'AGpNCJJd5p7XAC';
    firstCheck = true;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }

  let loadObj;
  try {
    let getPropertiesParam = {
      uids: [homeUid],
    };
    loadObj = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let treeObj = loadObj.modelObjects[homeUid];

  try {
    let getPropertiesParam = {
      objects: [treeObj],
      attributes: ['contents'],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let response = com.getObject(treeObj.props.contents.dbValues);
  if (firstCheck) {
    let userGroup = ctx.userSession.props.group_name.uiValue;
    let groupFolder = false;
    for (let i = 0; i < response.length; i++) {
      if (response[i].props.object_string.uiValues[0] == userGroup) {
        groupFolder = true;
        response = [response[i]];
        break;
      }
    }
    // if(!groupFolder){
    //     try {
    //         let folderData = {
    //             folders: [{
    //                 name: userGroup
    //             }],
    //             container: treeObj
    //         };
    //         let createGroupFolder = await SoaService.post("Core-2006-03-DataManagement", "createFolders", folderData);
    //         response = [createGroupFolder.output[0].folder];
    //     } catch (err) {
    //         //console.log(err);
    //     }
    // }
    firstCheck = false;
  }
  try {
    let getPropertiesParam = {
      objects: response,
      attributes: [
        'object_string',
        'contents',
        'object_name',
        'fnd0InProcess',
        'ics_subclass_name',
        'object_type',
        'checked_out',
        'owning_user',
        'owning_group',
        'last_mod_date',
        'release_statuses',
        'revision_list',
        'IMAN_specification',
        'object_desc',
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }
  for (let i = 0; i < response.length; i++) {
    if (response[i].type != 'Folder' && response[i].type != 'L2_ClsfyMgmtFolder') {
      let temp = response[i].props;
      let revision = com.getObject(response[i].props.revision_list.dbValues[response[i].props.revision_list.dbValues.length - 1]);
      Object.assign(revision.props, temp);
      response[i] = revision;
    }
  }
  await com.getProperties(response, ['object_name', 'IMAN_specification', 'object_desc', 'l2_checklists']);
  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if (treeNode.type == 'Folder' || treeNode.type == 'L2_ClsfyMgmtFolder') {
      let nodeName = treeNode.props.object_name.dbValues[0];
      let vmo = viewC.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(vmo.uid, vmo.type, nodeName, nodeBeingExpanded.levelNdx + 1, nodeBeingExpanded.levelNdx + 2, vmo.typeIconURL);
      Object.assign(vmo, temp);
      if (temp.props.contents == undefined || temp.props.contents.dbValues.length < 1) {
        vmo.isLeaf = true;
      } else if (temp.props.contents.dbValues.length > 0) {
        let tempContent = com.getObject(temp.props.contents.dbValues);
        vmo.isLeaf = true;
        for (let i of tempContent) {
          if (i.type == 'Folder' || i.type == 'L2_ClsfyMgmtFolder') {
            vmo.isLeaf = false;
            break;
          }
        }
      }
      vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
      vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;
      viewArr.push(vmo);
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

let exports = {};

export default exports = {
  dataLoad,
  loadEmployeeTreeTableData,
  selEditData,
  editInitialize,
  editTreeObject,
  information,
  settingLabel,
  popupSizeUpdate,
  popupCheckListSizeUpdate,
  popupDesignStdSizeUpdate,
  itemEditPopupGetSize,
  checkListPopupGetSize,
  designStdPopupGetSize,
  createResize,
};

app.factory('sequencePopupService', () => exports);
