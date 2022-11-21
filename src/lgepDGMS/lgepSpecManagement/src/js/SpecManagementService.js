import app from 'app';
import SoaService from 'soa/kernel/soaService';
import _ from 'lodash';
import common from 'js/utils/lgepObjectUtils';
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

let tableSearchresult;
let homeData = null;
let homeResultData = [];
let addSaveName = [];
let addSaveData = [];
let addSaveDataUid = [];
let addPartsSaveDataUid = [];
let tableResult = [];
let findAllItemProps = [];
let lengthTemp = 0;
let datasetUid;
let createItemUid;
let tableMakerListValue = [];
// paging할때 쓸 애들
// let selectedObject = [];
// let showList = 7;
// let nowPage = 1;
// let startPage;
// let endPage;
// let devide = 10;

export function commandbarChange(data, ctx) {
  if (data.eventData.state == 'canceling' || data.eventData.state == 'saved') {
    ctx.startEdit = true;
  }
}

async function parent(data, ctx) {
  let specManagement = 'garJI3FyZx_JkD';

  let getPropertiesSpec = null;
  let specObj;
  let homeFolder;

  getPropertiesSpec = {
    uids: [specManagement],
  };

  try {
    let getSpecmgmt = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getPropertiesSpec);
    homeFolder = getSpecmgmt.modelObjects[specManagement];
  } catch (err) {
    //console.log(err);
  }

  let homeChildren = {
    objects: [homeFolder],
    attributes: ['contents'],
  };

  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', homeChildren);
  } catch (err) {
    //console.log(err);
  }

  let homeContents = homeFolder.props.contents.dbValues;
  let specProblem = common.getObject(homeContents);

  return {
    result: specProblem,
  };
}

async function loadEmployeeTreeTableData(result, nodeBeingExpanded, data, ctx) {
  ctx.startEdit = true;
  var homeUid;
  if (Array.isArray(nodeBeingExpanded.uid)) {
    homeUid = nodeBeingExpanded.uid[0].uid;
  } else {
    homeUid = nodeBeingExpanded.uid;
  }
  if (nodeBeingExpanded.origin) homeUid = nodeBeingExpanded.origin;
  let treeObj = common.getObject(homeUid);

  try {
    let getPropertiesParam = {
      objects: [treeObj],
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

  let childUid = treeObj.props.contents.dbValues;
  let response = common.getObject(childUid);

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
    let propsTemp = vmo.props;
    vmo.props = propsTemp;
    Object.assign(vmo, temp);
    if (temp.props.contents == undefined || temp.props.contents.dbValues.length == 0) {
      vmo.isLeaf = true;
    } else if (temp.props.contents.dbValues.length > 0) {
      let check = common.getObject(temp.props.contents.dbValues);
      if (!Array.isArray(check)) {
        check = [check];
      }
      let resultType = true;
      _.forEach(check, function (t) {
        if (t.type == 'Folder') {
          resultType = false;
        }
      });
      vmo.isLeaf = resultType;
    }
    vmo.alternateID = vmo.uid + ',' + nodeBeingExpanded.alternateID;
    vmo.origin = vmo.uid;
    vmo.uid = vmo.alternateID;
    vmo.levelNdx = nodeBeingExpanded.levelNdx + 1;

    viewArr.push(vmo);
  });
  ctx.visibleAdd = false;

  return {
    parentNode: nodeBeingExpanded,
    childNodes: viewArr,
    totalChildCount: viewArr.length,
    startChildNdx: 0,
  };
}

async function loadHomeList(data, ctx) {
  let homeDataUid = ctx.user.props.home_folder.value;
  //로그인 계정에 지정한 폴더 위치 로드
  let param = {
    uids: [homeDataUid],
  };
  try {
    let findHomeFolder = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param);
    homeData = findHomeFolder.modelObjects[homeDataUid];
  } catch (err) {
    //console.log(err);
  }

  param = {
    objects: [homeData],
    attributes: ['contents'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
  } catch (err) {
    //console.log(err);
  }
  let homeUids = homeData.props.contents.dbValues;

  findAllItemProps = [];
  for (let i = homeUids.length - 1; i >= 0; i--) {
    let childObj = cdmSvc.getObject(homeUids[i]);
    let vmoObj = vmoService.constructViewModelObjectFromModelObject(childObj);
    if (childObj.type == 'L2_LGEItem') {
      findAllItemProps.push(vmoObj);
    }
  }

  param = {
    objects: findAllItemProps,
    attributes: ['creation_date', 'owning_user', 'object_name', 'IMAN_specification', 'last_mod_date', 'item_id'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
  } catch (err) {
    //console.log(err);
  }
  homeResultData = findAllItemProps;

  return {
    findAllItemProps: findAllItemProps,
  };
}

function allList(reponse, data) {
  return homeResultData;
}

function loadAllList(data) {
  return {
    allTotalFound: 1,
  };
}

function falseVisibleAdd(ctx) {
  ctx.visibleAdd = false;
}

function changeVisibleAdd(ctx) {
  const mainTreeData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));
  if (mainTreeData.dataProviders.specManagementDataProvider.selectedObjects.length == 1) {
    ctx.visibleAdd = true;
  } else {
    ctx.visibleAdd = false;
  }
}

function reload() {
  eventBus.publish('specManagementTable.plTable.reload');
}

function realGetCompareData(data, ctx) {
  const popCompareData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  const popComparePageData = vms.getViewModelUsingElement(document.getElementById('compareData'));
  const popCompareTableData = vms.getViewModelUsingElement(document.getElementById('compareTablee'));

  if (popCompareData.eventData.selectedObjects.length == 2) {
    if (popComparePageData != undefined) {
      popComparePageData.referenceModelLbl.uiValue = popCompareData.eventData.selectedObjects[0].props.object_string.dbValues[0];
    }

    if (popComparePageData != undefined && popCompareTableData != undefined) {
      let selectData = popCompareData.eventData.selectedObjects;
      popCompareTableData.dataProviders.specManagementCompareDataProvider.viewModelCollection.loadedVMObjects = [];
      let compareTableData = popCompareTableData.dataProviders.specManagementCompareDataProvider.viewModelCollection.loadedVMObjects;

      _.forEach(selectData, function (v) {
        if (compareTableData == undefined || compareTableData == '' || compareTableData.length < 2) {
          v = popCompareTableData.dataProviders.specManagementChildrenDataProvider.viewModelCollection.setViewModelObjects(v);
          compareTableData.push(v);
        }
      });

      if (data.changeRadio.dbValue != '' && data.changeRadio.dbValue) {
        for (let i = 0; i < compareTableData.length; i++) {
          if (compareTableData[i].props.l2_spec_diameter.uiValue.includes(' inch')) {
            compareTableData[i].props.l2_spec_diameter.uiValue = `${compareTableData[i].props.l2_spec_diameter.dbValue} mm`;
            compareTableData[i].props.l2_spec_length.uiValue = `${compareTableData[i].props.l2_spec_length.dbValue} mm`;
          } else {
            if (!compareTableData[i].props.l2_spec_diameter.uiValue.includes('mm')) {
              compareTableData[i].props.l2_spec_diameter.uiValue = `${compareTableData[i].props.l2_spec_diameter.uiValue} mm`;
              compareTableData[i].props.l2_spec_length.uiValue = `${compareTableData[i].props.l2_spec_length.uiValue} mm`;
            }
          }
        }
      } else if (!data.changeRadio.dbValue) {
        for (let i = 0; i < compareTableData.length; i++) {
          let originDiameter = compareTableData[i].props.l2_spec_diameter.uiValue;
          let mmDeleteStr = originDiameter.split(' mm');
          let xDeleteStr;
          if (mmDeleteStr[0].includes(' x ')) {
            xDeleteStr = mmDeleteStr[0].split(' x ');
          } else {
            xDeleteStr = mmDeleteStr[0];
          }
          let originLength = compareTableData[i].props.l2_spec_length.uiValue;
          let splitLength = originLength.split(' mm');
          if (xDeleteStr.length == 1) {
            compareTableData[i].props.l2_spec_diameter.uiValue = `${Math.round(xDeleteStr / 25.4)} inch`;
            compareTableData[i].props.l2_spec_length.uiValue = `${Math.round(splitLength[0] / 25.4)} inch`;
          } else {
            compareTableData[i].props.l2_spec_diameter.uiValue = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
            compareTableData[i].props.l2_spec_length.uiValue = `${Math.round(splitLength[0] / 25.4)} inch`;
          }
        }
      }
      popComparePageData.dataProviders.specManagementCompareDataProvider.viewModelCollection.setViewModelObjects(compareTableData);
      eventBus.publish('changeColorTest');
    }
  }
}

function onlyTrue(data) {
  data.changeRadio.dbValue = true;
}

