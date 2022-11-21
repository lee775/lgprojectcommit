import app from 'app';
import SoaService from 'soa/kernel/soaService';
import query from 'js/utils/lgepQueryUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import com from 'js/utils/lgepObjectUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import common from 'js/utils/lgepCommonUtils';
import fmsUtils from 'js/fmsUtils';
import _ from 'lodash';
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import viewC from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import L2_DesignStandardService from 'js/L2_DesignStandardService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import vms from 'js/viewModelService';
import message from 'js/utils/lgepMessagingUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import browserUtils from 'js/browserUtils';

var $ = require('jQuery');

async function testAc(ctx) {
  //console.log("작동 확인",{ctx});
  let selItem = ctx.selected;
  // window.open(browserUtils.getBaseURL() + "#/L2_DesignStandard");
  location.href = browserUtils.getBaseURL() + '#/L2_DesignStandard';
  let whTrue = true;
  let standardNavData;
  while (whTrue) {
    await common.delay(100);
    standardNavData = vms.getViewModelUsingElement(document.getElementById('stdTreeNavData'));
    if (standardNavData) {
      break;
    }
  }
  await com.getProperties(selItem, ['l2_reference_book']);
  //console.log("선택된 아이템",{selItem});
  let book = com.getObject(selItem.props.l2_reference_book.dbValue);
  await com.getProperties(book, ['revision_list']);
  let bookRev = com.getObject(book.props.revision_list.dbValues[book.props.revision_list.dbValues.length - 1]);
  // console.log("나옴",{bookRev});
  L2_DesignStandardService.bomlineTreeSet4(bookRev);
}

let exports = {};

export default exports = {
  testAc,
};

app.factory('L2_StandardStyleSheetService', () => exports);
