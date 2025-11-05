let handler = async (m, { conn, args, usedPrefix, command, participants }) => {
  const user = global.db.data.users[m.sender];
  const isAdmin = participants?.some(p => p.jid === m.sender && p.admin);

  // تحقق من الصلاحيات
  if (!isAdmin && !user.shatfrol) {
    return m.reply(`❌ ليس لديك صلاحية استخدام أمر الشطف.\n🛒 يمكنك شراء هذه الميزة من المتجر باستخدام:\n${usedPrefix}شراء شطف`);
  }

  // تهيئة قائمة المشطوفين إذا لم تكن موجودة
  if (!global.db.data.excludedMembers) {
    global.db.data.excludedMembers = [];
  }

  const action = args[0]?.toLowerCase();
  let target;

  // تحديد العضو المستهدف
  if (m.quoted) {
    target = m.quoted.sender;
  } else if (m.mentionedJid.length > 0) {
    target = m.mentionedJid[0];
  } else if (!action || ['اضف', 'add', 'حذف', 'remove'].includes(action)) {
    target = m.sender;
  }

  // إذا كتب الأمر ".شطف" فقط
  if (!action && !m.quoted && m.mentionedJid.length === 0) {
    target = m.sender;

    if (global.db.data.excludedMembers.includes(target)) {
      return m.reply('✅ أنت مشطوف بالفعل من المنشن\n\nلإلغاء الشطف:\n' + `${usedPrefix}شطف حذف`);
    }

    global.db.data.excludedMembers.push(target);
    if (!isAdmin) user.shatfrol = false; // إزالة الصلاحية بعد الاستخدام
    return m.reply('✅ تم شطفك من المنشن بنجاح\n\nلإلغاء الشطف:\n' + `${usedPrefix}شطف حذف`);
  }

  switch (action) {
    case 'اضف':
    case 'add':
      if (!target) return m.reply(`✳️ استخدم الأمر هكذا:\n${usedPrefix}${command} @المستخدم\nأو رد على رسالة العضو`);

      const isInGroup = participants.some(p => p.jid === target);
      if (!isInGroup) return m.reply('⚠️ هذا العضو غير موجود في الجروب');

      if (global.db.data.excludedMembers.includes(target)) {
        return m.reply('✅ هذا العضو مشطوف بالفعل من المنشن');
      }
      global.db.data.excludedMembers.push(target);
      if (!isAdmin) user.shatfrol = false;
      m.reply(`✅ تم شطف العضو @${target.split('@')[0]} من المنشن`, null, { mentions: [target] });
      break;

    case 'حذف':
    case 'remove':
      if (!target) return m.reply(`✳️ استخدم الأمر هكذا:\n${usedPrefix}${command} حذف @المستخدم\nأو رد على رسالة العضو`);

      if (!global.db.data.excludedMembers.includes(target)) {
        return m.reply('⚠️ هذا العضو غير مشطوف من المنشن');
      }
      global.db.data.excludedMembers = global.db.data.excludedMembers.filter(jid => jid !== target);
      m.reply(`✅ تم إرجاع العضو @${target.split('@')[0]} للمنشن`, null, { mentions: [target] });
      break;

    case 'عرض':
    case 'list':
      if (global.db.data.excludedMembers.length === 0) {
        return m.reply('📝 لا يوجد أعضاء مشطوفين حالياً');
      }

      const activeExcluded = global.db.data.excludedMembers.filter(jid =>
        participants.some(p => p.jid === jid)
      );

      if (activeExcluded.length === 0) {
        return m.reply('📝 لا يوجد أعضاء مشطوفين حالياً في هذا الجروب');
      }

      let listText = '📝 قائمة الأعضاء المشطوفين من المنشن:\n\n';
      listText += activeExcluded.map(jid => {
        const u = global.db.data.users[jid] || {};
        const memberInfo = participants.find(p => p.jid === jid) || {};
        return `▢ @${jid.split('@')[0]} - ${u.name || memberInfo.notify || 'غير معروف'}`;
      }).join('\n');

      conn.sendMessage(m.chat, {
        text: listText,
        mentions: activeExcluded
      });
      break;

    default:
      if (m.mentionedJid.length > 0 || m.quoted) {
        if (global.db.data.excludedMembers.includes(target)) {
          global.db.data.excludedMembers = global.db.data.excludedMembers.filter(jid => jid !== target);
          m.reply(`✅ تم إرجاع العضو @${target.split('@')[0]} للمنشن`, null, { mentions: [target] });
        } else {
          global.db.data.excludedMembers.push(target);
          if (!isAdmin) user.shatfrol = false;
          m.reply(`✅ تم شطف العضو @${target.split('@')[0]} من المنشن`, null, { mentions: [target] });
        }
      } else {
        m.reply(`⚡ *أوامر إدارة المشطوفين:*\n\n` +
                `▢ ${usedPrefix}${command} - لشطف نفسك\n` +
                `▢ ${usedPrefix}${command} @المستخدم - لشطف/إرجاع عضو\n` +
                `▢ ${usedPrefix}${command} عرض - لعرض المشطوفين\n\n` +
                `*بدون ذكر:* يشطفك أنت\n` +
                `*بالرد على رسالة:* يشطف المرسل\n` +
                `*بذكر شخص:* يشطف المذكور`);
      }
  }
};

handler.help = ['شطف'];
handler.tags = ['group'];
handler.command = /^(شطف|استثناء-منشن)$/i;
handler.group = true;
handler.botAdmin = true;

export default handler;
