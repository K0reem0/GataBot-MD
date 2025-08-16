let handler = async (m, { conn, participants }) => {
  let teks = "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n" +  
             "*مـنشــــــن عـــــــــام لأعــــــضاء ومشرفـــين*\n" +  
             `*✦╎『 ${await conn.getName(m.chat)} 』╎✦*\n` +  
             "*المنشن خاص للمشرفين نتأسف على الازعاج*\n\n" +
             "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n";

  // استخراج بيانات الرسائل لكل عضو
  let memberData = participants.map(mem => {
    let userId = mem.jid;
    let userData = global.db.data.users[userId] || {};
    let msgCount = userData.mensaje && userData.mensaje[m.chat] ? userData.mensaje[m.chat] : 0;
    return { jid: userId, messages: msgCount };
  });

  // ترتيب من الأكثر للأقل رسائل
  memberData.sort((a, b) => b.messages - a.messages);

  // إضافة الأعضاء للقائمة
  for (let mem of memberData) {
    teks += `◍ @${mem.jid.split('@')[0]} - الرسائل: ${mem.messages}\n\n`;
  }

  teks += "*❃ ─────────⊰ ❀ ⊱───────── ❃*";

  conn.sendMessage(m.chat, { 
    text: teks, 
    mentions: memberData.map(a => a.jid) 
  });
};

handler.command = /^منشن$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
