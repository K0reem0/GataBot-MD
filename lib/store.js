import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

const { initAuthCreds, BufferJSON, proto } = (await import('@whiskeysockets/baileys')).default

// ==================== نظام إدارة LID الجديد ====================
class LidCacheManager {
    constructor() {
        this.cacheFile = path.join(process.cwd(), 'src', 'lidsresolve.json')
        this.cache = new Map()
        this.jidToLidMap = new Map()
        this.isDirty = false
        this.loadCache()
        this.setupAutoSave()
    }

    loadCache() {
        try {
            if (existsSync(this.cacheFile)) {
                const data = readFileSync(this.cacheFile, 'utf8')
                const parsed = JSON.parse(data)
                
                for (const [key, entry] of Object.entries(parsed)) {
                    if (entry && entry.jid && entry.lid && entry.timestamp) {
                        this.cache.set(key, entry)
                        if (entry.jid && entry.jid.includes('@s.whatsapp.net')) {
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
            this.isDirty = false
        } catch (error) {
            // Error silencioso
        }
    }

    setupAutoSave() {
        setInterval(() => {
            if (this.isDirty) {
                this.saveCache()
            }
        }, 30000)
    }

    async resolveLid(lidJid, groupChatId) {
        if (!lidJid.endsWith('@lid')) {
            return lidJid.includes('@') ? lidJid : `${lidJid}@s.whatsapp.net`
        }

        const lidKey = lidJid.split('@')[0]
        
        // 1. البحث في الكاش المحلي
        if (this.cache.has(lidKey)) {
            const entry = this.cache.get(lidKey)
            if (entry.jid && !entry.notFound && !entry.error) {
                return entry.jid
            }
        }

        // 2. البحث العكسي
        for (const [cachedLid, cachedEntry] of this.cache.entries()) {
            if (cachedEntry && cachedEntry.jid && !cachedEntry.notFound && !cachedEntry.error) {
                const cachedNumber = cachedEntry.jid.split('@')[0]
                if (cachedNumber === lidKey) {
                    return cachedEntry.jid
                }
            }
        }

        // 3. محاولة التنسيق القياسي
        if (/^\d{10,15}$/.test(lidKey)) {
            const standardJid = `${lidKey}@s.whatsapp.net`
            
            const tentativeEntry = {
                jid: standardJid,
                lid: lidJid,
                name: lidKey,
                timestamp: Date.now(),
                tentative: true
            }
            this.cache.set(lidKey, tentativeEntry)
            this.jidToLidMap.set(standardJid, lidJid)
            this.isDirty = true
            
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
        this.isDirty = true
    }
}

// إنشاء مدير الكاش العالمي
const lidCacheManager = new LidCacheManager()

// دالة مساعدة لمعالجة النصوص والمنشنات
async function processTextMentions(text, groupId) {
    if (!text || !groupId || !text.includes('@')) return text

    try {
        const mentionRegex = /@(\d{8,20})/g
        const mentions = [...text.matchAll(mentionRegex)]

        if (!mentions.length) return text

        let processedText = text
        const processedMentions = new Set()

        for (const mention of mentions) {
            const [fullMatch, lidNumber] = mention
            
            if (processedMentions.has(lidNumber)) continue
            processedMentions.add(lidNumber)
            
            const lidJid = `${lidNumber}@lid`

            try {
                const resolvedJid = await lidCacheManager.resolveLid(lidJid, groupId)
                
                if (resolvedJid && resolvedJid !== lidJid && !resolvedJid.endsWith('@lid')) {
                    const resolvedNumber = resolvedJid.split('@')[0]
                    if (resolvedNumber && resolvedNumber !== lidNumber) {
                        const safeRegex = new RegExp(`@${lidNumber}\\b`, 'g')
                        processedText = processedText.replace(safeRegex, `@${resolvedNumber}`)
                    }
                }
            } catch (error) {
                // استمرار في حالة الخطأ
            }
        }

        return processedText
    } catch (error) {
        return text
    }
}

// دالة لمعالجة السياق
async function processContextInfo(contextInfo, groupChatId) {
    if (!contextInfo || typeof contextInfo !== 'object') return

    // معالجة mentionedJid
    if (contextInfo.mentionedJid && Array.isArray(contextInfo.mentionedJid)) {
        const resolvedMentions = []
        for (const jid of contextInfo.mentionedJid) {
            if (typeof jid === 'string' && jid.endsWith('@lid')) {
                try {
                    const resolved = await lidCacheManager.resolveLid(jid, groupChatId)
                    resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : jid)
                } catch (error) {
                    resolvedMentions.push(jid)
                }
            } else {
                resolvedMentions.push(jid)
            }
        }
        contextInfo.mentionedJid = resolvedMentions
    }

    // معالجة participant
    if (typeof contextInfo.participant === 'string' && contextInfo.participant.endsWith('@lid')) {
        try {
            const resolved = await lidCacheManager.resolveLid(contextInfo.participant, groupChatId)
            if (resolved && !resolved.endsWith('@lid')) {
                contextInfo.participant = resolved
            }
        } catch (error) {
            // خطأ صامت
        }
    }
}

// ==================== الوظائف الرئيسية ====================

function bind(conn) {
    if (!conn.chats) conn.chats = {}
    
    // معالجة الرسائل الواردة لتحويل LIDs
    conn.ev.on('messages.upsert', async ({ messages: newMessages, type }) => {
        try {
            if (!['append', 'notify'].includes(type)) return
            
            for (const msg of newMessages) {
                try {
                    const jid = conn.decodeJid(msg.key.remoteJid)
                    if (!jid || jid === 'status@broadcast') continue

                    // معالجة LIDs للمجموعات فقط
                    if (jid.endsWith('@g.us')) {
                        // معالجة participant في المفتاح
                        if (msg.key.participant?.endsWith('@lid')) {
                            try {
                                const resolved = await lidCacheManager.resolveLid(msg.key.participant, jid)
                                if (resolved && !resolved.endsWith('@lid')) {
                                    msg.key.participant = resolved
                                }
                            } catch (error) {
                                // خطأ صامت
                            }
                        }

                        // معالجة mentionedJid
                        if (msg.mentionedJid && Array.isArray(msg.mentionedJid)) {
                            const resolvedMentions = []
                            for (const mentionJid of msg.mentionedJid) {
                                if (mentionJid.endsWith('@lid')) {
                                    try {
                                        const resolved = await lidCacheManager.resolveLid(mentionJid, jid)
                                        resolvedMentions.push(resolved && !resolved.endsWith('@lid') ? resolved : mentionJid)
                                    } catch (error) {
                                        resolvedMentions.push(mentionJid)
                                    }
                                } else {
                                    resolvedMentions.push(mentionJid)
                                }
                            }
                            msg.mentionedJid = resolvedMentions
                        }

                        // معالجة النصوص والمنشنات
                        if (msg.message) {
                            for (const msgType of Object.keys(msg.message)) {
                                const content = msg.message[msgType]
                                if (content?.text) {
                                    content.text = await processTextMentions(content.text, jid)
                                }
                                if (content?.caption) {
                                    content.caption = await processTextMentions(content.caption, jid)
                                }
                                if (content?.contextInfo) {
                                    await processContextInfo(content.contextInfo, jid)
                                }
                            }
                        }
                    }
                } catch (mErr) {
                    console.error('Error processing LID message:', mErr)
                }
            }
        } catch (outer) {
            console.error('Error in messages.upsert LID processing:', outer)
        }
    })

    // الوظائف الأصلية من الكود الثاني
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

    conn.ev.on('contacts.upsert', updateNameToDb)
    conn.ev.on('groups.update', updateNameToDb)
    conn.ev.on('contacts.set', updateNameToDb)

    conn.ev.on('chats.set', async ({ chats }) => {
        try {
            for (let { id, name, readOnly } of chats) {
                id = conn.decodeJid(id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = !readOnly
                if (name) chats[isGroup ? 'subject' : 'name'] = name
                if (isGroup) {
                    const metadata = await conn.groupMetadata(id).catch(_ => null)
                    if (name || metadata?.subject) chats.subject = name || metadata.subject
                    if (!metadata) continue
                    chats.metadata = metadata
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
        let chats = conn.chats[id]
        chats.isChats = true
        const groupMetadata = await conn.groupMetadata(id).catch(_ => null)
        if (!groupMetadata) return
        chats.subject = groupMetadata.subject
        chats.metadata = groupMetadata
    })

    conn.ev.on('groups.update', async function groupUpdatePushToDb(groupsUpdates) {
        try {
            for (const update of groupsUpdates) {
                const id = conn.decodeJid(update.id)
                if (!id || id === 'status@broadcast') continue
                const isGroup = id.endsWith('@g.us')
                if (!isGroup) continue
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
                chats.isChats = true
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (metadata) chats.metadata = metadata
                if (update.subject || metadata?.subject) chats.subject = update.subject || metadata.subject
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
            let chats = conn.chats[_sender]
            if (!chats) chats = conn.chats[_sender] = { id: sender }
            chats.presences = presence
            if (id.endsWith('@g.us')) {
                let chats = conn.chats[id]
                if (!chats) chats = conn.chats[id] = { id }
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

// تصدير واجهة Lid للمستخدم
const lidUtils = {
    resolveLid: (lidJid, groupId) => lidCacheManager.resolveLid(lidJid, groupId),
    addMapping: (lidKey, jid, name) => lidCacheManager.addMapping(lidKey, jid, name),
    getCache: () => lidCacheManager.cache,
    forceSave: () => lidCacheManager.saveCache()
}

export default {
    bind,
    useSingleFileAuthState,
    lidUtils // إضافة واجهة LID
}
