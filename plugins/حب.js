let handler = async (m, { conn, text }) => {
  if (!text && !(m.mentionedJid && m.mentionedJid.length) && !m.quoted) {
    return conn.reply(m.chat, '⚠️ منشن شخص، أو اكتب رقمه، أو رد على رسالته!', m)
  }

  let target

  // إذا فيه منشن مباشر
  if (m.mentionedJid && m.mentionedJid.length) {
    target = m.mentionedJid[0]
  }
  // إذا رد على رسالة شخص
  else if (m.quoted) {
    target = m.quoted.sender
  }
  // إذا كتب نص (رقم أو اسم)
  else if (text) {
    let participants = m.isGroup ? (await conn.groupMetadata(m.chat)).participants : []
    let found = participants.find(p => text.includes(p.id.split('@')[0]))
    if (found) target = found.id
  }

  // افتراضي: إذا ما لقى أحد → المرسل نفسه
  if (!target) target = m.sender

  let display = '@' + target.split('@')[0]
  let love = `*✨💜 نسبة الحب 💜✨*
*نسبة حب ${display} ليك ✨💜* *${Math.floor(Math.random() * 100)}%* *من 100%*
*اطلب منها أن تكون صديقه لك ؟*`

  await conn.sendMessage(m.chat, { text: love, mentions: [target] }, { quoted: m })
}

handler.help = ['love']
handler.tags = ['fun']
handler.command = /^(حب)$/i

export default handler