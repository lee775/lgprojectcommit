import SoaService from 'soa/kernel/soaService';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
import _ from 'lodash';
import viewC from 'js/viewModelObjectService';
import AwPromiseService from 'js/awPromiseService';
import * as prop from 'js/constants/fmeaProperty';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import { loadObjectByPolicy } from 'js/utils/fmeaTcUtils';

export const getHtmlValue = async (uid) => {
  const dataset = await loadObjectByPolicy(uid, prop.TYPE_DATASET, [
    prop.REF_LIST,
  ]);
  const fileText = lgepObjectUtils.getObject(
    dataset.props[prop.REF_LIST].dbValues
  );
  try {
    const result = await SoaService.post(
      'Core-2006-03-FileManagement',
      'getFileReadTickets',
      {
        files: fileText,
      }
    );
    const textTicket = result.tickets[1][0];
    const baseUrl = browserUtils.getBaseURL();
    const fileName = fmsUtils.getFilenameFromTicket(textTicket);
    const textURL = `${baseUrl}fms/fmsdownload/${fileName}?ticket=${textTicket}`;

    const res = await fetch(textURL);
    const blob = await res.blob();
    const fileReader2 = new FileReader();
    fileReader2.readAsText(blob);
    const blobText = await blob.text();
    return blobText;
  } catch (err) {
    console.log(err);
  }
};

export function imgAndsvgOnlyString(temp) {
  if (temp.includes('<svg')) {
    temp = temp.replace(/<tspan[^>]+>/gi, '');
    temp = temp.replace(/<\/tspan>/gi, '');
    temp = temp.replace(/<g[^>]+>/gi, '');
    temp = temp.replace(/<\/g>/gi, '');
    temp = temp.replace(/<text[^>]+>/gi, '');
    temp = temp.replace(/<\/text>/gi, '');
    temp = temp.replace(/<image[^>]+>/gi, '');
    temp = temp.replace(/<\/image>/gi, '');
    temp = temp.replace(/<\/defs>/gi, '');
    temp = temp.replace(/<clipPath[^>]+>/gi, '');
    temp = temp.replace(/<\/clipPath>/gi, '');
    temp = temp.replace(/<path[^>]+>/gi, '');
    temp = temp.replace(/<\/path>/gi, '');
    temp = temp.replace(/<use[^>]+>/gi, '');
    temp = temp.replace(/<\/use>/gi, '');
    temp = temp.replace(/<rect[^>]+>/gi, '');
    temp = temp.replace(/<\/rect>/gi, '');
    temp = temp.replace(/<defs[^>]+>/gi, '');
    temp = temp.replace(/<defs>/gi, '');
    temp = temp.replace(/<svg[^>]+>/gi, '');
    temp = temp.replace(/<\/svg>/gi, '');
    temp = temp.replace(/<p[^>]+>/gi, '');
    temp = temp.replace(/[</p^>]+>/gi, '');
    temp = temp.replace(/<\/p>/gi, '');
    temp = temp.replace(/<[/br^>]+>/gi, '');
    temp = temp.replace(/<br[^>]+>/gi, '');
    temp = temp.replace(/<br/gi, '');
  } else if (temp.includes('img')) {
    temp = temp.replace(/<img[^>]+>/gi, '');
    temp = temp.replace(/<p[^>]+>/gi, '');
    temp = temp.replace(/[</p^>]+>/gi, '');
    temp = temp.replace(/<\/p>/gi, '');
    temp = temp.replace(/<[/br^>]+>/gi, '');
    temp = temp.replace(/<br[^>]+>/gi, '');
    temp = temp.replace(/<br/gi, '');
  }
  return temp;
}

export async function base64ToFileToDataset(tag, item, fileName) {
  let temp = tag;
  let base64File = [];
  let result = {
    resultTag: '',
    dataset: {},
  };
  if (fileName == undefined) {
    fileName = 'image';
  }

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
      for (let i = 0; i < base64Arr.length; i++) {
        base64File.push(imageToFile(base64Arr[i], fileName + i));
      }
    }
  } else if (tag.includes('<img')) {
    tag = tag.match(/\<img.*>/gi);
    tag = tag[0];
    tag = tag.replace(/<p[^>]+>/gi, '');
    tag = tag.replace(/[</p^>]+>/gi, '');
    tag = tag.replace(/<[/br^>]+>/gi, '');
    tag = tag.replace(/<br[^>]+>/gi, '');
    tag = tag.replace(/<br/gi, '');
    tag = tag.split('"');
    tag = tag[1];
    base64File.push(imageToFile(tag, fileName));
    temp = temp.replace(tag, '');
  }
  result.resultTag = temp;
  let dataset = await uploadFileToDataset(base64File);
  result.dataset = dataset;
  if (item != undefined && dataset != undefined) {
    await linkRelationsSequence(item, dataset);
  }

  return result;
}

export async function uploadFileToDataset(file) {
  if (!file) {
    return undefined;
  } else if (Array.isArray(file)) {
    let datasetArr = [];
    for (let i of file) {
      let result = await _createDatasets(i);
      _uploadFile(result, i);
      datasetArr.push(
        await _commitDatasetFiles(result.modelObject, i, result.ticket)
      );
    }
    return datasetArr;
  } else {
    let result = await _createDatasets(file);
    _uploadFile(result, file);
    let dataset = await _commitDatasetFiles(
      result.modelObject,
      file,
      result.ticket
    );
    return dataset;
  }
}

