const EventEmitter = require('events');
const fs = require('fs');
const { logger } = require('../../core/util/logger');
const util = require('../../core/util/utility');
const { AccountController } = require('./AccountController');
const { ConfigController } = require('./ConfigController');
const { TradingController } = require('./TradingController');
class QuestEvent extends EventEmitter {}

class QuestController {

    static questConfig = ConfigController.Configs["quest"];

    static getQuestsFile() {
        var rawQuestFile = fs.readFileSync(process.cwd() + '/db/quests/quests.json');
        return rawQuestFile;
    }

    static cachedQuests = [];

    static getQuestsFileParsed() {
        if(QuestController.cachedQuests.length === 0)
            QuestController.cachedQuests = JSON.parse(rawQuestFile);

        return QuestController.cachedQuests;
    }

    static createQuest() {

    }

    static createQuestForKilling(trader, faction, map, numberOfKills) {
        var baseQuest = this.getQuestsFileParsed()[0];
        baseQuest._id = util.generateNewId();
    }

    /**
     * Credit: SPT-Aki team, with changes made by Paulov
     * @param {*} _info 
     * @param {*} sessionID 
     * @returns {Array} List of Repeatable Quests
     */
    static getRepeatableQuests = function (_info, sessionID) {
        var returnData = [];
        var pmcData = AccountController.getPmcProfile(sessionID);
        // var time = Date.now();
        // var _loop_1 = function (repeatableConfig) {
        //     var currentRepeatable = pmcData.RepeatableQuests.find(function (x) { return x.name === repeatableConfig.name; });
        //     if (!currentRepeatable) {
        //         currentRepeatable = {
        //             name: repeatableConfig.name,
        //             activeQuests: [],
        //             inactiveQuests: [],
        //             endTime: 0,
        //             changeRequirement: {}
        //         };
        //         pmcData.RepeatableQuests.push(currentRepeatable);
        //     }
        //     if (pmcData.Info.Level >= repeatableConfig.minPlayerLevel) {
        //         if (time > currentRepeatable.endTime - 1) {
        //             currentRepeatable.endTime = time + repeatableConfig.resetTime;
        //             currentRepeatable.inactiveQuests = [];
        //             logger.logInfo("Generating new ".concat(repeatableConfig.name));
        //             // put old quests to inactive (this is required since only then the client makes them fail due to non-completion)
        //             // we also need to push them to the "inactiveQuests" list since we need to remove them from offraidData.profile.Quests
        //             // after a raid (the client seems to keep quests internally and we want to get rid of old repeatable quests)
        //             // and remove them from the PMC's Quests and RepeatableQuests[i].activeQuests
        //             var questsToKeep = [];
        //             var _loop_2 = function (activeQuest) {
        //                 // check if the quest is ready to be completed, if so, don't remove it
        //                 var quest = pmcData.Quests.filter(function (q) { return q.qid === activeQuest._id; });
        //                 if (quest.length > 0) {
        //                     if (quest[0].status === "AvailableForFinish") {
        //                         questsToKeep.push(activeQuest);
        //                         logger.logInfo("Keeping repeatable quest ".concat(activeQuest._id, " in activeQuests since it is available to AvailableForFinish"));
        //                         return "continue";
        //                     }
        //                 }
        //                 this_1.gameHelper.removeDanglingConditionCounters(pmcData);
        //                 pmcData.Quests = pmcData.Quests.filter(function (q) { return q.qid !== activeQuest._id; });
        //                 currentRepeatable.inactiveQuests.push(activeQuest);
        //             };
        //             for (var _b = 0, _c = currentRepeatable.activeQuests; _b < _c.length; _b++) {
        //                 var activeQuest = _c[_b];
        //                 _loop_2(activeQuest);
        //             }
        //             currentRepeatable.activeQuests = questsToKeep;
        //             // introduce a dynamic quest pool to avoid duplicates
        //             var questTypePool = this_1.generateQuestPool(repeatableConfig);
        //             for (var i = 0; i < repeatableConfig.numQuests; i++) {
        //                 var quest = null;
        //                 var lifeline = 0;
        //                 while (!quest && questTypePool.types.length > 0) {
        //                     quest = this_1.generateRepeatableQuest(pmcData.Info.Level, pmcData.TradersInfo, questTypePool, repeatableConfig);
        //                     lifeline++;
        //                     if (lifeline > 10) {
        //                         logger.logInfo("We were stuck in repeatable quest generation. This should never happen. Please report.");
        //                         break;
        //                     }
        //                 }
        //                 // check if there are no more quest types available
        //                 if (questTypePool.types.length === 0) {
        //                     break;
        //                 }
        //                 currentRepeatable.activeQuests.push(quest);
        //             }
        //         }
        //         else {
        //             logger.logInfo("[Quest Check] ".concat(repeatableConfig.name, " quests are still valid."));
        //         }
        //     }
        //     // create stupid redundant change requirements from quest data
        //     for (var _d = 0, _e = currentRepeatable.activeQuests; _d < _e.length; _d++) {
        //         var quest = _e[_d];
        //         currentRepeatable.changeRequirement[quest._id] = {
        //             changeCost: quest.changeCost,
        //             changeStandingCost: quest.changeStandingCost
        //         };
        //     }
        //     returnData.push({
        //         // id: this_1.objectId.generate(),
        //         id: util.generateNewId(),
        //         name: currentRepeatable.name,
        //         endTime: currentRepeatable.endTime,
        //         activeQuests: currentRepeatable.activeQuests,
        //         inactiveQuests: currentRepeatable.inactiveQuests,
        //         changeRequirement: currentRepeatable.changeRequirement
        //     });
        // };
        // var this_1 = this;
        // for (var _i = 0, _a = this.questConfig.repeatableQuests; _i < _a.length; _i++) {
        //     var repeatableConfig = _a[_i];
        //     _loop_1(repeatableConfig);
        // }
        return returnData;
    };

