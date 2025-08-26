process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js' 
import './plugins/_content.js'
import { createRequire } from 'module'
import path, { join } from 'path'
import {fileURLToPath, pathToFileURL} from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, {watchFile, unwatchFile, writeFileSync, readdirSync, statSync,unlinkSync, existsSync, readFileSync, copyFileSync, watch,rmSync, mkdirSync, rename} from 'fs'
import { readdir, stat, unlink } from 'fs/promises'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import pino from 'pino'
import Pino from 'pino'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import {Low, JSONFile} from 'lowdb'
import PQueue from 'p-queue'
import Datastore from '@seald-io/nedb';
import store from './lib/store.js'
import readline from 'readline'
import NodeCache from 'node-cache' 
import { gataJadiBot } from './plugins/jadibot-serbot.js';
import LidResolver from './lib/LidResolver.js';
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { makeInMemoryStore, DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, PHONENUMBER_MCC } = await import('@whiskeysockets/baileys')
const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000
// بيانات البوت الثابتة
const BOT_LID_KEY = '236979702779973'; 
const BOT_LID = `${BOT_LID_KEY}@lid`;
const BOT_JID = '967779416950@s.whatsapp.net'; 
const BOT_NAME = '967779416950';
const BOT_PHONE_NUMBER = '+967779416950';

protoType()
serialize()
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
  return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
  return path.dirname(global.__filename(pathURL, true));
}; global.__require = function require(dir = import.meta.url) {
  return createRequire(dir);
};
//global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({...query, ...(apikeyqueryname ? {[apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name]} : {})})) : '')
global.timestamp = { start: new Date }
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!/.]');

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'))
global.DATABASE = global.db; 
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function() {
if (!global.db.READ) {
clearInterval(this);
resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
}}, 1 * 1000));
}
if (global.db.data !== null) return;
global.db.READ = true;
await global.db.read().catch(console.error);
global.db.READ = null;
global.db.data = {
users: {},
chats: {},
stats: {},
msgs: {},
sticker: {},
settings: {},
...(global.db.data || {}),
};
global.db.chain = chain(global.db.data);
};
loadDatabase();

// Inicialización de conexiones globales
//if (global.conns instanceof Array) {console.log('Conexiones ya inicializadas...');} else {global.conns = [];}

/* ------------------------------------------------*/

/**
 * Clase auxiliar para acceso a datos LID desde JSON
 */
class LidDataManager {
  constructor(cacheFile = './src/lidsresolve.json') {
    this.cacheFile = cacheFile;
  }

  /**
   * Cargar datos del archivo JSON
   */
    loadData() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf8');
        const currentData = JSON.parse(data);
        // إضافة بيانات البوت الثابتة
        currentData[BOT_LID_KEY] = {
          lid: BOT_LID,
          jid: BOT_JID,
          name: BOT_NAME,
          timestamp: Date.now(),
          phoneDetected: true,
          phoneNumber: BOT_PHONE_NUMBER,
          isBot: true // علامة لتمييز بيانات البوت
        };
        return currentData;
      }
      
      // إذا كان الملف غير موجود، أنشئ كائناً جديداً ببيانات البوت
      const newData = {};
      newData[BOT_LID_KEY] = {
        lid: BOT_LID,
        jid: BOT_JID,
        name: BOT_NAME,
        timestamp: Date.now(),
        phoneDetected: true,
        phoneNumber: BOT_PHONE_NUMBER,
        isBot: true
      };
      return newData;

    } catch (error) {
      console.error('❌ Error cargando cache LID:', error.message);
      
      // في حالة وجود خطأ، أرجع كائناً يحتوي على بيانات البوت فقط
      const errorData = {};
      errorData[BOT_LID_KEY] = {
        lid: BOT_LID,
        jid: BOT_JID,
        name: BOT_NAME,
        timestamp: Date.now(),
        phoneDetected: true,
        phoneNumber: BOT_PHONE_NUMBER,
        isBot: true
      };
      return errorData;
    }
  }
  
  /**
   * Obtener información de usuario por LID
   */
  getUserInfo(lidNumber) {
    const data = this.loadData();
    return data[lidNumber] || null;
  }

  /**
   * Obtener información de usuario por JID
   */
  getUserInfoByJid(jid) {
    const data = this.loadData();
    for (const [key, entry] of Object.entries(data)) {
      if (entry && entry.jid === jid) {
        return entry;
      }
    }
    return null;
  }

  /**
   * Encontrar LID por JID
   */
  findLidByJid(jid) {
    const data = this.loadData();
    for (const [key, entry] of Object.entries(data)) {
      if (entry && entry.jid === jid) {
        return entry.lid;
      }
    }
    return null;
  }

  /**
   * Listar todos los usuarios válidos
   */
  getAllUsers() {
    const data = this.loadData();
    const users = [];
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry && !entry.notFound && !entry.error) {
        users.push({
          lid: entry.lid,
          jid: entry.jid,
          name: entry.name,
          country: entry.country,
          phoneNumber: entry.phoneNumber,
          isPhoneDetected: entry.phoneDetected || entry.corrected,
          timestamp: new Date(entry.timestamp).toLocaleString()
        });
      }
    }
    
    return users.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Obtener estadísticas
   */
  getStats() {
    const data = this.loadData();
    let valid = 0, notFound = 0, errors = 0, phoneNumbers = 0, corrected = 0;
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry) {
        if (entry.phoneDetected || entry.corrected) phoneNumbers++;
        if (entry.corrected) corrected++;
        if (entry.notFound) notFound++;
        else if (entry.error) errors++;
        else valid++;
      }
    }
    
    return {
      total: Object.keys(data).length,
      valid,
      notFound,
      errors,
      phoneNumbers,
      corrected,
      cacheFile: this.cacheFile,
      fileExists: fs.existsSync(this.cacheFile)
    };
  }

  /**
   * Obtener usuarios por país
   */
  getUsersByCountry() {
    const data = this.loadData();
    const countries = {};
    
    for (const [key, entry] of Object.entries(data)) {
      if (entry && !entry.notFound && !entry.error && entry.country) {
        if (!countries[entry.country]) {
          countries[entry.country] = [];
        }
        
        countries[entry.country].push({
          lid: entry.lid,
          jid: entry.jid,
          name: entry.name,
          phoneNumber: entry.phoneNumber
        });
      }
    }
    
    // Ordenar usuarios dentro de cada país
    for (const country of Object.keys(countries)) {
      countries[country].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return countries;
  }
}

