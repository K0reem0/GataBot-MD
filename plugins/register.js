import { createHash } from 'crypto';
import uploadImage from '../lib/uploadImage.js'; // تأكد من صحة المسار

const handler = async (m, {conn, participants, text, usedPrefix, command}) => {
    
   let target = m.quoted ? m.quoted.sender : null;

   if (!target) {
       return conn.reply(m.chat, "❌ يجب أن ترد على رسالة المستخدم الذي تريد تسجيله 👤", m);
   }

   // أنشئ السجل إذا ما كان موجود
   if (!global.db.data.users[target]) global.db.data.users[target] = {
        registered: false,
        name: null,
        regTime: null,
        image: null,
        exp: 0,
        mensaje: 0,
   };

   const user = global.db.data.users[target];
   if (user.registered === true) throw '*تم تسجيل هذا المستخدم مسبقًا*';

   // استخراج الاسم من النص (بشرط يكون فيه نص بجانب الأمر)
   const nameText = text?.trim();
   if (!nameText) throw `*يجب كتابة اسم مع الأمر عند الرد على المستخدم*`;
   if (nameText.length >= 30) throw '*الاسم طويل جدًا*';

   let name = nameText;

   // التأكد من أن الاسم غير مستخدم فقط من قبل مستخدمين مسجلين
   const isNameTaken = Object.values(global.db.data.users).some(user =>
       user.registered &&
       user.name?.toLowerCase() === name.toLowerCase() &&
       user !== global.db.data.users[target]
   );

   if (isNameTaken) throw '*الاسم مستخدم بالفعل*';

   // محاولة أخذ صورة من الرد فقط
   let imageUrl = null;
   if (m.quoted && /image\/(png|jpe?g)/.test(m.quoted.mimetype)) {
       try {
           const media = await m.quoted.download();
           imageUrl = await uploadImage(media);
       } catch (e) {
           console.error(e);
           throw '*حدث خطأ أثناء تحميل الصورة. حاول مرة أخرى.*';
       }
   }

   user.name = name.trim();
   user.regTime = +new Date();
   user.registered = true;
   user.image = imageUrl;

   const sn = createHash('md5').update(target).digest('hex').slice(0, 21);

   const replyMessage = `*❃ ──────⊰ ❀ ⊱────── ❃*
◍ *تم تسجيلك بنجاح*
*❃ ──────⊰ ❀ ⊱────── ❃*
◍ *الاسم:* *${name}*
◍ *الايدي:* *${sn}*
*❃ ──────⊰ ❀ ⊱────── ❃*`;

   if (imageUrl) {
       await conn.sendMessage(m.chat, {
           image: { url: imageUrl },
           caption: replyMessage
       });
   } else {
       m.reply(replyMessage);
   }
};

handler.help = ['تسجيل <الاسم> (بالرد على المستخدم)'];
handler.tags = ['rg'];
handler.command = ['تسجيل', 'register', 'reg', 'registrar'];
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;