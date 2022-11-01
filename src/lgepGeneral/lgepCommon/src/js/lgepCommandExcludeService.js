import app from 'app';
import eventBus from 'js/eventBus';

let exports = [];

export var excludeMap = new Map();
// excludeMap.set("com.siemens.splm.clientfx.tcui.xrt.objectNavigationSubLocation", "Awp0ModelObjListDisplayToggles");
excludeMap.set('funcmaster', ['Awp0Paste', 'Awp0ExportToExcel']);
excludeMap.set('failuremaster', ['Awp0Paste', 'Awp0ExportToExcel']);

function excludeCommands(data, ctx) {
  eventBus.subscribe('soa.getVisibleCommands', function (e) {
    _excludeCommandWithMap(data, ctx, e);
  });
  eventBus.subscribe('load-commands', function (e) {
    _excludeCommandWithMap(data, ctx, e);
  });
}

function _excludeCommandWithMap(data, ctx, e) {
  for (let key of excludeMap.keys()) {
    let values = excludeMap.get(key);
    try {
      if (ctx.workspace.excludedCommands && ctx.sublocation.nameToken === key) {
        for (const value of values) {
            if (!ctx.workspace.excludedCommands.includes(value)) {
              ctx.workspace.excludedCommands.push(value);
            }
        }
      } else {
        for (const value of values) {
            if (ctx.workspace.excludedCommands.includes(value)) {
              ctx.workspace.excludedCommands.filter((element) => element !== value);
            }
        }
      }
    } catch (e) {
      //
    }
  }
}

export default exports = {
  excludeCommands,
  excludeMap,
};
