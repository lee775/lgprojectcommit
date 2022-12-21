import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import { getLangIndex } from 'js/utils/fmeaCommonUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import msg from 'js/utils/lgepMessagingUtils';

import viewModelService from 'js/viewModelObjectService';
import { calculateAp } from 'js/calculationActionPriority';
import notySvc from 'js/NotyModule';

import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';
import { isNumber } from 'angular';
import { ctx } from 'js/appCtxService';

let langIndex;
let grid;
let tableInfo;

let version_mgmt;

let serviceData;
let batchServerAddress;

const onMount = async (ctx, data) => {
  // 프리퍼런스로 주소 가져오기
  serviceData = await lgepPreferenceUtils.getPreference('BatchServerRestfulHosting.URL');
  batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

  langIndex = getLangIndex();

  const sod = await loadObjectByPolicy(ctx.fmea_set_vmo[0].uid, prop.TYPE_SOD, [prop.SOD_AP_TABLE]);

  await _getTableInfo();

  const apTables = await _makeTableRow(sod, prop.SOD_AP_TABLE, ctx);
  ctx.getApTable = true;
  const widthArray = [250, 80, 300, 80, 200, 80, 200, 430, 115];
  const columns = _getColumns(tableInfo[prop.SOD_AP_TABLE].cols, widthArray);

  const height = document.querySelector('#xrt-ap-container aw-xrt-summary');

  grid = new Grid({
    el: document.getElementById('apToastTable'),
    scrollX: true,
    scrollY: true,
    bodyHeight: height.offsetHeight - 150,
    // pageOptions: {
    //   type: "scroll",
    //   perPage: 50,
    // },
    data: apTables,
    columns: columns,
    draggable: false,
    contextMenu: null,
  });

  setTuiGridStyle(ctx);
  // apCalculation();
  events(ctx, data);
  // tableResize();
};

export const setTuiGridStyle = async (ctx) => {
  if (ctx.theme == 'ui-lgepDark') {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#444a4e',
        background: '#282d33',
      },
      // row: {
      //   hover: {
      //     background: '#e5f6ff',
      //   },
      // },
    });
  } else {
    Grid.applyTheme('custom', {
      scrollbar: {
        border: '#eee',
        background: '#fff',
      },
      // row: {
      //   hover: {
      //     background: '#e5f6ff',
      //   },
      // },
    });
  }
};

