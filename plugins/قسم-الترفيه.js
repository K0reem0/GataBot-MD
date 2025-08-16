import fs from 'fs'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                          *الـتـرفـيـه*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ اكس*
> *◍ حذف-اكس*
> *◍ تحدي*
> *◍ تحداني*
> *◍ صراحه*
> *◍ بوت*
> *◍ تطقيم*
> *◍ ايدت*
> *◍ فزوره*
> *◍ ورع*
> *◍ خروف*
> *◍ اهبل*
> *◍ جميل*
> *◍ ترت*
> *◍ تف*
> *◍ لاعب*
> *◍ علم*
> *◍ احزر*
> *◍ عين*
> *◍ كت*
> *◍ ميمز*
> *◍ حرف*
> *◍ قلب*
> *◍ نرد*
> *◍ لو*
> *◍ صداقه*
> *◍ نصيحة*
> *◍ حب*
> *◍ هل*
> *◍ ترجم*
> *◍ اقتباس*
> *◍ زواج*
> *◍ طلاق*
> *◍ تاج*
> *◍ حكمه*
> *◍ هايسو*
> *◍ المشنقة*
> *◍ سؤال*
> *◍ توب*
> *◍ شخصية*
> *◍ غباء*
> *◍ شبيهي*
> *◍ غزل*

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
handler.command = /^(قسم-الترفيه)$/i 

export default handler
