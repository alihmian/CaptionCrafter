// commands.ts


import { Bot, Context, InputFile } from "grammy";
import {create} from "./index";

// This function registers commands on the provided bot instance.
export function registerCommands(bot: Bot<Context>, mainMenu: any) {
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

    const logo_image_path = "assets/images/ZAMAN_EGTESAD_LOGO.png"

    bot.command("create_post", async (ctx) => {
        const filePath = logo_image_path;
        const message = await ctx.replyWithPhoto(
            new InputFile(filePath),
            {
                caption: "زمان اقتصاد",
                reply_markup: create,
            });
        // Store the message ID in the session so we can edit later
        // ctx.session.photoMessageId = message.message_id;
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
    ]);
}