    static generateQuestPool = function (repeatableConfig) {
        var questPool = {
            types: repeatableConfig.types.slice(),
            pool: {
                Exploration: {
                    locations: {}
                },
                Elimination: {
                    targets: {}
                }
            }
        };
        for (var location_1 in repeatableConfig.locations) {
            if (location_1 != 'any') {
                questPool.pool.Exploration.locations[location_1] = repeatableConfig.locations[location_1];
            }
        }
        // var targetsConfig = this.probabilityObjectArray(repeatableConfig.questConfig.Elimination.targets);
        var targetsConfig = repeatableConfig.questConfig.Elimination.targets;
        for (var _i = 0, targetsConfig_1 = targetsConfig; _i < targetsConfig_1.length; _i++) {
            var probabilityObject = targetsConfig_1[_i];
            if (!probabilityObject.data.isBoss) {
                questPool.pool.Elimination.targets[probabilityObject.key] = { "locations": Object.keys(repeatableConfig.locations) };
            }
            else {
                questPool.pool.Elimination.targets[probabilityObject.key] = { "locations": ["any"] };
            }
        }
        return questPool;
    }

    static probabilityObjectArray = function (configArrayInput) {
        var configArray = JSON.parse(JSON.stringify(configArrayInput));
        var probabilityArray = new RandomUtil_1.ProbabilityObjectArray(this.mathUtil);
        for (var _i = 0, configArray_1 = configArray; _i < configArray_1.length; _i++) {
            var configObject = configArray_1[_i];
            probabilityArray.push(new RandomUtil_1.ProbabilityObject(configObject.key, configObject.relativeProbability, configObject.data));
        }
        return probabilityArray;
    };

    static generateRepeatableQuest = function (pmcLevel, pmcTraderInfo, questTypePool, repeatableConfig) {
        var questType = "Elimination"; // this.randomUtil.drawRandomFromList(questTypePool.types)[0];
        // get traders from whitelist and filter by quest type availability
        var traders = repeatableConfig.traderWhitelist.filter(function (x) { return x.questTypes.includes(questType); }).map(function (x) { return x.traderId; });
        // filter out locked traders
        traders = traders.filter(function (x) { return pmcTraderInfo[x].unlocked; });
        const traderId = TradingController.TraderIdToNameMap["Prapor"]
        // var traderId = this.randomUtil.drawRandomFromList(traders)[0];
        // switch (questType) {
        //     case "Elimination":
                return this.generateEliminationQuest(pmcLevel, traderId, questTypePool, repeatableConfig);
        //     case "Completion":
        //         return this.generateCompletionQuest(pmcLevel, traderId, repeatableConfig);
        //     case "Exploration":
        //         return this.generateExplorationQuest(pmcLevel, traderId, questTypePool, repeatableConfig);
        //     default:
        //         throw new Error("Unknown mission type ".concat(questType, ". Should never be here!"));
        // }

    };

