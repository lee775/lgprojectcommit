/**
 * Structure Master Create
 * @module js/structureCreateService
 */
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { masterCreateAfterActionByPanel } from 'js/cmCreateService';
import { getProductNameValueByGroup } from 'js/utils/fmeaCommonUtils';
import { setUnPin } from 'js/utils/fmeaViewCommonUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { validationInputs } from 'js/utils/fmeaValidationUtils';
import { createObject } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';

/**
 * SOD 생성
 * @param {*} ctx
 * @param {*} data
 */
const createAction = async (ctx, data) => {
  try {
    const { object_name: objectName } = data;
    const productValue = await getProductNameValueByGroup();

    const name = objectName.dbValues[0];

    // 0. input validation
    validationInputs([objectName]);

    // 1. 객체 생성
    const workspaceObjectUid = await createObject(prop.TYPE_SOD, name);
    const workspaceObject = await lgepObjectUtils.getObject(workspaceObjectUid);

    // 2. setProperty (제품, 참조 관계)
    await lgepObjectUtils.setProperties(
      workspaceObject,
      [prop.PRODUCT],
      [productValue]
    );

    const tablePropList = [
      prop.SOD_SEVERITY_TABLE,
      prop.SOD_OCCURENCE_TABLE,
      prop.SOD_DETECTION_TABLE,
    ];

    for (const tableProp of tablePropList) {
      await setChildTables(workspaceObject, name, tableProp);
    }

    // 4. 성공 처리
    masterCreateAfterActionByPanel('fmeaSodTableGrid');
  } catch (e) {
    showErrorMessage(e);
  }
};

const setChildTables = async (workspaceObject, name, type) => {
  const rows = await makeTableRows(name, type);
  await lgepObjectUtils.addChildren(workspaceObject, rows, type);
};

const makeTableRows = async (name, type) => {
  let rows = [];
  for (let index = 10; 0 < index; index--) {
    const rowUid = await createObject(prop.TYPE_SOD_ROW, name);
    const row = await lgepObjectUtils.getObject(rowUid);
    await lgepObjectUtils.setProperties(
      row,
      [prop.SOD_GRADE, prop.SOD_TYPE],
      [index.toString(), type]
    );
    rows.push(row);
  }
  return rows;
};

/**
 * panel 창에 패널 고정/해제 커맨드 부착
 */
const initAction = () => {
  setUnPin();
};

export default {
  initAction,
  createAction,
};