const events = async (ctx, data) => {
  let priorValue;
  let nowValue;

  grid.on('editingStart', async (e) => {
    //console.log(e);
    priorValue = e.value;
  });

  grid.on('editingFinish', async (e) => {
    nowValue = e.value;

    if (priorValue != nowValue) {
      const col = grid.getColumn(e.columnName);
      const cols = grid.getColumns();

      if (col.defaultValue == 'version_mgmt') {
        notySvc.showError('버전 정보는 수정 할 수 없습니다.');
        grid.setValue(e.rowKey, e.columnName, priorValue);
      } else {
        if (!ctx.ap_edited) {
          let dataMap = new Map();
          dataMap.set('version_mgmt', version_mgmt);

          await fetch(batchServerAddress + '/apTableData/insertAPTableUpdateAllData', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(dataMap)),
          })
            .then((response) => {
              //console.log(response)
            })
            .catch((error) => {
              //console.log(`error: ${error}`)
            });
        }

        let findForRows = {};
        let values = [];
        for (let i = 0; i <= col.comparator; i++) {
          let value = grid.getValue(e.rowKey, cols[i].name);
          findForRows[cols[i].name] = value;
          if (e.columnName != cols[i].name) {
            values.push(value);
          } else {
            values.push(priorValue);
          }
        }
        findForRows[e.columnName] = priorValue;

        // 찾아온 데이터를 기반으로 같은 값을 가진 데이터들 전부 찾아오기
        //console.log("values", values);
        let effectivity = values[0];
        let severity = !values[1] ? 0 : values[1];
        let potential_failure_cause = !values[2] ? null : values[2];
        let occurrence = !values[3] ? 0 : values[3];
        let detection_capability = !values[4] ? null : values[4];
        let detection = !values[5] ? 0 : values[5];

        let dataMap = new Map();
        dataMap.set('effectivity', effectivity);
        dataMap.set('severity', severity);
        dataMap.set('potential_failure_cause', potential_failure_cause);
        dataMap.set('occurrence', occurrence);
        dataMap.set('detection_capability', detection_capability);
        dataMap.set('detection', detection);

        await fetch(batchServerAddress + '/apTableData/selectDatas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(dataMap)),
        })
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Network response was not ok.');
          })
          .then(async (result) => {
            //console.log("바뀔 데이터들 : ", result);

            for (let data of result) {
              let dataMap = new Map();
              dataMap.set('change_column', col.defaultValue);
              if (col.defaultValue == 'severity' || col.defaultValue == 'occurrence' || col.defaultValue == 'detection') {
                dataMap.set('change_num_value', nowValue);
              } else {
                dataMap.set('change_value', nowValue);
              }
              dataMap.set('effectivity', data.effectivity);
              dataMap.set('severity', data.severity);
              dataMap.set('potential_failure_cause', data.potential_failure_cause);
              dataMap.set('occurrence', data.occurrence);
              dataMap.set('detection_capability', data.detection_capability);
              dataMap.set('detection', data.detection);

              await fetch(batchServerAddress + '/apTableData/insertAPTableUpdateData', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(Object.fromEntries(dataMap)),
              })
                .then((response) => {
                  //console.log(response)
                })
                .catch((error) => {
                  //console.log(`error: ${error}`)
                });
            }
            ctx.ap_edited = true;
          })
          .catch((error) => {
            //console.log(`error: ${error}`)
          });

        const rows = grid.findRows(findForRows);
        for (let row of rows) {
          grid.setValue(row.rowKey, e.columnName, nowValue);
        }
      }
    }
  });
};

export const apEditSaveAction = async (ctx, data) => {
  //console.log("저장");

  //console.log(version_mgmt);
  //console.log("V" + (Number(version_mgmt.substr(1)) + 1));

  let dataMap = new Map();
  dataMap.set('version_mgmt', 'V' + (Number(version_mgmt.substr(1)) + 1));

  await fetch(batchServerAddress + '/apTableData/updateVersion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Object.fromEntries(dataMap)),
  })
    .then(async (response) => {
      if (response.ok) {
        //console.log(response);
        return response.json();
      }
    })
    .then(async (result) => {
      //console.log(result);

      let apData = [];
      let tableData = {
        type: '',
        uid: '',
        props: {
          effectivity: [],
          severity: [],
          potential_failure_cause: [],
          occurrence: [],
          detection_capability: [],
          detection: [],
          ap: [],
          opinion: [],
          version_mgmt: [],
          ap_index: [],
        },
      };
      for (var i = 0; i < result.length; i++) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(tableData);

        apData[i] = vmo;

        apData[i].uid = result[i].ap_index;

        //이하 테이블 구성

        apData[i].props.effectivity.dbValue = result[i].effectivity;
        apData[i].props.effectivity.uiValue = result[i].effectivity;

        apData[i].props.severity.dbValue = result[i].severity;
        apData[i].props.severity.uiValue = result[i].severity;

        apData[i].props.potential_failure_cause.dbValue = result[i].potential_failure_cause;
        apData[i].props.potential_failure_cause.uiValue = result[i].potential_failure_cause;

        apData[i].props.occurrence.dbValue = result[i].occurrence;
        apData[i].props.occurrence.uiValue = result[i].occurrence;

        apData[i].props.detection_capability.dbValue = result[i].detection_capability;
        apData[i].props.detection_capability.uiValue = result[i].detection_capability;

        apData[i].props.detection.dbValue = result[i].detection;
        apData[i].props.detection.uiValue = result[i].detection;

        apData[i].props.ap.dbValue = result[i].ap;
        apData[i].props.ap.uiValue = result[i].ap;

        apData[i].props.opinion.dbValue = result[i].opinion;
        apData[i].props.opinion.uiValue = result[i].opinion;

        apData[i].props.version_mgmt.dbValue = result[i].version_mgmt;
        apData[i].props.version_mgmt.uiValue = result[i].version_mgmt;

        apData[i].props.ap_index.dbValue = result[i].ap_index;
        apData[i].props.ap_index.uiValue = result[i].ap_index;
      }

      version_mgmt = result[0].version_mgmt;

      const props = tableInfo[prop.SOD_AP_TABLE].cols.map((col) => col[0]);

      let datas = await _getTableDatas(apData, prop.SOD_AP_TABLE, props);

      //console.log("datas", datas);

      grid.resetData(datas);
      // onMount(ctx, data);
      ctx.ap_edited = false;
      notySvc.showInfo('새로운 버전이 저장 되었습니다.');
    })
    .catch((error) => {
      //console.log(`error: ${error}`)
    });
};

