import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
function isApi(url: string): boolean {
  const target = new URL(url, location.href);
  const api = new URL(environment.apiUrl, location.href);
  return (
    target.origin === api.origin &&
    (target.pathname === api.pathname ||
      target.pathname.startsWith(api.pathname.replace(/\/$/, '') + '/'))
  );
}
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  return next(
    token && isApi(req.url) ? req.clone({ url: req.params.has('empresa_id') ? req.url : withSelectedTenant(req.url, token), setHeaders: { Authorization: `Bearer ${token}` } }) : req,
  );
};

export function withSelectedTenant(url: string, token: string): string {
  if (!isApi(url)) return url;
  try {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (claims.rol !== 'AdministradorPlataforma') return url;
    const target = new URL(url, location.href);
    const base = new URL(environment.apiUrl, location.href).pathname.replace(/\/$/, '');
    const route = target.pathname.slice(base.length);
    // Platform administration lists all companies; operational modules use the selection.
    if (/^\/(saas|seguridad|bitacora)(\/|$)/.test(route) || target.searchParams.has('empresa_id')) return url;
    const tenant = Number(localStorage.getItem('selected_empresa_id') || claims.empresa_id || 1);
    if (!Number.isSafeInteger(tenant) || tenant < 1) return url;
    target.searchParams.set('empresa_id', String(tenant));
    return target.toString();
  } catch {
    return url;
  }
}
export function installApiFetch() {
  const original = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    const token = localStorage.getItem('token');
    if (!token || !isApi(url)) return original(input, init);
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    headers.set('Authorization', `Bearer ${token}`);
    const scopedUrl = withSelectedTenant(url, token);
    const scopedInput = input instanceof Request ? new Request(scopedUrl, input) : scopedUrl;
    return original(scopedInput, { ...init, headers });
  };
}
