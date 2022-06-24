"use strict";

const { InsuranceController } = require("../Controllers/InsuranceController");
const { tradeHandler } = require("./trade");

class ItemServer {
  constructor() {
    this.output = "";
    this.routes = {};
    this.routeStructure = {};
    this.resetOutput();
  }

  /* adds route to check for */
  addRoute(route, callback) {
    this.routes[route] = callback;
  }

  updateRouteStruct() {
    this.routeStructure = {
      AddNote: note_f.addNote,
      AddToWishList: wishlist_f.addToWishList,
      ApplyInventoryChanges: move_f.applyInventoryChanges,
      Bind: status_f.bindItem,
      CreateMapMarker: status_f.handleMapMarker,
      CustomizationBuy: customization_f.buyClothing,
      CustomizationWear: customization_f.wearClothing,
      DeleteNote: note_f.deleteNote,
      Eat: health_f.handler.offraidEat,
      EditNote: note_f.editNode,
      Examine: status_f.examineItem,
      Fold: status_f.foldItem,
      Heal: health_f.handler.offraidHeal,
      RestoreHealth: health_f.handler.healthTreatment,
      HideoutContinuousProductionStart: hideout_f.continuousProductionStart,
      HideoutPutItemsInAreaSlots: hideout_f.putItemsInAreaSlots,
      HideoutScavCaseProductionStart: hideout_f.scavCaseProductionStart,
      HideoutSingleProductionStart: hideout_f.singleProductionStart,
      HideoutTakeItemsFromAreaSlots: hideout_f.takeItemsFromAreaSlots,
      HideoutTakeProduction: hideout_f.takeProduction,
      HideoutToggleArea: hideout_f.toggleArea,
      HideoutUpgrade: hideout_f.upgrade,
      HideoutUpgradeComplete: hideout_f.upgradeComplete,
      // Insure: insurance_f.insure,
      Insure: InsuranceController.insure,
      Merge: move_f.mergeItem,
      Move: move_f.moveItem,
      QuestAccept: quest_f.acceptQuest,
      QuestComplete: quest_f.completeQuest,
      QuestHandover: quest_f.handoverQuest,
      RagFairAddOffer: ragfair_f.ragFairAddOffer,
      RagFairBuyOffer: trade_f.TradeHandler.confirmRagfairTrading,
      ReadEncyclopedia: status_f.readEncyclopedia,
      Remove: move_f.discardItem,
      RemoveBuild: weaponbuilds_f.removeBuild,
      RemoveFromWishList: wishlist_f.removeFromWishList,
      Repair: repair_f.main,
      SaveBuild: weaponbuilds_f.saveBuild,
      Split: move_f.splitItem,
      Swap: move_f.swapItem,
      Tag: status_f.tagItem,
      Toggle: status_f.toggleItem,
      TraderRepair: repair_f.main,
      TradingConfirm: trade_f.TradeHandler.confirmTrading,
      Transfer: move_f.transferItem,
    };
  }

  handleRoutes(info, sessionID) {
    this.resetOutput(sessionID);
    for (let body of info.data) {
      let pmcData = profile_f.handler.getPmcProfile(sessionID);
      if (body.Action in this.routes) {
        this.routes[body.Action](pmcData, body, sessionID);
      } else {
        logger.logError(`[UNHANDLED ACTION] ${body.Action} with body ${body}`);
      }
    }

    return this.output;
  }

  getOutput(sessionID) {
    if (this.output === "") {
      this.resetOutput(sessionID);
    }

    return this.output;
  }

  setOutput(data) {
    this.output = data;
  }

  resetOutput(sessionID) {
    if (sessionID == "" || typeof sessionID == "undefined") {
      // logger.logError(`[MISSING SESSION ID] resetOutput(sessionID) is blank or undefined; returning.`);
      return;
    }
    let _profile = profile_f.handler.getPmcProfile(sessionID);
    if (utility.isUndefined(_profile)) {
      logger.logError(`[MISSING PROFILE] Profile with sessionID: ${sessionID} is missing?`);
      return;
    }
    
    this.output = {
      warnings: [],
      profileChanges: {},
    };
    this.output.profileChanges[_profile._id] = {
      _id: _profile._id,
      experience: 0,
      quests: [], // are those current accepted quests ??
      ragFairOffers: [], // are those current ragfair requests ?
      builds: [], // are those current weapon builds ??
      items: { change: [], new: [], del: [] },
      production: null,
      skills: _profile.Skills,
      traderRelations: [], //_profile.TradersInfo
    };
  }
}

module.exports.handler = new ItemServer();
