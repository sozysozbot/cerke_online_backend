import {
    NormalMove,
    InfAfterStep,
    AfterHalfAcceptance,
    AbsoluteCoord,
} from "cerke_online_api";
import { apply_and_rotate, if_capture_get_coord, is_likely_to_succeed, is_safe_gak_tuk_newly_generated, is_very_likely_to_succeed, not_from_hand_candidates, PureGameState, is_victorious_hand, distance, coordEq } from "cerke_verifier";
import { GameStateVisibleFromBot as GameStateWithSomeInfoHidden, Side } from "./type_gamestate";
import * as cerke_verifier from "cerke_verifier";

type Tuple6<T> = [T, T, T, T, T, T];
export type BotMove = { t: "normal", dat: NormalMove } | { t: "inf", dat: InfAfterStep, after: Tuple6<AfterHalfAcceptance> };

function toPureGameState(
    game_state: Readonly<GameStateWithSomeInfoHidden>,
    opponent_has_just_moved_tam: boolean,
    ia_is_down: boolean
): Readonly<PureGameState> {
    const currentBoard_: (cerke_verifier.Piece | null)[][] = game_state.f.currentBoard.map(row => row.map(p => {
        if (p === "Tam2") {
            return "Tam2"
        } else if (p && p.side === Side.IAOwner) {
            return { color: p.color, prof: p.prof, side: cerke_verifier.Side.Upward }
        } else if (p && p.side === Side.NonIAOwner) {
            return { color: p.color, prof: p.prof, side: cerke_verifier.Side.Downward }
        } else {
            return null;
        }
    }));

    if (ia_is_down) {
        const currentBoard: cerke_verifier.Board = currentBoard_ as cerke_verifier.Board;
        return {
            IA_is_down: true,
            tam_itself_is_tam_hue: game_state.tam_itself_is_tam_hue,
            f: {
                // When IA_is_down, IA is owned by Upward
                hop1zuo1OfUpward: game_state.f.hop1zuo1OfIAOwner.map(p => ({ color: p.color, prof: p.prof, side: cerke_verifier.Side.Upward })),
                hop1zuo1OfDownward: game_state.f.hop1zuo1OfNonIAOwner.map(p => ({ color: p.color, prof: p.prof, side: cerke_verifier.Side.Downward })),
                currentBoard
            },
            opponent_has_just_moved_tam
        }
    } else {
        const currentBoard: cerke_verifier.Board = cerke_verifier.rotateBoard(currentBoard_ as cerke_verifier.Board);
        return {
            IA_is_down: false,
            tam_itself_is_tam_hue: game_state.tam_itself_is_tam_hue,
            f: {
                hop1zuo1OfUpward: game_state.f.hop1zuo1OfNonIAOwner.map(p => ({ color: p.color, prof: p.prof, side: cerke_verifier.Side.Upward })),
                hop1zuo1OfDownward: game_state.f.hop1zuo1OfIAOwner.map(p => ({ color: p.color, prof: p.prof, side: cerke_verifier.Side.Downward })),
                currentBoard
            },
            opponent_has_just_moved_tam
        }
    }
}

function toBotMove(mov: cerke_verifier.PureOpponentMove): BotMove {
    if (mov.type === "TamMove") {
        return { t: "normal", dat: mov };
    } else if (mov.type === "NonTamMove") {
        return { t: "normal", dat: mov };
    } else if (mov.type === "InfAfterStep") {
        return {
            t: "inf",
            dat: { type: "InfAfterStep", plannedDirection: mov.plannedDirection, src: mov.src, step: mov.step },
            after: [
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 0 ? null : mov.plannedDirection },
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 1 ? null : mov.plannedDirection },
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 2 ? null : mov.plannedDirection },
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 3 ? null : mov.plannedDirection },
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 4 ? null : mov.plannedDirection },
                { type: "AfterHalfAcceptance", dest: distance(mov.plannedDirection, mov.step) > 5 ? null : mov.plannedDirection },
            ]
        }
    } else {
        const _should_not_reach_here: never = mov;
        throw new Error("should not happen");
    }
}

export function generateBotMove_dumb_random(
    game_state: Readonly<GameStateWithSomeInfoHidden>,
    how_many_days_have_passed: number,
    opponent_has_just_moved_tam: boolean,
    ia_is_down_for_player_not_bot: boolean
): BotMove {
    const pure_game_state = toPureGameState(game_state, opponent_has_just_moved_tam, ia_is_down_for_player_not_bot);

    const candidates = not_from_hand_candidates(pure_game_state);
    while (true) {
        const mov = candidates[candidates.length * Math.random() | 0];
        if (mov.type === "InfAfterStep" || mov.type === "TamMove") { continue; }
        return toBotMove(mov);
    }
}


