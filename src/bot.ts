import { Bot, Context, session, SessionFlavor, InputFile } from "grammy";
import { Menu, MenuFlavor } from "@grammyjs/menu";
import { hydrate, HydrateFlavor } from "@grammyjs/hydrate";
import {
  conversations,
  createConversation,
  Conversation,
  ConversationFlavor,
} from "@grammyjs/conversations";
import fs from "fs";

// ----------------------
// 1. Session Data
// ----------------------
interface SessionData {
  Image1Path?: string;
  Text: Record<string, string>;
  Toggles: Record<string, boolean>;
  Integers: Record<string, number>;
}

// ----------------------
// 2. Define Two Context Types
// ----------------------

// BaseContext: everything EXCEPT conversation flavor
type BaseContext = Context &
  SessionFlavor<SessionData> &
  MenuFlavor & // so ctx.menu works
  HydrateFlavor<Context>; // so ctx.reply etc. are hydrated

// ConvContext: extends the BaseContext with conversation flavor
type ConvContext = BaseContext & ConversationFlavor<BaseContext>;

// ----------------------
// 3. Configuration
// ----------------------
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN";
const CONFIG = {
  BOT_TOKEN,
  DEFAULT_IMAGE: "./assets/images/ZAMAN_EGTESAD_LOGO.png",
  ASSETS_DIR: "./assets",
};

// ----------------------
// 4. Create the Bot (BaseContext)
// ----------------------
const bot = new Bot<BaseContext>(BOT_TOKEN);

// 4a. Apply session, hydration, conversation middlewares to BaseContext
bot.use(
  session({
    initial: (): SessionData => ({
      Text: {},
      Toggles: { Toggle1: false, Toggle2: false, Toggle3: false },
      Integers: { Int1: 0, Int2: 0, Int3: 0 },
    }),
  })
);
bot.use(hydrate());

// Note: conversations() expects to add `ctx.conversation`—we do a small trick:
bot.use((ctx, next) =>
  // Force-cast to ConvContext so the conversation plugin can do its job:
  conversations<ConvContext>()(ctx as unknown as ConvContext, next)
);

// ----------------------
// 5. Helper Function for Download
// ----------------------
async function safeDownloadPhoto(url: string, path: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    fs.writeFileSync(path, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch (err) {
    console.error("Download error:", err);
    return false;
  }
}

// ----------------------
// 6. Conversation Handlers (ConvContext)
// ----------------------

// 6a. Image conversation
async function imageConversation(
  conversation: Conversation<ConvContext>,
  ctx: ConvContext
) {
  await ctx.reply("Please send an image:");
  const photoMsg = await conversation.waitFor("message:photo");
  const photo = photoMsg.message.photo.pop();
  if (!photo) {
    await ctx.reply("No photo found.");
    return;
  }
  const fileInfo = await ctx.api.getFile(photo.file_id);
  const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;
  const localPath = `${CONFIG.ASSETS_DIR}/user_image_${ctx.chat!.id}.jpg`;

  const success = await safeDownloadPhoto(fileUrl, localPath);
  if (!success) {
    await ctx.reply("Failed to download image.");
    return;
  }
  ctx.session.Image1Path = localPath;
  await ctx.reply("Image saved successfully!");
}

// 6b. Text conversation
async function textConversation(
  conversation: Conversation<ConvContext>,
  ctx: ConvContext,
  field: string
) {
  await ctx.reply(`Please send a value for ${field}:`);
  const msg = await conversation.form.text();
  ctx.session.Text[field] = msg;

  // Force menu update if user is currently in a menu
  await ctx.menu.update();
}

// ----------------------
// 7. Register Conversations
// ----------------------

// We'll define a small convenience function to cast from BaseContext to ConvContext
function enterConversation(name: string) {
  return (ctx: BaseContext) => {
    (ctx as unknown as ConvContext).conversation.enter(name);
  };
}

// 7a. Create the image conversation
bot.use(
  createConversation<ConvContext>(imageConversation, {
    conversationName: "imageConversation",
  })
);

// 7b. Dynamically create text conversations
const textFields = ["Text1", "Text2", "Text3", "Text4", "Text5"];
for (const field of textFields) {
  bot.use(
    createConversation<ConvContext>(
      (conv, ctx) => textConversation(conv, ctx, field),
      { conversationName: field }
    )
  );
}

// ----------------------
// 8. Build the Inline Menu (BaseContext)
// ----------------------
const formMenu = new Menu<BaseContext>("form");

// 8a. Image row
formMenu
  .text(
    (ctx) => (ctx.session.Image1Path ? "Image1 ✅" : "Image1 ❌"),
    enterConversation("imageConversation")
  )
  .row();

// 8b. Text fields
textFields.forEach((field, index) => {
  formMenu.text(
    (ctx) => `${field}: ${ctx.session.Text[field] ?? "❌"}`,
    enterConversation(field)
  );
  if (index % 2 === 1) formMenu.row();
});

// 8c. Toggles
const toggles = ["Toggle1", "Toggle2", "Toggle3"] as const;
toggles.forEach((key) => {
  formMenu.text(
    (ctx) => `${key}: ${ctx.session.Toggles[key] ? "On" : "Off"}`,
    async (ctx) => {
      ctx.session.Toggles[key] = !ctx.session.Toggles[key];
      await ctx.menu.update();
    }
  );
});
formMenu.row();

// 8d. Integers
["Int1", "Int2", "Int3"].forEach((intKey) => {
  formMenu
    .text("-", async (ctx) => {
      ctx.session.Integers[intKey]--;
      await ctx.menu.update();
    })
    .text((ctx) => `${intKey}: ${ctx.session.Integers[intKey]}`, () => {})
    .text("+", async (ctx) => {
      ctx.session.Integers[intKey]++;
      await ctx.menu.update();
    })
    .row();
});

// 8e. Finish / Clear
formMenu
  .text("Finish", (ctx) => {
    ctx.reply(`Current Session:\n\`\`\`\n${JSON.stringify(ctx.session, null, 2)}\n\`\`\``, {
      parse_mode: "Markdown",
    });
  })
  .text("Clear", async (ctx) => {
    ctx.session.Text = {};
    ctx.session.Toggles = { Toggle1: false, Toggle2: false, Toggle3: false };
    ctx.session.Integers = { Int1: 0, Int2: 0, Int3: 0 };
    await ctx.menu.update();
  });

// 8f. Register the menu
bot.use(formMenu);

// ----------------------
// 9. Start Command
// ----------------------
bot.command("start", async (ctx) => {
  await ctx.replyWithPhoto(new InputFile(CONFIG.DEFAULT_IMAGE), {
    reply_markup: formMenu,
  });
});

// ----------------------
// 10. Error Handling & Start Bot
// ----------------------
bot.catch((err) => {
  console.error("Bot error:", err);
});
bot.start();
console.log("Bot is running...");
