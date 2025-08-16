import fs from 'fs'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                         *الـتـحـويـل*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ ملصق*
> *◍ لنص*
> *◍ قول*
> *◍ لصورة*
> *◍ كومنت*
> *◍ زخرفة*
> *◍ خط*
> *◍ كلمات-اغنيه*
> *◍ تحسين*
> *◍ لفيديو*
> *◍ لصورة*
> *◍ لانمي*
> *◍ باركود*

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
handler.command = /^(قسم-التحويل)$/i 

export default handler
