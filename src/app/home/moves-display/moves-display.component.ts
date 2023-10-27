import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Move } from 'src/app/game/scrabble.models';

@Component({
  selector: 'app-moves-display',
  templateUrl: './moves-display.component.html',
  styleUrls: ['./moves-display.component.scss'],
})
export class MovesDisplayComponent {
  @Input() moves: Move[] = [];

  @Output()
  moveClicked = new EventEmitter<Move>();
}
