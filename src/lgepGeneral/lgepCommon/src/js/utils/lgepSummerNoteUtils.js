import app from 'app';
import SoaService from 'soa/kernel/soaService'
import com from "js/utils/lgepObjectUtils";
import _ from 'lodash';
import viewC from "js/viewModelObjectService";
import AwPromiseService from 'js/awPromiseService';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import browserUtils from 'js/browserUtils';
import common from "js/utils/lgepCommonUtils";
import loding from 'js/utils/lgepLoadingUtils';
import fmsUtils from 'js/fmsUtils';
var $ = require('jQuery');

/**
 * summerNote code와 itemRev를 보내면 summerNote의 내용을 html 파일로 변환 후 릴레이션으로 맺어줌
 *
 * @param {String} content - content HTML Tag(SummerNote Code)
 * @param {ModelObject} itemRev(아이템 리비전)
 */
async function txtFileToDataset(content, itemRev) {
    let svgSlice = content.split("</svg>");
    // let svgTemp = [];
    // for(let temp of svgSlice){
    //     if(temp.includes("<svg")){
    //         svgTemp.push(temp);
    //     }
    // }
    let files = [];
    // let file = new File([content], itemRev.props.items_tag.uiValues[0] + ".TXT", {
    //     type: 'text'
    // });
    for (let svg of svgSlice) {
        files.push(new File([svg], itemRev.props.items_tag.uiValues[0] + ".TXT", {
            type: 'text'
        }));
    }
    let dataset = await uploadFileToDataset(files);
    await deleteRelation(itemRev);
    await linkRelationsSequence(itemRev, dataset);
}

async function videoAndTextDataSet(content, itemRev) {
    let file = new File([content], itemRev.props.items_tag.uiValues[0] + ".TXT", {
        type: 'text'
    });
    let dataset = await uploadFileToDataset(file);
    await linkRelationsSequence(itemRev, dataset);
}

/**
 * summerNote code와 itemRev를 보내면 summerNote의 내용을 html 파일로 변환 후 기존 텍스트 릴레이션만 삭제후 다시 맺어줌
 *
 * @param {String} content - content HTML Tag(SummerNote Code)
 * @param {ModelObject} itemRev(아이템 리비전)
 */
async function txtFileToDatasetNoDelete(content, itemRev) {
    let file = new File([content], itemRev.props.items_tag.uiValues[0] + ".TXT", {
        type: 'text'
    });
    let dataset = await uploadFileToDataset(file);
    await deleteRelationText(itemRev);
    await linkRelationsSequence(itemRev, dataset);
}

function flatAr(arr) {
    let result = arr.slice();
    for (let i = 0; i < result.length; i++) {
        if (Array.isArray(result[i])) {
            result = result.flat();
        }
    }
    return result;
}

/**
 * itemRev를 보내면 summerNote code에 넣었을때 표시 해주는 문자열을 반환 설계지침 프로토1 전용
 * f
 * @param {ModelObject} itemRev(아이템 리비전)
 * @returns {String} content HTML Tag(SummerNote Code)
 */
async function readHtmlToSummernoteProtoOne(itemRev) {
    await com.getProperties(itemRev, ["IMAN_specification"]);
    let dataset = [];
    let datasetTemp;
    if (itemRev.props.IMAN_specification.dbValues.length > 0) {
        datasetTemp = com.getObjects(itemRev.props.IMAN_specification.dbValues);
    }
    let video = [];
    if (datasetTemp == null) {
        return;
    } else {
        if (!Array.isArray(datasetTemp)) {
            datasetTemp = [datasetTemp];
        }
        await com.getProperties(datasetTemp, ["ref_list"]);
        let file = [];
        for (let i = 0; i < datasetTemp.length; i++) {
            file.push(com.getObject(datasetTemp[i].props.ref_list.dbValues));
        }
        file = flatAr(file);
        for (let i = 0; i < datasetTemp.length; i++) {
            if (datasetTemp[i].type == "Text") {
                dataset.push(file[i]);
            }
            if (datasetTemp[i].type == "Fnd0VideoData") {
                video.push(file[i]);
            }
        }
    }

    await com.getProperties(dataset, ["file_size", "byte_size"]);
    let fileSize = 0;
    for (let i of dataset) {
        fileSize = fileSize + Number(i.props.byte_size.dbValues[0]);
    }
    if (fileSize > 2097152) {
        loding.openWindow();
    }
    //파일티켓 읽기
    let inputParam = {
        files: dataset
    }
    let textTicket;
    let string = "";
    try {
        let serachResult = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", inputParam);
        for (let i = 0; i < dataset.length; i++) {
            let stringTemp = "";
            textTicket = serachResult.tickets[1][i];
            let textURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;
            const res = await fetch(textURL);
            const arrayBuffer = await res.arrayBuffer();
            const chars = new Uint8Array(arrayBuffer);
            stringTemp = stringTemp + new TextDecoder().decode(chars);
            if (!stringTemp.includes("<svg")) {
                continue;
            }
            stringTemp = stringTemp + "</svg><br>";
            string = string + stringTemp;
        }
    } catch (err) {
        //console.log(err);
    }
    if (fileSize > 2097152) {
        loding.closeWindow();
    }
    return string;
}

/**
 * itemRev를 보내면 summerNote code에 넣었을때 표시 해주는 문자열을 반환
 * f
 * @param {ModelObject} itemRev(아이템 리비전)
 * @returns {String} content HTML Tag(SummerNote Code)
 */
