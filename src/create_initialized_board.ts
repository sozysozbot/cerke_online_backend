import { Color, Profession } from "cerke_online_api";
import { Side, Board } from "./type_gamestate";

export function create_initialized_board(): Board {
  return [
    [
      {
        color: Color.Huok2,
        prof: Profession.Kua2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Maun1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Kaun1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Uai1,
        side: Side.NonIAOwner,
      },
      { color: Color.Kok1, prof: Profession.Io, side: Side.NonIAOwner },
      {
        color: Color.Kok1,
        prof: Profession.Uai1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kaun1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Maun1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kua2,
        side: Side.NonIAOwner,
      },
    ],
    [
      {
        color: Color.Kok1,
        prof: Profession.Tuk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Gua2,
        side: Side.NonIAOwner,
      },
      null,
      {
        color: Color.Kok1,
        prof: Profession.Dau2,
        side: Side.NonIAOwner,
      },
      null,
      {
        color: Color.Huok2,
        prof: Profession.Dau2,
        side: Side.NonIAOwner,
      },
      null,
      {
        color: Color.Huok2,
        prof: Profession.Gua2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Tuk2,
        side: Side.NonIAOwner,
      },
    ],
    [
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Nuak1,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Kok1,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.NonIAOwner,
      },
    ],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, "Tam2", null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.IAOwner,
      },
      { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.IAOwner,
      },
      { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner },
      {
        color: Color.Huok2,
        prof: Profession.Nuak1,
        side: Side.IAOwner,
      },
      { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.IAOwner,
      },
      { color: Color.Kok1, prof: Profession.Kauk2, side: Side.IAOwner },
      {
        color: Color.Huok2,
        prof: Profession.Kauk2,
        side: Side.IAOwner,
      },
    ],
    [
      { color: Color.Huok2, prof: Profession.Tuk2, side: Side.IAOwner },
      { color: Color.Huok2, prof: Profession.Gua2, side: Side.IAOwner },
      null,
      { color: Color.Huok2, prof: Profession.Dau2, side: Side.IAOwner },
      null,
      { color: Color.Kok1, prof: Profession.Dau2, side: Side.IAOwner },
      null,
      { color: Color.Kok1, prof: Profession.Gua2, side: Side.IAOwner },
      { color: Color.Kok1, prof: Profession.Tuk2, side: Side.IAOwner },
    ],
    [
      { color: Color.Kok1, prof: Profession.Kua2, side: Side.IAOwner },
      { color: Color.Kok1, prof: Profession.Maun1, side: Side.IAOwner },
      { color: Color.Kok1, prof: Profession.Kaun1, side: Side.IAOwner },
      { color: Color.Kok1, prof: Profession.Uai1, side: Side.IAOwner },
      { color: Color.Huok2, prof: Profession.Io, side: Side.IAOwner },
      { color: Color.Huok2, prof: Profession.Uai1, side: Side.IAOwner },
      {
        color: Color.Huok2,
        prof: Profession.Kaun1,
        side: Side.IAOwner,
      },
      {
        color: Color.Huok2,
        prof: Profession.Maun1,
        side: Side.IAOwner,
      },
      { color: Color.Huok2, prof: Profession.Kua2, side: Side.IAOwner },
    ],
  ]
}