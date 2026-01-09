const { cmd } = require('../command');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const config = require('../config');
const { URL } = require("url");
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
} = require("../lib/functions");
const moment = require('moment-timezone');
const pkg = require("../package.json");
const {
  generateForwardMessageContent,
  prepareWAMessageFromContent,
  generateWAMessageContent,
  generateWAMessageFromContent
} = require("@whiskeysockets/baileys");

// ================= Helper Functions =================
function formatUptime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs}h ${mins}m ${secs}s`;
}

function getMemoryUsage() {
  const used = process.memoryUsage();
  return {
    heap: (used.heapUsed / 1024 / 1024).toFixed(2),
    rss: (used.rss / 1024 / 1024).toFixed(2),
    total: (os.totalmem() / 1024 / 1024).toFixed(0),
    free: (os.freemem() / 1024 / 1024).toFixed(2)
  };
}

function getTotalUsers() {
  try {
    return global.db && global.db.users
      ? Object.keys(global.db.users).length
      : 0;
  } catch {
    return 0;
  }
}

cmd({
      pattern: "alive",
      alias: ["status"],
      desc: "Check if the bot is alive",
      category: "main",
      react: "👋",
      filename: __filename,
    },
    async (conn, mek, m, { from, pushname, reply, setting, runtime }) => {
      try {
        // Time & Date calculations
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: true });
        const date = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
        
        let aliveText = `👋 *HI*, *${pushname}* *I Am Alive Now*
  
╭─「 ᴅᴀᴛᴇ ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 」
│📅 *Date*: ${date}
│⏰ *Time*: ${time}
╰──────────●●►
  
╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」
│👤 *User*: ${pushname}
│✒ *Prefix*: .
│🧬 *Version*: 0.0.2
│📟 *Uptime*: ${runtime(process.uptime())}
│📂 *Memory*: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
╰──────────●●►

╭──────────●●►
│ *Hello, I am alive now!!*
╰──────────●●►
  
🔢 *Reply below number*
  
1 │❯❯◦ COMMANDS MENU
2 │❯❯◦ BOT SPEED
  
*© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*`;

        // Sending message with image
        const vv = await conn.sendMessage(from, { 
            image: { url: config.MENU_IMAGE_URL },
            caption: aliveText 
        }, { quoted: mek });

        // Handling replies (1 or 2)
        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const selectedOption = msg.message.extendedTextMessage.text.trim();
            const isReplyToAlive = msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id;

            if (isReplyToAlive) {
                if (selectedOption === '1') {
                    await conn.sendMessage(from, { text: '.menu' }, { quoted: msg });
                } else if (selectedOption === '2') {
                    await conn.sendMessage(from, { text: '.ping' }, { quoted: msg });
                }
            }
        });

      } catch (e) {
        console.error("Alive Command Error:", e);
        reply(`❌ Error: ${e.message}`);
      }
    }
);


// ================= PING Command =================
cmd({
  pattern: "ping",
  alias: ["speed", "pong"],
  desc: "Check bot's response time.",
  category: "main",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const startTime = Date.now();
    const msg = await conn.sendMessage(from, { text: '*𝙿𝙸𝙽𝙶𝙸𝙽𝙶...*' });
    const endTime = Date.now();
    const ping = endTime - startTime;

    await conn.sendMessage(from, {
      text: `*⚡ Pong : ${ping}ms*`
    }, { quoted: msg });

  } catch (e) {
    console.error("Ping Command Error:", e);
    reply(`❌ ${e.message}`);
  }
});

// ================= RUNTIME Command =================
cmd({
  pattern: "runtime",
  desc: "Show bot uptime only.",
  category: "main",
  react: "⏳",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const text = `⏱ Bot Uptime: *${formatUptime(process.uptime())}*`;
    await conn.sendMessage(from, { text }, { quoted: mek });
  } catch (e) {
    console.error("Runtime Command Error:", e);
  }
});

// ================= TIME Command =================
cmd({
  pattern: "time",
  desc: "Show current SL date & time.",
  category: "main",
  react: "🕒",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const currentTime = moment().tz("Asia/Colombo");
    const date = currentTime.format("dddd, D MMMM YYYY");
    const time = currentTime.format("hh:mm:ss A");
    const msg = `📅 Today is *${date}*\n⏰ Current Time: *${time}*`;

    await conn.sendMessage(from, { text: msg }, { quoted: mek });
  } catch (e) {
    console.error("Time Command Error:", e);
  }
});

// ================= ABOUT Command =================
cmd({
  pattern: "about",
  desc: "Show bot information.",
  category: "main",
  react: "ℹ️",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const caption = `🤖 *Bot Info*
• Name       : Vilon-X-MD
• Version    : ${pkg.version}
• Owner      : Isira Induwara
• Framework  : Node.js ${process.version}
• Platform   : ${os.type()} ${os.arch()}
• Library    : Baileys WhatsApp API

> ${config.DESCRIPTION}`;

    await conn.sendMessage(from, {
      image:  { url: config.MENU_IMAGE_URL },
      caption
    }, { quoted: mek });
  } catch (e) {
    console.error("About Command Error:", e);
  }
});
// ================= SCRIPT Command =================
cmd({
  pattern: "script",
  desc: "Show information about JS bots.",
  category: "main",
  react: "📜",
  filename: __filename
}, async (conn, mek, m, { from }) => {
  try {
    const caption = `🎩 *VES-MD SCRIPT INFO* 🎩

*ENG:* This bot is built using *JavaScript* and the *Node.js* runtime. It uses the *Baileys* library to connect with WhatsApp. JavaScript bots are highly efficient, supporting asynchronous tasks which makes them very fast.

*SIN:* මේ බොට් නිර්මාණය කර ඇත්තේ *JavaScript* භාෂාව සහ *Node.js* තාක්ෂණය භාවිතා කරමිනි. WhatsApp සමඟ සම්බන්ධ වීමට *Baileys* ලයිබ්‍රරිය යොදා ගනී. JavaScript මගින් එකවර කාර්යයන් කිහිපයක් සිදු කිරීමේ හැකියාව (Asynchronous) ඇති බැවින් මෙම බොට්වරු ඉතා වේගවත්ය.

*🔹 Source Code:* https://github.com/
*🔹 Developer:* Isira Induwara

> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*`;

    await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL }, // config හි ඇති menu image එක මෙයට භාවිතා වේ
      caption: caption
    }, { quoted: mek });
    
  } catch (e) {
    console.error("Script Command Error:", e);
    reply("Error occurred while fetching script info.");
  }
});

// ================= 5. OWNER Command =================
cmd({
    pattern: "owner",
    react: "👑", 
    alias: ["king"],
    desc: "Get owner number",
    category: "main",
    filename: __filename
}, 
async (conn, mek, m, { from }) => {
    try {
        const ownerNumber = '94740544995'; 
        const ownerName = 'Mr.isira'; 
        const organization = 'ves-md team';

        const vcard = 'BEGIN:VCARD\n' +
                      'VERSION:3.0\n' +
                      `FN:${ownerName}\n` + 
                      `ORG:${organization};\n` +
                      `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}\n` +
                      'END:VCARD';

        await conn.sendMessage(from, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            }
        });

        await conn.sendMessage(from, { 
            text: `This is the owner's contact: ${ownerName}`,
            contextInfo: {
                mentionedJid: [ownerNumber + '@s.whatsapp.net']
            }
        }, { quoted: mek });
    } catch (error) {
        reply('Sorry, there was an error fetching the owner contact.');
    }
});

