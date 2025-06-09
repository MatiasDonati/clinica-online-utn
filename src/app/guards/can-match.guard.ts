import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const canMatchGuardSoloAdmin: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const email = await auth.obtenerUsuarioActual();

  if (!email) {
    console.log('No logueado. chau');
    router.navigate(['/login']);
    return false;
  }

  const tipo = await auth.obtenerTipoUsuario(email);

  if (tipo === 'admin') {
    console.log('Es admin, puede pasar');
    return true;
  }

  console.log('No es admin es usuario de tipo:', tipo);
  router.navigate(['/']);
  return false;
};
