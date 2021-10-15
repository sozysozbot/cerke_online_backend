import {
    NormalMove,
    InfAfterStep,
    AfterHalfAcceptance,
    AbsoluteCoord,
    TacticsKey,
} from "cerke_online_api";
import { apply_and_rotate, if_capture_get_coord, is_likely_to_succeed, is_safe_gak_tuk_newly_generated, is_very_likely_to_succeed, not_from_hand_candidates, PureGameState, is_victorious_hand, distance, coordEq } from "cerke_verifier";
import { GameStateVisibleFromBot as GameStateWithSomeInfoHidden, Side } from "./type_gamestate";
import * as cerke_verifier from "cerke_verifier";
import { knuthShuffle } from "knuth-shuffle";

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
// 1. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
// 2. 『無駄踏みは避けよ』：踏まずに同じ目的地に行く手段があるなら、踏むな。
// 3. 『勝ち確は行え』：駒を取って役が新たに完成し、その手がやりやすいなら、必ずそれを行う。
// 4. 『負け確は避けよ』：取られづらくない駒で相手が役を作れて、それを避ける手があるなら、避ける手を指せ。一方で、「手を指した後で、取られづらくない駒で相手が役を作れる」もダメだなぁ。
// 5. 『激巫は行え』：取られづらい激巫を作ることができるなら、常にせよ。
// 6. 『ただ取りは行え』：駒を取ったとしてもそれがプレイヤーに取り返されづらい、かつ、その取る手そのものがやりづらくないなら、取る。
export function generateBotMove(
    game_state: Readonly<GameStateWithSomeInfoHidden>,
    how_many_days_have_passed: number,
    opponent_has_just_moved_tam: boolean,
    ia_is_down_for_player_not_bot: boolean
): { tactics: TacticsKey, bot_move: BotMove } {
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

    // これで生成されるのはOpponentの動き、つまり bot の動き
    // シャッフルしておくことで、強制発動戦略で同じ手ばかり選ばれるのを防ぐことができる
    const raw_candidates = knuthShuffle(not_from_hand_candidates(pure_game_state));
    const candidates = raw_candidates.filter(bot_cand => {
        if (bot_cand.type === "TamMove") {
            // 負け確回避とかなら読んでほしいので、候補に残す
            // ただし、opponent_has_just_moved_tam であるなら tam2 ty sak2 を防ぐべく除外する
            return !opponent_has_just_moved_tam;
        } else if (bot_cand.type === "InfAfterStep") {
            // 1. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
            if (eq(bot_cand.plannedDirection, bot_cand.src)) { return false; }

            // 2. 『無駄踏みは避けよ』：踏まずに同じ目的地に行く手段があるなら、踏むな。
            const better_option_exists = raw_candidates.some(c => {
                if (c.type === "TamMove") { return false; }
                if (c.type === "InfAfterStep") { return false; }
                if (c.data.type === "FromHand") { return false; }
                // 有限で代用できるときも有限で代用しよう
                return (eq(bot_cand.src, c.data.src) && eq(bot_cand.plannedDirection, c.data.dest))
            });
            if (better_option_exists) { return false; }

            // 6マス以上飛ぶのは今回のルールでは無理です
            if (distance(bot_cand.plannedDirection, bot_cand.step) > 5) {
                return false;
            }

        } else if (bot_cand.type === "NonTamMove") {
            if (bot_cand.data.type === "FromHand") {
                // 負け確回避とかなら読んでほしいので、除外しない
                return true;
            } else {
                // 1. 『無駄足は避けよ』：そもそもスタートとゴールが同一地点の手ってほぼ指さなくない？
                if (eq(bot_cand.data.src, bot_cand.data.dest)) { return false; }

                if (bot_cand.data.type === "SrcStepDstFinite") {
                    const src = bot_cand.data.src;
                    const dest = bot_cand.data.dest;

                    // 2. 『無駄踏みは避けよ』：踏まずに同じ目的地に行く手段があるなら、踏むな。
                    const better_option_exists = raw_candidates.some(c => {
                        if (c.type === "TamMove") { return false; }
                        else if (c.type === "InfAfterStep") { return false; }
                        else if (c.type === "NonTamMove") {
                            if (c.data.type === "FromHand") { return false; }
                            else if (c.data.type === "SrcDst") {
                                return eq(src, c.data.src) && eq(dest, c.data.dest)
                            } else { return false; }
                        } else {
                            const _should_not_reach_here: never = c;
                            throw new Error("should not reach here")
                        }
                    });
                    if (better_option_exists) { return false; }
                }
            }
        }
        return true;
    });

    let filtered_candidates: cerke_verifier.PureOpponentMove[] = [];
    bot_cand_loop:
    for (const bot_cand of candidates) {
        /****************
         *  強制発動戦略 
         ****************/

        // 3. 『勝ち確は行え』：駒を取って役が新たに完成し、その手がやりやすいなら、必ずそれを行う。
        if (is_victorious_hand(bot_cand, pure_game_state) && is_very_likely_to_succeed(bot_cand, pure_game_state)) {
            return { tactics: "victory_almost_certain", bot_move: toBotMove(bot_cand) };
        }

        // 4. 『負け確は避けよ』：取られづらくない駒でプレイヤーが役を作れて、それを避ける手があるなら、避ける手を指せ。「手を指した後で、取られづらくない駒で相手が役を作れる」はダメだなぁ。

        //　in_danger: 避ける手を指せていたと仮定して、次の状態を呼び出し、
        // !in_danger: 次の状態を呼び出すと、今指したのが負けを確定させる手かどうかを調べることができる
        const next: PureGameState = apply_and_rotate(bot_cand, pure_game_state);
        const player_candidates = not_from_hand_candidates(next);
        for (const player_cand of player_candidates) {
            if (is_victorious_hand(player_cand, next) && is_likely_to_succeed(player_cand, next)) {

                //  in_danger: 避ける手を指せていなかったことが判明した以上、この bot_cand を破棄して別の手を試してみる
                // !in_danger: 負けを確定させる手を指していた以上、この bot_cand を破棄して別の手を試してみる
                continue bot_cand_loop;
            }
        }
        
        // 5. 『激巫は行え』：取られづらい激巫を作ることができるなら、常にせよ。
        if (is_safe_gak_tuk_newly_generated(bot_cand, pure_game_state)) {
            return { tactics: "strengthened_shaman", bot_move: toBotMove(bot_cand) };
        }

        // 6. 『ただ取りは行え』：駒を取ったとしてもそれがプレイヤーに取り返されづらい、かつ、その取る手そのものがやりづらくないなら、取る。
        const maybe_capture_coord: AbsoluteCoord | null = if_capture_get_coord(bot_cand, pure_game_state);
        if (maybe_capture_coord) {
            const next: PureGameState = apply_and_rotate(bot_cand, pure_game_state);
            const player_candidates = not_from_hand_candidates(next);

            // 取り返すような手があるか？
            const take_back_exists = player_candidates.some(player_cand => {
                const capture_coord2: AbsoluteCoord | null = if_capture_get_coord(player_cand, pure_game_state);
                if (!capture_coord2) { return false; }
                if (eq(maybe_capture_coord, capture_coord2)) {
                    // 取り返している
                    return true;
                }
                return false;
            });

            // 取り返せない、かつ、やりづらくない手であれば、指してみてもいいよね
            if (!take_back_exists && is_likely_to_succeed(bot_cand, pure_game_state)) {
                return { tactics: "free_lunch", bot_move: toBotMove(bot_cand) }
            }
        }

        if (bot_cand.type === "TamMove") {
            // まあ皇の動きは当分読まなくていいわ
            continue;
        } else if (bot_cand.type === "NonTamMove") {
            // まあ手駒を打つ手も当分読まなくていいわ
            if (bot_cand.data.type === "FromHand") {
                continue;
            }
        }

        /*************************
        *  以上、強制発動戦略でした
        **************************/

        // 生き延びた候補を収容
        filtered_candidates.push(bot_cand);
    }

    // 何やっても負け確、とかだと多分指す手がなくなるので、じゃあその時は好き勝手に指す
    if (filtered_candidates.length === 0) {
        return { tactics: "loss_almost_certain", bot_move: toBotMove(candidates[candidates.length * Math.random() | 0]) };
    }
    while (true) {
        const bot_cand = filtered_candidates[filtered_candidates.length * Math.random() | 0];
        return { tactics: in_danger ? "avoid_defeat" : "neutral", bot_move: toBotMove(bot_cand)};
    }
}

function eq(a: AbsoluteCoord, b: AbsoluteCoord): boolean {
    return a[0] === b[0] && a[1] === b[1];
}