import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import appCtx from 'js/appCtxService';
import awTableSvc from 'js/awTableService';
import dmSvc from 'soa/dataManagementService';
import com from 'js/utils/lgepObjectUtils';
import common from 'js/utils/lgepCommonUtils';
import eventBus from 'js/eventBus';
import iconService from 'js/iconService';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import viewModelService from 'js/viewModelObjectService';
import fmsUtils from 'js/fmsUtils';
import browserUtils from 'js/browserUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import _t from 'js/splmTableNative';
import _ from 'lodash';
import loadUtils from 'js/utils/lgepLoadingUtils';
import { showChildOccurences } from 'js/showChildOccsCommandHandler';
import { data2 } from 'js/aw-xrteditor-xrtDOMUtils.service';
var $ = require('jQuery');

let homeFolder = null;
let qList = null;
let aList = null;
let checkEvent = null;
let checkURL = '';
let issueName = {};
let keyAndModel = {};
let divName;
issueName['파손'] =
  '파손,Crack,파괴,Glass 파손,Lid 파손,Leg 파손,Caulking 강도,Hing Crack,Screw 파단,Boss Crack,백화,Damper 파손,Damper 목부러짐,Disk 파손,파단,손상,부러짐,뜯김,강성,강도,떨어짐,찢어짐,동파,끊어짐,터짐,응력';
issueName['변형'] =
  '뒤틀림,변형,들뜸,부품음,Tub 변형,벌어짐,흔들림,seaming 벌어짐,찍힘,천공,호스 꺽임,Base 변형,휨,열변형,뭉그러짐,Plain washer 녹음,,구멍,찌그러짐,처짐,접힘,영구변형,소성변형,배부름,압흔,Hole';
issueName['외관'] =
  '인쇄 Crack,인쇄면 박리,인쇄 지워짐,백청,갈색화,도막균열,내식성 불량,Scratch,변색,부식,Sharp edge,도막 Crack,발청,녹발청,오염,벗겨짐,이염,주름,도막 벗겨짐,박리,단차,긁힘,황변,흑화,백화,물방울 맺힘,얼룩,거칠어짐,실밥풀림,말림';
issueName['간격'] = '간섭,부딪힘,닿임,갈림,마모,Air gap 틀어짐,하부 Gap 구속발생,끼임,벌어짐,갭,gap,접촉,분리,맞물림,틈새,이격,편마모,유격,마찰,습기침투';
issueName['간격(Gap)'] = '간섭,부딪힘,닿임,갈림,마모,Air gap 틀어짐,하부 Gap 구속발생,끼임,벌어짐,갭,gap,접촉,분리,맞물림,틈새,이격,편마모,유격,마찰,습기침투';
issueName['탈거'] = '부품탈락,분리,파이프 탈거,탈거,베어링 내륜 탈거,볼트 탈거,Magnet 빠짐';
issueName['누설'] = '습기참,누설,누수,냉매누설,결로,비산,Flooding,물침투,물넘침,물튐,Lint 누설,낙수,물맺힘,누유,Leakage';
issueName['조립성'] =
  '조립불량,Leg 체결력,오조립,풀림,오체결,오삽입,조립안됨,과체결,헛돔,유동,압입력,미체결,오체결,혼용,오결선,헐렁거림,조임,끄덕거림,압입불량,형합,편심,압입력,탈거력,Torque 부족,결합력,조임력,미조립';
issueName['동작성'] = '열림력,닫힘력,동작불량,댐핑력 상실,안열림,열림속도,열림각,닫힘시간,여닫음,개폐력,구속';
issueName['소음'] =
  '딱딱 소음,떨림 소음,닿임 소음,Lid 떨림 소음,Cavitation 소음,이상소음,소음,마찰소음,기어부 소음,급수 소음,pipe 진동음,공력소음,울림,Beep음,탈수 소음,공진음,정지소음';
issueName['진동'] = '떨림,진동,언바란스,UB,수직과도진동,수직진동,Striking,walking,공진,Belt 떨림,Chattering,탈수진동';
issueName['이상상태'] =
  'early release softner,이물투입,막힘,건조안됨,사이클 막힘,잔수,동결,DE 에러,AE,이물막힘,물고임,유량불량,Filter Net 막힘,이물 쌓임,발연,발열,배수불량,화재,오가열,역류,호스빠짐,물버림 에러,Disk 구속불량,베어링 분리,볼트 미제거,오사용,밸브 미작동,LE 에러,OE 발생,오감지,버튼 오작동,UE 발생,온도상승,폭발,발화,덕트막힘,LED 점멸,막힘,린트쌓임,필터막힘,탄화,기포,세제비산,불빛 샘,안닫힘,분리,장력 부족,CE,배수불량';
issueName['전기적 특성'] =
  '누전,단선,전열파괴,과전류,오결선,Lead Wire 결선,감전,Lead Wire 손상,Lead Wire 열경화,EMI 불만족,감지불량,피복손상,철손,동손,기계손,소손,전원꺼짐,이상전류,누설전류,과부하,저전압,과전압,결선,센서불량,단락,모터 발열,short';
issueName['화학적 특성'] = 'Chemical Attack';
issueName['성능'] = '옷감불량,옷감손상,세제잔류,유연제 투입불량,급수 불량,세탁성능,의류손상,건조안됨,섬유유연제 잔류';
issueName['성형성'] = '미성형,Burr,용착불량,외관수축,융착불량,진원도,P/L,Gate,Weld Line,Flow Mark,Flash,성형결함,Orange Peel,흐름';
issueName['감성'] = '터치감도,세탁력 불만,조작감,타는 냄새';
issueName['위생'] = '세균,곰팡이,냄새,악취,오염';
issueName['외관/감성'] =
  '인쇄 Crack,인쇄면 박리,인쇄 지워짐,백청,갈색화,도막균열,내식성 불량,Scratch,변색,부식,Sharp edge,도막 Crack,발청,녹발청,오염,벗겨짐,이염,주름,도막 벗겨짐,박리,단차,긁힘,황변,흑화,백화,물방울 맺힘,얼룩,거칠어짐,실밥풀림,말림,터치감도,세탁력 불만,조작감,타는 냄새';
issueName['외관_감성'] =
  '인쇄 Crack,인쇄면 박리,인쇄 지워짐,백청,갈색화,도막균열,내식성 불량,Scratch,변색,부식,Sharp edge,도막 Crack,발청,녹발청,오염,벗겨짐,이염,주름,도막 벗겨짐,박리,단차,긁힘,황변,흑화,백화,물방울 맺힘,얼룩,거칠어짐,실밥풀림,말림,터치감도,세탁력 불만,조작감,타는 냄새';
issueName['전기적/화학적특성'] =
  '누전,단선,전열파괴,과전류,오결선,Lead Wire 결선,감전,Lead Wire 손상,Lead Wire 열경화,EMI 불만족,감지불량,피복손상,철손,동손,기계손,소손,전원꺼짐,이상전류,누설전류,과부하,저전압,과전압,결선,센서불량,단락,모터 발열,short,Chemical Attack';