export const unMount = async (ctx) => {
  //console.log("unMount");

  if (ctx.ap_edited) {
    msg.show(
      1,
      '저장되지 않은 데이터가 남아있습니다. \n 저장하시겠습니까?',
      ['네', '아니오'],
      [
        async function () {
          let dataMap = new Map();
          dataMap.set('version_mgmt', 'V' + (Number(ctx.ap_version_mgmt.substr(1)) + 1));

          await fetch(batchServerAddress + '/apTableData/updateVersion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(dataMap)),
          })
            .then((response) => {
              //console.log(response)
            })
            .catch((error) => {
              //console.log(`error: ${error}`)
            });

          ctx.ap_edited = false;
          notySvc.showInfo('새로운 버전 ' + 'V' + (Number(ctx.ap_version_mgmt.substr(1)) + 1) + '이(가) 저장 되었습니다.');
        },
        async function () {
          await fetch(batchServerAddress + '/apTableData/updateExitVersion')
            .then((response) => {
              //console.log(response)
            })
            .catch((error) => {
              //console.log(`error: ${error}`)
            });
          ctx.ap_edited = false;
          notySvc.showInfo('저장되지 않은 데이터를 삭제했습니다.');
        },
      ],
    );
  }

  ctx.ap_edited = false;
};

const _getTableInfo = async () => {
  tableInfo = constants.SOD_VACUUM_TABLE_INFO;
};

const _makeTableRow = async (sod, tableName, ctx) => {
  const props = tableInfo[tableName].cols.map((col) => col[0]);
  const objects = await getApTableData(ctx);

  return _getTableDatas(objects, tableName, props);
};

const _getTableDatas = async (objects, tableName, props) => {
  const columns = tableInfo[tableName].cols;
  return objects.map((row) => {
    return _makeRow(row, props, columns);
  });
};

const _makeRow = (tableRow, props, columns) => {
  let row;
  for (let index = 0; index < props.length; index++) {
    const propName = props[index];
    row = {
      ...row,
      [columns[index][langIndex]]: tableRow.props[propName].dbValue == null ? ' ' : tableRow.props[propName].dbValue,
      ['INDEX']: tableRow.props['ap_index'].dbValue,
    };
  }
  return row;
};

const _getColumns = (columns, widthArray) => {
  const gridColumns = columns.map((column, index) => {
    const width = widthArray[index];
    return _getLangColumn(column, width, index);
  });
  return gridColumns;
};

const _getLangColumn = (column, width, index) => {
  return {
    title: column[0],
    name: column[langIndex],
    defaultValue: column[0],
    minWidth: width,
    comparator: index,
    editor: {
      type: 'text',
    },
    // rowSpan: column[0] == "l2_ap" || column[0] == "l2_detection_capability" ? false : true
  };
};

