const { proto, generateWAMessageFromContent, generateWAMessageContent } = (await import("@whiskeysockets/baileys")).default;
import axios from 'axios';

const handler = async (m, { conn, usedPrefix, command, text }) => {
  if (!text) {
    return conn.sendMessage(m.chat, {
      text: `*_< نتائج بحث - Pinterest />_*\n\n[❗] الرجاء إدخال كلمة للبحث\n📌 مثال: ${usedPrefix + command} قطط`,
    }, { quoted: m });
  }

  // إرسال رسالة الانتظار
  const waitMsg = await conn.sendMessage(m.chat, {
    text: `*_< نتائج بحث - Pinterest />_*\n\n⏳ جاري البحث عن "${text}"، يرجى الانتظار...`,
  }, { quoted: m });

  try {
    let { data } = await axios.get(`https://api.stellarwa.xyz/search/pinterest?query=${text}&apikey=BrunoSobrino`);
    let images = data.data;
    let push = [];

    for (let i = 0; i < images.length; i++) {
      let image = images[i];
      push.push({
        body: proto.Message.InteractiveMessage.Body.fromObject({ text: `\n📸 رقم النتيجة: ${i + 1}\n` }),
        footer: proto.Message.InteractiveMessage.Footer.fromObject({ text: global.pickbot }),
        header: proto.Message.InteractiveMessage.Header.fromObject({
          title: '*_< نتائج بحث - Pinterest />_*',
          hasMediaAttachment: true,
          imageMessage: await generateWAMessageContent({ image: { url: image.hd } }, { upload: conn.waUploadToServer }).then(res => res.imageMessage)
        }),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
          buttons: [
            {
  "name": "quick_reply",
  "buttonParamsJson": `{"display_text":"🛠️ تحسين الصورة","id":".enhanceurl ${image.hd}"}`
}
          ]
        })
      });
    }

    let bot = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: proto.Message.InteractiveMessage.fromObject({
            body: proto.Message.InteractiveMessage.Body.create({ text: "*_< نتائج بحث - Pinterest />_*" }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: `🔎 *الكلمة المفتاحية:* ${text}\n👤 *تم الطلب من قبل:* ${global.db.data.users[m.sender].name}` }),
            header: proto.Message.InteractiveMessage.Header.create({ hasMediaAttachment: false }),
            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({ cards: [...push] })
          })
        }
      }
    }, { quoted: m });

    // حذف رسالة الانتظار قبل إرسال النتائج
    await conn.sendMessage(m.chat, { delete: waitMsg.key });
    
    await conn.relayMessage(m.chat, bot.message, { messageId: bot.key.id });

  } catch (error) {
    console.error(error);
    // حذف رسالة الانتظار في حالة الخطأ
    await conn.sendMessage(m.chat, { delete: waitMsg.key });
    conn.sendMessage(m.chat, {
      text: "*_< نتائج بحث - Pinterest />_*\n\n[❗] حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة لاحقًا.",
    }, { quoted: m });
  }
};

handler.help = ['pinterest'];
handler.tags = ['search'];
handler.command = ['بنترست', 'صورة'];

export default handler;