import app from 'app';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import browserUtils from 'js/browserUtils';
import common from 'js/utils/lgepCommonUtils';
import appCtx from 'js/appCtxService';
import awTableSvc from 'js/awTableService';
import dmSvc from 'soa/dataManagementService';
import com from 'js/utils/lgepObjectUtils';
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import query from 'js/utils/lgepQueryUtils';
import notySvc from 'js/NotyModule';
import iconService from 'js/iconService';
import message from 'js/utils/lgepMessagingUtils';
import viewModelService from 'js/viewModelObjectService';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import fmsUtils from 'js/fmsUtils';
import lgepObjectUtils from 'js/utils/lgepObjectUtils';
var $ = require('jQuery');

let objString;
let objectItem;
let commentPoints = [];
let fileTestList = null;
let recommendLists = null;
let selectedFile;
let selectedRecommend;
let buttonEdit2 = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'buttonEdit2');
let buttonDelete = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'buttonDelete');
let buttonCancle = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'buttonCancle');
let deleteComplete = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'deleteComplete');
let writeComplete = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'writeComplete');
let checkDelete = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'checkDelete');
const recentSearches = lgepLocalizationUtils.getLocalizedText('knowledgeSearchMessages', 'recentSearches');
let realThumbnail = null;
let recList = {};
let totalList = {};
let beforeSelect;
function leftClick(e) {
  if (e.wheelDelta && e.wheelDelta >= 120) {
    // console.log('leftClick', e.wheelDelta);
    document.getElementsByClassName('leftArrow')[0].click();
  } else if (!e.wheelDelta) {
    document.getElementsByClassName('leftArrow')[0].click();
  }
}
function rightClick(e) {
  if (e.wheelDelta && e.wheelDelta <= -120) {
    // console.log('rightClick', e.wheelDelta);
    document.getElementsByClassName('rightArrow')[0].click();
  } else if (!e.wheelDelta) {
    document.getElementsByClassName('rightArrow')[0].click();
  }
}
// 선택한 데이터 불러오기
export async function getData(data, actions, ctx) {
  data.centerView = 'Image';
  // 이전 페이지에서 선택된 오브젝트의 데이터를 갖고오기
  let select = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
  let selectedObj = null;

  if (select != undefined) {
    selectedObj = select.dataProviders.selectedTreeResult.selectedObjects[0];
  } else {
    select = vms.getViewModelUsingElement(document.getElementById('myDocument'));
    if (!select) {
      selectedObj = ctx.selected;
    } else {
      selectedObj = select.eventData.selectedObjects[0];
    }
    // data.dataProviders.fileList.selectionModel.addToSelection(selectedObj);
  }
  beforeSelect = selectedObj;
  //나중에 지울 수 있음 아이템 가져오기
  data.origin.uiValue = selectedObj.props.l2_file_name.uiValues[0];
  data.selectedObj = selectedObj;
  data.moreInfoTab.tabKey = 'showInfo';
  data.listTab.tabKey = 'showRecommend';
  try {
    let prefer = await lgepPreferenceUtils.getPreference('L2_DevKnowledge_Favorites');
    let favoriteUID = prefer.Preferences.prefs[0].values[0].value;

    let getFolder = {
      uids: [favoriteUID],
    };
    getFolder = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getFolder);
    getFolder = Object.values(getFolder.modelObjects)[0];

    await com.getProperties([getFolder], ['contents', 'owning_user']);

    let folders = getFolder.props.contents.dbValues;

    getFolder = {
      uids: folders,
    };
    folders = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', getFolder);
    folders = Object.values(folders.modelObjects);
    await com.getProperties(folders, ['contents', 'owning_user']);

    let folderList = [];
    for (let folder of folders) {
      if (folder.props.owning_user.dbValues[0] === ctx.user.uid && folder.props.object_string.dbValues[0] != recentSearches) {
        folderList.push(folder);
      }
    }

    let flag = false;
    for (let folder of folderList) {
      for (let content of folder.props.contents.dbValues) {
        if (content === selectedObj.uid) {
          flag = true;
        }
      }
    }
    if (selectedObj != null && flag) {
      data.buttonStar.iconName = 'FilledStar';
    }
  } catch (err) {
    //console.log(err);
    message.show(1, '즐겨찾기 목록 확인중 오류가 발생했습니다.');
  }
  var check1 = document.getElementsByClassName('leftArrowSpace')[0];
  check1.removeEventListener('click', leftClick);
  check1.addEventListener('click', leftClick);
  var check2 = document.getElementsByClassName('rightArrowSpace')[0];
  check2.removeEventListener('click', rightClick);
  check2.addEventListener('click', rightClick);
  var space = document.getElementsByClassName('spaceTest')[0];
  space.removeEventListener('wheel', leftClick);
  space.addEventListener('wheel', leftClick);
  space.removeEventListener('wheel', rightClick);
  space.addEventListener('wheel', rightClick);
  eventBus.publish('providerTest');
}