// Instancia del manejador de datos LID
const lidDataManager = new LidDataManager();

/**
 * FUNCIÓN MEJORADA: Procesar texto para resolver LIDs - VERSION MÁS ROBUSTA
 */
async function processTextMentions(text, groupId, lidResolver) {
  if (!text || !groupId || !text.includes('@')) return text;
  
  try {
    // Regex más completa para capturar diferentes formatos de mención
    const mentionRegex = /@(\d{8,20})/g;
    const mentions = [...text.matchAll(mentionRegex)];

    if (!mentions.length) return text;

    let processedText = text;
    const processedMentions = new Set();
    const replacements = new Map(); // Cache de reemplazos para este texto

    // Procesar todas las menciones primero
    for (const mention of mentions) {
      const [fullMatch, lidNumber] = mention;
      
      if (processedMentions.has(lidNumber)) continue;
      processedMentions.add(lidNumber);
      
      const lidJid = `${lidNumber}@lid`;

      try {
        const resolvedJid = await lidResolver.resolveLid(lidJid, groupId);
        
        if (resolvedJid && resolvedJid !== lidJid && !resolvedJid.endsWith('@lid')) {
          const resolvedNumber = resolvedJid.split('@')[0];
          
          // Validar que el número resuelto sea diferente al LID original
          if (resolvedNumber && resolvedNumber !== lidNumber) {
            replacements.set(lidNumber, resolvedNumber);
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando mención LID ${lidNumber}:`, error.message);
      }
    }

    // Aplicar todos los reemplazos
    for (const [lidNumber, resolvedNumber] of replacements.entries()) {
      // Usar regex global para reemplazar TODAS las ocurrencias
      const globalRegex = new RegExp(`@${lidNumber}\\b`, 'g'); // \\b para límite de palabra
      processedText = processedText.replace(globalRegex, `@${resolvedNumber}`);
    }

    return processedText;
  } catch (error) {
    console.error('❌ Error en processTextMentions:', error);
    return text;
  }
}

/**
 * FUNCIÓN AUXILIAR: Procesar contenido de mensaje recursivamente
 */
async function processMessageContent(messageContent, groupChatId, lidResolver) {
  if (!messageContent || typeof messageContent !== 'object') return;

  const messageTypes = Object.keys(messageContent);
  
  for (const msgType of messageTypes) {
    const msgContent = messageContent[msgType];
    if (!msgContent || typeof msgContent !== 'object') continue;

    // Procesar texto principal
    if (typeof msgContent.text === 'string') {
      try {
        const originalText = msgContent.text;
        msgContent.text = await processTextMentions(originalText, groupChatId, lidResolver);
      } catch (error) {
        console.error('❌ Error procesando texto:', error);
      }
    }

    // Procesar caption
    if (typeof msgContent.caption === 'string') {
      try {
        const originalCaption = msgContent.caption;
        msgContent.caption = await processTextMentions(originalCaption, groupChatId, lidResolver);
      } catch (error) {
        console.error('❌ Error procesando caption:', error);
      }
    }

    // Procesar contextInfo
    if (msgContent.contextInfo) {
      await processContextInfo(msgContent.contextInfo, groupChatId, lidResolver);
    }
  }
}

/**
 * FUNCIÓN AUXILIAR: Procesar contextInfo recursivamente
 */
async function processContextInfo(contextInfo, groupChatId, lidResolver) {
  if (!contextInfo || typeof contextInfo !== 'object') return;

  // Procesar mentionedJid en contextInfo
  if (contextInfo.mentionedJid && Array.isArray(contextInfo.mentionedJid)) {
    const resolvedMentions = [];
    for (const jid of contextInfo.mentionedJid) {
      if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
        try {
          const resolved = await lidResolver.resolveLid(jid, groupChatId);
          resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : jid);
        } catch (error) {
          resolvedMentions.push(jid);
        }
      } else {
        resolvedMentions.push(jid);
      }
    }
    contextInfo.mentionedJid = resolvedMentions;
  }

  // Procesar participant en contextInfo
  if (typeof contextInfo.participant === 'string' && contextInfo.participant.endsWith?.('@lid')) {
    try {
      const resolved = await lidResolver.resolveLid(contextInfo.participant, groupChatId);
      if (resolved && !resolved.endsWith('@lid')) {
        contextInfo.participant = resolved;
      }
    } catch (error) {
      console.error('❌ Error resolviendo participant en contextInfo:', error);
    }
  }

  // Procesar mensajes citados recursivamente
  if (contextInfo.quotedMessage) {
    await processMessageContent(contextInfo.quotedMessage, groupChatId, lidResolver);
  }

  // Procesar otros campos que puedan contener texto
  if (typeof contextInfo.stanzaId === 'string') {
    contextInfo.stanzaId = await processTextMentions(contextInfo.stanzaId, groupChatId, lidResolver);
  }
}

/**
 * FUNCIÓN MEJORADA: Procesar mensaje completo de forma más exhaustiva
 */
async function processMessageForDisplay(message, lidResolver) {
  if (!message || !lidResolver) return message;
  
  try {
    const processedMessage = JSON.parse(JSON.stringify(message)); // Deep copy
    const groupChatId = message.key?.remoteJid?.endsWith?.('@g.us') ? message.key.remoteJid : null;
    
    if (!groupChatId) return processedMessage;

    // 1. Resolver participant LID
    if (processedMessage.key?.participant?.endsWith?.('@lid')) {
      try {
        const resolved = await lidResolver.resolveLid(processedMessage.key.participant, groupChatId);
        if (resolved && resolved !== processedMessage.key.participant && !resolved.endsWith('@lid')) {
          processedMessage.key.participant = resolved;
        }
      } catch (error) {
        console.error('❌ Error resolviendo participant:', error);
      }
    }

    // 2. Procesar mentionedJid a nivel raíz
    if (processedMessage.mentionedJid && Array.isArray(processedMessage.mentionedJid)) {
      const resolvedMentions = [];
      for (const jid of processedMessage.mentionedJid) {
        if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
          try {
            const resolved = await lidResolver.resolveLid(jid, groupChatId);
            resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : jid);
          } catch (error) {
            resolvedMentions.push(jid);
          }
        } else {
          resolvedMentions.push(jid);
        }
      }
      processedMessage.mentionedJid = resolvedMentions;
    }

    // 3. Procesar el contenido del mensaje
    if (processedMessage.message) {
      await processMessageContent(processedMessage.message, groupChatId, lidResolver);
    }

    return processedMessage;
  } catch (error) {
    console.error('❌ Error procesando mensaje para display:', error);
    return message;
  }
}

/**
 * FUNCIÓN AUXILIAR: Extraer todo el texto de un mensaje para debugging
 */
function extractAllText(message) {
  if (!message?.message) return '';
  
  let allText = '';
  
  const extractFromContent = (content) => {
    if (!content) return '';
    let text = '';
    
    if (content.text) text += content.text + ' ';
    if (content.caption) text += content.caption + ' ';
    
    if (content.contextInfo?.quotedMessage) {
      const quotedTypes = Object.keys(content.contextInfo.quotedMessage);
      for (const quotedType of quotedTypes) {
        const quotedContent = content.contextInfo.quotedMessage[quotedType];
        text += extractFromContent(quotedContent);
      }
    }
    
    return text;
  };
  
  const messageTypes = Object.keys(message.message);
  for (const msgType of messageTypes) {
    allText += extractFromContent(message.message[msgType]);
  }
  
  return allText.trim();
}

/**
 * FUNCIÓN MEJORADA: Interceptar mensajes con mejor manejo de errores
 */
async function interceptMessages(messages, lidResolver) {
  if (!Array.isArray(messages)) return messages;

  const processedMessages = [];
  
  for (const message of messages) {
    try {
      // Procesar con lidResolver si existe
      let processedMessage = message;
      
      if (lidResolver && typeof lidResolver.processMessage === 'function') {
        try {
          processedMessage = await lidResolver.processMessage(message);
        } catch (error) {
          console.error('❌ Error en lidResolver.processMessage:', error);
          // Continuar con el procesamiento manual
        }
      }
      
      // Procesamiento adicional para display
      processedMessage = await processMessageForDisplay(processedMessage, lidResolver);
      
      processedMessages.push(processedMessage);
    } catch (error) {
      console.error('❌ Error interceptando mensaje:', error);
      processedMessages.push(message);
    }
  }

  return processedMessages;
}

global.creds = 'creds.json'
global.authFile = 'GataBotSession'
global.authFileJB  = 'GataJadiBot'
global.rutaBot = join(__dirname, authFile)
global.rutaJadiBot = join(__dirname, authFileJB)
const respaldoDir = join(__dirname, 'BackupSession');
const credsFile = join(global.rutaBot, global.creds);
const backupFile = join(respaldoDir, global.creds);

if (!fs.existsSync(rutaJadiBot)) {
fs.mkdirSync(rutaJadiBot)}

if (!fs.existsSync(respaldoDir)) fs.mkdirSync(respaldoDir);

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.authFile)
const msgRetryCounterMap = new Map();
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const {version} = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumberCode
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
let rl = readline.createInterface({
input: process.stdin,
output: process.stdout,
terminal: true,
})

const question = (texto) => {
rl.clearLine(rl.input, 0)
return new Promise((resolver) => {
rl.question(texto, (respuesta) => {
rl.clearLine(rl.input, 0)
resolver(respuesta.trim())
})})
}

let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${authFile}/creds.json`)) {
do {
let lineM = '⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ ⋯ 》'
opcion = await question(`╭${lineM}  
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.blueBright('┊')} ${chalk.blue.bgBlue.bold.cyan(mid.methodCode1)}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}   
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}     
┊ ${chalk.blueBright('┊')} ${chalk.green.bgMagenta.bold.yellow(mid.methodCode2)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright(`⇢  ${mid.methodCode3} 1:`)} ${chalk.greenBright(mid.methodCode4)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.redBright(`⇢  ${mid.methodCode3} 2:`)} ${chalk.greenBright(mid.methodCode5)}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}     
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta(mid.methodCode6)}
┊ ${chalk.blueBright('┊')} ${chalk.italic.magenta(mid.methodCode7)}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
┊ ${chalk.blueBright('╭┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')}    
┊ ${chalk.blueBright('┊')} ${chalk.red.bgRed.bold.green(mid.methodCode8)}
┊ ${chalk.blueBright('┊')} ${chalk.italic.cyan(mid.methodCode9)}
┊ ${chalk.blueBright('┊')} ${chalk.italic.cyan(mid.methodCode10)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm run qr ${chalk.italic.magenta(`(${mid.methodCode12})`)}`)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm run code ${chalk.italic.magenta(`(${mid.methodCode13})`)}`)}
┊ ${chalk.blueBright('┊')} ${chalk.bold.yellow(`npm start ${chalk.italic.magenta(`(${mid.methodCode14})`)}`)}
┊ ${chalk.blueBright('╰┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅')} 
╰${lineM}\n${chalk.bold.magentaBright('---> ')}`)
if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.bold.redBright(mid.methodCode11(chalk)))
}} while (opcion !== '1' && opcion !== '2' || fs.existsSync(`./${authFile}/creds.json`))
}

const filterStrings = [
"Q2xvc2luZyBzdGFsZSBvcGVu", // "Closing stable open"
"Q2xvc2luZyBvcGVuIHNlc3Npb24=", // "Closing open session"
"RmFpbGVkIHRvIGRlY3J5cHQ=", // "Failed to decrypt"
"U2Vzc2lvbiBlcnJvcg==", // "Session error"
"RXJyb3I6IEJhZCBNQUM=", // "Error: Bad MAC" 
"RGVjcnlwdGVkIG1lc3NhZ2U=" // "Decrypted message" 
]

/*console.info = () => {} 
console.debug = () => {} 
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))
const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile, 
browser: opcion == '1' ? ['GataBot-MD', 'Edge', '20.0.04'] : methodCodeQR ? ['GataBot-MD', 'Edge', '20.0.04'] : ["Ubuntu", "Chrome", "20.0.04"],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: true, 
generateHighQualityLinkPreview: true, 
syncFullHistory: false,
getMessage: async (clave) => {
let jid = jidNormalizedUser(clave.remoteJid)
let msg = await store.loadMessage(jid, clave.id)
return msg?.message || ""
},
msgRetryCounterCache, // Resolver mensajes en espera
msgRetryCounterMap, // Determinar si se debe volver a intentar enviar un mensaje o no
defaultQueryTimeoutMs: undefined,
version: [2, 3000, 1015901307],
}*/

console.info = () => {} 
console.debug = () => {} 
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))
const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile, 
browser: opcion == '1' ? ['GataBot-MD', 'Edge', '20.0.04'] : methodCodeQR ? ['GataBot-MD', 'Edge', '20.0.04'] : ["Ubuntu", "Chrome", "20.0.04"],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: false, 
generateHighQualityLinkPreview: true, 
syncFullHistory: false,
getMessage: async (key) => {
try {
let jid = jidNormalizedUser(key.remoteJid);
let msg = await store.loadMessage(jid, key.id);
return msg?.message || "";
} catch (error) {
return "";
}},
msgRetryCounterCache: msgRetryCounterCache || new Map(),
userDevicesCache: userDevicesCache || new Map(),
//msgRetryCounterMap,
defaultQueryTimeoutMs: undefined,
cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
version: version, 
keepAliveIntervalMs: 55000, 
maxIdleTimeMs: 60000, 
};
    