// ================= SYSTEM INFO Command =================
cmd({
  pattern: "system",
  alias: ["status", "botinfo"],
  desc: "Check bot runtime, system usage and version",
  category: "main",
  react: "🤖",
  filename: __filename
}, async (conn, mek, m, { reply, from }) => {
  try {
    const mem = getMemoryUsage();
    const uptime = formatUptime(process.uptime());
    const platform = `${os.type()} ${os.arch()} (${os.platform()})`;
    const hostname = os.hostname();
    const cpuLoad = os.loadavg()[0] ? os.loadavg()[0].toFixed(2) : "N/A";
    const totalUsers = getTotalUsers();

    let status = `*╭━━━[ 🤖 BOT SYSTEM INFO ]━━━╮*
*┃* ⏳ Uptime      : ${uptime}
*┃* 🧠 RAM Usage   : ${mem.rss} MB / ${mem.total} MB
*┃* 💻 CPU Load    : ${cpuLoad}%
*┃* 🖥 Platform    : ${platform}
*┃* 🏷 Hostname    : ${hostname}
*┃* 🔋 Status      : Online 24/7
*┃* 🆚 Version     : ${pkg.version}
*┃* 👤 Owner       : Isira Induwara
*╰━━━━━━━━━━━━━━━━━━━━━━╯*

*📊 Extra Info*
*• CPU Cores     : ${os.cpus().length}*
*• Free Memory   : ${mem.free} MB*
*• Total Users   : ${totalUsers}*
*• Node Version  : ${process.version}*
> ${config.DESCRIPTION}
`;

    await conn.sendMessage(from, {
      image:  { url: config.MENU_IMAGE_URL }, // <-- replace with your image URL
      caption: status
    }, { quoted: mek });

  } catch (e) {
    console.error("System Command Error:", e);
    reply(`⚠️ Error: ${e.message}`);
  }
});

cmd({
    pattern: "repo",
    desc: "repo the bot",
    react: "📡",
    category: "main",
    filename: __filename
},

async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let dec = `> VES-MD V2 REPO 🎩

╭⦁⦂⦁*━┉━┉━┉━┉━┉━┉━⦁⦂⦁
┃ 𝙾𝚆𝙽𝙴𝚁 𝙽𝚄𝙼𝙱𝙴𝚁: ${bot.OWNER_NUMBER}
┃ 
┃ DEW-MD REPO: ${bot.REPO_LINK} 
┃
┃ BOT UPDATES: ${bot.WA_CHANNEL}
╰⦁⦂⦁*━┉━┉━┉━┉━┉━┉━⦁⦂⦁

> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*
`
await conn.sendMessage(from,{image:{url: ${config.MENU_IMG},caption:dec},{quoted:mek});
console.log(`♻ Repo Command Used : ${from}`);

}catch(e){
    console.log(e)
    reply(`${e}`)
    }
})

