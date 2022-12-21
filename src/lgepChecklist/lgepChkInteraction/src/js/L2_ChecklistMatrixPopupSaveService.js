import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';
import SoaService from 'soa/kernel/soaService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { showErrorMessage, showInfoMessage } from 'js/utils/fmeaMessageUtils';
import { gridTable, INTERACTION_TABLES } from 'js/L2_interactionMatrixPopupTableService';
import { PROP_PRIMARY, PROP_SECONDARY, PROP_GRADE, PROP_INTERACTION_TABLE, TOP, STRUCTURE_INFO } from 'js/L2_ChecklistInteractionUtils';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';

const TYPE_TABLE_ROW = 'L2_InteractionTableRow';
let cancel = lgepLocalizationUtils.getLocalizedText('lgepInteractionMatrixMessages', 'cancel');
let justClose = lgepLocalizationUtils.getLocalizedText('lgepInteractionMatrixMessages', 'justClose');
let closeAfterSave = lgepLocalizationUtils.getLocalizedText('lgepInteractionMatrixMessages', 'closeAfterSave');
let askQuestion = lgepLocalizationUtils.getLocalizedText('lgepInteractionMatrixMessages', 'askQuestion');
let checkSave;
let savePass = false;
let test = null;
const saveInteractionMatrix = () => {
  _beforeSaveAction();
  try {
    const rows = gridTable.getData();
    const structureNames = _getStructures(rows[0]);
    const topObject = appCtxService.ctx.checklist[STRUCTURE_INFO][TOP].getOriginalObject();
    for (const row of rows) {
      const primaryUid = row.id;
      for (const structureName of structureNames) {
        let interactionType = row[structureName];
        if (!interactionType) {
          continue;
        }
        const secondaryObjectUid = gridTable.getColumn(structureName).className;
        const existRow = _getExistTableRow(primaryUid, secondaryObjectUid);
        if (!existRow) {
          // 생성
          _createTableRow(primaryUid, secondaryObjectUid, interactionType, topObject);
        } else {
          // type 다르면 setProeprty
          const existRowInteractionType = existRow.props[PROP_GRADE].dbValues[0];
          if (interactionType !== existRowInteractionType) {
            interactionType = interactionType === '-' ? '' : interactionType; // '-'는 공백 처리
            lgepObjectUtils.setProperty(existRow, PROP_GRADE, interactionType);
          }
        }
      }
    }
  } catch (error) {
    showErrorMessage(error);
  } finally {
    _afterSaveAction();
  }
};

// interaction row 이미 존재하면 반환
const _getExistTableRow = (primaryUid, secondaryUid) => {
  for (const interactionRow of INTERACTION_TABLES) {
    const rowPrimaryObjectUid = interactionRow.props[PROP_PRIMARY].dbValues[0];
    const rowSecondaryUid = interactionRow.props[PROP_SECONDARY].dbValues[0];
    if (rowPrimaryObjectUid === primaryUid && secondaryUid === rowSecondaryUid) {
      return interactionRow;
    }
  }
};

// interaction row 생성
const _createTableRow = async (primaryUid, secondaryUid, grade, topObject) => {
  const soaInputParam = {
    input: [
      {
        clientId: '',
        data: {
          boName: TYPE_TABLE_ROW,
          stringProps: {
            [PROP_PRIMARY]: primaryUid,
            [PROP_SECONDARY]: secondaryUid,
            [PROP_GRADE]: grade,
          },
        },
      },
    ],
  };

  const result = await SoaService.post('Core-2008-06-DataManagement', 'createObjects', soaInputParam);

  const newInteractionRow = result.output[0].objects[0];
  lgepObjectUtils.addChildren(topObject, [newInteractionRow], PROP_INTERACTION_TABLE);
};

const _getStructures = (row) => {
  const propKeys = ['id', 'interactionHeader', 'name', 'rowKey', '_attributes', 'classHeader'];
  const structures = Object.keys(row).filter((r) => {
    for (const key of propKeys) {
      if (r === key) {
        return false;
      }
    }
    return true;
  });

  return structures;
};

// 저장 처리 전 액션 모음 (table disable, 진행 message 호출..)
const _beforeSaveAction = () => {
  showInfoMessage('interactionEditStart');
  const globalDocument = document.children[0];
  globalDocument.classList.add('dfmea-job-progressing');
  gridTable.disable();
};

// 저장 후 액션 모음
const _afterSaveAction = () => {
  gridTable.enable();
  let rowD = gridTable.getData();
  _keepDisable(rowD);
  eventBus.publish('removeMessages');
  const globalDocument = document.children[0];
  globalDocument.classList.remove('dfmea-job-progressing');
  showInfoMessage('successComplete');
  savePass = true;
};

const _keepDisable = (rowD) => {
  for (let i = 0; i < rowD.length; i++) {
    gridTable.disableCell(i, rowD[i].id);
  }
};

const _closePopup = () => {
  let nowPopup = document.getElementById('interactionMatrixPopup');
  nowPopup.parentElement.removeChild(nowPopup);
  window.onbeforeunload = function (e) {
    return e.preventDefault();
  };
};

export async function beforeClose() {
  if (savePass) {
    _closePopup();
    savePass = false;
  } else {
    checkSave = false;
    const rows = gridTable.getData();
    if (rows.length == 0) {
      _closePopup();
      return;
    } else {
      const structureNames = _getStructures(rows[0]);
      const topObject = appCtxService.ctx.checklist[STRUCTURE_INFO][TOP].getOriginalObject();
      for (const row of rows) {
        const primaryUid = row.id;
        for (const structureName of structureNames) {
          let interactionType = row[structureName];
          if (!interactionType) {
            continue;
          }
          const secondaryObjectUid = gridTable.getColumn(structureName).className;

          const existRow = _getExistTableRow(primaryUid, secondaryObjectUid);

          if (!existRow) {
            // 생성
            if (interactionType == '-') {
              checkSave = false;
            } else {
              checkSave = true;
            }
          } else {
            // type 다르면 setProeprty
            const existRowInteractionType = existRow.props[PROP_GRADE].dbValues[0];
            if (interactionType !== existRowInteractionType) {
              if (interactionType === '-' && existRowInteractionType == null) {
                checkSave = false;
              } else {
                checkSave = true;
              }
            }
          }
        }
      }
    }

    if (checkSave == true) {
      lgepMessagingUtils.show(
        0,
        askQuestion,
        [cancel, justClose, closeAfterSave],
        [
          function () {},
          function () {
            _closePopup();
            savePass = false;
          },
          function () {
            saveInteractionMatrix();
            _closePopup();
            savePass = false;
          },
        ],
      );
    } else {
      _closePopup();
      savePass = false;
    }
  }
}

export default {
  saveInteractionMatrix,
  beforeClose,
};
