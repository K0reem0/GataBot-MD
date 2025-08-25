import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import LidResolver from './LidResolver.js'

const { initAuthCreds, BufferJSON, proto, isJidBroadcast, WAMessageStubType } = (await import('@whiskeysockets/baileys')).default

// نظام إدارة cache LID مع LidResolver
class SimpleLidCache {
    constructor(conn) {
        this.cacheFile = path.join(process.cwd(), 'lidsresolve.json')
        this.cache = new Map()
        this.jidToLidMap = new Map()
        this.lidResolver = new LidResolver(conn)
        this.loadCache()
    }

    loadCache() {
        try {
            if (existsSync(this.cacheFile)) {
                const data = readFileSync(this.cacheFile, 'utf8')
                const parsed = JSON.parse(data)
                for (const [key, entry] of Object.entries(parsed)) {
                    if (entry && entry.jid && entry.lid) {
                        this.cache.set(key, entry)
                        if (entry.jid.includes('@s.whatsapp.net')) {
                            this.jidToLidMap.set(entry.jid, entry.lid)
                        }
                    }
                }
            }
        } catch (error) {
            this.cache = new Map()
            this.jidToLidMap = new Map()
        }
    }

    saveCache() {
        try {
            const data = {}
            for (const [key, value] of this.cache.entries()) {
                data[key] = value
            }
            writeFileSync(this.cacheFile, JSON.stringify(data, null, 2))
        } catch (error) {
            // Error silencioso
        }
    }

    async resolveLid(lidJid, groupId) {
        if (!lidJid.endsWith('@lid')) return lidJid
        
        const lidKey = lidJid.split('@')[0]
        
        // 1. البحث في cache المحلي أولاً
        if (this.cache.has(lidKey)) {
            const entry = this.cache.get(lidKey)
            if (entry.jid && !entry.notFound && !entry.error) {
                return entry.jid
            }
        }

        // 2. البحث عن طريق التعيين العكسي JID->LID
        for (const [cachedLid, cachedEntry] of this.cache.entries()) {
            if (cachedEntry && cachedEntry.jid && !cachedEntry.notFound && !cachedEntry.error) {
                const cachedNumber = cachedEntry.jid.split('@')[0]
                if (cachedNumber === lidKey) {
                    return cachedEntry.jid
                }
            }
        }

        // 3. استخدام LidResolver إذا كان متاحاً وكان مجموعة
        if (this.lidResolver && groupId?.endsWith('@g.us')) {
            try {
                const resolved = await this.lidResolver.resolveLid(lidJid, groupId)
                if (resolved && resolved !== lidJid && !resolved.endsWith('@lid')) {
                    // تحديث cache بالنتيجة
                    const resolvedNumber = resolved.split('@')[0]
                    const newEntry = {
                        jid: resolved,
                        lid: lidJid,
                        name: resolvedNumber,
                        timestamp: Date.now(),
                        fromResolver: true
                    }
                    this.cache.set(lidKey, newEntry)
                    this.jidToLidMap.set(resolved, lidJid)
                    this.saveCache()
                    
                    return resolved
                }
            } catch (error) {
                // Error silencioso، متابعة بطرق أخرى
            }
        }

        // 4. كحل أخير، محاولة التنسيق القياسي إذا كان LID يبدو كرقم هاتف
        if (/^\d{10,15}$/.test(lidKey)) {
            const standardJid = `${lidKey}@s.whatsapp.net`
            
            // وضع مؤقت في cache
            const tentativeEntry = {
                jid: standardJid,
                lid: lidJid,
                name: lidKey,
                timestamp: Date.now(),
                tentative: true
            }
            this.cache.set(lidKey, tentativeEntry)
            this.jidToLidMap.set(standardJid, lidJid)
            this.saveCache()
            
            return standardJid
        }

        return lidJid
    }

