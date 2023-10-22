import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RandomNumberGenerator {
  seed: number = 1;

  next(): number {
    var x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}
