import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    let menu = `
*❃ ────────⊰ ❀ ⊱──────── ❃*
                          *الألــقــاب*
*❃ ────────⊰ ❀ ⊱──────── ❃* 

> *◍ القاب*
*❃ ⌘¦ قائمة بجميع الألقاب ❃* 
> *◍ تسجيل*
*❃ ⌘¦ منشن عضو لتسجيله ❃*
> *◍ تصفيه*
*❃ ⌘¦ حذف جميع الألقاب ❃*
> *◍ لقبي*
*❃ ⌘¦ لمعرفة لقبك ❃* 
> *◍ لقبه*
*❃ ⌘¦ معرفة لقب العضو الذي تم منشنته ❃* 
> *◍ لقب*
*❃ ⌘¦ بحث عن اللقب وتوفره ❃*
> *◍ حذف*
*❃ ⌘¦ حذف اللقب المسجل ❃*  

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
handler.command = /^(القاب-الاعضاء)$/i 

export default handler
