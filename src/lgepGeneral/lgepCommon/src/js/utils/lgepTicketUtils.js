import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from 'js/utils/lgepObjectUtils';
import _ from 'lodash';
import viewC from 'js/viewModelObjectService';
import AwPromiseService from 'js/awPromiseService';
import browserUtils from 'js/browserUtils';
import common from 'js/utils/lgepCommonUtils';
import loding from 'js/utils/lgepLoadingUtils';
import dmSvc from 'soa/dataManagementService';
import cdmSvc from 'soa/kernel/clientDataModel';
import { checklistProperties } from 'js/utils/checklistUtils';
import fmsUtils from 'js/fmsUtils';

async function getFileTicket(obj) {
  try {
    let object = await loadObj([obj.uid]);
    await dmSvc.getProperties([obj.uid], ['l2_images']);
    let target = object.modelObjects[obj.uid];
    if (!target.props.l2_images.dbValues[0]) {
      return '';
    }
    let returnValue2 = await loadObj(target.props.l2_images.dbValues);
    let datasets = Object.values(returnValue2.modelObjects);
    await dmSvc.getProperties(target.props.l2_images.dbValues, ['ref_list']);
    let files = [];
    for (let video of datasets) {
      let file = cdmSvc.getObject(video.props.ref_list.dbValues[0]);
      files.push(file);
    }
    let inputParam = {
      files: files,
    };
    let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
    let tickets = serachResult.tickets[1];
    //console.log("파일티켓",{tickets});{
    let urls = [];
    for (let text of tickets) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(text) + '?ticket=' + text;
      urls.push(url);
    }
    if (urls) {
      return urls;
    }
  } catch (err) {
    return '';
  }
}

async function getFileUrl(uid) {
  try {
    let returnValue = await loadObj([uid]);
    let datasets = Object.values(returnValue.modelObjects);
    await dmSvc.getProperties([uid], ['ref_list']);
    let files = [];
    for (let video of datasets) {
      let file = cdmSvc.getObject(video.props.ref_list.dbValues[0]);
      files.push(file);
    }
    let inputParam = {
      files: files,
    };
    let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
    let tickets = serachResult.tickets[1];
    let urls = [];
    for (let text of tickets) {
      let url = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(text) + '?ticket=' + text;
      urls.push(url);
    }
    if (urls[0]) {
      return {
        url: urls[0],
        fileName: files[0].props.original_file_name.dbValues[0],
      };
    }
  } catch (err) {
    console.log(err);
    return '';
  }
}

async function loadObj(uid, policy) {
  let param = {
    uids: uid,
  };
  if (policy) {
    let returnValue = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy);
    return returnValue;
  } else {
    let returnValue = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param);
    return returnValue;
  }
}

let exports = {};

export default exports = {
  getFileTicket,
  getFileUrl,
};

app.factory('lgepTicketUtils', () => exports);
