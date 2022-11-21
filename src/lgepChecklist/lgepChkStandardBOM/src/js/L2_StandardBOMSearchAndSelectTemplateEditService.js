import app from 'app';
import { ctx } from 'js/appCtxService';
import notySvc from 'js/NotyModule';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import eventBus from 'js/eventBus';
import { _readPropertiesFromTextFile } from 'js/L2_ChecklistMasterCreateService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import _ from 'lodash';

let exports = {};

// 템플릿 추가 패널 오픈
function addTemplate() {
  notySvc.setTimeout(lgepMessagingUtils.INFORMATION, 100);
  if (
    !ctx.checklist.standardBOM.eventData ||
    !ctx.checklist.standardBOM.eventData ||
    !ctx.checklist.standardBOM.eventData.selectedObjects ||
    ctx.checklist.standardBOM.eventData.selectedObjects[0].type !== 'Folder'
  ) {
    notySvc.showInfo('폴더를 선택해주세요');
    return;
  }
  ctx.checklist.standardBOM.addTemplateFolder = ctx.checklist.standardBOM.eventData.selectedObjects[0];
  ctx.checklist.standardBOM.addTemplate = true;
  const panelData = {
    id: 'checklist_addStructure',
    includeView: 'L2_TemplateAdd',
    closeWhenCommandHidden: true,
    keepOthersOpen: true,
    commandId: 'checklist_addStructure',
    config: {
      width: 'STANDARD',
      height: 'LARGE',
    },
  };
  eventBus.publish('awsidenav.openClose', panelData);
}

// 템플릿 추가 실행
async function addTemplateSave(data) {
  const templateName = data.nameBox.dbValues[0];
  if (!templateName) {
    notySvc.showInfo('템플릿명을 입력해주세요');
    return;
  }
  const productType = ctx.userSession.props.group_name.dbValues[0];
  const templateFolder = ctx.checklist.standardBOM.addTemplateFolder;
  const productClass = templateFolder.displayName;
  const props = ['l2_is_checklist', 'l2_is_checklist_target', 'l2_is_template', 'l2_product_type', 'l2_product_class'];
  const container = await lgepObjectUtils.loadObject2(templateFolder.id);
  const newObject = await lgepObjectUtils.createItem('', 'L2_Structure', templateName, '', container);
  const newItem = newObject.output[0].item;

  lgepObjectUtils.setProperties(newItem, props, ['N', 'N', 'Y', productType, productClass]);

  delete ctx.checklist.standardBOM.addTemplate;
  eventBus.publish('standardBOMFolderTree.plTable.reload');
  eventBus.publish('awsidenav.openClose', {});
}

// panel close event
function onUnmountOnStructureCreatePanel() {
  delete ctx.checklist.standardBOM.addTemplate;
}

let selectedTemplateItemRevision;

// 템플릿 복제
function duplicateTemplate() {
  // 1. 로우 안누르고 복제 누르면 메시지 호출
  if (!selectedTemplateItemRevision) {
    notySvc.setTimeout(lgepMessagingUtils.INFORMATION, 300);
    notySvc.showInfo('로우를 선택해주세요');
  }
  // 2. 로우 누르고 복제 누르면 봄 복제 (다 새객체?)
  // 3. 데이터셋...
}

export default exports = {
  addTemplate,
  onUnmountOnStructureCreatePanel,
  addTemplateSave,
  duplicateTemplate,
};

/**
 * @memberof NgServices
 * @member L2_StandardBOMSearchAndSelectTemplateEditService
 */
app.factory('L2_StandardBOMSearchAndSelectTemplateEditService', () => exports);
