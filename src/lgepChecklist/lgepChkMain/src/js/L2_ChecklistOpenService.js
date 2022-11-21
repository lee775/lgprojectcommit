import app from 'app';

import $ from 'jquery';
import eventBus from 'js/eventBus';
import { ctx } from 'js/appCtxService';
import soaService from 'soa/kernel/soaService';
import vmoService from 'js/viewModelObjectService';
import popupService from 'js/popupService';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepLoadingUtils from 'js/utils/lgepLoadingUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import { ERROR, INFORMATION, show } from 'js/utils/lgepMessagingUtils';
import minutesService from 'js/minutesService';
import { getActionPriorityForList2 } from 'js/sodAPTableService';
import { getInteractionStructureInfo } from 'js/L2_ChecklistInteractionUtils';
import { backToSelectionPage, loadAndRefreshGrid, setTuiGridStyle } from 'js/L2_ChecklistMainService';
import { setSublocationTitle, checklistRowColumns, readPropertiesFromTextFile, checklistProperties, getColumnBalloonData } from 'js/utils/checklistUtils';
import { fixedOff, autoResize } from 'js/L2_ExportExcelService';

let MSG = 'L2_ChkMainMessages';
let i18n = {
  chkRowLoadFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkMakeFailed'),
  chkRowNoGridId: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowNoGridId'),
  chkRowFreezeCheck: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowFreezeCheck'),
  chkRowFreezeComplete: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowFreezeComplete'),
  chkRowFreezeFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowFreezeComplete'),
  chkRowUnFreezeCheck: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowUnFreezeCheck'),
  chkRowUnFreezeComplete: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowUnFreezeComplete'),
  chkRowUnFreezeFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowUnFreezeFailed'),
  chkRowReviseComplete: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowReviseComplete'),
  chkRowReviseFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkRowReviseFailed'),
  copyObject: lgepLocalizationUtils.getLocalizedText(MSG, 'copyObject'),
  copyText: lgepLocalizationUtils.getLocalizedText(MSG, 'copyText'),
};

let exports;

/**
 *  체크리스트 상세 조회 화면 내에서의 열 클래스
 *  Toast Grid의 Row로 사용된다.
 */
export class ChecklistRow {
  /**
   *
   * @param {ModelObject<Awb0DesignElement>} targetElement
   */
  constructor(targetElement) {
    try {
      /**
       * ChecklistRow의 BOM 객체 (Awb0DesignElement) 를 반환한다.
       * @returns ModelObject<Awb0DesignElement>
       */
      this.getObject = function () {
        return targetElement;
      };

      /**
       * ChecklistRow의 원본 객체 (L2_StructureRevision/L2_FunctionRevision/L2_FailureRevision) 를 반환한다.
       * @returns ModelObject<L2_StructureRevision|L2_FunctionRevision|L2_FailureRevision>
       */
      this.getOriginalObject = function () {
        let originalUid = targetElement.props.awb0UnderlyingObject.dbValues[0];
        let originalObject = lgepObjectUtils.getObject(originalUid);
        return vmoService.constructViewModelObjectFromModelObject(originalObject);
      };

      /**
       * ChecklistRow의 하위에 붙은 객체를 반환한다.
       * 만약 _children이 [] 로라도 선언이 되어있다면,
       * 실제 자식이 있던 없던 Expand/Collapse 아이콘이 생성되므로 주의 필요.
       * @returns children
       */
      this.getChildren = function () {
        return this._children;
      };

      /**
       * ChecklistRow의 상위 객체를 반환한다.
       * @returns parent
       */
      this.getParent = function () {
        return this.parent;
      };

      // ChecklistRow에 필요한 속성들을 Awb0DesignElement로부터 불러온다.

      this.id = targetElement.uid;
      this.icon = this.getOriginalObject().uid;
      this.name = targetElement.props.awb0ArchetypeRevName.dbValues[0];
      this.revisionId = targetElement.props.awb0ArchetypeRevId ? targetElement.props.awb0ArchetypeRevId.dbValues[0] : '';
      this.type = targetElement.props.awb0UnderlyingObjectType.dbValues[0];
      this.iconUrl = this.getOriginalObject().typeIconURL;
      this.failureMode = targetElement.props.l2_failure_mode.dbValues[0];
      this.refSeverity = targetElement.props.l2_ref_severity.dbValues[0];
      this.refOccurence = targetElement.props.l2_ref_occurence.dbValues[0];
      this.refDetection = targetElement.props.l2_ref_detection.dbValues[0];
      this.AP = targetElement.props.l2_ref_ap.dbValues[0];
      this.newSeverity = targetElement.props.l2_result_severity.dbValues[0];
      this.newOccurence = targetElement.props.l2_result_occurence.dbValues[0];
      this.newDetection = targetElement.props.l2_result_detection.dbValues[0];
      this.newAP = targetElement.props.l2_result_ap.dbValues[0];
      if (targetElement.props.l2_is_selected) this.isSelected = targetElement.props.l2_is_selected.dbValues[0];
      if (targetElement.props.l2_reference_dataset) this.refDatasetUid = targetElement.props.l2_reference_dataset.dbValues[0];

      // Toast Grid에서는 _attributes 속성을 통해서 특수한 Flag가 관리된다.
      // 항상 모든 Tree가 펼쳐있도록 하기 위해, _attributes를 true 로 준다.
      this._attributes = { expanded: true };
    } catch (error) {
      show(ERROR, error.message);
    }
  }
}

