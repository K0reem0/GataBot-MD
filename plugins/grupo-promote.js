const handler = async (m, { conn }) => {
  let who;
  if (m.isGroup) {
    let texto = await m.mentionedJid;
    who = texto.length > 0 
      ? texto[0] 
      : (m.quoted ? await m.quoted.sender : null);
  } else {
    who = m.chat;
  }

  if (!who) return conn.reply(m.chat, `منشن شخص`, m);

  try {
    await conn.groupParticipantsUpdate(m.chat, [who], 'promote');
    conn.reply(m.chat, '✅ *تمت الترقية*', m);
  } catch (e) {
    conn.reply(m.chat, '❌ حدث خطأ أثناء الترقية', m);
  }
};

handler.help = ['promote'].map(v => 'mention ' + v);
handler.tags = ['group'];
handler.command = /^(promote|ترقية|ترقيه)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;
