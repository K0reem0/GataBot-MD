//كود ديب-سيك ذكاء اصطناعي 📍
// Channel>>> https://whatsapp.com/channel/0029Vb0WYOu2f3EAb74gf02h

//By Mori-Dev 

import fetch from 'node-fetch';

const handler = async (m, { conn, text }) => {
  try {
    if (!text) {
      return conn.reply(
        m.chat,
        '*مرحبًا! أنا ديب-سيك ذكاء اصطناعي، كيف يمكنني مساعدتك؟*\nمـثال:\n*.ديب من هو رئيس كوريه الجنوبية؟*\n*.ديب كيف حالك؟!*\n\n> *By Coding Mori*\n> *By API Shawza*',
        m
      );
    }

    const Mori = `https://the-end-api.vercel.app/home/sections/Ai/api/DeepAI/chat?q=${encodeURIComponent(text)}&lc=ar`;

    const response = await fetch(Mori);
    const rawResponse = await response.text();

    //console.log('Raw API Response:', rawResponse);

    try {
      const data = JSON.parse(rawResponse);
      //console.log('Parsed API Response:', data);

      if (data && data.data) {
        conn.reply(m.chat, data.data, m);
      } else {
        conn.reply(m.chat, 'الرد من الـ API لا يحتوي على نتيجة.', m);
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

handler.help = ['M O R I'];
handler.tags = ['M O R I'];
handler.command = /^(ديب|ديب-سيك)$/i;

export default handler;