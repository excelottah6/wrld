const express = require('express');
const fs = require('fs');
let router = express.Router()
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

function removeFile(FilePath){
    if(!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true })
};
router.get('/', async (req, res) => {
    let num = req.query.number;
    async function XeonPair() {
        const {
            state,
            saveCreds
        } = await useMultiFileAuthState(`./session`)
        try {
            let Wrld = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "fatal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: [ "Ubuntu", "Chrome", "20.0.04" ],
            });
            if(!Wrld.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g,'');
                const code = await Wrld.requestPairingCode(num)
                if(!res.headersSent){
                    await res.send({code});
                }
            }
            Wrld.ev.on('creds.update', saveCreds)
            Wrld.ev.on("connection.update", async (s) => {
                const {
                    connection,
                    lastDisconnect
                } = s;
                if (connection == "open") {
                    await delay(10000);
                    const sessionizuku = fs.readFileSync('./session/creds.json');
                    const izuku = fs.readFileSync('./Wrld.mp3');
                    Wrld.groupAcceptInvite("HxVuy25MtqoFOsYuyxBx0G");
                    const b64Session = Buffer.from(sessionizuku).toString("base64");
                    const message = "IZUKU;;;" + b64Session; 
                    const black = await Wrld.sendMessage(Wrld.user.id, { text: message });

                    Wrld.sendMessage(Wrld.user.id, {
                        audio: izuku,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, {
                        quoted: black
                    });

                    await Wrld.sendMessage(Wrld.user.id, { text: `
   ┍━━☽ IZUKU-MD ☾━━┑
 ༻༺━━━━⁎∗.*.∗⁎━━━━༻༺
    🛑Do not share YOUR SESSION ID with anybody\n\n© 
    YOU CAN FOLLOW @wrld.iz on TIKTOK (cringe)
   ༻༺━━━━⁎∗.*.∗⁎━━━━༻༺ ` }, {quoted: black});
                    await delay(100);
                    await removeFile('./session');
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    XeonPair();
                }
            });
        } catch (err) {
            console.log("service restated");
            await removeFile('./session');
            if(!res.headersSent){
                await res.send({code:"Service Unavailable"});
            }
        }
    }
    return await XeonPair()
});

process.on('uncaughtException', function (err) {
    let e = String(err)
    if (e.includes("conflict")) return
    if (e.includes("Socket connection timeout")) return
    if (e.includes("not-authorized")) return
    if (e.includes("rate-overlimit")) return
    if (e.includes("Connection Closed")) return
    if (e.includes("Timed Out")) return
    if (e.includes("Value not found")) return
    console.log('Caught exception: ', err)
})

module.exports = router