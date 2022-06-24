"use strict";

class DialogueServer {
  constructor() {
    this.dialogues = {};
    this.dialogueFileAge = {};
  }

  /**
   * Initial load of dialogue file content to memory.
   * @param {*} sessionID 
   */
  initializeDialogue(sessionID) {
    // Check if the profile file exists
    if (!global.internal.fs.existsSync(getPath(sessionID))) {
      logger.logError(`Dialogue file for session ID ${sessionID} not found.`);
      return false;
    }

    // Load saved dialogues from disk
    this.dialogues[sessionID] = fileIO.readParsed(getPath(sessionID));

    // Set the file age for the dialogues save file.
    let stats = global.internal.fs.statSync(getPath(sessionID));
    this.dialogueFileAge[sessionID] = stats.mtimeMs;

    logger.logSuccess(`Loaded dialogues for AID ${sessionID} successfully.`);
  }

  freeFromMemory(sessionID) {
    delete this.dialogues[sessionID];
  }

  /**
   * Reload the dialoge for a specified session from disk, if the file was changed by another server / source.
   * @param {*} sessionID 
   */
  reloadDialogue(sessionID) {
    // Check if the dialogue save file exists
    if (global.internal.fs.existsSync(getPath(sessionID))) {

      // Compare the file age saved in memory with the file age on disk.
      let stats = global.internal.fs.statSync(getPath(sessionID));
      if (stats.mtimeMs != this.dialogueFileAge[sessionID]) {

        //Load saved dialogues from disk.
        this.dialogues[sessionID] = fileIO.readParsed(getPath(sessionID));

        // Reset the file age for the sessions dialogues.
        let stats = global.internal.fs.statSync(getPath(sessionID));
        this.dialogueFileAge[sessionID] = stats.mtimeMs;
        logger.logWarning(`Dialogues for AID ${sessionID} were modified elsewhere. Dialogue was reloaded successfully.`)
      }
    }
  }

  saveToDisk(sessionID) {
    // Check if dialogues exist in the server memory.
    if (sessionID in this.dialogues) {
      // Check if the dialogue file exists.
      if (global.internal.fs.existsSync(getPath(sessionID))) {
        // Check if the file was modified elsewhere.
        let statsPreSave = global.internal.fs.statSync(getPath(sessionID));
        if (statsPreSave.mtimeMs == this.dialogueFileAge[sessionID]) {

          // Compare the dialogues from server memory with the ones saved on disk.
          let currentDialogues = this.dialogues[sessionID];
          let savedDialogues = fileIO.readParsed(getPath(sessionID));
          if (JSON.stringify(currentDialogues) !== JSON.stringify(savedDialogues)) {
            // Save the dialogues stored in memory to disk.
            fileIO.write(getPath(sessionID), this.dialogues[sessionID]);

            // Reset the file age for the sessions dialogues.
            let stats = global.internal.fs.statSync(getPath(sessionID));
            this.dialogueFileAge[sessionID] = stats.mtimeMs;
            logger.logSuccess(`Dialogues for AID ${sessionID} was saved.`);
          }
        } else {
          //Load saved dialogues from disk.
          this.dialogues[sessionID] = fileIO.readParsed(getPath(sessionID));

          // Reset the file age for the sessions dialogues.
          let stats = global.internal.fs.statSync(getPath(sessionID));
          this.dialogueFileAge[sessionID] = stats.mtimeMs;
          logger.logWarning(`Dialogues for AID ${sessionID} were modified elsewhere. Dialogue was reloaded successfully.`)
        }
      } else {
        // Save the dialogues stored in memory to disk.
        fileIO.write(getPath(sessionID), this.dialogues[sessionID]);

        // Reset the file age for the sessions dialogues.
        let stats = global.internal.fs.statSync(getPath(sessionID));
        this.dialogueFileAge[sessionID] = stats.mtimeMs;
        logger.logSuccess(`Dialogues for AID ${sessionID} was created and saved.`);
      }
    }
  }

  /* Set the content of the dialogue on the list tab. */
  generateDialogueList(sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    let data = [];
    for (let dialogueId in this.dialogues[sessionID]) {
      data.push(this.getDialogueInfo(dialogueId, sessionID));
    }

    return `{"err":0,"errmsg":null,"data": ${fileIO.stringify(data)}}`;
  }

  /* Get the content of a dialogue. */
  getDialogueInfo(dialogueId, sessionID) {
    let dialogue = this.dialogues[sessionID][dialogueId];
    return {
      _id: dialogueId,
      type: 2, // Type npcTrader.
      message: this.getMessagePreview(dialogue),
      new: dialogue.new,
      attachmentsNew: dialogue.attachmentsNew,
      pinned: dialogue.pinned,
    };
  }

  /*
   * Set the content of the dialogue on the details panel, showing all the messages
   * for the specified dialogue.
   */
  generateDialogueView(dialogueId, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    let dialogue = this.dialogues[sessionID][dialogueId];
    dialogue.new = 0;

    // Set number of new attachments, but ignore those that have expired.
    let attachmentsNew = 0;
    let currDt = Date.now() / 1000;
    for (let message of dialogue.messages) {
      if (message.hasRewards && !message.rewardCollected && currDt < message.dt + message.maxStorageTime) {
        attachmentsNew++;
      }
    }
    dialogue.attachmentsNew = attachmentsNew;

    return fileIO.stringify({ err: 0, errmsg: null, data: { messages: this.dialogues[sessionID][dialogueId].messages } });
  }

