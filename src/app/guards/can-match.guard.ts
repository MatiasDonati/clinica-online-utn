import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const canMatchGuardObtenerUsuario: CanMatchFn = async (route, segments) => {

  const auth = inject(AuthService);
  const router = inject(Router);
  
  const usuario = await auth.obtenerUsuarioActual();

  if (usuario) {
    console.log('canMatchGuard Te deja entrar!');
    return true;
  }

  console.log('canMatchGuard No te deja entrar! Deberas loguearte primero.');
  // alert('Debes loguearte!')
  router.navigate(['/login']);
  // router.navigate(['/login'], { queryParams: { mensaje: 'loguearte para acceder' } });
  return false;
};
