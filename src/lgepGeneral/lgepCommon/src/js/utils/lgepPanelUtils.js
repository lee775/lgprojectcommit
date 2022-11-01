// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import commandPanelService from 'js/commandPanel.service';
import eventBus from 'js/eventBus';

let exports = {};

/**
 * 
 * @param {*} view - view 이름(xxxView.html 일 경우 xxx)
 * @param {*} location - 위치 (aw_toolsAndInfo, aw_navigation, ...)
 * @returns 
 */
export const openCommandPanel = function (view, location = "aw_toolsAndInfo") {
    return commandPanelService.activateCommandPanel(view, location);
};

export const closeCommandPanel = function () {
    eventBus.publish('complete', {
        source: 'toolAndInfoPanel'
    });
};

export default exports = {
    openCommandPanel,
    closeCommandPanel
};
app.factory('lgepPanelUtils', () => exports);