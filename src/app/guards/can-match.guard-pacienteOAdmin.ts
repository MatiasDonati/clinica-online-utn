import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const canMatchPacienteOAdmin: CanMatchFn = async (
  route,
  segments
): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const email = await auth.obtenerUsuarioActual();
  if (!email) {
    console.log('No logueado. redirigiendo...');
    return router.createUrlTree(['/acceso-denegado']);
  }

  const tipo = await auth.obtenerTipoUsuario(email);
  if (tipo === 'paciente' || tipo === 'admin') {
    console.log('Acceso permitido para:', tipo);
    return true;
  }

  console.log('Acceso DENEGADO. Usuario tipo:', tipo);
  return router.createUrlTree(['/acceso-denegado']);
};