async function readHtmlToSummernote(itemRev) {
    await com.getProperties(itemRev, ["IMAN_specification"]);
    let dataset = [];
    let datasetTemp;
    if (itemRev.props.IMAN_specification.dbValues.length > 0) {
        datasetTemp = com.getObjects(itemRev.props.IMAN_specification.dbValues);
    }
    let video = [];
    if (datasetTemp == null) {
        return;
    } else {
        if (!Array.isArray(datasetTemp)) {
            datasetTemp = [datasetTemp];
        }
        await com.getProperties(datasetTemp, ["ref_list"]);
        let file = [];
        for (let i = 0; i < datasetTemp.length; i++) {
            file.push(com.getObject(datasetTemp[i].props.ref_list.dbValues));
        }
        file = flatAr(file);
        for (let i = 0; i < datasetTemp.length; i++) {
            if (datasetTemp[i].type == "Text") {
                dataset.push(file[i]);
            }
            if (datasetTemp[i].type == "Fnd0VideoData") {
                video.push(file[i]);
            }
        }
    }

    await com.getProperties(dataset, ["file_size", "byte_size"]);
    let fileSize = 0;
    for (let i of dataset) {
        fileSize = fileSize + Number(i.props.byte_size.dbValues[0]);
    }
    if (fileSize > 2097152) {
        loding.openWindow();
    }
    //파일티켓 읽기
    let inputParam = {
        files: dataset
    }
    let textTicket;
    let string = "";
    try {
        let serachResult = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", inputParam);
        for (let i = 0; i < dataset.length; i++) {
            let stringTemp = "";
            textTicket = serachResult.tickets[1][i];
            let textURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;
            const res = await fetch(textURL);
            const arrayBuffer = await res.arrayBuffer();
            const chars = new Uint8Array(arrayBuffer);
            stringTemp = stringTemp + new TextDecoder().decode(chars);
            stringTemp = stringTemp + "</svg><br>";

            if (stringTemp.includes("<svg")) {
                let maxCount = stringTemp.split('</svg>');
                maxCount = maxCount.length - 1;
                for (let i = 0; i < maxCount; i++) {
                    let sizeTemp = stringTemp.split('width=');
                    let width = sizeTemp[1];
                    width = width.split('"');
                    let height = Number(width[3]);
                    if (Object.is((height), NaN)) {
                        height = 720;
                    }
                    width = Number(width[1]);
                    if (Object.is((width), NaN)) {
                        width = 1040;
                    }
                    stringTemp = stringTemp.replace(/<svg (.*?) width=/ig, "<svg viewBox='0 0 " + width + " " + height + "' preserveAspectRatio='none' width=");
                    stringTemp = stringTemp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/ig, 'preserveAspectRatio="none" width="100%" height="100%"');
                }
            }
            if (stringTemp.includes("<img")) {
                stringTemp = stringTemp.replace(/style="width: [^"]+"/gi, "style='width: 100%;'");
            }
            if (stringTemp.includes("<video")) {
                stringTemp = stringTemp.replace(/<video controls="[^"]+"/gi, "<video controls='true' width='100%' height='100%'");
            }
            string = string + stringTemp;
        }
        if (video.length > 0) {
            let request = {
                files: video
            };
            let videoTicket = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", request);
            for (let i = 0; i < video.length; i++) {
                videoTicket = videoTicket.tickets[1][i];
                string = string.replace(/src="*"/i, 'src="fms/fmsdownload/?ticket=' + videoTicket + '" type="video/mp4"');
            }
        }
        if (fileSize > 2097152) {
            loding.closeWindow();
        }
    } catch (err) {
        //console.log(err);
    }

    return string;

    // await com.getProperties(itemRev, ["IMAN_specification"]);
    // let dataset = com.getObject(itemRev.props.IMAN_specification.dbValues[0]);
    //  await com.getProperties(dataset, ["ref_list"]);
    // let fileText = com.getObject(dataset.props.ref_list.dbValues);
    // await com.getProperties(fileText, ["file_size","byte_size"]);
    // let fileSize = Number(fileText[0].props.byte_size.dbValues[0]);
    // if(fileSize > 2097152){
    //     loding.openWindow();
    // }
    // //파일티켓 읽기
    // let inputParam = {
    //     files:fileText
    // }
    // let textTicket;
    // try {
    //     let serachResult = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", inputParam);
    //     textTicket = serachResult.tickets[1][0];
    // } catch (err) {
    //     console.log(err);
    // }
    // let textURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;

    // const res = await fetch(textURL);
    // const blob = await res.blob();
    // const fileReader2 = new FileReader();
    // fileReader2.readAsText(blob);
    // let blobText = await blob.text();
    //     if(fileSize > 2097152){
    //     loding.closeWindow();
    // }
    // return blobText;
}

/**
 * itemRev를 보내면 summerNote code에 넣었을때 표시 해주는 문자열을 반환 챕터와 북 전용
 * f
 * @param {ModelObject} itemRev(아이템 리비전)
 * @returns {String} content HTML Tag(SummerNote Code)
 */
