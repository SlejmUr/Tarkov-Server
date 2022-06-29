const { ConfigController } = require('./ConfigController');
const { ItemController } = require('./ItemController');
const fs = require('fs');
const utility = require('./../../core/util/utility');
const e = require('express');
const mathjs = require('mathjs');

/**
 * 
 */
class LootController 
{
  /**
   * 
   */
    static LootRarities = {};
    /**
     * 
     */
    static LocationLootChanceModifierFromFile = 1.0;
    /**
     * 
     */
    static LootModifiers = {
        modifierSuperRare: 0,
        modifierRare: 0,
        modifierUnCommon: 0,
        modifierCommon: 0,
    };

    /**
     * 
     * @returns {object} Loot Modifiers
     */
    static GetLootModifiers() 
    {
        if(LootController.LootModifiers.modifierSuperRare !== 0) {
            return LootController.LootModifiers;
        }

        // let modifierSuperRare = global._database.gameplayConfig.locationloot.RarityMultipliers.Superrare;
        let modifierSuperRare = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Superrare;
        if(modifierSuperRare == undefined){
            modifierSuperRare = 0.5;
            logger.logWarning("Loot Modifier: Superrare: Couldn't find the config. Reset to 0.5.")
        }
        let modifierRare = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Rare;
        if(modifierRare == undefined){
            modifierRare = 0.6;
            logger.logWarning("Loot Modifier: Rare: Couldn't find the config. Reset to 0.9.")
        }
        let modifierUnCommon = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Uncommon;
        if(modifierUnCommon == undefined){
            modifierUnCommon = 0.85;
            logger.logWarning("Loot Modifier: Uncommon: Couldn't find the config. Reset to 0.95.")
        }
        let modifierCommon = ConfigController.Configs["gameplay"].locationloot.RarityMultipliers.Common;
        if(modifierCommon == undefined){
            modifierCommon = 0.95;
            logger.logWarning("Loot Modifier: Common: Couldn't find the config. Reset to 0.95.")
        }
        
        logger.logInfo("Loot Modifier: Location: " + LootController.LocationLootChanceModifierFromFile);
        logger.logInfo("Loot Modifier: Superrare: " + modifierSuperRare);
        logger.logInfo("Loot Modifier: Rare: " + modifierRare);
        logger.logInfo("Loot Modifier: UnCommon: " + modifierUnCommon);
        logger.logInfo("Loot Modifier: Common: " + modifierCommon);
        
        // ----------------------------------------------------------------------------------------
        // Paulo: Cough, Cough, modify these lower as people are too stupid to change it themselves
        modifierSuperRare *= (0.02 * LootController.LocationLootChanceModifierFromFile);
        modifierRare *= (0.05 * LootController.LocationLootChanceModifierFromFile);
        modifierUnCommon *= (0.14 * LootController.LocationLootChanceModifierFromFile);
        modifierCommon *= (0.4 * LootController.LocationLootChanceModifierFromFile);
        
        LootController.LootModifiers.modifierSuperRare = modifierSuperRare;
        LootController.LootModifiers.modifierRare = modifierRare;
        LootController.LootModifiers.modifierUnCommon = modifierUnCommon;
        LootController.LootModifiers.modifierCommon = modifierCommon;
        return LootController.LootModifiers;
    }

