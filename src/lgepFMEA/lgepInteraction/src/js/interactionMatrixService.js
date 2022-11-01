import app from 'app';
import _ from 'lodash';

import appCtxService from 'js/appCtxService';
import eventBus from 'js/eventBus';

import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';

import { initTable } from 'js/interactionMatrixTableService';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

var $ = require('jQuery');

var exports = {};
let grid;

export async function initialize(data, ctx) {

  // 0. Waiting for Popup Opened
  await _waitPopupOpen();

  // 0. Resize listener for popup
  _resizePoup();

  grid = await initTable(ctx);

  appCtxService.registerCtx(constants.FMEA_INERATION_INIT, true);
}

const _waitPopupOpen = async () => {
  let times = 0;
  while (!document.getElementById('interaction-grid"') && times < 10) {
    await lgepCommonUtils.delay(100);
    times++;
  }
};

const _resizePoup = () => {
  try {
    let height = document.childNodes[1].offsetHeight;
    let width = document.childNodes[1].offsetWidth;
    document
      .getElementsByClassName('aw-popup-contentContainer')[0]
      .children[0].setAttribute(
        'style',
        'height: ' + (height - 20) + 'px; width: ' + (width - 40) + 'px;'
      );
    window.onresize = function () {
      try {
        let height = document.childNodes[1].offsetHeight;
        let width = document.childNodes[1].offsetWidth;
        document
          .getElementsByClassName('aw-popup-contentContainer')[0]
          .children[0].setAttribute(
            'style',
            'height: ' + (height - 20) + 'px; width: ' + (width - 40) + 'px;'
          );
      } catch (error) {
        console.error('Failed to execute popup resizing');
      }
    };
  } catch (error) {
    console.error('Failed to execute popup resizing');
  }
};

//  Save button event
const saveInteractionMatrix = async () => {
  grid.setSelectionRange({ start: [0, 0], end: [0, 0] });
  lgepMessagingUtils.show('INFO', '편집을 시작합니다. 잠시만 기다려주세요.');
  let globalDocument = document.children[0];
  globalDocument.classList.add('dfmea-job-progressing');
  try {
    grid.disable();
    let rows = grid.getData();
    for (const row of rows) {
      let id = row.id;
      let name = row.name;
      delete row['classHeader'];
      delete row['interactionHeader'];
      delete row['rowKey'];
      delete row['id'];
      delete row['name'];
      delete row['_attributes'];
      let objectNames = Object.keys(row);
      let interactionHeaders = appCtxService.getCtx('interactionHeaders');
      for (const key of objectNames) {
        let primaryObjectUid = id;
        let secondaryObjectUid = interactionHeaders[key];
        let interactionType = row[key];
        if (!interactionType || interactionType == '') {
          continue;
        }
        let primaryObject = lgepObjectUtils.getObject(primaryObjectUid);
        if (primaryObject.props[prop.RELATION_INTERACTION].dbValues.length > 0) {
          await lgepObjectUtils.deleteRelations(
            prop.RELATION_INTERACTION,
            primaryObject,
            { uid: secondaryObjectUid, type: prop.TYPE_FMEA_STRUCTURE_REV }
          );
          if (interactionType == '-' || interactionType == ' - ') {
            continue;
          }
        }
        let value = await lgepObjectUtils.createRelation(
          prop.RELATION_INTERACTION,
          { uid: primaryObjectUid, type: prop.TYPE_FMEA_STRUCTURE_REV },
          { uid: secondaryObjectUid, type: prop.TYPE_FMEA_STRUCTURE_REV }
        );
        let relation = value.output[0].relation;
        await lgepObjectUtils.setProperty(
          relation,
          prop.INNTERACTION_TYPE,
          interactionType
        );
      }
    }
  } catch (error) {
    console.error(error.message);
  } finally {
    lgepPopupUtils.closePopup();
    eventBus.publish('removeMessages');
    globalDocument.classList.remove('dfmea-job-progressing');
    lgepMessagingUtils.show('INFO', '편집이 완료되었습니다.');
  }
};

export default exports = {
  initialize,
  saveInteractionMatrix,
};

app.factory('interactionMatrixService', () => exports);
