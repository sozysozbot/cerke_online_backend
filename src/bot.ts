import {
    NormalMove,
    InfAfterStep,
    AfterHalfAcceptance,
} from "cerke_online_api";
import { not_from_hand_candidates, PureGameState } from "cerke_verifier";
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
        throw new Error("infafterstep not yet handled");
    } else {
        const _should_not_reach_here: never = mov;
        throw new Error("should not happen");
    }
}

export function generateBotMove(
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