const { DatabaseController } = require('./DatabaseController');
const utility = require('../../core/util/utility');

/**
 * 
 */
class ItemController
{
    static tplLookup = {};

    static getDatabaseItems() {
        const dbItems = DatabaseController.getDatabase().items;
        
        return dbItems;
    }
   
    /**
    * Finds an item given its id using linear search
    * @param {*} items 
    * @param {*} id 
    * @returns {object} item
    */
    static findItemById(items, id) {
        for (const item of items) {
            if (item._id === id) {
                return item;
            }
        }

        return undefined;
    }
  
    /* Get item data from items.json
    * input: Item Template ID
    * output: item | { error: true, errorMessage: string }
    */
    static tryGetItem(template) {
        const item = global._database.items[template];
    
        if (item === undefined) return { error: true, errorMessage: `Unable to find item '${template}' in database` }
    
        return item;
    }

    /**
     * Determines whether the item is an Ammo Box by TemplateId
     * @param {*} tpl 
     * @returns {boolean} true/false
     */
    static isAmmoBox(tpl) {
         return ItemController.getDatabaseItems()[tpl]._parent === "543be5cb4bdc2deb348b4568"
    }

    /**
     * Create an Ammo Box via a TemplateId
     * @param {*} tpl 
     * @returns {Array} new attached to the box items
     */
    static createAmmoBox(tpl) {
        if(!ItemController.isAmmoBox(tpl))
            throw "This isn't an Ammo Box, dumbass!";

        const items = [];
        var box = ItemController.tryGetItem(tpl);
        // const ammoTemplate = global._database.items[createEndLootData.Items[0]._tpl]._props.StackSlots[0]._props.filters[0].Filter[0];
        const ammoTemplate = box._props.StackSlots[0]._props.filters[0].Filter[0];
        const ammoMaxStack = global._database.items[ammoTemplate]._props.StackMaxSize;
        const randomizedBulletsCount = utility.getRandomInt(
            box._props.StackMinRandom,
            box._props.StackMaxRandom
        );
        const generatedItemId = utility.generateNewItemId();
        items.push({
            _id: generatedItemId,
            _tpl: box._tpl,
            slotId: "hideout",
            upd: {
                StackObjectsCount: 1,
            },
            debugName: box._props.Name
        });
        let locationCount = 0;
        for (let i = 0; i < randomizedBulletsCount; i += ammoMaxStack) {
            const currentStack = i + ammoMaxStack > randomizedBulletsCount ? randomizedBulletsCount - i : ammoMaxStack;
            items.push({
                _id: utility.generateNewItemId(),
                _tpl: ammoTemplate,
                parentId: generatedItemId,
                slotId: "cartridges",
                location: locationCount,
                upd: {
                    StackObjectsCount: currentStack,
                },
            });
            locationCount++;
        }
        return items;
    }

    /**
     * Determines whether the item is an Ammo Box by TemplateId
     * @param {*} tpl 
     * @returns {boolean} true/false
     */
     static isItemPreset(tpl) {
        return DatabaseController.getDatabase().globals.ItemPresets[tpl] !== undefined;
     }


    /* A reverse lookup for templates */
    static getTemplateLookup() {

        if (ItemController.tplLookup.lookup === undefined) {
            const lookup = {
                items: {
                byId: {},
                byParent: {},
                },
                categories: {
                byId: {},
                byParent: {},
                },
            };
        
            for (let x of global._database.templates.Items) {
                lookup.items.byId[x.Id] = x.Price;
                lookup.items.byParent[x.ParentId] || (lookup.items.byParent[x.ParentId] = []);
                lookup.items.byParent[x.ParentId].push(x.Id);
            }
        
            for (let x of global._database.templates.Categories) {
                lookup.categories.byId[x.Id] = x.ParentId ? x.ParentId : null;
                if (x.ParentId) {
                // root as no parent
                lookup.categories.byParent[x.ParentId] || (lookup.categories.byParent[x.ParentId] = []);
                lookup.categories.byParent[x.ParentId].push(x.Id);
                }
            }
        
            ItemController.tplLookup.lookup = lookup;
        }
    
        return ItemController.tplLookup.lookup;
    }
  
  /** Get template price
   * Explore using itemPriceTable to get price instead of using tplLookup()
   * 
   * @param {string} x  Item ID to get price for
   * @returns  Price of the item
   */
  static getTemplatePrice(x) {
    return x in ItemController.getTemplateLookup().items.byId ? ItemController.getTemplateLookup().items.byId[x] : 1;
  }

  static isMoney(tpl) {
    const moneyTplArray = ["569668774bdc2da2298b4568", "5696686a4bdc2da3298b456a", "5449016a4bdc2d6f028b456f"];
    return moneyTplArray.findIndex((moneyTlp) => moneyTlp === tpl) !== -1;
  }
}

module.exports.ItemController = ItemController;