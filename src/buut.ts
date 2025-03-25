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
    Text1?: string;
    Text2?: string;
    Text3?: string;
    Text4?: string;
    Text5?: string;
    Toggle1?: boolean;
    Toggle2?: boolean;
    Toggle3?: boolean;
    Int1?: number;
    Int2?: number;
    Int3?: number;
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
    Text1?: string;
    Text2?: string;
    Text3?: string;
    Text4?: string;
    Text5?: string;
    Toggle1?: boolean;
    Toggle2?: boolean;
    Toggle3?: boolean;
    Int1?: number;
    Int2?: number;
    Int3?: number;
}

// Returns current form data from the session with defaults for toggles and integers
function collectFormData(ctx: MyContext): FormData {
    return {
        Image1: ctx.session.Image1,
        Text1: ctx.session.Text1,
        Text2: ctx.session.Text2,
        Text3: ctx.session.Text3,
        Text4: ctx.session.Text4,
        Text5: ctx.session.Text5,
        Toggle1: ctx.session.Toggle1 ?? false,
        Toggle2: ctx.session.Toggle2 ?? false,
        Toggle3: ctx.session.Toggle3 ?? false,
        Int1: ctx.session.Int1 ?? 0,
        Int2: ctx.session.Int2 ?? 0,
        Int3: ctx.session.Int3 ?? 0,
    };
}

