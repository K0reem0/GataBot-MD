import { createHash } from 'crypto';

const handler = async function(m, { conn, text }) {
  if (!text || text.trim() === '') {
    return m.reply(`*يرجى إدخال اللقب الذي تود البحث عنه*`);
  }

  let texto = await m.mentionedJid
  let who = texto.length > 0 ? texto[0] : (m.quoted ? await m.quoted.sender : m.sender)

  const requestedName = text.trim(); // اللقب المطلوب

  const user = global.db.data.users[who];
  const { name } = user;
  const userName = name;

  // تحقق إذا اللقب مستخدم
  const isNameTaken = Object.values(global.db.data.users).some(
    userData => typeof userData.name === 'string' && userData.name.toLowerCase() === requestedName.toLowerCase()
  );

  if (isNameTaken) {
    // جلب جميع المستخدمين بنفس اللقب
    const usersWithSameName = Object.keys(global.db.data.users).filter(
      key => typeof global.db.data.users[key].name === 'string' && global.db.data.users[key].name.toLowerCase() === requestedName.toLowerCase()
    );

    const mentionsList = usersWithSameName.map(userId => {
      return `\u200F@${userId.split('@')[0]}`; // منشن مع محرف اتجاه RTL
    });

    m.reply(
      `*❃ ──────⊰ ❀ ⊱────── ❃*\n\n*لقب "${requestedName}" مأخوذ بواسطة :*\n${mentionsList.join('\n')}\n\n*❃ ──────⊰ ❀ ⊱────── ❃*`,
      null,
      { mentions: usersWithSameName }
    );
  } else {
    m.reply(`*❃ ──────⊰ ❀ ⊱────── ❃*\n\n*اللقب متوفر*\n\n*❃ ──────⊰ ❀ ⊱────── ❃*`);
  }
};

handler.help = ['myns <name>'];
handler.tags = ['xp'];
handler.command = /^(لقب)$/i;

export default handler;