issueName['전기적_화학적특성'] =
  '누전,단선,전열파괴,과전류,오결선,Lead Wire 결선,감전,Lead Wire 손상,Lead Wire 열경화,EMI 불만족,감지불량,피복손상,철손,동손,기계손,소손,전원꺼짐,이상전류,누설전류,과부하,저전압,과전압,결선,센서불량,단락,모터 발열,short,Chemical Attack';
issueName['전기적_화학적 특성'] =
  '누전,단선,전열파괴,과전류,오결선,Lead Wire 결선,감전,Lead Wire 손상,Lead Wire 열경화,EMI 불만족,감지불량,피복손상,철손,동손,기계손,소손,전원꺼짐,이상전류,누설전류,과부하,저전압,과전압,결선,센서불량,단락,모터 발열,short,Chemical Attack';
issueName['파손/탈거'] =
  '파손,Crack,파괴,Glass 파손,Lid 파손,Leg 파손,Caulking 강도,Hing Crack,Screw 파단,Boss Crack,백화,Damper 파손,Damper 목부러짐,Disk 파손,파단,손상,부러짐,뜯김,강성,강도,떨어짐,찢어짐,동파,끊어짐,터짐,응력,부품탈락,분리,파이프 탈거,탈거,베어링 내륜 탈거,볼트 탈거,Magnet 빠짐';
let textAnswer = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'textAnswer');
let textReview = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'reViewNum');
let textNoAnswer = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'noAnswer');
let totalImages = {};
let countNum = {};
let folderObjs = {};

const imageLoadError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'imageLoadError');
const questionLoadError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'questionLoadError');
const answerLoadError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'answerLoadError');
const dataLengthError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'dataLengthError');
const childLoadError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'childLoadError');
const fileLengthError = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'fileLengthError');

export async function loadTreeData(data, ctx) {
  loadUtils.openWindow();
  // let preferTest = await lgepPreferenceUtils.getPreference("L2_Part_Structure_Folder");
  let preferTest = await lgepPreferenceUtils.getPreference('L2_DevKnowledge_Interface');
  let homeUID = preferTest.Preferences.prefs[0].values[0].value;

  //테스트 폴더 찾기
  // let testUID = "RkjJtaagZx_JkD";
  let testFolder;

  //폴더 밑에 대분류 폴더 조회
  let param = {
    uids: [homeUID],
  };
  let policy2 = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [{ name: 'contents' }, { name: 'object_name' }],
      },
    ],
    useRefCount: false,
  };
  let bigFolderList = [];
  try {
    let serachResult2 = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    testFolder = serachResult2.modelObjects[homeUID];
    // 폴더 밑에 대분류 폴더 목록 조회 예) DFZ , CFZ ...
    for (let i in testFolder.props.contents.uiValues) {
      bigFolderList[testFolder.props.contents.uiValues[i]] = testFolder.props.contents.dbValues[i];
    }
    // 대분류 폴더 목록에 그룹명 확인
    let folderUID = bigFolderList[ctx.userSession.props.group_name.dbValue];
    let searchFolders = [];
    if (!folderUID) {
      //그룹명에 해당하는 폴더가 없을 때
      // searchFolders = Object.values(bigFolderList);
    } else {
      searchFolders = [folderUID];
    }

    param = {
      uids: searchFolders,
    };
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    let searchUIDS = serachResult.plain;
    if (searchUIDS.length > 1) {
      homeFolder = [];
      for (let uid of searchUIDS) {
        homeFolder.push(serachResult.modelObjects[uid]);
      }
    } else {
      homeFolder = serachResult.modelObjects[searchUIDS[0]];
    }
    divName = homeFolder.props.object_name.dbValues[0];
    let treeArray = {};
    let midFolderuids = [];
    // 대분류 폴더 밑에 중분류 폴더 목록 조회 예) Base, Tub, Gasket 기타 등등
    for (let i in homeFolder.props.contents.uiValues) {
      midFolderuids.push(homeFolder.props.contents.dbValues[i]);
    }
    param = {
      uids: midFolderuids,
    };
    let midFolders = [];
    serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    for (let uid of midFolderuids) {
      if (serachResult.modelObjects[uid]) midFolders.push(serachResult.modelObjects[uid]);
    }
    let littleUids = [];
    for (let folder of midFolders) {
      // 중분류 하부에 있는 아이템들 집어 넣기
      if (folder.type.includes('Folder')) {
        if (!treeArray[folder.props.object_name.dbValues[0]]) {
          //treeArray 배열에 키값에 해당하는 값이 있을때
          treeArray[folder.props.object_name.dbValues[0]] = folder.props.contents.uiValues;
          folderObjs[folder.props.object_name.dbValues[0]] = folder;
        } else {
          if (Array.isArray(treeArray[folder.props.object_name.dbValues[0]])) {
            //treeArray 값이 [] 인것도 고려
            for (let name of folder.props.contents.uiValues) {
              treeArray[folder.props.object_name.dbValues[0]].push(name);
            }
          }
        }
        if (folder.props.contents.dbValues.length > 0) {
          for (let uid of folder.props.contents.dbValues) {
            littleUids.push(uid);
          }
        }
      }
    }
    data.folderObjs = folderObjs;
    param = {
      uids: littleUids,
    };

    let vals = Object.keys(treeArray);
    for (let key of vals) {
      countNum[key] = {};
      let names = [];
      if (treeArray[key].length > 0) {
        for (let val of treeArray[key]) {
          if (val !== '기타') {
            names.push(val);
          }
        }
      }
      let set = new Set(names);
      let uniqueName = [...set];
      treeArray[key] = uniqueName;
      treeArray[key].sort();
    }
    const ordered = {};
    Object.keys(treeArray)
      .sort()
      .forEach(function (key) {
        ordered[key] = treeArray[key];
      });
    let keys = Object.keys(ordered);
    // let keys = Object.keys(treeArray);

    let inputTree = [];
    for (let folderVal of keys) {
      let treeChildren = [];
      if (treeArray[folderVal].length > 0) {
        let inputChildren = {
          label: '',
          value: '',
          parent: '',
          explain: '',
        };
        treeChildren.push(inputChildren);
      }
      let addInputTree = {
        label: folderVal,
        value: folderObjs[folderVal].uid,
        children: treeChildren,
        explain: folderVal,
        // "folderUid":
      };
      let regfilter = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
      // test() ㅡ 찾는 문자열이 들어있는지 확인
      if (regfilter.test(addInputTree.value)) {
        addInputTree.value = addInputTree.value.replace(regfilter, ''); // 찾은 특수 문자를 제거
      }
      inputTree.push(addInputTree);
    }
    data.treeArray = ordered;
    // data.partDataTree = inputTree;
    data.showCategory = 'show'; //질문 생성시 카테고리 보이게 하기 위함
    data.mainView = 'listView'; // 자료 로드시 카드뷰로 보이도록
    data.window = 'qna'; // 질문 생성시 보일 창 종류
    data.popupWidth = window.innerWidth * 0.8;
    data.popupHeight = window.innerHeight * 0.8;
    if (ctx.userSession.props.role_name.dbValue !== 'Admin') {
      let _table = document.getElementById('searchTableResult');
      var tableCtrl = _t.util.getTableController(_table);
      tableCtrl.updateColumnVisibility('show_issue_pred');
    }
    if (inputTree.length > 0) {
      await common.userLogsInsert('Load Knowledge Folders', '', 'S', 'loadObjects');
    }
    return inputTree;
  } catch (err) {
    //console.log(err);
    message.show(1, data.i18n.noResult);
    loadUtils.closeWindow(data);
  }
}

