import {
  Board,
  Tile,
  LexiconWord,
  WordIndex,
  Game,
  Square,
  Move,
  Direction,
  ScrabbleRules,
  MoveWord,
  MultiplierKind,
} from './scrabble.models';
import { mapMany, maxMap as maxBy, sumMap } from '../utils/array.utils';

export class Player {
  name: string;
  score: number;
  rack: Tile[];

  constructor(name: string) {
    this.name = name;
    this.score = 0;
    this.rack = [];
  }

  takeTiles(tiles: Tile[]) {
    this.rack.push(...tiles);
  }

  getMove(game: Game): Move | undefined {
    const bestWord = this.findFirstMove(game);
    console.log(this.name, { bestWord });
    return bestWord;
  }

  // private findBestMove(game: Game): Move | undefined {
  //   const words = this.findWords(game.lexicon.index);
  //   console.log(this.name, {
  //     words,
  //     wordtexts: words.map((w) => w.moveWord.word),
  //   });

  //   if (words.length === 0) {
  //     return undefined;
  //   }

  //   if (words.length === 1) {
  //     return words[0];
  //   }

  //   return maxMap(words, (w) => sumMap(w.tiles, (t) => t.value));
  // }

  // private findWords(
  //   wordIndex: WordIndex,
  //   previousWord: Tile[] = [],
  //   rack: Tile[] = this.rack
  // ): Move[] {
  //   return mapMany(rack, (tile) => {
  //     const position = wordIndex[tile.letter];

  //     if (!position) {
  //       return [];
  //     }

  //     const result: Move[] = [];

  //     const currentWord = [...previousWord, tile];
  //     const remainingRack = rack.filter((t) => t !== tile);

  //     if (position?.word) {
  //       result.push({
  //         row: 7,
  //         col: 7,
  //         direction: Direction.Horizontal,
  //         moveWord: { word: position.word, tiles: currentWord },
  //       });
  //     }

  //     return result.concat(
  //       this.findWords(position, currentWord, remainingRack)
  //     );
  //   });
  // }

  private findFirstMove(game: Game): Move | undefined {
    const moves: Move[] = [];
    [Direction.Horizontal, Direction.Vertical].forEach((direction) => {
      const startingSquares = game.board.squares.filter((square) =>
        this.squareCanStartFirstWord(game.rules, square, direction)
      );
      startingSquares.forEach((startingSquare) => {
        moves.push(
          ...this.findWordsInDirection(
            startingSquare,
            direction,
            game.lexicon.index
          )
        );
      });
    });

    return maxBy(moves, (m) => m.moveWord.score);
  }

  private findWordsInDirection(
    currentSquare: Square | undefined,
    d: Direction,
    wordIndex: WordIndex,
    previousWordTiles: Tile[] = [],
    previousWordSquares: Square[] = [],
    rack: Tile[] = this.rack
  ): Move[] {
    // If we are out of bounds, no more moves can be done
    if (!currentSquare) return [];

    const result: Move[] = [];

    const tiles = currentSquare.tile ? [currentSquare.tile] : rack;

    tiles.forEach((tile) => {
      const indexPosition = wordIndex[tile.letter];

      if (!indexPosition) {
        return;
      }

      const currentWordTiles = [...previousWordTiles, tile];
      const currentWordSquares = [...previousWordSquares, currentSquare];
      const remainingRack = rack.filter((t) => t !== tile);

      if (indexPosition?.word) {
        result.push({
          moveWord: this.buildMoveWord(
            indexPosition.word,
            currentWordTiles,
            currentWordSquares
          ),
          additionalWords: [],
        });
      }

      result.push(
        ...this.findWordsInDirection(
          currentSquare.next[d],
          d,
          indexPosition,
          currentWordTiles,
          currentWordSquares,
          remainingRack
        )
      );
    });

    return result;
  }

  private buildMoveWord(
    word: LexiconWord,
    tiles: Tile[],
    squares: Square[]
  ): MoveWord {
    return {
      word,
      tiles,
      squares,
      score: this.computeScore(squares, tiles),
    };
  }

  private computeScore(squares: Square[], tiles: Tile[]): number {
    let wordScore = 0;
    let wordMultiplier = 1;
    tiles.forEach((tile, index) => {
      const letterMultiplier =
        squares[index].multiplier?.kind === MultiplierKind.Letter
          ? squares[index].multiplier!.value
          : 1;
      wordScore += tile.value * letterMultiplier;

      wordMultiplier *=
        squares[index].multiplier?.kind === MultiplierKind.Word
          ? squares[index].multiplier!.value
          : 1;
    });

    return wordScore * wordMultiplier;
  }

  private squareCanStartFirstWord(
    rules: ScrabbleRules,
    square: Square,
    d: Direction
  ): boolean {
    // The square can start the first word if a word can be formed that overlaps the starting square
    return !![square, ...square.nexts[d].slice(0, this.rack.length - 1)].find(
      (s) =>
        s.colIndex === rules.startingSquare.colIndex &&
        s.rowIndex === rules.startingSquare.rowIndex
    );
  }

  private findMoves(game: Game): Move[] {
    const horizontalStartingSquares = game.board.squares.filter((square) =>
      this.squareCanStartWord(square, Direction.Horizontal)
    );
    const verticalStartingSquares = game.board.squares.filter((square) =>
      this.squareCanStartWord(square, Direction.Vertical)
    );

    return [];
  }

  private squareCanStartWord(square: Square, d: Direction): boolean {
    // If the square has a previous square with a tile,
    // it cannot start a word.
    if (square.prev[d]?.tile) return false;

    // If the square has a tile,
    // it can only start a word if it has a next square without a tile.
    if (square.tile)
      return !square.prev[d]?.tile && square.nexts[d].some((s) => !s.tile);

    // If the square doesn't have a tile,
    // it can only start a word if it has at least a square with a tile in the next rack.length squares.
    return square.nexts[d].slice(0, this.rack.length).some((s) => !!s.tile);
  }
}
