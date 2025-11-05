const handler = async (m, {conn, text, command, usedPrefix, args}) => {
// let pp = 'https://www.bighero6challenge.com/images/thumbs/Piedra,-papel-o-tijera-0003318_1584.jpeg'
  const pp = 'https://telegra.ph/file/c7924bf0e0d839290cc51.jpg';

  // 60000 = 1 minuto // 30000 = 30 segundos // 15000 = 15 segundos // 10000 = 10 segundos
  const time = global.db.data.users[m.sender].wait + 10000;
  if (new Date - global.db.data.users[m.sender].wait < 10000) throw `*🕓 سوف تضطر للانتظار ${Math.floor((time - new Date()) / 1000)} ثواني قبل أن تتمكن من اللعب مرة أخرى*`;

  if (!args[0]) return conn.reply(m.chat, `*حجر 🗿 ورق 📄 مقص ✂️*\n\n*—◉ يمكنك استخدام هذه الأوامر:*\n*◉ ${usedPrefix + command} حجر*\n*◉ ${usedPrefix + command} ورق*\n*◉ ${usedPrefix + command} مقص*`, m);
  // conn.sendButton(m.chat, `*حجر 🗿 ورق 📄 مقص ✂️*\n\n*—◉  يمكنك استخدام الأزرار للعب أو يمكنك أيضًا استخدام هذه الأوامر:*\n*◉ ${usedPrefix + command} حجر*\n*◉ ${usedPrefix + command} ورق*\n*◉ ${usedPrefix + command} مقص*`, wm, pp, [['حجر 🗿', `${usedPrefix + command} حجر`], ['ورق 📄', `${usedPrefix + command} ورق`], ['مقص ✂️', `${usedPrefix + command} مقص`]], m)
  let astro = Math.random();
  if (astro < 0.34) {
    astro = 'حجر';
  } else if (astro > 0.34 && astro < 0.67) {
    astro = 'مقص';
  } else {
    astro = 'ورق';
  }
  const textm = text.toLowerCase();
  if (textm == astro) {
    global.db.data.users[m.sender].exp += 500;
    m.reply(`*🔰 تعادل!*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +500 XP*`);
  } else if (text == 'ورق') {
    if (astro == 'حجر') {
      global.db.data.users[m.sender].exp += 1000;
      m.reply(`*🥳 لقد فزت! 🎉*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +1000 XP*`);
    } else {
      global.db.data.users[m.sender].exp -= 300;
      m.reply(`*☠️ انت تخسر! ❌*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*❌ تم خصم -300 XP*`);
    }
  } else if (text == 'مقص') {
    if (astro == 'ورق') {
      global.db.data.users[m.sender].exp += 1000;
      m.reply(`*🥳 لقد فزت! 🎉*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +1000 XP*`);
    } else {
      global.db.data.users[m.sender].exp -= 300;
      m.reply(`*☠️ انت تخسر! ❌*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*❌ تم خصم -300 XP*`);
    }
  } else if (textm == 'مقص') {
    if (astro == 'ورق') {
      global.db.data.users[m.sender].exp += 1000;
      m.reply(`*🥳 لقد فزت! 🎉*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +1000 XP*`);
    } else {
      global.db.data.users[m.sender].exp -= 300;
      m.reply(`*☠️ انت تخسر! ❌*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*❌ تم خصم -300 XP*`);
    }
  } else if (textm == 'ورق') {
    if (astro == 'حجر') {
      global.db.data.users[m.sender].exp += 1000;
      m.reply(`*🥳 لقد فزت! 🎉*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +1000 XP*`);
    } else {
      global.db.data.users[m.sender].exp -= 300;
      m.reply(`*☠️ انت تخسر! ❌*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*❌ تم خصم -300 XP*`);
    }
  } else if (textm == 'حجر') {
    if (astro == 'مقص') {
      global.db.data.users[m.sender].exp += 1000;
      m.reply(`*🥳 لقد فزت! 🎉*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*🎁 حصلت على +1000 XP*`);
    } else {
      global.db.data.users[m.sender].exp -= 300;
      m.reply(`*☠️ انت تخسر! ❌*\n\n*👉🏻 انت: ${textm}*\n*👉🏻 البوت: ${astro}*\n*❌ تم خصم -300 XP*`);
    }
  }
  global.db.data.users[m.sender].wait = new Date * 1;
};
handler.help = ['ppt'];
handler.tags = ['games'];
handler.command = /^(تحدي)$/i;
export default handler;
