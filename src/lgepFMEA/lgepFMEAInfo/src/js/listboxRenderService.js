/**
 *  2022.08.21
 *  테이블 내 리스트박스 렌더링 이벤트를 위함.
 */

//frameworks
import _ from 'lodash';
import $ from 'jquery';

//Teamcenter OOTB
import appCtxService from 'js/appCtxService';
import popupService from 'js/popupService';

//Customized Sources
import { addChangeRow } from 'js/dfmeaMasterRowEditService';

//Constants
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

//CSS
import 'css/listboxRender.css';

export function renderSeverityListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_SEVERITY);
}

export function renderOccurenceListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_OCCURENCE);
}

export function renderDetectionListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_DETECTION);
}

export function renderNewSevListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_RESULT_SEVERITY);
}

export function renderNewOccListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_RESULT_OCCURENCE);
}

export function renderNewDetListbox(vmo, containerElem) {
  _renderListbox(vmo, containerElem, prop.BOMLINE_RESULT_DETECTION);
}

export function selectTableRow(selectionModel, ctx) {
  //debugging
  //setProperty of targetVMO
  let value = selectionModel.props.l2_grade.dbValues[0];
  const propName = appCtxService.ctx.dfmeaListboxSelected;
  let targetElem = document.getElementById(
    appCtxService.ctx.dfmeaListboxSelected
  );
  targetElem.innerHTML = value;

  const selectRow = ctx[constants.ROW_SELECT];
  const resultPropName = _getRealPropName(propName);
  const changeRow = {
    [resultPropName]: { value },
    row: selectRow,
  };
  addChangeRow(changeRow, resultPropName);

  popupService.hide();
}

const _getRealPropName = (propName) => {
  if (propName.includes(prop.BOMLINE_SEVERITY)) {
    return prop.BOMLINE_SEVERITY;
  } else if (propName.includes(prop.BOMLINE_OCCURENCE)) {
    return prop.BOMLINE_OCCURENCE;
  } else if (propName.includes(prop.BOMLINE_DETECTION)) {
    return prop.BOMLINE_DETECTION;
  } else if (propName.includes(prop.BOMLINE_RESULT_SEVERITY)) {
    return prop.BOMLINE_RESULT_SEVERITY;
  } else if (propName.includes(prop.BOMLINE_RESULT_OCCURENCE)) {
    return prop.BOMLINE_RESULT_OCCURENCE;
  } else if (propName.includes(prop.BOMLINE_RESULT_DETECTION)) {
    return prop.BOMLINE_RESULT_DETECTION;
  }
};

export function unMount() {
  document
    .getElementById(appCtxService.ctx.dfmeaListboxSelected)
    .classList.remove('dfmea-listbox-clicked');
  appCtxService.unRegisterCtx('dfmeaListboxOpening');
  appCtxService.unRegisterCtx('dfmeaListboxSelected');
}

let _renderListbox = function (vmo, containerElem, targetName) {
  //0. Setting Height of dfmeaTable (Because of Balloon Sizes)
  // $("aw-splm-table[gridid='dfmeaTable']")[0].style = "height: 100%";
  // $("div[id='dfmeaTable']")[0].style = "height: 100%";

  //1. Setting Styles in Table Container (bigger size)
  containerElem.setAttribute(
    'style',
    'height: 100%; width: 90%; padding-left: 0px'
  );

  //2. Create Listbox Element
  //: Create Button and makes it looks like listbox
  let button = _createElement(
    'button',
    targetName + '_' + vmo.uid,
    ['dfmea-listbox'],
    '',
    vmo.props[targetName].dbValue
  );
  _createIcon(containerElem);
  containerElem.appendChild(button);

  //3. button Click Event
  button.addEventListener('click', function () {
    if (
      appCtxService.getCtx('dfmeaListboxOpening') ||
      !appCtxService.getCtx('fmea_editing')
    ) {
      popupService.hide();
      return;
    }

    appCtxService.registerCtx(
      'dfmeaListboxSelected',
      targetName + '_' + vmo.uid
    );
    // debugging
    popupService.show({
      declView: 'sodBalloon',
      options: {
        reference: button,
        placement: 'bottom-start',
        width: 680,
        height: 200,
        hasArrow: false,
        whenParentScrolls: 'close',
      },
    });
    button.classList.add('dfmea-listbox-clicked');
    appCtxService.registerCtx('dfmeaListboxOpening', true);
  });
};

/**
 * Makes an dropdown icon for target Element.
 *
 * @param {HTMLElement} targetElem
 */
let _createIcon = function (targetElem) {
  let iconElement = document.createElement('div');
  let iconString = `<aw-property-image ng-if="!prop.isSearchPrefilter" name="miscDownArrow_uxRefresh" class="aw-widget-icon ng-scope"><svg viewBox="0 0 12 12" style="enable-background:new 0 0 12 12;"><polygon class="aw-theme-iconOutline" fill="#464646" points="2,4 6,8 10,4 "></polygon></svg></aw-property-image>`;
  iconElement.innerHTML = iconString;
  targetElem.appendChild(iconElement.children[0]);
};

/**
 *
 * @param {*} tagName
 * @param {*} id
 * @param {*} classList
 * @param {*} style
 * @param {*} value
 * @returns {HTMLElement}
 */
let _createElement = function (tagName, id, classList, style, value) {
  let element = document.createElement(tagName);
  element.id = id;
  for (const elementClass of classList) {
    element.classList.add(elementClass);
  }
  element.setAttribute('style', style);
  element.innerHTML = value ? value : '';
  return element;
};

export default {
  renderSeverityListbox,
  renderDetectionListbox,
  renderOccurenceListbox,
  renderNewSevListbox,
  renderNewOccListbox,
  renderNewDetListbox,
  selectTableRow,
  unMount,
};
