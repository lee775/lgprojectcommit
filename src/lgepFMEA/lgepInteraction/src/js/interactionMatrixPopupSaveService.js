import eventBus from 'js/eventBus';
import SoaService from 'soa/kernel/soaService';

import lgepQueryUtils from 'js/utils/lgepQueryUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { showErrorMessage, showInfoMessage } from 'js/utils/fmeaMessageUtils';
import { STRUCTURE_LIST, TOP } from 'js/interactionMatrixPopupService';
import { PROP_PRIMARY, PROP_SECONDARY, PROP_GRADE, GRID_TABLE, PROP_INTERACTION_TABLE, INTERACTION_TABLES } from 'js/interactionMatrixPopupTableService';

const TYPE_TABLE_ROW = 'L2_InteractionTableRow';

// 편집한 Interaction Matrix 저장
const saveInteractionMatrix = () => {
  _beforeSaveAction();
  try {
    const rows = GRID_TABLE.getData();
    const structures = _getStructures(rows[0]);
    const topObject = STRUCTURE_LIST[TOP].parent['itemRevOfBOMLine'];
    for (const row of rows) {
      const primaryUid = row.id;
      for (const structureName of structures) {
        let interactionType = row[structureName];
        if (!interactionType) {
          continue;
        }
        const secondaryObjectUid = GRID_TABLE.getColumn(structureName).className;
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
  GRID_TABLE.disable();
};

// 저장 후 액션 모음
const _afterSaveAction = () => {
  GRID_TABLE.enable();
  // _disableCells(grid.getData());
  eventBus.publish('removeMessages');
  const globalDocument = document.children[0];
  globalDocument.classList.remove('dfmea-job-progressing');
  showInfoMessage('successComplete');
};

export default {
  saveInteractionMatrix,
};
