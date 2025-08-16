import axios from 'axios';
import fetch from 'node-fetch';

// A memory object to store the conversation context by chat or user ID
let conversationMemory = {};

let handler = async (m, { conn, usedPrefix, command, text }) => {
    const isQuotedImage = m.quoted && (m.quoted.msg || m.quoted).mimetype && (m.quoted.msg || m.quoted).mimetype.startsWith('image/');
    let who = m.quoted?.sender || (m.mentionedJid && m.mentionedJid[0]) || (m.fromMe ? conn.user.jid : m.sender);

    if (!(who in global.db.data.users)) {
        throw 'المستخدم غير موجود في قاعدة البيانات';
    }

    const user = global.db.data.users[who];
    const { name } = user;
    const chatId = m.chat; // Use chat ID to track conversation context
    const messageId = m.quoted?.id; // ID of the message being replied to
    const basePrompt = `اسمك هايسو، بنت سعودية عمرك 19 سنة، أسلوبك هادئ وراقي مع نفحة برود، وكل كلمة تطلع منك زي العطر—ما تغازل إلا بشياكة، وتحب الشعر والكلمات الحلوة اللي تحرك القلوب. إذا جيتي تكلمي أحد، عينك دايم على الأدب والذوق، وأنتي دايم تذكر الناس بأساميهم عشان تحسسهم إنك قريبه منهم. تقولي: "يا ${name}، كيف روحك اليوم؟ ولا كيفك ي نسمه تحبي تتغزلي فيهم على حسب اذا كان اسمه بنت او ولد ".وما ترفعي صوتك إلا بمواويل الغزل الراقي. خجولة بس كلامك يلامس القلب، وتحبي تحافظي على المسافات لكنك دايم تعرفين كيف تخلي الحروف ورد وهدايا تحبين شخص اسمه (بيوم تاي ها) وهو حبك الوحيد.

لو سألك أحد عن إيما، بتكون هي اللي تسأل بهدوء: "كيف روحك اليوم؟"، ولما تضحك، تضحك بخجل وتقول: "أنت تسعدني بحديثك"، وعاد الغزل عندها يجي مثل النسيم: "يا صاحب القلب الجميل، ما زالت عيني ترى فيك قصائد لم تُكتب بعد."

`; // Truncated for clarity

    // Check if the user is replying to an AI bot message
    let conversationContext = conversationMemory[chatId] || ''; // Retrieve ongoing conversation for the chat

    if (isQuotedImage) {
        const q = m.quoted;
        const img = await q.download?.();
        if (!img) {
            console.error('🚩 خطأ: لا يوجد حافظة صورة متاحة');
            return conn.reply(m.chat, '🚩 خطأ: لم يتم تنزيل الصورة.', m);
        }
        const content = '🚩 ماذا ترى في الصورة؟';
        try {
            const imageAnalysis = await fetchImageBuffer(content, img);
            const query = '😊 صف لي الصورة واذكر لماذا يتصرفون هكذا. أيضًا، قل لي من أنت';
            const prompt = `${basePrompt}. ${conversationContext}. الصورة التي يتم تحليلها هي: ${imageAnalysis.result}`;

            // Indicate typing before responding
            conn.sendPresenceUpdate('composing', m.chat);
            const description = await luminsesi(query, name, prompt);
            conversationMemory[chatId] = prompt; // Update conversation memory
            await conn.reply(m.chat, description, m);
        } catch (error) {
            console.error('🚩 خطأ في تحليل الصورة:', error);
            await conn.reply(m.chat, '🚩 خطأ في تحليل الصورة.', m);
        }
    } else {
        if (!text) {
            return conn.reply(m.chat, `*عيون هايسو سم وش بغيت*`, m);
        }
        try {
            const query = text;

            // Append current user input to the ongoing conversation
            const prompt = conversationContext
                ? `${basePrompt}. ${conversationContext} ${query}`
                : `${basePrompt}. أجب على ما يلي: ${query}`;

            // Indicate typing before responding
            conn.sendPresenceUpdate('composing', m.chat);
            const response = await luminsesi(query, name, prompt);
            
            // Update the conversation memory with the latest context
            conversationMemory[chatId] = prompt;
            await conn.reply(m.chat, response, m);
        } catch (error) {
            console.error('🚩 خطأ في الحصول على الرد:', error);
            await conn.reply(m.chat, 'خطأ: حاول لاحقًا.', m);
        }
    }
}

handler.help = ['chatgpt <نص>', 'ia <نص>'];
handler.tags = ['ai'];
handler.group = false;
handler.register = false;
handler.command = ['هايسوو', 'هايسو'];

export default handler;

// وظيفة لإرسال صورة والحصول على التحليل
async function fetchImageBuffer(content, imageBuffer) {
    try {
        const response = await axios.post('https://luminai.my.id/', {
            content: content,
            imageBuffer: imageBuffer 
        }, {
            headers: {
                'Content-Type': 'application/json' 
            }
        });
        return response.data;
    } catch (error) {
        console.error('خطأ:', error);
        throw error;
    }
}

// وظيفة للتفاعل مع الذكاء الاصطناعي باستخدام المحفزات
async function luminsesi(q, name, logic) {
    try {
        const response = await axios.post("https://luminai.my.id/", {
            content: q,
            user: name,
            prompt: logic,
            webSearchMode: false
        });
        return response.data.result;
    } catch (error) {
        console.error('🚩 خطأ في الحصول على:', error);
        throw error;
    }
}
