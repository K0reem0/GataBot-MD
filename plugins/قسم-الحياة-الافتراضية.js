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

    let images = [
        'https://qu.ax/pkVKa.jpg',
        'https://qu.ax/BUvDR.jpg',
        'https://qu.ax/uJopD.jpg',
        'https://qu.ax/jzNlc.jpg',
        'https://qu.ax/rhJHx.jpg',
        'https://qu.ax/Eadfb.jpg',
        'https://qu.ax/ictsc.jpg',
        'https://qu.ax/hyBnU.jpg',
        'https://qu.ax/tSzfo.jpg',
        'https://qu.ax/ZGjaG.jpg',
        'https://qu.ax/upaOQ.jpg',
        'https://qu.ax/YErqz.jpg',
        'https://qu.ax/uTlWt.jpg',
        'https://qu.ax/DtUSs.jpg',
        'https://qu.ax/HYSEc.jpg',
        'https://qu.ax/yoPbL.jpg',
        'https://qu.ax/pzFtu.jpg',
        'https://qu.ax/upaOQ.jpg'
        // تقدر تضيف روابط أكثر هنا
    ];

    let imgUrl = images[Math.floor(Math.random() * images.length)];

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
