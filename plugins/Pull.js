import { execSync } from 'child_process';

let handler = async (m, { conn }) => {
  try {
    const GITHUB_USERNAME = 'K0reem0';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'Hayso';

    if (!GITHUB_TOKEN) {
      return conn.reply(
        m.chat,
        '⚠️ GitHub token is missing. Please set GITHUB_TOKEN in your environment variables.',
        m
      );
    }

    // Detect the default branch dynamically
    const defaultBranch = execSync(
      'git symbolic-ref refs/remotes/origin/HEAD | sed "s@^refs/remotes/origin/@@g"'
    ).toString().trim();

    // Configure Git username and email for commits
    execSync('git config --local user.name "K0reem0"');
    execSync('git config --local user.email "202470349@su.edu.ye"');

    // استثناء ملفات/مجلدات معينة من التحديث
    const ignoredFiles = [
      '.gitignore',
      'FlashBotSession',
      '.github'
    ];
    ignoredFiles.forEach(file => {
      try {
        execSync(`git update-index --skip-worktree ${file}`);
      } catch (e) {
        // تجاهل لو الملف غير موجود
      }
    });

    // Fetch latest updates without merging
    const remoteUrl = `https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git`;
    execSync(`git fetch ${remoteUrl} ${defaultBranch}`);

    // Check if local is behind remote
    const localCommit = execSync(`git rev-parse ${defaultBranch}`).toString().trim();
    const remoteCommit = execSync(`git rev-parse FETCH_HEAD`).toString().trim();

    if (localCommit === remoteCommit) {
      // لا توجد تغييرات
      return conn.reply(m.chat, '✅ المشروع محدث، لا توجد تغييرات جديدة.', m);
    }

    // Pull the latest changes if there are updates
    execSync(`git pull ${remoteUrl} ${defaultBranch}`);

    // Respond with commit history
    const logOutput = execSync('git log --oneline -n 5');
    conn.reply(
      m.chat,
      `⬇️ تم جلب التحديثات بنجاح!\n\nآخر الكوميتات:\n\`\`\`\n${logOutput.toString()}\n\`\`\``,
      m
    );

  } catch (e) {
    conn.reply(
      m.chat,
      `❌ Error pulling updates from GitHub:\n${e.message}`,
      m
    );
  }
};

handler.help = ['pull'];
handler.tags = ['owner'];
handler.command = ['pull', 'تحديث'];
handler.rowner = true;

export default handler;