    addMapping(lidKey, jid, name = null) {
        const entry = {
            jid,
            lid: `${lidKey}@lid`,
            name: name || jid.split('@')[0],
            timestamp: Date.now(),
            manual: true
        }
        this.cache.set(lidKey, entry)
        this.jidToLidMap.set(jid, `${lidKey}@lid`)
        this.saveCache()
    }

    getUserInfo(lidKey) {
        return this.cache.get(lidKey) || null
    }

    getUserInfoByJid(jid) {
        for (const [key, entry] of this.cache.entries()) {
            if (entry.jid === jid) {
                return entry
            }
        }
        return null
    }

    findLidByJid(jid) {
        return this.jidToLidMap.get(jid) || null
    }
}

let lidCache = null

// معالجة LIDs في الرسائل
async function processLidsInMessage(message) {
    if (!message || !message.key) return message
    
    const groupId = message.key.remoteJid?.endsWith('@g.us') ? message.key.remoteJid : null

    try {
        const processed = JSON.parse(JSON.stringify(message))

        // معالجة participant
        if (processed.key?.participant?.endsWith('@lid')) {
            const resolved = await lidCache.resolveLid(processed.key.participant, groupId)
            if (resolved !== processed.key.participant) {
                processed.key.participant = resolved
            }
        }

        // معالجة mentionedJid
        if (processed.mentionedJid && Array.isArray(processed.mentionedJid)) {
            const resolvedMentions = []
            for (const jid of processed.mentionedJid) {
                if (typeof jid === 'string' && jid.endsWith('@lid')) {
                    const resolved = await lidCache.resolveLid(jid, groupId)
                    resolvedMentions.push(resolved)
                } else {
                    resolvedMentions.push(jid)
                }
            }
            processed.mentionedJid = resolvedMentions
        }

        // معالجة النص والcaption في الرسالة
        if (processed.message) {
            await processMessageContent(processed.message, groupId)
        }

        return processed
    } catch (error) {
        return message
    }
}

// معالجة محتوى الرسالة بشكل متكرر
async function processMessageContent(messageContent, groupId) {
    if (!messageContent || typeof messageContent !== 'object') return

    const messageTypes = Object.keys(messageContent)
    
    for (const msgType of messageTypes) {
        const content = messageContent[msgType]
        if (!content || typeof content !== 'object') continue

        // معالجة النص
        if (typeof content.text === 'string' && content.text.includes('@')) {
            content.text = await replaceLidMentions(content.text, groupId)
        }

        // معالجة caption
        if (typeof content.caption === 'string' && content.caption.includes('@')) {
            content.caption = await replaceLidMentions(content.caption, groupId)
        }

        // معالجة contextInfo
        if (content.contextInfo) {
            await processContextInfo(content.contextInfo, groupId)
        }
    }
}

async function processContextInfo(contextInfo, groupId) {
    if (!contextInfo) return

    // معالجة mentionedJid في contextInfo
    if (contextInfo.mentionedJid && Array.isArray(contextInfo.mentionedJid)) {
        const resolvedMentions = []
        for (const jid of contextInfo.mentionedJid) {
            if (typeof jid === 'string' && jid.endsWith('@lid')) {
                const resolved = await lidCache.resolveLid(jid, groupId)
                resolvedMentions.push(resolved)
            } else {
                resolvedMentions.push(jid)
            }
        }
        contextInfo.mentionedJid = resolvedMentions
    }

    // معالجة participant في contextInfo
    if (typeof contextInfo.participant === 'string' && contextInfo.participant.endsWith('@lid')) {
        const resolved = await lidCache.resolveLid(contextInfo.participant, groupId)
        if (resolved !== contextInfo.participant) {
            contextInfo.participant = resolved
        }
    }

    // معالجة الرسائل المقتبسة
    if (contextInfo.quotedMessage) {
        await processMessageContent(contextInfo.quotedMessage, groupId)
    }
}

