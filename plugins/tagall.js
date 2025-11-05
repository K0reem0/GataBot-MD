let handler = async (m, { conn, participants }) => {
    // جلب قائمة المشطوفين من قاعدة البيانات
    const excludedMembers = global.db.data.excludedMembers || [];
    
    let teks = "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n" +  
               "*مـنشــــــن عـــــــــام لأعــــــضاء ومشرفـــين*\n" +  
               `*✦╎『 ${await conn.getName(m.chat)} 』╎✦*\n` +  
               "*المنشن خاص للمشرفين نتأسف على الازعاج*\n\n";

    // تصفية الأعضاء المستثنين
    const filteredParticipants = participants.filter(mem => 
      !excludedMembers.includes(mem.jid)
    );

    // ترتيب حسب الاسم
    filteredParticipants.sort((a, b) => {
      let userA = global.db.data.users[a.jid] || { registered: false, name: null };
      let userB = global.db.data.users[b.jid] || { registered: false, name: null };

      let nameA = (userA.name === null || userA.name === undefined) ? "غير مسجل ⚠️" : userA.name;
      let nameB = (userB.name === null || userB.name === undefined) ? "غير مسجل ⚠️" : userB.name;

      return nameA.localeCompare(nameB, 'ar', { sensitivity: 'base' });
    });

    let currentLetter = '';
    let firstLetterUsed = '';
    let foundRegistered = false;
    let unregisteredList = [];

    for (let mem of filteredParticipants) {
      let user = global.db.data.users[mem.jid] || { registered: false, name: null };
      user.name = (user.name === null || user.name === undefined) ? "غير مسجل ⚠️" : user.name;

      // إذا الرسائل undefined نخليها 0 ونخزنها بالداتا بيس
      if (user.mensaje === undefined) {
        user.mensaje = 0;
        global.db.data.users[mem.jid] = user; // تحديث الداتا بيس
      }

      if (user.registered) {
        foundRegistered = true;
        let firstLetter = user.name.charAt(0);

        if (!firstLetterUsed) {
          firstLetterUsed = firstLetter;
          teks += `*❃ ─────────⊰ ${firstLetter} ⊱───────── ❃*\n\n`;
          currentLetter = firstLetter;
        } else if (firstLetter !== currentLetter) {
          teks += `*❃ ─────────⊰ ${firstLetter} ⊱───────── ❃*\n\n`;
          currentLetter = firstLetter;
        }

        teks += `◍ ${user.name} @${mem.jid.split('@')[0]}   ( الرسائل : ${user.mensaje} )\n\n`;
      } else {
        unregisteredList.push(`◍ غير مسجل ⚠️ @${mem.jid.split('@')[0]}   ( الرسائل : ${user.mensaje} )\n`);
      }
    }

    if (!foundRegistered) {
      teks += "*❃ ─────────⊰ ⚠️ ⊱───────── ❃*\n\n";
    }

    if (unregisteredList.length > 0) {
      if (foundRegistered) {
        teks += "*❃ ─────────⊰ ⚠️ ⊱───────── ❃*\n\n";
      }
      teks += unregisteredList.join('\n') + '\n';
    }

    teks += "*❃ ─────────⊰ ❀ ⊱───────── ❃*\n\n";
    teks += "> *ملاحظة : قم بتسجيل الاعضاء الغير مسجلين عن طريق استخدام أمر (.تسجيل)*\n\n";
    teks += "*❃ ─────────⊰ ❀ ⊱───────── ❃*";

    conn.sendMessage(m.chat, { 
      text: teks, 
      mentions: filteredParticipants.map(a => a.jid) 
    });
};

handler.help = ['mentionall'];
handler.tags = ['group'];
handler.command = /^منشن$/i;
handler.group = true;
handler.admin = true;

export default handler;