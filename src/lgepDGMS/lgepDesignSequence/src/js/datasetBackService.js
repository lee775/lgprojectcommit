import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from 'js/utils/lgepObjectUtils';
import _ from 'lodash';
import viewC from 'js/viewModelObjectService';
import treeView from 'js/awTableService';
import eventBus from 'js/eventBus';
import vms from 'js/viewModelService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import AwPromiseService from 'js/awPromiseService';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';

var $ = require('jQuery');
let datasetUid;

export function selectDatasetItem(value, data) {
  if (data.fileName == '') {
    return {
      resultDatasetSel: false,
    };
  }
  data.fileName = '';
  data.fileNameNoExt = '';
  if (value.type == 'L2_DgnPageRevision') {
    return {
      resultDatasetSel: true,
    };
  } else {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'firstSelectSequence'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    return {
      resultDatasetSel: false,
    };
  }
}

export async function uploadFileToDataset(formData) {
  if (!formData) {
    return;
  } else {
    let file = formData.get('fmsFile');
    let result = await _createDatasets(file);
    _uploadFile(result, file);
    let dataset = await _commitDatasetFiles(result.modelObject, file, result.ticket);
    datasetUid = dataset.uid;
    return dataset;
  }
}

export async function linkRelationsSequence() {
  const treeData = vms.getViewModelUsingElement(document.getElementById('sequenceTreeData'));
  let addDatasetItem = treeData.dataProviders.sequenceDataProvider.selectedObjects[0];
  // IMAN_specification은 createRelation으로 값을 넣는다.
  var jsoObj = {
    input: [
      {
        clientId: '',
        relationType: 'IMAN_specification',
        primaryObject: addDatasetItem,
        secondaryObject: com.getObject(datasetUid),
      },
    ],
  };
  try {
    let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
  } catch (err) {
    //console.log(err);
  }
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'fileAttachComplete'),
    [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
    [function () {}],
  );
  datasetUid = null;
  eventBus.publish('dataSetTable.plTable.reload');
}

export async function deleteRelationsSequence(data) {
  const treeData = vms.getViewModelUsingElement(document.getElementById('sequenceTreeData'));
  let selectedTree = treeData.dataProviders.sequenceDataProvider.selectedObjects[0];
  let param;
  let deleteDataSet = data.dataProviders.dataSetData.selectedObjects;
  if (deleteDataSet.length < 1) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'noSelectDataset'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      [function () {}],
    );
    return;
  }
  for (let i = 0; i < deleteDataSet.length; i++) {
    param = {
      input: [
        {
          clientId: '',
          relationType: 'IMAN_specification',
          primaryObject: selectedTree,
          secondaryObject: deleteDataSet[i],
        },
      ],
    };
    try {
      await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
    } catch (err) {
      //console.log(err)
    }
  }
  let testParam = {
    objects: deleteDataSet,
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
  } catch (err) {
    //console.log(err)
  }

  datasetUid = null;
  eventBus.publish('dataSetTable.plTable.reload');
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'deleteCompletion'),
    [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
    [function () {}],
  );
}

/**
 *
 * @param {*} file
 */
