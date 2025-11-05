import MessageType from "@whiskeysockets/baileys";

const handler = async (m, { conn, usedPrefix, command }) => {
  const room = Object.values(conn.game).find(
    (room) => room.id.startsWith('tictactoe') &&
    [room.game.playerX, room.game.playerO].includes(m.sender)
  );

  if (!room) {
    return conn.sendMessage(
      m.chat,
      {
        text: '❌ لا يوجد أي لعبة نشطة لك حالياً!',
        buttons: [
          {
            buttonText: { displayText: 'ابدأ لعبة جديدة' },
            buttonId: `${usedPrefix}ttt غرفة`
          }
        ],
        footer: '🎮 لعبة تيك تاك تو',
        headerType: 1
      },
      { quoted: m }
    );
  }

  delete conn.game[room.id];
  await m.reply('🗑️ تم إلغاء اللعبة بنجاح.');
};

handler.command = /^(delttt|deltt|delxo|حذف-اكس)$/i;
handler.fail = null;
export default handler;