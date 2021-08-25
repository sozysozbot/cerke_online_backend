import {
    AbsoluteCoord,
    NormalMove,
    InfAfterStep,
    AfterHalfAcceptance,
} from "cerke_online_api";
import { GameStateVisibleFromBot } from "./type_gamestate";

type Tuple6<T> = [T, T, T, T, T, T];
export type BotMove = { t: "normal", dat: NormalMove } | { t: "inf", dat: InfAfterStep, after: Tuple6<AfterHalfAcceptance> };

function fromAbsoluteCoord_([absrow, abscol]: AbsoluteCoord): [
    number,
    number,
] {
    let rowind: number;

    if (absrow === "A") {
        rowind = 0;
    } else if (absrow === "E") {
        rowind = 1;
    } else if (absrow === "I") {
        rowind = 2;
    } else if (absrow === "U") {
        rowind = 3;
    } else if (absrow === "O") {
        rowind = 4;
    } else if (absrow === "Y") {
        rowind = 5;
    } else if (absrow === "AI") {
        rowind = 6;
    } else if (absrow === "AU") {
        rowind = 7;
    } else if (absrow === "IA") {
        rowind = 8;
    } else {
        const _should_not_reach_here: never = absrow;
        throw new Error("does not happen");
    }

    let colind: number;

    if (abscol === "K") {
        colind = 0;
    } else if (abscol === "L") {
        colind = 1;
    } else if (abscol === "N") {
        colind = 2;
    } else if (abscol === "T") {
        colind = 3;
    } else if (abscol === "Z") {
        colind = 4;
    } else if (abscol === "X") {
        colind = 5;
    } else if (abscol === "C") {
        colind = 6;
    } else if (abscol === "M") {
        colind = 7;
    } else if (abscol === "P") {
        colind = 8;
    } else {
        const _should_not_reach_here: never = abscol;
        throw new Error("does not happen");
    }

    if (true) {
        return [rowind, colind];
    }
}

function getPiece(game_state: Readonly<GameStateVisibleFromBot>, coord: AbsoluteCoord) {
    const [i, j] = fromAbsoluteCoord_(coord);
    return game_state.f.currentBoard[i][j];
}

export function generateBotMove(game_state: Readonly<GameStateVisibleFromBot>, how_many_days_have_passed: number): BotMove {
    const all_coords: AbsoluteCoord[] = [
        ["A", "K"], ["A", "L"], ["A", "N"], ["A", "T"], ["A", "Z"], ["A", "X"], ["A", "C"], ["A", "M"], ["A", "P"],
        ["E", "K"], ["E", "L"], ["E", "N"], ["E", "T"], ["E", "Z"], ["E", "X"], ["E", "C"], ["E", "M"], ["E", "P"],
        ["I", "K"], ["I", "L"], ["I", "N"], ["I", "T"], ["I", "Z"], ["I", "X"], ["I", "C"], ["I", "M"], ["I", "P"],
        ["U", "K"], ["U", "L"], ["U", "N"], ["U", "T"], ["U", "Z"], ["U", "X"], ["U", "C"], ["U", "M"], ["U", "P"],
        ["O", "K"], ["O", "L"], ["O", "N"], ["O", "T"], ["O", "Z"], ["O", "X"], ["O", "C"], ["O", "M"], ["O", "P"],
        ["Y", "K"], ["Y", "L"], ["Y", "N"], ["Y", "T"], ["Y", "Z"], ["Y", "X"], ["Y", "C"], ["Y", "M"], ["Y", "P"],
        ["AI", "K"], ["AI", "L"], ["AI", "N"], ["AI", "T"], ["AI", "Z"], ["AI", "X"], ["AI", "C"], ["AI", "M"], ["AI", "P"],
        ["AU", "K"], ["AU", "L"], ["AU", "N"], ["AU", "T"], ["AU", "Z"], ["AU", "X"], ["AU", "C"], ["AU", "M"], ["AU", "P"],
        ["IA", "K"], ["IA", "L"], ["IA", "N"], ["IA", "T"], ["IA", "Z"], ["IA", "X"], ["IA", "C"], ["IA", "M"], ["IA", "P"],
    ];

    const [tam_position] = all_coords.filter(coord => getPiece(game_state, coord) === "Tam2");
    if (tam_position[0] === "O" && tam_position[1] === "Z") {
        return {
            t: "normal", dat: {
                type: "TamMove",
                stepStyle: "NoStep",
                src: tam_position,
                firstDest: ["O", "T"],
                secondDest: ["O", "N"],
            }
        }
    } else if (tam_position[0] === "O" && tam_position[1] === "N") {
        return {
            t: "normal", dat: {
                type: "TamMove",
                stepStyle: "NoStep",
                src: tam_position,
                firstDest: ["O", "T"],
                secondDest: ["O", "Z"],
            }
        }
    } else throw new Error("the bot cannot handle this tam position")
}