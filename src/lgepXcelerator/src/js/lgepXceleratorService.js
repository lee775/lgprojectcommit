import app from 'app';
import SoaService from 'soa/kernel/soaService';
import dmSvc from 'soa/dataManagementService';
import cdmSvc from 'soa/kernel/clientDataModel';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import com from 'js/utils/lgepObjectUtils';

async function loadLink(data) {
  try {
    let videoFolderUid = 'CIqNjta65p7XAC';
    let policy = {
      types: [
        {
          name: 'WorkspaceObject',
          properties: [{ name: 'contents' }, { name: 'object_name' }],
        },
      ],
      useRefCount: false,
    };
    let returnValue = await loadObj([videoFolderUid], policy);
    let videoFolder = returnValue.modelObjects[videoFolderUid];
    let videosUid = videoFolder.props.contents.dbValues;
    let returnValue2 = await loadObj(videosUid);
    let videos = Object.values(returnValue2.modelObjects);
    await dmSvc.getProperties(videosUid, ['ref_list']);
    let files = [];
    for (let video of videos) {
      let file = cdmSvc.getObject(video.props.ref_list.dbValues[0]);
      files.push(file);
    }
    //console.log("비디오데이터",{videos});
    //console.log("파일",{files});
    let inputParam = {
      files: files,
    };
    let serachResult = await SoaService.post('Core-2006-03-FileManagement', 'getFileReadTickets', inputParam);
    let tickets = serachResult.tickets[1];
    //console.log("파일티켓",{tickets});
    let urls = [];
    for (let text of tickets) {
      let url = '/fms/fmsdownload/?ticket=' + text;
      urls.push(url);
    }

    let sources = document.getElementsByClassName('srcs');
    let videoControls = document.getElementsByClassName('videoSize');
    for (let i = 0; i < sources.length; i++) {
      sources[i].src = urls[i];
      videoControls[i].load();
    }
  } catch (err) {
    //console.log(err)
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
  loadLink,
};
app.factory('lgepXceleratorService', () => exports);
