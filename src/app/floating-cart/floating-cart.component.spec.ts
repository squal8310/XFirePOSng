import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloatingCartComponent } from './floating-cart.component';

describe('FloatingCartComponent', () => {
  let component: FloatingCartComponent;
  let fixture: ComponentFixture<FloatingCartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingCartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingCartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
