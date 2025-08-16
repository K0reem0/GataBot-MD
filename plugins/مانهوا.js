import translate from '@vitalets/google-translate-api';
import axios from 'axios';
import fs from 'fs';

const baseUrl = 'https://api.mangadex.org';

const handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`❗️ الرجاء إدخال اسم المانهوا التي تريد البحث عنها.`);

  try {
    // البحث عن المانهوا
    const response = await axios({
      method: 'GET',
      url: `${baseUrl}/manga`,
      params: {
        title: text,
        limit: 1
      }
    });

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error('🚫 لم يتم العثور على نتائج، تأكد من كتابة الاسم بشكل صحيح.');
    }

    const manga = response.data.data[0];

    // جلب التفاصيل الكاملة
    const details = await axios.get(`${baseUrl}/manga/${manga.id}?includes[]=cover_art`);
    const attributes = details.data.data.attributes;

    // الغلاف
    const relationships = details.data.data.relationships;
    const coverArt = relationships.find(r => r.type === 'cover_art');
    const coverUrl = coverArt
      ? `https://uploads.mangadex.org/covers/${manga.id}/${coverArt.attributes.fileName}`
      : '';

    // ترجمة الوصف
    const translated = await translate(attributes.description?.en || 'No description', {
      to: 'ar',
      autoCorrect: true
    });

    // التنسيق النهائي
    const message = `
*🎀 • العنوان:* ${attributes.title.en || attributes.title.ja || attributes.title.ko || 'غير معروف'}
*🎋 • الفئة:* ${attributes.publicationDemographic || 'غير معروف'}
*📈 • الحالة:* ${attributes.status || 'غير معروف'}
*🍥 • آخر فصل:* ${attributes.lastChapter || 'غير معروف'}
*💫 • سنة الإصدار:* ${attributes.year || 'غير معروف'}
*🎇 • التصنيف العمري:* ${attributes.contentRating || 'غير معروف'}
*🌐 • اللغة الأصلية:* ${attributes.originalLanguage || 'غير معروف'}
*🎗 • الحالة العامة:* ${attributes.state || 'غير معروف'}
*❄ • الوصف:* ${translated.text}
`.trim();

    // إرسال الغلاف مع التفاصيل
    if (coverUrl) {
      await conn.sendFile(m.chat, coverUrl, 'cover.jpg', message, m);
    } else {
      m.reply(message);
    }

  } catch (error) {
    console.error(error);
    throw '❌ حدث خطأ أثناء البحث عن المانهوا أو لم يتم العثور على نتائج.';
  }
};

handler.command = /^(مانهوا|مانغا)$/i;
export default handler;