async function replaceLidMentions(text, groupId) {
    if (!text || !text.includes('@')) return text

    const mentionRegex = /@(\d{8,20})/g
    const mentions = [...text.matchAll(mentionRegex)]
    if (!mentions.length) return text

    let processedText = text
    const processed = new Set()

    for (const mention of mentions) {
        const [fullMatch, lidNumber] = mention
        if (processed.has(lidNumber)) continue
        processed.add(lidNumber)

        const lidJid = `${lidNumber}@lid`
        
        try {
            const resolved = await lidCache.resolveLid(lidJid, groupId)
            if (resolved && !resolved.endsWith('@lid')) {
                const resolvedNumber = resolved.split('@')[0]
                // استبدال فقط إذا كان مختلفاً
                if (resolvedNumber !== lidNumber) {
                    processedText = processedText.replace(new RegExp(`@${lidNumber}\\b`, 'g'), `@${resolvedNumber}`)
                }
            }
        } catch (error) {
            // الاستمرار مع المذكرات الأخرى
        }
    }

    return processedText
}

// استخراج النص من الرسالة لأغراض التصحيح
function extractMessageText(message) {
    if (!message?.message) return ''
    
    let text = ''
    const content = message.message
    
    if (content.conversation) text += content.conversation + ' '
    if (content.extendedTextMessage?.text) text += content.extendedTextMessage.text + ' '
    if (content.imageMessage?.caption) text += content.imageMessage.caption + ' '
    if (content.videoMessage?.caption) text += content.videoMessage.caption + ' '
    
    // معالجة متعددة الأنواع
    const messageTypes = Object.keys(content)
    for (const msgType of messageTypes) {
        const msgContent = content[msgType]
        if (msgContent && typeof msgContent === 'object') {
            if (msgContent.text) text += msgContent.text + ' '
            if (msgContent.caption) text += msgContent.caption + ' '
        }
    }
    
    return text.trim()
}

