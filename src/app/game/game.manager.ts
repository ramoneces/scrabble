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
import { groupBy, last, orderBy, sumBy } from '../utils/array.utils';
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
        const game: Game = {
          rules,
          players,
          lexicon: this.lexiconManager.buildLexicon(lexiconData, rules),
          board: this.boardManager.buildBoard(rules),
          tileSet: this.tileSetManager.buildTileSet(rules),
          moves: [],
          winners: [],
        };

        return game;
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
        complete: () => {
          this.finishGame(game);
          console.log('Game over');
        },
      });
  }

  private finishGame(game: Game) {
    const provisionalWinners = this.getWinners(game);

    this.applyUnplayedTiles(game);

    const winners = this.getWinners(game);

    this.proclaimWinners(game, provisionalWinners, winners);
  }

  private proclaimWinners(
    game: Game,
    provisionalWinners: Player[],
    winners: Player[]
  ) {
    // The player with the highest final score wins the game. In case of a tie, the player with the highest score before adding or deducting unplayed letters wins.

    if (winners.length === 1 || provisionalWinners.length > 1) {
      game.winners = winners;
    } else {
      game.winners = provisionalWinners;
    }
  }

  private getWinners(game: Game): Player[] {
    const playersByScoreAscending = groupBy(
      orderBy(game.players, (player) => player.score),
      (player) => player.score
    );

    return last(Object.values(playersByScoreAscending))!;
  }

  private applyUnplayedTiles(game: Game) {
    // When the game ends, each player's score is reduced by the sum of his or her unplayed letters.
    let unplayedTilesScore = 0;
    game.players.forEach((player) => {
      const playerUnplayedTilesScore = sumBy(player.rack, (tile) => tile.value);
      player.score -= playerUnplayedTilesScore;

      unplayedTilesScore += playerUnplayedTilesScore;
    });

    // In addition, if a player has used all of his or her letters, the sum of the other players' unplayed letters is added to that player's score.
    game.players.forEach((player) => {
      if (player.rack.length === 0) {
        player.score += unplayedTilesScore;
      }
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
    return this.http.get(`assets/${environment.language}.lexicon`, {
      responseType: 'text',
    });
  }
}
