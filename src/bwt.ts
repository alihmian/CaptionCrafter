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
import { spawnSync } from "child_process";
import { GrammyError } from "grammy"; // For error checking

// ----------------------
// Define Session Data
// ----------------------
interface SessionData {
    Image1?: string;
    Image1Path?: string;
    Overline?: string;              
    MainHeadline?: string;          
    Event1?: string;                
    Event2?: string;                
    Event3?: string;                
    DynamicFontSize?: boolean;      
    // Toggle2 -> watermark
    // Toggle3 -> composed
    Toggle2?: boolean; 
    Toggle3?: boolean;

    // DaysIntoFuture -> Int1
    DaysIntoFuture?: number;        
    // Int2 -> overline_font_size_delta
    // Int3 -> main_headline_font_size_delta
    Int2?: number;
    Int3?: number;
}

type MyContext = HydrateFlavor<ConversationFlavor<Context & SessionFlavor<SessionData>>>;
type FieldContext = MyContext;
type FieldConversation = Conversation<MyContext, MyContext>;

// ----------------------
// Create the Bot
// ----------------------
const bot = new Bot<MyContext>("YOUR_BOT_TOKEN");

// Use session, conversations, and hydration middleware
bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());
bot.use(hydrate());

// ----------------------
// Helper function to safely edit reply markup 
// (to avoid \"message is not modified\" error).
// ----------------------
async function safeEditReplyMarkup(ctx: MyContext, replyMarkup: any) {
    try {
        await ctx.editMessageReplyMarkup({ reply_markup: replyMarkup });
    } catch (err) {
        // If it's the "400: Bad Request: message is not modified" error, just ignore it
        if (err instanceof GrammyError && err.description?.includes("message is not modified")) {
            // ignore
        } else {
            throw err;
        }
    }
}

// ----------------------
// Collect Form Data
// ----------------------
interface FormData {
    Image1?: string;
    Overline?: string;
    MainHeadline?: string;
    Event1?: string;
    Event2?: string;
    Event3?: string;
    DynamicFontSize?: boolean;
    // we renamed them:
    watermark?: boolean;
    composed?: boolean;
    DaysIntoFuture?: number;
    overline_font_size_delta?: number;
    main_headline_font_size_delta?: number;
}

function collectFormData(ctx: MyContext): FormData {
    return {
        Image1: ctx.session.Image1,
        Overline: ctx.session.Overline,
        MainHeadline: ctx.session.MainHeadline,
        Event1: ctx.session.Event1,
        Event2: ctx.session.Event2,
        Event3: ctx.session.Event3,
        DynamicFontSize: ctx.session.DynamicFontSize ?? false,

        // Toggle2 -> watermark
        watermark: ctx.session.Toggle2 ?? false,
        // Toggle3 -> composed
        composed: ctx.session.Toggle3 ?? false,

        DaysIntoFuture: ctx.session.DaysIntoFuture ?? 0,

        // Int2 -> overline_font_size_delta
        overline_font_size_delta: ctx.session.Int2 ?? 0,

        // Int3 -> main_headline_font_size_delta
        main_headline_font_size_delta: ctx.session.Int3 ?? 0,
    };
}

