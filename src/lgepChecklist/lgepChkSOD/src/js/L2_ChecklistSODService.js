import app from 'app';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';

var exports = {};

export function openChecklistSod() {
  lgepPopupUtils.openPopup('L2_ChecklistSOD', 'SOD Master', '1200', '600', true, false, false);
}

export default exports = {
  openChecklistSod,
};

app.factory('L2_ChecklistSODService', () => exports);
