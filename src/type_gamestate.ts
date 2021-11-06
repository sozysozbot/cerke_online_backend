import {
    Color, Profession, Season, Log2_Rate
} from "cerke_online_api";

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
    season: Season;
    IA_owner_s_score: number;
    log2_rate: Log2_Rate;
}