global.conn = makeWASocket(connectionOptions)
const lidResolver = new LidResolver(global.conn)
// Ejecutar análisis y corrección automática al inicializar (SILENCIOSO)
setTimeout(async () => {
  try {
    if (lidResolver) {
      // Ejecutar corrección automática de números telefónicos (sin logs)
      lidResolver.autoCorrectPhoneNumbers();
    }
  } catch (error) {
    console.error('❌ Error en análisis inicial:', error.message);
  }
}, 5000);

if (!fs.existsSync(`./${authFile}/creds.json`)) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) {
addNumber = phoneNumber.replace(/[^0-9]/g, '')
} else {
do {
phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(mid.phNumber2(chalk))))
phoneNumber = phoneNumber.replace(/\D/g,'')
if (!phoneNumber.startsWith('+')) {
phoneNumber = `+${phoneNumber}`
}
} while (!await isValidPhoneNumber(phoneNumber))
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
setTimeout(async () => {
let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
console.log(chalk.bold.white(chalk.bgMagenta(mid.pairingCode)), chalk.bold.white(chalk.white(codeBot)))
}, 2000)
}}}
}

conn.isInit = false
conn.well = false

if (!opts['test']) {
if (global.db) setInterval(async () => {
if (global.db.data) await global.db.save();
if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp', "GataJadiBot"], tmp.forEach(filename => cp.spawn('find', [filename, '-amin', '2', '-type', 'f', '-delete'])))}, 30 * 1000)}

if (opts['server']) (await import('./server.js')).default(global.conn, PORT)

//respaldo de la sesión "GataBotSession"
const backupCreds = async () => {
if (!fs.existsSync(credsFile)) {
console.log(await tr('[⚠] No se encontró el archivo creds.json para respaldar.'));
return;
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const newBackup = join(respaldoDir, `creds-${timestamp}.json`);
fs.copyFileSync(credsFile, newBackup);
console.log(`[✅] Respaldo creado: ${newBackup}`);

const backups = fs.readdirSync(respaldoDir).filter(file => file.startsWith('creds-') && file.endsWith('.json')).sort((a, b) => fs.statSync(join(respaldoDir, a)).mtimeMs - fs.statSync(join(respaldoDir, b)).mtimeMs);

while (backups.length > 3) {
const oldest = backups.shift();
fs.unlinkSync(join(respaldoDir, oldest));
console.log(`[🗑️] Respaldo antiguo eliminado: ${oldest}`);
}}; 

const restoreCreds = async () => {
const backups = fs.readdirSync(respaldoDir).filter(file => file.startsWith('creds-') && file.endsWith('.json')).sort((a, b) => fs.statSync(join(respaldoDir, b)).mtimeMs - fs.statSync(join(respaldoDir, a)).mtimeMs);

if (backups.length === 0) {
console.log('[⚠] No hay respaldos disponibles para restaurar.');
return;
}

const latestBackup = join(respaldoDir, backups[0]);
fs.copyFileSync(latestBackup, credsFile);
console.log(`[✅] Restaurado desde respaldo: ${backups[0]}`);
};

setInterval(async () => {
await backupCreds();
console.log('[♻️] Respaldo periódico realizado.')
}, 5 * 60 * 1000);

async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin } = update;
    global.stopped = connection;

if (isNewLogin) conn.isInit = true
const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
await global.reloadHandler(true).catch(console.error)
//console.log(await global.reloadHandler(true).catch(console.error));
global.timestamp.connect = new Date
}
if (global.db.data == null) loadDatabase()
if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
if (opcion == '1' || methodCodeQR) {
console.log(chalk.bold.yellow(mid.mCodigoQR))}
}
if (connection == 'open') {
console.log(chalk.bold.greenBright(mid.mConexion))
await joinChannels(conn)}
let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
if (connection === 'close') {
if (reason === DisconnectReason.badSession) {
console.log(chalk.bold.cyanBright(lenguajeGB['smsConexionOFF']()))
} else if (reason === DisconnectReason.connectionClosed) {
console.log(chalk.bold.magentaBright(lenguajeGB['smsConexioncerrar']()))
restoreCreds();
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.connectionLost) {
console.log(chalk.bold.blueBright(lenguajeGB['smsConexionperdida']()))
restoreCreds();
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.connectionReplaced) {
console.log(chalk.bold.yellowBright(lenguajeGB['smsConexionreem']()))
} else if (reason === DisconnectReason.loggedOut) {
console.log(chalk.bold.redBright(lenguajeGB['smsConexionOFF']()))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.restartRequired) {
console.log(chalk.bold.cyanBright(lenguajeGB['smsConexionreinicio']()))
await global.reloadHandler(true).catch(console.error)
} else if (reason === DisconnectReason.timedOut) {
console.log(chalk.bold.yellowBright(lenguajeGB['smsConexiontiem']()))
await global.reloadHandler(true).catch(console.error) //process.send('reset')
} else {
console.log(chalk.bold.redBright(lenguajeGB['smsConexiondescon'](reason, connection)))
}}
}

