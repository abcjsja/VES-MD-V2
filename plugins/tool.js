const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const translate = require('@vitalets/google-translate-api');
const PDFDocument = require('pdfkit');
const { fetchJson } = require('../lib/functions');
const config = require("../config");
const { cmd, commands } = require("../command");

// COUNTRY INFO
cmd({
  pattern: "countryinfo",
  alias: ["cinfo", "country", "cinfo2"],
  desc: "Get information about a country",
  category: "info",
  react: "🌍",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, react }) => {
  try {
    if (!q) return reply("Please provide a country name.\nExample: `.countryinfo Pakistan`");

    const apiUrl = `https://api.siputzx.my.id/api/tools/countryInfo?name=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.data) {
      await react("❌");
      return reply(`No information found for *${q}*. Please check the country name.`);
    }

    const info = data.data;
    let neighborsText = info.neighbors.length > 0
      ? info.neighbors.map(n => `🌍 *${n.name}*`).join(", ")
      : "No neighboring countries found.";

    const text = `🌍 *Country Information: ${info.name}* 🌍\n\n` +
      `🏛 *Capital:* ${info.capital}\n` +
      `📍 *Continent:* ${info.continent.name} ${info.continent.emoji}\n` +
      `📞 *Phone Code:* ${info.phoneCode}\n` +
      `📏 *Area:* ${info.area.squareKilometers} km² (${info.area.squareMiles} mi²)\n` +
      `🚗 *Driving Side:* ${info.drivingSide}\n` +
      `💱 *Currency:* ${info.currency}\n` +
      `🔤 *Languages:* ${info.languages.native.join(", ")}\n` +
      `🌟 *Famous For:* ${info.famousFor}\n` +
      `🌍 *ISO Codes:* ${info.isoCode.alpha2.toUpperCase()}, ${info.isoCode.alpha3.toUpperCase()}\n` +
      `🌎 *Internet TLD:* ${info.internetTLD}\n\n` +
      `🔗 *Neighbors:* ${neighborsText}`;

    await conn.sendMessage(from, {
      image: { url: info.flag },
      caption: text,
      contextInfo: { mentionedJid: [m.sender] }
    }, { quoted: mek });

    await react("✅");
  } catch (e) {
    console.error("Error in countryinfo command:", e);
    await react("❌");
    reply("An error occurred while fetching country information.");
  }
});

// MSG

cmd({
  pattern: "msg",
  desc: "Send a message multiple times (Owner Only)",
  category: "utility",
  react: "👾",
  filename: __filename
},
async (conn, mek, m, {
  from,
  reply,
  isCreator,
  q
}) => {
  // Owner-only restriction
  if (!isCreator) return reply('🚫 *Owner only command!*');

  try {
    // Check format: .msg text,count
    if (!q.includes(',')) {
      return reply("❌ *Format:* .msg text,count\n*Example:* .msg Hello,5");
    }

    const [message, countStr] = q.split(',');
    const count = parseInt(countStr.trim());

    // Hard limit: 1-100 messages
    if (isNaN(count) || count < 1 || count > 1000) {
      // Fixed the error message to be more accurate
      return reply("❌ *Message count must be between 1 and 1000.*");
    }

    // Silent execution (no confirmations)
    for (let i = 0; i < count; i++) {
      await conn.sendMessage(from, {
        text: message
      }, {
        quoted: null
      });
      if (i < count - 1) await new Promise(resolve => setTimeout(resolve, 100)); // 500ms delay
    }

  } catch (e) {
    console.error("Error in msg command:", e);
    reply(`❌ *Error:* ${e.message}`);
  }
});

//temp mail



cmd({
    pattern: "weather",
    desc: "🌤 Get weather information for a location",
    react: "🌤",
    category: "other",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❗ Please provide a city name. Usage: .weather [city name]");
        const apiKey = '2d61a72574c11c4f36173b627f8cb177'; 
        const city = q;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const response = await axios.get(url);
        const data = response.data;
        const weather = `
🌍 *Weather Information for ${data.name}, ${data.sys.country}* 🌍
🌡️ *Temperature*: ${data.main.temp}°C
🌡️ *Feels Like*: ${data.main.feels_like}°C
🌡️ *Min Temp*: ${data.main.temp_min}°C
🌡️ *Max Temp*: ${data.main.temp_max}°C
💧 *Humidity*: ${data.main.humidity}%
☁️ *Weather*: ${data.weather[0].main}
🌫️ *Description*: ${data.weather[0].description}
💨 *Wind Speed*: ${data.wind.speed} m/s
🔽 *Pressure*: ${data.main.pressure} hPa

> ${config.DESCRIPTION}
`;
        return reply(weather);
    } catch (e) {
        console.log(e);
        if (e.response && e.response.status === 404) {
            return reply("🚫 City not found. Please check the spelling and try again.");
        }
        return reply("⚠️ An error occurred while fetching the weather information. Please try again later.");
    }
});

cmd({
    pattern: "trsi",
    desc: "Translate English → Sinhala (reply to a message)",
    category: "tools",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { reply, react }) => {
    const msg = m.quoted?.text;
    if (!msg) return reply("කරුණාකර reply message එකක් දෙන්න.");

    try {
        const res = await translate(msg, { to: 'si' });
        await react("✅");
        return reply(`🇱🇰 *සිංහලට පරිවර්තනය:* \n\n${res.text}`);
    } catch (e) {
        console.error("Translate Error:", e);
        await react("❌");
        return reply("පරිවර්තනය අසාර්ථකයි.");
    }
});

// Sinhala ➜ English
cmd({
    pattern: "tren",
    desc: "Translate Sinhala → English (reply to a message)",
    category: "tools",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { reply, react }) => {
    const msg = m.quoted?.text;
    if (!msg) return reply("Please reply to a Sinhala message to translate.");

    try {
        const res = await translate(msg, { to: 'en' });
        await react("✅");
        return reply(`🇬🇧 *Translated to English:* \n\n${res.text}`);
    } catch (e) {
        console.error("Translate Error:", e);
        await react("❌");
        return reply("Translation failed.");
    }
});


cmd({
    pattern: "tts",
    desc: "Convert Sinhala text to speech",
    react: "🗣️",
    filename: __filename
}, async (conn, m, msg, { text, from }) => {
    if (!text) {
        return await conn.sendMessage(from, { text: "උදාහරණයක්: `.tts ඔයාට කොහොමද කියලා`" });
    }

    try {
        const ttsRes = await axios({
            method: "GET",
            url: `https://translate.google.com/translate_tts`,
            params: {
                ie: "UTF-8",
                q: text,
                tl: "si",
                client: "tw-ob"
            },
            responseType: "arraybuffer"
        });

        const filePath = path.join(__dirname, '../temp', `${Date.now()}.mp3`);
        fs.writeFileSync(filePath, ttsRes.data);

        await conn.sendMessage(from, {
            audio: fs.readFileSync(filePath),
            mimetype: 'audio/mp4',
            ptt: true
        });

        fs.unlinkSync(filePath);
    } catch (err) {
        console.error("TTS Error:", err);
        await conn.sendMessage(from, { text: "වදිනවා! TTS voice එක generate කරන්න බැරි වුණා." });
    }
});


