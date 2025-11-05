import { execSync } from 'child_process';

let handler = async (m, { conn, text }) => {
  try {
    // Set Git username and email for the current repository (required for commits)
    execSync('git config user.name "K0reem0"');
    execSync('git config user.email "202470349@su.edu.ye"');

    // Stage all files (no filters)
    execSync('git add -A');

    // Get the list of staged files
    const stagedFiles = execSync('git diff --cached --name-only').toString();

    if (!stagedFiles) {
      return conn.reply(m.chat, 'No files to commit.', m);
    }

    // Commit changes with a default or custom message
    const commitMessage = text || 'Update from bot';
    execSync(`git commit -m "${commitMessage}"`);

    // Get the latest commit details (commit hash and message)
    const logOutput = execSync('git log -1 --oneline').toString();
    const response = `
Successfully committed the changes locally!

### Commit Details:
\`\`\`
${logOutput.trim()}
\`\`\`

### Files Committed:
\`\`\`
${stagedFiles.trim()}
\`\`\`
    `;

    // Notify the user with the commit details
    conn.reply(m.chat, response, m);
  } catch (e) {
    // Handle errors and notify the user
    conn.reply(m.chat, 'Error committing changes: ' + e.message, m);
  }
};

handler.help = ['commit'];
handler.tags = ['owner'];
handler.command = ['commit'];
handler.rowner = true;

export default handler;
