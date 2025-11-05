import fs from 'fs'
import TicTacToe from '../lib/tictactoe.js';

const handler = async (m, {conn, usedPrefix, command, text}) => {
  conn.game = conn.game ? conn.game : {};
  if (Object.values(conn.game).find((room) => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender))) {
    throw '🛑 أنت بالفعل داخل لعبة تيك تاك تو!';
  }

  if (!text) {
    throw `❗ يرجى كتابة اسم الغرفة.\n◉ الاستخدام: ${usedPrefix + command} اسم_الغرفة`;
  }

  let room = Object.values(conn.game).find((room) => room.state === 'WAITING' && room.name === text);
  if (room) {
    await m.reply('🔁 تم العثور على غرفة، جاري الانضمام...');
    room.o = m.chat;
    room.game.playerO = m.sender;
    room.state = 'تشغيل';
    const arr = room.game.render().map((v) => {
      return {
        X: '❎',
        O: '⭕',
        1: '1️⃣',
        2: '2️⃣',
        3: '3️⃣',
        4: '4️⃣',
        5: '5️⃣',
        6: '6️⃣',
        7: '7️⃣',
        8: '8️⃣',
        9: '9️⃣',
      }[v];
    });

    const str = `
🎮 لعبة تيك تاك تو 🎮

❎ = @${room.game.playerX.split('@')[0]}
⭕ = @${room.game.playerO.split('@')[0]}

        ${arr.slice(0, 3).join('')}
        ${arr.slice(3, 6).join('')}
        ${arr.slice(6).join('')}

الدور الآن: @${room.game.currentTurn.split('@')[0]}
`.trim();

    if (room.x !== room.o) await conn.sendMessage(room.x, {text: str, mentions: conn.parseMention(str)}, {quoted: m});
    await conn.sendMessage(room.o, {text: str, mentions: conn.parseMention(str)}, {quoted: m});
  } else {
    room = {
      id: 'tictactoe-' + (+new Date),
      x: m.chat,
      o: '',
      game: new TicTacToe(m.sender, 'o'),
      state: 'WAITING',
    };
    if (text) room.name = text;

    conn.reply(m.chat, `✅ تم إنشاء غرفة باسم: ${text}\n🔄 انتظر انضمام لاعب آخر...\n🗑️ لإلغاء اللعبة استخدم: ${usedPrefix}حذف-اكس`, m);

    // يمكنك تفعيل الزر إذا أردت واجهة أجمل
    // const imgplay = `https://cope-cdnmed.agilecontent.com/resources/jpg/8/9/1590140413198.jpg`;
    // conn.sendButton(m.chat, `🎮 لعبة تيك تاك تو 🎮\n\n🕹️ في انتظار اللاعب الثاني للانضمام.\n\n🗑️ لإلغاء اللعبة: ${usedPrefix}delttt`, wm, imgplay, [['انضمام', `${usedPrefix + command} ${text}`]], m, { mentions: conn.parseMention(text) });

    conn.game[room.id] = room;
  }
};

handler.command = /^(tictactoe|اكس|ttt|xo)$/i;
export default handler;