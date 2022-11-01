// Copyrights for LG Electronics, 2022
// Written by MH.ROH

import app from 'app';
import _ from 'lodash';
import soaService from 'soa/kernel/soaService';

let exports = {};

/**
 * 
 * @param {String} prefName 
 * @param {String} prefScope 
 * @returns 
 */
export const getPreference = function (prefName, prefScope = "all") {
    return getPreferences([prefName], prefScope);
};

/**
 * 팀센터에 등록된 Preference를 반환한다.
 * @param {string} prefNames - Preference 이름
 * @param {string} prefScope - The scope in which the preferences are to be searched, "all", "site", "user", "group", or "role".
 * @returns {Promise} preference name/values.
 */
export const getPreferences = function (prefNames, prefScope = "all") {
    if (prefNames && !Array.isArray(prefNames) && _.isString(prefNames)) {
        prefNames = [prefNames];
    }

    let requestParam = {
        prefScope: prefScope,
        prefNames: prefNames
    };
    return soaService.post('Core-2006-03-Session', 'getPreferences', requestParam);
};

/**
 * 
 * @param {String} prefName 
 * @param {String} prefScope 
 * @returns 
 */
export const getPreferenceValues = async function (prefName, prefScope = "all") {
    const response = await getPreferences(prefName, prefScope);
    return response.Preferences.prefs[0].values;
};

/**
 * Refreshes the preference values stored in the server cache, so that they are synchronized with the latest values.
 * 
 * @returns 
 */
export const refreshPreferences = function () {
    return soaService.post('Administration-2011-05-PreferenceManagement', 'refreshPreferences');
};

export default exports = {
    getPreference,
    getPreferences,
    getPreferenceValues,
    refreshPreferences
};
app.factory('lgepPreferenceUtils', () => exports);