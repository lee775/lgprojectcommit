/**
 * FMEA MASTER (구조/기능/고장) 조회  styleSheet 모듈 유틸
 * @module js/cmStyleSheetService
 */
import appCtxService from 'js/appCtxService';
import browserUtils from 'js/browserUtils';
import fmsSvc from 'soa/fileManagementService';
import cdm from 'soa/kernel/clientDataModel';
import fmsUtils from 'js/fmsUtils';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';

import { showErrorMessage } from 'js/utils/fmeaMessageUtils';
import { makeEditor, setValue } from 'js/utils/fmeaEditorUtils';
import { cancel } from 'js/cmEditService';
import * as constants from 'js/constants/fmeaConstants';
import * as prop from 'js/constants/fmeaProperty';

/**
 * 스타일 시트 에디터 초기화 담당
 * @param {*} ctx
 * @param {string} id
 */
export const initSummaryEditorById = async (ctx, id) => {
  try {
    if (ctx[constants.EDITING]) {
      cancel();
    }
    makeEditor(id, 'disable');
    await _setEditorValue(id, ctx);
    appCtxService.registerCtx(constants.DFMEA_DETAIL_INIT, true);
  } catch (e) {
    showErrorMessage(e);
  }
};

/**
 * id에 해당하는 속성값 가져와 editor에 삽입
 * @param {string} attrId
 * @param {*} ctx
 */
const _setEditorValue = async (attrId, ctx) => {
  const attrValue = await _getPropertyValue(ctx, attrId);
  if (attrValue) {
    if (attrValue.includes('<img')) {
      // 1. 선택한 master 가져오기
      const master = ctx[constants.ROW_SELECT];
      const containImgValue = await _getValueByIncludeImgTag(master, attrValue);
      setValue(attrId, containImgValue);
    } else {
      setValue(attrId, attrValue);
    }
  }
};

const _getImgSrcFromTicketUri = async (ticket, originalFileName) => {
  let fileUri = fmsUtils.getFileUri(ticket, originalFileName);
  fileUri = fileUri.substring(fileUri.indexOf('/') + 1);
  const ticketURL = browserUtils.getBaseURL() + fileUri;
  const src = await _getBase64FromUrl(ticketURL);
  return src;
};

const _checkTickets = (readFileTicketsResponse) => {
  if (readFileTicketsResponse && readFileTicketsResponse.tickets && readFileTicketsResponse.tickets.length > 1) {
    return true;
  }
  return false;
};

const _getReadFileTicketsResponse = async (dataset) => {
  await lgepObjectUtils.getProperties([dataset], [prop.REF_LIST]);
  const refListUid = dataset.props[prop.REF_LIST].dbValues[0];
  const file = await lgepObjectUtils.getObjects([refListUid]);
  const readFileTicketsResponse = await fmsSvc.getFileReadTickets(file);
  return readFileTicketsResponse;
};

const _getOriginalFileName = (readFileTicketsResponse) => {
  const imanFileArray = readFileTicketsResponse.tickets[0];
  if (imanFileArray && imanFileArray.length > 0) {
    const imanFileObj = cdm.getObject(imanFileArray[0].uid);
    if (imanFileObj.props) {
      return imanFileObj.props.original_file_name.uiValues[0];
    }
  }
};

const _insertSrc = (attrValue, srcStartIndex, src) => {
  return [attrValue.slice(0, srcStartIndex), src, attrValue.slice(srcStartIndex)].join('');
};

const _getBase64FromUrl = async (url) => {
  const data = await fetch(url);
  const blob = await data.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result;
      resolve(base64data);
    };
  });
};

/**
 * id에 해당하는 속성값 리턴
 * @param {*} ctx
 * @param {string} attr
 * @returns
 */
const _getPropertyValue = async (ctx, attr) => {
  const selectMaster = ctx[constants.ROW_SELECT];
  await lgepObjectUtils.getProperties(selectMaster, attr);
  const prop = selectMaster.props[attr];
  if (prop) {
    return prop.dbValues[0];
  }
  return prop;
};

/**
 * styleSheet unmount 시 편집중인 경우 편집 취소
 * @param {*} ctx
 */
export const unMount = (ctx) => {
  if (ctx[constants.EDITING]) {
    cancel();
  }
};

/**
 * 에디터 vlaue에 img 태그가 있는 경우 해당 모델의 dataset 가져옴
 * dataset을 변환하여 img src=""에 맵핑
 * @param {ModelObject} master
 * @param {string} propValue
 * @param {string} relation
 * @returns
 */
export const getImgReplaceValue = async (master, propValue, relation) => {
  if (!propValue) {
    return '';
  }
  if (propValue.includes('<img')) {
    const containImgValue = await _getValueByIncludeImgTag(master, propValue, relation);
    return containImgValue;
  }
  return propValue;
};

