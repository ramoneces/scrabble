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
}

export interface Board {
  squares: Square[];
  grid: Square[][];
  words: LexiconWord[];
  maxIndex: { [direction: number]: number };
}

export type WordIndex = { [letter: string]: WordIndex | undefined } & {
  word?: LexiconWord;
};

export interface LexiconWord {
  text: string;
  definition?: string;
}

export interface Tile {
  isBlank: boolean;
  letter: string;
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
  letters: { letter: string; count: number; value: number }[];
  squareMupltipliers: (string | null)[][];
  startingSquare: { rowIndex: number; colIndex: number };
  numberOfRows: number;
  numberOfCols: number;
  rackSize: number;
}

export interface Move {
  moveWord: MoveWord;
  connectedWords: MoveWord[];
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