/**
 * 페이지가 처음 로드되었을 때 호출되는 함수.
 * 테이블 모드를 할당하고, Sublocation Title 할당하는 등 최초에 필요한 인자들을 불러온다.
 * @param {*} data
 * @param {*} ctx
 */
export function initialize(data, ctx) {
  // Context 내에 체크리스트가 없는 경우, 생성한다.
  if (!ctx.checklist) {
    ctx.checklist = {};
  }
  // 테이블 모드를 1로 할당한다. 1은 이미지 뷰 이다.
  ctx.checklist.tableMode = '1';

  //subLocation 제목을 할당한다. (선택한 객체 기준으로 값이 입력된다.)
  setSublocationTitle()
    .then((targetObject) => {
      ctx.checklist.target = targetObject;
      // 선택한 객체 기준으로 테이블을 새로 그린다.
      return loadAndRefreshOpenGrid();
    })
    .catch((error) => {
      show(ERROR, i18n.chkRowLoadFailed + '\n' + error.message);
    });
}

/**
 * 페이지가 unMount 되었을 때, 사용되었던 매개변수들을 초기화시켜준다.
 * @param {*} data
 * @param {*} ctx
 */
export function unMount(data, ctx) {
  delete ctx.checklist.tableMode;
  delete ctx.checklist.target;
  delete ctx.checklist.grid;
  delete ctx.checklist.structure;
  delete ctx.checklist.function;
  delete ctx.checklist.failure;
  delete ctx._editing;
}

/**
 * Toast Grid를 생성한다.
 * 이미 생성되어 있는 경우에는, 기존 Grid를 destroy 한 뒤 새로 생성한다.
 * @param {*} datas - ChecklistRow[] 를 할당한다.
 * @param {*} tableMode - 1~3 / 1-이미지 뷰, 2-테이블 뷰(Deprecated), 3-트리 뷰
 * @returns Grid
 */