async function changeColor(data) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));

  if (popData.dataProviders.specManagementChildrenDataProvider.selectedObjects.length == 2) {
    let leftDivision = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_division.uiValues[0];
    let rightDivision = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_division.uiValues[0];
    let leftType = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_model_type.uiValues[0];
    let rightType = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_model_type.uiValues[0];
    let leftMaker = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_model_maker.uiValues[0];
    let rightMaker = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_model_maker.uiValues[0];
    let leftRef_Models = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_reference_models.uiValues;
    let rightRef_Models = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_reference_models.uiValues;
    let leftRef_Parts = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_reference_parts.uiValues;
    let rightRef_Parts = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_reference_parts.uiValues;
    let leftDiameter = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_spec_diameter.uiValues[0];
    let rightDiameter = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_spec_diameter.uiValues[0];
    let leftLength = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_spec_length.uiValues[0];
    let rightLength = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_spec_length.uiValues[0];
    let leftRPM = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_spec_rpm.uiValues[0];
    let rightRPM = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_spec_rpm.uiValues[0];
    let leftVoltage = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_spec_voltage.uiValues[0];
    let rightVoltage = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_spec_voltage.uiValues[0];
    let leftMaterial = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.l2_spec_material.uiValues[0];
    let rightMaterial = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[1].props.l2_spec_material.uiValues[0];

    if (leftDivision != rightDivision) {
      let changeColor1 = document.getElementById('specCompare_row2_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }

    if (leftType != rightType) {
      let changeColor1 = document.getElementById('specCompare_row3_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }

    if (leftMaker != rightMaker) {
      let changeColor1 = document.getElementById('specCompare_row4_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }

    if (leftRef_Models != rightRef_Models) {
      let changeColor1 = document.getElementById('specCompare_row5_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftRef_Parts != rightRef_Parts) {
      let changeColor1 = document.getElementById('specCompare_row6_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftDiameter != rightDiameter) {
      let changeColor1 = document.getElementById('specCompare_row7_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftLength != rightLength) {
      let changeColor1 = document.getElementById('specCompare_row8_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftRPM != rightRPM) {
      let changeColor1 = document.getElementById('specCompare_row9_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftVoltage != rightVoltage) {
      let changeColor1 = document.getElementById('specCompare_row10_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
    if (leftMaterial != rightMaterial) {
      let changeColor1 = document.getElementById('specCompare_row11_col3');
      changeColor1.style.backgroundColor = 'rgb(241, 187, 187)';
    }
  }
}

function changeEdit(ctx, data) {
  if (ctx.xrtSummaryContextObject.props.object_name.valueUpdated || ctx.xrtSummaryContextObject.props.object_name.valueUpdated == undefined) {
    //수정중
  } else {
    const saveEditProgress = locale.getLocalizedText('lgepSpecManagementMessages', 'saveEditProgress');
    notySvc.showWarning(saveEditProgress);
    ctx.startEdit = true;
  }
}

function changeEdit2(ctx, data) {
  ctx.startEdit = true;
}

async function getChildrenData(data, ctx, eventTable) {
  if (eventTable.selectedObjects.length != 0) {
    let userid = common.getObject(eventTable.selectedObjects[0].origin);

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

    let getInfoHomeChildren = common.getObject(getHomeChildren);

    let revisionUid = [];
    let specManageSrc = [];

    if (eventTable.selectedObjects[0].childNdx == '2') {
      let granduid = [];
      let grandContents = [];

      _.forEach(getInfoHomeChildren, function (value) {
        granduid.push(common.getObject(value.uid));
      });

      try {
        let getResult = {
          objects: granduid,
          attributes: ['object_name', 'contents', 'object_type', 'owning_group', 'owning_user'],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }

      _.forEach(granduid, function (value) {
        grandContents.push(common.getObject(value.props.contents.dbValues));
      });

      let topContents = grandContents.flat();

      try {
        let getResult = {
          objects: topContents,
          attributes: ['object_name', 'revision_list', 'contents'],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }
      let lastContents = [];

      let specUid = [];
      for (let i = 0; i < topContents.length; i++) {
        specUid.push(common.getObject(topContents[i].props.revision_list.dbValues[0]));
      }

      try {
        let getResult = {
          objects: specUid,
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

      if (tableSearchresult != undefined && tableSearchresult != null) {
        tableResult = tableSearchresult;
        if (tableResult == null) {
          return {
            totalFound: 0,
            example: null,
          };
        }
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      } else {
        tableResult = specUid;
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      }
    } else if (eventTable.selectedObjects[0].childNdx == '1') {
      let granduid = [];
      let grandContents = [];

      try {
        let getResult = {
          objects: getInfoHomeChildren,
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
            'revision_list',
            'item_revision',
            'revision_number',
            'IMAN_specification',
          ],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }

      let getSecondChildren = [];

      _.forEach(getInfoHomeChildren, function (value) {
        getSecondChildren.push(value.props.contents.dbValues);
      });

      let flatUID = getSecondChildren.flat();

      for (let i = 0; i < flatUID.length; i++) {
        granduid.push(common.getObject(flatUID[i]));
      }

      try {
        let getResult = {
          objects: granduid,
          attributes: ['object_name', 'contents', 'object_type', 'owning_group', 'owning_user'],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }

      _.forEach(granduid, function (value) {
        grandContents.push(common.getObject(value.props.contents.dbValues));
      });

      let topContents = grandContents.flat();

      try {
        let getResult = {
          objects: topContents,
          attributes: ['object_name', 'revision_list', 'IMAN_specification', 'contents'],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }
      let lastContents = [];

      let specUid = [];
      for (let i = 0; i < topContents.length; i++) {
        specUid.push(common.getObject(topContents[i].props.revision_list.dbValues[0]));
      }

      try {
        let getResult = {
          objects: specUid,
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

      if (tableSearchresult != undefined && tableSearchresult != null) {
        tableResult = tableSearchresult;
        if (tableResult == null) {
          return {
            totalFound: 0,
            example: null,
          };
        }
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      } else {
        tableResult = specUid;
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      }
    } else if (eventTable.selectedObjects[0].childNdx == '3') {
      let granduid = [];
      let grandContents = [];
      let revParams;

      try {
        let getResult = {
          objects: getInfoHomeChildren,
          attributes: [
            'object_string',
            'object_name',
            'revision_list',
            'contents',
            'object_type',
            'owning_group',
            'owning_user',
            'checked_out',
            'last_mod_date',
            'release_status_list',
            'revision_list',
            'item_revision',
            'revision_number',
            'IMAN_specification',
          ],
        };

        revParams = await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }

      let getSecondChildren = revParams.plain;

      _.forEach(getSecondChildren, function (value) {
        granduid.push(common.getObject(value));
      });

      _.forEach(granduid, function (value) {
        grandContents.push(common.getObject(value.uid));
      });

      let topContents = grandContents.flat();

      try {
        let getResult = {
          objects: topContents,
          attributes: ['object_name', 'revision_list', 'contents'],
        };

        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
      } catch (err) {
        //console.log(err);
      }
      let lastContents = [];

      let specUid = [];
      for (let i = 0; i < topContents.length; i++) {
        specUid.push(common.getObject(topContents[i].props.revision_list.dbValues[0]));
      }

      try {
        let getResult = {
          objects: specUid,
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

      if (tableSearchresult != undefined && tableSearchresult != null) {
        tableResult = tableSearchresult;
        if (tableResult == null) {
          return {
            totalFound: 0,
            example: null,
          };
        }
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      } else {
        tableResult = specUid;
        return {
          totalFound: tableResult.length,
          example: tableResult,
        };
      }
    }

    for (let i = 0; i < getInfoHomeChildren.length; i++) {
      revisionUid.push(getInfoHomeChildren[i].props.revision_list.dbValues[0]);
    }

    try {
      let getResult = {
        objects: getInfoHomeChildren,
        attributes: ['object_name', 'revision_list', 'contents'],
      };

      await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);
    } catch (err) {
      //console.log(err);
    }

    for (let i = 0; i < revisionUid.length; i++) {
      specManageSrc.push(common.getObject(revisionUid[i]));
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

      data.dataProviders.specManagementChildrenDataProvider.viewModelCollection.setViewModelObjects(arr);
    } else if (tableSearchresult == undefined) {
      let arr = [];
      let itemName = [];
      specManageSrc = specManageSrc.filter((element, index) => {
        return specManageSrc.indexOf(element) === index;
      });
      _.forEach(specManageSrc, function (value) {
        arr.push(vmoService.constructViewModelObjectFromModelObject(value));
      });

      data.dataProviders.specManagementChildrenDataProvider.viewModelCollection.setViewModelObjects(arr);
    }
  } else if (eventTable.selectedObjects.length == 0) {
    return {
      totalFound: 0,
      example: null,
    };
  }
}

async function searchSpecTable(data, ctx, eventTable) {
  const searchData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));

  let modelName = data.modelTxtBox.uiValue;
  let Division = data.divisionListBox.dbValue;
  let Maker = data.makerListBox.dbValue;
  let Type = data.typeListBox.dbValue;
  let createUser = data.createUserTxtBox.uiValue;

  let result = null;
  if (modelName != '' || Division != '' || Maker != '' || Type != '' || createUser != '') {
    let searchEntry = [];
    let valueEntry = [];
    if (searchData.example.length > 0) {
      modelName != '' ? searchEntry.push('L2_object_name') : null; //console.log("modelnot");
      Division != '' ? searchEntry.push('L2_division') : null; //console.log("divisionnot");
      Maker != '' ? searchEntry.push('L2_model_maker') : null; //console.log("Makernot");
      Type != '' ? searchEntry.push('L2_model_type') : null; //console.log("Typenot");
      createUser != '' ? searchEntry.push('L2_user_id') : null; //console.log("gListnot");

      modelName.length > 0 ? valueEntry.push(modelName) : null; //console.log("mLengthnot");
      Division.length > 0 ? valueEntry.push(Division) : null; //console.log("dLengthnot");
      Maker.length > 0 ? valueEntry.push(Maker) : null; //console.log("sLengthnot");
      Type.length > 0 ? valueEntry.push(Type) : null; //console.log("eLengthnot");
      createUser.length > 0 ? valueEntry.push(createUser) : null; //console.log("createUsernot");
    }

    result = await query.executeSavedQuery('DesignProdSpecSearch', searchEntry, valueEntry);
    tableResult = [];
    _.forEach(result, function (value) {
      tableResult.push(vmoService.constructViewModelObjectFromModelObject(value));
    });

    data.dataProviders.specManagementChildrenDataProvider.viewModelCollection.setViewModelObjects(tableResult);
    //console.log(tableResult);
  } else {
    tableResult = [];
    _.forEach(searchData.example, function (value) {
      tableResult.push(vmoService.constructViewModelObjectFromModelObject(value));
    });

    data.dataProviders.specManagementChildrenDataProvider.viewModelCollection.setViewModelObjects(tableResult);
    //console.log(tableResult);
  }
}

function clearSearch(data) {
  const searchData = vms.getViewModelUsingElement(document.getElementById('searchBox'));
  searchData.modelTxtBox.dbValue = '';
  searchData.modelTxtBox.uiValue = '';
  searchData.divisionListBox.dbValue = '';
  searchData.divisionListBox.uiValue = '';
  searchData.makerListBox.dbValue = '';
  searchData.makerListBox.uiValue = '';
  searchData.typeListBox.dbValue = '';
  searchData.typeListBox.uiValue = '';
  searchData.createUserTxtBox.dbValue = '';
  searchData.createUserTxtBox.uiValue = '';
}

function changeLabel(data) {
  const popCompareTableData = vms.getViewModelUsingElement(document.getElementById('compareTablee'));
  const popComparePageData = vms.getViewModelUsingElement(document.getElementById('compareData'));
  const popCompareData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));

  let changeData = popCompareData.dataProviders.specManagementChildrenDataProvider.selectedObjects;

  if (data.changeRadio.dbValue != '' && data.changeRadio.dbValue) {
    for (let i = 0; i < changeData.length; i++) {
      if (changeData[i].props.l2_spec_diameter.uiValue.includes(' inch')) {
        changeData[i].props.l2_spec_diameter.uiValue = `${changeData[i].props.l2_spec_diameter.dbValue} mm`;
        changeData[i].props.l2_spec_length.uiValue = `${changeData[i].props.l2_spec_length.dbValue} mm`;
      } else {
        changeData[i].props.l2_spec_diameter.uiValue = `${changeData[i].props.l2_spec_diameter.dbValue} mm`;
        changeData[i].props.l2_spec_length.uiValue = `${changeData[i].props.l2_spec_length.dbValue} mm`;
      }
    }
  } else if (!data.changeRadio.dbValue) {
    for (let i = 0; i < changeData.length; i++) {
      let originDiameter = changeData[i].props.l2_spec_diameter.uiValue;
      let mmDeleteStr = originDiameter.split(' mm');
      let xDeleteStr;
      if (mmDeleteStr[0].includes(' x ')) {
        xDeleteStr = mmDeleteStr[0].split(' x ');
      } else {
        xDeleteStr = mmDeleteStr[0];
      }
      let originLength = changeData[i].props.l2_spec_length.uiValue;
      let splitLength = originLength.split(' mm');
      if (xDeleteStr.length == 1) {
        changeData[i].props.l2_spec_diameter.dbValues[0] = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.dbValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.uiValue = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.uiValue = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.uiValues[0] = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.uiValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.displayValues[0] = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.displayValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.prevDisplayValues[0] = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.prevDisplayValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.value = `${Math.round(xDeleteStr / 25.4)} inch`;
        changeData[i].props.l2_spec_length.value = `${Math.round(splitLength[0] / 25.4)} inch`;
      } else {
        changeData[i].props.l2_spec_diameter.dbValues[0] = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.dbValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.uiValue = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.uiValue = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.uiValues[0] = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.uiValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.displayValues[0] = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.displayValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.prevDisplayValues[0] = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.prevDisplayValues[0] = `${Math.round(splitLength[0] / 25.4)} inch`;
        changeData[i].props.l2_spec_diameter.value = `${Math.round(xDeleteStr[0] / 25.4)} x ${Math.round(xDeleteStr[1] / 25.4)} inch`;
        changeData[i].props.l2_spec_length.value = `${Math.round(splitLength[0] / 25.4)} inch`;
      }
    }
  }
  let resultTest = [];
  // popComparePageData.dataProviders.specManagementCompareDataProvider.viewModelCollection.setTotalObjectsFound(2);
  popComparePageData.dataProviders.specManagementCompareDataProvider.viewModelCollection.setViewModelObjects(changeData);

  eventBus.publish('specCompare.plTable.clientRefresh');
}

function sortAction(response, sortCriteria, startIndex, pageSize, columnFilters) {
  let countries = tableResult;
  if (countries == null) {
    return null;
  } else {
    let endIndex = startIndex + pageSize;
    if (columnFilters) {
      // Apply filtering
      _.forEach(columnFilters, function (columnFilter) {
        countries = createFilters(columnFilter, countries);
      });
    }

    if (sortCriteria && sortCriteria.length > 0) {
      let criteria = sortCriteria[0];
      let sortDirection = criteria.sortDirection;
      let sortColName = criteria.fieldName;

      if (sortDirection === 'ASC') {
        countries.sort(function (a, b) {
          if (a.props[sortColName].dbValues[0] <= b.props[sortColName].dbValues[0]) {
            return -1;
          }
          return 1;
        });
      } else if (sortDirection === 'DESC') {
        countries.sort(function (a, b) {
          if (a.props[sortColName].dbValues[0] >= b.props[sortColName].dbValues[0]) {
            return -1;
          }
          return 1;
        });
      }
    }

    let searchResults = countries.slice(startIndex, endIndex);

    return searchResults;
  }
}

function getFilterFacetData(fullData) {
  return fullData;
}

function getFilterFacets(response, columnFilters, fullData) {
  var countries = response.example.flat();
  var updateFilters = fullData.columnFilters;
  var columnName = fullData.column.name;
  var facetValues = {
    values: [],
    totalFound: 0,
  };

  // This mocks the server filtering data using existing column filters
  if (columnFilters) {
    // Apply filtering
    _.forEach(columnFilters, function (columnFilter) {
      if (columnName !== columnFilter.columnName) {
        countries = createFilters(columnFilter, countries);
      }
    });
  }

  if (updateFilters) {
    _.forEach(updateFilters, function (columnFilter) {
      countries = createFilters(columnFilter, countries);
    });
  }

  var facetsToReturn = [];

  _.forEach(countries, function (country) {
    if (country.props[columnName].uiValues) {
      facetsToReturn.push(country.props[columnName].uiValues);
    } else {
      facetsToReturn.push('');
    }
  });

  facetsToReturn = _.uniq(facetsToReturn);

  facetValues.totalFound = facetsToReturn.length;

  var startIndex = fullData.startIndex;
  var endIndex = startIndex + fullData.maxToReturn;

  facetsToReturn = facetsToReturn.slice(startIndex, endIndex + 1);

  facetValues.values = facetsToReturn;
  return facetValues;
}

function processContainsFilter(columnFilter, countries) {
  return countries.filter(function (country) {
    if (country.props[columnFilter.columnName].uiValue) {
      return country.props[columnFilter.columnName].uiValues[0].toLowerCase().includes(columnFilter.values[0].toLowerCase());
    } else if (country.props[columnFilter.columnName].uiValues[0]) {
      return country.props[columnFilter.columnName].uiValues[0].toString().toLowerCase().includes(columnFilter.values[0].toLowerCase());
    }
  });
}

function processTextFilters(columnFilter, countries) {
  countries = processContainsFilter(columnFilter, countries);

  return countries;
}

/**
 * This function mocks the server logic for filtering data using the created filters from client.
 * This is called from the main function that gets the filter facets. Since this function is mocking server logic,
 * it should not be implemented on client.
 *
 * @param {Object} columnFilter Filter to apply
 * @param {Array} countries The dataset to filter
 * @returns {Object} The country data that matches the filter
 */
function createFilters(columnFilter, countries) {
  countries = processTextFilters(columnFilter, countries);

  return countries;
}

async function limitedSelected(data, eventData) {
  let compareDataOnlyTwo = [];
  let nonSelection = data.eventMap['specManagementChildrenDataProvider.selectionChangeEvent'].selectedObjects;
  if (nonSelection.length < 3) {
    lengthTemp = nonSelection.length;
  } else if (lengthTemp > nonSelection.length) {
    compareDataOnlyTwo = nonSelection;
  } else {
    lengthTemp = 0;
  }

  if (compareDataOnlyTwo.length < 3) {
    await _.forEach(nonSelection, function (value) {
      compareDataOnlyTwo.push(value);
    });
    compareDataOnlyTwo = await compareDataOnlyTwo.filter((element, index) => {
      return compareDataOnlyTwo.indexOf(element) === index;
    });
  } else {
    compareDataOnlyTwo = [];
  }

  if (compareDataOnlyTwo.length == 3) {
    data.dataProviders.specManagementChildrenDataProvider.selectionModel.removeFromSelection(compareDataOnlyTwo.shift());
    compareDataOnlyTwo = [];
  }
}

function exportToExcel() {
  let headerData = [''];
  let columnData = [];
  let resultColumnData = [];
  let tableData = [];
  // Header Label
  let popData = document.getElementById('compareData');
  let stringData = document.getElementsByClassName('aw-splm-tableContainer');
  let stringHeaderData = document.getElementsByClassName('aw-splm-tableHeaderCellLabel');
  let deleteHeaderData = document.getElementsByClassName('aw-splm-tableHeaderCellInner');
  var arr = Array.prototype.slice.call(stringHeaderData);
  var arr2 = Array.prototype.slice.call(deleteHeaderData);
  let resultHeaderData = arr.filter((x) => !arr2.includes(x));

  for (let i = 0; i < resultHeaderData.length; i++) {
    headerData.push(resultHeaderData[i].innerText);
  }

  // column Label
  for (let j = 1; j < 4; j++) {
    for (let i = 2; i < stringData[2].parentNode._tableInstance.dataProvider.cols.length + 2; i++) {
      columnData.push(document.getElementById(`specCompare_row${i}_col${j}`).innerText);
    }
    resultColumnData.push(columnData);
    columnData = [];
  }

  tableData.push(headerData);
  tableData.push(...resultColumnData);

  // 테이블의 테스트 데이터
  let rawDate = [
    { header: headerData[0], data: tableData[1] },
    { header: headerData[1], data: tableData[2] },
    { header: headerData[2], data: tableData[3] },
  ];
  // excel 파일 생성

  let workbook = new exceljs.Workbook();

  //차트 시트탭 2개를 만듬
  const dataSheet = workbook.addWorksheet('DataSheet');

  //테이블의 경우, 데이터를 넣어줌
  rawDate.forEach((item, index) => {
    dataSheet.getColumn(index + 1).values = [item.header, ...item.data];
  });

  // 차트 라이브러리의 div를 찾아와 이미지로 변환
  let promise = [];

  // excel로 만드는건 비동기처리로
  Promise.all(promise).then(() => {
    workbook.xlsx.writeBuffer().then((b) => {
      let a = new Blob([b]);
      let url = window.URL.createObjectURL(a);

      let elem = document.createElement('a');
      elem.href = url;
      elem.download = `DataCompare.xlsx`;
      document.body.appendChild(elem);
      elem.style = 'display: none';
      elem.click();
      elem.remove();
    });
  });

  return workbook;
}

async function typeValue(data) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  const listValueNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'addNoty');

  let tableValue = popData.dataProviders.specManagementChildrenDataProvider.viewModelCollection.loadedVMObjects;
  let tableTypeName = [];
  if (tableValue == null || tableValue.length == 0) {
    let tableTypeListvalue = data.typeListBoxValues.dbValue;

    tableTypeListvalue.splice(0, tableTypeListvalue.length);

    let protoParams = {
      propDisplayValue: `${listValueNoty}`,
      dispValue: `${listValueNoty}`,
      propInternalValue: `${listValueNoty}`,
    };

    tableTypeListvalue.push(protoParams);
  } else if (tableValue != null || tableValue.length != 0) {
    for (let i = 0; i < tableValue.length; i++) {
      tableTypeName.push(tableValue[i].props.l2_model_type.uiValues[0]);
    }

    let tableTypeName2 = Array.from(new Set(tableTypeName));

    let tableTypeListvalue = data.typeListBoxValues.dbValue;

    tableTypeListvalue.splice(0, tableTypeListvalue.length);

    let protoParams = {
      propDisplayValue: '',
      dispValue: '',
      propInternalValue: '',
    };

    tableTypeListvalue.push(protoParams);

    for (let i = 0; i < tableTypeName2.length; i++) {
      let tableTypeNameArray = {
        propDisplayValue: `${tableTypeName2[i]}`,
        dispValue: `${tableTypeName2[i]}`,
        propInternalValue: `${tableTypeName2[i]}`,
      };
      tableTypeListvalue.push(tableTypeNameArray);
    }
  }
}

async function makerValue(data) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  const listValueNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'addNoty');

  let tableValue = popData.dataProviders.specManagementChildrenDataProvider.viewModelCollection.loadedVMObjects;
  let tableMakerName = [];
  if (tableValue == null || tableValue.length == 0) {
    tableMakerListValue = data.makerListBoxValues.dbValue;

    tableMakerListValue.splice(0, tableMakerListValue.length);

    let protoParams = {
      propDisplayValue: `${listValueNoty}`,
      dispValue: `${listValueNoty}`,
      propInternalValue: `${listValueNoty}`,
    };

    tableMakerListValue.push(protoParams);
  } else if (tableValue != null || tableValue.length != 0) {
    for (let i = 0; i < tableValue.length; i++) {
      tableMakerName.push(tableValue[i].props.l2_model_maker.uiValues[0]);
    }

    let tableMakerName2 = Array.from(new Set(tableMakerName));

    let tableMakerListValue = data.makerListBoxValues.dbValue;

    tableMakerListValue.splice(0, tableMakerListValue.length);

    let protoParams = {
      propDisplayValue: '',
      dispValue: '',
      propInternalValue: '',
    };

    tableMakerListValue.push(protoParams);

    for (let i = 0; i < tableMakerName2.length; i++) {
      let tableMakerNameArray = {
        propDisplayValue: `${tableMakerName2[i]}`,
        dispValue: `${tableMakerName2[i]}`,
        propInternalValue: `${tableMakerName2[i]}`,
      };
      tableMakerListValue.push(tableMakerNameArray);
    }
  }
}

async function divisionValue(data) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  const listValueNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'addNoty');

  let tableValue = popData.dataProviders.specManagementChildrenDataProvider.viewModelCollection.loadedVMObjects;
  let tableDivisionName = [];
  if (tableValue == null || tableValue.length == 0) {
    let tableDivisionListValue = data.divisionListBoxValues.dbValue;

    tableDivisionListValue.splice(0, tableDivisionListValue.length);

    let protoParams = {
      propDisplayValue: `${listValueNoty}`,
      dispValue: `${listValueNoty}`,
      propInternalValue: `${listValueNoty}`,
    };

    tableDivisionListValue.push(protoParams);
  } else if (tableValue != null || tableValue.length != 0) {
    for (let i = 0; i < tableValue.length; i++) {
      if (tableValue[i].props.l2_division.uiValues[0] != undefined || tableValue[i].props.l2_division.uiValues[0] != null) {
        tableDivisionName.push(tableValue[i].props.l2_division.uiValues[0]);
      }
    }

    let tableDivisionName2 = Array.from(new Set(tableDivisionName));

    let tableDivisionListValue = data.divisionListBoxValues.dbValue;

    tableDivisionListValue.splice(0, tableDivisionListValue.length);

    let protoParams = {
      propDisplayValue: '',
      dispValue: '',
      propInternalValue: '',
    };

    tableDivisionListValue.push(protoParams);

    for (let i = 0; i < tableDivisionName2.length; i++) {
      let tableDivisionNameArray = {
        propDisplayValue: `${tableDivisionName2[i]}`,
        dispValue: `${tableDivisionName2[i]}`,
        propInternalValue: `${tableDivisionName2[i]}`,
      };
      tableDivisionListValue.push(tableDivisionNameArray);
    }
  }
}

function closeAddPopup(data) {
  addSaveData = [];
  localStorage.setItem('ref_model', '');
  localStorage.setItem('ref_parts', '');
  popupService.hide(data.popupId);
  eventBus.publish('addPopupClose');
}

async function createSpecData(data) {
  const popupAddData = vms.getViewModelUsingElement(document.getElementById('popupCreate'));
  const mainTreeData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));

  let objUid = mainTreeData.dataProviders.specManagementDataProvider.selectedObjects[0].origin;
  let objType = mainTreeData.dataProviders.specManagementDataProvider.selectedObjects[0].type;

  let specRevId = popupAddData.revision__item_revision_id.dbValue;
  let specName = popupAddData.object_name.dbValue;
  let specDesc = popupAddData.object_desc.dbValue;
  let specDivision = popupAddData.revision__l2_division.dbValue;
  let specModelType = popupAddData.revision__l2_model_type.dbValue;
  let specMaker = popupAddData.revision__l2_model_maker.dbValue;
  let specDiameter = popupAddData.revision__l2_spec_diameter.dbValue;
  let specLength = popupAddData.revision__l2_spec_length.dbValue;
  let specMaterial = popupAddData.revision__l2_spec_material.dbValue;
  let specRPM = popupAddData.revision__l2_spec_rpm.dbValue;
  let specVoltage = popupAddData.revision__l2_spec_voltage.dbValue;

  let createItems = {
    properties: [
      {
        name: specName,
        type: 'L2_DgnProdSpec',
        revId: specRevId,
        description: specDesc,
      },
    ],
    container: {
      uid: objUid,
      type: objType,
    },
  };

  if (specName == null || specName == undefined || specName == '') {
    const createItemNameNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'createItemNameNoty');
    notySvc.showWarning(createItemNameNoty);
  } else {
    try {
      let createdItems = await SoaService.post('Core-2006-03-DataManagement', 'createItems', createItems);
      createItemUid = createdItems.output[0].itemRev;

      let objModel = common.getObject(objUid);

      let getProps;
      let getResult = {
        objects: [objModel],
        attributes: [
          'object_string',
          'contents',
          'object_name',
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
        ],
      };

      getProps = await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getResult);

      let setPropsItem = {
        objects: [createdItems.output[0].itemRev],
        attributes: {
          l2_division: {
            stringVec: [specDivision],
          },
          l2_model_type: {
            stringVec: [specModelType],
          },
          l2_model_maker: {
            stringVec: [specMaker],
          },
          l2_reference_models: {
            stringVec: addSaveDataUid,
          },
          l2_reference_parts: {
            stringVec: addPartsSaveDataUid,
          },
          l2_spec_diameter: {
            stringVec: [specDiameter],
          },
          l2_spec_length: {
            stringVec: [specLength],
          },
          l2_spec_rpm: {
            stringVec: [specRPM],
          },
          l2_spec_voltage: {
            stringVec: [specVoltage],
          },
          l2_spec_material: {
            stringVec: [specMaterial],
          },
        },
      };

      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setPropsItem);
    } catch (err) {
      //console.log(err);
    }

    addSaveData = [];
    localStorage.setItem('ref_model', '');
    localStorage.setItem('ref_parts', '');
    eventBus.publish('specManagementTable.plTable.reload');

    msg.show(0, `${specName} 아이템이 생성되었습니다.`, ['닫기'], [function () {}]);
  }
}

async function specDeleteObject(data, dataProviders) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  if (popData.dataProviders.specManagementChildrenDataProvider.selectedObjects.length == 1) {
    msg.show(
      1,
      `${popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.object_string.dbValue} 항목을 삭제하시겠습니까?`,
      ['삭제', '취소'],
      [
        async function () {
          try {
            let selectedTable = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects;
            let param = {
              input: [],
            };
            for (let i = 0; i < selectedTable.length; i++) {
              if (selectedTable[i].props.IMAN_specification != undefined || selectedTable[i].props.IMAN_specification != null) {
                param.input.push({
                  clientId: '',
                  relationType: 'IMAN_specification',
                  primaryObject: selectedTable[i],
                  secondaryObject: common.getObject(selectedTable[i].props.IMAN_specification.dbValues),
                });
              }
            }

            try {
              await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
            } catch (err) {
              //console.log(err)
            }

            let modelChildOjt = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0];
            let vmojt = common.getObject(modelChildOjt.uid);
            let objID = vmojt.props.object_string.uiValues[0].split('/');
            let setParentsApi = {
              infos: [
                {
                  itemId: objID[0],
                },
              ],
            };
            let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
            let deleteOjt = {
              objects: [revItemParant.output[0].item],
            };
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteOjt);

            msg.show(0, `${modelChildOjt.props.object_string.dbValue} 항목이 삭제되었습니다.`, ['닫기'], [function () {}]);
          } catch (err) {
            //console.log(err);
          }
        },
        function () {},
      ],
    );
  } else if (popData.dataProviders.specManagementChildrenDataProvider.selectedObjects.length > 1) {
    msg.show(
      1,
      `${popData.dataProviders.specManagementChildrenDataProvider.selectedObjects.length}개의 항목을 삭제하시겠습니까?`,
      ['삭제', '취소'],
      [
        async function () {
          let deleteObjects = [];
          let deleteItemsID = [];
          let deleteItems = [];
          let deleteItemsResult = [];

          let selectedTable = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects;
          let param = {
            input: [],
          };
          for (let i = 0; i < selectedTable.length; i++) {
            if (selectedTable[i].props.IMAN_specification != undefined || selectedTable[i].props.IMAN_specification != null) {
              param.input.push({
                clientId: '',
                relationType: 'IMAN_specification',
                primaryObject: selectedTable[i],
                secondaryObject: common.getObject(selectedTable[i].props.IMAN_specification.dbValues),
              });
            }
          }

          try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
          } catch (err) {
            //console.log(err)
          }

          try {
            let deleteVMO = popData.dataProviders.specManagementChildrenDataProvider.selectedObjects;
            _.forEach(deleteVMO, function (value) {
              deleteObjects.push(common.getObject(value.uid));
            });
            _.forEach(deleteObjects, function (value) {
              deleteItemsID.push(value.props.object_string.uiValues[0].split('/')[0]);
            });

            for (let i = 0; i < deleteItemsID.length; i++) {
              let setParentsApi = {
                infos: [
                  {
                    itemId: deleteItemsID[i],
                  },
                ],
              };
              let revItemParant = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', setParentsApi);
              deleteItems.push(revItemParant);
            }
            _.forEach(deleteItems, function (value) {
              deleteItemsResult.push(value.output[0].item);
            });
            let deleteOjt = {
              objects: deleteItemsResult,
            };
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteOjt);

            if (deleteItemsResult.length == 1) {
              msg.show(0, `${deleteItemsResult.props.object_string.dbValues[0]} 항목이 삭제되었습니다.`, ['닫기'], [function () {}]);
            } else if (deleteItemsResult.length > 1) {
              msg.show(0, `${deleteItemsResult.length}개의 항목이 삭제되었습니다.`, ['닫기'], [function () {}]);
            }
          } catch (err) {
            //console.log(err);
          }
        },
        function () {},
      ],
    );
  }
}

function inputImage(data, ctx) {
  ctx.selected = data.dataProviders.specManagementChildrenDataProvider.selectedObjects[0];
}

function changeEditMode(data, ctx) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  if (ctx.user.uid == popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.owning_user.dbValue) {
    editService.startEdit();
    if (popData.dataProviders.specManagementChildrenDataProvider.selectedObjects.length == 1) {
      ctx.startEdit = false;
    }
  } else if (ctx.user.uid != popData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].props.owning_user.dbValue) {
    const authorityNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'authorityNoty');
    notySvc.showWarning(authorityNoty);
  }
}

