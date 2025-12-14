// ==================== WEB SERVER (Render uchun) ====================
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Oddiy web sahifa
app.get('/', (req, res) => {
    res.send('🤖 Telegram AI Bot ishlayapti!');
});

app.listen(PORT, () => {
    console.log(`🌐 Web server ${PORT}-portda ishga tushdi`);
});

// ==================== TELEGRAM BOT ====================
const TelegramBot = require('node-telegram-bot-api');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Tokenlarni tekshirish
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TELEGRAM_TOKEN || !OPENAI_API_KEY) {
    console.error('❌ XATO: .env faylda TELEGRAM_BOT_TOKEN yoki GOOGLE_AI_KEY yoʻq!');
    console.error('Iltimos, .env faylini yarating va tokenlarni kiriting:');
    console.error('TELEGRAM_BOT_TOKEN=7663962484:AAHvq1F8ktg11UKQb6t3wfRa_41kfo4Pkuk');
    console.error('GOOGLE_AI_KEY=AIzaSyCP...mEbE');
    process.exit(1);
}

// Botni yaratish (polling rejimi)
const bot = new TelegramBot(TELEGRAM_TOKEN, {
    polling: {
        interval: 300,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

// Google AI ni sozlash
const genAI = new GoogleGenerativeAI(OPENAI_API_KEY);

// Modelni tanlash - eng ishonchli variantlar
// let model;
// Eng ishonchli variant
// index.js da:
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// Kunlik: 60 so'rov (3 baravar ko'p)
console.log('✅ Google AI modeli: gemini-1.0-pro');
// try {
//     model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
//     console.log('✅ Google AI modeli: gemini-1.5-flash-latest');
// } catch (error) {
//     try {
//         model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
//         console.log('✅ Google AI modeli: gemini-1.5-flash');
//     } catch (error2) {
//         try {
//             model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
//             console.log('✅ Google AI modeli: gemini-1.0-pro');
//         } catch (error3) {
//             console.error('❌ Google AI modeli topilmadi!');
//             console.error('Qoʻllab-quvvatlanadigan modellar:');
//             console.error('1. gemini-1.5-flash-latest');
//             console.error('2. gemini-1.5-flash');
//             console.error('3. gemini-1.0-pro');
//             process.exit(1);
//         }
//     }
// }

// ==================== YORDAMCHI FUNKTSIYALAR ====================

// Foydalanuvchi sessiyalari
const userSessions = new Map();

// Sessiyani olish
function getSession(chatId) {
    if (!userSessions.has(chatId)) {
        userSessions.set(chatId, {
            history: [],
            lastActivity: Date.now()
        });
    }
    return userSessions.get(chatId);
}

// Sessiyani tozalash
function clearSession(chatId) {
    userSessions.delete(chatId);
}

// Matnni tozalash (backslash larsiz)
function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    
    // Faqat kerakli belgilarni escape qilish
    const escapeMap = {
        '_': '\\_',
        '*': '\\*',
        '[': '\\[',
        ']': '\\]',
        '(': '\\(',
        ')': '\\)',
        '~': '\\~',
        '`': '\\`',
        '>': '\\>',
        '#': '\\#',
        '+': '\\+',
        '-': '\\-',
        '=': '\\=',
        '|': '\\|',
        '{': '\\{',
        '}': '\\}',
        '.': '\\.',
        '!': '\\!'
    };
    
    let result = text;
    
    // Escape qilish
    Object.entries(escapeMap).forEach(([char, escaped]) => {
        result = result.replace(new RegExp(`\\${char}`, 'g'), escaped);
    });
    
    // Ortiqcha backslash larni olib tashlash
    result = result.replace(/\\\\/g, '\\');
    
    // Uzunlik chegarasi
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
    
    const message = `Assalomu alaykum, ${firstName}!\n\n` +
                   `🤖 Men Google Gemini AI yordamida ishlaydigan yordamchi botman.\n\n` +
                   `Menga istalgan savolingizni yozing:\n` +
                   `• Dasturlash haqida\n` +
                   `• Matematika\n` +
                   `• Tarjima\n` +
                   `• Va boshqa har qanday mavzu\n\n` +
                   `📌 Komandalar:\n` +
                   `/help - Yordam\n` +
                   `/clear - Chatni tozalash\n` +
                   `/info - Bot haqida`;
    
    bot.sendMessage(chatId, message);
});

// /help komandasi
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const message = `🆘 YORDAM\n\n` +
                   `Botdan foydalanish juda oddiy:\n` +
                   `1. Menga savol yozing\n` +
                   `2. Men Google AI yordamida javob beraman\n` +
                   `3. Suhbatni davom ettiring\n\n` +
                   `⚠️ Eslatma:\n` +
                   `• Savollaringiz aniq bo'lsin\n` +
                   `• Uzoq javoblar bir necha qismga bo'linishi mumkin\n` +
                   `• Agar javob to'liq bo'lmasa, "davom eting" deb yozing`;
    
    bot.sendMessage(chatId, message);
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
                   `Platforma: Google Gemini AI\n` +
                   `Model: Gemini 1.5 Flash\n` +
                   `Foydalanuvchilar: ${userSessions.size}\n` +
                   `Holat: Faol ✅\n\n` +
                   `Bot @zyobe tomonidan yaratilgan`;
    
    bot.sendMessage(chatId, message);
});

