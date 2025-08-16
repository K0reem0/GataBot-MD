import { createHash } from 'crypto';

const handler = async function(m, { conn, text }) {
  // إذا لم يتم إدخال النص، أرسل رسالة تطلب من المستخدم إدخال اللقب
  if (!text || text.trim() === '') {
    return m.reply(`*يرجى إدخال اللقب الذي تود البحث عنه*`);
  }

  let who = m.quoted 
    ? m.quoted.sender 
    : m.mentionedJid && m.mentionedJid[0] 
      ? m.mentionedJid[0] 
      : m.fromMe 
        ? conn.user.jid 
        : m.sender;

  const requestedName = text.trim(); // Name to check

  const user = global.db.data.users[who];
  const { name } = user;
  const userName = name;

  // Check if the requested name matches any existing user's name
  const isNameTaken = Object.values(global.db.data.users).some(
    userData => typeof userData.name === 'string' && userData.name.toLowerCase() === requestedName.toLowerCase()
  );

  if (isNameTaken) {
    // Name is taken
    const usersWithSameName = Object.keys(global.db.data.users).filter(
      key => typeof global.db.data.users[key].name === 'string' && global.db.data.users[key].name.toLowerCase() === requestedName.toLowerCase()
    );

    const mentionsList = usersWithSameName.map(userId => {
      const userInfo = global.db.data.users[userId];
      return `@${userId.split('@')[0]}`; // Mention user
    });

    m.reply(
      `*لقب "${requestedName}" مأخوذ بواسطة :*\n${mentionsList.join('\n')}`,
      null,
      { mentions: usersWithSameName } // Ensure proper mentions
    );
  } else {
    // Name is not taken
    m.reply(`*اللقب متوفر*`);
  }
};

handler.help = ['myns <name>'];
handler.tags = ['xp'];
handler.command = /^(لقب)$/i;

export default handler;
