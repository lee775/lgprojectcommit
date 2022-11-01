/**
 * DFMEA Master Detail View
 * @module js/dfmeaMasterDetailService
 */
import eventBus from 'js/eventBus';
import { onMountByImageTable } from 'js/dfmeaMasterDetailOnImageService';

/**
 * 상세 뷰 open
 * 텍스트 테이블일 때, 이미지 테이블일 때
 * @param {*} ctx
 */
const onMount = async (ctx) => {
  await onMountByImageTable(ctx);
};

/**
 * 로우 편집 액션 실행
 */
const editRowAction = async () => {
  eventBus.publish('dfmeaDetail.edit.start');
};

export default {
  onMount,
  editRowAction,
};