// ==================== ASOSIY XABAR QAYTA ISHLASH ====================

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userId = msg.from?.id;
    
    // 1. Faqat haqiqiy foydalanuvchi xabarlarini qayta ishlash
    if (!userId || !text || text.trim() === '') return;
    if (text.startsWith('/')) return;
    if (msg.from?.is_bot) return;
    
    try {
        // "Yozmoqda..." statusi
        await bot.sendChatAction(chatId, 'typing');
        
        // Google AI ga so'rov
        console.log(`[${chatId}] So'rov: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        
        const chat = model.startChat({
            history: getSession(chatId).history || [],
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.7,
            },
        });
        
        const result = await chat.sendMessage(text);
        let response = result.response.text();
        
        // ========== ✅ TO'G'RILANGAN QISMI ==========
        
        // 1. AI ning uzun tanishtirishini qisqartirish
        if (response.includes("Men ko'p narsalarni qila olaman") || 
            response.includes("Matn yaratish:") || 
            response.length > 1000 && response.includes("Men")) {
            
            // Faqat birinchi 2 qatorni saqlash
            const lines = response.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 3) {
                response = lines.slice(0, 2).join('\n') + '\n\n🤖 Davomini so\'rang!';
            }
        }
        
        // 2. Citation larni olib tashlash
        response = response.replace(/\[citation:\d+\]/g, '');
        
        // 3. Formatlash belgilarini escape qilish
        const escapeChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
        escapeChars.forEach(char => {
            response = response.split(char).join('\\' + char);
        });
        
        // 4. Ortiqcha backslash larni olib tashlash
        response = response.replace(/\\\\/g, '\\');
        
        // 5. Uzunlik chegarasi
        const MAX_LENGTH = 4000;
        if (response.length > MAX_LENGTH) {
            response = response.substring(0, MAX_LENGTH - 100) + '\n\n... (javob juda uzun)';
        }
        
        // ========== SHU YERGACHA ==========
        
        // Sessiya tarixini yangilash (agar kerak bo'lsa)
        const session = getSession(chatId);
        session.lastActivity = Date.now();
        if (session.history) {
            session.history.push({ role: "user", parts: [{ text: text }] });
            session.history.push({ role: "model", parts: [{ text: response }] });
            
            if (session.history.length > 6) {
                session.history = session.history.slice(-6);
            }
        }
        
        // Javobni yuborish
        await bot.sendMessage(chatId, response);
        console.log(`[${chatId}] Javob yuborildi (${response.length} belgi)`);
        
    } catch (error) {
        console.error(`[${chatId}] Xato:`, error.message);
        
        let errorMessage;
        
        if (error.message.includes('API key') || error.message.includes('quota')) {
            errorMessage = '❌ Bot vaqtinchalik ishlamayapti, keltirilgan noqulayliklar uchun uzur!';
        } else if (error.message.includes('safety')) {
            errorMessage = '⚠️ So\'rov xavfsizlik siyosatiga zid.\nBoshqa shaklda so\'rang.';
        } else if (error.message.includes('404') || error.message.includes('model')) {
            errorMessage = '🤖 AI modeli topilmadi.\n/model gemini-1.5-flash ga o\'zgartirildi.';
        } else {
            errorMessage = '❌ Texnik xatolik.\n/clear bilan yangilang.';
        }
        
        bot.sendMessage(chatId, errorMessage);
    }
});
// ==================== BOSHQA XABAR TURLARI ====================

bot.on(['sticker', 'photo', 'voice', 'video', 'document'], (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '📁 Kechirasiz, men faqat matnli xabarlarni qayta ishlay olaman.\nIltimos, savolingizni matn shaklida yozing.');
});

// ==================== SERVER ISHGA TUSHISHI ====================

// Eski sessiyalarni tozalash (har 30 daqiqada)
setInterval(() => {
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;
    
    for (const [chatId, session] of userSessions.entries()) {
        if (now - session.lastActivity > THIRTY_MINUTES) {
            userSessions.delete(chatId);
        }
    }
}, 30 * 60 * 1000);

// Bot ishga tushganligi haqida xabar
console.log('='.repeat(50));
console.log('🤖 TELEGRAM AI BOT ISHGA TUSHMOQDA...');
console.log('='.repeat(50));
console.log(`📱 Bot foydalanuvchilari: ${userSessions.size}`);
console.log(`🔑 Telegram Token: ${TELEGRAM_TOKEN ? '✅ MAVJUD' : '❌ YOQ'}`);
console.log(`🤖 Google AI Key: ${OPENAI_API_KEY ? '✅ MAVJUD' : '❌ YOQ'}`);
console.log(`🌐 Web Server: ${PORT}-portda`);
console.log('='.repeat(50));
console.log('✅ Bot faol. Xabarlarni kutmoqda...\n');