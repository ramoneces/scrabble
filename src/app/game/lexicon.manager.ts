import { Injectable } from '@angular/core';
import {
  LexiconWord,
  Lexicon,
  WordIndex,
  ScrabbleRules,
} from './scrabble.models';
import { groupBy, groupMapBy } from '../utils/array.utils';

@Injectable({ providedIn: 'root' })
export class LexiconManager {
  buildLexicon(lexiconData: string, rules: ScrabbleRules): Lexicon {
    const words = this.buildWords(lexiconData, rules);
    const index = this.buildIndex(words);

    return { words, index };
  }

  private buildWords(data: string, rules: ScrabbleRules): LexiconWord[] {
    const letterReplaceMap = groupMapBy(
      rules.letters.filter((letter) => !!letter.text),
      (letter) => letter.key,
      (letter) => letter.text
    );
    return data
      .split(/\r?\n/)
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const [keys, definition] = line.split('\t');
        return {
          keys,
          text: keys
            .split('')
            .map((letter) => letterReplaceMap[letter]?.[0] || letter)
            .join(''),
          definition,
        };
      });
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
