import { prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {

    // توليد الصور من src/1.jpg إلى src/18.jpg
    let images = [];
    for (let i = 1; i <= 18; i++) {
        images.push(path.join(process.cwd(), 'src', `${i}.jpg`));
    }

    // اختيار صورة عشوائية
    let imagePath = images[Math.floor(Math.random() * images.length)];

    // قراءة الصورة من الجهاز
    let imageBuffer = fs.readFileSync(imagePath);

    // تحضير الصورة كوسائط
    const imageMessage = await prepareWAMessageMedia(
        { image: imageBuffer },
        { upload: conn.waUploadToServer }
    );

    await conn.sendMessage(m.chat, { react: { text: '🎀', key: m.key } });

    // الرسالة التفاعلية
    const interactiveMessage = {
        header: {
            title: `*❀ ───────⊰ ꪆৎ ⊱─────── ❀*\n\n *مرحبا*  ⋆. 𐙚˚࿔  *${m.pushName}*  𝜗𝜚˚⋆ \n *اسمي 𐦯՞. هايسو .՞𐔌*\n\n *كيف اقدر اساعدك ᥫ᭡*\n`,
            hasMediaAttachment: true,
            imageMessage: imageMessage.imageMessage,
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

    let msg = generateWAMessageFromContent(
        m.chat,
        {
            viewOnceMessage: {
                message: { interactiveMessage },
            },
        },
        { userJid: conn.user.jid, quoted: m }
    );

    conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ['info'];
handler.tags = ['main'];
handler.command = ['أوامر', 'اوامر'];

export default handler;
