import app from 'app';

import eventBus from 'js/eventBus';
import browserUtils from 'js/browserUtils';
import vmoService from 'js/viewModelObjectService';
import appCtxService from 'js/appCtxService';
import popupService from 'js/popupService';

import { executeSavedQuery } from 'js/utils/lgepQueryUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import { ERROR, INFORMATION, show } from 'js/utils/lgepMessagingUtils';
import { resetSublocationTitle, checklistProperties, checklistColumns } from 'js/utils/checklistUtils';
import { openFilterPanel, refreshOriginTable } from 'js/L2_ChecklistFilterService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import L2_ChecklistSaveAsService from 'js/L2_ChecklistSaveAsService';

import $ from 'jquery';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';

let exports;

let MSG = 'L2_ChkMainMessages';
let i18n = {
  chkMakeFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkMakeFailed'),
  chkLoadFailed: lgepLocalizationUtils.getLocalizedText(MSG, 'chkLoadFailed'),
  chkSelectPlease: lgepLocalizationUtils.getLocalizedText(MSG, 'chkSelectPlease'),
  chkNameChange: lgepLocalizationUtils.getLocalizedText(MSG, 'chkNameChange'),
  chkNoObjsInYourGroup: (group) => {
    return lgepLocalizationUtils.getLocalizedText(MSG, 'chkNoObjsInYourGroup', group);
  },
  chkNoObjsInDDGMS: lgepLocalizationUtils.getLocalizedText(MSG, 'chkNoObjsInDDGMS'),
  saveAsChecklist: lgepLocalizationUtils.getLocalizedText(MSG, 'saveAsChecklist'),
  modifyChecklist: lgepLocalizationUtils.getLocalizedText(MSG, 'modifyChecklist'),
  copyObject: lgepLocalizationUtils.getLocalizedText(MSG, 'copyObject'),
  copyText: lgepLocalizationUtils.getLocalizedText(MSG, 'copyText'),
};

/**
 *  체크리스트 클래스
 */
export class Checklist {
  /**
   *
   * @param {viewModelObject} viewModelObject
   */
  constructor(viewModelObject, item) {
    try {
      this.id = viewModelObject.uid;
      this.name = viewModelObject.uid;
      this.revisionId = viewModelObject.type.includes('Revision') ? viewModelObject.props.item_revision_id.dbValues[0] : '';

      this.projectName = _getValueByRevProp(viewModelObject, 'l2_current_project');
      this.productType = viewModelObject.type === 'L2_Structure' ? viewModelObject.props.l2_product_type.dbValues[0] : '';
      this.productClass = viewModelObject.type === 'L2_Structure' ? viewModelObject.props.l2_product_class.dbValues[0] : '';
      this.productName = _getValueByRevProp(viewModelObject, 'l2_product_name');
      viewModelObject.type === 'L2_Structure' ? viewModelObject.props.l2_product_class.dbValues[0] : '';
      this.productId = viewModelObject.type === 'L2_Structure' ? viewModelObject.props.l2_product_id.dbValues[0] : '';
      this.moduleName = viewModelObject.type === 'L2_Structure' ? viewModelObject.props.l2_module_name.dbValues[0] : '';
      this.isReleased = viewModelObject.type.includes('Revision') ? (viewModelObject.props.release_status_list.dbValues.length > 0 ? 'O' : '') : '';

      this.creator = viewModelObject.props.last_mod_user.uiValues[0] ? viewModelObject.props.last_mod_user.uiValues[0] : '';
      this.createDate = viewModelObject.props.last_mod_date.uiValues[0] ? viewModelObject.props.last_mod_date.uiValues[0] : '';
      this.type = viewModelObject.type;
      this.iconUrl = viewModelObject.typeIconURL;
      this.revisions = viewModelObject.type.includes('Revision') ? [] : viewModelObject.props.revision_list.dbValues;
      this._children = viewModelObject.type.includes('Revision') ? undefined : [];
      this._attributes = { expanded: true };
      if (!this.type.includes('Revision') && viewModelObject.props.revision_list.dbValues && viewModelObject.props.revision_list.dbValues.length > 0) {
        this._children = [];
        for (const dbValue of viewModelObject.props.revision_list.dbValues) {
          let child = lgepObjectUtils.getObject(dbValue);
          let childRow = new Checklist(child, this);
          childRow._parent = this;
          childRow.getParent = () => {
            return this;
          };
          this._children.push(childRow);
        }
        this.getRevisionList = function () {
          return this._children;
        };
      }
      if (item) {
        this.getItem = function () {
          return this;
        };
      }
      this.getObject = function () {
        return viewModelObject;
      };
    } catch (error) {
      show(ERROR, i18n.chkMakeFailed + '\n' + error.message);
    }
  }
}