// 0.「入水判定が必要であるか、4以上の踏越え判定が必要である」を「やりづらい(unlikely to succeed)」と定義する。
//    相手がある駒を取るのが「やりづらい」に相当する、若しくは不可能である、という場合、それを「取られづらい」と定義する。
//   「入水判定も要らず、2以下の踏越え判定しか要らない」を「やりやすい(very likely to succeed)」と定義する。
// 
// 強制発動戦略：
// 1. 『勝ち確は行え』：駒を取って役が新たに完成し、その手がやりやすいなら、必ずそれを行う。
// 2. 『負け確は避けよ』：取られづらくない駒で相手が役を作れて、それを避ける手があるなら、避ける手を指せ。
// 3. 『激巫は行え』：取られづらい激巫を作ることができるなら、常にせよ。
// 4. 『ただ取りは行え』：駒を取ったとしてもそれがプレイヤーに取り返されづらいなら、取る
// 5. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
// 
// 序盤戦略：
// ・初期位置の弓は、定弓にするか王の前に来るかをやっておけ。
// ・初期位置が皇処端の兵は、斜め上に動いたり下がったりしておけ。
// ・駒を取られたとき、それを判定無しで取り返せるなら、取り返しておけ。
// ・初期位置の巫は、2つ前に出てみたりするといいかも。
// ・初期位置の虎は、船を踏んで皇処に入ってみるといいかも。
export function generateBotMove(
    game_state: Readonly<GameStateWithSomeInfoHidden>,
    how_many_days_have_passed: number,
    opponent_has_just_moved_tam: boolean,
    ia_is_down_for_player_not_bot: boolean
): BotMove {
    // 2. 『負け確は避けよ』：取られづらくない駒でプレイヤーが役を作れて、それを避ける手があるなら、避ける手を指せ。
    const in_danger = (() => {
        const pure_game_state_inverted = toPureGameState(game_state, opponent_has_just_moved_tam, !ia_is_down_for_player_not_bot); // botの視点で盤面を生成
        const candidates = not_from_hand_candidates(pure_game_state_inverted); // これで生成されるのはOpponentの動き、つまり bot の動き
        for (const player_cand of candidates) {
            if (is_victorious_hand(player_cand, pure_game_state_inverted) && is_likely_to_succeed(player_cand, pure_game_state_inverted)) {
                return true;
            }
        }
    })();


    const pure_game_state = toPureGameState(game_state, opponent_has_just_moved_tam, ia_is_down_for_player_not_bot); // プレイヤーの視点で盤面を生成
    const candidates = not_from_hand_candidates(pure_game_state); // これで生成されるのはOpponentの動き、つまり bot の動き

    bot_cand_loop:
    for (const bot_cand of candidates) {
        /****************
         *  強制発動戦略 
         ****************/

        // 1. 『勝ち確は行え』：駒を取って役が新たに完成し、その手がやりやすいなら、必ずそれを行う。
        if (is_victorious_hand(bot_cand, pure_game_state) && is_very_likely_to_succeed(bot_cand, pure_game_state)) {
            return toBotMove(bot_cand);
        }

        if (in_danger) {
            // 2. 『負け確は避けよ』：取られづらくない駒でプレイヤーが役を作れて、それを避ける手があるなら、避ける手を指せ。

            // 避ける手を指せていたと仮定して、次の状態を呼び出し、
            const next: PureGameState = apply_and_rotate(bot_cand, pure_game_state);
            const player_candidates = not_from_hand_candidates(next);
            for (const player_cand of player_candidates) {
                if (is_victorious_hand(player_cand, next) && is_likely_to_succeed(player_cand, next)) {

                    // 避ける手を指せていなかったことが判明した以上、この bot_cand を破棄して別の手を試してみる
                    continue bot_cand_loop;
                }
            }
        }

        // 3. 『激巫は行え』：取られづらい激巫を作ることができるなら、常にせよ。
        if (is_safe_gak_tuk_newly_generated(bot_cand, pure_game_state)) {
            return toBotMove(bot_cand);
        }

        // 4. 『ただ取りは行え』：駒を取ったとしてもそれがプレイヤーに取り返されづらいなら、取る。
        const maybe_capture_coord: AbsoluteCoord | null = if_capture_get_coord(bot_cand, pure_game_state);
        if (maybe_capture_coord) {
            const next: PureGameState = apply_and_rotate(bot_cand, pure_game_state);
            const player_candidates = not_from_hand_candidates(next);

            // 取り返すような手があるか？
            const take_back_exists = player_candidates.some(player_cand => {
                const capture_coord2: AbsoluteCoord | null = if_capture_get_coord(player_cand, pure_game_state);
                if (!capture_coord2) { return false; }
                if (maybe_capture_coord[0] === capture_coord2[0] && maybe_capture_coord[1] === capture_coord2[1]) {
                    // 取り返している
                    return true;
                }
                return false;
            });

            // 取り返せないのであれば、指してみてもいいよね
            if (!take_back_exists) {
                return toBotMove(bot_cand)
            }
        }



        /*************************
        *  以上、強制発動戦略でした
        **************************/
    }

    // If undetermined, just return a random move
    while (true) {
        const mov = candidates[candidates.length * Math.random() | 0];
        if (mov.type === "TamMove") {
            continue;
        } else if (mov.type === "InfAfterStep") {
            // 5. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
            if (mov.plannedDirection[0] === mov.src[0] && mov.plannedDirection[1] === mov.src[1]) { continue; }
        } else if (mov.data.type === "FromHand") {
            continue;
        } else {
            // 5. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
            if (mov.data.src[0] === mov.data.dest[0] && mov.data.src[1] === mov.data.dest[1]) { continue; }
        }
        return toBotMove(mov);
    }
}
