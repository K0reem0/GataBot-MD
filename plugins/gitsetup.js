import { exec } from 'child_process';

let handler = async (m, { conn }) => {
  const GITHUB_USERNAME = 'K0reem0';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = 'Hayso';

  if (!GITHUB_TOKEN) {
    return conn.reply(
      m.chat,
      '⚠️ GitHub token مفقود. أضفه في متغير البيئة GITHUB_TOKEN.',
      m
    );
  }

  const commands = [
    'git init',
    'git branch -M main',
    `git remote add origin https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git`
  ];

  let output = '';

  for (let cmd of commands) {
    try {
      const result = await new Promise((resolve, reject) => {
        exec(cmd, { shell: '/bin/bash' }, (err, stdout, stderr) => {
          if (err) return reject(err);
          resolve(stdout || stderr || '✅ تم التنفيذ');
        });
      });
      output += `\n$ ${cmd}\n${result}\n`;
    } catch (e) {
      output += `\n$ ${cmd}\n❌ خطأ:\n${e.message}\n`;
      break; // لو فيه خطأ يوقف
    }
  }

  conn.reply(m.chat, `🚀 نتائج التنفيذ:\n\`\`\`${output}\`\`\``, m);
};

handler.help = ['gitsetup'];
handler.tags = ['owner'];
handler.command = ['تهيئة']; // تكتب: .gitsetup
handler.rowner = true;

export default handler;
