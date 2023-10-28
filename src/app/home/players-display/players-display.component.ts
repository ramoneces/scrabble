import { Component, Input } from '@angular/core';
import { Player } from 'src/app/game/player';

@Component({
  selector: 'app-players-display',
  templateUrl: './players-display.component.html',
  styleUrls: ['./players-display.component.scss'],
})
export class PlayersDisplayComponent {
  @Input() players: Player[] = [];
}
