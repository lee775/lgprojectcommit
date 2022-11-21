import SoaService from 'soa/kernel/soaService';

import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import lgepBomUtils from 'js/utils/lgepBomUtils';

import fmeaDatasetUtils from 'js/utils/fmeaDatasetUtils';
import * as prop from 'js/constants/fmeaProperty';

/**
 * TOOD :: 삭제 예정?
 * revision의 Iman_specification 데이터셋 all delete
 * @param {ModelObject} revision
 */
export const deleteAllDatasetOnSpecification = async (revision) => {
  await lgepObjectUtils.getProperties([revision], [prop.IMAN_SPECIFICATION]);
  const datasetUidArray = revision.props[prop.IMAN_SPECIFICATION].dbValues;
  const datasetArray = await lgepObjectUtils.getObjects(datasetUidArray);
  for (const dataset of datasetArray) {
    await lgepObjectUtils.deleteRelations(prop.IMAN_SPECIFICATION, revision, dataset);
    await lgepObjectUtils.deleteObject(dataset);
  }
};

/**
 * 아이템 리비전의 아이템 객체 삭제
 * @param {ModelObject} revision
 */
export const deleteItem = async (revision) => {
  try {
    const masterItem = await lgepObjectUtils.getItemByItemRevision(revision);
    await lgepObjectUtils.deleteObject(masterItem);
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Workspace Object 객체 삭제
 * @param {ModelObject} workspaceObject
 */
export const deleteWorkspcaeObject = async (workspaceObject) => {
  await lgepObjectUtils.deleteObject(workspaceObject);
};

/**
 * TODO :: 삭제 예정
 * TODO :: 함수가 여러 일을 함.., 위치 애매(cmEditService에서도 사용)
 * img tag 여러개인 경우 id를 추가해 구분
 * dataset 생성하여 add 후
 * src =''
 * @param {ModelObject} revision
 * @param {[HTMLNODE]} imgTags
 * @param {string} relation - ex) iman_specification..
 */
export const addDataset = async (revision, imgTags, releation) => {
  for (let index = 0; index < imgTags.length; index++) {
    const imgTag = imgTags[index];
    imgTag.setAttribute('id', index);
    await fmeaDatasetUtils.createDatasetFromImgSrc(revision, imgTag, releation);
    imgTag.setAttribute('src', '');
  }
};

/**
 * Item 생성
 * @param {string} itemType
 * @param {string} name
 * @param {string} itemId
 * @param {string} desc
 * @returns {ModelObject} - response
 */
export const createItem = async (itemType, name = '', itemId = '', desc = '') => {
  try {
    const result = await lgepObjectUtils.createItem(itemId, itemType, name, desc);
    return result.output[0];
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * WorkspaceObject 생성
 * @param {string} itemType
 * @param {string} name
 * @returns {??}
 */
export const createObject = async (itemType, name = '') => {
  const soaInputParam = {
    input: [
      {
        clientId: '',
        data: {
          boName: itemType,
          stringProps: {
            l2_primary: name,
            l2_secondary: name,
            l2_grade: 'A',
          },
          stringArrayProps: {},
          tagProps: {},
          doubleProps: {},
          boolProps: {},
          boolArrayProps: {},
          dateProps: {},
          dateArrayProps: {},
          tagArrayProps: {},
          compoundCreateInput: {},
          doubleArrayProps: {},
          floatProps: {},
          floatArrayProps: {},
          intProps: {},
          intArrayProps: {},
        },
      },
    ],
  };

  const result = await SoaService.post('Core-2008-06-DataManagement', 'createObjects', soaInputParam);
  return result.ServiceData.created[0];
};

/**
 * 전달받은 리비전 Save As 한 결과 값 리턴
 * @param {ModelObject} originRevision
 * @param {string} name
 * @returns {Object} response
 */
export const saveAsItem = async (originRevision, name) => {
  const soaInputParam = {
    info: [
      {
        clientId: 'SAVEAS',
        itemRevision: originRevision,
        name: name,
      },
    ],
  };
  const response = await SoaService.post('Core-2007-01-DataManagement', 'saveAsNewItem', soaInputParam);
  return response.inputToNewItem.SAVEAS;
};
/**
 * 전달받은 리비전 Save As 한 리비전 반환
 * @param {ModelObject} originRevision
 * @returns {ModelObject} - Revision
 */
export const saveAsItemToRev = async (originRevision) => {
  await lgepObjectUtils.getProperties(originRevision, [prop.OBJECT_NAME]);
  const result = await saveAsItem(originRevision, originRevision.props[prop.OBJECT_NAME].dbValues[0]);
  const newParentAssyRev = result.itemRev;
  return newParentAssyRev;
};

/**
 * 전달받은 리비전 아이템의 마지막 리비전 다음 ID 반환
 * @param {ModelObject} revision
 * @returns {string} - revisionId
 */
const _getGenerateRevisionIdByRevisoin = async (revision) => {
  const item = await lgepObjectUtils.getItemByItemRevision(revision);
  const nextId = await lgepObjectUtils.generateRevisionIds(item);
  return nextId;
};

/**
 * 전달받은 리비전 개정
 * @param {ModelObject} originRevision
 * @returns {ModelObject}
 */
export const reviseByRevision = async (originRevision) => {
  const newRevId = await _getGenerateRevisionIdByRevisoin(originRevision);
  const reviseRevision = await lgepObjectUtils.revise2(originRevision, newRevId);
  return reviseRevision;
};

export const reviseByRevisionUid = async (originRevisionUid, type) => {
  const originRevision = await loadObjectByPolicy(originRevisionUid, type, [prop.ITEM_ID, prop.ITEMS_TAG]);
  const newRevId = await _getGenerateRevisionIdByRevisoin(originRevision);
  const reviseRevision = await lgepObjectUtils.revise2(originRevision, newRevId);
  return reviseRevision;
};

/**
 * 봄 윈도우 저장 후 닫기

 * @param {*} bomWindow 
 */
export const saveCloseBomWindow = async (bomWindow) => {
  await lgepBomUtils.saveBOMWindow(bomWindow);
  await lgepBomUtils.closeBOMWindow(bomWindow);
};

/**
 * 기본 policy 생성 하여 반환
 * @param {string} uid
 * @param {string} type
 * @returns {object}
 */
export const makeBasePolicy = (uid, type) => {
  const policy = {
    uids: [uid],
    types: [
      {
        name: type,
        properties: [{ name: prop.ITEM_ID }],
      },
    ],
  };
  return policy;
};

/**
 * policy 생성 후 객체 return
 * @param {string} uid
 * @param {string} type
 * @param {[string]} props
 * @returns {object}
 */
export const loadObjectByPolicy = async (uid, type, props) => {
  const policy = makePolicyWithProperties(uid, type, props);
  const model = await lgepObjectUtils.loadObject2(uid, policy);
  return model;
};

/**
 * 임의 properties 포함한 policy return
 * @param {string} uid
 * @param {string} type
 * @param {[string]} props
 * @returns
 */
export const makePolicyWithProperties = (uid, type, props = [prop.OBJECT_NAME]) => {
  const properties = _makeProperties(props);
  const policy = {
    uids: [uid],
    types: [
      {
        name: type,
        properties,
      },
    ],
  };
  return policy;
};

const _makeProperties = (props) => {
  const propoerties = props.map((prop) => {
    return { name: prop };
  });
  return propoerties;
};

export const getLatestItemRevisionByRevUid = async (revUid, type) => {
  const revision = await loadObjectByPolicy(revUid, type, [prop.ITEM_ID, prop.ITEMS_TAG]);
  const item = await lgepObjectUtils.getItemByItemRevision(revision);
  // await lgepObjectUtils.getProperties([item], [prop.ITEMS_TAG]);
  const latestRevision = await lgepObjectUtils.getLatestItemRevision(item);
  return latestRevision;
};

// 주어진 rev id와 동일하게 하위 리비전 개정
export const recursionRevise = async (baseRevId, revision) => {
  await lgepObjectUtils.getProperties([revision], [prop.REVISION_ID]);
  const newFunctionRevId = revision.props[prop.REVISION_ID].dbValues[0];
  if (baseRevId !== newFunctionRevId) {
    const reviseRev = await reviseByRevision(revision, baseRevId);
    await recursionRevise(baseRevId, reviseRev);
  }
  return revision;
};

// 봄윈도우 안에서 타입별 전체 개정
export const allReviseBomlines = async (reviseRevision, fmeaRevId, type) => {
  const bom = await lgepBomUtils.createBOMWindow(null, reviseRevision);
  const allBomlines = await lgepBomUtils.expandPSAllLevels([bom.bomLine]);
  try {
    for (const bomlineInfo of allBomlines.output) {
      const itemRev = bomlineInfo.parent.itemRevOfBOMLine;
      const itemRevType = itemRev.type;
      if (itemRevType === type) {
        await _reviseByRevId(itemRev, fmeaRevId);
      }
    }
  } catch (e) {
    //console.log('_allReviseBomlines', e);
  } finally {
    await saveCloseBomWindow(bom.bomWindow);
  }
};

const _reviseByRevId = async (itemRev, revId) => {
  await lgepObjectUtils.getProperties([itemRev], [prop.REVISION_ID]);
  if (itemRev.props[prop.REVISION_ID].dbValues[0] !== revId) {
    await reviseByRevision(itemRev);
  }
};

// FMEA의 리비전 ID get
export const getFmeaRevId = async (fmeaRev) => {
  return fmeaRev.props[prop.REVISION_ID].dbValues[0];
};

// 현재 revId에 맞는 revision 반환
export const getRevisionByRevId = async (revision, revId) => {
  const item = await lgepObjectUtils.getItemByItemRevision(revision);
  await lgepObjectUtils.getProperties(item, [prop.REVISION_LIST]);
  const revisionList = lgepObjectUtils.getObjects(item.props[prop.REVISION_LIST].dbValues);
  for (const revision of revisionList) {
    if (Object.keys(revision.props).length === 0) {
      await lgepObjectUtils.getProperties([revision], [prop.REVISION_ID]);
    }
    if (revision.props[prop.REVISION_ID].dbValues[0] === revId) {
      return revision;
    }
  }
};
