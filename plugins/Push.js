import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import crypto from 'crypto';

let handler = async (m, { conn, text }) => {
  try {
    const GITHUB_USERNAME = 'K0reem0';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'Hayso';

    if (!GITHUB_TOKEN) {
      return conn.reply(m.chat, '⚠️ GitHub token is missing. Please set GITHUB_TOKEN in your environment variables.', m);
    }

    // دالة hash للمقارنة
    function sha1(content) {
      return crypto.createHash('sha1').update(content).digest('hex');
    }

    // دالة لفحص إذا الملف مستثنى
    function isIgnored(filePath) {
      return (
        filePath.includes('.npm/') ||
        filePath.includes('.cache/') ||
        filePath.includes('FlashBotSession/') ||
        filePath.includes('npm-debug.log') ||
        (filePath.startsWith('tmp/') && filePath !== 'tmp/') ||
        filePath.startsWith('database') ||
        filePath.startsWith('BackupSession') ||
        filePath.startsWith('.heroku') ||
        filePath.startsWith('.profile.d') ||
        filePath.startsWith('.apt')
      );
    }

    // دالة لرفع ملف واحد
    async function uploadFile(filePath, commitMessage) {
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

      if (isIgnored(relativePath)) return null; // تجاهل الملف

      const contentRaw = fs.readFileSync(filePath);
      const contentBase64 = contentRaw.toString('base64');

      const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${relativePath}`;
      let sha = null;

      // تحقق إذا الملف موجود على GitHub
      const checkRes = await fetch(url, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (checkRes.status === 200) {
        const data = await checkRes.json();
        sha = data.sha;

        // قارن المحتوى
        const remoteContent = Buffer.from(data.content, 'base64');
        if (sha1(contentRaw) === sha1(remoteContent)) {
          return null; // الملف لم يتغير
        }
      }

      // رفع / تحديث الملف
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: contentBase64,
          sha
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to upload ${relativePath}: ${err}`);
      }

      return relativePath;
    }

    // جلب جميع الملفات (مع حماية من الأخطاء)
    function getAllFiles(dir, ignore = ['node_modules', '.git']) {
      let results = [];
      let list;
      try {
        list = fs.readdirSync(dir);
      } catch {
        return results; // لو المجلد ما ينقرأ → نتجاهله
      }

      for (const file of list) {
        const filePath = path.join(dir, file);

        const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        if (ignore.some((ig) => filePath.includes(ig)) || isIgnored(relativePath)) {
          continue; // تجاهل الملفات المستثناة
        }

        let stat;
        try {
          stat = fs.statSync(filePath);
        } catch {
          continue; // لو stat فشل (symlink مكسور مثلاً) → نتجاهله
        }

        if (stat.isDirectory()) {
          results = results.concat(getAllFiles(filePath, ignore));
        } else {
          results.push(filePath);
        }
      }

      return results;
    }

    // نفذ الرفع
    const allFiles = getAllFiles(process.cwd());
    const commitMessage = text || 'Update from bot';
    let uploadedFiles = [];

    for (const file of allFiles) {
      const relativePath = await uploadFile(file, commitMessage);
      if (relativePath) uploadedFiles.push(relativePath);
    }

    if (uploadedFiles.length === 0) {
      return conn.reply(m.chat, '✅ لا توجد ملفات معدلة لرفعها.', m);
    }

    const response = `
✅ تم رفع الملفات المعدلة إلى GitHub.

### الرسالة:
\`\`\`
${commitMessage}
\`\`\`

### الملفات:
\`\`\`
${uploadedFiles.join('\n')}
\`\`\`
    `;

    conn.reply(m.chat, response, m);
  } catch (e) {
    conn.reply(m.chat, '❌ حدث خطأ أثناء الرفع: ' + e.message, m);
  }
};

handler.help = ['push']
handler.tags = ['owner']
handler.command = ['push', 'رفع']
handler.rowner = true;

export default handler;