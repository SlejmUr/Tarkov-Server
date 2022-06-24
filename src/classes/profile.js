"use strict";
const { AccountServer } = require('./account');
const fs = require('fs');

/*
 * ProfileServer class maintains list of active profiles for each sessionID in memory. All first-time loads and save
 * operations also write to disk.*
 */
class ProfileServer {
  constructor() {
    this.profiles = {};
    this.profileFileAge = {};
    this.skippedSaves = {};
  }

  initializeProfile(sessionID) {
    this.profiles[sessionID] = {};
    dialogue_f.handler.initializeDialogue(sessionID);
    health_f.handler.initializeHealth(sessionID);
    insurance_f.handler.resetSession(sessionID);
    this.loadProfileFromDisk(sessionID);
  }

  /**
   * Load the user profiled specified by sessionID from disk, generate a scav and set the profileFileAge variable as well as the skipeedSaves count.
   * @param {*} sessionID 
   * @returns {object}
   */
  loadProfileFromDisk(sessionID) {
    if (typeof sessionID == "undefined") logger.throwErr("[CLUSTER]Session ID is undefined", "~/src/classes/profile.js | 19");
    try {
      // Check if the profile file exists
      if (!global.internal.fs.existsSync(getPmcPath(sessionID))) {
        logger.logError(`Profile file for session ID ${sessionID} not found.`);
        return false;
      }

      //Load the PMC profile from disk.
      this.profiles[sessionID]["pmc"] = fileIO.readParsed(getPmcPath(sessionID));

      // Set the file age for the users character.json.
      let stats = global.internal.fs.statSync(getPmcPath(sessionID));
      this.profileFileAge[sessionID] = stats.mtimeMs;

      // Set the skipped saves value to 1 (used to count how many saves it should skip until the server frees some memory)
      this.skippedSaves[sessionID] = 1;

      // Generate a scav
      this.profiles[sessionID]["scav"] = this.generateScav(sessionID);
    } catch (e) {
      if (e instanceof SyntaxError) {
        return logger.logError(
          `There is a syntax error in the character.json file for AID ${sessionID}. This likely means you edited something improperly. Call stack: \n${e.stack}`
        );
      } else {
        logger.logData(sessionID);
        logger.logError(`There was an issue loading the user profile with session ID ${sessionID}. Call stack:`);
        logger.logData(e);
        return;
      }
    }
    logger.logSuccess(`Loaded profile for AID ${sessionID} successfully.`);
  }

  /**
   * Reload the profile from disk if the profile was changed by another server.
   * @param {*} sessionID 
   */
  reloadProfileBySessionID(sessionID) {
    if (typeof sessionID == "undefined") logger.throwErr("[CLUSTER]Session ID is undefined", "~/src/classes/profile.js | 19");
    try {

      // Check if the profile file exists
      if (global.internal.fs.existsSync(getPmcPath(sessionID))) {

        // Compare the file age saved in memory with the file age on disk.
        let stats = global.internal.fs.statSync(getPmcPath(sessionID));
        if (stats.mtimeMs != this.profileFileAge[sessionID]) {

          //Load the PMC profile from disk.
          this.profiles[sessionID]["pmc"] = fileIO.readParsed(getPmcPath(sessionID));

          // Set the file age for the users character.json.
          let stats = global.internal.fs.statSync(getPmcPath(sessionID));
          this.profileFileAge[sessionID] = stats.mtimeMs;

          // Set the skipped saves value to 1 (used to count how many saves it should skip until the server frees some memory)
          this.skippedSaves[sessionID] = 1;

          logger.logWarning(`Profile for AID ${sessionID} was modified elsewhere. Profile was reloaded successfully.`)
        }
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        return logger.logError(
          `There is a syntax error in the character.json file for AID ${sessionID}. This likely means you edited something improperly. Call stack: \n${e.stack}`
        );
      } else {
        logger.logData(sessionID);
        logger.logError(`There was an issue loading the user profile with session ID ${sessionID}. Call stack:`);
        logger.logData(e);
        return;
      }
    }
  }

  /**
   * Check if the sessionID is loaded.
   * @param {string} sessionID 
   */
  isLoaded(sessionID) {
    if (this.profiles[sessionID]) {
      return true;
    }
    return false;
  }

  /**
   * Free the users profile from memory.
   * @param {*} sessionID 
   */
  freeFromMemory(sessionID) {
    // Free dialogue memory for specified session
    dialogue_f.handler.freeFromMemory(sessionID);

    // Free health memory for specified session
    health_f.handler.freeFromMemory(sessionID);

    // Free insurance memory for specified session
    insurance_f.handler.freeFromMemory(sessionID);

    // Free profile memory for specified session
    delete this.profiles[sessionID];
    delete this.skippedSaves[sessionID];

    logger.logInfo(`Profile for AID ${sessionID} was released from memory.`);
  }

