import app from 'app';
import lgepPopupUtils from 'js/utils/lgepPopupUtils';
import appCtxService from 'js/appCtxService';

let exports = {};

export function initialize() {}
/**
 *  프로그레스바 처리를 위한 클래스
 */
export class LgeProgressPopup {
  /**
   * ProgressBar를 호출한다.
   * @param {string} popupName - 팝업 명 (Default Information)
   * @param {number} width - 가로 길이 (Default 600)
   * @param {number} height - 세로 길이 (Default 200)
   * @param {boolean} closable - Close 가능 여부 (Default true)
   */
  constructor(popupName = 'Information', width = 600, height = 200, closable = true) {
    this.popupName = popupName;
    this.width = width;
    this.height = height;
    this.progressPopup = { headline: ' ', footerline: ' ' };
    this.closable = closable;
  }

  /**
   * 프로그레스 팝업을 오픈한다.
   * Promise를 반환하므로, Promise 가 Pending 상태가 끝난 뒤 setValue, setMax, ... 등의 작업을 하도록 한다.
   * @returns {Promise<?>}
   */
  open() {
    return lgepPopupUtils.openPopup('L2_ProgressPopup', this.popupName, this.width, this.height, true, true, this.closable);
  }

  /**
   * ProgressBar의 값을 선택한다.
   * 값을 입력하지 않을 경우 기본적으로 Indeterminate 상태임.
   * @param {number} value
   */
  setValue(value) {
    document.getElementById('lge_progress_bar').setAttribute('value', value);
    document.getElementById('lge_progress_bar').click();
  }
  /**
   * ProgressBar의 Max 값을 설정한다.
   * 자동으로 VALUE/MAX 비율에 맞춰서 그래픽이 출력된다.
   * @param {number} value
   */
  setMax(value) {
    document.getElementById('lge_progress_bar').setAttribute('max', value);
    document.getElementById('lge_progress_bar').click();
  }
  /**
   * 프로그레스바 상단 텍스트를 설정한다.
   * @param {string} text
   */
  setHeaderLine(text) {
    this.progressPopup.headline = text;
    appCtxService.registerCtx('L2_ProgressPopup', this.progressPopup);
  }
  /**
   * 프로그레스바 하단 텍스트를 설정한다
   * @param {string} text
   */
  setFooterLine(text) {
    this.progressPopup.footerline = text;
    appCtxService.registerCtx('L2_ProgressPopup', this.progressPopup);
  }
  /**
   * 프로그레스바 팝업을 닫는다.
   */
  close() {
    lgepPopupUtils.closePopup();
    appCtxService.unRegisterCtx('L2_ProgressPopup');
  }
}

export default exports = {
  initialize,
  LgeProgressPopup,
};
app.factory('lgepProgressUtils', () => exports);
