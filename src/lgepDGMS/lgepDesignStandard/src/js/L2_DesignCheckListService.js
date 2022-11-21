import app from 'app';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import com, { getItemFromId } from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import msg from 'js/utils/lgepMessagingUtils';
import appCtxService from 'js/appCtxService';
import vms from 'js/viewModelService';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import SoaService from 'soa/kernel/soaService';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import Grid from 'tui-grid';
import _ from 'lodash';
import 'tui-grid/dist/tui-grid.css';
import { checkIfSearchCtxExists, ifFilterSelectedForCategory } from 'js/filterPanelUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import loadUtils from 'js/utils/lgepLoadingUtils';
import awTableStateService from 'js/awTableStateService';
import navigationSvc from 'js/navigationService';
import { constructViewModelObject } from 'js/viewModelObjectService';
import { item_id } from 'js/L2_StandardBOMConstants';
import { constructViewModelObjectFromModelObject } from 'js/viewModelObjectService';
import { forEach } from 'angular';

let _scope;

var $ = require('jQuery');
export async function showTableCheck(ctx) {
  // await lgepCommonUtils.delay(1000);
  loadUtils.openWindow();

  let headData;

  let data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));

  // if(data.showToast == true){
  //     data.showToast == false
  // }
  let treeD = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  let treeC = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  if (treeC === undefined) {
    loadUtils.closeWindow();
    msg.show(
      1,
      '설계지침서를 열어주세요',
      ['닫기'],
      [
        function () {
          data.showToast = false;
        },
      ],
    );
  } else {
    let ctx = appCtxService.ctx;
    let searchInput = {
      attributesToInflate: ['object_name', 'object_desc', 'L2_DesignStandardRel', 'item_id'],
      maxToLoad: -1,
      maxToReturn: -1,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: 'L2_StructureRevision',
            colorValue: '',
            stringDisplayValue: '',
            startDateValue: '',
            endDateValue: '',
            startNumericValue: 0,
            endNumericValue: 0,
            count: 0,
            selected: false,
            startEndRange: '',
          },
        ],
      },
      searchSortCriteria: [],
      startIndex: 0,
    };

    let params = {
      types: [
        {
          name: 'WorkspaceObject',
          properties: [{ name: 'object_name' }, { name: 'creation_date' }, { name: 'items_tag' }, { name: 'L2_DesignStandardRel' }, { name: 'item_id' }],
        },
      ],
    };

    let result = await query.performSearchViewModel4(null, searchInput, params);
    result = result.searchResults;
    com.getProperties(result, ['L2_DesignStandardRel']);

    // let book = com.getObject(
    //   treeC.bomLineTree[0].obj.props.items_tag.dbValues[0]
    // );
    // console.log(book);
    // console.log(await com.whereReferenced([book], 1));
    let home = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i].props.L2_DesignStandardRel.dbValues.length > 0) {
        if (result[i].props.L2_DesignStandardRel.dbValues[0] == treeC.bomLineTree[0].obj.props.items_tag.dbValues[0]) {
          home.push(result[i]);
        }
      }
    }
    com.getProperties(home, ['item_id']);

    let treeData = treeD.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects;
    // console.log({treeData});
    let info = await lgepPreferenceUtils.getPreference('L2_Checklist_Structure');
    info = com.getObject(info.Preferences.prefs[0].values[0].value);
    // console.log(info);

    // console.log(ctx);
    let folderUser;
    for (let i = 0; i < info.props.contents.dbValues.length; i++) {
      if (ctx.userSession.props.group.displayValues[0] == info.props.contents.uiValues[i]) {
        folderUser = await com.getObject(info.props.contents.dbValues[i]);
      }
    }

    // console.log(folderUser);
    let underFolder = [];
    for (let i = 0; i < folderUser.props.contents.dbValues.length; i++) {
      underFolder.push(com.getObject(folderUser.props.contents.dbValues[i]));
    }
    // console.log({underFolder});

    let template = [];
    for (let i = 0; i < underFolder.length; i++) {
      if (underFolder[i].props.contents.dbValues.length > 0 && underFolder[i].props.contents !== undefined) {
        for (let l = 0; l < underFolder[i].props.contents.dbValues.length; l++) {
          template.push(await com.getObject(underFolder[i].props.contents.dbValues[l]));
        }
      }
    }
    await com.getProperties(template, ['item_id', 'contents', 'ps_children']);
    // console.log(template);
    let templateRev = [];
    for (let i = 0; i < template.length; i++) {
      templateRev.push(await com.getLatestItemRevisionByItemId(template[i].props.item_id.dbValues[0]));
    }

    await com.getProperties(templateRev, ['contents', 'ps_children']);
    let children = [];
    for (let i = 0; i < templateRev.length; i++) {
      for (let l = 0; l < templateRev[i].props.ps_children.dbValues.length; l++) {
        children.push(await com.getObject(templateRev[i].props.ps_children.dbValues[l]));
      }
    }
    let test = [];

    for (let i = 0; i < templateRev.length; i++) {
      test.push(await bomUtils.createBOMWindow(null, templateRev[i]));
      await bomUtils.closeBOMWindow(test[i].bomWindow);
    }

    // console.log({topBom});

    //         if(expandResult.output[0].children.length > 0){
    //         eResult = expandResult.output[0].children;
    //         }
    //         for(let i = 0; i<eResult.length; i++){
    //         await com.getProperties(eResult[i].bomLine,["bl_child_lines","object_name","bl_item_object_name","bl_rev_item_revision","bl_rev_item_revision_id","bl_item","bl_rev_current_id_uid","bl_rev_revision_list"]);
    //
    // console.log({test});
    let firstS = [];
    for (let i = 0; i < test.length; i++) {
      if (test[i].bomLine.props.bl_child_lines !== undefined) {
        for (let l = 0; l < test[i].bomLine.props.bl_child_lines.dbValues.length; l++) {
          firstS.push(com.getObject(test[i].bomLine.props.bl_child_lines.dbValues[l]));
        }
      }
    }

    headData = treeD.dataProviders.designStandardTreeTableData.selectedObjects[0];
    // console.log(headData);
    if (headData == undefined) {
      let getRev = [];
      await com.getProperties(firstS, ['awb0BomLineItemId']);
      for (let i = 0; i < firstS.length; i++) {
        getRev[i] = await com.getLatestItemRevisionByItemId(firstS[i].props.awb0BomLineItemId.dbValues[0]);
      }
      // console.log({getRev});
      await com.getProperties(getRev, ['L2_DesignStandardRel']);
      let selected;
      for (let i = 0; i < getRev.length; i++) {
        if (getRev[i].props.L2_DesignStandardRel.dbValues.length > 0) {
          if (getRev[i].props.L2_DesignStandardRel.dbValues[0] == treeC.bomLineTree[0].obj.props.items_tag.dbValues[0]) {
            selected = getRev[i];
          }
        }
      }
      // console.log(treeC.bomLineTree[0].obj.props.items_tag.dbValues[0])
      // console.log(selected);
      await com.getProperties(selected, ['item_id', 'owning_group']);

      for (let i = 0; i < firstS.length; i++) {
        if (firstS[i].props.awb0BomLineItemId.dbValues[0] == selected.props.item_id.dbValues[0]) {
          headData = firstS[i];
        }
      }
    }
    await com.getProperties(headData, ['bl_child_lines']);

    let headExpand;
    headExpand = await bomUtils.expandPSAllLevels([headData]);

    let failGroup = [];

    for (let i = 0; i < headExpand.output.length; i++) {
      if (headExpand.output[i].parent.bomLine.props.object_string.dbValues[0].includes('고장')) {
        failGroup.push(headExpand.output[i].parent.bomLine);
      }
    }
    await com.getProperties(failGroup, ['L2_ReferenceDataset']);

    // console.log({ failGroup });
    let predataset = [];
    let datasetInfo = [];
    for (let i = 0; i < failGroup.length; i++) {
      if (failGroup[i].props.L2_ReferenceDataset.dbValues[0] !== '') {
        datasetInfo.push(com.getObject(failGroup[i].props.L2_ReferenceDataset.dbValues[0]));
      }
    }

    datasetInfo = datasetInfo.filter((element, i) => element != null);

    if (datasetInfo.length < 0) {
      data.showToast = false;
    }

    // console.log(datasetInfo);
    getDataset(datasetInfo);
  }
}
async function getDataset(itemRev) {
  let dataset = [];
  let data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
  //     let datasetTemp = [];
  //     if (itemRev[l].props.L2_ReferenceDataset.dbValues.length > 0) {
  //         datasetTemp.push(com.getObjects(itemRev[l].props.L2_ReferenceDataset.dbValues[0]));
  //     }
  //     let video = [];
  //     if (datasetTemp == null) {
  //       console.log(datasetTemp);
  //         return;
  //     } else {

  if (!Array.isArray(dataset)) {
    dataset = [dataset];
  }

  // console.log(itemRev);
  await com.getProperties(itemRev, ['ref_list']);
  let file = [];
  for (let i = 0; i < itemRev.length; i++) {
    file.push(com.getObject(itemRev[i].props.ref_list.dbValues[0]));
  }
  file = flatAr(file);
  // console.log(file);
  for (let i = 0; i < itemRev.length; i++) {
    if (itemRev[i].type == 'Text') {
      dataset.push(file[i]);
    }
  }

  await com.getProperties(dataset, ['file_size', 'byte_size']);
  let fileSize = 0;
  for (let i of dataset) {
    fileSize = fileSize + Number(i.props.byte_size.dbValues[0]);
  }
  // console.log({ dataset });

  if (dataset.length > 0) {
    //파일티켓 읽기
    let textTicket;
    let string;
    let list = [];
    let num = 0;
    let searchGroup = [];
    let inputParam;
    for (let i = 0; i < dataset.length; i++) {
      inputParam = {
        files: [dataset[i]],
      };
      searchGroup.push(await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam));
    }

    for (let i = 0; i < searchGroup.length; i++) {
      let stringTemp = '';
      textTicket = searchGroup[i].tickets[1][0];
      let textURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;
      const res = await fetch(textURL);

      const arrayBuffer = await res.arrayBuffer();
      const chars = new Uint8Array(arrayBuffer);

      stringTemp = stringTemp + new TextDecoder().decode(chars);

      string = JSON.parse(stringTemp);
      list[i] = string;
    }

    let index = [];
    for (let i = 0; i < list.length; i++) {
      if (list[i]['detectivity'] == '' && list[i]['failureDetail'] == '' && list[i]['prevention'] == '') {
        delete list[i];
      }
    }
    list = list.filter((element) => element !== undefined);

    localStorage.setItem('datasetInfo', JSON.stringify(list));

    // var testList = [];
    let data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));
    if (list.length == 0) {
      data.showToast = false;
    } else {
      data.showToast = true;
    }
    // var arrData = [];
    // // console.log(list);
    // // console.log(list[0]["detectivity"]);
    // for (let i = 0; i < list.length; i++) {
    //   const rowData2 = {
    //     detectivity: list[i]["detectivity"],
    //     failureDetail: list[i]["failureDetail"],
    //     prevention: list[i]["prevention"],
    //   };
    //   rowData.push(rowData2);
    // }
    // // console.log(rowData);

    // let columns = [
    //   {
    //     header: "결함",
    //     name: "detectivity",
    //     // or regardless of version
    //     width: 700,
    //   },
    //   {
    //     header: "고장원인",
    //     name: "failureDetail",
    //     // or regardless of version
    //   },
    //   {
    //     header: "예방",
    //     name: "prevention",
    //     // or regardless of version
    //     width: 800,
    //   },
    // ];

    // testList.push(columns);

    // // const columns1 = _getColumns(columns, widthArray);
    // // console.log(testList);

    // // console.log(testList);
    // try {
    //   const grid = new Grid({
    //     el: document.getElementById("checkToast"),
    //     data: rowData,
    //     columns: columns,
    //     rowHeight: 400,
    //     bodyHeight: 500,
    //     bodyWidth: 800,
    //     scrollX: false,
    //     scrollY: false,
    //   });
    // } catch {
    //   loadUtils.closeWindow();
    // }
  } else {
    data.showToast = false;
    loadUtils.closeWindow();
    return msg.show(
      1,
      '설계지침서가 없습니다',
      ['닫기'],
      [
        function () {
          data.showToast = false;
        },
      ],
    );
  }

  if (!data.showToast) {
    return loadUtils.closeWindow();
  } else {
    loadUtils.closeWindow();
    var win = window.open('http://localhost:3001/#/L2_DesignStandardEnterTree');
  }
}
function flatAr(arr) {
  let result = arr.slice();
  for (let i = 0; i < result.length; i++) {
    if (Array.isArray(result[i])) {
      result = result.flat();
    }
  }
  return result;
}

