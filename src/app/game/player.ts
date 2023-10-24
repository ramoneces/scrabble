import { groupBy, mapMany, sumBy } from '../utils/array.utils';
import { RandomNumberGenerator } from '../utils/random-number.generator';
import {
  Direction,
  Game,
  LexiconWord,
  Move,
  MoveWord,
  MultiplierKind,
  Square,
  Tile,
  WordIndex,
} from './scrabble.models';

export class Player {
  score: number;
  rack: Tile[];

  constructor(
    public name: string,
    private rnd: RandomNumberGenerator,
    private game: Game
  ) {
    this.score = 0;
    this.rack = [];
  }

  takeTiles(tiles: Tile[]) {
    this.rack.push(...tiles);
  }

  getMove(): Move | undefined {
    const moves = mapMany(
      [Direction.Horizontal, Direction.Vertical],
      (direction) =>
        mapMany(this.game.board.squares, (startingSquare) =>
          this.findWordsInDirection(
            this.game.moves.length === 0,
            startingSquare,
            direction,
            this.game.lexicon.index
          )
        )
    );
    return this.selectBestMove(moves);
  }

  //#region 1st move

  private selectBestMove(moves: Move[]): Move | undefined {
    const movesByScore = groupBy(moves, (m) => m.score);
    const scores = Object.keys(movesByScore).map((score) => +score);

    if (scores.length === 0) {
      console.log('no moves: pass');
      return undefined;
    }

    const maxScore = Math.max(...scores);
    const bestMoves = movesByScore[maxScore];
    console.log(
      this.name,
      Object.values(movesByScore).map((m) =>
        m.map((m) => ({
          score: m.score,
          word: m.moveWord.word.keys,
        }))
      ),
      ...bestMoves.map((m) => ({
        score: m.score,
        word: m.moveWord.word.keys,
      }))
    );

    // Return a random move for now
    return bestMoves[Math.floor(this.rnd.next() * bestMoves.length)];
  }

  private squareCanStartFirstWord(square: Square, d: Direction): boolean {
    // The square can start the first word if a word can be formed that overlaps the starting square
    return !![square, ...square.nexts[d].slice(0, this.rack.length - 1)].find(
      (s) => s.isStartingSquare
    );
  }

  //#endregion

  //#region 2nd and subsequent moves

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

  //#endregion

  private findWordsInDirection(
    isFirstMove: boolean,
    currentSquare: Square | undefined,
    d: Direction,
    wordIndex: WordIndex,
    previousWordTiles: Tile[] = [],
    previousWordSquares: Square[] = [],
    previousWordLetters: string[] = [],
    rack: Tile[] = this.rack,
    tileFromRackUsed: boolean = false,
    wordIsAnchoredToBoard: boolean = false,
    previousConnectedWords: MoveWord[] = []
  ): Move[] {
    if (previousWordTiles.length === 0) {
      // If we are at the beginning of the word, we need to check if the square can start a word
      if (
        (isFirstMove && !this.squareCanStartFirstWord(currentSquare!, d)) ||
        (!isFirstMove && !this.squareCanStartWord(currentSquare!, d))
      ) {
        return [];
      }
    }

    // If we are out of bounds, no more moves can be done
    if (!currentSquare) return [];

    const result: Move[] = [];

    let tiles: Tile[];
    let usingTileFromRack: boolean;
    if (currentSquare.tile) {
      usingTileFromRack = false;
      wordIsAnchoredToBoard = true; // A tile from the board is used in the word
      tiles = [currentSquare.tile];
    } else {
      usingTileFromRack = true;
      tileFromRackUsed = true;
      tiles = rack;
      if (isFirstMove && currentSquare.isStartingSquare) {
        wordIsAnchoredToBoard = true; // A tile is placed in the starting point
      }
    }

    for (const tile of tiles) {
      let letters: string[];
      if (usingTileFromRack && tile.isBlank) {
        letters = Object.keys(wordIndex);
      } else {
        letters = [tile.key];
      }

      for (const letter of letters) {
        const indexPosition = wordIndex[letter];

        if (!indexPosition) {
          continue;
        }

        const currentConnectedWords = [...previousConnectedWords];
        if (usingTileFromRack) {
          // If the tile is not from the board new connected words can be formed
          const connectedWordResult: {
            wordFound: boolean;
            connectedWord?: MoveWord;
          } = this.searchConnectedWord(tile, letter, currentSquare, d);

          if (connectedWordResult.wordFound) {
            if (!connectedWordResult.connectedWord) {
              // An erroneus connected word was found
              continue;
            }

            currentConnectedWords.push(connectedWordResult.connectedWord);
            wordIsAnchoredToBoard = true; // A connected word was found
          }
        }

        const currentWordTiles = [...previousWordTiles, tile];
        const currentWordSquares = [...previousWordSquares, currentSquare];
        const currentWordLetters = [...previousWordLetters, letter];
        const remainingRack = rack.filter((t) => t !== tile);

        // If the word exists, at least a tile form rack was used and the next square is empty, we have a valid word
        if (
          indexPosition?.word &&
          tileFromRackUsed &&
          !currentSquare.next[d]?.tile
        ) {
          // The word needs to use a letter from the board or be connected to another word or overlap starting square in the first move
          if (wordIsAnchoredToBoard) {
            // A valid word was found
            result.push(
              this.buildMove(
                indexPosition.word,
                currentWordTiles,
                currentWordSquares,
                currentConnectedWords
              )
            );
          }
        }

        result.push(
          ...this.findWordsInDirection(
            isFirstMove,
            currentSquare.next[d],
            d,
            indexPosition,
            currentWordTiles,
            currentWordSquares,
            currentWordLetters,
            remainingRack,
            tileFromRackUsed,
            wordIsAnchoredToBoard,
            currentConnectedWords
          )
        );
      }
    }

    return result;
  }

