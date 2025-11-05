import uploadFile from '../lib/uploadFile.js';
import uploadImage from '../lib/uploadImage.js';
import fs from 'fs'

const handler = async (m) => {
  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';
  if (!mime) throw `*الرجاء إرسال صورة أو ملف لرفعه كرابط*`;
  
  const media = await q.download();
  const isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);
  const link = await (isTele ? uploadImage : uploadFile)(media);
  
  m.reply(`*تم رفع الملف بنجاح ✅*\n${link}`);
};

handler.help = ['tourl'];
handler.tags = ['converter'];
handler.command = ['رفع', 'uploader', 'لرابط'];

export default handler;
