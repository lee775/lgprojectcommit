import app from 'app';
import appCtxService from 'js/appCtxService';

import { openInteractionPopup } from 'js/L2_interactionMatrixPopupService';
import { openInteractionPanel } from 'js/L2_ChecklistInteractionCheckPanelService';

var exports = {};

// 영향성 체크
export function openEffectivityCheck() {
  openInteractionPanel();
}

// 인터랙션 매트릭스
export function openInteractionMatrix() {
  openInteractionPopup(appCtxService.ctx);
}

export function openChecklistSod() {
  alert('openChecklistSod');
}

export default exports = {
  openEffectivityCheck,
  openInteractionMatrix,
  openChecklistSod,
};

app.factory('L2_ChecklistInteractionService', () => exports);