process.on('uncaughtException', console.error);

let isInit = true;
let handler = await import('./handler.js');
global.reloadHandler = async function(restatConn) {
try {
const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
if (Object.keys(Handler || {}).length) handler = Handler;
} catch (e) {
console.error(e);
}
if (restatConn) {
const oldChats = global.conn.chats;
try {
global.conn.ws.close();
} catch { }
conn.ev.removeAllListeners();
global.conn = makeWASocket(connectionOptions, {chats: oldChats});
store?.bind(conn);
    // Reinicializar lidResolver con la nueva conexión
    lidResolver.conn = global.conn;
    isInit = true;
}
if (!isInit) {
conn.ev.off('messages.upsert', conn.handler);
conn.ev.off('group-participants.update', conn.participantsUpdate);
conn.ev.off('groups.update', conn.groupsUpdate);
conn.ev.off('message.delete', conn.onDelete);
conn.ev.off('call', conn.onCall);
conn.ev.off('connection.update', conn.connectionUpdate);
conn.ev.off('creds.update', conn.credsUpdate);
}
//Información para Grupos
conn.welcome = lenguajeGB['smsWelcome']() 
conn.bye = lenguajeGB['smsBye']() 
conn.spromote = lenguajeGB['smsSpromote']() 
conn.sdemote = lenguajeGB['smsSdemote']() 
conn.sDesc = lenguajeGB['smsSdesc']() 
conn.sSubject = lenguajeGB['smsSsubject']() 
conn.sIcon = lenguajeGB['smsSicon']() 
conn.sRevoke = lenguajeGB['smsSrevoke']() 
const originalHandler = handler.handler.bind(global.conn);
  // HANDLER MEJORADO con procesamiento LID robusto
  conn.handler = async function (chatUpdate) {
    try {
      if (chatUpdate.messages) {
        // DEBUG: Log para rastrear el procesamiento
        //console.log(`🔄 Procesando ${chatUpdate.messages.length} mensajes...`);
        
        // Interceptar y procesar mensajes para resolver LIDs
        chatUpdate.messages = await interceptMessages(chatUpdate.messages, lidResolver);

        // Procesamiento adicional específico para LIDs en grupos
        for (let i = 0; i < chatUpdate.messages.length; i++) {
          const message = chatUpdate.messages[i];
          
          if (message?.key?.remoteJid?.endsWith('@g.us')) {
            try {
              // Procesar mensaje completo una vez más para asegurar que todo esté resuelto
              const fullyProcessedMessage = await processMessageForDisplay(message, lidResolver);
              chatUpdate.messages[i] = fullyProcessedMessage;
              
              // DEBUG: Verificar si hay menciones LID sin resolver
              const messageText = extractAllText(fullyProcessedMessage);
              if (messageText && messageText.includes('@') && /(@\d{8,20})/.test(messageText)) {
                const lidMatches = messageText.match(/@(\d{8,20})/g);
                if (lidMatches) {
                  //console.log(`⚠️ Posibles LIDs sin resolver: ${lidMatches.join(', ')}`);
                }
              }
            } catch (error) {
              console.error('❌ Error en procesamiento final de mensaje:', error);
            }
          }
        }
      }
      
      return await originalHandler(chatUpdate);
    } catch (error) {
      console.error('❌ Error en handler interceptor:', error);
      return await originalHandler(chatUpdate);
    }
  };
  
conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
conn.onDelete = handler.deleteUpdate.bind(global.conn);
conn.onCall = handler.callUpdate.bind(global.conn);
conn.connectionUpdate = connectionUpdate.bind(global.conn);
conn.credsUpdate = saveCreds.bind(global.conn, true);
conn.ev.on('messages.upsert', conn.handler);
conn.ev.on('group-participants.update', conn.participantsUpdate);
conn.ev.on('groups.update', conn.groupsUpdate);
conn.ev.on('message.delete', conn.onDelete);
conn.ev.on('call', conn.onCall);
conn.ev.on('connection.update', conn.connectionUpdate);
conn.ev.on('creds.update', conn.credsUpdate);
isInit = false
return true
}

