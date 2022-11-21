import app from 'app';
import appCtxService from 'js/appCtxService';
import soaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import viewModelService from 'js/viewModelService';
import { ERROR, show, INFORMATION } from 'js/utils/lgepMessagingUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';

var $ = require('jQuery');
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';

var exports = {};

export async function functionCreateInitialize(editorIds, data) {
  const properties = await _getProperties(data);
  for (const editorId of editorIds) {
    _initializeSummerNote(editorId, properties[editorId]);
  }
}

export async function failureCreateInitialize(editorIds) {
  const properties = await _getProperties();
  for (const editorId of editorIds) {
    _initializeSummerNote(editorId, properties[editorId]);
  }
}

async function _getProperties(data) {
  const datasetUid = await _datasetUid(data);
  const ctxUid = _getCtxUid();
  if (datasetUid !== ctxUid) {
    const properties = await _readPropertiesFromTextFile(datasetUid);
    // ctx에 새 properties 저장
    appCtxService.ctx.checklist.masterOriginProperties.uid = datasetUid;
    appCtxService.ctx.checklist.masterOriginProperties.properties = properties;

    return properties;
  }
  return appCtxService.ctx.checklist.masterOriginProperties.properties;
}

async function _datasetUid(data) {
  const selectRow = appCtxService.ctx.selected;

  const modelObject = lgepObjectUtils.getObject(selectRow.props.awb0Archetype.dbValues[0]);

  // ctx에 TYPE 미리 저장해놓기
  appCtxService.ctx.checklist = {
    masterOriginProperties: {
      selectRowType: modelObject.type,
    },
  };

  if (modelObject.type === 'L2_FunctionRevision') {
    try {
      const viewData = viewModelService.getViewModelUsingElement(document.getElementById('occTreeTable'));
      const functionNode = viewData.dataProviders.occDataProvider.selectedObjects[0];
      if (!functionNode.children) {
        data.completeInit.dbValue = false;
        notySvc.setTimeout(INFORMATION, 200);
        notySvc.showInfo('자식 노드까지 전개 후 다시 선택해주세요');
        return;
      }
      const failure = viewData.dataProviders.occDataProvider.selectedObjects[0].children[0];
      if (!failure.props.l2_reference_dataset) {
        return _datasetUid();
      }
      return failure.props.l2_reference_dataset.dbValues[0];
    } catch (error) {
      data.completeInit.dbValue = false;
      notySvc.setTimeout(INFORMATION, 200);
      notySvc.showInfo('하위 고장 선택 후 다시 선택해주세요');
    }
  }

  while (!selectRow.props.l2_reference_dataset) {
    await lgepCommonUtils.delay(100);
  }
  return selectRow.props.l2_reference_dataset.dbValues[0];
}

function _getCtxUid() {
  if (appCtxService.ctx.checklist) {
    return appCtxService.ctx.checklist.masterOriginProperties ? appCtxService.ctx.checklist.masterOriginProperties.uid : '';
  }
  return '';
}

async function _initializeSummerNote(editorId, editorValue) {
  $(`#${editorId}`).summernote({
    lang: 'ko-KR',
    tabsize: 3,
    height: 400,
    toolbar: [
      ['fontsize', ['fontsize']],
      ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
      ['color', ['forecolor', 'color']],
      ['para', ['ul', 'ol', 'paragraph']],
    ],
    fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72'],
  });

  $(`#${editorId}`).summernote('code', editorValue);
  $(`#${editorId}`).summernote('disable');
}

export async function _readPropertiesFromTextFile(targetUid) {
  const dataset = await getDataset(targetUid);
  if (dataset) {
    const imanFileUid = dataset.props.ref_list.dbValues[0];
    const imanFile = lgepObjectUtils.getObject(imanFileUid);
    const request = {
      files: [imanFile],
    };
    return await soaService
      .post('Core-2006-03-FileManagement', 'getFileReadTickets', request)
      .then((response) => {
        return fetch('fms/fmsdownload/?ticket=' + response.tickets[1][0]).then((res) => {
          return res.arrayBuffer().then((arrayBuffer) => {
            const chars = new Uint8Array(arrayBuffer);
            const string = new TextDecoder().decode(chars);
            return string;
          });
        });
      })
      .then((string) => {
        const properties = JSON.parse(string);
        return properties;
      })
      .catch((error) => {
        show(ERROR, '속성을 불러오는데 실패했습니다.' + '\n' + error.message);
      });
  } else {
    return new Promise((resolve) => {
      const properties = makeBaseProperteisObj();
      resolve(properties);
    });
  }
}

export async function getDataset(datasetUid) {
  const datasetResult = await lgepObjectUtils.loadObject(datasetUid, lgepObjectUtils.createPolicy(['object_name', 'ref_list'], 'Dataset'));
  if (!datasetResult.modelObjects) {
    return;
  }
  const keys = Object.keys(datasetResult.modelObjects);
  for (const key of keys) {
    if (datasetResult.modelObjects[key].type === 'Text') {
      return datasetResult.modelObjects[key];
    }
  }
}

export function makeBaseProperteisObj() {
  let properties = {};
  properties.function = '';
  properties.requirement = '';
  properties.failureMode = '';
  properties.failureEffect = '';
  properties.failureDetail = '';
  properties.prevention = '';
  properties.referenceData = '';
  properties.detectivity = '';
  properties.classification = '';
  return properties;
}

export default exports = {
  functionCreateInitialize,
  failureCreateInitialize,
};

app.factory('L2_ChecklistMasterCreateService', () => exports);
