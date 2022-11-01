import app from 'app';
import eventBus from 'js/eventBus';
import popupService from 'js/popupService';
import vms from 'js/viewModelService';
import com from "js/utils/lgepObjectUtils";
import SoaService from 'soa/kernel/soaService';
import _ from 'lodash';
import common from "js/utils/lgepCommonUtils"
import notySvc from 'js/NotyModule';
import query from 'js/utils/lgepQueryUtils';
import message from 'js/utils/lgepMessagingUtils';
import lgepLocalizationUtils from 'js/utils/lgepLocalizationUtils';

import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
var $ = require('jQuery');

function getLastRevision(response) {
    // revision_list 중 최신것만 배열로 담기
    let targetRevisioList = [];
    for (let mo of response) {
        let propsTemp = mo.props;
        let revisionUid = mo.props.revision_list.dbValues[(mo.props.revision_list.dbValues.length) - 1];
        let revision = com.getObject(revisionUid);
        Object.assign(revision.props, propsTemp)
        targetRevisioList.push(revision);
    }

    return targetRevisioList
}

export async function getColumnChartDataQnA(data,ctx) {
    let captions = ctx.sublocation.label;
    let textSource = (captions.source).split("/");
    let captionTitle = lgepLocalizationUtils.getLocalizedText(textSource[textSource.length-1], captions.key);
    data.chartTitle = captionTitle;

    let whileTrue = true;
    let result = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    while(whileTrue) {
        await common.delay(200);
        //현재 로드되어 있는 테이블의 컬럼 데이터를 받아옴
        if(result.dataProviders.qaListDataProvider.viewModelCollection.loadedVMObjects.length < 1){
            continue;
        }
        else{
            result = result.dataProviders.qaListDataProvider.viewModelCollection.loadedVMObjects;
            break;
        }
    }

    let chartData = ["채택 완료", "채택 전"];
    let selectedValue = 0;
    let noneSelectedValue = 0;
    for(let i of result){
        if(i.props.l2_complete.dbValues[0] == "Y"){
            selectedValue++;
        }
        else if(i.props.l2_complete.dbValues[0] == null || i.props.l2_complete.dbValues[0] == "N"){
            noneSelectedValue++;
        }
    }
    let chartCount = [selectedValue,noneSelectedValue];
    
    //리턴되는 차트 데이터
    let arrayOfSeriesDataForChartLine = [];
    //차트 데이터가 들어가는 배열
    let keyValueDataForChart = [];

    //모든 차트 데이터 삽입
    for (let i = 0; i < chartData.length; i++) {
        keyValueDataForChart.push({
            label: chartData[i],
            value: chartCount[i]
        });
    }

    arrayOfSeriesDataForChartLine.push({
        seriesName: '질문 현황',
        keyValueDataForChart: keyValueDataForChart,
        chartPointsConfig: 'colorOverrides'
    });

    return arrayOfSeriesDataForChartLine;
}

export async function pieChartProviderQnA(data) {
    let whileTrue = true;
    let result = vms.getViewModelUsingElement(document.getElementById("qnaDatas"));
    while(whileTrue) {
        await common.delay(200);
        //현재 로드되어 있는 테이블의 컬럼 데이터를 받아옴
        if(result.dataProviders.qaListDataProvider.viewModelCollection.loadedVMObjects.length < 1){
            continue;
        }
        else{
            result = result.dataProviders.qaListDataProvider.viewModelCollection.loadedVMObjects;
            break;
        }
    }
    let chartData = ["채택 완료", "채택 전"];
    let selectedValue = 0;
    let noneSelectedValue = 0;
    for(let i of result){
        if(i.props.l2_complete.dbValues[0] == "Y"){
            selectedValue++;
        }
        else if(i.props.l2_complete.dbValues[0] == null || i.props.l2_complete.dbValues[0] == "N"){
            noneSelectedValue++;
        }
    }
    let chartCount = [selectedValue,noneSelectedValue];

    var arrayOfSeriesDataForChart = [];
    var dummyValuesForFirstSeries = chartCount;
    var keyValueDataForChart = [];
    var randomValue = Math.ceil( Math.random() * 1000 );

    for (var i = 0; i < dummyValuesForFirstSeries.length; i++) {
        keyValueDataForChart.push({
            label: String.fromCharCode(3 + keyValueDataForChart.length),
            value: dummyValuesForFirstSeries[i],
            name: chartData[i],
            y: dummyValuesForFirstSeries[i]
        });
    }
    arrayOfSeriesDataForChart.push({
        name: chartData,
        keyValueDataForChart: keyValueDataForChart
    });

    return arrayOfSeriesDataForChart;
}

var exports = {};

export default exports = {
    getColumnChartDataQnA,
    pieChartProviderQnA
}

app.factory('lgepNoticeBoardChartService', () => exports);