  getOpenSessions() {
    return Object.keys(this.profiles);
  }

  saveToDisk(sessionID) {
    // Check if a PMC character exists in the server memory.
    if ("pmc" in this.profiles[sessionID]) {
      // Check if the profile path exists
      if (global.internal.fs.existsSync(getPmcPath(sessionID))) {

        // Compare the PMC character from server memory with the one saved on disk
        let currentProfile = this.profiles[sessionID]['pmc'];
        let savedProfile = fileIO.readParsed(getPmcPath(sessionID));
        if (JSON.stringify(currentProfile) !== JSON.stringify(savedProfile)) {
          // Save the PMC character from memory to disk.
          fileIO.write(getPmcPath(sessionID), this.profiles[sessionID]['pmc']);

          // Reset skipped saves.
          this.skippedSaves[sessionID] = 1;

          logger.logSuccess(`Profile for AID ${sessionID} was saved.`);
        } 
      } 
    }
  }

  /*
   * Get profile with sessionID of type (profile type in string, i.e. 'pmc').
   * If we don't have a profile for this sessionID yet, then load it and other related data
   * from disk.
   */
  getProfile(sessionID, type) {
    if (!(sessionID in this.profiles)) {
      this.initializeProfile(sessionID);
    } 
    // else {
    //   this.reloadProfileBySessionID(sessionID);
    // }

    return this.profiles[sessionID][type];
  }
  profileAlreadyCreated(ID) {
    return fileIO.exist(`user/profiles/${ID}/character.json`);
  }
  getProfileById(ID, type) {
    return fileIO.readParsed(`user/profiles/${ID}/character.json`);
  }
  getProfileExfilsById(ID) {
    return fileIO.readParsed(`user/profiles/${ID}/exfiltrations.json`);
  }
  setProfileExfilsById(ID, data) {
    return fileIO.write(`user/profiles/${ID}/exfiltrations.json`, data);
  }

  getPmcProfile(sessionID) {
    return this.getProfile(sessionID, "pmc");
  }

  getScavProfile(sessionID) {
    return this.getProfile(sessionID, "scav");
  }

  setScavProfile(sessionID, scavData) {
    this.profiles[sessionID]["scav"] = scavData;
  }

  getCompleteProfile(sessionID) {
    let output = [];

    if (!AccountServer.isWiped(sessionID)) {
      output.push(profile_f.handler.getScavProfile(sessionID));
      output.push(profile_f.handler.getPmcProfile(sessionID));
    }

    return output;
  }

  /** Create character profile
   * 
   * @param {*} info 
   * @param {*} sessionID 
   */
  createProfile(info, sessionID) {
    // Load account data //
    const account = AccountServer.find(sessionID);

    // Get profile location //
    const folder = account_f.getPath(account.id);

    // Get the faction the player has chosen //
    const ChosenSide = info.side.toLowerCase();

    // Get the faction the player has chosen as UpperCase String //
    const ChosenSideCapital = ChosenSide.charAt(0).toUpperCase() + ChosenSide.slice(1);

    // Get the profile template for the chosen faction //
    // let pmcData = fileIO.readParsed(db.profile[account.edition]["character_" + ChosenSide]);
    // let pmcData = JSON.parse(fs.readFileSync(process.cwd() + "/db/profile/Edge Of Darkness/character_usec.json"));
    let pmcData = JSON.parse(fs.readFileSync(process.cwd() + `/db/profile/Edge Of Darkness/character_${ChosenSide}.json`));

    // Initialize the clothing object //
    let storage = { _id: "", suites: [] };

    // delete existing profile
    // if (this.profiles[account.id]) {
    //   delete this.profiles[account.id];
    //   events.scheduledEventHandler.wipeScheduleForSession(sessionID);
    // }

    // Set defaults for new profile generation //
    pmcData._id = "pmc" + account.id;
    pmcData.aid = account.id;
    pmcData.savage = "scav" + account.id;
    pmcData.Info.Side = ChosenSideCapital;
    pmcData.Info.Nickname = info.nickname;
    pmcData.Info.LowerNickname = info.nickname.toLowerCase();
    pmcData.Info.Voice = customization_f.getCustomization()[info.voiceId]._name;
    pmcData.Customization = fileIO.readParsed(db.profile.defaultCustomization)[ChosenSideCapital]
    pmcData.Customization.Head = info.headId;
    pmcData.Info.RegistrationDate = ~~(new Date() / 1000);
    pmcData.Health.UpdateTime = ~~(Date.now() / 1000);

    // Load default clothing into the profile //
    let def = fileIO.readParsed(db.profile[account.edition].storage);
    storage = { err: 0, errmsg: null, data: { _id: pmcData._id, suites: def[ChosenSide] } };

    // Write the profile to disk //
    fileIO.write(`${folder}character.json`, pmcData);
    fileIO.write(`${folder}storage.json`, storage);
    fileIO.write(`${folder}userbuilds.json`, {});
    fileIO.write(`${folder}dialogue.json`, {});
    fileIO.write(`${folder}exfiltrations.json`, { bigmap: 0, develop: 0, factory4_day: 0, factory4_night: 0, interchange: 0, laboratory: 0, lighthouse: 0, rezervbase: 0, shoreline: 0, suburbs: 0, tarkovstreets: 0, terminal: 0, town: 0, woods: 0, privatearea: 0 });

    // don't wipe profile again //
    AccountServer.setWipe(account.id, false);
    this.initializeProfile(sessionID);
  }

