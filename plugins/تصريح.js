const handler = async (m, { conn, command, isROwner }) => {
  if (!isROwner) throw '❌ هذا الأمر مخصص للمالك فقط.';

  // تأكيد أن المصفوفة موجودة
  if (!Array.isArray(global.mods)) global.mods = [];

  // لازم رد + منشن
  if (command !== 'لائحة' && (!m.quoted || !m.mentionedJid?.length)) {
    return conn.reply(m.chat, "⚠️ لازم ترد على رسالة العضو + تذكره بالمنشن معاً", m);
  }

  try {
    // استخراج المستخدم من الرد
    let repliedUser = m?.quoted?.sender;
    let repliedNum = repliedUser ? repliedUser.split('@')[0] : null;

    // استخراج المستخدم من المنشن
    let mentionedUser = m?.mentionedJid?.[0];
    let mentionedNum = mentionedUser ? mentionedUser.split('@')[0] : null;

    // أمر عرض اللائحة
    if (command === 'لائحة') {
      if (global.mods.length === 0) {
        return m.reply('⚠️ لا يوجد أعضاء مضافين حالياً.');
      }

      let list = '📜 *قائمة الأعضاء (من الرد فقط)*:\n\n';
      let mentions = [];

      for (let i = 0; i < global.mods.length; i += 2) {
        let replied = global.mods[i];
        if (replied) {
          list += `${(i / 2) + 1}. @${replied}\n`;
          mentions.push(replied + '@s.whatsapp.net');
        }
      }

      return conn.sendMessage(m.chat, { text: list, mentions }, { quoted: m });
    }

    // أمر إضافة مشرف
    if (command === 'سماح') {
      if (!repliedNum || !mentionedNum) {
        return conn.reply(m.chat, "⚠️ لازم ترد على رسالة العضو + منشنه", m);
      }

      if (global.mods.includes(repliedNum)) {
        return conn.sendMessage(m.chat, {
          text: `⚠️ المستخدم @${repliedNum} موجود بالفعل في القائمة.`,
          mentions: [repliedUser]
        }, { quoted: m });
      }

      global.mods.push(repliedNum);
      global.mods.push(mentionedNum);

      return conn.sendMessage(m.chat, {
        text: `✅ تمت إضافة المستخدم من الرد @${repliedNum}\n➕ ومعه المنشن @${mentionedNum}`,
        mentions: [repliedUser, mentionedUser]
      }, { quoted: m });
    }

    // أمر إزالة مشرف
    if (command === 'منع') {
      if (!repliedNum) return conn.reply(m.chat, "⚠️ لازم ترد على رسالة العضو", m);

      if (!global.mods.includes(repliedNum)) {
        return conn.sendMessage(m.chat, {
          text: `⚠️ المستخدم @${repliedNum} غير موجود في القائمة.`,
          mentions: [repliedUser]
        }, { quoted: m });
      }

      let idx = global.mods.indexOf(repliedNum);
      if (idx !== -1) {
        global.mods.splice(idx, 2);
      }

      return conn.sendMessage(m.chat, {
        text: `✅ تم إزالة المستخدم @${repliedNum} من القائمة.`,
        mentions: [repliedUser]
      }, { quoted: m });
    }

  } catch (e) {
    console.error(e);
    conn.reply(m.chat, '❌ حدث خطأ غير متوقع', m);
  }
};

// الأوامر
handler.help = [
  'سماح (رد + منشن) - إضافة مشرف جديد (رد + منشن)',
  'منع (رد) - إزالة مشرف (يعتمد على الرد)',
  'لائحة - عرض قائمة المشرفين (الرد فقط)'
];
handler.tags = ['owner'];
handler.command = ['سماح', 'منع', 'لائحة'];
handler.rowner = true;

export default handler;
