const handler = async (m, { conn }) => {
  let who;

  if (m.isGroup) {
    if (m.mentionedJid?.length) {
      return conn.reply(m.chat, "❌ يجب أن ترد على رسالة المستخدم لمعرفة لقبه 👤", m);
    }

    if (m.quoted) {
      who = m.quoted.sender; // إذا فيه رد
    } else {
      who = m.sender; // إذا ما فيه رد ولا منشن → لقب المرسل
    }
  } else {
    who = m.chat; // في الخاص دايمًا المرسل نفسه
  }

  if (!global.db || !global.db.data || !global.db.data.users) {
    throw '❌ قاعدة البيانات غير مهيأة.';
  }

  const user = global.db.data.users[who];

  // شرط واحد للتحقق
  if (!user || user.registered === false) {
    throw who === m.sender
      ? '❌ أنت غير مسجل. استخدم أمر *تسجيل* أولاً.'
      : '❌ هذا المستخدم غير مسجل.';
  }

  const { name, kickTime, image } = user;

  let replyMessage = `*❃ ──────⊰ ❀ ⊱────── ❃*\n\n`;
  replyMessage += `◍ *لقبهُ: ${name}* \n`;

  if (kickTime) {
    const timeLeft = new Date(kickTime) - Date.now();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
    replyMessage += `◍ *العضوية : زائر*\n`;
    replyMessage += `◍ *وقت الزيارة المتبقي : ${daysLeft} ايام*\n\n`;
  } else {
    replyMessage += `◍ *العضوية : دائم*\n\n`;
  }

  replyMessage += `*❃ ──────⊰ ❀ ⊱────── ❃*`;

  if (image) {
    await conn.sendMessage(m.chat, {
      image: { url: image },
      caption: replyMessage,
    });
  } else {
    m.reply(replyMessage);
  }
};

handler.help = ['لقبه', 'لقبي'];
handler.tags = ['xp'];
handler.command = ['لقبه', 'لقبي'];
handler.group = true;

export default handler;