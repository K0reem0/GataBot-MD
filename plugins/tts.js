import * as googleTTS from '@sefinek/google-tts-api'
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const defaultLang = 'ar';

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let lang = args[0];
  let text = args.slice(1).join(' ');

  if ((args[0] || '').length !== 2) {
    lang = defaultLang;
    text = args.join(' ');
  }

  if (!text && m.quoted?.text) text = m.quoted.text;

  let res;
  try {
    res = googleTTS.getAudioUrl(text, { lang: lang || defaultLang, slow: false, host: 'https://translate.google.com' });
  } catch (e) {
    m.reply('🚫 صار خطأ: ' + e);
    text = args.join(' ');
    if (!text) throw `✳️ الاستخدام: ${usedPrefix + command} <اللغة> <النص>`;
    res = await tts(text, defaultLang);
  } finally {
    if (res) {
      conn.sendPresenceUpdate('recording', m.chat);
      conn.sendMessage(
        m.chat,
        { audio: { url: res }, fileName: 'tts.mp3', mimetype: 'audio/mpeg', ptt: true },
        { quoted: m }
      );
    }
  }
};

handler.help = ['tts'];
handler.tags = ['converter'];
handler.command = ['قول'];

export default handler;

function tts(text, lang = 'ar') {
  return new Promise((resolve, reject) => {
    try {
      const tts = gtts(lang);
      const filePath = join(global.__dirname(import.meta.url), '../tmp', (1 * new Date) + '.wav');
      tts.save(filePath, text, () => {
        resolve(readFileSync(filePath));
        unlinkSync(filePath);
      });
    } catch (e) {
      reject(e);
    }
  });
}
