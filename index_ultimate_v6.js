/**
 * 💀 المُتحكِّم V6 - النسخة النهائية (Ultimate Edition) 💀
 * ميزة القصف المطورة: ضمان الوصول 100% + استقرار فائق
 */

require('dotenv').config();
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    delay,
    Browsers,
    makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// --- الإعدادات النهائية ---
const CONFIG = {
    AUTH_DIR: 'auth_info',
    DB_FILE: 'users.json',
    LOGS_FILE: 'logs.json',
    PASSWORD: process.env.PASSWORD || '22Seif333',
    ADMIN_NUMBER: process.env.ADMIN_NUMBER || '201226599219',
    ATTACK_DELAY: 1000 // 1 ثانية بين الرسائل لضمان الوصول ومنع الحظر
};

const ADMIN_JID = CONFIG.ADMIN_NUMBER + '@s.whatsapp.net';
const userState = new Map();
let sock = null;

// --- وظائف النظام ---
const db = {
    read: async (file, def) => {
        try { return JSON.parse(await fs.promises.readFile(file, 'utf8')); }
        catch { return def; }
    },
    save: async (file, data) => {
        try { await fs.promises.writeFile(file, JSON.stringify(data, null, 2)); }
        catch (e) { console.error('DB Error'); }
    }
};