function cancelEdit(data, ctx) {
  ctx.startEdit = true;
  editService.cancelEdits();
}

function saveEdit(data, ctx) {
  ctx.startEdit = true;
  editService.saveEdits();
}

function addModel() {
  const findRefModel = locale.getLocalizedText('lgepSpecManagementMessages', 'findRefModel');
  popupService.show({
    declView: 'specAddModel',
    locals: {
      caption: findRefModel,
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

function saveAddData(data) {
  const popupAddData = vms.getViewModelUsingElement(document.getElementById('popupCreate'));

  let specName;
  let specDesc;
  let specDivision;
  let specModelType;
  let specMaker;
  let specRef_Model;
  let specRef_Parts;
  let specDiameter;
  let specLength;
  let specMaterial;
  let specRPM;
  let specVoltage;

  if (popupAddData.object_name.valueUpdated) {
    specName = popupAddData.object_name.uiValue;
  } else {
    specName = popupAddData.object_name.dbValue;
  }
  if (popupAddData.object_desc.valueUpdated) {
    specDesc = popupAddData.object_desc.uiValue;
  } else {
    specDesc = popupAddData.object_desc.dbValue;
  }
  if (popupAddData.revision__l2_division.valueUpdated) {
    specDivision = popupAddData.revision__l2_division.uiValue;
  } else {
    specDivision = popupAddData.revision__l2_division.dbValue;
  }
  if (popupAddData.revision__l2_model_type.valueUpdated) {
    specModelType = popupAddData.revision__l2_model_type.uiValue;
  } else {
    specModelType = popupAddData.revision__l2_model_type.dbValue;
  }
  if (popupAddData.revision__l2_model_maker.valueUpdated) {
    specMaker = popupAddData.revision__l2_model_maker.uiValue;
  } else {
    specMaker = popupAddData.revision__l2_model_maker.dbValue;
  }
  if (popupAddData.ref_ModelsTxtBox.valueUpdated) {
    specRef_Model = popupAddData.ref_ModelsTxtBox.uiValue;
  } else {
    specRef_Model = popupAddData.ref_ModelsTxtBox.dbValue;
  }
  if (popupAddData.ref_PartsTxtBox.valueUpdated) {
    specRef_Parts = popupAddData.ref_PartsTxtBox.uiValue;
  } else {
    specRef_Parts = popupAddData.ref_PartsTxtBox.dbValue;
  }
  if (popupAddData.revision__l2_spec_diameter.valueUpdated) {
    specDiameter = popupAddData.revision__l2_spec_diameter.uiValue;
  } else {
    specDiameter = popupAddData.revision__l2_spec_diameter.dbValue;
  }
  if (popupAddData.revision__l2_spec_length.valueUpdated) {
    specLength = popupAddData.revision__l2_spec_length.uiValue;
  } else {
    specLength = popupAddData.revision__l2_spec_length.dbValue;
  }
  if (popupAddData.revision__l2_spec_material.valueUpdated) {
    specMaterial = popupAddData.revision__l2_spec_material.uiValue;
  } else {
    specMaterial = popupAddData.revision__l2_spec_material.dbValue;
  }
  if (popupAddData.revision__l2_spec_rpm.valueUpdated) {
    specRPM = popupAddData.revision__l2_spec_rpm.uiValue;
  } else {
    specRPM = popupAddData.revision__l2_spec_rpm.dbValue;
  }
  if (popupAddData.revision__l2_spec_voltage.valueUpdated) {
    specVoltage = popupAddData.revision__l2_spec_voltage.uiValue;
  } else {
    specVoltage = popupAddData.revision__l2_spec_voltage.dbValue;
  }

  addSaveData = {
    prodName: specName,
    prodDesc: specDesc,
    prodDivision: specDivision,
    prodType: specModelType,
    prodMaker: specMaker,
    prodRef_model: specRef_Model,
    prodRef_parts: specRef_Parts,
    prodDiameter: specDiameter,
    prodLength: specLength,
    prodMaterial: specMaterial,
    prodRPM: specRPM,
    prodVoltage: specVoltage,
  };
}

function loadAddData(data) {
  const popupAddData = vms.getViewModelUsingElement(document.getElementById('popupCreate'));

  popupAddData.object_name.dbValue = addSaveData.prodName;
  popupAddData.object_desc.dbValue = addSaveData.prodDesc;
  popupAddData.revision__l2_division.dbValue = addSaveData.prodDivision;
  popupAddData.revision__l2_model_type.dbValue = addSaveData.prodType;
  popupAddData.revision__l2_model_maker.dbValue = addSaveData.prodMaker;
  popupAddData.ref_ModelsTxtBox.dbValue = localStorage.getItem('ref_model');
  popupAddData.ref_PartsTxtBox.dbValue = localStorage.getItem('ref_parts');
  popupAddData.revision__l2_spec_diameter.dbValue = addSaveData.prodDiameter;
  popupAddData.revision__l2_spec_length.dbValue = addSaveData.prodLength;
  popupAddData.revision__l2_spec_material.dbValue = addSaveData.prodMaterial;
  popupAddData.revision__l2_spec_rpm.dbValue = addSaveData.prodRPM;
  popupAddData.revision__l2_spec_voltage.dbValue = addSaveData.prodVoltage;
}

async function applyTxtbox(data) {
  let selectedItem;
  let selectedRevItem;
  let selectedItem2;
  let selectedRevItem2;
  let selectedProps = data.dataProviders.searchAllList.selectedObjects[0];

  if (data.ref_ModelTxtBox.dbValue == '' || data.ref_ModelTxtBox.dbValue == null) {
    let item = {
      infos: [
        {
          itemId: selectedProps.cellHeader2,
        },
      ],
    };
    try {
      selectedItem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item);
      selectedRevItem = selectedItem.output[0].item;
    } catch (err) {
      //console.log(err);
    }
    let selectedValue = [selectedRevItem.props.object_string.uiValues[0], selectedRevItem.uid];
    data.ref_ModelTxtBox.dbValue = selectedValue[0];
    addSaveName.push(selectedValue[0]);
    addSaveDataUid.push(selectedValue[1]);
    localStorage.setItem('ref_model', data.ref_ModelTxtBox.dbValue);
  } else {
    let checkTextSplit = data.ref_ModelTxtBox.dbValue.split(',');
    let checkOverlap = false;

    let item = {
      infos: [
        {
          itemId: selectedProps.cellHeader2,
        },
      ],
    };

    try {
      selectedItem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item);
      selectedRevItem = selectedItem.output[0].item;
    } catch (err) {
      //console.log(err);
    }

    let selectedValue = [selectedRevItem.props.object_string.uiValues[0], selectedRevItem.uid];

    for (let mo of checkTextSplit) {
      if (mo == selectedValue[0]) {
        checkOverlap = true;
      }
    }

    if (checkOverlap == true) {
      msg.show(0, '중복된 값입니다.', ['닫기'], [function () {}]);
    } else {
      let item2 = {
        infos: [
          {
            itemId: selectedProps.cellHeader2,
          },
        ],
      };
      try {
        selectedItem2 = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item2);
        selectedRevItem2 = selectedItem2.output[0].item;
      } catch (err) {
        //console.log(err);
      }
      data.ref_ModelTxtBox.dbValue = data.ref_ModelTxtBox.dbValue + ',' + selectedValue[0];
      addSaveName.push(selectedValue[0]);
      addSaveDataUid.push(selectedValue[1]);
      localStorage.setItem('ref_model', data.ref_ModelTxtBox.dbValue);
    }
  }
}

async function applyPartsTxtbox(data) {
  let selectedItem;
  let selectedRevItem;
  let selectedItem2;
  let selectedRevItem2;
  let selectedProps = data.dataProviders.searchAllList.selectedObjects[0];

  if (data.ref_PartsTxtBox.dbValue == '' || data.ref_PartsTxtBox.dbValue == null) {
    let item = {
      infos: [
        {
          itemId: selectedProps.cellHeader2,
        },
      ],
    };
    try {
      selectedItem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item);
      selectedRevItem = selectedItem.output[0].item;
    } catch (err) {
      //console.log(err);
    }
    let selectedValue = [selectedRevItem.props.object_string.uiValues[0], selectedRevItem.uid];
    data.ref_PartsTxtBox.dbValue = selectedValue[0];
    localStorage.setItem('ref_parts', data.ref_PartsTxtBox.dbValue);
    addPartsSaveDataUid.push(selectedValue[1]);
  } else {
    let checkTextSplit = data.ref_PartsTxtBox.dbValue.split(',');
    let checkOverlap = false;
    let item = {
      infos: [
        {
          itemId: selectedProps.cellHeader2,
        },
      ],
    };
    try {
      selectedItem = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item);
      selectedRevItem = selectedItem.output[0].item;
    } catch (err) {
      //console.log(err);
    }

    let selectedId = selectedRevItem.props.object_string.uiValues[0].split('-');
    let selectedValue = [selectedRevItem.props.object_string.uiValues[0], selectedRevItem.uid];

    for (let mo of checkTextSplit) {
      if (mo == selectedValue[0]) {
        checkOverlap = true;
      }
    }

    if (checkOverlap == true) {
      msg.show(0, '중복된 값입니다.', ['닫기'], [function () {}]);
    } else {
      let item2 = {
        infos: [
          {
            itemId: selectedId[0],
          },
        ],
      };
      try {
        selectedItem2 = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', item2);
        selectedRevItem2 = selectedItem2.output[0].item;
      } catch (err) {
        //console.log(err);
      }
      data.ref_PartsTxtBox.dbValue = data.ref_PartsTxtBox.dbValue + ',' + selectedValue[0];
      localStorage.setItem('ref_parts', data.ref_PartsTxtBox.dbValue);
      addPartsSaveDataUid.push(selectedValue[1]);
    }
  }
}

