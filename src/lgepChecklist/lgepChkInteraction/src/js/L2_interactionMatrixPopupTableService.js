import Grid from "tui-grid";
import "tui-grid/dist/tui-grid.css";

import appCtxService from "js/appCtxService";

import {
  TOP,
  PARENT_ASSY,
  STRUCTURE_INFO,
  PROP_GRADE,
  PROP_SECONDARY,
  PROP_PRIMARY,
  getInteractionTable,
  INTERACTION_TYPES,
  getLang,
} from "js/L2_ChecklistInteractionUtils";

export let INTERACTION_TABLES;
export let gridTable;

let langIndex;
let structureInfo;
const INTERACTION_CELL_HEADER_CLASS = ["Class", "구분"];
const INTERACTION_CELL_HEADER_SIDE = ["Influencing side", "영향주는 측"];

export const makeTable = async () => {
  structureInfo = appCtxService.ctx.checklist[STRUCTURE_INFO];
  const tableInfo = getTableInfo();
  const { columnInfo, datas } = tableInfo;

  gridTable = new Grid({
    el: document.getElementById("interaction-grid"),
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

  _disableCells(datas);

  await _setDatas(datas);

  _interactionHeaderInit();
};

const _makeListItmes = () => {
  const listItmes = INTERACTION_TYPES.map((type) => {
    return { text: type.propDisplayValue, value: type.propInternalValue };
  });
  listItmes.unshift({ text: "-", value: "-" });

  return listItmes;
};

class Render {
  constructor(props) {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.right = "0";
    el.style.top = "0";
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.fontWeight = "600";
    el.style.fontSize = "14px";

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
      this.el.classList.add("color-cell");
    }
  }
}

const COLOR_VALUES = [
  { value: "A", className: "td__mechanical" },
  { value: "B", className: "td__electrical" },
  { value: "C", className: "td__heat" },
  { value: "D", className: "td__chemical" },
  { value: "E", className: "td__radiative" },
  { value: "AB", className: "td__mechanical-electrical" },
  { value: "AC", className: "td__mechanical-heat" },
  { value: "AD", className: "td__mechanical-chemical" },
];

const _initColor = () => {
  for (const colorValue of COLOR_VALUES) {
    const el = document.getElementsByClassName(colorValue.className)[0];
    const elStyle = window.getComputedStyle(el);
    const bgcColor = elStyle.getPropertyValue("background-color");
    colorValue["color"] = bgcColor;
  }
};

const _getColorBySelectValue = (cellValue) => {
  for (const colorValue of COLOR_VALUES) {
    const { value, className, color } = colorValue;
    if (cellValue === value) {
      return color;
    }
  }

  return "";
};

const _setDatas = async (datas) => {
  const topObject = structureInfo[TOP].getOriginalObject();
  INTERACTION_TABLES = await getInteractionTable(topObject);

  for (const interaction of INTERACTION_TABLES) {
    const primaryUid = interaction.props[PROP_PRIMARY].dbValues[0];
    for (const data of datas) {
      if (data.id === primaryUid) {
        const secondaryUid = interaction.props[PROP_SECONDARY].dbValues[0];
        const column = _getColumnBySecondaryUid(secondaryUid);
        gridTable.setValue(
          data.rowKey,
          column.name,
          interaction.props[PROP_GRADE].dbValues[0]
        );
      }
    }
  }
};

const getTableInfo = () => {
  const columnInfo = makeColumns();
  const datas = makeDatas();

  return { columnInfo, datas };
};

const makeDatas = () => {
  let resultDatas = [];
  for (const parentAssy of structureInfo[PARENT_ASSY]) {
    const datas = _getData(parentAssy);
    resultDatas = [...resultDatas, ...datas];
  }

  return resultDatas;
};

const _getData = (parentAssy) => {
  const datas = parentAssy.getChildren().map((subAssy) => {
    const subAssyName = subAssy.name;
    return {
      id: subAssy.getOriginalObject().uid,
      name: subAssyName,
      classHeader: parentAssy.name,
      interactionHeader: subAssyName,
    };
  });

  return datas;
};

const makeColumns = () => {
  const listItems = _makeListItmes();
  _initColor();
  langIndex = getLang();

  let complexColumns = [];
  // 구분, 영향주는측
  let columns = [
    {
      header: INTERACTION_CELL_HEADER_CLASS[langIndex],
      name: "classHeader",
      rowSpan: true,
      minWidth: 200,
    },
    {
      header: "Item",
      name: "interactionHeader",
      rowSpan: true,
      minWidth: 200,
    },
  ];
  // 컬럼 목록
  for (const parentAssy of structureInfo[PARENT_ASSY]) {
    const complexColumnName = parentAssy.name;
    const subAssyColumns = _getSubAssyColumns(parentAssy, listItems);
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

const _getSubAssyColumns = (parentAssy, listItems) => {
  const subAssyColumns = parentAssy.getChildren().map((subAssy) => {
    const columnName = subAssy.name;
    return {
      header: columnName,
      className: subAssy.getOriginalObject().uid, // Item Rev
      name: columnName,
      minWidth: 200,
      formatter: "listItemText",
      editor: {
        type: "select",
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

const _getColumnBySecondaryUid = (secondaryUid) => {
  return gridTable.getColumns().filter((c) => c.className === secondaryUid)[0];
};

const _disableCells = (datas) => {
  for (let i = 0; i < datas.length; i++) {
    gridTable.disableCell(i, datas[i].name);
  }
};

const _interactionHeaderInit = () => {
  const cellHeader = document.querySelector(
    'th[data-column-name="interactionHeader"]'
  );
  cellHeader.innerHTML = `
    Item<br /><strong>(${INTERACTION_CELL_HEADER_SIDE[langIndex]}↓)</strong>
  `;
};
