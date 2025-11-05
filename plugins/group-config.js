import fs from 'fs'

const handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0]) {
    return m.reply(`*❃ ────────⊰ ❀ ⊱──────── ❃*\n\n*⚠️ استعمل الأمر بالطريقة الصحيحة:*\n\n*${usedPrefix + command} فتح*\n*${usedPrefix + command} قفل*\n\n*❃ ────────⊰ ❀ ⊱──────── ❃*`)
  }

  let action = args[0].toLowerCase()
  let groupMetadata = await conn.groupMetadata(m.chat)

  if (action === 'فتح') {
    if (groupMetadata.announce === false) {
      return m.reply('*⚠️ الجروب هذا مفتوح بالفعل.*')
    }
    await conn.groupSettingUpdate(m.chat, 'not_announcement')
    return m.reply('*✅ تم فتح الجروب.*')
  } else if (action === 'قفل') {
    if (groupMetadata.announce === true) {
      return m.reply('*⚠️ الجروب هذا مقفول بالفعل.*')
    }
    await conn.groupSettingUpdate(m.chat, 'announcement')
    return m.reply('*✅ تم قفل الجروب.*')
  } else {
    return m.reply(`*❃ ────────⊰ ❀ ⊱──────── ❃*\n\n*⚠️ خيار غير صحيح.*\n\n*${usedPrefix + command} فتح*\n*${usedPrefix + command} قفل*\n\n*❃ ────────⊰ ❀ ⊱──────── ❃*`)
  }
}

handler.help = ['جروب فتح', 'جروب قفل']
handler.tags = ['group']
handler.command = /^جروب$/i
handler.admin = true
handler.botAdmin = true

export default handler