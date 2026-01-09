"use strict";

/**
 * Fixed Command Pack
 * - Consistent axios/fetchJson usage
 * - Cheerio import for MediaFire
 * - Safe error handling + reactions
 * - Removed undefined variables
 * - Safer null checks
 */

const axios = require("axios").create({
  timeout: 25000,
  maxRedirects: 5,
});
const cheerio = require("cheerio");
const { cmd } = require("../command");
const config = require("../config");
const { fetchJson } = require("../lib/functions");
const API_URL = "https://facebook-downloader.apis-bj-devs.workers.dev/"; // Current API URL
const api = `https://nethu-api-ashy.vercel.app`;
const { File } = require("megajs");


// Helpers
const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u || "");
const safe = (v, d = null) => (v === undefined || v === null ? d : v);

cmd(
  {
    pattern: "fb",
    alias: ["fb"],
    react: "🎬",
    category: "download",
    desc: "Download Facebook videos with details and quality selection",
    filename: __filename,
  },
  async (robin, m, mek, { from, q, reply }) => {
    try {
      if (!q || q.trim() === "") {
        return await reply("*🎬 Please provide a valid Facebook video URL!*");
      }

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb|m\.facebook|fb\.watch)\/.+/i;
      if (!fbRegex.test(q)) {
        return await reply("*❌ Invalid Facebook URL!*");
      }

      await reply("*⏳ Fetching video details, please wait...*");

      // API එකෙන් Data ලබා ගැනීම
      const response = await axios.get(`${API_URL}?url=${encodeURIComponent(q)}`);
      const res = response.data;

      if (!res || !res.status || !res.data) {
        return await reply("*❌ Failed to fetch video details. The video might be private or restricted.*");
      }

      const v = res.data;
      const hdVideo = v.hd || v.url;
      const sdVideo = v.sd || v.url;
      
      // වීඩියෝ විස්තර පෙළගැස්වීම
      let details = `*🎩VES-MD FACEBOOK DOWNLOADER*\n\n`;
      details += `*📝 Title:* ${v.title || "No Title"}\n`;
      if (v.duration) details += `*🕒 Duration:* ${v.duration}\n`;
      details += `*🔗 Source:* Facebook\n\n`;
      details += `*Select Quality to Download:* \n`;
      details += `*1 | HD Quality (High)*\n`;
      details += `*2 | SD Quality (Low)*\n\n`;
      details += `> *Reply with the number to start download*`;

      // Thumbnail එක සමඟ විස්තර යැවීම
      const sentMsg = await robin.sendMessage(
        from,
        {
          image: { url: v.thumbnail || 'https://i.ibb.co/fb-default.jpg' },
          caption: details,
        },
        { quoted: mek }
      );

      // Reply එක හඳුනාගැනීම (Listener)
      const listener = async (upsert) => {
        const msgUpdate = upsert.messages[0];
        if (!msgUpdate.message) return;

        const body = msgUpdate.message.conversation || msgUpdate.message.extendedTextMessage?.text;
        const isReplyToBot = msgUpdate.message.extendedTextMessage?.contextInfo?.stanzaId === sentMsg.key.id;

        if (isReplyToBot) {
          if (body === "1") {
            await reply("*⏳ Downloading HD Video...*");
            await robin.sendMessage(from, { 
              video: { url: hdVideo }, 
              caption: `*✅ ${v.title || "FB Video"} - HD Quality*` 
            }, { quoted: msgUpdate });
            robin.ev.off("messages.upsert", listener);
          } else if (body === "2") {
            await reply("*⏳ Downloading SD Video...*");
            await robin.sendMessage(from, { 
              video: { url: sdVideo }, 
              caption: `*✅ ${v.title || "FB Video"} - SD Quality*` 
            }, { quoted: msgUpdate });
            robin.ev.off("messages.upsert", listener);
          }
        }
      };

      robin.ev.on("messages.upsert", listener);

      // විනාඩි 5කින් listener එක නවත්වන්න
      setTimeout(() => {
        robin.ev.off("messages.upsert", listener);
      }, 300000);

    } catch (e) {
      console.error("FB Fetch Error:", e);
      await reply("*❌ Error:* " + (e.message || "Something went wrong!"));
    }
  }
);

