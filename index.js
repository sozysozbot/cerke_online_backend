"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cool = require('cool-ascii-faces');
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
function isTypeObj(arg) {
    return arg != null && 'string' === typeof arg.type;
}
function analyzeMessage(message) {
    if (!isTypeObj(message)) {
        return {
            legal: false,
            whyIllegal: "Invalid message: The message either does not have `.type` or its `.type` is not a string"
        };
    }
    if (message.type === 'InfAfterStep') { /* InfAfterStep */
        return {
            legal: true,
            ciurl: [
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5
            ]
        };
    }
    else if (message.type === 'AfterHalfAcceptance') { /* AfterHalfAcceptance */
        return {
            legal: true,
            dat: Math.random() < 0.5 ? {
                waterEntryHappened: true,
                ciurl: [
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5
                ]
            } : {
                waterEntryHappened: false
            }
        };
    }
    else if (message.type === 'NonTamMove' || message.type === 'TamMove') { /* NormalMove */
        return {
            legal: true,
            dat: Math.random() < 0.5 ? {
                waterEntryHappened: true,
                ciurl: [
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5
                ]
            } : {
                waterEntryHappened: false
            }
        };
    }
    else {
        return {
            legal: false,
            whyIllegal: `Invalid message: The message has an unrecognised \`.type\`, which is \`${message.type}\`.`
        };
    }
}
const app = express_1.default();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')))
    .set('views', path_1.default.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .get('/', (req, res) => res.render('pages/index'))
    .get('/db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM test_table');
        const results = { 'results': (result) ? result.rows : null };
        res.render('pages/db', results);
        client.release();
    }
    catch (err) {
        console.error(err);
        res.send("Error " + err);
    }
})
    .post('/', (req, res) => {
    console.log(req.body);
    let message = req.body.message;
    if (typeof message !== "object") {
        console.log("message is primitive");
        res.send('null');
        return;
    }
    if (message == null) {
        console.log("no message");
        res.send('null');
        return;
    }
    res.json(analyzeMessage(message));
})
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
