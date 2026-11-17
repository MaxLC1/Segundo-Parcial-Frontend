import { afterEach, expect, it } from 'vitest';
import { withSelectedTenant } from './api-auth';
import { environment } from '../../environments/environment';

const token = (rol: string) => 'e30.' + btoa(JSON.stringify({ rol, empresa_id: 1 })) + '.test';
afterEach(() => localStorage.clear());

it('passes the selected platform company to branches, products and other operations', () => {
  localStorage.setItem('selected_empresa_id', '2');
  for (const path of ['/sucursales/sucursales', '/catalogo/productos', '/ventas']) {
    const url = withSelectedTenant(environment.apiUrl + path, token('AdministradorPlataforma'));
    expect(new URL(url, location.href).searchParams.get('empresa_id')).toBe('2');
  }
});

it('preserves explicit filters and global administration, and never changes normal users', () => {
  localStorage.setItem('selected_empresa_id', '2');
  for (const path of ['/saas/empresas', '/seguridad/usuarios', '/bitacora/', '/ventas?empresa_id=3']) {
    const url = environment.apiUrl + path;
    expect(withSelectedTenant(url, token('AdministradorPlataforma'))).toBe(url);
  }
  const url = environment.apiUrl + '/sucursales/sucursales';
  expect(withSelectedTenant(url, token('Administrador'))).toBe(url);
  expect(withSelectedTenant('https://example.com/file', token('AdministradorPlataforma'))).toBe('https://example.com/file');
});