function modelAddNameReset() {
  addSaveName = [];
  addSaveDataUid = [];
  localStorage.setItem('ref_model', '');
}

function partsAddNameReset() {
  addSaveName = [];
  addPartsSaveDataUid = [];
  localStorage.setItem('ref_parts', '');
}

function sendRef_Model() {
  eventBus.publish('sendRef_Model');
}

function sendRef_Parts() {
  eventBus.publish('sendRef_Parts');
}

function addParts() {
  const findRefParts = locale.getLocalizedText('lgepSpecManagementMessages', 'findRefParts');
  popupService.show({
    declView: 'specAddParts',
    locals: {
      caption: findRefParts,
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

async function appendUidToUrl(data) {
  const popData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));

  let urlParam = decodeURI(window.location.href);
  let tableUID;
  let treeUID;
  let treeUIDValue;
  let urlValue;
  if (data.dataProviders.specManagementChildrenDataProvider.selectedObjects.length > 0) {
    tableUID = data.dataProviders.specManagementChildrenDataProvider.selectedObjects[0].uid;
  } else {
    tableUID = null;
  }
  if (popData.dataProviders.specManagementDataProvider.selectedObjects != 0) {
    treeUID = popData.dataProviders.specManagementDataProvider.selectedObjects[0].uid;
  } else {
    treeUID = null;
  }
  if (treeUID != null) {
    treeUIDValue = treeUID.split(',');
  } else {
    treeUIDValue = null;
  }

  if (tableUID != null && treeUIDValue != null) {
    urlValue = `${urlParam}?s_uid=${tableUID}&uid=${treeUIDValue[0]}`;
    if (tableUID != null || tableUID != undefined) {
      if (urlParam.split('?').length > 1) {
        if (data.dataProviders.specManagementChildrenDataProvider.selectedObjects.length == 1) {
          window.location.href = `#/lgepSpecManagement?s_uid=${tableUID}&uid=${treeUIDValue[0]}`;
        } else if (
          data.dataProviders.specManagementChildrenDataProvider.selectedObjects.length > 1 ||
          data.dataProviders.specManagementChildrenDataProvider.selectedObjects.length == 0
        ) {
          window.location.href = `#/lgepSpecManagement?uid=${treeUIDValue[0]}`;
        }
      } else {
        window.location.href = urlValue;
      }
    }
  } else {
    window.location.href = `#/lgepSpecManagement`;
  }
}

function originURL() {
  window.location.href = `#/lgepSpecManagement`;
}

async function uploadFileToDataset(formData) {
  if (!formData) {
    return;
  } else {
    let file = formData.get('fmsFile');
    let result = await _createDatasets(file);
    _uploadFile(result, file);
    let dataset = await _commitDatasetFiles(result.modelObject, file, result.ticket);
    datasetUid = dataset.uid;
    return dataset;
  }
}

async function linkRelationSpec() {
  const tableData = vms.getViewModelUsingElement(document.getElementById('specManagementTable'));
  let addDatasetItem = tableData.dataProviders.specManagementChildrenDataProvider.selectedObjects[0];
  // IMAN_specification은 createRelation으로 값을 넣는다.
  var jsoObj = {
    input: [
      {
        clientId: '',
        relationType: 'IMAN_specification',
        primaryObject: createItemUid,
        secondaryObject: common.getObject(datasetUid),
      },
    ],
  };
  try {
    let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
  } catch (err) {
    //console.log(err);
  }
  datasetUid = null;
}

/**
 *
 * @param {*} file
 */
function _createDatasets(file) {
  let childName = '';
  let type = '';
  if (file) {
    if (file.name.indexOf('.') >= 0) {
      type = file.name.split('.')[file.name.split('.').length - 1];
      childName = file.name.slice(0, -(type.length + 1));
      file.ext = type;
      file.onlyname = childName;
    }
  }
  var deferred = AwPromiseService.instance.defer();
  let selectedtype = [];
  if (type != null && type !== '') {
    type = type.toLowerCase();
    if (type === 'bmp') {
      selectedtype = ['Bitmap', 'Bitmap', 'Plain', 'Image'];
    } else if (type === 'jt') {
      selectedtype = ['DirectModel', 'DirectModel', 'Plain', 'JTPART'];
    } else if (type === 'cgm') {
      selectedtype = ['DrawingSheet', 'DrawingSheet', 'Plain', 'Sheet'];
    } else if (type === 'dwg') {
      selectedtype = ['DWG', 'DWG', 'Plain', 'DWG'];
    } else if (type === 'dxf') {
      selectedtype = ['DXF', 'DXF', 'Plain', 'DXF'];
    } else if (type === 'gif') {
      selectedtype = ['GIF', 'GIF', 'Plain', 'GIF_Reference'];
    } else if (type === 'jpg') {
      selectedtype = ['JPEG', 'JPEG', 'Plain', 'JPEG_Reference'];
    } else if (type === 'xls') {
      selectedtype = ['MSExcel', 'MSExcel', 'Plain', 'excel'];
    } else if (type === 'xlsx') {
      selectedtype = ['MSExcelX', 'MSExcels', 'Plain', 'excel'];
    } else if (type === 'ppt') {
      selectedtype = ['MSPowerPoint', 'MSPowerPoint', 'Plain', 'powerpoint'];
    } else if (type === 'pptx') {
      selectedtype = ['MSPowerPointX', 'MSPowerPointX', 'Plain', 'powerpoint'];
    } else if (type === 'doc') {
      selectedtype = ['MSWord', 'MSWord', 'Plain', 'word'];
    } else if (type === 'docx') {
      selectedtype = ['MSWordX', 'MSWordX', 'Plain', 'word'];
    } else if (type === 'mpp') {
      selectedtype = ['MSProject', 'MSProject', 'Plain', 'Ms_Project_Doc'];
    } else if (type === 'pdf') {
      selectedtype = ['PDF', 'PDF', 'Plain', 'PDF_Reference'];
    } else if (type === 'asm') {
      selectedtype = ['SE Assembly', 'SE Assembly', 'Plain', 'SE-assembly'];
    } else if (type === 'dft') {
      selectedtype = ['SE Draft', 'SE Draft', 'Plain', 'SE-draft'];
    } else if (type === 'par') {
      selectedtype = ['SE Part', 'SE Part', 'Plain', 'SE-part'];
    } else if (type === 'psm') {
      selectedtype = ['SE SheetMetal', 'SE SheetMetal', 'Plain', 'SE-sheetMetal'];
    } else if (type === 'pwd') {
      selectedtype = ['SE Weldment', 'SE Weldment', 'Plain', 'SE-weldment'];
    } else if (type === 'tif') {
      selectedtype = ['TIF', 'TIF', 'Plain', 'TIF_Reference'];
    } else if (type === 'txt') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'zip') {
      selectedtype = ['Zip', 'Zip', 'Plain', 'ZIPFILE'];
    } else if (type === 'mht') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'png') {
      selectedtype = ['Image', 'Image', 'Plain', 'Image'];
    }
  }
  let inputParam = {
    input: [
      {
        clientId: '0',
        name: file.name,
        container: {},
        type: selectedtype[0],
        datasetFileInfos: [
          {
            clientId: '1',
            fileName: file.name,
            namedReferenceName: selectedtype[3],
            isText: false,
            allowReplace: true,
          },
        ],
      },
    ],
  };
  SoaService.post('Core-2010-04-DataManagement', 'createDatasets', inputParam).then((res) => {
    let result = {
      modelObject: res.datasetOutput[0].dataset,
      ticket: res.datasetOutput[0].commitInfo[0].datasetFileTicketInfos[0].ticket,
    };
    deferred.resolve(result);
  });
  return deferred.promise;
}
/**
 *
 * @param {*} result
 * @param {*} file
 */