// 리비전 속성 값을 아이템 컬럼 값으로 넣음
function _getValueByRevProp(viewModelObject, propName) {
  if (viewModelObject.type !== 'L2_Structure') {
    return '';
  }
  const revId = viewModelObject.props.revision_list.dbValues[0];
  const rev = lgepObjectUtils.getObject(revId);
  return rev.props[propName].dbValues[0];
}

/**
 * 필터 패널 close의 경우 broweMode를 2에서 0으로, table 변경
 * @param {*} ctx
 */
export function initializeByFilterClose(data, ctx) {
  if (ctx.checklist.browseMode == '2') {
    _treeInitialized = false;
    initialize(data, ctx);
  }
}

/**
 * 페이지 로드 시 발생시키는 스크립트
 * browseMode 를 0 으로 설정한 후, TOAST-GRID 를 로드한다.
 *
 * browseMode는 CTX에 설정하여 0~1 으로 입력되며
 * 0일 경우에는 Checklist 선택 모드
 * 1일 경우에는 Checklist 조회 및 편집 모드로 전환된다.
 *
 * 해당 CONTEXT 값을 통해, HTML의 VISIBLE-WHEN 조건에 따라 화면이 전환됨.
 *
 * @param {*} data
 * @param {*} ctx
 */
export function initialize(data, ctx) {
  if (!ctx.checklist) {
    ctx.checklist = {};
  }
  ctx.checklist.browseMode = '0';
  _initializeGrid();
  let urls = new URL(document.URL).hash;
  if (urls.includes('uid')) {
    ctx.checklist.browseMode = '1';
  }
}

var _treeInitialized = false;

/**
 * TOAST GRID 를 로드한다.
 */