function bind(conn) {
    if (!conn.chats) conn.chats = {}
    
    // تهيئة LidCache مع LidResolver
    lidCache = new SimpleLidCache(conn)
    
    // معالجة الرسائل الواردة
    conn.ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
        try {
            for (const msg of newMessages) {
                const jid = conn.decodeJid(msg.key.remoteJid)
                if (!jid || isJidBroadcast(jid)) continue

                // معالجة LIDs في الرسالة
                const processedMsg = await processLidsInMessage(msg)
                
                // تخزين الرسالة المعالجة - إصلاح الخطأ هنا
                if (!conn.chats[jid]) {
                    conn.chats[jid] = { id: jid }
                }
                
                // إذا لم تكن messages مصفوفة، نقوم بتهيئتها
                if (!Array.isArray(conn.chats[jid].messages)) {
                    conn.chats[jid].messages = []
                }
                
                // البحث عن الرسالة الحالية بطريقة آمنة
                let existingIndex = -1
                if (Array.isArray(conn.chats[jid].messages)) {
                    existingIndex = conn.chats[jid].messages.findIndex(m => 
                        m && m.key && m.key.id === processedMsg.key.id)
                }
                
                if (existingIndex !== -1) {
                    conn.chats[jid].messages[existingIndex] = processedMsg
                } else {
                    conn.chats[jid].messages.push(processedMsg)
                }

                // طباعة معلومات للتصحيح
                const messageText = extractMessageText(processedMsg)
                if (messageText && messageText.includes('@')) {
                    console.log('📨 تم معالجة رسالة تحتوي على مذكرات:', {
                        jid,
                        messageId: processedMsg.key.id,
                        text: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : '')
                    })
                }
            }
        } catch (e) {
            console.error('Error processing messages:', e)
        }
    })

    // الدوال الأصلية لإدارة الاتصال
    function updateNameToDb(contacts) {
        if (!contacts) return
        try {
            contacts = contacts.contacts || contacts
            for (const contact of contacts) {
                const id = conn.decodeJid(contact.id)
                if (!id || id === 'status@broadcast') continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { ...contact, id }
                conn.chats[id] = {
                    ...chats,
                    ...({
                        ...contact, id, ...(id.endsWith('@g.us') ?
                            { subject: contact.subject || contact.name || chats.subject || '' } :
                            { name: contact.notify || contact.name || chats.name || chats.notify || '' })
                    } || {})
                }
            }
        } catch (e) {
            console.error(e)
        }
    }

    // الأحداث الأصلية
    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)
    
    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = conn.decodeJid(id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                let chatObj = conn.chats[id]
                if (!chatObj) chatObj = conn.chats[id] = { id }
                chatObj.isChats = !readOnly
                if (name) chatObj[isGroup ? 'subject' : 'name'] = name
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(_ => null)
                    if (name || metadata?.subject) chatObj.subject = name || metadata.subject
                    if (!metadata) continue
                    chatObj.metadata = metadata
                }
            }
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('group-participants.update', async function updateParticipantsToDb({ id, participants, action }) {
        if (!id) return
        id = conn.decodeJid(id)
        if (id === 'status@broadcast') return
        if (!(id in conn.chats)) conn.chats[id] = { id }
        let chatObj = conn.chats[id]
        chatObj.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
        if (!groupMetadata) return
        chatObj.subject = groupMetadata.subject
        chatObj.metadata = groupMetadata
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                if (!isGroup) continue
                let chatObj = conn.chats[id]
                if (!chatObj) chatObj = conn.chats[id] = { id }
                chatObj.isChats = true
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chatObj.metadata = metadata
                if (update.subject || metadata?.subject) chatObj.subject = update.subject || metadata.subject
            }
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('chats.upsert', function chatsUpsertPushToDb(chatsUpsert) {
        try {
            const { id, name } = chatsUpsert
            if (!id || id === 'status@broadcast') return
            conn.chats[id] = { ...(conn.chats[id] || {}), ...chatsUpsert, isChats: true }
            const isGroup = id.endsWith('@g.us')
            if (isGroup) conn.insertAllGroup().catch(_ => null)
        } catch (e) {
            console.error(e)
        }
    })

    conn.ev.on('presence.update', async function presenceUpdatePushToDb({ id, presences }) {
        try {
            const sender = Object.keys(presences)[0] || id
            const _sender = conn.decodeJid(sender)
            const presence = presences[sender]['lastKnownPresence'] || 'composing'
            let chatObj = conn.chats[_sender]
            if (!chatObj) chatObj = conn.chats[_sender] = { id: sender }
            chatObj.presences = presence
            if (id.endsWith('@g.us')) {
                let groupChat = conn.chats[id]
                if (!groupChat) groupChat = conn.chats[id] = { id }
            }
        } catch (e) {
            console.error(e)
        }
    })
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
    let creds, keys = {}, saveCount = 0
    const saveState = (forceSave) => {
        logger?.trace('saving auth state')
        saveCount++
        if (forceSave || saveCount > 5) {
            writeFileSync(
                filename,
                JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
            )
            saveCount = 0
        }
    }

    if (existsSync(filename)) {
        const result = JSON.parse(
            readFileSync(filename, { encoding: 'utf-8' }),
            BufferJSON.reviver
        )
        creds = result.creds
        keys = result.keys
    } else {
        creds = initAuthCreds()
        keys = {}
    }

    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const key = KEY_MAP[type]
                    return ids.reduce(
                        (dict, id) => {
                            let value = keys[key]?.[id]
                            if (value) {
                                if (type === 'app-state-sync-key') {
                                    value = proto.AppStateSyncKeyData.fromObject(value)
                                }

                                dict[id] = value
                            }

                            return dict
                        }, {}
                    )
                },
                set: (data) => {
                    for (const _key in data) {
                        const key = KEY_MAP[_key]
                        keys[key] = keys[key] || {}
                        Object.assign(keys[key], data[_key])
                    }

                    saveState()
                }
            }
        },
        saveState
    }
}

// تصدير الدوال مع إضافة وظائف LID
export default {
    bind,
    useSingleFileAuthState,
    getLidCache: () => lidCache,
    processLidsInMessage,
    replaceLidMentions
}
