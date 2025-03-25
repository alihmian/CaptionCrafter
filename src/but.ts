import { Bot, Context, session, type SessionFlavor, InputFile } from "grammy";
import { Menu } from "@grammyjs/menu";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";
import * as fs from "fs";



// ----------------------
// Define Session Data
// ----------------------
interface SessionData {
    Image1?: string;
    Image1Path?: string;
    Image2?: string;
    Image2Path?: string;
    Text1?: string;
    Text2?: string;
    Text3?: string;
}

type MyContext = HydrateFlavor<ConversationFlavor<Context & SessionFlavor<SessionData>>>;
type FieldContext = MyContext;
type FieldConversation = Conversation<MyContext, MyContext>;


// ----------------------
// Create the Bot
// ----------------------
const bot = new Bot<MyContext>("7572093455:AAF-uO2uHhwWbO584paHgBGj_uRr5pu8IL8");

// Use session, conversations, and hydration middleware
bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());
bot.use(hydrate());

// ----------------------
// Helper Functions
// ----------------------

// Data shape for building the form menu
interface FormData {
    Image1?: string;
    Image2?: string;
    Text1?: string;
    Text2?: string;
    Text3?: string;
}

// Returns current form data from the session
function collectFormData(ctx: MyContext): FormData {
    return {
        Image1: ctx.session.Image1,
        Image2: ctx.session.Image2,
        Text1: ctx.session.Text1,
        Text2: ctx.session.Text2,
        Text3: ctx.session.Text3,
    };
}

// Builds the inline menu for the form.
// You can adjust the layout as needed.
function buildFormMenu(
    conversation: Conversation<MyContext, any>,
    data: FormData
) {
    return conversation.menu("form")
        .text(
            data.Image1 ? "Image1 ✅" : "Image1 ❌",
            (ctx) => ctx.conversation.enter("image1Conversation")
        )
        .text(
            data.Image2 ? "Image2 ✅" : "Image2 ❌",
            (ctx) => ctx.conversation.enter("image2Conversation")
        )
        .row()
        .text(
            data.Text1 ? "Text1: " + data.Text1 : "Text1 ❌",
            (ctx) => ctx.conversation.enter("text1Conversation")
        )
        .row()
        .text(
            data.Text2 ? "Text2: " + data.Text2 : "Text2 ❌",
            (ctx) => ctx.conversation.enter("text2Conversation")
        )
        .row()
        .text(
            data.Text3 ? "Text3: " + data.Text3 : "Text3 ❌",
            (ctx) => ctx.conversation.enter("text3Conversation")
        )
        .row()
        .text("Finish", (ctx) => ctx.conversation.enter("finishConversation"))
        .text("Clear", (ctx) => ctx.conversation.enter("clearFormConversation"));
}

// A generic helper that handles a field input (text or photo)
async function handleFieldInput<T extends MyContext>(
    conversation: Conversation<T, any>,
    ctx: T,
    options: {
        fieldName: keyof SessionData;
        promptMessage: string;
        waitType: "text" | "photo";
        processInput?: (ctx: T, input: any) => Promise<any>;
        updateMedia?: (ctx: T, input: any) => Promise<void>;
    },
    buildMenu: (conversation: Conversation<T, any>, data: FormData) => any
) {
    // Build the current form menu
    const initialData = await conversation.external((ctx: T) =>
        collectFormData(ctx)
    );
    const initialMenu = buildMenu(conversation, initialData);

    // Send a prompt to the user
    const question = await ctx.reply(options.promptMessage);

    // Create a Cancel button so the user can abort the action
    const cancelMenu = conversation.menu().text("Cancel", async (ctx) => {
        try {
            await ctx.api.deleteMessage(ctx.chat.id, question.message_id);
        } catch (err) {
            console.error("Failed to delete question:", err);
        }
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });
    await ctx.editMessageReplyMarkup({ reply_markup: cancelMenu });

    let input: any;

    if (options.waitType === "text") {
        input = await conversation.form.text({
            action: (ctx) => ctx.deleteMessage(),
        });
    } else if (options.waitType === "photo") {
        const photoMsg = await conversation.waitFor("message:photo");
        input = photoMsg;
        await photoMsg.deleteMessage();
    }

    if (options.processInput) {
        input = await options.processInput(ctx, input);
    }

    // Store the result in the session
    await conversation.external((ctx: T) => {
        ctx.session[options.fieldName] = input;
    });

    const updatedData = await conversation.external((ctx: T) =>
        collectFormData(ctx)
    );
    const updatedMenu = buildMenu(conversation, updatedData);
    await ctx.api.deleteMessage(ctx.chat!.id, question.message_id);


    if (options.waitType === "photo" && options.updateMedia) {
        await options.updateMedia(ctx, input);
    }
    await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
}

// ----------------------
// Conversation Handlers
// ----------------------

// Image1 conversation
async function image1Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Image1",
        promptMessage: "Please send Image 1",
        waitType: "photo",
        processInput: async (ctx, photoMsg) => {
            const photos = photoMsg.message.photo;
            const largestPhoto = photos[photos.length - 1];
            if (!largestPhoto) {
                await ctx.reply("No photo found!");
                return null;
            }
            const fileId = largestPhoto.file_id;
            const localPath = "./assets/image1_" + ctx.chatId + ".jpg";
            const fileInfo = await ctx.api.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
            const response = await fetch(fileUrl);
            if (!response.ok) {
                await ctx.reply("Failed to download the photo!");
                return null;
            }
            fs.writeFileSync(localPath, Buffer.from(await response.arrayBuffer()));
            await conversation.external((ctx: MyContext) => {
                ctx.session.Image1Path = localPath;
            });
            return fileId;
        },
        updateMedia: async (ctx, fileId) => {
            await ctx.editMessageMedia({
                type: "photo",
                media: fileId,
                caption: "Image 1 updated",
            });
        },
    }, buildFormMenu);
}

