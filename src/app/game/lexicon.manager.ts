import { Injectable } from '@angular/core';
import { LexiconWord, Lexicon, WordIndex } from './scrabble.models';

@Injectable({ providedIn: 'root' })
export class LexiconManager {
  buildLexicon(lexiconData: string): Lexicon {
    const words = this.buildWords(lexiconData);
    const index = this.buildIndex(words);

    return { words, index };
  }

  private buildWords(data: string) {
    return data
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const [word, definition] = line.split('\t');
        return {
          word,
          definition,
        };
      });
  }

  private buildIndex(words: LexiconWord[]): WordIndex {
    const index: WordIndex = {};
    console.time('index');
    words.forEach((word) => {
      let current = index;
      for (let i = 0; i < word.word.length; i++) {
        const letter = word.word[i];
        if (!current[letter]) {
          current[letter] = {};
        }
        current = current[letter]!;
      }
      current.word = word;
    });
    console.timeEnd('index');
    return index;
  }
}
