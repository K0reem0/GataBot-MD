const MID_GB = {
idioma: 'arabe',
idioma_code: 'ar',
  
//main.js
methodCode1: 'طريقة الربط',
methodCode2: 'كيف تريد الاتصال؟',
methodCode3: 'خيار',
methodCode4: 'كود QR',
methodCode5: 'كود 8 أرقام.',
methodCode6: 'اكتب فقط رقم',
methodCode7: 'الخيار للاتصال.',
methodCode8: 'نصيحة',
methodCode9: 'إذا كنت تستخدم Termux أو Replit أو Linux أو Windows',
methodCode10: 'استخدم هذه الأوامر للتنفيذ المباشر:',
methodCode11: (chalk) => `غير مسموح بأي أرقام غير ${chalk.bold.greenBright("1")} أو ${chalk.bold.greenBright("2")}، ولا أحرف أو رموز خاصة.\n${chalk.bold.yellowBright("نصيحة: انسخ رقم الخيار والصقه في الكونسول.")}`,
methodCode12: 'بدء بكود QR',
methodCode13: 'بدء بكود 8 أرقام',
methodCode14: 'بدء افتراضي مع خيارات',
phNumber2: (chalk) => `الرجاء إدخال رقم واتساب.\n${chalk.bold.yellowBright("نصيحة: انسخ رقم واتساب والصقه في الكونسول.")}\n${chalk.bold.yellowBright("مثال: +201234567890")}\n${chalk.bold.magentaBright('---> ')}`,
pairingCode: 'كود الربط:',
mCodigoQR: `\n✅ امسح كود QR، سينتهي خلال 45 ثانية`,
mConexion: `\n❒⸺⸺⸺⸺【• متصل •】⸺⸺�⸺❒\n│\n│ 🟢 تم الاتصال بواتساب بنجاح.\n│\n❒⸺⸺⸺⸺【• متصل •】⸺⸺⸺⸺❒`,
mConexionOFF: "\n❌ تم استبدال الاتصال، الرجاء الانتظار لحظة وسأعيد التشغيل...\nإذا ظهر خطأ، ابدأ مرة أخرى بـ: npm start", 

//تحذيرات
mAdminTrue: '*أنت أدمن. لن تكون هناك عواقب* 🤭',
mAdmin: '*يجب أن أكون أدمن لأتمكن من الحذف*',
mOwner: '*إذا كان لديك صلاحيات أو أنت المالك، استخدم `#on restringir`*\n\n> _إذا قمت بتشغيله، لن تكون الوظائف محدودة_',
mAntiDelete: '*قم بإيقاف ميزة منع الحذف باستخدام `#off antieliminar` لتجنب إعادة إرسال رسائل غير مرغوب فيها*',
mAdvertencia: '> ⚠️ *تحذير 𓃠*\n\n',
mInfo: '> 📢 *معلومات 𓃠*\n\n',
mExito: '> ✅ *نجاح 𓃠*\n\n',
mError: '> ❌ *خطأ 𓃠*\n\n',

//_allantilink.js
mTiktok: '*غير مسموح بروابط تيك توك!*\n*سأقوم بحذفك*',
mYoutube: '*غير مسموح بروابط يوتيوب!*\n*سأقوم بحذفك*',
mTelegram: '*غير مسموح بروابط تيليجرام!*\n*سأقوم بحذفك*',
mFacebook: '*غير مسموح بروابط فيسبوك!*\n*سأقوم بحذفك*',
mInstagram: '*غير مسموح بروابط إنستجرام!*\n*سأقوم بحذفك*',
mX: '*غير مسموح بروابط X (تويتر)!*\n*سأقوم بحذفك*',
mDiscord: '*غير مسموح بروابط ديسكورد!*\n*سأقوم بحذفك*',
mThreads: '*غير مسموح بروابط ثريدز!*\n*سأقوم بحذفك*',
mTwitch: '*غير مسموح بروابط تويتش!*\n*سأقوم بحذفك*',

//_antilink.js
mWhatsApp: '*غير مسموح بهذا النوع من روابط واتساب!*\n*سأقوم بحذفك*',

//_antilink2.js
mWhatsApp2: '*غير مسموح بأي نوع من الروابط!*\n*سأقوم بحذفك*',
  
//antiprivado.js
smsprivado: (m, cuentas) => `*@${m.sender.split`@`[0]} ممنوع الكتابة في الخاص*\n\n> *انضم إلى مجتمع جاتا بوت لمعرفة كيف يمكنك الحصول على بوت واتساب خاص بك*\n${cuentas}\n\n⚠️ \`\`\`سيتم حظرك\`\`\` ⚠️`, 

//_anti-internacional.js
mFake: (m) => `✋ *المستخدم @${m.sender.split`@`[0]} غير مسموح به في هذه المجموعة!*`, 
mFake2: (user) => `🚫 *المستخدم @${user.split`@`[0]} غير مرحب به في هذه المجموعة!*`, 
  
//antispam.js
smsNoSpam: "رسائل سبام خفيفة", 
smsNoSpam1: (m, motive) => `*@${m.sender.split`@`[0]} لا يمكنك استخدام الأوامر لمدة 30 ثانية*\n\n*السبب: ${motive}*`, 
smsNoSpam2: "رسائل سبام متوسطة", 
smsNoSpam3: (m, motive) => `*@${m.sender.split`@`[0]} لا يمكنك استخدام الأوامر لمدة دقيقة*\n\n*السبب: ${motive}*`, 
smsNoSpam4: "رسائل سبام خطيرة", 
smsNoSpam5: (m, motive) => `*@${m.sender.split`@`[0]} لا يمكنك استخدام الأوامر لمدة دقيقتين*\n\n*السبب: ${motive}*`, 
smsNoSpam6: (mention, sender) => `*${mention} ممنوع عمل سبام للرسائل!!*`, 

//antitraba.js
smsAntiTraba: (m) => `الأدمن @${m.sender.split("@")[0]} أرسل نصًا يحتوي على الكثير من الأحرف -.-!`, 
smsAntiTraba2: '[ ! ] تم اكتشاف رسالة تحتوي على الكثير من الأحرف [ ! ]', 
smsAntiTraba3: 'تم تحديد المحادثة كمقروءة ✓', 
smsAntiTraba4: (m, name) => `الرقم: wa.me/${m.sender.split("@")[0]}\n• الاسم: ${name}\n‼️أرسل نصًا يحتوي على الكثير من الأحرف قد يسبب أعطال في الأجهزة`, 

//_autodetec.js
smsAutodetec1: (usuario, m) => `*» ${usuario}*\n*قام بتغيير اسم المجموعة*\n\n🔰 *الآن اسم المجموعة:*\n*${m.messageStubParameters[0]}*`, 
smsAutodetec2: (usuario, groupMetadata) => `*» ${usuario}*\n*قام بتغيير صورة:*\n*${groupMetadata.subject}*`, 
smsAutodetec3: (usuario, m) => `*» ${usuario}*\n*قام بتغيير وصف المجموعة\n🔰 *الوصف الجديد هو:*`, 
smsAutodetec4: (usuario, m, groupMetadata) => `🔒 ${usuario}*\n*سمح بأن ${m.messageStubParameters[0] == 'on' ? 'الأدمنز فقط' : 'الجميع'} يمكنهم تكوين ${groupMetadata.subject}*`, 
smsAutodetec5: (groupMetadata, usuario) => `*تم إعادة تعيين رابط ${groupMetadata.subject} بواسطة:*\n*» ${usuario}*`, 
smsAutodetec6: (m) => `المجموعة *${m.messageStubParameters[0] == 'on' ? 'مغلقة 🔒' : 'مفتوحة 🔓'}*\n ${m.messageStubParameters[0] == 'on' ? 'فقط الأدمنز يمكنهم الكتابة' : 'الجميع يمكنهم الكتابة الآن'}*`, 
smsAutodetec7: (m, usuario) =>  `@${m.messageStubParameters[0].split`@`[0]} الآن أدمن في هذه المجموعة\n\n😼🫵تم بواسطة: ${usuario}`, 
smsAutodetec8: (m,  usuario) => `@${m.messageStubParameters[0].split`@`[0]} لم يعد أدمن في هذه المجموعة\n\n😼🫵تم بواسطة: ${usuario}`, 
smsAutodetec9: (usuario, m) => `*» ${usuario}*\n*قام بتغيير مدة الرسائل المؤقتة إلى : *@${m.messageStubParameters[0]}*`, 
smsAutodetec10: (usuario, m) => `*» ${usuario}*\nقام *بإيقاف* الرسائل المؤقتة`, 

//_antitoxic.js
antitoxic1: (isToxic, m, user) => `☣️ *كلمة محظورة* ☣️\n\n*@${m.sender.split`@`[0]}* الكلمة \`(${isToxic})\` محظورة في هذه المجموعة!!\n\n⚠️ *تحذيرات:* \`${user.warn}/4\`\n\n> إذا وصلت إلى 4 تحذيرات أو أكثر سيتم حذفك من المجموعة`, 
antitoxic2: (isToxic, m) => `☣️ *كلمة محظورة* ☣️\n\n*@${m.sender.split`@`[0]}* سيتم حذفك لقولك \`(${isToxic})\`، أنت شخص سام في المجموعة!! 🚷`, 

//_antiviewonce.js
antiviewonce: (type, fileSize, m, msg) => `🕵️‍♀️ *منع المشاهدة لمرة واحدة* 🕵️\n
🚫 *لا تخفي* ${type === 'imageMessage' ? '`صورة` 📷' : type === 'videoMessage' ? '`فيديو` 🎥' : type === 'audioMessage' ? '`رسالة صوتية` 🔊' : 'هذه الرسالة'}
- *الحجم:* \`\`\`${fileSize}\`\`\`
- *المستخدم:* *@${m.sender.split('@')[0]}*
${msg[type].caption ? `- *النص:* ${msg[type].caption}` : ''}`.trim(), 
  
//معلومات
smsinfo: "💖 *اطلع على الأخبار وتأكد من أن لديك أحدث نسخة.*", 
name: "الاسم", 
user: "المستخدم(ة)", 

//تحميل 
smsYT1: "العنوان", 
smsYT2: "المؤلف", 
smsYT3: "كلمات", 
smsYT4: "الرابط:", 
smsYT5: "المدة:", 
smsYT6: "الفنان", 
smsYT7: "الألبوم", 
smsYT8: "التاريخ", 
smsYT9: "الأنواع", 
smsYT9: "تم الرفع", 
smsYT10: "المشاهدات", 
smsYT11: "الحجم", 
smsYT12: "النوع", 
smsYT13: "الفنان", 
smsYT14: "الوصف", 
smsYT15: "نشر", 
smsinsta1: "المتابعون", 
smsinsta2: "المتابعون", 
smsinsta3: "المنشورات", 
smsinsta4: "السيرة الذاتية", 
smsinsta5: "الإعجابات", 

//تحميل
smsYtlist: (usedPrefix) => `يمكنك تحميل أي فيديو تريده بهذه الطريقة:\n${usedPrefix}video <رقم>\n${usedPrefix}audio <رقم>\n\n*مثال:*`, 
smsfb: 'فيديو من فيسبوك', 
smsfb2: 'انتظر لحظة، يتم تحميل الفيديو من فيسبوك', 
smsfb3: 'حدث خطأ، تأكد من استخدام رابط فيسبوك صحيح', 
smsgit: 'رابط غير صحيح. يجب أن يكون رابط جيت هاب', 
smsgit2: 'جاري إرسال الملف، انتظر لحظة 🚀\nإذا لم يصل الملف فقد يكون بسبب أن المستودع كبير جدًا. 🚀', 
smsInsta: 'أدخل رابط إنستجرام لتحميل الفيديو أو الصورة\nمثال', 
smsInsta2: 'أدخل اسم مستخدم إنستجرام لتحميل القصص\nمثال', 
smsInsta3: 'مستخدم غير صالح أو بدون قصص', 
smsFire: 'أدخل رابط ميديا فاير صحيح.', 
smsApk: '*اكتب اسم التطبيق*', 
smsApk2: 'آخر تحديث', 
smsApk3: 'تطبيقات تم تحميلها', 
smsApk4: 'التطبيق كبير جدًا.', 
smsTikTok: 'اكتب اسم مستخدم تيك توك بدون (@)\nمثال', 
smsTikTok1: 'صورة الملف الشخصي', 
smsTikTok2: 'يجب إدخال رابط تيك توك لتحميل الفيديو\nمثال', 
smsTikTok3: 'رابط تيك توك غير صحيح، تأكد من أنه صالح', 
smsTikTok4: 'ستحصل على فيديو تيك توك قريبًا 😸', 
smsTikTok5: (anu) => `*تم إرسال 1 من ${anu.length} صور.* ✅\n_الباقي يمكن رؤيته في محادثة البوت الخاصة_ 😸`, 
smsTikTok6: 'اكتب اسم مستخدم تيك توك بدون (@)\nمثال', 
smsSpoti: 'جاري إرسال الأغنية...', 
smsAguarde: (additionalText) => `جاري إرسال ${additionalText}، انتظر لحظة`, 
smsAud: 'جاري تحميل الصوت، انتظر لحظة من فضلك', 
smsVid: 'جاري تحميل الفيديو، انتظر لحظة من فضلك',
smsYT: 'لم يتم العثور على روابط لهذا الرقم، الرجاء إدخال رقم بين 1 و', 
smsY2: (usedPrefix, command) => `لاستخدام هذا الأمر بهذه الطريقة (${usedPrefix + command} <رقم>)، الرجاء البحث عن الفيديوهات باستخدام الأمر`, 

//أمثلة
smsMalused: "اكتب ما تريد البحث عنه\nمثال\n", 
smsMalused2: 'اكتب اسم أنمي', 
smsMalused3: 'أدخل اسم أغنية للحصول على الكلمات\nمثال', 
smsMalused4: 'اكتب اسم فيديو أو قناة يوتيوب', 
smsMalused4: 'اكتب الاسم أو العنوان\nمثال', 
smsMalused5: 'أدخل رابط فيسبوك لتحميل الفيديو\nمثال', 
smsMalused6: 'اكتب رابط جيت هاب\nمثال', 
smsMalused7: '⚡ *استخدم الأمر بهذه الطريقة:*\n', 
smsMalused8: `🐈 *يجب استخدام الأمر كما في هذا المثال:*\n`, 
smsMalused9: `🐈 *رد على رسالة بالأمر أو استخدم هذا المثال:*\n`, 

//خطأ
smsMalError: `\`\`\`حدث خطأ غير متوقع.\`\`\``, 
smsMalError2: `\`\`\`حدثت مشكلة.\`\`\`\n`, 
smsMalError3: `\`\`\`حدث خطأ، قم بالإبلاغ عن هذا الأمر باستخدام:\`\`\`\n`, 

//مجموعات
smsAdd: 'مرحبًا! أنا جاتا بوت-إم دي 🐈، أنا بوت واتساب، أحد الأشخاص في المجموعة استخدم الأمر لإضافتك إلى المجموعة، لكن لم أستطع إضافتك، لذلك أرسل لك الدعوة للانضمام إلى المجموعة، ننتظرك بفارغ الصبر!!', 
smsAdd2: 'جاري إرسال الدعوة إلى الخاص...', 
smsGrup: 'الجميع يمكنهم الكتابة الآن في هذه المجموعة!!', 
smaGrup2: 'فقط الأدمنز يمكنهم الكتابة في هذه المجموعة!!', 

//محركات البحث
buscador: "*نتائج البحث عن:* ", 
buscador2: "الحلقات:", 
buscador3: "التنسيق:", 
buscador3: "مبني على:", 
buscador4: "تاريخ الإصدار:", 
buscador5: "الأعضاء:", 
buscador6: "المفضلة:", 
buscador7: "التصنيف:", 
buscador8: "التريلر:", 
buscador9: "*🔎 وجدت هذا:*", 
buscador10: "لم يتم العثور على أي فيلم", 
buscador11: "مانع إعلانات موصى به", 

//تحويل
smsconvert: "رد على صورة", 
smsconvert1: "انتظر جاري تحويل الصورة إلى رسم أنمي، كن صبورًا أثناء إرسال النتيجة", 
smsconvert2: "خطأ، تأكد أن الصورة لوجه شخص", 
smsconvert3: "رد على ملصق لتحويله إلى صورة، استخدم الأمر", 
smsconvert4: "رد على فيديو أو رسالة صوتية لتحويلها إلى صوت|MP3", 
smsconvert5: "فشل تحميل الفيديو، حاول مرة أخرى من فضلك", 
smsconvert6: "فشل تحويل رسالتك الصوتية إلى صوت|MP3، حاول مرة أخرى من فضلك", 
smsconvert7: "رد على فيديو أو صوت لتحويله إلى رسالة صوتية", 
smsconvert8: "فشل تحميل الفيديو، حاول مرة أخرى من فضلك", 
smsconvert9: "فشل تحويل الصوت إلى رسالة صوتية، حاول مرة أخرى من فضلك", 
smsconvert10: "رد على صورة أو فيديو", 
smsconvert11: "الحجم", 
smsconvert12: "الانتهاء", 
smsconvert13: "مختصر", 
smsconvert14: "رد على الصوت لتحويله إلى فيديو", 
smsconvert15: "اكتب نصًا لتحويله إلى رسالة صوتية\nمثال", 
smsconvert16: "رد على الصوت أو الرسالة الصوتية لتعديلها استخدم هذا الأمر", 

}

export default MID_GB