// Image2 conversation
async function image2Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Image2",
        promptMessage: "Please send Image 2",
        waitType: "photo",
        processInput: async (ctx, photoMsg) => {
            const photos = photoMsg.message.photo;
            const largestPhoto = photos[photos.length - 1];
            if (!largestPhoto) {
                await ctx.reply("No photo found!");
                return null;
            }
            const fileId = largestPhoto.file_id;
            const localPath = "./assets/image2_" + ctx.chatId + ".jpg";
            const fileInfo = await ctx.api.getFile(fileId);
            const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
            const response = await fetch(fileUrl);
            if (!response.ok) {
                await ctx.reply("Failed to download the photo!");
                return null;
            }
            fs.writeFileSync(localPath, Buffer.from(await response.arrayBuffer()));
            await conversation.external((ctx: MyContext) => {
                ctx.session.Image2Path = localPath;
            });
            return fileId;
        },
        updateMedia: async (ctx, fileId) => {
            await ctx.editMessageMedia({
                type: "photo",
                media: fileId,
                caption: "Image 2 updated",
            });
        },
    }, buildFormMenu);
}

// Text1 conversation
async function text1Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Text1",
        promptMessage: "Please send Text 1",
        waitType: "text",
    }, buildFormMenu);
}

// Text2 conversation
async function text2Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Text2",
        promptMessage: "Please send Text 2",
        waitType: "text",
    }, buildFormMenu);
}

// Text3 conversation
async function text3Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Text3",
        promptMessage: "Please send Text 3",
        waitType: "text",
    }, buildFormMenu);
}

// Clear form conversation: resets the session data and updates the menu
async function clearFormConversation(
    conversation: FieldConversation,
    ctx: FieldContext
) {
    await conversation.external((ctx: MyContext) => {
        ctx.session.Image1 = undefined;
        ctx.session.Image1Path = undefined;
        ctx.session.Image2 = undefined;
        ctx.session.Image2Path = undefined;
        ctx.session.Text1 = undefined;
        ctx.session.Text2 = undefined;
        ctx.session.Text3 = undefined;
    });
    const clearedData = await conversation.external((ctx: MyContext) =>
        collectFormData(ctx)
    );
    const clearedMenu = buildFormMenu(conversation, clearedData);
    // Optionally, reset the media to a default image
    await ctx.editMessageMedia({
        type: "photo",
        media: new InputFile("./assets/images/ZAMAN_EGTESAD_LOGO.png"),
        caption: "Default image",
    });
    await ctx.editMessageReplyMarkup({ reply_markup: clearedMenu });
}

// Finish conversation: shows a summary and optionally performs final processing
async function finishConversation(
    conversation: FieldConversation,
    ctx: FieldContext
) {
    const finalData = await conversation.external((ctx: MyContext) =>
        collectFormData(ctx)
    );
    await ctx.reply(
        `Form finished!\nImage1: ${finalData.Image1 ? "Set" : "Not set"}\nImage2: ${finalData.Image2 ? "Set" : "Not set"}\nText1: ${finalData.Text1 || "Not set"}\nText2: ${finalData.Text2 || "Not set"}\nText3: ${finalData.Text3 || "Not set"}`
    );
    const updatedMenu = buildFormMenu(conversation, finalData);
    await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
}

// ----------------------
// Register Conversations
// ----------------------
bot.use(
    createConversation(image1Conversation, "image1Conversation")
);
bot.use(
    createConversation(image2Conversation, "image2Conversation")
);
bot.use(
    createConversation(text1Conversation, "text1Conversation")
);
bot.use(
    createConversation(text2Conversation, "text2Conversation")
);
bot.use(
    createConversation(text3Conversation, "text3Conversation")
);
bot.use(
    createConversation(clearFormConversation, "clearFormConversation")
);
bot.use(
    createConversation(finishConversation, "finishConversation")
);

// ----------------------
// Create Menus
// ----------------------

// The form menu is registered as "form" and used both in the conversation helper and here.
export const formMenu = new Menu<MyContext>("form")
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Image1 ? "Image1 ✅" : "Image1 ❌";
    }, (ctx) => ctx.conversation.enter("image1Conversation"))
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Image2 ? "Image2 ✅" : "Image2 ❌";
    }, (ctx) => ctx.conversation.enter("image2Conversation"))
    .row()
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Text1 ? "Text1: " + data.Text1 : "Text1 ❌";
    }, (ctx) => ctx.conversation.enter("text1Conversation"))
    .row()
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Text2 ? "Text2: " + data.Text2 : "Text2 ❌";
    }, (ctx) => ctx.conversation.enter("text2Conversation"))
    .row()
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Text3 ? "Text3: " + data.Text3 : "Text3 ❌";
    }, (ctx) => ctx.conversation.enter("text3Conversation"))
    .row()
    .text("Finish", (ctx) => ctx.conversation.enter("finishConversation"))
    .text("Clear", (ctx) => ctx.conversation.enter("clearFormConversation"));


// Register the menus
bot.use(formMenu);


// ----------------------
// Command to Start the Bot
// ----------------------
bot.command("start", async (ctx) => {
    await ctx.replyWithPhoto(new InputFile("./assets/images/ZAMAN_EGTESAD_LOGO.png"), { reply_markup: formMenu });
});


bot.catch((err) => {
    console.error("Error in grammY:", err);
});

bot.start();
console.log("Bot is running...");