function _createDatasets(file) {
  //console.log("파일확인",{file});
  let childName = '';
  let type = '';
  if (file) {
    if (file.name.indexOf('.') >= 0) {
      type = file.name.split('.')[file.name.split('.').length - 1];
      childName = file.name.slice(0, -(type.length + 1));
      file.ext = type;
      file.onlyname = childName;
    }
  }
  var deferred = AwPromiseService.instance.defer();
  let selectedtype = [];
  if (type != null && type !== '') {
    type = type.toLowerCase();
    if (type === 'bmp') {
      selectedtype = ['Bitmap', 'Bitmap', 'Plain', 'Image'];
    } else if (type === 'jt') {
      selectedtype = ['DirectModel', 'DirectModel', 'Plain', 'JTPART'];
    } else if (type === 'cgm') {
      selectedtype = ['DrawingSheet', 'DrawingSheet', 'Plain', 'Sheet'];
    } else if (type === 'dwg') {
      selectedtype = ['DWG', 'DWG', 'Plain', 'DWG'];
    } else if (type === 'dxf') {
      selectedtype = ['DXF', 'DXF', 'Plain', 'DXF'];
    } else if (type === 'gif') {
      selectedtype = ['GIF', 'GIF', 'Plain', 'GIF_Reference'];
    } else if (type === 'jpg') {
      selectedtype = ['JPEG', 'JPEG', 'Plain', 'JPEG_Reference'];
    } else if (type === 'xls') {
      selectedtype = ['MSExcel', 'MSExcel', 'Plain', 'excel'];
    } else if (type === 'xlsx') {
      selectedtype = ['MSExcelX', 'MSExcels', 'Plain', 'excel'];
    } else if (type === 'ppt') {
      selectedtype = ['MSPowerPoint', 'MSPowerPoint', 'Plain', 'powerpoint'];
    } else if (type === 'pptx') {
      selectedtype = ['MSPowerPointX', 'MSPowerPointX', 'Plain', 'powerpoint'];
    } else if (type === 'doc') {
      selectedtype = ['MSWord', 'MSWord', 'Plain', 'word'];
    } else if (type === 'docx') {
      selectedtype = ['MSWordX', 'MSWordX', 'Plain', 'word'];
    } else if (type === 'mpp') {
      selectedtype = ['MSProject', 'MSProject', 'Plain', 'Ms_Project_Doc'];
    } else if (type === 'pdf') {
      selectedtype = ['PDF', 'PDF', 'Plain', 'PDF_Reference'];
    } else if (type === 'asm') {
      selectedtype = ['SE Assembly', 'SE Assembly', 'Plain', 'SE-assembly'];
    } else if (type === 'dft') {
      selectedtype = ['SE Draft', 'SE Draft', 'Plain', 'SE-draft'];
    } else if (type === 'par') {
      selectedtype = ['SE Part', 'SE Part', 'Plain', 'SE-part'];
    } else if (type === 'psm') {
      selectedtype = ['SE SheetMetal', 'SE SheetMetal', 'Plain', 'SE-sheetMetal'];
    } else if (type === 'pwd') {
      selectedtype = ['SE Weldment', 'SE Weldment', 'Plain', 'SE-weldment'];
    } else if (type === 'tif') {
      selectedtype = ['TIF', 'TIF', 'Plain', 'TIF_Reference'];
    } else if (type === 'txt') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'zip') {
      selectedtype = ['Zip', 'Zip', 'Plain', 'ZIPFILE'];
    } else if (type === 'mht') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'png') {
      selectedtype = ['Image', 'Image', 'Plain', 'Image'];
    }
  }
  let inputParam = {
    input: [
      {
        clientId: '0',
        name: file.name,
        container: {},
        type: selectedtype[0],
        datasetFileInfos: [
          {
            clientId: '1',
            fileName: file.name,
            namedReferenceName: selectedtype[3],
            isText: false,
            allowReplace: true,
          },
        ],
      },
    ],
  };
  SoaService.post('Core-2010-04-DataManagement', 'createDatasets', inputParam).then((res) => {
    let result = {
      modelObject: res.datasetOutput[0].dataset,
      ticket: res.datasetOutput[0].commitInfo[0].datasetFileTicketInfos[0].ticket,
    };
    deferred.resolve(result);
  });
  return deferred.promise;
}
/**
 *
 * @param {*} result
 * @param {*} file
 */
function _uploadFile(result, file) {
  let ticketURL = result.ticket;
  var deferred = AwPromiseService.instance.defer();
  var request = new XMLHttpRequest();

  var formData = new FormData();
  formData.append('fmsFile', file, file.name);
  formData.append('fmsTicket', ticketURL);
  request.onload = function () {
    if (this.status >= 200 && this.status < 300) {
      deferred.resolve(request.response);
    } else {
      deferred.reject({
        status: request.status,
        statusText: request.statusText,
      });
    }
  };
  request.open('POST', document.location.origin + '/fms/fmsupload/', true);
  request.setRequestHeader('X-XSRF-TOKEN', _getCookieValue('XSRF-TOKEN'));
  request.send(formData);
}

/**
 *
 * @param {*} targetDataset
 * @param {*} file
 * @param {*} ticket
 */
