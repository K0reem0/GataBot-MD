const xpperbank = 1
let handler = async (m, { conn, command, args }) => {
    let user = global.db.data.users[m.sender]
    let count
    let depositAll = false

    if (args.length === 0) {
        // إذا ما كتب مبلغ، يودع الكل
        count = Math.floor(user.credit / xpperbank)
        depositAll = true
    } else {
        count = parseInt(args[0])
    }

    // التأكد أن count رقم صالح
    if (isNaN(count) || count <= 0) count = 0

    if (user.credit >= xpperbank * count && count > 0) {
        user.credit -= xpperbank * count
        user.bank += count

        if (depositAll) {
            conn.reply(
                m.chat,
                `💰✨ تم إيداع *كل الرصيد* الذي كان في محفظتك (*${count}* بيلي 🪙) إلى حسابك البنكي.\n\n_💡 ملاحظة: لإيداع مبلغ محدد، اكتب المبلغ بعد الأمر_\nمثال: \`.ايداع 50\``,
                m
            )
        } else {
            conn.reply(m.chat, `*تم إيداع* 🪙 ${count} *إلى حسابك*`, m)
        }
    } else {
        conn.reply(m.chat, `🟥 *رصيدك غير كافي*`, m)
    }
}

handler.help = ['deposit']
handler.tags = ['economy']
handler.command = ['إيداع', 'ايداع', 'وديعه']

handler.disabled = false

export default handler