export class ImageCellRenderer {
  constructor(props) {
    const el = document.createElement('div');
    el.type = 'image';
    this.el = el;
    this.render(props);
  }
  getElement() {
    return this.el;
  }
  render(props) {
    if (props.value) {
      let string = props.value.replaceAll('\\\\\\', '');
      string = props.value.replaceAll('\\"', '');
      this.el.innerHTML = String(string);
    }
  }
}

async function getDatasetNewTab(list) {
  if (list.length > 0) {
    const rowData = new Array();
    var testList = [];
    // console.log(list);
    // console.log(list[0]["detectivity"]);

    for (let i = 0; i < list.length; i++) {
      const rowData2 = {
        detectivity: list[i]['detectivity'],
        failureDetail: list[i]['failureDetail'],
        prevention: list[i]['prevention'],
      };
      rowData.push(rowData2);
    }
    // console.log(rowData);

    let columns = [
      {
        header: '결함',
        name: 'detectivity',
        // or regardless of version
        // renderer: {
        //   type: ImageCellRenderer,
        //   // define your option to need to be passed
        //   options: {}
        // },
        minWidth: 100,
      },
      {
        header: '고장원인',
        name: 'failureDetail',
        // or regardless of version
        minWidth: 200,
        width: 300,
      },
      {
        header: '예방',
        name: 'prevention',
        // or regardless of version
        // renderer: {
        //   type: ImageCellRenderer,
        //   // define your option to need to be passed
        //   options: {}
        // },
        minWidth: 200,

        resizable: true,
      },
    ];

    testList.push(columns);

    // const columns1 = _getColumns(columns, widthArray);
    // console.log(testList);

    // console.log(testList);

    // console.log(document.getElementById('checkToast1'))

    const grid = new Grid({
      el: document.getElementById('checkToast1'),
      data: rowData,
      columns: columns,
      frozenCount: 3,
      frozenBorderWidth: 2,
      rowHeight: document.getElementsByName('L2_DesignStandardEnterTree')[0].offsetHeight + 170,
      width: document.getElementsByName('L2_DesignStandardEnterTree')[0].offsetWidth + 90,
      bodyWidth: 800,
      scrollX: false,
      scrollY: false,
      columnOptions: {
        resizable: true,
      },
    });

    if (appCtxService.ctx.theme == 'ui-lgepDark') {
      Grid.applyTheme('default', {
        scrollbar: {
          border: '#444a4e',
          background: '#282d33',
        },
      });
    } else {
      Grid.applyTheme('default', {
        scrollbar: {
          border: '#eee',
          background: '#fff',
        },
      });
    }
  }
}

