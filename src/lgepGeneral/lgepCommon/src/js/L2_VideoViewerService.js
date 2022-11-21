/**
 * Simple Alert service for sample command Handlers
 *
 * @module js/L2_VideoViewerService
 */

/**
 */
export let initialize = function (data, ctx) {};
export let unMount = function (data, ctx) {
  ctx.preview = undefined;
  ctx.support = undefined;
};

export default {
  initialize,
  unMount,
};