    /**
     * Calculates the Rarity of an item
     * @param {string} itemTemplate 
     * @returns {string} type of rarity this item falls into, i.e. Common -> Superrare
     */
    static GetItemRarityType(itemTemplate) {

        if(LootController.LootRarities[itemTemplate._props.Name] === undefined) {
      
          const backgroundColor = itemTemplate._props.BackgroundColor;
          const itemExperience = itemTemplate._props.LootExperience < 10 ? 10 : itemTemplate._props.LootExperience;
          const examineExperience = itemTemplate._props.ExamineExperience < 10 ? 10 : itemTemplate._props.ExamineExperience;
          const unlootable = itemTemplate._props.Unlootable;
      
          let itemRarityType = "COMMON";
          const itemName = itemTemplate._props !== undefined && typeof(itemTemplate._props.Name) === "string" ? itemTemplate._props.Name : "";
      
          let item_price = ItemController.getTemplatePrice(itemTemplate._id);
          if(itemTemplate._props.ammoType !== undefined) {
            item_price = item_price * 300 * itemTemplate._props.StackMaxSize;
          }
          // If Money
          if(ItemController.isMoney(itemTemplate._id)) {
            item_price = (item_price * 6000);
          }

          let itemCalculation = 
            ((itemExperience + examineExperience + (backgroundColor == "violet" ? 20 : 10)) * 1000)
              + (item_price * 0.01); 

          // if ammo_box
          if(itemTemplate._props.Name !== undefined && itemTemplate._props.Name.includes("ammo_box")) {
            itemCalculation *= 1.75;
          }
          // If weapon part / mod
          if(itemTemplate._props.ItemSound !== undefined && itemTemplate._props.ItemSound.includes("mod")) {
            itemCalculation *= 1.5;
          }
          
          itemCalculation = Math.round(itemCalculation / 10000);
          itemCalculation -= 2;

          itemCalculation = Math.min(10, itemCalculation);
          itemCalculation = Math.max(1, itemCalculation);
          // console.log(itemTemplate._props.Name);
          // console.log(itemCalculation);

          try {
            if(unlootable) {
              itemRarityType = "NOT_EXIST";
            }
            else {
              if ( itemCalculation >= 7
              //   itemExperience >= 45
              // // violet is good shit
              // || backgroundColor == "violet"
              // // the good keys and stuff are high examine
              // || examineExperience >= 17
              // || (itemName.includes("key") || itemName.includes("Key"))
              // || item_price > 29999
              ) {
                  itemRarityType = "SUPERRARE";
                  // console.log("SUPERRARE");
                  // console.log(itemTemplate);
              // } else if (itemExperience >= 16 || examineExperience >= 16) {
              } else if (itemCalculation >= 5) {
                  itemRarityType = "RARE";
                  // console.log("RARE");
                  // console.log(itemTemplate);
              // } else if (itemExperience >= 13 || examineExperience >= 13 || item_price > 9499) {
              } else if (itemCalculation >= 2) {
                  itemRarityType = "UNCOMMON";
                  // console.log(itemTemplate);
              }
            }
          } catch(err) {
            itemRarityType = "SUPERRARE";
          }
      
          LootController.LootRarities[itemTemplate._props.Name] = itemRarityType;
      
        }
      
      
        return LootController.LootRarities[itemTemplate._props.Name];
      }
      
