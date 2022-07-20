const fs = require('fs');
const { logger } = require('../../core/util/logger');

class DialogueController {

    constructor() {}
    static Instance = new DialogueController();
    static dialogues = {};
    static dialogueFileAge = {};
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
        DialogueController.ReloadDialogue(sessionID);
    
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

    static saveToDisk(sessionID) {
        let dialogpath = GetDialoguePath(sessionID);
        if (sessionID in DialogueController.dialogues) {
          // Check if the dialogue file exists.
          if (fs.existsSync(dialogpath)) {
            // Check if the file was modified elsewhere.
            let statsPreSave = fs.statSync(dialogpath);
            if (statsPreSave.mtimeMs == DialogueController.dialogueFileAge[sessionID]) {
    
              // Compare the dialogues from server memory with the ones saved on disk.
              let currentDialogues = DialogueController.dialogues[sessionID];
              let savedDialogues = fileIO.readParsed(dialogpath);
              if (JSON.stringify(currentDialogues) !== JSON.stringify(savedDialogues)) {
                // Save the dialogues stored in memory to disk.
                fileIO.write(dialogpath, DialogueController.dialogues[sessionID]);
    
                // Reset the file age for the sessions dialogues.
                let stats = fs.statSync(dialogpath);
                DialogueController.dialogueFileAge[sessionID] = stats.mtimeMs;
                logger.logSuccess(`Dialogues for AID ${sessionID} was saved.`);
              }
            } else {
              //Load saved dialogues from disk.
              DialogueController.dialogues[sessionID] = fileIO.readParsed(dialogpath);
    
              // Reset the file age for the sessions dialogues.
              let stats = fs.statSync(dialogpath);
              DialogueController.dialogueFileAge[sessionID] = stats.mtimeMs;
              logger.logWarning(`Dialogues for AID ${sessionID} were modified elsewhere. Dialogue was reloaded successfully.`)
            }
          } else {
            // Save the dialogues stored in memory to disk.
            fileIO.write(dialogpath, DialogueController.dialogues[sessionID]);
    
            // Reset the file age for the sessions dialogues.
            let stats = fs.statSync(dialogpath);
            DialogueController.dialogueFileAge[sessionID] = stats.mtimeMs;
            logger.logSuccess(`Dialogues for AID ${sessionID} was created and saved.`);
          }
        }
      }
}

module.exports.DialogueController = DialogueController;