/**
 * DFMEA Master Row 추가 서비스
 */
import appCtxService from 'js/appCtxService';

import { saveOperation } from 'js/fmeaMasterAddOperationService';
import { setValue } from 'js/utils/fmeaEditorUtils';
import { beforeSaveAction, afterSaveAction, tableRefreshByTableMode } from 'js/utils/fmeaViewCommonUtils';
import { showErrorMessage, showInfoMessage } from 'js/utils/fmeaMessageUtils';
import { validationInputs } from 'js/utils/fmeaValidationUtils';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

import eventBus from 'js/eventBus';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';

/**
 * Row Add Action
 * @param {*} data
 */
const saveAction = async (ctx, data) => {
  let globalDocument = document.children[0];
  const { parentAssy, functionData } = data;

  try {
    validationInputs([parentAssy, functionData]);

    lgepMessagingUtils.show('INFO', '잠시만 기다려주세요.');
    globalDocument.classList.add('dfmea-job-progressing');

    _beforeSaveAction(data);

    const reviseRevision = await saveOperation(ctx, data);

    delete appCtxService.ctx[constants.FMEA_TABLE_LIST];

    // 초기 생성 아닌 경우 개정
    // if (reviseRevision) {
    //   goDFmeaMasterView(reviseRevision);
    // }

    // table refresh
    tableRefreshByTableMode();
    showInfoMessage('successComplete');
  } catch (e) {
    //console.log(e);
    showErrorMessage(e);
  } finally {
    eventBus.publish('removeMessages');
    globalDocument.classList.remove('dfmea-job-progressing');
  }
};

// 생성 오퍼레이션 시작 전 progress, 생성버튼 disable
const _beforeSaveAction = (data) => {
  beforeSaveAction(data);
  appCtxService.registerCtx(constants.FMEA_EXECUTE, constants.FMEA_EXECUTE_SAVE);
};

// table refresh 되면 popup창 close
const endSave = (data) => {
  afterSaveAction(data);
};

/**
 * 고장 List에서 고장 선택하면 에디터 업데이트
 * @param {*} functionData
 */
const selectionFailure = (failureData) => {
  const value = failureData.dbValue !== '' ? failureData.dbValue : '';
  setValue(prop.POTENTIAL_FAILURE_MODE + constants.CREATE_SUFFIX, value);
};

/**
 * 기능 List에서 기능 선택하면 에디터 업데이트
 * @param {*} functionData
 */
const selectionFunction = (functionData) => {
  const value = functionData.dbValue !== '' ? functionData.dbValue : '';
  setValue(prop.FUNCTION + constants.CREATE_SUFFIX, value);
};

const selectionSeverity = (currentValue) => {
  const severity = [currentValue.dbValue];
  return { severity };
};

const selectionOccurence = (currentValue) => {
  const occurence = [currentValue.dbValue];
  return { occurence };
};

const selectionDetection = (currentValue) => {
  const detection = [currentValue.dbValue];
  return { detection };
};

export default {
  saveAction,
  selectionFailure,
  selectionFunction,
  endSave,
  selectionSeverity,
  selectionOccurence,
  selectionDetection,
};
