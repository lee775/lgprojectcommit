import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import fmeaPopupUtils from 'js/utils/fmeaPopupUtils';
import { validationInputs } from 'js/utils/fmeaValidationUtils';
import {
  afterSaveAction,
  beforeSaveAction,
  tableRefresh,
} from 'js/utils/fmeaViewCommonUtils';
import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import * as prop from 'js/constants/fmeaProperty';
import * as constants from 'js/constants/fmeaConstants';

const editDfmeaMaster = (htmlPanel, title) => {
  fmeaPopupUtils.openDfmeaCreatePopup(htmlPanel, title);
};

const onMount = (ctx) => {
  const fmea = ctx[constants.FMEA_SELECT];
  const initName = fmea.props[prop.OBJECT_NAME].dbValues[0];
  return { initName };
};

const editAction = async (data, ctx) => {
  const { changeName } = data;

  try {
    validationInputs([changeName]);

    // 2. button disable, progress
    beforeSaveAction(data);

    const changeNameValue = changeName.dbValues[0];

    // set item, revs
    const fmea = ctx[constants.FMEA_SELECT];
    await lgepObjectUtils.setProperties(
      fmea,
      [prop.OBJECT_NAME],
      [changeNameValue]
    );

    await lgepObjectUtils.getProperties([fmea], [prop.REVISION_LIST]);
    for (const revUid of fmea.props[prop.REVISION_LIST].dbValues) {
      const revision = await lgepObjectUtils.getObject(revUid);
      await lgepObjectUtils.setProperties(
        revision,
        [prop.OBJECT_NAME],
        [changeNameValue]
      );
    }

    afterSaveAction(data);
    fmeaPopupUtils.closePopup();
    tableRefresh('dfmeaListTable');
  } catch (e) {
    showErrorMessage(e);
  } finally {
    afterSaveAction(data);
  }
};

export default {
  editDfmeaMaster,
  onMount,
  editAction,
};
