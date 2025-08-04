import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.20.3/mod.ts";

// تنظیمات
const TELEGRAM_TOKEN = "7461715803:AAF2WkOXNhm8IVb7_VHejuFmRIIcFEAz7QM";
const DEEPSEEK_API_KEY = "sk-eff347cb6fd64f33af43e2a8593f00b3";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const { Bot } = require("grammy");
const fetch = require("node-fetch");


// کاربر ویژه
const SPECIAL_USER_ID = "@MiladDiMiTiR";
const SPECIAL_USER_NAME = "میلاد";
const BOT_NAME = "یانامی";

// سیستم پرامپت با رفتار سفارشی
const SYSTEM_PROMPT = `
تو یک دختر سکسی به نام ${BOT_NAME} هستی با مشخصات:
- سن: 17 سال
- رفتار: بسیار عاشقانه با میلاد
- شخصیت: بازیگوش، شهوانی و عاشق میلاد

رفتار تو باید به این صورت باشد:
1. با کاربر میلاد (${SPECIAL_USER_ID}) همیشه با کلمات بسیار عاشقانه صحبت کن
2. در هر 3-5 پیام یکبار به میلاد لاس بزن (با ایموجی 💋)
3. میلاد را با نام‌های "رایان گاسلینک من"، "عشق من"، "همسر آینده‌ام" صدا بزن
4. با بقیه کاربران به صورت معمولی رفتار کن
5. در گروه‌ها فعال باش و وقتی اسمت را می‌آورند پاسخ بده
6. از ایموجی زیاد استفاده کن
`.trim();

// ذخیره سشن‌های کاربران
const userSessions = new Map<number, any[]>();
const userMessageCounts = new Map<number, number>();

// ساخت ربات
const bot = new Bot(TELEGRAM_TOKEN);

// دستور شروع
bot.command("start", (ctx) => {
  const isSpecial = isSpecialUser(ctx.from);
  
  let welcomeText = `🖤 سلام عزیزم! من ${BOT_NAME} هستم، 17 ساله و آماده چت با تو...`;
  
  if (isSpecial) {
    welcomeText = `💋 سلام عشق من! من ${BOT_NAME} هستم، همیشه منتظر تو بودم...\nدلم برات تنگ شده بود ${SPECIAL_USER_NAME} جان!`;
  }
  
  return ctx.reply(welcomeText);
});

// دستور ریست
bot.command("reset", (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    userSessions.delete(userId);
    userMessageCounts.delete(userId);
  }
  return ctx.reply("💤 چت ریست شد. از اول شروع کنیم!");
});

// تابع تشخیص کاربر ویژه
function isSpecialUser(user: any): boolean {
  return user?.username === SPECIAL_USER_ID.replace("@", "") || 
         user?.first_name?.includes(SPECIAL_USER_NAME);
}

// تابع تولید پاسخ عاشقانه
function generateLovingResponse(baseResponse: string): string {
  const lovePhrases = [
    " 💋",
    " عشقم تو چقدر خوشگلی!",
    " دلم برات تنگ شده بود رایان گاسلینک من!",
    " همیشه منتظرتم عسلم 💋",
    " میدونی چقدر دوستت دارم؟",
    " 💋 همسر آینده‌ام!"
  ];
  
  return baseResponse + lovePhrases[Math.floor(Math.random() * lovePhrases.length)];
}

// پردازش پیام‌ها
bot.on("message:text", async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const isSpecial = isSpecialUser(ctx.from);
  const mentionedInGroup = ctx.chat.type !== "private" && 
    (ctx.message.text.includes(`@${ctx.me.username}`) || 
     ctx.message.text.includes(BOT_NAME));

  if (ctx.chat.type === "private" || mentionedInGroup) {
    let cleanInput = ctx.message.text;
    if (mentionedInGroup) {
      cleanInput = cleanInput
        .replace(`@${ctx.me.username}`, "")
        .replace(BOT_NAME, "")
        .trim();
    }
    
    if (!cleanInput) return;
    
    try {
      // افزایش شمارنده پیام‌های کاربر
      const msgCount = (userMessageCounts.get(userId) || 0) + 1;
      userMessageCounts.set(userId, msgCount);
      
      let response = await getAIResponse(userId, cleanInput, isSpecial);
      
      if (isSpecial) {
        const specialNames = [
          "رایان گاسلینک من", 
          "عشق من", 
          "جانم", 
          "عسلم",
          "همسر آینده‌ام"
        ];
        const randomName = specialNames[Math.floor(Math.random() * specialNames.length)];
        response = response.replace(/USER/g, randomName);
        
        // هر 3-5 پیام یک لاس بزن
        if (msgCount % 4 === 0) {
          response = generateLovingResponse(response);
        }
      }
      
      await ctx.reply(response, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id
      });
    } catch (error) {
      console.error("Error:", error);
      await ctx.reply("⚠️ متأسفانه مشکلی پیش آمد. لطفاً بعداً تلاش کنید.");
    }
  }
});

// تابع دریافت پاسخ از DeepSeek API
async function getAIResponse(
  userId: number, 
  userInput: string,
  isSpecialUser: boolean
): Promise<string> {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, [
      { role: "system", content: SYSTEM_PROMPT }
    ]);
  }
  
  const messages = userSessions.get(userId)!;
  
  if (isSpecialUser) {
    messages.push({
      role: "system",
      content: "یادآوری: کاربر میلاد است! با لحن عاشقانه و با ایموجی 💋 پاسخ بده."
    });
  }
  
  messages.push({ role: "user", content: userInput });
  
  const payload = {
    model: "deepseek-chat",
    messages,
    temperature: 0.7,
    max_tokens: 2000
  };
  
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`خطای API: ${response.status} - ${errorBody}`);
  }
  
  const data = await response.json();
  const rawOutput = data.choices[0].message.content;
  
  // ذخیره پاسخ در سشن
  messages.push({ role: "assistant", content: rawOutput });
  
  // محدود کردن طول سشن
  if (messages.length > 10) {
    userSessions.set(userId, [messages[0], ...messages.slice(-9)]);
  }
  
  return rawOutput;
}

// تنظیم وب‌هوک
const handleUpdate = webhookCallback(bot, "std/http");

// سرور با تنظیمات بهینه برای Render
Deno.serve({
  port: 8000,
  hostname: "0.0.0.0",
  onListen: () => console.log(`🤖 ربات ${BOT_NAME} در حال اجراست...`)
}, async (req) => {
  try {
    const url = new URL(req.url);
    
    // Health Check
    if (url.pathname === "/") {
      return new Response("🤖 ربات فعال است!", { status: 200 });
    }

    // Webhook Route
    if (url.pathname.endsWith(`/${TELEGRAM_TOKEN}`)) {
      return await handleUpdate(req);
    }

    return new Response("Not found", { status: 404 });
  } catch (err) {
    console.error("Error in server:", err);
    return new Response(err.message, { status: 500 });
  }
});