async function _createOpenGridWithData(datas, tableMode) {
  // DOM이 fullyLoad 되지 않을 경우 대비하여 hang 추가
  let times = 0;
  while (!document.getElementById('openGrid') || times > 30) {
    await lgepCommonUtils.delay(100);
    times++;
  }
  if (times > 30) {
    throw new Error(i18n.chkRowNoGridId);
  }
  //Grid가 이미 생성된 경우, 기존 Grid를 Destory하고 새로 div를 생성한다.
  if (ctx.checklist.grid) {
    ctx.checklist.grid.destroy();
    let element = document.getElementsByClassName('aw-layout-summaryContent')[0];
    let div = document.createElement('div');
    div.id = 'openGrid';
    element.appendChild(div);
  }
  //Toast Grid 옵션을 할당한다.
  let options = {
    el: document.getElementById('openGrid'),
    scrollX: false,
    scrollY: false,
    data: datas ? datas : [{}],
    bodyHeight: document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 150,
    width: document.getElementsByName('L2_ChecklistMain')[0].offsetWidth - 30,
    rowHeight: 'auto',
    columns: checklistRowColumns,
    columnOptions: {
      resizable: true,
    },
  };
  //테이블 모드에 따라서, icon 컬럼을 넣거나 넣지 않는다.
  if (tableMode == '3') {
    options.treeColumnOptions = {
      name: 'icon',
      useCascadingCheckbox: true,
    };
    options.columnOptions = {
      resizable: true,
    };
    options.minRowHeight = 100;
  } else {
    delete options.minRowHeight;
  }
  const grid = new Grid(options);
  //Grid 내에 row에 마우스 커서가 Hovering 되는 경우, 푸른 색으로 하이라이트 시켜준다.
  // Grid.applyTheme('custom', {
  //   row: {
  //     hover: {
  //       background: '#e5f6ff',
  //     },
  //   },
  // });
  setTuiGridStyle(ctx);
  // grid를 가지고 있는 div의 크기를 지정해준다.
  let div = document.getElementById('checklist-open-view');
  div.style.height = document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 100 + 'px';

  let headerLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');
  headerLayout.style.width = document.querySelector('#openGrid').offsetWidth + 'px';

  for (const column of document.getElementsByClassName('tui-grid-cell tui-grid-cell-header')) {
    column.addEventListener('mouseover', (e) => {
      let element = e.target;
      let columnName = element.getAttribute('data-column-name');
      for (const popup of document.getElementsByTagName('aw-popup-panel2')) {
        popup.parentElement.removeChild(popup);
      }
      ctx.checklist.currentColumn = getColumnBalloonData(columnName);
      // console.log({ ctx: ctx.checklist.currentColumn });
      if (ctx.checklist.currentColumn == ' ') return;
      popupService.show({
        declView: 'L2_ChecklistMouserOver',
        options: {
          clickOutsideToClose: true,
          placement: 'bottom-start',
          reference: element,
          width: element.offsetWidth > 350 ? element.offsetWidth : 350,
          height: 40,
          hasArrow: false,
        },
      });
    });
    column.addEventListener('mouseout', (e) => {
      let element = e.target;
      let columnName = element.getAttribute('data-column-name');
      for (const popup of document.getElementsByTagName('aw-popup-panel2')) {
        popup.parentElement.removeChild(popup);
      }
      delete ctx.checklist.currentColumn;
    });
  }

  grid.store.contextMenu.createMenuGroups = (ev) => {
    if (!ev) return;
    let rowKey = grid.getIndexOfRow(ev.rowKey);
    let row = grid.getRowAt(rowKey);
    let columnName = ev.columnName;
    return [
      [
        {
          name: 'copyObject',
          label: i18n.copyObject,
          action: () => {
            ctx.checklist.clipboard = [row.getObject()];
            eventBus.publish('checklist.copyObject');
            eventBus.publish('removeMessages');
            show(INFORMATION, 'Teamcenter 클립 보드로 "' + row.getObject().props.object_string.dbValues[0] + '" (이)가 복사되었습니다.');
          },
        },
        {
          name: 'copyText',
          label: i18n.copyText,
          action: () => {
            if (navigator.clipboard !== undefined) {
              let cellValue = lgepSummerNoteUtils.stripTags(grid.getValue(ev.rowKey, ev.columnName));
              navigator.clipboard.writeText(cellValue);
              eventBus.publish('removeMessages');
              show(INFORMATION, 'OS 클립 보드로 해당 내용이 복사되었습니다.');
            }
          },
        },
      ],
    ];
  };
  grid.store.contextMenu.createMenuGroups();

  //Grid를 클릭하는 경우, 기존 selectedRow를 지운다. 첫번째로 동작한다.
  grid.on('mousedown', function () {
    delete ctx.checklist.selectedRow;
  });
  //Grid를 클릭하는 경우, 선택 이벤트 함수를 호출한다. mousedown보다 나중에 동작한다.
  grid.on('click', _gridSelectionChangedEvent);

  //윈도우의 사이즈가 변경되었을 때(확대/축소 및 윈도우 창 크기 변경)
  $(window).on('resize', function () {
    // ctx.checklist.grid.setBodyHeight(document.getElementsByName("L2_ChecklistMain")[0].offsetHeight - 150);
    // ctx.checklist.grid.setWidth(document.getElementsByName("L2_ChecklistMain")[0].offsetWidth - 30);
    // ctx.checklist.grid.refreshLayout();

    let div = document.getElementById('checklist-open-view');
    if (div) {
      div.style.height = document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 100 + 'px';

      let headerLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');
      headerLayout.style.width = document.querySelector('#openGrid').offsetWidth + 'px';
    }
  });
  //Grid 내의 Row를 선택하는 경우, 하이라이트를 위해 동작한다.
  grid.on('focusChange', (ev) => {
    // 토스트그리드 클릭시 이벤트 추가
    // let row = grid.getRowAt(ev.rowKey);
    // eventBus.publish('toastGrid.selectionChangeEvent');
    // for (const row of grid.getData()) {
    //   grid.removeRowClassName(row.rowKey, 'checklist-selected');
    // }
    // if (row.type == 'L2_FailureRevision') grid.addRowClassName(row.rowKey, 'checklist-selected');
  });

  //Context 내에 grid 로 openGrid를 할당한다.
  ctx.checklist.grid = grid;
  if (tableMode != '3') {
    grid.hideColumn('icon');
  }

  return grid;
}

