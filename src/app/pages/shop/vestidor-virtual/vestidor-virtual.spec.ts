import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VestidorVirtual } from './vestidor-virtual';

describe('VestidorVirtual', () => {
  let component: VestidorVirtual;
  let fixture: ComponentFixture<VestidorVirtual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VestidorVirtual],
    }).compileComponents();

    fixture = TestBed.createComponent(VestidorVirtual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
