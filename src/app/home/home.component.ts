import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, debounceTime, tap } from 'rxjs';
import { GameManager } from '../game/game.manager';
import { Player } from '../game/player';
import { Game, MultiplierKind } from '../game/scrabble.models';
import { RandomNumberGenerator } from '../utils/random-number.generator';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnDestroy {
  title = 'Scrabble';

  MultiplierKind = MultiplierKind;

  refreshGame$ = new Subject<void>();

  game$?: Observable<Game>;

  private _randomSeed: number = Math.floor(Math.random() * 10000);
  public get randomSeed(): number {
    return this._randomSeed;
  }
  public set randomSeed(v: number) {
    this._randomSeed = v;
    this.refreshGame$.next();
  }

  public get botThinkTimeMs(): number {
    return localStorage.getItem('autoPlaySpeed')
      ? parseInt(localStorage.getItem('autoPlaySpeed')!)
      : 1000;
  }
  public set botThinkTimeMs(v: number) {
    localStorage.setItem('autoPlaySpeed', v?.toString() ?? '0');
    this.refreshGame$.next();
  }

  constructor(
    public gameManager: GameManager,
    private rnd: RandomNumberGenerator
  ) {
    this.refreshGame$.pipe(debounceTime(2000)).subscribe(() => {
      this.game$ = this.initializeGame();
    });

    this.refreshGame$.next();
  }

  ngOnDestroy(): void {
    this.refreshGame$.complete();
  }

  private initializeGame(): Observable<Game> {
    this.rnd.seed = this.randomSeed;
    return this.gameManager.initializeGame().pipe(
      tap((game) => {
        this.gameManager.addPlayers(
          game,
          new Player('Player 1', this.rnd, game),
          new Player('Player 2', this.rnd, game),
          new Player('Player 3', this.rnd, game)
        );
        this.gameManager.begin(game, this.botThinkTimeMs);
      })
    );
  }
}