async function _initializeGrid() {
  try {
    // DOM이 여러차례 Load 되는 경우 대비하여 FLAG 추가
    if (_treeInitialized) {
      return;
    }
    _treeInitialized = true;

    // DOM이 fullyLoad 되지 않을 경우 대비하여 hang 추가
    let times = 0;
    while (!document.getElementById('grid') || times > 10) {
      await lgepCommonUtils.delay(50);
      times++;
    }

    //0. GRID 초기 초기 설정 값 할당
    let grid = new Grid({
      el: document.getElementById('grid'),
      data: [{}],
      bodyHeight: document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 120,
      width: document.getElementsByName('L2_ChecklistMain')[0].offsetWidth - 90,
      treeColumnOptions: {
        name: 'name',
        useCascadingCheckbox: true,
      },
      columns: checklistColumns(),
      columnOptions: {
        frozenCount: 1,
        frozenBorderWidth: 2,
        resizable: true,
      },
      rowHeaders: [
        {
          type: 'checkbox',
        },
      ],
    });

    grid.check = function (rowKey) {
      grid.uncheckAll();
      grid.dispatch('check', rowKey);
    };
    grid.on('mouseover', (ev) => {
      if (ev.rowKey) {
        let row = grid.getRowAt(ev.rowKey);
        if (row.type.includes('Revision')) {
          if (!ev.nativeEvent.target.classList.value.includes('checklist-clickable')) ev.nativeEvent.target.classList.add('checklist-clickable');
        }
      }
    });

    appCtxService.ctx.checklist.list = grid;

    grid.store.contextMenu.createMenuGroups = (ev) => {
      if (!ev) return;
      let row = grid.getRowAt(ev.rowKey);
      let columnName = ev.columnName;
      return [
        [
          {
            name: 'copyObject',
            label: i18n.copyObject,
            action: () => {
              appCtxService.ctx.checklist.clipboard = [row.getObject()];
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
          {
            name: 'modifyChecklist',
            label: i18n.modifyChecklist,
            action: () => {
              modifyChecklist(row);
            },
          },
          {
            name: 'saveAsChecklist',
            label: i18n.saveAsChecklist,
            action: () => {
              if (row) {
                if (!row.type.includes('Revision')) {
                  show(INFORMATION, '리비전 중 하나를 선택해주시기 바랍니다.');
                  return;
                } else {
                  appCtxService.ctx.checklist.list.check(row.rowKey);
                }
              }
              L2_ChecklistSaveAsService.openPopup(appCtxService.ctx, document.getElementById('saveAsChecklist'));
            },
          },
        ],
      ];
    };
    grid.store.contextMenu.createMenuGroups();
    //1. Mouse Hover 이벤트 할당
    setTuiGridStyle(appCtxService.ctx);

    //2. TREE 클릭 시 이벤트 할당
    grid.on('click', gridSelectionChangedEvent);
    grid.on('');

    // 창 크기 변경 자동 감지
    $(window).on('resize', function () {
      grid.setBodyHeight(document.getElementsByName('L2_ChecklistMain')[0].offsetHeight - 120);
      grid.setWidth(document.getElementsByName('L2_ChecklistMain')[0].offsetWidth - 30);
      // grid.refreshLayout();
    });

    //5. 초기 데이터 로드
    loadAndRefreshGrid(grid);
  } catch (error) {
    show(ERROR, i18n.chkLoadFailed + '\n' + error.message);
  }
}

export const setTuiGridStyle = async (ctx) => {
  if (ctx.theme == 'ui-lgepDark') {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#444a4e',
        background: '#282d33',
      },
      row: {
        hover: {
          background: 'rgb(56, 66, 77)',
        },
      },
    });
  } else {
    Grid.applyTheme('custom', {
      cell: {
        normal: {
          background: '#fff',
        },
      },
      scrollbar: {
        border: '#eee',
        background: '#fff',
      },
      row: {
        hover: {
          background: '#e5f6ff',
        },
      },
    });
  }
};

/**
 *  뒤로 가기 함수
 *  browseMode 를 0으로 할당함으로써 이전 페이지로 돌아간다.
 */
export async function backToSelectionPage() {
  eventBus.publish('awsidenav.openClose', {}); // 영향성 체크 패널 열려있는 경우 close
  delete appCtxService.ctx.checklist.structure;
  delete appCtxService.ctx.checklist.function;
  delete appCtxService.ctx.checklist.failure;
  delete appCtxService.ctx.checklist.target;
  delete appCtxService.ctx._editing;
  delete appCtxService.ctx.grid;
  delete appCtxService.ctx.tableMode;

  resetSublocationTitle();
  appCtxService.ctx.checklist.browseMode = '0';

  window.location.href = browserUtils.getBaseURL() + '#/checklistMain';
  _treeInitialized = false;
  _initializeGrid();
  refreshOriginTable();

  document.getElementsByName('L2_ChecklistMain')[0].children[0].setAttribute('style', '');
}

/**
 *  체크리스트 이름 편집 UI 를 호출한다.
 */
export function modifyChecklist(row) {
  if (row) {
    if (row._parent) {
      appCtxService.ctx.checklist.list.check(row.getParent().rowKey);
    } else {
      appCtxService.ctx.checklist.list.check(row.rowKey);
    }
  }
  let checked = appCtxService.ctx.checklist.list.getCheckedRows();
  if (checked) {
    let endFlag = true;
    for (const each of checked) {
      if (each.type == 'L2_Structure') {
        endFlag = false;
        break;
      }
    }
    if (endFlag) {
      show(INFORMATION, i18n.chkSelectPlease);
      return;
    }
    popupService.show({
      declView: 'L2_ChecklistModifyName',
      locals: {
        anchor: 'closePopupAnchor',
        caption: i18n.chkNameChange,
        hasCloseButton: true,
      },
      options: {
        clickOutsideToClose: false,
        draggable: true,
        enableResize: true,
        isModal: false,
        width: 600,
        height: 250,
      },
    });
  } else {
    show(INFORMATION, i18n.chkSelectPlease);
  }
}

