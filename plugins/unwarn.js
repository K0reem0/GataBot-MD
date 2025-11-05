let handler = async (m, { conn, groupMetadata }) => {
    let who

    if (m.isGroup) {
        if (m.quoted) {
            // ✅ الرد على رسالة
            who = m.quoted.sender
        } else if (m.mentionedJid?.length) {
            // ❌ استخدام المنشن
            throw `⚠️ إزالة الإنذار تتم فقط عن طريق *الرد على رسالة* وليس بالمنشن`
        } else {
            who = null
        }
    } else {
        who = null
    }

    if (!who) throw `⚠️ رد على رسالة الشخص اللي تبغى تزيل منه إنذار`

    const user = global.db.data.users[who]
    let warn = user.warn || 0

    if (warn > 0) {
        user.warn -= 1
        m.reply(`
*❃ ──────⊰ ❀ ⊱────── ❃*
        ⚠️ *حذف إنذار* ⚠️
*❃ ──────⊰ ❀ ⊱────── ❃*         
◍ الإنذار : *-1*
◍ إجمالي الإنذارات: *${user.warn}*
*❃ ──────⊰ ❀ ⊱────── ❃*`, null, { mentions: [who] })

        m.reply(`
*❃ ──────⊰ ❀ ⊱────── ❃*

لقد تم إزالة إنذار منك ✅
الإنذارات المتبقية: *${user.warn}*

*❃ ──────⊰ ❀ ⊱────── ❃*
`, who)
    } else {
        m.reply('⚠️ هذا المستخدم ما عليه أي إنذارات')
    }
}

handler.help = ['unwarn (بالرد)']
handler.tags = ['group']
handler.command = ['حذف-انذار', 'unwarn'] 
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler