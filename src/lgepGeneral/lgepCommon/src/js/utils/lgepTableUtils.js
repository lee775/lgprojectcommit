import app from 'app';
import appCtxService from 'js/appCtxService';

let exports = {};

class TableBuilder {
    constructor({type: type="table", columns: columns}) {
        this.type = type;
        this.columns = columns
    }

    /**
     * 
     * @param {*} name 
     * @param {*} displayName 
     * @param {*} minWidth 
     * @param {*} width 
     * @param {*} isTreeNavigation 
     */
    createColumnConfig(name, displayName, minWidth, width, isTreeNavigation=false) {
        let columnConfig = {};
        columnConfig["name"] = name;
        columnConfig["displayName"] = displayName;
        columnConfig["minWidth"] = minWidth;
        columnConfig["width"] = width;
        columnConfig["isTreeNavigation"] = isTreeNavigation;
        return columnConfig;
    }
    
    /**
     * 
     * @param  {...any} columnConfigs 
     */
    setColumns(...columnConfigs) {
        this.columns = columnConfigs;
    }
}

export default exports = {
    TableBuilder
};

app.factory('lgepTableUtils', () => exports);