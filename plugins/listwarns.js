let handler = async (m, { conn }) => {
    let who

    if (m.isGroup) {
        if (m.quoted) {
            // ✅ الرد على رسالة
            who = m.quoted.sender
        } else if (m.mentionedJid?.length) {
            // ❌ استخدام المنشن
            throw `⚠️ عرض الإنذارات يتم فقط عن طريق *الرد على رسالة* وليس بالمنشن`
        } else {
            // ✅ إذا ما في رد ولا منشن، يجيب إنذارات المرسل نفسه
            who = m.sender
        }
    } else {
        who = m.sender
    }

    let user = global.db.data.users[who]
    let warn = user.warn || 0

    let caption = `
*❃ ──────⊰ ❀ ⊱────── ❃*
        ⚠️ *قائمة إنذارات* ⚠️
*❃ ──────⊰ ❀ ⊱────── ❃*
◍ اليوزر : @${who.split`@`[0]}
◍ إجمالي الإنذارات : *${warn}/3*
*❃ ──────⊰ ❀ ⊱────── ❃*
`

    await conn.sendMessage(m.chat, { text: caption, mentions: [who] }, { quoted: m })
}

handler.help = ['listwarn (بالرد أو بدون)']
handler.tags = ['group']
handler.command = ['انذارات', 'انذاراتي'] 
handler.group = true
handler.admin = true

export default handler