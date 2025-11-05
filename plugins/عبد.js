import fs from 'fs';

let handler = async (m, { conn }) => {
    let audioPath = './src/Note.mp3'; 

    await conn.sendPresenceUpdate('recording', m.chat);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await conn.sendMessage(m.chat, {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/mpeg', // مطابق لـ mp3
        ptt: true
    }, { quoted: m });
};

handler.customPrefix = /^(عبد)$/i;
handler.command = new RegExp;

export default handler;