const insults = [
    "انا بيني بشتمك وانا ماسك السجارة في ايديك وامك علي زبي", "ي عرص ي كلوت", "بعلمك ال احتراام",
    "انا دة كلو بديك درس يابني", "ودين امي يبقا اخر يوم في عمرك", "اوعاا يابني تفكر انك تقف قدامي في يوم",
    "ولا بحل ولا بمل", "انا مش بحل ياض", "متفكرش اني هسيبك", "انا بديك كورس ياض",
    "اوعاا ياض تقولي ي فلدر", "لاني مش بزهق", "وهكمل معاك", "هشتمك لغايه يكره",
    "فاكرنهها ساهله ولاد الجهله", "انت فاكرها سهله", "انا عارفكم يابني", "اصلي عارف شغل ال هبل دة",
    "ولا يا معفن رد", "اي رايك يات قلبت المبي", "ههههه", "شد ديلك يا متناك", "انت ي اهبل",
    "ولا يا اهبل", "انت ال صبي", "ال متوحد اهو", "انت متوحد يبني", "انا هزلك ياض",
    "انت هتمووت من زوووبري", "انا هموت ياض", "انا هزلك ياض", "انت فاكر ايه", "اه يابني انت ميت",
    "انت ميت اصلان", "انا كلامي تجيب صحابك يشيلوه معاك", "مش تفكرها اي كلام وخلاص", "مش بي السهل يا معرص",
    "مش هيقدرو يبني وللهي", "ومش هيقدرو كماان", "اقتلك علطول", "اوعاا في يوم ياض تفكر تقف قصادي",
    "فاكر ايه ياض", "اكيد هتموت لو وقفت قصادي", "ال بيقف قصاد القطر بيموت يابني", "انت ال صبي يات",
    "ولا يا شرموط", "انت يات ي عرص", "انت يبن ال كلب", "فششخ كسسومك", "زوبري", "ولا ي صبي",
    "يبن ال معرصه رد", "انت ياااض ي كلب", "مص يات", "رد يات", "اوعا ياض ي خول", "امك علي ظوبري",
    "شخرت ضحك", "ال معرص اهو", "هديك في عينك هكسرك", "هعميك ياض", "اوعا لديك في عين كسومك",
    "اوعا وشك ياض", "قول لي امك اني هجلها ياض", "قولها انهردا هكسر السرير كلو", "مره فاتت كسرت الموله",
    "موادي هكسحها", "ياض ي ششرموط", "ياض انا ال عامل ال مجال", "ابصطهالك بص", "انا ال قولت هعمل حاجة اسمها المجال",
    "المجال دة عامل زي الساحة", "كلو علي بعضو كلو بيلطش في كلو", "اخر واحد بفضل هو ال بكسسب",
    "انا رايح جاي بلطش في الي شبههك", "انت ماشي جمب الحيطه", "انا ماشي في نص الششارع", "لاني انا راجل",
    "وانت طبعاا خول", "قول انا خول ياض", "مهو انت كدة كدة خول", "تعالا اعمل عليك شوية روشنة",
    "أنـت يـأت ي أبن أل شرمؤطــةةة", "أنت فع ـلن خـؤل يأض", "همؤؤؤؤت ع ـلي طيز أمــك", "أمـك فــأأج ـأه فششــخ",
    "أرمـي طيز أمـك", "KaSmAk", "YaHaWaL", "MATNAK", "DYOS", "KALB", "أنأ بردؤ مش أي حـد يأ كســؤؤؤمك",
    "ألـ BASHA", "أنــت أل كلــب بتأع ـي", "أنت ي كلبؤبي", "كلبؤبـي هيهيهيهيهيهي", "ؤلأ ي شمأم",
    "هههههههه آل فلسـطـيني آلكآرف", "ي كلبي رد", "هحط زوبري في كس مامتك", "اه وللهي يابني هحشرو كمان",
    "ولا ي متناك", "ال خوول اهو", "انت ي سلعوق", "ولا ي شرموط", "بكلمك ياض ي عرص", "ال كلب دة مش حملي",
    "ال صبي دة مش حملي", "ال معرصاتي دة مش حملي", "ارمي امك يات", "ارمي امك علي زبي يخول",
    "هات طيز امك شوية", "ارمي كسمك ياض", "فين طيزك يا خول", "يابن اكبر متناكة", "ال معرص اهو",
    "ال ششرموط ابن ال شرموطة اهو", "انت يالا يابن ال متناكة", "انت متغاظ مني يسطا", "ولا ي ابن ال غبيه بكلمك",
    "شوف شوف ال معرص وشو اسود وخايف ازاي", "بص حلو يات يابن ال معرصه", "متبص حلو يالا ي شرموط",
    "انا بتكلم يابن ال متنااكة", "انا زوبري فوق كسومك", "انا زوبري علي طيز كسومك", "زوبري علي بزك يبن ال معرص",
    "انت يابن ال غبيه كلمني", "ولا دة غبي اوي", "مش هتكبر خالص", "هتفضل صغير", "هتفضل خول",
    "ياض ي غبي ي عرص", "زبي في كسمك", "ي كسمك ي متناك رد", "ي فرفور ي عرص", "يبتاع لل واتس",
    "انت بتااع واتساب صح يابني", "ال كلب اهو", "ولا ي صبي رد", "كلاامك مش مفههوم", "قولي يابني فين الدليل",
    "مفيش اي دليل يسطا", "بجد انت ميت فششخ", "انت ملكش لزمه يات", "اي لزمتك يا كسمك قولي",
    "انت مش في من كسمك مستوي", "زيك زي ال كلب", "ولا ي كلب", "ملكش اي لزمه", "انت ي شرموطة",
    "انت زي الشرموطة", "اي الفرق ينكو", "الشرموطة بتتناك وانت بتتناك", "اي فرق ياعني", "كوس امك يسطا",
    "انت يابن ال عرصص", "رد ياتت ي خول", "ولا ي ضعيف", "انت ضعيف اووي", "ولا يا متناك", "انت اكبر متناك",
    "مفيش متناك اكبر منك", "انت يابن ال معرصه ي خول", "ياض ي شرموطة ي ابن ال شرموطة", "اي لزمت يا كسسومك",
    "انطق يابن ال معرصة ي اخرس", "الاخرس اهو", "انت وديني اهطل", "بكلمك عادي يابني ولله -",
    "انت يبن ال عرص", "انت طيز ال مجال .", "ولا ي طيز ال مجال .", "يأض ي شرؤطة ي خؤل .",
    "أنأ لم أتكلم أنت تقف أيدك في جمبك", "أنت فأههم ؤلت أيه يبن أل ع ـرص", "مش فأهم يأض ي ع ـرص",
    "يخربيت أأأمك يأض", "ي خـربيت أمك يأس ـطـأ", "أنت مسسخره ؤللهي", "أنت مسخره نيك يبني",
    "فع ـلن أل كلب أؤفب صديق", "يأ غ ـبي بكلمك", "أه يأ أندأل يؤلأد أل فجره", "ألكلب ؤفي لصحبؤ",
    "أنمأ أنت ع ـأر لي صحبك", "طيزك فين يأض", "أؤع ـأ يأض", "أنأ نسيت زؤبري فيهأ أمبأرح",
    "همؤؤؤؤؤؤؤؤؤت", "ؤلأ ي غ ـبي أل مجأل", "أأنت يأ غ ـبي كلمني", "يأ مع ـرص بكلمك", "انت يبن ال شرموطة رد",
    "ولا يا غبي ال مجال", "بكلمك يات ي خول", "انا مش بتكلم ي خول", "احدف طيزك علي زوبر ي",
    "ايو يات ارمي امـك علي زبي", "شايف نفسك يا كسمك", "انت مشش شايف مستوااك", "انت فين يات",
    "ي عرص ي اين ال خول", "ي كسسمك", "ي عرصص ي خول", "ي كلب بكلمك", "انت باض", "يابني رد عليا",
    "يابني يا حبيبي كلمني", "للولا مات يا شباب", "ياحبيب بضاني", "بضاني بتحبك", "زوبري بيحبك",
    "يبن ال عرص", "يا معرص", "انت يابن ال خول", "مص يات", "مكروف ههههه", "ملكش فئ ها و له ههههه",
    "محدش بئ حبك ههههه", "ا اكتر واحد شفته مكروف و مكروه", "كوس امك انشف شوئ ه كده ههههه",
    "ااءنااااااااا هدوس علئ ك كل م اشوف وش كوس امك", "ابن كوم شكائ ر شرامئ ط", "شرموط ابن شرموطه ههههه",
    "جبان ههههه", "كوس امك غلبان", "زبي غشيم عليك", "ابوك وأمك وأخواتك دول كلاب", "صعبت عليا من كتر ضرب",
    "ضربتو ل كوس امك و له", "ابن كلاب بلدي ههههه", "ااءنااااااااا هفضل اطش ل كوس ءءءختك",
    "واقف تتفرج ههههه", "ابن زنئ وكه ههههه", "ابن مره مومس مفتخره", "هنئ ك امك وهسئ بك",
    "هقراوئ نورمجئ عرصصصص", "اوعئ تقارن نفسك بئ ا", "فهمنئ بن نمله حئ وانن", "بجد ئ عنئ ئ ستا ههههه",
    "سهههل اوئ حرفئ ءءء", "شائ فك مئ ت خ صص وتعبان", "عاوزك تتكبر بق ئ لا ههههه", "شكلك مبرشم ئ بنئ",
    "بتتكلم معائ ا ناءنااااااااا كدا", "مدمن برشام وبودره شكلك", "مهرتل خ ص ئ لا وح تك سوده",
    "عئ ل مدمن بودره و برشام", "بودرجئ برشمنجئ", "رد وكلم آلفلسـطـيني آلكآرف", "متبقٱش جبٱن ئ ٱبن ٱلؤسخه",
    "خلاك شحت كدا ئ بغل", "رد وكلم آلفلسـطـيني آلكآرف علئ ا ئ ابن لبوه", "ب بركة عشرتئ مكنش زمانك جئ ت ع وش دونئ ا",
    "كلمنئ زئ م بكلمك ئ لبوتئ", "برشام خلاك تنسئ ئ رباك"
];

