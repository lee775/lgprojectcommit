import app from 'app';
import SoaService from 'soa/kernel/soaService';
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import com from 'js/utils/lgepObjectUtils';
import policy from 'js/soa/kernel/propertyPolicyService';
import common from 'js/utils/lgepCommonUtils';
import _ from 'lodash';
import vms from 'js/viewModelService';
import locale from 'js/utils/lgepLocalizationUtils';
import iconService from 'js/iconService';
import dmSvc from 'soa/dataManagementService';
import eventBus from 'js/eventBus';
import cdmSvc from 'soa/kernel/clientDataModel';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
import viewModelService from 'js/viewModelObjectService';
import fmsUtils from 'js/fmsUtils';
import browserUtils from 'js/browserUtils';

let exports = {};

const textAnswer = locale.getLocalizedText('lgepSpecManagementMessages', 'textAnswer');
const textNoAnswer = locale.getLocalizedText('lgepSpecManagementMessages', 'noAnswer');

function testTab(data) {
  //console.log("탭 누르기", {data});
  if (data.selectedTab.tabKey == 'showQna') {
    //console.log(data.selectedTab.name);
  } else if (data.selectedTab.tabKey == 'showExpert') {
    //console.log(data.selectedTab.name);
  }
}

async function loadQna(data, ctx) {
  let url = window.location.href;
  let url1 = decodeURI(url);
  let urlAttrSearch = url1.split('uid=');

  let item = cdmSvc.getObject(urlAttrSearch[1]);
  let paramUrl = {
    objects: [item],
    attributes: ['owning_group', 'l2_main_category'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', paramUrl);
  } catch (err) {
    //console.log(err);
  }

  let qList;
  let aList;
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
        'L2_BulletinRevision.l2_reference_targets': [
          {
            searchFilterType: 'StringFilter',
            stringValue: urlAttrSearch[1],
          },
        ],
        'POM_application_object.owning_group': [
          {
            searchFilterType: 'StringFilter',
            stringValue: item.props.owning_group.uiValues[0],
          },
        ],
      },
    },
    noServiceData: false,
  };
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

  paramUrl = {
    objects: questionList,
    attributes: ['IMAN_specification'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', paramUrl);
  } catch (err) {
    //console.log(err);
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
        properties: [
          { name: 'object_string' },
          { name: 'l2_content' },
          { name: 'l2_content_string' },
          { name: 'owning_user' },
          { name: 'creation_date' },
          { name: 'items_tag' },
        ],
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
    if (thumbnailUrl == '' || thumbnailUrl == null) {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
    } else {
      vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
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
          let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
          if (thumbnailUrl == '' || thumbnailUrl == null) {
            a.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
          } else {
            a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
          }
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
    if (a.qDate <= b.qDate) {
      return 1;
    }
    return -1;
  });
  return {
    qnaAnswer: showAList,
    qnaTotalFound: showAList.length,
  };
}

export async function loadExpert(data, ctx) {
  let url = window.location.href;
  let url1 = decodeURI(url);
  let urlAttrSearch = url1.split('uid=');

  let item = cdmSvc.getObject(urlAttrSearch[1]);
  let paramUrl = {
    objects: [item],
    attributes: ['owning_group', 'l2_main_category'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', paramUrl);
  } catch (err) {
    //console.log(err);
  }

  let qList;
  let aList;
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
            stringValue: 'L2_QuestionExpRevision',
          },
        ],
        'L2_BulletinRevision.l2_reference_targets': [
          {
            searchFilterType: 'StringFilter',
            stringValue: urlAttrSearch[1],
          },
        ],
        'POM_application_object.owning_group': [
          {
            searchFilterType: 'StringFilter',
            stringValue: item.props.owning_group.uiValues[0],
          },
        ],
      },
    },
    noServiceData: false,
  };
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

  paramUrl = {
    objects: questionList,
    attributes: ['IMAN_specification'],
  };
  try {
    await SoaService.post('Core-2006-03-DataManagement', 'getProperties', paramUrl);
  } catch (err) {
    //console.log(err);
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
        properties: [
          { name: 'object_string' },
          { name: 'l2_content' },
          { name: 'l2_content_string' },
          { name: 'owning_user' },
          { name: 'creation_date' },
          { name: 'items_tag' },
        ],
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
  }
  let vmoArray1 = [];
  let searchQList = {};
  for (let mo of qList) {
    let vmo = viewModelService.constructViewModelObjectFromModelObject(mo);
    vmo.cellHeader1 = mo.props.object_name.uiValues[0];
    vmo.sendURL = browserUtils.getBaseURL() + '#/askExpert?question=' + vmo.uid;
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
    if (thumbnailUrl == '' || thumbnailUrl == null) {
      vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
    } else {
      vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
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
          let thumbnailUrl = cdmSvc.getObject(a.props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
          if (thumbnailUrl == '' || thumbnailUrl == null) {
            a.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
          } else {
            a.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
          }
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
    if (a.qDate <= b.qDate) {
      return 1;
    }
    return -1;
  });
  return {
    expertAnswer: showAList,
    expertAnswerFound: showAList.length,
  };
}

export default exports = {
  loadQna,
  loadExpert,
  testTab,
};

app.factory('loadQnAService', () => exports);