// Builds the inline menu for the form.
// Note: This menu includes one image input, five text inputs,
// three toggles (booleans), and three integer controls.
function buildFormMenu(
    conversation: Conversation<MyContext, any>,
    data: FormData
) {
    return conversation.menu("form")
        // Image input row
        .text(
            data.Image1 ? "Image1 ✅" : "Image1 ❌",
            (ctx) => ctx.conversation.enter("image1Conversation")
        )
        // Text inputs rows (each in its own row for clarity)
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
        .text(
            data.Text4 ? "Text4: " + data.Text4 : "Text4 ❌",
            (ctx) => ctx.conversation.enter("text4Conversation")
        )
        .row()
        .text(
            data.Text5 ? "Text5: " + data.Text5 : "Text5 ❌",
            (ctx) => ctx.conversation.enter("text5Conversation")
        )
        .row()
        // Toggles row
        .text("Toggle1: " + (data.Toggle1 ? "On" : "Off"), async (ctx) => {
            ctx.session.Toggle1 = !ctx.session.Toggle1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .text("Toggle2: " + (data.Toggle2 ? "On" : "Off"), async (ctx) => {
            ctx.session.Toggle2 = !ctx.session.Toggle2;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .text("Toggle3: " + (data.Toggle3 ? "On" : "Off"), async (ctx) => {
            ctx.session.Toggle3 = !ctx.session.Toggle3;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .row()
        // Integer controls for Int1
        .text("-", async (ctx) => {
            ctx.session.Int1 = (ctx.session.Int1 ?? 0) - 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .text("Int1: " + data.Int1, () => { })
        .text("+", async (ctx) => {
            ctx.session.Int1 = (ctx.session.Int1 ?? 0) + 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .row()
        // Integer controls for Int2
        .text("-", async (ctx) => {
            ctx.session.Int2 = (ctx.session.Int2 ?? 0) - 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .text("Int2: " + data.Int2, () => { })
        .text("+", async (ctx) => {
            ctx.session.Int2 = (ctx.session.Int2 ?? 0) + 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .row()
        // Integer controls for Int3
        .text("-", async (ctx) => {
            ctx.session.Int3 = (ctx.session.Int3 ?? 0) - 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .text("Int3: " + data.Int3, () => { })
        .text("+", async (ctx) => {
            ctx.session.Int3 = (ctx.session.Int3 ?? 0) + 1;
            const updatedData = collectFormData(ctx);
            const updatedMenu = buildFormMenu(ctx.conversation!, updatedData);
            await ctx.editMessageReplyMarkup({ reply_markup: updatedMenu });
        })
        .row()
        // Final row for finishing or clearing the form
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

// Text4 conversation
async function text4Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Text4",
        promptMessage: "Please send Text 4",
        waitType: "text",
    }, buildFormMenu);
}

// Text5 conversation
async function text5Conversation(
    conversation: FieldConversation,
    ctx: MyContext
) {
    await handleFieldInput(conversation, ctx, {
        fieldName: "Text5",
        promptMessage: "Please send Text 5",
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
        ctx.session.Text1 = undefined;
        ctx.session.Text2 = undefined;
        ctx.session.Text3 = undefined;
        ctx.session.Text4 = undefined;
        ctx.session.Text5 = undefined;
        ctx.session.Toggle1 = false;
        ctx.session.Toggle2 = false;
        ctx.session.Toggle3 = false;
        ctx.session.Int1 = 0;
        ctx.session.Int2 = 0;
        ctx.session.Int3 = 0;
    });
    const clearedData = await conversation.external((ctx: MyContext) =>
        collectFormData(ctx)
    );
    const clearedMenu = buildFormMenu(conversation, clearedData);
    // Optionally, reset the media to a default image (ensure the file exists)
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
        `Form finished!
Image1: ${finalData.Image1 ? "Set" : "Not set"}
Text1: ${finalData.Text1 || "Not set"}
Text2: ${finalData.Text2 || "Not set"}
Text3: ${finalData.Text3 || "Not set"}
Text4: ${finalData.Text4 || "Not set"}
Text5: ${finalData.Text5 || "Not set"}
Toggle1: ${finalData.Toggle1 ? "On" : "Off"}
Toggle2: ${finalData.Toggle2 ? "On" : "Off"}
Toggle3: ${finalData.Toggle3 ? "On" : "Off"}
Int1: ${finalData.Int1}
Int2: ${finalData.Int2}
Int3: ${finalData.Int3}`
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
    createConversation(text1Conversation, "text1Conversation")
);
bot.use(
    createConversation(text2Conversation, "text2Conversation")
);
bot.use(
    createConversation(text3Conversation, "text3Conversation")
);
bot.use(
    createConversation(text4Conversation, "text4Conversation")
);
bot.use(
    createConversation(text5Conversation, "text5Conversation")
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
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Text4 ? "Text4: " + data.Text4 : "Text4 ❌";
    }, (ctx) => ctx.conversation.enter("text4Conversation"))
    .row()
    .text((ctx) => {
        const data = collectFormData(ctx);
        return data.Text5 ? "Text5: " + data.Text5 : "Text5 ❌";
    }, (ctx) => ctx.conversation.enter("text5Conversation"))
    .row()
    .text(
        (ctx) => "Toggle1: " + (ctx.session.Toggle1 ? "On" : "Off"),
        async (ctx) => {
            ctx.session.Toggle1 = !ctx.session.Toggle1;
            await ctx.menu.update();  // Refreshes the current menu automatically
        }
    )    
    .text(
        (ctx) => "Toggle2: " + (ctx.session.Toggle2 ? "On" : "Off"),
        async (ctx) => {
            ctx.session.Toggle2 = !ctx.session.Toggle2;
            await ctx.menu.update();  // Refreshes the current menu automatically
        }
    )
    .text(
        (ctx) => "Toggle1: " + (ctx.session.Toggle3 ? "On" : "Off"),
        async (ctx) => {
            ctx.session.Toggle3 = !ctx.session.Toggle3;
            await ctx.menu.update();  // Refreshes the current menu automatically
        }
    )    
    .row()
    .text("-", async (ctx) => {
        ctx.session.Int1 = (ctx.session.Int1 ?? 0) - 1;
        await ctx.menu.update();
    })    
    .text((ctx) => "Int1: " + (ctx.session.Int1 ?? 0), () => { })
    .text("+", async (ctx) => {
        ctx.session.Int1 = (ctx.session.Int1 ?? 0) + 1;
        await ctx.menu.update();
    })    
    .row()
    .text("-", async (ctx) => {
        ctx.session.Int2 = (ctx.session.Int2 ?? 0) - 1;
        await ctx.menu.update();
    })    
    .text((ctx) => "Int2: " + (ctx.session.Int2 ?? 0), () => { })
    .text("+", async (ctx) => {
        ctx.session.Int2 = (ctx.session.Int2 ?? 0) + 1;
        await ctx.menu.update();
    })   
    .row()
    .text("-", async (ctx) => {
        ctx.session.Int3 = (ctx.session.Int3 ?? 0) - 1;
        await ctx.menu.update();
    })    
    .text((ctx) => "Int3: " + (ctx.session.Int3 ?? 0), () => { })
    .text("+", async (ctx) => {
        ctx.session.Int3 = (ctx.session.Int3 ?? 0) + 1;
        await ctx.menu.update();
    })   
    .row()
    .text("Finish", (ctx) => ctx.conversation.enter("finishConversation"))
    .text("Clear", (ctx) => ctx.conversation.enter("clearFormConversation"));

// Register the menus
bot.use(formMenu);

// ----------------------
// Command to Start the Bot
// ----------------------
bot.command("start", async (ctx) => {
    await ctx.replyWithPhoto(
        new InputFile("./assets/images/ZAMAN_EGTESAD_LOGO.png"),
        { reply_markup: formMenu }
    );
});

bot.catch((err) => {
    console.error("Error in grammY:", err);
});

bot.start();
console.log("Bot is running...");
