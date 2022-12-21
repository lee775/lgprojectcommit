import localeService from 'js/localeService';
import appCtxService from 'js/appCtxService';

import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

export const TOP = 'top';
export const PARENT_ASSY = 'parentAssy';
export const SUB_ASSY = 'subAssy';
export const PARENT_ASSY_UID = 'parentUid';
export const STRUCTURE_INFO = 'interaction_structure_info';
export const PROP_PRIMARY = 'l2_primary';
export const PROP_SECONDARY = 'l2_secondary';
export const PROP_GRADE = 'l2_grade';
export const PROP_INTERACTION_TABLE = 'l2_interaction_table';
export const INTERACTION_TARGET_ROW = 'interaction_target_row'; // 영향성 체크 할 row
export const INTERACTION_TARGET_SELECT_CLASSNAME = 'interaction-target-select'; // 영향성 체크 할 row css
export const INTERACTION_CHECK_ROW_CLASSNAME = 'interaction-check'; // 영향성 체크 대상 css
export const INTERACTION_CHECK_ROW_KEYS = 'interaction-check-keys';

const TYPE_INTERACTION_ROW = 'L2_InteractionTableRow';

export const INTERACTION_TYPES = [
  {
    propDisplayValue: 'A: 기계적',
    propInternalValue: 'A',
  },
  {
    propDisplayValue: 'B: 전기적',
    propInternalValue: 'B',
  },
  {
    propDisplayValue: 'C: 열',
    propInternalValue: 'C',
  },
  {
    propDisplayValue: 'D: 화학적',
    propInternalValue: 'D',
  },
  {
    propDisplayValue: 'E: 방사적',
    propInternalValue: 'E',
  },
  {
    propDisplayValue: 'AB: 기계 - 전기',
    propInternalValue: 'AB',
  },
  {
    propDisplayValue: 'AC: 기계 - 열',
    propInternalValue: 'AC',
  },
  {
    propDisplayValue: 'AD: 기계 - 화학',
    propInternalValue: 'AD',
  },
];

export const getInteractionType = (grade) => {
  return INTERACTION_TYPES.filter((type) => grade === type.propInternalValue)[0].propDisplayValue;
};

export const getInteractionTable = async (topObject) => {
  const interactionTableUids = topObject.props[PROP_INTERACTION_TABLE].dbValues;
  const interactionTable = await Promise.all(
    interactionTableUids.map(async (uid) => {
      return await loadObjectByPolicy(uid, TYPE_INTERACTION_ROW, [PROP_PRIMARY, PROP_SECONDARY, PROP_GRADE]);
    }),
  );
  return interactionTable;
};

export const getLang = () => {
  return localeService.getLocale() === 'ko_KR' ? 1 : 2;
};

export const getInteractionStructureInfo = async () => {
  const allChecklistRows = appCtxService.ctx.checklist.allChecklistRows;
  const topLine = allChecklistRows[appCtxService.ctx.checklist.topLine.uid];
  const structureInfo = {
    [PARENT_ASSY]: [],
    [SUB_ASSY]: [],
  };

  structureInfo[TOP] = topLine; // 시트
  let parentArray = [];
  let subArray = [];
  for (const structure of Object.values(allChecklistRows)) {
    try {
      await lgepObjectUtils.getProperties(structure.getObject(), 'l2_is_IM_target');
      if (structure.type == 'L2_StructureRevision' && structure.getObject().props.l2_is_IM_target.dbValues[0] == 'Y') {
        let parentAssy = structure.getParent();
        let subAssy = structure;
        if (!parentArray.includes(parentAssy.getOriginalObject().uid)) {
          structureInfo[PARENT_ASSY] = [...structureInfo[PARENT_ASSY], parentAssy];
          parentArray.push(parentAssy.getOriginalObject().uid);
        }
        if (!subArray.includes(subAssy.getOriginalObject().uid)) {
          structureInfo[SUB_ASSY] = [...structureInfo[SUB_ASSY], subAssy];
          subArray.push(subAssy.getOriginalObject().uid);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
  appCtxService.ctx.checklist[STRUCTURE_INFO] = structureInfo;
};

export const getSubAssy = (selectRow) => {
  const tableMode = appCtxService.ctx.checklist.tableMode;
  if (tableMode == 3) {
    return selectRow.getOriginalObject();
  } else {
    return selectRow.parent.parent.getOriginalObject();
  }
};