cmd({
    pattern: "menu",
    desc: "Show interactive menu system",
    category: "menu",
    react: "📂",
    filename: __filename
}, async (conn, mek, m, { from, reply, pushname }) => {
    try {
        // Count total commands
        const totalCommands = Object.keys(commands).length;

        const menuCaption = `👋 𝐇𝐄𝐋𝐋𝐎, ${pushname}!

*✨ 𝗪ELCOME TO VES-MD ✨*
╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *𝚁𝚄𝙽𝚃𝙸𝙼𝙴* : ${runtime(process.uptime())}
│◈ *𝙾𝚆𝙽𝙴𝚁 𝙽𝙰𝙼𝙴* : Isira induwara </>
│◈ *𝙾𝚆𝙽𝙴𝚁 𝙽𝚄𝙼𝙱𝙴𝚁* : 94751474995
│◈ *𝙿𝚁𝙴𝙵𝙸𝚇* : .
│◈ *𝚅𝙴𝚁𝙸𝚂𝙾𝙽* : 𝟶.𝟶.𝟸
╰──────────●●►

> 🔢 ʀᴇᴘʟʏ ᴛʜᴇ ɴᴜᴍʙᴇʀ ʙᴇʟᴏᴡ🗿

🎩*1 │❯❯◦ MAIN MENU*
🎩*2 │❯❯◦ AI MENU*
🎩*3 │❯❯◦ CONVERT MENU*
🎩*4 │❯❯◦ DOWNLOAD MENU*
🎩*5 │❯❯◦ SEARCH MENU*
🎩*6 │❯❯◦ GROUP MENU*
🎩*7 │❯❯◦ OWNER MENU*
🎩*8 │❯❯◦ TOOLS MENU*
🎩*9 │❯❯◦ NEWS MENU*
🎩*10 │❯❯◦ FUN MENU*

> ${config.DESCRIPTION}`;

const contextInfo = {
    mentionedJid: [m.sender],
    forwardingScore: 999,
    isForwarded: true
};

// Function to send the main menu image
const sendMenuImage = async () => {
    try {
        return await conn.sendMessage(
            from,
            {
                image:  { url: config.MENU_IMAGE_URL },
                caption: menuCaption,
                contextInfo: contextInfo
            },
            { quoted: mek }
        );
    } catch (e) {
        console.log('Image send failed, falling back to text');
        return await conn.sendMessage(
            from,
            { text: menuCaption, contextInfo: contextInfo },
            { quoted: mek }
        );
    }
};

// Try sending menu image with timeout
let sentMsg;
try {
    sentMsg = await Promise.race([
        sendMenuImage(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Image send timeout')), 10000))
    ]);
} catch (e) {
    console.log('Menu send error:', e);
    sentMsg = await conn.sendMessage(
        from,
        { text: menuCaption, contextInfo: contextInfo },
        { quoted: mek }
    );
}

const messageID = sentMsg.key.id;

        // Menu data (Trimmed sample - you can keep all your sections)
        const menuData = {
            '1': {
                title: "🎀 *Main Menu*",
                content: `
🎩 Ξ MAIN COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🎀 Command : *alive*
│🏷️ Use : .alive — Check if bot is online
╰──────────●●►
╭──────────●●►
│🎀 Command : *ping*
│🏷️ Use : .ping — Check bot speed
╰──────────●●►
╭──────────●●►
│🎀 Command : *system*
│🏷️ Use : .system — Bot system info
╰──────────●●►
╭──────────●●►
│🎀 Command : *script*
│🏷️ Use : .script — Bot script info
╰──────────●●►
╭──────────●●►
│🎀 Command : *owner*
│🏷️ Use : .owner — Owner details
╰──────────●●►
╭──────────●●►
│🎀 Command : *runtime*
│🏷️ Use : .runtime — Show bot uptime
╰──────────●●►
╭──────────●●►
│🎀 Command : *time*
│🏷️ Use : .time — Show SL date & time
╰──────────●●►
╭──────────●●►
│🎀 Command : *about*
│🏷️ Use : .about — Bot info
╰──────────●●►
╭──────────●●►
│🎀 Command : *send*
│🏷️ Use : .send — send < Jid address >
╰──────────●●►
╭──────────●●►
│🎀 Command : *channelreact*
│🏷️ Use : .channelreactt — channelreact *<link>,<emoji>*
╰──────────●●►
╭──────────●●►
│🎀 Command : *forward*
│🏷️ Use : .forward — f jid
╰──────────●●►
╭──────────●●►
│🎀 Command : *rename*
│🏷️ Use : .rename — r jid1,jid2 | filename (without ext) | new caption (quote a message)
╰──────────●●►
╭──────────●●►
│🎀 Command : *follow*
│🏷️ Use : .follow — follow cahnnel
╰──────────●●►
╭──────────●●►
│🎀 Command : *download*
│🏷️ Use : .download — download direct link
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '2': {
                title: "*🤖 Ai Menu*",
                content: `
🎩 Ξ AI COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🎩 Command : *ai*
│✨ Use : .ai — Chat with Asta AI
╰──────────●●►
╭──────────●●►
│🎩 Command : *openai*
│✨ Use : .openai — Chat with OpenAI GPT
╰──────────●●►
╭──────────●●►
│🎩 Command : *deepseek*
│✨ Use : .deepseek — Chat with DeepSeek AI
╰──────────●●►
╭──────────●●►
│🎩 Command : *chat*
│✨ Use : .chat — Chat with Gemini AI
╰──────────●●►
╭─────────●●►
│🎩 Command : *aiimg*
│✨ Use : .aiimg — Generate an image using Flux
╰──────────●●►
╭─────────●●►
│🎩 Command : *imagine*
│✨ Use : .imagine — Generate an image using AI
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '3': {
                title: "🎧 *Convert Menu*",
                content: `
🎩 Ξ CONVERT COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🐼 Command : *tts*
│☕ Use : .tts — Text to Speech
╰──────────●●►
╭──────────●●►
│🐼 Command : *readmore*
│☕ Use : .readmore — Add Read More
╰──────────●●►
╭──────────●●►
│🐼 Command : *translate*
│☕ Use : .translate — Translate text
╰──────────●●►
╭──────────●●►
│🐼 Command : *getrepo*
│☕ Use : .getrepo — GitHub ZIP Download
╰──────────●●►
╭──────────●●►
│🐼 Command : *npm*
│☕ Use : .npm — Search npm packages
╰──────────●●►
╭──────────●●►
│🐼 Command : *ss*
│☕ Use : .ss — Website Screenshot
╰──────────●●►
╭──────────●●►
│🐼 Command : *img2url*
│☕ Use : .img2utl — imge to link
╰──────────●●►
╭──────────●●►
│🐼 Command : *sticker*
│☕ Use : .sticker — <Reply to image>
╰──────────●●►
╭──────────●●►
│🐼 Command : *attp*
│☕ Use : .attp — Text to convert sticker
╰──────────●●►
╭──────────●●►
│🐼 Command : *toptt*
│☕ Use : .attp — <Reply to video>
╰──────────●●►
╭──────────●●►
│🐼 Command : *jsobfus*
│☕ Use : .attp — jsobfus code
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '4': {
                title: "📥 *Download Menu*",
                content: `
🎩 Ξ DOWNLOAD COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🍌 Command : *facebook*
│🌵 Use : .facebook — Download FB Videos
╰──────────●●►
╭──────────●●►
│🍌 Command : *tiktok*
│🌵 Use : .tiktok — Download TikTok Videos
╰──────────●●►
╭──────────●●►
│🍌 Command : *tiktokwm*
│🌵 Use : .tiktok — Download TikTok Video (With Watermark)
╰──────────●●►
╭──────────●●►
│🍌 Command : *tiktokaudio*
│🌵 Use : .tiktok — Download TikTok audio
╰──────────●●►
╭──────────●●►
│🍌 Command : *ytpost*
│🌵 Use : .ytpost — Download YouTube Posts
╰──────────●●►
╭──────────●●►
│🍌 Command : *apk*
│🌵 Use : .apk — Download APK Files
╰──────────●●►
╭──────────●●►
│🍌 Command : *gdrive*
│🌵 Use : .gdrive — Download Google Drive Files
╰──────────●●►
╭──────────●●►
│🍌 Command : *gitclone*
│🌵 Use : .gitclone — Download GitHub Repo
╰──────────●●►
╭──────────●●►
│🍌 Command : *mediafire*
│🌵 Use : .mediafire — Download MediaFire Files
╰──────────●●►
╭──────────●●►
│🍌 Command : *image*
│🌵 Use : .image — Download Images
╰──────────●●►
╭──────────●●►
│🍌 Command : *song*
│🌵 Use : .song — Download YouTube Songs
╰──────────●●►
╭──────────●●►
│🍌 Command : *video*
│🌵 Use : .video — Download YouTube Videos
╰──────────●●►
╭──────────●●►
│🍌 Command : *download*
│🌵 Use : .download — Download direct file
╰──────────●●►
╭──────────●●►
│🍌 Command : *mega*
│🌵 Use : .mega— Download mega.nz file 
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '5': {
                title: "🔍 *Search Menu*",
                content: `
🎩 Ξ SEARCH COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🐬 Command : *yts / ytsearch*
│🍇 Use : .yts — Search YouTube Videos
╰──────────●●►
╭──────────●●►
│🐬 Command : *define*
│🍇 Use : .define — Find word definitions
╰──────────●●►
╭──────────●●►
│🐬 Command : *npm / npm1*
│🍇 Use : .npm — Search npm Packages
╰──────────●●►
╭──────────●●►
│🐬 Command : *srepo*
│🍇 Use : .srepo — Search GitHub Repos
╰──────────●●►
╭──────────●●►
│🐬 Command : *xstalk*
│🍇 Use : .xstalk — Search Twitter/X User Info
╰──────────●●►
╭──────────●●►
│🐬 Command : *tiktokstalk*
│🍇 Use : .tiktokstalk — Search TikTok User Info
╰──────────●●►
╭──────────●●►
│🐬 Command : *lyrics*
│🍇 Use : .lyrics — Find song lyrics
╰──────────●●►
╭──────────●●►
│🐬 Command : *movie / imdb*
│🍇 Use : .movie — Search movie info
╰──────────●●►
╭──────────●●►
│🐬 Command : *weather*
│🍇 Use : .weather — Get weather updates
╰──────────●●►
╭──────────●●►
│🐬 Command : *news*
│🍇 Use : .news — Get latest news
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '6': {
                title: "👥 *Group Menu*",
                content: `
🎩 Ξ GROUP COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🛠️ Command : requests
│📝 Use : .requests — Show join requests
╰──────────●●►
╭──────────●●►
│🛠️ Command : accept
│📝 Use : .accept — Accept requests
╰──────────●●►
╭──────────●●►
│🛠️ Command : reject
│📝 Use : .reject — Reject requests
╰──────────●●►
╭──────────●●►
│🛠️ Command : hidetag
│📝 Use : .hidetag — Tag all members
╰──────────●●►
╭──────────●●►
│🛠️ Command : promote
│📝 Use : .promote — Make admin
╰──────────●●►
╭──────────●●►
│🛠️ Command : demote
│📝 Use : .demote — Remove admin
╰──────────●●►
╭──────────●●►
│🛠️ Command : kick
│📝 Use : .kick — Remove member
╰──────────●●►
╭──────────●●►
│🛠️ Command : mute
│📝 Use : .mute — Mute group
╰──────────●●►
╭──────────●●►
│🛠️ Command : unmute
│📝 Use : .unmute — Unmute group
╰──────────●●►
╭──────────●●►
│🛠️ Command : join
│📝 Use : .join — Join via link
╰──────────●●►
╭──────────●●►
│🛠️ Command : user
│📝 Use : .user — User details
╰──────────●●►
╭──────────●●►
│🛠️ Command : profile
│📝 Use : .profile — Show profile
╰──────────●●►
╭──────────●●►
│🛠️ Command : userinfo
│📝 Use : .userinfo — Get user info
╰──────────●●►
╭──────────●●►
│🛠️ Command : add
│📝 Use : .add — Add member
╰──────────●●►
╭──────────●●►
│🛠️ Command : invite
│📝 Use : .invite — Send invite
╰──────────●●►
╭──────────●●►
│🛠️ Command : admins
│📝 Use : .admins — List admins
╰──────────●●►
╭──────────●●►
│🛠️ Command : groupdesc
│📝 Use : .groupdesc — Change description
╰──────────●●►
╭──────────●●►
│🛠️ Command : groupinfo
│📝 Use : .groupinfo — Group settings
╰──────────●●►
╭──────────●●►
│🛠️ Command : grouplink
│📝 Use : .grouplink — Get link
╰──────────●●►
╭──────────●●►
│🛠️ Command : gname
│📝 Use : .gname — Change name
╰──────────●●►
╭──────────●●►
│🛠️ Command : setsubject
│📝 Use : .setsubject — Set subject
╰──────────●●►
╭──────────●●►
│🛠️ Command : unlock
│📝 Use : .unlock — Unlock group
╰──────────●●►
╭──────────●●►
│🛠️ Command : lock
│📝 Use : .lock — Lock group
╰──────────●●►
╭──────────●●►
│🛠️ Command : approve
│📝 Use : .approve — Approve join
╰──────────●●►
╭──────────●●►
│🛠️ Command : poll
│📝 Use : .poll — Create poll
╰──────────●●►
╭──────────●●►
│🛠️ Command : getpic
│📝 Use : .getpic — Get group pic
╰──────────●●►
╭──────────●●►
│🛠️ Command : kickall
│📝 Use : .kickall — Kick everyone
╰──────────●●►
╭──────────●●►
│🛠️ Command : opentime
│📝 Use : .opentime — Set open time
╰──────────●●►
╭──────────●●►
│🛠️ Command : closetime
│📝 Use : .closetime — Set close time
╰──────────●●►
╭──────────●●►
│🛠️ Command : tagadmin
│📝 Use : .tagadmin — Tag admins
╰──────────●●►
╭──────────●●►
│🛠️ Command : rank
│📝 Use : .rank — User rank info
╰──────────●●►
╭──────────●●►
│🛠️ Command : tagall
│📝 Use : .tagall — Mention all
╰──────────●●►
╭──────────●●►
│🛠️ Command : everyone
│📝 Use : .everyone — Tag everyone
╰──────────●●►
╭──────────●●►
│🛠️ Command : del
│📝 Use : .del — Delete message
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '7': {
                title: "👑 *Owner Menu*",
                content: `
🎩 Ξ OWNER COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│⚡ Command : vv
│⚙️ Use : .vv — Retrieve view-once media
╰──────────●●►
╭──────────●●►
│⚡ Command : setting
│⚙️ Use : .setting — Change bot setting
╰──────────●●►
╭──────────●●►
│⚡ Command : getpp
│⚙️ Use : .getpp — Get user profile picture
╰──────────●●►
╭──────────●●►
│⚡ Command : setpp
│⚙️ Use : .setpp — Change bot profile picture
╰──────────●●►
╭──────────●●►
│⚡ Command : setfullpp
│⚙️ Use : .setfullpp — Change profile picture full size
╰──────────●●►
╭──────────●●►
│⚡ Command : broadcast
│⚙️ Use : .broadcast — Send msg to all groups
╰──────────●●►
╭──────────●●►
│⚡ Command : shutdown
│⚙️ Use : .shutdown — Shutdown bot
╰──────────●●►
╭──────────●●►
│⚡ Command : restart
│⚙️ Use : .restart — Restart bot
╰──────────●●►
╭──────────●●►
│⚡ Command : clearchats
│⚙️ Use : .clearchats — Clear all chats
╰──────────●●►
╭──────────●●►
│⚡ Command : block
│⚙️ Use : .block — block contract number
╰──────────●●►
╭──────────●●►
│⚡ Command : ublock
│⚙️ Use : .ublock — ublock contract number
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '8': {
                title: "🧰 *Tools Menu*",
                content: `
🎩 Ξ TOOLS & UTILITY COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│💎 Command : jid
│📋 Use : .jid — Get chat/user JID
╰──────────●●►
╭──────────●●►
│💎 Command : send
│📋 Use : .send — Forward quoted message
╰──────────●●►
╭──────────●●►
│💎 Command : trsi
│📋 Use : .trsi — English ➜ Sinhala
╰──────────●●►
╭──────────●●►
│💎 Command : tren
│📋 Use : .tren — Sinhala ➜ English
╰──────────●●►
╭──────────●●►
│💎 Command : tts
│📋 Use : .tts — Sinhala Text ➜ Voice
╰──────────●●►
╭──────────●●►
│💎 Command : countryinfo
│📋 Use : .countryinfo <name> — Get country info
╰──────────●●►
╭──────────●●►
│💎 Command : logo
│📋 Use : .logo <name> — Get logo imge
╰──────────●●►
╭──────────●●►
│💎 Command : logo2
│📋 Use : .logo <name> — Get logo imge
╰──────────●●►
╭──────────●●►
│💎 Command : topdf
│📋 Use : .topdf Text to pdf
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
            },
            '9': {
                title: "📰 *News Menu*",
                content: `
🎩 Ξ NEWS COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🗞️ Command : newson
│🔔 Use : .newson — Enable auto news updates
╰──────────●●►
╭──────────●●►
│🗞️ Command : newsoff
│🔔 Use : .newsoff — Disable auto news updates
╰──────────●●►
╭──────────●●►
│🗞️ Command : alerton
│🔔 Use : .alerton — Enable breaking news alerts
╰──────────●●►
╭──────────●●►
│🗞️ Command : alertoff
│🔔 Use : .alertoff — Disable breaking news alerts
╰──────────●●►
> ${config.DESCRIPTION}`,
                image: true
             },
            '10': {
                title: "🤣 *fun Menu*",
                content: `
🎩 Ξ FUN COMMAND LIST: Ξ

╭─「 ᴄᴏᴍᴍᴀɴᴅꜱ ᴘᴀɴᴇʟ」
│◈ *RAM USAGE* - ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
│◈ *RUN TIME* - ${runtime(process.uptime())}
╰──────────●●►
╭──────────●●►
│🎭 Command : hack
│✨ Use     : .hack — dynamic emoji edit (hack)
╰──────────●●►
╭──────────●●►
│🎭 Command : happy
│✨ Use     : .happy — dynamic emoji edit (smile)
╰──────────●●►
╭──────────●●►
│🎭 Command : heart
│✨ Use     : .heart — dynamic heart emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : angry
│✨ Use     : .angry — dynamic angry emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : sad
│✨ Use     : .sad — dynamic sad emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : shy
│✨ Use     : .shy — shy/blush emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : moon
│✨ Use     : .moon — moon phases animation
╰──────────●●►
╭──────────●●►
│🎭 Command : confused
│✨ Use     : .confused — confused emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : hot
│✨ Use     : .hot — flirty/hot emoji edit
╰──────────●●►
╭──────────●●►
│🎭 Command : nikal
│✨ Use     : .nikal — ASCII art / darkzone messages
╰──────────●●►
╭──────────●●►
│🎭 Command : animegirl
│✨ Use     : .animegirl — fetch random anime girl image
╰──────────●●►

> ${config.DESCRIPTION}`,
                image: true
                
            }

        };

        // Message handler for menu replies
        const handler = async (msgData) => {
            try {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message || !receivedMsg.key?.remoteJid) return;

                const isReplyToMenu =
                    receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (isReplyToMenu) {
                    const receivedText =
                        receivedMsg.message.conversation ||
                        receivedMsg.message.extendedTextMessage?.text;
                    const senderID = receivedMsg.key.remoteJid;

                    if (menuData[receivedText]) {
                        const selectedMenu = menuData[receivedText];

                        try {
                            if (selectedMenu.image) {
                                await conn.sendMessage(
                                    senderID,
                                    {
                                        image: { url: config.MENU_IMAGE_URL },
                                        caption: selectedMenu.content,
                                        contextInfo: contextInfo
                                    },
                                    { quoted: receivedMsg }
                                );
                            } else {
                                await conn.sendMessage(
                                    senderID,
                                    { text: selectedMenu.content, contextInfo: contextInfo },
                                    { quoted: receivedMsg }
                                );
                            }

                            await conn.sendMessage(senderID, {
                                react: { text: '✅', key: receivedMsg.key }
                            });
                        } catch (e) {
                            console.log('Menu reply error:', e);
                            await conn.sendMessage(
                                senderID,
                                { text: selectedMenu.content, contextInfo: contextInfo },
                                { quoted: receivedMsg }
                            );
                        }
                    } else {
                        await conn.sendMessage(
                            senderID,
                            {
                                text: `❌ *Invalid Option!* ❌\n\nPlease reply with a number between 1–9.\n\n*Example:* Reply with "1" for Main Menu\n\n> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*`,
                                contextInfo: contextInfo
                            },
                            { quoted: receivedMsg }
                        );
                    }
                }
            } catch (e) {
                console.log('Handler error:', e);
            }
        };

        // Add message listener
        conn.ev.on('messages.upsert', handler);

        // Remove listener after 5 minutes
        setTimeout(() => {
            conn.ev.off('messages.upsert', handler);
        }, 300000);
    } catch (e) {
        console.error('Menu Error:', e);
        try {
            await conn.sendMessage(
                from,
                { text: `❌ Menu system is busy. Please try again later.\n\n> ${config.DESCRIPTION}` },
                { quoted: mek }
            );
        } catch (finalError) {
            console.log('Final error handling failed:', finalError);
        }
    }
});

cmd({
  'pattern': "send",
  'alias': ["forward2"],
  'desc': "send msgs",
  'category': "owner",
  'use': ".send < Jid address >",
  'filename': __filename
}, async (_0x2498df, _0x21b0a3, _0x1f0d88, {
  from: _0x5cc45,
  l: _0x19c0c3,
  quoted: _0x390317,
  body: _0xe35e61,
  isCmd: _0x30b5e6,
  command: _0x2ccaaf,
  args: _0x3095ee,
  q: _0x5c6feb,
  isGroup: _0x58266d,
  sender: _0x138c74,
  senderNumber: _0x588835,
  botNumber2: _0x1237f5,
  botNumber: _0x40a3c4,
  pushname: _0x1b79cd,
  isMe: _0x11e81d,
  isOwner: _0x31d1f9,
  groupMetadata: _0x19453e,
  groupName: _0x30d7f3,
  participants: _0x22383b,
  groupAdmins: _0x2b42d2,
  isBotAdmins: _0x2ebdfb,
  isAdmins: _0x101fa1,
  reply: _0x55265b
}) => {
  try {
    if (!_0x11e81d && !_0x31d1f9 && !isSudo) {
      return await _0x55265b("*📛OWNER COMMAND*");
    }
    if (!_0x5c6feb || !_0x1f0d88.quoted) {
      return _0x55265b("*Please give me a Jid and Quote a Message to continue.*");
    }
    if (!_0x5c6feb || !_0x1f0d88.quoted) {
      return await _0x55265b("❌ *Please give me a jid and quote a message you want*\n\n*Use the " + envData.PREFIX + "jid command to get the Jid*");
    }
    let _0xdc9a3e = _0x5c6feb.split(',').map(_0x24b800 => _0x24b800.trim());
    if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === "stickerMessage") {
      let _0x518f8a = await _0x1f0d88.quoted.download();
      let _0x367b45 = new Sticker(_0x518f8a, {
        'pack': "⦁ VES--MD ⦁",
        'author': "⦁ VES-MD ⦁",
        'type': StickerTypes.FULL,
        'categories': ['🤩', '🎉'],
        'id': '12345',
        'quality': 0x4b,
        'background': 'transparent'
      });
      const _0x29d9aa = await _0x367b45.toBuffer();
      const _0x41b49a = [];
      for (let _0x306235 of _0xdc9a3e) {
        try {
          _0x2498df.sendMessage(_0x306235, {
            'sticker': _0x29d9aa
          });
          _0x41b49a.push(_0x306235);
        } catch (_0x251d0d) {
          console.log("❌ Failed to forward to " + _0x306235 + ':', _0x251d0d);
        }
      }
      _0x55265b("*This " + _0x1f0d88.quoted.type + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
      _0x1f0d88.react('✔️');
    } else {
      if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === "imageMessage") {
        if (_0x1f0d88.quoted.imageMessage && _0x1f0d88.quoted.imageMessage.caption) {
          const _0x590540 = _0x1f0d88.quoted.imageMessage.caption;
          let _0x838c04 = await _0x1f0d88.quoted.download();
          const _0x4cc0d4 = [];
          for (let _0x1e5fc9 of _0xdc9a3e) {
            try {
              _0x2498df.sendMessage(_0x1e5fc9, {
                'image': _0x838c04,
                'caption': _0x590540
              });
              _0x4cc0d4.push(_0x1e5fc9);
            } catch (_0x5b03a8) {
              console.log("❌ Failed to forward to " + _0x1e5fc9 + ':', _0x5b03a8);
            }
          }
          _0x55265b("*This `" + _0x1f0d88.quoted.type + " has been successfully sent to the jid address   ✅");
          _0x1f0d88.react('✔️');
        } else {
          let _0x246ba1 = await _0x1f0d88.quoted.download();
          const _0x2f54f0 = [];
          for (let _0x49124a of _0xdc9a3e) {
            try {
              _0x2498df.sendMessage(_0x49124a, {
                'image': _0x246ba1
              });
              _0x2f54f0.push(_0x49124a);
            } catch (_0x534a2c) {
              console.log("❌ Failed to forward to " + _0x49124a + ':', _0x534a2c);
            }
          }
          _0x55265b("*This `" + _0x1f0d88.quoted.type + " has been successfully sent to the jid address   ✅");
          _0x1f0d88.react('✔️');
        }
      } else {
        if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === 'videoMessage') {
          let _0x2e2965 = _0x1f0d88.quoted.videoMessage.fileLength;
          const _0x23e4a4 = _0x2e2965 / 1048576;
          if (_0x23e4a4 >= 0x32) {
            _0x55265b("*❌ Video files larger than 50 MB cannot be send.*");
          } else {
            let _0x55151f = await _0x1f0d88.quoted.download();
            const _0x59b498 = _0x5c6feb || _0x5cc45;
            if (_0x1f0d88.quoted.videoMessage.caption) {
              _0x2498df.sendMessage(_0x59b498, {
                'video': _0x55151f,
                'mimetype': "video/mp4",
                'caption': _0x1f0d88.quoted.videoMessage.caption
              });
              _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
              _0x1f0d88.react('✔️');
            } else {
              const _0x2fdb53 = _0x5c6feb || _0x5cc45;
              _0x2498df.sendMessage(_0x2fdb53, {
                'video': _0x55151f,
                'mimetype': "video/mp4"
              });
              _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
              _0x1f0d88.react('✔️');
            }
          }
        } else {
          if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === "documentMessage" || _0x1f0d88.quoted.type === "documentWithCaptionMessage") {
            const _0x371841 = _0x5c6feb || _0x5cc45;
            if (_0x1f0d88 && _0x1f0d88.quoted && _0x1f0d88.quoted.documentMessage) {
              let _0x36abdf = _0x1f0d88.quoted.documentMessage.fileLength;
              const _0x3ac80d = _0x36abdf / 1048576;
              if (_0x3ac80d >= 0x32) {
                _0x55265b("*❌ Document files larger than 50 MB cannot be send.*");
              } else {
                let _0x3c7b4b = _0x1f0d88.quoted.documentMessage.mimetype;
                let _0x868277 = _0x1f0d88.quoted.documentMessage.fileName;
                let _0x26f609 = await _0x1f0d88.quoted.download();
                _0x2498df.sendMessage(_0x371841, {
                  'document': _0x26f609,
                  'mimetype': _0x3c7b4b,
                  'fileName': _0x868277
                });
                _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                _0x1f0d88.react('✔️');
              }
            } else {
              if (_0x1f0d88.quoted.type === "documentWithCaptionMessage") {
                let _0x48c76f = _0x1f0d88.quoted.documentWithCaptionMessage.message.documentMessage.fileLength;
                const _0x10edcb = _0x48c76f / 1048576;
                if (_0x10edcb >= 0x32) {
                  _0x55265b("*❌ Document files larger than 50 MB cannot be send.*");
                } else {
                  let _0x3b14a6 = await _0x1f0d88.quoted.download();
                  let _0x181629 = _0x1f0d88.quoted.documentWithCaptionMessage.message.documentMessage.mimetype;
                  let _0x596971 = _0x1f0d88.quoted.documentWithCaptionMessage.message.documentMessage.fileName;
                  const _0x31b713 = _0x5c6feb || _0x5cc45;
                  let _0x1fe179 = _0x1f0d88.quoted.documentWithCaptionMessage.message.documentMessage.caption;
                  _0x2498df.sendMessage(_0x31b713, {
                    'document': _0x3b14a6,
                    'mimetype': _0x181629,
                    'caption': _0x1fe179,
                    'fileName': _0x596971
                  });
                  _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                  _0x1f0d88.react('✔️');
                }
              }
            }
          } else {
            if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === "audioMessage") {
              let _0x677bbe = _0x1f0d88.quoted.audioMessage.fileLength;
              const _0x18b2aa = _0x677bbe / 1048576;
              if (_0x18b2aa >= 0x32) {
                _0x55265b("*❌ Audio files larger than 50 MB cannot be send.*");
              } else {
                let _0x1a3c40 = await _0x1f0d88.quoted.download();
                const _0x5b6def = _0x5c6feb || _0x5cc45;
                if (_0x1f0d88.quoted.audioMessage.ptt === true) {
                  _0x2498df.sendMessage(_0x5b6def, {
                    'audio': _0x1a3c40,
                    'mimetype': "audio/mpeg",
                    'ptt': true,
                    'fileName': _0x1f0d88.id + ".mp3"
                  });
                  _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                  _0x1f0d88.react('✔️');
                } else {
                  const _0x5e668c = _0x5c6feb || _0x5cc45;
                  _0x2498df.sendMessage(_0x5e668c, {
                    'audio': _0x1a3c40,
                    'mimetype': "audio/mpeg",
                    'fileName': _0x1f0d88.id + '.mp3'
                  });
                  _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                  _0x1f0d88.react('✔️');
                }
              }
            } else {
              if (_0x1f0d88.quoted && _0x1f0d88.quoted.type === "viewOnceMessageV2Extension") {
                const _0x3acb63 = {
                  'key': {
                    'remoteJid': _0x21b0a3.key.remoteJid,
                    'fromMe': false,
                    'id': _0x1f0d88.key.id
                  },
                  'messageTimestamp': _0x1f0d88.messageTimestamp,
                  'pushName': _0x1f0d88.pushName,
                  'broadcast': _0x1f0d88.broadcast,
                  'status': 0x2,
                  'message': {
                    'audioMessage': {
                      'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.url,
                      'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mimetype,
                      'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fileSha256,
                      'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fleLength,
                      'seconds': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.seconds,
                      'ptt': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.ptt,
                      'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mediaKey,
                      'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fileEncSha256,
                      'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.directPath,
                      'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mediaKeyTimestamp,
                      'waveform': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.waveform
                    }
                  },
                  'id': _0x1f0d88.id,
                  'chat': _0x1f0d88.chat,
                  'fromMe': _0x1f0d88.fromMe,
                  'isGroup': _0x1f0d88.isGroup,
                  'sender': _0x1f0d88.sender,
                  'type': "audioMessage",
                  'msg': {
                    'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.url,
                    'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mimetype,
                    'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fileSha256,
                    'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fleLength,
                    'seconds': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.seconds,
                    'ptt': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.ptt,
                    'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mediaKey,
                    'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.fileEncSha256,
                    'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.directPath,
                    'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.mediaKeyTimestamp,
                    'waveform': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2Extension.message.audioMessage.waveform
                  }
                };
                const _0x1a7655 = sms(_0x2498df, _0x3acb63);
                var _0x5082ad = getRandom('');
                let _0x144cdb = await _0x1a7655.download(_0x5082ad);
                let _0x590f0e = require("file-type");
                let _0x2ff529 = _0x590f0e.fromBuffer(_0x144cdb);
                await fs.promises.writeFile('./' + _0x2ff529.ext, _0x144cdb);
                await sleep(0x3e8);
                const _0x16a479 = _0x5c6feb || _0x5cc45;
                _0x2498df.sendMessage(_0x16a479, {
                  'audio': {
                    'url': './' + _0x2ff529.ext
                  },
                  'mimetype': "audio/mpeg",
                  'ptt': true,
                  'viewOnce': true,
                  'fileName': _0x1f0d88.id + ".mp3"
                });
                _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                _0x1f0d88.react('✔️');
              } else {
                if (_0x1f0d88.quoted && _0x1f0d88.quoted.viewOnceMessageV2 && _0x1f0d88.quoted.viewOnceMessageV2.message.videoMessage) {
                  const _0x48a685 = {
                    'key': {
                      'remoteJid': _0x21b0a3.key.remoteJid,
                      'fromMe': false,
                      'id': _0x1f0d88.key.id
                    },
                    'messageTimestamp': _0x1f0d88.messageTimestamp,
                    'pushName': _0x1f0d88.pushName,
                    'broadcast': _0x1f0d88.broadcast,
                    'status': 0x2,
                    'message': {
                      'videoMessage': {
                        'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.url,
                        'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mimetype,
                        'caption': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.caption,
                        'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fileSha256,
                        'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fleLength,
                        'seconds': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.seconds,
                        'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mediaKey,
                        'height': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.height,
                        'width': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.width,
                        'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fileEncSha256,
                        'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.directPath,
                        'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mediaKeyTimestamp,
                        'jpegThumbnail': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.jpegThumbnail
                      }
                    },
                    'id': _0x1f0d88.id,
                    'chat': _0x1f0d88.chat,
                    'fromMe': _0x1f0d88.fromMe,
                    'isGroup': _0x1f0d88.isGroup,
                    'sender': _0x1f0d88.sender,
                    'type': "videoMessage",
                    'msg': {
                      'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.url,
                      'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mimetype,
                      'caption': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.caption,
                      'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fileSha256,
                      'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fleLength,
                      'seconds': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.seconds,
                      'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mediaKey,
                      'height': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.height,
                      'width': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.width,
                      'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.fileEncSha256,
                      'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.directPath,
                      'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.mediaKeyTimestamp,
                      'jpegThumbnail': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.jpegThumbnail
                    },
                    'body': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.videoMessage.caption
                  };
                  const _0x596327 = sms(_0x2498df, _0x48a685);
                  var _0x5082ad = getRandom('');
                  let _0x11ecc0 = await _0x596327.download(_0x5082ad);
                  let _0x4f1d9f = require("file-type");
                  let _0x52fcd6 = _0x4f1d9f.fromBuffer(_0x11ecc0);
                  await fs.promises.writeFile('./' + _0x52fcd6.ext, _0x11ecc0);
                  await sleep(0x3e8);
                  let _0x146613 = _0x48a685.message.videoMessage.caption || "⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁";
                  const _0x3593a5 = _0x5c6feb || _0x5cc45;
                  _0x2498df.sendMessage(_0x3593a5, {
                    'video': {
                      'url': './' + _0x52fcd6.ext
                    },
                    'caption': _0x146613,
                    'viewOnce': true
                  });
                  _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                  _0x1f0d88.react('✔️');
                } else {
                  if (_0x1f0d88.quoted && _0x1f0d88.quoted.viewOnceMessageV2 && _0x1f0d88.quoted.viewOnceMessageV2.message.imageMessage) {
                    const _0x54941d = {
                      'key': {
                        'remoteJid': _0x21b0a3.key.remoteJid,
                        'fromMe': false,
                        'id': _0x1f0d88.key.id
                      },
                      'messageTimestamp': _0x1f0d88.messageTimestamp,
                      'pushName': _0x1f0d88.pushName,
                      'broadcast': _0x1f0d88.broadcast,
                      'status': 0x2,
                      'message': {
                        'imageMessage': {
                          'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.url,
                          'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mimetype,
                          'caption': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.caption,
                          'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fileSha256,
                          'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fleLength,
                          'height': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.height,
                          'width': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.width,
                          'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mediaKey,
                          'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fileEncSha256,
                          'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.directPath,
                          'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mediaKeyTimestamp,
                          'jpegThumbnail': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.jpegThumbnail
                        }
                      },
                      'id': _0x1f0d88.id,
                      'chat': _0x1f0d88.chat,
                      'fromMe': _0x1f0d88.fromMe,
                      'isGroup': _0x1f0d88.isGroup,
                      'sender': _0x1f0d88.sender,
                      'type': 'imageMessage',
                      'msg': {
                        'url': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.url,
                        'mimetype': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mimetype,
                        'caption': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.caption,
                        'fileSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fileSha256,
                        'fileLength': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fleLength,
                        'height': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.height,
                        'width': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.width,
                        'mediaKey': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mediaKey,
                        'fileEncSha256': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.fileEncSha256,
                        'directPath': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.directPath,
                        'mediaKeyTimestamp': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.mediaKeyTimestamp,
                        'jpegThumbnail': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.jpegThumbnail
                      },
                      'body': _0x21b0a3.message.extendedTextMessage.contextInfo.quotedMessage.viewOnceMessageV2.message.imageMessage.caption
                    };
                    const _0xdfa5d9 = sms(_0x2498df, _0x54941d);
                    var _0x5082ad = getRandom('');
                    let _0x380d39 = await _0xdfa5d9.download(_0x5082ad);
                    let _0x2dda14 = require('file-type');
                    let _0x32ae84 = _0x2dda14.fromBuffer(_0x380d39);
                    await fs.promises.writeFile('./' + _0x32ae84.ext, _0x380d39);
                    await sleep(0x3e8);
                    let _0x4cbca = _0x54941d.message.imageMessage.caption || "⦁ ᴘʀᴀʙᴀᴛʜ-ᴍᴅ ⦁";
                    const _0x89389f = _0x5c6feb || _0x5cc45;
                    _0x2498df.sendMessage(_0x89389f, {
                      'image': {
                        'url': './' + _0x32ae84.ext
                      },
                      'caption': _0x4cbca,
                      'viewOnce': true
                    });
                    _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                    _0x1f0d88.react('✔️');
                  } else {
                    if (_0x5c6feb || _0x1f0d88.quoted && _0x1f0d88.quoted.type === "conversation") {
                      const _0x55ec4e = _0x5c6feb || _0x5cc45;
                      _0x2498df.sendMessage(_0x55ec4e, {
                        'text': _0x1f0d88.quoted.msg
                      });
                      _0x55265b("*This `" + _0x1f0d88.quoted.type + '`' + " has been successfully sent to the jid address " + '`' + _0x5c6feb + '`' + ".*  ✅");
                      _0x1f0d88.react('✔️');
                    } else {
                      const _0xaf5f64 = await _0x2498df.sendMessage(_0x5cc45, {
                        'text': "❌ *Please Give me message!*\n\n" + envData.PREFIX + "send <Jid>"
                      }, {
                        'quoted': _0x21b0a3
                      });
                      return await _0x2498df.sendMessage(_0x5cc45, {
                        'react': {
                          'text': '❓',
                          'key': _0xaf5f64.key
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (_0x4da8a9) {
    console.log(_0x4da8a9);
    return _0x55265b("error!!");
  }
});

cmd({
  'pattern': "channelreact",
  'alias': ["chr"],
  'react': '📕',
  'use': ".channelreact *<link>,<emoji>*",
  'desc': "React to a message in a WhatsApp Channel.",
  'category': "main",
  'filename': __filename
}, async (_0x1b7441, _0x12d2a5, _0x1838a2, {
  q: _0x4951a4,
  isSudo: _0x213eb1,
  isOwner: _0x454fde,
  isMe: _0x3c82ee,
  reply: _0x469b44
}) => {
  try {
    if (!_0x3c82ee && !_0x454fde && !_0x213eb1) {
      return await _0x469b44("*📛OWNER COMMAND*");
    }
    if (!_0x4951a4 || typeof _0x4951a4 !== 'string' || !_0x4951a4.includes(',')) {
      return _0x469b44("❌ Invalid format. Use: .channelreact <link>,<emoji>");
    }
    let [_0xad711d, _0x285fa2] = _0x4951a4.split(',');
    if (!_0xad711d || !_0x285fa2) {
      return _0x469b44("❌ Missing link or emoji.");
    }
    if (!_0xad711d.startsWith('https://whatsapp.com/channel/')) {
      return _0x469b44("❌ Invalid channel link.");
    }
    const _0x1c399c = _0xad711d.split('/');
    const _0x37a254 = _0x1c399c[0x4];
    const _0x53b967 = _0x1c399c[0x5];
    const _0x4f101f = await _0x1b7441.newsletterMetadata("invite", _0x37a254);
    await _0x1b7441.newsletterReactMessage(_0x4f101f.id, _0x53b967, _0x285fa2.trim());
    _0x469b44("*✅ Reacted with " + _0x285fa2.trim() + " to the message.*");
  } catch (_0x22cdba) {
    console.log(_0x22cdba);
    _0x469b44("❌ Error: " + _0x22cdba.message);
  }
});

cmd({
  'pattern': 'forward',
  'react': '',
  'alias': ['f'],
  'desc': "forwerd film and msg",
  'use': ".f jid",
  'category': "owner",
  'filename': __filename
}, async (_0x3957e2, _0x70a364, _0x1a6f41, {
  from: _0x2905db,
  l: _0x201eb9,
  prefix: _0x5c2a4d,
  quoted: _0x146cb6,
  body: _0x1784dc,
  isCmd: _0x1c5fdb,
  isSudo: _0x38374f,
  isOwner: _0x444748,
  isMe: _0x240032,
  command: _0x51a566,
  args: _0x171078,
  q: _0x18448d,
  isGroup: _0x18111c,
  sender: _0x250a24,
  senderNumber: _0x489f87,
  botNumber2: _0x2014ec,
  botNumber: _0x1fb5d8,
  pushname: _0x1cd217,
  isIsuru: _0x53d056,
  isTharu: _0x53b7d2,
  isSupporters: _0xdefb3b,
  groupMetadata: _0x2c641f,
  groupName: _0x404a90,
  participants: _0x3b8892,
  groupAdmins: _0x4ab1fb,
  isBotAdmins: _0x2d5409,
  isAdmins: _0x4da753,
  reply: _0x1e14a8
}) => {
  if (!_0x240032 && !_0x444748 && !_0x38374f) {
    return await _0x1e14a8("*📛OWNER COMMAND*");
  }
  if (!_0x18448d || !_0x1a6f41.quoted) {
    return _0x1e14a8("*Please give me a Jid and Quote a Message to continue.*");
  }
  let _0x49a771 = _0x18448d.split(',').map(_0x2b8be7 => _0x2b8be7.trim());
  if (_0x49a771.length === 0x0) {
    return _0x1e14a8("*Provide at least one Valid Jid. ⁉️*");
  }
  let _0x33e00f = {
    'key': _0x70a364.quoted?.["fakeObj"]?.['key']
  };
  if (_0x70a364.quoted.documentWithCaptionMessage?.["message"]?.["documentMessage"]) {
    let _0xcf5c52 = _0x70a364.quoted.documentWithCaptionMessage.message.documentMessage;
    const _0x235a7a = require("mime-types");
    let _0x5e4ffa = _0x235a7a.extension(_0xcf5c52.mimetype) || 'file';
    _0xcf5c52.fileName = _0xcf5c52.fileName || "file." + _0x5e4ffa;
  }
  _0x33e00f.message = _0x70a364.quoted;
  let _0x325b43 = [];
  for (let _0x1300fd of _0x49a771) {
    try {
      await _0x3957e2.forwardMessage(_0x1300fd, _0x33e00f, false);
      _0x325b43.push(_0x1300fd);
    } catch (_0x39caaf) {
      console.log(e);
    }
  }
  if (_0x325b43.length > 0x0) {
    return _0x1e14a8("*Message Forwarded*\n\n" + _0x325b43.join("\n"));
  } else {
    console.log(e);
  }
});

cmd({
  'pattern': "rename",
  'alias': ['r'],
  'desc': "Forward media/messages with optional rename and caption",
  'use': ".r jid1,jid2 | filename (without ext) | new caption (quote a message)",
  'category': 'main',
  'filename': __filename
}, async (_0x174726, _0x42d2c4, _0x41e257, {
  reply: _0x4e5163,
  isSudo: _0x2ecf35,
  isOwner: _0x569aa3,
  isMe: _0x5eb9b8,
  q: _0xb02c5b
}) => {
  if (!_0x5eb9b8 && !_0x569aa3 && !_0x2ecf35) {
    return await _0x4e5163("*📛OWNER COMMAND*");
  }
  if (!_0xb02c5b || !_0x41e257.quoted) {
    return _0x4e5163("*Please provide JIDs and quote a message to forward.*");
  }
  const _0x13409a = require("mime-types");
  const _0x1dadbc = _0xb02c5b.split('|').map(_0xf1314 => _0xf1314.trim());
  const _0x592ec7 = _0x1dadbc[0x0];
  const _0x150819 = _0x1dadbc[0x1];
  const _0x170391 = _0x1dadbc[0x2];
  const _0x24f4a9 = _0x592ec7.split(',').map(_0x18fb44 => _0x18fb44.trim()).filter(_0x378dd4 => _0x378dd4);
  if (_0x24f4a9.length === 0x0) {
    return _0x4e5163("*Provide at least one valid JID.*");
  }
  const _0x365fa8 = _0x42d2c4.quoted;
  let _0x544b5b = _0x365fa8?.["message"] || _0x365fa8;
  const _0x1d4f41 = {
    'key': _0x365fa8?.["fakeObj"]?.["key"],
    'message': JSON.parse(JSON.stringify(_0x544b5b))
  };
  if (_0x1d4f41.message?.["documentMessage"]) {
    const _0x591907 = _0x1d4f41.message.documentMessage;
    const _0x75f91 = _0x13409a.extension(_0x591907.mimetype) || "file";
    if (_0x150819) {
      _0x591907.fileName = _0x150819 + '.' + _0x75f91;
    } else {
      _0x591907.fileName = "Forwarded_File_" + Date.now() + '.' + _0x75f91;
    }
  }
  if (_0x170391) {
    const _0x35dc75 = ['imageMessage', 'videoMessage', "documentMessage", "audioMessage"];
    for (const _0x22e105 of _0x35dc75) {
      if (_0x1d4f41.message[_0x22e105]) {
        _0x1d4f41.message[_0x22e105].caption = _0x170391;
      }
    }
  }
  const _0x51c101 = [];
  for (let _0x25762a of _0x24f4a9) {
    try {
      await _0x174726.forwardMessage(_0x25762a, _0x1d4f41, false);
      _0x51c101.push(_0x25762a);
    } catch (_0x219f55) {
      console.log("❌ Failed to forward to " + _0x25762a + ':', _0x219f55);
    }
  }
  return _0x51c101.length > 0x0 ? _0x4e5163("✅ *Message forwarded to:*\n" + _0x51c101.join("\n")) : _0x4e5163("❌ *Failed to forward message to any JID.*");
});

cmd({
  'pattern': "download",
  'react': '🍟',
  'alias': ["fetch"],
  'desc': "Direct downloader from a link",
  'category': "movie",
  'use': ".directdl <Direct Link>",
  'dontAddCommandList': false,
  'filename': __filename
}, async (_0x309072, _0x78741b, _0x2677ac, {
  from: _0x30c353,
  q: _0x149e9f,
  reply: _0x29005e
}) => {
  try {
    if (!_0x149e9f) {
      return _0x29005e("❗ Please provide a direct download link.");
    }
    const _0x3a68b9 = _0x149e9f.trim();
    const _0x30c794 = /^(https?:\/\/[^\s]+)/;
    if (!_0x30c794.test(_0x3a68b9)) {
      return _0x29005e("❗ The provided URL is invalid. Please check the link and try again.");
    }
    await _0x309072.sendMessage(_0x30c353, {
      'react': {
        'text': '⬇️',
        'key': _0x78741b.key
      }
    });
    let _0x1602ef = "video/mp4";
    let _0x5c6041 = "downloaded_video.mp4";
    try {
      const _0x21166f = await axios.head(_0x3a68b9);
      const _0x525d16 = _0x21166f.headers["content-type"];
      if (_0x525d16) {
        _0x1602ef = _0x525d16;
      }
      const _0x4e3202 = _0x21166f.headers['content-disposition'];
      if (_0x4e3202 && _0x4e3202.includes("filename=")) {
        const _0x3e5c7d = _0x4e3202.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (_0x3e5c7d && _0x3e5c7d[0x1]) {
          _0x5c6041 = _0x3e5c7d[0x1].replace(/['"]/g, '');
        }
      } else {
        const _0x24afa0 = new URL(_0x3a68b9).pathname;
        const _0x34171c = path.basename(_0x24afa0);
        if (_0x34171c) {
          _0x5c6041 = _0x34171c;
        }
      }
    } catch (_0x5843e2) {
      const _0x2baca5 = new URL(_0x3a68b9).pathname;
      const _0x9c13ac = path.basename(_0x2baca5);
      if (_0x9c13ac) {
        _0x5c6041 = _0x9c13ac;
      }
    }
    await _0x309072.sendMessage(_0x30c353, {
      'document': {
        'url': _0x3a68b9
      },
      'caption': config.FOOTER,
      'mimetype': _0x1602ef,
      'fileName': _0x5c6041
    });
    await _0x309072.sendMessage(_0x30c353, {
      'react': {
        'text': '✅',
        'key': _0x78741b.key
      }
    });
  } catch (_0x3f3424) {
    _0x29005e("❗ Error occurred: " + _0x3f3424.message);
  }
});
cmd({
  'pattern': 'id',
  'react': '⚜',
  'alias': ['getdeviceid'],
  'desc': "Get message id",
  'category': "main",
  'use': ".id",
  'filename': __filename
}, async (_0x18a183, _0x572e6a, _0x3b75a0, {
  from: _0x3c498b,
  l: _0x2a3469,
  quoted: _0x100b88,
  isSudo: _0x1961d9,
  body: _0x4a0565,
  isCmd: _0xcd8bb3,
  msr: _0x484869,
  command: _0x4586b8,
  args: _0x529652,
  q: _0x4a6ffb,
  isGroup: _0x56fe8c,
  sender: _0x18ae6c,
  senderNumber: _0x566c7c,
  botNumber2: _0x36c615,
  botNumber: _0x5cf368,
  pushname: _0x1b7d9e,
  isMe: _0x99bbc3,
  isOwner: _0xfcd182,
  groupMetadata: _0x40e0a4,
  groupName: _0x23f757,
  participants: _0x2b58f7,
  groupAdmins: _0x18dfcc,
  isBotAdmins: _0x1c44e6,
  isCreator: _0xe3a195,
  isDev: _0x4ba8d7,
  isAdmins: _0x5c9d5a,
  reply: _0x303a97
}) => {
  try {
    if (!_0x99bbc3 && !_0xfcd182 && !_0x1961d9) {
      return await _0x303a97("*📛OWNER COMMAND*");
    }
    if (!_0x3b75a0.quoted) {
      return _0x303a97("*Please reply a Message... ℹ️*");
    }
    _0x303a97(_0x3b75a0.quoted.id);
  } catch (_0x4c3a3d) {
    await _0x18a183.sendMessage(_0x3c498b, {
      'react': {
        'text': '❌',
        'key': _0x572e6a.key
      }
    });
    console.log(_0x4c3a3d);
    _0x303a97("❌ *Error Accurated !!*\n\n" + _0x4c3a3d);
  }
});
cmd({
  'pattern': "follow",
  'react': 'ℹ️',
  'alias': ['fl'],
  'desc': "Follow chanals",
  'category': 'main',
  'use': ".follow",
  'filename': __filename
}, async (_0x14b360, _0x104689, _0x1718ad, {
  from: _0xdf82ce,
  l: _0x2d5ebb,
  quoted: _0x366b75,
  isSudo: _0x1b9278,
  body: _0x37192d,
  isCmd: _0x38e365,
  msr: _0x3efd85,
  command: _0x204c74,
  args: _0x27fddf,
  q: _0x261bc6,
  isGroup: _0x254829,
  sender: _0x354be1,
  senderNumber: _0x25b25f,
  botNumber2: _0x26d566,
  botNumber: _0x3eb725,
  pushname: _0x3dfd84,
  isMe: _0x164cdc,
  groupMetadata: _0x39433f,
  groupName: _0x383904,
  participants: _0x309bcd,
  groupAdmins: _0x2ab2df,
  isBotAdmins: _0x3f6e8c,
  isCreator: _0x7369d0,
  isDev: _0x33fd6b,
  isOwner: _0x271f79,
  isAdmins: _0x4d31b1,
  reply: _0xc1894b
}) => {
  try {
    if (!_0x164cdc && !_0x271f79 && !_0x1b9278) {
      return await _0xc1894b("*📛 OWNER COMMAND*");
    }
    if (!_0x261bc6) {
      return await _0xc1894b("❗ Please provide a newsletter ID to follow.");
    }
    await _0x14b360.newsletterFollow(_0x261bc6);
    _0xc1894b("*✅ Successfully followed newsletter:* *" + _0x261bc6 + '*');
  } catch (_0x52f86e) {
    console.error(_0x52f86e);
    _0xc1894b("❌ *Error occurred!*\n\n" + (_0x52f86e.message || _0x52f86e));
  }
});
