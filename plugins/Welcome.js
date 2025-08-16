

const handler = async (m, {conn, text, isROwner, isOwner}) => {
  const datas = global
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`))
  const tradutor = _translate.plugins.gc_setwelcome

  if (text) {
    global.db.data.chats[m.chat].sWelcome = text;
    m.reply(tradutor.texto1);
  } else throw `┓═━━━──┄⊹⊱ «◈» ⊰⊹┄──━━━═┏\nمرحباً بك في نقابة اجارس\n⊰🌨️⊱\n⚜︎ يسرنا تواجدك بيننا ⚜︎\nوانضمامك معنا وبكل ما تحمله معاني الشوق\n⚜︎ نتلهف لقراءة مشاركاتك ⚜︎\n┓═━━━──┄⊹⊱ «◈» ⊰⊹┄──━━━═┏\n*✧ ♟️┋اللقب • 〘@name〙*\n*✧ 📧┋المنشن • 〘@user〙*\n*✧ 🧑🏻‍💻┋المسؤول  • 〘@admin〙*\n┓═━━━──┄⊹⊱ «◈» ⊰⊹┄──━━━═┏\n◈ ⚜︎ قروب الإعلانات 🗞️ ↯↯\n〘 https://chat.whatsapp.com/LLucZEBpwec2n6PvwcRgHD 〙\n┓═━━━──┄⊹⊱ «◈» ⊰⊹┄──━━━═┏\n*⚜︎ 📯 ┃ادارة•* ﹝𝑨𝒋𝒂𝒓𝒔﹞\n┓═━━━──┄⊹⊱ «◈» ⊰⊹┄──━━━═┏`;
};
handler.help = ['setwelcome <text>'];
handler.tags = ['group'];
handler.command = ['setwelcome'];
handler.admin = true;
export default handler;
