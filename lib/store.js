/*
store.js المحسن
*/

import fs from 'fs';
import path from 'path';

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

// تفعيل/تعطيل سجلات التصحيح
const DEBUG_MODE = 'false';

// Timeouts / retries
const TIME_TO_DATA_STALE = 5 * 60 * 1000;
const RETRY_DELAY = 1000; // ms base
const MAX_RETRIES = 3;
const WS_WAIT_TIMEOUT = 30000; // ms
const WS_WAIT_STEP = 300; // ms
const SEND_RETRY_ATTEMPTS_PER_CYCLE = 2;

function makeInMemoryStore() {
  // -------------------------
  // الحالة الداخلية
  // -------------------------
  let chats = {};
  let messages = {};
  let contacts = {};
  let state = { connection: 'close' };
  let conn = null;

  const cacheFile = path.join(process.cwd(), 'src/lidsresolve.json');
  let lidCache = new Map();
  let jidToLidMap = new Map();
  let isDirty = false;
  let saveTimeout = null;
  const pendingDecryption = new Map();

  let errorStats = {
    lidDecryptionErrors: 0,
    webDesktopErrors: 0,
    successfulRetries: 0,
    totalRetries: 0
  };

  // -------------------------
  // pino / stdout intercept
  // -------------------------
  // تم ترك هذا الجزء كما هو، لأنه يعمل بشكل جيد وفعال.

  let stdoutBuffer = '';
  let stderrBuffer = '';
  let pinoLineHandler = null;

  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...args) => {
    try {
      const s = chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk);
      stdoutBuffer += s;
      let newlineIndex;
      while ((newlineIndex = stdoutBuffer.indexOf('\n')) >= 0) {
        const line = stdoutBuffer.slice(0, newlineIndex);
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
        try {
          const obj = JSON.parse(line);
          if (pinoLineHandler) {
            try { pinoLineHandler(obj, line); } catch (e) {}
          }
        } catch (e) {
          // not JSON
        }
        origStdoutWrite(line + '\n', ...args);
      }
    } catch (e) {
      try { origStdoutWrite(chunk, ...args); } catch (e) {}
    }
  };

  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, ...args) => {
    try {
      const s = chunk instanceof Buffer ? chunk.toString('utf8') : String(chunk);
      stderrBuffer += s;
      let newlineIndex;
      while ((newlineIndex = stderrBuffer.indexOf('\n')) >= 0) {
        const line = stderrBuffer.slice(0, newlineIndex);
        stderrBuffer = stderrBuffer.slice(newlineIndex + 1);
        try {
          const obj = JSON.parse(line);
          if (pinoLineHandler) {
            try { pinoLineHandler(obj, line); } catch (e) {}
          }
        } catch (e) {
          // not JSON
        }
        origStderrWrite(line + '\n', ...args);
      }
    } catch (e) {
      try { origStderrWrite(chunk, ...args); } catch (e) {}
    }
  };

  // -------------------------
  // Utilities
  // -------------------------
  function decodeJidSafe(jid) {
    try {
      if (!jid) return jid;
      if (typeof jid === 'object' && typeof jid.decodeJid === 'function') return jid.decodeJid();
      return jid;
    } catch (e) {
      return jid;
    }
  }

  // -------------------------
  // Cache LID
  // -------------------------
  function loadLidCache() {
    try {
      if (fs.existsSync(cacheFile)) {
        const data = fs.readFileSync(cacheFile, 'utf8');
        const parsed = JSON.parse(data);
        for (const [key, entry] of Object.entries(parsed)) {
          if (entry && entry.jid && entry.lid) {
            lidCache.set(key, entry);
            jidToLidMap.set(entry.jid, entry.lid);
          }
        }
        if (DEBUG_MODE) console.log(`[LID-DEBUG] Cache LID loaded: ${lidCache.size} entries (${cacheFile})`);
      } else {
        if (DEBUG_MODE) console.log(`[LID-DEBUG] ${cacheFile} does not exist, starting with empty cache`);
      }
    } catch (err) {
      console.error('[LID-DEBUG] Error loading LID cache:', err);
      lidCache = new Map();
      jidToLidMap = new Map();
    }
  }

  // تحسين: استخدام debouncing لمنع عمليات الحفظ المتكررة
  function saveLidCache() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const data = {};
        for (const [key, value] of lidCache.entries()) data[key] = value;
        fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
        isDirty = false;
        if (DEBUG_MODE) console.log(`[LID-DEBUG] LID Cache saved (${lidCache.size} entries) -> ${cacheFile}`);
      } catch (err) {
        console.error('[LID-DEBUG] Error saving LID cache:', err);
      }
    }, 1000); // تأخير 1 ثانية قبل الحفظ
  }

  // -------------------------
  // Resolver LID
  // -------------------------
  async function resolveLidFromCache(lidJid, groupChatId) {
    try {
      if (DEBUG_MODE) console.log(`[LID-DEBUG] Resolving LID: ${lidJid} (group: ${groupChatId})`);
      if (!lidJid || !lidJid.endsWith?.('@lid')) {
        if (DEBUG_MODE) console.log(`[LID-DEBUG] Does not look like LID, returning: ${lidJid}`);
        return lidJid && lidJid.includes('@') ? lidJid : (lidJid ? `${lidJid}@s.whatsapp.net` : lidJid);
      }
      const lidKey = lidJid.split('@')[0];

      if (lidCache.has(lidKey)) {
        const cached = lidCache.get(lidKey);
        if (DEBUG_MODE) console.log(`[LID-DEBUG] Found in cache: ${JSON.stringify(cached)}`);
        if (cached.jid && !cached.jid.endsWith('@lid')) return cached.jid;
      } else if (DEBUG_MODE) console.log(`[LID-DEBUG] No cache entry for lidKey=${lidKey}`);

      for (const [jid, lid] of jidToLidMap.entries()) {
        if (lid === lidJid) {
          if (DEBUG_MODE) console.log(`[LID-DEBUG] Found in jidToLidMap: ${jid} -> ${lid}`);
          return jid;
        }
      }

      if (conn && groupChatId && groupChatId.endsWith?.('@g.us')) {
        try {
          if (DEBUG_MODE) console.log(`[LID-DEBUG] Attempting groupMetadata(${groupChatId}) to resolve LID...`);
          const metadata = await conn.groupMetadata(groupChatId).catch(e => { throw e; });
          const participants = metadata?.participants || [];
          if (DEBUG_MODE) console.log(`[LID-DEBUG] metadata.participants length=${participants.length}`);
          for (const p of participants) {
            try {
              const numberFromParticipant = p.jid?.split?.('@')?.[0];
              if (!numberFromParticipant) continue;
              if (lidKey.includes(numberFromParticipant) || numberFromParticipant.includes(lidKey.split(':')[0])) {
                const entry = { jid: p.jid, lid: lidJid, name: p.jid.split('@')[0], timestamp: Date.now(), groupJid };
                lidCache.set(lidKey, entry);
                jidToLidMap.set(p.jid, lidJid);
                saveLidCache(); // استخدام الدالة المحسنة
                if (DEBUG_MODE) console.log(`[LID-DEBUG] Resolved by metadata: ${lidJid} -> ${p.jid}`);
                return p.jid;
              }
            } catch (_) { continue; }
          }
        } catch (e) {
          console.error(`[LID-DEBUG] Error querying metadata: ${e.message}`);
        }
      }

      if (DEBUG_MODE) console.log(`[LID-DEBUG] Not resolved, fallback -> ${lidJid}`);
      return lidJid;
    } catch (err) {
      console.error('[LID-DEBUG] Error in resolveLidFromCache:', err);
      return lidJid;
    }
  }

  // -------------------------
  // extractRealJid (participant_pn priority)
  // -------------------------
  function extractRealJid(messageAttrs) {
    try {
      if (!messageAttrs) return null;
      if (messageAttrs.participant_pn) {
        if (DEBUG_MODE) console.log(`[LID-DEBUG] extractRealJid: using participant_pn = ${messageAttrs.participant_pn}`);
        return messageAttrs.participant_pn;
      }
      if (messageAttrs.participant && messageAttrs.participant.endsWith?.('@lid')) {
        const lidPart = messageAttrs.participant.split('@')[0];
        if (lidPart.includes(':')) {
          const numberPart = lidPart.split(':')[0];
          if (DEBUG_MODE) console.log(`[LID-DEBUG] extractRealJid: built from lidPart => ${numberPart}@s.whatsapp.net`);
          return `${numberPart}@s.whatsapp.net`;
        }
      }
      return messageAttrs.participant;
    } catch (err) {
      console.error('[LID-DEBUG] Error in extractRealJid:', err);
      return messageAttrs?.participant;
    }
  }

  // -------------------------
  // handleLidMessage - creates placeholder
  // -------------------------
  async function handleLidMessage(messageNode, isRetry = false) {
    if (!messageNode || !messageNode.attrs) return null;
    const attrs = messageNode.attrs;
    const messageId = attrs.id;
    const groupJid = attrs.from;
    const lidParticipant = attrs.participant;
    const realJid = extractRealJid(attrs);

    if (DEBUG_MODE) console.log(`[LID-DEBUG] handleLidMessage: id=${messageId} group=${groupJid} lidParticipant=${lidParticipant} realJid=${realJid} retry=${isRetry}`);

    let resolved = lidParticipant;
    if (lidParticipant?.endsWith?.('@lid')) {
      const maybe = await resolveLidFromCache(lidParticipant, groupJid);
      if (maybe && !maybe.endsWith?.('@lid')) resolved = maybe;
      else if (realJid) resolved = realJid;
      else resolved = maybe;
      if (DEBUG_MODE) console.log(`[LID-DEBUG] handleLidMessage: resolvedCandidate=${maybe} finalResolved=${resolved}`);
    } else {
      resolved = realJid || lidParticipant;
    }

    const messageTimestamp = parseInt(attrs.t || `${Math.floor(Date.now() / 1000)}`);

    const placeholder = {
      key: { remoteJid: groupJid, fromMe: false, id: messageId, participant: resolved || realJid },
      messageTimestamp,
      pushName: attrs.notify || 'Web User',
      message: {
        conversation: isRetry ? `🔄 Retrying web message decryption... (${(pendingDecryption.get(messageId)?.retryCount || 0)})` : '🌐 Web/Desktop Message - Processing...'
      },
      messageStubType: proto.WebMessageInfo.StubType?.CIPHERTEXT || WAMessageStubType.CIPHERTEXT,
      status: proto.WebMessageInfo.Status?.PENDING || 0,
      _isLidWebMessage: true,
      _originalNode: messageNode,
      _resolvedJid: resolved,
      _realJid: realJid,
      _retryCount: isRetry ? (pendingDecryption.get(messageId)?.retryCount || 0) + 1 : 0
    };

    if (DEBUG_MODE) console.log(`[LID-DEBUG] Created placeholder for id=${messageId} participant=${placeholder.key.participant}`);
    return placeholder;
  }

  // -------------------------
  // waitForWsReady (waits for ws.readyState === 1)
  // -------------------------
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

  // -------------------------
  // retryLidDecryption: waits for ws, retries sendRetryRequest
  // -------------------------
  async function retryLidDecryption(messageId, originalNode, retryCount = 0) {
    try {
      if (DEBUG_MODE) console.log(`[LID-DEBUG] retryLidDecryption: id=${messageId} retry=${retryCount}`);
      if (retryCount >= MAX_RETRIES) {
        if (DEBUG_MODE) console.log(`[LID-DEBUG] Max retries reached for ${messageId}`);
        errorStats.lidDecryptionErrors++;
        const errorMessage = await handleLidMessage(originalNode, true);
        if (errorMessage) {
          errorMessage.message.conversation = '❌ Failed to decrypt web message';
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
      if (DEBUG_MODE) console.log(`[LID-DEBUG] Scheduling retry in ${waitMs}ms for id=${messageId}`);

      setTimeout(async () => {
        try {
          const wsReady = await waitForWsReady();
          if (!wsReady) {
            if (DEBUG_MODE) console.log(`[LID-DEBUG] ws not ready after waiting; rescheduling for id=${messageId}`);
            setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), RETRY_DELAY * (retryCount + 2));
            return;
          }

          const groupJid = originalNode.attrs.from;
          const participantJid = extractRealJid(originalNode.attrs);
          if (DEBUG_MODE) console.log(`[LID-DEBUG] ws ready — attempting sendRetryRequest for id=${messageId} group=${groupJid} participant=${participantJid}`);

          let attemptOk = false;
          for (let attempt = 1; attempt <= SEND_RETRY_ATTEMPTS_PER_CYCLE; attempt++) {
            try {
              if (typeof conn.sendRetryRequest === 'function') {
                if (DEBUG_MODE) console.log(`[LID-DEBUG] sendRetryRequest: attempt ${attempt}/${SEND_RETRY_ATTEMPTS_PER_CYCLE} for id=${messageId}`);
                await conn.sendRetryRequest(groupJid, messageId, participantJid);
                attemptOk = true;
                if (DEBUG_MODE) console.log(`[LID-DEBUG] sendRetryRequest ok (attempt ${attempt}) for id=${messageId}`);
                break;
              } else {
                if (DEBUG_MODE) console.log('[LID-DEBUG] conn.sendRetryRequest not available');
                break;
              }
            } catch (retryErr) {
              console.error(`[LID-DEBUG] Error in sendRetryRequest attempt ${attempt}:`, retryErr);
              await new Promise(r => setTimeout(r, 300));
            }
          }

          if (!attemptOk) {
            if (DEBUG_MODE) console.log(`[LID-DEBUG] No sendRetryRequest attempt succeeded for id=${messageId} in this cycle`);
          }

          setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), RETRY_DELAY * (retryCount + 2));
        } catch (err) {
          console.error('[LID-DEBUG] Error in setTimeout of retryLidDecryption:', err);
          setTimeout(() => retryLidDecryption(messageId, originalNode, retryCount + 1), RETRY_DELAY * (retryCount + 2));
        }
      }, waitMs);

      return await handleLidMessage(originalNode, true);
    } catch (err) {
      console.error('[LID-DEBUG] Exception in retryLidDecryption:', err);
      return null;
    }
  }

  // -------------------------
  // processMessageLids (resolve LIDs inside decrypted messages)
  // -------------------------
  async function processMessageLids(message) {
    // تم ترك هذا الجزء كما هو، لأنه يؤدي وظيفته بشكل فعال
    try {
      if (!message || !message.key) return message;
      const groupChatId = message.key.remoteJid && message.key.remoteJid.endsWith?.('@g.us') ? message.key.remoteJid : null;
      if (!groupChatId) return message;
  
      const processedMessage = { ...message };
  
      if (processedMessage.key?.participant?.endsWith?.('@lid')) {
        const resolved = await resolveLidFromCache(processedMessage.key.participant, groupChatId);
        if (resolved && resolved !== processedMessage.key.participant) {
          if (DEBUG_MODE) console.log(`[LID-DEBUG] processMessageLids: replacing participant ${processedMessage.key.participant} -> ${resolved}`);
          processedMessage.key.participant = resolved;
        }
      }
  
      if (processedMessage.message) {
        const messageTypes = Object.keys(processedMessage.message);
        for (const msgType of messageTypes) {
          const msgContent = processedMessage.message[msgType];
          if (!msgContent) continue;
  
          if (msgContent?.contextInfo?.mentionedJid) {
            const resolvedMentions = [];
            for (const jid of msgContent.contextInfo.mentionedJid) {
              if (typeof jid === 'string' && jid.endsWith?.('@lid')) {
                const r = await resolveLidFromCache(jid, groupChatId);
                resolvedMentions.push(r);
                if (DEBUG_MODE) console.log(`[LID-DEBUG] Resolved mention ${jid} -> ${r}`);
              } else resolvedMentions.push(jid);
            }
            msgContent.contextInfo.mentionedJid = resolvedMentions;
          }
  
          if (msgContent?.contextInfo?.participant && msgContent.contextInfo.participant.endsWith?.('@lid')) {
            const r = await resolveLidFromCache(msgContent.contextInfo.participant, groupChatId);
            msgContent.contextInfo.participant = r;
            if (DEBUG_MODE) console.log(`[LID-DEBUG] Resolved contextInfo.participant -> ${r}`);
          }
        }
      }
      return processedMessage;
    } catch (err) {
      console.error('[LID-DEBUG] Error in processMessageLids:', err);
      return message;
    }
  }

  // -------------------------
  // loadMessage / upsertMessage / fetchGroupMetadata
  // -------------------------
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
      console.error('[STORE] Error loadMessage:', err);
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
          if (metadata) Object.assign(chats[jid], { subject: metadata.subject, lastfetch: Date.now(), metadata });
        } catch (err) { console.error('[STORE] Error fetchGroupMetadata:', err); }
      }
      return chats[jid].metadata;
    } catch (err) { console.error('[STORE] Error fetchGroupMetadata outer:', err); }
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
          if (DEBUG_MODE) console.log(`[LID-DEBUG] Replacing LID placeholder with real message: ${message.key.id}`);
          Object.assign(existing, message);
          delete existing._isLidWebMessage;
          delete existing._lidDecryptError;
          delete existing._retryCount;
          delete existing._originalNode;
          pendingDecryption.delete(message.key.id);
          errorStats.successfulRetries++;
        } else Object.assign(existing, message);
      } else {
        if (type === 'append') messages[jid].push(message);
        else messages[jid].unshift(message);
      }
    } catch (err) {
      console.error('[STORE] Error upsertMessage:', err);
    }
  }

  // -------------------------
  // bind(connection)
  // -------------------------
  function bind(connection) {
    conn = connection;
    if (!conn.chats) conn.chats = {};

    loadLidCache();

    try {
      if (conn.ev && typeof conn.ev.emit === 'function') {
        const originalEmit = conn.ev.emit.bind(conn.ev);
        conn.ev.emit = function(event, ...args) {
          try {
            if (event === 'connection.update' && args[0]?.lastDisconnect?.error?.message?.includes?.('error in handling message')) {
              if (DEBUG_MODE) console.log('[LID-DEBUG] connection.update intercepted: error in handling message (extra logging)');
            }
          } catch (e) {}
          return originalEmit(event, ...args);
        };
      }
    } catch (err) { console.error('[STORE] Error overwriting conn.ev.emit:', err); }

    try {
      if (conn.ws && typeof conn.ws.on === 'function') {
        const originalOn = conn.ws.on.bind(conn.ws);
        conn.ws.on = function(event, handler) {
          if (event === 'CB:message') {
            const wrappedCBHandler = async function(node) {
              try {
                if (node && node.attrs && node.attrs.addressing_mode === 'lid') {
                  if (DEBUG_MODE) console.log('[LID-DEBUG] Message with addressing_mode=lid detected (CB:message)');
                  try {
                    const messageId = node.attrs.id;
                    // تحسين: التحقق من عدم وجود عملية إعادة محاولة سابقة
                    if (pendingDecryption.has(messageId)) {
                        if (DEBUG_MODE) console.log(`[LID-DEBUG] Retry already scheduled for ${messageId}, ignoring CB:message`);
                        return handler(node);
                    }
                    const placeholder = await handleLidMessage(node);
                    if (placeholder) {
                      const jid = node.attrs.from;
                      upsertMessage(jid, proto.WebMessageInfo.fromObject(placeholder), 'append');
                      pendingDecryption.set(messageId, { originalNode: node, retryCount: 0, lastRetry: Date.now() });
                      setTimeout(() => retryLidDecryption(messageId, node, 0), 500);
                      if (DEBUG_MODE) console.log(`[LID-DEBUG] Placeholder inserted and retry started for id=${messageId}`);
                    }
                  } catch (inner) { console.error('[LID-DEBUG] Error creating placeholder from CB:message:', inner); }
                }
              } catch (e) { console.error('[LID-DEBUG] Error in wrapped CB:message handler:', e); }
              return handler(node);
            };
            return originalOn(event, wrappedCBHandler);
          }

          if (event === 'message') {
            const wrappedHandler = async function(data) {
              try {
                return await handler(data);
              } catch (error) {
                try {
                  if (error && typeof error.message === 'string' && error.message.includes('error in handling message') && data?.attrs?.addressing_mode === 'lid') {
                    const messageId = data.attrs.id;
                    if (DEBUG_MODE) console.log(`[LID-DEBUG] Web/Desktop message failed in handler: id=${messageId}`);
                    errorStats.webDesktopErrors++;
                    // تحسين: التحقق من عدم وجود عملية إعادة محاولة سابقة
                    if (pendingDecryption.has(messageId)) {
                      if (DEBUG_MODE) console.log(`[LID-DEBUG] Retry already scheduled for ${messageId}, ignoring 'error in handling message'`);
                      return;
                    }
                    const placeholder = await handleLidMessage(data);
                    if (placeholder) {
                      const jid = data.attrs.from;
                      upsertMessage(jid, proto.WebMessageInfo.fromObject(placeholder), 'append');
                      pendingDecryption.set(messageId, { originalNode: data, retryCount: 0, lastRetry: Date.now() });
                      setTimeout(() => retryLidDecryption(messageId, data, 0), 500);
                      if (DEBUG_MODE) console.log(`[LID-DEBUG] Placeholder inserted and retry started for id=${messageId}`);
                    }
                    return;
                  }
                } catch (inner) { console.error('[LID-DEBUG] Error inside ws.on wrapper:', inner); }
                throw error;
              }
            };
            return originalOn(event, wrappedHandler);
          }

          return originalOn(event, handler);
        };
      }
    } catch (err) { console.error('[STORE] Error wrapping conn.ws.on:', err); }


    try {
      conn.ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
        try {
          if (!['append', 'notify'].includes(type)) return;
          for (const msg of newMessages) {
            try {
              const jid = decodeJidSafe(msg.key.remoteJid);
              if (!jid || isJidBroadcast(jid)) continue;

              if (pendingDecryption.has(msg.key.id)) {
                if (DEBUG_MODE) console.log(`[LID-DEBUG] Successfully decrypted LID message (upsert): ${msg.key.id}`);
                pendingDecryption.delete(msg.key.id);
                errorStats.successfulRetries++;
              }

              const processed = await processMessageLids(msg);
              upsertMessage(jid, proto.WebMessageInfo.fromObject(processed), type);
            } catch (mErr) {
              console.error('[STORE] Error processing messages.upsert:', mErr);
              try {
                const jid = decodeJidSafe(msg.key.remoteJid);
                upsertMessage(jid, proto.WebMessageInfo.fromObject(msg), type);
              } catch (_) {}
            }
          }
        } catch (outer) { console.error('[STORE] Exception in messages.upsert handler:', outer); }
      });

      conn.ev.on('messages.update', async updates => {
        try {
          for (const { key, update } of updates) {
            try {
              const jid = decodeJidSafe(key.remoteJid);
              const message = loadMessage(jid, key.id);
              if (message) {
                if ((message._isLidWebMessage || pendingDecryption.has(key.id)) && update.message) {
                  if (DEBUG_MODE) console.log(`[LID-DEBUG] LID message update received: ${key.id}`);
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
            } catch (e) { console.error('[STORE] Error in messages.update inner:', e); }
          }
        } catch (e) { console.error('[STORE] Error handling messages.update:', e); }
      });

      conn.ev.on('message-receipt.update', updates => {
        try {
          for (const { key, receipt } of updates) {
            try {
              const jid = decodeJidSafe(key.remoteJid);
              const message = loadMessage(jid, key.id);
              if (message) {
                updateMessageWithReceipt(message, receipt);
                if (receipt.type === 'retry' && pendingDecryption.has(key.id)) if (DEBUG_MODE) console.log(`[LID-DEBUG] Retry receipt for LID message: ${key.id}`);
              }
            } catch (e) { console.error('[STORE] Error message-receipt.update inner:', e); }
          }
        } catch (e) { console.error('[STORE] Error message-receipt.update:', e); }
      });

      // contacts/chats/groups handlers (maintaining)
      conn.ev.on('chats.set', ({ chats: newChats }) => {
        for (const chat of newChats) { const jid = decodeJidSafe(chat.id); if (!(jid in chats)) chats[jid] = { id: jid }; Object.assign(chats[jid], chat); conn.chats[jid] = chats[jid]; }
      });
      conn.ev.on('contacts.set', ({ contacts: newContacts }) => {
        for (const contact of newContacts) { const jid = decodeJidSafe(contact.id); if (!(jid in contacts)) contacts[jid] = { id: jid }; Object.assign(contacts[jid], contact); if (!(jid in chats)) chats[jid] = { id: jid }; Object.assign(chats[jid], contact); conn.chats[jid] = chats[jid]; }
      });
      conn.ev.on('chats.upsert', newChats => {
        for (const chat of newChats) { const jid = decodeJidSafe(chat.id); if (!(jid in chats)) chats[jid] = { id: jid }; Object.assign(chats[jid], chat); conn.chats[jid] = chats[jid]; }
      });
      conn.ev.on('chats.update', updates => {
        for (const update of updates) { const jid = decodeJidSafe(update.id); if (!(jid in chats)) chats[jid] = { id: jid }; Object.assign(chats[jid], update); conn.chats[jid] = chats[jid]; }
      });
      conn.ev.on('presence.update', ({ id, presences: updates }) => {
        const jid = decodeJidSafe(id); if (!(jid in chats)) chats[jid] = { id: jid }; Object.assign(chats[jid], { presences: { ...(chats[jid].presences || {}), ...updates } }); conn.chats[jid] = chats[jid];
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
              await updateLidCacheFromMetadata(metadata, jid);
            }
          } catch (_) {}
          conn.chats[jid] = chats[jid];
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
            await updateLidCacheFromMetadata(metadata, jid);
          }
        } catch (_) {}
        conn.chats[jid] = chats[jid];
      });

    } catch (e) { console.error('[STORE] Error in bind - event setup:', e); }

  } // end bind

  // -------------------------
  // updateLidCacheFromMetadata
  // -------------------------
  async function updateLidCacheFromMetadata(metadata, groupJid) {
    try {
      if (!metadata?.participants || !conn) return;
      for (const participant of metadata.participants) {
        try {
          const phoneNumber = participant.jid.split('@')[0];
          if (!phoneNumber) continue;
          const possibleLid = `${phoneNumber}:13@lid`;
          if (!lidCache.has(phoneNumber)) {
            const entry = { jid: participant.jid, lid: possibleLid, name: participant.jid.split('@')[0], timestamp: Date.now(), groupJid, inferred: true };
            lidCache.set(phoneNumber, entry);
            jidToLidMap.set(participant.jid, possibleLid);
            saveLidCache(); // استخدام الدالة المحسنة
            if (DEBUG_MODE) console.log(`[LID-DEBUG] updateLidCacheFromMetadata: inferred ${possibleLid} -> ${participant.jid}`);
          }
        } catch (e) { /* ignore */ }
      }
    } catch (err) { console.error('[LID-DEBUG] Error updateLidCacheFromMetadata:', err); }
  }

  // -------------------------
  // Stats and cleanup
  // -------------------------
  function getErrorStats() {
    return { ...errorStats, pendingDecryption: pendingDecryption.size, cacheSize: lidCache.size, jidMappings: jidToLidMap.size, pendingMessages: Array.from(pendingDecryption.entries()).map(([id, data]) => ({ id, retryCount: data.retryCount, lastRetry: data.lastRetry })) };
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
    if (cleaned) if (DEBUG_MODE) console.log(`[LID-DEBUG] cleanupPendingMessages cleaned ${cleaned} entries`);
    return cleaned;
  }
  setInterval(cleanupPendingMessages, 30 * 60 * 1000);

  // -------------------------
  // Serialization
  // -------------------------
  function toJSON() {
    return { chats, messages, contacts };
  }
  function fromJSON(json) {
    Object.assign(chats, json.chats || {});
    Object.assign(contacts, json.contacts || {});
    for (const jid in json.messages || {}) messages[jid] = (json.messages[jid] || []).map(m => m && proto.WebMessageInfo.fromObject(m)).filter(Boolean);
  }

  // -------------------------
  // pino handler: detects "error in handling message" and SessionError
  // -------------------------
  pinoLineHandler = async function(obj, rawLine) {
    try {
      if (!obj) return;
      const msgText = obj.msg || obj.message || '';
      // case 1: "error in handling message"
      if (typeof msgText === 'string' && msgText.includes('error in handling message') && obj.node) {
        try {
          const node = obj.node;
          const attrs = node.attrs || {};
          if (attrs.addressing_mode === 'lid' || attrs.participant?.includes?.('@lid') || attrs.participant_pn) {
            const messageId = attrs.id;
             // تحسين: التحقق من وجود عملية إعادة محاولة سابقة
            if (pendingDecryption.has(messageId)) {
                if (DEBUG_MODE) console.log(`[LID-DEBUG] >>> pinoIntercept: error for existing retry ${messageId}`);
                return;
            }

            if (DEBUG_MODE) console.log('[LID-DEBUG] >>> pinoIntercept: error in handling message detected by pino log');
            if (DEBUG_MODE) console.log('[LID-DEBUG] node.attrs:', JSON.stringify(attrs));
            try {
              const placeholder = await handleLidMessage(node);
              if (placeholder && conn) {
                const jid = attrs.from;
                upsertMessage(jid, proto.WebMessageInfo.fromObject(placeholder), 'append');
                pendingDecryption.set(messageId, { originalNode: node, retryCount: 0, lastRetry: Date.now(), sessionErrorObserved: false });
                setTimeout(() => retryLidDecryption(messageId, node, 0), 500);
                if (DEBUG_MODE) console.log(`[LID-DEBUG] Placeholder inserted and retry started for id=${messageId}`);
              }
            } catch (inner) {
              console.error('[LID-DEBUG] Error creating placeholder from pinoIntercept:', inner);
            }
          }
        } catch (e) { console.error('[LID-DEBUG] Error processing obj.node in pinoLineHandler:', e); }
      }

      // case 2: detect session errors
      if (obj.err || (obj.msg && typeof obj.msg === 'string' && obj.msg.includes('No matching sessions found for message'))) {
        try {
          const errObj = obj.err || {};
          const stack = errObj.stack || obj.stack || obj.msg;
          const node = obj.node || {};
          const attrs = node.attrs || {};
          if (attrs && (attrs.addressing_mode === 'lid' || attrs.participant_pn || attrs.participant?.includes?.('@lid'))) {
            if (DEBUG_MODE) console.log('[LID-DEBUG] >>> pinoIntercept: SessionError detected');
            if (DEBUG_MODE) console.log('[LID-DEBUG] node.attrs (session error):', JSON.stringify(attrs));
            if (DEBUG_MODE) console.log('[LID-DEBUG] session error stack snippet:', typeof stack === 'string' ? stack.split('\n')[0] : stack);

            const pending = pendingDecryption.get(attrs.id) || {};
            pending.sessionErrorObserved = true;
            pending.sessionErrorInfo = { observedAt: Date.now(), snippet: typeof stack === 'string' ? stack.split('\n')[0] : stack };
            pendingDecryption.set(attrs.id, pending);
            if (DEBUG_MODE) console.log(`[LID-DEBUG] pendingDecryption[${attrs.id}] marked sessionErrorObserved=true`);
          }
        } catch (e) {
          console.error('[LID-DEBUG] Error processing SessionError in pinoLineHandler:', e);
        }
      }

    } catch (e) { /* do not block */ }
  };

  // -------------------------
  // Public API
  // -------------------------
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
        return await resolveLidFromCache(lidJid, groupChatId);
      },
      add(lidKey, jid, name = null) {
        if (lidCache.has(lidKey)) return;
        const entry = { jid, lid: `${lidKey}@lid`, name: name || jid.split('@')[0], timestamp: Date.now(), manual: true };
        lidCache.set(lidKey, entry);
        jidToLidMap.set(jid, `${lidKey}@lid`);
        saveLidCache(); // استخدام الدالة المحسنة
        if (DEBUG_MODE) console.log(`[LID-DEBUG] lidResolver.add: ${lidKey} -> ${jid}`);
      },
      get cache() { return lidCache; },
      getStats() { return getErrorStats(); },
      forceSave() { saveLidCache(); },
      forceRetryPending() {
        let retriedCount = 0;
        for (const [messageId, data] of pendingDecryption.entries()) {
          if (data.originalNode) {
            setTimeout(() => retryLidDecryption(messageId, data.originalNode, 0), retriedCount * 1000);
            retriedCount++;
          }
        }
        return retriedCount;
      },
      clearErrors() {
        const cleared = { pendingDecryption: pendingDecryption.size, errorStats: { ...errorStats } };
        pendingDecryption.clear();
        errorStats = { lidDecryptionErrors: 0, webDesktopErrors: 0, successfulRetries: 0, totalRetries: 0 };
        return cleared;
      },
      getStatus() {
        return { lidCache: lidCache.size, jidMappings: jidToLidMap.size, pendingDecryption: pendingDecryption.size, errorStats, isDirty, cacheFile };
      }
    },
    getErrorStats,
    cleanupPendingMessages
  };
} // makeInMemoryStore

export default makeInMemoryStore();
