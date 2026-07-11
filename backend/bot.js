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

bot.start(async (ctx) => {
  const username = escapeMarkdownV2(ctx.from.first_name || 'Force Agent');
  const payload = ctx.startPayload || '';
  // Append tgWebAppStartParam so Telegram WebApp SDK populates initDataUnsafe.start_param
  const finalUrl = payload ? `${webAppUrl}?tgWebAppStartParam=${payload}` : webAppUrl;
  
  await ctx.replyWithMarkdownV2(
    `🛸 *Welcome to Elite Force \\(EFC\\), ${username}\\!* 🛸\n\nElite Force is a next\\-generation premium Web3 ecosystem\\.\n\nTap the button below to launch the Mini App and access your luxury dashboard\\!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('🚀 Launch Elite Force App', finalUrl)]
    ])
  ).catch((err) => console.error('Error replying start welcome:', err));

  // Handle referral notification if payload is a referral link
  if (payload.startsWith('ref_')) {
    const inviterId = parseInt(payload.replace('ref_', ''), 10);
    if (!isNaN(inviterId) && inviterId !== ctx.from.id) {
      try {
        // Get inviter details
        const inviterChat = await ctx.telegram.getChat(inviterId).catch(() => null);
        const inviterName = inviterChat ? (inviterChat.first_name || inviterChat.username || 'your sponsor') : 'your sponsor';
        const inviterUsername = inviterChat && inviterChat.username ? `@${escapeMarkdownV2(inviterChat.username)}` : 'your sponsor';

        // Notify inviter (referrer)
        const inviteeUsername = ctx.from.username ? `@${escapeMarkdownV2(ctx.from.username)}` : escapeMarkdownV2(ctx.from.first_name || 'A user');
        await bot.telegram.sendMessage(
          inviterId,
          `🛸 *New Referral Registered\\!* 🛸\n\nUser ${inviteeUsername} has registered under your link\\. You will receive your referral reward as soon as they start mining\\!`,
          { parse_mode: 'MarkdownV2' }
        ).catch(() => {});

        // Notify invitee (referee)
        await ctx.replyWithMarkdownV2(
          `🔗 *Referral Linked\\!*\n\nYou have joined under sponsor *${escapeMarkdownV2(inviterName)}* \\(${inviterUsername}\\)\\. Welcome to the Elite Force team\\!`
        ).catch(() => {});

      } catch (err) {
        console.error('Error handling dual referral telegram notifications:', err);
      }
    }
  }
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