async function readHtmlToSummernoteChapterAndBook(itemRev) {
    await com.getProperties(itemRev, ["IMAN_specification"]);
    let dataset = [];
    let datasetTemp;
    if (itemRev.props.IMAN_specification.dbValues.length > 0) {
        datasetTemp = com.getObjects(itemRev.props.IMAN_specification.dbValues);
    }
    let video = [];
    if (datasetTemp == null) {
        return;
    } else {
        if (!Array.isArray(datasetTemp)) {
            datasetTemp = [datasetTemp];
        }
        await com.getProperties(datasetTemp, ["ref_list"]);
        let file = [];
        for (let i = 0; i < datasetTemp.length; i++) {
            file.push(com.getObject(datasetTemp[i].props.ref_list.dbValues));
        }
        file = flatAr(file);
        for (let i = 0; i < datasetTemp.length; i++) {
            if (datasetTemp[i].type == "Text") {
                dataset.push(file[i]);
            }
            if (datasetTemp[i].type == "Fnd0VideoData") {
                video.push(file[i]);
            }
        }
    }
    //파일티켓 읽기
    let inputParam = {
        files: dataset
    }
    let textTicket;
    let string = "";
    try {
        let serachResult = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", inputParam);
        for (let i = 0; i < dataset.length; i++) {
            let stringTemp = "";
            textTicket = serachResult.tickets[1][i];
            let textURL = browserUtils.getBaseURL() + 'fms/fmsdownload/' + fmsUtils.getFilenameFromTicket(textTicket) + '?ticket=' + textTicket;
            const res = await fetch(textURL);
            const arrayBuffer = await res.arrayBuffer();
            const chars = new Uint8Array(arrayBuffer);
            stringTemp = stringTemp + new TextDecoder().decode(chars);
            stringTemp = stringTemp + "</svg><br>";

            if (stringTemp.includes("<svg")) {
                let maxCount = stringTemp.split('</svg>');
                maxCount = maxCount.length - 1;
                for (let i = 0; i < maxCount; i++) {
                    let sizeTemp = stringTemp.split('width=');
                    let width = sizeTemp[1];
                    width = width.split('"');
                    let height = Number(width[3]);
                    if (Object.is((height), NaN)) {
                        height = 720;
                    }
                    width = Number(width[1]);
                    if (Object.is((width), NaN)) {
                        width = 1040;
                    }
                    stringTemp = stringTemp.replace(/<svg (.*?) width=/ig, "<svg viewBox='0 0 " + width + " " + height + "' preserveAspectRatio='none' width=");
                    stringTemp = stringTemp.replace(/preserveAspectRatio='none' width="[^"]+" height="[^"]+"/ig, 'preserveAspectRatio="none" width="100%" height="100%"');
                }
            }
            if (stringTemp.includes("<img")) {
                stringTemp = stringTemp.replace(/style="width: [^"]+"/gi, "style='width: 100%;'");
            }
            if (stringTemp.includes("<video")) {
                stringTemp = stringTemp.replace(/<video controls="[^"]+"/gi, "<video controls='true' width='100%' height='100%'");
            }
            string = string + stringTemp;
        }
        if (video.length > 0) {
            let request = {
                files: video
            };
            let videoTicket = await SoaService.post("Core-2006-03-FileManagement", "getFileReadTickets", request);
            for (let i = 0; i < video.length; i++) {
                videoTicket = videoTicket.tickets[1][i];
                string = string.replace(/src="*"/i, 'src="fms/fmsdownload/?ticket=' + videoTicket + '" type="video/mp4"');
            }
        }
    } catch (err) {
        //console.log(err);
    }
    return string;
}

export async function editSummerNoteChange(eventData) {
    if (eventData.state == "starting") {
        $('#lgepSummerNote').summernote('enable');
    } else if (eventData.state == "saved") {
        let summernoteOnlyString = $('#lgepSummerNote').summernote('code');
        summernoteOnlyString = imgAndsvgOnlyString(summernoteOnlyString);
        let obj = eventData.dataSource.vmo;
        await deleteRelation(obj);
        let contentData = await base64ToFileToDataset($('#lgepSummerNote').summernote('code'), obj, obj.props.object_name.dbValues[0]);
        try {

            let setUpdateItem = {
                objects: [obj],
                attributes: {
                    l2_content: {
                        stringVec: [contentData.resultTag]
                    },
                    l2_content_string: {
                        stringVec: [summernoteOnlyString]
                    }
                }
            };

            await SoaService.post("Core-2007-01-DataManagement", "setProperties", setUpdateItem);
        } catch (err) {
            //console.log(err);
        }

        $('#lgepSummerNote').summernote('disable');
    } else if (eventData.state == "canceling") {
        $('#lgepSummerNote').summernote('disable');
    }
}

async function relationReadSummernote(eventData, ctx) {
    $('#relationReadSummernote').summernote({
        tabsize: 0,
        width: '100%',
        styleWithSpan: true,
        toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link']],
            ['codeview']
        ],
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
    });
    $('#relationReadSummernote').summernote('disable');
    $("#relationReadSummernote").css("background-color", "white");
    let obj = eventData.scope.ctx.selected;
    let item = await com.getItemFromId(obj.props.item_id.dbValue);
    await com.getProperties(item, ["l2_reference_book"]);
    item = viewC.constructViewModelObjectFromModelObject(item);
    obj.props.l2_reference_book = item.props.l2_reference_book;
    eventData.scope.ctx.selected = obj;
    ctx.selected = obj;
    let content = await readHtmlToSummernote(obj);
    if (content) {
        $('#relationReadSummernote').summernote('reset');
        $('#relationReadSummernote').summernote('code', content);
    } else {
        $('#relationReadSummernote').summernote('reset');
    }
}

export async function summerNoteInitialize(eventData) {
    $('#lgepSummerNote').summernote({
        tabsize: 0,
        height: 550,
        width: '95%',
        styleWithSpan: true,
        toolbar: [
            ['fontsize', ['fontsize']],
            ['style', ['bold', 'italic', 'underline', 'strikethrough', 'clear']],
            ['color', ['forecolor', 'color']],
            ['table', ['table']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['picture', 'link']],
            ['codeview']
        ],
        fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '30', '36', '50', '72']
    });
    $('#lgepSummerNote').summernote('disable');
    $("#lgepSummerNote").css("background-color", "white");
    let obj = eventData.scope.ctx.selected;
    await com.getProperties(obj, ["l2_content", "l2_content_string", "IMAN_specification"]);
    if (obj.props.l2_content.dbValues[0] != "" && obj.props.l2_content.dbValues[0] != null) {
        if (obj.props.l2_content.dbValues[0].includes("<svg") || obj.props.l2_content.dbValues[0].includes("<img")) {
            let imageData = com.getObject(obj.props.IMAN_specification.dbValues);
            let imageViewData = [];
            for (let i of imageData) {
                imageViewData.push(viewC.constructViewModelObjectFromModelObject(i));
            }
            if (obj.props.l2_content.dbValues[0].includes("<svg")) {
                for (let i of imageViewData) {
                    obj.props.l2_content.dbValues[0] = obj.props.l2_content.dbValues[0].replace('xlink:href=""', 'xlink:href="' + i.thumbnailURL + '"');
                }
            } else if (obj.props.l2_content.dbValues[0].includes("<img")) {
                for (let i of imageViewData) {
                    obj.props.l2_content.dbValues[0] = obj.props.l2_content.dbValues[0].replace('src=""', 'src="' + i.thumbnailURL + '"');
                }
            }
        }
        $('#lgepSummerNote').summernote('reset');
        $('#lgepSummerNote').summernote('code', obj.props.l2_content.dbValues[0] + '<br>');
    } else {
        $('#lgepSummerNote').summernote('reset');
    }
}

