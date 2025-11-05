let war = 3
let handler = async (m, { conn, text, groupMetadata }) => {      
    let who

    if (m.isGroup) {
        if (m.quoted) {
            // ✅ إذا كان عن طريق الرد
            who = m.quoted.sender
        } else if (m.mentionedJid?.length) {
            // ❌ إذا حاول بالمنشن فقط
            throw `⚠️ الإنذار يتم فقط عن طريق *الرد على رسالة* وليس بالمنشن`
        } else {
            who = null
        }
    } else {
        who = null
    }

    if (!who) throw `⚠️ رد على رسالة الشخص اللي تبغى تعطيه إنذار`

    const user = global.db.data.users[who]
    let name = conn.getName(m.sender)
    let warn = user.warn || 0

    if (warn < war) {
        user.warn += 1
        m.reply(`
*❃ ──────⊰ ❀ ⊱────── ❃*
        ⚠️ *بطاقة انذار* ⚠️
*❃ ──────⊰ ❀ ⊱────── ❃*
◍ *المشرف :* ${name}
◍ *اليوزر :* @${who.split`@`[0]}
◍ *الإنذارات :* ${warn + 1}/${war}
◍ *السبب :* ${text ? text : "غير مذكور"}
*❃ ──────⊰ ❀ ⊱────── ❃*`, null, { mentions: [who] }) 

        m.reply(`
*❃ ──────⊰ ❀ ⊱────── ❃*

⚠️ *تنبيه* ⚠️
لقد تلقيت إنذار من مشرف

◍ *الإنذارات :* ${warn + 1}/${war} 
اذا تلقيت *${war}* إنذارات فسوف تنطرد تلقائيا

*❃ ──────⊰ ❀ ⊱────── ❃*
`, who)
    } else if (warn == war) {
        user.warn = 0
        m.reply(`⛔ المستخدم بلغ *${war}* أي العدد الأقصى المسموح به وسوف يتم ازالته`)
        await time(3000)
        await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
        m.reply(`♻️ تم طردك من *${groupMetadata.subject}* بسبب تلقيك العدد الأقصى من الإنذارات *${war}*`, who)
    }
}

handler.help = ['warn (بالرد)']
handler.tags = ['group']
handler.command = ['انذار'] 
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

const time = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}