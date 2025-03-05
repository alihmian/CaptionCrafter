import { Bot, Context, session, type SessionFlavor, InputFile, NextFunction } from "grammy";
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { Menu } from "@grammyjs/menu";
import { hydrate, type HydrateFlavor } from "@grammyjs/hydrate";
import {
    type Conversation,
    type ConversationFlavor,
    conversations,
    createConversation,
} from "@grammyjs/conversations";

const Database = require("better-sqlite3");

interface SessionData {
    Headline?: string;
    SubHeadline?: string;
    Image?: string;
    ImagePath?: string;
    ImageOutpuPathPaperCaptionLarg?: string;
    ImageOutpuPathPaperCaptionSmall?: string;
    ImageOutpuPathPaperTemplateLarg?: string;
    ImageOutpuPathPaperTemplateSmall?: string;
    Event1?: string;
    Event2?: string;
    Event3?: string;
    PaperTemplateLarg?: boolean; //generate_imge8
    PaperTemplateSmall?: boolean; //generate_imge6
    PaperCaptionLarg?: boolean; //generate_imge2
    PaperCaptionSmall?: boolean; //generate_imge1
    watermark?: boolean;
    photoMessageId?: number; // Store the message ID
    DaysIntoFuture?: number;
}
interface UserRow {
  id: number;
  is_allowed: 0 | 1;
  username?: string;
  first_name?: string;
  last_name?: string;
}

type MyContext = ConversationFlavor<Context & SessionFlavor<SessionData>>;

type ImageContext = HydrateFlavor<Context>;
type ImageConversation = Conversation<MyContext, ImageContext>;

type HeadlineContext = HydrateFlavor<Context>;
type HeadlineConversation = Conversation<MyContext, HeadlineContext>;

type SubHeadlineContext = HydrateFlavor<Context>;
type SubHeadlineConversation = Conversation<MyContext, SubHeadlineContext>;

type Event1Context = HydrateFlavor<Context>;
type Event1Conversation = Conversation<MyContext, Event1Context>;

type Event2Context = HydrateFlavor<Context>;
type Event2Conversation = Conversation<MyContext, Event2Context>;

type Event3Context = HydrateFlavor<Context>;
type Event3Conversation = Conversation<MyContext, Event3Context>;


type ClearFormContext = HydrateFlavor<Context>;
type ClearFormConversation = Conversation<MyContext, ClearFormContext>;

const SECRET_PASSWORD = "MY_SECRET_PASSWORD";

const DB_FILE = "bot.db";

const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    is_allowed INTEGER NOT NULL DEFAULT 0,
    username TEXT,
    first_name TEXT,
    last_name TEXT
  )
