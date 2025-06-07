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
    path: 'crear-admin',
    loadComponent: () => import('./components/crear-admin/crear-admin.component').then(c => c.CrearAdminComponent)
  }
  // { 
  //   path: 'juegos',
  //   canMatch: [canMatchGuardObtenerUsuario],
  //   loadChildren: () => import('./components/juegos/juegos-modulo/juegos.module').then(m => m.JuegosModule)
  // },
];
