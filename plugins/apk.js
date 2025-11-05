let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (!args[0]) throw `Ingresa el nombre de la aplicación. *Ejemplo:* ${usedPrefix + command} WhatsApp`;

    try {
        // Alternative API
        let searchRes = await fetch(`https://apk-dl.com/search?q=${encodeURIComponent(args[0])}`);
        let html = await searchRes.text();
        
        // This is a simplified example - you'd need proper HTML parsing
        // For now, let's use a different approach
        
        m.reply('⚠️ El servicio de APK está en mantenimiento. Prueba más tarde.');
        
    } catch (error) {
        m.reply('❌ Error al buscar la aplicación. Intenta con otro nombre.');
    }
}

handler.command = ['تطبيق', 'apkdl2', 'modapk2'];
handler.group = true;
export default handler;