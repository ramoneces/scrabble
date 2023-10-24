import { Injectable } from '@angular/core';
import { indexMapBy } from '../utils/array.utils';
import {
  Lexicon,
  LexiconWord,
  ScrabbleRules,
  WordIndex,
} from './scrabble.models';

@Injectable({ providedIn: 'root' })
export class LexiconManager {
  buildLexicon(lexiconData: string, rules: ScrabbleRules): Lexicon {
    const letterKeyToTextMap = indexMapBy(
      rules.letters.filter((letter) => !!letter.text),
      (letter) => letter.key,
      (letter) => letter.text!
    );
    const words = this.buildWords(lexiconData, letterKeyToTextMap);
    const index = this.buildIndex(words);

    return { words, index, letterKeyToTextMap };
  }

  private buildWords(
    data: string,
    letterKeyToTextMap: { [key: string]: string }
  ): LexiconWord[] {
    return data
      .split(/\r?\n/)
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const [keys, definition] = line.split('\t');
        return {
          keys,
          text: this.mapKeysToText(keys, letterKeyToTextMap),
          definition,
        };
      });
  }

  private mapKeysToText(
    keys: string,
    letterKeyToTextMap: { [key: string]: string }
  ): string {
    return keys
      .split('')
      .map((letter) => letterKeyToTextMap[letter] ?? letter)
      .join('');
  }

  private buildIndex(words: LexiconWord[]): WordIndex {
    const index: WordIndex = {};
    words.forEach((word) => {
      let current = index;
      for (let i = 0; i < word.keys.length; i++) {
        const letter = word.keys[i];
        if (!current[letter]) {
          current[letter] = {};
        }
        current = current[letter]!;
      }
      current.word = word;
    });
    return index;
  }
}
