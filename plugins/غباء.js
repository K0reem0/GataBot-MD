let handler = async (m, { conn, command, text }) => {
  if (!text) throw '⚠️ منشن شخص بعد الأمر!'

  // نجيب أعضاء القروب
  let participants = m.isGroup ? (await conn.groupMetadata(m.chat)).participants : []
  
  // نبحث عن العضو بالـ lid (يعني الرقم أو المنشن اللي كتب بعد الأمر)
  let target = participants.find(p => text.includes(p.id.split('@')[0]))
  if (!target) throw '❌ العضو غير موجود في القروب!'

  let stupidity = `*🤡 نسبة غباء 🤡*
*نسبة اغباء @${target.id.split('@')[0]} 🤡 هي* *${Math.floor(Math.random() * 100)}%* *من 100%*
*ربنا يشفيك😂❤*`

  await conn.sendMessage(m.chat, { text: stupidity, mentions: [target.id] }, { quoted: m })
}

handler.help = ['stupidity']
handler.tags = ['fun']
handler.command = /^(غباء)$/i

export default handler