import app from 'app';
import SoaService from 'soa/kernel/soaService';
import com from "js/utils/lgepObjectUtils";
import vms from 'js/viewModelService';
import eventBus from 'js/eventBus';
import 'summernote/dist/summernote-lite';
import 'summernote/dist/summernote-lite.css';
import popupService from 'js/popupService';
import lgepPreferenceUtils from 'js/utils/lgepPreferenceUtils';
var $ = require('jQuery');
import locale from 'js/utils/lgepLocalizationUtils';
import common from "js/utils/lgepCommonUtils";
import message from 'js/utils/lgepMessagingUtils';

let selectedListValue = undefined;
let originalFolder;
let folderList = [];
const recentSearches = locale.getLocalizedText("knowledgeSearchMessages", "recentSearches");


export async function setInitListValue(data, ctx) {
    let htmlData = vms.getViewModelUsingElement(document.getElementById("test1"));
    let selectedObj = htmlData.selectedObj

    let prefer = await lgepPreferenceUtils.getPreference("L2_DevKnowledge_Favorites");
    let favoriteUID = prefer.Preferences.prefs[0].values[0].value;

    let getFolder = {
        uids: [favoriteUID]
    };
    try {
        getFolder = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    } catch (err) {
        //console.log(err);
    }
    getFolder = Object.values(getFolder.modelObjects)[0];

    await com.getProperties([getFolder], ["contents", "owning_user"]);

    let folders = getFolder.props.contents.dbValues;
    
    getFolder = {
        uids: folders
    };
    folders = await SoaService.post("Core-2007-09-DataManagement", "loadObjects", getFolder);
    folders = Object.values(folders.modelObjects);
    await com.getProperties(folders, ["contents", "owning_user", "creation_date"]);
    folders.sort((a, b) => new Date(a.props.creation_date.dbValues[0]) - new Date(b.props.creation_date.dbValues[0]));

    folderList = [];
    data.listPartValues.dbValue.splice(0, data.listPartValues.length);
    for(let folder of folders) {
        if(folder.props.owning_user.dbValues[0] === ctx.user.uid && folder.props.object_string.dbValues[0] != recentSearches) {
            folderList.push(folder);
            data.listPartValues.dbValue.push(
                {
                    "propDisplayValue": folder.props.object_string.dbValues[0],
                    "propInternalValue": folder.props.object_string.dbValues[0]
                }
            );
        }
    }

    for(let folder of folderList) {
        for(let content of folder.props.contents.dbValues) {
            if(content === selectedObj.uid) {
                data.listPart.dbValue = folder.props.object_string.dbValues[0];
                data.listPart.uiValue = folder.props.object_string.dbValues[0];
                data.listPart.prevDisplayValues[0] = folder.props.object_string.dbValues[0];
                originalFolder = folder.props.object_string.dbValues[0];
            }
        }
    }
    data.iconName = htmlData.buttonStar.iconName;
}

export function setSelectedListValue(data) {
    selectedListValue = data.listPart.dbValue;
}

export async function addFavorite(data, ctx) {
    let htmlData = vms.getViewModelUsingElement(document.getElementById("test1"));
    let selectedObj = htmlData.selectedObj
    if (selectedListValue != undefined) {
        data.listPart.dbValue = selectedListValue;
    }

    let contents = [];
    for(let folder of folderList) {
        if(folder.props.object_string.dbValues[0] === selectedListValue) {
            for(let content of folder.props.contents.dbValues) {
                contents.push(content);
            }
            contents.push(selectedObj.uid);
            try {
                let setPropsItem = {
                    objects: [folder],
                    attributes: {
                        contents: {
                            stringVec: contents
                        }
                    }
                }
    
                await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                await common.userLogsInsert("Add Favorites", selectedObj.uid, "S", "Success");
                htmlData.buttonStar.iconName = "FilledStar";
                eventBus.publish("favoritesList.changeUpdated");
                popupService.hide(htmlData.popupId);
            } catch (err) {
                //console.log(err);
            }
        }
    }

}

