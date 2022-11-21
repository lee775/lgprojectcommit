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
import lgepSummerNoteUtils from 'js/utils/lgepSummerNoteUtils';
import sequenceService from 'js/sequenceService';

var $ = require('jQuery');
let datasetUid;

export async function createProcedure(data) {
  await lgepSummerNoteUtils.base64ToFileToDataset($('#sequenceCreateSummernote').summernote('code'), data.createdItem);
  message.show(
    0,
    lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'procedureCreateSuccess'),
    [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
    [
      function () {
        eventBus.publish('sequenceTree.plTable.reload');
      },
    ],
  );
}

export function stringSlice() {
  let tag = $('#sequenceCreateSummernote').summernote('code');
  let temp = tag;
  if (tag.includes('<svg')) {
    if (tag.includes('<image')) {
      tag = tag.match(/\<image.*\<\/image>/gi);
      tag = tag[0];
      tag = tag.split('"');
      let base64Arr = [];
      for (let i of tag) {
        if (i.includes('base64')) {
          base64Arr.push(i);
        }
      }
      for (let i of base64Arr) {
        temp = temp.replace(i, '');
      }
      //console.log("xlink:href=''", {temp});
    }
  } else {
    tag = tag.match(/\<img.*>/gi);
    tag = tag[0];
    tag = tag.replace(/<p[^>]+>/gi, '');
    tag = tag.replace(/[</p^>]+>/gi, '');
    tag = tag.replace(/<[/br^>]+>/gi, '');
    tag = tag.replace(/<br[^>]+>/gi, '');
    tag = tag.replace(/<br/gi, '');
    tag = tag.split('"');
    tag = tag[1];
    tag = temp.replace(tag, '');
    //console.log("src=''", {temp});
  }
}

