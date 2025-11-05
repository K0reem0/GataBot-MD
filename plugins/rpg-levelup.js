import { canLevelUp, xpRange } from '../lib/levelling.js';
import Canvacord from 'canvacord';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const roles = {
    'مواطن 👦🏻': 0,
    'شونين⚔️': 3,
    'ساموراي 🗡': 4,
    'شينوبي 🗡': 6,
    'تارتاروس 👹': 8,
    'نينجا⚔️': 12,
    'ملك التنانين 🐉': 13,
    'يونكو 🧛🏻': 14,
    'شينيغامي 💀': 16,
    'ملك قراصنة👒': 20,
    'ملك👑🤴🏻': 24,
    'الأسطورة الخالدة': 28,
    'هاشيرا🔥🗡️': 32,
    'الفارس الأسود 🖤': 36,
    'حاكم الدمار👺': 48,
    'شيطان🥀⚰️': 52,
    'القوت 🐐': 56,
    'العم': 60,
    'العم آرثر': 100,
};

async function downloadImage(url, filename) {
    const filePath = path.join('./tmp', filename);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.mkdirSync('./tmp', { recursive: true });
    fs.writeFileSync(filePath, response.data);
    return filePath;
}

const defaultAvatarUrl = 'https://uploadf.com/file/japf8q2p3lxjrjftt3rvzj1kowtg95ia0i3b3a9tj02cctw3wvcl1wprwpgxhek66z.jpg';
const backgroundUrl = 'https://uploadf.com/file/ja3522p2091t0oe4wskyrtcrynds8uz73jmbi5dszdgq9n3zr6kak4vjc2mqtidjhx.jpg';

export async function before(m, { conn }) {
let who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.fromMe
    ? conn.user.jid
    : m.sender;

    // إذا المستخدم غير موجود → إنشاؤه
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = {
            registered: false,
            name: null,
            regTime: null,
            image: null,
            exp: 100,
            messages: 0,
            credit: 0,
            level: 0,
            role: 'مواطن 👦🏻',
            warn: 0
        };
    }

    let user = global.db.data.users[who];

    // تصحيح القيم إذا كانت غير صالحة
    if (isNaN(user.exp) || user.exp === undefined) user.exp = 100;
    if (isNaN(user.level) || user.level === undefined) user.level = 0;
    if (isNaN(user.messages) || user.messages === undefined) user.messages = 0;
    if (isNaN(user.credit) || user.credit === undefined) user.credit = 0;

    let beforeLevel = user.level;

    // حلقة رفع المستوى
    while (canLevelUp(user.level, user.exp, global.multiplier)) {
        user.level++;
    }

    // تحديث الدور بعد الترقية
    user.role = (Object.entries(roles)
        .sort((a, b) => b[1] - a[1])
        .find(([, minLevel]) => user.level >= minLevel) || Object.entries(roles)[0])[0];

    if (beforeLevel !== user.level) {
        let { min, xp } = xpRange(user.level, global.multiplier);
        let crxp = user.exp - min;
        let requiredXpToLevelUp = xp;

        // تحميل الصور
        let pp;
        try {
            pp = await conn.profilePictureUrl(who, 'image');
        } catch {
            pp = defaultAvatarUrl;
        }
        pp = await downloadImage(pp, 'avatar.png');
        let customBackground = await downloadImage(backgroundUrl, 'rankbg.jpg');

        const card = await new Canvacord.Rank()
            .setAvatar(pp)
            .setLevel(user.level)
            .setCurrentXP(crxp)
            .setRequiredXP(requiredXpToLevelUp)
            .setProgressBar('#414d59', 'COLOR')
            .setDiscriminator(who.substring(3, 7))
            .setCustomStatusColor('#414d59')
            .setLevelColor('#FFFFFF', '#FFFFFF')
            .setOverlay('#000000')
            .setUsername(user.name)
            .setBackground('IMAGE', customBackground)
            .setRank(user.level, 'LEVEL', false)
            .renderEmojis(true)
            .build();

        let message = `*❃ ──────⊰ ❀ ⊱────── ❃*\n
*🎊 ازداد مستواك 🎉*\n
*المستوى السابق :* *${beforeLevel}*\n
*المستوى الحالي :* *${user.level}*\n
*التصنيف :* *${user.role}*\n
*❃ ──────⊰ ❀ ⊱────── ❃*`;

        try {
            await conn.sendFile(m.chat, card, 'levelup.jpg', message, m);
        } catch (error) {
            console.error(error);
            m.reply(message);
        }
    }
}