// ----------------------
// Utility: call the Python script via spawnSync
// ----------------------
async function updateNewspaperImage(ctx: MyContext) {
    // Gather needed info from the session
    // (Or we can gather from collectFormData, which might be simpler)
    const data = collectFormData(ctx);

    const userImagePath = ctx.session.Image1Path || "./assets/images/ZAMAN_EGTESAD_LOGO.png";
    const overlineText = data.Overline || "";
    const mainHeadlineText = data.MainHeadline || "";
    const event1 = data.Event1 || "";
    const event2 = data.Event2 || "";
    const event3 = data.Event3 || "";
    const daysIntoFuture = data.DaysIntoFuture ?? 0;
    const overlineFontDelta = data.overline_font_size_delta ?? 0;
    const mainHeadlineFontDelta = data.main_headline_font_size_delta ?? 0;

    const dynamicFontSize = data.DynamicFontSize;
    const watermark = data.watermark;
    const composed = data.composed;

    // We'll produce the final image here.
    const outputPath = "./assets/generated_newspaper_image.png";

    // Build the argument list for the Python script. 
    const pythonScript = "./create_newspaper_image.py"; // Adjust if needed
    const args = [
        pythonScript,
        "--user_image_path", userImagePath,
        "--overline_text", overlineText,
        "--main_headline_text", mainHeadlineText,
        "--output_path", outputPath,
        "--days_into_future", daysIntoFuture.toString(),
        "--overline_font_size_delta", overlineFontDelta.toString(),
        "--main_headline_font_size_delta", mainHeadlineFontDelta.toString(),
        "--event1_text", event1,
        "--event2_text", event2,
        "--event3_text", event3,
    ];

    if (dynamicFontSize) {
        args.push("--dynamic_font_size");
    }
    if (watermark) {
        args.push("--watermark");
    }
    if (composed) {
        args.push("--composed");
    }

    // spawnSync to run python3 script
    const result = spawnSync("python3", args, { stdio: "inherit" });
    if (result.error) {
        console.error("Error calling Python script:", result.error);
    }

    // Now update the image in the same message if possible
    try {
        await ctx.editMessageMedia({
            type: "photo",
            media: new InputFile(outputPath),
            caption: "Live updated newspaper",
        });
    } catch (error) {
        console.error("Failed to update newspaper image:", error);
    }
}

