import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, interval, map, takeWhile, tap } from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { takeUntilConsecutiveDuplicates } from '../utils/rxjs.utils';
import { BoardManager } from './board.manager';
import { LexiconManager } from './lexicon.manager';
import { Player } from './player';
import { Game, Move, ScrabbleRules } from './scrabble.models';
import { TileSetManager } from './tile-set.manager';

@Injectable({ providedIn: 'root' })
export class GameManager {
  constructor(
    private http: HttpClient,
    private boardManager: BoardManager,
    private tileSetManager: TileSetManager,
    private lexiconManager: LexiconManager
  ) {}

  initializeGame(...players: Player[]): Observable<Game> {
    return forkJoin([this.getLexicon(), this.getRules()]).pipe(
      map(([lexiconData, rules]) => {
        return {
          rules,
          players,
          lexicon: this.lexiconManager.buildLexicon(lexiconData, rules),
          board: this.boardManager.buildBoard(rules),
          tileSet: this.tileSetManager.buildTileSet(rules),
          moves: [],
        };
      }),
      tap(console.log)
    );
  }

  addPlayers(game: Game, ...players: Player[]) {
    game.players.push(...players);
  }

  begin(game: Game, thinkTime: number) {
    game.players.forEach((player) => {
      player.takeTiles(this.tileSetManager.drawRandomTiles(game.tileSet, 7));
    });

    interval(thinkTime)
      .pipe(
        takeWhile(() => game.players.some((player) => player.rack.length > 0)), // While some players can still play
        map((index) => game.players[index % game.players.length]), // Cycle through players
        map((player) => player.getMove()), // Get move from player
        tap((move) => {
          if (move) {
            this.applyMove(game, move);
            move.player.takeTiles(
              this.tileSetManager.drawRandomTiles(
                game.tileSet,
                game.rules.rackSize - move.player.rack.length
              )
            );
            game.moves.push(move);
          }

          return move;
        }),
        takeUntilConsecutiveDuplicates(
          game.players.length,
          (move) => move ?? 'Player passed'
        )
      )
      .subscribe({
        complete: () => console.log('Game over'),
      });
  }

  private applyMove(game: Game, move: Move) {
    this.boardManager.placeMove(move, game.lexicon);
    move.player.rack = move.player.rack.filter(
      (t) => !move.moveWord.tiles.includes(t)
    );
    move.player.score += move.score;
  }

  private getRules(): Observable<ScrabbleRules> {
    return this.http.get<ScrabbleRules>(
      `assets/rules.${environment.language}.json`
    );
  }

  private getLexicon(): Observable<string> {
    return this.http.get(`assets/lexicon.${environment.language}.txt`, {
      responseType: 'text',
    });
  }
}
