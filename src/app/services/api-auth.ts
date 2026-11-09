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
    token && isApi(req.url) ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req,
  );
};
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
    return original(input, { ...init, headers });
  };
}
