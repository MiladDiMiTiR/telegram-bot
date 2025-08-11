bot.on("message:text", async (ctx) => {
  console.log("Received message:", ctx.message.text); // برای debug در لاگ‌ها
  await ctx.reply("پیام شما دریافت شد! 🤖", {
    reply_to_message_id: ctx.message.message_id,
  });
});
