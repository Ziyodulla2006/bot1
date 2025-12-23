// ==================== WEB SERVER (Render uchun) ====================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UptimeRobot uchun endpointlar
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🤖 Telegram AI Bot</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                h1 { color: #0088cc; }
                .status { background: #f0f0f0; padding: 20px; border-radius: 10px; display: inline-block; }
            </style>
        </head>
        <body>
            <h1>🤖 Telegram AI Bot (Groq)</h1>
            <div class="status">
                <p><strong>Holat:</strong> ✅ Faol</p>
                <p><strong>Platforma:</strong> Groq AI</p>
                <p><strong>Model:</strong> llama-3.3-70b-versatile</p>
                <p><strong>Server vaqti:</strong> ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);
});

app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Bot faol',
        timestamp: new Date().toISOString(),
        service: 'telegram-groq-bot',
        uptime: process.uptime()
    });
});

app.get('/health', (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        },
        bot: {
            users: userSessions ? userSessions.size : 0,
            status: 'active'
        }
    });
});

// ==================== TELEGRAM BOT ====================
const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
require('dotenv').config();

// Tokenlarni tekshirish
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!TELEGRAM_TOKEN || !GROQ_API_KEY) {
    console.error('❌ XATO: Environment variables yoʻq!');
    console.error('TELEGRAM_TOKEN va GROQ_API_KEY sozlanmagan');
    console.error('Render da Environment Variables qoʻshing!');
    process.exit(1);
}

// Botni yaratish
const bot = new TelegramBot(TELEGRAM_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Groq AI ni sozlash
const groq = new Groq({ 
    apiKey: GROQ_API_KEY 
});

// Modelni tanlash
const model = 'llama-3.3-70b-versatile';
console.log(`✅ Groq AI modeli: ${model}`);

// ==================== YORDAMCHI FUNKTSIYALAR ====================

// Foydalanuvchi sessiyalari
const userSessions = new Map();

// Sessiyani olish
function getSession(chatId) {
    if (!userSessions.has(chatId)) {
        userSessions.set(chatId, {
            history: [],
            lastActivity: Date.now(),
            messageCount: 0
        });
    }
    return userSessions.get(chatId);
}

// Sessiyani tozalash
function clearSession(chatId) {
    userSessions.delete(chatId);
}

// Matnni tozalash (soddalashtirilgan versiya)
function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    let result = text;
    
    // 1. Ortiqcha escape belgilarni olib tashlash
    result = result.replace(/\\\\(.)/g, '$1');
    
    // 2. Citation belgilarini olib tashlash
    result = result.replace(/\[citation:\d+\]/gi, '');
    result = result.replace(/\[\d+\]/g, '');
    
    // 3. Ortiqcha formatlash belgilarini olib tashlash
    result = result.replace(/\*\*/g, '');
    result = result.replace(/\*/g, '');
    result = result.replace(/__/g, '');
    result = result.replace(/_/g, '');
    
    // 4. Tozalash
    result = result.trim();
    result = result.replace(/\n{3,}/g, '\n\n');
    
    // 5. AI ning uzun tanishtirishlarini qisqartirish
    const unwantedPatterns = [
        "Ha, men ovozli xabar jo'natishga qodirman",
        "I can help you",
        "Hello! I'm",
        "As an AI assistant"
    ];
    
    unwantedPatterns.forEach(pattern => {
        if (result.includes(pattern) && result.length > 300) {
            const lines = result.split('\n');
            if (lines.length > 3) {
                result = lines.slice(0, 3).join('\n');
            }
        }
    });
    
    // 6. Uzunlik chegarasi
    if (result.length > 4000) {
        result = result.substring(0, 3997) + '...';
    }
    
    return result;
}

// ==================== TELEGRAM KOMANDALARI ====================

