import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import msg from 'js/utils/lgepMessagingUtils';
import vmoService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';

var $ = require('jQuery');

export async function addPartItemData(data, ctx) {
  //console.log("아예안됨?");
  const popData = vms.getViewModelUsingElement(document.getElementById('partTree'));
  //console.log({popData});
  let selectedData = popData.dataProviders.partMgmtTreeDataProvider.selectedObjects;
  //console.log(data);
  let itemName = data.addPartItemTitle.dbValues[0];
  let desc = data.addPartItemDesc.dbValues[0];
  if (selectedData.length == 1 && selectedData[0].childNdx == 2 && !itemName == '') {
    let saveFolder = com.getObject(selectedData[0].uid);

    com.createItem('', 'Item', itemName, desc, saveFolder);
  } else {
    //console.log("아이템 생성 불가 입니다");
  }

  eventBus.publish('partMgmtTable.plTable.reload');
}

export async function deletePartItemData(data, ctx) {
  //console.log("지우기");
  //console.log({data});
  //console.log({ctx});
  const popTableData = vms.getViewModelUsingElement(document.getElementById('partTable'));
  //console.log(popTableData);
  let selectedObjectToDelete = com.getObject(ctx.data.dataProviders.partMgmtTableDataProvider.selectedObjects[0].props.items_tag.dbValues[0]);

  await com.deleteObject(selectedObjectToDelete);

  eventBus.publish('partMgmtTable.plTable.reload');
}

let exports = {};

export default exports = {
  addPartItemData,
  deletePartItemData,
};

app.factory('createPartItemService', () => exports);
