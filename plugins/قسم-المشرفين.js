import fs from 'fs'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                        *الـمـشـرفـيـن*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ منشن*
> *◍ مخفي*
> *◍ طرد*
> *◍ كتم*
> *◍ لكتم*
> *◍ إضافة*
> *◍ ترقية*
> *◍ تخفيض*
> *◍ حذف*
> *◍ فتح جروب*
> *◍ قفل جروب*
> *◍ تغيير الصورة*
> *◍ لينك*
> *◍ مشرف*
> *◍ إنذار*
> *◍ حذف إنذار*
> *◍ لقب*
> *◍ تسجيل*
> *◍ إزالة*
> *◍ ألقاب*
> *◍ زيارة* 

*❃ ────────⊰ ❀ ⊱──────── ❃*`

    let imgUrl = 'https://files.catbox.moe/yjj0x6.jpg'

    try {
        await conn.sendMessage(m.chat, { 
            image: { url: imgUrl }, 
            caption: menu 
        }, { quoted: m })

        console.log('Image sent successfully')
    } catch (e) {
        console.error(e)
        conn.reply(m.chat, '❌ Failed to send image', m)
    }
}

handler.help = ['main']
handler.tags = ['group']
handler.command = /^(قسم-المشرفين)$/i 

export default handler