// /start komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'Foydalanuvchi';
    const userId = msg.from?.id;
    
    const session = getSession(chatId);
    session.messageCount++;
    
    const message = `Assalomu alaykum, ${firstName}!\n\n` +
                   `🤖 Men Groq AI yordamida ishlaydigan yordamchi botman.\n\n` +
                   `Menga istalgan savolingizni yozing:\n` +
                   `• Dasturlash haqida\n` +
                   `• Matematika\n` +
                   `• Tarjima\n` +
                   `• Va boshqa har qanday mavzu\n\n` +
                   `📌 Komandalar:\n` +
                   `/help - Yordam\n` +
                   `/clear - Chatni tozalash\n` +
                   `/info - Bot haqida\n` +
                   `/stats - Mening statistikam`;
    
    bot.sendMessage(chatId, cleanText(message));
});

// /help komandasi
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const message = `🆘 YORDAM\n\n` +
                   `Botdan foydalanish juda oddiy:\n` +
                   `1. Menga savol yozing\n` +
                   `2. Men Groq AI yordamida javob beraman\n` +
                   `3. Suhbatni davom ettiring\n\n` +
                   `⚠️ Eslatma:\n` +
                   `• Savollaringiz aniq bo'lsin\n` +
                   `• Uzun javoblar bir necha qismga bo'linishi mumkin\n` +
                   `• Agar javob to'liq bo'lmasa, "davom eting" deb yozing`;
    
    bot.sendMessage(chatId, cleanText(message));
});

// /clear komandasi
bot.onText(/\/clear/, (msg) => {
    const chatId = msg.chat.id;
    clearSession(chatId);
    bot.sendMessage(chatId, '✅ Chat tarixi tozalandi! Yangi suhbat boshlaymiz.');
});

// /info komandasi
bot.onText(/\/info/, (msg) => {
    const chatId = msg.chat.id;
    const message = `🤖 BOT HAQIDA\n\n` +
                   `Platforma: Groq AI\n` +
                   `Model: ${model}\n` +
                   `Foydalanuvchilar: ${userSessions.size}\n` +
                   `Holat: Faol ✅\n\n` +
                   `📍 Host: Render.com\n` +
                   `⏰ Uptime: ${Math.floor(process.uptime())} soniya\n\n` +
                   `Bot @zyobe tomonidan yaratilgan`;
    
    bot.sendMessage(chatId, cleanText(message));
});

// /stats komandasi
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const session = getSession(chatId);
    const memory = process.memoryUsage();
    
    const message = `📊 STATISTIKA\n\n` +
                   `Sizning sessiyangiz:\n` +
                   `• Xabarlar: ${session.messageCount} ta\n` +
                   `• Faollik: ${new Date(session.lastActivity).toLocaleTimeString()}\n\n` +
                   `Bot statistikasi:\n` +
                   `• Faol foydalanuvchilar: ${userSessions.size} ta\n` +
                   `• Bot ishlagan vaqt: ${Math.floor(process.uptime())} soniya\n` +
                   `• Xotira: ${Math.round(memory.heapUsed / 1024 / 1024)}MB`;
    
    bot.sendMessage(chatId, cleanText(message));
});

