import { createHash } from 'crypto';
import uploadImage from '../src/libraries/uploadImage.js'; // Ensure this is the correct path

let handler = async (m, { conn, text, args, groupMetadata, usedPrefix, command }) => {
    let who = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;

    // Ensure the user exists in the database
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            registered: false,
            name: null,
            regTime: null,
            image: null, // New field for storing image link
        };
    }

    let user = global.db.data.users[who];

    if (user.registered === true) throw `*لقد تم تسجيله بالفعل*`;

    let name = '';

    if (m.mentionedJid && m.mentionedJid.length > 0 && text.trim().split(' ').length > 1) {
        name = text.trim().split(' ').slice(1).join(' ');
    } else {
        let Reg = /^\s*([^]*)\s*$/;
        if (!Reg.test(text)) throw `*المثال الصحيح: ${usedPrefix}تسجيل اسمك*`;

        let [_, enteredName] = text.match(Reg);
        if (!enteredName) throw '*أكتب الاسم*';
        if (enteredName.length >= 30) throw '*الاسم طويل*';

        name = enteredName.trim();
    }

    const isNameTaken = Object.values(global.db.data.users).some(existingUser => {
        if (typeof existingUser.name === 'string') {
            return existingUser.name.toLowerCase() === name.toLowerCase();
        }
        return false;
    });

    if (isNameTaken) {
        throw '*الاسم مستخدم بالفعل*';
    }

    let imageUrl = null;
    if (m.quoted && /image\/(png|jpe?g)/.test(m.quoted.mimetype)) {
        try {
            const media = await m.quoted.download(); // Download the image
            imageUrl = await uploadImage(media); // Upload the image and get the link
        } catch (e) {
            console.error(e);
            throw '*حدث خطأ أثناء تحميل الصورة. حاول مرة أخرى.*';
        }
    }

    user.name = name;
    user.regTime = +new Date();
    user.registered = true;
    user.image = imageUrl; // Save the image link (or null if no image)

    let sn = createHash('md5').update(who).digest('hex').slice(0, 21);

    const replyMessage = `*❃ ──────⊰ ❀ ⊱────── ❃*
◍ *تم تسجيلك في قاعدة البيانات*
*❃ ──────⊰ ❀ ⊱────── ❃*
◍ *الاسم:* *${name}*
◍ *الايدي:* *${sn}*
*❃ ──────⊰ ❀ ⊱────── ❃*`;

    if (imageUrl) {
        // Send reply with the image
        await conn.sendMessage(m.chat, { 
            image: { url: imageUrl }, 
            caption: replyMessage 
        });
    } else {
        // Send reply without an image
        m.reply(replyMessage);
    }
};

// ... rest of the code remains unchanged

handler.help = ['reg'].map(v => v + ' <الاسم>');
handler.tags = ['rg'];
handler.command = ['تسجيل', 'اشتراك', 'register', 'registrar']; 
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;
