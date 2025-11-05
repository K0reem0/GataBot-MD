import translate from '@vitalets/google-translate-api';
import { Anime } from '@shineiichijo/marika';

const client = new Anime();
const handler = async (m, { conn, text }) => {
  if (!text) return m.reply(`*اكتب اسم الأنمي الذي تبحث عنه بالإنجليزية* 🎌`);

  try {
    const anime = await client.searchAnime(text);
    const result = anime.data[0];

    // ترجمة الوصف للعربية
    let translatedDesc = { text: "لا يوجد وصف متاح" };
    if (result.synopsis) {
      translatedDesc = await translate(result.synopsis, { to: 'ar' });
    }

    const AnimeInfo = `
*🎀 • العنوان:* ${result.title || "غير معروف"}
*🎋 • الفئة:* ${result.type || "غير معروف"}
*📈 • الحالة:* ${result.status?.toLowerCase() || "غير معروف"}
*🍥 • عدد الحلقات:* ${result.episodes || "غير معروف"}
*💫 • مدة الحلقة:* ${result.duration || "غير معروف"}
*🎇 • المصدر:* ${result.source?.toLowerCase() || "غير معروف"}
*📅 • بداية العرض:* ${result.aired?.from || "غير معروف"}
*📅 • نهاية العرض:* ${result.aired?.to || "غير معروف"}
*🔥 • الشعبية:* ${result.popularity || "غير معروف"}
*⭐ • المفضلة:* ${result.favorites || "غير معروف"}
*💯 • التقييم:* ${result.rating || "غير معروف"}
*🏆 • الترتيب:* ${result.rank || "غير معروف"}
*🎬 • التريلر:* ${result.trailer?.url || "غير متوفر"}
*🔗 • رابط MAL:* ${result.url}
*❄ • الوصف:* ${translatedDesc.text}
`;

    conn.sendFile(m.chat, result.images.jpg.image_url, 'anime.jpg', AnimeInfo, m);
  } catch (e) {
    console.error(e)
    throw `❌ لم يتم العثور على نتائج لهذا الأنمي.`;
  }
};

handler.command = /^(anime|انمي)$/i;
export default handler;