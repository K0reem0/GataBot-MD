import fs from 'fs'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                           *هايسو*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ سماح*
> *◍ منع*
> *◍ لائحة*
> *◍ بان*
> *◍ بان-فك*
> *◍ ايقاف*
> *◍ تشغيل*
> *◍ افتار*
> *◍ ريستارت*
> *◍ ادخل*
> *◍ اخرج*
> *◍ ضيف-اكس-بي*

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
handler.command = /^(قسم-المطور)$/i 

export default handler
