import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const email = await auth.obtenerUsuarioActual();
  if (email) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};
