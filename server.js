require('dotenv').config();
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const STAR_API_URL = "https://data.explore.star.fr//api/explore/v2.1/catalog/datasets/tco-metro-lignes-etat-tr/records";

if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("ERREUR : Les variables TELEGRAM_TOKEN ou CHAT_ID ne sont pas définies !");
    process.exit(1);
}

let lastStatus = "OK"; 

async function sendNotification(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log("Notification envoyée !");
    } catch (error) {
        console.error("Erreur Telegram :", error.message);
    }
}

async function checkMetroStatus() {
    // console.log("Vérification du statut du Métro B...");
    try {
        const response = await axios.get(STAR_API_URL, {
            params: {
                where: "nomcourt='b'",
                limit: 1
            }
        });

        const record = response.data.results[0];
        if (!record) return;

        const currentStatus = record.etat;
        // console.log(`Statut actuel du Métro B : ${currentStatus}`);

        if (currentStatus !== lastStatus) { 
            if (currentStatus !== "OK") {
                const alertMsg = `🚨 *ALERTE MÉTRO B RENNES*\n\nÉtat : *${currentStatus}*`; 
                await sendNotification(alertMsg);
            } else if (currentStatus == "OK") {
                await sendNotification("✅ *MÉTRO B : Retour à la normale.* Le trafic reprend son cours.");
            }
            lastStatus = currentStatus;
        }
    } catch (error) {
        console.error("Erreur API STAR :", error.message);
    }
}

// Vérification toutes les minutes
setInterval(checkMetroStatus, 60000);

console.log("Serveur de surveillance du Métro B démarré...");