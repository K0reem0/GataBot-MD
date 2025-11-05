import fetch from 'node-fetch';

let timeout = 60000; // Timeout duration in milliseconds
let games = {}; // Global game state storage

let handler = async (m, { conn }) => {
    let id = m.chat;

    // Check if a game is already running in this chat
    if (id in games) {
        conn.reply(m.chat, '*صبر ما تشوف فيه سؤال ؟*', games[id].msg);
        return;
    }

    // Fetch data from the external JSON source
    let src = await (await fetch('https://raw.githubusercontent.com/Aurtherle/Games/main/.github/workflows/tf.json')).json();
    let json = src[Math.floor(Math.random() * src.length)];

    // Mask the answer with underscores
    let clue = json.response.replace(/[A-Za-z]/g, '_');
    let caption = `*❃ ──────⊰ ❀ ⊱────── ❃*\n*فكك الاسم :*\n\nⷮ ${json.question}\n\n*الوقت :* ${(timeout / 1000).toFixed(2)} ثانية\n*الجائزة :* 50 بيلي و 10000 نقطة خبرة\n*❃ ──────⊰ ❀ ⊱────── ❃*`;

    // Send the question to the chat
    let msg = await conn.reply(m.chat, caption, m);

    // Store game state
    games[id] = {
        json,
        msg,
        hintsRequested: 0,
        timeout: setTimeout(() => {
            if (games[id]) {
                conn.reply(m.chat, `*❃ ──────⊰ ❀ ⊱────── ❃*\n*خلص الوقت*\n*الجواب :* *( ${json.response} )*\n*❃ ──────⊰ ❀ ⊱────── ❃*`, games[id].msg);
                delete games[id];
            }
        }, timeout),
    };
};

// Recognize replies to the bot's message
handler.all = async function (m) {
    let id = m.chat;

    // Check if there's an active game in this chat
    if (!(id in games)) return;

    let game = games[id];

    // Ensure the reply is to the bot's question message
    if (!m.quoted || m.quoted.id !== game.msg.id) return;

    let userAnswer = m.text.trim().toLowerCase();
    let correctAnswer = game.json.response.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
        // Correct answer - reward credits and experience
        let user = global.db.data.users[m.sender];
        user.exp = (user.exp || 0) + 10000; // Add 10,000 experience
        user.credit = (user.credit || 0) + 50; // Add 50 credits

        this.reply(
            m.chat,
            `*❃ ──────⊰ ❀ ⊱────── ❃*\n*❀ شوكولولو ❀*\n\n*◍ الجائزة :* 50 بيلي\n*◍ الخبرة :* 10000 نقطة\n*❃ ──────⊰ ❀ ⊱────── ❃*`,
            m
        );

        clearTimeout(game.timeout);
        delete games[id];
    } else if (/^(تلميح|hint)$/i.test(m.text)) {
        // Provide a hint
        game.hintsRequested = (game.hintsRequested || 0) + 1;
        let hint = generateHint(game.json.response, game.hintsRequested);
        this.reply(m.chat, `*تلميح:* ${hint}`, m);
    } else if (/^(انسحب|surr?ender)$/i.test(m.text)) {
        // Handle surrender
        clearTimeout(game.timeout);
        delete games[id];
        this.reply(m.chat, '*ماااش مافي مستوى*', m);
    } else {
        // Wrong answer
        this.reply(m.chat, '*نااه*', m);
    }
};

// Generate a randomized hint for the answer
function generateHint(answer, hintsRequested) {
    let answerArray = [...answer];
    let hint = answerArray.map(() => '_');
    let revealCount = Math.min(hintsRequested, answer.length);

    let revealedIndexes = new Set();
    while (revealedIndexes.size < revealCount) {
        let index = Math.floor(Math.random() * answer.length);
        revealedIndexes.add(index);
    }

    revealedIndexes.forEach(i => (hint[i] = answerArray[i]));
    return hint.join('');
}

handler.help = ['acertijo'];
handler.tags = ['game'];
handler.command = /^تف$/i;

export default handler;