// Agregar funciones de utilidad al conn para acceso desde plugins
conn.lid = {
  /**
   * Obtener información de usuario por LID
   */
  getUserInfo: (lidNumber) => lidDataManager.getUserInfo(lidNumber),
  
  /**
   * Obtener información de usuario por JID
   */
  getUserInfoByJid: (jid) => lidDataManager.getUserInfoByJid(jid),
  
  /**
   * Encontrar LID por JID
   */
  findLidByJid: (jid) => lidDataManager.findLidByJid(jid),
  
  /**
   * Listar todos los usuarios
   */
  getAllUsers: () => lidDataManager.getAllUsers(),
  
  /**
   * Obtener estadísticas
   */
  getStats: () => lidDataManager.getStats(),
  
  /**
   * Obtener usuarios por país
   */
  getUsersByCountry: () => lidDataManager.getUsersByCountry(),
  
  /**
   * Validar número telefónico
   */
  validatePhoneNumber: (phoneNumber) => {
    if (!lidResolver.phoneValidator) return false;
    return lidResolver.phoneValidator.isValidPhoneNumber(phoneNumber);
  },
  
  /**
   * Detectar si un LID es un número telefónico
   */
  detectPhoneInLid: (lidString) => {
    if (!lidResolver.phoneValidator) return { isPhone: false };
    return lidResolver.phoneValidator.detectPhoneInLid(lidString);
  },
  
  /**
   * Forzar guardado del caché
   */
  forceSave: () => {
    try {
      lidResolver.forceSave();
      return true;
    } catch (error) {
      console.error('Error guardando caché LID:', error);
      return false;
    }
  },
  
  /**
   * Mostrar información completa del caché
   */
  getCacheInfo: () => {
    try {
      const stats = lidDataManager.getStats();
      const analysis = lidResolver.analyzePhoneNumbers();
      
      return `📱 *ESTADÍSTICAS DEL CACHÉ LID*

📊 *General:*
• Total de entradas: ${stats.total}
• Entradas válidas: ${stats.valid}
• No encontradas: ${stats.notFound}
• Con errores: ${stats.errors}

📞 *Números telefónicos:*
• Detectados: ${stats.phoneNumbers}
• Corregidos: ${stats.corrected}
• Problemáticos: ${analysis.stats.phoneNumbersProblematic}

🗂️ *Caché:*
• Archivo: ${stats.cacheFile}
• Existe: ${stats.fileExists ? 'Sí' : 'No'}

🌍 *Países detectados:*
${Object.entries(lidDataManager.getUsersByCountry())
  .slice(0, 5)
  .map(([country, users]) => `• ${country}: ${users.length} usuarios`)
  .join('\n')}`;
    } catch (error) {
      return `❌ Error obteniendo información: ${error.message}`;
    }
  },
  
  /**
   * Corregir números telefónicos automáticamente
   */
  forcePhoneCorrection: () => {
    try {
      const result = lidResolver.autoCorrectPhoneNumbers();
      
      if (result.corrected > 0) {
        return `✅ Se corrigieron ${result.corrected} números telefónicos automáticamente.`;
      } else {
        return '✅ No se encontraron números telefónicos que requieran corrección.';
      }
    } catch (error) {
      return `❌ Error en corrección automática: ${error.message}`;
    }
  },
  
  /**
   * Resolver LID manualmente
   */
  resolveLid: async (lidJid, groupChatId) => {
    try {
      return await lidResolver.resolveLid(lidJid, groupChatId);
    } catch (error) {
      console.error('Error resolviendo LID:', error);
      return lidJid;
    }
  },
  
  /**
   * Procesar texto para resolver menciones (función auxiliar para plugins)
   */
  processTextMentions: async (text, groupId) => {
    try {
      return await processTextMentions(text, groupId, lidResolver);
    } catch (error) {
      console.error('Error procesando menciones en texto:', error);
      return text;
    }
  }
};