export async function loadSelectData(data) {
  //욱채가 만듬   클릭시 배경색 전환CSS 추가
  let deleteTreeNodeHtml = document.getElementsByClassName('backGroundWhiteImportant');
  if (deleteTreeNodeHtml.length > 0) {
    deleteTreeNodeHtml[0].classList.remove('backGroundWhiteImportant');
  }
  let selectTreeNodeHtml = document.getElementsByClassName('aw-state-selected');
  if (selectTreeNodeHtml.length > 0) {
    selectTreeNodeHtml = selectTreeNodeHtml[0].parentNode;
    selectTreeNodeHtml.classList.add('backGroundWhiteImportant');
  }
  //욱채가 만듬
  //트리에서 선택시 이벤트 데이터 인식
  if (data.eventData === undefined) {
    return {
      searchTree: null,
      totalFound: 0,
    };
  } else {
    let checkList;
    let prop1 = '';
    let prop2 = '';
    let prop3 = '';
    let prop4 = null;
    let modelVal = '';
    let docNo = '';
    let allign = '';

    if (data.eventData) {
      if (data.eventData.selectedObjects != undefined && data.searchModel != null) {
        data.searchModel;
      } else if (data.eventData.node != undefined) {
        data.searchModel = 'tree';
      } else if (data.eventData.node == undefined) {
        data.searchModel = 'panel';
      }
      if (data.searchModel == 'panel' && data.eventMap['panelSearch'] != undefined) {
        //팝업으로 검색시
        if (data.eventMap['panelSearch'].parent == null && data.eventMap['panelSearch'].target != '') {
          prop1 = data.eventMap['panelSearch'].target;
          prop3 = data.eventMap['panelSearch'].source;
          prop4 = data.eventMap['panelSearch'].period;
        } else if (data.eventMap['panelSearch'].parent != null) {
          prop2 = data.eventMap['panelSearch'].target;
          prop1 = data.eventMap['panelSearch'].parent;
          prop3 = data.eventMap['panelSearch'].source;
          prop4 = data.eventMap['panelSearch'].period;
        }
        allign = data.eventMap['panelSearch'].allign;
        modelVal = data.eventMap['panelSearch'].modelNo;
        docNo = data.eventMap['panelSearch'].pno;
        data.searchModel = 'panel';
      } else if (data.searchModel == 'tree' && data.eventMap['partTree.treeNodeSelected'] != undefined) {
        // 트리선택시 하부폴더(or 하위황목)이 있을 때
        if (data.eventMap['partTree.treeNodeSelected'].node.children && data.eventMap['partTree.treeNodeSelected'].node.children.length < 0) {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
          if (data.eventData.node) {
            await showChildTest(data, '', prop1);
            data.eventData.node.expanded = true;
          }
        } else if (!data.eventMap['partTree.treeNodeSelected'].node.children) {
          prop2 = data.eventMap['partTree.treeNodeSelected'].node.label;
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.parent;
        } else {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
          if (data.eventData.node) {
            await showChildTest(data, '', prop1);
            data.eventData.node.expanded = true;
          }
        }
      }
    }
    let startIndex = data.dataProviders.selectedTreeResult.startIndex;
    let performData = await performSearch(data, '*', 'L2_IssuePageRevision', startIndex, prop1, prop2, prop3, prop4, divName, modelVal, docNo, allign);
    let revisions = performData.modelObjects;
    // 이미지 가져오기
    let imageUID = [];
    for (let mo of revisions) {
      if (mo.props.IMAN_reference.dbValues[0]) {
        imageUID.push(mo.props.IMAN_reference.dbValues[0]);
      }
    }
    let param3 = {
      uids: imageUID,
    };
    let imageThumb = {};
    try {
      let responseItem3 = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param3);
      let images = [];
      if (responseItem3.modelObjects) {
        images = Object.values(responseItem3.modelObjects);
      }
      for (let mo of images) {
        imageThumb[mo.uid] = mo.props.awp0ThumbnailImageTicket.dbValues[0];
      }
    } catch (err) {
      //console.log(err);
      message.show(1, imageLoadError);
    }
    //뷰모델로 전환
    checkList = revisions;
    let vmoList = [];
    for (let check of checkList) {
      let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
      if (vmo.props.l2_average_rating.dbValue > 0) {
        vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
      }
      vmo.textReview = textReview;
      vmo.percent = ((vmo.props.l2_average_rating.dbValue * 100) / 5).toFixed(1) + '%';
      let thumbnailUrl = imageThumb[vmo.props.IMAN_reference.dbValues[0]];
      if (thumbnailUrl) {
        vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
        vmo.image = vmo.thumbnailURL;
      } else {
        vmo.thumbnailURL = iconService.getTypeIconFileUrl('cmdLargeImageView24.svg');
        vmo.image = vmo.thumbnailURL;
      }
      if (!vmo.props.l2_issue_pred.dbValue) {
        vmo.props.l2_issue_pred.dbValue = 0;
      }
      vmo.props.show_issue_pred = [];
      vmo.props.show_issue_pred.dbValue = (vmo.props.l2_issue_pred.dbValue * 100).toFixed(1);
      vmo.props.show_issue_pred.uiValue = (vmo.props.l2_issue_pred.dbValue * 100).toFixed(1);
      keyAndModel[vmo.uid] = vmo;
      vmoList.push(vmo);
    }
    //선택된 트리가 있을 시 주소창 값 변경
    if (data.eventData != undefined) {
      let hash = window.location.hash.split('?');
      hash = hash[0];
      let originURL = window.location.origin + window.location.pathname + hash;
      let search = '';
      if (data.eventData.node) {
        let node = data.eventData.node;
        if (node.parent) {
          search = 'parent=' + node.parent + '&child=' + node.label;
        } else {
          search = 'parent=' + node.label;
        }
      } else if (data.eventData.folder) {
        let panel = data.eventData;
        if (panel.parent != null) {
          search = 'parent=' + panel.parent + '&child=' + panel.target;
        } else {
          search = 'parent=' + panel.target;
        }
        if (data.eventData.uid) {
          if (window.location.href.includes('uid')) {
            search;
          } else {
            search += '&uid=' + data.eventData.uid;
          }
        }
      }
      window.location.href = originURL + '?' + search;
      checkURL = originURL + '?' + search;
    }
    data.searchTree = vmoList;
    let childString = '';
    if (prop2 != '') {
      childString = prop1 + ' > ' + prop2;
    } else {
      childString = prop1;
    }
    data.searchValue = childString;
    data.searchTreeInput = performData;
    if (data.searchModel == 'panel' && data.eventMap['panelSearch'].using == undefined) {
      data.panelResult = '(' + performData.returnData.totalFound + ')';
    } else {
      data.panelResult = null;
    }
    return {
      searchTree: vmoList,
      totalFound: performData.returnData.totalFound,
    };
  }
}