/**
 * 페이지를 벗어났을 때 전역 변수를 초기화시켜준다.
 * @param {*} data
 * @param {*} ctx
 */
export function unMount(data, ctx) {
  _treeInitialized = false;
  if (ctx.checklist.openPopup) {
    popupService.hide();
  }
}

/**
 * 페이지가 로드되었을 때 체크리스트를 조회한다.
 * 필요한 객체들을 찾아와 테이블 ROW로 만들어준다
 *
 * @param {*} grid
 * @returns
 */
export function loadAndRefreshGrid(grid) {
  return executeSavedQuery(
    'StructureSearch',
    ['L2_is_checklist'],
    ['Y'],
    lgepObjectUtils.createPolicies(checklistProperties, ['L2_Structure', 'L2_StructureRevision']),
  )
    .then((res) => {
      let currentGroup = appCtxService.ctx.userSession.props.group_name.dbValues[0];
      let treeDatas = [];
      let objectUids = [];
      if (res && currentGroup != 'H&A') {
        res = res.filter((mo) => mo.props.owning_group.uiValues[0] == currentGroup);
        if (res.length == 0) {
          show(INFORMATION, i18n.chkNoObjsInYourGroup(currentGroup));
          return;
        }
      } else {
        if (!res || res.length == 0) {
          show(INFORMATION, i18n.chkNoObjsInDDGMS);
          return;
        }
      }
      let uids = res.map((mo) => mo.uid);
      return lgepObjectUtils.loadObjects(uids, lgepObjectUtils.createPolicies(checklistProperties, ['L2_Structure', 'L2_StructureRevision'])).then(() => {
        let vmoArray = [];
        for (const sheet of res) {
          let vmo = vmoService.constructViewModelObjectFromModelObject(sheet);
          vmoArray.push(vmo);
          for (const dbValue of vmo.props.revision_list.dbValues) {
            objectUids.push({ uid: dbValue, type: 'L2_StructureRevision' });
          }
        }
        return lgepObjectUtils.getProperties(objectUids, checklistProperties).then((loaded) => {
          for (const vmo of vmoArray) {
            treeDatas.push(new Checklist(vmo));
          }
          appCtxService.ctx.checklist.listRows = treeDatas;
          grid.resetData(treeDatas);
          grid.refreshLayout();
        });
      });
    })
    .catch((error) => {
      show(ERROR, i18n.chkLoadFailed + '\n' + error.message);
    });
}

/**
 * 테이블 CELL 이 선택되었을 때, 테이블 ROW가 선택되도록 한다.
 * 또한 URL을 변경하거나 페이지 이동, 트리 펼침 등을 동작시킨다.
 * @param {*} ev
 * @returns
 */