// ==================== ASOSIY XABAR QAYTA ISHLASH ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from?.id;
    
    // Faqat haqiqiy foydalanuvchi xabarlarini qayta ishlash
    if (!userId || !text || text.trim() === '') return;
    if (text.startsWith('/')) return;
    if (msg.from?.is_bot) return;
    
    try {
        // "Yozmoqda..." statusi
        await bot.sendChatAction(chatId, 'typing');
        
        console.log(`[${new Date().toLocaleTimeString()}] [${chatId}] So'rov: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        
        const session = getSession(chatId);
        const history = session.history || [];
        session.messageCount++;
        session.lastActivity = Date.now();
        
        // Groq AI ga so'rov yuborish
        const chatCompletion = await groq.chat.completions.create({
            model: model,
            messages: [
                ...history,
                { role: "user", content: text }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });
        
        let response = chatCompletion.choices[0]?.message?.content || "Javob olinmadi";
        
        // AI javobini tozalash
        response = cleanText(response);
        
        // Sessiya tarixini yangilash
        if (session.history) {
            session.history.push({ role: "user", content: text });
            session.history.push({ role: "assistant", content: response });
            
            // Tarixni 8 ta xabargacha saqlash
            if (session.history.length > 8) {
                session.history = session.history.slice(-8);
            }
        }
        
        // Javobni yuborish
        await bot.sendMessage(chatId, response);
        
        console.log(`[${new Date().toLocaleTimeString()}] [${chatId}] Javob yuborildi (${response.length} belgi)`);
        
    } catch (error) {
        console.error(`[${chatId}] Xato:`, error.message);
        
        let errorMessage;
        
        if (error.message.includes('API key') || error.status === 401) {
            errorMessage = '❌ Groq API kaliti noto‘g‘ri. Sozlamalarni tekshiring.';
        } else if (error.message.includes('quota') || error.status === 429) {
            errorMessage = '⚠️ So‘rovlar chegarasiga yetildi. 1 daqiqadan keyin urinib ko‘ring.';
        } else if (error.message.includes('model')) {
            errorMessage = `🤖 '${model}' modeli topilmadi. Texnik muammo.`;
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage = '🌐 Internet aloqasi muammosi. Qayta urinib ko‘ring.';
        } else {
            errorMessage = '❌ Texnik xatolik.\n/clear bilan yangilang yoki keyinroq urinib ko‘ring.';
        }
        
        errorMessage = cleanText(errorMessage);
        bot.sendMessage(chatId, errorMessage);
    }
});

// ==================== BOSHQA XABAR TURLARI ====================

bot.on(['sticker', 'photo', 'voice', 'video', 'document'], (msg) => {
    const chatId = msg.chat.id;
    const message = '📁 Kechirasiz, men faqat matnli xabarlarni qayta ishlay olaman.\nIltimos, savolingizni matn shaklida yozing.';
    bot.sendMessage(chatId, cleanText(message));
});

// ==================== SERVER ISHGA TUSHISHI ====================

// Eski sessiyalarni tozalash (har 1 soatda)
setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    let clearedCount = 0;
    
    for (const [chatId, session] of userSessions.entries()) {
        if (now - session.lastActivity > ONE_HOUR) {
            userSessions.delete(chatId);
            clearedCount++;
        }
    }
    
    if (clearedCount > 0) {
        console.log(`[${new Date().toLocaleTimeString()}] ${clearedCount} ta eski sessiya tozalandi`);
    }
}, 60 * 60 * 1000);

// Server ishga tushishi
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 TELEGRAM AI BOT RENDER DA ISHGA TUSHMOQDA...');
    console.log('='.repeat(60));
    console.log(`📅 Sana: ${new Date().toLocaleString()}`);
    console.log(`🌐 Server: ${PORT}-portda (0.0.0.0)`);
    console.log(`🤖 Platforma: Groq AI`);
    console.log(`🧠 Model: ${model}`);
    console.log(`👤 Foydalanuvchilar: ${userSessions.size}`);
    console.log(`🔑 Telegram Token: ${TELEGRAM_TOKEN ? '✅ MAVJUD' : '❌ YOQ'}`);
    console.log(`⚡ Groq API Key: ${GROQ_API_KEY ? '✅ MAVJUD' : '❌ YOQ'}`);
    console.log(`💾 Node.js: ${process.version}`);
    console.log('='.repeat(60));
    console.log('✅ Bot faol. Xabarlarni kutmoqda...\n');
    
    // Bot ishga tushganini admin ga xabar berish (ixtiyoriy)
    const ADMIN_ID = 6504312181; // O'zingizning ID'ingiz
    try {
        bot.sendMessage(ADMIN_ID, 
            `🚀 Bot Render'da ishga tushdi!\n` +
            `⏰ Vaqt: ${new Date().toLocaleString()}\n` +
            `🌐 Port: ${PORT}\n` +
            `🤖 Model: ${model}\n` +
            `🔄 Uptime: 0 soniya`
        ).then(() => {
            console.log('✅ Admin ga xabar yuborildi');
        }).catch(err => {
            console.log('⚠️ Admin ga xabar yuborishda xato:', err.message);
        });
    } catch (err) {
        console.log('⚠️ Admin xabar yuborishda xato:', err.message);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM signal qabul qilindi. Server yopilmoqda...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 CTRL+C bosildi. Server yopilmoqda...');
    bot.stopPolling();
    process.exit(0);
});