/**
 * openGrid를 리로드한다.
 * Toast Grid를 destroy한 후, 데이터를 불러와 새로 그리도록 한다.
 * @returns
 */
export function loadAndRefreshOpenGrid() {
  delete ctx.checklist.function;
  delete ctx.checklist.failure;
  delete ctx.checklist.structure;
  delete ctx.checklist.interaction_structure_info;

  return openAwcBomWithInContext();
}

/**
 * 테이블이 클릭 되었을 때, CELL이 선택되어 있다면,
 * Context 내의 SelectedRow에 해당 CELL의 ROW를 할당한다.
 * 그리고, 회의록 서비스의 panelReload를 호출한다.
 *
 * @param {*} ev - Toast Grid 이벤트 매개변수
 * @returns
 */
function _gridSelectionChangedEvent(ev) {
  try {
    let grid = ev.instance;
    let rowKey = grid.getIndexOfRow(ev.rowKey);
    if (rowKey == -1) return;
    let selectionRow = grid.getRowAt(rowKey);

    ctx.checklist.selectedRow = selectionRow;

    //Grid 내의 Row를 선택하는 경우, 하이라이트를 위해 동작한다.
    if (ctx._editing) {
      return;
    }

    // 토스트그리드 클릭시 이벤트 추가
    eventBus.publish('toastGrid.selectionChangeEvent');
    grid.setSelectionRange({
      start: [rowKey, 0],
      end: [rowKey, grid.getColumns().length],
    });

    // minutesService.panelReload();
  } catch (error) {
    // show(ERROR, "GRID CELL 선택 시의 이벤트에 문제가 있습니다." + "\n" + error.message);
  }
}
/**
 *  Toast Grid의 호출이 완료된 뒤, 실행되는 함수.
 *  Interaction Matrix 기능 호출 및 Sod와 AP 값을 매핑하는 함수를 호출한다.
 */
function _GridLoadedCompleteEvent() {
  // Toast Grid 호출이 완료된 후 확대/축소를 위해 row의 width를 계산하여 grid에 적용한다.
  let getTablewidth = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-table > tbody > tr > th');
  let width = 0;
  for (let th of getTablewidth) {
    width += th.offsetWidth;
  }
  ctx.checklist.grid.setWidth(width + 25);

  getInteractionStructureInfo(); // Interaction 기능 위함
  sodApMappingProcess();
  sodApMappingProcess('new');
}

/**
 * SOD와 AP 값을 매핑시켜준다.
 * Toast Grid 내의 Raw Data를 읽어와, 템플릿 SOD인지, 신규 SOD 값인지를 판별한 뒤
 * PostgreSQL과 연동된 Restful Service를 호출하여 값을 읽고 AP 내용을 덮어쓴다.
 * @param {*} head
 */
export function sodApMappingProcess(head = 'ref') {
  let arrays = [];
  let rawDatas = [];
  for (const rawData of ctx.checklist.grid.store.data.rawData) {
    let array = [rawData[head + 'Severity'], rawData[head + 'Occurence'], rawData[head + 'Detection']];
    if (array.includes('') || array.includes(' ') || array.includes('0')) {
      continue;
    }
    arrays.push(array);
    rawDatas.push(rawData);
  }
  getActionPriorityForList2(arrays).then((apArray) => {
    for (let i = 0; i < apArray.length; i++) {
      rawDatas[i][(head == 'ref' ? '' : head) + 'AP'] = apArray[i];
    }
  });
}

/**
 * 체크리스트를 프리즈(자가 결재)한다.
 * 현재 'TCM Release Process'를 사용하도록 되어있지만,
 * 향후 적절한 Workflow Template으로 변경해야한다.
 * 참고로, Context 내에 isFreezed 라는 값이 true로 할당되는 것을 통해서 개정 커맨드 출현 및 프리즈 커맨드 숨김 처리를 한다.
 *
 * @param {*} data
 * @param {*} ctx
 */
export function openChecklistFreeze(data, ctx) {
  show(
    INFORMATION,
    i18n.chkRowFreezeCheck,
    ['YES', 'NO'],
    [
      function () {
        lgepObjectUtils
          .createInstance(ctx.checklist.target, 'L2_Checklist_Freeze')
          .then(() => {
            ctx.checklist.target.isFreezed = true;
            eventBus.publish('removeMessages');
            show(INFORMATION, i18n.chkRowFreezeComplete);
          })
          .catch((e) => {
            show(ERROR, i18n.chkRowFreezeFailed + e.code + '\n' + e.message);
          });
      },
      function () {},
    ],
  );
}

