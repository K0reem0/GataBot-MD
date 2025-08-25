const handler = async (m, {conn, usedPrefix, text}) => {

  if (isNaN(text) && !text.match(/@/g)) {

  } else if (isNaN(text)) {
    var number = text.split`@`[1];
  } else if (!isNaN(text)) {
    var number = text;
  }

  if (!text && !m.quoted) return conn.reply(m.chat, `منشن شخص`, m);
  if (number.length > 13 || (number.length < 11 && number.length > 0)) return conn.reply(m.chat, '❌ رقم الهاتف غير صحيح!', m);

  try {
    if (text) {
      var user = number + '@s.whatsapp.net';
    } else if (await m?.quoted?.sender) {
      var user = await m?.quoted?.sender;
    } else if (await m.mentionedJid) {
      var user = number + '@s.whatsapp.net';
    }
  } catch (e) {
  } finally {
    conn.groupParticipantsUpdate(m.chat, [user], 'remove');
    conn.reply(m.chat, '✅ *تمت*', m);
  }
};
handler.help = ['promote'].map((v) => 'mention ' + v);
handler.tags = ['group'];
handler.command = ['اتوكل', 'كلبطه', 'اخرس', 'طرد', 'دزمها', 'احبك', 'اكرهك', 'مغربي', 'منغولي', 'يمني'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;
export default handler;
