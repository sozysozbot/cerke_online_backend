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
const calculate_hands = require('./cerke_calculate_hands_core/calculate_hand.js');
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const t = __importStar(require("io-ts"));
const pipeable_1 = require("fp-ts/lib/pipeable");
const Either_1 = require("fp-ts/lib/Either");
var Color;
(function (Color) {
    Color[Color["Kok1"] = 0] = "Kok1";
    Color[Color["Huok2"] = 1] = "Huok2";
})(Color || (Color = {}));
var Profession;
(function (Profession) {
    Profession[Profession["Nuak1"] = 0] = "Nuak1";
    Profession[Profession["Kauk2"] = 1] = "Kauk2";
    Profession[Profession["Gua2"] = 2] = "Gua2";
    Profession[Profession["Kaun1"] = 3] = "Kaun1";
    Profession[Profession["Dau2"] = 4] = "Dau2";
    Profession[Profession["Maun1"] = 5] = "Maun1";
    Profession[Profession["Kua2"] = 6] = "Kua2";
    Profession[Profession["Tuk2"] = 7] = "Tuk2";
    Profession[Profession["Uai1"] = 8] = "Uai1";
    Profession[Profession["Io"] = 9] = "Io";
})(Profession || (Profession = {}));
var Side;
(function (Side) {
    Side[Side["IAOwner"] = 0] = "IAOwner";
    Side[Side["NonIAOwner"] = 1] = "NonIAOwner";
})(Side = exports.Side || (exports.Side = {}));
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
const PORT = process.env.PORT || 23564;
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});
const { getPiece, setPiece } = (() => {
    function fromAbsoluteCoord_([absrow, abscol]) {
        let rowind;
        if (absrow === "A") {
            rowind = 0;
        }
        else if (absrow === "E") {
            rowind = 1;
        }
        else if (absrow === "I") {
            rowind = 2;
        }
        else if (absrow === "U") {
            rowind = 3;
        }
        else if (absrow === "O") {
            rowind = 4;
        }
        else if (absrow === "Y") {
            rowind = 5;
        }
        else if (absrow === "AI") {
            rowind = 6;
        }
        else if (absrow === "AU") {
            rowind = 7;
        }
        else if (absrow === "IA") {
            rowind = 8;
        }
        else {
            const _should_not_reach_here = absrow;
            throw new Error("does not happen");
        }
        let colind;
        if (abscol === "K") {
            colind = 0;
        }
        else if (abscol === "L") {
            colind = 1;
        }
        else if (abscol === "N") {
            colind = 2;
        }
        else if (abscol === "T") {
            colind = 3;
        }
        else if (abscol === "Z") {
            colind = 4;
        }
        else if (abscol === "X") {
            colind = 5;
        }
        else if (abscol === "C") {
            colind = 6;
        }
        else if (abscol === "M") {
            colind = 7;
        }
        else if (abscol === "P") {
            colind = 8;
        }
        else {
            const _should_not_reach_here = abscol;
            throw new Error("does not happen");
        }
        if (true) {
            return [rowind, colind];
        }
    }
    function getPiece(game_state, coord) {
        const [i, j] = fromAbsoluteCoord_(coord);
        return game_state.f.currentBoard[i][j];
    }
    function setPiece(game_state, coord, piece) {
        const [i, j] = fromAbsoluteCoord_(coord);
        const originally_occupied_by = game_state.f.currentBoard[i][j];
        game_state.f.currentBoard[i][j] = piece;
        return originally_occupied_by;
    }
    return { getPiece, setPiece };
})();
function isNonTam2PieceIAOwner(piece) {
    if (piece === "Tam2") {
        return false;
    }
    if (piece.side === Side.IAOwner) {
        return true;
    }
    return false;
}
function isNonTam2PieceNonIAOwner(piece) {
    if (piece === "Tam2") {
        return false;
    }
    if (piece.side === Side.NonIAOwner) {
        return true;
    }
    return false;
}
function addToHop1Zuo1OfIAOwner(game_state, piece) {
    const flipped = {
        prof: piece.prof,
        color: piece.color,
        side: Side.IAOwner
    };
    game_state.f.hop1zuo1OfIAOwner.push(flipped);
}
function addToHop1Zuo1OfNonIAOwner(game_state, piece) {
    const flipped = {
        prof: piece.prof,
        color: piece.color,
        side: Side.NonIAOwner
    };
    game_state.f.hop1zuo1OfNonIAOwner.push(flipped);
}
function removeFromHop1Zuo1OfIAOwner(game_state, color, prof) {
    const ind = game_state.f.hop1zuo1OfIAOwner.findIndex((p) => p.color === color && p.prof === prof);
    if (ind === -1) {
        throw new Error("What should exist in the hand does not exist");
    }
    const [removed] = game_state.f.hop1zuo1OfIAOwner.splice(ind, 1);
    return removed;
}
function removeFromHop1Zuo1OfNonIAOwner(game_state, color, prof) {
    const ind = game_state.f.hop1zuo1OfNonIAOwner.findIndex((p) => p.color === color && p.prof === prof);
    if (ind === -1) {
        throw new Error("What should exist in the hand does not exist");
    }
    const [removed] = game_state.f.hop1zuo1OfNonIAOwner.splice(ind, 1);
    return removed;
}
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
function isInfAfterStep(a) {
    if (a.move.type === "NonTamMove") {
        return false;
    }
    else if (a.move.type === "TamMove") {
        return false;
    }
    else if (a.move.type === "InfAfterStep") {
        return true;
    }
    else {
        const _should_not_reach_here = a.move;
        throw new Error("should not happen");
    }
}
function getLastMove(game_state) {
    const arr = game_state.moves_to_be_polled[game_state.season];
    if (arr.length === 0) {
        return undefined;
    }
    return arr[arr.length - 1];
}
function analyzeAfterHalfAcceptance(msg, room_info) {
    const game_state = room_to_gamestate.get(room_info.room_id);
    const { src, step } = game_state.waiting_for_after_half_acceptance;
    if (msg.dest == null) {
        const obj = getLastMove(game_state);
        if (typeof obj === "undefined") {
            return ({ legal: false, whyIllegal: "there was no last move" });
        }
        if (!isInfAfterStep(obj)) {
            return ({ legal: false, whyIllegal: "the last move was not InfAfterStep" });
        }
        obj.move.finalResult = {
            dest: src
        };
        // hasn't actually moved, so the water entry cannot fail
        return {
            legal: true,
            dat: {
                waterEntryHappened: false
            }
        };
    }
    const piece = getPiece(game_state, src);
    game_state.waiting_for_after_half_acceptance = null;
    if (isWater(src) || (piece !== "Tam2" && piece.prof === Profession.Nuak1)) {
        const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, src, msg.dest, room_info.is_IA_down_for_me);
        const final_obj = getLastMove(game_state);
        if (typeof final_obj === "undefined" || !isInfAfterStep(final_obj)) {
            return ({ legal: false, whyIllegal: "the last move was not InfAfterStep" });
        }
        final_obj.move.finalResult = {
            dest: msg.dest
        };
        final_obj.status = hand_is_made ? "not yet" : null;
        const ans = {
            legal: true,
            dat: {
                waterEntryHappened: false
            }
        };
        return ans;
    }
    if (isWater(msg.dest)) {
        const water_entry_ciurl = [
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5,
            Math.random() < 0.5
        ];
        const obj = getLastMove(game_state);
        if (typeof obj === "undefined" || !isInfAfterStep(obj)) {
            return ({ legal: false, whyIllegal: "the last move was not InfAfterStep" });
        }
        if (water_entry_ciurl.filter((a) => a).length >= 3) {
            const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, src, msg.dest, room_info.is_IA_down_for_me);
            obj.move.finalResult = {
                dest: msg.dest,
                water_entry_ciurl,
            };
            if (hand_is_made) {
                obj.status = "not yet";
            }
        }
        else {
            obj.move.finalResult = {
                dest: src,
                water_entry_ciurl
            };
            obj.status = null;
        }
        const ans = {
            legal: true,
            dat: {
                waterEntryHappened: true,
                ciurl: water_entry_ciurl
            }
        };
        return ans;
    }
    else {
        const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, src, msg.dest, room_info.is_IA_down_for_me);
        const obj = getLastMove(game_state);
        if (typeof obj === "undefined" || !isInfAfterStep(obj)) {
            return ({ legal: false, whyIllegal: "the last move was not InfAfterStep" });
        }
        obj.move.finalResult = {
            dest: msg.dest
        };
        if (hand_is_made) {
            obj.status = "not yet";
        }
        const ans = {
            legal: true,
            dat: {
                waterEntryHappened: false
            }
        };
        return ans;
    }
}
function analyzeInfAfterStep(msg, room_info) {
    const game_state = room_to_gamestate.get(room_info.room_id);
    game_state.waiting_for_after_half_acceptance = { src: msg.src, step: msg.step };
    const stepping_ciurl = [
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5,
        Math.random() < 0.5
    ];
    game_state.moves_to_be_polled[game_state.season].push({
        byIAOwner: room_info.is_IA_down_for_me,
        move: {
            type: msg.type,
            src: msg.src,
            step: msg.step,
            plannedDirection: msg.plannedDirection,
            stepping_ciurl,
            finalResult: null
        },
        status: null /* no piece has been taken yet */
    });
    const ans = {
        legal: true,
        ciurl: stepping_ciurl
    };
    return ans;
}
function calculateHandsAndScore(pieces) {
    const hop1zuo1 = pieces.map((p) => toObtainablePiece(p.color, p.prof));
    const res = calculate_hands.calculate_hands_and_score_from_pieces(hop1zuo1);
    if (res.error === true) {
        throw new Error(`should not happen: too many of ${res.too_many.join(",")}`);
    }
    return { hands: res.hands, score: res.score };
}
function toObtainablePiece(color, prof) {
    const a = [
        ["赤船", "赤兵", "赤弓", "赤車", "赤虎", "赤馬", "赤筆", "赤巫", "赤将", "赤王"],
        ["黒船", "黒兵", "黒弓", "黒車", "黒虎", "黒馬", "黒筆", "黒巫", "黒将", "黒王"],
    ];
    return a[color][prof];
}
function movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, src, dest, is_IA_down_for_me) {
    const piece = setPiece(game_state, src, null);
    const maybe_taken = setPiece(game_state, dest, piece);
    if (maybe_taken != null) {
        if (is_IA_down_for_me) {
            if (!isNonTam2PieceNonIAOwner(maybe_taken)) {
                throw new Error("tried to take either an ally or tam2");
            }
            const old_state = calculateHandsAndScore(game_state.f.hop1zuo1OfIAOwner);
            addToHop1Zuo1OfIAOwner(game_state, maybe_taken);
            const new_state = calculateHandsAndScore(game_state.f.hop1zuo1OfIAOwner);
            return { hand_is_made: new_state.score !== old_state.score };
        }
        else {
            if (!isNonTam2PieceIAOwner(maybe_taken)) {
                throw new Error("tried to take either an ally or tam2");
            }
            const old_state = calculateHandsAndScore(game_state.f.hop1zuo1OfNonIAOwner);
            addToHop1Zuo1OfNonIAOwner(game_state, maybe_taken);
            const new_state = calculateHandsAndScore(game_state.f.hop1zuo1OfNonIAOwner);
            return { hand_is_made: new_state.score !== old_state.score };
        }
    }
    return { hand_is_made: false };
}
function replyToWhetherTyMokPoll(room_info) {
    const game_state = room_to_gamestate.get(room_info.room_id);
    const dat = getLastMove(game_state);
    if (typeof dat === "undefined") {
        return null;
    }
    if (dat.status == null) {
        return null;
    }
    else if (dat.status === "ty mok1") {
        return "ty mok1";
    }
    else if (dat.status === "not yet") {
        return "not yet";
    }
    else if (dat.status === "ta xot1") {
        return { is_first_move_my_move: room_info.is_first_move_my_move[game_state.season] };
    }
    else {
        const _should_not_reach_here = dat.status;
        throw new Error("should not happen");
    }
}
function replyToInfPoll(room_info) {
    const game_state = room_to_gamestate.get(room_info.room_id);
    const dat = getLastMove(game_state);
    if (typeof dat === "undefined") {
        return "not good";
    }
    if (room_info.is_IA_down_for_me === dat.byIAOwner) {
        return "not good";
    }
    if (dat.move.type !== "InfAfterStep") {
        return "not good";
    }
    if (dat.move.finalResult == null) {
        return "not yet";
    }
    return dat.move;
}
function replyToMainPoll(room_info) {
    const game_state = room_to_gamestate.get(room_info.room_id);
    const dat = getLastMove(game_state);
    if (typeof dat === "undefined") {
        return "not yet";
    }
    if (room_info.is_IA_down_for_me === dat.byIAOwner) {
        return "not yet";
    }
    return dat.move;
}
function analyzeMessage(message, room_info) {
    const onLeft = (errors) => ({
        legal: false,
        whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
    });
    return pipeable_1.pipe(Verifier.decode(message), Either_1.fold(onLeft, function (msg) {
        const game_state = room_to_gamestate.get(room_info.room_id);
        if (msg.type === 'InfAfterStep') { /* InfAfterStep */
            return analyzeInfAfterStep(msg, room_info);
        }
        else if (msg.type === 'AfterHalfAcceptance') {
            return analyzeAfterHalfAcceptance(msg, room_info);
        }
        else if (msg.type === 'NonTamMove') {
            if (msg.data.type === 'FromHand') {
                if (room_info.is_IA_down_for_me) {
                    const removed = removeFromHop1Zuo1OfIAOwner(game_state, msg.data.color, msg.data.prof);
                    const maybe_taken = setPiece(game_state, msg.data.dest, removed);
                    if (maybe_taken != null) {
                        throw new Error("should not happen: already occupied and cannot be placed from hop1 zuo1");
                    }
                }
                else {
                    const removed = removeFromHop1Zuo1OfNonIAOwner(game_state, msg.data.color, msg.data.prof);
                    const maybe_taken = setPiece(game_state, msg.data.dest, removed);
                    if (maybe_taken != null) {
                        throw new Error("should not happen: already occupied and cannot be placed from hop1 zuo1");
                    }
                }
                game_state.moves_to_be_polled[game_state.season].push({
                    byIAOwner: room_info.is_IA_down_for_me,
                    move: {
                        type: "NonTamMove",
                        data: msg.data
                    },
                    status: null // never completes a new hand
                });
                // never fails
                return {
                    legal: true,
                    dat: {
                        waterEntryHappened: false
                    }
                };
            }
            const piece = getPiece(game_state, msg.data.src);
            if (isWater(msg.data.src) || (piece !== "Tam2" && piece.prof === Profession.Nuak1)) {
                const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, msg.data.src, msg.data.dest, room_info.is_IA_down_for_me);
                game_state.moves_to_be_polled[game_state.season].push({
                    byIAOwner: room_info.is_IA_down_for_me,
                    move: {
                        type: "NonTamMove",
                        data: msg.data
                    },
                    status: hand_is_made ? "not yet" : null
                });
                // never fails
                return {
                    legal: true,
                    dat: {
                        waterEntryHappened: false
                    }
                };
            }
            if (isWater(msg.data.dest)) {
                const ciurl = [
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5,
                    Math.random() < 0.5
                ];
                const data = (() => {
                    if (msg.data.type === "SrcDst") {
                        const ans = {
                            type: msg.data.type,
                            src: msg.data.src,
                            dest: msg.data.dest,
                            water_entry_ciurl: ciurl
                        };
                        return ans;
                    }
                    else if (msg.data.type === "SrcStepDstFinite") {
                        const ans = {
                            type: msg.data.type,
                            src: msg.data.src,
                            step: msg.data.step,
                            dest: msg.data.dest,
                            water_entry_ciurl: ciurl
                        };
                        return ans;
                    }
                    else {
                        const _should_not_reach_here = msg.data;
                        throw new Error("should not happen");
                    }
                })();
                if (ciurl.filter((a) => a).length >= 3) {
                    const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, msg.data.src, msg.data.dest, room_info.is_IA_down_for_me);
                    game_state.moves_to_be_polled[game_state.season].push({
                        byIAOwner: room_info.is_IA_down_for_me,
                        move: { type: "NonTamMove", data },
                        status: hand_is_made ? "not yet" : null
                    });
                }
                else {
                    game_state.moves_to_be_polled[game_state.season].push({
                        byIAOwner: room_info.is_IA_down_for_me,
                        move: { type: "NonTamMove", data },
                        status: null // never completes a move
                    });
                }
                const ans = {
                    legal: true,
                    dat: {
                        waterEntryHappened: true,
                        ciurl
                    }
                };
                return ans;
            }
            else {
                const { hand_is_made } = movePieceFromSrcToDestWhileTakingOpponentPieceIfNeeded(game_state, msg.data.src, msg.data.dest, room_info.is_IA_down_for_me);
                game_state.moves_to_be_polled[game_state.season].push({
                    byIAOwner: room_info.is_IA_down_for_me,
                    move: {
                        type: "NonTamMove",
                        data: msg.data
                    },
                    status: hand_is_made ? "not yet" : null
                });
                const ans = {
                    legal: true,
                    dat: {
                        waterEntryHappened: false
                    }
                };
                return ans;
            }
        }
        else if (msg.type === 'TamMove') {
            setPiece(game_state, msg.src, null);
            setPiece(game_state, msg.secondDest, "Tam2");
            // tam2 can't take
            game_state.moves_to_be_polled[game_state.season].push({
                byIAOwner: room_info.is_IA_down_for_me,
                move: msg,
                status: null // never completes a hand
            });
            // Tam2 never fails water entry
            const ans = {
                legal: true,
                dat: {
                    waterEntryHappened: false
                }
            };
            return ans;
        }
        else {
            let _should_not_reach_here = msg;
            throw new Error("should not reach here");
        }
    }));
}
const random_entrance = (() => {
    const RandomEntrancePollVerifier = t.strict({
        access_token: t.string
    });
    function random_entrance_poll(req, res) {
        const onLeft = (errors) => ({
            legal: false,
            whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
        });
        return res.json(pipeable_1.pipe(RandomEntrancePollVerifier.decode(req.body), Either_1.fold(onLeft, function (msg) {
            const access_token = msg.access_token;
            const maybe_room_id = person_to_room.get(access_token);
            if (typeof maybe_room_id !== "undefined") {
                return {
                    legal: true,
                    ret: {
                        "state": "let_the_game_begin",
                        "access_token": msg.access_token,
                        is_first_move_my_move: maybe_room_id.is_first_move_my_move[0 /* spring */],
                        is_IA_down_for_me: maybe_room_id.is_IA_down_for_me
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
    function random_entrance_cancel(req, res) {
        const onLeft = (errors) => ({
            legal: false,
            whyIllegal: `Invalid message format: ${errors.length} error(s) found during parsing`
        });
        return res.json(pipeable_1.pipe(RandomEntrancePollVerifier.decode(req.body), Either_1.fold(onLeft, function (msg) {
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
    function random_entrance_entrance(_req, res) {
        res.json(randomEntry());
    }
    function randomEntry() {
        const newToken = uuidv4();
        for (let token of waiting_list) {
            waiting_list.delete(token);
            const room_id = open_a_room(token, newToken);
            const is_first_turn_newToken_turn = [
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
                Math.random() < 0.5,
            ];
            const is_IA_down_for_newToken = Math.random() < 0.5;
            person_to_room.set(newToken, {
                room_id,
                is_first_move_my_move: is_first_turn_newToken_turn,
                is_IA_down_for_me: is_IA_down_for_newToken
            });
            person_to_room.set(token, {
                room_id,
                is_first_move_my_move: is_first_turn_newToken_turn.map(a => !a),
                is_IA_down_for_me: !is_IA_down_for_newToken
            });
            room_to_gamestate.set(room_id, {
                tam_itself_is_tam_hue: true,
                season: 0,
                log2_rate: 0,
                IA_owner_s_score: 20,
                is_IA_owner_s_turn: is_first_turn_newToken_turn[0 /* spring */] === is_IA_down_for_newToken,
                f: {
                    currentBoard: [
                        [{ color: Color.Huok2, prof: Profession.Kua2, side: Side.NonIAOwner },
                            { color: Color.Huok2, prof: Profession.Maun1, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Kaun1, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Uai1, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Io, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Uai1, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kaun1, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Maun1, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kua2, side: Side.NonIAOwner }],
                        [{ color: Color.Kok1, prof: Profession.Tuk2, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Gua2, side: Side.NonIAOwner }, null, { color: Color.Kok1, prof: Profession.Dau2, side: Side.NonIAOwner }, null, { color: Color.Huok2, prof: Profession.Dau2, side: Side.NonIAOwner }, null, { color: Color.Huok2, prof: Profession.Gua2, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Tuk2, side: Side.NonIAOwner }],
                        [{ color: Color.Huok2, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Nuak1, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.NonIAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.NonIAOwner }],
                        [null, null, null, null, null, null, null, null, null],
                        [null, null, null, null, "Tam2", null, null, null, null],
                        [null, null, null, null, null, null, null, null, null],
                        [{ color: Color.Huok2, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Nuak1, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Kauk2, side: Side.IAOwner }],
                        [{ color: Color.Huok2, prof: Profession.Tuk2, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Gua2, side: Side.IAOwner }, null, { color: Color.Huok2, prof: Profession.Dau2, side: Side.IAOwner }, null, { color: Color.Kok1, prof: Profession.Dau2, side: Side.IAOwner }, null, { color: Color.Kok1, prof: Profession.Gua2, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Tuk2, side: Side.IAOwner }],
                        [{ color: Color.Kok1, prof: Profession.Kua2, side: Side.IAOwner },
                            { color: Color.Kok1, prof: Profession.Maun1, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Kaun1, side: Side.IAOwner }, { color: Color.Kok1, prof: Profession.Uai1, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Io, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Uai1, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Kaun1, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Maun1, side: Side.IAOwner }, { color: Color.Huok2, prof: Profession.Kua2, side: Side.IAOwner }],
                    ],
                    hop1zuo1OfIAOwner: [],
                    hop1zuo1OfNonIAOwner: []
                },
                waiting_for_after_half_acceptance: null,
                moves_to_be_polled: [[], [], [], []]
            });
            console.log(`Opened a room ${room_id} to be used by ${newToken} and ${token}.`);
            console.log(`${is_first_turn_newToken_turn[0 /* spring */] ? newToken : token} moves first.`);
            console.log(`IA is down, from the perspective of ${is_IA_down_for_newToken ? newToken : token}.`);
            // exit after finding the first person
            return {
                "state": "let_the_game_begin",
                "access_token": newToken,
                is_first_move_my_move: is_first_turn_newToken_turn[0 /* spring */],
                is_IA_down_for_me: is_IA_down_for_newToken
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
    return { entrance: random_entrance_entrance, poll: random_entrance_poll, cancel: random_entrance_cancel };
})();
const app = express_1.default();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
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
    .post('/mainpoll', somepoll("/mainpoll", replyToMainPoll))
    .post('/infpoll', somepoll("/infpoll", replyToInfPoll))
    .post('/whethertymok', whethertymok)
    .post('/whethertymokpoll', somepoll("/whethertymokpoll", replyToWhetherTyMokPoll))
    .post('/slow', (req, res) => {
    (async () => {
        let time = Math.random() * 1000 | 0;
        console.log(`start waiting for ${time}ms`);
        await new Promise(r => setTimeout(r, time));
        console.log("finish waiting");
        main(req, res);
    })();
})
    .post('/random/entry', random_entrance.entrance)
    .post('/random/poll', random_entrance.poll)
    .post('/random/cancel', random_entrance.cancel)
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
function somepoll(address, replyfn) {
    return function (req, res) {
        console.log(`\n sent to '${address}'`);
        console.log(JSON.stringify(req.body, null, "\t"));
        const authorization = req.headers.authorization;
        if (authorization == null) {
            res.send('null'); // FIXME: does not conform to RFC 6750
            return;
        }
        else if (authorization.slice(0, 7) !== "Bearer ") {
            res.send('null'); // FIXME: does not conform to RFC 6750
            return;
        }
        const token_ = authorization.slice(7);
        const maybe_room_info = person_to_room.get(token_);
        if (typeof maybe_room_info === "undefined") {
            res.send('null');
            return;
        }
        console.log("from", req.headers.authorization);
        res.json(replyfn(maybe_room_info));
    };
}
function whethertymok(req, res) {
    console.log("\n sent to '/whethertymok'");
    console.log(JSON.stringify(req.body, null, "\t"));
    const authorization = req.headers.authorization;
    if (authorization == null) {
        res.send('null'); // FIXME: does not conform to RFC 6750
        return;
    }
    else if (authorization.slice(0, 7) !== "Bearer ") {
        res.send('null'); // FIXME: does not conform to RFC 6750
        return;
    }
    const token_ = authorization.slice(7);
    const maybe_room_info = person_to_room.get(token_);
    if (typeof maybe_room_info === "undefined") {
        res.send('null');
        return;
    }
    console.log("from", req.headers.authorization);
    let message = req.body.message;
    if (typeof message !== "boolean") {
        console.log("non-boolean message");
        res.send('null');
        return;
    }
    if (message == null) {
        console.log("no message");
        res.send('null');
        return;
    }
    const game_state = room_to_gamestate.get(maybe_room_info.room_id);
    const final_obj = getLastMove(game_state);
    if (typeof final_obj === "undefined") {
        console.log("no last move");
        res.send('null');
        return;
    }
    if (final_obj.status == null) {
        console.log("no hand");
        res.send('null');
        return;
    }
    if (message === true) { // ty mok1
        final_obj.status = "ty mok1";
        res.json({ legal: true });
    }
    else {
        final_obj.status = "ta xot1";
        if (game_state.season === 3) {
            console.log("the game has ended!");
            res.json({ legal: true, is_first_move_my_move: null });
        }
        else if (game_state.season === 0) {
            game_state.season = 1;
        }
        else if (game_state.season === 1) {
            game_state.season = 2;
        }
        else if (game_state.season === 2) {
            game_state.season = 3;
        }
        else {
            const _should_not_reach_here = game_state.season;
            throw new Error("should not happen");
        }
        res.json({ legal: true, is_first_move_my_move: maybe_room_info.is_first_move_my_move[game_state.season] });
    }
}
function main(req, res) {
    console.log("\n sent to '/' or '/slow'");
    console.log(JSON.stringify(req.body, null, "\t"));
    const authorization = req.headers.authorization;
    if (authorization == null) {
        res.send('null'); // FIXME: does not conform to RFC 6750
        return;
    }
    else if (authorization.slice(0, 7) !== "Bearer ") {
        res.send('null'); // FIXME: does not conform to RFC 6750
        return;
    }
    const token_ = authorization.slice(7);
    const maybe_room_info = person_to_room.get(token_);
    if (typeof maybe_room_info === "undefined") {
        res.send('null');
        return;
    }
    console.log("from", req.headers.authorization);
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
    res.json(analyzeMessage(message, maybe_room_info));
}
var waiting_list = new Set();
var person_to_room = new Map();
var room_to_gamestate = new Map();
function open_a_room(token1, token2) {
    console.log("A match between", token1, "and", token2, "will begin.");
    // FIXME
    return uuidv4();
}