export async function delFavorite(data, ctx) {
    let htmlData = vms.getViewModelUsingElement(document.getElementById("test1"));
    let selectedObj = htmlData.selectedObj
    if (selectedListValue != undefined) {
        data.listPart.dbValue = selectedListValue;
    }

    for(let folder of folderList) {
        if(folder.props.object_string.dbValues[0] === originalFolder) {
            let contents = [];
            for(let content of folder.props.contents.dbValues) {
                if(content != selectedObj.uid) {
                    contents.push(content);
                }
            }
            try {
                let setPropsItem = {
                    objects: [folder],
                    attributes: {
                        contents: {
                            stringVec: contents
                        }
                    }
                }

                await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                await common.userLogsInsert("Delete Favorites", selectedObj.uid, "S", "Success");
                htmlData.buttonStar.iconName = "EmptyStar";
                eventBus.publish("favoritesList.changeUpdated");
                popupService.hide(htmlData.popupId);
            } catch (err) {
                //console.log(err);
                
            }
        }
    }

}

export async function editFavorite(data, ctx) {
    let htmlData = vms.getViewModelUsingElement(document.getElementById("test1"));
    let selectedObj = htmlData.selectedObj

    if (selectedListValue != undefined) {
        data.listPart.dbValue = selectedListValue;
    }

    if(!selectedListValue) {
        for(let folder of folderList) {
            if(folder.props.object_string.dbValues[0] === originalFolder) {
                let contents = [];
                for(let content of folder.props.contents.dbValues) {
                    if(content != selectedObj.uid) {
                        contents.push(content);
                    }
                }
                try {
                    let setPropsItem = {
                        objects: [folder],
                        attributes: {
                            contents: {
                                stringVec: contents
                            }
                        }
                    }
    
                    await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                    await common.userLogsInsert("Delete Favorites", selectedObj.uid, "S", "Success");
                } catch (err) {
                    //console.log(err);
                    await common.userLogsInsert("Delete Favorites", selectedObj.uid, "F", "Fail");
                    message.show(1,"즐겨찾기 삭제 중 오류가 발생했습니다.");
                }
            }
        }
        htmlData.buttonStar.iconName = "EmptyStar";
    } else {
        for(let folder of folderList) {
            if(folder.props.object_string.dbValues[0] === selectedListValue) {
                let contents = [];
                for(let content of folder.props.contents.dbValues) {
                    contents.push(content);
                }
                contents.push(selectedObj.uid);
                try {
                    let setPropsItem = {
                        objects: [folder],
                        attributes: {
                            contents: {
                                stringVec: contents
                            }
                        }
                    }
    
                    await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                    await common.userLogsInsert("Update Favorites", selectedObj.uid, "S", "Success");
                } catch (err) {
                    //console.log(err);
                    await common.userLogsInsert("Update Favorites", selectedObj.uid, "F", "Fail");
                    message.show(1,"즐겨찾기 편집 중 오류가 발생했습니다.");
                }
            }
            if(folder.props.object_string.dbValues[0] === originalFolder) {
                let contents = [];
                for(let content of folder.props.contents.dbValues) {
                    if(content != selectedObj.uid) {
                        contents.push(content);
                    }
                }
                try {
                    let setPropsItem = {
                        objects: [folder],
                        attributes: {
                            contents: {
                                stringVec: contents
                            }
                        }
                    }

                    await SoaService.post("Core-2007-01-DataManagement", "setProperties", setPropsItem);
                } catch (err) {
                    //console.log(err);
                }
            }
        }
    }
    eventBus.publish("favoritesList.changeUpdated");
    popupService.hide(htmlData.popupId);
    
}

let exports = {};

export default exports = {
    setInitListValue,
    setSelectedListValue,
    addFavorite,
    delFavorite,
    editFavorite

};
app.factory('sidePanelService', () => exports);