const handler = async (m, { conn, args }) => {
  let who;

  if (m.isGroup) {
    if (m.mentionedJid?.length > 0) {
      return m.reply('❌ لحذف اللقب يجب أن ترد على رسالة المستخدم فقط، المنشن غير مدعوم.');
    }

    if (m.quoted) {
      // رد على رسالة
      who = m.quoted.sender;
    }
  } else {
    // في الخاص دايمًا المرسل نفسه
    who = m.chat;
  }

  // إذا ما فيه رد، نجرب بالاسم المكتوب
  if (!who && args.length > 0) {
    const nameToDelete = args.join(' ').trim().toLowerCase();

    if (!global.db || !global.db.data || !global.db.data.users) {
      throw '*قاعدة البيانات غير مهيأة.*';
    }

    // البحث عن المستخدم بالاسم
    who = Object.keys(global.db.data.users).find(jid => {
      const user = global.db.data.users[jid];
      return user.name && typeof user.name === 'string' && user.name.toLowerCase() === nameToDelete;
    });

    if (!who) {
      throw '*❌ لم يتم العثور على هذا اللقب في قاعدة البيانات.*';
    }
  }

  if (!who) {
    throw '*❌ أكتب اللقب الذي تريد حذفه أو قم بالرد على رسالة المستخدم.*';
  }

  if (!global.db.data.users[who]) {
    throw '*❌ المستخدم غير موجود في قاعدة البيانات.*';
  }

  const deletedUser = global.db.data.users[who];
  const oldName = deletedUser.name || 'بدون لقب';

  // نحذف بيانات التسجيل
  deletedUser.registered = false;
  deletedUser.name = '';
  deletedUser.regTime = 0;
  deletedUser.image = null;

  // الرد مع منشن إذا كان حذف بالاسم
  if (args.length > 0) {
    const mentionText = `@${who.split('@')[0]}`;
    await conn.reply(
      m.chat,
      `*✅ تم حذف اللقب "${oldName}" من قاعدة البيانات للمستخدم ${mentionText}، الآن صار اللقب متاح للتسجيل.*`,
      m,
      { mentions: [who] }
    );
  } else {
    m.reply(`*✅ تم حذف اللقب "${oldName}" من قاعدة البيانات، الآن صار اللقب متاح للتسجيل.*`);
  }
};

handler.help = ['unreg'].map(v => v + ' <الاسم أو رد>');
handler.tags = ['rg'];
handler.command = ['ازاله', 'ازالة', 'unregister', 'unregistrar'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;