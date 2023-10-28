import { Component, Input } from '@angular/core';
import { Tile } from 'src/app/game/scrabble.models';

@Component({
  selector: 'app-tile-display',
  templateUrl: './tile-display.component.html',
  styleUrls: ['./tile-display.component.scss'],
})
export class TileDisplayComponent {
  @Input() tile!: Tile;
}