/* ======================= FACEBOOK DOWNLOADER ======================= */
cmd(
  {
    pattern: "facebook",
    react: "🎥",
    alias: ["fbb", "fbvideo", "fb"],
    desc: "Download videos from Facebook",
    category: "download",
    use: ".facebook <facebook_url>",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q)) return reply("🚩 *Please provide a valid Facebook URL.*");

      // Loading message එකක් දැමීමෙන් user ට response එක එන බව දැනෙනවා
      const fb = await fetchJson(
        `${api}/download/fbdown?url=${encodeURIComponent(q)}`
      ).catch(() => null);

      const res = fb?.result || {};
      const sd = res.sd;
      const hd = res.hd;
      const thumb = res.thumb;

      if (!sd && !hd) return reply("❌ *I couldn't find the video. Please check the link and try again.*");

      // ලස්සනට සකස් කළ Caption එක
      const mainCaption = `✨ *ＦＡＣＥＢＯＯＫ  ＤＯＷＮＬＯＡＤＥＲ* ✨\n\n` +
                          `📝 *Title:* Facebook Video\n` +
                          `🔗 *Link:* ${q}\n\n` +
                          `> ${config.DESCRIPTION}`;

      // 1. මුලින්ම Thumbnail එක සමඟ විස්තර යැවීම
      if (thumb && isHttpUrl(thumb)) {
        await conn.sendMessage(
          from,
          { image: { url: thumb }, caption: mainCaption },
          { quoted: mek }
        );
      }

      // 2. SD Video එක යැවීම
      if (sd && isHttpUrl(sd)) {
        await conn.sendMessage(
          from,
          { 
            video: { url: sd }, 
            mimetype: "video/mp4", 
            caption: "✅ *Quality:* SD (Standard)" 
          },
          { quoted: mek }
        );
      }

      // 3. HD Video එක තිබේ නම් පමණක් යැවීම
      if (hd && isHttpUrl(hd)) {
        await conn.sendMessage(
          from,
          { 
            video: { url: hd }, 
            mimetype: "video/mp4", 
            caption: "✅ *Quality:* HD (High Definition)" 
          },
          { quoted: mek }
        );
      }

    } catch (err) {
      console.error("facebook error:", err);
      reply("⚠️ *An error occurred while processing your request.*");
    }
  }
);