// ----------------------
// Build the inline menu
// ----------------------
function buildFormMenu(
    conversation: Conversation<MyContext, any>,
    data: FormData
) {
    return conversation.menu("form")
        // 1) Image
        .text(
            data.Image1 ? "Image1 ✅" : "Image1 ❌",
            (ctx) => ctx.conversation.enter("image1Conversation")
        )
        // 2) Overline
        .text(
            data.Overline ? "Overline: " + data.Overline : "Overline ❌",
            (ctx) => ctx.conversation.enter("overlineConversation")
        )
        .row()
        // 3) MainHeadline
        .text(
            data.MainHeadline ? "Headline: " + data.MainHeadline : "Headline ❌",
            (ctx) => ctx.conversation.enter("mainHeadlineConversation")
        )
        .row()
        // 4) Event1
        .text(
            data.Event1 ? "Event1: " + data.Event1 : "Event1 ❌",
            (ctx) => ctx.conversation.enter("event1Conversation")
        )
        .row()
        // 5) Event2
        .text(
            data.Event2 ? "Event2: " + data.Event2 : "Event2 ❌",
            (ctx) => ctx.conversation.enter("event2Conversation")
        )
        .row()
        // 6) Event3
        .text(
            data.Event3 ? "Event3: " + data.Event3 : "Event3 ❌",
            (ctx) => ctx.conversation.enter("event3Conversation")
        )
        .row()
        // 7) Toggles
        .text("DynFont: " + (data.DynamicFontSize ? "On" : "Off"), async (ctx) => {
            ctx.session.DynamicFontSize = !ctx.session.DynamicFontSize;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        // Toggle2 -> watermark
        .text("W-mark: " + (data.watermark ? "On" : "Off"), async (ctx) => {
            ctx.session.Toggle2 = !ctx.session.Toggle2;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        // Toggle3 -> composed
        .text("Composed: " + (data.composed ? "On" : "Off"), async (ctx) => {
            ctx.session.Toggle3 = !ctx.session.Toggle3;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .row()
        // 8) DaysIntoFuture
        .text("-", async (ctx) => {
            ctx.session.DaysIntoFuture = (ctx.session.DaysIntoFuture ?? 0) - 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .text("Days: " + (data.DaysIntoFuture ?? 0), () => { })
        .text("+", async (ctx) => {
            ctx.session.DaysIntoFuture = (ctx.session.DaysIntoFuture ?? 0) + 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .row()
        // 9) overline_font_size_delta -> Int2
        .text("-", async (ctx) => {
            ctx.session.Int2 = (ctx.session.Int2 ?? 0) - 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .text("OverlineΔ: " + (data.overline_font_size_delta ?? 0), () => { })
        .text("+", async (ctx) => {
            ctx.session.Int2 = (ctx.session.Int2 ?? 0) + 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .row()
        // 10) main_headline_font_size_delta -> Int3
        .text("-", async (ctx) => {
            ctx.session.Int3 = (ctx.session.Int3 ?? 0) - 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .text("HeadlineΔ: " + (data.main_headline_font_size_delta ?? 0), () => { })
        .text("+", async (ctx) => {
            ctx.session.Int3 = (ctx.session.Int3 ?? 0) + 1;
            await updateNewspaperImage(ctx);
            await ctx.menu.update();
        })
        .row()
        // final
        .text("Finish", (ctx) => ctx.conversation.enter("finishConversation"))
        .text("Clear", (ctx) => ctx.conversation.enter("clearFormConversation"));
}

// ----------------------
// A generic helper that handles a field input (text or photo)
// ----------------------
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

    // Prompt user
    const question = await ctx.reply(options.promptMessage);

    // Cancel button
    const cancelMenu = conversation.menu().text("Cancel", async (ctx) => {
        try {
            await ctx.api.deleteMessage(ctx.chat.id, question.message_id);
        } catch (err) {
            console.error("Failed to delete question:", err);
        }
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });
    await safeEditReplyMarkup(ctx, cancelMenu);

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

    // Save result in session
    await conversation.external((ctx: T) => {
        ctx.session[options.fieldName] = input;
    });

    const updatedData = await conversation.external((ctx: T) =>
        collectFormData(ctx)
    );
    const updatedMenu = buildMenu(conversation, updatedData);

    // Remove question
    await ctx.api.deleteMessage(ctx.chat!.id, question.message_id);

    if (options.waitType === "photo" && options.updateMedia) {
        await options.updateMedia(ctx, input);
    }

    // Update image
    await conversation.external(async (ctx) => {
        await updateNewspaperImage(ctx);
    });

    // Finally, update the menu
    await safeEditReplyMarkup(ctx, updatedMenu);
}

// ----------------------
// Conversation Handlers
// ----------------------
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

async function overlineConversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Overline",
        promptMessage: "Please send Overline text",
        waitType: "text",
    }, buildFormMenu);
}

async function mainHeadlineConversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "MainHeadline",
        promptMessage: "Please send Main Headline text",
        waitType: "text",
    }, buildFormMenu);
}

async function event1Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Event1",
        promptMessage: "Please send Event1 text",
        waitType: "text",
    }, buildFormMenu);
}

async function event2Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Event2",
        promptMessage: "Please send Event2 text",
        waitType: "text",
    }, buildFormMenu);
}

async function event3Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Event3",
        promptMessage: "Please send Event3 text",
        waitType: "text",
    }, buildFormMenu);
}

// Clear form conversation
async function clearFormConversation(
    conversation: FieldConversation,
    ctx: FieldContext
) {
    await conversation.external((ctx: MyContext) => {
        ctx.session.Image1 = undefined;
        ctx.session.Image1Path = undefined;
        ctx.session.Overline = undefined;
        ctx.session.MainHeadline = undefined;
        ctx.session.Event1 = undefined;
        ctx.session.Event2 = undefined;
        ctx.session.Event3 = undefined;
        ctx.session.DynamicFontSize = false;
        ctx.session.Toggle2 = false; // watermark
        ctx.session.Toggle3 = false; // composed
        ctx.session.DaysIntoFuture = 0;
        ctx.session.Int2 = 0;       // overline_font_size_delta
        ctx.session.Int3 = 0;       // main_headline_font_size_delta
    });
    const clearedData = await conversation.external((ctx: MyContext) =>
        collectFormData(ctx)
    );
    const clearedMenu = buildFormMenu(conversation, clearedData);
    // reset the media
    await ctx.editMessageMedia({
        type: "photo",
        media: new InputFile("./assets/images/ZAMAN_EGTESAD_LOGO.png"),
        caption: "Default image",
    });
    await safeEditReplyMarkup(ctx, clearedMenu);
}