export function openChecklistFreezeCancel(data, ctx) {
  show(
    INFORMATION,
    i18n.chkRowUnFreezeCheck,
    ['YES', 'NO'],
    [
      function () {
        lgepObjectUtils
          .createInstance(ctx.checklist.target, 'L2_Checklist_Freeze_Cancel')
          .then(() => {
            delete ctx.checklist.target.isFreezed;
            eventBus.publish('removeMessages');
            show(INFORMATION, i18n.chkRowUnFreezeComplete);
          })
          .catch((e) => {
            show(ERROR, i18n.chkRowUnFreezeFailed + e.code + '\n' + e.message);
          });
      },
      function () {},
    ],
  );
}

/**
 * 체크리스트를 개정한다.
 * 현재, 리비전 ID의 Ascii 코드를 불러와 다음 리비전 ID를 가져오는 로직으로 되어있어, 해당 내용은 수정이 필요할 수 있다.
 * 1. 개정
 * 2. Toast Grid 다시 불러오기
 * 3. Dataset의 내용을 전부 Copy & Paste
 * 4. Top Checklist에 IMAN_Reference로 Copy된 Dataset을 할당
 * 5. 고장에 해당하는 Awb0DesignElement들의 l2_reference_dataset에 해당 Dataset들을 할당
 * 6. 이전 페이지로 돌아가고, Toast Grid를 다시 불러오기
 * @param {*} data
 * @param {*} ctx
 * @returns
 */
export function openChecklistBomRevise(data, ctx) {
  //1. 개정
  return lgepObjectUtils
    .revise2(
      ctx.checklist.target,
      String.fromCharCode(ctx.checklist.target.props.item_revision_id.dbValues[0].charCodeAt(0) + 1),
      null,
      null,
      lgepObjectUtils.createPolicy(checklistProperties, 'L2_StructureRevision'),
    )
    .then((response) => {
      //2. Toast Grid 다시 불러오기
      ctx.checklist.target = response;
      return loadAndRefreshOpenGrid()
        .then(async () => {
          //3. 이전 리비전의 Dataset의 내용을 전부 Copy & Paste 그 뒤 신규 Top Checklist에 IMAN_Reference로 Copy된 Dataset을 할당
          lgepLoadingUtils.openWindow();
          //Map을 통해서 각각의 bomLine의 uid에 해당하는 Text Dataset의 uid 정보를 저장해둔다.
          let propertyMap = new Map();
          for (const failure of ctx.checklist.failure) {
            try {
              let bomLine = failure.getObject();
              let rawDatas = ctx.checklist.grid.store.data.rawData.filter((e) => e.id == bomLine.uid);
              let properties = {};
              properties.function = rawDatas[0].function;
              properties.requirement = rawDatas[0].requirement;
              properties.failureMode = rawDatas[0].failureMode;
              properties.failureEffect = rawDatas[0].failureEffect;
              properties.failureDetail = rawDatas[0].failureDetail;
              properties.prevention = rawDatas[0].prevention;
              properties.referenceData = rawDatas[0].referenceData;
              properties.detectivity = rawDatas[0].detectivity;
              properties.classification = rawDatas[0].classification;
              properties.refResult = rawDatas[0].refResult;
              properties.refRecommend = rawDatas[0].refRecommend;
              properties.refRecommendResult = rawDatas[0].refRecommendResult;
              let text = await lgepSummerNoteUtils.stringToDataset(bomLine.props.awb0ArchetypeId.dbValues[0], JSON.stringify(properties));
              propertyMap.set(bomLine.uid, text.uid);
              if (!ctx.checklist.target.props.IMAN_reference.dbValues.includes(text.uid))
                await lgepObjectUtils.createRelation('IMAN_reference', ctx.checklist.target, text);
            } catch (e) {
              //console.error(e);
            }
          }
          //5. 저장해둔 Map을 통해 고장에 해당하는 Awb0DesignElement들의 l2_reference_dataset에 해당 Dataset들을 할당
          if (propertyMap.size > 0) {
            let inputs = [];
            for (const key of propertyMap.keys()) {
              let input = {
                obj: {
                  uid: key,
                  type: lgepObjectUtils.getObject(key).type,
                },
                viewModelProperties: [
                  {
                    propertyName: 'l2_reference_dataset',
                    dbValues: [propertyMap.get(key)],
                    uiValues: [propertyMap.get(key)],
                    intermediateObjectUids: [],
                    srcObjLsd: lgepBomUtils.dateTo_GMTString(new Date()),
                    // srcObjLsd: "2022-10-27T16:30:30+09:00",
                    isModifiable: true,
                  },
                ],
                isPessimisticLock: false,
                workflowData: {},
              };
              inputs.push(input);
            }
            const saveViewModelEditAndSubmitWorkflow2Param = {
              inputs: inputs,
            };
            return soaService.post('Internal-AWS2-2018-05-DataManagement', 'saveViewModelEditAndSubmitWorkflow2', saveViewModelEditAndSubmitWorkflow2Param);
          } else {
            return;
          }
        })
        .then(() => {
          //6. 이전 페이지로 돌아가고, Toast Grid를 다시 불러오기
          show(INFORMATION, i18n.chkRowReviseComplete);
          backToSelectionPage();
          loadAndRefreshGrid(ctx.checklist.list);
        });
    })
    .catch((e) => {
      show(ERROR, i18n.chkRowReviseFailed + e.code + '\n' + e.message);
    })
    .finally(() => {
      lgepLoadingUtils.closeWindow();
    });
}

