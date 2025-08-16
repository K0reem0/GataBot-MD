const MID_GB = {
idioma: 'arabe',
idioma_code: 'ar',

//main.js
methodCode1: 'طريقة الربط',
methodCode2: 'كيف تريد الاتصال؟',
methodCode3: 'خيار',
methodCode4: 'رمز الاستجابة السريعة (QR)',
methodCode5: 'رمز من 8 أرقام',
methodCode6: 'اكتب الرقم فقط',
methodCode7: 'للخيار الذي تريد الاتصال به.',
methodCode8: 'نصيحة',
methodCode9: 'إذا كنت تستخدم Termux, Replit, Linux, أو Windows',
methodCode10: 'استخدم هذه الأوامر للتنفيذ المباشر:',
methodCode11: (chalk) => `لا يُسمح بأرقام غير ${chalk.bold.greenBright("1")} أو ${chalk.bold.greenBright("2")}، ولا حروف أو رموز خاصة.\n${chalk.bold.yellowBright("نصيحة: انسخ رقم الخيار والصقه في سطر الأوامر.")}`,
methodCode12: 'البدء برمز QR',
methodCode13: 'البدء برمز من 8 أرقام',
methodCode14: 'البدء الافتراضي بالخيارات',
phNumber2: (chalk) => `الرجاء إدخال رقم واتساب.\n${chalk.bold.yellowBright("نصيحة: انسخ رقم واتساب والصقه في سطر الأوامر.")}\n${chalk.bold.yellowBright("مثال: +593090909090")}\n${chalk.bold.magentaBright('---> ')}`,
pairingCode: 'رمز الربط:',
mCodigoQR: '\n✅ امسح رمز الاستجابة السريعة الذي سينتهي في 45 ثانية',
mConexion: '\n❒⸺⸺⸺⸺【• متصل •】⸺⸺⸺⸺❒\n│\n│ 🟢 تم الاتصال بواتساب بنجاح.\n│\n❒⸺⸺⸺⸺【• متصل •】⸺⸺⸺⸺❒',
mConexionOFF: '\n❌𒌍 تم استبدال الاتصال، يرجى الانتظار لحظة، سأعيد التشغيل...\nإذا حدث خطأ، أعد التشغيل باستخدام: npm start',

//Alertas
mAdminTrue: 'أنت مسؤول، لن تكون هناك عواقب 🤭',
mAdmin: 'يجب أن أكون مسؤولًا لأتمكن من الحذف',
mOwner: 'إذا كانت لديك صلاحيات أو كنت المالك/المالكة، استخدم #on restringir\n\n> إذا قمت بتفعيله، فلن يتم تقييد الوظائف',
mAntiDelete: 'قم بإلغاء تفعيل خاصية مكافحة الحذف باستخدام #off antieliminar لتجنب إعادة توجيه الرسائل غير المرغوب فيها',
mAdvertencia: '> ⚠️ تحذير 𓃠\n\n',
mInfo: '> 📢 معلومات 𓃠\n\n',
mExito: '> ✅ نجاح 𓃠\n\n',
mError: '> ❌ خطأ 𓃠\n\n',

//_allantilink.js
mTiktok: 'روابط TikTok غير مسموح بها!\nسأقوم بإزالتك',
mYoutube: 'روابط YouTube غير مسموح بها!\nسأقوم بإزالتك',
mTelegram: 'روابط Telegram غير مسموح بها!\nسأقوم بإزالتك',
mFacebook: 'روابط Facebook غير مسموح بها!\nسأقوم بإزالتك',
mInstagram: 'روابط Instagram غير مسموح بها!\nسأقوم بإزالتك',
mX: 'روابط X (Twitter) غير مسموح بها!\nسأقوم بإزالتك',
mDiscord: 'روابط Discord غير مسموح بها!\nسأقوم بإزالتك',
mThreads: 'روابط Threads غير مسموح بها!\nسأقوم بإزالتك',
mTwitch: 'روابط Twitch غير مسموح بها!\nسأقوم بإزالتك',

//_antilink.js
mWhatsApp: 'روابط واتساب من هذا النوع غير مسموح بها!\nسأقوم بإزالتك',

//_antilink2.js
mWhatsApp2: 'لا يُسمح بأي نوع من الروابط!\nسأقوم بإزالتك',

//antiprivado.js
smsprivado: (m, cuentas) => `@${m.sender.split('@')[0]} ممنوع الكتابة في الخاص*\n\n> *انضم إلى مجتمع GataBot لتعرف كيف يمكنك الحصول على بوت واتساب خاص بك*\n${cuentas}\n\n⚠️ \`\`\`سيتم حظرك\`\`\` ⚠️``,

//_anti-internacional.js
mFake: (m) => `✋ *المستخدم @${m.sender.split('@')[0]} غير مسموح به في هذه المجموعة!*`,
mFake2: (user) => `🚫 *المستخدم @${user.split('@')[0]} غير مرحب به في هذه المجموعة!*`,

//antispam.js
smsNoSpam: "رسائل سبام خفيفة",
smsNoSpam1: (m, motive) => `*@${m.sender.split('@')[0]} لا يمكنه استخدام الأوامر لمدة 30 ثانية*\n\n*السبب: ${motive}*`,
smsNoSpam2: "رسائل سبام متوسطة",
smsNoSpam3: (m, motive) => `*@${m.sender.split('@')[0]} لا يمكنه استخدام الأوامر لمدة دقيقة واحدة*\n\n*السبب: ${motive}*`,
smsNoSpam4: "رسائل سبام خطيرة",
smsNoSpam5: (m, motive) => `*@${m.sender.split('@')[0]} لا يمكنه استخدام الأوامر لمدة دقيقتين*\n\n*السبب: ${motive}*`,
smsNoSpam6: (mention, sender) => `*${mention} ممنوع عمل سبام بالرسائل!!*`,

//antitraba.js
smsAntiTraba: (m) => `المسؤول @${m.sender.split("@")[0]} أرسل للتو نصًا يحتوي على العديد من الأحرف -.-!`,
smsAntiTraba2: '[ ! ] تم اكتشاف رسالة تحتوي على العديد من الأحرف [ ! ]',
smsAntiTraba3: 'تم تعليم الدردشة كمقروءة ✓',
smsAntiTraba4: (m, name) => `الرقم: wa.me/${m.sender.split("@")[0]}\n• الاسم المستعار: ${name}\n‼️ أرسل للتو نصًا يحتوي على العديد من الأحرف التي قد تسبب أعطالًا في الأجهزة،`,

//_autodetec.js
smsAutodetec1: (usuario, m) => `*» ${usuario}*\n*غير اسم المجموعة*\n\n🔰 *اسم المجموعة الآن هو:*\n*${m.messageStubParameters[0]}*`,
smsAutodetec2: (usuario, groupMetadata) => `*» ${usuario}*\n*غير صورة:*\n*${groupMetadata.subject}*`,
smsAutodetec3: (usuario, m) => `*» ${usuario}*\n*غير وصف المجموعة*\n🔰 *الوصف الجديد هو:*\n${m.messageStubParameters[0]}`,
smsAutodetec4: (usuario, m, groupMetadata) => `🔒 ${usuario}*\n*سمح لـ ${m.messageStubParameters[0] == 'on' ? 'المسؤولين فقط' : 'الجميع'} بتكوين ${groupMetadata.subject}*`,
smsAutodetec5: (groupMetadata, usuario) => `*تم إعادة تعيين رابط ${groupMetadata.subject} بواسطة:*\n*» ${usuario}*`,
smsAutodetec6: (m) => `المجموعة *${m.messageStubParameters[0] == 'on' ? 'مغلقة 🔒' : 'مفتوحة 🔓'}*\n ${m.messageStubParameters[0] == 'on' ? 'يمكن للمسؤولين فقط الكتابة' : 'يمكن للجميع الكتابة الآن'} في هذه المجموعة*`,
smsAutodetec7: (m, usuario) => `*@${m.messageStubParameters[0].split('@')[0]} أصبح مسؤولًا في هذه المجموعة الآن*\n\n😼🫵 تم الإجراء بواسطة: ${usuario}`,
smsAutodetec8: (m, usuario) => `*@${m.messageStubParameters[0].split('@')[0]} لم يعد مسؤولًا في هذه المجموعة*\n\n😼🫵 تم الإجراء بواسطة: ${usuario}`,
smsAutodetec9: (usuario, m) => `*» ${usuario}*\n*قام بتغيير مدة الرسائل المؤقتة إلى: *@${m.messageStubParameters[0]}*`,
smsAutodetec10: (usuario, m) => `*» ${usuario}*\n*قام بإلغاء تفعيل* الرسائل المؤقتة،`,

//_antitoxic.js
antitoxic1: (isToxic, m, user) => `☣️ *كلمة محظورة* ☣️\n\n*@${m.sender.split('@')[0]}* كلمة \`${isToxic}\` محظورة في هذه المجموعة!!\n\n⚠️ تحذيرات: \`${user.warn}/4\`\n\n> إذا حصلت على 4 تحذيرات أو أكثر فسيتم إزالتك من المجموعة،`,
antitoxic2: (isToxic, m) => `☣️ كلمة محظورة ☣️\n\n*@${m.sender.split('@')[0]}* سيتم إزالتك لقولك \`${isToxic}\`، أنت سام/سامة في المجموعة!! 🚷`,

//_antiviewonce.js
antiviewonce: (type, fileSize, m, msg) => `🕵️‍♀️ *مكافحة "عرض مرة واحدة"* 🕵️‍♀️\n   🚫 *لا تخفِ* ${type === 'imageMessage' ? 'صورة 📷' : type === 'videoMessage' ? 'فيديو 🎥' : type === 'audioMessage' ? 'رسالة صوتية 🔊' : 'هذه الرسالة'}

الحجم: \`\`\`${fileSize}\`\`\`

المستخدم: @${m.sender.split('@')[0]}
${msg[type].caption ? `*النص:* ${msg[type].caption}` : ''}`.trim(),


//información
smsinfo: "💖 تعرف على الجديد وتأكد من أن لديك آخر إصدار.",
name: "الاسم",
user: "المستخدم",

//Descargar
smsYT1: "العنوان",
smsYT2: "الكاتب",
smsYT3: "الكلمات",
smsYT4: "الرابط:",
smsYT5: "المدة:",
smsYT6: "الفنان",
smsYT7: "الألبوم",
smsYT8: "التاريخ",
smsYT9: "الأنواع",
smsYT10: "المشاهدات",
smsYT11: "الحجم",
smsYT12: "النوع",
smsYT13: "الفنان",
smsYT14: "الوصف",
smsYT15: "تم النشر",
smsinsta1: "المتابِعون",
smsinsta2: "المتابَعون",
smsinsta3: "المنشورات",
smsinsta4: "السيرة الذاتية",
smsinsta5: "الإعجابات",

//descarga
smsYtlist: (usedPrefix) => `يمكنك تحميل الفيديو الذي تريده بهذه الطريقة:\n${usedPrefix}video <رقم>\n${usedPrefix}audio <رقم>\n\n*مثال:*`,
smsfb: 'فيديو فيسبوك',
smsfb2: 'انتظر لحظة، جارٍ تحميل الفيديو من فيسبوك',
smsfb3: 'حدث خطأ ما، تأكد من استخدام رابط فيسبوك صالح',
smsgit: 'الرابط غير صالح. يجب أن يكون رابط GitHub',
smsgit2: 'جارٍ إرسال الملف، انتظر لحظة 🚀\nإذا لم يصلك الملف، فذلك لأن المستودع ثقيل. 🚀',
smsInsta: 'أدخل رابط إنستغرام لتحميل الفيديو أو الصورة\nمثال',
smsInsta2: 'أدخل اسم مستخدم إنستغرام لتحميل القصص\nمثال',
smsInsta3: 'مستخدم غير صالح أو لا توجد قصص',
smsFire: 'أدخل رابط MediaFire صالحًا.',
smsApk: 'اكتب اسم APK',
smsApk2: 'آخر تحديث',
smsApk3: 'تم تحميل التطبيقات',
smsApk4: 'حجم التطبيق كبير جدًا.',
smsTikTok: 'اكتب اسم مستخدم TikTok بدون استخدام (@)\nمثال',
smsTikTok1: 'صورة الملف الشخصي',
smsTikTok2: 'يجب عليك إدخال رابط TikTok لتحميل الفيديو\nمثال',
smsTikTok3: 'رابط TikTok غير صحيح، يرجى التأكد من أنه صالح',
smsTikTok4: 'قريبًا ستحصل على فيديو TikTok 😸',
smsTikTok5: (anu) => `*تم إرسال 1 من ${anu.length} صورة.* ✅\n_الباقي سيكون مرئيًا في الدردشة الخاصة بالبوت_ 😸`,
smsTikTok6: 'اكتب اسم مستخدم TikTok بدون استخدام (@)\nمثال',
smsSpoti: 'جارٍ إرسال الأغنية...',
smsAguarde: (additionalText) => `تم إرسال ${additionalText}، انتظر لحظة`,
smsAud: 'جارٍ تحميل الصوت الخاص بك، يرجى الانتظار لحظة',
smsVid: 'جارٍ تحميل الفيديو الخاص بك، يرجى الانتظار لحظة',
smsYT: 'لم يتم العثور على أي روابط لهذا الرقم، يرجى إدخال رقم بين 1 و',
smsY2: (usedPrefix, command) => `لاستخدام هذا الأمر بهذه الطريقة (${usedPrefix + command} <رقم>)، يرجى إجراء البحث عن مقاطع الفيديو باستخدام الأمر`,

//ejemplos
smsMalused: "اكتب ما تريد البحث عنه\nمثال\n",
smsMalused2: 'اكتب اسم أنمي',
smsMalused3: 'أدخل اسم أغنية للحصول على كلماتها\nمثال',
smsMalused4: 'اكتب اسم فيديو أو قناة يوتيوب',
smsMalused5: 'أدخل رابط فيسبوك لتحميل الفيديو\nمثال',
smsMalused6: 'اكتب رابط GitHub\nمثال',
smsMalused7: '⚡ استخدم الأمر بهذه الطريقة:\n',
smsMalused8: '🐈 *يجب عليك استخدام الأمر كما في هذا المثال:*\n',
smsMalused9: '🐈 *رد على رسالة بالأمر أو استخدم هذا المثال:*\n',

//Error
smsMalError: `\`\`\`حدث خطأ غير متوقع.```\n`,
smsMalError2: `\`\`\`حدثت مشكلة.```\n`,
smsMalError3: `\`\`\`حدث خطأ ما، أبلغ عن هذا الأمر باستخدام:```\n`,

//grupos
smsAdd: 'مرحباً! أنا GataBot-MD 🐈، أنا بوت واتساب. استخدم شخص ما في المجموعة الأمر لإضافتك، لكنني لم أستطع، لذلك أرسل لك دعوة للانضمام إلى المجموعة. ننتظرك بفارغ الصبر!!',
smsAdd2: 'جارٍ إرسال الدعوة إلى الخاص بك...',
smsGrup: 'يمكن للجميع الكتابة الآن في هذه المجموعة!!',
smaGrup2: 'يمكن للمسؤولين فقط الكتابة في هذه المجموعة!!',

//buscadores
buscador: "نتائج لـ: ",
buscador2: "الحلقات:",
buscador3: "التنسيق:",
buscador4: "مبني على:",
buscador5: "تم العرض في:",
buscador6: "الأعضاء:",
buscador7: "المفضلة:",
buscador8: "التصنيف:",
buscador9: "المقطع الدعائي:",
buscador10: "🔎 وجدت هذا:",
buscador11: "لم يتم العثور على أي فيلم",
buscador12: "مانع إعلانات موصى به",

//convertido
smsconvert: "رد أو قم بالإشارة إلى صورة",
smsconvert1: "انتظر، أنا أحول الصورة إلى تصميم أنمي. كن صبورًا بينما أرسل لك النتيجة",
smsconvert2: "خطأ، تأكد من أن الصورة هي لوجه شخص",
smsconvert3: "رد على ملصق لتحويله إلى صورة، استخدم الأمر",
smsconvert4: "رد على فيديو أو ملاحظة صوتية لتحويلها إلى صوت/MP3",
smsconvert5: "لم يتمكن من تحميل الفيديو، حاول مرة أخرى من فضلك",
smsconvert6: "لم يتمكن من تحويل ملاحظتك الصوتية إلى صوت/MP3، حاول مرة أخرى من فضلك",
smsconvert7: "رد على فيديو أو صوت لتحويله إلى ملاحظة صوتية",
smsconvert8: "لم يتمكن من تحميل الفيديو، حاول مرة أخرى من فضلك",
smsconvert9: "لم يتمكن من التحويل من صوت إلى ملاحظة صوتية، حاول مرة أخرى من فضلك",
smsconvert10: "رد على صورة أو فيديو",
smsconvert11: "الحجم",
smsconvert12: "انتهاء الصلاحية",
smsconvert13: "تم الاختصار",
smsconvert14: "رد على الصوت لتحويله إلى فيديو",
smsconvert15: "اكتب نصًا لتحويله إلى ملاحظة صوتية\nمثال",
smsconvert16: "رد على الصوت أو الملاحظة الصوتية لتعديلها، استخدم هذا الأمر",

//herramientas.js
smsAcorta: 'أدخل رابطًا للاختصار',
smsAcorta2: (text) => `✅ تم بنجاح\n\nالرابط السابق:\n*${text}*\n\nالرابط الآن:`,

//comando +18
smshorny: "أدخل رابط XNXX صالحًا، مثال:",
smshorny2: "➤ يرجى الانتظار حتى يتم إرسال الفيديو"
}

export default MID_GB