export function dataFilter(response, columnFilters, sortCriteria, startIndex, pageSize, data) {
  let datas = response.searchTree;
  return datas;
}

export function turnTableView(data) {
  data.mainView = 'tableView';
}

export async function turnListView(data) {
  data.mainView = 'listView';
}

export async function turnTextView(data) {
  data.mainView = 'textView';
}

// 선택된 데이터가 존재할 시 이벤트 발생 창 띄울 때 크기 조정
export function reload(data) {
  if (data.eventMap['selectedTreeResult.selectionChangeEvent'].selectedObjects.length > 0) {
    if (window.location.href.includes('uid')) {
      checkURL = checkURL.split('&uid');
      window.location.href = checkURL[0] + '&uid=' + data.eventData.selectedObjects[0].uid;
      checkURL = checkURL[0] + '&uid=' + data.eventData.selectedObjects[0].uid;
    } else {
      window.location.href = window.location.href + '&uid=' + data.eventData.selectedObjects[0].uid;
    }
    data.popupWidth = window.innerWidth * 0.95;
    data.popupHeight = window.innerHeight * 0.95;
    eventBus.publish('selectionOn');
  }
}
// 질문,답변 데이터 로드
export async function loadQNA(data, ctx) {
  //카테고리 선택에 따라 질문리비전 검색
  let prop1 = '';
  let prop2 = '';
  if (data.eventData) {
    if (data.eventData.node) {
      if (data.eventData.node.parent) {
        prop1 = data.eventData.node.parent;
        prop2 = data.eventData.node.label;
      } else {
        prop1 = data.eventData.node.label;
        prop2 = '';
      }
    } else if (data.eventData.folder) {
      if (data.eventData.parent) {
        prop1 = data.eventData.parent;
        prop2 = data.eventData.target;
      } else {
        prop1 = data.eventData.target;
        prop2 = '';
      }
    } else if (data.eventData.selectedObjects) {
      if (data.searchModel == 'panel') {
        if (data.eventMap['panelSearch'].parent == null && data.eventMap['panelSearch'].target != '') {
          prop1 = data.eventMap['panelSearch'].target;
        } else if (data.eventMap['panelSearch'].parent != null) {
          prop2 = data.eventMap['panelSearch'].target;
          prop1 = data.eventMap['panelSearch'].parent;
        }
      } else if (data.searchModel == 'tree') {
        if (data.eventMap['partTree.treeNodeSelected'].node.children && data.eventMap['partTree.treeNodeSelected'].node.children.length < 0) {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
        } else if (!data.eventMap['partTree.treeNodeSelected'].node.children) {
          prop2 = data.eventMap['partTree.treeNodeSelected'].node.label;
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.parent;
        } else {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
        }
      }
    }
  }

  let inputData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: [
        'object_name',
        'object_desc',
        'l2_category',
        'l2_main_category',
        'l2_subcategory',
        'item_id',
        'items_tag',
        'creation_date',
        'owning_user',
      ],
      internalPropertyName: '',
      maxToLoad: 50,
      maxToReturn: 50,
      startIndex: 0,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: 'L2_QuestionRevision',
          },
        ],
        'POM_application_object.owning_group': [
          {
            searchFilterType: 'StringFilter',
            stringValue: ctx.userSession.props.group_name.dbValues[0],
          },
        ],
      },
    },
    noServiceData: false,
  };
  if (prop2 != '') {
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_main_category'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop1,
      },
    ];
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_subcategory'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop2,
      },
    ];
  } else if (prop1 != '') {
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_main_category'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop1,
      },
    ];
  }
  let policy = {
    types: [
      {
        name: 'L2_Question',
        properties: [{ name: 'L2_AnswerRelation' }, { name: 'obejct_name' }],
      },
    ],
    useRefCount: false,
  };
  //검색 완료
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData, policy);
  let gigi = JSON.parse(abc.searchResultsJSON);
  var modelObjects = [];
  for (var i = 0; i < gigi.objects.length; i++) {
    var uid = gigi.objects[i].uid;
    var obj = abc.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  let total = [];
  if (abc.ServiceData.modelObjects) {
    total = Object.values(abc.ServiceData.modelObjects);
  }
  //검색 결과에 따라 질문 리비전과 답변 아이템을 구분
  let questionList = [];
  let answerItem = [];
  let divRelation = [];
  for (let mo of total) {
    if (mo.type == 'L2_QuestionRevision') {
      questionList.push(mo);
    } else if (mo.type == 'L2_Answer') {
      answerItem.push(mo.uid);
    } else if (mo.type == 'L2_Question') {
      divRelation.push(mo);
    }
  }
  //답변 아이템 검색
  qList = questionList;

  let param = {
    uids: answerItem,
  };
  let policy2 = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [{ name: 'contents' }, { name: 'object_string' }, { name: 'revision_list' }, { name: 'owning_user' }],
      },
    ],
    useRefCount: false,
  };
  let idSearchList = [];
  try {
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    for (let uid of answerItem) {
      idSearchList.push(serachResult.modelObjects[uid]);
    }
  } catch (err) {
    //console.log(err);
    message.show(1, questionLoadError);
  }
  // 답변 리비전조회
  let answerList = [];
  for (let mo of idSearchList) {
    answerList.push(mo.props.revision_list.dbValues[0]);
  }
  param = {
    uids: answerList,
  };
  policy2 = {
    types: [
      {
        name: 'L2_AnswerRevision',
        properties: [{ name: 'object_string' }, { name: 'l2_content_string' }, { name: 'owning_user' }, { name: 'creation_date' }, { name: 'items_tag' }],
      },
    ],
    useRefCount: false,
  };
  let answerRevisions = [];
  try {
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    for (let uid of answerList) {
      answerRevisions.push(serachResult.modelObjects[uid]);
    }
    aList = answerRevisions;
  } catch (err) {
    //console.log(err);
    message.show(1, answerLoadError);
  }
  let vmoArray1 = [];
  let searchQList = {};
  for (let mo of qList) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.object_name.uiValues[0];
    vmo.sendURL = browserUtils.getBaseURL() + '#/questionAnswer?question=' + vmo.uid;
    vmoArray1.push(vmo);
    searchQList[mo.props.items_tag.dbValues[0]] = vmo;
  }
  qList = vmoArray1;
  let vmoArray2 = [];
  for (let mo of aList) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
    vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
    let showAnswer = {};
    showAnswer[textAnswer] = {
      key: textAnswer,
      value: mo.props.l2_content_string.dbValues[0],
    };
    vmo.cellProperties = showAnswer;
    let obj1 = await cdmSvc.getObject(vmo.props.owning_user.dbValues[0]);
    await dmSvc.getProperties([vmo.props.owning_user.dbValues[0]], ['awp0ThumbnailImageTicket']);
    let thumbnailUrl = obj1.props.awp0ThumbnailImageTicket.dbValues[0];
    if (thumbnailUrl !== '') {
      vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
    } else {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
    }
    vmoArray2.push(vmo);
  }
  aList = vmoArray2;
  //관계 식별을 위해 uid값을 키값으로 넣기
  let qaRelation = {};
  let haveAList = {};
  for (let mo of divRelation) {
    let vals = mo.props.L2_AnswerRelation.dbValues;
    haveAList[mo.uid] = vals;
    for (let uid of vals) {
      qaRelation[uid] = mo.uid;
    }
  }
  let showAList = [];
  for (let Qitem of qList) {
    if (haveAList[Qitem.props.items_tag.dbValues[0]].length > 0) {
      for (let a of aList) {
        if (qaRelation[a.props.items_tag.dbValues[0]] == Qitem.props.items_tag.dbValue) {
          a.cellHeader1 = a.props.owning_user.uiValues[0];
          a.cellHeader2 = a.props.creation_date.uiValues[0];
          let showAnswer = {};
          showAnswer[textAnswer] = {
            key: textAnswer,
            value: a.props.l2_content_string.dbValues[0],
          };
          a.cellProperties = showAnswer;
          a.sendURL = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].sendURL;
          a.qName = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].cellHeader1;
          a.qDate = Date.parse(searchQList[qaRelation[a.props.items_tag.dbValues[0]]].props.creation_date.dbValues[0]);
          a.qUID = qaRelation[a.props.items_tag.dbValues[0]];
          // let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
          // a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
          // return true;
          showAList.push(a);
        }
      }
    } else {
      Qitem.qName = Qitem.cellHeader1;
      Qitem.cellHeader1 = '';
      Qitem.cellHeader2 = textNoAnswer;
      Qitem.cellProperties = '';
      Qitem.qUID = Qitem.props.items_tag.dbValue;
      Qitem.qDate = Date.parse(Qitem.props.creation_date.dbValues[0]);
      showAList.push(Qitem);
    }
  }
  showAList.sort(function (a, b) {
    if (a.qDate >= b.qDate) {
      return -1;
    }
    return 1;
  });
  return {
    answer: showAList,
    answerFound: showAList.length,
  };
}
let countDatas;
//트리에 해당하는 자료의 갯수 출력
export async function countTree(data) {
  try {
    let ctx = appCtx.ctx;
    if (ctx.filterResult) {
      if (data.startIndex == 0) {
        countDatas = ctx.filterResult['L2_IssuePageRevision.l2_item'];
      } else {
        for (let item of ctx.filterResult['L2_IssuePageRevision.l2_item']) {
          countDatas.push(item);
        }
      }
      if (ctx.checkMoreSearch == true) {
        data.startIndex = ctx.filterEndIndex + 1;
        eventBus.publish('partDataTree.complete');
        return '';
      }
    }
    let inputTree = data.partDataTree;
    for (let tree of inputTree) {
      for (let val of countDatas) {
        if (val.stringValue == tree.label) {
          tree.count = ' (' + val.count + ')';
        }
      }
    }
    loadUtils.closeWindow(data);
  } catch (err) {
    message.show(1, dataLengthError);
    loadUtils.closeWindow(data);
  }
  let svgButton = document.querySelectorAll("aw-property-image[class='collapsed']");
  for (let i of svgButton) {
    i.addEventListener('click', function () {
      showChildTest(data, i);
    });
  }
  // data.partDat aTree = inputTree;
  //url에 입력값이 존재 할 경우 키,밸류값으로 담긴 배열로 전환
  let url = window.location.href;
  let url1 = decodeURI(url);
  url1 = url1.replace('%2F', '/');
  let urlAttrSearch = url1.split('?');
  if (urlAttrSearch.length > 1) {
    let urlAttr = urlAttrSearch[1];
    urlAttr = urlAttr.split('&');
    let attrs = {};
    if (urlAttr.length > 0) {
      for (let attr of urlAttr) {
        attr = attr.split('=');
        attrs[attr[0]] = attr[1];
      }
    }
    //전환한 배열을 바탕으로 이벤트에 데이터 담아서 보내기
    let search;
    let target;
    let parent;
    let uid;
    if (attrs.parent || attrs.child) {
      if (attrs.child) {
        parent = attrs.parent;
        target = attrs.child;
        search = folderObjs[attrs.parent].uid + attrs.child;
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
        // test() ㅡ 찾는 문자열이 들어있는지 확인
        if (regExp.test(search)) {
          search = search.replace(regExp, ''); // 찾은 특수 문자를 제거
        }
        uid = attrs.uid;
      } else {
        parent = null;
        search = folderObjs[attrs.parent].uid;
        target = attrs.parent;
        uid = attrs.uid;
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
        // test() ㅡ 찾는 문자열이 들어있는지 확인
        if (regExp.test(search)) {
          search = search.replace(regExp, ''); // 찾은 특수 문자를 제거
        }
      }
      let eventData = {
        folder: search,
        parent: parent,
        target: target,
        pno: '',
        mno: '',
        source: '',
        modelNo: '',
        period: null,
        allign: '',
        uid: uid,
        using: 'url',
      };
      await showChildTest(data, '', target);
      eventBus.publish('panelSearch', eventData);
    } else if (attrs.itemId) {
      let pram = await query.executeSavedQuery('Item...', ['아이템 ID'], [attrs.itemId]);
      let param1 = {
        objects: [pram[0]],
        attributes: ['l2_page_type', 'revision_list', 'l2_keywords'],
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param1);
      } catch (err) {
        //console.log(err);
      }
      let obj = await cdmSvc.getObject(pram[0].props.revision_list.dbValues[pram[0].props.revision_list.dbValues.length - 1]);
      param1 = {
        objects: [obj],
        attributes: ['l2_page_type', 'revision_list', 'l2_keywords'],
      };
      try {
        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param1);
      } catch (err) {
        //console.log(err);
      }
      if (obj.props.l2_keywords.dbValues[0] != null) {
        parent = obj.props.l2_page_type.dbValues[0];
        target = obj.props.l2_keywords.dbValues[0];
        search = obj.props.l2_page_type.dbValues[0] + obj.props.l2_keywords.dbValues[0];
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
        // test() ㅡ 찾는 문자열이 들어있는지 확인
        if (regExp.test(search)) {
          search = search.replace(regExp, ''); // 찾은 특수 문자를 제거
        }
        uid = obj.uid;
      } else {
        parent = null;
        search = obj.props.l2_page_type.dbValues[0];
        target = obj.props.l2_page_type.dbValues[0];
        uid = obj.uid;
      }
      let eventData = {
        folder: search,
        parent: parent,
        target: target,
        pno: '',
        mno: '',
        source: '',
        modelNo: '',
        period: null,
        allign: '',
        uid: uid,
        using: 'url',
      };
      await showChildTest(data, '', target);
      eventBus.publish('panelSearch', eventData);
    }
  }
}
// url에 uid가 존재시 검색을 다 하고 선택한 상태로 띄우기
export function urlUID(data) {
  checkEvent = data.eventData;
  if (data.eventData && data.eventData.uid != undefined) {
    let loadVM = data.dataProviders.selectedTreeResult.viewModelCollection.loadedVMObjects;
    let selectVMO;
    for (let vmo of loadVM) {
      if (data.eventData.uid == vmo.uid) {
        selectVMO = vmo;
      }
    }
    data.dataProviders.selectedTreeResult.selectionModel.addToSelection(selectVMO);
  }
}
// 팝업창을 띄우게 될 때 현재 창보다 크지 않도록 높이,넓이 지정
export function popupResizing(data) {
  data.popupWidth = window.innerWidth * 0.95;
  data.popupHeight = window.innerHeight * 0.95;
  let testView = document.getElementsByTagName('html');
  if (window.innerWidth < 900 && window.innerHeight < 900) {
    testView[0].style.fontSize = '12px';
  } else {
    testView[0].style.fontSize = '16px';
  }
}

