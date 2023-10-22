import { Injectable } from '@angular/core';
import { Tile, ScrabbleRules, TileSet } from './scrabble.models';
import { mapMany, range } from '../utils/array.utils';
import { RandomNumberGenerator } from '../utils/random-number.generator';

@Injectable({ providedIn: 'root' })
export class TileSetManager {
  constructor(private rnd: RandomNumberGenerator) {}

  buildTileSet(rules: ScrabbleRules): TileSet {
    const all: Tile[] = mapMany(rules.letters, (letter) =>
      range(letter.count).map(() => ({
        key: letter.key,
        text: letter.text ?? letter.key,
        value: letter.value,
        isBlank: letter.key === '?',
      }))
    );

    return {
      all,
      pile: [...all],
    };
  }

  drawRandomTiles(tileSet: TileSet, count: number): Tile[] {
    return range(Math.min(count, tileSet.pile.length)).map(() =>
      this.drawRandomTile(tileSet)
    );
  }

  private drawRandomTile(tileSet: TileSet): Tile {
    const index = Math.floor(this.rnd.next() * tileSet.pile.length);
    return tileSet.pile.splice(index, 1)[0];
  }
}
