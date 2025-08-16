const xppercredit = 1
let handler = async (m, { conn, command, args }) => {
    let user = global.db.data.users[m.sender]
    let count
    let withdrawAll = false

    if (args.length === 0) {
        // إذا ما كتب مبلغ، يسحب الكل
        count = Math.floor(user.bank / xppercredit)
        withdrawAll = true
    } else {
        count = parseInt(args[0])
    }

    // التأكد أن count رقم صالح
    if (isNaN(count) || count <= 0) count = 0

    if (user.bank >= xppercredit * count && count > 0) {
        user.bank -= xppercredit * count
        user.credit += count

        if (withdrawAll) {
            conn.reply(
                m.chat,
                `🏦💸 تم سحب *كل الرصيد* من حسابك البنكي\n(*${count}* بيلي 🪙) وإيداعه في محفظتك.\n\n_💡 ملاحظة: لسحب مبلغ محدد، اكتب المبلغ بعد الأمر_\nمثال: \`.سحب 50\``,
                m
            )
        } else {
            conn.reply(m.chat, `*تم سحب 🪙 ${count} إلى محفظتك*`, m)
        }
    } else {
        conn.reply(m.chat, `🟥 *ليس لديك رصيد كافي في البنك لإجراء هذه المعاملة*`, m)
    }
}

handler.help = ['withdraw']
handler.tags = ['economy']
handler.command = ['سحب']

handler.disabled = false

export default handler
