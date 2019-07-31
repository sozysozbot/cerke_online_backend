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
function isColor(arg) {
    return arg === 0 || arg === 1;
}
function isProfession(arg) {
    return arg === 0
        || arg === 1
        || arg === 2
        || arg === 3
        || arg === 4
        || arg === 5
        || arg === 6
        || arg === 7
        || arg === 8
        || arg === 9;
}
function isAbsoluteRow(arg) {
    return arg === 0
        || arg === 1
        || arg === 2
        || arg === 3
        || arg === 4
        || arg === 5
        || arg === 6
        || arg === 7
        || arg === 8;
}
function isAbsoluteColumn(arg) {
    return arg === 0
        || arg === 1
        || arg === 2
        || arg === 3
        || arg === 4
        || arg === 5
        || arg === 6
        || arg === 7
        || arg === 8;
}
function isAbsoluteCoord(arg) {
    return arg instanceof Array && arg.length === 2 && isAbsoluteRow(arg[0]) && isAbsoluteColumn(arg[1]);
}
function isTypeObj(arg) {
    return arg != null && 'string' === typeof arg.type;
}
function analyzeAfterHalfAcceptance(msg) {
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
function analyzeInfAfterStep(msg) {
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
function analyzeMessage(message) {
    if (!isTypeObj(message)) {
        return {
            legal: false,
            whyIllegal: "Invalid message format: The message either does not have `.type` or its `.type` is not a string"
        };
    }
    if (message.type === 'InfAfterStep') { /* InfAfterStep */
        const hasAdequateColor = function (arg) {
            return arg != null && "color" in arg && isColor(arg.color);
        };
        if (!hasAdequateColor(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `InfAfterStep` as its `.type` but does not have a valid `.color`"
            };
        }
        const hasAdequateProf = function (arg) {
            return arg != null && "prof" in arg && isProfession(arg.prof);
        };
        if (!hasAdequateProf(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `InfAfterStep` as its `.type` but does not have a valid `.prof`"
            };
        }
        const hasAdequateSrc = function (arg) {
            return arg != null && "src" in arg && isAbsoluteCoord(arg.src);
        };
        if (!hasAdequateSrc(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `InfAfterStep` as its `.type` but does not have a valid `.src`"
            };
        }
        const hasAdequateStep = function (arg) {
            return arg != null && "step" in arg && isAbsoluteCoord(arg.step);
        };
        if (!hasAdequateStep(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `InfAfterStep` as its `.type` but does not have a valid `.step`"
            };
        }
        const hasAdequatePlannedDirection = function (arg) {
            return arg != null && "plannedDirection" in arg && isAbsoluteCoord(arg.plannedDirection);
        };
        if (!hasAdequatePlannedDirection(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `InfAfterStep` as its `.type` but does not have a valid `.step`"
            };
        }
        return analyzeInfAfterStep({
            type: 'InfAfterStep',
            prof: message.prof,
            color: message.color,
            src: message.src,
            step: message.step,
            plannedDirection: message.plannedDirection
        });
    }
    else if (message.type === 'AfterHalfAcceptance') { /* AfterHalfAcceptance */
        const hasAdequateDest = function (arg) {
            return arg != null && "dest" in arg && (arg.dest === null || isAbsoluteCoord(arg.dest));
        };
        if (!hasAdequateDest(message)) {
            return {
                legal: false,
                whyIllegal: "Invalid message format: The message has `AfterHalfAcceptance` as its `.type` but does not have a valid `.dest`"
            };
        }
        const msg = {
            dest: message.dest,
            type: 'AfterHalfAcceptance'
        };
        return analyzeAfterHalfAcceptance(msg);
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
            whyIllegal: `Invalid message format: The message has an unrecognised \`.type\`, which is \`${message.type}\`.`
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
