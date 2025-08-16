let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender];
    let name = await conn.getName(m.sender);
    let taguser = '@' + m.sender.split("@")[0];

    // مجموعة الصور
    let images = [
        'https://files.catbox.moe/4cecne.jpg',
        'https://files.catbox.moe/y6ebvk.jpg',
        'https://files.catbox.moe/4s7b5a.jpg',
        'https://files.catbox.moe/7kq8bv.jpg',
        'https://files.catbox.moe/hx6jsh.jpg'
        // تقدر تضيف روابط أكثر هنا
    ];

    // مجموعة الردود (أسلوب غزلي لطيف من "أليا تشان")
    let messages = [
        `أنا هنا لأجلك، لا تتردد تطلب أي شي 🩷 - أليا تشان`,
        `عيونك حلوة، بس أوامرك أحلى 🌸`,
        `وش تبيني أسوي؟ أنا بالخدمة يا روحي 💕`,
        `همسة ناعمة: لا أحد يطلبني إلا أنت 🌷`,
        `أوامرك يعيوني 💖 - هايسو في خدمتك`,
        `هل ترغب بمساعدة أو بقلبي؟ 🤍`
        // تقدر تضيف ردود أكثر بأسلوبك الخاص
    ];

    // اختيار عشوائي
    let image = images[Math.floor(Math.random() * images.length)];
    let message = messages[Math.floor(Math.random() * messages.length)];

    conn.sendFile(m.chat, image, 'image.jpg', message, m);
};

// كلمات التفعيل
handler.customPrefix = /^(bot|بوت|بووت|هايسو)$/i;
handler.command = new RegExp;

export default handler;
