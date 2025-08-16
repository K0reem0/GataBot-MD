import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import fs from 'fs';
import axios from 'axios';
import path from 'path';

let handler = async (m, { conn }) => {
    const imageUrl = 'https://files.catbox.moe/yjj0x6.jpg';

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
            title: `*❀ ───────⊰ ꪆৎ ⊱─────── ❀*\n\n *مرحبا*  ⋆. 𐙚˚࿔  *${m.pushName}*  𝜗𝜚˚⋆ \n *اسمي 𐦯՞. هايسو .՞𐔌*\n\n *كيف اقدر اساعدك ᥫ᭡*\n`,
            hasMediaAttachment: true,
            imageMessage: imageMessage.imageMessage, // استخدام الصورة
        },
        body: {
            text: '*أختر من الأقسام ما يناسبك 𓍯𓂃*\n\n*❀ ───────⊰ ꪆৎ ⊱─────── ❀*\n',
        },
        nativeFlowMessage: {
            buttons: [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: 'ꪆৎ اخـتر القـسـم ꪆৎ',
                        sections: [
                            {
                                title: 'قـسـم الاوامر',
                                highlight_label: 'هايسو ꪆৎ',
                                rows: [
                                    { header: '❀ قـسـم المشـرفـين ❀', title: '❃ أوامر المشرفين ❃', id: '.قسم-المشرفين' },
                                    { header: '❀ قـسـم التحميلات ❀', title: '❃ أوامر التحميل ❃', id: '.قسم-التحميل'},
                                    { header: '❀ قـسـم الـتـرفيـه ❀', title: '❃ أوامر الترفيه ❃', id: '.قسم-الترفيه' },
                                    { header: '❀ قـسـم الحياة الافتراضية ❀', title: '❃ أوامر الحياة الافتراضية ❃', id: '.قسم-الحياة-الافتراضية' },
                                    { header: '❀ قـسـم الـتحـويل ❀', title: '❃ أوامر التحويل ❃', id: '.قسم-التحويل' },
                                    { header: '❀ قـسـم اوامر الدين والأسلام ❀', title: '❃ أوامر الـديـني ❃', id: '.قسم-ديني' },
                                    { header: '❀ هايسو ❀', title: '❃ أوامر هايسو ❃', id: '.قسم-المطور' },
                                    { header: '❀ قـسـم الألقاب ❀', title: '❃ أوامر الألقاب ❃', id: '.القاب-الاعضاء' },
                                    { header: '❀ كل الاوامر ❀', title: '❃ جميع الأوامر ❃', id: '.كل-الاوامر' },
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
        { quoted: m }
    );

    // إرسال الرسالة
    conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ['info'];
handler.tags = ['main'];
handler.command = ['أوامر', 'اوامر'];

export default handler;