/*const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename));
const module = await import(file);
global.plugins[filename] = module.default || module;
} catch (e) {
conn.logger.error(e);
delete global.plugins[filename];
}}}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)*/

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
} catch (e) {
conn.logger.error(e)
delete global.plugins[filename]
}}}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)

global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true)
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(` SE ACTULIZADO - '${filename}' CON ÉXITO`)
else {
conn.logger.warn(`SE ELIMINO UN ARCHIVO : '${filename}'`)
return delete global.plugins[filename];
}
} else conn.logger.info(`SE DETECTO UN NUEVO PLUGINS : '${filename}'`)
const err = syntaxerror(readFileSync(dir), filename, {
sourceType: 'module',
allowAwaitOutsideFunction: true,
});
if (err) conn.logger.error(`SE DETECTO UN ERROR DE SINTAXIS | SYNTAX ERROR WHILE LOADING '${filename}'\n${format(err)}`);
else {
try {
const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
global.plugins[filename] = module.default || module;
} catch (e) {
conn.logger.error(`HAY UN ERROR REQUIERE EL PLUGINS '${filename}\n${format(e)}'`);
} finally {
global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
}}}};

Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();

async function _quickTest() {
const test = await Promise.all([
spawn('ffmpeg'),
spawn('ffprobe'),
spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
spawn('convert'),
spawn('magick'),
spawn('gm'),
spawn('find', ['--version']),
].map((p) => {
return Promise.race([
new Promise((resolve) => {
p.on('close', (code) => {
resolve(code !== 127);
});
}),

new Promise((resolve) => {
p.on('error', (_) => resolve(false));
})]);
}));

const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
Object.freeze(global.support);
}