export function buttonTest(data) {
  if (data.buttonStar.iconName == 'FilledStar') {
    data.buttonStar.iconName = 'EmptyStar';
  } else {
    data.buttonStar.iconName = 'FilledStar';
  }
}

export async function reviewSubmit(data, ctx) {
  let stars = document.getElementsByName('rating');
  let reviewValue = data.review.dbValue;
  let starPoint = 0;
  for (let i in stars) {
    if (stars[i].checked == true) {
      starPoint = stars[i].value;
    }
  }
  starPoint = starPoint.toString();
  // 댓글 아이템 생성
  let param = {
    properties: [
      {
        name: objString + '댓글',
        type: 'L2_Rating',
      },
    ],
  };
  let createResult;
  let createItem;
  try {
    createResult = await SoaService.post('Core-2006-03-DataManagement', 'createItems', param);

    createItem = createResult.output[0].item;
    if (reviewValue == null) {
      reviewValue = '';
    }
    //관계 맺기
    var jsoObj = {
      input: [
        {
          clientId: '',
          relationType: 'l2_reference_posts',
          primaryObject: objectItem,
          secondaryObject: createItem,
        },
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
    var jsoObj = {
      input: [
        {
          clientId: '',
          relationType: 'l2_reference_post',
          primaryObject: createItem,
          secondaryObject: objectItem,
        },
      ],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
    //댓글 아이템 리비전 조회
    param = {
      objects: [createItem],
      attributes: ['revision_list'],
    };
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
    let lastNum = createItem.props.revision_list.dbValues.length;
    let revisionUid = createItem.props.revision_list.dbValues[lastNum - 1];
    let revision;
    let policy1 = {
      types: [
        {
          name: 'L2_RatingRevision',
          properties: [{ name: 'object_desc' }, { name: 'l2_rating_name' }, { name: 'owning_user' }, { name: 'creation_date' }],
        },
      ],
      useRefCount: false,
    };
    param = {
      uids: [revisionUid],
    };
    let serachResult = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy1);
    revision = serachResult.modelObjects[revisionUid];

    param = {
      objects: [revision],
      attributes: {
        l2_rating: {
          stringVec: [starPoint],
        },
        object_desc: {
          stringVec: [reviewValue],
        },
      },
    };
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    data.pointList.push(starPoint);
    let totalTmp = 0;
    for (let i in data.pointList) {
      totalTmp += Number(data.pointList[i]);
    }
    data.avrPoint = (totalTmp / data.pointList.length).toFixed(1);

    notySvc.showInfo(writeComplete);
    data.review.dbValue = '';
    for (let i in stars) {
      if (stars[i].checked == true) {
        stars[i].checked = false;
      }
    }
    await common.userLogsInsert('create Rating Obejct', createItem.uid, 'S', 'createObjects');
  } catch (err) {
    await common.userLogsInsert('create Rating Obejct', createItem.uid, 'F', 'createObjects');
    message.show(1, '댓글 생성 중 오류가 발생했습니다.');
  }
  eventBus.publish('commentComplete');
}

export async function loadComment(data) {
  // let queryTest = await query.executeSavedQuery("ReplySearch", ["L2_item_id"], [selectedObj.props.item_id.dbValue]);
  let queryTest = [];
  if (objectItem) {
    if (objectItem.props.l2_reference_posts.dbValues.length > 0) {
      let comments = objectItem.props.l2_reference_posts.dbValues;
      let input = {
        uids: comments,
      };
      let policy2 = {
        types: [
          {
            name: 'L2_Rating',
            properties: [{ name: 'revision_list' }, { name: 'l2_reference_post' }, { name: 'l2_reference_posts' }],
          },
        ],
        useRefCount: false,
      };
      try {
        let responseItem = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', input, policy2);
        let mobjs = Object.values(responseItem.modelObjects);
        for (let revision of mobjs) {
          if (revision.type == 'L2_RatingRevision') {
            queryTest.push(revision);
          }
        }
        let param = {
          objects: queryTest,
          attributes: ['l2_rating', 'owning_user', 'creation_date', 'l2_reference_post', 'l2_like_count'],
        };
        await SoaService.post('Core-2006-03-DataManagement', 'getProperties', param);
      } catch (err) {
        //console.log(err);
        message.show(1, '댓글 불러오는 중 오류가 발생했습니다.');
      }
      queryTest.sort(function (a, b) {
        if (a.props.creation_date.dbValues[0] >= b.props.creation_date.dbValues[0]) {
          return 1;
        }
        return -1;
      });
    }
  }
  let comments = queryTest;
  let vmoList = [];
  let avrPoint = null;
  commentPoints = [];
  for (let check of comments) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(check);
    let percent = Number(vmo.props.l2_rating.dbValues[0]);
    commentPoints.push(percent);
    avrPoint += percent;
    percent = (percent / 5) * 100 + '%';
    vmo.percent = percent;
    vmo.buttonEdit2 = buttonEdit2;
    vmo.buttonDelete = buttonDelete;
    vmoList.push(vmo);
  }
  avrPoint = avrPoint / vmoList.length;
  if (isNaN(avrPoint)) {
    avrPoint = 0;
  }
  data.avrPoint = avrPoint.toFixed(1);
  data.avrPercent = (data.avrPoint * 100) / 5 + '%';
  data.pointList = commentPoints;
  return {
    comments: vmoList,
    totalFound: vmoList.length,
  };
}

export async function loadLists(data) {
  //중복실행 방지를 위해 추가함
  let select = null;
  let htmlData;
  if (window.location.href.includes('Warehouse')) {
    htmlData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
    select = htmlData.dataProviders.selectedTreeResult.selectedObjects[0];
  } else if (window.location.href.includes('MyDocument')) {
    htmlData = vms.getViewModelUsingElement(document.getElementById('myDocument'));
    select = htmlData.eventData.selectedObjects[0];
  } else {
    select = appCtx.ctx.selected;
  }
  let fileList = '';
  let origin = null;
  if (data.selectedObj == undefined) {
    origin = select.props.l2_reference_issues.dbValues[0];
    data.selectedObj = select;
  } else {
    origin = data.selectedObj.props.l2_reference_issues.dbValue[0];
  }
  var inputData = {
    inflateProperties: true,
    searchInput: {
      attributesToInflate: [
        'object_name',
        'checked_out_user',
        'object_desc',
        'release_status_list',
        'fnd0InProcess',
        'l2_division',
        'l2_page_type',
        'l2_page_index',
        'l2_keywords',
        'l2_issue_class',
        'l2_issue_date',
        'l2_content_string',
        'l2_comments',
        'l2_comments_attachments',
        'l2_comments_string',
        'l2_contents',
        'l2_contents_string',
        'l2_pjt_name',
        'l2_platform_name',
        'l2_reference_issues',
        'l2_reference_posts',
        'l2_sub_title',
        'IMAN_reference',
        'l2_model_name',
        'l2_doc_no',
        'l2_image_path',
        'l2_item',
        'l2_file_name',
        'l2_source',
        'l2_creator',
        'l2_issue_pred',
      ],
      internalPropertyName: '',
      maxToLoad: -1,
      maxToReturn: -1,
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
            stringValue: 'L2_IssuePageRevision',
          },
        ],
        'L2_IssuePageRevision.l2_reference_issues': [
          {
            searchFilterType: 'StringFilter',
            stringValue: origin,
          },
        ],
      },
    },
    noServiceData: false,
  };
  let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
  let gigi = JSON.parse(abc.searchResultsJSON);
  var modelObjects = [];
  for (var i = 0; i < gigi.objects.length; i++) {
    var uid = gigi.objects[i].uid;
    var obj = abc.ServiceData.modelObjects[uid];
    modelObjects.push(obj);
  }
  let imageUID = [];
  for (let mo of modelObjects) {
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
    message.show(1, '썸네일 이미지 로드 중 오류가 발생했습니다.');
  }

  modelObjects = modelObjects.sort(function (a, b) {
    if (Number(a.props['l2_page_index'].dbValues[0]) < Number(b.props['l2_page_index'].dbValues[0])) {
      return -1;
    }
    return 1;
  });
  let vmoPages = [];
  for (let page of modelObjects) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(page);
    let thumbnailUrl = imageThumb[vmo.props.IMAN_reference.dbValues[0]];
    if (thumbnailUrl) {
      vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
      vmo.viewImage = vmo.thumbnailURL;
    } else {
      vmo.thumbnailURL = iconService.getTypeIconFileUrl('cmdLargeImageView24.svg');
      vmo.viewImage = vmo.thumbnailURL;
    }
    vmo.hasThumbnail = true;
    vmoPages.push(vmo);
    if (page.props.object_string.dbValues[0] == data.selectedObj.props.object_string.dbValues[0]) {
      data.selectedObj = vmo;
    }
  }
  fileList = vmoPages;
  fileTestList = fileList;
  return {
    lists: fileList,
    listsFound: fileList.length,
  };
}
//목록에서 선택이 바뀔 때
export async function selectChange(data, ctx) {
  data.zoomSliderProp.dbValue[0].sliderOption.value = 1.0;
  let selectedObj;
  let tabKey = null;
  //선택된 탭이 전체일때
  if (data.listTab.tabKey == 'showFile') {
    selectedObj = data.dataProviders.fileList.selectedObjects[0];
    if (selectedObj == undefined) {
      selectedObj = selectedFile;
    }
    let loadVmo = data.dataProviders.recommendList.viewModelCollection.loadedVMObjects;
    data.dataProviders.recommendList.selectionModel.selectNone();
    for (let vmo of loadVmo) {
      if (vmo.uid == selectedObj.uid) {
        data.dataProviders.recommendList.selectionModel.addToSelection(vmo);
      }
    }
  } else if (data.listTab.tabKey == 'showRecommend') {
    selectedObj = data.dataProviders.recommendList.selectedObjects[0];
    if (selectedObj == undefined) {
      selectedObj = selectedRecommend;
    }
    let recVmo = data.dataProviders.fileList.viewModelCollection.loadedVMObjects;
    data.dataProviders.fileList.selectionModel.selectNone();
    for (let vmo of recVmo) {
      if (vmo.uid == selectedObj.uid) {
        data.dataProviders.fileList.selectionModel.addToSelection(vmo);
      }
    }
  } else {
    selectedObj = data.dataProviders.fileList.selectedObjects[0];
  }
  if (selectedObj.thumbnailURL != null && selectedObj.thumbnailURL != '') {
    realThumbnail = selectedObj.thumbnailURL;
  }
  //label에 값 넣기
  objString = selectedObj.props.object_string.dbValues[0];
  data.image1.dbValue = selectedObj.viewImage;
  let showText = selectedObj.props.l2_content_string.dbValue.replaceAll('\n', '<br>');
  $('#showText').html(showText);
  let item = null;
  let test;
  let policy2 = {
    types: [
      {
        name: 'L2_DevKnowledgeIssue',
        properties: [
          { name: 'object_name' },
          { name: 'object_string' },
          { name: 'object_desc' },
          { name: 'l2_creator' },
          { name: 'l2_division' },
          { name: 'l2_doc_class' },
          { name: 'l2_doc_file_seq' },
          { name: 'l2_doc_key' },
          { name: 'l2_doc_no' },
          { name: 'l2_doc_source' },
          { name: 'l2_doc_sys' },
          { name: 'l2_file_code' },
          { name: 'l2_file_name' },
          { name: 'l2_issue_date' },
          { name: 'l2_model_name' },
          { name: 'l2_platform_name' },
          { name: 'l2_update_date' },
          { name: 'IMAN_reference' },
          { name: 'l2_prj_name' },
        ],
      },
    ],
    useRefCount: false,
  };
  let policy3 = {
    types: [
      {
        name: 'L2_IssuePage',
        properties: [
          { name: 'object_name' },
          { name: 'object_string' },
          { name: 'object_desc' },
          { name: 'item_id' },
          { name: 'l2_platform_name' },
          { name: 'l2_part' },
          { name: 'l2_page_index' },
          { name: 'l2_model' },
          { name: 'l2_like_count' },
          { name: 'l2_keywords' },
          { name: 'l2_source_system' },
          { name: 'l2_source' },
          { name: 'l2_source_link' },
          { name: 'l2_reference_posts' },
          { name: 'l2_reference_issues' },
          { name: 'l2_reference_division' },
          { name: 'l2_reference_area' },
          { name: 'l2_issue_date' },
          { name: 'l2_doc_no' },
          { name: 'l2_prj_name' },
          { name: 'l2_image_path' },
          { name: 'IMAN_reference' },
          { name: 'L2_RelatedPosts' },
        ],
      },
    ],
    useRefCount: false,
  };
  let param = {
    uids: [selectedObj.props.items_tag.dbValue],
  };
  if (selectedObj.props.l2_reference_issues.dbValues[0]) {
    param.uids.push(selectedObj.props.l2_reference_issues.dbValues[0]);
  }
  if (selectedObj.props.IMAN_reference.dbValues[0]) {
    param.uids.push(selectedObj.props.IMAN_reference.dbValues[0]);
  }
  let imageData;
  try {
    let responseItem = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy3);
    item = responseItem.modelObjects[selectedObj.props.items_tag.dbValue];
    objectItem = item;
    test = responseItem.modelObjects[selectedObj.props.l2_reference_issues.dbValues[0]];
  } catch (err) {
    //console.log(err);
  }
  switch (true) {
    case !selectedObj.props.object_string.dbValues[0]:
      selectedObj.props.object_string.dbValues[0] = '';
      break;
    case !selectedObj.props.l2_model_name.uiValues[0]:
      selectedObj.props.l2_model_name.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_source.uiValues[0]:
      selectedObj.props.l2_source.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_doc_no.uiValues[0]:
      selectedObj.props.l2_doc_no.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_file_name.uiValues[0]:
      selectedObj.props.l2_file_name.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_issue_date.uiValues[0]:
      selectedObj.props.l2_issue_date.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_creator.uiValues[0]:
      selectedObj.props.l2_creator.uiValues[0] = '';
      break;
    case !selectedObj.props.l2_issue_pred.dbValue:
      selectedObj.props.l2_issue_pred.dbValue = 0.0;
      break;
  }
  objString = selectedObj.props.object_string.dbValues[0];
  data.realModel.uiValue = selectedObj.props.l2_model_name.uiValues[0];
  data.source.uiValue = selectedObj.props.l2_source.uiValues[0];
  data.docNo.uiValue = selectedObj.props.l2_doc_no.uiValues[0];
  data.model.uiValue = selectedObj.props.l2_file_name.uiValues[0];
  data.issueDate.uiValue = selectedObj.props.l2_issue_date.uiValues[0];
  // data.originUid = imageData.props.ref_list.dbValues[0]; // 파일 다운로드 uid
  data.creater.uiValue = selectedObj.props.l2_creator.uiValues[0];
  let issuePred = selectedObj.props.l2_issue_pred.dbValue;
  data.issuePred.uiValue = (issuePred * 100).toFixed(1) + '%';
  selectedObj.props.l2_issue_pred.uiValue = (issuePred * 100).toFixed(1);
  data.selectedObj = selectedObj;
  eventBus.publish('update.comments');
}
// 댓글삭제
export async function deleteComment(data) {
  var buttonArray = [];
  buttonArray.push({
    addClass: 'btn btn-notify',
    text: buttonDelete,
    onClick: async function ($noty) {
      $noty.close();
      let itemUid = data.selectComment.props.items_tag.dbValue;
      let deleteItem;
      let param = {
        uids: [itemUid],
      };
      let policy2 = {
        types: [
          {
            name: 'L2_Rating',
            properties: [{ name: 'object_name' }, { name: 'object_string' }, { name: 'object_desc' }, { name: 'l2_reference_post' }],
          },
        ],
        useRefCount: false,
      };
      try {
        let responseItem = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param, policy2);
        deleteItem = responseItem.modelObjects[itemUid];
        let posts = objectItem.props.l2_reference_posts.dbValues;
        let postValues = [];
        for (let post of posts) {
          if (post != deleteItem.uid) {
            postValues.push(post);
          }
        }
        let setPropsItem = {
          objects: [objectItem],
          attributes: {
            l2_reference_posts: {
              stringVec: postValues,
            },
          },
        };
        await SoaService.post('Core-2007-01-DataManagement', 'setProperties', setPropsItem);

        param = {
          objects: [deleteItem],
        };
        await common.userLogsInsert('delete Rating Obejct', deleteItem.uid, 'S', 'deleteObjects');
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', param);
      } catch (err) {
        //console.log(err);
        await common.userLogsInsert('delete Rating Obejct', deleteItem.uid, 'F', 'deleteObjects');
        message.show(1, '댓글 삭제 중 오류가 발생했습니다.');
      }
      notySvc.showInfo(deleteComplete);
      data.dataProviders.comments.viewModelCollection.clear();
      eventBus.publish('update.comments');
    },
  });
  buttonArray.push({
    addClass: 'btn btn-notify',
    text: buttonCancle,
    onClick: function ($noty) {
      $noty.close();
    },
  });
  notySvc.showWarning(checkDelete, buttonArray);
}
// 편집모드 설정
export function changeTrue(data) {
  if (data.dataProviders.comments.selectedObjects) {
    let selectComment = data.dataProviders.comments.selectedObjects[0];
    if (selectComment) {
      data.selectComment = selectComment;
    }
  }
}
// 댓글 변경
export function editComment(data) {
  data.selectComment;
  let stars = document.getElementsByName('rating');
  data.review.dbValue = data.selectComment.props.object_desc.dbValue;
  let starPoint = data.selectComment.props.l2_rating.dbValue;
  for (let i = 0; i < stars.length; i++) {
    if (stars[i].value == starPoint) {
      stars[i].checked = true;
    }
  }
  data.editMode = true;
}
// 작성완료시 댓글 생성
export async function editModeComplete(data) {
  data.editMode = false;
  let stars = document.getElementsByName('rating');
  let reviewValue = data.review.dbValue;
  let starPoint = null;
  for (let i in stars) {
    if (stars[i].checked == true) {
      starPoint = stars[i].value;
    }
  }
  let param = {
    objects: [data.selectComment],
    attributes: {
      l2_rating: {
        stringVec: [starPoint],
      },
      object_desc: {
        stringVec: [reviewValue],
      },
    },
  };
  try {
    await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    await common.userLogsInsert('edit Rating Obejct', data.selectComment.uid, 'S', 'setProperties');
  } catch (err) {
    //console.log(err);
    await common.userLogsInsert('edit Rating Obejct', data.selectComment.uid, 'F', 'setProperties');
    message.show(1, '댓글 편집 중 오류가 발생했습니다.');
  }
  data.review.dbValue = '';
  for (let i in stars) {
    if (stars[i].checked == true) {
      stars[i].checked = false;
    }
  }
  eventBus.publish('update.comments');
}
// 편집 취소시
export function editModeCancle(data) {
  data.editMode = false;
  data.review.dbValue = '';
  let stars = document.getElementsByName('rating');
  for (let i in stars) {
    if (stars[i].checked == true) {
      stars[i].checked = false;
    }
  }
}
// 이미지에서 화살표로 왼쪽을 누른경우
export function moveBefore(data) {
  let list;
  let loadVm;
  let selected;
  if (data.listTab.tabKey == 'showFile') {
    list = data.dataProviders.fileList;
    loadVm = data.dataProviders.fileList.viewModelCollection.loadedVMObjects;
    selected = data.dataProviders.fileList.selectedObjects[0];
  } else if (data.listTab.tabKey == 'showRecommend') {
    list = data.dataProviders.recommendList;
    loadVm = data.dataProviders.recommendList.viewModelCollection.loadedVMObjects;
    selected = data.dataProviders.recommendList.selectedObjects[0];
  }

  let now;
  for (let i in loadVm) {
    if (loadVm[i] == selected) {
      now = i;
    }
  }
  if (now == 0) {
    //
  } else {
    now -= 1;
    list.selectionModel.addToSelection(loadVm[now]);
    list.selectionModel.removeFromSelection(loadVm[now + 1]);
    data.selectedObj = loadVm[now];
  }
}
// 이미지에서 화살표로 오른쪽을 누른경우
export function moveAfter(data) {
  let list;
  let loadVm;
  let selected;
  if (data.listTab.tabKey == 'showFile') {
    list = data.dataProviders.fileList;
    loadVm = data.dataProviders.fileList.viewModelCollection.loadedVMObjects;
    selected = data.dataProviders.fileList.selectedObjects[0];
  } else if (data.listTab.tabKey == 'showRecommend') {
    list = data.dataProviders.recommendList;
    loadVm = data.dataProviders.recommendList.viewModelCollection.loadedVMObjects;
    selected = data.dataProviders.recommendList.selectedObjects[0];
  }
  let now = 0;
  for (let i in loadVm) {
    if (loadVm[i] == selected) {
      now = i;
    }
  }
  if (now == loadVm.length - 1) {
    //
  } else {
    now = Number(now) + 1;
    list.selectionModel.addToSelection(loadVm[now]);
    list.selectionModel.removeFromSelection(loadVm[now - 1]);
    data.selectedObj = loadVm[now];
  }
}
let selectionCount = 0;
//처음 목록에서 조회시 선택되어있게 함
export function selectionAdd(data) {
  try {
    let select = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
    let selectedObj = null;
    if (select != undefined) {
      selectedObj = select.dataProviders.selectedTreeResult.selectedObjects[0];
    } else {
      select = vms.getViewModelUsingElement(document.getElementById('myDocument'));
      if (!select) {
        selectedObj = appCtx.ctx.selected;
      } else {
        selectedObj = select.eventData.selectedObjects[0];
      }
      // data.dataProviders.fileList.selectionModel.addToSelection(selectedObj);
    }
    let compareUid;
    if (selectedObj) {
      compareUid = selectedObj.uid;
    } else {
      let checkURL = window.location.href.split('&uid=');
      compareUid = checkURL[1];
    }
    if (selectionCount > 0 && data.dataProviders.fileList.selectedObjects.length < 1 && data.dataProviders.recommendList.selectedObjects < 1) {
      selectionCount = 0;
    }
    if (selectionCount < 1) {
      if (fileTestList != undefined) {
        let fileVmo = fileTestList;
        for (let vmo of fileVmo) {
          totalList[vmo.uid] = vmo.thumbnailURL;
        }
      }
      if (recommendLists != undefined) {
        let recVmo = recommendLists;
        for (let vmo of recVmo) {
          recList[vmo.uid] = vmo.thumbnailURL;
          if (vmo.uid == compareUid) {
            selectedRecommend = vmo;
            data.dataProviders.recommendList.selectionModel.setSelection(vmo);
          }
        }
        if (recommendLists && fileTestList) {
          let total1 = recommendLists.length;
          let total2 = fileTestList.length;
          let name1 = data.listTab[0].name.split('(');
          let name2 = data.listTab[1].name.split('(');
          data.listTab[0].name = name1[0] + '(' + total1 + ')';
          data.listTab[1].name = name2[0] + '(' + total2 + ')';
        }
      }
      selectionCount++;
    }
  } catch (err) {
    //console.log(err);
    message.show(1, '목록 선택 중 오류 발생');
  }
  var check1 = document.getElementsByClassName('leftArrowSpace')[0];
  check1.removeEventListener('click', leftClick);
  check1.addEventListener('click', leftClick);
  var check2 = document.getElementsByClassName('rightArrowSpace')[0];
  check2.removeEventListener('click', rightClick);
  check2.addEventListener('click', rightClick);
}
// 탭선택이 바뀔 시 데이터 변경
export function tabChange(data) {
  let tab = data.selectedTab;
  if (tab.listKey) {
    data.listTab.tabKey = tab.listKey;
  } else if (tab.tabKey) {
    data.moreInfoTab.tabKey = tab.tabKey;
  }
}
// 추천 목록 로드
export async function loadRecommend(data) {
  try {
    let select = null;
    let htmlData = vms.getViewModelUsingElement(document.getElementById('wareHouse'));
    if (!htmlData) {
      htmlData = vms.getViewModelUsingElement(document.getElementById('myDocument'));
      if (!htmlData) {
        select = appCtx.ctx.selected;
      } else {
        select = htmlData.eventData.selectedObjects[0];
      }
    } else {
      select = htmlData.dataProviders.selectedTreeResult.selectedObjects[0];
    }
    let fileList = '';
    let origin = null;
    if (data.selectedObj == undefined) {
      origin = select.props.l2_reference_issues.dbValues[0];
      data.selectedObj = select;
    } else {
      origin = data.selectedObj.props.l2_reference_issues.dbValue[0];
      select = data.selectedObj;
    }
    let t1 = select.props.l2_item.dbValues[0];
    let t2 = select.props.l2_issue_classes.dbValues[0];
    var inputData = {
      inflateProperties: true,
      searchInput: {
        attributesToInflate: [
          'object_name',
          'checked_out_user',
          'object_desc',
          'release_status_list',
          'fnd0InProcess',
          'l2_division',
          'l2_page_type',
          'l2_page_index',
          'l2_keywords',
          'l2_issue_class',
          'l2_issue_date',
          'l2_content_string',
          'l2_comments',
          'l2_comments_attachments',
          'l2_comments_string',
          'l2_contents',
          'l2_contents_string',
          'l2_pjt_name',
          'l2_platform_name',
          'l2_reference_issues',
          'l2_reference_posts',
          'l2_sub_title',
          'IMAN_reference',
          'l2_model_name',
          'l2_doc_no',
          'l2_image_path',
          'l2_item',
          'l2_file_name',
          'l2_source',
          'l2_creator',
          'l2_issue_pred',
        ],
        internalPropertyName: '',
        maxToLoad: -1,
        maxToReturn: -1,
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
              stringValue: 'L2_IssuePageRevision',
            },
          ],
          'L2_IssuePageRevision.l2_reference_issues': [
            {
              searchFilterType: 'StringFilter',
              stringValue: origin,
            },
          ],
          'L2_IssuePageRevision.l2_item': [
            {
              searchFilterType: 'StringFilter',
              stringValue: select.props.l2_item.dbValues[0],
            },
          ],
        },
      },
      noServiceData: false,
    };
    if (select.props.l2_issue_classes.dbValues[0] == null) {
      select.props.l2_issue_classes.dbValues[0] = '';
    }
    if (select.props.l2_issue_classes.dbValues[0] != '') {
      inputData.searchInput.searchFilterMap6['L2_IssuePageRevision.l2_issue_classes'] = [
        {
          searchFilterType: 'StringFilter',
          stringValue: select.props.l2_issue_classes.dbValues[0],
        },
      ];
    }
    let abc = await SoaService.post('Internal-AWS2-2019-06-Finder', 'performSearchViewModel4', inputData);
    let gigi = JSON.parse(abc.searchResultsJSON);
    var modelObjects = [];
    for (var i = 0; i < gigi.objects.length; i++) {
      var uid = gigi.objects[i].uid;
      var obj = abc.ServiceData.modelObjects[uid];
      modelObjects.push(obj);
    }
    let imageUID = [];
    for (let mo of modelObjects) {
      if (mo.props.IMAN_reference.dbValues[0]) {
        imageUID.push(mo.props.IMAN_reference.dbValues[0]);
      }
    }
    let param3 = {
      uids: imageUID,
    };
    let imageThumb = {};
    let responseItem3 = await SoaService.post('Core-2007-09-DataManagement', 'loadObjects', param3);
    let images = [];
    if (responseItem3.modelObjects) {
      images = Object.values(responseItem3.modelObjects);
    }
    for (let mo of images) {
      imageThumb[mo.uid] = mo.props.awp0ThumbnailImageTicket.dbValues[0];
    }
    modelObjects = modelObjects.sort(function (a, b) {
      if (Number(a.props['l2_page_index'].dbValues[0]) < Number(b.props['l2_page_index'].dbValues[0])) {
        return -1;
      }
      return 1;
    });
    let vmoPages = [];
    for (let page of modelObjects) {
      let vmo = viewModelService.constructViewModelObjectFromModelObject(page);
      let thumbnailUrl = imageThumb[vmo.props.IMAN_reference.dbValues[0]];
      if ((thumbnailUrl != '' || thumbnailUrl != null) && thumbnailUrl) {
        vmo.thumbnailURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
        vmo.viewImage = vmo.thumbnailURL;
      } else {
        vmo.thumbnailURL = iconService.getTypeIconFileUrl('cmdLargeImageView24.svg');
        vmo.viewImage = vmo.thumbnailURL;
      }
      vmoPages.push(vmo);
      if (page.props.object_string.dbValues[0] == data.selectedObj.props.object_string.dbValues[0]) {
        data.selectedObj = vmo;
      }
    }
    fileList = vmoPages;
    recommendLists = fileList;
    return {
      recommend: fileList,
      recommendFound: fileList.length,
    };
  } catch (err) {
    //console.log(err)
    message.show(1, '추천 파일 로드 중 오류 발생');
    return {
      recommend: [],
      recommendFound: 0,
    };
  }
}
//화면 크기 조정
export function moreViewResizing(data) {
  //화면 크기 속성이 들어있는 요소 찾기
  let test = document.getElementsByClassName('aw-layout-panelContent');
  let test1 = test[1];
  // 화면 크기 계산을 위한 split
  let width = test1.style.width.split('px');
  let height = test1.style.height.split('px');
  width = Number(width[0]);
  height = Number(height[0]);
  //인터넷 창 크기와 현재 화면크기 비교를 통해 크기 조정
  if (width > window.innerWidth && height > window.innerHeight) {
    test1.style.width = window.innerWidth * 0.95 + 'px';
    test1.style.height = window.innerHeight * 0.95 + 'px';
  } else if (width > window.innerWidth) {
    test1.style.width = window.innerWidth * 0.95 + 'px';
  } else if (height > window.innerHeight) {
    test1.style.height = window.innerHeight * 0.95 + 'px';
  } else if (width < window.innerWidth * 0.95 && height < window.innerHeight * 0.95) {
    test1.style.width = window.innerWidth * 0.95 + 'px';
    test1.style.height = window.innerHeight * 0.95 + 'px';
  } else if (width < window.innerWidth * 0.95) {
    test1.style.width = window.innerWidth * 0.95 + 'px';
  } else if (height < window.innerHeight * 0.95) {
    test1.style.height = window.innerHeight * 0.95 + 'px';
  }
  // 좌우 창크기 조절
  let rigthSide = document.getElementById('moreViewRightSide');
  let leftSide = document.getElementById('moreViewLeftSide');
  if (window.innerWidth < 900 && window.innerHeight < 900) {
    leftSide.style.flexBasis = '150px';
    rigthSide.style.flexBasis = '190px';
  } else {
    leftSide.style.flexBasis = '';
    leftSide.style.width = '16.66667%';
    rigthSide.style.flexBasis = '';
    rigthSide.style.width = '25%';
  }
}

