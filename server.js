import express from 'express';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Importing the modules
import pairRouter from './pair.js';
import qrRouter from './qr.js';
import QRCode from 'qrcode';

// إنشاء التطبيق
const app = express();

// Resolve the current directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const GITHUB_REPO = process.env.GITHUB_REPO;

import('events').then(events => {
    events.EventEmitter.defaultMaxListeners = 500;
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.use('/pair', pairRouter);
app.use('/qr', qrRouter);

// ===== pipeEmit =====
function pipeEmit(event, event2, prefix = '') {
    let old = event.emit;
    event.emit = function (event, ...args) {
        old.emit(event, ...args);
        event2.emit(prefix + event, ...args);
    };
    return {
        unpipeEmit() {
            event.emit = old;
        }
    };
}

// ===== keepAlive =====
function keepAlive() {
    const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    if (/(\/\/|.)undefined./.test(url)) return;
    setInterval(() => {
        fetch(url).catch(console.error);
    }, 5 * 1000 * 60); // كل 5 دقائق
}

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (process.env.KEEPALIVE === 'true') {
        keepAlive();
    }
});
