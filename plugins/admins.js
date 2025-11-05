let handler = async (m, { conn, participants }) => {
  // جلب المشرفين فقط
  const admins = participants.filter(p => p.admin);

  let teks = "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n" +    
             "                      *المــــشــــــرفيــــــن*\n\n" +       
             "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n";  

  for (let mem of admins) {
    let user = global.db.data.users[mem.jid] || { registered: false, name: "غير مسجل", messages: 0 };
    
    if (user.registered) {
      teks += `◍ ${user.name} @${mem.jid.split('@')[0]}\n\n`;
    } else {
      teks += `◍ غير مسجل @${mem.jid.split('@')[0]}\n\n`;
    }
  }

  teks += "*❃ ─────────⊰ ❀ ⊱───────── ❃*";

  conn.sendMessage(m.chat, {   
    text: teks,   
    mentions: admins.map(a => a.jid)   
  });
};

handler.help = ['mentionadmins'];
handler.tags = ['group'];
handler.command = /^مشرفين$/i;
handler.group = true;

export default handler;