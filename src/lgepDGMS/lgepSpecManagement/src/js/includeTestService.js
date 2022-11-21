import app from 'app';
import SoaService from 'soa/kernel/soaService';
import _ from 'lodash';
import com from 'js/utils/lgepObjectUtils';
import vms from 'js/viewModelService';
import vmoService from 'js/viewModelObjectService';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import popupService from 'js/popupService';
import exceljs from 'exceljs';
import msg from 'js/utils/lgepMessagingUtils';
import cdmSvc from 'soa/kernel/clientDataModel';
import locale from 'js/utils/lgepLocalizationUtils';
import editService from 'js/editHandlerService';
import AwPromiseService from 'js/awPromiseService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';

let tableSearchresult;
let homeResultData = [];
let tableResult = [];

function includeClassificationTree() {
  // let partManagement = "wmiJNEHAZx_JkD";
  let partManagement = 'AfmJ_w4OZx_JkD';

  return {
    result: undefined,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, sortCriteria, input, ctx) {
  let userGroup = ctx.userSession;
  userGroup = userGroup.props.group.uiValues[0];
  let tempUid = await lgepPreferenceUtils.getPreference('L2_Part_Classification_Folder');
  let homeFolder = tempUid.Preferences.prefs[0].values[0].value;
  let firstCheck = false;
  let homeUid;
  if (nodeBeingExpanded.uid == input.rootNode.uid) {
    nodeBeingExpanded.alternateID = nodeBeingExpanded.uid;
  }

  if (nodeBeingExpanded.uid == 'top') {
    homeUid = homeFolder;
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
  try {
    let getPropertiesParam = {
      objects: response,
      attributes: [
        'object_string',
        'contents',
        'object_desc',
        'fnd0InProcess',
        'ics_subclass_name',
        'object_type',
        'checked_out',
        'owning_user',
        'owning_group',
        'last_mod_date',
        'release_statuses',
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  let viewArr = [];

  _.forEach(response, function (treeNode) {
    if (treeNode.type == 'L2_ClsfyMgmtFolder' || treeNode.type == 'Folder') {
      let vmo = vmoService.constructViewModelObjectFromModelObject(treeNode);
      let temp = vmo;
      vmo = treeView.createViewModelTreeNode(
        vmo.uid,
        vmo.type,
        vmo.props.object_string.dbValue,
        nodeBeingExpanded.levelNdx + 1,
        nodeBeingExpanded.levelNdx + 2,
        vmo.typeIconURL,
      );
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

async function getChildrenData(data, ctx, eventTable) {
  if (eventTable.selectedObjects.length != 0) {
    let userid = com.getObject(eventTable.selectedObjects[0].uid);

    try {
      let getResult = {
        objects: [userid],
        attributes: [
          'object_string',
          'object_name',
          'contents',
          'object_type',
          'owning_group',
          'owning_user',
          'checked_out',
          'last_mod_date',
          'release_status_list',
          'IMAN_specification',
        ],
      };

      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }

    let getHomeChildren = userid.props.contents.dbValues;

    let getInfoHomeChildren = com.getObject(getHomeChildren);

    let revisionUid = [];

    try {
      let getResult = {
        objects: getInfoHomeChildren,
        attributes: ['object_name', 'revision_list', 'contents'],
      };
      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }
    let specManageSrc = [];

    if (data.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].childNdx == 1) {
      let childContents = [];
      _.forEach(getInfoHomeChildren, function (value) {
        childContents.push(com.getObject(value.props.contents.dbValues));
      });

      childContents = childContents.flat();

      try {
        let getResult = {
          objects: childContents,
          attributes: ['object_name', 'revision_list', 'contents'],
        };
        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }

      for (let i = 0; i < childContents.length; i++) {
        revisionUid.push(childContents[i].props.revision_list.dbValues[0]);
      }

      for (let i = 0; i < revisionUid.length; i++) {
        specManageSrc.push(com.getObject(revisionUid[i]));
      }

      try {
        let getResult = {
          objects: specManageSrc,
          attributes: [
            'object_name',
            'contents',
            'object_type',
            'owning_group',
            'owning_user',
            'l2_model_name',
            'l2_division',
            'l2_model_type',
            'l2_model_maker',
            'l2_reference_models',
            'l2_reference_parts',
            'l2_spec_diameter',
            'l2_spec_length',
            'l2_spec_weight',
            'l2_spec_rpm',
            'l2_spec_voltage',
            'l2_spec_material',
            'IMAN_specification',
          ],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }
    } else if (data.dataProviders.partMgmtTreeDataProvider.selectedObjects[0].childNdx == 2) {
      for (let i = 0; i < getInfoHomeChildren.length; i++) {
        specManageSrc.push(getInfoHomeChildren[i]);
      }

      try {
        let getResult = {
          objects: specManageSrc,
          attributes: [
            'object_name',
            'contents',
            'object_type',
            'owning_group',
            'owning_user',
            'l2_model_name',
            'l2_division',
            'l2_model_type',
            'l2_model_maker',
            'l2_reference_models',
            'l2_reference_parts',
            'l2_spec_diameter',
            'l2_spec_length',
            'l2_spec_weight',
            'l2_spec_rpm',
            'l2_spec_voltage',
            'l2_spec_material',
            'IMAN_specification',
          ],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }
    }

    if (tableSearchresult !== undefined) {
      if (tableSearchresult == null) {
        return {
          totalFound: 0,
          example: null,
        };
      }
      let arr = [];
      specManageSrc = specManageSrc.filter((element, index) => {
        return specManageSrc.indexOf(element) === index;
      });
      _.forEach(specManageSrc, function (value) {
        arr.push(vmoService.constructViewModelObjectFromModelObject(value));
      });

      data.dataProviders.partMgmtTableDataProvider.viewModelCollection.setViewModelObjects(arr);
    } else if (tableSearchresult == undefined) {
      let arr = [];
      let itemName = [];
      specManageSrc = specManageSrc.filter((element, index) => {
        return specManageSrc.indexOf(element) === index;
      });
      _.forEach(specManageSrc, function (value) {
        arr.push(vmoService.constructViewModelObjectFromModelObject(value));
      });

      data.dataProviders.partMgmtTableDataProvider.viewModelCollection.setViewModelObjects(arr);
    }
  } else if (eventTable.selectedObjects.length == 0) {
    let arr = [];
    data.dataProviders.partMgmtTableDataProvider.viewModelCollection.setViewModelObjects(arr);
  }
}

let exports = {};

export default exports = {
  includeClassificationTree,
  loadEmployeeTreeTableData,
  getChildrenData,
};

app.factory('includeTestService', () => exports);