/**
 * 테이블 모드 변경시 사용되는 aw-listbox? aw-widget의 값이 변경될 때, 해당 함수가 호출된다.
 * Context에 tableMode 값을 할당하고, 테이블을 Reload한다.
 *
 * @param {*} currentValue
 */
export function tableModeChanges(currentValue) {
  eventBus.publish('awsidenav.openClose', {}); // 영향성 체크 패널 열려있는 경우 close

  ctx.checklist.tableMode = currentValue;
  delete ctx.checklist.selectedRow;

  setSublocationTitle()
    .then((targetObject) => {
      ctx.checklist.target = targetObject;
      return loadAndRefreshOpenGrid();
    })
    .catch((error) => {
      show(ERROR, i18n.chkRowLoadFailed + '\n' + error.message);
    });
}

/**
 * 체크리스트 모든 라인 보기를 활성화한다.
 * 그리고 테이블을 Reload 한다.
 */
export function openChecklistAllLineView() {
  ctx.checklist.isAllSelected = true;
  fixedOff('data', ctx);
  loadAndRefreshOpenGrid();
}

/**
 * 체크리스트 선택 라인 보기를 활성화한다.
 * 그리고 테이블을 Reload 한다.
 */
export function openChecklistExcludeLineView() {
  delete ctx.checklist.isAllSelected;
  fixedOff('data', ctx);
  loadAndRefreshOpenGrid();
}

/**
 * 1. AWC BOM을 펼친다.
 * 2. 해당 BOM을 InContext 모드로 변경한다.
 * 3. 체크리스트에서 필요한 변수들을 Context 내에 할당한다.
 * 4. 테이블을 다시 불러온다.
 * @returns
 */
