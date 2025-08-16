import fs from 'fs';
import similarity from 'similarity';

let timeout = 60000; // 60 seconds timeout
let poin = 10000; // Points reward
const threshold = 0.72; // Similarity threshold

let games = {}; // Global game state storage

// Main game starter
let handler = async (m, { conn, command }) => {
    let id = m.chat;

    // Check if a game is already running in this chat
    if (id in games) {
        conn.reply(m.chat, '*صبر ما تشوف فيه سؤال ؟*', games[id].msg);
        return;
    }

     // Fetch a random anime character
        let src = await (await fetch('https://raw.githubusercontent.com/Aurtherle/Games/refs/heads/main/.github/workflows/eyeanime.json')).json();
        let json = src[Math.floor(Math.random() * src.length)];

    // Send the game message
    let caption = `*❃ ──────⊰ ❀ ⊱────── ❃*\n*عين من ؟؟*\n\n*الوقت :* ${(timeout / 1000).toFixed(2)} ثانية\n*الجائزة :* ${poin} خبرة\n*❃ ──────⊰ ❀ ⊱────── ❃*`;
    let msg = await conn.sendFile(m.chat, json.img, '', caption, m);

    // Store game state
    games[id] = {
        json,
        poin,
        msg,
        timeout: setTimeout(() => {
            if (games[id]) {
                conn.reply(m.chat, `*❃ ──────⊰ ❀ ⊱────── ❃*\n*خلص الوقت*\n*الجواب :* ${json.name}\n*❃ ──────⊰ ❀ ⊱────── ❃*`, msg);
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

    // Normalize user input and the correct answer
    let userAnswer = normalizeAnswer(m.text);
    let correctAnswer = normalizeAnswer(game.json.name);

    if (userAnswer === correctAnswer) {
        // Correct answer - reward experience points and credits
        global.db.data.users[m.sender].exp += game.poin;

        // Ensure user has a "credit" property in the database
        if (!global.db.data.users[m.sender].credit) {
            global.db.data.users[m.sender].credit = 0;
        }

        global.db.data.users[m.sender].credit += 50;

        this.reply(
            m.chat,
            `*❃ ──────⊰ ❀ ⊱────── ❃*\n*❀ شوكولولو ❀*\n\n*◍ الجائزة :* ${game.poin} خبرة\n*◍ الرصيد :* 50 بيلي\n*❃ ──────⊰ ❀ ⊱────── ❃*`,
            m
        );

        clearTimeout(game.timeout);
        delete games[id];
    } else if (similarity(userAnswer, correctAnswer) >= threshold) {
        // Close answer
        this.reply(m.chat, '*اوخخ قربتت*', m);
    } else if (/^(تلميح|hint)$/i.test(m.text)) {
        // Provide a hint
        game.hintsRequested = (game.hintsRequested || 0) + 1;
        let hint = generateHint(game.json.name, game.hintsRequested);
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

// Normalize answers for comparison
function normalizeAnswer(answer) {
    return answer.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

// Generate a randomized hint for the name
function generateHint(name, requested) {
    let nameArray = [...name];
    let hint = nameArray.map(() => '_');
    let revealCount = Math.min(requested, name.length);

    let revealedIndexes = new Set();
    while (revealedIndexes.size < revealCount) {
        let index = Math.floor(Math.random() * name.length);
        revealedIndexes.add(index);
    }

    revealedIndexes.forEach(i => hint[i] = nameArray[i]);
    return hint.join('');
}

handler.help = ['guesseye']; // Command help
handler.tags = ['game'];
handler.command = /^عين/i; // Matches Arabic commands for "eye"
export const exp = 10000;
export default handler;