/**
 * img또는 svg로 되어있는 htmlTag를 가져와 모든 태그와 해당 태그 안에 존재하는 속성을 삭제하여 문자열만 남긴다음 반환한다.
 * 
 * @param {String} temp - htmlTag (필수)
 * @returns {String} 반환된 문자열
 */
export function imgAndsvgOnlyString(temp) {
    if (temp.includes("<svg")) {
        temp = temp.replace(/<tspan[^>]+>/gi, '');
        temp = temp.replace(/<\/tspan>/gi, ' ');
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
    } else if (temp.includes("<img")) {
        temp = temp.replace(/<span[^>]+>/gi, '');
        temp = temp.replace(/<\/span>/gi, '');
        temp = temp.replace(/<img[^>]+>/gi, '');
        temp = temp.replace(/<p[^>]+>/gi, '');
        temp = temp.replace(/[</p^>]+>/gi, '');
        temp = temp.replace(/<\/p>/gi, '');
        temp = temp.replace(/<[/br^>]+>/gi, '');
        temp = temp.replace(/<br[^>]+>/gi, '');
        temp = temp.replace(/<br/gi, '');
    } else {
        temp = temp.replace(/<span[^>]+>/gi, '');
        temp = temp.replace(/<\/span>/gi, '');
        temp = temp.replace(/<tspan[^>]+>/gi, ' ');
        temp = temp.replace(/<\/tspan>/gi, '');
        temp = temp.replace(/<g[^>]+>/gi, '');
        temp = temp.replace(/<\/g>/gi, '');
        temp = temp.replace(/<a[^>]+>/gi, '');
        temp = temp.replace(/<\/a>/gi, '');
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
    }
    return temp;
}

//기술검토 필수 이욱채
function stripTags(str) {
    str = str.replace(/(<([^>]+)>)/gi, ""); // 태그 제거
    str = str.replace(/\s\s+/gi, ""); // 연달아 있는 줄바꿈, 공백, 탭을 제거
    return str;
}

/**
 * img또는 svg로 되어있는 htmlTag를 가져와 이미지에 해당되는 src, image의 값인 data/base64를 실제 파일로 변경 시킨 후 Teamcenter의 dataset으로 만들어 
 * data/base64데이터가 제거된 htmlTag와 dataset을 담은 result객체 반환
 * 
 * @param {String} tag - htmlTag, summernote('code') (필수)
 * @param {ModelObject} item - 만들어질 dataset과 릴레이션을 맺어줄 아이템 (선택)
 * @param {String} fileName - item의 이름 또는 만들어질 imageDataset의 이름 (선택)
 * @returns {Object} 변환된 htmlTag와 만들어진 dataset이 담긴 객체
 */
export async function base64ToFileToDataset(tag, item, fileName) {
    let temp = tag;
    let base64File = [];
    let result = {
        resultTag: "",
        dataset: {}
    };
    if (fileName == undefined) {
        fileName = "image";
    }

    if (tag.includes("<svg")) {
        if (tag.includes("<image")) {
            tag = tag.match(/\<image.*\<\/image>/gi);
            tag = tag[0];
            tag = tag.split('"');
            let base64Arr = [];
            for (let i = 0; i < tag.length; i++) {
                if (tag[i].includes("xlink:href")) {
                    base64Arr.push(tag[i + 1]);
                }
            }
            for (let i of base64Arr) {
                temp = temp.replace(i, "");
            }
            for (let i = 0; i < base64Arr.length; i++) {
                if (base64Arr[i].includes("base64")) {
                    base64File.push(imageToFile(base64Arr[i], fileName + i));
                } else {
                    base64File.push(await createFile(base64Arr[i], fileName + i));
                }
            }
            // //console.log('xlink:href=""', {temp});
        }
    } else if (tag.includes("<img")) {
        let tagTemp = [];
        tag = tag.match(/\<img.*>/gi);
        tag = tag[0];
        tag = tag.replace(/<p[^>]+>/gi, '');
        tag = tag.replace(/[</p^>]+>/gi, '');
        tag = tag.replace(/<[/br^>]+>/gi, '');
        tag = tag.replace(/<br[^>]+>/gi, '');
        tag = tag.replace(/<br/gi, '');
        tag = tag.split('"');
        for (let i = 0; i < tag.length; i++) {
            if (tag[i].includes("src=")) {
                tagTemp.push(tag[i + 1]);
            }
        }
        for (let i of tagTemp) {
            temp = temp.replace(i, "");
        }
        for (let i = 0; i < tagTemp.length; i++) {
            if (tagTemp[i].includes("base64")) {
                base64File.push(imageToFile(tagTemp[i], fileName + i));
            } else {
                base64File.push(await createFile(tagTemp[i], fileName + i));
            }
        }
        // //console.log('src=""', {temp});
    }
    result.resultTag = temp;
    let dataset = await uploadFileToDataset(base64File);
    result.dataset = dataset;
    if (item != undefined && dataset != undefined) {
        await deleteRelation(item);
        await linkRelationsSequence(item, dataset);
    }

    return result;
}

/**
 * video htmlTag를 가져와 이미지에 해당되는 src, image의 값인 data/base64를 실제 파일로 변경 시킨 후 Teamcenter의 dataset으로 만들어 
 * data/base64데이터가 제거된 htmlTag와 dataset을 담은 result객체 반환
 * 
 * @param {String} tag - htmlTag, summernote('code') (필수)
 * @param {ModelObject} item - 만들어질 dataset과 릴레이션을 맺어줄 아이템 (선택)
 * @param {String} fileName - item의 이름 또는 만들어질 videoDataset의 이름 (선택)
 * @returns {Object} 변환된 htmlTag와 만들어진 dataset이 담긴 객체
 */
