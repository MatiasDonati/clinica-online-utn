import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const canMatchGuardSoloPaciente: CanMatchFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const email = await auth.obtenerUsuarioActual();

  if (!email) {
    console.log('No logueado. chau');
    router.navigate(['/acceso-denegado']);
    return false;
  }

  const tipo = await auth.obtenerTipoUsuario(email);

  if (tipo === 'paciente') {
    console.log('Es paciente, puede pasar');
    return true;
  }

  console.log('No es paciente, es usuario de tipo:', tipo);
  router.navigate(['/acceso-denegado']);
  return false;
};
