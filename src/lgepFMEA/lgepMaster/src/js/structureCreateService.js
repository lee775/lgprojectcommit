/**
 * FMEA 마스터 - 구조 (생성)
 * @module js/structureCreateService
 */

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import queryUtil from 'js/utils/lgepQueryUtils';
import { setMasterItemProperty, masterCreateAfterActionByPanel, insertLogByCreate } from 'js/cmCreateService';
import { setUnPin } from 'js/utils/fmeaViewCommonUtils';
import { showErrorMessage, getLocalizedMessageByMaster } from 'js/utils/fmeaMessageUtils';
import { getProductNameByGroup, initGroupProuct } from 'js/utils/fmeaCommonUtils';
import { validationInputs } from 'js/utils/fmeaValidationUtils';
import { createItem } from 'js/utils/fmeaTcUtils';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 구조 마스터 생성
 */
const createAction = async (data) => {
  try {
    const {
      object_name: { dbValue: name },
      revision__l2_class: { dbValue: classValue },
    } = data;
    const { object_name: objectName, revision__l2_class: className } = data;
    // input validation
    validationInputs([objectName, className]);

    // 구조명 중복 체크
    await checkDuplicate(objectName.dbValues[0]);

    // 객체 생성
    const master = await createItem(prop.TYPE_FMEA_STRUCTURE, name);

    // item setProperty
    await setMasterItemProperty(master.item);

    // revision set Property
    await setRevisionProperty(master.itemRev, classValue);

    // 성공 처리
    masterCreateAfterActionByPanel('fmeaStructureTableGrid');

    insertLogByCreate(master);
  } catch (e) {
    showErrorMessage(e);
  }
};

/**
 * 구조명 중복 체크
 * @param {string} objectName
 */
const checkDuplicate = async (objectName) => {
  const queryResults = await queryUtil.executeSavedQuery(prop.QUERY_FMEA_STRUCTURE, [prop.QUERY_ENTRY_NAME], [objectName]);

  if (queryResults && queryResults.length > 0) {
    throw new Error(getLocalizedMessageByMaster('WarnDuplicateName'));
  }
};

/**
 * 구조 객체 리비전 setProperty
 * 제품, 분류
 */
const setRevisionProperty = async (masterRev, classValue) => {
  try {
    const productInfo = await initGroupProuct();
    const productValue = productInfo.value;

    const attributes = [prop.PRODUCT_CATEGORY, prop.CLASS];
    const values = [productValue, classValue];
    await lgepObjectUtils.setProperties(masterRev, attributes, values);
  } catch (e) {
    throw new Error(e.message);
  }
};

/**
 * panel 창에 패널 고정/해제 커맨드 부착
 */
const initAction = () => {
  const productValue = getProductNameByGroup();
  setUnPin();
  return { productValue };
};

export default {
  initAction,
  createAction,
};
