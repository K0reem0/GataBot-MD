import axios from "axios";

const handler = {};

// Global message handler for monitoring all messages
handler.all = async function (m) {
  const message = m.text?.trim();

  // Check if the message contains a link from any supported platform
  if (isInstagramLink(message)) {
    await processGenericLink(m, this, message, "الانستا");
  } else if (isXLink(message)) {
    await processGenericLink(m, this, message, "التويتر");
  } else if (isTikTokLink(message)) {
    await processGenericLink(m, this, message, "التيك");
  } else if (isFacebookLink(message)) {
    await processGenericLink(m, this, message, "الفيسبوك");
  } else if (isYouTubeLink(message)) {
    await processGenericLink(m, this, message, "اليوت");
  }
};

// Helper functions to check for specific platform links
const isInstagramLink = (text) => {
  if (!text) return false;
  const instaRegex = /https?:\/\/(www\.)?instagram\.com\/[^\s]+/i;
  return instaRegex.test(text);
};

const isXLink = (text) => {
  if (!text) return false;
  const xRegex = /https?:\/\/(www\.)?x\.com\/[^\s]+/i;
  return xRegex.test(text);
};

const isTikTokLink = (text) => {
  if (!text) return false;
  const tiktokRegex = /(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi;
  return tiktokRegex.test(text);
};

const isFacebookLink = (text) => {
  if (!text) return false;
  const facebookRegex = /https?:\/\/(www\.)?facebook\.com\/[^\s]+/i;
  return facebookRegex.test(text);
};

const isYouTubeLink = (text) => {
  if (!text) return false;
  const youtubeRegex = /https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[^\s]+/i;
  return youtubeRegex.test(text);
};

// Generic function to process links using the provided API
const processGenericLink = async (m, conn, link, platform) => {
  const { key } = await conn.sendMessage(
    m.chat,
    { text: `جارٍ معالجة رابط ${platform}...` },
    { quoted: m }
  );

  try {
    // Make the API call to fetch video details
    const response = await axios.get(`https://yt-dl0-8070764f8768.herokuapp.com/api/getVideo?url=${link}`);
    const result = response.data;

    // Check if the response is valid and contains a download URL
    if (result.status && result.data?.media?.download?.url) {
      const downloadUrl = result.data.media.download.url;
      const title = result.data.title || "video";

      // Send the downloaded video to the user
      await conn.sendFile(
        m.chat,
        downloadUrl,
        `${title}.mp4`,
        `تم التحميل بنجاح من ${platform}`,
        m
      );
    } else {
      throw new Error("لينك خاطئ أو حدثت مشكلة أثناء التحميل.");
    }
  } catch (e) {
    console.error(`حدثت مشكلة أثناء معالجة رابط ${platform}:`, e);
    await conn.sendMessage(
      m.chat,
      { text: "فشل التحميل. حاول لاحقًا." },
      { edit: key }
    );
  }
};

export default handler;