// 팝업창을 닫게 될 경우 일부 자료 최신화
export function vmReload(data) {
  let checkList = data.dataProviders.selectedTreeResult.viewModelCollection.loadedVMObjects;

  if (checkList.length > 0) {
    for (let vmo of checkList) {
      // vmo.reviewCount = vmo.props.l2_like_count.dbValue;
      vmo.percent = ((vmo.props.l2_average_rating.dbValue * 100) / 5).toFixed(1) + '%';
      // if (vmo.props.l2_average_rating.dbValue > 0) {
      //     vmo.props.l2_average_rating.dbValue = vmo.props.l2_average_rating.dbValue.toFixed(1);
      // }
      // vmo.props.l2_image_path.dbValues[0] = totalImages[vmo.uid]
    }
    data.dataProviders.selectedTreeResult.viewModelCollection.loadedVMObjects = checkList;
    data.dataProviders.selectedTreeResult.selectNone();
  }
}

export async function testSelectNone(data) {}

export async function loadExpert(data, ctx) {
  let eqList;
  let eaList;
  //카테고리 선택에 따라 질문리비전 검색
  let prop1 = '';
  let prop2 = '';
  if (data.eventData) {
    if (data.eventData.node) {
      if (data.eventData.node.parent) {
        prop1 = data.eventData.node.parent;
        prop2 = data.eventData.node.label;
      } else {
        prop1 = data.eventData.node.label;
        prop2 = '';
      }
    } else if (data.eventData.folder) {
      if (data.eventData.parent) {
        prop1 = data.eventData.parent;
        prop2 = data.eventData.target;
      } else {
        prop1 = data.eventData.target;
        prop2 = '';
      }
    } else if (data.eventData.selectedObjects) {
      if (data.searchModel == 'panel') {
        if (data.eventMap['panelSearch'].parent == null && data.eventMap['panelSearch'].target != '') {
          prop1 = data.eventMap['panelSearch'].target;
        } else if (data.eventMap['panelSearch'].parent != null) {
          prop2 = data.eventMap['panelSearch'].target;
          prop1 = data.eventMap['panelSearch'].parent;
        }
      } else if (data.searchModel == 'tree') {
        if (data.eventMap['partTree.treeNodeSelected'].node.children && data.eventMap['partTree.treeNodeSelected'].node.children.length < 0) {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
        } else if (!data.eventMap['partTree.treeNodeSelected'].node.children) {
          prop2 = data.eventMap['partTree.treeNodeSelected'].node.label;
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.parent;
        } else {
          prop1 = data.eventMap['partTree.treeNodeSelected'].node.label;
        }
      }
    }
  }

  let inputData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: ['object_name', 'object_desc', 'l2_category', 'l2_main_category', 'l2_subcategory', 'item_id', 'items_tag', 'creation_date'],
      internalPropertyName: '',
      maxToLoad: 50,
      maxToReturn: 50,
      startIndex: 0,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: 'L2_QuestionExpRevision',
          },
        ],
        'POM_application_object.owning_group': [
          {
            searchFilterType: 'StringFilter',
            stringValue: ctx.userSession.props.group_name.dbValues[0],
          },
        ],
      },
    },
    noServiceData: false,
  };
  if (prop2 != '') {
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_main_category'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop1,
      },
    ];
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_subcategory'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop2,
      },
    ];
  } else if (prop1 != '') {
    inputData.searchInput.searchFilterMap6['L2_QuestionRevision.l2_main_category'] = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop1,
      },
    ];
  }
  let policy = {
    types: [
      {
        name: 'L2_Question',
        properties: [{ name: 'L2_AnswerRelation' }, { name: 'obejct_name' }],
      },
    ],
    useRefCount: false,
  };
  //검색 완료
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData, policy);
  let gigi = JSON.parse(abc.searchResultsJSON);
  var modelObjects = [];
  for (var i = 0; i < gigi.objects.length; i++) {
    var uid = gigi.objects[i].uid;
    var obj = abc.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  let total = [];
  if (abc.ServiceData.modelObjects) {
    total = Object.values(abc.ServiceData.modelObjects);
  }
  //검색 결과에 따라 질문 리비전과 답변 아이템을 구분
  let questionList = [];
  let answerItem = [];
  let divRelation = [];
  for (let mo of total) {
    if (mo.type == 'L2_QuestionExpRevision') {
      questionList.push(mo);
    } else if (mo.type == 'L2_AnswerExp') {
      answerItem.push(mo.uid);
    } else if (mo.type == 'L2_QuestionExp') {
      divRelation.push(mo);
    }
  }
  //답변 아이템 검색
  eqList = questionList;
  let param = {
    uids: answerItem,
  };
  let policy2 = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [{ name: 'contents' }, { name: 'object_string' }, { name: 'revision_list' }],
      },
    ],
    useRefCount: false,
  };
  let idSearchList = [];
  try {
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    for (let uid of answerItem) {
      idSearchList.push(serachResult.modelObjects[uid]);
    }
  } catch (err) {
    //console.log(err);
  }
  // 답변 리비전조회
  let answerList = [];
  for (let mo of idSearchList) {
    answerList.push(mo.props.revision_list.dbValues[0]);
  }
  param = {
    uids: answerList,
  };
  policy2 = {
    types: [
      {
        name: 'L2_AnswerExpRevision',
        properties: [{ name: 'object_string' }, { name: 'l2_content_string' }, { name: 'owning_user' }, { name: 'creation_date' }, { name: 'items_tag' }],
      },
    ],
    useRefCount: false,
  };
  let answerRevisions = [];
  try {
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
    for (let uid of answerList) {
      answerRevisions.push(serachResult.modelObjects[uid]);
    }
    eaList = answerRevisions;
  } catch (err) {
    //console.log(err);
  }
  let vmoArray1 = [];
  let searchQList = {};
  for (let mo of eqList) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.object_name.uiValues[0];
    vmo.sendURL = browserUtils.getBaseURL() + '#/askExpert?question=' + vmo.uid;
    vmoArray1.push(vmo);
    searchQList[mo.props.items_tag.dbValues[0]] = vmo;
  }
  eqList = vmoArray1;
  let vmoArray2 = [];
  for (let mo of eaList) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.owning_user.uiValues[0];
    vmo.cellHeader2 = mo.props.creation_date.uiValues[0];
    let showAnswer = {};
    showAnswer[textAnswer] = {
      key: textAnswer,
      value: mo.props.l2_content_string.dbValues[0],
    };
    vmo.cellProperties = showAnswer;
    let obj1 = await cdmSvc.getObject(vmo.props.owning_user.dbValues[0]);
    await dmSvc.getProperties([vmo.props.owning_user.dbValues[0]], ['awp0ThumbnailImageTicket']);
    let thumbnailUrl = obj1.props.awp0ThumbnailImageTicket.dbValues[0];
    if (thumbnailUrl !== '') {
      vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
    } else {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
    }
    vmoArray2.push(vmo);
  }
  eaList = vmoArray2;
  //관계 식별을 위해 uid값을 키값으로 넣기
  let qaRelation = {};
  let haveAList = {};
  for (let mo of divRelation) {
    let vals = mo.props.L2_AnswerRelation.dbValues;
    haveAList[mo.uid] = vals;
    for (let uid of vals) {
      qaRelation[uid] = mo.uid;
    }
  }
  // 답변과 질문 관계에 맞도록 반복문으로 넣어주기
  let showAList = [];
  for (let Qitem of eqList) {
    if (haveAList[Qitem.props.items_tag.dbValues[0]].length > 0) {
      for (let a of eaList) {
        if (qaRelation[a.props.items_tag.dbValues[0]] == Qitem.props.items_tag.dbValue) {
          a.cellHeader1 = a.props.owning_user.uiValues[0];
          a.cellHeader2 = a.props.creation_date.uiValues[0];
          let showAnswer = {};
          showAnswer[textAnswer] = {
            key: textAnswer,
            value: a.props.l2_content_string.dbValues[0],
          };
          a.cellProperties = showAnswer;
          a.sendURL = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].sendURL;
          a.qName = searchQList[qaRelation[a.props.items_tag.dbValues[0]]].cellHeader1;
          a.qDate = Date.parse(searchQList[qaRelation[a.props.items_tag.dbValues[0]]].props.creation_date.dbValues[0]);
          a.qUID = qaRelation[a.props.items_tag.dbValues[0]];
          // let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
          // a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
          // return true;
          showAList.push(a);
        }
      }
    } else {
      Qitem.qName = Qitem.cellHeader1;
      Qitem.cellHeader1 = '';
      Qitem.cellHeader2 = textNoAnswer;
      Qitem.cellProperties = '';
      Qitem.qUID = Qitem.props.items_tag.dbValue;
      Qitem.qDate = Date.parse(Qitem.props.creation_date.dbValues[0]);
      showAList.push(Qitem);
    }
  }
  showAList.sort(function (a, b) {
    if (a.qDate >= b.qDate) {
      return -1;
    }
    return 1;
  });
  return {
    expertAnswer: showAList,
    expertAnswerFound: showAList.length,
  };
}

