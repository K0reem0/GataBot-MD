import fs from 'fs'
import path from 'path'

const _fs = fs.promises

let handler = async (m, { text, usedPrefix, command, __dirname }) => {
  try {
    if (!text) {
      // 1. **FIXED**: Throwing a new Error object
      throw new Error(`
✳️ Usage: ${usedPrefix + command} <name file> <new code>

📌 Example:
        ${usedPrefix}paste main.js
        // New code content here...
      `.trim())
    }

    // Split and sanitize input
    const args = text.trim().split('\n')
    const filename = args[0]?.trim()
    const newCode = args.slice(1).join('\n').trim()

    // Validate input
    if (!filename || !newCode) {
      // 2. **FIXED**: Throwing a new Error object
      throw new Error('Please provide both a file name and new code content.')
    }

    if (filename.includes('..') || filename.startsWith('/')) {
      // 3. **FIXED**: Throwing a new Error object
      throw new Error('Invalid file name. Avoid using ".." or absolute paths.')
    }

    const pathFile = path.join(__dirname, filename)

    // Write the file
    if (!fs.existsSync(pathFile)) {
      await m.reply(`⚠️ The file *${filename}* does not exist. It will be created.`)
    }

    await _fs.writeFile(pathFile, newCode, 'utf8')
    await m.reply(`✅ The file *${filename}* has been updated successfully.`)
  } catch (err) {
    console.error(err)
    
    // **4. FIXED**: Get the message correctly
    // Use the error message if it exists, otherwise use the thrown object/string itself.
    const errorMessage = err.message || String(err) 
    await m.reply(`❎ Error: ${errorMessage}`)
  }
}

handler.help = ['paste <name file> <new code>']
handler.tags = ['owner']
handler.command = /^p(aste)?$/i

handler.rowner = true

export default handler
