import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NextJokesBtnComponent } from './next-jokes-btn.component';

describe('NextJokesBtnComponent', () => {
  let component: NextJokesBtnComponent;
  let fixture: ComponentFixture<NextJokesBtnComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NextJokesBtnComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NextJokesBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