let performSearch = async function (data, string, type, index, prop1, prop2, prop3, prop4, prop5, modelVal, docNo, allign) {
  if (modelVal != '') {
    string = string + ' AND ' + modelVal;
  }
  if (docNo != '') {
    string = string + ' AND ' + docNo;
  }
  let inputData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: [
        'object_name',
        'object_string',
        'checked_out_user',
        'object_desc',
        'release_status_list',
        'fnd0InProcess',
        'l2_image_path',
        'l2_like_count',
        'l2_average_rating',
        'l2_division',
        'l2_page_type',
        'l2_page_index',
        'l2_page_contents',
        'l2_clsf_no',
        'l2_keywords',
        'l2_issue_class',
        'l2_issue_classes',
        'l2_comments',
        'l2_comments_attachments',
        'l2_comments_string',
        'l2_content',
        'l2_content_string',
        'l2_pjt_name',
        'l2_platform_name',
        'l2_reference_issues',
        'l2_reference_posts',
        'l2_sub_title',
        'item_id',
        'IMAN_reference',
        'l2_doc_no',
        'l2_model',
        'l2_model_name',
        'l2_part',
        'l2_part_classification',
        'l2_source',
        'l2_creator',
        'l2_item',
        'l2_file_name',
        'l2_issue_pred',
      ],
      internalPropertyName: '',
      startIndex: 0,
      maxToLoad: 50,
      maxToReturn: 50,
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: string,
      },
      searchFilterFieldSortType: 'Priority',
      searchFilterMap6: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: type,
          },
        ],
        'L2_IssuePageRevision.l2_item': [
          {
            searchFilterType: 'StringFilter',
            stringValue: prop1,
          },
        ],
        'L2_PostRevision.l2_division': [
          {
            searchFilterType: 'StringFilter',
            stringValue: prop5,
          },
        ],
      },
      cursor: {
        startIndex: index,
      },
      searchSortCriteria: [
        {
          fieldName: 'L2_IssuePageRevision.l2_issue_pred',
          sortDirection: 'DESC',
        },
      ],
    },
    noServiceData: false,
  };
  if (!(prop2 == null || prop2 == '')) {
    let searchProp2 = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop2,
      },
    ];
    inputData.searchInput.searchFilterMap6['L2_IssuePageRevision.l2_issue_classes'] = searchProp2;
  }
  if (!(prop3 == null || prop3 == '')) {
    let searchProp3 = [
      {
        searchFilterType: 'StringFilter',
        stringValue: prop3,
      },
    ];
    inputData.searchInput.searchFilterMap6['L2_PageRevision.l2_source'] = searchProp3;
  }
  if (!(prop4 == null || prop4 == '')) {
    let today = new Date();
    let before = today.valueOf() - Number(prop4);
    before = new Date(before);
    today.setHours(23, 59, 59);
    before.setHours(0, 0, 0);
    let searchProp3 = [
      {
        searchFilterType: 'DateFilter',
        startDateValue: before.toISOString(),
        endDateValue: today.toISOString(),
      },
    ];
    inputData.searchInput.searchFilterMap6['L2_IssuePageRevision.l2_issue_date'] = searchProp3;
  }
  if (!(allign == null || allign == '')) {
    if (allign == 'recent') {
      inputData.searchInput.searchSortCriteria = [];
    } else if (allign == 'starPoint') {
      inputData.searchInput.searchSortCriteria = [
        {
          fieldName: 'L2_PostRevision.l2_average_rating',
          sortDirection: 'DESC',
        },
      ];
    } else if (allign == 'accuracy') {
      inputData.searchInput.searchSortCriteria = [
        {
          fieldName: 'L2_IssuePageRevision.l2_issue_pred',
          sortDirection: 'DESC',
        },
      ];
    }
  }
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
  let gigi = JSON.parse(abc.searchResultsJSON);
  var modelObjects = [];
  for (var i = 0; i < gigi.objects.length; i++) {
    var uid = gigi.objects[i].uid;
    var obj = abc.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  if (data.searchModel == 'panel' && data.eventData.using == undefined) {
    data.stringResult = string + ' 의 검색결과';
  } else {
    data.stringResult = null;
  }
  if (index < 1) {
    await common.userLogsInsert('Search Knowledge Files', '', 'S', 'Sucess', '', prop1, prop2);
  }
  return {
    modelObjects: modelObjects,
    returnData: abc,
  };
};

