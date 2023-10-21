import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RandomNumberGenerator {
  private seed: number = 3;

  next(): number {
    var x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}