function _commitDatasetFiles(targetDataset, file, ticket) {
  var deferred = AwPromiseService.instance.defer();
  let selectedtype = [];
  let type = file.ext;
  if (type != null && type !== '') {
    type = type.toLowerCase();
    if (type === 'bmp') {
      selectedtype = ['Bitmap', 'Bitmap', 'Plain', 'Image'];
    } else if (type === 'jt') {
      selectedtype = ['DirectModel', 'DirectModel', 'Plain', 'JTPART'];
    } else if (type === 'cgm') {
      selectedtype = ['DrawingSheet', 'DrawingSheet', 'Plain', 'Sheet'];
    } else if (type === 'dwg') {
      selectedtype = ['DWG', 'DWG', 'Plain', 'DWG'];
    } else if (type === 'dxf') {
      selectedtype = ['DXF', 'DXF', 'Plain', 'DXF'];
    } else if (type === 'gif') {
      selectedtype = ['GIF', 'GIF', 'Plain', 'GIF_Reference'];
    } else if (type === 'jpg') {
      selectedtype = ['JPEG', 'JPEG', 'Plain', 'JPEG_Reference'];
    } else if (type === 'xls') {
      selectedtype = ['MSExcel', 'MSExcel', 'Plain', 'excel'];
    } else if (type === 'xlsx') {
      selectedtype = ['MSExcelX', 'MSExcels', 'Plain', 'excel'];
    } else if (type === 'ppt') {
      selectedtype = ['MSPowerPoint', 'MSPowerPoint', 'Plain', 'powerpoint'];
    } else if (type === 'pptx') {
      selectedtype = ['MSPowerPointX', 'MSPowerPointX', 'Plain', 'powerpoint'];
    } else if (type === 'doc') {
      selectedtype = ['MSWord', 'MSWord', 'Plain', 'word'];
    } else if (type === 'docx') {
      selectedtype = ['MSWordX', 'MSWordX', 'Plain', 'word'];
    } else if (type === 'mpp') {
      selectedtype = ['MSProject', 'MSProject', 'Plain', 'Ms_Project_Doc'];
    } else if (type === 'pdf') {
      selectedtype = ['PDF', 'PDF', 'Plain', 'PDF_Reference'];
    } else if (type === 'asm') {
      selectedtype = ['SE Assembly', 'SE Assembly', 'Plain', 'SE-assembly'];
    } else if (type === 'dft') {
      selectedtype = ['SE Draft', 'SE Draft', 'Plain', 'SE-draft'];
    } else if (type === 'par') {
      selectedtype = ['SE Part', 'SE Part', 'Plain', 'SE-part'];
    } else if (type === 'psm') {
      selectedtype = ['SE SheetMetal', 'SE SheetMetal', 'Plain', 'SE-sheetMetal'];
    } else if (type === 'pwd') {
      selectedtype = ['SE Weldment', 'SE Weldment', 'Plain', 'SE-weldment'];
    } else if (type === 'tif') {
      selectedtype = ['TIF', 'TIF', 'Plain', 'TIF_Reference'];
    } else if (type === 'txt') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'zip') {
      selectedtype = ['Zip', 'Zip', 'Plain', 'ZIPFILE'];
    } else if (type === 'mht') {
      selectedtype = ['Text', 'Text', 'Plain', 'Text'];
    } else if (type === 'png') {
      selectedtype = ['Image', 'Image', 'Plain', 'Image'];
    }
  }
  let inputParam = {
    commitInput: [
      {
        dataset: targetDataset,
        createNewVersion: true,
        datasetFileTicketInfos: [
          {
            datasetFileInfo: {
              clientId: '1',
              fileName: file.name,
              namedReferencedName: selectedtype[3],
              isText: false,
              allowReplace: true,
            },
            ticket: ticket,
          },
        ],
      },
    ],
  };
  if (type == 'txt' || type == 'mht') {
    inputParam.commitInput[0].datasetFileTicketInfos[0].datasetFileInfo.isText = true;
  }
  SoaService.post('Core-2006-03-FileManagement', 'commitDatasetFiles', inputParam).then((res) => {
    let keys = Object.keys(res.modelObjects);
    for (const key of keys) {
      if (com.instanceOf(res.modelObjects[key], 'Dataset')) {
        deferred.resolve(res.modelObjects[key]);
        return;
      }
    }
    deferred.resolve(null);
  });
  return deferred.promise;
}
/**
 *
 * @param {*} result
 * @param {*} file
 */

function _getCookieValue(key) {
  let cookieKey = key + '=';
  let result = '';
  const cookieArr = document.cookie.split(';');

  for (let i = 0; i < cookieArr.length; i++) {
    if (cookieArr[i][0] === ' ') {
      cookieArr[i] = cookieArr[i].substring(1);
    }

    if (cookieArr[i].indexOf(cookieKey) === 0) {
      result = cookieArr[i].slice(cookieKey.length, cookieArr[i].length);
      return result;
    }
  }
  return result;
}

let exports = {};

export default exports = {
  uploadFileToDataset,
  deleteRelationsSequence,
  linkRelationsSequence,
  selectDatasetItem,
};

app.factory('datasetBackService', () => exports);
