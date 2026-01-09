const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');
const { cmd, commands } = require('../command');

// ============================
// 1. AUTO RECORDING & TYPING
// ============================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        // Auto Recording
        if (config.AUTO_RECORDING === 'true') {
            await conn.sendPresenceUpdate('recording', from);
        }
        // Auto Typing
        else if (config.AUTO_TYPING === 'true') {
            await conn.sendPresenceUpdate('composing', from);
        }
    } catch (e) {
        console.log("Presence update error:", e);
    }
});

// ============================
// 2. AUTO REPLY
// ============================
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/refs/heads/main/settings/autoreply.json';
        
        // Only fetch if Auto Reply is enabled
        if (config.AUTO_REPLY === 'true') {
            const res = await axios.get(GITHUB_RAW_URL);
            const data = res.data;

            for (const text in data) {
                if (body.toLowerCase() === text.toLowerCase()) {
                    await m.reply(data[text]);
                    break; 
                }
            }
        }
    } catch (err) {
        console.error('Auto-reply fetch error:', err.message);
    }
});

// ============================
// 3. AUTO VOICE
// ============================
cmd({
    on: "body"
}, 
async (conn, mek, m, { from, body, isOwner }) => {
    try {
        const jsonUrl = "https://raw.githubusercontent.com/TECH-HORIZON-SCHOOL-OFFICIAL/PROJECT_HORIZON/refs/heads/main/settings/autovoice.json";

        // Only fetch if Auto Voice is enabled
        if (config.AUTO_VOICE === "true") {
            const res = await axios.get(jsonUrl);
            const voiceMap = res.data;

            for (const keyword in voiceMap) {
                if (body.toLowerCase() === keyword.toLowerCase()) {
                    const audioUrl = voiceMap[keyword];

                    // Ensure it's a .mp3 or .m4a file
                    if (!audioUrl.endsWith(".mp3") && !audioUrl.endsWith(".m4a")) {
                        // Optional: Un-comment below to debug, but usually better to ignore silently to avoid spam
                        // return conn.sendMessage(from, { text: "Invalid audio format." }, { quoted: m });
                        continue;
                    }

                    await conn.sendPresenceUpdate("recording", from);
                    await conn.sendMessage(from, {
                        audio: { url: audioUrl },
                        mimetype: "audio/mpeg",
                        ptt: true
                    }, { quoted: m });
                }
            }
        }
    } catch (e) {
        console.error("AutoVoice error:", e);
    }
});

// ============================
// 4. ANTI-LINK
// ============================
const linkPatterns = [
    /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
    /^https?:\/\/(www\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)$/,
    /wa\.me\/\S+/gi,
    /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
    /https?:\/\/youtu\.be\/\S+/gi,
    /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
    /https?:\/\/fb\.me\/\S+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
    /https?:\/\/ngl\/\S+/gi,
    /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
    /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
];

cmd({
    on: 'body'
}, async (conn, mek, m, { from, body, sender, isGroup, isAdmins, isBotAdmins }) => {
    try {
        // Validation: Must be group, Sender shouldn't be admin, Bot must be admin
        if (!isGroup || isAdmins || !isBotAdmins) {
            return;
        }

        const containsLink = linkPatterns.some(pattern => pattern.test(body));

        if (containsLink && config.DELETE_LINKS === 'true') {
            await conn.sendMessage(from, { delete: m.key }, { quoted: m });
            // Optional: Send a warning message
            // await conn.sendMessage(from, { text: "Links are not allowed here!" }, { quoted: m });
        }
    } catch (error) {
        console.error("Anti-link error:", error);
    }
});
