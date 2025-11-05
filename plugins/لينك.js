/* Credits: https://github.com/ALBERTO9883 */
import fs from 'fs'

const handler = async (m, { conn, command }) => {
  if (!m.isGroup) throw '⚠️ هذا الأمر يعمل فقط في المجموعات.'

  switch (command) {
    case 'لينك': {
      let link = await conn.groupInviteCode(m.chat)
      await conn.reply(m.chat, `🔗 رابط المجموعة:\nhttps://chat.whatsapp.com/${link}`, m)
      break
    }
    case 'رست-لينك': {
      await conn.groupRevokeInvite(m.chat)
      await m.reply('✅ تم إعادة تعيين رابط المجموعة بنجاح.')
      break
    }
  }
}

handler.help = ['لينك', 'رست-لينك']
handler.tags = ['group']
handler.command = ['لينك', 'رست-لينك']
handler.botAdmin = true
handler.admin = true
handler.group = true

export default handler