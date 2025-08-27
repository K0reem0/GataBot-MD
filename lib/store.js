/*
 * store.js optimizado - Versión mejorada معالجة LIDs
 * - تم تصحيح الأخطاء لضمان عمل الكود بشكل سليم
 */

import fs from 'fs';
import path from 'path';
import LidResolver from './LidResolver.js';

const baileys = (await import('@whiskeysockets/baileys')).default;
const {
  BufferJSON,
  proto,
  isJidBroadcast,
  WAMessageStubType,
  updateMessageWithReceipt,
  updateMessageWithReaction,
  jidNormalizedUser
} = baileys;

// Configuración
const TIME_TO_DATA_STALE = 5 * 60 * 1000;
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;
const WS_WAIT_TIMEOUT = 30000;
const WS_WAIT_STEP = 300;
const SEND_RETRY_ATTEMPTS_PER_CYCLE = 2;

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAllTextFromMessage(message) {
  if (!message?.message) return '';
  
  let allText = '';
  
  const extractFromContent = (content) => {
    if (!content || typeof content !== 'object') return '';
    let text = '';
    
    if (typeof content.text === 'string') text += content.text + ' ';
    if (typeof content.caption === 'string') text += content.caption + ' ';
    
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

function makeInMemoryStore() {
  let chats = {};
  let messages = {};
  let contacts = {};
  let state = { connection: 'close' };
  let conn = null;
  let lidResolver = null;

  const pendingDecryption = new Map();
  let errorStats = {
    lidDecryptionErrors: 0,
    webDesktopErrors: 0,
    successfulRetries: 0,
    totalRetries: 0
  };

  class LidCacheManager {
    constructor() {
      this.cacheFile = path.join(process.cwd(), 'src', 'lidsresolve.json');
      this.cache = new Map();
      this.jidToLidMap = new Map();
      this.isDirty = false;
      this.loadCache();
      this.setupAutoSave();
    }

    loadCache() {
      try {
        if (fs.existsSync(this.cacheFile)) {
          const data = fs.readFileSync(this.cacheFile, 'utf8');
          const parsed = JSON.parse(data);
          
          for (const [key, entry] of Object.entries(parsed)) {
            if (entry && entry.jid && entry.lid && entry.timestamp) {
              this.cache.set(key, entry);
              if (entry.jid && entry.jid.includes('@s.whatsapp.net')) {
                this.jidToLidMap.set(entry.jid, entry.lid);
              }
            }
          }
        }
      } catch (error) {
        this.cache = new Map();
        this.jidToLidMap = new Map();
      }
    }

    saveCache() {
      try {
        const data = {};
        for (const [key, value] of this.cache.entries()) {
          data[key] = value;
        }
        fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
        this.isDirty = false;
      } catch (error) {
        // Error silencioso
      }
    }

    setupAutoSave() {
      setInterval(() => {
        if (this.isDirty) {
          this.saveCache();
        }
      }, 30000);

      const gracefulSave = () => {
        if (this.isDirty) {
          this.saveCache();
        }
      };

      process.on('SIGINT', gracefulSave);
      process.on('SIGTERM', gracefulSave);
      process.on('exit', gracefulSave);
    }

    getUserInfo(lidKey) {
      return this.cache.get(lidKey) || null;
    }

    getUserInfoByJid(jid) {
      for (const [key, entry] of this.cache.entries()) {
        if (entry && entry.jid === jid) {
          return entry;
        }
      }
      return null;
    }

    findLidByJid(jid) {
      return this.jidToLidMap.get(jid) || null;
    }

    async resolveLid(lidJid, groupChatId) {
      if (!lidJid.endsWith('@lid')) {
        return lidJid.includes('@') ? lidJid : `${lidJid}@s.whatsapp.net`;
      }

      const lidKey = lidJid.split('@')[0];
      
      if (this.cache.has(lidKey)) {
        const entry = this.cache.get(lidKey);
        if (entry.jid && !entry.notFound && !entry.error) {
          return entry.jid;
        }
      }

      for (const [cachedLid, cachedEntry] of this.cache.entries()) {
        if (cachedEntry && cachedEntry.jid && !cachedEntry.notFound && !cachedEntry.error) {
          const cachedNumber = cachedEntry.jid.split('@')[0];
          if (cachedNumber === lidKey) {
            return cachedEntry.jid;
          }
        }
      }

      if (lidResolver && groupChatId?.endsWith('@g.us')) {
        try {
          const resolved = await lidResolver.resolveLid(lidJid, groupChatId);
          if (resolved && resolved !== lidJid && !resolved.endsWith('@lid')) {
            const resolvedNumber = resolved.split('@')[0];
            const newEntry = {
              jid: resolved,
              lid: lidJid,
              name: resolvedNumber,
              timestamp: Date.now(),
              fromStore: true
            };
            this.cache.set(lidKey, newEntry);
            this.jidToLidMap.set(resolved, lidJid);
            this.isDirty = true;
            
            return resolved;
          }
        } catch (error) {
          // Error silencioso
        }
      }

      if (/^\d{10,15}$/.test(lidKey)) {
        const standardJid = `${lidKey}@s.whatsapp.net`;
        
        const tentativeEntry = {
          jid: standardJid,
          lid: lidJid,
          name: lidKey,
          timestamp: Date.now(),
          tentative: true,
          fromStore: true
        };
        this.cache.set(lidKey, tentativeEntry);
        this.jidToLidMap.set(standardJid, lidJid);
        this.isDirty = true;
        
        return standardJid;
      }

      return lidJid;
    }
  }

  const lidCacheManager = new LidCacheManager();

  function decodeJidSafe(jid) {
    try {
      if (!jid) return jid;
      if (typeof jid === 'object' && typeof jid.decodeJid === 'function') {
        return jid.decodeJid();
      }
      return jid;
    } catch (e) {
      return jid;
    }
  }

  async function processTextMentions(text, groupId) {
    if (!text || !groupId || !text.includes('@')) return text;

    try {
      const mentionRegex = /@(\d{8,20})/g;
      const mentions = [...text.matchAll(mentionRegex)];

      if (!mentions.length) return text;

      let processedText = text;
      const processedMentions = new Set();
      const replacements = new Map();

      for (const mention of mentions) {
        const [fullMatch, lidNumber] = mention;
        
        if (processedMentions.has(lidNumber)) continue;
        processedMentions.add(lidNumber);
        
        const lidJid = `${lidNumber}@lid`;

        try {
          const resolvedJid = await lidCacheManager.resolveLid(lidJid, groupId);
          
          if (resolvedJid && resolvedJid !== lidJid && !resolvedJid.endsWith('@lid')) {
            const resolvedNumber = resolvedJid.split('@')[0];
            
            if (resolvedNumber && resolvedNumber !== lidNumber && /^\d+$/.test(resolvedNumber)) {
              replacements.set(lidNumber, resolvedNumber);
            }
          }
        } catch (error) {
        }
      }

      for (const [lidNumber, resolvedNumber] of replacements.entries()) {
        const safeRegex = new RegExp(`@${escapeRegExp(lidNumber)}\\b`, 'g');
        processedText = processedText.replace(safeRegex, `@${resolvedNumber}`);
      }

      return processedText;
    } catch (error) {
      return text;
    }
  }

  async function processContextInfo(contextInfo, groupChatId) {
    if (!contextInfo || typeof contextInfo !== 'object') return;

    if (contextInfo.mentionedJid && Array.isArray(contextInfo.mentionedJid)) {
      const resolvedMentions = [];
      for (const jid of contextInfo.mentionedJid) {
        if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
          try {
            const resolved = await lidCacheManager.resolveLid(jid, groupChatId);
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

    if (typeof contextInfo.participant === 'string' && contextInfo.participant.endsWith?.('@lid')) {
      try {
        const resolved = await lidCacheManager.resolveLid(contextInfo.participant, groupChatId);
        if (resolved && !resolved.endsWith('@lid')) {
          contextInfo.participant = resolved;
        }
      } catch (error) {
      }
    }

    if (contextInfo.quotedMessage) {
      await processMessageContent(contextInfo.quotedMessage, groupChatId);
    }
  }

  async function processMessageContent(messageContent, groupChatId) {
    if (!messageContent || typeof messageContent !== 'object') return;

    const messageTypes = Object.keys(messageContent);
    
    for (const msgType of messageTypes) {
      const msgContent = messageContent[msgType];
      if (!msgContent || typeof msgContent !== 'object') continue;

      if (typeof msgContent.text === 'string' && msgContent.text.trim()) {
        try {
          const processedText = await processTextMentions(msgContent.text, groupChatId);
          if (processedText !== msgContent.text) {
            msgContent.text = processedText;
          }
        } catch (error) {
        }
      }

      if (typeof msgContent.caption === 'string' && msgContent.caption.trim()) {
        try {
          const processedCaption = await processTextMentions(msgContent.caption, groupChatId);
          if (processedCaption !== msgContent.caption) {
            msgContent.caption = processedCaption;
          }
        } catch (error) {
        }
      }

      if (msgContent.contextInfo) {
        await processContextInfo(msgContent.contextInfo, groupChatId);
      }
    }
  }

  async function processMessageLids(message) {
    try {
      if (!message || !message.key) return message;
      
      const groupChatId = message.key.remoteJid?.endsWith?.('@g.us') ? message.key.remoteJid : null;
      if (!groupChatId) return message;

      const processedMessage = JSON.parse(JSON.stringify(message));

      if (processedMessage.key?.participant?.endsWith?.('@lid')) {
        try {
          const resolved = await lidCacheManager.resolveLid(processedMessage.key.participant, groupChatId);
          if (resolved && resolved !== processedMessage.key.participant && !resolved.endsWith('@lid')) {
            processedMessage.key.participant = resolved;
          }
        } catch (error) {
        }
      }

      if (processedMessage.mentionedJid && Array.isArray(processedMessage.mentionedJid)) {
        const resolvedMentions = [];
        for (const jid of processedMessage.mentionedJid) {
          if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
            try {
              const resolved = await lidCacheManager.resolveLid(jid, groupChatId);
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

      if (processedMessage.message) {
        await processMessageContent(processedMessage.message, groupChatId);
      }

      return processedMessage;
    } catch (err) {
      return message;
    }
  }

  function extractRealJid(messageAttrs) {
    try {
      if (!messageAttrs) return null;
      if (messageAttrs.participant_pn) {
        return messageAttrs.participant_pn;
      }
      if (messageAttrs.participant && messageAttrs.participant.endsWith?.('@lid')) {
        const lidPart = messageAttrs.participant.split(':')[0];
        if (lidPart) {
          const numberPart = lidPart.split(':')[0];
          return `${numberPart}@s.whatsapp.net`;
        }
      }
      return messageAttrs.participant;
    } catch (error) {
      return messageAttrs?.participant;
    }
  }

  async function handleLidMessage(messageNode, isRetry = false) {
    if (!messageNode || !messageNode.attrs) return null;
    const attrs = messageNode.attrs;
    const messageId = attrs.id;
    const groupJid = attrs.from;
    const lidParticipant = attrs.participant;
    const realJid = extractRealJid(attrs);

    let resolved = lidParticipant;
    if (lidParticipant?.endsWith?.('@lid')) {
      const maybe = await lidCacheManager.resolveLid(lidParticipant, groupJid);
      if (maybe && !maybe.endsWith?.('@lid')) {
        resolved = maybe;
      } else if (realJid) {
        resolved = realJid;
      } else {
        resolved = maybe;
      }
    } else {
      resolved = realJid || lidParticipant;
    }

    const messageTimestamp = parseInt(attrs.t || `${Math.floor(Date.now() / 1000)}`);

    return {
      key: { 
        remoteJid: groupJid, 
        fromMe: true, 
        id: messageId, 
        participant: resolved || realJid 
      },
      messageTimestamp,
      pushName: attrs.notify || 'Usuario Web',
      message: {
        conversation: isRetry 
          ? `🔄 Reintentando descifrar mensaje web... (${(pendingDecryption.get(messageId)?.retryCount || 0)})`
          : '🌐 Mensaje desde Web/Desktop - Procesando...'
      },
      messageStubType: proto.WebMessageInfo.StubType?.CIPHERTEXT || WAMessageStubType.CIPHERTEXT,
      status: proto.WebMessageInfo.Status?.PENDING || 0,
      _isLidWebMessage: true,
      _originalNode: messageNode,
      _resolvedJid: resolved,
      _realJid: realJid,
      _retryCount: isRetry ? (pendingDecryption.get(messageId)?.retryCount || 0) + 1 : 0
    };
  }

  function waitForWsReady(timeout = WS_WAIT_TIMEOUT) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        try {
          if (conn && conn.ws && conn.ws.readyState === 1) return resolve(true);
          if (Date.now() - start > timeout) return resolve(false);
          setTimeout(check, WS_WAIT_STEP);
        } catch (e) {
          return resolve(false);
        }
      };
      check();
    });
  }

  async function retryLidDecryption(messageId, originalNode, retryCount = 0) {
    try {
      if (retryCount >= MAX_RETRIES) {
        errorStats.lidDecryptionErrors++;
        const errorMessage = await handleLidMessage(originalNode, true);
        if (errorMessage) {
          errorMessage.message.conversation = '⚠️ No se pudo descifrar el mensaje web';
          errorMessage.status = proto.WebMessageInfo.Status?.ERROR || 0;
          errorMessage._finalError = true;
        }
        pendingDecryption.delete(messageId);
        return errorMessage;
      }

      errorStats.totalRetries++;
      const pending = pendingDecryption.get(messageId) || {};
      pending.retryCount = retryCount + 1;
      pending.lastRetry = Date.now();
      pending.originalNode = originalNode;
      pendingDecryption.set(messageId, pending);

      const waitMs = RETRY_DELAY * (retryCount + 1);

      setTimeout(async () => {
        try {
          const wsReady = await waitForWsReady();
          if (!wsReady) {
            setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), 
              RETRY_DELAY * (retryCount + 2));
            return;
          }

          const groupJid = originalNode.attrs.from;
          const participantJid = extractRealJid(originalNode.attrs);

          let attemptOk = false;
          for (let attempt = 1; attempt <= SEND_RETRY_ATTEMPTS_PER_CYCLE; attempt++) {
            try {
              if (typeof conn.sendRetryRequest === 'function') {
                await conn.sendRetryRequest(groupJid, messageId, participantJid);
                attemptOk = true;
                break;
              } else {
                break;
              }
            } catch (retryErr) {
              await new Promise(r => setTimeout(r, 300));
            }
          }

          setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), 
            RETRY_DELAY * (retryCount + 2));
        } catch (err) {
          setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), 
            RETRY_DELAY * (retryCount + 2));
        }
      }, waitMs);

      return await handleLidMessage(originalNode, true);
    } catch (err) {
      return null;
    }
  }

  function loadMessage(jid, id = null) {
    try {
      if (!jid) return null;
      const realJid = decodeJidSafe(jid);
      if (!id) {
        const filter = m => m?.key?.id === jid;
        const found = Object.entries(messages).find(([, msgs]) => msgs.find(filter));
        return found?.[1]?.find(filter) || null;
      } else {
        if (!(realJid in messages)) return null;
        return messages[realJid]?.find(m => m.key.id === id) || null;
      }
    } catch (err) {
      return null;
    }
  }

  function isJidGroup(jid) {
    jid = decodeJidSafe(jid);
    return jid && jid.endsWith?.('@g.us');
  }

  async function fetchGroupMetadata(jid, groupMetadataFunc) {
    try {
      jid = decodeJidSafe(jid);
      if (!isJidGroup(jid)) return;
      if (!(jid in chats)) chats[jid] = { id: jid };
      const isRequiredToUpdate = !chats[jid].metadata || Date.now() - (chats[jid].lastfetch || 0) > TIME_TO_DATA_STALE;
      if (isRequiredToUpdate) {
        try {
          const metadata = await groupMetadataFunc?.(jid);
          if (metadata) {
            Object.assign(chats[jid], { 
              subject: metadata.subject, 
              lastfetch: Date.now(), 
              metadata 
            });
          }
        } catch (err) {
          // Error silencioso
        }
      }
      return chats[jid].metadata;
    } catch (err) {
      // Error silencioso
    }
  }

  function upsertMessage(jid, message, type = 'append') {
    try {
      jid = decodeJidSafe(jid);
      if (!jid) return;
      if (!(jid in messages)) messages[jid] = [];

      delete message.message?.messageContextInfo;
      delete message.message?.senderKeyDistributionMessage;

      const existing = loadMessage(jid, message.key.id);
      if (existing) {
        if ((existing._isLidWebMessage || existing._lidDecryptError) && !message._isLidWebMessage && message.message && !message._finalError) {
          Object.assign(existing, message);
          delete existing._isLidWebMessage;
          delete existing._lidDecryptError;
          delete existing._retryCount;
          delete existing._originalNode;
          pendingDecryption.delete(message.key.id);
          errorStats.successfulRetries++;
        } else {
          Object.assign(existing, message);
        }
      } else {
        if (type === 'append') {
          messages[jid].push(message);
        } else {
          messages[jid].unshift(message);
        }
      }
    } catch (err) {
    }
  }

  function bind(connection) {
    conn = connection;
    
    // ربط كائن chats مباشرة مع conn.chats
    Object.assign(conn, { chats, messages, contacts });

    lidResolver = new LidResolver(conn);

    try {
      if (conn.ws && typeof conn.ws.on === 'function') {
        const originalOn = conn.ws.on.bind(conn.ws);
        conn.ws.on = function (event, handler) {
          if (event === 'CB:message') {
            const wrappedCBHandler = async function (node) {
              try {
                if (node && node.attrs && node.attrs.addressing_mode === 'lid') {
                  try {
                    const placeholder = await handleLidMessage(node);
                    if (placeholder) {
                      const jid = node.attrs.from;
                      upsertMessage(jid, proto.WebMessageInfo.fromObject(placeholder), 'append');
                      pendingDecryption.set(node.attrs.id, { 
                        originalNode: node, 
                        retryCount: 0, 
                        lastRetry: Date.now() 
                      });
                      setTimeout(() => retryLidDecryption(node.attrs.id, node, 0), 500);
                    }
                  } catch (inner) {
                  }
                }
              } catch (e) {
              }
              return handler(node);
            };
            return originalOn(event, wrappedCBHandler);
          }

          if (event === 'message') {
            const wrappedHandler = async function (data) {
              try {
                return await handler(data);
              } catch (error) {
                try {
                  if (error && typeof error.message === 'string' && 
                      error.message.includes('error in handling message') && 
                      data?.attrs?.addressing_mode === 'lid') {
                    errorStats.webDesktopErrors++;
                    const placeholder = await handleLidMessage(data);
                    if (placeholder) {
                      const jid = data.attrs.from;
                      upsertMessage(jid, proto.WebMessageInfo.fromObject(placeholder), 'append');
                      pendingDecryption.set(data.attrs.id, { 
                        originalNode: data, 
                        retryCount: 0, 
                        lastRetry: Date.now() 
                      });
                      setTimeout(() => retryLidDecryption(data.attrs.id, data, 0), 500);
                    }
                    return;
                  }
                } catch (inner) {
                }
                throw error;
              }
            };
            return originalOn(event, wrappedHandler);
          }

          return originalOn(event, handler);
        };
      }
    } catch (err) {
    }

    conn.ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
      try {
        if (!['append', 'notify'].includes(type)) return;
        
        const processedMessages = [];
        
        for (const msg of newMessages) {
          try {
            const jid = decodeJidSafe(msg.key.remoteJid);
            if (!jid || isJidBroadcast(jid)) continue;

            if (pendingDecryption.has(msg.key.id)) {
              pendingDecryption.delete(msg.key.id);
              errorStats.successfulRetries++;
            }

            let processed = msg;
            
            try {
              processed = await processMessageLids(msg);
            } catch (mErr) {
              console.error('❌ Error in processMessageLids:', mErr);
            }
            
            if (jid.endsWith('@g.us')) {
              try {
                const messageText = extractAllTextFromMessage(processed);
                if (messageText && /(@\d{8,20})/.test(messageText)) {
                  console.log(`⚠️ Mensaje con posibles LIDs sin resolver en ${jid}`);
                  
                  const additionalProcessed = await processMessageLids(processed);
                  if (JSON.stringify(additionalProcessed) !== JSON.stringify(processed)) {
                    processed = additionalProcessed;
                  }
                }
              } catch (verifyErr) {
              }
            }

            upsertMessage(jid, proto.WebMessageInfo.fromObject(processed), type);
            processedMessages.push(processed);
          } catch (mErr) {
            try {
              const jid = decodeJidSafe(msg.key.remoteJid);
              upsertMessage(jid, proto.WebMessageInfo.fromObject(msg), type);
              processedMessages.push(msg);
            } catch (_) {
            }
          }
        }
        
        if (processedMessages.length > 0) {
          const groupMessages = processedMessages.filter(m => m.key?.remoteJid?.endsWith('@g.us'));
          if (groupMessages.length > 0) {
            console.log(`📨 Processed ${groupMessages.length} group messages`);
          }
        }
      } catch (outer) {
        console.error('❌ Error in messages.upsert handler:', outer);
      }
    });

    conn.ev.on('messages.update', async updates => {
      try {
        for (const { key, update } of updates) {
          try {
            const jid = decodeJidSafe(key.remoteJid);
            const message = loadMessage(jid, key.id);
            if (message) {
              if ((message._isLidWebMessage || pendingDecryption.has(key.id)) && update.message) {
                const processedUpdate = await processMessageLids({ key, ...update });
                Object.assign(message, processedUpdate);
                delete message._isLidWebMessage;
                delete message._retryCount;
                delete message._originalNode;
                pendingDecryption.delete(key.id);
                errorStats.successfulRetries++;
              } else {
                const processedUpdate = await processMessageLids({ key, ...update });
                Object.assign(message, processedUpdate);
              }
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
    });

    conn.ev.on('message-receipt.update', updates => {
      try {
        for (const { key, receipt } of updates) {
          try {
            const jid = decodeJidSafe(key.remoteJid);
            const message = loadMessage(jid, key.id);
            if (message) {
              updateMessageWithReceipt(message, receipt);
            }
          } catch (e) {
          }
        }
      } catch (e) {
      }
    });

    conn.ev.on('chats.set', ({ chats: newChats }) => {
      for (const chat of newChats) {
        const jid = decodeJidSafe(chat.id);
        if (!(jid in chats)) chats[jid] = { id: jid };
        Object.assign(chats[jid], chat);
      }
    });

    conn.ev.on('contacts.set', ({ contacts: newContacts }) => {
      for (const contact of newContacts) {
        const jid = decodeJidSafe(contact.id);
        if (!(jid in contacts)) contacts[jid] = { id: jid };
        Object.assign(contacts[jid], contact);
        if (!(jid in chats)) chats[jid] = { id: jid };
        Object.assign(chats[jid], contact);
      }
    });

    conn.ev.on('chats.upsert', newChats => {
      for (const chat of newChats) {
        const jid = decodeJidSafe(chat.id);
        if (!(jid in chats)) chats[jid] = { id: jid };
        Object.assign(chats[jid], chat);
      }
    });

    conn.ev.on('chats.update', updates => {
      for (const update of updates) {
        const jid = decodeJidSafe(update.id);
        if (!(jid in chats)) chats[jid] = { id: jid };
        Object.assign(chats[jid], update);
      }
    });

    conn.ev.on('presence.update', ({ id, presences: updates }) => {
      const jid = decodeJidSafe(id);
      if (!(jid in chats)) chats[jid] = { id: jid };
      Object.assign(chats[jid], { 
        presences: { 
          ...(chats[jid].presences || {}), 
          ...updates 
        } 
      });
    });

    conn.ev.on('groups.update', async (updates) => {
      for (const update of updates) {
        const jid = decodeJidSafe(update.id);
        if (!jid || !isJidGroup(jid)) continue;
        if (!(jid in chats)) chats[jid] = { id: jid };
        Object.assign(chats[jid], update);
        try {
          const metadata = await conn.groupMetadata(jid).catch(() => null);
          if (metadata) {
            chats[jid].metadata = metadata;
            chats[jid].subject = metadata.subject;
          }
        } catch (_) {
        }
      }
    });

    conn.ev.on('group-participants.update', async ({ id, participants, action }) => {
      if (!id) return;
      const jid = decodeJidSafe(id);
      if (!isJidGroup(jid)) return;
      if (!(jid in chats)) chats[jid] = { id: jid };
      chats[jid].isChats = true;
      try {
        const metadata = await conn.groupMetadata(jid).catch(() => null);
        if (metadata) {
          chats[jid].metadata = metadata;
          chats[jid].subject = metadata.subject;
        }
      } catch (_) {
      }
    });

  }

  function getErrorStats() {
    return {
      ...errorStats,
      pendingDecryption: pendingDecryption.size,
      cacheSize: lidCacheManager.cache.size,
      jidMappings: lidCacheManager.jidToLidMap.size
    };
  }

  function cleanupPendingMessages() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let cleaned = 0;
    for (const [messageId, data] of pendingDecryption.entries()) {
      if (data.lastRetry && data.lastRetry < oneHourAgo) {
        pendingDecryption.delete(messageId);
        cleaned++;
      }
    }
    return cleaned;
  }

  setInterval(cleanupPendingMessages, 30 * 60 * 1000);

  function toJSON() {
    return { chats, messages, contacts };
  }

  function fromJSON(json) {
    Object.assign(chats, json.chats || {});
    Object.assign(contacts, json.contacts || {});
    for (const jid in json.messages || {}) {
      messages[jid] = (json.messages[jid] || [])
        .map(m => m && proto.WebMessageInfo.fromObject(m))
        .filter(Boolean);
    }
  }

  return {
    bind,
    loadMessage,
    toJSON,
    fromJSON,
    upsertMessage,
    fetchGroupMetadata: (jid) => fetchGroupMetadata(jid, conn?.groupMetadata),
    chats,
    messages,
    contacts,
    lidResolver: {
      async resolve(lidJid, groupChatId) { 
        return await lidCacheManager.resolveLid(lidJid, groupChatId);
      },
      add(lidKey, jid, name = null) {
        if (lidCacheManager.cache.has(lidKey)) return;
        const entry = { 
          jid, 
          lid: `${lidKey}@lid`, 
          name: name || jid.split('@')[0], 
          timestamp: Date.now(), 
          manual: true 
        };
        lidCacheManager.cache.set(lidKey, entry);
        lidCacheManager.jidToLidMap.set(jid, `${lidKey}@lid`);
        lidCacheManager.isDirty = true;
      },
      get cache() { 
        return lidCacheManager.cache; 
      },
      getStats() { 
        return getErrorStats(); 
      },
      forceSave() { 
        lidCacheManager.saveCache(); 
      },
      forceRetryPending() {
        let retriedCount = 0;
        for (const [messageId, data] of pendingDecryption.entries()) {
          if (data.originalNode) {
            setTimeout(() => retryLidDecryption(messageId, data.originalNode, 0), 
              retriedCount * 1000);
            retriedCount++;
          }
        }
        return retriedCount;
      },
      clearErrors() {
        const cleared = {
          pendingDecryption: pendingDecryption.size,
          errorStats: { ...errorStats }
        };
        pendingDecryption.clear();
        errorStats = {
          lidDecryptionErrors: 0,
          webDesktopErrors: 0,
          successfulRetries: 0,
          totalRetries: 0
        };
        return cleared;
      },
      getStatus() {
        return {
          lidCache: lidCacheManager.cache.size,
          jidMappings: lidCacheManager.jidToLidMap.size,
          pendingDecryption: pendingDecryption.size,
          errorStats,
          isDirty: lidCacheManager.isDirty,
          cacheFile: lidCacheManager.cacheFile
        };
      }
    },
    getErrorStats,
    cleanupPendingMessages,
    
    processTextMentions,
    processMessageLids,
    extractAllTextFromMessage
  };
}

export default makeInMemoryStore();