      /**
       * Filters the Item Template by the Rarity system and returns whether to Accept or Decline
       * @param {*} itemTemplate 
       * @param {*} out_itemsRemoved 
       * @param {*} in_additionalLootModifier 
       * @returns {boolean} True = Include, False = Exclude
       */
      static FilterItemByRarity(
        itemTemplate, 
        out_itemsRemoved,
        in_additionalLootModifier
        ) {
          LootController.GetLootModifiers();

          const modifierSuperRare = LootController.LootModifiers.modifierSuperRare;
          const modifierRare = LootController.LootModifiers.modifierRare;
          const modifierUnCommon = LootController.LootModifiers.modifierUnCommon;
          const modifierCommon = LootController.LootModifiers.modifierCommon;
      
          if(in_additionalLootModifier === undefined)
            in_additionalLootModifier = 1.0 * LootController.LocationLootChanceModifierFromFile;
          
          if(out_itemsRemoved == undefined)
            out_itemsRemoved = {};
      
          if(out_itemsRemoved.numberOfSuperrareRemoved === undefined) {
            out_itemsRemoved.numberOfSuperrareRemoved = 0;
          }
          if(out_itemsRemoved.numberOfRareRemoved === undefined) {
            out_itemsRemoved.numberOfRareRemoved = 0;
          }
          if(out_itemsRemoved.numberOfUncommonRemoved === undefined) {
            out_itemsRemoved.numberOfUncommonRemoved = 0;
          }
          if(out_itemsRemoved.numberOfCommonRemoved === undefined) {
            out_itemsRemoved.numberOfCommonRemoved = 0;
          }
      
          if(itemTemplate._props.QuestItem == true)
            return true;
      
          // If roubles (cash registers), always return true
          if(itemTemplate._id === "5449016a4bdc2d6f028b456f") 
            return true;
      
          const itemRarityType = LootController.GetItemRarityType(itemTemplate);
      
      
          // logger.logInfo(itemRarityType + " - " + itemTemplate._props.Name);
      
            if (itemRarityType == "SUPERRARE") {
              if (Math.random() > (modifierSuperRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfSuperrareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "RARE") {
              if (Math.random() > (modifierRare * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfRareRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "UNCOMMON") {
              if (Math.random() > (modifierUnCommon * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfUncommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else if (itemRarityType == "COMMON")  {
              if (Math.random() > (modifierCommon * in_additionalLootModifier)) {
                out_itemsRemoved.numberOfCommonRemoved++;
                  return false;
              } else {
                  return true;
              }
            }
            else {
              return false;
            }
      }


      static GenerateContainerLoot(in_data, in_locationLootChanceModifier, in_mapName) {
        const containerData = in_data;
        const _items = in_data.Items;
        const newContainerId = utility.generateNewItemId();

        let isAirdrop = false;
        if(containerData.Id.includes("Scripts") || containerData.Id.includes("scripts")) {
          // console.log("container is Airdop!");
          // console.log(containerData);
          isAirdrop = true;
        }

        /** String Tpl Id
         * {string}
         */
        const ContainerId = _items[0]._tpl;


        const LootContainerIdTable = Object.keys(global._database.locationConfigs.StaticLootTable);
        if (!LootContainerIdTable.includes(ContainerId)) {
            LootController.GenerateWeaponLoot(ContainerId, _items);
            return true;
            //return false;
        }
        const containerTemplate = global._database.items[ContainerId];
        let container2D = Array(containerTemplate._props.Grids[0]._props.cellsV)
        .fill()
        .map(() => Array(containerTemplate._props.Grids[0]._props.cellsH).fill(0));
        
        let LootListItems = LootController.GenerateLootList(ContainerId, in_mapName);
        if(isAirdrop) {
          LootListItems = LootController.GenerateAirdropLootList(ContainerId, in_mapName, container2D);
          logger.logInfo(`Airdrop container contains ${LootListItems.length} items!`);
        }
       

        if(LootListItems.length == 0) {
            logger.logError(`EmptyContainer: ${ContainerId}`);
            return false;
        }

            let parentId = _items[0]._id;
            if(parentId == null) {
              parentId = utility.generateNewId(undefined, 3);
              _items[0]._id = parentId;
            }
            const idPrefix = parentId.substring(0, parentId.length - 4);
            let idSuffix = parseInt(parentId.substring(parentId.length - 4), 16) + 1;
          
            const addedPresets = [];
          
            // roll a maximum number of items  to spawn in the container between 0 and max slot count
            // const minCount = Math.max(1, _RollMaxItemsToSpawn(ContainerTemplate));
            const minCount = Math.max(1, Math.round(Math.random() * containerTemplate._props.Grids[0]._props.cellsV * containerTemplate._props.Grids[0]._props.cellsH));
  
            
          
              let usedLootItems = [];
          
              // we finished generating spawn for this container now its time to roll items to put in container
              let itemWidth = 0;
              let itemHeight = 0;
              for (let i = 0; i < minCount; i++) {
                //let item = {};
                let containerItem = {};
          
                let RollIndex = utility.getRandomInt(0, LootListItems.length - 1);
                let indexRolled = []; // if its here it will not check anything :) if its outside of for loop(above) it will nto roll the same item twice
                // make sure its not already rolled index
                while (indexRolled.includes(RollIndex)) {
                  RollIndex = utility.getRandomInt(0, LootListItems.length - 1);
                }
                // add current rolled index
                indexRolled.push(RollIndex);
                // getting rolled item
                const rolledRandomItemToPlace = global._database.items[LootListItems[RollIndex]];
                
                if (rolledRandomItemToPlace === undefined) {
                  logger.logWarning(`Undefined in container: ${ContainerId}  ${LootListItems.length} ${RollIndex}`);
                  continue;
                }
                let result = { success: false };
                let maxAttempts =
                  global._database.gameplayConfig.locationloot.containers.AttemptsToPlaceLoot > 10 ? 1 : global._database.gameplayConfig.locationloot.containers.AttemptsToPlaceLoot;
          
                // attempt to add item x times
                while (!result.success && maxAttempts) {
                  //let currentTotal = 0;
                  // get basic width and height of the item
                  itemWidth = rolledRandomItemToPlace._props.Width;
                  itemHeight = rolledRandomItemToPlace._props.Height;
                  // check if item is a preset
                  if (rolledRandomItemToPlace.preset != null) {
                    // Prevent the same preset from spawning twice (it makes the client mad)
                    if (addedPresets.includes(rolledRandomItemToPlace.preset._id)) {
                      maxAttempts--;
                      continue;
                    }
                    addedPresets.push(rolledRandomItemToPlace.preset._id);
                    const size = helper_f.getItemSize(rolledRandomItemToPlace._id, rolledRandomItemToPlace.preset._items[0]._id, rolledRandomItemToPlace.preset._items);
                    // Guns will need to load a preset of items
                    rolledRandomItemToPlace._props.presetId = rolledRandomItemToPlace.preset._id;
                    itemWidth = size[0];
                    itemHeight = size[1];
                  }
                  result = helper_f.findSlotForItem(container2D, itemWidth, itemHeight);
                  maxAttempts--;
                }
                // finished attempting to insert item into container
          
                // if we weren't able to find an item to fit after x tries then container is probably full
                if (!result.success) break;
          
                // ----------------------------------------------------------------------------------------------------
                // Paulo: Remove all duplicate items in same container. You never get dups on Live. So done it here too
                if(usedLootItems.find(item => item._props.Name == rolledRandomItemToPlace._props.Name) === undefined) {
                  usedLootItems.push(rolledRandomItemToPlace);
                }
                else {
                  continue;
                }
          
                container2D = helper_f.fillContainerMapWithItem(container2D, result.x, result.y, itemWidth, itemHeight, result.rotation);
                let rot = result.rotation ? 1 : 0;
          
                if (rolledRandomItemToPlace._props.presetId) {
                  // Process gun preset into container items
                  let preset = helper_f.getPreset(rolledRandomItemToPlace._props.presetId);
                  if (preset == null) continue;
                  preset._items[0].parentId = parentId;
                  preset._items[0].slotId = "main";
                  preset._items[0].location = { x: result.x, y: result.y, r: rot };
          
                  for (var p in preset._items) {
          
                    _items.push(DeepCopy(preset._items[p]));
          
                    if (preset._items[p].slotId === "mod_magazine") {
                      let mag = helper_f.getItem(preset._items[p]._tpl)[1];
                      let cartridges = {
                        _id: idPrefix + idSuffix.toString(16),
                        _tpl: rolledRandomItemToPlace._props.defAmmo,
                        parentId: preset._items[p]._id,
                        slotId: "cartridges",
                        upd: { StackObjectsCount: mag._props.Cartridges[0]._max_count },
                      };
          
                      _items.push(cartridges);
                      idSuffix++;
                    }
                  }
                  continue;
                }
          
          
          
                containerItem = {
                  _id: idPrefix + idSuffix.toString(16),
                  // _id: utility.generateNewId(undefined, 3),
                  _tpl: rolledRandomItemToPlace._id,
                  parentId: parentId,
                  slotId: "main",
                  location: { x: result.x, y: result.y, r: rot },
                };
          
                let cartridges;
                if (rolledRandomItemToPlace._parent === "543be5dd4bdc2deb348b4569" || rolledRandomItemToPlace._parent === "5485a8684bdc2da71d8b4567") {
                  // Money or Ammo stack
                  let stackCount = utility.getRandomInt(rolledRandomItemToPlace._props.StackMinRandom, rolledRandomItemToPlace._props.StackMaxRandom);
                  containerItem.upd = { StackObjectsCount: stackCount };
                } else if (rolledRandomItemToPlace._parent === "543be5cb4bdc2deb348b4568") {
                  // Ammo container
                  idSuffix++;
          
                  cartridges = {
                    // _id: idPrefix + idSuffix.toString(16),
                    _id: utility.generateNewId(undefined, 3),
                    _tpl: rolledRandomItemToPlace._props.StackSlots[0]._props.filters[0].Filter[0],
                    parentId: containerItem._id,
                    slotId: "cartridges",
                    upd: { StackObjectsCount: rolledRandomItemToPlace._props.StackMaxRandom },
                  };
                } else if (rolledRandomItemToPlace._parent === "5448bc234bdc2d3c308b4569") {
                  // Magazine
                  idSuffix++;
                  cartridges = {
                    _id: idPrefix + idSuffix.toString(16),
                    // _id: utility.generateNewId(undefined, 3),
                    _tpl: rolledRandomItemToPlace._props.Cartridges[0]._props.filters[0].Filter[0],
                    parentId: parentId,
                    slotId: "cartridges",
                    upd: { StackObjectsCount: rolledRandomItemToPlace._props.Cartridges[0]._max_count },
                  };
                }
          
                _items.push(containerItem);
          
                if (cartridges) _items.push(cartridges);
                idSuffix++;
              }
            
            let changedIds = {};
            for (const item of _items) {

              const itemTemplateForNaming = global._database.items[item._tpl];
              item.itemNameForDebug = itemTemplateForNaming._props.ShortName;
              const newId = utility.generateNewItemId();
              changedIds[item._id] = newId;
              item._id = newId;


          
              if (!item.parentId) continue;
              item.parentId = changedIds[item.parentId];
            }
            return true

      }

      /**
       * 
       * @param {String} containerId 
       * @returns {Array} an array of loot item ids
       */
      static GenerateLootList(containerId, in_location) {
        let LootList = [];
        let UniqueLootList = [];
        // get static container loot pools
        let ItemList = global._database.locationConfigs.StaticLootTable[containerId];
        // logger.logInfo(`Loot Item List Count :: ${ItemList.SpawnList.length}`);
      
          let itemsRemoved = {};
          let numberOfItemsRemoved = 0;
      
        for (const item of ItemList.SpawnList) {
        //   if (ItemParentsList.includes(item)) {
        //     logger.logWarning(`In Container ${containerId}: there is static loot ${item} as prohibited ParentId... skipping`);
        //     continue;
        //   }
          const itemTemplate = global._database.items[item];
          if (typeof itemTemplate._props.LootExperience == "undefined") {
            logger.logWarning(`itemTemplate._props.LootExperience == "undefined" for ${itemTemplate._id}`);
            continue;
          }
      
      
          // --------------------------------------------
          // Paulo: Filter out by Loot Rarity
          // TODO: Move this to an Array filter function
          if(
            ItemList.SpawnList.length > 1 // More than 2 items to spawn
            && !itemTemplate.QuestItem // Is not a quest item
            && (!LootController.FilterItemByRarity(itemTemplate, itemsRemoved)) // Filtered by "Rarity"
            ) 
            {
              numberOfItemsRemoved++;
              continue; // If returned False then ignore this item
            }
      
            LootList.push(item);
        }
        logger.logDebug(`Loot Multiplier :: Number of Items Removed :: Total:${numberOfItemsRemoved} Common:${itemsRemoved.numberOfCommonRemoved} Uncommon:${itemsRemoved.numberOfUncommonRemoved} Rare:${itemsRemoved.numberOfRareRemoved} Superrare:${itemsRemoved.numberOfSuperrareRemoved}`);
        
        if(LootList.length === 0)
        {
            // If we have nothing, put a random item in there
            LootList.push(ItemList.SpawnList[utility.getRandomInt(0, ItemList.SpawnList.length-1)]);
        }
        // Unique/Distinct the List
        UniqueLootList = [...new Set(LootList)];
        
        return UniqueLootList;
      }

      static GenerateAirdropLootList(containerId, in_location, container2D) {
        let itemsRemoved = {};
        const LootList = [];
        let UniqueLootList = [];
        // get static container loot pools
        const ItemList = global._database.locationConfigs.StaticLootTable[containerId];
        // get dynamic container loot pools for map
        const DynamicLootForMap = global._database.locationConfigs.DynamicLootTable[in_location];
        if(DynamicLootForMap !== undefined) {
          const DynamicLootForMapKeys = Object.keys(global._database.locationConfigs.DynamicLootTable[in_location]);
          if(DynamicLootForMapKeys !== undefined) {
            for(var i = 0; i < container2D.length-1 && LootList.length < container2D.length-1; i++) {
              const selectedLootIndex = utility.getRandomInt(0, DynamicLootForMapKeys.length);
              const selectedLootKey = DynamicLootForMapKeys[selectedLootIndex];
              if(selectedLootKey === undefined) 
                continue;

              const selectedLoot = DynamicLootForMap[selectedLootKey].SpawnList;
              if(selectedLoot === undefined) 
                continue;

              for (const item of selectedLoot) {
                const itemTemplate = global._database.items[item];
                if (itemTemplate._props.LootExperience === undefined) {
                  logger.logWarning(`itemTemplate._props.LootExperience == "undefined" for ${itemTemplate._id}`);
                  continue;
                }
                if(!LootController.FilterItemByRarity(itemTemplate, itemsRemoved, 5))
                  LootList.push(item);
              }
            }
          }
        }

        // Unique/Distinct the List
        UniqueLootList = [...new Set(LootList)];
        
        return UniqueLootList;
      }

      static GenerateWeaponLoot(ContainerId, _items) {
        // Check if static weapon.
        if (ContainerId != "5cdeb229d7f00c000e7ce174" && ContainerId != "5d52cc5ba4b9367408500062") {
          logger.logWarning("GetLootContainerData is null something goes wrong please check if container template: " + _items[0]._tpl + " exists");
          return;
        } else {
          _items[0].upd = { FireMode: { FireMode: "fullauto" } };
          // stationary gun is actually a container...
          const GunTempalte = global._database.items[_items[0]._tpl]; // template object
          const MagazineTemplate = global._database.items[GunTempalte._props.Slots[0]._props.filters[0].Filter[0]]; // template object
          const Magazine_Size = MagazineTemplate._props.Cartridges[0]._max_count; // number
          const AmmoTemplates = MagazineTemplate._props.Cartridges[0]._props.filters[0].Filter; // array
          const magazine = {
            _id: utility.generateNewId("M"),
            _tpl: MagazineTemplate._id,
            parentId: _items[0]._id,
            slotId: "mod_magazine",
          };
          _items.push(magazine);
          for (let i = 0; i < Magazine_Size / 4; i++) {
            if (_items[0]._tpl == "5d52cc5ba4b9367408500062") {
              // this is grenade launcher ammo preset creation
              if (i == 0) {
                const bullet = {
                  _id: utility.generateNewId("B"),
                  _tpl: AmmoTemplates[0],
                  parentId: magazine._id,
                  slotId: "cartridges",
                };
                _items.push(bullet);
                continue;
              }
              const bullet = {
                _id: utility.generateNewId("B"),
                _tpl: AmmoTemplates[0],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
              };
              _items.push(bullet);
            } else {
              // this is machine gun ammo preset creation
              const ammoCount = i % 2 == 0 ? 3 : 1;
              const bullet = {
                _id: utility.generateNewId("B"),
                _tpl: AmmoTemplates[i % 2],
                parentId: magazine._id,
                slotId: "cartridges",
                location: i,
                upd: {
                  StackObjectsCount: ammoCount,
                },
              };
              _items.push(bullet);
            }
          }
          return;
        }
      }

      /**
       * Generates all "forced" (usually quest) items into containers
       * @param {*} forced 
       * @param {*} outputLoot 
       */
      static GenerateForcedLootInContainers(forced, outputLoot) {
        let count = 0;
        // ------------------------------------------------------
        // Handle any Forced Static Loot - i.e. Unknown Key
        // 
        logger.logInfo(`Forced Loot Count: ${forced.length}`);
        let numberOfForcedStaticLootAdded = 0;
        for(let iForced in forced) {
          let thisForcedItem = utility.DeepCopy(forced[iForced]);
          let lootItem = forced[iForced];
          // console.log(lootItem);
          lootItem.IsForced = true;
          if(lootItem.IsStatic) {
            count++;
            const lootTableIndex = outputLoot.findIndex(x=>x.Id === thisForcedItem.Id);
            const lootTableAlreadyExists = lootTableIndex !== -1;
            let newParentId = "";
            if(!lootTableAlreadyExists) {
              newParentId = utility.generateNewItemId();
              lootItem.Root = newId;
            }
            else {
              lootItem = outputLoot[lootTableIndex];
              newParentId = lootItem.Root;
            }
            let newForcedItemsList = [];

            for(let iDataItem in thisForcedItem.Items) {
              let newForcedInnerItem = {};
              if(iDataItem == 0 && !lootTableAlreadyExists)
              {
                newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
                newForcedInnerItem._id = newId;
                lootItem.Items.push(newForcedInnerItem);
                continue;
              }
              let newInnerItemId = utility.generateNewItemId();
              newForcedInnerItem._id = newInnerItemId;
              newForcedInnerItem._tpl = thisForcedItem.Items[iDataItem];
              const itemTemplateForNaming = global._database.items[newForcedInnerItem._tpl];
              newForcedInnerItem.itemNameForDebug = itemTemplateForNaming._props.ShortName;
              newForcedInnerItem.parentId = newParentId;
              newForcedInnerItem.slotId = "main";
              newForcedInnerItem.location = {
                    x: lootTableAlreadyExists ? iDataItem : (iDataItem-1),
                    y: 0,
                    r: 0
                  }
              lootItem.Items[iDataItem > 0 ? iDataItem : (parseInt(iDataItem) + 1)] = newForcedInnerItem;
            }
            if(lootTableAlreadyExists)
              outputLoot[lootTableIndex] = lootItem;
            else
              outputLoot.push(lootItem);

            numberOfForcedStaticLootAdded++;
          }
        }
        if(numberOfForcedStaticLootAdded > 0) {
          logger.logSuccess(`Added ${numberOfForcedStaticLootAdded} Forced Static Loot`);
        }
        return count;
      }

      /**
       * Generates all "forced" (usually quest) items into the world
       * @param {*} forced 
       * @param {*} output 
       * @returns {number} count of items placed, excluding statics
       */
      static GenerateForcedLootLoose(forced, output) {
          let count = 0;
          for (const i in forced) {
            const data = utility.DeepCopy(forced[i]);
            if(data.IsStatic)
              continue;
              const newItemsData = [];
            // forced loot should be only contain 1 item... (there shouldnt be any weapon in there...)
            const newId = utility.generateNewId(undefined, 3);
      
            const createEndLootData = {
              Id: data.Id,
              IsStatic: data.IsStatic,
              useGravity: data.useGravity,
              randomRotation: data.randomRotation,
              Position: data.Position,
              Rotation: data.Rotation,
              IsGroupPosition: data.IsGroupPosition,
              GroupPositions: data.GroupPositions,
              Root: newId,
              Items: [
                {
                  _id: newId,
                  _tpl: data.Items[0],
                },
              ],
            };
      
            output.Loot.push(createEndLootData);
            count++;
          }
          return count;
      }


      /**
       * Generates the "Dynamic" loot found loose on the floor or shelves
       * @param {Array} typeArray 
       * @param {Array} output 
       * @param {number} locationLootChanceModifier 
       * @param {string} MapName 
       * @returns {number} count of generated items
       */
      static GenerateDynamicLootLoose(typeArray, output, locationLootChanceModifier, MapName)
      {
        let count = 0;
        const currentUsedPositions = [];
        const currentUsedItems = [];

        const dynamicLootTable = JSON.parse(fs.readFileSync(process.cwd() + `/db/locations/DynamicLootTable.json`));
        const mapDynamicLootTable = dynamicLootTable[MapName];
        // for (let itemLoot in typeArray) {
          // const lootData = typeArray[itemLoot];
        mapLoot: for(const lootData of typeArray) {

          const randomItems = [];
          for (const key of Object.keys(mapDynamicLootTable)) {
            const match = lootData.Id.toLowerCase();
            if (match.includes(key)) {
              const lootList = mapDynamicLootTable[key].SpawnList;
              if(lootList.length === 0)
                continue mapLoot;

              for (const loot in lootList) {
                let foundItem = global._database.items[lootList[loot]];
                randomItems.push(foundItem);
              }
            }
          }

          const mapDynamicLootGeneratorItem = mapDynamicLootTable[lootData.Id];
    
          const generatedItemId = utility.generateNewItemId();
          const randomItem = randomItems[utility.getRandomInt(0, randomItems.length - 1)];
          if(randomItem === undefined)
            continue;

          const createdItem = {
            _id: generatedItemId,
            _tpl: randomItem._id,
            DebugName: ItemController.tryGetItem(randomItem._id)["_props"].Name
          };
    
          // item creation
          let createEndLootData = {
            Id: lootData.Id,
            IsStatic: lootData.IsStatic,
            useGravity: lootData.useGravity,
            randomRotation: lootData.randomRotation,
            Position: lootData.Position,
            Rotation: lootData.Rotation,
            IsGroupPosition: lootData.IsGroupPosition,
            GroupPositions: lootData.GroupPositions,
            Root: generatedItemId,
            Items: [createdItem],
          };

          // console.log(createEndLootData);
          
          // createEndLootData.Items.push(createdItem);
          // // now add other things like cartriges etc.
          if(ItemController.isAmmoBox(randomItem._id))
          {
            // this is not working, ignoring for now
            continue;
            // createEndLootData.Items = [];
            // const ammoBoxItems = ItemController.createAmmoBox(randomItem._id);
            // for(const ammoBoxItem of ammoBoxItems)
            //   createEndLootData.Items.push(ammoBoxItem);
          }
    
          // // AMMO BOXES !!!
          // let isAmmoBox = global._database.items[createEndLootData.Items[0]._tpl]._parent == "543be5cb4bdc2deb348b4568";
          // if (isAmmoBox) {
          //   const ammoTemplate = global._database.items[createEndLootData.Items[0]._tpl]._props.StackSlots[0]._props.filters[0].Filter[0];
          //   const ammoMaxStack = global._database.items[ammoTemplate]._props.StackMaxSize;
          //   const randomizedBulletsCount = utility.getRandomInt(
          //     global._database.items[createEndLootData.Items[0]._tpl]._props.StackMinRandom,
          //     global._database.items[createEndLootData.Items[0]._tpl]._props.StackMaxRandom
          //   );
          //   let locationCount = 0;
          //   for (let i = 0; i < randomizedBulletsCount; i += ammoMaxStack) {
          //     const currentStack = i + ammoMaxStack > randomizedBulletsCount ? randomizedBulletsCount - i : ammoMaxStack;
          //     createEndLootData.Items.push({
          //       _id: utility.generateNewItemId(),
          //       _tpl: ammoTemplate,
          //       parentId: createEndLootData.Items[0]._id,
          //       slotId: "cartridges",
          //       location: locationCount,
          //       upd: {
          //         StackObjectsCount: currentStack,
          //       },
          //     });
          //     locationCount++;
          //   }
          // }
          // // Preset weapon
          // const PresetData = FindIfItemIsAPreset(createEndLootData.Items[0]._tpl);
          // if (PresetData != null) {
          //   let preset = PresetData[utility.getRandomInt(0, PresetData.length)];
          //   if (preset == null) continue;
    
          //   let oldBaseItem = preset._items[0];
          //   preset._items = preset._items.splice(0, 1);
          //   let idSuffix = 0;
          //   let OldIds = {};
          //   for (var p in preset._items) {
          //     let currentItem = DeepCopy(preset._items[p]);
          //     OldIds[currentItem.id] = utility.generateNewItemId();
          //     if (currentItem.parentId == oldBaseItem._id) currentItem.parentId = createEndLootData.Items[0]._id;
          //     if (typeof OldIds[currentItem.parentId] != "undefined") currentItem.parentId = OldIds[currentItem.parentId];
    
          //     currentItem.id = OldIds[currentItem.id];
          //     createEndLootData.Items.push(currentItem);
    
          //     if (preset._items[p].slotId === "mod_magazine") {
          //       let mag = helper_f.getItem(preset._items[p]._tpl)[1];
          //       let cartridges = {
          //         _id: currentItem.id + "_" + idSuffix,
          //         _tpl: item._props.defAmmo,
          //         parentId: preset._items[p]._id,
          //         slotId: "cartridges",
          //         upd: { StackObjectsCount: mag._props.Cartridges[0]._max_count },
          //       };
    
          //       createEndLootData.Items.push(cartridges);
          //       idSuffix++;
          //     }
          //   }
          // }
    
          // // Remove overlapping items by doing this simple check
          // // if(!isAmmoBox && PresetData == null 
    
          let similarUsedPosition = currentUsedPositions.find(p => 
            mathjs.round(p.x, 3) == mathjs.round(lootData.Position.x, 3)
            && mathjs.round(p.y, 3) == mathjs.round(lootData.Position.y, 3)
            && mathjs.round(p.z, 3) == mathjs.round(lootData.Position.z, 3)
          );
          if(similarUsedPosition !== undefined
            ) {
    
            // console.log("filtering dynamic item due to location");
            // console.log(lootData.Position);
            // console.log(similarUsedPosition);
            continue;
          }
    
          // let modifierDynamicChanceMin = 20;
          // let modifierDynamicChanceMax = 99;
          // if (global._database.gameplayConfig.locationloot.DynamicChance != undefined) {
          //     modifierDynamicChanceMin = global._database.gameplayConfig.locationloot.DynamicChance.Min;
          //     modifierDynamicChanceMax = global._database.gameplayConfig.locationloot.DynamicChance.Max;
    
          //     if (modifierDynamicChanceMin == undefined) {
          //         modifierDynamicChanceMin = 20;
          //     }
          //     if (modifierDynamicChanceMax == undefined) {
          //         modifierDynamicChanceMax = 99;
          //     }
          // }
    
          // // spawn chance calculation
          // let randomNumber = utility.getRandomInt(
          //     modifierDynamicChanceMin,
          //     modifierDynamicChanceMax
          // );
    
          // let actualItem = helper_f.getItem(createdItem._tpl)[1];
          // if(actualItem !== undefined) {
          //   const actualItemLootExperience 
          //   = actualItem["_props"]["LootExperience"] + actualItem["_props"]["ExamineExperience"];
          //   const isUnbuyable = actualItem["_props"]["Unbuyable"];
          //   const isQuestItem = actualItem["_props"]["QuestItem"];
          
            let filterByRarityOutput = {};
          //   if(!isQuestItem 
          //     && !isUnbuyable 
          //     && !FilterItemByRarity(actualItem, filterByRarityOutput, 1.2))
          //     continue;
          const looseLootMultiplier = ConfigController.Configs["gameplay"].locationloot.DynamicLooseLootMultiplier;
          if(!this.FilterItemByRarity(randomItem, filterByRarityOutput, looseLootMultiplier))
            continue;
    
              count++;
              output.Loot.push(createEndLootData);
              currentUsedPositions.push(createEndLootData.Position);
              currentUsedItems.push(createEndLootData);
          // }
       
        }
        
        return count;
      }
}

module.exports.LootController = LootController;
