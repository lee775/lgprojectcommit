import app from 'app';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import appCtxService from 'js/appCtxService';
import lgepBomUtils from 'js/utils/lgepBomUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

let exports = {};

let dpData_Y = [];

async function setInteractionCheck(treeNode, htmlElement, columnName) {
  // 기능 및 고장과 구조를 구분하기 위해 typeIconURL로 구분하여 저장한다.
  let getIconURL = treeNode.typeIconURL;
  if (!getIconURL) {
    getIconURL = treeNode.iconURL;
  }

  // 구조에만 체크박스 생성
  if (getIconURL.includes('/typeElement')) {
    if (!treeNode.props.l2_is_IM_target) {
      await lgepObjectUtils.getProperties(treeNode, ['l2_is_IM_target']);
    }

    let a = document.createElement('INPUT');
    a.type = 'checkbox';
    a.className = 'interaction_target_check ' + treeNode.uid;

    if (treeNode.props.l2_is_IM_target.dbValues[0] == 'Y') {
      a.checked = true;
    }

    if (dpData_Y.length > 0) {
      let dpData = dpData_Y;

      // console.log('dpData : ', dpData);
      for (let old of dpData) {
        if (old.interactionCheck == 'Y' && old.uid == treeNode.uid) {
          a.checked = true;
        } else if (old.interactionCheck == 'N' && old.uid == treeNode.uid) {
          a.checked = false;
        }
      }
    }

    a.accessKey = treeNode.uid;
    a.addEventListener('click', function (event) {
      setInteractionTarget(treeNode, event);
    });
    htmlElement.appendChild(a);
  }
}

/**
 * 인터랙션? 컬럼의 체크박스 클릭시 발동하는 이벤트
 * @param {*} treeNode
 * @param {*} event
 */
async function setInteractionTarget(treeNode, event) {
  if (event.target.checked) {
    treeNode.interactionCheck = 'Y';
  } else {
    treeNode.interactionCheck = 'N';
  }

  if (dpData_Y.length == 0) {
    dpData_Y.push({ uid: treeNode.uid, type: 'Awb0DesignElement', interactionCheck: treeNode.interactionCheck });
  } else {
    let i = 0;
    for (let y of dpData_Y) {
      if (treeNode.uid == y.uid) {
        dpData_Y.splice(i, 1);
      }
      i++;
    }
    dpData_Y.push({ uid: treeNode.uid, type: 'Awb0DesignElement', interactionCheck: treeNode.interactionCheck });
  }
  appCtxService.ctx.checklist.dpData = dpData_Y;
}

/**
 * BOM 을 Save as 할 때
 * Save as된 BOM의 인터랙션 매트릭스 타겟 정보를 저장
 *
 * @param {*} saveAsBomLines // save as 된 BOM
 * @param {*} selectedObjects // save as 하려고 선택한 BOM
 */
export async function checkSave(saveAsBomLines, selectedObjects) {
  console.log('checkSave');
  for (let bom of saveAsBomLines) {
    if (bom.selected) {
      for (let obj of selectedObjects) {
        if (bom.alternateID == obj.alternateID) {
          if (obj.interactionCheck && obj.interactionCheck != '') {
            // await lgepObjectUtils.setProperties(bom, ['l2_is_IM_target'], [obj.interactionCheck]);

            await lgepBomUtils.saveViewModelEditAndSubmitWorkflow2([bom], ['l2_is_IM_target'], [obj.interactionCheck]);

            obj.interactionCheck = '';
          }
        }
      }
    }
  }
}

/**
 * BOM의 인터랙션 매트릭스 타겟 정보를 저장
 * @param {*} saveAsBomLines // BOM
 */
export async function checkSave2(saveAsBomLines) {
  console.log('checkSave2');
  for (let bom of saveAsBomLines) {
    if (bom.interactionCheck && bom.interactionCheck != '') {
      // await lgepObjectUtils.setProperties(bom, ['l2_is_IM_target'], [bom.interactionCheck]);

      await lgepBomUtils.saveViewModelEditAndSubmitWorkflow2([bom], ['l2_is_IM_target'], [bom.interactionCheck]);

      bom.interactionCheck = '';
    }
  }
}

function interactionMatrixInit() {
  dpData_Y = [];
}

export default exports = {
  setInteractionCheck,
  checkSave,
  checkSave2,
  interactionMatrixInit,
};

app.factory('L2_InteractionMatrixAddService', () => exports);
