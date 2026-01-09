const config = require('../config');
const prefix = config.PREFIX;
const fs = require('fs');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../lib/functions2');
const { writeFileSync } = require('fs');
const path = require('path');
const os = require("os")

cmd({
     pattern: "setting",
     alias: ["settings"],
     desc: "settings the bot",
     category: "owner",
     react: "⚙",
     filename: __filename
},
async (conn, mek, m, { from, isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    try {
        // --- NEW STYLE SETTINGS MESSAGE START ---
        let desc = `
*_⚙ BOT SETTING PANEL_*

*🎩 WORK MODE*
1.1 ⟩  Public
1.2 ⟩  Private
1.3 ⟩  Groups

*🎩 WELCOME MESSAGE*
2.1 ⟩  Welcome ON
2.2 ⟩  Welcome OFF

*🎩 AUTO TYPING*
3.1 ⟩  Typing ON
3.2 ⟩  Typing OFF

*🎩 AUTO RECORDING*
4.1 ⟩  Recording ON
4.2 ⟩  Recording OFF

*🎩 AUTO SEEN STATUS*
5.1 ⟩  Seen ON
5.2 ⟩  Seen OFF

*🎩 AUTO REACT*
6.1 ⟩  React ON
6.2 ⟩  React OFF

*🎩 MESSAGE READ*
7.1 ⟩  Read MSG ON
7.2 ⟩  Read MSG OFF

*🎩 ANTI LINK*
9.1 ⟩  Anti Link ON
9.2 ⟩  Anti Link OFF
9.3 ⟩  Anti Link REMOVE

*🎩 AUTO VOICE*
10.1 ⟩  Auto Voice ON
10.2 ⟩  Auto Voice OFF

*🎩 ANTI DELETE*
11.1 ⟩  Anti Delete ON
11.2 ⟩  Anti Delete OFF

*🎩 ALWAYS ONLINE*
12.1 ⟩  Always Online ON
12.2 ⟩  Always Online OFF

*🎩 AUTO REPLY*
13.1 ⟩  Auto Reply ON
13.2 ⟩  Auto Reply OFF

*🎩 STATUS REACT*
14.1 ⟩  Status React ON
14.2 ⟩  Status React OFF

*🎩 GOODBYE MESSAGE*
15.1 ⟩  Goodbye ON
15.2 ⟩  Goodbye OFF

> ${config.DESCRIPTION}
`;



// --- NEW STYLE SETTINGS MESSAGE END ---  

    const vv = await conn.sendMessage(from, { image:  { url: config.MENU_IMAGE_URL }, caption: desc }, { quoted: mek });  

    conn.ev.on('messages.upsert', async (msgUpdate) => {  
        const msg = msgUpdate.messages[0];  
        if (!msg.message || !msg.message.extendedTextMessage) return;  

        const selectedOption = msg.message.extendedTextMessage.text.trim();  

        if (msg.message.extendedTextMessage.contextInfo && msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id) {  
            switch (selectedOption) {  
                case '1.1':  
                    reply(".mode public" );  
                break;  
                case '1.2':                 
                    reply(".mode private");  
                break;  
                case '1.3':       
                    reply(".mode groups");  
                break; 
                case '2.1':       
                    reply(".welcome on");  
                break;  
                case '2.2':       
                    reply(".welcome off");  
                break;  
                case '3.1':      
                    reply(".auto-typing on");  
                break;  
                case '3.2':      
                    reply(".auto-typing off");  
                break;                      
                case '4.1':      
                    reply(".auto-recording on");  
                break;  
                case '4.2':      
                    reply(".auto-recording off");  
                break;                                          
                case '5.1':      
                    reply(".auto-seen on");  
                break;  
                case '5.2':      
                    reply(".auto-seen off");  
                break;                          
                case '6.1':      
                    reply(".auto-react on");  
                break;   
                case '6.2':      
                    reply(".auto-react off");  
                break;                         
                case '7.1':      
                    reply(".read-message on");  
                break;  
                case '7.2':      
                    reply(".read-message off");  
                break;  
                case '9.1':      
                    reply(".antilink on");   
                break;  
                case '9.2':      
                    reply(".antilink off");  
                break;  
                case '9.3':      
                    reply(".update ANTI_LINK:false");  
                break;  
                case '10.1':      
                    reply(".auto-voice on");  
                break;  
                case '10.2':      
                    reply(".auto-voice off");  
                break;        
                case '11.1':      
                    reply(".antidelete on");  
                break;  
                case '11.2':      
                    reply(".antidelete off");  
                break;          
                case '12.1':      
                    reply(".always-online on");  
                break;  
                case '12.2':      
                    reply(".always-online off");  
                break;                      
                case '13.1':      
                    reply(".auto-reply on");  
                break;  
                case '13.2':      
                    reply(".auto-reply off");  
                break;   
                case '14.1':      
                    reply(".status-react on");  
                break;  
                case '14.2':      
                    reply(".status-react off");  
                break;  
                case '15.1':      
                    reply(".goodbye on");  
                break;  
                case '15.2':      
                    reply(".goodbye off");  
                break;                                                                                                                                                                                                                                                                            
                default:  
                    reply("Invalid option. Please select a valid option🔴");  
            }  

        }  
    });  

} catch (e) {  
    console.error(e);  
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })  
    reply('An error occurred while processing your request.');  
}

});