cmd({
    pattern: "person",
    react: "👤",
    alias: ["userinfo", "profile"],
    desc: "Get complete user profile information",
    category: "utility",
    use: '.person [@tag or reply]',
    filename: __filename
},
async (conn, mek, m, { from, sender, isGroup, reply, quoted, participants }) => {
    try {
        // 1. DETERMINE TARGET USER
        let userJid = quoted?.sender || 
                     mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                     sender;

        // 2. VERIFY USER EXISTS
        const [user] = await conn.onWhatsApp(userJid).catch(() => []);
        if (!user?.exists) return reply("❌ User not found on WhatsApp");

        // 3. GET PROFILE PICTURE
        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(userJid, 'image');
        } catch {
            ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
        }

        // 4. GET NAME (MULTI-SOURCE FALLBACK)
        let userName = userJid.split('@')[0];
        try {
            // Try group participant info first
            if (isGroup) {
                const member = participants.find(p => p.id === userJid);
                if (member?.notify) userName = member.notify;
            }
            
            // Try contact DB
            if (userName === userJid.split('@')[0] && conn.contactDB) {
                const contact = await conn.contactDB.get(userJid).catch(() => null);
                if (contact?.name) userName = contact.name;
            }
            
            // Try presence as final fallback
            if (userName === userJid.split('@')[0]) {
                const presence = await conn.presenceSubscribe(userJid).catch(() => null);
                if (presence?.pushname) userName = presence.pushname;
            }
        } catch (e) {
            console.log("Name fetch error:", e);
        }

        // 5. GET BIO/ABOUT
        let bio = {};
        try {
            // Try personal status
            const statusData = await conn.fetchStatus(userJid).catch(() => null);
            if (statusData?.status) {
                bio = {
                    text: statusData.status,
                    type: "Personal",
                    updated: statusData.setAt ? new Date(statusData.setAt * 1000) : null
                };
            } else {
                // Try business profile
                const businessProfile = await conn.getBusinessProfile(userJid).catch(() => null);
                if (businessProfile?.description) {
                    bio = {
                        text: businessProfile.description,
                        type: "Business",
                        updated: null
                    };
                }
            }
        } catch (e) {
            console.log("Bio fetch error:", e);
        }

        // 6. GET GROUP ROLE
        let groupRole = "";
        if (isGroup) {
            const participant = participants.find(p => p.id === userJid);
            groupRole = participant?.admin ? "👑 Admin" : "👥 Member";
        }

        // 7. FORMAT OUTPUT
        const formattedBio = bio.text ? 
            `${bio.text}\n└─ 📌 ${bio.type} Bio${bio.updated ? ` | 🕒 ${bio.updated.toLocaleString()}` : ''}` : 
            "No bio available";

        const userInfo = `
*GC MEMBER INFORMATION 🧊*

📛 *Name:* ${userName}
🔢 *Number:* ${userJid.replace(/@.+/, '')}
📌 *Account Type:* ${user.isBusiness ? "💼 Business" : user.isEnterprise ? "🏢 Enterprise" : "👤 Personal"}

*📝 About:*
${formattedBio}

*⚙️ Account Info:*
✅ Registered: ${user.isUser ? "Yes" : "No"}
🛡️ Verified: ${user.verifiedName ? "✅ Verified" : "❌ Not verified"}
${isGroup ? `👥 *Group Role:* ${groupRole}` : ''}
`.trim();

        // 8. SEND RESULT
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: userInfo,
            mentions: [userJid]
        }, { quoted: mek });

    } catch (e) {
        console.error("Person command error:", e);
        reply(`❌ Error: ${e.message || "Failed to fetch profile"}`);
    }
});