// Finish conversation
async function finishConversation(
    conversation: FieldConversation,
    ctx: FieldContext
) {
    const finalData = await conversation.external((ctx: MyContext) =>
        collectFormData(ctx)
    );

    // Show summary
    await ctx.reply(
        `Form finished!\n` +
        `Image1: ${finalData.Image1 ? "Set" : "Not set"}\n` +
        `Overline: ${finalData.Overline || "Not set"}\n` +
        `Headline: ${finalData.MainHeadline || "Not set"}\n` +
        `Event1: ${finalData.Event1 || "Not set"}\n` +
        `Event2: ${finalData.Event2 || "Not set"}\n` +
        `Event3: ${finalData.Event3 || "Not set"}\n` +
        `DynFont: ${finalData.DynamicFontSize ? "On" : "Off"}\n` +
        `Watermark: ${finalData.watermark ? "On" : "Off"}\n` +
        `Composed: ${finalData.composed ? "On" : "Off"}\n` +
        `DaysIntoFuture: ${finalData.DaysIntoFuture}\n` +
        `OverlineΔ: ${finalData.overline_font_size_delta}\n` +
        `HeadlineΔ: ${finalData.main_headline_font_size_delta}`
    );

    // Regenerate final image
    await conversation.external(async (ctx) => {
        await updateNewspaperImage(ctx);
    });

    // **Send the created image as a file** 
    await ctx.replyWithDocument(new InputFile("./assets/generated_newspaper_image.png"));

    // Optionally, update the menu so it remains accessible
    const updatedMenu = buildFormMenu(conversation, finalData);
    await safeEditReplyMarkup(ctx, updatedMenu);
}

// ----------------------
// Register all Conversations
// ----------------------
bot.use(
    createConversation(image1Conversation, "image1Conversation")
);
bot.use(
    createConversation(overlineConversation, "overlineConversation")
);
bot.use(
    createConversation(mainHeadlineConversation, "mainHeadlineConversation")
);
bot.use(
    createConversation(event1Conversation, "event1Conversation")
);
bot.use(
    createConversation(event2Conversation, "event2Conversation")
);
bot.use(
    createConversation(event3Conversation, "event3Conversation")
);
bot.use(
    createConversation(clearFormConversation, "clearFormConversation")
);
bot.use(
    createConversation(finishConversation, "finishConversation")
);

// ----------------------
// Create a top-level form menu
// (used if user not in a conversation at the moment)
// ----------------------
export const formMenu = new Menu<MyContext>("form")
    // Same logic as buildFormMenu but you can do .dynamic() or reuse the same structure
    // For brevity, let’s just forward to the conversation (this is a fallback)
    .text("Edit Fields", async (ctx) => {
        // Typically you'd open conversation or do something
        await ctx.conversation.enter("image1Conversation"); 
    });

// We also attach the conversation's menu system to the bot:
bot.use(formMenu);

// ----------------------
// /start command
// ----------------------
bot.command("start", async (ctx) => {
    await ctx.replyWithPhoto(
        new InputFile("./assets/images/ZAMAN_EGTESAD_LOGO.png"),
        { reply_markup: formMenu }
    );
});

// Error handling
bot.catch((err) => {
    console.error("Error in grammY:", err);
});

bot.start();
console.log("Bot is running...");