    static generateEliminationQuest = function (pmcLevel, traderId, questTypePool, repeatableConfig) {
        var eliminationConfig = repeatableConfig.questConfig.Elimination;
        var locationsConfig = repeatableConfig.locations;
        var targetsConfig = eliminationConfig.targets;
        var bodypartsConfig = eliminationConfig.bodyParts;
        // the difficulty of the quest varies in difficulty depending on the condition
        // possible conditions are
        // - amount of npcs to kill
        // - type of npc to kill (scav, boss, pmc)
        // - with hit to what body part they should be killed
        // - from what distance they should be killed
        // a random combination of listed conditions can be required
        // possible conditions elements and their relative probability can be defined in QuestConfig.js
        // We use ProbabilityObjectArray to draw by relative probability. e.g. for targets:
        // "targets": {
        //    "Savage": 7,
        //    "AnyPmc": 2,
        //    "bossBully": 0.5
        //}
        // higher is more likely. We define the difficulty to be the inverse of the relative probability.
        // We want to generate a reward which is scaled by the difficulty of this mission. To get a upper bound with which we scale
        // the actual difficulty we calculate the minimum and maximum difficulty (max being the sum of max of each condition type
        // times the number of kills we have to perform):
        // the minumum difficulty is the difficulty for the most probable (= easiest target) with no additional conditions
        var minDifficulty = 1 / 7;//targetsConfig.maxProbability(); // min difficulty is lowest amount of scavs without any constraints
        // Target on bodyPart max. difficulty is that of the least probable element
        var maxTargetDifficulty = 1 / 2;// targetsConfig.minProbability();
        var maxBodyPartsDifficulty = eliminationConfig.minKills / 2;// bodypartsConfig.minProbability();
        // maxDistDifficulty is defined by 2, this could be a tuning parameter if we don't like the reward generation
        var maxDistDifficulty = 2;
        var maxKillDifficulty = eliminationConfig.maxKills;
        function difficultyWeighing(target, bodyPart, dist, kill) {
            return Math.sqrt(Math.sqrt(target) + bodyPart + dist) * kill;
        }
        targetsConfig = targetsConfig.filter(function (x) { return Object.keys(questTypePool.pool.Elimination.targets).includes(x.key); });
        if (targetsConfig.length === 0 || targetsConfig.every(function (x) { return x.data.isBoss; })) {
            // there are no more targets left for elimination; delete it as a possible quest type
            // also if only bosses are left we need to leave otherwise it's a guaranteed boss elimination
            // -> then it would not be a quest with low probability anymore
            questTypePool.types = questTypePool.types.filter(function (t) { return t !== "Elimination"; });
            return null;
        }
        var targetKey = targetsConfig[0].key;
        var targetDifficulty = 1 / 7;//targetsConfig.probability(targetKey);
        var locations = questTypePool.pool.Elimination.targets[targetKey].locations;
        // we use any as location if "any" is in the pool and we do not hit the specific location random
        // we use any also if the random condition is not met in case only "any" was in the pool
        var locationKey = "any";
        if (locations.includes("any") && (repeatableConfig.questConfig.Elimination.specificLocationProb < Math.random() || locations.length <= 1)) {
            locationKey = "any";
            delete questTypePool.pool.Elimination.targets[targetKey];
        }
        else {
            locations = locations.filter(function (l) { return l !== "any"; });
            if (locations.length > 0) {
                locationKey = locations[0];//this.randomUtil.drawRandomFromList(locations)[0];
                questTypePool.pool.Elimination.targets[targetKey].locations = locations.filter(function (l) { return l !== locationKey; });
                if (questTypePool.pool.Elimination.targets[targetKey].locations.length === 0) {
                    delete questTypePool.pool.Elimination.targets[targetKey];
                }
            }
            else {
                // never should reach this if everything works out
                this.logger.debug("Ecountered issue when creating Elimination quest. Please report.");
            }
        }
        // draw the target body part and calculate the difficulty factor
        var bodyPartsToClient = null;
        var bodyPartDifficulty = 0;
        if (eliminationConfig.bodyPartProb > Math.random()) {
            // if we add a bodyPart condition, we draw randomly one or two parts
            // each bodyPart of the BODYPARTS ProbabilityObjectArray includes the string(s) which need to be presented to the client in ProbabilityObjectArray.data
            // e.g. we draw "Arms" from the probability array but must present ["LeftArm", "RightArm"] to the client
            bodyPartsToClient = [];
            var bodyParts = bodypartsConfig[0] ;// bodypartsConfig.draw(this.randomUtil.randInt(1, 3), false);
            var probability = 0;
            for (var _i = 0, bodyParts_1 = bodyParts; _i < bodyParts_1.length; _i++) {
                var bi = bodyParts_1[_i];
                // more than one part lead to an "OR" condition hence more parts reduce the difficulty
                probability += bodypartsConfig.probability(bi);
                for (var _a = 0, _b = bodypartsConfig.data(bi); _a < _b.length; _a++) {
                    var biClient = _b[_a];
                    bodyPartsToClient.push(biClient);
                }
            }
            bodyPartDifficulty = 1 / probability;
        }
        // draw a distance condition
        var distance = null;
        var distanceDifficulty = 0;
        var isDistanceRequirementAllowed = !repeatableConfig.questConfig.Elimination.distLocationBlacklist.includes(locationKey);
        // if (targetsConfig.data(targetKey).isBoss) {
        //     // get all boss spawn information
        //     var bossSpawns = Object.values(this.databaseServer.getTables().locations).filter(function (x) { return "base" in x && "Id" in x.base; }).map(function (x) { return ({ "Id": x.base.Id, "BossSpawn": x.base.BossLocationSpawn }); });
        //     // filter for the current boss to spawn on map
        //     var thisBossSpawns = bossSpawns.map(function (x) { return ({ "Id": x.Id, "BossSpawn": x.BossSpawn.filter(function (e) { return e.BossName === targetKey; }) }); }).filter(function (x) { return x.BossSpawn.length > 0; });
        //     // remove blacklisted locations
        //     var allowedSpawns = thisBossSpawns.filter(function (x) { return !repeatableConfig.questConfig.Elimination.distLocationBlacklist.includes(x.Id); });
        //     // if the boss spawns on nom-blacklisted locations and the current location is allowed we can generate a distance kill requirement
        //     isDistanceRequirementAllowed = isDistanceRequirementAllowed && (allowedSpawns.length > 0);
        // }
        if (eliminationConfig.distProb > Math.random() && isDistanceRequirementAllowed) {
            // random distance with lower values more likely; simple distribution for starters...
            distance = Math.floor(Math.abs(Math.random() - Math.random()) * (1 + eliminationConfig.maxDist - eliminationConfig.minDist) + eliminationConfig.minDist);
            distance = Math.ceil(distance / 5) * 5;
            distanceDifficulty = maxDistDifficulty * distance / eliminationConfig.maxDist;
        }
        // draw how many npcs are required to be killed
        var kills = util.getRandomInt(eliminationConfig.minKills, eliminationConfig.maxKills + 1);
        var killDifficulty = kills;
        // not perfectly happy here; we give difficulty = 1 to the quest reward generation when we have the most diffucult mission
        // e.g. killing reshala 5 times from a distance of 200m with a headshot.
        var maxDifficulty = difficultyWeighing(1, 1, 1, 1);
        var curDifficulty = difficultyWeighing(targetDifficulty / maxTargetDifficulty, bodyPartDifficulty / maxBodyPartsDifficulty, distanceDifficulty / maxDistDifficulty, killDifficulty / maxKillDifficulty);
        // aforementioned issue makes it a bit crazy since now all easier quests give significantly lower rewards than Completion / Exploration
        // I therefore moved the mapping a bit up (from 0.2...1 to 0.5...2) so that normal difficulty still gives good reward and having the
        // crazy maximum difficulty will lead to a higher difficulty reward gain factor than 1
        var difficulty = maxDifficulty;// this.mathUtil.mapToRange(curDifficulty, minDifficulty, maxDifficulty, 0.5, 2);
        var quest = this.generateRepeatableTemplate("Elimination", traderId);
        quest.conditions.AvailableForFinish[0]._props.counter.id = util.generateNewId();
        quest.conditions.AvailableForFinish[0]._props.counter.conditions = [];
        if (locationKey !== "any") {
            quest.conditions.AvailableForFinish[0]._props.counter.conditions.push(this.generateEliminationLocation(locationsConfig[locationKey]));
        }
        quest.conditions.AvailableForFinish[0]._props.counter.conditions.push(this.generateEliminationCondition(targetKey, bodyPartsToClient, distance));
        quest.conditions.AvailableForFinish[0]._props.value = kills;
        quest.conditions.AvailableForFinish[0]._props.id = util.generateNewId();
        quest.location = locationKey;
        quest.rewards = this.generateReward(pmcLevel, Math.min(difficulty, 1), traderId, repeatableConfig);
        return quest;
    };

