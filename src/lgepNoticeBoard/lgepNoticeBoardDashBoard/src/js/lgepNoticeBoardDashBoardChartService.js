import app from 'app';
import viewModelService from 'js/viewModelObjectService';
import SoaService from 'soa/kernel/soaService';
import cdmSvc from 'soa/kernel/clientDataModel';
import vmos from 'js/viewModelObjectService';
import browserUtils from 'js/browserUtils';
import com from 'js/utils/lgepObjectUtils';
import _ from 'lodash';
import eventBus from 'js/eventBus';
import iconService from 'js/iconService';
import fmsUtils from 'js/fmsUtils';
import locale from 'js/utils/lgepLocalizationUtils';
import query from 'js/utils/lgepQueryUtils';

const numberOfPost = locale.getLocalizedText('lgepKnowldegeManageMessages', 'numberOfPost');
const numberOfRecommendations = locale.getLocalizedText('lgepKnowldegeManageMessages', 'numberOfRecommendations');
const technicalDocument = locale.getLocalizedText('lgepKnowldegeManageMessages', 'technicalDocumentationSubLocationTitle');
const askExpert = locale.getLocalizedText('lgepKnowldegeManageMessages', 'askExpertSubLocationTitle');
const score = locale.getLocalizedText('lgepKnowldegeManageMessages', 'score');
const visitors = locale.getLocalizedText('lgepKnowldegeManageMessages', 'visitors');

var exports = {};

var keyValueDataForChart = [];
var arrayOfSeriesDataForChart = [];

let qna = [];
let faq = [];
let tech = [];
let expert = [];