export async function base64ToFileToDatasetVideo(tag, item, fileName) {
    let temp = tag;
    let base64File = [];
    let result = {
        resultTag: "",
        dataset: {}
    };
    if (fileName == undefined) {
        fileName = "video";
    }

    if (tag.includes("<video")) {
        tag = tag.match(/\<video.*\<\/video>/gi);
        tag = tag[0];
        tag = tag.split('"');
        let base64Arr = [];
        for (let i = 0; i < tag.length; i++) {
            if (tag[i].includes("src=")) {
                base64Arr.push(tag[i + 1]);
            }
        }
        for (let i of base64Arr) {
            temp = temp.replace(i, "");
        }
        for (let i = 0; i < base64Arr.length; i++) {
            base64File.push(imageToFileVideo(base64Arr[i], fileName + i));
        }
    }
    result.resultTag = temp;
    let dataset = await uploadFileToDataset(base64File);
    result.dataset = dataset;
    if (item != undefined && dataset != undefined) {
        await deleteRelation(item);
        await linkRelationsSequence(item, dataset);
    }

    return result;
}

async function uploadFileToDataset(file, dataset) {
    if (!file) {
        return undefined;
    } else if (Array.isArray(file)) {
        let datasetArr = [];
        for (let i of file) {
            let result = dataset ? dataset : await _createDatasets(i);
            _uploadFile(result, i);
            datasetArr.push(await _commitDatasetFiles(result.modelObject, i, result.ticket));
        }
        return datasetArr;
    } else {
        let result = dataset ? dataset : await _createDatasets(file);
        _uploadFile(result, file);
        let dataset = await _commitDatasetFiles(result.modelObject, file, result.ticket);
        return dataset;
    }
}