function clearTmp() {
const tmpDir = join(__dirname, 'tmp')
const filenames = readdirSync(tmpDir)
filenames.forEach(file => {
const filePath = join(tmpDir, file)
unlinkSync(filePath)})
}

async function purgeSession() {
const sessionDir = './GataBotSession';
try {
if (!existsSync(sessionDir)) return;
const files = await readdir(sessionDir);
const preKeys = files.filter(file => file.startsWith('pre-key-')); 
const now = Date.now();
const oneHourAgo = now - (24 * 60 * 60 * 1000); //24 horas
    
for (const file of preKeys) {
const filePath = join(sessionDir, file);
const fileStats = await stat(filePath);
if (fileStats.mtimeMs < oneHourAgo) { 
try {
await unlink(filePath);
console.log(chalk.green(`[🗑️] Pre-key antigua eliminada: ${file}`));
} catch (err) {
//console.error(chalk.red(`[⚠] Error al eliminar pre-key antigua ${file}: ${err.message}`));
}} else {
console.log(chalk.yellow(`[ℹ️] Manteniendo pre-key activa: ${file}`));
}}
console.log(chalk.cyanBright(`[🔵] Sesiones no esenciales eliminadas de ${global.authFile}`));
} catch (err) {
//console.error(chalk.red(`[⚠] Error al limpiar: ${err.message}`));
}}

async function purgeSessionSB() {
  const jadibtsDir = './GataJadiBot/';
  try {
    if (!existsSync(jadibtsDir)) return;

    const directories = await readdir(jadibtsDir);
    let SBprekey = [];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000); // 24 horas en milisegundos

    for (const dir of directories) {
      const dirPath = join(jadibtsDir, dir);
      const stats = await stat(dirPath);
      if (stats.isDirectory()) {
        const files = await readdir(dirPath);
        const preKeys = files.filter(file => file.startsWith('pre-key-') && file !== 'creds.json');
        SBprekey = [...SBprekey, ...preKeys];

        for (const file of preKeys) {
          const filePath = join(dirPath, file);
          const fileStats = await stat(filePath);

          if (fileStats.mtimeMs < oneDayAgo) { 
            try {
              await unlink(filePath);
              console.log(chalk.bold.green(`${lenguajeGB.smspurgeOldFiles1()} ${file} ${lenguajeGB.smspurgeOldFiles2()}`));
            } catch (err) {
              // Manejo del error de eliminación si es necesario
            }
          } else {
            // Archivo todavía activo, no hacer nada
          }
        }
      }
    }

    if (SBprekey.length === 0) {
      console.log(chalk.bold.green(lenguajeGB.smspurgeSessionSB1()));
    } else {
      console.log(chalk.cyanBright(`[🔵] Pre-keys antiguas eliminadas de sub-bots: ${SBprekey.length}`));
    }

  } catch (err) {
    console.log(chalk.bold.red(lenguajeGB.smspurgeSessionSB3() + err));
  }
}

async function purgeOldFiles() {
const directories = ['./GataBotSession/', './GataJadiBot/'];
for (const dir of directories) {
try {
if (!fs.existsSync(dir)) { 
console.log(chalk.yellow(`[⚠] Carpeta no existe: ${dir}`));
continue;
}
const files = await fsPromises.readdir(dir); 
for (const file of files) {
if (file !== 'creds.json') {
const filePath = join(dir, file);
try {
await fsPromises.unlink(filePath);
//console.log(chalk.green(`[🗑️] Archivo residual eliminado: ${file} en ${dir}`));
} catch (err) {
//console.error(chalk.red(`[⚠] Error al eliminar ${file} en ${dir}: ${err.message}`));
}}}
} catch (err) {
//console.error(chalk.red(`[⚠] Error al limpiar ${dir}: ${err.message}`));
}}
//console.log(chalk.cyanBright(`[🟠] Archivos residuales eliminados de ${directories.join(', ')}`));
}

