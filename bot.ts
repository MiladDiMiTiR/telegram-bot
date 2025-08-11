import { Bot } from "https://deno.land/x/grammy/mod.ts";

const bot = new Bot(Deno.env.get("TELEGRAM_TOKEN") || "");

// تنظیم Webhook (فقط یک بار اجرا شود)
async function setWebhook() {
  const webhookUrl = `https://${Deno.env.get("DENO_DEPLOYMENT_DOMAIN")}`;
  await bot.api.setWebhook(webhookUrl);
  console.log(`Webhook set to: ${webhookUrl}`);
}

// این خط را فقط یک بار اجرا کنید:
 await setWebhook();

// هندلر پیام‌ها
bot.on("message:text", async (ctx) => {
  await ctx.reply(`پیام شما دریافت شد: ${ctx.message.text}`);
});

// سرور برای Deno Deploy
const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req) => {
  try {
    return await handleUpdate(req);
  } catch (err) {
    console.error("Error handling request:", err);
    return new Response(err.message, { status: 500 });
  }
});
