import app from 'app';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import msg from 'js/utils/lgepMessagingUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import bomUtils from 'js/utils/lgepBomUtils';
import popupService from 'js/popupService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

let exports = [];
var $ = require('jQuery');
export async function goToLink(ctx, data) {
  //console.log(ctx);
  //console.log(data);
  let groupName = ctx.userSession.props.group_name.dbValues[0];
  //console.log(groupName);

  //클릭한 아이템의 부모 객체
  let parent = await com.getObject(ctx.selected.props.awb0Parent.dbValues[0]);
  //console.log(parent);

  //클릭한 객체의 이름이 Template을 포함하면
  if (ctx.selected.props.object_string.dbValues[0].includes('Template')) {
    msg.show(1, `템플릿 하위 항목을 선택해주세요.`, ['닫기'], [function () {}]);
  } else {
    if (groupName === 'dba') {
      msg.show(1, `그룹이 dba로 설정되어있습니다. 그룹을 설정해주세요.`, ['닫기'], [function () {}]);
    }
    //클릭한 객체의 부모 이름이 Template을 포함하면 해당 아이템 속성인 "L2_DesignStandardRel를 불러온다."
    if (ctx.selected.props.awb0Parent.uiValues[0].includes('Template')) {
      let itsName = await com.loadObject(ctx.selected.props.awb0Archetype.dbValues[0]);
      let thisObject = itsName.modelObjects[ctx.selected.props.awb0Archetype.dbValues[0]];
      //console.log(itsName);
      await com.getProperties(thisObject, ['L2_DesignStandardRel']);
      //console.log(thisObject.props.L2_DesignStandardRel.uiValues[0]);
      let designNameDivide = thisObject.props.L2_DesignStandardRel.uiValues[0].split('-');
      let designName = designNameDivide[1];
      //console.log(designName);
      let result = await query.executeSavedQuery('FindManualBook', ['L2_object_name', 'O_GroupName'], ['Dust Tank*', groupName]);

      // let result = await query.executeSavedQuery("FindManualBook", ["L2_object_name", "O_GroupName"], [designName, "groupName"]);
      location.href = `http://localhost:3001/#/lgepNoticeBoardManual?${result[0].uid}`;

      //클릭한 객체의 부모 이름이 Template을 포함하고 있지 않으면 부모 속성을 가져와서 아이템 속성인 "L2_DesignStandardRel를 불러온다
    } else {
      if (groupName === 'dba') {
        msg.show(1, `그룹이 dba로 설정되어있습니다. 그룹을 설정해주세요.`, ['닫기'], [function () {}]);
      }
      let parentLoad = await com.loadObject(parent.props.awb0Archetype.dbValues[0]);
      let parentRevision = parentLoad.modelObjects[parent.props.awb0Archetype.dbValues[0]];
      //console.log(parentLoad);
      await com.getProperties(parentRevision, ['L2_DesignStandardRel']);
      //console.log(parentRevision.props.L2_DesignStandardRel.uiValues[0]);
      let designNameDivide = parentRevision.props.L2_DesignStandardRel.uiValues[0].split('-');
      let designName = designNameDivide[1];
      //console.log(designName);

      let result = await query.executeSavedQuery('FindManualBook', ['L2_object_name', 'O_GroupName'], ['Dust Tank*', groupName]);
      // let result = await query.executeSavedQuery("FindManualBook", ["L2_object_name", "O_GroupName"], [designName, "groupName"]);
      location.href = `http://localhost:3001/#/lgepNoticeBoardManual?${result[0].uid}`;
    }
  }
}

async function openMoreInfo(ctx, data) {
  let obj = ctx.selected;
  let test = await lgepObjectUtils.getProperties(obj, [
    'l2_division',
    'l2_page_type',
    'l2_page_index',
    'l2_keywords',
    'l2_issue_class',
    'l2_issue_date',
    'l2_content_string',
    'l2_comments',
    'l2_comments_attachments',
    'l2_comments_string',
    'l2_contents',
    'l2_contents_string',
    'l2_pjt_name',
    'l2_platform_name',
    'l2_reference_issues',
    'l2_reference_posts',
    'l2_sub_title',
    'IMAN_reference',
    'l2_model_name',
    'l2_doc_no',
    'l2_image_path',
    'l2_item',
    'l2_file_name',
    'l2_source',
    'l2_creator',
    'l2_issue_pred',
  ]);
  const inputParam = {
    declView: 'moreInfo',
    locals: {
      caption: '상세정보',
      anchor: 'closePopupAnchor',
    },
    options: {
      reference: 'referenceID',
      width: 1500,
      height: 900,
      isModal: true,
      clickOutsideToClose: false,
      draggable: true,
    },
  };
  popupService.show(inputParam);
}

export default exports = {
  goToLink,
  openMoreInfo,
};
