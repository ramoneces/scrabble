import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  filter,
  forkJoin,
  interval,
  map,
  startWith,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs';
import { environment } from 'src/environments/environment.development';
import { takeUntilConsecutiveDuplicates } from '../utils/rxjs.utils';
import { BoardManager } from './board.manager';
import { LexiconManager } from './lexicon.manager';
import { Player } from './player';
import { Game, Move, ScrabbleRules, Tile } from './scrabble.models';
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

  begin(game: Game, thinkTime: number, paused$: Observable<boolean>) {
    game.players.forEach((player) => {
      player.takeTiles(this.tileSetManager.drawRandomTiles(game.tileSet, 7));
    });

    interval(thinkTime)
      .pipe(
        withLatestFrom(paused$.pipe(startWith(false))), // Get paused state
        filter(([_, isPaused]) => !isPaused), // Filter out if paused
        map((_, turnIndex) => turnIndex), // Keep track of turns
        takeWhile(() => game.players.some((player) => player.rack.length > 0)), // While some players can still play
        map((turnIndex) =>
          game.players[turnIndex % game.players.length].getMove()
        ), // Get move from next player
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

  toggleTileMoveSelection(game: Game, tile: Tile) {
    const move = game.moves.find((move) => move.moveWord.tiles.includes(tile));

    if (move) {
      this.toggleMoveSelection(game, move);
    }
  }

  toggleMoveSelection(game: Game, move: Move) {
    if (move.isSelected) {
      this.setMoveIsSelected(move, false);
      return;
    }

    game.moves.forEach((move) => {
      this.setMoveIsSelected(move, false);
    });
    this.setMoveIsSelected(move, true);
  }

  private setMoveIsSelected(move: Move, isSelected: boolean) {
    move.moveWord.squares.forEach((square) => {
      square.isSelected = isSelected;
    });
    move.connectedWords.forEach((connectedWord) => {
      connectedWord.squares.forEach((square) => {
        square.isSelected = isSelected;
      });
    });
    move.isSelected = isSelected;
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