function searchCriteria() {
  let searchCriteria = {
    searchString: '*',
    forceThreshold: 'false',
    categoryForFacetSearch: 'L2_IssuePageRevision.l2_item',
    facetSearchString: '',
  };
  return searchCriteria;
}

function searchFilterMap(data) {
  let ctx = appCtx.ctx;
  let searchFilterMap = {
    'WorkspaceObject.object_type': [
      {
        searchFilterType: 'StringFilter',
        stringValue: 'L2_IssuePageRevision',
        colorValue: '',
        stringDisplayValue: '',
        startDateValue: '',
        endDateValue: '',
        startNumericValue: 0,
        endNumericValue: 0,
        count: 0,
        selected: false,
        startEndRange: '',
      },
    ],
    'L2_PostRevision.l2_division': [
      {
        searchFilterType: 'StringFilter',
        stringValue: ctx.userSession.props.group_name.dbValue,
        colorValue: '',
        stringDisplayValue: '',
        startDateValue: '',
        endDateValue: '',
        startNumericValue: 0,
        endNumericValue: 0,
        count: 0,
        selected: false,
        startEndRange: '',
      },
    ],
  };
  return searchFilterMap;
}

async function showChildTest(data, a, text) {
  let textValue;
  if (a != '') {
    let parent = a.parentNode;
    let textShow = $(parent).children('.aw-ui-treeNodeValue').children('span').text();
    textShow = textShow.split(' (');
    textValue = textShow[0];
  } else {
    textValue = text;
  }
  let counts = [];
  try {
    counts = await getCountData(textValue);
  } catch (err) {
    //console.log(err)
    message.show(1, childLoadError);
  }
  let searchCount = {};
  for (let num of counts) {
    searchCount[num.stringValue] = num.count;
  }
  for (let i of data.partDataTree) {
    if (i.label == textValue && i.children[0].label == '') {
      let treeChildren = [];
      for (let file of data.treeArray[textValue]) {
        let explain = issueName[file];
        if (issueName[file] == null) {
          explain = file;
        }
        let countNum = searchCount[file];
        if (!countNum) {
          countNum = 0;
        }
        let inputChildren = {
          label: file,
          value: folderObjs[textValue].uid + file,
          parent: textValue,
          explain: explain,
          count: '(' + countNum + ')',
        };
        var regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
        // test() ㅡ 찾는 문자열이 들어있는지 확인
        if (regExp.test(inputChildren.value)) {
          inputChildren.value = inputChildren.value.replace(regExp, ''); // 찾은 특수 문자를 제거
        }
        treeChildren.push(inputChildren);
      }
      i.children = treeChildren;
    }
  }
}

