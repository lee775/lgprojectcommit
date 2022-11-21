/**
 * TextTable Interaction 관련 서비스
 * @module js/dfmeaMasterTextTableInteractionService
 */
import appCtxService from 'js/appCtxService';

import { getStructureUidUntilSubAssy } from 'js/utils/fmeaCommonUtils';
import * as constants from 'js/constants/fmeaConstants';

export const initOnTextTable = (ctx) => {
  const id = constants.INTERACTION_INIT_SELECT_CLASSNAME;
  constants.INTERACTION_INIT_SELECT_CLASSNAME;
  const selectEls = document.querySelectorAll('.aw-splm-tableRow[aria-selected="true"]');
  for (const selectEl of selectEls) {
    selectEl.setAttribute('id', id);
  }
};

const focusTableRow = (ctx, provider) => {
  const interactionRow = ctx[constants.INTERACTION_ROW];
  if (interactionRow) {
    _setInteractionRow(ctx, provider, interactionRow);
  } else {
    const initSelect = appCtxService.ctx[constants.ROW_SELECT];
    provider.selectionModel.setSelection(initSelect);
  }
};

const _setInteractionRow = (ctx, provider, interactionRow) => {
  const textTableRows = ctx[constants.FMEA_TABLE_LIST];
  for (const row of textTableRows) {
    const structureUid = getStructureUidUntilSubAssy(row);
    if (interactionRow.uid === structureUid) {
      provider.selectionModel.setSelection(row);
      _addStyleBySameStructure(textTableRows, row, constants.INTERACTION_INIT_SAME_SELECT);
      return;
    }
  }
};

const _addStyleBySameStructure = (textTableRows, selectRow, id) => {
  // const selectRowName = getPartName(selectRow);
  // for (let index = 0; index < textTableRows.length; index++) {
  //   const row = textTableRows[index];
  //   const rowName = getPartName(row);
  //   if (selectRowName === rowName) {
  //     const sameStructureLines = document.querySelectorAll(
  //       `.aw-splm-tableRow[data-indexnumber="${index}"]`
  //     );
  //     for (const line of sameStructureLines) {
  //       line.setAttribute('id', id);
  //     }
  //   }
  // }
};

export default {
  focusTableRow,
};
