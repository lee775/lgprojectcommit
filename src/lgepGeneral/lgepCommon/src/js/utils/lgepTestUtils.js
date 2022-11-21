// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import lgepBomUtils from 'js/utils/lgepBomUtils';
import lgepCommonUtils from 'js/utils/lgepObjectUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepMessagingUtils from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepQueryUtils from 'js/utils/lgepQueryUtils';
import logger from 'js/logger';
import _ from 'lodash';

let exports = {};

export const test = async function (ctx, data) {
  logger.info(ctx, data);
  logger.info(ctx.user.props);

  let selectedObject = null;
  if (ctx.selected) {
    selectedObject = lgepObjectUtils.getObject(ctx.selected.uid);
  }

  // logger.info(lgepCommonUtils.getAllSelectedList());

  // const user = lgepObjectUtils.getObject(ctx.user.uid);
  // await lgepObjectUtils.getProperties(user, "home_folder");

  // const container = lgepObjectUtils.getObject(user.props.home_folder.dbValues[0]);
  // logger.info("container :", container);

  const homeFolder = await lgepObjectUtils.getHomeFolder();
  logger.info('homeFolder :', homeFolder);

  // LOV
  // lgepObjectUtils.getInitialLOVValues("Item", "Create", "owning_group").then(response => {
  //     logger.info("getInitialLOVValues :", response);
  // });

  // Query
  // lgepQueryUtils.findSavedQuery("Item...").then(response => {
  //     logger.info("findSavedQuery :", response);
  // });

  // lgepQueryUtils.executeSavedQuery("Item...", ["아이템 ID"], ["007889"]).then(response => {
  //     logger.info("executeSavedQuery :", response);
  // });

  // FullTextSearch 검색
  // lgepQueryUtils.performSearch("L2_FMEARootRevision").then(response => {
  //     logger.info("performSearch :", response);
  // });

  // lgepObjectUtils.getTCSessionInfo().then(response => {
  //     logger.info("getTCSessionInfo :", response);
  // });

  // lgepObjectUtils.getPrivilegeNames().then(response => {
  //     logger.info("getPrivilegeNames :", response);
  // });

  // 쓰기 권한 여부
  // lgepObjectUtils.checkWritePrivilege(homeFolder).then(response => {
  //     logger.info("checkWritePrivilege :", response);
  // });

  // 모든 리비전 규칙 가져오기
  // lgepBomUtils.getRevisionRules().then(response => {
  //     logger.info("getRevisionRules :", response);
  //     response.output.forEach(element => {
  //         logger.info(element.revRule.props.object_string.dbValues[0]);
  //     });
  // });

  // 리비전 규칙 가져오기
  // lgepBomUtils.getRevisionRule("Latest Working").then(response => {
  //     logger.info("getRevisionRule :", response);
  // });

  // lgepObjectUtils.getChildren(homeFolder).then(response => {
  //     logger.info("getChildren :", response);
  // });

  // const myFolderResponse = await lgepObjectUtils.loadObject("AnmJIr7NZx_JkD");
  // const myFolder = myFolderResponse.modelObjects["AnmJIr7NZx_JkD"];
  // logger.info("myFolder: ", myFolder);

  const myObject = await lgepObjectUtils.loadObject2('AnmJIr7NZx_JkD');
  logger.info('myObject: ', myObject);

  // const myObjects = await lgepObjectUtils.loadObjects2(["AnmJIr7NZx_JkD"]);
  // logger.info("myObjects: ", myObjects);

  // const testObj = lgepObjectUtils.getObject("zeqJnQy2Zx_JkD");

  // 채번
  // lgepObjectUtils.getNextIds("Item", "item_id").then(response => {
  //     logger.info(response);
  // });

  // 아이템 찾기
  // lgepObjectUtils.getItemFromId("007889").then(item => {
  //     logger.info(item);

  //     lgepBomUtils.duplicateFromItem(item).then(response3 => {
  //         logger.info(response3);
  //     });

  //     // BOMWindow 생성
  //     lgepBomUtils.createBOMWindow(item).then(createBOMWindowResponse => {
  //         logger.info(createBOMWindowResponse);

  //         // BOMLine 확장
  //         const bomLine = createBOMWindowResponse.bomLine;
  //         lgepBomUtils.expandPSOneLevel([bomLine]).then(expandPSOneLevelResponse => {
  //             logger.info("expandPSOneLevel : ", expandPSOneLevelResponse);
  //         });

  //         // BOM 복제
  //         lgepBomUtils.duplicate(createBOMWindowResponse.bomLine).then(response3 => {
  //             logger.info(response3);
  //         });

  //         // BOMWindow 닫기
  //         lgepBomUtils.closeBOMWindow(createBOMWindowResponse.bomWindow).then(response3 => {
  //             logger.info(response3);
  //         });
  //     });
  // });
  // lgepObjectUtils.getItemFromAttribute({
  //     "item_id": "007894"
  // }).then(response => {
  //     logger.info(response);
  // });

  // 최신 리비전 찾기
  // const item = await lgepObjectUtils.getItemFromId("007894");
  // lgepObjectUtils.getLatestItemRevision(item).then(response1 => {
  //     logger.info(response1);

  //     // BOMWindow 생성
  //     lgepBomUtils.createBOMWindow(null, response1).then(response2 => {
  //         logger.info(response2);

  //         // BOMWindow 닫기
  //         lgepBomUtils.closeBOMWindow(response2.bomWindow).then(response3 => {
  //             logger.info(response3);
  //         });
  //     });
  // });
  // lgepObjectUtils.getLatestItemRevisionByItemId("007894").then(response => {
  //     logger.info(response);
  // });

  // 최신 결재된 리비전 찾기
  // lgepObjectUtils.getLatestReleasedItemRevision("007893").then(response => {
  //     logger.info("getLatestReleasedItemRevision: ", response);
  // });

  // 아이템 생성
  lgepObjectUtils.createItem('007891', 'Item', '', '', myObject).then((response) => {
    logger.info(response.output[0]);
  });

  // lgepObjectUtils.getItemByItemRevision(selectedObject).then(item => {
  //     logger.info(item);

  //     // 리비전 아이디
  //     lgepObjectUtils.generateRevisionIds(item).then(newRevId => {
  //         logger.info(newRevId);

  //         // 개정
  //         lgepObjectUtils.revise2(selectedObject, newRevId).then(response => {
  //             logger.info(response);
  //         });
  //     });
  // });

  // lgepObjectUtils.reviseObject(selectedObject).then(response => {
  //     logger.info(response);
  // });

  // isInProcess
  // const isInProcess = await lgepObjectUtils.isInProcess(testObj);
  // logger.info("isInProcess: ", isInProcess);

  // isReleased
  // const isReleased = await lgepObjectUtils.isReleased(testObj);
  // logger.info("isReleased: ", isReleased);

  // whereReferenced
  // const whereReferenced = await lgepObjectUtils.whereReferenced([myObject], 5);
  // logger.info("whereReferenced: ", whereReferenced);
};

export default exports = {
  test,
};

/**
 *  TestUtils for LGEP
 */
app.factory('lgepTestUtils', () => exports);