function _uploadFile(result, file) {
  let ticketURL = result.ticket;
  var deferred = AwPromiseService.instance.defer();
  var request = new XMLHttpRequest();

  var formData = new FormData();
  formData.append('fmsFile', file, file.name);
  formData.append('fmsTicket', ticketURL);
  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      deferred.resolve(request.response);
    } else {
      deferred.reject({
        status: request.status,
        statusText: request.statusText,
      });
    }
  };
  request.open('POST', document.location.origin + '/fms/fmsupload/', true);
  request.setRequestHeader('X-XSRF-TOKEN', _getCookieValue('XSRF-TOKEN'));
  request.send(formData);
}

/**
 *
 * @param {*} targetDataset
 * @param {*} file
 * @param {*} ticket
 */
function _commitDatasetFiles(targetDataset, file, ticket) {
  var deferred = AwPromiseService.instance.defer();
  let selectedtype = [];
  let type = file.ext;
  if (type != null && type !== '') {
    type = type.toLowerCase();
    if (type === 'bmp') {
      selectedtype = ['Bitmap', 'Bitmap', 'Plain', 'Image'];
    } else if (type === 'jt') {
      selectedtype = ['DirectModel', 'DirectModel', 'Plain', 'JTPART'];
    } else if (type === 'cgm') {
      selectedtype = ['DrawingSheet', 'DrawingSheet', 'Plain', 'Sheet'];
    } else if (type === 'dwg') {
      selectedtype = ['DWG', 'DWG', 'Plain', 'DWG'];
    } else if (type === 'dxf') {
      selectedtype = ['DXF', 'DXF', 'Plain', 'DXF'];
    } else if (type === 'gif') {
      selectedtype = ['GIF', 'GIF', 'Plain', 'GIF_Reference'];
    } else if (type === 'jpg') {
      selectedtype = ['JPEG', 'JPEG', 'Plain', 'JPEG_Reference'];
    } else if (type === 'xls') {
      selectedtype = ['MSExcel', 'MSExcel', 'Plain', 'excel'];
    } else if (type === 'xlsx') {
      selectedtype = ['MSExcelX', 'MSExcels', 'Plain', 'excel'];
    } else if (type === 'ppt') {
      selectedtype = ['MSPowerPoint', 'MSPowerPoint', 'Plain', 'powerpoint'];
    } else if (type === 'pptx') {
      selectedtype = ['MSPowerPointX', 'MSPowerPointX', 'Plain', 'powerpoint'];
    } else if (type === 'doc') {
      selectedtype = ['MSWord', 'MSWord', 'Plain', 'word'];
    } else if (type === 'docx') {
      selectedtype = ['MSWordX', 'MSWordX', 'Plain', 'word'];
    } else if (type === 'mpp') {
      selectedtype = ['MSProject', 'MSProject', 'Plain', 'Ms_Project_Doc'];
    } else if (type === 'pdf') {
      selectedtype = ['PDF', 'PDF', 'Plain', 'PDF_Reference'];
    } else if (type === 'asm') {
      selectedtype = ['SE Assembly', 'SE Assembly', 'Plain', 'SE-assembly'];
    } else if (type === 'dft') {
      selectedtype = ['SE Draft', 'SE Draft', 'Plain', 'SE-draft'];
    } else if (type === 'par') {
      selectedtype = ['SE Part', 'SE Part', 'Plain', 'SE-part'];
    } else if (type === 'psm') {
      selectedtype = ['SE SheetMetal', 'SE SheetMetal', 'Plain', 'SE-sheetMetal'];
    } else if (type === 'pwd') {
      selectedtype = ['SE Weldment', 'SE Weldment', 'Plain', 'SE-weldment'];
    } else if (type === 'tif') {
      selectedtype = ['TIF', 'TIF', 'Plain', 'TIF_Reference'];
    } else if (type === 'txt') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'zip') {
      selectedtype = ['Zip', 'Zip', 'Plain', 'ZIPFILE'];
    } else if (type === 'mht') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'png') {
      selectedtype = ['Image', 'Image', 'Plain', 'Image'];
    }
  }
  let inputParam = {
    commitInput: [
      {
        dataset: targetDataset,
        createNewVersion: true,
        datasetFileTicketInfos: [
          {
            datasetFileInfo: {
              clientId: '1',
              fileName: file.name,
              namedReferencedName: selectedtype[3],
              isText: false,
              allowReplace: true,
            },
            ticket: ticket,
          },
        ],
      },
    ],
  };
  if (type == 'txt' || type == 'mht') {
    inputParam.commitInput[0].datasetFileTicketInfos[0].datasetFileInfo.isText = true;
  }
  SoaService.post('Core-2006-03-FileManagement', 'commitDatasetFiles', inputParam).then((res) => {
    let keys = Object.keys(res.modelObjects);
    for (const key of keys) {
      if (common.instanceOf(res.modelObjects[key], 'Dataset')) {
        deferred.resolve(res.modelObjects[key]);
        return;
      }
    }
    deferred.resolve(null);
  });
  return deferred.promise;
}
/**
 *
 * @param {*} result
 * @param {*} file
 */
