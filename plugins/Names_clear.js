let handler = async (m, { conn, participants }) => {
  // Specify the target group ID
  const targetGroupId = '120363041026065606@g.us';

  // Ensure the command is executed only in the specified group
  if (m.chat !== targetGroupId) {
    return conn.sendMessage(m.chat, { text: "⚠️ هذا الأمر يعمل فقط في المجموعة المحددة." });
  }

  // Retrieve all user IDs from the group participants
  let groupUserIds = participants.map(p => p.id);

  // Get all user data from the database
  let allUsers = Object.keys(global.db.data.users);

  // Track removed users for a summary
  let removedUsers = [];

  // Loop through all users in the database
  for (let userId of allUsers) {
    // If the user is not in the group, remove them from the database
    if (!groupUserIds.includes(userId)) {
      let user = global.db.data.users[userId];
      let userName = user?.name || "مستخدم مجهول"; // Fallback to "unknown user" if no name exists
      removedUsers.push({ id: userId, name: userName });
      delete global.db.data.users[userId];
    }
  }

  // Generate the result message
  let teks = "*❃ ──────⊰ ❀ ⊱────── ❃*\n\n";
  if (removedUsers.length > 0) {
    teks += `*⚠️ تمت إزالة المستخدمين التاليين من قاعدة البيانات لأنهم غير موجودين في المجموعة:*\n\n`;
    for (let user of removedUsers) {
      teks += `◍ ${user.name} (@${user.id.split('@')[0]})\n`;
    }
  } else {
    teks += "✅ جميع المستخدمين في قاعدة البيانات موجودون في المجموعة.\n";
  }
  teks += "\n*❃ ──────⊰ ❀ ⊱────── ❃*";

  // Send a message to the group with the result
  conn.sendMessage(m.chat, { text: teks, mentions: removedUsers.map(u => u.id) });
};

// Command properties
handler.help = ['تنظيف-المستخدمين'];
handler.tags = ['group'];
handler.command = /^(تنظيف)$/i;
handler.group = true;
handler.admin = true;

// Export the handler function
export default handler;
