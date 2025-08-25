const handler = async (m, { conn, args }) => {
  if (!args[0]) throw '✧ اكتب اللقب الذي تريد البحث عنه.\nمثال: .لقب كريم';

  const searchName = args.join(' ').trim();

  if (!global.db || !global.db.data || !global.db.data.users) {
    throw 'قاعدة البيانات غير مهيأة.';
  }

  const users = global.db.data.users;
  let foundUser = null;

  for (const jid in users) {
    const user = users[jid];
    if (user.name && user.name.trim() === searchName) {
      foundUser = { jid, ...user };
      break;
    }
  }

  if (foundUser) {
    let message = `❖ لقب *${searchName}* مأخوذ من قبل:\n\n`;
    message += `◍ *اللقب:* ${foundUser.name}\n`;
    message += `◍ *العضو:* @${foundUser.jid.split('@')[0]}`;
    await conn.sendMessage(m.chat, { text: message, mentions: [foundUser.jid] }, { quoted: m });
  } else {
    m.reply(`✔ اللقب *${searchName}* غير مستخدم من قبل أي شخص.`);
  }
};

handler.help = ['لقب <الاسم>'];
handler.tags = ['xp'];
handler.command = ['لقب'];
handler.group = true;

export default handler;
