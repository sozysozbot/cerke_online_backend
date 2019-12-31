"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require('uuid/v4');
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const t = __importStar(require("io-ts"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const Either_1 = require("fp-ts/lib/Either");
const ColorVerifier = t.union([t.literal(0), t.literal(1)]);
const ProfessionVerifier = t.union([
    t.literal(0), t.literal(1), t.literal(2),
    t.literal(3), t.literal(4), t.literal(5),
    t.literal(6), t.literal(7), t.literal(8),
    t.literal(9)
]);
const AbsoluteRowVerifier = t.union([
    t.literal("A"), t.literal("E"), t.literal("I"),
    t.literal("U"), t.literal("O"), t.literal("Y"),
    t.literal("AI"), t.literal("AU"), t.literal("IA")
]);
const AbsoluteColumnVerifier = t.union([
    t.literal("K"), t.literal("L"), t.literal("N"),
    t.literal("T"), t.literal("Z"), t.literal("X"),
    t.literal("C"), t.literal("M"), t.literal("P")
]);
const AbsoluteCoordVerifier = t.tuple([AbsoluteRowVerifier, AbsoluteColumnVerifier]);
const InfAfterStepVerifier = t.strict({
    type: t.literal('InfAfterStep'),
    color: ColorVerifier,
    prof: ProfessionVerifier,
    src: AbsoluteCoordVerifier,
    step: AbsoluteCoordVerifier,
    plannedDirection: AbsoluteCoordVerifier
});
const AfterHalfAcceptanceVerifier = t.strict({
    type: t.literal('AfterHalfAcceptance'),
    dest: t.union([AbsoluteCoordVerifier, t.null])
});
const NormalNonTamMoveVerifier = t.strict({
    type: t.literal('NonTamMove'),
    data: t.union([t.strict({
            type: t.literal('FromHand'),
            color: ColorVerifier,
            prof: ProfessionVerifier,
            dest: AbsoluteCoordVerifier
        }), t.strict({
            type: t.literal('SrcDst'),
            src: AbsoluteCoordVerifier,
            dest: AbsoluteCoordVerifier
        }), t.strict({
            type: t.literal('SrcStepDstFinite'),
            src: AbsoluteCoordVerifier,
            step: AbsoluteCoordVerifier,
            dest: AbsoluteCoordVerifier
        })])
});
const TamMoveVerifier = t.union([t.strict({
        type: t.literal('TamMove'),
        stepStyle: t.literal('NoStep'),
        src: AbsoluteCoordVerifier,
        firstDest: AbsoluteCoordVerifier,
        secondDest: AbsoluteCoordVerifier
    }), t.strict({
        type: t.literal('TamMove'),
        stepStyle: t.union([t.literal('StepsDuringFormer'), t.literal('StepsDuringLatter')]),
        src: AbsoluteCoordVerifier,
        step: AbsoluteCoordVerifier,
        firstDest: AbsoluteCoordVerifier,
        secondDest: AbsoluteCoordVerifier
    })
]);
const Verifier = t.union([
    InfAfterStepVerifier,
    AfterHalfAcceptanceVerifier,
    NormalNonTamMoveVerifier,
    TamMoveVerifier
]);
const PollVerifier = t.strict({
    access_token: t.string
});
const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
function isWater([row, col]) {
    return (row === "O" && col === "N")
        || (row === "O" && col === "T")
        || (row === "O" && col === "Z")
        || (row === "O" && col === "X")
        || (row === "O" && col === "C")
        || (row === "I" && col === "Z")
        || (row === "U" && col === "Z")
        || (row === "Y" && col === "Z")
        || (row === "AI" && col === "Z");
}
function analyzeAfterHalfAcceptance(msg) {
    if (msg.dest == null) {
        // hasn't actually moved, so the water entry cannot fail
        return {
            legal: true,
            dat: {
                waterEntryHappened: false
            }
        };
    }
    // FIXME: should not fail if Nuak1, Vessel, 船, felkana
    // FIXME: should not fail if the starting point is also on water
    return {
        legal: true,
        dat: isWater(msg.dest) ? {
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
    const onLeft = (errors) => ({
        legal: false,
        whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
    });
    return pipeable_1.pipe(Verifier.decode(message), Either_1.fold(onLeft, function (msg) {
        if (msg.type === 'InfAfterStep') { /* InfAfterStep */
            return analyzeInfAfterStep(msg);
        }
        else if (msg.type === 'AfterHalfAcceptance') {
            return analyzeAfterHalfAcceptance(msg);
        }
        else if (msg.type === 'NonTamMove') {
            if (msg.data.type === 'FromHand') {
                // never fails
                return {
                    legal: true,
                    dat: {
                        waterEntryHappened: false
                    }
                };
            }
            if (isWater(msg.data.src)) {
                // never fails
                return {
                    legal: true,
                    dat: {
                        waterEntryHappened: false
                    }
                };
            }
            // FIXME: should not fail if Nuak1, Vessel, 船, felkana
            // FIXME: should not fail if the starting point is also on water
            return {
                legal: true,
                dat: isWater(msg.data.dest) ? {
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
        else if (msg.type === 'TamMove') {
            // Tam2 never fails water entry
            return {
                legal: true,
                dat: {
                    waterEntryHappened: false
                }
            };
        }
        else {
            let _should_not_reach_here = msg;
            throw new Error("should not reach here");
        }
    }));
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
    .post('/', main)
    .post('/slow', (req, res) => {
    (async () => {
        let time = Math.random() * 1000 | 0;
        console.log(`start waiting for ${time}ms`);
        await new Promise(r => setTimeout(r, time));
        console.log("finish waiting");
        main(req, res);
    })();
})
    .post('/random/entry', random_entrance)
    .post('/random/poll', random_poll)
    .post('/random/cancel', random_cancel)
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
function main(req, res) {
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
}
var waiting_list = new Set();
var person_to_room = new Map();
function open_a_room(token1, token2) {
    console.log("A match between", token1, "and", token2, "will begin.");
    // FIXME
    return uuidv4();
}
function randomEntry() {
    const newToken = uuidv4();
    for (let token of waiting_list) {
        waiting_list.delete(token);
        const room_id = open_a_room(token, newToken);
        const is_first_turn_newToken_turn = Math.random() < 0.5;
        person_to_room.set(newToken, { room_id, is_first_move_my_move: is_first_turn_newToken_turn });
        person_to_room.set(token, { room_id, is_first_move_my_move: !is_first_turn_newToken_turn });
        console.log(`Opened a room ${room_id} to be used by ${newToken} and ${token}.`);
        console.log(`${is_first_turn_newToken_turn ? newToken : token} moves first.`);
        // exit after finding the first person
        return {
            "state": "let_the_game_begin",
            "access_token": newToken,
            is_first_move_my_move: is_first_turn_newToken_turn
        };
    }
    // If you are still here, that means no one is found
    waiting_list.add(newToken);
    console.log(`Cannot find a partner for ${newToken}, who will thus be put in the waiting list.`);
    return {
        "state": "in_waiting_list",
        "access_token": newToken
    };
}
function random_poll(req, res) {
    const onLeft = (errors) => ({
        legal: false,
        whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
    });
    return res.json(pipeable_1.pipe(PollVerifier.decode(req.body), Either_1.fold(onLeft, function (msg) {
        const access_token = msg.access_token;
        const maybe_room_id = person_to_room.get(access_token);
        if (typeof maybe_room_id !== "undefined") {
            return {
                legal: true,
                ret: {
                    "state": "let_the_game_begin",
                    "access_token": msg.access_token,
                    is_first_move_my_move: maybe_room_id.is_first_move_my_move
                }
            };
        }
        else if (waiting_list.has(access_token)) { // not yet assigned a room, but is in the waiting list
            return {
                legal: true,
                ret: {
                    "state": "in_waiting_list",
                    "access_token": msg.access_token
                }
            };
        }
        else { // You sent me a poll, but  I don't know you. Hmm...
            return {
                legal: false,
                whyIllegal: `Invalid access token: 
          I don't know your access token, which is ${access_token}.
          Please reapply by sending an empty object to random/entry .`
            };
            // FIXME: in the future, I might let you reapply. This will of course change your UUID.
        }
    })));
}
function random_cancel(req, res) {
    const onLeft = (errors) => ({
        legal: false,
        whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
    });
    return res.json(pipeable_1.pipe(PollVerifier.decode(req.body), Either_1.fold(onLeft, function (msg) {
        const access_token = msg.access_token;
        const maybe_room_id = person_to_room.get(access_token);
        // you already have a room. you cannot cancel
        if (typeof maybe_room_id !== "undefined") {
            return {
                legal: true,
                cancellable: false
            };
        }
        else if (waiting_list.has(access_token)) { // not yet assigned a room, but is in the waiting list
            waiting_list.delete(access_token);
            console.log(`Canceled ${access_token}.`);
            return {
                legal: true,
                cancellable: true
            };
        }
        else { // You told me to cancel, but I don't know you. Hmm...
            // well, at least you can cancel
            return {
                legal: true,
                cancellable: true
            };
        }
    })));
}
function random_entrance(_req, res) {
    res.json(randomEntry());
}
