To run your code, follow these steps:

1. Make sure you've installed all dependencies defined in your package.json by running:
   ```
   npm install
   ```
2. If you're using the TypeScript compiler, compile your TypeScript files into JavaScript by running:
   ```
   npx tsc
   ```
   (This assumes you have a tsconfig.json file set up. The compiled code usually goes into a folder like dist/.)

3. Run the compiled JavaScript file with Node.js. For example, if your main file is in dist/bot.js, run:
   ```
   node dist/bot.js
   ```
   
Alternatively, if you have ts-node installed (or want to use it for development), you can run your bot directly without compiling:
   ```
   npx ts-node src/bot.ts
   ```

Once you run the code, you'll see the console log "Bot is running..." and your bot will start receiving updates from Telegram.