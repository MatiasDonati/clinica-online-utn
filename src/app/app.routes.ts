import { Routes } from '@angular/router';
import { canMatchGuardObtenerUsuario } from './guards/can-match.guard';

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
    // canMatch: [canMatchGuardObtenerUsuario],
    loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) 
  },
  { 
    path: 'usuarios', 
    // canMatch: [canMatchGuardObtenerUsuario],
    loadComponent: () => import('./components/usuarios/usuarios.component').then(c => c.UsuariosComponent) 
  },
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
