"use strict";

const CUSTOM_BOOST_MULTIPLIERS = {
	Low: 5,	//for not so slow skills like search
	Medium: 10,	//for slow skills like vitality
	High: 20	//for very slow skills like mag drills/Immunity
};

//for reference
const SKILLS = {
	Physical: {
		Endurance: "Endurance",
		Health: "Health",
		Immunity: "Immunity",
		Metabolism: "Metabolism",
		Strength: "Strength",
		StressResistance: "StressResistance",
		Vitality: "Vitality"
	},
	Mental: {
		Attention: "Attention",
		Charisma: "Charisma",
		Intellect: "Intellect",
		Memory: "Memory",
		Perception: "Perception"
	},
	Combat: {
		Assault: "Assault",
		DMR: "DMR",
		HMG: "HMG",
		LMG: "LMG",
		Melee: "Melee",
		Pistol: "Pistol",
		RecoilControl: "RecoilControl",
		Revolver: "Revolver",
		Launcher: "Launcher",
		AttachedLauncher: "AttachedLauncher",
		Shotgun: "Shotgun",
		Sniper: "Sniper",
		SMG: "SMG",
		Throwing: "Throwing",
		TroubleShooting: "TroubleShooting"
	},
	Practical: {
		AdvancedModding: "AdvancedModding",
		AimDrills: "AimDrills",
		Auctions: "Auctions",
		Barter: "Barter",
		Cleanoperations: "Cleanoperations",
		CovertMovement: "CovertMovement",
		Crafting: "Crafting",
		FieldMedicine: "FieldMedicine",
		FirstAid: "FirstAid",
		Freetrading: "Freetrading",
		HeavyVests: "HeavyVests",
		HideoutManagement: "HideoutManagement",
		LightVests: "LightVests",
		Lockpicking: "Lockpicking",
		MagDrills: "MagDrills",
		NightOps: "NightOps",
		ProneMovement: "ProneMovement",
		Search: "Search",
		Shadowconnections: "Shadowconnections",
		SilentOps: "SilentOps",
		Sniping: "Sniping", //yes this is different from Sniper ¯\_(ツ)_/¯
		Surgery: "Surgery",
		Taskperformance: "Taskperformance",
		WeaponModding: "WeaponModding",
		WeaponTreatment: "WeaponTreatment"
	}
};


function getGlobals(url, info, sessionID) {
	let playerGlobals = utility.DeepCopy(global._database.globals);
	//logger.logError(`url: \n${JSON.stringify(url, null, 2)} \ninfo: \n\n${JSON.stringify(info, null, 2)} \nsessionID: \n${JSON.stringify(sessionID, null, 2)}`);
	/*
	let profile = utility.DeepCopy(profile_f.handler.getPmcProfile(sessionID));
	
	//testing example code for future use:
	let physBonus = profile.Bonuses.find(bonus => bonus.skillType === "Physical");
	if(physBonus){
		logger.logSuccess("MOFO's got physical boost");
	}
	
	//other testing example code, this increases how much skill xp the action gives
	//playerGlobals.config.SkillsSettings.Vitality.DamageTakenAction = 0.5;

	boostSkillProgressionRate(playerGlobals);

	//old code from response.js:
	//global._database.globals.time = Date.now() / 1000;
	//return global._database.globals;

	//same old code but without modifying base globals and instead sending it for the player who requested it
	*/
	playerGlobals.time = utility.getTimestamp();
	return playerGlobals;
}

function boostSkillProgressionRate(playerGlobals) {
	/*
	 * slow leveling skills, for experience improving purposes:
	 * MagDrills (very slow)
	 * Surgery (very slow)
	 * Vitality (slow)
	 * AimDrills (slow)
	 * Troubleshooting (very slow)
	 * Throwables (slow)
	 * Immunity (this is slow as fucking fuck and can't be modded ;< )
	 * Search (not so slow)
	 *
	*/

	//general boost to how many points can be obtained before fatigue
	//playerGlobals.config.SkillFatiguePerPoint = 0.1;


	//Vitality
	playerGlobals.config.SkillsSettings.Vitality.DamageTakenAction *= CUSTOM_BOOST_MULTIPLIERS.Medium;

	//MagDrills
	playerGlobals.config.SkillsSettings.MagDrills.RaidLoadedAmmoAction *= CUSTOM_BOOST_MULTIPLIERS.High;
	playerGlobals.config.SkillsSettings.MagDrills.RaidUnloadedAmmoAction *= CUSTOM_BOOST_MULTIPLIERS.High;
	playerGlobals.config.SkillsSettings.MagDrills.MagazineCheckAction *= CUSTOM_BOOST_MULTIPLIERS.High;

	//Surgery
	playerGlobals.config.SkillsSettings.Surgery.SurgeryAction *= CUSTOM_BOOST_MULTIPLIERS.High;

	//Search
	playerGlobals.config.SkillsSettings.Search.SearchAction *= CUSTOM_BOOST_MULTIPLIERS.Low;
	playerGlobals.config.SkillsSettings.Search.FindAction *= CUSTOM_BOOST_MULTIPLIERS.Low;

	//TroubleShooting
	playerGlobals.config.SkillsSettings.TroubleShooting.SkillPointsPerMalfFix *= CUSTOM_BOOST_MULTIPLIERS.High;

	//...

}

module.exports.getGlobals = getGlobals;