`);

function isAllowed(userId: number): boolean {
  // Tell TypeScript that this query returns either `UserRow` or `undefined`
  const row = db
    .prepare("SELECT is_allowed FROM users WHERE id = ?")
    .get(userId) as UserRow | undefined;

  // Now row?.is_allowed is recognized
  return row?.is_allowed === 1;
}


function upsertUser(
  userId: number,
  username?: string,
  first_name?: string,
  last_name?: string
) {
  // If your SQLite version supports UPSERT, you can do:
  db.prepare(`
    INSERT INTO users (id, username, first_name, last_name)
    VALUES (@id, @username, @first_name, @last_name)
    ON CONFLICT(id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name
  `).run({
    id: userId,
    username,
    first_name,
    last_name
  });
}

function allowUser(userId: number) {
  db.prepare("UPDATE users SET is_allowed = 1 WHERE id = ?").run(userId);
}

const logo_image_path = "assets/images/ZAMAN_EGTESAD_LOGO.png"


const bot = new Bot<MyContext>("8056950160:AAGIF7ColbOQH5wF6lhWC2HNAib5mb624K8");

const ImageIsSet = `✅ تصویر📸 خبر تنظیم شده است`;
const ImageIsNotSet = "❌ تصویر خبر تنظیم نشده است.";
const HeadlineIsNotSet = "❌ روتیتر خبر تنظیم نشده است.";
const SubHeadlineIsNotSet = "❌ تیتراصلی خبر تنظیم نشده است.";
const Event1IsNotSet = "❌  رویداد اول تنظیم نشده است.";
const Event2IsNotSet = "❌  رویداد دوم تنظیم نشده است.";
const Event3IsNotSet = "❌  رویداد سوم تنظیم نشده است.";
const EraseTheForms = "🧹 پاک کردن فرم";
const Cancel = "انصراف❌";
const Return = "⏎ بازگشت";
const HeadlineIs = "📰روتیتر:";
const SubHeadlineIs = "🗞️تیتراصلی: ";
const Event1Is = "📅رویداد اول:";
const Event2Is = "📅رویداد دوم:";
const Event3Is = "📅رویداد سوم:";
const SendTheImage = "🌄تصویر خبر را ارسال کنید.";
const SendTheHeadline = "📰روتیتر خبر را وارد کنید.";
const SendTheSubHeadline = "🗞️تیتراصلی خبر را وارد کنید.";
const SendTheEvent1 = "📆رویداد اول را وارد کنید.";
const SendTheEvent2 = "📆رویداد دوم را وارد کنید.";
const SendTheEvent3 = "📆رویداد سوم را وارد کنید.";
const FillTheForm = "⌨️وارد کردن اطلاعات";
const finishCreate = "🏁اتمام ساخت پست ";


bot.use(session({
    initial: (): SessionData => ({
        PaperTemplateLarg: false,
        PaperTemplateSmall: false,
        PaperCaptionLarg: false,
        PaperCaptionSmall: false,
    }),
}));
bot.use(conversations());

const create = new Menu<MyContext>("create")
    .submenu(FillTheForm, "form")
    .row()
    .submenu(finishCreate, "finish");

const form = new Menu<MyContext>("form")
    .text(
        // The label to display:
        (ctx) => {
            const currentImage = ctx.session.Image;
            return currentImage ? ImageIsSet : ImageIsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("Image"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const currentHeadline = ctx.session.Headline;
            return currentHeadline ? HeadlineIs + currentHeadline : HeadlineIsNotSet;
        },
        // The button's handler:
        (ctx) => ctx.conversation.enter("Headline"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const currentSubHeadline = ctx.session.SubHeadline;
            return currentSubHeadline ? SubHeadlineIs + currentSubHeadline : SubHeadlineIsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("SubHeadline"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const currentEvent1= ctx.session.Event1;
            return currentEvent1 ? Event1Is + currentEvent1 : Event1IsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("Event1"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const currentEvent2 = ctx.session.Event2;
            return currentEvent2 ? Event2Is + currentEvent2 : Event2IsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("Event2"),
    )
    .row()
    .text(
        // The label to display:
        (ctx) => {
            const currentEvent3 = ctx.session.Event3;
            return currentEvent3 ? Event3Is + currentEvent3 : Event3IsNotSet;
        },

        // The button's handler:
        (ctx) => ctx.conversation.enter("Event3"),
    )
    .row()
    .text(
        // The label to display:
        EraseTheForms,
        (ctx) => ctx.conversation.enter("ClearForm")
    )
    .back(Return);
create.register(form);


const finish = new Menu<MyContext>("finish")
    .text(
        (ctx) => `📜روزنامه - ⬛️بزرگ: \t ${ctx.session.PaperTemplateLarg ? "✅" : "❌"}`,
        (ctx) => {
            ctx.session.PaperTemplateLarg = !ctx.session.PaperTemplateLarg;
            ctx.menu.update(); // Refresh menu
        }
    )
    .row()
    .text(
        (ctx) => ` 📜روزنامه - ▪️کوچک: \t\t${ctx.session.PaperTemplateSmall ? "✅" : "❌"}`,
        (ctx) => {
            ctx.session.PaperTemplateSmall = !ctx.session.PaperTemplateSmall;
            ctx.menu.update(); // Refresh menu
        }
    )
    .row()
    .text(
        (ctx) => ` 🌠عکس نوشته - ⬛️بزرگ: \t ${ctx.session.PaperCaptionLarg ? "✅" : "❌"}`,
        (ctx) => {
            ctx.session.PaperCaptionLarg = !ctx.session.PaperCaptionLarg;
            ctx.menu.update(); // Refresh menu
        }
    )
    .row()
    .text(
        (ctx) => ` 🌠عکس نوشته - ▪️کوچک: \t${ctx.session.PaperCaptionSmall ? "✅" : "❌"}`,
        (ctx) => {
            ctx.session.PaperCaptionSmall = !ctx.session.PaperCaptionSmall;
            ctx.menu.update(); // Refresh menu
        }
    )
    .row()
    .text(
        (ctx) => ` واترمارک : ${ctx.session.watermark ? "✅" : "❌"}`,
        (ctx) => {
            ctx.session.watermark = !ctx.session.watermark;
            ctx.menu.update(); // Refresh menu
        }
    )
    .row()
    .text("✅ اتمام", async (ctx) => {
        const notificationMessage = await ctx.reply("در حال ساخت پست ها ...");
        await ctx.deleteMessage().catch(() => { }); // Remove menu if possible
        if (ctx.session.PaperCaptionLarg) {
            ctx.session.ImageOutpuPathPaperCaptionLarg = "./assets/OutPut/PaperCaptionLarg"+ctx.chatId+".png";
                // `./assets/OutPut/PaperCaptionLarg-${ctx.chatId}.png`;
                // 
            ctx.session.DaysIntoFuture = 0;
            const watermark = ctx.session.watermark ? 1 : 0;
            const command = "/venv/bin/python3";
            const args = [
                "src/Craft/PaperCaptionLarg.py",
                "--input", ctx.session.ImagePath || "",
                "--output", ctx.session.ImageOutpuPathPaperCaptionLarg || "",
                "--headline", ctx.session.Headline || "",
                "--subheadline", ctx.session.SubHeadline || "",
                "--daysintofuture", String(ctx.session.DaysIntoFuture ?? "0"), // Convert number to string
                "--event1", ctx.session.Event1 || "",
                "--event2", ctx.session.Event2 || "",
                "--event3", ctx.session.Event3 || "",
                "--watermark", String(watermark ?? "0") // Convert boolean/number to string
            ];



            const result = spawnSync(command, args, { encoding: "utf-8" });

            if (result.error) {
                console.error(`Error: ${result.error.message}`);
            } else {
                console.log(`Output: ${result.stdout}`);
                console.error(`stderr: ${result.stderr}`);
            }

            const userInfo = JSON.stringify(ctx.from, null, 2);

            // // Send that info to your channel

            await bot.api.sendDocument(
                -1002302354978,
                new InputFile(ctx.session.ImageOutpuPathPaperCaptionLarg!),
                {
                    caption: ` تصویر  عکس نوشته بزرگ \n User :\n${userInfo}`
                }
            )
            
            // send the image created
            await ctx.replyWithDocument(
                new InputFile(ctx.session.ImageOutpuPathPaperCaptionLarg),
                {
                    caption: "تصویر عکس نوشته بزرگ"
                });
            
        };

        if (ctx.session.PaperCaptionSmall) {
            ctx.session.ImageOutpuPathPaperCaptionSmall = "./assets/OutPut/PaperCaptionSmal"+ctx.chatId+".png";
            ctx.session.DaysIntoFuture = 0;
            const watermark = ctx.session.watermark ? 1 : 0;
            const command = "/venv/bin/python3";
            const args = [
                "src/Craft/PaperCaptionSmall.py",
                "--input", ctx.session.ImagePath || "",
                "--output", ctx.session.ImageOutpuPathPaperCaptionSmall || "",
                "--headline", ctx.session.Headline || "",
                "--subheadline", ctx.session.SubHeadline || "",
                "--daysintofuture", String(ctx.session.DaysIntoFuture ?? "0"), // Convert number to string
                "--event1", ctx.session.Event1 || "",
                "--event2", ctx.session.Event2 || "",
                "--event3", ctx.session.Event3 || "",
                "--watermark", String(watermark ?? "0") // Convert boolean/number to string
            ];


            const result = spawnSync(command, args, { encoding: "utf-8" });

            if (result.error) {
                console.error(`Error: ${result.error.message}`);
            } else {
                console.log(`Output: ${result.stdout}`);
                console.error(`stderr: ${result.stderr}`);
            };

            const userInfo = JSON.stringify(ctx.from, null, 2);

            // Send that info to your channel

            await bot.api.sendDocument(
                -1002302354978,
                new InputFile(ctx.session.ImageOutpuPathPaperCaptionSmall!),
                {
                    caption: ` تصویر  عکس نوشته کوچک \n User :\n${userInfo}`
                }
            )
            
            // send the image created
            await ctx.replyWithDocument(
                new InputFile(ctx.session.ImageOutpuPathPaperCaptionSmall),
                {
                    caption: "تصویر عکس نوشته کوچک"
                });
        };
        
        if (ctx.session.PaperTemplateLarg) {
            ctx.session.ImageOutpuPathPaperTemplateLarg = "./assets/OutPut/PaperTemplateLarg"+ctx.chatId+".png";
            ctx.session.DaysIntoFuture = 0;
            const watermark = ctx.session.watermark ? 1 : 0;
            const command = "/venv/bin/python3";
            const args = [
                "src/Craft/PaperTemplateLarg.py",
                "--input", ctx.session.ImagePath || "",
                "--output", ctx.session.ImageOutpuPathPaperTemplateLarg || "",
                "--headline", ctx.session.Headline || "",
                "--subheadline", ctx.session.SubHeadline || "",
                "--daysintofuture", String(ctx.session.DaysIntoFuture ?? "0"), // Convert number to string
                "--event1", ctx.session.Event1 || "",
                "--event2", ctx.session.Event2 || "",
                "--event3", ctx.session.Event3 || "",
                "--watermark", String(watermark ?? "0") // Convert boolean/number to string
            ];

            const result = spawnSync(command, args, { encoding: "utf-8" });

            if (result.error) {
                console.error(`Error: ${result.error.message}`);
            } else {
                console.log(`Output: ${result.stdout}`);
                console.error(`stderr: ${result.stderr}`);
            }

            const userInfo = JSON.stringify(ctx.from, null, 2);

            // Send that info to your channel

            await ctx.replyWithDocument(
                new InputFile(ctx.session.ImageOutpuPathPaperTemplateLarg),
                {
                    caption: "تصویر روزنامه بزرگ"
                }
            );

            await bot.api.sendDocument(
                -1002302354978,
                new InputFile(ctx.session.ImageOutpuPathPaperTemplateLarg!),
                {
                    caption: ` تصویر روزنامه بزرگ \n User :\n${userInfo}`
                }
            )
            

            
            
        };

        if (ctx.session.PaperTemplateSmall) {
            ctx.session.ImageOutpuPathPaperTemplateSmall = "./assets/OutPut/PaperTemplateSmall"+ctx.chatId+".png";
            ctx.session.DaysIntoFuture = 0;
            const watermark = ctx.session.watermark ? 1 : 0;
            const command = "/venv/bin/python3";
            const args = [
                "src/Craft/PaperTemplateSmall.py",
                "--input", ctx.session.ImagePath || "",
                "--output", ctx.session.ImageOutpuPathPaperTemplateSmall || "",
                "--headline", ctx.session.Headline || "",
                "--subheadline", ctx.session.SubHeadline || "",
                "--daysintofuture", String(ctx.session.DaysIntoFuture ?? "0"), // Convert number to string
                "--event1", ctx.session.Event1 || "",
                "--event2", ctx.session.Event2 || "",
                "--event3", ctx.session.Event3 || "",
                "--watermark", String(watermark ?? "0") // Convert boolean/number to string
            ];



            const result = spawnSync(command, args, { encoding: "utf-8" });

            if (result.error) {
                console.error(`Error: ${result.error.message}`);
            } else {
                console.log(`Output: ${result.stdout}`);
                console.error(`stderr: ${result.stderr}`);
            }

            const userInfo = JSON.stringify(ctx.from, null, 2);

            // Send that info to your channel

            // send the image created
            await ctx.replyWithDocument(
                new InputFile(ctx.session.ImageOutpuPathPaperTemplateSmall!),
                {
                    caption: "تصویر روزنامه کوچک"
                }
            );
            await bot.api.sendDocument(
                -1002302354978,
                new InputFile(ctx.session.ImageOutpuPathPaperTemplateSmall!),
                {
                    caption: ` تصویر روزنامه کوچک \n User :\n${userInfo}`
                }
            )
            

       
        };
        
        ctx.api.deleteMessage(ctx.chatId!, notificationMessage.message_id);
    })
        .back(Return);
create.register(finish);

// A small helper that reads session data and returns an object for easy usage
function collectFormData(ctx: MyContext) {
  return {
    image: ctx.session.Image,
    headline: ctx.session.Headline,
    subHeadline: ctx.session.SubHeadline,
    event1: ctx.session.Event1,
    event2: ctx.session.Event2,
    event3: ctx.session.Event3,
  };
}
// Another helper that receives a conversation and the data, then builds the "form" menu
function buildFormMenu(
  conversation: HeadlineConversation,
  data: {
    image?: string;
    headline?: string;
    subHeadline?: string;
    event1?: string;
    event2?: string;
    event3?: string;
  }
) {
  // You can rename these variables if you want more clarity
  return conversation
    .menu("form") // <-- The ID "form" must match the one you'll use in `ctx.menu.nav("form")`
    .text(data.image ? ImageIsSet : ImageIsNotSet)
    .row()
    .text(data.headline ? HeadlineIs + data.headline : HeadlineIsNotSet)
    .row()
    .text(data.subHeadline ? SubHeadlineIs + data.subHeadline : SubHeadlineIsNotSet)
    .row()
    .text(data.event1 ? Event1Is + data.event1 : Event1IsNotSet)
    .row()
    .text(data.event2 ? Event2Is + data.event2 : Event2IsNotSet)
    .row()
    .text(data.event3 ? Event3Is + data.event3 : Event3IsNotSet)
    .row()
    .text(EraseTheForms)
    .back(Return);
}


async function Image(conversation: ImageConversation, ctx: ImageContext) {

    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    // 1) Prompt the user to send a headline, store the message in `question`
    const question = await ctx.reply(SendTheImage);



    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const ImageMenu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: ImageMenu });

// %%%%%%%%%%%%%%%%%%%% should look into it
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

// %%%%%%%%%%%%%%%%%%%% should look into it


    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
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





async function Headline(conversation: HeadlineConversation, ctx: HeadlineContext) {

    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    

    const question = await ctx.reply(SendTheHeadline);

    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const HeadlineMenu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: HeadlineMenu });



    // Wait for text input
    const Headline = await conversation.form.text({
        // Once the user responds, delete their new message
        action: (ctx) => ctx.deleteMessage(),
    });


    // Store the new headline in session
    await conversation.external((ctx: MyContext) => {
        ctx.session.Headline = Headline;
    });


    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);


    await Promise.all([
        question.delete(),
        ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu }),
    ]);

}
async function SubHeadline(conversation: SubHeadlineConversation, ctx: SubHeadlineContext) {
    
    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    // 1) Prompt the user to send a headline, store the message in `question`
    const question = await ctx.reply(SendTheSubHeadline);

    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const SubHeadlineMenu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: SubHeadlineMenu });



    // Wait for text input
    const SubHeadline = await conversation.form.text({
        // Once the user responds, delete their new message
        action: (ctx) => ctx.deleteMessage(),
    });

    // Store the new headline in session
    await conversation.external((ctx: MyContext) => ctx.session.SubHeadline = SubHeadline);

    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);

    await Promise.all([
        question.delete(),
        await ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu })
    ]);
}
async function Event1(conversation: Event1Conversation, ctx: Event1Context) {

    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    // 1) Prompt the user to send a headline, store the message in `question`
    const question = await ctx.reply(SendTheEvent1);

    
    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const Event1Menu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: Event1Menu });

    // Wait for text input
    const Event1 = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });

    // Store the new headline in session
    await conversation.external((ctx: MyContext) => ctx.session.Event1 = Event1);


    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);

    await Promise.all([
        question.delete(),
        await ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu })
    ]);
}
async function Event2(conversation: Event2Conversation, ctx: Event2Context) {

    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    // 1) Prompt the user to send a headline, store the message in `question`
    const question = await ctx.reply(SendTheEvent2);

    
    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const Event2Menu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: Event2Menu });

    // Wait for text input
    const Event2 = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });

    // Store the new headline in session
    await conversation.external((ctx: MyContext) => ctx.session.Event2 = Event2);


    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);

    await Promise.all([
        question.delete(),
        await ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu })
    ]);
}
async function Event3(conversation: Event3Conversation, ctx: Event3Context) {

    // 0) Get session data and build the "form" menu once
    const initialData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const initialFormMenu = buildFormMenu(conversation, initialData);

    // 1) Prompt the user to send a headline, store the message in `question`
    const question = await ctx.reply(SendTheEvent3);

    
    // 2) Create a "headline" menu that references `question` in the Cancel callback
    const Event3Menu = conversation
    .menu()
    .text(Cancel, async (ctx) => {
        console.log("Cancel button clicked");
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

    // 3) Present the "Headline" menu to the user
    await ctx.editMessageReplyMarkup({ reply_markup: Event3Menu });

    // Wait for text input
    const Event3 = await conversation.form.text({
        action: (ctx) => ctx.deleteMessage(),
    });

    // Store the new headline in session
    await conversation.external((ctx: MyContext) => ctx.session.Event3 = Event3);


    // 5) Rebuild the "form" menu with fresh session data (so it shows the new headline)
    const updatedData = await conversation.external((ctx: MyContext) => collectFormData(ctx));
    const updatedFormMenu = buildFormMenu(conversation, updatedData);

    await Promise.all([
        question.delete(),
        await ctx.editMessageReplyMarkup({ reply_markup: updatedFormMenu })
    ]);
}

async function ClearForm(conversation: ClearFormConversation, ctx: ClearFormContext) {

    // Override the outside menu when the conversation is entered.
    const ClearFormMenu = conversation.menu().text(Cancel, async (ctx) => {
        await ctx.menu.nav("form", { immediate: true });
        await conversation.halt();
    });

    await ctx.editMessageReplyMarkup({ reply_markup: ClearFormMenu });

    await conversation.external((ctx: MyContext) => {
        ctx.session = {} as SessionData; // Clear all session data
    });


    const currentImage = await conversation.external((ctx) => ctx.session.Image);
    const currentHeadline = await conversation.external((ctx) => ctx.session.Headline);
    const currentSubHeadline = await conversation.external((ctx) => ctx.session.SubHeadline);
    const currentEvent1 = await conversation.external((ctx) => ctx.session.Event1);
    const currentEvent2 = await conversation.external((ctx) => ctx.session.Event2);
    const currentEvent3 = await conversation.external((ctx) => ctx.session.Event3);

    // Define the structure that the ouside menu expects.
    const formClone = conversation.menu("form")
        .text(currentImage ? ImageIsSet : ImageIsNotSet)
        .row()
        .text(currentHeadline ? HeadlineIs + currentHeadline: HeadlineIsNotSet)
        .row()
        .text(currentSubHeadline ? SubHeadlineIs + currentSubHeadline : SubHeadlineIsNotSet)
        .row()
        .text(currentEvent1 ? Event1Is + currentEvent1 : Event1IsNotSet)
        .row()
        .text(currentEvent2 ? Event2Is + currentEvent2 : Event2IsNotSet)
        .row()
        .text(currentEvent3 ? Event3Is + currentEvent3 : Event3IsNotSet)
        .row()
        .text(EraseTheForms)
        .back(Return);

    await Promise.all([
        await ctx.editMessageMedia({
            type: "photo",
            // Use the file_id directly to avoid re-uploading,
            // or use a local file path if you want to show a processed image.
            media: new InputFile(logo_image_path),

            // If you want a caption:
            caption: "زمان اقتصاد",
        }),
        await ctx.editMessageReplyMarkup({ reply_markup: formClone })
    ]);


}
bot.use(createConversation(Event1, { plugins: [hydrate()] }));
bot.use(createConversation(Event2, { plugins: [hydrate()] }));
bot.use(createConversation(Event3, { plugins: [hydrate()] }));
bot.use(createConversation(ClearForm, { plugins: [hydrate()] }));
bot.use(createConversation(Image, { plugins: [hydrate()] }));
bot.use(createConversation(Headline, { plugins: [hydrate()] }));
bot.use(createConversation(SubHeadline, { plugins: [hydrate()] }));
// bot.use(form);
bot.use(create);
// bot.use(approve);









// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Commands %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

bot.command("start", async (ctx) => {
  // Greet the user by name (fallback to a generic greeting if name is missing)
  const userName = ctx.from?.first_name || "there";
  await ctx.reply(`Hello ${userName}, welcome to the bot! ❤️`);

  // Build a string from the full user info (ctx.from)
  const userInfo = JSON.stringify(ctx.from, null, 2);

  // Send that info to your channel
  await bot.api.sendMessage(
    -1002302354978,
    `User started the bot:\n${userInfo}`
  );
});

bot.command("register", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return ctx.reply("Could not detect your user ID! Are you in a weird environment?");
  }

  // Extract password from the message, e.g. "/register MY_PASS"
  const parts = ctx.msg.text.split(/\s+/);
  const password = parts[1];
  if (!password) {
    return ctx.reply("Usage: /register <password>");
  }


  // Insert (or update) user row in DB with basic info
  upsertUser(userId, ctx.from?.username, ctx.from?.first_name, ctx.from?.last_name);

   // Check the password
  if (password === SECRET_PASSWORD) {
      allowUser(userId);
          // Build a string from the full user info (ctx.from)
      const userInfo = JSON.stringify(ctx.from, null, 2);

        // Send that info to your channel
        await bot.api.sendMessage(
            -1002302354978,
            `User registered to the bot:\n${userInfo}`
        );
        return ctx.reply("Registration successful! You now have access to the bot.");
      
  } else {
    return ctx.reply("Incorrect password. Please try again.");
  }

});

bot.command("create_post", async (ctx) => {
    const filePath = logo_image_path;
    const message = await ctx.replyWithPhoto(
        new InputFile( filePath),
            {
                caption: "زمان اقتصاد",
                reply_markup: create ,
        });
    // Store the message ID in the session so we can edit later
    ctx.session.photoMessageId = message.message_id;
              // Build a string from the full user info (ctx.from)
      const userInfo = JSON.stringify(ctx.from, null, 2);

        // Send that info to your channel
        await bot.api.sendMessage(
            -1002302354978,
            `User trying to create post:\n${userInfo}`
        );
});






bot.api.setMyCommands([
    { command: "start", description: "رباتو روشن کن!" },
    { command: "create_post", description: "ساخت پست" },
    { command: "register", description: "برای استفاده از بات اول خودتو معرفی کن!" },
    // { command: "advanced_post_creation", description: "ساخت پست پیشرفته" },
    // { command: "history", description: "پستایی که تا حالا ساختیو مرور کن" },
    // { command: "admin", description: "پنل ادمین" },
]);


// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Error Handling? / MiddleWare %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

bot.use((ctx) => ctx.reply("Send /start"));

// Global middleware that blocks non-allowed users from using any command or message (except /register).
async function approve(
    ctx: Context,
    next : NextFunction
) {
      // If it's a command, we don't want to block /register
  // (or you can handle that logic differently).
  if (ctx.msg?.text?.startsWith("/register")) {
    // Let them run /register
    return next();
  }

  // Check if user is in DB and is_allowed=1
  const userId = ctx.from?.id;
  if (!userId) {
    return ctx.reply("No user ID found in message—can't authenticate you!");
  }
  if (!isAllowed(userId)) {
    return ctx.reply("You are not allowed! Please /register <password> first.");
  }
  return next();
}




// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Checklist %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%


// register : please enter the password ✅
// create_post : three buttons {image, headline, subheadline, create_image(would be a sub_menu with four buttons to check which post styles should be created)}
// data_bases : {users, created_images}
// before any action check if the user is verified or maybe there is a better solution in the documentation. ✅
// how to work with files
// how to work with python code? ✅
// Error handling, gracefull shutdown
// cancel button is not working


// two of my main worries 😱:
// deployement
// how to retrieve files?✅



// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Start The Damn Bot %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
// 2. Global error handler with bot.catch()
bot.catch((err) => {
  console.error("Error in grammY:", err);
  // You can log it somewhere or just ignore it—grammY will keep running
});

bot.start();
// bot.catch((err) => {
//     console.error("Error caught:", err);
// });

console.log("Bot is running...");
console.log("Updated the code..");




