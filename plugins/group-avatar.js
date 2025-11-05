import Jimp from 'jimp';

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  try {
    const quoted = m.quoted ? m.quoted : m;
    if (!m.quoted || !quoted.mimetype?.includes('image')) throw '*⚠️️ قم بالرد على صورة لتعيينها كصورة للمجموعة.*';

    const mime = (quoted.msg || quoted).mimetype || '';
    const imageBuffer = await quoted.download();

    if (!m.isGroup) throw '*❗ هذا الأمر يمكن استخدامه داخل المجموعات فقط.*';

    const image = await Jimp.read(imageBuffer);
    const resized = image.getWidth() > image.getHeight() ? image.resize(720, Jimp.AUTO) : image.resize(Jimp.AUTO, 720);
    const jpegBuffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

    await conn.updateProfilePicture(m.chat, jpegBuffer);

    await m.reply('✅ *تم تحديث صورة المجموعة بنجاح.*');
  } catch (err) {
    console.error('❌ خطأ في setppgroup:', err);
    await m.reply(typeof err === 'string' ? err : '*❗ حدث خطأ أثناء تغيير صورة المجموعة.*');
  }
};

handler.command = /^افتار$/i;
handler.help = ['setppgroup'];
handler.tags = ['group'];
handler.group = true;
handler.botAdmin = true;
handler.admin = true;
export default handler;