const tableResize = async () => {
  await lgepCommonUtils.delay(1000);
  let getTable = document.querySelectorAll('#occurenceTable .tui-grid-rside-area .tui-grid-body-area .tui-grid-body-container');
  //console.log("getTable", getTable[0].style.height);
  let width = getTable[0].style.width;
  // let height = getTable[0].style.height;

  const regex = /[^0-9]/g;
  width = width.replace(regex, '');
  let height = 0;

  for (let tr of getTable) {
    let str = tr.style.height;
    const result = str.replace(regex, '');

    height += parseInt(result);
  }
  grid.setBodyHeight(height + 40);
  grid.setWidth(width + 25);
};

export const apCalculation = async () => {
  // 프리퍼런스로 주소 가져오기
  let serviceData = await lgepPreferenceUtils.getPreference('BatchServerRestfulHosting.URL');
  let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

  let effectivity;
  let potential_failure_cause;
  let detection_capability;
  let ap;

  for (let s = 10; s >= 1; s--) {
    for (let o = 10; o >= 1; o--) {
      for (let d = 10; d >= 1; d--) {
        if (d == 1) {
          detection_capability = '매우 높음';
        } else if (d <= 4) {
          detection_capability = '높음';
        } else if (d <= 6) {
          detection_capability = '중간';
        } else {
          detection_capability = '낮음 - 매우 낮음';
        }

        if (o == 1) {
          detection_capability = '낮음 - 매우 낮음';
          potential_failure_cause = '매우 낮음';
        } else if (o <= 3) {
          potential_failure_cause = '낮음';
        } else if (o <= 5) {
          potential_failure_cause = '중간';
        } else if (o <= 7) {
          potential_failure_cause = '높음';
        } else {
          potential_failure_cause = '매우 높음';
        }

        if (s == 1) {
          detection_capability = '매우 높음 - 매우 낮음';
          potential_failure_cause = '매우 낮음 - 매우 높음';
          effectivity = '식별 가능한 영향이 없음';
        } else if (s <= 3) {
          effectivity = '제품 또는 공장 영향 낮음';
        } else if (s <= 6) {
          effectivity = '제품 또는 공장 영향 중간';
        } else if (s <= 8) {
          effectivity = '제품 또는 공장 영향 높음';
        } else {
          effectivity = '제품 또는 공장 영향 매우 높음';
        }

        ap = calculateAp(s, o, d);

        let dataMap = new Map();
        dataMap.set('effectivity', effectivity);
        dataMap.set('severity', s);
        dataMap.set('potential_failure_cause', potential_failure_cause);
        dataMap.set('occurrence', o);
        dataMap.set('detection_capability', detection_capability);
        dataMap.set('detection', d);
        dataMap.set('ap', ap);
        dataMap.set('opinion', null);
        dataMap.set('version_mgmt', 'V1');

        await fetch(batchServerAddress + '/apTableData/insertAPTableData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(dataMap)),
        })
          .then((response) => {
            //console.log(response)
          })
          .catch((error) => {
            //console.log(`error: ${error}`)
          });
      }
    }
  }
};

