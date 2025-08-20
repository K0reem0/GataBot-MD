import fs from 'fs';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { initAuthCreds, BufferJSON, proto, isJidBroadcast, WAMessageStubType, updateMessageWithReceipt, updateMessageWithReaction, jidNormalizedUser } from '@whiskeysockets/baileys';
import LidResolver from './LidResolver.js';

// Configuración
const TIME_TO_DATA_STALE = 5 * 60 * 1000;
const RETRY_DELAY = 3000;
const MAX_RETRIES = 6;
const WS_WAIT_TIMEOUT = 30000;
const WS_WAIT_STEP = 300;
const SEND_RETRY_ATTEMPTS_PER_CYCLE = 3;

/**
 * Función auxiliar: Escapar caracteres especiales en regex
 */
function escapeRegExp(string) {
    return string.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Función auxiliar: Extraer todo el texto de un mensaje
 */
function extractAllTextFromMessage(message) {
    if (!message?.message) return '';

    let allText = '';

    const extractFromContent = (content) => {
        if (!content || typeof content !== 'object') return '';
        let text = '';

        if (content.text) text += content.text + ' ';
        if (content.caption) text += content.caption + ' ';
        if (content.name) text += content.name + ' ';
        if (content.title) text += content.title + ' ';
        if (content.description) text += content.description + ' ';

        if (content.buttons) {
            content.buttons.forEach(button => {
                if (button.buttonText) text += button.buttonText.displayText + ' ';
            });
        }

        if (content.sections) {
            content.sections.forEach(section => {
                if (section.title) text += section.title + ' ';
                if (section.rows) {
                    section.rows.forEach(row => {
                        if (row.title) text += row.title + ' ';
                        if (row.description) text += row.description + ' ';
                    });
                }
            });
        }

        if (content.list) {
            if (content.list.title) text += content.list.title + ' ';
            if (content.list.description) text += content.list.description + ' ';
            if (content.list.buttonText) text += content.list.buttonText + ' ';
        }

        if (content.product) {
            if (content.product.title) text += content.product.title + ' ';
            if (content.product.description) text += content.product.description + ' ';
        }

        if (content.contextInfo) {
            if (content.contextInfo.mentionedJid) {
                content.contextInfo.mentionedJid.forEach(jid => {
                    text += `@${jid.split('@')[0]} `;
                });
            }
            if (content.contextInfo.quotedMessage) {
                text += extractFromContent(content.contextInfo.quotedMessage);
            }
        }

        if (content.templateMessage && content.templateMessage.hydratedTemplate) {
            const hydrated = content.templateMessage.hydratedTemplate;
            if (hydrated.hydratedContentText) text += hydrated.hydratedContentText + ' ';
            if (hydrated.hydratedFooterText) text += hydrated.hydratedFooterText + ' ';
            if (hydrated.hydratedButtons) {
                hydrated.hydratedButtons.forEach(button => {
                    if (button.hydratedButton && button.hydratedButton.displayText) {
                        text += button.hydratedButton.displayText + ' ';
                    }
                });
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
    // Estado interno
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

    // Gestión del cache LID mejorada
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
                    const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                    this.cache = new Map(Object.entries(data.cache || {}));
                    this.jidToLidMap = new Map(Object.entries(data.jidToLidMap || {}));
                    this.isDirty = false;
                }
            } catch (error) {
                console.error('Error loading LID cache:', error);
            }
        }

        saveCache() {
            try {
                const data = {
                    cache: Object.fromEntries(this.cache),
                    jidToLidMap: Object.fromEntries(this.jidToLidMap),
                    timestamp: Date.now()
                };
                fs.writeFileSync(this.cacheFile, JSON.stringify(data, null, 2));
                this.isDirty = false;
            } catch (error) {
                console.error('Error saving LID cache:', error);
            }
        }

        setupAutoSave() {
            setInterval(() => {
                if (this.isDirty) {
                    this.saveCache();
                }
            }, 30000);
        }

        async resolveLid(lidJid, groupChatId) {
            if (!lidJid || !lidJid.endsWith('@lid')) return lidJid;

            const lidKey = lidJid.split('@')[0];
            
            // Buscar en cache primero
            if (this.cache.has(lidKey)) {
                const entry = this.cache.get(lidKey);
                if (entry && entry.jid) {
                    return entry.jid;
                }
            }

            // Si no está en cache, intentar resolver
            try {
                if (!lidResolver && conn) {
                    lidResolver = new LidResolver(conn);
                }

                if (lidResolver) {
                    const resolvedJid = await lidResolver.resolveLid(lidKey, groupChatId);
                    if (resolvedJid && resolvedJid !== lidJid) {
                        const name = lidJid.split('@')[0];
                        this.cache.set(lidKey, {
                            jid: resolvedJid,
                            lid: lidJid,
                            name: name,
                            timestamp: Date.now(),
                            resolved: true
                        });
                        this.jidToLidMap.set(resolvedJid, lidJid);
                        this.isDirty = true;
                        return resolvedJid;
                    }
                }
            } catch (error) {
                console.error('Error resolving LID:', error);
            }

            return lidJid;
        }
    }

    const lidCacheManager = new LidCacheManager();

    // Utilidades
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

    // Función mejorada para procesar texto y reemplazar menciones LID
    async function processTextMentions(text, groupId) {
        if (!text || !groupId || !text.includes('@')) return text;

        const mentionRegex = /@(\d+)(?::(\d+))?@lid/g;
        let match;
        let result = text;

        while ((match = mentionRegex.exec(text)) !== null) {
            const fullMatch = match[0];
            const lidKey = match[1] + (match[2] ? `:${match[2]}` : '');
            const lidJid = `${lidKey}@lid`;

            try {
                const resolvedJid = await lidCacheManager.resolveLid(lidJid, groupId);
                if (resolvedJid && !resolvedJid.endsWith('@lid')) {
                    const username = resolvedJid.split('@')[0];
                    result = result.replace(fullMatch, `@${username}`);
                }
            } catch (error) {
                console.error('Error processing mention:', error);
            }
        }

        return result;
    }

    // Función auxiliar para procesar contextInfo de forma recursiva
    async function processContextInfo(contextInfo, groupChatId) {
        if (!contextInfo || typeof contextInfo !== 'object') return;

        if (contextInfo.participant && contextInfo.participant.endsWith('@lid')) {
            contextInfo.participant = await lidCacheManager.resolveLid(contextInfo.participant, groupChatId);
        }

        if (contextInfo.mentionedJid) {
            for (let i = 0; i < contextInfo.mentionedJid.length; i++) {
                if (contextInfo.mentionedJid[i].endsWith('@lid')) {
                    contextInfo.mentionedJid[i] = await lidCacheManager.resolveLid(contextInfo.mentionedJid[i], groupChatId);
                }
            }
        }

        if (contextInfo.quotedMessage) {
            await processMessageContent(contextInfo.quotedMessage, groupChatId);
        }
    }

    // Función auxiliar para procesar contenido de mensaje de forma recursiva
    async function processMessageContent(messageContent, groupChatId) {
        if (!messageContent || typeof messageContent !== 'object') return;

        // Procesar texto y caption
        if (messageContent.text) {
            messageContent.text = await processTextMentions(messageContent.text, groupChatId);
        }

        if (messageContent.caption) {
            messageContent.caption = await processTextMentions(messageContent.caption, groupChatId);
        }

        // Procesar contextInfo
        if (messageContent.contextInfo) {
            await processContextInfo(messageContent.contextInfo, groupChatId);
        }

        // Procesar botones y secciones
        if (messageContent.buttons) {
            for (const button of messageContent.buttons) {
                if (button.buttonText && button.buttonText.displayText) {
                    button.buttonText.displayText = await processTextMentions(button.buttonText.displayText, groupChatId);
                }
            }
        }

        if (messageContent.sections) {
            for (const section of messageContent.sections) {
                if (section.title) {
                    section.title = await processTextMentions(section.title, groupChatId);
                }
                if (section.rows) {
                    for (const row of section.rows) {
                        if (row.title) {
                            row.title = await processTextMentions(row.title, groupChatId);
                        }
                        if (row.description) {
                            row.description = await processTextMentions(row.description, groupChatId);
                        }
                    }
                }
            }
        }

        // Procesar mensajes citados recursivamente
        if (messageContent.quotedMessage) {
            await processMessageContent(messageContent.quotedMessage, groupChatId);
        }

        // Procesar mensajes de plantilla
        if (messageContent.templateMessage && messageContent.templateMessage.hydratedTemplate) {
            const hydrated = messageContent.templateMessage.hydratedTemplate;
            if (hydrated.hydratedContentText) {
                hydrated.hydratedContentText = await processTextMentions(hydrated.hydratedContentText, groupChatId);
            }
            if (hydrated.hydratedFooterText) {
                hydrated.hydratedFooterText = await processTextMentions(hydrated.hydratedFooterText, groupChatId);
            }
            if (hydrated.hydratedButtons) {
                for (const button of hydrated.hydratedButtons) {
                    if (button.hydratedButton && button.hydratedButton.displayText) {
                        button.hydratedButton.displayText = await processTextMentions(button.hydratedButton.displayText, groupChatId);
                    }
                }
            }
        }
    }

    // Función mejorada para procesar mensajes y resolver todos los LIDs
    async function processMessageLids(message) {
        try {
            if (!message || !message.key) return message;

            const groupChatId = isJidGroup(message.key.remoteJid) ? message.key.remoteJid : null;

            // Procesar el contenido del mensaje
            if (message.message) {
                await processMessageContent(message.message, groupChatId);
            }

            // Procesar el participante si es un LID
            if (message.key.participant && message.key.participant.endsWith('@lid')) {
                message.key.participant = await lidCacheManager.resolveLid(message.key.participant, groupChatId);
            }

            return message;
        } catch (error) {
            console.error('Error processing message LIDs:', error);
            return message;
        }
    }

    // Extraer JID real de atributos de mensaje
    function extractRealJid(messageAttrs) {
        try {
            if (!messageAttrs) return null;
            if (messageAttrs.participant_pn) {
                return messageAttrs.participant_pn;
            }
            if (messageAttrs.participant && messageAttrs.participant.endsWith?.('@lid')) {
                const lidPart = messageAttrs.participant.split('@')[0];
                if (lidPart.includes(':')) {
                    const numberPart = lidPart.split(':')[0];
                    return `${numberPart}@s.whatsapp.net`;
                }
            }
            return messageAttrs.participant;
        } catch (error) {
            return messageAttrs?.participant;
        }
    }

    // Crear placeholder para mensajes LID
    async function handleLidMessage(messageNode, isRetry = false) {
        if (!messageNode || !messageNode.attrs) return null;
        const attrs = messageNode.attrs;
        const messageId = attrs.id;
        const groupJid = attrs.from;
        const lidParticipant = attrs.participant;
        const realJid = extractRealJid(attrs);

        // Si ya tenemos el JID real, no necesitamos placeholder
        if (realJid && !realJid.endsWith('@lid')) {
            return null;
        }

        // Crear mensaje placeholder
        const placeholderMessage = {
            key: {
                remoteJid: groupJid,
                fromMe: false,
                id: messageId,
                participant: lidParticipant
            },
            messageTimestamp: Date.now(),
            messageStubType: WAMessageStubType.REVOKE,
            messageStubParameters: ['Mensaje de WhatsApp Web'],
            status: proto.WebMessageInfo.Status.PENDING,
            _placeholder: true,
            _lidPending: true
        };

        // Agregar a la lista de pendientes
        if (!pendingDecryption.has(messageId)) {
            pendingDecryption.set(messageId, {
                originalNode: messageNode,
                lastRetry: Date.now(),
                retryCount: 0,
                groupJid,
                lidParticipant
            });
        }

        return placeholderMessage;
    }

    // Esperar por WebSocket listo
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

    // Reintentar descifrado de LID
    async function retryLidDecryption(messageId, originalNode, retryCount = 0) {
        try {
            if (retryCount >= MAX_RETRIES) {
                errorStats.lidDecryptionErrors++;
                const errorMessage = await handleLidMessage(originalNode, true);
                if (errorMessage) {
                    errorMessage.message = { conversation: '⚠️ No se pudo descifrar el mensaje web' };
                    errorMessage.status = proto.WebMessageInfo.Status.ERROR;
                    errorMessage._finalError = true;
                }
                pendingDecryption.delete(messageId);
                return errorMessage;
            }

            // Esperar antes de reintentar
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));

            // Verificar si el WebSocket está listo
            const isReady = await waitForWsReady();
            if (!isReady) {
                return retryLidDecryption(messageId, originalNode, retryCount + 1);
            }

            // Reenviar el nodo original para reintentar el descifrado
            if (conn && typeof conn.sendNode === 'function') {
                errorStats.totalRetries++;
                try {
                    await conn.sendNode(originalNode);
                    pendingDecryption.get(messageId).lastRetry = Date.now();
                    pendingDecryption.get(messageId).retryCount = retryCount + 1;
                } catch (error) {
                    console.error('Error retrying LID decryption:', error);
                    return retryLidDecryption(messageId, originalNode, retryCount + 1);
                }
            }

            return null;
        } catch (error) {
            console.error('Error in retryLidDecryption:', error);
            return retryLidDecryption(messageId, originalNode, retryCount + 1);
        }
    }

    // Funciones de store
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

            const messageId = message.key.id;
            const existingIndex = messages[jid].findIndex(m => m.key.id === messageId);

            if (existingIndex !== -1) {
                if (type === 'replace') {
                    messages[jid][existingIndex] = proto.WebMessageInfo.fromObject(
                        Object.assign({}, messages[jid][existingIndex], message)
                    );
                } else if (type === 'update') {
                    Object.assign(messages[jid][existingIndex], message);
                }
            } else {
                messages[jid].push(proto.WebMessageInfo.fromObject(message));
            }

            // Limitar el tamaño del historial de mensajes
            if (messages[jid].length > 1000) {
                messages[jid] = messages[jid].slice(-1000);
            }
        } catch (err) {
            console.error('Error in upsertMessage:', err);
        }
    }

    // Función bind principal
    function bind(connection) {
        conn = connection;
        if (!conn.chats) conn.chats = {};

        // Bind function from the second code
        if (!conn.chats) conn.chats = {};
        
        function updateNameToDb(contacts) {
            if (!contacts) return;
            try {
                contacts = contacts.contacts || contacts;
                for (const contact of contacts) {
                    const id = conn.decodeJid(contact.id);
                    if (!id || id === 'status@broadcast') continue;
                    let chats = conn.chats[id];
                    if (!chats) chats = conn.chats[id] = { ...contact, id };
                    conn.chats[id] = {
                        ...chats,
                        ...({
                            ...contact,
                            id,
                            ...(id.endsWith('@g.us') ? 
                                { subject: contact.subject || contact.name || chats.subject || '' } : 
                                { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                        } || {})
                    };
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        conn.ev.on('contacts.upsert', updateNameToDb);
        conn.ev.on('groups.update', updateNameToDb);
        conn.ev.on('contacts.set', updateNameToDb);
        
        conn.ev.on('chats.set', async ({ chats }) => {
            try {
                for (let { id, name, readOnly } of chats) {
                    id = conn.decodeJid(id);
                    if (!id || id === 'status@broadcast') continue;
                    const isGroup = id.endsWith('@g.us');
                    let chats = conn.chats[id];
                    if (!chats) chats = conn.chats[id] = { id };
                    chats.isChats = !readOnly;
                    if (name) chats[isGroup ? 'subject' : 'name'] = name;
                    if (isGroup) {
                        const metadata = await conn.groupMetadata(id).catch(_ => null);
                        if (name || metadata?.subject) chats.subject = name || metadata.subject;
                        if (!metadata) continue;
                        chats.metadata = metadata;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
        
        conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
            if (!id) return;
            id = conn.decodeJid(id);
            if (id === 'status@broadcast') return;
            if (!(id in conn.chats)) conn.chats[id] = { id };
            let chats = conn.chats[id];
            chats.isChats = true;
            const groupMetadata = await conn.groupMetadata(id).catch(_ => null);
            if (!groupMetadata) return;
            chats.subject = groupMetadata.subject;
            chats.metadata = groupMetadata;
        });

        // Event listener para mensajes
        conn.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                for (const message of messages) {
                    // Procesar LIDs en el mensaje
                    const processedMessage = await processMessageLids(message);
                    
                    if (processedMessage) {
                        const jid = processedMessage.key.remoteJid;
                        upsertMessage(jid, processedMessage);
                        
                        // Manejar mensajes LID pendientes
                        if (message.key.participant && message.key.participant.endsWith('@lid')) {
                            const messageId = message.key.id;
                            if (pendingDecryption.has(messageId)) {
                                pendingDecryption.delete(messageId);
                                errorStats.successfulRetries++;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing messages upsert:', error);
            }
        });

        // Reintentar descifrado de mensajes pendientes periódicamente
        setInterval(() => {
            for (const [messageId, data] of pendingDecryption.entries()) {
                if (Date.now() - data.lastRetry > RETRY_DELAY * (data.retryCount + 1)) {
                    retryLidDecryption(messageId, data.originalNode, data.retryCount);
                }
            }
        }, 5000);
    }

    // Funciones de limpieza
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

    // Limpiar mensajes pendientes cada 30 minutos
    setInterval(cleanupPendingMessages, 30 * 60 * 1000);

    // Serialización
    function toJSON() {
        return {
            chats,
            messages,
            contacts
        };
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

    // API pública
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
    };
}

const KEY_MAP = {
    'pre-key': 'preKeys',
    'session': 'sessions',
    'sender-key': 'senderKeys',
    'app-state-sync-key': 'appStateSyncKeys',
    'app-state-sync-version': 'appStateVersions',
    'sender-key-memory': 'senderKeyMemory'
}

function useSingleFileAuthState(filename, logger) {
    let creds, keys = {}, saveCount = 0;
    
    const saveState = (forceSave) => {
        logger?.trace('saving auth state');
        saveCount++;
        if (forceSave || saveCount > 5) {
            writeFileSync(
                filename,
                JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
            );
            saveCount = 0;
        }
    }

    if (existsSync(filename)) {
        const result = JSON.parse(
            readFileSync(filename, { encoding: 'utf-8' }),
            BufferJSON.reviver
        );
        creds = result.creds;
        keys = result.keys;
    } else {
        creds = initAuthCreds();
        keys = {};
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type];
                    return ids.reduce((dict, id) => {
                        let value = keys[key]?.[id];
                        if (value) {
                            if (type === 'app-state-sync-key') {
                                value = proto.AppStateSyncKeyData.fromObject(value);
                            }
                            dict[id] = value;
                        }
                        return dict;
                    }, {});
                },
                set: (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[_key];
                        keys[key] = keys[key] || {};
                        Object.assign(keys[key], data[_key]);
                    }
                    saveState();
                }
            }
        },
        saveState
    };
}

export default {
    makeInMemoryStore,
    bind: function(conn) {
        // This would be the bind function from the second code
        if (!conn.chats) conn.chats = {};
        
        function updateNameToDb(contacts) {
            if (!contacts) return;
            try {
                contacts = contacts.contacts || contacts;
                for (const contact of contacts) {
                    const id = conn.decodeJid(contact.id);
                    if (!id || id === 'status@broadcast') continue;
                    let chats = conn.chats[id];
                    if (!chats) chats = conn.chats[id] = { ...contact, id };
                    conn.chats[id] = {
                        ...chats,
                        ...({
                            ...contact,
                            id,
                            ...(id.endsWith('@g.us') ? 
                                { subject: contact.subject || contact.name || chats.subject || '' } : 
                                { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                        } || {})
                    };
                }
            } catch (e) {
                console.error(e);
            }
        }
        
        conn.ev.on('contacts.upsert', updateNameToDb);
        conn.ev.on('groups.update', updateNameToDb);
        conn.ev.on('contacts.set', updateNameToDb);
        
        conn.ev.on('chats.set', async ({ chats }) => {
            try {
                for (let { id, name, readOnly } of chats) {
                    id = conn.decodeJid(id);
                    if (!id || id === 'status@broadcast') continue;
                    const isGroup = id.endsWith('@g.us');
                    let chats = conn.chats[id];
                    if (!chats) chats = conn.chats[id] = { id };
                    chats.isChats = !readOnly;
                    if (name) chats[isGroup ? 'subject' : 'name'] = name;
                    if (isGroup) {
                        const metadata = await conn.groupMetadata(id).catch(_ => null);
                        if (name || metadata?.subject) chats.subject = name || metadata.subject;
                        if (!metadata) continue;
                        chats.metadata = metadata;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
        
        conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
            if (!id) return;
            id = conn.decodeJid(id);
            if (id === 'status@broadcast') return;
            if (!(id in conn.chats)) conn.chats[id] = { id };
            let chats = conn.chats[id];
            chats.isChats = true;
            const groupMetadata = await conn.groupMetadata(id).catch(_ => null);
            if (!groupMetadata) return;
            chats.subject = groupMetadata.subject;
            chats.metadata = groupMetadata;
        });
    },
    useSingleFileAuthState
};
