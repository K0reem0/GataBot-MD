import fetch from 'node-fetch';

const handler = async (m, { conn, command, text, isAdmin }) => {
    if (command === 'كتم') {
        if (!isAdmin) throw "للمشرفين فقط 👑";

        const groupMetadata = await conn.groupMetadata(m.chat);
        const groupOwner = groupMetadata.owner || m.chat.split('-')[0] + '@s.whatsapp.net';

        // target لازم يكون منشن أو رد
        let target = m.mentionedJid?.[0] ?? (m.quoted ? m.quoted.sender : null);

        if (!target) {
            conn.reply(m.chat, "منشن الي تبي تسكته 👤", m);
            return;
        }

        if (target === groupOwner) throw "تخسي تكتم ولومي";
        if (target === conn.user.jid) throw "على خشمي قال يسكتني";

        if (!global.db.data.users[target]) global.db.data.users[target] = {};

        if (global.db.data.users[target].muto) throw "سكتنا البثر ذا 🔇";

        global.db.data.users[target].muto = true;

        const muteNotification = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'muta-notif' },
            message: {
                locationMessage: {
                    name: 'اخرس',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/f8324d9798fa2ed2317bc.png')).buffer(),
                },
            },
            participant: '0@s.whatsapp.net',
        };

        conn.reply(m.chat, "النشبه ذا اشغلنا اسكت 🔇", muteNotification, null, { mentions: [target] });
    }

    if (command === 'لكتم') {
        if (!isAdmin) throw "للمشرفين فقط 👑";

        let target = m.mentionedJid?.[0] ?? (m.quoted ? m.quoted.sender : null);

        if (!target) {
            conn.reply(m.chat, "منشن الشخص الي تبي تشيل الكتم عنه 👤", m);
            return;
        }

        if (target === m.sender) throw "كلم مشرف يشيل الكتم عنك";

        if (!global.db.data.users[target]) global.db.data.users[target] = { muto: false };

        if (!global.db.data.users[target].muto) {
            conn.reply(m.chat, "هذا مب مكتوم", m);
            return;
        }

        global.db.data.users[target].muto = false;

        const unmuteNotification = {
            key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'unmute-notif' },
            message: {
                locationMessage: {
                    name: 'اسف 😔',
                    jpegThumbnail: await (await fetch('https://telegra.ph/file/aea704d0b242b8c41bf15.png')).buffer(),
                },
            },
            participant: '0@s.whatsapp.net',
        };

        conn.reply(m.chat, "خلاص تعال اشتقنا لسوالفك 😔 🔊", unmuteNotification, null, { mentions: [target] });
    }
};

handler.all = async function (m) {
    const sender = m.sender || m.key.participant || m.key.remoteJid;
    if (global.db.data.users[sender]?.muto) {
        await this.sendMessage(m.chat, { delete: m.key });
    }
};

handler.command = /^(كتم|لكتم)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;