const _getDatatsetList = async (master, relation) => {
  await lgepObjectUtils.getProperties([master], [relation]);
  const imanSpecificationUids = master.props[relation].dbValues;
  const datasetArray = lgepObjectUtils.getObjects(imanSpecificationUids);
  const sortDatasetArray = await _sortDescDatasetArray(datasetArray);
  return sortDatasetArray;
};

const _getValueByIncludeImgTag = async (master, attrValue, relation = prop.IMAN_SPECIFICATION) => {
  let imgIndex = 0;
  let resultValue = attrValue;
  const sortDatasetArray = await _getDatatsetList(master, relation);
  for (const dataset of sortDatasetArray) {
    const readFileTicketsResponse = await _getReadFileTicketsResponse(dataset);
    if (!_checkTickets(readFileTicketsResponse)) {
      return resultValue;
    }
    const originalFileName = _getOriginalFileName(readFileTicketsResponse);
    const ticketsArray = readFileTicketsResponse.tickets[1];
    if (!ticketsArray || !originalFileName) {
      return resultValue;
    }
    const src = await _getImgSrcFromTicketUri(ticketsArray[0], originalFileName);
    const objectName = dataset.props[prop.OBJECT_NAME].dbValues[0].split('.png')[0];
    const idInfo = await _getDatasetId(resultValue, imgIndex);
    if (objectName === idInfo.id) {
      resultValue = await _replaceAllSrc(imgIndex, resultValue, src);
      imgIndex = idInfo.idEndIndex;
    }
  }
  return resultValue;
};

const _replaceAllSrc = async (imgIndex, attrValue, src) => {
  const srcStartIndex = attrValue.indexOf('src="', imgIndex) + 5;
  const srcEndIndex = attrValue.indexOf('" ', srcStartIndex);
  const existSrc = attrValue.substring(srcStartIndex, srcEndIndex);
  if (!existSrc) {
    return _insertSrc(attrValue, srcStartIndex, src);
  }
  return attrValue;
};

/**
 * datset object_name 0~99 순서 조정
 * @param {[ModelObject]} datasetArray
 * @returns
 */
const _sortDescDatasetArray = async (datasetArray) => {
  await lgepObjectUtils.getProperties(datasetArray, [prop.OBJECT_NAME]);
  const result = datasetArray.sort(function (a, b) {
    const aId = a.props[prop.OBJECT_NAME].dbValues[0].split('.png')[0];
    const bId = b.props[prop.OBJECT_NAME].dbValues[0].split('.png')[0];
    return aId - bId;
  });
  return result;
};

/**
 * img 태그의 id="?" substirng하여 ? 리턴
 * TODO :: 정규표현식 변경
 * @param {*} attrValue
 * @param {*} imgAllIndex
 * @returns
 */
const _getDatasetId = async (attrValue, imgAllIndex) => {
  const imgIndex = attrValue.indexOf('<img', imgAllIndex);
  const idStartIndex = attrValue.indexOf('id="', imgIndex) + 4;
  const idEndIndex = attrValue.indexOf('">', idStartIndex);
  const id = _getId(attrValue, idStartIndex, idEndIndex);
  return {
    id,
    idEndIndex,
  };
};

const _getId = (attrValue, idStartIndex, idEndIndex) => {
  const id = attrValue.substring(idStartIndex, idEndIndex);
  if (id.length > 3) {
    return id.split('')[0];
  }
  return id;
};

/**
 * 전달받은 객체의 속성 값을 전달받은 id를 가진 에디터에 setValue하여 초기화
 * @param {string} attrId
 * @param {ModelObject} master
 * @param {string} attrValue
 */
export const initDetailEditorById = async (attrId, master, attrValue) => {
  try {
    await makeEditor(attrId, 'disable');
    if (attrValue) {
      const resultValue = await getImgReplaceValue(master, attrValue);
      setValue(attrId, resultValue);
    } else {
      setValue(attrId, ' ');
    }
  } catch (e) {
    showErrorMessage(e);
  }
};

/**
 * 전달받은 객체의 속성 값을 전달받은 id를 가진 에디터에 setValue하여 초기화
 * iman_reference에서 dataset조회함
 * @param {string} attrId
 * @param {ModelObject} master
 * @param {string} attrValue
 */
export const initDetailEditorByIdByReference = async (attrId, master, attrValue) => {
  try {
    makeEditor(attrId, 'disable');
    if (attrValue) {
      const resultValue = await getImgReplaceValue(master, attrValue, prop.IMAN_REFERENCE);
      setValue(attrId, resultValue);
    } else {
      setValue(attrId, '');
    }
  } catch (e) {
    showErrorMessage(e);
  }
};