export async function dataPropUpdate(data) {
  let page = data.selectedObj;
  let param1 = {
    info: [
      {
        object: page,
        vecNameVal: [
          {
            name: 'l2_average_rating',
            values: [data.avrPoint],
          },
          {
            name: 'l2_like_count',
            values: [String(data.dataProviders.comments.viewModelCollection.totalFound)],
          },
        ],
      },
    ],
  };
  try {
    if (data.selectedObj != undefined) {
      let value1 = await SoaService.post('Core-2010-09-DataManagement', 'setProperties', param1);
    }
  } catch (err) {
    //console.log(err);
    message.show(1, '별점 반영중 오류가 발생하였습니다.');
  }
}

export function dataReset(data) {
  selectionCount = 0;
  let checkURL = window.location.href;
  checkURL = checkURL.split('&uid');
  window.location.href = checkURL[0];
}

export function moveOrigin(data) {
  if (data.origin.dbValue == null) {
    notySvc.showInfo('원문링크가 없습니다.');
  }
}

function changeImageView(data) {
  data.centerView = 'Image';
}

function changeTextView(data) {
  data.centerView = 'Text';
}

function updateSliderValue(value, ctx) {
  let drag = $('#dragTest').children().children('.aw-layout-summaryContent');
  drag[0].style.transformOrigin = 'left top';
  drag[0].style.transform = `scale(${value})`;
  let drag2 = $('#dragTest').children('.aw-base-scrollPanel');
  let rightArrow = document.getElementsByClassName('rightArrowSpace')[0];
  let leftArrow = document.getElementsByClassName('leftArrowSpace')[0];
  if (drag2[0].scrollHeight > drag2[0].clientHeight) {
    rightArrow.style.right = '15px';
    rightArrow.style.bottom = '15px';
    leftArrow.style.bottom = '15px';
  } else {
    rightArrow.style.right = '0px';
    rightArrow.style.bottom = '0px';
    leftArrow.style.bottom = '0px';
  }
}

function zoomReturn(data) {
  data.zoomSliderProp.dbValue[0].sliderOption.value = 1;
}

let exports = {};

export default exports = {
  getData,
  buttonTest,
  reviewSubmit,
  loadComment,
  loadLists,
  selectChange,
  deleteComment,
  changeTrue,
  editComment,
  editModeComplete,
  editModeCancle,
  moveBefore,
  moveAfter,
  selectionAdd,
  tabChange,
  loadRecommend,
  moreViewResizing,
  dataReset,
  dataPropUpdate,
  moveOrigin,
  changeImageView,
  changeTextView,
  updateSliderValue,
  zoomReturn,
};
app.factory('moreInfoService', () => exports);