let num = 0;
let open = true;
export function treeSelectionChangeEvent(ctx, data, eventData) {
  // logger.info("treeSelectionChangeEvent");

  _scope = eventData.scope;
}

export async function treeUp(data, ctx) {
  let treeD = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  treeD.open = false;
  if (!treeD.open) {
    let treeC = vms.getViewModelUsingElement(document.getElementById('designStdData'));
    let dataP = treeD.dataProviders.designStandardTreeTableData.getViewModelCollection().loadedVMObjects;
    const expandAll = async function (node) {
      if (node.isLeaf || node.isExpanded) {
        return;
      }
      if (treeD.open) {
        return;
      }
      node.isExpanded = true;
      node.loadingStatus = true;
      node._expandRequested = true;
      awTableStateService.saveRowExpanded(treeD, 'designStandardTreeTable', node);
      treeD.dataProviders.designStandardTreeTableData.selectionModel.addToSelection(node);
      try {
        const updatedViewModelCollection = await treeD.dataProviders.designStandardTreeTableData.expandObject(_scope, node);
        delete node.loadingStatus;
        delete node._expandRequested;

        const loadedVMObjects = updatedViewModelCollection.loadedVMObjects;
        for (let i = 0; i < loadedVMObjects.length; i++) {
          const loadedVMObject = loadedVMObjects[i];
          if (!loadedVMObject.isExpanded) {
            await expandAll(loadedVMObject);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        delete node.loadingStatus;
        delete node._expandRequested;
        treeD.dataProviders.designStandardTreeTableData.selectNone();
      }
    };

    const loadedVMObjects = treeD.dataProviders.designStandardTreeTableData.getViewModelCollection().loadedVMObjects;
    for (let i = 0; i < loadedVMObjects.length; i++) {
      const loadedVMObject = loadedVMObjects[i];
      if (!loadedVMObject.isExpanded) {
        await expandAll(loadedVMObject);
      }
    }
  }
}

// let treeD = vms.getViewModelUsingElement(document.getElementById("designStdData"));
//     if(!treeD.open || treeD.open == undefined){
//         num = ++num;
//     }

//     await lgepCommonUtils.delay(200);

//     let selected = treeD.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects;
//     let temp = selected;
//     if(num > 0 ){
//         let data = vms.getViewModelUsingElement(document.getElementById("stdTreeNavData"));
//         // data.navMode = 'hi';
//     for(let l =0;l<temp.length;l++){
//         if(selected[l].type === "Folder" && selected[l].isExpanded !== true){
//         if(selected[l].props.contents.dbValues.length>0){
//             selected[l].isExpanded = true;
//             selected[l].__expandState = true;
//             await lgepCommonUtils.delay(300);
//               eventBus.publish("designStandardTreeTable.plTable.toggleTreeNode",selected[l]);
//             break;

//         }
//      } else if(selected[l].type !== "Folder" && selected[l].isExpanded !== true && selected[l].isLeaf ==false) {
//         selected[l].isExpanded = true;
//             selected[l].__expandState = true;
//             await lgepCommonUtils.delay(400);
//               eventBus.publish("designStandardTreeTable.plTable.toggleTreeNode",selected[l]);
//         break;
//      }
//     }
//     if(num>21){
//         num = 0;
//         data.navMode = undefined;
//         return;
//     }
//     // console.log(num);
//     return treeUp();
// } else if(num >50) {
//     // console.log("넘음");
//     return eventBus.publish("designStandardTreeTable.plTable.reload");
// }

export async function treeShrink() {
  let treeD = vms.getViewModelUsingElement(document.getElementById('designStdData'));
  treeD.open = true;
  treeD.dataProviders.designStandardTreeTableData.selectNone();
  _scope = null;

  const loadedVMObjects = treeD.dataProviders.designStandardTreeTableData.getViewModelCollection().loadedVMObjects;
  const findExpandedNodes = awTableStateService.findExpandedNodes(treeD, 'designStandardTreeTable', loadedVMObjects);
  // console.log(awTableStateService);
  if (findExpandedNodes) {
    const findExpandedNodesValues = Object.values(findExpandedNodes);
    _.forEach(findExpandedNodesValues, function (findExpandedNodesValue) {
      const expandedNode = findExpandedNodesValue.nodeToExpand;
      delete expandedNode.isExpanded;
      delete expandedNode.loadingStatus;
      const updatedViewModelCollection = treeD.dataProviders.designStandardTreeTableData
        .collapseObject(_scope, expandedNode)
        .then((updatedViewModelCollection) => {
          awTableStateService.saveRowCollapsed(treeD, 'designStandardTreeTable', expandedNode);
        })
        .finally(() => {
          awTableStateService.saveRowCollapsed(treeD, 'designStandardTreeTable', expandedNode);
          delete expandedNode.loadingStatus;
        });
    });
  }
  //     await lgepCommonUtils.delay(500);
  //     let treeD = vms.getViewModelUsingElement(document.getElementById("designStdData"));
  //     // await lgepCommonUtils.delay(200);
  //     // console.log(treeD);
  //     // treeD.open = false;
  //     num=0;

  //     let data = vms.getViewModelUsingElement(document.getElementById("stdTreeNavData"));
  //     eventBus.publish("designStandardTreeTable.plTable.reload");
  //     treeD.dataProviders.designStandardTreeTableData.enableExpansionStateCaching = false;
  //         let select = document.getElementsByClassName("ui-grid-tree-base-row-header-buttons ui-grid-tree-base-header aw-jswidgets-treeExpandCollapseCmd");
  //        let hi =  document.getElementById("miscExpandedTree")
  //        console.log({hi});
  //        console.log({select});
  //    console.log("작동");
  //     for(let i = 0; i < select.length; i++) {
  //         select[i].click();
  //         // await lgepCommonUtils.delay(100) ;
  //     }
}

let sizeUp;
export async function fitSizeOfToast(data) {
  let toastData = vms.getViewModelUsingElement(document.getElementById('checkToast'));
  let treeC = vms.getViewModelUsingElement(document.getElementById('bomlineTreeData'));
  let hi = document.getElementsByClassName('summernoteBasisDefault');
  if (treeC === undefined) {
    return loadUtils.closeWindow();
  }
  // console.log(toastData);
  $('.tui-grid-rside-area').width('1780px');
  if (sizeUp == undefined || toastData.sizeUp == false) {
    // console.log(treeD);
    $('.tui-grid-rside-area').width('1780px');
    // $('.tui-grid-rside-area').height("1780px");
    sizeUp = true;
  } else {
    $('.tui-grid-rside-area').width('100%');
    sizeUp = false;
  }
}

export async function reload() {
  return eventBus.publish('designStandardTreeTable.plTable.reload');
}

export async function toastNewTab() {
  // console.log("hi");
  //     console.log("hello world");
  //     console.log(window.location.href);
  let data = vms.getViewModelUsingElement(document.getElementById('L2DesignStandardData'));

  //     data.showNewTab = true;

  // let info =  await lgepPreferenceUtils.getPreference("L2_Checklist_Structure");
  // console.log(info);
  //     let treeD = vms.getViewModelUsingElement(document.getElementById("designStdData"));
  //     let treeC = vms.getViewModelUsingElement(document.getElementById("bomlineTreeData"));
  //     console.log(treeD);
  //     console.log(treeC);

  //     let treeData = treeD.dataProviders.designStandardTreeTableData.viewModelCollection.loadedVMObjects;

  //     console.log({treeD})
  //    let headData;

  //         console.log({treeC});

  //     await lgepCommonUtils.delay(100);
  //         headData= treeD.dataProviders.designStandardTreeTableData.selectedObjects[0];
  //     console.log(headData);
  //     if(headData == undefined) {
  //         let getRev = []
  //         for(let i = 0; i < treeData.length; i++){
  //             if(treeData[i].type !== "Folder" && treeData[i].props.awb0BomLineItemId !== undefined){
  //             getRev[i] = await com.getLatestItemRevisionByItemId(treeData[i].props.awb0BomLineItemId.dbValues[0])
  //             }
  //         }
  //         let deRev = getRev.filter( (element, i) => element !== undefined);
  //         let selected;
  //         for(let i = 0; i < deRev.length; i++){
  //                 if(deRev[i].props.L2_DesignStandardRel.dbValues[0] == treeC.bomLineTree[0].obj.props.items_tag.dbValues[0]){
  //                 selected= deRev[i];
  //             }
  //         }
  //         console.log(selected);
  //         await com.getProperties(selected,["item_id"]);

  //         for(let i = 0; i < treeData.length; i++){
  //             if(treeData[i].type !== "Folder" && treeData[i].props.awb0BomLineItemId.dbValues[0] == selected.props.item_id.dbValues[0] ){
  //               headData = treeData[i];
  //               break;
  //             }
  //         }
  //     }
  //         await com.getProperties(headData,["bl_child_lines"]);

  //     let firstStr = [];
  //     for (let i = 0; i < headData.props.bl_child_lines.dbValues.length; i++) {
  //         firstStr.push(com.getObject(headData.props.bl_child_lines.dbValues[i]))
  //     }

  //     let function1 = [];
  //     for (let i = 0; i < firstStr.length; i++) {
  //         await com.getProperties(firstStr[i], ["bl_child_lines"]);
  //         function1.push(com.getObject(firstStr[i].props.bl_child_lines.dbValues));
  //     }

  //     let failBom = []
  //     for (let i = 0; i < function1.length; i++) {
  //         await com.getProperties(function1[i], ["bl_child_lines"]);
  //     }
  //     for (let i = 0; i < function1.length; i++) {
  //         failBom.push(com.getObject(function1[i][0].props.bl_child_lines.dbValues));
  //     }
  //     let failBom1 = failBom.flat()
  //     console.log({failBom1});
  //     await com.getProperties(failBom1, ["L2_ReferenceDataset"]);

  //     let predataset = [];
  //     let datasetInfo = [];
  //     for (let i = 0; i < failBom1.length; i++) {
  //         if(failBom1[i].props.L2_ReferenceDataset.dbValues[0] !== ''){
  //         predataset.push(await com.loadObject(failBom1[i].props.L2_ReferenceDataset.dbValues[0]));
  //         datasetInfo.push(predataset[i].modelObjects[failBom1[i].props.L2_ReferenceDataset.dbValues[0]]);
  //     }else {
  //         break;
  //     }
  // }
  //     getDatasetNewTab(datasetInfo);
}

// export function toastNewTab1(title, url, state) {
//     var win = window.open('http://localhost:3001/#/L2_DesignStandardEnterTree');
// }

// export const navigationFmea = (information, toUri = '#/L2_DesignStandardEnterTree') => {
//     const action = {
//       actionType: 'Navigate',
//       navigateTo: toUri,
//     };
//     appCtxService.registerCtx("info",information);
//     navigationSvc.navigate(action,information);
//   };

export async function callToast() {
  // console.log("hello world")
  await lgepCommonUtils.delay(100);
  let data = localStorage.getItem('datasetInfo');

  // console.log(JSON.parse(localStorage.getItem("datasetInfo")));

  let list = JSON.parse(localStorage.getItem('datasetInfo'));
  getDatasetNewTab(list);
}

let exports = [];
export default exports = {
  // toastNewTab1,
  callToast,
  showTableCheck,
  treeUp,
  treeShrink,
  fitSizeOfToast,
  toastNewTab,
  reload,
  treeSelectionChangeEvent,
};