export function openAwcBomWithInContext() {
  lgepLoadingUtils.openWindow();
  let bomTreeMap = new Map();
  let allObjects = [];
  let allChecklistRows = {};
  let parentOccurrence = null;
  let targetRevision = ctx.checklist.target;
  //1. 첫번째 getOccurrence3에서는 topLine의 productContext등을 불러오기 위해서 사용한다
  return lgepBomUtils
    .getOccurrences3(targetRevision)
    .then((response) => {
      let rootProductContext = response.rootProductContext;
      parentOccurrence = response.parentOccurrence;
      ctx.checklist.topLine = lgepObjectUtils.getObject(parentOccurrence.occurrenceId);
      return lgepObjectUtils
        .loadObjects(
          [parentOccurrence.occurrenceId],
          lgepObjectUtils.createPolicy(
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
            ],
            'Awb0DesignElement',
          ),
        )
        .then(() => {
          //2. 두번째 getOccurrence3 에서는 이제 전체 AWC BOM을 펼친다.
          return lgepBomUtils.getOccurrences3(targetRevision, rootProductContext, ctx.checklist.topLine);
        });
    })
    .then((occurrencesResp3) => {
      parentOccurrence = occurrencesResp3.parentOccurrence;
      // getOccurrence3의 response들을 분석하여, 부모-자식 관계를 Map에 할당한다.
      let infos = occurrencesResp3.parentChildrenInfos;
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
          lgepObjectUtils.createPolicy(
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
            ],
            'Awb0DesignElement',
          ),
        );
      });
    })
    .then((getTableViewModelPropsResp) => {
      //4. 부모-자식 관계가 담긴 Map으부터 내용을 읽어와 ChecklistRow를 알맞게 생성한다.
      ctx.checklist.topLine = lgepObjectUtils.getObject(parentOccurrence.occurrenceId);
      //topLine은 생성되지 않는 경우가 있기 때문에 예외적으로 별도로 생성한다.
      allChecklistRows[parentOccurrence.occurrenceId] = new ChecklistRow(lgepObjectUtils.getObject(parentOccurrence.occurrenceId));
      allChecklistRows[parentOccurrence.occurrenceId].level = 0;
      let responseModelObjects = getTableViewModelPropsResp.ServiceData.modelObjects;
      let modelObjects = Object.values(responseModelObjects);
      let topLine = lgepObjectUtils.getObject(parentOccurrence.occurrenceId);
      topLine.props.l2_is_selected = {};
      topLine.props.l2_is_selected.dbValues = [];
      topLine.props.l2_is_selected.dbValues.push('Y');
      modelObjects = [topLine, ...modelObjects];

      ctx.checklist.structure = [];
      ctx.checklist.function = [];
      ctx.checklist.failure = [];

      //modelObject에 부모-자식 관계를 할당한다.
      for (const modelObject of modelObjects) {
        if (modelObject.type == 'Awb0DesignElement') {
          if (!ctx.checklist.isAllSelected && modelObject.props.l2_is_selected.dbValues[0] != 'Y') {
            continue;
          }
          allObjects.push(modelObject);
          let checklistRow = new ChecklistRow(modelObject);
          allChecklistRows[modelObject.uid] = checklistRow;
          let children = bomTreeMap.get(modelObject.uid);
          if (children) {
            modelObject._children = [];
            for (const childUid of children) {
              let child = responseModelObjects[childUid];
              if (child) {
                // #183 구조 편집 기능에서 전체 보기 시 선택하지 않은 다른 모듈 숨기기
                if (child.props.l2_is_selected.dbValues[0] == '') {
                  continue;
                }
                if (modelObject.uid == ctx.checklist.topLine.uid && child.props.l2_is_selected.dbValues[0] == 'N') {
                  continue;
                }
                modelObject._children.push(child);
                child.parent = modelObject;
              }
            }
          }
        }
      }

      //ChecklistRow에도 부모-자식 관계를 할당한다.
      for (const checklistRow of Object.values(allChecklistRows)) {
        if (checklistRow.getObject()._children) {
          checklistRow._children = [];
          for (const child of checklistRow.getObject()._children) {
            if (allChecklistRows[child.uid]) {
              checklistRow._children.push(allChecklistRows[child.uid]);
            }
          }
        }
        if (checklistRow.getObject().parent) {
          if (allChecklistRows[checklistRow.getObject().parent.uid]) {
            checklistRow.parent = allChecklistRows[checklistRow.getObject().parent.uid];
          }
        }
      }
      allChecklistRows[parentOccurrence.occurrenceId].level = 0;
      _recursiveLeveling(allChecklistRows[parentOccurrence.occurrenceId]);
      for (const checklistRow of Object.values(allChecklistRows)) {
        if (checklistRow.type == 'L2_StructureRevision') {
          if (checklistRow.level == 1) {
            checklistRow.upperAssy = checklistRow.name;
          } else if (checklistRow.level == 2) {
            checklistRow.upperAssy = checklistRow.getParent().name;
            checklistRow.lowerAssy = checklistRow.name;
          } else if (checklistRow.level == 3) {
            checklistRow.upperAssy = checklistRow.getParent().getParent().name;
            checklistRow.lowerAssy = checklistRow.getParent().name;
            checklistRow.single = checklistRow.name;
          }
        }
      }
      //ChecklistRow에서 누락된 필수 값들을 추가로 할당한다.
      let promiseArray = [];

      for (const checklistRow of Object.values(allChecklistRows)) {
        if (checklistRow.type == 'L2_FunctionRevision') {
          ctx.checklist.function.push(checklistRow);
          checklistRow.upperAssy = checklistRow.getParent().upperAssy;
          checklistRow.lowerAssy = checklistRow.getParent().lowerAssy;
          checklistRow.single = checklistRow.getParent().single;
          checklistRow.function = checklistRow.getObject().props.l2_function.dbValues[0];
          checklistRow.requirement = checklistRow.getObject().props.l2_requirement.dbValues[0];
        } else if (checklistRow.type == 'L2_FailureRevision') {
          ctx.checklist.failure.push(checklistRow);
          checklistRow.upperAssy = checklistRow.getParent().getParent().upperAssy;
          checklistRow.lowerAssy = checklistRow.getParent().getParent().lowerAssy;
          checklistRow.single = checklistRow.getParent().getParent().single;
          checklistRow.function = checklistRow.getParent().getObject().props.l2_function.dbValues[0];
          checklistRow.requirement = checklistRow.getParent().getObject().props.l2_requirement.dbValues[0];
          if (
            checklistRow.getObject().props.l2_reference_dataset &&
            checklistRow.getObject().props.l2_reference_dataset.dbValues &&
            checklistRow.getObject().props.l2_reference_dataset.dbValues.length > 0
          ) {
            promiseArray.push(
              readPropertiesFromTextFile(checklistRow.getObject().props.l2_reference_dataset.dbValues[0]).then((props) => {
                for (let attribute of Object.keys(props)) {
                  let rawDatas = ctx.checklist.grid.store.data.rawData.filter((e) => e.id == checklistRow.getObject().uid);
                  if (rawDatas && rawDatas.length > 0) {
                    if (props[attribute] && props[attribute].length > 0) {
                      rawDatas[0][attribute] = props[attribute];
                    }
                  }
                }
              }),
            );
          }
        }
      }
      Promise.all(promiseArray).then(() => {
        tableResize();
        autoResize(null, ctx);
      });
      ctx.checklist.allChecklistRows = allChecklistRows;
      return allChecklistRows;
    })
    .then((allChecklistRows) => {
      //입력된 값들을 토대로 테이블을 Reload한다.
      let tableMode = ctx.checklist.tableMode;
      //ChecklistRow에 균일한 순서를 할당하기 위해, index 값을 순차적으로 넣는다.
      let topLine = allChecklistRows[ctx.checklist.topLine.uid];
      _indexingIndex = 0;
      topLine.index = _indexingIndex;
      _indexingIndex++;
      _recursiveIndexing(topLine);

      //위에서 진행했던 결과물을 Toast Grid로 출력한다.
      if (ctx.checklist.tableMode == '3') {
        return _createOpenGridWithData([topLine], tableMode).then(() => {
          _GridLoadedCompleteEvent();
        });
      } else {
        return _createOpenGridWithData(
          ctx.checklist.failure.sort((a, b) => {
            if (a.index > b.index) {
              return 1;
            }
            if (a.index < b.index) {
              return -1;
            }
            return 0;
          }),
          tableMode,
        ).then(() => {
          _GridLoadedCompleteEvent();
        });
      }
    })
    .catch((e) => {
      show(ERROR, i18n.chkRowLoadFailed + e.message);
    })
    .finally(() => {
      lgepLoadingUtils.closeWindow();
      eventBus.publish('check.Selected.List');
    });
}

