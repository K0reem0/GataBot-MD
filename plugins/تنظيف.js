/* كود لحذف ملفات tmp مؤقتة */
import { tmpdir } from 'os'
import path, { join } from 'path'
import { readdirSync, statSync, unlinkSync } from 'fs'

let handler = async (m, {conn, __dirname}) => {
    // رسالة إعلامية للمستخدم
    conn.reply(m.chat, `⚡ تم حذف جميع الملفات المؤقتة من مجلد tmp.\n\n📂 الملفات المؤقتة في المجلد تم تنظيفها بنجاح.`, m)

    // المجلدات المؤقتة
    const tmp = [tmpdir(), join(__dirname, '../tmp')]
    const filename = []

    // قراءة كل الملفات في المجلدات المؤقتة
    tmp.forEach((dirname) => readdirSync(dirname).forEach((file) => filename.push(join(dirname, file))))

    // حذف كل الملفات
    return filename.map((file) => {
        const stats = statSync(file)
        unlinkSync(file)
    })
}

// التحذير: لا تستخدم هذا الأمر على هيروكو لأنها قد تسبب مشاكل
handler.help = ['تنظيف']
handler.tags = ['owner']
handler.command = /^(تنظيف)$/i
handler.exp = 500
handler.owner = true

export default handler
