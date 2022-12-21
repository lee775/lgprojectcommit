import app from 'app';
import SoaService from 'soa/kernel/soaService';
import dmSvc from 'soa/dataManagementService';
import cdmSvc from 'soa/kernel/clientDataModel';
import browserUtils from 'js/browserUtils';
import fmsUtils from 'js/fmsUtils';
import com from 'js/utils/lgepObjectUtils';
import lgepTicketUtils from 'js/utils/lgepTicketUtils';
import lgepCommonUtils from 'js/utils/lgepCommonUtils';
import awPromiseService from 'js/awPromiseService';

async function loadLink(data) {
  await downloadLink(data);
  await lgepCommonUtils.delay(100);
  window.open('', '_self').close();
}

function downloadLink(data) {
  var deferred = awPromiseService.instance.defer();
  try {
    let url = window.location.href;
    let url1 = decodeURI(url);
    url1 = url1.replace('%2F', '/');
    let urlAttrSearch = url1.split('?');
    let urlAttr = urlAttrSearch[1];
    urlAttr = urlAttr.split('&');
    let attrs = {};
    if (urlAttr.length > 0) {
      for (let attr of urlAttr) {
        attr = attr.split('=');
        attrs[attr[0]] = attr[1];
      }
    }

    let promiseArray = [];
    if (attrs.uids) {
      let uids = attrs.uids.split(',');
      for (let uid of uids) {
        if (uid) {
          promiseArray.push(
            lgepTicketUtils.getFileUrl(uid).then((link) => {
              console.log(link);
              if (!link) {
                console.log('존재하지 않는 문서입니다.');
              } else {
                let downloadLink = document.createElement('a');
                downloadLink.href = link.url;
                downloadLink.download = link.fileName;
                downloadLink.click();
              }
            }),
          );
        }
      }
    } else if (attrs.uid) {
      promiseArray.push(
        lgepTicketUtils.getFileUrl(attrs.uid).then((link) => {
          console.log(link);
          if (!link) {
            alert('존재하지 않는 문서입니다.');
          } else {
            let downloadLink = document.createElement('a');
            downloadLink.href = link.url;
            downloadLink.download = link.fileName;
            downloadLink.click();
          }
        }),
      );
    }
    Promise.all(promiseArray).then(() => {
      deferred.resolve(true);
    });
  } catch (err) {
    console.log(err);
    deferred.resolve(false);
  }
  return deferred.promise;
}

let exports = {};
export default exports = {
  loadLink,
};
app.factory('lgepXceleratorService', () => exports);
