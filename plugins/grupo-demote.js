const handler = async (m, { conn }) => {
  let who;
  if (m.isGroup) {
    let texto = await m.mentionedJid;
    who = texto.length > 0 
      ? texto[0] 
      : (m.quoted ? await m.quoted.sender : m.sender);
  } else {
    who = m.chat;
  }

  if (!who) return conn.reply(m.chat, `منشن شخص`, m);

  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'demote');
    conn.reply(m.chat, '✅ *تمت إزالة الصلاحيات*', m);
  } catch (e) {
    conn.reply(m.chat, '❌ حدث خطأ أثناء التنزيل', m);
  }
};

handler.help = ['demote'].map(v => 'mention ' + v);
handler.tags = ['group'];
handler.command = /^(demote|خفض|تخفيض)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;
