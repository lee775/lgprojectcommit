import eventBus from 'js/eventBus';
import appCtxService from 'js/appCtxService';

import { FMEA_PANEL, FMEA_POPUP } from 'js/constants/fmeaConstants';

export const openSubPanel = (id, view) => {
  const data = {
    id: id,
    includeView: view,
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: id,
    config: {
      width: 'WIDE',
    },
  };
  appCtxService.registerCtx(FMEA_POPUP, true);
  appCtxService.registerCtx(FMEA_PANEL, true);
  eventBus.publish('awsidenav.openClose', data);
};

export const closePanel = () => {
  delete appCtxService.ctx[FMEA_PANEL];
  appCtxService.registerCtx(FMEA_POPUP, false);
  eventBus.publish('awsidenav.openClose', {});
};

export default {
  openSubPanel,
  closePanel,
};
