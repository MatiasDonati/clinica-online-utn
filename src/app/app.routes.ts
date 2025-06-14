import { Routes } from '@angular/router';
import { canMatchGuardSoloAdmin } from './guards/can-match.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent) 
  },
  { 
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent) 
  },
  { 
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) 
  },
  { 
    path: 'usuarios', 
    canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/usuarios/usuarios.component').then(c => c.UsuariosComponent) 
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./components/acceso-denegado/acceso-denegado.component').then(c => c.AccesoDenegadoComponent)
  },
  {
    path: 'mis-turnos',
    // canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(c => c.MisTurnosComponent)
  },
  {
    path: 'mis-turnos-especialista',
    // canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(c => c.MisTurnosEspecialistaComponent)
  },

  { path: '**', redirectTo: 'home' }

  // { 
  //   path: 'usuarios/listado', 
  //   // canMatch: [canMatchGuardObtenerUsuario],
  //   loadComponent: () => import('./components/usuarios/usuarios-lista/usuarios-lista.component').then(c => c.UsuariosListaComponent) 
  // },
  // { 
  //   path: 'juegos',
  //   canMatch: [canMatchGuardObtenerUsuario],
  //   loadChildren: () => import('./components/juegos/juegos-modulo/juegos.module').then(m => m.JuegosModule)
  // },
];
