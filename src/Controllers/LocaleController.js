const fs = require('fs');
const utility = require('./../../core/util/utility');
const { logger } = require('../../core/util/logger');
const { AccountController } = require('./AccountController')
const { DatabaseController } = require('./DatabaseController');


class LocaleController
{
    static dblocales = DatabaseController.getDatabase().locales;

    static getLanguages() {
        return DatabaseController.getDatabase().languages;
    }

    static getMenu(lang, url, sessionID) {
        const currentLang = url.replace("/client/menu/locale/", "");
        const account = AccountController.find(sessionID);
        lang = currentLang;
    
        if (account.lang != lang) account.lang = lang;
        if (utility.isUndefined(LocaleController.dblocales.menu[lang]))
          return LocaleController.dblocales.menu["en"];
        return LocaleController.dblocales.menu[lang];
    }

    static getLocale(lang, url, sessionID) {
        const currentLang = url.replace("/client/locale/", "");
        const account = AccountController.find(sessionID);
        lang = currentLang;
    
        if (account.lang != lang) account.lang = lang;
        if (utility.isUndefined(LocaleController.dblocales.global[lang]))
            return LocaleController.dblocales.global["en"];
        return LocaleController.dblocales.global[lang];
    }
    
    static getGlobal(lang, sessionID) {
        const account = AccountController.find(sessionID);
        if (account.lang != lang) account.lang = lang;
        if (utility.isUndefined(LocaleController.dblocales.global[lang]))
            return LocaleController.dblocales.global["en"];
        return LocaleController.dblocales.global[lang];
    }

}

module.exports.LocaleController = LocaleController;