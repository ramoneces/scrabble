import { Component, Input } from '@angular/core';
import { Move } from 'src/app/game/scrabble.models';

@Component({
  selector: 'app-move-display',
  templateUrl: './move-display.component.html',
  styleUrls: ['./move-display.component.scss'],
})
export class MoveDisplayComponent {
  @Input() moves: Move[] = [];
}
