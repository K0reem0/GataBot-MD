let handler = async (m, { conn, command, text, usedPrefix }) => {
if (!text) throw `*[❗ركـز❗] اعمل منشن لي الشخص عشان الامر يشتغل*`
if (command == 'ورع') {
conn.reply(m.chat, `
_*${text.toUpperCase()}* *نسبة ورعنته* *${(500).getRandom()}%* *الله يشفيك و تكبر كذا و تكون عاقل*_
`.trim(), m, m.mentionedJid ? {
mentions: m.mentionedJid
} : {})}
if (command == 'اهبل') {
conn.reply(m.chat, `
_*${text.toUpperCase()}* *نسبة هبله* *${(500).getRandom()}%* *اخخ بس متا ناوي تعقل يا* *${command.replace('how', '').toUpperCase()}*_
`.trim(), m, m.mentionedJid ? {
mentions: m.mentionedJid
} : {})} 
if (command == 'خروف') {
conn.reply(m.chat, `
_*${text.toUpperCase()}* *نسبة خرفنته* *${(500).getRandom()}%* *ياخوي اعقل شوية يعني يا* *${command.replace('how', '').toUpperCase()}*_
`.trim(), m, m.mentionedJid ? {
mentions: m.mentionedJid
} : {})}   
if (command == 'جميل') {
conn.reply(m.chat, `
_*${text.toUpperCase()}* *نسبة جماله* *${(500).getRandom()}%* *يا زينك بس فديت الـ* *${command.replace('how', '').toUpperCase()}*_
`.trim(), m, m.mentionedJid ? {
mentions: m.mentionedJid
} : {})}     
}
handler.help = ['ورع', 'اهبل', 'خروف', 'جميل', 'puto', 'puta', 'manco', 'manca', 'rata', 'prostituta', 'prostituto'].map(v => v + ' @tag | nombre')
handler.tags = ['calculator']
handler.command = /^ورع|اهبل|خروف|جميل/i
export default handler