cmd({
    'pattern': 'logo2',
    'desc': 'Create logos',
    'react': '🎗',
    'category': 'other', // Likely the category for the bot menu
    'filename': __filename
}, async (message, chat, context, {
    from,
    quoted,
    body,
    isCmd,
    command,
    args,
    q: logoText, // The text provided by the user for the logo
    reply
}) => {
    try {
        // 1. Check if the user provided text
        if (!args[0]) {
            return reply('*_Please give me a text._*');
        }

        // 2. Construct the logo style selection menu
        let menuMessage = 
            '*🃏 VILON-X-MD LOGO MAKER 💫*\n\n' +
            '╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼➻\n' +
            `*◈ᴛᴇxᴛ :* ${logoText}\n` +
            '╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼╼➻\n\n' +
            '*🔢 Reply The Number You Want ➠*\n\n' +
            ' 1 ➠ Black Pink\n' +
            ' 2 ➠ Black Pink 2\n' +
            ' 3 ➠ Silver 3D\n' +
            ' 4 ➠ Naruto\n' +
            ' 5 ➠ Digital Glitch\n' +
            ' 6 ➠ Pixel Glitch\n' +
            ' 7 ➠ Comic Style\n' +
            ' 8 ➠ Neon Light\n' +
            ' 9 ➠ Free Bear\n' +
            '10 ➠ Devil Wings\n' +
            '11 ➠ Sad Girl\n' +
            '12 ➠ Leaves\n' +
            '13 ➠ Dragon Ball\n' +
            '14 ➠ Hand Written\n' +
            '15 ➠ Neon Light \n' +
            '16 ➠ 3D Castle Pop\n' +
            '17 ➠ Frozen Crismass\n' +
            '18 ➠ 3D Foil Balloons\n' +
            '19 ➠ 3D Colourful Paint\n' +
            '20 ➠ American Flag 3D\n\n' +
            '> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*\n\n' +
        
        // 3. Prepare context for a newsletter-style forwarded message (often used in WhatsApp bots)
        const forwardContext = {
            'newsletterJid': '120363352224008317@newslettter',
            'newsletterName': 'vilon-x-md',
            'serverMessageId': 999 
        };
        const messageContext = {
            'mentionedJid': [context.sender],
            'forwardingScore': 999,
            'isForwarded': true,
            'forwardedNewsletterMessageInfo': forwardContext
        };
        
        // 4. Send the menu message and store its reference
        const messageToSend = { 'text': menuMessage, 'contextInfo': messageContext };
        let sentMessage = await message.sendMessage(from, messageToSend, { 'quoted': chat });

        // 5. Listen for the user's reply (the selected number)
        message.ev.on('messages.upsert', async update => {
            const incomingMessage = update.messages[0];
            
            // Basic message validation
            if (!incomingMessage.message || !incomingMessage.message.extendedTextMessage) return;
            
            // Get the reply number (trimmed)
            const replyNumber = incomingMessage.message.extendedTextMessage.text.trim();
            
            // Check if the message is a reply to the menu we just sent
            if (incomingMessage.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {
                
                let apiUrl = '';
                const baseApi = 'https://api-pink-venom.vercel.app/api/logo?url=';
                const apiFooter = '&name=' + logoText;

                // 6. Select the correct API URL based on the reply number
                switch (replyNumber) {
                    case '1':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html' + apiFooter;
                        break;
                    case '2':
                        apiUrl = baseApi + 'https://en.ephoto360.com/online-blackpink-style-logo-maker-effect-711.html' + apiFooter;
                        break;
                    case '3':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html' + apiFooter;
                        break;
                    case '4':
                        apiUrl = baseApi + 'https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html' + apiFooter;
                        break;
                    case '5':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html' + apiFooter;
                        break;
                    case '6':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html' + apiFooter;
                        break;
                    case '7':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-online-3d-comic-style-text-effects-817.html' + apiFooter;
                        break;
                    case '8':
                    case '15': // Case 15 is a duplicate of Case 8
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html' + apiFooter;
                        break;
                    case '9':
                        apiUrl = baseApi + 'https://en.ephoto360.com/free-bear-logo-maker-online-673.html' + apiFooter;
                        break;
                    case '10':
                        apiUrl = baseApi + 'https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html' + apiFooter;
                        break;
                    case '11':
                        apiUrl = baseApi + 'https://en.ephoto360.com/write-text-on-wet-glass-online-589.html' + apiFooter;
                        break;
                    case '12':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-typography-status-online-with-impressive-leaves-357.html' + apiFooter;
                        break;
                    case '13':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html' + apiFooter;
                        break;
                    case '14':
                        apiUrl = baseApi + 'https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html' + apiFooter;
                        break;
                    case '16':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-a-3d-castle-pop-out-mobile-photo-effect-786.html' + apiFooter;
                        break;
                    case '17':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-a-frozen-christmas-text-effect-online-792.html' + apiFooter;
                        break;
                    case '18':
                        apiUrl = baseApi + 'https://en.ephoto360.com/beautiful-3d-foil-balloon-effects-for-holidays-and-birthday-803.html' + apiFooter;
                        break;
                    case '19':
                        apiUrl = baseApi + 'https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html' + apiFooter;
                        break;
                    case '20':
                        apiUrl = baseApi + 'https://en.ephoto360.com/free-online-american-flag-3d-text-effect-generator-725.html' + apiFooter;
                        break;
                    default:
                        // Invalid number reply
                        return reply('*_Invalid number.Please reply a valid number._*');
                }
                
                // 7. Fetch the logo from the API
                let logoData = await fetchJson(apiUrl);
                
                // 8. Send the generated image back to the user
                await message.sendMessage(from, {
                    'image': { 'url': logoData.result.download_url },
                    'caption': '> ${config.DESCRIPTION}'
                }, { 'quoted': chat });
            }
        });
    } catch (error) {
        console.log(error);
        reply('' + error);
    }
});
const axios = require('axios');

Cmd({
  pattern: 'logo',
  alias: ['logomaker', 'lgo'],
  react: '〽️',
  desc: 'Generate 100 logo styles based on user input',
  category: 'convert',
  use: ".logo <text>",
  filename: __filename
}, async (conn, mek, m, { from, reply, args, sender, config, bot }) => {
  try {
    const text = args.join(' ');

    if (!text) {
      reply('*Please provide a text to generate logo!* \nExample: .logo VES-MD');
      return;
    }

    // මෙනු එක (Box Design එකට)
    const messageText = `
    
🔢 Reply The Number You Want, *${text}* logo

 1 │❯❯◦ Black Pink 
 2 │❯❯◦ Black Pink style 
 3 │❯❯◦ Silver 3D  
 4 │❯❯◦ Naruto  
 5 │❯❯◦ Digital Glitch
 6 │❯❯◦ Birthday cake  
 7 │❯❯◦ Zodiac 
 8 │❯❯◦ Underwater 
 9 │❯❯◦ Glow 
10 │❯❯◦ Avatar gold 
11 │❯❯◦ Bokeh 
12 │❯❯◦ Fireworks 
13 │❯❯◦ Gaming logo 
14 │❯❯◦ Signature 
15 │❯❯◦ Luxury 
16 │❯❯◦ Dragon fire 
17 │❯❯◦ Queen card
18 │❯❯◦ Graffiti color   
19 │❯❯◦ Tattoo 
20 │❯❯◦ Pentakill 
21 │❯❯◦ Halloween 
22 │❯❯◦ Horror    
23 │❯❯◦ Blood 
24 │❯❯◦ Women's day    
25 │❯❯◦ Valentine 
26 │❯❯◦ Neon light 
27 │❯❯◦ Gaming assassin 
28 │❯❯◦ Foggy glass 
29 │❯❯◦ Sand summer beach 
30 │❯❯◦ Light 
31 │❯❯◦ Modern gold
32 │❯❯◦ Cartoon style graffiti 
33 │❯❯◦ Galaxy 
34 │❯❯◦ Anonymous hacker
35 │❯❯◦ Birthday flower cake 
36 │❯❯◦ Dragon ball 
37 │❯❯◦ Elegant rotation 
38 │❯❯◦ Wet glass
39 │❯❯◦ Water 3D 
40 │❯❯◦ Realistic sand 
41 │❯❯◦ PUBG mascot
42 │❯❯◦ Typography 
43 │❯❯◦ Naruto Shippuden 
44 │❯❯◦ Colourful paint 
45 │❯❯◦ Typography maker
46 │❯❯◦ Incandescent
47 │❯❯◦ Glitch effect
48 │❯❯◦ Birthday cake V2
49 │❯❯◦ Zodiac V2
50 │❯❯◦ Gold Luxury
51 │❯❯◦ Matrix Style
52 │❯❯◦ Thunder Text
53 │❯❯◦ Iron Man Style
54 │❯❯◦ Thor Style
55 │❯❯◦ Joker Logo
56 │❯❯◦ Avengers Logo
57 │❯❯◦ Metallic 3D
58 │❯❯◦ Neon Devil
59 │❯❯◦ Wolf Mascot
60 │❯❯◦ Fire Logo
61 │❯❯◦ Ice Logo
62 │❯❯◦ Wood Text
63 │❯❯◦ Leaves Text
64 │❯❯◦ Candy Style
65 │❯❯◦ Christmas Glow
66 │❯❯◦ New Year Cards
67 │❯❯◦ Cyberpunk
68 │❯❯◦ Retro Style
69 │❯❯◦ Chrome Effect
70 │❯❯◦ Captain America
71 │❯❯◦ Black Widow
72 │❯❯◦ Spiderman
73 │❯❯◦ Batman Style
74 │❯❯◦ Superman Style
75 │❯❯◦ Gaming Logo 2
76 │❯❯◦ Ninja Logo
77 │❯❯◦ Samurai Logo
78 │❯❯◦ Skull Mascot
79 │❯❯◦ Bear Mascot
80 │❯❯◦ Lion Mascot
81 │❯❯◦ Tiger Mascot
82 │❯❯◦ Eagle Mascot
83 │❯❯◦ Phoenix Fire
84 │❯❯◦ Butterfly Logo
85 │❯❯◦ Heart Smoke
86 │❯❯◦ Cloud Text
87 │❯❯◦ Coffee Cup
88 │❯❯◦ Beach Sand 2
89 │❯❯◦ Grass Text
90 │❯❯◦ Space Galaxy
91 │❯❯◦ Neon Green
92 │❯❯◦ Neon Pink
93 │❯❯◦ Matrix Rain
94 │❯❯◦ 8-Bit Pixel
95 │❯❯◦ Cartoon 3D
96 │❯❯◦ Plastic Text
97 │❯❯◦ Jelly Style
98 │❯❯◦ Liquid Metal
99 │❯❯◦ Rainbow Color
100│❯❯◦ Glossy Carbon

> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*`;

    const sentMsg = await conn.sendMessage(from, {
      image: { url: config.MENU_IMAGE_URL || 'https://telegra.ph/file/default-image.jpg' },
      caption: messageText
    }, { quoted: mek });

    conn.ev.on('messages.upsert', async (update) => {
      const msg = update.messages[0];
      if (!msg.message || !msg.message.extendedTextMessage) return;

      const responseText = msg.message.extendedTextMessage.text.trim();
      const contextInfo = msg.message.extendedTextMessage.contextInfo;

      if (contextInfo && contextInfo.stanzaId === sentMsg.key.id) {
        
        // මේ තියෙන්නේ API එකට අදාළ Styles mapping එක
        const urls = {
          '1': "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html",
          '2': "https://en.ephoto360.com/online-blackpink-style-logo-maker-effect-711.html",
          '3': "https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html",
          '4': "https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html",
          '5': "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
          '6': "https://en.ephoto360.com/birthday-cake-96.html",
          '7': "https://en.ephoto360.com/free-zodiac-online-logo-maker-491.html",
          '8': "https://en.ephoto360.com/3d-underwater-text-effect-online-682.html",
          '9': "https://en.ephoto360.com/advanced-glow-effects-74.html",
          '10': "https://en.ephoto360.com/create-avatar-gold-online-303.html",
          '11': "https://en.ephoto360.com/bokeh-text-effect-86.html",
          '12': "https://en.ephoto360.com/text-firework-effect-356.html",
          '13': "https://en.ephoto360.com/free-gaming-logo-maker-for-fps-game-team-546.html",
          '14': "https://en.ephoto360.com/arrow-tattoo-effect-with-signature-712.html",
          '15': "https://en.ephoto360.com/free-luxury-logo-maker-create-logo-online-458.html",
          '16': "https://en.ephoto360.com/dragon-fire-text-effect-111.html",
          '17': "https://en.ephoto360.com/create-a-personalized-queen-card-avatar-730.html",
          '18': "https://en.ephoto360.com/graffiti-color-199.html",
          '19': "https://en.ephoto360.com/make-tattoos-online-by-your-name-309.html",
          '20': "https://en.ephoto360.com/create-a-lol-pentakill-231.html",
          '21': "https://en.ephoto360.com/cards-halloween-online-81.html",
          '22': "https://en.ephoto360.com/writing-horror-letters-on-metal-plates-265.html",
          '23': "https://en.ephoto360.com/write-blood-text-on-the-wall-264.html",
          '24': "https://en.ephoto360.com/create-beautiful-international-women-s-day-cards-399.html",
          '25': "https://en.ephoto360.com/beautiful-flower-valentine-s-day-greeting-cards-online-512.html",
          '26': "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html",
          '27': "https://en.ephoto360.com/create-logo-team-logo-gaming-assassin-style-574.html",
          '28': "https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html",
          '29': "https://en.ephoto360.com/write-in-sand-summer-beach-online-576.html",
          '30': "https://en.ephoto360.com/text-light-effets-234.html",
          '31': "https://en.ephoto360.com/modern-gold-3-212.html",
          '32': "https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html",
          '33': "https://en.ephoto360.com/galaxy-text-effect-new-258.html",
          '34': "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html",
          '35': "https://en.ephoto360.com/write-name-on-flower-birthday-cake-pics-472.html",
          '36': "https://en.ephoto360.com/create-dragon-ball-style-text-effects-online-809.html",
          '37': "https://en.ephoto360.com/create-elegant-rotation-logo-online-586.html",
          '38': "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html",
          '39': "https://en.ephoto360.com/water-3d-text-effect-online-126.html",
          '40': "https://en.ephoto360.com/realistic-3d-sand-text-effect-online-580.html",
          '41': "https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html",
          '42': "https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html",
          '43': "https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html",
          '44': "https://en.ephoto360.com/create-3d-colorful-paint-text-effect-online-801.html",
          '45': "https://en.ephoto360.com/make-typography-text-online-338.html",
          '46': "https://en.ephoto360.com/text-effects-incandescent-bulbs-219.html",
          '47': "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
          '48': "https://en.ephoto360.com/birthday-cake-96.html",
          '49': "https://en.ephoto360.com/free-zodiac-online-logo-maker-491.html",
          '50': "https://en.ephoto360.com/free-luxury-logo-maker-create-logo-online-458.html",
          '51': "https://en.ephoto360.com/matrix-text-effect-154.html",
          '52': "https://en.ephoto360.com/thunder-text-effect-online-127.html",
          '53': "https://en.ephoto360.com/iron-man-text-effect-813.html",
          '55': "https://en.ephoto360.com/create-joker-logo-online-601.html",
          '60': "https://en.ephoto360.com/fire-text-effect-812.html",
          '100': "https://en.ephoto360.com/glossy-carbon-text-effect-815.html"
          // Add more URLs here based on your API capability
        };

        const targetUrl = urls[responseText];
        
        if (targetUrl) {
          await conn.sendMessage(from, { react: { text: '⏳', key: msg.key } });
          const logoUrl = await fetchLogoUrl(targetUrl, text);
          
          if (logoUrl) {
            await conn.sendMessage(from, {
              image: { url: logoUrl },
              caption: `*Generated by VES-MD*\n\n*© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ*`
            }, { quoted: msg });
          } else {
            reply("❌ Error generating logo. Please try another number.");
          }
        }
      }
    });

  } catch (error) {
    console.error(error);
    reply('Something went wrong!');
  }
});

const fetchLogoUrl = async (url, name) => {
  try {
    const res = await axios.get(`https://api-pink-venom.vercel.app/api/logo`, {
      params: { url, name }
    });
    return res.data.result.download_url || res.data.result;
  } catch {
    return null;
  }
};

Cmd(
  {
    pattern: "topdf",
    alias: ["pdf"],
    desc: "Convert provided text to a PDF file.",
    react: "📄",
    category: "tools",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply, config }) => { // මෙතන m සහ config ඇතුළත් කළා
    try {
      if (!q)
        return reply(
          "Please provide the text you want to convert to PDF.\n\n*Example:* `.topdf Hello World`"
        );

      // Create a new PDF document
      const doc = new PDFDocument();
      let buffers = [];
      
      doc.on("data", (chunk) => buffers.push(chunk));
      
      doc.on("end", async () => {
        const pdfData = Buffer.concat(buffers);

        // Send the PDF file
        await conn.sendMessage(
          from,
          {
            document: pdfData,
            mimetype: "application/pdf",
            fileName: `VES-MD.pdf`,
            caption: `*📄 PDF created successfully!*\n\n> ${config.DESCRIPTION || '© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠᴇꜱ-ᴍᴅッ'}`
          },
          { quoted: mek }
        );
      });

      // Add text to the PDF
      // Sinhala fonts support වෙන්න නම් font එකක් අනිවාර්යයෙන්ම දිය යුතුයි. 
      // දැනට standard font එක පාවිච්චි වේ.
      doc.fontSize(12).text(q, 50, 50);

      // Finalize the PDF and end the stream
      doc.end();

    } catch (e) {
      console.error(e);
      reply(`Error: ${e.message}`);
    }
  }
);