async function linkRelationsSequence(item, dataset) {
    // IMAN_specification은 createRelation으로 값을 넣는다.
    if (Array.isArray(dataset)) {
        for (let i = 0; i < dataset.length; i++) {
            var jsoObj = {
                input: [{
                    clientId: "",
                    relationType: "IMAN_specification",
                    primaryObject: item,
                    secondaryObject: dataset[i]
                }]
            }
            try {
                await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
            } catch (err) {
                //console.log(err);
            }
        }
    } else {
        var jsoObj = {
            input: [{
                clientId: "",
                relationType: "IMAN_specification",
                primaryObject: item,
                secondaryObject: dataset
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
        } catch (err) {
            //console.log(err);
        }
    }
}

async function linkRelationItem(item, dataset) {
    if (Array.isArray(dataset)) {
        for (let i = 0; i < dataset.length; i++) {
            var jsoObj = {
                input: [{
                    clientId: "",
                    relationType: "IMAN_reference",
                    primaryObject: item,
                    secondaryObject: dataset[i]
                }]
            }
            try {
                await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
            } catch (err) {
                //console.log(err);
            }
        }
    } else {
        var jsoObj = {
            input: [{
                clientId: "",
                relationType: "IMAN_reference",
                primaryObject: item,
                secondaryObject: dataset
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'createRelations', jsoObj);
        } catch (err) {
            //console.log(err);
        }
    }
}

export async function deleteRelationReference(value) {
    if (value == undefined) {
        return;
    }
    await com.getProperties(value, ["IMAN_reference"]);
    value = com.getObject(value.uid);
    value = viewC.constructViewModelObjectFromModelObject(value);
    let dataset = com.getObject(value.props.IMAN_reference.dbValues);
    for (let i = 0; i < dataset.length; i++) {
        let param = {
            input: [{
                clientId: "",
                relationType: "IMAN_reference",
                primaryObject: value,
                secondaryObject: dataset[i]
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
        } catch (err) {
            //console.log(err)
        }
    }
    let testParam = {
        objects: dataset
    }
    try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
    } catch (err) {
        //console.log(err)
    }
}

export async function selectFileRelationDelete(item, dataset) {
    if (!item || !dataset) {
        return;
    }

    if (!Array.isArray(dataset)) {
        dataset = [dataset]
    }

    for (let i = 0; i < dataset.length; i++) {
        let param = {
            input: [{
                clientId: "",
                relationType: "IMAN_reference",
                primaryObject: item,
                secondaryObject: dataset[i]
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
            let testParam = {
                objects: dataset
            }
            await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
        } catch (err) {
            //console.log(err)
        }
    }
}

export async function deleteRelation(value) {
    if (value == undefined) {
        return;
    }
    await com.getProperties(value, ["IMAN_specification"]);
    value = com.getObject(value.uid);
    value = viewC.constructViewModelObjectFromModelObject(value);
    let dataset = com.getObject(value.props.IMAN_specification.dbValues);
    for (let i = 0; i < dataset.length; i++) {
        let param = {
            input: [{
                clientId: "",
                relationType: "IMAN_specification",
                primaryObject: value,
                secondaryObject: dataset[i]
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
        } catch (err) {
            //console.log(err)
        }
    }
    let testParam = {
        objects: dataset
    }
    try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
    } catch (err) {
        //console.log(err)
    }
}

let deleteRelationText = async function (value) {
    if (value == undefined) {
        return;
    }
    await com.getProperties(value, ["IMAN_specification"]);
    value = com.getObject(value.uid);
    value = viewC.constructViewModelObjectFromModelObject(value);
    let dataset = com.getObject(value.props.IMAN_specification.dbValues);
    let deleteText = ""
    for (let i = 0; i < dataset.length; i++) {
        if (dataset[i].type == "Text") {
            deleteText = dataset[i];
            let param = {
                input: [{
                    clientId: "",
                    relationType: "IMAN_specification",
                    primaryObject: value,
                    secondaryObject: dataset[i]
                }]
            }
            try {
                await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
            } catch (err) {
                //console.log(err)
            }
        }
    }
    let testParam = {
        objects: [deleteText]
    }
    try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
    } catch (err) {
        //console.log(err)
    }
}

export async function deleteRelationAndObject(value) {
    if (value == undefined) {
        return;
    }
    await com.getProperties(value, ["IMAN_specification"]);
    value = com.getObject(value.uid);
    value = viewC.constructViewModelObjectFromModelObject(value);
    let dataset = com.getObject(value.props.IMAN_specification.dbValues);
    for (let i = 0; i < dataset.length; i++) {
        let param = {
            input: [{
                clientId: "",
                relationType: "IMAN_specification",
                primaryObject: value,
                secondaryObject: dataset[i]
            }]
        }
        try {
            await SoaService.post('Core-2006-03-DataManagement', 'deleteRelations', param);
        } catch (err) {
            //console.log(err)
        }
    }
    let testParam = {
        objects: dataset
    }
    try {
        await SoaService.post('Core-2006-03-DataManagement', 'deleteObjects', testParam);
    } catch (err) {
        //console.log(err)
    }

    let item;
    try {
        let getPropertiesParam = {
            infos: [{
                itemId: value.cellHeader2,
            }],
        }
        item = await SoaService.post("Core-2007-01-DataManagement", "getItemFromId", getPropertiesParam);
        item = item.output[0].item;
    } catch (err) {
        //console.log(err);
    }
    try {
        let deleteObj = {
            objects: [item]
        };
        await SoaService.post("Core-2006-03-DataManagement", "deleteObjects", deleteObj);
    } catch (err) {
        //console.log(err);
    }
}

export async function textFileToDataset(tag, item, fileName) {
    let temp = tag;
    let base64File = [];
    let result = {
        resultTag: "",
        dataset: {}
    };
    if (fileName == undefined) {
        fileName = "image";
    }

    if (tag.includes("<svg")) {
        if (tag.includes("<image")) {
            tag = tag.match(/\<image.*\<\/image>/gi);
            tag = tag[0];
            tag = tag.split('"');
            let base64Arr = [];
            for (let i = 0; i < tag.length; i++) {
                if (tag[i].includes("xlink:href")) {
                    base64Arr.push(tag[i + 1]);
                }
            }
            for (let i of base64Arr) {
                temp = temp.replace(i, "");
            }
            for (let i = 0; i < base64Arr.length; i++) {
                if (base64Arr[i].includes("base64")) {
                    base64File.push(imageToFile(base64Arr[i], fileName + i));
                } else {
                    base64File.push(await createFile(base64Arr[i], fileName + i));
                }
            }
            // //console.log('xlink:href=""', {temp});
        }
    } else if (tag.includes("<img")) {
        let tagTemp = [];
        tag = tag.match(/\<img.*>/gi);
        tag = tag[0];
        tag = tag.replace(/<p[^>]+>/gi, '');
        tag = tag.replace(/[</p^>]+>/gi, '');
        tag = tag.replace(/<[/br^>]+>/gi, '');
        tag = tag.replace(/<br[^>]+>/gi, '');
        tag = tag.replace(/<br/gi, '');
        tag = tag.split('"');
        for (let i = 0; i < tag.length; i++) {
            if (tag[i].includes("src=")) {
                tagTemp.push(tag[i + 1]);
            }
        }
        for (let i of tagTemp) {
            temp = temp.replace(i, "");
        }
        for (let i = 0; i < tagTemp.length; i++) {
            if (tagTemp[i].includes("base64")) {
                base64File.push(imageToFile(tagTemp[i], fileName + i));
            } else {
                base64File.push(await createFile(tagTemp[i], fileName + i));
            }
        }
        // //console.log('src=""', {temp});
    }
    result.resultTag = temp;
    let dataset = await uploadFileToDataset(base64File);
    result.dataset = dataset;
    if (item != undefined && dataset != undefined) {
        await deleteRelation(item);
        await linkRelationsSequence(item, dataset);
    }

    return result;
}

async function createFile(url, fileName) {
    let response = await fetch(url);
    let data = await response.blob();
    let metadata = {
        type: 'mime'
    };
    let file = new File([data], fileName + ".png", metadata);
    return file;
}

function imageToFile(imgsrc, fileName) {
    //atob : base64로 인코딩된 src 디코딩
    let bstr = atob(imgsrc.split(',')[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    let file = new File([u8arr], fileName + '.png', {
        type: 'mime'
    });
    return file;
    //javascript 보안상 file을 input type file value에 할당할 수는 없음.
}

function imageToFileVideo(imgsrc, fileName) {
    //atob : base64로 인코딩된 src 디코딩
    let bstr = atob(imgsrc.split(',')[1]);
    let n = bstr.length;
    let u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    let file = new File([u8arr], fileName + '.mp4', {
        type: 'mime'
    });
    return file;
    //javascript 보안상 file을 input type file value에 할당할 수는 없음.
}

/**
 * 
 * @param {*} file 
 */
function _createDatasets(file) {
    let childName = "";
    let type = "";
    if (file) {
        if (file.name.indexOf(".") >= 0) {
            type = file.name.split(".")[file.name.split(".").length - 1];
            childName = file.name.slice(0, -(type.length + 1));
            file.ext = type;
            file.onlyname = childName;
        }
    }
    var deferred = AwPromiseService.instance.defer();
    let selectedtype = [];
    if (type != null && type !== "") {
        type = type.toLowerCase();
        if (type === "bmp") {
            selectedtype = ["Bitmap", "Bitmap", "Plain", "Image"];
        } else if (type === "jt") {
            selectedtype = ["DirectModel", "DirectModel", "Plain", "JTPART"];
        } else if (type === "cgm") {
            selectedtype = ["DrawingSheet", "DrawingSheet", "Plain", "Sheet"];
        } else if (type === "dwg") {
            selectedtype = ["DWG", "DWG", "Plain", "DWG"];
        } else if (type === "dxf") {
            selectedtype = ["DXF", "DXF", "Plain", "DXF"];
        } else if (type === "gif") {
            selectedtype = ["GIF", "GIF", "Plain", "GIF_Reference"];
        } else if (type === "jpg" || type === "jpeg") {
            selectedtype = ["JPEG", "JPEG", "Plain", "JPEG_Reference"];
        } else if (type === "xls") {
            selectedtype = ["MSExcel", "MSExcel", "Plain", "excel"];
        } else if (type === "xlsx") {
            selectedtype = ["MSExcelX", "MSExcels", "Plain", "excel"];
        } else if (type === "ppt") {
            selectedtype = ["MSPowerPoint", "MSPowerPoint", "Plain", "powerpoint"];
        } else if (type === "pptx") {
            selectedtype = ["MSPowerPointX", "MSPowerPointX", "Plain", "powerpoint"];
        } else if (type === "doc") {
            selectedtype = ["MSWord", "MSWord", "Plain", "word"];
        } else if (type === "docx") {
            selectedtype = ["MSWordX", "MSWordX", "Plain", "word"];
        } else if (type === "mpp") {
            selectedtype = ["MSProject", "MSProject", "Plain", "Ms_Project_Doc"];
        } else if (type === "pdf") {
            selectedtype = ["PDF", "PDF", "Plain", "PDF_Reference"];
        } else if (type === "asm") {
            selectedtype = ["SE Assembly", "SE Assembly", "Plain", "SE-assembly"];
        } else if (type === "dft") {
            selectedtype = ["SE Draft", "SE Draft", "Plain", "SE-draft"];
        } else if (type === "par") {
            selectedtype = ["SE Part", "SE Part", "Plain", "SE-part"];
        } else if (type === "psm") {
            selectedtype = ["SE SheetMetal", "SE SheetMetal", "Plain", "SE-sheetMetal"];
        } else if (type === "pwd") {
            selectedtype = ["SE Weldment", "SE Weldment", "Plain", "SE-weldment"];
        } else if (type === "tif") {
            selectedtype = ["TIF", "TIF", "Plain", "TIF_Reference"];
        } else if (type === "txt" || type === "TXT") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "html" || type === "htm") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "zip") {
            selectedtype = ["Zip", "Zip", "Plain", "ZIPFILE"];
        } else if (type === "mht") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "png") {
            selectedtype = ["Image", "Image", "Plain", "Image"];
        } else if (type == "mp4") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0MP4"]
        } else if (type == "avi") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0AVI"]
        } else if (type == "swf") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0SWF"]
        }
    }
    let inputParam = {
        input: [{
            clientId: "0",
            name: file.name,
            container: {},
            type: selectedtype[0],
            datasetFileInfos: [{
                clientId: "1",
                fileName: file.name,
                namedReferenceName: selectedtype[3],
                isText: false,
                allowReplace: true
            }]
        }]
    }
    if (type == "txt" || type === "TXT" || type == "mht" || type === "html" || type === "htm") {
        inputParam.input[0].datasetFileInfos[0].isText = true;
    }
    SoaService.post('Core-2010-04-DataManagement', 'createDatasets', inputParam).then((res) => {
        let result = {
            "modelObject": res.datasetOutput[0].dataset,
            "ticket": res.datasetOutput[0].commitInfo[0].datasetFileTicketInfos[0].ticket
        }
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
    formData.append("fmsFile", file, file.name);
    formData.append("fmsTicket", ticketURL);
    request.onload = function () {
        if (this.status >= 200 && this.status < 300) {
            deferred.resolve(request.response);
        } else {
            deferred.reject({
                status: request.status,
                statusText: request.statusText
            });
        }
    };
    request.open("POST", document.location.origin + "/fms/fmsupload/", true);
    request.setRequestHeader("X-XSRF-TOKEN", _getCookieValue("XSRF-TOKEN"));
    request.send(formData);
}

/**
 * 
 * @param {*} targetDataset 
 * @param {*} file 
 * @param {*} ticket 
 */
function _commitDatasetFiles(targetDataset, file, ticket) {
    var deferred = AwPromiseService.instance.defer();
    let selectedtype = [];
    let type = file.ext;
    if (type != null && type !== "") {
        type = type.toLowerCase();
        if (type === "bmp") {
            selectedtype = ["Bitmap", "Bitmap", "Plain", "Image"];
        } else if (type === "jt") {
            selectedtype = ["DirectModel", "DirectModel", "Plain", "JTPART"];
        } else if (type === "cgm") {
            selectedtype = ["DrawingSheet", "DrawingSheet", "Plain", "Sheet"];
        } else if (type === "dwg") {
            selectedtype = ["DWG", "DWG", "Plain", "DWG"];
        } else if (type === "dxf") {
            selectedtype = ["DXF", "DXF", "Plain", "DXF"];
        } else if (type === "gif") {
            selectedtype = ["GIF", "GIF", "Plain", "GIF_Reference"];
        } else if (type === "jpg") {
            selectedtype = ["JPEG", "JPEG", "Plain", "JPEG_Reference"];
        } else if (type === "xls") {
            selectedtype = ["MSExcel", "MSExcel", "Plain", "excel"];
        } else if (type === "xlsx") {
            selectedtype = ["MSExcelX", "MSExcels", "Plain", "excel"];
        } else if (type === "ppt") {
            selectedtype = ["MSPowerPoint", "MSPowerPoint", "Plain", "powerpoint"];
        } else if (type === "pptx") {
            selectedtype = ["MSPowerPointX", "MSPowerPointX", "Plain", "powerpoint"];
        } else if (type === "doc") {
            selectedtype = ["MSWord", "MSWord", "Plain", "word"];
        } else if (type === "docx") {
            selectedtype = ["MSWordX", "MSWordX", "Plain", "word"];
        } else if (type === "mpp") {
            selectedtype = ["MSProject", "MSProject", "Plain", "Ms_Project_Doc"];
        } else if (type === "pdf") {
            selectedtype = ["PDF", "PDF", "Plain", "PDF_Reference"];
        } else if (type === "asm") {
            selectedtype = ["SE Assembly", "SE Assembly", "Plain", "SE-assembly"];
        } else if (type === "dft") {
            selectedtype = ["SE Draft", "SE Draft", "Plain", "SE-draft"];
        } else if (type === "par") {
            selectedtype = ["SE Part", "SE Part", "Plain", "SE-part"];
        } else if (type === "psm") {
            selectedtype = ["SE SheetMetal", "SE SheetMetal", "Plain", "SE-sheetMetal"];
        } else if (type === "pwd") {
            selectedtype = ["SE Weldment", "SE Weldment", "Plain", "SE-weldment"];
        } else if (type === "tif") {
            selectedtype = ["TIF", "TIF", "Plain", "TIF_Reference"];
        } else if (type === "txt") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "html" || type === "htm") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "zip") {
            selectedtype = ["Zip", "Zip", "Plain", "ZIPFILE"];
        } else if (type === "mht") {
            selectedtype = ["Text", "Text", "Plain", "Text"];
        } else if (type === "png") {
            selectedtype = ["Image", "Image", "Plain", "Image"];
        } else if (type == "mp4") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0MP4"]
        } else if (type == "avi") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0AVI"]
        } else if (type == "swf") {
            selectedtype = ["Fnd0VideoData", "Fnd0VideoData", "Plain", "Fnd0SWF"]
        }
    }
    let inputParam = {
        commitInput: [{
            dataset: targetDataset,
            createNewVersion: true,
            datasetFileTicketInfos: [{
                datasetFileInfo: {
                    clientId: "1",
                    fileName: file.name,
                    namedReferencedName: selectedtype[3],
                    isText: false,
                    allowReplace: true
                },
                ticket: ticket
            }]
        }]
    }
    if (type == "txt" || type == "mht" || type === "html" || type === "htm") {
        inputParam.commitInput[0].datasetFileTicketInfos[0].datasetFileInfo.isText = true;
    }

    SoaService.post('Core-2006-03-FileManagement', 'commitDatasetFiles', inputParam).then((res) => {
        let result = res.modelObjects[targetDataset.uid];
        deferred.resolve(result);
    });
    return deferred.promise;
}
/**
 * 
 * @param {*} result 
 * @param {*} file 
 */

