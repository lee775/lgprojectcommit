
import app from 'app';

let exports = {};

export const SPACING = '\u00a0\u00a0';
export const TWOSPACING = SPACING + SPACING;


export default exports = {
    SPACING,
    TWOSPACING
}


app.factory('checklistConstants', () => exports);