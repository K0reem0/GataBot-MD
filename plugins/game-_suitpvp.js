const handler = (m) => m;

handler.before = async function(m) {
  this.suit = this.suit || {};

  if (db.data.users[m.sender].suit < 0) db.data.users[m.sender].suit = 0;

  const room = Object.values(this.suit).find(room => room.id && room.status && [room.p, room.p2].includes(m.sender));
  if (!room) return !0;

  let win = '';
  let tie = false;

  // القبول أو الرفض
  if (m.sender == room.p2 && /^(قبول|نعم|أقبل|رفض|لا|غير موافق)/i.test(m.text) && m.isGroup && room.status == 'wait') {
    if (/^(رفض|لا|غير موافق)/i.test(m.text)) {
      const textno = `📛 @${room.p2.split('@')[0]} رفض التحدي.`;
      m.reply(textno, null, { mentions: this.parseMention(textno) });
      delete this.suit[room.id];
      return !0;
    }

    room.status = 'play';
    room.asal = m.chat;
    clearTimeout(room.waktu);

    const textplay = `🎮 بدأ التحدي بين @${room.p.split('@')[0]} و @${room.p2.split('@')[0]}\n\n📩 سيتم إرسال رسالة خاصة لاختيار حجر أو ورقة أو مقص.`;
    m.reply(textplay, m.chat, { mentions: this.parseMention(textplay) });

    const msgP1 = `🧠 اختر:\n• حجر\n• ورقة\n• مقص\n\n🎁 الفائز يحصل على ${room.poin}XP\n❌ الخاسر يخسر ${room.poin_lose}XP`;
    const msgP2 = `🧠 اختر:\n• حجر\n• ورقة\n• مقص\n\n🎁 الفائز يحصل على ${room.poin}XP\n❌ الخاسر يخسر ${room.poin_lose}XP`;

    if (!room.pilih) this.sendMessage(room.p, { text: msgP1 }, { quoted: m });
    if (!room.pilih2) this.sendMessage(room.p2, { text: msgP2 }, { quoted: m });

    room.waktu_milih = setTimeout(() => {
      if (!room.pilih && !room.pilih2) {
        this.sendMessage(m.chat, { text: '⏱️ انتهى الوقت، لم يقم أي منكما بالاختيار. تم إلغاء اللعبة.' }, { quoted: m });
      } else if (!room.pilih || !room.pilih2) {
        win = !room.pilih ? room.p2 : room.p;
        const loser = win == room.p ? room.p2 : room.p;
        const msg = `⚠️ @${loser.split('@')[0]} لم يختر في الوقت المحدد. الفوز تلقائي لـ @${win.split('@')[0]}`;
        this.sendMessage(m.chat, { text: msg }, { quoted: m, mentions: this.parseMention(msg) });

        db.data.users[win].exp += room.poin + room.poin_bot;
        db.data.users[loser].exp -= room.poin_lose;
      }

      delete this.suit[room.id];
      return !0;
    }, room.timeout);
  }

  const jwb = m.sender == room.p;
  const jwb2 = m.sender == room.p2;
  const rock = /^(حجر)/i;
  const paper = /^(ورقة)/i;
  const scissors = /^(مقص)/i;
  const reg = /^(حجر|ورقة|مقص)/i;

  // اللاعب الأول يختار
  if (jwb && reg.test(m.text) && !room.pilih && !m.isGroup) {
    room.pilih = reg.exec(m.text.toLowerCase())[0];
    room.text = m.text;
    m.reply(`✅ اخترت ${m.text}.\n📩 عد إلى المجموعة وانتظر النتيجة.`);
    if (!room.pilih2) this.reply(room.p2, '🔔 خصمك اختار. دورك الآن!', 0);
  }

  // اللاعب الثاني يختار
  if (jwb2 && reg.test(m.text) && !room.pilih2 && !m.isGroup) {
    room.pilih2 = reg.exec(m.text.toLowerCase())[0];
    room.text2 = m.text;
    m.reply(`✅ اخترت ${m.text}.\n📩 عد إلى المجموعة وانتظر النتيجة.`);
    if (!room.pilih) this.reply(room.p, '🔔 خصمك اختار. دورك الآن!', 0);
  }

  const choice1 = room.pilih;
  const choice2 = room.pilih2;

  if (choice1 && choice2) {
    clearTimeout(room.waktu_milih);

    // تحديد الفائز
    if (rock.test(choice1) && scissors.test(choice2)) win = room.p;
    else if (rock.test(choice1) && paper.test(choice2)) win = room.p2;
    else if (scissors.test(choice1) && paper.test(choice2)) win = room.p;
    else if (scissors.test(choice1) && rock.test(choice2)) win = room.p2;
    else if (paper.test(choice1) && rock.test(choice2)) win = room.p;
    else if (paper.test(choice1) && scissors.test(choice2)) win = room.p2;
    else if (choice1 == choice2) tie = true;

    const result = `
🎯 *نتائج اللعبة:*
@${room.p.split('@')[0]} (${room.text}) ${tie ? '' : room.p == win ? `🏆 فاز +${room.poin}XP` : `❌ خسر ${room.poin_lose}XP`}
@${room.p2.split('@')[0]} (${room.text2}) ${tie ? '' : room.p2 == win ? `🏆 فاز +${room.poin}XP` : `❌ خسر ${room.poin_lose}XP`}
${tie ? '\n🤝 التعادل!' : ''}
`.trim();

    this.reply(room.asal, result, m, { mentions: [room.p, room.p2] });

    if (!tie) {
      db.data.users[win].exp += room.poin + room.poin_bot;
      const loser = win == room.p ? room.p2 : room.p;
      db.data.users[loser].exp -= room.poin_lose;
    }

    delete this.suit[room.id];
  }

  return !0;
};

handler.exp = 0;
export default handler;