function _getCookieValue(key) {
    let cookieKey = key + "=";
    let result = "";
    const cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        if (cookieArr[i][0] === " ") {
            cookieArr[i] = cookieArr[i].substring(1);
        }

        if (cookieArr[i].indexOf(cookieKey) === 0) {
            result = cookieArr[i].slice(cookieKey.length, cookieArr[i].length);
            return result;
        }
    }
    return result;
}

function summernoteUploadImage(context) {
    var ui = $.summernote.ui;
    let id = context.$note[0].id;
    // console.log("실행?",{context});
    // console.log("id",{id});
    // 이벤트 지정
    var button = ui.button({
        // 툴바 표시 내용
        contents: '<i class="fa fa-pencil"/> SVG',
        // 툴바 툴팁 표현 내용 
        // tooltip: '',
        // 클릭시 이벤트 작동
        click: function (event) {
            //console.log("눌렀다.");
            var input = document.createElement('input');
            input.type = 'file';
            input.multiple = 'multiple';
            input.accept = '.svg';

            let promiseArray = [];
            input.onchange = e => {
                var files = e.target.files;
                //console.log("파일 보기", {
                // files
                // });
                for (const value of files) {
                    let promise = new Promise((resolve) => {
                        var reader = new FileReader();
                        reader.readAsText(value, 'UTF-8');
                        reader.onload = readerEvent => {
                            var content = readerEvent.target.result;
                            resolve(content);
                        }
                    });
                    promiseArray.push(promise);
                }
                Promise.all(promiseArray).then((svgArr) => {
                    //console.log(svgArr);
                    let temp;
                    for (let i = 0; i < svgArr.length; i++) {
                        svgArr[i] = svgArr[i].replaceAll('id=\"', `id=\"${i}_`);
                        svgArr[i] = svgArr[i].replaceAll('#clip', `#${i}_clip`);
                        svgArr[i] = svgArr[i].replaceAll('#img', `#${i}_img`);
                        if (i > 0) {
                            temp = temp + svgArr[i] + '<br>';
                        } else {
                            temp = svgArr[i] + '<br>';
                        }
                    }
                    $('#' + id).summernote('code', $('#' + id).summernote('code') + "<br>" + temp + "<br>");
                })
            }
            input.click();
        },
    });
    return button.render();
}

