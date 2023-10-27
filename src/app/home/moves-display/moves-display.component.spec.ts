import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MovesDisplayComponent } from './moves-display.component';

describe('MoveDisplayComponent', () => {
  let component: MovesDisplayComponent;
  let fixture: ComponentFixture<MovesDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MovesDisplayComponent],
    });
    fixture = TestBed.createComponent(MovesDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
