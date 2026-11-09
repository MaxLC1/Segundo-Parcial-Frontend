import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Auth } from './auth';
describe('Authenticated company selection', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
  });
  afterEach(() => localStorage.clear());
  function session(role: string) {
    localStorage.setItem(
      'token',
      'header.' + btoa(JSON.stringify({ id: 3, empresa_id: 2, rol: role })) + '.signature',
    );
  }
  it('ignores a manipulated company selector for a customer', () => {
    session('Cliente');
    localStorage.setItem('selected_empresa_id', '1');
    expect(TestBed.inject(Auth).getEmpresaId()).toBe(2);
  });
  it('ignores a manipulated company selector for a store administrator', () => {
    session('Administrador');
    localStorage.setItem('selected_empresa_id', '1');
    expect(TestBed.inject(Auth).getEmpresaId()).toBe(2);
  });
});
