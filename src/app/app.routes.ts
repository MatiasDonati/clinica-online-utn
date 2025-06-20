import { Routes } from '@angular/router';
import { canMatchGuardSoloAdmin } from './guards/can-match.guard';
import { canMatchGuardSoloPaciente } from './guards/can-match.guard-paciente';
import { canMatchGuardSoloEspecialista } from './guards/can-match.guard-especialista';
import { authGuard } from './guards/auth.guard';
import { canMatchPacienteOAdmin } from './guards/can-match.guard-pacienteOAdmin';

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
    canMatch: [canMatchGuardSoloPaciente],
    loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(c => c.MisTurnosComponent)
  },
  {
    path: 'mis-turnos-especialista',
    canMatch: [canMatchGuardSoloEspecialista],
    loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(c => c.MisTurnosEspecialistaComponent)
  },
  {
    path: 'turnos-admin',
    canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/turnos-admin/turnos-admin.component').then(c => c.TurnosAdministradorComponent)
  },
  {
    path: 'solicitar-turno',
    canMatch: [canMatchPacienteOAdmin],
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(c => c.SolicitarTurnoComponent)
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(c => c.MiPerfilComponent)
  },
  {
    path: 'pacientes',
    canMatch: [canMatchGuardSoloEspecialista],
    loadComponent: () => import('./components/pacientes/pacientes.component').then(c => c.PacientesComponent)
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