  generateScav(sessionID) {
    let pmcData = this.getPmcProfile(sessionID);
    let scavData = bots_f.generatePlayerScav(sessionID);

    scavData._id = pmcData.savage;
    scavData.aid = sessionID;

    // Set cooldown time.
    // Make sure to apply ScavCooldownTimer bonus from Hideout if the player has it.
    let currDt = Date.now() / 1000;
    let scavLockDuration = global._database.globals.config.SavagePlayCooldown;
    let modifier = 1;
    for (let bonus of pmcData.Bonuses) {
      if (bonus.type === "ScavCooldownTimer") {
        // Value is negative, so add.
        // Also note that for scav cooldown, multiple bonuses stack additively.
        modifier += bonus.value / 100;
      }
    }
    scavLockDuration *= modifier;
    scavData.Info.SavageLockTime = currDt + scavLockDuration;

    return scavData;
  }

  validateNickname(info, sessionID) {
    if (info.nickname.length < 3) {
      return "tooshort";
    }

    if (AccountServer.nicknameTaken(info)) {
      return "taken";
    }

    return "OK";
  }

  changeNickname(info, sessionID) {
    let output = this.validateNickname(info, sessionID);

    if (output === "OK") {
      let pmcData = this.getPmcProfile(sessionID);

      pmcData.Info.Nickname = info.nickname;
      pmcData.Info.LowerNickname = info.nickname.toLowerCase();
    }

    return output;
  }

  changeVoice(info, sessionID) {
    let pmcData = this.getPmcProfile(sessionID);
    pmcData.Info.Voice = info.voice;
  }
}

function getPmcPath(sessionID) {
  let pmcPath = db.user.profiles.character;
  return pmcPath.replace("__REPLACEME__", sessionID);
}

function getStashType(sessionID) {
  let pmcData = profile_f.handler.getPmcProfile(sessionID);

  for (let item of pmcData.Inventory.items) {
    if (item._id === pmcData.Inventory.stash) {
      return item._tpl;
    }
  }

  logger.logError(`No stash found where stash ID is: ${pmcData.Inventory.stash}`);
  return "";
}

function calculateLevel(pmcData) {
  let exp = 0;

  for (let level in global._database.globals.config.exp.level.exp_table) {
    if (pmcData.Info.Experience < exp) {
      break;
    }

    pmcData.Info.Level = parseInt(level);
    exp += global._database.globals.config.exp.level.exp_table[level].exp;
  }

  return pmcData.Info.Level;
}

/**
 * Get player loyalty LEVEL for current trader...
 * when used to get the index of a trader loyaltyLevels, must use -1
 * @param {Object} pmcData -> player infos,
 * @param {string} traderID -> current trader ID,
 * @returns {number} calculatedLoyalty -> loyalty level
 */
function getLoyalty(pmcData, traderID) {
  let playerSaleSum;
  let playerStanding;
  let playerLevel;

  if (pmcData.TradersInfo[traderID]) {
    // we fetch player's trader related data
    playerSaleSum = pmcData.TradersInfo[traderID].salesSum;
    playerStanding = pmcData.TradersInfo[traderID].standing;
    playerLevel = pmcData.Info.Level;
  } else {
    // default traders value
    playerSaleSum = 0;
    playerStanding = 0;
    playerLevel = pmcData.Info.Level;
  }
  // we fetch the trader data
  const traderInfo = global._database.traders[traderID].base;

  let calculatedLoyalty = 0;
  if (traderID !== "ragfair") {
    // we check if player meet loyalty requirements
    for (let loyaltyLevel of traderInfo.loyaltyLevels) {
      if (playerSaleSum >= loyaltyLevel.minSalesSum &&
        playerStanding >= loyaltyLevel.minStanding &&
        playerLevel >= loyaltyLevel.minLevel) {
        calculatedLoyalty++;
      }
      else {
        if (calculatedLoyalty == 0) { calculatedLoyalty = 1; }
        break;
      }
    }
  } else { return "ragfair" }

  return calculatedLoyalty;
}

module.exports.handler = new ProfileServer();
module.exports.getStashType = getStashType;
module.exports.calculateLevel = calculateLevel;
module.exports.getLoyalty = getLoyalty;