    static generateReward = function (pmcLevel, difficulty, traderId, repeatableConfig) {
        var _this = this;
        // difficulty could go from 0.2 ... -> for lowest diffuculty receive 0.2*nominal reward
        var levelsConfig = repeatableConfig.rewardScaling.levels;
        var roublesConfig = repeatableConfig.rewardScaling.roubles;
        var xpConfig = repeatableConfig.rewardScaling.experience;
        var itemsConfig = repeatableConfig.rewardScaling.items;
        var rewardSpreadConfig = repeatableConfig.rewardScaling.rewardSpread;
        var reputationConfig = repeatableConfig.rewardScaling.reputation;
        if (isNaN(difficulty)) {
            difficulty = 1;
            this.logger.warning("Repeatable Reward Generation: Difficulty was NaN. Setting to 1.");
        }
        var rewardXP = 200 * pmcLevel; //Math.floor(difficulty * this.mathUtil.interp1(pmcLevel, levelsConfig, xpConfig) * this.randomUtil.getFloat(1 - rewardSpreadConfig, 1 + rewardSpreadConfig));
        var rewards = {
            Started: [],
            Success: [
                {
                    "value": rewardXP,
                    "type": "Experience",
                    "index": 0
                }
            ],
            Fail: []
        };
        return rewards;
    }

