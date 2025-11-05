const HANGMANPICS = [
    `
  +---+
      |
      |
      |
      |
      |
=========`,
    `
  +---+
  |   |
      |
      |
      |
      |
=========`,
    `
  +---+
  |   |
  O   |
      |
      |
      |
=========`,
    `
  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
    `
  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
    `
  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
    `
  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
    `
  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
];

// Fetch the Arabic words list from GitHub
async function fetchArabicWords() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/Aurtherle/Games/refs/heads/main/.github/workflows/Hangman.json');
        const words = await response.json();
        return words;
    } catch (error) {
        console.error("Failed to fetch Arabic words:", error);
        return [];
    }
}

let timeout = 300000; // 5 minutes timeout
let maxWrongGuesses = 10; // Number of stages in HANGMANPICS
let games = {}; // Global game state storage

let handler = async (m, { conn }) => {
    let id = `${m.chat}:${m.sender}`;

    // Check if a game is already running for the current player
    if (id in games) {
        conn.reply(m.chat, 'لديك لعبة نشطة بالفعل! استمر باللعب.', m);
        return;
    }

    // Fetch Arabic words from GitHub
    let ARABIC_WORDS = await fetchArabicWords();
    if (ARABIC_WORDS.length === 0) {
        return conn.reply(m.chat, "لم أتمكن من الحصول على كلمة لتشغيل اللعبة.", m);
    }

    // Select a random Arabic word from the list
    let gameData = ARABIC_WORDS[Math.floor(Math.random() * ARABIC_WORDS.length)];
    let word = gameData.word;

    // Create a blank template for the word
    let wordTemplate = word.replace(/./g, '_').split('');

    // Initialize game state
    games[id] = {
        word,
        wordTemplate,
        wrongGuesses: [],
        description: gameData.description, // Add the description
        msg: null,
        hintGiven: false, // Track if the hint was already given
        timeout: setTimeout(() => {
            if (games[id]) {
                conn.reply(m.chat, `*❃ ──────⊰ ❀ ⊱────── ❃*\n*انتهى الوقت!*\n\nالكلمة كانت: *${games[id].word}*\n*❃ ──────⊰ ❀ ⊱────── ❃*`, games[id].msg);
                delete games[id];
            }
        }, timeout),
        player: m.sender // Store the player who started the game
    };

    // Determine the difficulty level based on the word length
    let difficulty = getDifficultyLevel(word.length);

    // Draw the initial hangman and send the message
    games[id].msg = await conn.reply(m.chat, drawHangman(games[id], difficulty), m);
};

// Recognize user guesses
handler.all = async function (m) {
    let id = `${m.chat}:${m.sender}`;

    // Check if there's an active Hangman game for the current player
    if (!(id in games)) return; // Ignore interactions from other users

    let game = games[id];
    let guess = m.text.trim().toLowerCase();

    // Validate input: single letter or surrender command
    if (!/^[a-z\u0600-\u06FF]$/.test(guess) && !/^(انسحب|surr?ender)$/i.test(guess)) {
        return; // Ignore invalid input silently
    }

    // Handle surrender
    if (/^(انسحب|surr?ender)$/i.test(guess)) {
        clearTimeout(game.timeout);
        delete games[id];
        return this.reply(m.chat, `*❃ ──────⊰ ❀ ⊱────── ❃*\n*استسلمت!*\nالكلمة كانت: *${game.word}*\n*❃ ──────⊰ ❀ ⊱────── ❃*`, m);
    }

    // Process guess
    if (game.word.includes(guess)) {
        // Correct guess: update the word template
        for (let i = 0; i < game.word.length; i++) {
            if (game.word[i] === guess) game.wordTemplate[i] = guess;
        }
    } else {
        // Wrong guess: add to wrong guesses
        if (!game.wrongGuesses.includes(guess)) {
            game.wrongGuesses.push(guess);
        }
    }

    // Provide a hint if the user has 4 attempts left
    if (!game.hintGiven && game.wrongGuesses.length === 3) { // 4 attempts remaining
        game.hintGiven = true;
        this.reply(m.chat, `*تلميح: ${game.description}*`, m);
    }

    // Check win condition
    if (!game.wordTemplate.includes('_')) {
        clearTimeout(game.timeout);
        delete games[id];
        return this.reply(
            m.chat,
            `*❃ ──────⊰ ❀ ⊱────── ❃*\n*مبروك!*\nلقد أكملت الكلمة: *${game.word}*\n*❃ ──────⊰ ❀ ⊱────── ❃*`,
            m
        );
    }

    // Check lose condition
    if (game.wrongGuesses.length >= maxWrongGuesses) {
        clearTimeout(game.timeout);
        delete games[id];
        return this.reply(
            m.chat,
            `*❃ ──────⊰ ❀ ⊱────── ❃*\n*خسرت!*\nلقد تجاوزت الحد الأقصى من الأخطاء.\nالكلمة كانت: *${game.word}*\n*❃ ──────⊰ ❀ ⊱────── ❃*`,
            m
        );
    }

    // Update the Hangman drawing and word template
    conn.reply(m.chat, drawHangman(game, getDifficultyLevel(game.word.length)), game.msg);
};

// Function to draw the Hangman and game state
function drawHangman(game, difficulty) {
    return `*❃ ──────⊰ ❀ ⊱────── ❃*\n*لعبة المشنقة* (${difficulty})\n\n${HANGMANPICS[game.wrongGuesses.length]}\n\n*الكلمة:* ${game.wordTemplate.join(
        ' '
    )}\n\n*الأخطاء:* ${game.wrongGuesses.join(', ') || 'لا توجد'}\n*المحاولات المتبقية:* ${maxWrongGuesses - game.wrongGuesses.length}\n*❃ ──────⊰ ❀ ⊱────── ❃*`;
}

// Function to determine difficulty based on the word length
function getDifficultyLevel(wordLength) {
    if (wordLength <= 3) return "سهل";
    if (wordLength === 4) return "متوسط";
    if (wordLength === 5) return "صعب";
    return "صعب جدا";
}

handler.help = ['hangman'];
handler.tags = ['game'];
handler.command = /^المشنقة$/i;

export default handler;
