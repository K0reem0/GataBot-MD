/* كود من تطوير @Fabri115 وتحسين BrunoSobrino */
import { existsSync, promises as fs } from 'fs'
import path from 'path'

const handler = async (m, {conn, usedPrefix}) => {
    // التأكد أن المستخدم يستخدم الحساب الرئيسي للبوت
    if (global.conn.user.jid !== conn.user.jid) {
        return conn.sendMessage(
            m.chat,
            {text: `⚠️ هذا الأمر يجب استخدامه مباشرة على الحساب الرئيسي للبوت.`},
            {quoted: m}
        )
    }

    const sessionPath = './GataBotSession/'
    try {
        // التحقق من وجود مجلد الجلسة
        if (!existsSync(sessionPath)) {
            return await conn.sendMessage(
                m.chat,
                {text: `⚠️ مجلد الجلسة (GataBotSession) غير موجود أو فارغ.`},
                {quoted: m}
            )
        }

        const files = await fs.readdir(sessionPath)
        let filesDeleted = 0

        // حذف كل الملفات ما عدا creds.json
        for (const file of files) {
            if (file !== 'creds.json') {
                await fs.unlink(path.join(sessionPath, file))
                filesDeleted++
            }
        }

        // إرسال رسالة حسب نتيجة الحذف
        if (filesDeleted === 0) {
            await conn.sendMessage(
                m.chat,
                {text: `⚠️ لم يتم العثور على أي ملف لحذفه في مجلد الجلسة (GataBotSession).`},
                {quoted: m}
            )
        } else {
            await conn.sendMessage(
                m.chat,
                {text: `✅ تم حذف ${filesDeleted} من ملفات الجلسة بنجاح، مع استثناء ملف (creds.json).`},
                {quoted: m}
            )
        }

    } catch (err) {
        console.error('❌ خطأ عند قراءة مجلد الجلسة أو حذف الملفات:', err)
        await conn.sendMessage(
            m.chat,
            {text: `❌ حدث خطأ أثناء حذف ملفات الجلسة.`},
            {quoted: m}
        )
    }

    // رسالة نهائية لتأكيد عمل البوت
    await conn.sendMessage(
        m.chat,
        {
            text: `🐈 البوت يعمل الآن بشكل سليم.\nإذا لم يستجب البوت، يرجى تجربة الأمر عدة مرات:\n\n*مثال:* \n${usedPrefix}اصلاح\n${usedPrefix}اصلاح\n${usedPrefix}اصلاح`
        },
        {quoted: m}
    )
}

handler.help = ['اصلاح']
handler.tags = ['owner']
handler.command = /^اصلاح$/i
handler.owner = true

export default handler