function summernoteUploadVideo(context) {
    let id = context.$note[0].id;
    var ui = $.summernote.ui;
    // 이벤트 지정
    var button = ui.button({
        // 툴바 표시 내용
        contents: '<i class="fa fa-pencil"/> MP4',
        // 툴바 툴팁 표현 내용 
        // tooltip: '',
        // 클릭시 이벤트 작동
        click: function (event) {

            var input = document.createElement('input');
            input.type = 'file';
            input.accept = '.mp4, .webm, .ogv';
            input.onchange = e => {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = (ev) => {
                    var videoElement = document.createElement('video');
                    videoElement.setAttribute("controls", "true");
                    videoElement.src = ev.target.result;
                    var timer = setInterval(() => {
                        if (videoElement.readyState === 4) {
                            if (videoElement.duration) {
                                //console.log(file) //the file object
                                //console.log(videoElement.duration) //video duration
                            }
                            clearInterval(timer);
                            $('#' + id).summernote('code', $('#' + id).summernote('code') + "<br>" + videoElement.outerHTML + "<br>");
                        }
                    }, 500)
                }
                reader.readAsDataURL(file);
            }
            input.click();
        },
    });
    return button.render();
}

export async function stringToDataset(name, content) {
    let files = [];
    files.push(new File([content], name + ".TXT", {
        type: 'text'
    }));
    let dataset = await uploadFileToDataset(files);
    return dataset;
}

export function modifyDataset(name, content, dataset) {
    let files = [];
    files.push(new File([content], name + ".TXT", {
        type: 'text'
    }));
    return SoaService.post('Ai-2006-03-Ai', 'getFileWriteTickets', {originalFileNames: ["details.TXT"], fileTypes: ["Plain","Text"]}).then((res) => {
        files[0].ticket = res.tickets[1][0];
        return;
    }).then( () => {
        return uploadFileToDataset(files, dataset);
    })
}

let exports = {};

export default exports = {
    base64ToFileToDataset,
    deleteRelationAndObject,
    imgAndsvgOnlyString,
    editSummerNoteChange,
    summerNoteInitialize,
    deleteRelation,
    textFileToDataset,
    stripTags,
    txtFileToDataset,
    txtFileToDatasetNoDelete,
    readHtmlToSummernote,
    relationReadSummernote,
    uploadFileToDataset,
    linkRelationItem,
    summernoteUploadImage,
    summernoteUploadVideo,
    base64ToFileToDatasetVideo,
    videoAndTextDataSet,
    readHtmlToSummernoteChapterAndBook,
    readHtmlToSummernoteProtoOne,
    selectFileRelationDelete,
    stringToDataset,
    modifyDataset
};

app.factory('lgepSummerNoteUtils', () => exports);