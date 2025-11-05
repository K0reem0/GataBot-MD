const handler = async (m, { conn }) => {
  if (!m.quoted) throw '⚠️ رد على الرسالة الي تبي تحذفها.';

  try {
    const delet = m.message.extendedTextMessage.contextInfo.participant;
    const bang = m.message.extendedTextMessage.contextInfo.stanzaId;
    return conn.sendMessage(m.chat, {
      delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }
    });
  } catch {
    return conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
  }
};

handler.help = ['del', 'delete'];
handler.tags = ['group'];
handler.command = /^حذف$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;

export default handler;