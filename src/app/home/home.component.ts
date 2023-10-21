import { Component } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Game, MultiplierKind } from '../game/scrabble.models';
import { Player } from '../game/player';
import { GameManager } from '../game/game.manager';

@Component({
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  title = 'Scrabble';
  game$: Observable<Game>;
  MultiplierKind = MultiplierKind;

  constructor(private gameManager: GameManager) {
    this.game$ = this.gameManager.initializeGame(new Player('Player 1')).pipe(
      tap((game) => {
        this.gameManager.begin(game);
      })
    );
  }
}
