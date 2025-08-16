import fs from 'fs'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                      *الحياة الافتراضية*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ محفظة*
> *◍ بنك*
> *◍ ايداع*
> *◍ سحب*
> *◍ يومي*
> *◍ رانك*
> *◍ بروفايل*
> *◍ تعدين*
> *◍ سرقة*
> *◍ قتال*
> *◍ دجاج*

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
handler.command = /^(قسم-الحياة-الافتراضية)$/i 

export default handler