function _getCookieValue(key) {
  let cookieKey = key + '=';
  let result = '';
  const cookieArr = document.cookie.split(';');

  for (let i = 0; i < cookieArr.length; i++) {
    if (cookieArr[i][0] === ' ') {
      cookieArr[i] = cookieArr[i].substring(1);
    }

    if (cookieArr[i].indexOf(cookieKey) === 0) {
      result = cookieArr[i].slice(cookieKey.length, cookieArr[i].length);
      return result;
    }
  }
  return result;
}

async function addFolderInTree(data) {
  const popAddData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));
  const close = locale.getLocalizedText('lgepSpecManagementMessages', 'close');
  const createFolderNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'createFolderNoty');
  let folderName = data.createFolderTxtBox.dbValue;

  if (popAddData.dataProviders.specManagementDataProvider.selectedObjects.length != 0) {
    let parentFolderUID = popAddData.dataProviders.specManagementDataProvider.selectedObjects[0].origin;
    let parentFolder = common.getObject(parentFolderUID);

    await common.createFolder(folderName, '', parentFolder);
    eventBus.publish('specManagementTree.plTable.reload');

    msg.show(0, "'" + folderName + "'" + createFolderNoty, [close], [function () {}]);
  } else {
    let topNode = 'garJI3FyZx_JkD';
    let topFolder = common.getObject(topNode);

    await common.createFolder(folderName, '', topFolder);
    eventBus.publish('specManagementTree.plTable.reload');

    msg.show(0, "'" + folderName + "'" + createFolderNoty, [close], [function () {}]);
  }
}