/* ======================= TIKTOK DOWNLOADER ======================= */
cmd(
  {
    pattern: "tiktok",
    react: "📱",
    desc: "Download TikTok Video (No Watermark)",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktok https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.play) {
        return reply("❌ Couldn't fetch video. Try again later.");
      }

      const videoUrl = result.data.play;
      const title = result.data.title || "TikTok Video";
      const author = result.data.author?.nickname || "Unknown";

      const caption =
        `*🎩 VES-MD TIKTOK DOWNLOADER*\n\n` +
        ╭──────────●●►
        |`🎥 *Title*: ${title}\n` +
        `👤 *Author*: ${author}\n` +
        `🔗 *URL*: ${q}\n\n` +
        ╰──────────●●►
        `> ${config.DESCRIPTION}*`;

      await conn.sendMessage(
        from,
        { video: { url: videoUrl }, caption, mimetype: "video/mp4" },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktok:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tiktokwm",
    react: "💦",
    desc: "Download TikTok Video (With Watermark)",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktokwm https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.wmplay) {
        return reply("❌ Couldn't fetch watermarked video.");
      }

      await conn.sendMessage(
        from,
        {
          video: { url: result.data.wmplay },
          caption: `*🫦 TikTok Watermarked Video 🫦*\n👤 Author: ${safe(
            result.data.author?.nickname,
            "Unknown"
          )}`,
          mimetype: "video/mp4",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktokwm:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tiktokaudio",
    react: "🎵",
    desc: "Download TikTok Audio",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktokaudio https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.music) {
        return reply("❌ Couldn't fetch TikTok audio.");
      }

      const title = result.data.music_info?.title || "TikTok Audio";
      const author =
        result.data.music_info?.author ||
        result.data.author?.nickname ||
        "Unknown";

      await conn.sendMessage(
        from,
        {
          audio: { url: result.data.music },
          mimetype: "audio/mp4",
          fileName: `${title.replace(/[^\w\s]/gi, "")}.mp3`,
          caption: `*🎵 TikTok Audio 🎵*\n🎵 Title: ${title}\n👤 Artist: ${author}`,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktokaudio:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

/* ======================= YOUTUBE POST ======================= */
cmd(
  {
    pattern: "ytpost",
    alias: ["ytcommunity", "ytc"],
    desc: "Download a YouTube community post",
    category: "downloader",
    react: "🎥",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q))
        return reply("Please provide a valid YouTube community post URL.");

      const { data } = await axios.get(
        `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(q)}`
      );

      if (!data?.status || !data?.data) {
        return reply("Failed to fetch the community post.");
      }

      const post = data.data;
      let caption = `📢 *YouTube Community Post* 📢\n\n📜 *Content:* ${safe(
        post?.content,
        "-"
      )}`;

      const imgs = Array.isArray(post?.images) ? post.images : [];
      if (imgs.length > 0) {
        for (const img of imgs) {
          if (!isHttpUrl(img)) continue;
          await conn.sendMessage(
            from,
            { image: { url: img }, caption },
            { quoted: mek }
          );
          caption = "";
        }
      } else {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
      }
    } catch (e) {
      console.error("ytpost:", e);
      reply("❌ Error fetching the YouTube community post.");
    }
  }
);

/* ======================= APK DOWNLOADER ======================= */
cmd(
  {
    pattern: "apk",
    desc: "Download APK from Aptoide.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide an app name.");

      const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(
        q
      )}/limit=1`;
      const { data } = await axios.get(apiUrl);

      const list = data?.datalist?.list;
      if (!Array.isArray(list) || list.length === 0) {
        return reply("⚠️ No results found.");
      }

      const app = list[0];
      const appSize = app?.size ? (app.size / 1048576).toFixed(2) : "N/A";
      const apkUrl = app?.file?.path_alt || app?.file?.path;

      if (!isHttpUrl(apkUrl)) return reply("⚠️ APK file not available.");

      const caption = `📦 *Name:* ${safe(app?.name, "-")}\n🏋️ *Size:* ${appSize} MB\n📦 *Package:* ${safe(
        app?.package,
        "-"
      )}`;

      if (isHttpUrl(app?.icon)) {
        await conn.sendMessage(
          from,
          { image: { url: app.icon }, caption },
          { quoted: mek }
        );
      } else {
        await reply(caption);
      }

      await conn.sendMessage(
        from,
        {
          document: {
            url: apkUrl,
            fileName: `${safe(app?.name, "app")}.apk`,
            mimetype: "application/vnd.android.package-archive",
          },
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("apk:", e);
      reply("❌ Error fetching APK.");
    }
  }
);

/* ======================= GOOGLE DRIVE ======================= */
cmd(
  {
    pattern: "gdrive",
    desc: "Download Google Drive files.",
    react: "🌐",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q)) return reply("❌ Please provide a valid Drive link.");

      const { data } = await axios.get(
        `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(
          q
        )}&apikey=mnp3grlZ`
      );

      const dl = data?.result;
      if (!isHttpUrl(dl?.downloadUrl)) {
        return reply("⚠️ No download URL found.");
      }

      await conn.sendMessage(
        from,
        {
          document: {
            url: dl.downloadUrl,
            mimetype: safe(dl.mimetype, "application/octet-stream"),
            fileName: safe(dl.fileName, "gdrive_file"),
          },
          caption: "${config.DESCRIPTION}",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("gdrive:", e);
      reply("❌ Error fetching Drive file.");
    }
  }
);

/* ======================= GITHUB ======================= */
cmd(
  {
    pattern: "gitclone",
    alias: ["git", "getrepo"],
    desc: "Download GitHub repo as zip.",
    react: "📦",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply }) => {
    try {
      const link = args?.[0];
      if (!/^https?:\/\/github\.com\/.+/i.test(link || "")) {
        return reply("⚠️ Invalid GitHub link.");
      }

      const match = link.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git|\/|$)/i);
      if (!match) return reply("⚠️ Invalid GitHub URL.");

      const [, username, repo] = match;
      const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

      const head = await axios.head(zipUrl).catch(() => ({ headers: {} }));
      const cd =
        head?.headers?.["content-disposition"] ||
        head?.headers?.["Content-Disposition"];
      const fileName =
        (cd && (cd.match(/filename="?([^"]+)"?/) || [])[1]) || `${repo}.zip`;

      await conn.sendMessage(
        from,
        {
          document: { url: zipUrl },
          fileName,
          mimetype: "application/zip",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("gitclone:", e);
      reply("❌ Failed to download repository.");
    }
  }
);

/* ======================= MEDIAFIRE ======================= */
cmd(
  {
    pattern: "mediafire",
    alias: ["mfire"],
    desc: "Download Mediafire files",
    category: "download",
    react: "📩",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q || !q.startsWith("https://")) {
        return reply("❌ Please provide a valid Mediafire URL.");
      }

      const { data: html } = await axios.get(q);
      const $ = cheerio.load(html);

      const fileName = $(".dl-info > div > div.filename").text().trim();
      const downloadUrl = $("#downloadButton").attr("href");
      const fileType = $(".dl-info > div > div.filetype").text().trim();
      const fileSize = $(".dl-info ul li:nth-child(1) > span").text().trim();
      const fileDate = $(".dl-info ul li:nth-child(2) > span").text().trim();

      if (!fileName || !downloadUrl) {
        return reply("⚠️ Failed to extract Mediafire info.");
      }

      let mimeType = "application/octet-stream";
      const ext = fileName.split(".").pop().toLowerCase();
      const mimeTypes = {
        zip: "application/zip",
        pdf: "application/pdf",
        mp4: "video/mp4",
        mkv: "video/x-matroska",
        mp3: "audio/mpeg",
        "7z": "application/x-7z-compressed",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        rar: "application/x-rar-compressed",
      };
      if (mimeTypes[ext]) mimeType = mimeTypes[ext];

      await conn.sendMessage(
        from,
        {
          document: { url: downloadUrl },
          fileName,
          mimetype: mimeType,
          caption: `📄 *${fileName}*\n📁 Type: ${fileType}\n📦 Size: ${fileSize}\n📅 Uploaded: ${fileDate}`,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("mediafire:", e);
      reply("❌ Error while processing Mediafire link.");
    }
  }
);

/* ======================= GOOGLE IMAGE ======================= */
cmd({
  pattern: "img",
  alias: ["aiimg3", "bingimage"],
  desc: "Search for images using Bing and send 5 results.",
  category: "download",
  react: "📷",
  use: ".img <query>",
  filename: __filename,
}, async (conn, mek, msg, { from, args, reply }) => {
  try {
    const query = args.join(" ");
    if (!query) {
      return reply("❌ Please provide a search query. Example: `.img dog`");
    }

    // Fetch images from the Bing Image Search API
    const response = await axios.get(`https://api.siputzx.my.id/api/s/bimg?query=${encodeURIComponent(query)}`);
    const { status, data } = response.data;

    if (!status || !data || data.length === 0) {
      return reply("❌ No images found for the specified query. Please try again.");
    }

    // Select the first 5 images
    const images = data.slice(0, 5);

    // Send each image as an attachment
    for (const imageUrl of images) {
      await conn.sendMessage(from, {
        image: { url: imageUrl }, // Attach the image
        caption: `🔍 *Google Image Search*: ${query}`,
      });
    }
  } catch (error) {
    console.error("Error fetching images:", error);
    reply("❌ Unable to fetch images. Please try again later.");
  }
});

