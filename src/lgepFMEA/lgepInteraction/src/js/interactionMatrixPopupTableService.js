import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import { STRUCTURE_LIST, TOP, PARENT_ASSY, SUB_ASSY, PARENT_ASSY_UID, langIndex } from 'js/interactionMatrixPopupService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

import appCtxService from 'js/appCtxService';

export const PROP_PRIMARY = 'l2_primary';
export const PROP_SECONDARY = 'l2_secondary';
export const PROP_GRADE = 'l2_grade';
export let INTERACTION_TABLES;
export const PROP_INTERACTION_TABLE = 'l2_interaction_table';
export let GRID_TABLE;
const TYPE_INTERACTION_ROW = 'L2_InteractionTableRow';

const getTableInfo = () => {
  const columnInfo = makeColumns();
  const datas = makeDatas();

  return { columnInfo, datas };
};

const makeColumns = () => {
  const listItems = _makeListItmes();
  _initColor();

  let complexColumns = [];
  // 구분, 영향주는측
  let columns = [
    {
      header: constants.INTERACTION_CELL_HEADER_CLASS[langIndex],
      name: 'classHeader',
      rowSpan: true,
      minWidth: 200,
    },
    {
      header: 'Item',
      name: 'interactionHeader',
      rowSpan: true,
      minWidth: 200,
    },
  ];
  // 컬럼 목록
  for (const parentAssy of STRUCTURE_LIST[PARENT_ASSY]) {
    const parentAssyRev = parentAssy['itemRevOfBOMLine'];
    const complexColumnName = parentAssyRev.props[prop.OBJECT_NAME].dbValues[0];

    const subAssyColumns = _getSubAssyColumns(parentAssyRev, listItems);
    columns = [...columns, ...subAssyColumns];
    const childNames = subAssyColumns.map((col) => col.name);

    complexColumns.push({
      header: complexColumnName,
      name: complexColumnName,
      childNames: childNames,
    });
  }

  return { columns, complexColumns };
};

const _getSubAssyColumns = (parentAssyRev, listItems) => {
  const childAssyList = STRUCTURE_LIST[SUB_ASSY].filter((str) => parentAssyRev.uid === str['itemRevOfBOMLine'].props[PARENT_ASSY_UID]);
  const subAssyColumns = childAssyList.map((subAssy) => {
    const subAssyRev = subAssy['itemRevOfBOMLine'];
    const columnName = subAssyRev.props[prop.OBJECT_NAME].dbValues[0];
    return {
      header: columnName,
      className: subAssyRev.uid,
      name: columnName,
      minWidth: 200,
      formatter: 'listItemText',
      editor: {
        type: 'select',
        options: {
          listItems: listItems,
        },
      },
      renderer: {
        type: Render,
      },
    };
  });

  return subAssyColumns;
};

const _makeListItmes = () => {
  const listItmes = constants.INTERACTION_TYPES.map((type) => {
    return { text: type.propDisplayValue, value: type.propInternalValue };
  });
  listItmes.unshift({ text: '-', value: '-' });

  return listItmes;
};

class Render {
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

const _initColor = () => {
  for (const colorValue of COLOR_VALUES) {
    const el = document.getElementsByClassName(colorValue.className)[0];
    const elStyle = window.getComputedStyle(el);
    const bgcColor = elStyle.getPropertyValue('background-color');
    colorValue['color'] = bgcColor;
  }
};

const _getColorBySelectValue = (cellValue) => {
  for (const colorValue of COLOR_VALUES) {
    const { value, className, color } = colorValue;
    if (cellValue === value) {
      return color;
    }
  }

  return '';
};

const makeDatas = () => {
  let resultDatas = [];
  for (const parentAssy of STRUCTURE_LIST[PARENT_ASSY]) {
    const parentAssyRev = parentAssy['itemRevOfBOMLine'];

    const datas = _getData(parentAssyRev);
    resultDatas = [...resultDatas, ...datas];
  }

  return resultDatas;
};

const _getData = (parentAssyRev) => {
  const childAssyList = STRUCTURE_LIST[SUB_ASSY].filter((str) => parentAssyRev.uid === str['itemRevOfBOMLine'].props[PARENT_ASSY_UID]);
  const datas = childAssyList.map((subAssy) => {
    const subAssyRev = subAssy['itemRevOfBOMLine'];
    const subAssyName = subAssyRev.props[prop.OBJECT_NAME].dbValues[0];
    return {
      id: subAssyRev.uid,
      name: subAssyName,
      classHeader: parentAssyRev.props[prop.OBJECT_NAME].dbValues[0],
      interactionHeader: subAssyName,
    };
  });

  return datas;
};

export const makeTable = async () => {
  const tableInfo = getTableInfo();
  const { columnInfo, datas } = tableInfo;

  GRID_TABLE = new Grid({
    el: document.getElementById('interaction-grid'),
    scrollX: true,
    scrollY: true,
    data: datas,
    header: {
      height: 80,
      complexColumns: columnInfo.complexColumns,
    },
    columnOptions: {
      frozenCount: 2,
      resizable: true,
      frozenBorderWidth: 2,
    },
    columns: columnInfo.columns,
    draggable: false,
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

  _disableCells(datas);

  await _setDatas(datas);

  _interactionHeaderInit();
};

const _setDatas = async (datas) => {
  const topObject = STRUCTURE_LIST[TOP].parent['itemRevOfBOMLine'];
  await _getInteractionTable(topObject);
  for (const interaction of INTERACTION_TABLES) {
    const primaryUid = interaction.props[PROP_PRIMARY].dbValues[0];
    for (const data of datas) {
      if (data.id === primaryUid) {
        const secondaryUid = interaction.props[PROP_SECONDARY].dbValues[0];
        const column = _getColumnBySecondaryUid(secondaryUid);
        GRID_TABLE.setValue(data.rowKey, column.name, interaction.props[PROP_GRADE].dbValues[0]);
      }
    }
  }
};

const _getInteractionTable = async (topObject) => {
  await lgepObjectUtils.getProperties([topObject], [PROP_INTERACTION_TABLE]);
  const interactionTableUids = topObject.props[PROP_INTERACTION_TABLE].dbValues;
  INTERACTION_TABLES = await Promise.all(
    interactionTableUids.map(async (uid) => {
      return await loadObjectByPolicy(uid, TYPE_INTERACTION_ROW, [PROP_PRIMARY, PROP_SECONDARY, PROP_GRADE]);
    }),
  );
};

const _getColumnBySecondaryUid = (secondaryUid) => {
  return GRID_TABLE.getColumns().filter((c) => c.className === secondaryUid)[0];
};

const _disableCells = (datas) => {
  for (let i = 0; i < datas.length; i++) {
    GRID_TABLE.disableCell(i, datas[i].name);
  }
};

const _interactionHeaderInit = () => {
  const cellHeader = document.querySelector('th[data-column-name="interactionHeader"]');
  cellHeader.innerHTML = `
    Item<br /><strong>(${constants.INTERACTION_CELL_HEADER_SIDE[langIndex]}↓)</strong>
  `;
};
