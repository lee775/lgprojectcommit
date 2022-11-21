import app from 'app';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import msg from 'js/utils/lgepMessagingUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import Grid from 'tui-grid';
import 'tui-grid/dist/tui-grid.css';

import { setTuiGridStyle } from 'js/sodAPTableService';

let exports = [];

export function loadData(ctx, data) {
  //console.log("실행");
  //console.log(data);
  const rowData = new Array();
  for (var i = 1; i <= 2; i++) {
    var data = new Object();

    data.you = 'Test' + i;

    rowData.push(data);
  }
  let ctxColumns = [];

  let columnNames = ctx.selected.props;

  var testList = new Array();

  for (var i = 1; i <= 2; i++) {
    var data = new Object();

    data.header = i;
    data.name = 'you';

    testList.push(data);
  }

  //console.log(testList);

  const grid = new Grid({
    el: document.getElementById('checkListGrid'),
    data: rowData,
    columns: testList,
  });
  //   //console.log(grid);
  setTuiGridStyle(ctx);
}

export default exports = {
  loadData,
};