  searchConnectedWord(
    mainWordTile: Tile,
    mainWordLetter: string,
    mainWordSquare: Square,
    mainWordDirection: Direction
  ): { wordFound: boolean; connectedWord?: MoveWord | undefined } {
    // Search words in the other direction
    const d =
      mainWordDirection === Direction.Horizontal
        ? Direction.Vertical
        : Direction.Horizontal;

    let connectedWordTiles: Tile[] = [mainWordTile];
    let connectedWordSquares: Square[] = [mainWordSquare];

    // Look for connected letters before
    let currentSquare = mainWordSquare.prev[d];
    while (currentSquare?.tile) {
      connectedWordTiles = [currentSquare.tile, ...connectedWordTiles];
      connectedWordSquares = [currentSquare, ...connectedWordSquares];
      currentSquare = currentSquare.prev[d];
    }

    // Look for connected letters after
    currentSquare = mainWordSquare.next[d];
    while (currentSquare?.tile) {
      connectedWordTiles = [...connectedWordTiles, currentSquare.tile];
      connectedWordSquares = [...connectedWordSquares, currentSquare];
      currentSquare = currentSquare.next[d];
    }

    const wordFound = connectedWordTiles.length > 1;
    if (!wordFound) {
      return { wordFound: false };
    }

    let lexiconIndex: WordIndex | undefined = this.game.lexicon.index;
    connectedWordTiles.forEach((tile) => {
      const letter = tile.isBlank ? mainWordLetter : tile.key;
      lexiconIndex = lexiconIndex?.[letter];
    });

    return {
      wordFound,
      connectedWord: lexiconIndex?.word
        ? this.buildMoveWord(
            lexiconIndex.word,
            connectedWordTiles,
            connectedWordSquares
          )
        : undefined,
    };
  }

  private buildMove(
    word: LexiconWord,
    wordTiles: Tile[],
    wordSquares: Square[],
    connectedWords: MoveWord[]
  ): Move {
    const moveWord = this.buildMoveWord(word, wordTiles, wordSquares);
    return {
      player: this,
      moveWord,
      connectedWords,
      score: moveWord.score + sumBy(connectedWords, (cw) => cw.score),
    };
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
      score: this.computeWordScore(squares, tiles),
    };
  }

  private computeWordScore(wordSquares: Square[], wordTiles: Tile[]): number {
    let wordScore = 0;
    let wordMultiplier = 1;
    let tilesPlayed = 0;
    wordTiles.forEach((tile, index) => {
      const square = wordSquares[index];

      let letterValue = tile.value;

      if (!square.tile) {
        // Only played tiles can apply multipliers
        const letterMultiplier =
          square.multiplier?.kind === MultiplierKind.Letter
            ? square.multiplier!.value
            : 1;
        letterValue *= letterMultiplier;

        wordMultiplier *=
          square.multiplier?.kind === MultiplierKind.Word
            ? square.multiplier!.value
            : 1;

        tilesPlayed++;
      }

      wordScore += letterValue;
    });

    wordScore *= wordMultiplier;

    if (tilesPlayed === this.game.rules.rackSize) {
      wordScore += 50; // Bingo!
    }

    return wordScore;
  }
}
