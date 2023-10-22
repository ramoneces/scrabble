import { Injectable } from '@angular/core';
import {
  Board,
  Multiplier,
  MultiplierKind,
  Game,
  ScrabbleRules,
  Square,
  Move,
  Direction,
} from './scrabble.models';

@Injectable({ providedIn: 'root' })
export class BoardManager {
  buildBoard(rules: ScrabbleRules): Board {
    const grid: Square[][] = [];

    for (let rowIndex = 0; rowIndex < rules.numberOfRows; rowIndex++) {
      grid[rowIndex] = [];
      for (let colIndex = 0; colIndex < rules.numberOfCols; colIndex++) {
        grid[rowIndex][colIndex] = {
          rowIndex,
          colIndex,
          isStartingSquare:
            rowIndex === rules.startingSquare.rowIndex &&
            colIndex === rules.startingSquare.colIndex,
          multiplier: this.getMultiplier(
            rules.squareMupltipliers[rowIndex]?.[colIndex]
          ),
        } as Square;
      }
    }

    this.linkSquaresNeighbor(grid);

    return {
      grid,
      squares: grid.flat(),
      maxIndex: {
        [Direction.Horizontal]: rules.numberOfCols - 1,
        [Direction.Vertical]: rules.numberOfRows - 1,
      },
    };
  }

  placeMove(game: Game, move: Move) {
    for (let i = 0; i < move.moveWord.tiles.length; i++) {
      const tile = move.moveWord.tiles[i];
      if (tile.isBlank) {
        tile.key = move.moveWord.word.keys[i];
      }
      move.moveWord.squares[i].tile = tile;
    }
  }

  private linkSquaresNeighbor(grid: Square[][]) {
    grid.forEach((row, rowIndex) => {
      row.forEach((square, colIndex) => {
        square.next = {
          [Direction.Horizontal]: grid[rowIndex]?.[colIndex + 1],
          [Direction.Vertical]: grid[rowIndex + 1]?.[colIndex],
        };
        square.prev = {
          [Direction.Horizontal]: grid[rowIndex]?.[colIndex - 1],
          [Direction.Vertical]: grid[rowIndex - 1]?.[colIndex],
        };
        square.nexts = {
          [Direction.Horizontal]: grid[rowIndex]?.slice(colIndex + 1),
          [Direction.Vertical]: grid
            .slice(rowIndex + 1)
            .map((row) => row[colIndex]),
        };
        square.prevs = {
          [Direction.Horizontal]: grid[rowIndex]?.slice(0, colIndex),
          [Direction.Vertical]: grid
            .slice(0, rowIndex)
            .map((row) => row[colIndex]),
        };
      });
    });
  }

  private getMultiplier(
    multiplier: string | null | undefined
  ): Multiplier | undefined {
    if (!multiplier) {
      return undefined;
    }

    // Use regex to parse the multiplier string
    const matches = multiplier.match(/(\d+)(\w+)/)!;
    const value = parseInt(matches[1]);
    const kind =
      matches[2] === 'L'
        ? MultiplierKind.Letter
        : matches[2] === 'W'
        ? MultiplierKind.Word
        : undefined;

    if (kind === undefined) {
      throw new Error(`Invalid multiplier kind: ${matches[2]}`);
    }

    return { value, kind };
  }
}