async function getCountData(prop1) {
  let ctx = appCtx.ctx;
  let inputData = {
    facetSearchInput: {
      providerName: 'Awp0FullTextSearchProvider',
      searchCriteria: {
        searchString: '*',
        forceThreshold: 'false',
        categoryForFacetSearch: 'L2_IssuePageRevision.l2_issue_classes',
        facetSearchString: '',
      },
      searchFilterMap: {
        'WorkspaceObject.object_type': [
          {
            searchFilterType: 'StringFilter',
            stringValue: 'L2_IssuePageRevision',
            colorValue: '',
            stringDisplayValue: '',
            startDateValue: '',
            endDateValue: '',
            startNumericValue: 0,
            endNumericValue: 0,
            count: 0,
            selected: false,
            startEndRange: '',
          },
        ],
        'L2_IssuePageRevision.l2_item': [
          {
            searchFilterType: 'StringFilter',
            stringValue: prop1,
            colorValue: '',
            stringDisplayValue: '',
            startDateValue: '',
            endDateValue: '',
            startNumericValue: 0,
            endNumericValue: 0,
            count: 0,
            selected: false,
            startEndRange: '',
          },
        ],
        'L2_PostRevision.l2_division': [
          {
            searchFilterType: 'StringFilter',
            stringValue: ctx.userSession.props.group_name.dbValues[0],
            colorValue: '',
            stringDisplayValue: '',
            startDateValue: '',
            endDateValue: '',
            startNumericValue: 0,
            endNumericValue: 0,
            count: 0,
            selected: false,
            startEndRange: '',
          },
        ],
      },
      startIndex: 0,
      maxToReturn: 100,
    },
  };
  try {
    let abc = await SoaService.post('Internal-AWS2-2018-05-Finder', 'performFacetSearch', inputData);
    return abc.searchFilterMap['L2_IssuePageRevision.l2_issue_classes'];
  } catch (err) {
    message.show(1, fileLengthError);
    return;
  }
}

async function createChild(data) {
  let prop1;
  if (data.eventData.parent) {
    prop1 = data.eventData.parent;
  } else {
    prop1 = data.eventData.target;
  }
  await showChildTest(data, '', prop1);
}

let exports = {};

export default exports = {
  loadTreeData,
  loadSelectData,
  dataFilter,
  turnTableView,
  turnListView,
  turnTextView,
  reload,
  loadQNA,
  countTree,
  urlUID,
  popupResizing,
  vmReload,
  testSelectNone,
  loadExpert,
  searchCriteria,
  searchFilterMap,
  createChild,
};
app.factory('knowledgeWarehouseService', () => exports);
