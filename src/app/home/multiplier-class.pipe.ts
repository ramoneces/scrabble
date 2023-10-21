import { Pipe } from '@angular/core';
import { MultiplierKind, Multiplier } from '../game/scrabble.models';

// A pipe that converts multiplier to class

@Pipe({ name: 'multiplierClass' })
export class MultiplierClassPipe {
  transform(multiplier: Multiplier | undefined): string {
    if (!multiplier) {
      return '';
    }
    return `multiplier ${MultiplierKind[multiplier.kind].toLowerCase()}-x${
      multiplier.value
    }`;
  }
}
