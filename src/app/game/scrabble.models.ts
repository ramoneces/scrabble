import { Player } from './player';

export interface Game {
  players: Player[];
  board: Board;
  tileSet: TileSet;
  lexicon: Lexicon;
  rules: ScrabbleRules;
  moves: Move[];
}

export interface TileSet {
  all: Tile[];
  pile: Tile[];
}

export interface Lexicon {
  words: LexiconWord[];
  index: WordIndex;
  letterKeyToTextMap: { [key: string]: string };
}

export interface Board {
  squares: Square[];
  grid: Square[][];
  maxIndex: { [direction: number]: number };
}

export type WordIndex = { [letter: string]: WordIndex | undefined } & {
  word?: LexiconWord;
};

export interface LexiconWord {
  keys: string;
  text: string;
  definition?: string;
}

export interface Tile {
  isBlank: boolean;
  key: string;
  text: string;
  value: number;
}

export interface Square {
  rowIndex: number;
  colIndex: number;
  isStartingSquare: boolean;
  multiplier?: Multiplier;
  tile?: Tile;
  next: { [direction: number]: Square };
  prev: { [direction: number]: Square };
  nexts: { [direction: number]: Square[] };
  prevs: { [direction: number]: Square[] };
  isSelected?: boolean;
}

export interface Multiplier {
  value: number;
  kind: MultiplierKind;
}

export enum MultiplierKind {
  Letter,
  Word,
}

export interface ScrabbleRules {
  letters: {
    key: string;
    count: number;
    value: number;
    text?: string;
  }[];
  squareMupltipliers: (string | null)[][];
  startingSquare: { rowIndex: number; colIndex: number };
  numberOfRows: number;
  numberOfCols: number;
  rackSize: number;
}

export interface Move {
  player: Player;
  moveWord: MoveWord;
  connectedWords: MoveWord[];
  score: number;
  isSelected?: boolean;
}

export interface MoveWord {
  word: LexiconWord;
  tiles: Tile[];
  squares: Square[];
  score: number;
}

export enum Direction {
  Horizontal = 0,
  Vertical = 1,
}
