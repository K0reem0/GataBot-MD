// دالة مساعدة عشان تجيب الـ jid المستهدف
async function getTargetJid(m, conn, text) {
  if (m.mentionedJid && m.mentionedJid.length) {
    return m.mentionedJid[0]
  } else if (m.quoted) {
    return m.quoted.sender
  } else if (text) {
    let participants = m.isGroup ? (await conn.groupMetadata(m.chat)).participants : []
    let found = participants.find(p => text.includes(p.id.split('@')[0]))
    if (found) return found.id
  }
  return null
}

let handler = async (m, { conn, command, text }) => {
  let target = await getTargetJid(m, conn, text)
  if (!target) throw `*[❗ركـز❗] اعمل منشن، رد على رسالة أو اكتب رقم عشان الامر يشتغل*`

  let display = '@' + target.split('@')[0]
  let percent = Math.floor(Math.random() * 500) // نسبة من 0 إلى 500%

  let replyText = ''
  if (command == 'ورع') {
    replyText = `_*${display}* *نسبة ورعنته* *${percent}%* *الله يشفيك و تكبر كذا و تكون عاقل*_`
  }
  if (command == 'اهبل') {
    replyText = `_*${display}* *نسبة هبله* *${percent}%* *اخخ بس متى ناوي تعقل يا ${command.toUpperCase()}*_`
  }
  if (command == 'خروف') {
    replyText = `_*${display}* *نسبة خرفنته* *${percent}%* *ياخوي اعقل شوية يعني يا ${command.toUpperCase()}*_`
  }
  if (command == 'جميل') {
    replyText = `_*${display}* *نسبة جماله* *${percent}%* *يا زينك بس فديت الـ ${command.toUpperCase()}*_`
  }

  await conn.sendMessage(m.chat, { text: replyText, mentions: [target] }, { quoted: m })
}

handler.help = ['ورع', 'اهبل', 'خروف', 'جميل'].map(v => v + ' @tag | رقم | رد')
handler.tags = ['fun']
handler.command = /^(ورع|اهبل|خروف|جميل)$/i

export default handler