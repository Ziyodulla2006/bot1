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
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
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
    
    // Komandalarni o'tkazib yuborish
    if (!text || text.startsWith('/')) {
        return;
    }
    
    try {
        // "Yozmoqda..." statusi
        await bot.sendChatAction(chatId, 'typing');
        
        // Sessiyani yangilash
        const session = getSession(chatId);
        session.lastActivity = Date.now();
        
        // Google AI ga so'rov
        console.log(`[${chatId}] So'rov: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
        
        const chat = model.startChat({
            history: session.history,
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.7,
            },
        });
        
        const result = await chat.sendMessage(text);
        let response = result.response.text();
        
        // Sessiya tarixini yangilash
        session.history.push({
            role: "user",
            parts: [{ text: text }]
        });
        session.history.push({
            role: "model",
            parts: [{ text: response }]
        });
        
        // Tarixni cheklash (oxirgi 4 ta xabar)
        if (session.history.length > 4) {
            session.history = session.history.slice(-4);
        }
        
        // Javobni tozalash va yuborish
        response = cleanText(response);
        
        // Uzoq javoblarni bo'laklarga ajratish
        if (response.length > 3000) {
            const parts = [];
            let current = response;
            
            while (current.length > 3000) {
                // So'nggi bo'sh joy yoki nuqtada bo'lish
                let splitIndex = current.lastIndexOf('\n\n', 3000);
                if (splitIndex === -1) splitIndex = current.lastIndexOf('. ', 3000);
                if (splitIndex === -1) splitIndex = current.lastIndexOf(' ', 3000);
                if (splitIndex === -1) splitIndex = 3000;
                
                parts.push(current.substring(0, splitIndex + 1));
                current = current.substring(splitIndex + 1);
            }
            
            if (current.trim()) {
                parts.push(current.trim());
            }
            
            // Har bir bo'lakni yuborish
            for (let i = 0; i < parts.length; i++) {
                await bot.sendMessage(chatId, `${parts[i]}\n\n(${i + 1}/${parts.length})`);
                if (i < parts.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else {
            // Oddiy javobni yuborish
            await bot.sendMessage(chatId, response);
        }
        
        console.log(`[${chatId}] Javob yuborildi (${response.length} belgi)`);
        
    } catch (error) {
        console.error(`[${chatId}] Xato:`, error.message);
        
        let errorMessage = '❌ Kechirasiz, xatolik yuz berdi!\n\n';
        
        if (error.message.includes('API key') || error.message.includes('quota')) {
            errorMessage += 'Sabab: API kaliti yoki limit bilan muammo.\n';
            errorMessage += 'Yechim: Google AI Studio dan yangi kalit oling.';
        } else if (error.message.includes('safety')) {
            errorMessage += 'Sabab: Soʻrov xavfsizlik siyosatiga zid.\n';
            errorMessage += 'Yechim: Soʻrovni boshqa shaklda yozing.';
        } else {
            errorMessage += 'Sabab: Ichki server xatosi.\n';
            errorMessage += 'Yechim: /clear bilan chatni tozalang va qayta urinib koʻring.';
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