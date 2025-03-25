// main.ts

import { Bot, Context, session, type SessionFlavor, InputFile } from "grammy";
import { conversations ,type ConversationFlavor} from "@grammyjs/conversations";
import { createFormModule } from "./forms/createFormModule";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import { FormDefinition } from "./forms/types";
interface FormSessionData {
  forms: {
    [formName: string]: {
      [fieldName: string]: any;
    }
  }
}

// type MyContext = 
//   & SessionFlavor<FormSessionData>
//   & ConversationFlavor;

type MyContext = HydrateFlavor<ConversationFlavor<Context & SessionFlavor<SessionData>>>;


const bot = new Bot<MyContext>("YOUR_BOT_TOKEN");
bot.use(session({ initial: () => ({ forms: {} }) }));
bot.use(conversations());

// Example: define a couple of forms

const form1Def: FormDefinition = {
  name: "form1",
  fields: [
    { fieldName: "text1", label: "Text1", promptMessage: "Enter Text1", waitType: "text" },
    { fieldName: "image1", label: "Image1", promptMessage: "Send Image1", waitType: "photo" },
    { fieldName: "text2", label: "Text2", promptMessage: "Enter Text2", waitType: "text" },
    // ... as many fields as you want
  ],
};

const form2Def: FormDefinition = {
  name: "form2",
  fields: [
    { fieldName: "imageMain", label: "Main Image", promptMessage: "Send main image", waitType: "photo" },
    { fieldName: "textMain", label: "Main Text", promptMessage: "Enter main text", waitType: "text" },
    // etc...
  ],
};

// Create the modules
const form1Menu = createFormModule(bot, form1Def);
const form2Menu = createFormModule(bot, form2Def);

// Register them with the bot
bot.use(form1Menu);
bot.use(form2Menu);

// Commands or triggers to show each form
bot.command("start_form1", async (ctx) => {
  await ctx.reply("Form1:", { reply_markup: form1Menu });
});

bot.command("start_form2", async (ctx) => {
  await ctx.reply("Form2:", { reply_markup: form2Menu });
});

// Start the bot
bot.start();
console.log("Bot is running...");
