import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard: CanActivateFn = () =>
  inject(Auth).isAuthenticated() || inject(Router).createUrlTree(['/login']);
