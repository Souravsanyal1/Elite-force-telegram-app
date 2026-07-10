import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.MINI_APP_URL || 'http://localhost:5173';

if (!token) {
  console.error('BOT_TOKEN is not defined in env variables!');
  process.exit(1);
}

const bot = new Telegraf(token);

// Escape MarkdownV2 special characters
function escapeMarkdownV2(text) {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

bot.start((ctx) => {
  const username = escapeMarkdownV2(ctx.from.first_name || 'Force Agent');
  
  ctx.replyWithMarkdownV2(
    `🛸 *Welcome to Elite Force \\(EFC\\), ${username}\\!* 🛸\n\nElite Force is a next\\-generation premium Web3 ecosystem\\.\n\nTap the button below to launch the Mini App and access your luxury dashboard\\!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Launch Elite Force App', webAppUrl)]
    ])
  );
});

bot.command('app', (ctx) => {
  ctx.reply('Opening Elite Force...', Markup.inlineKeyboard([
    [Markup.button.webApp('🚀 Open App', webAppUrl)]
  ]));
});

console.log('Starting Elite Force bot...');
bot.launch().then(() => {
  console.log('Bot is successfully running! Go to your Telegram Bot and send /start to test.');
}).catch((err) => {
  console.error('Error starting bot:', err);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
