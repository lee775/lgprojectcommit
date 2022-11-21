/**
 * DFMEA Master Detail List
 * @module js/dfmeaMasterListService
 */
import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import queryUtil from 'js/utils/lgepQueryUtils';

import { replaceAmp } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * FMEA의 제품에 맞는 구조/기능/고장 리스트 INIT
 * @param {*} ctx
 */
export const initMasterDatas = async (productValue) => {
  const structureValues = _getStructureValues(productValue);
  const functionValues = _getFunctionValues(productValue);
  const failureValues = _getFailureValues(productValue);

  Promise.allSettled([structureValues, functionValues, failureValues]).then((results) => {
    const result = {
      [constants.MASTER_DATA_KEY_STRUCTURE]: results[0].value,
      [constants.MASTER_DATA_KEY_FUNCTION]: results[1].value,
      [constants.MASTER_DATA_KEY_FAILURE]: results[2].value,
    };
    appCtxService.registerCtx(constants.DFMEA_ALL_MASTER_DATA, result);
  });
};

// export const initMasterDatas = async (ctx) => {
//   const dfmeaMaster = ctx[constants.FMEA_SELECT];
//   const productValue = dfmeaMaster.props[prop.PRODUCT].dbValues[0];
//   const structureValues = _getStructureValues(productValue);
//   const functionValues = _getFunctionValues(productValue);
//   const failureValues = _getFailureValues(productValue);

//   Promise.allSettled([structureValues, functionValues, failureValues]).then(
//     (results) => {
//       const result = {
//         [constants.MASTER_DATA_KEY_STRUCTURE]: results[0].value,
//         [constants.MASTER_DATA_KEY_FUNCTION]: results[1].value,
//         [constants.MASTER_DATA_KEY_FAILURE]: results[2].value,
//       };
//       appCtxService.registerCtx(constants.DFMEA_ALL_MASTER_DATA, result);
//     }
//   );
// };

const _getStructureValues = async (productValue) => {
  const revList = await queryUtil.executeSavedQuery(
    prop.QUERY_FMEA_STRUCTURE,
    [prop.QUERY_DFMEA_MASTER_PRODUCT, prop.QUERY_ENTRY_ISMASTER],
    [productValue, 'true'],
  );

  // 분류
  const parentAssyValues = revList.filter((rev) => constants.CLASS_LIST[0] === rev.props[prop.CALSS].dbValues[0]);
  const parentAssyList = _makeListValues(parentAssyValues, prop.OBJECT_NAME);

  const subAssyValues = revList.filter((rev) => constants.CLASS_LIST[1] === rev.props[prop.CALSS].dbValues[0]);
  const subAssyList = _makeListValues(subAssyValues, prop.OBJECT_NAME);

  const singleAssyValues = revList.filter((rev) => constants.CLASS_LIST[2] === rev.props[prop.CALSS].dbValues[0]);
  const singleAssyList = _makeListValues(singleAssyValues, prop.OBJECT_NAME);

  const structureValues = {
    parentAssyList: parentAssyList,
    subAssyList: subAssyList,
    singleAssyList: singleAssyList,
  };
  return structureValues;
};

const _makeListValues = (array, propName) => {
  const emptyValue = {
    propDisplayValue: '',
    dispValue: '',
    propInternalValue: '',
  };

  const listValues = array.map((item) => {
    const value = item.props[propName].dbValues[0];
    return {
      propDisplayValue: value,
      dispValue: item.uid,
      propInternalValue: value,
    };
  });
  const result = [emptyValue, ...listValues];
  return result;
};

const _getFailureValues = async (productValue) => {
  const revList = await queryUtil.executeSavedQuery(
    prop.QUERY_FMEA_FAILURE,
    [prop.QUERY_DFMEA_MASTER_PRODUCT, prop.QUERY_ENTRY_ISMASTER],
    [productValue, 'true'],
  );
  const _getFailureValues = revList.map((failureRev) => {
    const functionValue = failureRev.props[prop.POTENTIAL_FAILURE_MODE].dbValues[0];
    const displayValue = failureRev.props[prop.POTENTIAL_FAILURE_MODE_SHORT].dbValues[0];
    return {
      propDisplayValue: displayValue,
      dispValue: failureRev.uid,
      propInternalValue: functionValue,
    };
  });

  return _getFailureValues;
};

const _getFunctionValues = async (productValue) => {
  const revList = await queryUtil.executeSavedQuery(
    prop.QUERY_FMEA_FUNCTION,
    [prop.QUERY_DFMEA_MASTER_PRODUCT, prop.QUERY_ENTRY_ISMASTER],
    [productValue, 'true'],
  );
  const functionValues = revList.map((functionRev) => {
    const functionValue = functionRev.props[prop.FUNCTION].dbValues[0];
    const displayValue = replaceAmp(functionRev.props[prop.FUNCTION_SHORT].dbValues[0]);

    return {
      propDisplayValue: displayValue,
      dispValue: functionRev.uid,
      propInternalValue: functionValue,
    };
  });
  return functionValues;
};

/**
 *
 * @param {{ModelObject}} queryResults
 * @returns
 */
const _getRevList = async (queryResults) => {
  if (!queryResults) {
    return [];
  }
  const revList = await Promise.all(
    queryResults.map(async (item) => {
      const rev = await lgepObjectUtils.getLatestItemRevision(item);
      return rev;
    }),
  );
  return revList;
};
