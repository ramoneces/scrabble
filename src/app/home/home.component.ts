import { Component } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Game, MultiplierKind } from '../game/scrabble.models';
import { Player } from '../game/player';
import { GameManager } from '../game/game.manager';
import { RandomNumberGenerator } from '../utils/random-number.generator';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  title = 'Scrabble';
  game$: Observable<Game>;
  MultiplierKind = MultiplierKind;

  private _randomSeed: number = Math.floor(Math.random() * 10000);
  public get randomSeed(): number {
    return this._randomSeed;
  }
  public set randomSeed(v: number) {
    this._randomSeed = v;
    this.game$ = this.initializeGame();
  }

  constructor(
    private gameManager: GameManager,
    private rnd: RandomNumberGenerator
  ) {
    this.game$ = this.initializeGame();
  }

  private initializeGame(): Observable<Game> {
    this.rnd.seed = this.randomSeed;
    return this.gameManager
      .initializeGame(
        new Player('Player 1', this.rnd),
        new Player('Player 2', this.rnd)
      )
      .pipe(
        tap((game) => {
          this.gameManager.begin(game);
        })
      );
  }
}
