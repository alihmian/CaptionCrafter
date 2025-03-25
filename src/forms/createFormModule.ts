import { Menu } from "@grammyjs/menu";
import {
  Conversation,
  ConversationFlavor,
  createConversation
} from "@grammyjs/conversations";
import { Bot, Context, session, SessionFlavor } from "grammy";
import * as fs from "fs";
import fetch from "node-fetch";  // or from "undici"

import { FormDefinition, FormFieldDefinition } from "./types";

interface FormSessionData {
  forms: {
    [formName: string]: {
      [fieldName: string]: any; // or more specifically: string or undefined
    }
  }
}

// Extend the context
type MyContext = Context & SessionFlavor<FormSessionData> & ConversationFlavor;

export function createFormModule(bot: Bot<MyContext>, formDef: FormDefinition) {
  const formName = formDef.name;

  // -------------
  // 1. Build the "outer" menu for the form
  // -------------
  const formMenu = new Menu<MyContext>(formName);

  // We will create each field’s menu item in a loop below
  for (const field of formDef.fields) {
    formMenu
      .text(
        (ctx) => {
          const fieldValue = ctx.session.forms?.[formName]?.[field.fieldName];
          if (field.waitType === "photo") {
            return fieldValue ? `${field.label} ✅` : `${field.label} ❌`;
          } else {
            return fieldValue ? `${field.label}: ${fieldValue}` : `${field.label} ❌`;
          }
        },
        async (ctx) => {
          await ctx.conversation.enter(`${formName}_${field.fieldName}_conversation`);
        }
      )
      .row();
  }

  // Additional menu items
  formMenu
    .text("Finish", async (ctx) => {
      await ctx.conversation.enter(`${formName}_finish`);
    })
    .text("Clear", async (ctx) => {
      await ctx.conversation.enter(`${formName}_clear`);
    });


  // -------------
  // 2. Build the conversation handler for each field
  //    We’ll define a function that returns the conversation code for a single field
  // -------------
  function buildFieldConversation(field: FormFieldDefinition) {
    return async function fieldConversation(conversation: Conversation<MyContext>, ctx: MyContext) {
      // Prompt the user
      await ctx.reply(field.promptMessage);

      let inputMessage;
      if (field.waitType === "text") {
        // Wait for text
        inputMessage = await conversation.waitFor("message:text");
      } else {
        // Wait for photo
        inputMessage = await conversation.waitFor("message:photo");
      }

      if (!inputMessage.message) {
        // Something unexpected
        return;
      }

      if (field.waitType === "text") {
        // Save text
        const text = inputMessage.message.text;
        ctx.session.forms[formName][field.fieldName] = text;
      } else {
        // Save photo
        const photos = inputMessage.message.photo;
        const largestPhoto = photos[photos.length - 1];
        const fileId = largestPhoto.file_id;

        // Download the file locally, if you like
        const fileInfo = await ctx.api.getFile(fileId);
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
        const response = await fetch(fileUrl);
        const data = await response.arrayBuffer();
        
        const localPath = `./assets/${formName}_${field.fieldName}_${ctx.chat.id}.jpg`;
        fs.writeFileSync(localPath, Buffer.from(data));

        // Stash info in session
        ctx.session.forms[formName][field.fieldName] = fileId;
        // Optionally also store the local path
        // ctx.session.forms[formName][`${field.fieldName}Path`] = localPath;
      }

      // Once done, we can redirect back to the form menu
      await ctx.reply("Saved!");
      await ctx.reply("Back to the menu:", { reply_markup: formMenu });
    };
  }

  // -------------
  // 3. Clear conversation
  // -------------
  async function clearFormConversation(conversation: Conversation<MyContext>, ctx: MyContext) {
    ctx.session.forms[formName] = {};
    await ctx.reply("Form cleared!");
    await ctx.reply("Back to the menu:", { reply_markup: formMenu });
  }

  // -------------
  // 4. Finish conversation
  // -------------
  async function finishConversation(conversation: Conversation<MyContext>, ctx: MyContext) {
    const data = ctx.session.forms[formName];
    // Just a summary
    let textSummary = `Form **${formName}** is complete.\n\n`;
    for (const field of formDef.fields) {
      const value = data[field.fieldName];
      textSummary += `**${field.label}:** ${value ? value : "Not set"}\n`;
    }

    await ctx.reply(textSummary, { parse_mode: "Markdown" });
    await ctx.reply("Back to the menu:", { reply_markup: formMenu });
  }


  // -------------
  // 5. Register the new conversations with the bot
  //    Each field gets a conversation name like "myform_text1_conversation"
  // -------------
  for (const field of formDef.fields) {
    bot.use(
      createConversation(buildFieldConversation(field), `${formName}_${field.fieldName}_conversation`)
    );
  }

  // Add the clear and finish conversations
  bot.use(createConversation(clearFormConversation, `${formName}_clear`));
  bot.use(createConversation(finishConversation, `${formName}_finish`));

  // Return the menu so the calling code can attach it to the bot
  return formMenu;
}