async function deleteFolderInTree(data) {
  const popDeleteData = vms.getViewModelUsingElement(document.getElementById('specManagementTree'));

  let deleteFolderName = popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].displayName;
  let deleteFolderUid = popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].origin;
  let deleteFolder = [];
  deleteFolder.push(common.getObject(deleteFolderUid));

  const deleteFolderNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'deleteFolderNoty');
  const deleteCompleteNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'deleteCompleteNoty');
  const deleteBtn = locale.getLocalizedText('lgepSpecManagementMessages', 'deleteBtn');
  const close = locale.getLocalizedText('lgepSpecManagementMessages', 'close');
  msg.show(
    1,
    deleteFolderNoty,
    [deleteBtn, close],
    [
      async function () {
        let deleteFirstChildren = [];
        let deleteSecondChildrenUID = [];
        let deleteSecondChildren = [];
        let deleteObjUID = [];
        let deleteObj = [];
        let resultSecondChildren = [];
        let resultObj = [];
        if (
          popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].props.contents.dbValues != null ||
          popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].props.contents.dbValues != undefined ||
          popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].props.contents.dbValues != ''
        ) {
          let firstChildren = popDeleteData.dataProviders.specManagementDataProvider.selectedObjects[0].props.contents.dbValues;
          _.forEach(firstChildren, function (value) {
            deleteFirstChildren.push(common.getObject(value));
          });
        }
        _.forEach(deleteFirstChildren, function (val) {
          deleteSecondChildrenUID.push(val.props.contents.dbValues);
        });

        _.forEach(deleteSecondChildrenUID, function (v) {
          deleteSecondChildren.push(common.getObject(v));
        });
        _.forEach(deleteSecondChildren, function (v) {
          resultSecondChildren.push(...v);
        });

        for (let i = 0; i < deleteSecondChildren.length; i++) {
          for (let j = 0; j < deleteSecondChildren[i].length; j++) {
            deleteObjUID.push(deleteSecondChildren[i][j].props.contents.dbValues);
          }
        }

        _.forEach(deleteObjUID, function (v) {
          deleteObj.push(common.getObject(v));
        });

        _.forEach(deleteObj, function (v) {
          resultObj.push(...v);
        });

        eventBus.publish('specManagementTree.plTable.reload');
        if (resultObj != undefined || resultObj != null || resultObj.length != 0) {
          common.deleteObjects(resultObj);
        }
        if (resultSecondChildren != undefined || resultSecondChildren != null || resultSecondChildren.length != 0) {
          common.deleteObjects(resultSecondChildren);
        }
        common.deleteObjects(deleteFolder);
        msg.show(0, "'" + deleteFolderName + "'" + deleteCompleteNoty, [close], [function () {}]);
      },
      function () {},
    ],
  );
}