    static generateRepeatableTemplate = function (type, traderId) {
        var quest = util.DeepCopy(global._database.repeatableQuests.templates[type]);
        quest._id = util.generateNewId();
        quest.traderId = traderId;
        quest.name = quest.name.replace("{traderId}", traderId);
        quest.note = quest.note.replace("{traderId}", traderId);
        quest.description = quest.description.replace("{traderId}", traderId);
        quest.successMessageText = quest.successMessageText.replace("{traderId}", traderId);
        quest.failMessageText = quest.failMessageText.replace("{traderId}", traderId);
        quest.startedMessageText = quest.startedMessageText.replace("{traderId}", traderId);
        quest.changeQuestMessageText = "";// quest.changeQuestMessageText.replace("{traderId}", traderId);
        return quest;
    };

    static generateEliminationCondition = function (target, bodyPart, distance) {
        var killConditionProps = {
            target: target,
            value: 1,
            id: util.generateNewId(),
            dynamicLocale: true
        };
        if (target.startsWith("boss")) {
            killConditionProps.target = "Savage";
            killConditionProps.savageRole = [target];
        }
        if (bodyPart) {
            killConditionProps.bodyPart = bodyPart;
        }
        if (distance) {
            killConditionProps.distance = {
                compareMethod: ">=",
                value: distance
            };
        }
        return {
            _props: killConditionProps,
            _parent: "Kills"
        };
    };
}

module.exports.QuestEvent = new QuestEvent();
module.exports.QuestController = QuestController;