// --- WELCOME ---
cmd({
    pattern: "welcome",
    alias: ["welcomeset"],
    desc: "Enable or disable welcome messages",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.WELCOME = "true";
        return reply("*✅ WELCOME MESSAGE HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.WELCOME = "false";
        return reply("*❌ WELCOME MESSAGE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}welcome on/off*`);
    }
});

// --- GOODBYE ---
cmd({
    pattern: "goodbye",
    alias: ["good-bye"],
    desc: "Enable or disable goodbye messages",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.GOODBYE = "true";
        return reply("*✅ GOODBYE MESSAGE HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.GOODBYE = "false";
        return reply("*❌ GOODBYE MESSAGE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}goodbye on/off*`);
    }
});

// --- SETPREFIX ---
cmd({
    pattern: "setprefix",
    alias: ["prefix"],
    react: "🔧",
    desc: "Change the bot's command prefix.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const newPrefix = args[0];
    if (!newPrefix) return reply("*❌ PLEASE PROVIDE A NEW PREFIX*");
    config.PREFIX = newPrefix;
    return reply(`*✅ PREFIX SUCCESSFULLY CHANGED TO: ${newPrefix}*`);
});

cmd({
    pattern: "mode",
    alias: ["setmode"],
    desc: "Set bot mode to private, public or groups.",
    category: "settings",
    filename: __filename,
}, async (conn, mek, m, { from, args, isCreator, reply }) => {

    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");

    if (!args[0]) {
        return reply(`*📌 CURRENT MODE: ${config.MODE.toUpperCase()}*\n\n*USAGE:* \n.mode public\n.mode private\n.mode groups`);
    }

    const modeArg = args[0].toLowerCase();

    if (["private", "public", "groups"].includes(modeArg)) {
        config.MODE = modeArg;

        let msg = "";
        switch(modeArg) {
            case "private": msg = "*✅ BOT MODE UPDATED TO: PRIVATE (OWNER ONLY)*"; break;
            case "public":  msg = "*✅ BOT MODE UPDATED TO: PUBLIC (EVERYONE)*"; break;
            case "groups":  msg = "*✅ BOT MODE UPDATED TO: GROUPS ONLY*"; break;
        }
        
        return reply(msg);
    } else {
        return reply("*❌ INVALID MODE! USE: PUBLIC, PRIVATE, OR GROUPS*");
    }
});

// --- AUTO TYPING ---
cmd({
    pattern: "auto-typing",
    description: "Enable or disable auto-typing feature.",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_TYPING = "true";
        return reply("*✅ AUTO TYPING HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.AUTO_TYPING = "false";
        return reply("*❌ AUTO TYPING HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-typing on/off*`);
    }
});

// --- ALWAYS ONLINE ---
cmd({
    pattern: "always-online",
    alias: ["alwaysonline"],
    desc: "Enable or disable the always online mode",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ALWAYS_ONLINE = "true";
        return reply("*✅ ALWAYS ONLINE HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.ALWAYS_ONLINE = "false";
        return reply("*❌ ALWAYS ONLINE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}always-online on/off*`);
    }
});

// --- ANTI DELETE ---
cmd({
    pattern: "antidelete",
    alias: ["anti-delete"],
    desc: "Enable or disable Anti-Delete",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.ANTI_DELETE = "true";
        return reply("*✅ ANTI DELETE HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.ANTI_DELETE = "false";
        return reply("*❌ ANTI DELETE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}antidelete on/off*`);
    }
});

// --- AUTO RECORDING ---
cmd({
    pattern: "auto-recording",
    alias: ["autorecoding"],
    description: "Enable or disable auto-recording",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    const status = args[0]?.toLowerCase();
    if (status === "on") {
        config.AUTO_RECORDING = "true";
        await conn.sendPresenceUpdate("recording", from);
        return reply("*✅ AUTO RECORDING HAS BEEN ENABLED*");
    } else if (status === "off") {
        config.AUTO_RECORDING = "false";
        await conn.sendPresenceUpdate("available", from);
        return reply("*❌ AUTO RECORDING HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-recording on/off*`);
    }
});

// --- AUTO STATUS SEEN ---
cmd({
    pattern: "auto-seen",
    alias: ["autostatusview"],
    desc: "Enable or disable auto-viewing of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_STATUS_SEEN = "true";
        return reply("*✅ AUTO STATUS SEEN HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_STATUS_SEEN = "false";
        return reply("*❌ AUTO STATUS SEEN HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-seen on/off*`);
    }
}); 

// --- STATUS REACT ---
cmd({
    pattern: "status-react",
    alias: ["statusreaction"],
    desc: "Enable or disable auto-liking of statuses",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_STATUS_REACT = "true";
        return reply("*✅ AUTO STATUS REACT HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_STATUS_REACT = "false";
        return reply("*❌ AUTO STATUS REACT HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}status-react on/off*`);
    }
});

// --- READ MESSAGE ---
cmd({
    pattern: "read-message",
    alias: ["autoread"],
    desc: "Enable or disable blue ticks",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.READ_MESSAGE = "true";
        return reply("*✅ AUTO READ MESSAGE HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.READ_MESSAGE = "false";
        return reply("*❌ AUTO READ MESSAGE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}read-message on/off*`);
    }
});

// --- AUTO VOICE ---
cmd({
    pattern: "auto-voice",
    alias: ["autovoice"],
    desc: "Enable or disable auto-voice reply",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_VOICE = "true";
        return reply("*✅ AUTO VOICE HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_VOICE = "false";
        return reply("*❌ AUTO VOICE HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-voice on/off*`);
    }
});

// --- ANTI BAD ---
cmd({
    pattern: "anti-bad",
    alias: ["antibadword"],
    desc: "Enable or disable Anti-Bad Word",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.ANTI_BAD_WORD = "true";
        return reply("*✅ ANTI BAD WORD HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.ANTI_BAD_WORD = "false";
        return reply("*❌ ANTI BAD WORD HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}anti-bad on/off*`);
    }
});

// --- AUTO STICKER ---
cmd({
    pattern: "auto-sticker",
    alias: ["autosticker"],
    desc: "Enable or disable auto-sticker",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_STICKER = "true";
        return reply("*✅ AUTO STICKER HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_STICKER = "false";
        return reply("*❌ AUTO STICKER HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-sticker on/off*`);
    }
});

// --- AUTO REPLY ---
cmd({
    pattern: "auto-reply",
    alias: ["autoreply"],
    desc: "Enable or disable auto-reply",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_REPLY = "true";
        return reply("*✅ AUTO REPLY HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_REPLY = "false";
        return reply("*❌ AUTO REPLY HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-reply on/off*`);
    }
});

// --- AUTO REACT ---
cmd({
    pattern: "auto-react",
    alias: ["autoreact"],
    desc: "Enable or disable auto-react",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    if (!isCreator) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
    if (args[0] === "on") {
        config.AUTO_REACT = "true";
        return reply("*✅ AUTO REACT HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
        config.AUTO_REACT = "false";
        return reply("*❌ AUTO REACT HAS BEEN DISABLED*");
    } else {
        return reply(`*USE: ${prefix}auto-react on/off*`);
    }
});

// --- ANTI LINK ---
cmd({
  pattern: "antilink",
  alias: ["antilinks"],
  desc: "Enable or disable ANTI_LINK in groups",
  category: "group",
  react: "🚫",
  filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    if (!isGroup) return reply('*❌ THIS COMMAND IS ONLY FOR GROUPS!*');
    if (!isBotAdmins) return reply('*❌ BOT MUST BE ADMIN FIRST!*');
    if (!isAdmins) return reply('*❌ ONLY GROUP ADMINS CAN USE THIS!*');

    if (args[0] === "on") {
      config.ANTI_LINK = "true";
      return reply("*✅ ANTI LINK HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
      config.ANTI_LINK = "false";
      return reply("*❌ ANTI LINK HAS BEEN DISABLED*");
    } else {
      return reply(`*USE: ${prefix}antilink on/off*`);
    }
});

// --- ANTI LINK KICK ---
cmd({
  pattern: "antilinkkick",
  alias: ["kicklink"],
  desc: "Enable or disable ANTI_LINK_KICK in groups",
  category: "group",
  react: "⚠️",
  filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    if (!isGroup) return reply('*❌ THIS COMMAND IS ONLY FOR GROUPS!*');
    if (!isBotAdmins) return reply('*❌ BOT MUST BE ADMIN FIRST!*');
    if (!isAdmins) return reply('*❌ ONLY GROUP ADMINS CAN USE THIS!*');

    if (args[0] === "on") {
      config.ANTI_LINK_KICK = "true";
      return reply("*✅ ANTI LINK KICK HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
      config.ANTI_LINK_KICK = "false";
      return reply("*❌ ANTI LINK KICK HAS BEEN DISABLED*");
    } else {
      return reply(`*USE: ${prefix}antilinkkick on/off*`);
    }
});

// --- DELETE LINK ---
cmd({
  pattern: "deletelink",
  alias: ["linksdelete"],
  desc: "Enable or disable DELETE_LINKS in groups",
  category: "group",
  react: "❌",
  filename: __filename
}, async (conn, mek, m, { isGroup, isAdmins, isBotAdmins, args, reply }) => {
    if (!isGroup) return reply('*❌ THIS COMMAND IS ONLY FOR GROUPS!*');
    if (!isBotAdmins) return reply('*❌ BOT MUST BE ADMIN FIRST!*');
    if (!isAdmins) return reply('*❌ ONLY GROUP ADMINS CAN USE THIS!*');

    if (args[0] === "on") {
      config.DELETE_LINKS = "true";
      return reply("*✅ DELETE LINKS HAS BEEN ENABLED*");
    } else if (args[0] === "off") {
      config.DELETE_LINKS = "false";
      return reply("*❌ DELETE LINKS HAS BEEN DISABLED*");
    } else {
      return reply(`*USE: ${prefix}deletelink on/off*`);
    }
});
