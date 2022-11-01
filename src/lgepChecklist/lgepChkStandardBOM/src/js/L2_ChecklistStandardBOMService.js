import app from 'app';

var exports = {};

/**
 *  체크리스트 생성 UI를 호출한다
 */
 export function addChecklist() {
    alert("add");
}

export default exports = {
    addChecklist
}

app.factory('L2_ChecklistStandardBOMService', () => exports);