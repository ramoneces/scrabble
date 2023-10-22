import { Injectable } from '@angular/core';
import { LexiconWord, Lexicon, WordIndex } from './scrabble.models';

@Injectable({ providedIn: 'root' })
export class LexiconManager {
  buildLexicon(lexiconData: string): Lexicon {
    const words = this.buildWords(lexiconData);
    const index = this.buildIndex(words);

    return { words, index };
  }

  private buildWords(data: string): LexiconWord[] {
    return data
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const [text, definition] = line.split('\t');
        return {
          text,
          definition,
        };
      });
  }

  private buildIndex(words: LexiconWord[]): WordIndex {
    const index: WordIndex = {};
    words.forEach((word) => {
      let current = index;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
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