function createLimitNoty() {
  const createLimitNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'createLimitNoty');
  notySvc.showWarning(createLimitNoty);
}
function createWarningNoty() {
  const createWarningNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'createWarningNoty');
  notySvc.showWarning(createWarningNoty);
}
function showCompareNoty() {
  const compareNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'compareNoty');
  notySvc.showWarning(compareNoty);
}
function showAddNoty() {
  const addNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'addNoty');
  notySvc.showWarning(addNoty);
}
function showSummaryNoty() {
  const editNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'editNoty');
  notySvc.showWarning(editNoty);
}
function showDeleteNoty() {
  const deleteNoty = locale.getLocalizedText('lgepSpecManagementMessages', 'deleteNoty');
  notySvc.showWarning(deleteNoty);
}

let exports = {};

export default exports = {
  addFolderInTree,
  addModel,
  addParts,
  allList,
  appendUidToUrl,
  applyTxtbox,
  applyPartsTxtbox,
  cancelEdit,
  changeColor,
  changeEdit,
  changeEdit2,
  changeEditMode,
  changeLabel,
  changeVisibleAdd,
  clearSearch,
  closeAddPopup,
  createLimitNoty,
  createSpecData,
  deleteFolderInTree,
  divisionValue,
  exportToExcel,
  falseVisibleAdd,
  getChildrenData,
  getFilterFacetData,
  getFilterFacets,
  inputImage,
  limitedSelected,
  linkRelationSpec,
  loadAddData,
  loadAllList,
  loadHomeList,
  loadEmployeeTreeTableData,
  makerValue,
  modelAddNameReset,
  onlyTrue,
  originURL,
  parent,
  partsAddNameReset,
  realGetCompareData,
  reload,
  saveAddData,
  saveEdit,
  searchSpecTable,
  sendRef_Model,
  sendRef_Parts,
  showAddNoty,
  showCompareNoty,
  createWarningNoty,
  showDeleteNoty,
  showSummaryNoty,
  sortAction,
  specDeleteObject,
  typeValue,
  uploadFileToDataset,
  commandbarChange,
};

app.factory('SpecManagementService', () => exports);
