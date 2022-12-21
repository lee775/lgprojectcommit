import app from 'app';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import appCtxSvc from 'js/appCtxService';
import common from 'js/utils/lgepCommonUtils';
import browserUtils from 'js/browserUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
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

export function cmdNavigateToTargetAction(messageUid, targetUid) {
  let message = lgepObjectUtils.getObject(messageUid);
  let target = lgepObjectUtils.getObject(targetUid);
  // // 여기에 각자 객체 별로 페이지 UID를 넣어주세요. (예: 개발지식)
  // if (target.type == 'L2_ItemRevision') {
  //   window.location.href = browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + targetUid;
  // } else {
  //   window.location.href = browserUtils.getBaseURL() + '#/com.siemens.splm.clientfx.tcui.xrt.showObject?uid=' + messageUid;
  // }

  // 공통모듈 일반 댓글, 전문가 댓글 알림 navigate
  if (target.type == 'L2_QuestionRevision') {
    window.location.href = browserUtils.getBaseURL() + '#/questionAnswer?question=' + targetUid;
  } else if (target.type == 'L2_QuestionExpRevision') {
    window.location.href = browserUtils.getBaseURL() + '#/askExpert?question=' + targetUid;
  }

  for (const tag of document.getElementsByTagName('aw-popup-panel2')) {
    tag.parentElement.removeChild(tag);
  }
  lgepObjectUtils.setProperty(message, 'fnd0MessageReadFlag', 'true');
  console.log({ messageUid, targetUid });
}

let exports = {};

export default exports = {
  iconClick,
  cmdNavigateToTargetAction,
};
app.factory('changeNavigateColorService', () => exports);
