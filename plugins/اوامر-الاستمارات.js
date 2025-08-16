import { prepareWAMessageMedia, generateWAMessageFromContent } from 'baileys';
import axios from 'axios';

let handler = async (m, { conn }) => {
    const imageUrl = 'https://files.catbox.moe/oomcu5.jpg';

    // تحميل الصورة من الرابط وحفظها مؤقتًا
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    // تحضير الصورة كوسائط
    const imageMessage = await prepareWAMessageMedia(
        { image: imageBuffer },
        { upload: conn.waUploadToServer }
    );

    // إنشاء الرسالة التفاعلية
    const interactiveMessage = {
        header: {
            title: `*❃ ───────⊰ ❀ ⊱─────── ❃*\n
  ⚜︎ اهلاً ، معك المساعدة *بيتا* 
  ⚜︎ كيف يمكنني أن اساعدك..؟ ⚜️

*❃ ───────⊰ ❀ ⊱─────── ❃*  

 ⚜︎┊لطلب الاستمارات *الاساسية* اضغط 
    ✧ بيتا 01   

 ⚜︎┊ لطلب استمارات *البطولات* اضغط 
    ✧ بيتا 02

 ⚜︎┊ لطلب الاستمارات *الادارية* اضغط
    ✧ بيتا 03 

📜 *أختر من الأقسام ما يناسبك*     
                                                                                              
*❃ ───────⊰ ❀ ⊱─────── ❃*
        ﹝𝑺𝒑𝒂𝒓𝒕𝒂 ⊰🛡️⊱ 𝑲𝒊𝒏𝒈𝒅𝒐𝒎﹞`,
            hasMediaAttachment: true,
            imageMessage: imageMessage.imageMessage, // استخدام الصورة
        },
        body: {
            text: '*❃ ───────⊰ ❀ ⊱─────── ❃*\n',
        },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: '❀ الأقسام ❀',
                        sections: [
                            {
                                title: '🚀 اختصارات سريعة',
                                highlight_label: '🔹 سهولة الوصول',
                                rows: [
                                    { header: '❀ وصول سريع ❀', title: '❃ بيتا استمارة ❃', id: '.استمارة' },
                                    { header: '❀ وصول سريع ❀', title: '❃ بيتا ترحيب ❃', id: '.بيتا_ترحيب' },
                                    { header: '❀ وصول سريع ❀', title: '❃ بيتا حسبة ❃', id: '.بيتا_حسبة' },
                                ],
                            },
                            {
                                title: 'قسم الأستمارات',
                                highlight_label: 'آرثر',
                                rows: [
                                    { header: '❀ بيتا 01 ❀', title: '❃ الاستمارات الأساسية ❃', id: '.بيتا1' },
                                    { header: '❀ بيتا 02 ❀', title: '❃ استمارات البطولات ❃', id: '.بيتا2' },
                                    { header: '❀ بيتا 03 ❀', title: '❃ الاستمارات الادارية ❃', id: '.بيتا3' },
                                ],
                            },
                        ],
                    }),
                    messageParamsJson: '',
                },
            ],
        },
    };

    // إنشاء الرسالة
    let msg = generateWAMessageFromContent(
        m.chat,
        {
            viewOnceMessage: {
                message: {
                    interactiveMessage,
                },
            },
        },
        { userJid: conn.user.jid, quoted: m }
    );

    // إرسال الرسالة
    conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ['info'];
handler.tags = ['main'];
handler.command = ['استمارات', 'بيتا'];

export default handler;
