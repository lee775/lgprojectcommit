import appCtxService from 'js/appCtxService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import messageUtil from 'js/utils/lgepMessagingUtils';

import { goDFmeaMasterView } from 'js/utils/fmeaCommonUtils';
import { showErrorMessage, getLocalizedMessage, TYPE_INFO, showWarnMessage } from 'js/utils/fmeaMessageUtils';
import { beforeSaveAction } from 'js/utils/fmeaViewCommonUtils';

import { validationInputs } from 'js/utils/fmeaValidationUtils';
import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 복제 기능 실행
 * @param {object} ctx
 * @returns
 */
const duplicateAction = async (ctx, data) => {
  const tableList = ctx[constants.FMEA_TABLE_LIST];
  if (!tableList || tableList.length === 0) {
    showWarnMessage('warnSaveas');
    return;
  }
  try {
    fmeaPopupUtils.openMasterDuplicateName(data.i18n.duplicateButton);
  } catch (err) {
    showErrorMessage(err);
  }
};

const duplicate = async (ctx, data) => {
  try {
    const { dfmeaName } = data;
    // 0. input validation
    validationInputs([dfmeaName]);

    const duplicateName = dfmeaName.dbValues[0];

    beforeSaveAction(data);

    const originRev = ctx[constants.FMEA_SELECT];

    const copyResult = await lgepBomUtils.duplicateFromItemRev(originRev);
    const copyRev = copyResult.clonedItemRev;

    // 2. 이름_copy로 수정 (item, rev )
    await lgepObjectUtils.setProperties(copyRev, [prop.OBJECT_NAME], [duplicateName]);
    const copyItem = await lgepObjectUtils.getItemByItemRevision(copyRev);
    await lgepObjectUtils.setProperties(copyItem, [prop.OBJECT_NAME], [duplicateName]);

    // 3. SOD 복사
    await _copySod(originRev);
    _afterAction(copyRev, copyRev);
  } catch (err) {
    showErrorMessage(err);
  }
};

const _copySod = async (originRev, copyRev) => {
  await lgepObjectUtils.getProperties([copyRev], [prop.REF_SOD_STANDARD]);
  const sodUid = originRev.props[prop.REF_SOD_STANDARD].dbValues[0];
  await lgepObjectUtils.setProperties(copyRev, [prop.REF_SOD_STANDARD], sodUid);
};

/**
 * 복제 완료 후 ctx set 및 메시지 호출
 * @param {ModelObject} copyRev
 */
const _afterAction = (copyRev) => {
  appCtxService.registerCtx(constants.FMEA_POPUP, false);
  messageUtil.showWithParams(
    TYPE_INFO,
    getLocalizedMessage('successSaveas'),
    [],
    ['Yes', 'No'],
    [
      function () {
        try {
          delete appCtxService.ctx[constants.FMEA_TABLE_LIST];
          goDFmeaMasterView(copyRev);
        } catch (e) {
          showErrorMessage(e);
        }
      },
      function () {
        fmeaPopupUtils.closePopup();
        return;
      },
    ],
  );
};

export default {
  duplicateAction,
  duplicate,
};