export const getApTableData = async (ctx) => {
  let apData = [];
  let tableData = {
    type: '',
    uid: '',
    props: {
      effectivity: [],
      severity: [],
      potential_failure_cause: [],
      occurrence: [],
      detection_capability: [],
      detection: [],
      ap: [],
      opinion: [],
      version_mgmt: [],
      ap_index: [],
    },
  };

  let serviceData = await lgepPreferenceUtils.getPreference('BatchServerRestfulHosting.URL');
  let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

  await fetch(batchServerAddress + '/apTableData/selectAll')
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    })
    .then((result) => {
      for (var i = 0; i < result.length; i++) {
        let vmo = viewModelService.constructViewModelObjectFromModelObject(tableData);

        apData[i] = vmo;

        apData[i].uid = result[i].ap_index;

        //이하 테이블 구성

        apData[i].props.effectivity.dbValue = result[i].effectivity;
        apData[i].props.effectivity.uiValue = result[i].effectivity;

        apData[i].props.severity.dbValue = result[i].severity;
        apData[i].props.severity.uiValue = result[i].severity;

        apData[i].props.potential_failure_cause.dbValue = result[i].potential_failure_cause;
        apData[i].props.potential_failure_cause.uiValue = result[i].potential_failure_cause;

        apData[i].props.occurrence.dbValue = result[i].occurrence;
        apData[i].props.occurrence.uiValue = result[i].occurrence;

        apData[i].props.detection_capability.dbValue = result[i].detection_capability;
        apData[i].props.detection_capability.uiValue = result[i].detection_capability;

        apData[i].props.detection.dbValue = result[i].detection;
        apData[i].props.detection.uiValue = result[i].detection;

        apData[i].props.ap.dbValue = result[i].ap;
        apData[i].props.ap.uiValue = result[i].ap;

        apData[i].props.opinion.dbValue = result[i].opinion;
        apData[i].props.opinion.uiValue = result[i].opinion;

        apData[i].props.version_mgmt.dbValue = result[i].version_mgmt;
        apData[i].props.version_mgmt.uiValue = result[i].version_mgmt;

        apData[i].props.ap_index.dbValue = result[i].ap_index;
        apData[i].props.ap_index.uiValue = result[i].ap_index;
      }

      ctx.ap_version_mgmt = result[0].version_mgmt;
      version_mgmt = result[0].version_mgmt;
      // version_mgmt.push("V" + (Number(version_mgmt[version_mgmt.length - 1].substr(1)) + 1));
    })
    .catch((error) => {
      //console.log(`error: ${error}`)
    });

  return apData;
};

export const getActionPriority = async (severity, occurence, detection) => {
  let apResult;

  // 프리퍼런스로 주소 가져오기
  let serviceData = await lgepPreferenceUtils.getPreference('BatchServerRestfulHosting.URL');
  let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

  let dataMap = new Map();
  dataMap.set('severity', severity);
  dataMap.set('occurrence', occurence);
  dataMap.set('detection', detection);

  await fetch(batchServerAddress + '/apTableData/selectAPTableData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(Object.fromEntries(dataMap)),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Network response was not ok.');
    })
    .then((result) => {
      apResult = result[0].ap;
    })
    .catch((error) => {
      //console.log(`error: ${error}`)
    });

  return apResult;
};

export const getActionPriorityForList2 = function (arrays) {
  let severity = [];
  let occurrence = [];
  let detection = [];

  for (const array of arrays) {
    severity.push(array[0]);
    occurrence.push(array[1]);
    detection.push(array[2]);
  }
  return getActionPriorityForList(severity, occurrence, detection);
};

/**
 *
 * @param {Array} severity 검색할 심각도 값들의 리스트
 * @param {Array} occurence 검색할 발생도 값들의 리스트
 * @param {Array} detection 검색할 검출도 값들의 리스트
 * @returns {Array} 같은 인덱스값의 S.O.D를 검색하여 도출된 AP 리스트
 */
export const getActionPriorityForList = async (severity, occurence, detection) => {
  let apResult = [];

  // 프리퍼런스로 주소 가져오기
  let serviceData = await lgepPreferenceUtils.getPreference('BatchServerRestfulHosting.URL');
  let batchServerAddress = serviceData.Preferences.prefs[0].values[0].value;

  let dataList = [];
  let dataMap = new Map();

  for (let i = 0; i < severity.length; i++) {
    dataMap.set('severity', severity[i]);
    dataMap.set('occurrence', occurence[i]);
    dataMap.set('detection', detection[i]);
    dataList.push(Object.fromEntries(dataMap));
  }

  await fetch(batchServerAddress + '/apTableData/selectAPTableDataForList', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataList),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      // throw new Error('Network response was not ok.');
    })
    .then((result) => {
      //console.log("result", result);
      for (let a of result) {
        apResult.push(a.ap);
      }
      // apResult = result[0].ap;
    })
    .catch((error) => {
      //console.log(`error: ${error}`)
    });

  return apResult;
};

export default {
  onMount,
  apEditSaveAction,
  getActionPriority,
  getActionPriorityForList2,
  getActionPriorityForList,
  unMount,
  setTuiGridStyle,
};
