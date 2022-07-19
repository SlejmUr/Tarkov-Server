const fs = require('fs');
const { logger } = require('./../../core/util/logger');

/**
 * Config Controller. 
 * This controller provides direct access to all the config json files found in user/configs
 */
class ConfigController {
    constructor() {
        ConfigController.rebuildFromBaseConfigs();
    }

    static Instance = new ConfigController();
    static Configs = {};

    static init() {
      ConfigController.rebuildFromBaseConfigs();
    }

    /**
     * Fills ConfigController.Configs with parsed JSON data from user/configs directory
     */
    static rebuildFromBaseConfigs() {
        if(ConfigController.Configs === undefined)
            ConfigController.Configs = {};

        this.refreshGameplayConfigFromBase();
        this.refreshServerConfigFromBase();

        const files = fs.readdirSync(`user/configs/`);
      
        for (const f of files) {
            const dataRaw = fs.readFileSync(`user/configs/${f}`);
            if(dataRaw !== undefined) {
                ConfigController.Configs[f.replace(".json", "")] = JSON.parse(dataRaw);
            }
        }
        
    }

    static refreshServerConfigFromBase() {
        if(!fs.existsSync(process.cwd() + "/user/configs/server_base.json"))
          throw "Could not find " + process.cwd() + "/user/configs/server_base.json";
    
        const serverConfigBase = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server_base.json"));
        if(serverConfigBase === undefined)
          throw "Server Config Base data not found";
    
        if(!fs.existsSync(process.cwd() + "/user/configs/server.json"))
          fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(serverConfigBase));
    
        if(fs.existsSync(process.cwd() + "/user/configs/server.json"))
          global.serverConfig = JSON.parse(fs.readFileSync(process.cwd() + "/user/configs/server.json"));
    
        // let changesMade = false;
        // for(let item in serverConfigBase) {
        //   if(global.serverConfig[item] === undefined) {
        //     global.serverConfig[item] = serverConfigBase[item];
        //     logger.logInfo("Adding Config Setting " + item + " to server.json");
        //     changesMade = true;
        //   }
        // }
        let changesMade = false;
        changesMade = ConfigController.mergeRecursiveIgnoringExisting(global.serverConfig, serverConfigBase);
    
        if(changesMade)
          fs.writeFileSync(process.cwd() + "/user/configs/server.json", JSON.stringify(global.serverConfig));
      }
    
      static  refreshGameplayConfigFromBase() {
        const configBase = JSON.parse(fs.readFileSync("user/configs/gameplay_base.json"));
        if(!fs.existsSync("user/configs/gameplay.json"))
          fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(configBase));
    
          let gpjson = {};
        if(fs.existsSync("user/configs/gameplay.json"))
          gpjson = JSON.parse(fs.readFileSync("user/configs/gameplay.json"));
    
        let changesMade = false;
        // for(let rootItem in configBase) {
        //   if(gpjson[rootItem] === undefined) {
        //     gpjson[rootItem] = configBase[rootItem];
        //     logger.logInfo("Adding Config Setting " + rootItem + " to gameplay.json");
        //     changesMade = true;
        //   }
        //   else {
        //     if(Object.keys(gpjson[rootItem]) !== undefined && Object.keys(gpjson[rootItem]).length > 0) {
        //       console.log(gpjson[rootItem]);
        //     }
        //   }
        // }
        changesMade = ConfigController.mergeRecursiveIgnoringExisting(gpjson, configBase);
    
        if(changesMade)
          fs.writeFileSync("user/configs/gameplay.json", JSON.stringify(gpjson));
      }

      static mergeRecursiveIgnoringExisting(targetObject, sourceObject) {
        let changesMade = false;
        for(const key of Object.keys(sourceObject))
        {
          if (typeof sourceObject[key] === "object") {
            if (targetObject[key] === undefined) {
              targetObject[key] = {};
              changesMade = true;
            }
            const innerChangesMade = ConfigController.mergeRecursiveIgnoringExisting(targetObject[key], sourceObject[key]);
            if(innerChangesMade)
              changesMade = true;
          } else {
            if(targetObject[key] === undefined) {
              targetObject[key] = sourceObject[key];
              changesMade = true;
            }
          }
        };
        return changesMade;
      }

}

module.exports.ConfigController = ConfigController;
module.exports.ConfigControllerInstance = ConfigController.Instance;