export async function loadUserList(data, ctx) {
  let userData = await query.executeSavedQuery('KnowledgeUserSearch', ['L2_user_id'], ['*']);

  await com.getProperties(userData, [
    'l2_is_expert',
    'l2_answer_count',
    'l2_point',
    'l2_knowledge_count',
    'l2_user_name',
    'l2_user_id',
    'l2_good_count',
    'owning_user',
  ]);
  _.forEach(userData, function (data) {
    data.props.l2_total_post = Number(data.props.l2_answer_count.uiValues[0]) + Number(data.props.l2_knowledge_count.uiValues[0]);
  });

  let searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: 1,
    maxToReturn: 1,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: 'L2_QuestionHelpRevision',
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
      'POM_application_object.owning_group': [
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
    searchSortCriteria: [],
    startIndex: 0,
  };

  let params = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [{ name: 'object_name' }, { name: 'creation_date' }, { name: 'items_tag' }, { name: 'l2_views' }],
      },
    ],
  };

  faq = await query.performSearchViewModel4(null, searchInput, params);
  // faq = faq.searchResults;

  searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: 1,
    maxToReturn: 1,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: 'L2_QuestionVOCRevision',
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
      'POM_application_object.owning_group': [
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
    searchSortCriteria: [],
    startIndex: 0,
  };

  params = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [{ name: 'object_name' }, { name: 'creation_date' }, { name: 'items_tag' }, { name: 'l2_views' }],
      },
    ],
  };

  qna = await query.performSearchViewModel4(null, searchInput, params);
  // qna = qna.searchResults;

  searchInput = {
    attributesToInflate: ['object_name', 'object_desc'],
    maxToLoad: 5,
    maxToReturn: 5,
    providerName: 'Awp0FullTextSearchProvider',
    searchCriteria: {
      searchString: '*',
    },
    searchFilterFieldSortType: 'Priority',
    searchFilterMap6: {
      'WorkspaceObject.object_type': [
        {
          searchFilterType: 'StringFilter',
          stringValue: 'L2_ManualRevision',
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
      'POM_application_object.owning_group': [
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
    searchSortCriteria: [],
    startIndex: 0,
  };

  params = {
    types: [
      {
        name: 'WorkspaceObject',
        properties: [
          { name: 'object_string' },
          { name: 'object_name' },
          { name: 'creation_date' },
          { name: 'items_tag' },
          { name: 'l2_views' },
          { name: 'l2_like_count' },
        ],
      },
    ],
  };

  tech = await query.performSearchViewModel4(null, searchInput, params);
  // let techChart = tech.searchResults;

  eventBus.publish('loadUserList.listUpdated');

  return {
    userList: userData,
  };
}

export async function loadPostList(data) {
  return {
    postTotalFound: data.userList.length,
  };
}

export async function loadThumbsList(data) {
  return {
    thumbsTotalFound: data.userList.length,
  };
}

export async function setPostList(response, data) {
  response = data.userList;
  if (data.dataProviders.postList.viewModelCollection.loadedVMObjects.length === 0) {
    response.sort((a, b) => {
      return b.props.l2_total_post - a.props.l2_total_post;
    });
    let vmoArray = [];
    for (let i = 0; i < 4; i++) {
      let vmo = vmos.constructViewModelObjectFromModelObject(response[i]);
      vmo.cellHeader1 = response[i].props.l2_user_name.uiValues[0];
      vmo.cellHeader2 = response[i].props.l2_user_id.uiValues[0];
      vmo.cellProperties = {
        type: {
          key: numberOfPost,
          value: String(response[i].props.l2_total_post),
        },
      };
      vmo.rank = i + 1;
      let thumbnailUrl = cdmSvc.getObject(response[i].props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
      if (thumbnailUrl === null || thumbnailUrl === '') {
        vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
      } else {
        vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
      }
      vmoArray.push(vmo);
    }
    response = vmoArray;

    return response;
  } else {
    return '';
  }
}

export async function setThumbsList(response, data) {
  response = data.userList;
  if (data.dataProviders.thumbsList.viewModelCollection.loadedVMObjects.length === 0) {
    response.sort((a, b) => {
      return Number(b.props.l2_good_count.uiValues[0]) - Number(a.props.l2_good_count.uiValues[0]);
    });
    let vmoArray = [];
    for (let i = 0; i < 4; i++) {
      let vmo = vmos.constructViewModelObjectFromModelObject(response[i]);
      vmo.cellHeader1 = response[i].props.l2_user_name.uiValues[0];
      vmo.cellHeader2 = response[i].props.l2_user_id.uiValues[0];
      vmo.cellProperties = {
        type: {
          key: numberOfRecommendations,
          value: response[i].props.l2_good_count.uiValues[0],
        },
      };
      vmo.rank = i + 1;
      let thumbnailUrl = cdmSvc.getObject(response[i].props.owning_user.dbValues[0]).props.awp0ThumbnailImageTicket.dbValues[0];
      if (thumbnailUrl === null || thumbnailUrl === '') {
        vmo.typeIconURL = iconService.getTypeIconFileUrl('avatar-person.svg');
      } else {
        vmo.typeIconURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(thumbnailUrl) + '?ticket=' + thumbnailUrl;
      }
      vmoArray.push(vmo);
    }
    response = vmoArray;

    return response;
  } else {
    return '';
  }
}

export let createPieChart = function (data) {
  var arrayOfSeriesDataForChart = []; // assigning static values for first and second series of the line chart for cucumber capture ; values from 3rd series onwards are dynamic
  var dummyValuesForFirstSeries = [qna.totalFound, faq.totalFound, tech.totalFound];
  // , expert.length
  var seriesName = ['VoC', 'HelpDesk', 'Manual'];
  // , askExpert
  var keyValueDataForChart = [];

  for (var i = 0; i < dummyValuesForFirstSeries.length; i++) {
    keyValueDataForChart.push({
      label: String.fromCharCode(65 + keyValueDataForChart.length),
      value: dummyValuesForFirstSeries[i],
      name: seriesName[i],
      y: dummyValuesForFirstSeries[i],
    });
  }
  arrayOfSeriesDataForChart.push({
    name: seriesName,
    keyValueDataForChart: keyValueDataForChart,
  });

  return arrayOfSeriesDataForChart;
};

export let createPointChartFromArrayOfSeries = async function () {
  let arrayOfSeriesDataForChartLine = [];
  let keyValueDataForChart = [];
  const result = tech.searchResults;

  var dummyValuesForFirstSeries = [];
  for (let i = 0; i < result.length; i++) {
    dummyValuesForFirstSeries.push(Number(result[i].props.l2_like_count.uiValues[0]));
  }

  for (let i = 0; i < dummyValuesForFirstSeries.length; i++) {
    keyValueDataForChart.push({
      label: result[i].props.object_name.dbValues[0],
      value: dummyValuesForFirstSeries[i],
    });
  }

  keyValueDataForChart.sort((a, b) => {
    return b.value - a.value;
  });

  const lineList = keyValueDataForChart.slice(0, 10);

  arrayOfSeriesDataForChartLine.push({
    seriesName: score,
    keyValueDataForChart: lineList,
    chartPointsConfig: 'colorOverrides',
  });

  return arrayOfSeriesDataForChartLine;
};

export async function updateDailyVisitorValue(ctx) {
  const date = new Date();

  const year = date.toLocaleString('ko-kr');
  let year2 = year.split('. ');
  let resultyear;
  let month;
  let day;
  if (year2.length < 2) {
    year2 = year2.split('년 ');
    resultyear = year2[0];
    year2 = year2[1].split('월 ');
    month = year2[0];
    year2 = year2[1].split('일 ');
    day = year2[0];
  } else {
    resultyear = year2[0];
    month = year2[1];
    day = year2[2];
  }
  if (Number(month) < 10) {
    month = '0' + month;
  }
  if (Number(day) < 10) {
    day = '0' + day;
  }
  const dateStr = resultyear + '-' + month + '-' + day;
  let dailyVisitor = await query.executeSavedQuery('DailyVisitReportSearch', ['L2_object_name'], [dateStr]);
  let todayVisitorArr = [];
  if (dailyVisitor != undefined) {
    await com.getProperties(dailyVisitor, ['l2_visitor_ids', 'object_name']);
    todayVisitorArr = dailyVisitor[0].props.l2_visitor_ids.dbValues;
    todayVisitorArr.push(ctx.user.uid);
    todayVisitorArr = todayVisitorArr.filter((element, index) => {
      return todayVisitorArr.indexOf(element) === index;
    });
    let param = {
      objects: [dailyVisitor[0]],
      attributes: {
        l2_visitor_ids: {
          stringVec: todayVisitorArr,
        },
      },
    };
    try {
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    } catch (err) {
      //console.log(err);
    }
  } else if (dailyVisitor == null) {
    let createObj = await com.createRelateAndSubmitObjects2('L2_DailyVisitReport', {
      object_name: [dateStr],
    });
    todayVisitorArr.push(ctx.user.uid);
    let param = {
      objects: [createObj.ServiceData.modelObjects[createObj.ServiceData.created[0]]],
      attributes: {
        l2_visitor_ids: {
          stringVec: todayVisitorArr,
        },
      },
    };
    try {
      await SoaService.post('Core-2007-01-DataManagement', 'setProperties', param);
    } catch (err) {
      //console.log(err);
    }
  }
}

export let createLineChartFromArrayOfSeries = async function (data) {
  //  DashBoard 방문자수
  //  매일 00:00시에 현재 날짜에 대한 리스트 생성
  //  로그인 계정을 중복되지 않게 리스트에 추가
  //  리스트에 쌓인 계정 길이만 추출
  arrayOfSeriesDataForChart = [];
  let dailyVisitor = await query.executeSavedQuery('DailyVisitReportSearch', ['L2_object_name'], ['*']);
  await com.getProperties(dailyVisitor, ['l2_visitor_ids', 'object_name']);
  keyValueDataForChart = [];

  dailyVisitor.sort((a, b) => new Date(a.props.object_name.dbValues[0]).getTime() - new Date(b.props.object_name.dbValues[0]).getTime());
  let temp = dailyVisitor;
  dailyVisitor = [];
  for (let i = temp.length - 5; i <= temp.length - 1; i++) {
    dailyVisitor.push(temp[i]);
  }

  // 방문자 수 배열
  var visitorValueByDate = [];
  for (let i of dailyVisitor) {
    if (i) {
      visitorValueByDate.push(i.props.l2_visitor_ids.dbValues.length);
    }
  }

  for (var i = 0; i < visitorValueByDate.length; i++) {
    if (i) {
      keyValueDataForChart.push({
        label: dailyVisitor[i].props.object_name.dbValues[0],
        value: visitorValueByDate[i],
      });
    }
  }
  arrayOfSeriesDataForChart.push({
    seriesName: visitors,
    keyValueDataForChart: keyValueDataForChart,
    chartPointsConfig: 'colorOverrides',
  });

  return arrayOfSeriesDataForChart;
};

export default exports = {
  loadUserList,
  loadPostList,
  loadThumbsList,
  setPostList,
  setThumbsList,
  createPieChart,
  createPointChartFromArrayOfSeries,
  createLineChartFromArrayOfSeries,
  updateDailyVisitorValue,
};

app.factory('dashboardChart', () => exports);
