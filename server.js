require('dotenv').config();
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const STAR_API_URL = "https://data.explore.star.fr//api/explore/v2.1/catalog/datasets/tco-metro-lignes-etat-tr/records";

if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("ERREUR : Les variables TELEGRAM_TOKEN ou CHAT_ID ne sont pas définies !");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

let lastStatus = "OK"; 

async function fetchStatus() {
    try {
        const response = await axios.get(STAR_API_URL, {
            params: {
                where: "nomcourt='b'",
                limit: 1
            }
        });
        const record = response.data.results[0];
        return record ? record.etat : "Indisponible";
    } catch (error) {
        console.error("Erreur API STAR :", error.message);
        return "Erreur API";
    }
}

async function checkMetroStatus() {
    try {
        const currentStatus = await fetchStatus();

        if (currentStatus === "Erreur API" || currentStatus === "Indisponible") return;

        if (currentStatus !== lastStatus) { 
            if (currentStatus !== "OK") {
                const alertMsg = `🚨 *ALERTE MÉTRO B RENNES*\n\nÉtat : *${currentStatus}*`; 
                await bot.sendMessage(CHAT_ID, alertMsg, { parse_mode: "Markdown" });
            } else if (currentStatus == "OK") {
                await bot.sendMessage(CHAT_ID, "✅ *MÉTRO B : Le service est rétabli.*", { parse_mode: "Markdown" });
            }
            lastStatus = currentStatus;
        }
        if (currentStatus === "OK") {
            await bot.sendMessage(CHAT_ID, "✅ *MÉTRO B : Toujours OK.*", { parse_mode: "Markdown" });
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du statut :", error.message);
    }
    
}

bot.on('message', async (msg) => {
    const text = msg.text ? msg.text.toLowerCase() : "";
    if (text === "?" || text === "etat") {
        const currentStatus = await fetchStatus();
        await bot.sendMessage(msg.chat.id, `🤖 *Je suis toujours up.*\n\nÉtat actuel du Métro B : *${currentStatus}*`, { parse_mode: 'Markdown' });
    }
});

async function main() {    
    try {
        await bot.sendMessage(CHAT_ID, "✅ *MÉTRO B : Serveur démarré.*", { parse_mode: "Markdown" });

        setInterval(checkMetroStatus, 60000);
        
        setInterval(async () => {
            try {
                await bot.sendMessage(CHAT_ID, "⏰ *Rappel quotidien...*", { parse_mode: "Markdown"});
            } catch (e) { console.error("Erreur rappel:", e); }
        }, 86400000);

    } catch (error) {
        console.error("Le bot n'a pas pu démarrer :", error.message);
    }
}

main();