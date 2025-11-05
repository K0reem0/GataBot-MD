import fetch from 'node-fetch';
import pkg from '@whiskeysockets/baileys';
const { prepareWAMessageMedia } = pkg;

const handler = async (m, { conn, text }) => {
  if (!text) {
    const message = `*❐═━━━═╊⊰🤖⊱╉═━━━═❐*
*❐┃ هـذا أمـر ذكـاء اصـطـنـاعـي┃🛑❯*

*↞┇ مثال ↞ .فلاش من هو رئيس كوريا الجنوبية؟*
*❐═━━━═╊⊰🤖⊱╉═━━━═❐*
> *𒆜 MoriBot-MD 𒆜*`;

    await sendInteractiveMessage(m, conn, message);
    return;
  }

  try {
    const apiURL = `https://bk9.fun/ai/llama?q=${encodeURIComponent(text)}&lc=ar`;
    const response = await fetch(apiURL);
    const rawResponse = await response.text();

    console.log('Raw API Response:', rawResponse);

    try {
      const data = JSON.parse(rawResponse);
      console.log('Parsed API Response:', data);

      if (data && data.BK9) {
        await sendInteractiveMessage(m, conn, data.BK9);
      } else {
        throw new Error('الرد من الـ API لا يحتوي على نتيجة.');
      }
    } catch (jsonError) {
      console.error('JSON Parse Error:', jsonError);
      conn.reply(m.chat, 'حدث خطأ أثناء قراءة الرد من الخدمة.', m);
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    conn.reply(m.chat, `حدث خطأ أثناء الاتصال بالخدمة. التفاصيل: ${error.message}`, m);
  }
};

async function sendInteractiveMessage(m, conn, text) {
  const imageUrl = 'https://files.catbox.moe/f5fjki.jpg';

  let media = await prepareWAMessageMedia({ image: { url: imageUrl } }, { upload: conn.waUploadToServer });

  let message = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: `Asmarah 𝐁𝐨𝐭` },
          body: {
            text: text, // يتم عرض رد الذكاء الاصطناعي فقط
            subtitle: "Mori AI",
          },
          header: { hasMediaAttachment: true, ...media },
          contextInfo: {
            isForwarded: false,
          },
          nativeFlowMessage: {
            buttons: [
              {  
                name: "cta_url",  
                buttonParamsJson: JSON.stringify({  
                  display_text: "قــنــاتــنــا 🔰",  
                  url: "https://whatsapp.com/channel/0029Vb0WYOu2f3EAb74gf02h",  
                  merchant_url: "https://whatsapp.com/channel/0029Vb0WYOu2f3EAb74gf02h"  
                })  
              }
            ]
          }
        }
      }
    }
  };

  await conn.relayMessage(m.chat, message, {});
}

handler.help = ['M O R I'];
handler.tags = ['M E T A'];
handler.command = /^(فلاش|ميتا|لما)$/i;

export default handler;