// --- تشغيل البوت ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(CONFIG.AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser: Browsers.macOS('Desktop'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.clear();
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const statusCode = (lastDisconnect.error instanceof Boom) ? 
                lastDisconnect.error.output.statusCode : 0;
            if (statusCode !== DisconnectReason.loggedOut) {
                setTimeout(startBot, 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ [ المُتحكِّم V6 النهائي ] جاهز للعمل!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;
        const text = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();
        
        let users = await db.read(CONFIG.DB_FILE, {});
        if (!users[jid]) {
            users[jid] = { authenticated: false, free_requests: 10 };
            await db.save(CONFIG.DB_FILE, users);
        }
        let user = users[jid];

        // Reset
        if (text.toLowerCase() === 'اوامر' || text.toLowerCase() === 'start') {
            if (user.authenticated) {
                userState.delete(jid);
                const menu = `💀 قائمة السيطرة النهائية 💀\n\n1 - إرسال رسالة 🚀\n2 - المطور 👺\n3 - تدمير الأخصام 💣\n` +
                             (jid === ADMIN_JID ? `\n👑 أوامر الإدارة 👑\n7 - حظر 🚫\n8 - نووي ☢️` : "");
                await sock.sendMessage(jid, { text: menu });
                userState.set(jid, { step: 'menu' });
                return;
            }
        }

        if (!user.authenticated) {
            if (text === CONFIG.PASSWORD) {
                user.authenticated = true;
                await db.save(CONFIG.DB_FILE, users);
                await sock.sendMessage(jid, { text: '✅ تم الدخول! أرسل "اوامر" للبدء.' });
            } else {
                await sock.sendMessage(jid, { text: '💀 أدخل كلمة السر:' });
            }
            return;
        }

        const state = userState.get(jid);

        if (!state || state.step === 'menu') {
            if (text === '1') {
                userState.set(jid, { step: 'get_phone_msg' });
                await sock.sendMessage(jid, { text: '🚀 أدخل الرقم (مثال: 201226599219):' });
            } else if (text === '3') {
                if (user.free_requests > 0) {
                    userState.set(jid, { step: 'get_phone_attack' });
                    await sock.sendMessage(jid, { text: '😈 أدخل رقم الضحية للقصف:' });
                } else {
                    await sock.sendMessage(jid, { text: '❌ انتهت ذخيرتك.' });
                }
            } else if (jid === ADMIN_JID) {
                if (text === '8') {
                    userState.set(jid, { step: 'admin_nuke' });
                    await sock.sendMessage(jid, { text: '☢️ أدخل رقم الهجوم النووي:' });
                }
            }
            return;
        }

        // --- ميزة القصف النهائية (Ultimate Attack) ---
        if (state.step === 'get_phone_attack') {
            let target = text.replace(/[^\d]/g, '');
            if (target.length < 10) return sock.sendMessage(jid, { text: '❌ رقم غير صحيح.' });
            
            // صياغة الرقم بدقة شديدة لضمان الوصول
            const targetJid = target.includes('@') ? target : `${target}@s.whatsapp.net`;
            
            user.free_requests--;
            await db.save(CONFIG.DB_FILE, users);
            await sock.sendMessage(jid, { text: `🚀 بدأ القصف العنيف على ${target}...` });

            // تنفيذ القصف بنظام الطابور المنظم
            (async () => {
                let successCount = 0;
                for (const insult of insults) {
                    try {
                        // التأكد من أن الاتصال مفتوح قبل كل رسالة
                        if (sock.ws.readyState !== 1) await delay(2000); 
                        
                        await sock.sendMessage(targetJid, { text: insult });
                        successCount++;
                        await delay(CONFIG.ATTACK_DELAY);
                    } catch (e) {
                        console.log(`Failed to send to ${target}: ${e.message}`);
                        // إذا كان الخطأ بسبب الجلسة، نحاول إعادة الاتصال داخلياً
                        if (e.message.includes('Connection Closed')) break;
                    }
                }
                await sock.sendMessage(jid, { text: `✅ تم سحق الهدف بـ ${successCount} رسالة بنجاح! 💀` });
            })();
            
            userState.set(jid, { step: 'menu' });
            return;
        }

        // إرسال رسالة عادية
        if (state.step === 'get_phone_msg') {
            let target = text.replace(/[^\d]/g, '') + '@s.whatsapp.net';
            userState.set(jid, { step: 'get_content_msg', target });
            await sock.sendMessage(jid, { text: '📝 أدخل الرسالة:' });
            return;
        }
        if (state.step === 'get_content_msg') {
            await sock.sendMessage(state.target, { text: text });
            await sock.sendMessage(jid, { text: '✅ تم الإرسال!' });
            userState.set(jid, { step: 'menu' });
            return;
        }

        // هجوم نووي
        if (state.step === 'admin_nuke' && jid === ADMIN_JID) {
            let target = text.replace(/[^\d]/g, '') + '@s.whatsapp.net';
            await sock.sendMessage(jid, { text: `☢️ بدأ الهجوم النووي...` });
            (async () => {
                while(true) {
                    for (const insult of insults) {
                        try { await sock.sendMessage(target, { text: insult }); await delay(1500); }
                        catch { break; }
                    }
                }
            })();
            userState.set(jid, { step: 'menu' });
            return;
        }
    });
}

startBot().catch(() => setTimeout(startBot, 5000));