/*function purgeSession() {
let prekey = []
let directorio = readdirSync("./GataBotSession")
let filesFolderPreKeys = directorio.filter(file => {
return file.startsWith('pre-key-')
})
prekey = [...prekey, ...filesFolderPreKeys]
filesFolderPreKeys.forEach(files => {
unlinkSync(`./GataBotSession/${files}`)
})
} 

function purgeSessionSB() {
try {
const listaDirectorios = readdirSync('./GataJadiBot/');
let SBprekey = [];
listaDirectorios.forEach(directorio => {
if (statSync(`./GataJadiBot/${directorio}`).isDirectory()) {
const DSBPreKeys = readdirSync(`./GataJadiBot/${directorio}`).filter(fileInDir => {
return fileInDir.startsWith('pre-key-')
})
SBprekey = [...SBprekey, ...DSBPreKeys];
DSBPreKeys.forEach(fileInDir => {
if (fileInDir !== 'creds.json') {
unlinkSync(`./GataJadiBot/${directorio}/${fileInDir}`)
}})
}})
if (SBprekey.length === 0) {
console.log(chalk.bold.green(lenguajeGB.smspurgeSessionSB1()))
} else {
console.log(chalk.bold.cyanBright(lenguajeGB.smspurgeSessionSB2()))
}} catch (err) {
console.log(chalk.bold.red(lenguajeGB.smspurgeSessionSB3() + err))
}}
function purgeOldFiles() {
const directories = ['./GataBotSession/', './GataJadiBot/']
directories.forEach(dir => {
readdirSync(dir, (err, files) => {
if (err) throw err
files.forEach(file => {
if (file !== 'creds.json') {
const filePath = path.join(dir, file);
unlinkSync(filePath, err => {
if (err) {
console.log(chalk.bold.red(`${lenguajeGB.smspurgeOldFiles3()} ${file} ${lenguajeGB.smspurgeOldFiles4()}` + err))
} else {
console.log(chalk.bold.green(`${lenguajeGB.smspurgeOldFiles1()} ${file} ${lenguajeGB.smspurgeOldFiles2()}`))
} }) }
}) }) }) }*/


function redefineConsoleMethod(methodName, filterStrings) {
const originalConsoleMethod = console[methodName]
console[methodName] = function() {
const message = arguments[0]
if (typeof message === 'string' && filterStrings.some(filterString => message.includes(atob(filterString)))) {
arguments[0] = ""
}
originalConsoleMethod.apply(console, arguments)
}}

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await clearTmp()
console.log(chalk.bold.cyanBright(lenguajeGB.smsClearTmp()))}, 1000 * 60 * 3) //3 min 

setInterval(async () => {
if (stopped === 'close' || !conn || !conn.user) return
await purgeSessionSB()
await purgeSession()
console.log(chalk.bold.cyanBright(lenguajeGB.smspurgeSession()))
await purgeOldFiles()
console.log(chalk.bold.cyanBright(lenguajeGB.smspurgeOldFiles()))}, 1000 * 60 * 10)

// Limpiar y optimizar caché LID cada 30 minutos
setInterval(async () => {
  if (stopped === 'close' || !conn || !conn?.user || !lidResolver) return;
  
  try {
    const stats = lidDataManager.getStats();
    
    // Si el caché tiene más de 800 entradas, hacer limpieza
    if (stats.total > 800) {
      // Eliminar entradas antiguas (más de 7 días) que no se han encontrado
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      for (const [key, entry] of lidResolver.cache.entries()) {
        if (entry.timestamp < sevenDaysAgo && (entry.notFound || entry.error)) {
          lidResolver.cache.delete(key);
          if (entry.jid && lidResolver.jidToLidMap.has(entry.jid)) {
            lidResolver.jidToLidMap.delete(entry.jid);
          }
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        lidResolver.markDirty();
      }
    }
    
    // Ejecutar corrección automática ocasionalmente
    if (Math.random() < 0.1) { // 10% de probabilidad
      const correctionResult = lidResolver.autoCorrectPhoneNumbers();
    }
  } catch (error) {
    console.error('❌ Error en limpieza de caché LID:', error.message);
  }
}, 30 * 60 * 1000); // Cada 30 minutos

function clockString(ms) {
  const d = isNaN(ms) ? '--' : Math.floor(ms / 86400000);
  const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000) % 24;
  const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [d, 'd ', h, 'h ', m, 'm ', s, 's '].map((v) => v.toString().padStart(2, 0)).join('');
}

// Manejo mejorado de salida del proceso
const gracefulShutdown = () => {
  if (lidResolver?.isDirty) {
    try {
      lidResolver.forceSave();
    } catch (error) {
      console.error('❌ Error guardando caché LID:', error.message);
    }
  }
};

process.on('exit', gracefulShutdown);

process.on('SIGINT', () => {
  gracefulShutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  gracefulShutdown();
  process.exit(0);
});

// Manejo de errores no capturadas relacionadas con LID
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes('lid')) {
    console.error('❌ Error no manejado relacionado con LID:', reason);
  }
});

_quickTest().then(() => conn.logger.info(chalk.bold(lenguajeGB['smsCargando']().trim()))).catch(console.error)

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.bold.greenBright(lenguajeGB['smsMainBot']().trim()))
import(`${file}?update=${Date.now()}`)
})

async function joinChannels(conn) {
for (const channelId of Object.values(global.ch)) {
await conn.newsletterFollow(channelId).catch(() => {})
}}
