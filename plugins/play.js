import axios from 'axios';
import yts from 'yt-search';

const handler = async (m, { conn, args }) => {
  if (!m || typeof m !== 'object') {
    console.error("Invalid message object.");
    return;
  }

  if (!args.length) {
    return conn.reply(m.chat, '*أدخل رابط الفيديو أو كلمات البحث.*', m);
  }

  const pingMsg = await conn.reply(m.chat, "جاري البحث... ⏳", m);

  try {
    let videoUrl;
    let videoTitle;

    const updateMessage = async (newText) => {
      await conn.relayMessage(
        m.chat,
        {
          protocolMessage: {
            key: pingMsg.key,
            type: 14,
            editedMessage: {
              conversation: newText,
            },
          },
        },
        {}
      );
    };

    if (args[0].startsWith("http")) {
      videoUrl = args[0];
      await updateMessage(" تم اكتشاف رابط الفيديو. جاري التحميل...");
    } else {
      const query = args.join(" ");
      await updateMessage(` البحث عن: *${query}*`);

      try {
        const searchResults = await yts(query);
        if (searchResults.videos.length > 0) {
          const firstResult = searchResults.videos[0];
          videoUrl = firstResult.url;
          videoTitle = firstResult.title;
          await updateMessage(` تم العثور على: *${videoTitle}*\n⏳ جاري التحميل...`);
        } else {
          return await updateMessage("❌ لم يتم العثور على نتائج.");
        }
      } catch (searchError) {
        console.error("Error during search:", searchError);
        return await updateMessage("⚠️ حدث خطأ أثناء البحث.");
      }
    }

    if (!videoUrl || !videoUrl.startsWith("http")) {
      return await updateMessage("❌ رابط الفيديو غير صالح.");
    }

    const apiUrl = `https://yt-dl0-8070764f8768.herokuapp.com/api/getVideo?url=${videoUrl}`;
    await updateMessage("⏳ يتم الآن تحميل الفيديو من واجهة برمجة التطبيقات الجديدة...");

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (data && data.data && data.data.media && data.data.media.download && data.data.media.download.url) { // فحص شامل
      const downloadUrl = data.data.media.download.url; // الوصول الصحيح للرابط
      const title = videoTitle || data.data.title || "video";
      const fileSize = "غير معروف"; // لا يوجد حجم في الرد، لذا نتركه "غير معروف" مؤقتًا

      await updateMessage(` يتم إرسال الفيديو: *${title}*`); // لا نعرض الحجم لأنه غير متوفر

      try {
        await conn.sendFile(
          m.chat,
          downloadUrl,
          `${title}.mp4`,
          ` تم التحميل بنجاح!\n العنوان: ${title}`, // لا نعرض الحجم
          m,
          false,
          { mimetype: 'video/mp4' }
        );
      } catch (sendFileError) {
          console.error("Error sending file:", sendFileError);
          return await updateMessage(`⚠️ حدث خطأ أثناء إرسال الملف.`);
      }

    } else {
      console.error("Invalid API response:", data);
      return await updateMessage("⚠️ حدث خطأ في بيانات واجهة برمجة التطبيقات.");
    }

  } catch (error) {
    console.error("General error:", error);
    return await updateMessage(`⚠️ حدث خطأ عام: ${error.message}`);
  }
};

handler.help = ['youtube <link yt> | <search query>'];
handler.tags = ['downloader'];
handler.command = /^(شغل)$/i;

export default handler;