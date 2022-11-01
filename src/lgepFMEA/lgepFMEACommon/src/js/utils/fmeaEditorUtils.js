/**
 * editor Utils
 * @module js/fmeaEditorUtils
 */
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';

import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

var $ = require('jQuery');

const EMPTY_EDITOR = '<p><br></p>'; // 빈값
const EMPTY_BR_EDITOR = '<p>&nbsp;</p>'; // 빈값

const TOOL_BAR = [
  ['style', ['bold', 'underline', 'clear']],
  ['color', ['color']],
  ['table', ['table']],
  ['width', ['width']],
  ['insert', ['picture']],
];
const BASE_STYLE = {
  width: 900,
  height: 450,
  lang: 'ko-KR',
  toolbar: TOOL_BAR,
  disableResizeEditor: true,
};

const CREATE_STYLE = {
  width: 790,
  height: 350,
  lang: 'ko-KR',
  toolbar: TOOL_BAR,
  disableResizeEditor: true,
  inheritPlaceholder: true,
  placeholder: '_setPlaceHolder(id)',
};

const CREATE_DMASTER_STYLE = {
  width: 835,
  height: 350,
  lang: 'ko-KR',
  toolbar: TOOL_BAR,
  disableResizeEditor: true,
};

/**
 * 특정 에디터의 내용 초기화
 * @param {string} id - editor id
 */
export const reset = (id) => {
  $(`#${id}`).summernote('reset');
};

/**
 * 특정 에디터 id의 value를 리턴
 * @param {string} id
 * @returns {string}
 */
export const getEditorValueById = (id) => {
  const contents = $(`#${id}`).summernote('code');
  return _insertEmpty(contents);
};

/**
 * 에디터 value가 빈값이라면 '' 리턴
 * @param {string} editorStr
 * @returns {string}
 */
const _insertEmpty = (editorStr) => {
  if (isEmptyValue(editorStr)) {
    return '';
  }
  return editorStr;
};

/**
 * editor의 내용이 비어있는지 체크
 * @param {string} editorStr
 * @returns {boolean}
 */
export const isEmptyValue = (editorStr) => {
  if (editorStr === EMPTY_EDITOR) {
    return true;
  }
  return false;
};

/**
 * 에디터 창 활성/비활성
 * @param {string} isable - 'enable', 'disable'
 * @param {string[]} editorIds
 */
export const changeEnableEditors = (isable, attrArray) => {
  for (const attr of attrArray) {
    $(`#${attr}`).summernote(isable);
  }
};

/**
 * 특정 에디터 내용 채우기
 * @param {string} editorId
 * @param {string} value
 */
export const setValue = (attrId, attrValue) => {
  $(`#${attrId}`).summernote('code', attrValue);
};

/**
 * 필수 입력 필요한 에디터 값이 빈값인지 체크
 * @param {string[]} requireIds
 * @returns {boolean}
 */
export const emptryCheck = (requireIds) => {
  for (const id of requireIds) {
    const contents = $(`#${id}`).summernote('code');
    if (contents === EMPTY_EDITOR || contents === EMPTY_BR_EDITOR) {
      return true;
    }
  }
  return false;
};

/**
 * 
 * @param {string} id - editor id
 * @param {number} width 
 */
export const initeEditorByCreate = (id, width = 790) => {
  const placeHolder = _setPlaceHolder(id);
  CREATE_STYLE['placeholder'] = placeHolder;
  CREATE_STYLE['width'] = width;

  const editorId = id + constants.CREATE_SUFFIX;
  $(`#${editorId}`).summernote(CREATE_STYLE);
  $(`#${editorId}`).summernote('enable');
};

/**
 * DFMEA 마스터 생성창에서 사용하는 에디터 초기화
 * value값 존재. 수정할 수 없음.
 * @param {string} id
 * @param {string} value
 */
export const initeEditorByCreateByValue = (id, value) => {
  const editorId = id + constants.CREATE_SUFFIX;
  $(`#${editorId}`).summernote(CREATE_DMASTER_STYLE);
  $(`#${editorId}`).summernote('disable');
  $(`#${editorId}`).summernote('code', value);
};

/**
 * 에디터 id별 placeholder 리턴
 * TODO :: i8n
 * @param {string} id
 * @returns
 */
const _setPlaceHolder = (id) => {
  switch (id) {
    case prop.FUNCTION:
      return '설계자의 의도된 부품의 기능을 작성';
    case prop.REQUIREMENT:
      return '각 기능에 대한 요구사항을개별적으로 나열함';
    case prop.POTENTIAL_FAILURE_MODE:
      return '발생 가능성이 있는 (잠재적인) 고장의 형태를 기입<p><font color="#ff0000">※ 설계(양산)변경의 경우, 변경점에 의해 발생할 수 있는 고장 모드를 추가</font></p>';
    case prop.FAILURE_EFFECT:
      return '소비자에 의해 인식되는 고장모드의 영향';
    case prop.CAUSE_OF_FAILURE:
      return '잠재적 고장 원인 및 매커니즘을 작성';
    case prop.PRECATUIONS_ACTION:
      return '고장모드와 고장원인에 대한 예방 활동을 작성';
    case prop.DETECTION_ACTION:
      return '현재 적용중인 검사항목, 시험항목을 구체적으로 기술';
    default:
      return '';
  }
};

/**
 * 에디터 생성 및 초기화
 * @param {string} id
 * @param {string} isable
 */
export const makeEditor = (id, isable) => {
  $(`#${id}`).summernote(BASE_STYLE);
  $(`#${id}`).summernote(isable);
  $(`#${id}`).css('background-color', 'white');
};
