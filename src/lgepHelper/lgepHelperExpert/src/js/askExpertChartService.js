import app from 'app';
import eventBus from 'js/eventBus';
import vms from 'js/viewModelService';
import com from "js/utils/lgepObjectUtils";
import SoaService from 'soa/kernel/soaService';
import _ from 'lodash';
import common from "js/utils/lgepCommonUtils"

import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
var $ = require('jQuery');

export async function getColumnChartDataExpert(data) {
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
        seriesName: '전문가 질문 현황',
        keyValueDataForChart: keyValueDataForChart,
        chartPointsConfig: 'colorOverrides'
    });

    return arrayOfSeriesDataForChartLine;
}

export async function pieChartProviderExpert(data) {
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
    // let percent = (selectedValue / result.length * 100).toPrecision(4);
    // let none = (noneSelectedValue / result.length * 100).toPrecision(4);
    // let chartPercent = [Number(percent), Number(none)];
    let chartPercent = [selectedValue, noneSelectedValue];
    let chartCount = [selectedValue + "개", noneSelectedValue + "개"];

    var arrayOfSeriesDataForChart = [];
    var dummyValuesForFirstSeries = chartPercent;
    var keyValueDataForChart = [];
    var randomValue = Math.ceil( Math.random() * 1000 );

    for (var i = 0; i < dummyValuesForFirstSeries.length; i++) {
        keyValueDataForChart.push({
            label: String.fromCharCode(3 + keyValueDataForChart.length),
            name: chartData[i],
            value: dummyValuesForFirstSeries[i]
        });
    }
    arrayOfSeriesDataForChart.push({
        // seriesName: chartCount,
        // name: chartData,
        keyValueDataForChart: keyValueDataForChart
    });

    return arrayOfSeriesDataForChart;
}

var exports = {};

export default exports = {
    getColumnChartDataExpert,
    pieChartProviderExpert
}