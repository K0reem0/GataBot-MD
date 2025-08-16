const handler = async (m, {conn, participants, usedPrefix, command}) => {  
  const kicktext = `*مــنشـن الـشـخص !*`;
  
  if (!m.mentionedJid[0] && !m.quoted) return m.reply(kicktext, m.chat, {mentions: conn.parseMention(kicktext)});
  
  // رقم المالك
  const ownerNumber = "966560801636@s.whatsapp.net";
  
  const user = m.mentionedJid[0] ? m.mentionedJid[0] : await m?.quoted?.sender;
  
  // التحقق إذا كان المستخدم هو المالك
  if (user === ownerNumber) {
    return m.reply("*تبيني اطرد ابوي!*");
  }
  
  // التحقق إذا كان المستخدم هو البوت نفسه
  if (user === conn.user.jid) {
    return;
  }
  
  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
    m.reply("*تـــم الــطرد !*");
  } catch (error) {
    m.reply("❌ فشل في طرد العضو، قد لا أملك الصلاحيات الكافية");
  }
};

handler.tags = ['group'];
handler.help = ['kick2'];
handler.command = ['اتوكل', 'كلبطه', 'اخرس', 'طرد', 'دزمها', 'احبك', 'اكرهك', 'مغربي', 'منغولي', 'يمني'];
handler.admin = true;
handler.group = true;
handler.botAdmin = true;
export default handler;
