import {
    AbsoluteCoord,
} from "cerke_online_api";

export enum Color {
    Kok1, // Red, 赤
    Huok2, // Black, 黒
}

export enum Profession {
    Nuak1, // Vessel, 船, felkana
    Kauk2, // Pawn, 兵, elmer
    Gua2, // Rook, 弓, gustuer
    Kaun1, // Bishop, 車, vadyrd
    Dau2, // Tiger, 虎, stistyst
    Maun1, // Horse, 馬, dodor
    Kua2, // Clerk, 筆, kua
    Tuk2, // Shaman, 巫, terlsk
    Uai1, // General, 将, varxle
    Io, // King, 王, ales
}

export type Season = 0 | 1 | 2 | 3;
export type Log2_Rate = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/*
 * Theoretically speaking, it is necessary to distinguish x32 and x64
 * because it is possible to score 1 point (3+3-5).
 * Not that it will ever be of use in any real situation.
 */

export enum Side {
    IAOwner,
    NonIAOwner,
}

export interface NonTam2PieceNonIAOwner {
    color: Color; // The color of the piece
    prof: Profession; // The profession of the piece
    side: Side.NonIAOwner; // The side that the piece belongs to
}

export interface NonTam2PieceIAOwner {
    color: Color; // The color of the piece
    prof: Profession; // The profession of the piece
    side: Side.IAOwner; // The side that the piece belongs to
}

export interface Field {
    currentBoard: Board;
    hop1zuo1OfIAOwner: NonTam2PieceIAOwner[];
    hop1zuo1OfNonIAOwner: NonTam2PieceNonIAOwner[];
}


export interface NonTam2Piece {
    color: Color; // The color of the piece
    prof: Profession; // The profession of the piece
    side: Side; // The side that the piece belongs to
}


export type Piece = "Tam2" | NonTam2Piece;

export type Tuple9<T> = [T, T, T, T, T, T, T, T, T];

export type Board = Tuple9<Row>;
export type Row = Tuple9<Piece | null>;

export type Tuple4<T> = [T, T, T, T];

export interface GameStateVisibleFromBot {
    f: Field;
    tam_itself_is_tam_hue: boolean;
    is_IA_owner_s_turn: boolean;
    waiting_for_after_half_acceptance: null | {
        src: AbsoluteCoord;
        step: AbsoluteCoord;
    };
    season: Season;
    IA_owner_s_score: number;
    log2_rate: Log2_Rate;
}
