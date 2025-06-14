import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const canMatchGuardSoloEspecialista: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const email = await auth.obtenerUsuarioActual();

  if (!email) {
    console.log('No logueado. chau');
    router.navigate(['/acceso-denegado']);
    return false;
  }

  const tipo = await auth.obtenerTipoUsuario(email);

  if (tipo === 'especialista') {
    console.log('Es especialista, puede pasar');
    return true;
  }

  console.log('No es especialista, es usuario de tipo:', tipo);
  router.navigate(['/acceso-denegado']);
  return false;
};