cmd({
  pattern: "download",
  react: "🍟",
  alias: ["fetchh"],
  desc: "Direct downloader from a link (max 2GB, RAM safe)",
  category: "movie",
  use: ".download <Direct Link>",
  filename: __filename
}, async (client, message, m, { from, q, reply }) => {

  try {
    if (!q) {
      return reply("❗ Please provide a direct download link.");
    }

    const url = q.trim();

    if (!/^https?:\/\//i.test(url)) {
      return reply("❗ Invalid URL.");
    }

    // React ⬇️
    await client.sendMessage(from, {
      react: {
        text: "⬇️",
        key: message.key
      }
    });

    let mimeType = "application/octet-stream";
    let fileName = "file.bin";
    let fileSizeMB = 0;

    try {
      const head = await axios.head(url, { timeout: 5000 });

      mimeType = head.headers["content-type"] || mimeType;

      const contentLength = parseInt(head.headers["content-length"] || 0);
      fileSizeMB = Math.floor(contentLength / 1024 / 1024);

      if (contentLength > 2147483648) {
        return reply(
          `❗ File is too large: ~${fileSizeMB}MB.\nMax allowed size is 2GB.`
        );
      }

      const disposition = head.headers["content-disposition"];

      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (match && match[1]) {
          fileName = match[1].replace(/['"]/g, "");
        }
      } else {
        const base = path.basename(new URL(url).pathname);
        if (base) fileName = base;
      }

    } catch (err) {
      const base = path.basename(new URL(url).pathname);
      if (base) fileName = base;
    }

    // Send file directly (no RAM usage)
    await client.sendMessage(from, {
      document: { url },
      mimetype: mimeType,
      fileName: fileName,
      caption:
        `✅ File Ready\n\n` +
        `📄 *Name:* ${fileName}\n` +
        `📦 *Size:* ${fileSizeMB} MB\n` +
        `🔗 *Link:* ${url}`
    });

    // React ✅
    await client.sendMessage(from, {
      react: {
        text: "✅",
        key: message.key
      }
    });

  } catch (err) {
    reply("❗ Error: " + err.message);
  }
});

cmd({
  'pattern': 'mega',
  'react': '🍟',
  'alias': ["megadl", "meganz"],
  'desc': "Mega.nz files download",
  'category': 'download',
  'use': ".mega url",
  'filename': __filename
}, async (conn, mek, m, {
  from,
  q: url,
  reply
}) => {
  // 1. URL ekak thiyeda kiyala check kireema
  if (!url) {
    return await reply("*Please provide a mega.nz URL!*");
  }

  try {
    // 2. Mega link eken file eka gannawa
    const file = File.fromURL(url);
    await file.loadAttributes();
    const buffer = await file.downloadBuffer();

    // 3. File eke type eka (MimeType) hoyagannawa
    let mimeType = 'application/octet-stream';
    const fileName = file.name;

    if (/mp4$/i.test(fileName)) {
      mimeType = "video/mp4";
    } else if (/pdf$/i.test(fileName)) {
      mimeType = "application/pdf";
    } else if (/zip$/i.test(fileName)) {
      mimeType = "application/zip";
    } else if (/rar$/i.test(fileName)) {
      mimeType = "application/x-rar-compressed";
    } else if (/7z$/i.test(fileName)) {
      mimeType = "application/x-7z-compressed";
    } else if (/jpe?g$/i.test(fileName)) {
      mimeType = "image/jpeg";
    } else if (/png$/i.test(fileName)) {
      mimeType = 'image/png';
    }

    // 4. Downloaded kiyala message ekak yawima
    await reply("*⏩ Downloaded file:* " + fileName);

    // 5. File eka WhatsApp document ekak widiyata yawima
    await conn.sendMessage(from, {
      'document': buffer,
      'mimetype': mimeType,
      'filename': fileName
    }, {
      'quoted': mek
    });

    // 6. Wede hari kiyala reaction ekak danna
    await conn.sendMessage(from, {
      'react': {
        'text': '✔️',
        'key': mek.key
      }
    });

  } catch (error) {
    // 7. Monawahari error ekak awoth pennanna
    console.error(error);
    await reply("❌ *Error:* " + (error.message || error));
  }
});