async function linkRelationsSequence(
  item,
  dataset,
  relation = prop.IMAN_SPECIFICATION
) {
  if (Array.isArray(dataset)) {
    for (let i = 0; i < dataset.length; i++) {
      var jsoObj = {
        input: [
          {
            clientId: '',
            relationType: relation,
            primaryObject: item,
            secondaryObject: dataset[i],
          },
        ],
      };
      try {
        await SoaService.post(
          'Core-2006-03-DataManagement',
          'createRelations',
          jsoObj
        );
      } catch (err) {
        //console.log(err);
      }
    }
  } else {
    var jsoObj = {
      input: [
        {
          clientId: '',
          relationType: relation,
          primaryObject: item,
          secondaryObject: dataset,
        },
      ],
    };
    try {
      await SoaService.post(
        'Core-2006-03-DataManagement',
        'createRelations',
        jsoObj
      );
    } catch (err) {
      //console.log(err);
    }
  }
}

export async function deleteRelation(value) {
  if (value == undefined) {
    return;
  }
  value = lgepObjectUtils.getObject(value.uid);
  value = viewC.constructViewModelObjectFromModelObject(value);
  let dataset = lgepObjectUtils.getObject(
    value.props.IMAN_specification.dbValues
  );
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
      await SoaService.post(
        'Core-2006-03-DataManagement',
        'deleteRelations',
        param
      );
    } catch (err) {
      //console.log(err);
    }
  }
  let testParam = {
    objects: dataset,
  };
  try {
    await SoaService.post(
      'Core-2006-03-DataManagement',
      'deleteObjects',
      testParam
    );
  } catch (err) {
    //console.log(err);
  }
}

export const createHtml = async (itemRev) => {
  // 1. html 파일 만들기
  const file = new File(['<div>test</div>'], 'test.html', {
    type: 'text/html',
  });

  // 2. dataset만들기
  const dataset = await _createHtmlDataset('html-test');

  // // 3. ref_list 업로드
  let result = {
    modelObject: dataset.datasetOutput[0].dataset,
    ticket:
      dataset.datasetOutput[0].commitInfo[0].datasetFileTicketInfos[0].ticket,
  };

  _uploadFile(result, file);

  const fileDataset = await _addFileOnDataset(
    result.modelObject,
    file,
    result.ticket
  );
  //console.log('fileDataset', fileDataset);

  // 4. revision add
};

const _addFileOnDataset = async (targetDataset, file, ticket) => {
  const inputParam = {
    commitInput: [
      {
        dataset: targetDataset,
        createNewVersion: true,
        datasetFileTicketInfos: [
          {
            datasetFileInfo: {
              clientId: '1',
              fileName: file.name,
              namedReferencedName: 'HTML',
              isText: false,
              allowReplace: true,
            },
            ticket: ticket,
          },
        ],
      },
    ],
  };
  try {
    const result = await SoaService.post(
      'Core-2006-03-FileManagement',
      'commitDatasetFiles',
      inputParam
    );
    return result;
  } catch (e) {
    //console.log('eee', e);
  }
};

const _createHtmlDataset = async (fileName) => {
  const inputParam = {
    input: [
      {
        clientId: '0',
        name: fileName,
        container: {},
        type: 'HTML',
        datasetFileInfos: [
          {
            clientId: '1',
            fileName: fileName + '.html',
            namedReferenceName: 'HTML',
            isText: false,
            allowReplace: true,
          },
        ],
      },
    ],
  };

  const dataset = await SoaService.post(
    'Core-2010-04-DataManagement',
    'createDatasets',
    inputParam
  );
  return dataset;
};

function imageToFile(imgsrc, fileName) {
  if (!imgsrc) {
    return;
  }
  let bstr = window.atob(imgsrc.split(',')[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  let file = new File([u8arr], fileName + '.png', {
    type: 'mime',
  });
  return file;
}

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
      selectedtype = [
        'SE SheetMetal',
        'SE SheetMetal',
        'Plain',
        'SE-sheetMetal',
      ];
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
  SoaService.post(
    'Core-2010-04-DataManagement',
    'createDatasets',
    inputParam
  ).then((res) => {
    let result = {
      modelObject: res.datasetOutput[0].dataset,
      ticket:
        res.datasetOutput[0].commitInfo[0].datasetFileTicketInfos[0].ticket,
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
}

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
      selectedtype = [
        'SE SheetMetal',
        'SE SheetMetal',
        'Plain',
        'SE-sheetMetal',
      ];
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
  SoaService.post(
    'Core-2006-03-FileManagement',
    'commitDatasetFiles',
    inputParam
  ).then((res) => {
    let keys = Object.keys(res.modelObjects);
    for (const key of keys) {
      if (lgepObjectUtils.instanceOf(res.modelObjects[key], 'Dataset')) {
        deferred.resolve(res.modelObjects[key]);
        return;
      }
    }
    deferred.resolve(null);
  });
  return deferred.promise;
}

const createDatasetFromImgSrc = async (rev, imgTag, relation) => {
  const src = imgTag.currentSrc;
  const id = imgTag.id;
  const imgFile = imageToFile(src, id);
  if (!imgFile) {
    return;
  }
  const dataset = await uploadFileToDataset(imgFile);
  await linkRelationsSequence(rev, dataset, relation);

  return dataset;
};

export default {
  createDatasetFromImgSrc,
};
