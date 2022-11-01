/**
 * dfmeaMasterEditRemoveService
 * @module js/dfmeaMasterEditRemoveService
 */
import appCtxService from 'js/appCtxService';

import messageUtil from 'js/utils/lgepMessagingUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';

import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';
import {
  saveCloseBomWindow,
  getFmeaRevId,
  getLatestItemRevisionByRevUid,
} from 'js/utils/fmeaTcUtils';
import { tableRefreshByTableMode } from 'js/utils/fmeaViewCommonUtils';
import { showWarnMessage } from 'js/utils/fmeaMessageUtils';
import { goDFmeaMasterView } from 'js/utils/fmeaCommonUtils';
import {
  TYPE_INFO,
  getLocalizedMessage,
  showErrorMessage,
  showInfoMessage,
} from 'js/utils/fmeaMessageUtils';

/**
 * 로우 제거 (View만)
 * @param {*} ctx
 * @returns
 */
const removeRowAction = async (ctx) => {
  const selectRow = ctx[constants.ROW_SELECT];
  if (!selectRow) {
    showWarnMessage('warnSelectRow');
    return;
  }
  appCtxService.registerCtx(constants.FMEA_POPUP, true);
  messageUtil.showWithParams(
    TYPE_INFO,
    getLocalizedMessage('questionsDelete'),
    [],
    ['Yes', 'No'],
    [
      async function () {
        try {
          await removeRowOperation(ctx, selectRow);
          return;
        } catch (e) {
          showErrorMessage(e);
        }
      },
      function () {
        return;
      },
    ]
  );
};

/**
 * 로우 제거
 * @param {*} ctx
 * @returns
 */
const removeRowOperation = async (ctx, selectRow) => {
  const fmeaRev = ctx[constants.FMEA_SELECT];

  await _removeRow(fmeaRev, selectRow);

  tableRefreshByTableMode();
  showInfoMessage('successComplete');
};

// 행 삭제
const _removeRow = async (fmeaRev, selectRow) => {
  const bom = await lgepBomUtils.createBOMWindow(null, fmeaRev);
  const expandResult = await lgepBomUtils.expandPSAllLevels([bom.bomLine]);
  try {
    const allBomlines = expandResult.output;

    const removeFailureUid = await _removeFailure(allBomlines, selectRow);
    const functionUid = await _removeFunction(
      allBomlines,
      selectRow,
      removeFailureUid
    );
    await _removeStructures(allBomlines, selectRow, functionUid);
  } catch (e) {
    console.log('_removeRow', e);
  } finally {
    await saveCloseBomWindow(bom.bomWindow);
  }
};

// 고장 제거
const _removeFailure = async (allBomlines, selectRow) => {
  const removeFailure = await getLatestItemRevisionByRevUid(
    selectRow.props.uid,
    prop.TYPE_FMEA_FAILURE_REVISION
  );
  for (const bomlineInfo of allBomlines) {
    const itemRev = bomlineInfo.parent.itemRevOfBOMLine;
    if (removeFailure.uid !== itemRev.uid) {
      continue;
    }
    const bomLine = bomlineInfo.parent.bomLine;
    await lgepBomUtils.removeChildrenFromParentLine([bomLine]);
    return itemRev.uid;
  }
};

// 기능 제거
const _removeFunction = async (allBomlines, selectRow, removedFailureUid) => {
  const removeFunctionUid = selectRow.props[prop.FUNCTION].uid;
  const removeFunction = await getLatestItemRevisionByRevUid(
    removeFunctionUid,
    prop.TYPE_FMEA_FUNC_REVISION
  );

  for (const bomlineInfo of allBomlines) {
    const itemRev = bomlineInfo.parent.itemRevOfBOMLine;
    if (removeFunction.uid !== itemRev.uid) {
      continue;
    }
    // 하위에 고장이 없는 경우만 제거 가능
    const isHaveChildren = await _checkHaveChildren(
      bomlineInfo,
      removedFailureUid
    );
    if (!isHaveChildren) {
      const bomLine = bomlineInfo.parent.bomLine;
      await lgepBomUtils.removeChildrenFromParentLine([bomLine]);
      return itemRev.uid;
    }
  }
};

// 구조 제거
const _removeStructures = async (allBomlines, selectRow, functionUid) => {
  const singleItem = selectRow.props[constants.SINGLE_ITEM];
  if (singleItem) {
    const singleItemUid = singleItem.uid;
    await _removeStructure(allBomlines, singleItemUid, functionUid);
  }
  const subAssy = selectRow.props[prop.SUB_ASSY];
  if (subAssy) {
    const subAssyUid = subAssy.uid;
    await _removeStructure(allBomlines, subAssyUid, functionUid);
  }
  const parentAssy = selectRow.props[prop.PARENT_ASSY];
  if (parentAssy) {
    const parentAssyUid = parentAssy.uid;
    await _removeStructure(allBomlines, parentAssyUid, functionUid);
  }
};

const _removeStructure = async (allBomlines, structureUid, functionUid) => {
  const removeStructure = await getLatestItemRevisionByRevUid(
    structureUid,
    prop.TYPE_FMEA_STRUCTURE_REV
  );
  for (const bomlineInfo of allBomlines) {
    const itemRev = bomlineInfo.parent.itemRevOfBOMLine;
    if (removeStructure.uid !== itemRev.uid) {
      continue;
    }
    const isHaveChildren = await _checkHaveChildren(bomlineInfo, functionUid);
    if (!isHaveChildren) {
      const bomLine = bomlineInfo.parent.bomLine;
      await lgepBomUtils.removeChildrenFromParentLine([bomLine]);
    }
  }
};

// 자식 있는지 확인
const _checkHaveChildren = async (bomlineInfo, removedChildUid) => {
  const children = bomlineInfo.children;
  const childrenCnt = children.length;
  if (childrenCnt >= 2) {
    return true;
  }
  if (childrenCnt === 1) {
    for (const child of children) {
      const childItemRev = child.itemRevOfBOMLine;
      if (removedChildUid !== childItemRev.uid) {
        return true;
      }
    }
  }
  return false;
};

export default {
  removeRowAction,
};
