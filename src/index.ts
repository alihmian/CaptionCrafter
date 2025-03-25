import { Bot, Context, session, type SessionFlavor, InputFile, NextFunction } from "grammy";
import * as fs from 'fs';
import { Menu } from "@grammyjs/menu";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";
import *  as message from "./messages";
import { registerCommands } from "./commands"; // Adjust the path as needed

interface SessionData {
    Text?: string;
    Image?: string;
    ImagePath?: string;
    watermark?: boolean;
    photoMessageId?: number; // Store the message ID
    DaysIntoFuture?: number;
}
type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;
type ImageContext = HydrateFlavor<Context>;
type ImageConversation = Conversation<MyContext, ImageContext>;
type TextContext = HydrateFlavor<Context>;
type TextConversation = Conversation<MyContext, TextContext>;
type ClearFormContext = HydrateFlavor<Context>;
type ClearFormConversation = Conversation<MyContext, ClearFormContext>;
const bot = new Bot<MyContext>("8056950160:AAGIF7ColbOQH5wF6lhWC2HNAib5mb624K8");

bot.use(session({
    initial: (): SessionData => ({
    }),
}));

bot.use(conversations());

export const create = new Menu<MyContext>("create")
    .submenu(message.FillTheForm, "form")
    .row()
    .submenu(message.finishCreate, "finish");
const form = new Menu<MyContext>("form")
    .text(
        // The label to display:
        (ctx) => {
            const currentImage = ctx.session.Image;
            return currentImage ? message.ImageIsSet : message.ImageIsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("Image"),
    )
    .row()
    .text(
        (ctx) => {
            const currentText = ctx.session.Text;
            return currentText ? message.TextIs + currentText : message.TextIsNotSet;
        },
        (ctx) => ctx.conversation.enter("Text"),
    )
    .row()
    .text(
        message.EraseTheForms,
        (ctx) => ctx.conversation.enter("ClearForm")
    )
    .back(message.Return);
create.register(form);

// A small helper that reads session data and returns an object for easy usage
function collectFormData(ctx: MyContext) {
  return {
    image: ctx.session.Image,
    Text: ctx.session.Text,
  };
}
// Another helper that receives a conversation and the data, then builds the "form" menu
function buildFormMenu(
  conversation: TextConversation,
  data: {
    image?: string;
    Text?: string;
    subText?: string;
    event1?: string;
    event2?: string;
    event3?: string;
  }
) {
  // You can rename these variables if you want more clarity
  return conversation
    .menu("form") // <-- The ID "form" must match the one you'll use in `ctx.menu.nav("form")`
    .text(data.image ? message.ImageIsSet : message.ImageIsNotSet)
    .row()
    .text(data.Text ? message.TextIs + data.Text : message.TextIsNotSet)
    .row()
    .text(message.EraseTheForms)
    .back(message.Return);
}
async function Image(conversation: ImageConversation, ctx: ImageContext) {
    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);
    // 1) Prompt the user to send a Text, store the message in `question`
    const question = await ctx.reply(message.SendTheImage);
    // 2) Create a "Text" menu that references `question` in the message.Cancel callback
    const ImageMenu = conversation
    .menu()
    .text(message.Cancel, async (ctx) => {
        console.log("message.Cancel button clicked");
        try {
        await question.delete();
        } catch (err) {
        console.error("Failed to delete question message:", err);
        }
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });
    // Now that we have both menus, we must ensure the "form" menu is recognized
    // by the conversation framework. Because the 'buildFormMenu()' call already
    // created the "form" node, we just need to ensure it’s fully registered.
    // 3) Present the "Text" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: ImageMenu });
    // 1) Wait for the user to send a photo
    //    This waits for an update that has a photo in `ctx.msg.photo`.
    const photoMessage = await conversation.waitFor("message:photo");
    const photos = photoMessage.message.photo;
    await photoMessage.deleteMessage()

    const largestPhoto = photos[photos.length - 1];
    if (!largestPhoto) {
        await ctx.reply("No photo found!");
        return;
    }
    const fileId = largestPhoto.file_id;
    const localFilePath = "./assets/user_image"+ctx.chatId+".jpg";
    const fileInfo = await ctx.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
    const response = await fetch(fileUrl);
    if (!response.ok) {
        await ctx.reply("Failed to download the photo from Telegram!");
        return;
    }
    fs.writeFileSync(localFilePath, Buffer.from(await response.arrayBuffer()));
    // 3) Store the file_id (or do your local download logic)
    await conversation.external((ctx: MyContext) => {
        ctx.session.Image = fileId;
        ctx.session.ImagePath = localFilePath;
    });
    // 5) Rebuild the "form" menu with fresh session data (so it shows the new Text)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);
    await Promise.all([
        await question.delete(),
        // await ctx.editMessageMedia(), // <----- finish this part
        await ctx.editMessageMedia({
            type: "photo",
            // Use the file_id directly to avoid re-uploading,
            // or use a local file path if you want to show a processed image.
            media: fileId,

            // If you want a caption:
            caption: "تصویر خبر شما",
        }),
        await ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu }),
    ]);
}
async function Text(conversation: TextConversation, ctx: TextContext) {
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);
    const question = await ctx.reply(message.SendTheText);
    const TextMenu = conversation
    .menu()
    .text(message.Cancel, async (ctx) => {
        console.log("message.Cancel button clicked");
        try {
        await question.delete();
        } catch (err) {
        console.error("Failed to delete question message:", err);
        }
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });
    await ctx.editMessageReplyMarkup({ reply_markup: TextMenu });
    const Text = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });
    await conversation.external((ctx: MyContext) => {
        ctx.session.Text = Text;
    });
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);
    await Promise.all([
        question.delete(),
        ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu }),
    ]);

}
async function ClearForm(conversation: ClearFormConversation, ctx: ClearFormContext) {
    const ClearFormMenu = conversation.menu().text(message.Cancel, async (ctx) => {
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });
    await ctx.editMessageReplyMarkup({ reply_markup: ClearFormMenu });
    await conversation.external((ctx: MyContext) => {
        ctx.session = {} as SessionData; 
    });
    const currentImage = await conversation.external((ctx) => ctx.session.Image);
    const currentText = await conversation.external((ctx) => ctx.session.Text);
    const logo_image_path = "assets/images/ZAMAN_EGTESAD_LOGO.png"
    const formClone = conversation.menu("form")
        .text(currentImage ? message.ImageIsSet : message.ImageIsNotSet)
        .row()
        .text(currentText ? message.TextIs + currentText: message.TextIsNotSet)
        .row()
        .text(message.EraseTheForms)
        .back(message.Return);
    await Promise.all([
        await ctx.editMessageMedia({
            type: "photo",
            media: new InputFile(logo_image_path),
        }),
        await ctx.editMessageReplyMarkup({ reply_markup: formClone })
    ]);
}


bot.use(createConversation(ClearForm, { plugins: [hydrate()] }));
bot.use(createConversation(Image, { plugins: [hydrate()] }));
bot.use(createConversation(Text, { plugins: [hydrate()] }));
bot.use(create);
bot.use((ctx) => ctx.reply("Send /start"));
bot.catch((err) => {
  console.error("Error in grammY:", err);
});

bot.start();