let _indexingIndex = 0;
/**
 * Checklist Row에 Index 값을 재귀적으로 할당한다.
 * 전역으로 설정된 인자인 _indexingIndex의 값을 사용한다.
 * @param {*} target
 */
function _recursiveIndexing(target) {
  if (target._children && target._children.length > 0) {
    for (const child of target._children) {
      child.index = _indexingIndex;
      _indexingIndex++;
    }
    for (const child of target._children) {
      _recursiveIndexing(child);
    }
  }
}

function _recursiveLeveling(target) {
  if (target._children && target._children.length > 0) {
    for (const child of target._children) {
      child.level = target.level + 1;
      _recursiveLeveling(child);
    }
  }
}

/**
 * Toast Grid의 데이터가 모두 로드되면 헤더 고정 및 height를 계산하여 grid에 적용한다.
 */
export const tableResize = async () => {
  ctx.checklist.grid.setBodyHeight(50000);
  await lgepCommonUtils.delay(2000);

  let headerLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');
  headerLayout.style.width = document.querySelector('#openGrid').offsetWidth + 'px';

  let getTable = document.querySelectorAll('#checklist-open-view .tui-grid-rside-area .tui-grid-table > tbody > tr');
  let height = 0;
  for (let tr of getTable) {
    let str = tr.style.height;
    const regex = /[^0-9]/g;
    const result = str.replace(regex, '');

    height += parseInt(result);
  }
  ctx.checklist.grid.setBodyHeight(height + 40);
  return;
};

export default exports = {
  ChecklistRow,
  initialize,
  unMount,
  openChecklistFreeze,
  openChecklistFreezeCancel,
  openChecklistBomRevise,
  loadAndRefreshOpenGrid,
  tableModeChanges,
  sodApMappingProcess,
  openChecklistAllLineView,
  openChecklistExcludeLineView,
  tableResize,
};

app.factory('lgepChecklistOpenService', () => exports);
