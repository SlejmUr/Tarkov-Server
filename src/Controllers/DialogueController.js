const fs = require('fs');
const { logger } = require('../../core/util/logger');

class DialogueController {

    constructor() {}
    static Instance = new DialogueController();
    static dialogues = {};
    static messageTypes = {
        npcTrader: 2,
        insuranceReturn: 8,
        questStart: 10,
        questFail: 11,
        questSuccess: 12,
      };

    static AddDialogueMessage(dialogueID, messageContent, sessionID, rewards = []) {
    
        dialogue_f.handler.addDialogueMessage(dialogueID, messageContent, sessionID, rewards);
      
    }

    static GetDialoguePath(sessionID) {
        return `user/profiles/${sessionID}/dialogue.json`;
    }

    static ReloadDialogue(sessionID)
    {
        if (fs.existsSync(GetDialoguePath(sessionID)))
        {
            DialogueController.dialogues[sessionID] = fileIO.readParsed(GetDialoguePath(sessionID));
        }
    }

    static initializeDialogue(sessionID) {
        DialogueController.ReloadDialogue(sessionID);
        logger.logSuccess(`(Re)Loaded dialogues for AID ${sessionID} successfully.`);
    }

    static generateDialogueList(sessionID) {
        // Reload dialogues before continuing.
        DialogueController.reloadDialogue(sessionID);
    
        let data = [];
        for (let dialogueId in DialogueController.dialogues[sessionID]) {
          data.push(DialogueController.getDialogueInfo(dialogueId, sessionID));
        }
    
        return fileIO.stringify(data);
    }

    static getDialogueInfo(dialogueId, sessionID) {
        let dialogue = DialogueController.dialogues[sessionID][dialogueId];
        return {
          _id: dialogueId,
          type: 2, // Type npcTrader.
          message: DialogueController.getMessagePreview(dialogue),
          new: dialogue.new,
          attachmentsNew: dialogue.attachmentsNew,
          pinned: dialogue.pinned,
        };
    }

    static getMessagePreview(dialogue) {
        // The last message of the dialogue should be shown on the preview.
        let message = dialogue.messages[dialogue.messages.length - 1];
    
        return {
          dt: message.dt,
          type: message.type,
          templateId: message.templateId,
          uid: dialogue._id,
        };
    }

    static getMessageTypeValue(messageType) {
        return DialogueController.messageTypes[messageType];
    }
}

module.exports.DialogueController = DialogueController;