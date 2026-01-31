import fs from 'fs'
import path from 'path'

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
> *◍ تهكير*

*❃ ────────⊰ ❀ ⊱──────── ❃*`

    // توليد الصور من src/1.jpg إلى src/18.jpg
    let images = []
    for (let i = 1; i <= 18; i++) {
        images.push(path.join(process.cwd(), 'src', `${i}.jpg`))
    }

    // اختيار صورة عشوائية
    let imgPath = images[Math.floor(Math.random() * images.length)]

    try {
        // قراءة الصورة من الجهاز
        let imgBuffer = fs.readFileSync(imgPath)

        await conn.sendMessage(
            m.chat,
            {
                image: imgBuffer,
                caption: menu
            },
            { quoted: m }
        )

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
