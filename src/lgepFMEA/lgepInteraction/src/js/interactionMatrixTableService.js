import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';
import 'tui-date-picker/dist/tui-date-picker.css';

import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepQueryUtils from 'js/utils/lgepQueryUtils';

import { getLangIndex } from 'js/utils/fmeaCommonUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

let grid;
let langIndex;

const _interactionHeaderInit = () => {
  const cellHeader = document.querySelector(
    'th[data-column-name="interactionHeader"]'
  );
  cellHeader.innerHTML = `
    Item<br /><strong>(${constants.INTERACTION_CELL_HEADER_SIDE[langIndex]}↓)</strong>
  `;
};

const _makeListItmes = () => {
  const listItmes = constants.INTERACTION_TYPES.map((type) => {
    return { text: type.propDisplayValue, value: type.propInternalValue };
  });
  listItmes.unshift({ text: '-', value: '-' });
  return listItmes;
};

export const initTable = async (ctx) => {
  langIndex = getLangIndex();
  _initColor();
  const listItems = _makeListItmes();

  // 1. Initialize Column Variables
  let complexColumns = [];
  appCtxService.registerCtx('interactionHeaders', {});
  let interactionHeaders = appCtxService.getCtx('interactionHeaders');
  let columns = [
    {
      header: constants.INTERACTION_CELL_HEADER_CLASS[langIndex],
      name: 'classHeader',
      rowSpan: true,
      width: 'auto',
    },
    {
      header: 'Item',
      name: 'interactionHeader',
      rowSpan: true,
      width: 'auto',
    },
  ];

  let datas = [];

  // 2. Get Selected FMEA ModelObject
  let selectedFmeaUid = ctx.fmea_select.uid;
  let fmeaChildUids = Object.keys(ctx[selectedFmeaUid]);
  await lgepObjectUtils.loadObjects(fmeaChildUids);
  // 3. Get Child FMEA Structures
  for (const fmeaChildUid of fmeaChildUids) {
    let parentAssy = lgepObjectUtils.getObject(fmeaChildUid);
    let fmeaSubAssyUids = Object.keys(ctx[selectedFmeaUid][fmeaChildUid]);
    let fmeaSubAssyList = lgepObjectUtils.getObject(fmeaSubAssyUids);
    let childNames = [];
    await lgepObjectUtils.loadObjects(fmeaSubAssyUids);
    lgepObjectUtils.whereReferenced(fmeaSubAssyList, 1).then((response) => {
      for (const subAssy of response.output) {
        for (const subAssyInfo of subAssy.info) {
          if (subAssyInfo.relation == prop.RELATION_INTERACTION) {
            let referencer = subAssyInfo.referencer;
            let referenced = subAssy.inputObject;
            lgepQueryUtils
              .executeSavedQuery(
                prop.QUERY_INTERACTION_RELATION,
                [
                  prop.QUERY_ENTRY_PRIMARY_ID,
                  prop.QUERY_ENTRY_PRIMARY_REV_ID,
                  prop.QUERY_ENTRY_PRIMARY_NAME,
                  prop.QUERY_ENTRY_SECONDARY_ID,
                  prop.QUERY_ENTRY_SECONDARY_REV_ID,
                  prop.QUERY_ENTRY_SECONDARY_NAME,
                ],
                [
                  referencer.props[prop.ITEM_ID].dbValues[0],
                  referencer.props[prop.REVISION_ID].dbValues[0],
                  referencer.props[prop.OBJECT_NAME].dbValues[0],
                  referenced.props[prop.ITEM_ID].dbValues[0],
                  referenced.props[prop.REVISION_ID].dbValues[0],
                  referenced.props[prop.OBJECT_NAME].dbValues[0],
                ]
              )
              .then((result) => {
                let filtered = datas.filter(
                  (data) => data.id == referencer.uid
                );
                if(filtered.length > 0) {
                  let rowKey = filtered[0]['rowKey'];
                  datas[rowKey][referenced.props[prop.OBJECT_NAME].dbValues[0]] =
                    result[0].props[prop.INNTERACTION_TYPE].dbValues[0];
                  grid.resetData(datas);
                }
              });
          }
        }
      }
    });

    // 4. Make Columns and null datas from FMEA Structures
    for (const fmeaSubAssy of fmeaSubAssyList) {
      childNames.push(fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0]);
      columns.push({
        header: fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0],
        className: fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0],
        name: fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0],
        minWidth: 200,
        formatter: 'listItemText',
        editor: {
          type: 'select',
          options: {
            listItems: listItems,
          },
        },
        renderer: {
          type: DefaultRender,
        },
      });
      interactionHeaders[fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0]] =
        fmeaSubAssy.uid;
      datas.push({
        id: fmeaSubAssy.uid,
        name: fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0],
        classHeader: parentAssy.props[prop.OBJECT_NAME].dbValues[0],
        interactionHeader: fmeaSubAssy.props[prop.OBJECT_NAME].dbValues[0],
      });
    }
    complexColumns.push({
      header: parentAssy.props[prop.OBJECT_NAME].dbValues[0],
      name: parentAssy.props[prop.OBJECT_NAME].dbValues[0],
      childNames: childNames,
    });
  }
  // Initialize Toast-grid
  grid = new Grid({
    el: document.getElementById('interaction-grid'),
    scrollX: true,
    scrollY: true,
    data: datas,
    header: {
      height: 80,
      complexColumns: complexColumns,
    },
    columnOptions: {
      frozenCount: 2,
      resizable: true,
      frozenBorderWidth: 2,
    },
    columns: columns,
    draggable: false,
  });

  for (let i = 0; i < datas.length; i++) {
    grid.disableCell(i, datas[i].name);
  }

  _interactionHeaderInit();

  return grid;
};

const COLOR_VALUES = [
  { value: 'A', className: 'td__mechanical' },
  { value: 'B', className: 'td__electrical' },
  { value: 'C', className: 'td__heat' },
  { value: 'D', className: 'td__chemical' },
  { value: 'E', className: 'td__radiative' },
  { value: 'AB', className: 'td__mechanical-electrical' },
  { value: 'AC', className: 'td__mechanical-heat' },
  { value: 'AD', className: 'td__mechanical-chemical' },
];

const _getCellColor = (className) => {
  const el = document.getElementsByClassName(className)[0];
  const elStyle = window.getComputedStyle(el);
  const bgcColor = elStyle.getPropertyValue('background-color');
  return bgcColor;
};

const _initColor = () => {
  for (const colorValue of COLOR_VALUES) {
    colorValue['color'] = _getCellColor(colorValue.className);
  }
};

class DefaultRender {
  constructor(props) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.right = '0';
    el.style.top = '0';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontWeight = '600';
    el.style.fontSize = '14px';

    this.el = el;

    this.render(props);
  }

  getElement() {
    return this.el;
  }

  render(props) {
    if (props.value) {
      this.el.innerHTML = String(props.value);
      const color = _getColorBySelectValue(props.value);
      this.el.style.backgroundColor = color;
      this.el.classList.add('color-cell');
    }
  }
}

const _getColorBySelectValue = (cellValue) => {
  for (const colorValue of COLOR_VALUES) {
    const { value, className, color } = colorValue;
    if (cellValue === value) {
      return color;
    }
  }
  return '';
};
