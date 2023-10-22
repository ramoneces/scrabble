import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, tap } from 'rxjs';
import { Game, Move, ScrabbleRules } from './scrabble.models';
import { BoardManager } from './board.manager';
import { TileSetManager } from './tile-set.manager';
import { LexiconManager } from './lexicon.manager';
import { Player } from './player';

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
          lexicon: this.lexiconManager.buildLexicon(lexiconData),
          board: this.boardManager.buildBoard(rules),
          tileSet: this.tileSetManager.buildTileSet(rules),
          moves: [],
        };
      }),
      tap(console.log)
    );
  }

  begin(game: Game) {
    game.players.forEach((player) => {
      player.takeTiles(this.tileSetManager.drawRandomTiles(game.tileSet, 7));
    });

    let movesPlaced: boolean;
    do {
      movesPlaced = false;
      game.players.forEach((player) => {
        const move = player.getMove(game);
        console.log(move);

        if (move) {
          this.applyMove(game, player, move);
          player.takeTiles(
            this.tileSetManager.drawRandomTiles(
              game.tileSet,
              game.rules.rackSize - player.rack.length
            )
          );
          game.moves.push(move);
          movesPlaced = true;
        }
      });
    } while (movesPlaced);

    console.log('Game over');
  }

  private applyMove(game: Game, player: Player, move: Move) {
    this.boardManager.placeMove(game, move);
    player.rack = player.rack.filter((t) => !move.moveWord.tiles.includes(t));
    player.score += move.score;
  }

  private getRules(): Observable<ScrabbleRules> {
    return this.http.get<ScrabbleRules>('assets/rules.json');
  }

  private getLexicon(): Observable<string> {
    return this.http.get('assets/lexicon.en.txt', { responseType: 'text' });
  }
}
