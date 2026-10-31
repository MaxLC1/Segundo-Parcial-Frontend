import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as string[];

  if (auth.hasRole(allowedRoles)) {
    return true;
  }

  // Si no tiene permiso, lo mandamos al login o a otra pantalla por defecto
  router.navigate(['/login']);
  return false;
};

