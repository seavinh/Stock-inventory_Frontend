import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupDialog } from './popup-dialog';

describe('PopupDialog', () => {
  let component: PopupDialog;
  let fixture: ComponentFixture<PopupDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopupDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopupDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