function imageToFile(imgsrc, fileName) {
  //atob : base64로 인코딩된 src 디코딩
  let bstr = atob(imgsrc.split(',')[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  let file = new File([u8arr], fileName + '.png', { type: 'mime' });
  return file;
  //javascript 보안상 file을 input type file value에 할당할 수는 없음.
}

export function imageBase64ToFile(data) {
  let tag = $('#sequenceCreateSummernote').summernote('code');
  let name = data.sequenceTitle.dbValue;
  if (tag.includes('<svg')) {
    if (tag.includes('<image')) {
      tag = tag.match(/\<image.*\<\/image>/gi);
      tag = tag[0];
      tag = tag.split('"');
      let base64File = [];
      let tagTemp1 = [];
      for (let i of tag) {
        if (i.includes('base64')) {
          tagTemp1.push(i);
        }
      }
      for (let i = 0; i < tagTemp1.length; i++) {
        base64File.push(imageToFile(tagTemp1[i], name + i));
      }
      data.sequenceImageFile = base64File;
    }
  } else {
    if (tag.includes('<img')) {
      tag = tag.match(/\<img.*>/gi);
      tag = tag[0];
      tag = tag.replace(/<p[^>]+>/gi, '');
      tag = tag.replace(/[</p^>]+>/gi, '');
      tag = tag.replace(/<[/br^>]+>/gi, '');
      tag = tag.replace(/<br[^>]+>/gi, '');
      tag = tag.replace(/<br/gi, '');
      tag = tag.split('"');
      tag = tag[1];
      let base64File = imageToFile(tag, name);
      data.sequenceImageFile = base64File;
    }
  }
  return {
    step1: true,
  };
}

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

export async function uploadFileToDataset(file) {
  if (!file) {
    return {
      dataset: undefined,
      step2: true,
    };
  } else if (Array.isArray(file)) {
    let datasetArr = [];
    for (let i of file) {
      let result = await _createDatasets(i);
      _uploadFile(result, i);
      datasetArr.push(await _commitDatasetFiles(result.modelObject, i, result.ticket));
    }
    for (let i = 0; i < datasetArr.length; i++) {
      datasetUid = datasetArr[i].uid;
    }
    return {
      dataset: datasetArr,
      step2: true,
    };
  } else {
    let result = await _createDatasets(file);
    _uploadFile(result, file);
    let dataset = await _commitDatasetFiles(result.modelObject, file, result.ticket);
    datasetUid = dataset.uid;
    return {
      dataset: dataset,
      step2: true,
    };
  }
}

export async function linkRelationsSequence(createdItem, dataset) {
  // IMAN_specification은 createRelation으로 값을 넣는다.
  if (Array.isArray(dataset)) {
    for (let i = 0; i < dataset.length; i++) {
      var jsoObj = {
        input: [
          {
            clientId: '',
            relationType: 'IMAN_specification',
            primaryObject: createdItem,
            secondaryObject: dataset[i],
          },
        ],
      };
      try {
        let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
      } catch (err) {
        //console.log(err);
      }
    }
  } else {
    var jsoObj = {
      input: [
        {
          clientId: '',
          relationType: 'IMAN_specification',
          primaryObject: createdItem,
          secondaryObject: dataset,
        },
      ],
    };
    try {
      let result = await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
    } catch (err) {
      //console.log(err);
    }
  }
  datasetUid = null;
  eventBus.publish('sequenceTree.plTable.reload');
}

export async function deleteSequenceRelationAndObject(value) {
  if (value == undefined) {
    message.show(
      1,
      lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'deleteCheck'),
      [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
      function () {},
    );
    return;
  }
  if (value.type != 'Folder') {
    const sequenceData = vms.getViewModelUsingElement(document.getElementById('designSequenceViewData'));
    message.show(
      1,
      value.props.object_string.uiValues + lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'noneFolderDelete'),
      [
        lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'delete'),
        lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close'),
      ],
      [
        async function () {
          let dataset = com.getObject(value.props.IMAN_specification.dbValues);
          for (let i = 0; i < dataset.length; i++) {
            let param = {
              input: [
                {
                  clientId: '',
                  relationType: 'IMAN_specification',
                  primaryObject: value,
                  secondaryObject: dataset[i],
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
            objects: dataset,
          };
          try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
          } catch (err) {
            //console.log(err)
          }

          let item;
          try {
            let getPropertiesParam = {
              infos: [
                {
                  itemId: value.cellHeader2,
                },
              ],
            };
            item = await SoaService.post('Core-2007-01-DataManagement', 'getItemFromId', getPropertiesParam);
            item = item.output[0].item;
          } catch (err) {
            //console.log(err);
          }
          try {
            let deleteObj = {
              objects: [item],
            };
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteObj);
            message.show(
              0,
              lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'deleteCompletion'),
              [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
              [function () {}],
            );
            eventBus.publish('sequenceTree.plTable.reload');
            sequenceData.selValue = undefined;
          } catch (err) {
            //console.log(err);
          }
        },
        function () {},
      ],
    );
  } else {
    message.show(
      1,
      value.props.object_string.uiValues + lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'folderDelete'),
      [
        lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'delete'),
        lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close'),
      ],
      [
        async function () {
          childDel(value);
          try {
            let deleteObj = {
              objects: [value],
            };
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteObj);
            message.show(
              0,
              lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'deleteCompletion'),
              [lgepLocalizationUtils.getLocalizedText('lgepDesignSequenceMessages', 'close')],
              [function () {}],
            );
            eventBus.publish('sequenceTree.plTable.reload');
          } catch (err) {
            //console.log(err);
          }
        },
        function () {},
      ],
    );
  }
}

async function childDel(obj) {
  if (!Array.isArray(obj)) {
    obj = [obj];
  }
  try {
    let getPropertiesParam = {
      objects: obj,
      attributes: ['contents'],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', getPropertiesParam);
  } catch (err) {
    //console.log(err);
  }

  _.forEach(obj, function (factor) {
    if (factor.type == 'Folder') {
      if (factor.props.contents.dbValues.length > 0) {
        let childObj = com.getObject(factor.props.contents.dbValues);
        childDel(childObj);
        try {
          let deleteObj = {
            objects: [factor],
          };
          SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteObj);
        } catch (err) {
          //console.log(err);
        }
      } else {
        try {
          let deleteObj = {
            objects: [factor],
          };
          SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', deleteObj);
        } catch (err) {
          //console.log(err);
        }
      }
    }
  });
}

/**
 *
 * @param {*} file
 */
function _createDatasets(file) {
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
  deleteSequenceRelationAndObject,
  linkRelationsSequence,
  selectDatasetItem,
  imageBase64ToFile,
  stringSlice,
  createProcedure,
};

app.factory('sequenceDatesetCreateService', () => exports);
