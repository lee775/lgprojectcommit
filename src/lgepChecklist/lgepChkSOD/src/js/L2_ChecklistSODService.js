import app from 'app';

var exports = {};

export function openChecklistSod() {
    alert("openChecklistSod")
}

export default exports = {
    openChecklistSod
}

app.factory('L2_ChecklistSODService', () => exports);