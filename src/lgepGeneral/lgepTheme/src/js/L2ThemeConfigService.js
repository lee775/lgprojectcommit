import app from 'app';
import message from 'js/utils/lgepMessagingUtils'
import locale from 'js/utils/lgepLocalizationUtils';
import theme from 'js/theme.service';

export function setGlobalNavMenuFontSize(fontSize){
    //set Global Variables for menu font size
    document.documentElement.style.setProperty("--nav_bar_font_size", fontSize + "px");
    localStorage.setItem("ThemeMenuFontSize", fontSize);
    return;
}

export function setTextBox(target) {
    //Initialize Variables
    let limitValue = 10;
    let targetValue = Number.parseInt(target.dbValue);
    
    //Remove Noty Container
    if(document.getElementById("noty_bottom_layout_container")){
        document.getElementById("noty_bottom_layout_container").remove();
    }
    // document.getElementsByClassName("noty_modal").forEach( (noty) => { noty.remove });

    //Check validation
    try {
        if(targetValue < limitValue) {
            message.show("WARNING", locale.getLocalizedText("lgepThemeMessages", "fontSizeWarningMsg"));
            target.dbValue = limitValue;
            target.dispValue = limitValue;
            exports.setGlobalNavMenuFontSize(limitValue);
            return;
        }
        exports.setGlobalNavMenuFontSize(targetValue);
        message.show("INFO", locale.getLocalizedText("lgepThemeMessages", "fontSizeCompleteMsg"));
    } catch(error) {
        message.show("ERROR", locale.getLocalizedText("lgepThemeMessages", "fontSizeErrorMsg" + "\n" + error.message));
    } finally {
        let noties = document.getElementsByClassName("noty_modal");
        noties.length > 0 ? noties[0].remove() : null;
    }
}


export function onMount(fontSizeVmp) {
    //Initialize Variable if not set
    let fontSize = document.documentElement.style.getPropertyValue("--nav_bar_font_size");
    if(fontSize == "") {
        fontSize = "10";
    }
    if(fontSize.includes("px")) {
        fontSize = fontSize.replace("px", "");
    }
    fontSizeVmp.dbValue = fontSize;
    fontSizeVmp.dispValue = fontSize;
    return;
}

export function updateThemeConfigAction(data, ctx) {
    theme.setTheme('ui-lgepWhite');
    let themeMenuFontSize = localStorage.getItem("ThemeMenuFontSize");
    if(themeMenuFontSize) {
        exports.setGlobalNavMenuFontSize(themeMenuFontSize, undefined, true);
    } else {
        localStorage.setItem("ThemeMenuFontSize", 12);
    }
    return;
}

let exports = {};
export default exports = {
    setGlobalNavMenuFontSize,
    setTextBox,
    onMount,
    updateThemeConfigAction
}
app.factory('L2ThemeConfigService', () => exports);