  /**
   * Add a templated message to the dialogue.
   */
  addDialogueMessage(dialogueID, messageContent, sessionID, rewards = []) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    if (this.dialogues[sessionID] === undefined) {
      this.initializeDialogue(sessionID);
    }
    let dialogueData = this.dialogues[sessionID];
    let isNewDialogue = !(dialogueID in dialogueData);
    let dialogue = dialogueData[dialogueID];

    if (isNewDialogue) {
      dialogue = {
        _id: dialogueID,
        messages: [],
        pinned: false,
        new: 0,
        attachmentsNew: 0,
      };
      dialogueData[dialogueID] = dialogue;
    }

    dialogue.new += 1;

    // Generate item stash if we have rewards.
    let stashItems = {};

    if (rewards.length > 0) {
      const stashId = utility.generateNewItemId();

      stashItems.stash = stashId;
      stashItems.data = [];

      rewards = helper_f.replaceIDs(null, rewards);

      for (let reward of rewards) {
        if (!reward.hasOwnProperty("slotId") || reward.slotId === "hideout") {
          reward.parentId = stashId;
          reward.slotId = "main";
        }
        stashItems.data.push(reward);
      }

      dialogue.attachmentsNew += 1;
    }

    let message = {
      _id: utility.generateNewDialogueId(),
      uid: dialogueID,
      type: messageContent.type,
      dt: Date.now() / 1000,
      templateId: messageContent.templateId,
      text: messageContent.text,
      hasRewards: rewards.length > 0,
      rewardCollected: false,
      items: stashItems,
      maxStorageTime: messageContent.maxStorageTime,
      systemData: messageContent.systemData,
    };

    dialogue.messages.push(message);

    let notificationMessage = notifier_f.createNewMessageNotification(message);
    notifier_f.handler.addToMessageQueue(notificationMessage, sessionID);
  }

  /*
   * Get the preview contents of the last message in a dialogue.
   */
  getMessagePreview(dialogue) {
    // The last message of the dialogue should be shown on the preview.
    let message = dialogue.messages[dialogue.messages.length - 1];

    return {
      dt: message.dt,
      type: message.type,
      templateId: message.templateId,
      uid: dialogue._id,
    };
  }

  /*
   * Get the item contents for a particular message.
   */
  getMessageItemContents(messageId, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    let dialogueData = this.dialogues[sessionID];

    for (let dialogueId in dialogueData) {
      let messages = dialogueData[dialogueId].messages;

      for (let message of messages) {
        if (message._id === messageId) {
          let attachmentsNew = this.dialogues[sessionID][dialogueId].attachmentsNew;
          if (attachmentsNew > 0) {
            this.dialogues[sessionID][dialogueId].attachmentsNew = attachmentsNew - 1;
          }
          message.rewardCollected = true;
          return message.items.data;
        }
      }
    }

    return [];
  }

  removeDialogue(dialogueId, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    delete this.dialogues[sessionID][dialogueId];
  }

  setDialoguePin(dialogueId, shouldPin, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    this.dialogues[sessionID][dialogueId].pinned = shouldPin;
  }

  setRead(dialogueIds, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    let dialogueData = this.dialogues[sessionID];

    for (let dialogId of dialogueIds) {
      dialogueData[dialogId].new = 0;
      dialogueData[dialogId].attachmentsNew = 0;
    }
  }

  getAllAttachments(dialogueId, sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    let output = [];
    let timeNow = Date.now() / 1000;

    for (let message of this.dialogues[sessionID][dialogueId].messages) {
      if (timeNow < message.dt + message.maxStorageTime) {
        output.push(message);
      }
    }

    this.dialogues[sessionID][dialogueId].attachmentsNew = 0;
    return { messages: output };
  }

  // deletion of items that has been expired. triggers when updating traders.

  removeExpiredItems(sessionID) {
    // Reload dialogues before continuing.
    this.reloadDialogue(sessionID);

    for (let dialogueId in this.dialogues[sessionID]) {
      for (let message of this.dialogues[sessionID][dialogueId].messages) {
        if (Date.now() / 1000 > message.dt + message.maxStorageTime) {
          message.items = {};
        }
      }
    }
  }
}

const getPath = (sessionID) => `user/profiles/${sessionID}/dialogue.json`;

const messageTypes = {
  npcTrader: 2,
  insuranceReturn: 8,
  questStart: 10,
  questFail: 11,
  questSuccess: 12,
};

/*
 * Return the int value associated with the messageType, for readability.
 */
function getMessageTypeValue(messageType) {
  return messageTypes[messageType];
}

// TODO(camo1018): Coalesce all findAndReturnChildren functions.
/* Find And Return Children (TRegular)
 * input: MessageItems, InitialItem._id
 * output: list of item._id
 * List is backward first item is the furthest child and last item is main item
 * returns all child items ids in array, includes itself and children
 * Same as the function in helpFunctions, just adapted for message items.
 * */
function findAndReturnChildren(messageItems, itemid) {
  let list = [];

  for (let childitem of messageItems) {
    if (childitem.parentId === itemid) {
      list.push.apply(list, findAndReturnChildren(messageItems, childitem._id));
    }
  }

  list.push(itemid); // it's required
  return list;
}

module.exports.handler = new DialogueServer();
module.exports.getMessageTypeValue = getMessageTypeValue;
module.exports.findAndReturnChildren = findAndReturnChildren;