export function gridSelectionChangedEvent(ev) {
  try {
    if (appCtxService.ctx.checklist.openPopup) {
      return;
    }
    eventBus.publish('awsidenav.openClose', {}); // 필터 패널 열려있는 경우 close
    let grid = ev.instance;
    if (ev.columnName == '_checked') {
      grid.check(ev.rowKey);
      return;
    }
    let rowKey = grid.getIndexOfRow(ev.rowKey);
    if (grid.getSelectionRange()) {
      rowKey = grid.getSelectionRange().end[0];
    }
    if (rowKey == -1) return;
    let selectionRow = grid.getRowAt(rowKey);
    let selectionUid = selectionRow.id;
    let selectionType = selectionRow.type;

    //console.log(selectionRow);
    //console.log({ev});

    // 리비전인 경우에는 URL에 UID를 매핑하고, 이외에는 UID를 제거한다.
    if (selectionType.includes('Revision')) {
      window.location.href = browserUtils.getBaseURL() + '#/checklistMain?uid=' + selectionUid;
      appCtxService.ctx.checklist.browseMode = '1';
      return;
    } else {
      window.location.href = browserUtils.getBaseURL() + '#/checklistMain';
    }

    // 테이블 ROW 가 선택되었을 때 펼침/접힘을 동작시킨다.
    if (selectionRow._children && selectionRow._children.length > 0 && !selectionRow._attributes.expanded) {
      grid.expand(selectionRow.rowKey);
    } else if (selectionRow._children && selectionRow._children.length > 0 && selectionRow._attributes.expanded) {
      grid.collapse(selectionRow.rowKey);
    }

    // 셀이 선택되었을 때, 해당 ROW가 선택되도록 한다.
    grid.setSelectionRange({
      start: [rowKey, 0],
      end: [rowKey, grid.getColumns().length],
    });
    // grid.focusAt(rowKey, grid.getColumns().length-1, false);
  } catch (error) {
    // show(ERROR, "GRID CELL 선택 시의 이벤트에 문제가 있습니다." + "\n" + error.message);
  }
}

export function filterChecklist() {
  openFilterPanel();
}

export function modifyItemName(data, ctx) {
  try {
    let row = ctx.checklist.list.getCheckedRows()[0];
    let uid = row.name;
    let mo = lgepObjectUtils.getObject(uid);
    data.checklistName.dbValue = mo.props.object_name.dbValues[0];
  } catch (error) {
    show(ERROR, error.message);
  }
}

// 체크리스트 이름 편집 기능 실행
export function confirmItemName(itemName) {
  try {
    let row = appCtxService.ctx.checklist.list.getCheckedRows()[0];
    let uid = row.name;
    let mo = lgepObjectUtils.getObject(uid);
    lgepObjectUtils.setProperty(mo, 'object_name', itemName).then(() => {
      lgepPopupUtils.closePopup();
      loadAndRefreshGrid(appCtxService.ctx.checklist.list);
    });
  } catch (error) {
    show(ERROR, error.message);
  }
}

/**
 * -, + 버튼으로 grid의 크기를 조절하도록 한다.
 * 크기가 변동하기 전까지는 버튼을 disable로 만들어 연속 클릭이 불가능하다.
 * @param {*} value
 * @param {*} ctx
 */
const updateSliderValue = (value, ctx) => {
  let plusBtn = document.querySelector('.sliderBtn .aw-widgets-plusButton');
  let minusBtn = document.querySelector('.sliderBtn .aw-widgets-minusButton');
  plusBtn.disabled = true;
  minusBtn.disabled = true;

  setTimeout(function () {
    let tableLayout = document.querySelector('#openGrid');
    tableLayout.style.zoom = value;

    let headerLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area');

    if (headerLayout) {
      headerLayout.style.width = tableLayout.offsetWidth + 'px';

      var div = document.getElementById('checklist-open-view');
      let headerTableLayout = document.querySelector('#checklist-open-view .tui-grid-rside-area .tui-grid-header-area .tui-grid-table');
      headerTableLayout.style.marginLeft = '-' + div.scrollLeft / value + 'px';
      // appCtxService.registerCtx(constants.FMEA_IS_RESIZE, true);

      plusBtn.disabled = false;
      minusBtn.disabled = false;
    }
  }, 260);
};

/**
 * 확대/축소 슬라이더를 기본값(1배)으로 초기화 한다.
 * @param {*} data
 * @param {*} ctx
 */
const initSliderValue = (data, ctx) => {
  data.zoomSliderProp.dbValue[0].sliderOption.value = 1;
};

export function locationChangeEvent(evt1, evt2, evt3) {
  // console.log(evt1, evt2, evt3);
}

export default exports = {
  initialize,
  unMount,
  modifyChecklist,
  backToSelectionPage,
  filterChecklist,
  loadAndRefreshGrid,
  modifyItemName,
  confirmItemName,
  updateSliderValue,
  initSliderValue,
  locationChangeEvent,
  setTuiGridStyle,
};
app.factory('lgepChecklistMainService', () => exports);
