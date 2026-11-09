import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VestidorVirtual } from './vestidor-virtual';

describe('VestidorVirtual', () => {
  let component: VestidorVirtual;
  let fixture: ComponentFixture<VestidorVirtual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VestidorVirtual],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(VestidorVirtual);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.includes('/catalogo/productos'))
      .flush([]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
