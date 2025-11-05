import { exec } from 'child_process';

let handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, '⚠️ اكتب الأمر بعد .cmd', m);

  exec(text, { shell: '/bin/bash' }, (err, stdout, stderr) => {
    if (err) {
      conn.reply(m.chat, `❌ خطأ:\n\`\`\`\n${err.message}\n\`\`\``, m);
      return;
    }

    if (stderr) {
      conn.reply(m.chat, `⚠️ Stderr:\n\`\`\`\n${stderr}\n\`\`\``, m);
    }

    if (stdout) {
      conn.reply(m.chat, `✅ Output:\n\`\`\`\n${stdout}\n\`\`\``, m);
    }
  });
};

handler.help = ['cmd'];
handler.tags = ['owner'];
handler.command = /^cmd$/i; // يعني تكتب .cmd <command>
handler.rowner = true; // مقصور على المالك فقط

export default handler;