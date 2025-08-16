const handler = async (m, { conn, args, groupMetadata }) => {
  let who;
  if (m.isGroup) {
    who = m.mentionedJid?.[0] ?? (m.quoted ? await m.quoted.sender : m.sender);
  } else {
    who = m.chat;
  }

  if (!global.db || !global.db.data || !global.db.data.users) {
    throw 'قاعدة البيانات غير مهيأة.';
  }

  const user = global.db.data.users[who];

  // Check if the user exists in the database and has a name
  if (!user || !user.name || user.name.trim() === '') {
    throw who === m.sender
      ? 'أنت لم تسجل اسمك بعد. استخدم أمر التسجيل أولاً.'
      : 'اسم المستخدم غير مسجل.';
  }

  const { name, kickTime, image } = user;

  let replyMessage = `*❃ ──────⊰ ❀ ⊱────── ❃*\n\n`;
  replyMessage += `◍ *لقبهُ: ${name}* \n`;

  // Check if the user has a scheduled kick
  if (kickTime) {
    const timeLeft = new Date(kickTime) - Date.now();
    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24)); // Calculate days left
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

handler.help = ['myns'];
handler.tags = ['xp'];
handler.command = ['لقبه', 'لقبي'];
handler.group = true;

export default handler;
