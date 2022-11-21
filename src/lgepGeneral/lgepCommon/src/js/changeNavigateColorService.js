import app from 'app';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import appCtxSvc from 'js/appCtxService';
import common from 'js/utils/lgepCommonUtils';
var $ = require('jQuery');

const guideCommandTitle = lgepLocalizationUtils.getLocalizedText('cmdDesignGuideSystemMessages', 'cmdDesignGuideSystemMessagesTitle');
const helpCommandTitle = lgepLocalizationUtils.getLocalizedText('lgepNoticeBoardMessages', 'lgepNoticeBoardHelperTitle');
const helpDesk = lgepLocalizationUtils.getLocalizedText('lgepNoticeBoardMessages', 'lgepNoticeBoardLocationHeaderTitle');
const guideTitle1 = lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'designSequenceCommandTitle');
const guideTitle2 = lgepLocalizationUtils.getLocalizedText('lgepDFMEAMessages', 'dfmeaLocationHeaderTitle');
const guideTitle3 = lgepLocalizationUtils.getLocalizedText('lgepMasterMessages', 'fmasterlocationHeaderTitle');
const guideTitle4 = lgepLocalizationUtils.getLocalizedText('lgepFMEAInfoMessages', 'fmeaInfoLocationHeaderTitle');
const homeTitle = lgepLocalizationUtils.getLocalizedText('UIMessages', 'browserTitle');
const homeCommandTitle = lgepLocalizationUtils.getLocalizedText('UIMessages', 'homeCommandTitle');
const folderCommandTitle = lgepLocalizationUtils.getLocalizedText('RevisionRuleAdminConstants', 'folder');
const adminCommandTitle = lgepLocalizationUtils.getLocalizedText('lgepCommonMessages', 'classificationCriteriaTitle');
const adminTitle1 = lgepLocalizationUtils.getLocalizedText('lgepUserManagementMessages', 'cmdUserLogsTitle');
const adminTitle2 = lgepLocalizationUtils.getLocalizedText('lgepUserManagementMessages', 'cmdUserManagementTitle');
const adminTitle3 = lgepLocalizationUtils.getLocalizedText('lgepClassificationCommonMessages', 'lgepProductStructureLocationHeaderTitle');
const adminTitle4 = lgepLocalizationUtils.getLocalizedText('lgepUserManagementMessages', 'lgepUserManagementMessagesLocationBrowserTitle');

async function iconClick(data) {
  let commandIcons = document.querySelectorAll('aw-command');
  if (commandIcons) {
    await common.delay(200);
    commandIcons = document.querySelectorAll('aw-command');
  }
  let ctx = appCtxSvc.ctx;
  let title = '';
  //location으로 페이지 지정 되어있는 경우
  if (ctx['location.titles']) {
    title = ctx['location.titles'].headerTitle;
    if (title == helpDesk) {
      title = helpCommandTitle;
    } else if (title == guideTitle1 || title == guideTitle2 || title == guideTitle3 || title == guideTitle4) {
      title = guideCommandTitle;
    } else if (title == adminTitle1 || title == adminTitle2 || title == adminTitle3 || title == adminTitle4) {
      title = adminCommandTitle;
    } else if (title == homeTitle) {
      title = homeCommandTitle;
    }
  } else if (ctx.locationContext.modelObject && ctx.locationContext.modelObject.type == 'Fnd0HomeFolder') {
    title = folderCommandTitle;
  }
  for (let icon of commandIcons) {
    if (icon.title == title) {
      icon.classList.add('selectNavigateCommand');
    } else {
      icon.classList.remove('selectNavigateCommand');
    }
  }
}
let exports = {};

export default exports = {
  iconClick,
};
app.factory('changeNavigateColorService', () => exports);
