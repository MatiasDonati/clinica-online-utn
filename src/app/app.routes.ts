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
    loadComponent: () => import('./components/login/login.component').then(c => c.LoginComponent),
    data: { animation: 'LoginPage' }
  },
  { 
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(c => c.RegisterComponent),
    data: { animation: 'RegisterPage' }
  },
  { 
    path: 'home',
    loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent),
    data: { animation: 'HomePage' }
  },
  { 
    path: 'usuarios', 
    canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/usuarios/usuarios.component').then(c => c.UsuariosComponent),
    data: { animation: 'UsuariosPage' }
  },
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./components/acceso-denegado/acceso-denegado.component').then(c => c.AccesoDenegadoComponent),
    data: { animation: 'DenegadoPage' }
  },
  {
    path: 'mis-turnos',
    canMatch: [canMatchGuardSoloPaciente],
    loadComponent: () => import('./components/mis-turnos/mis-turnos.component').then(c => c.MisTurnosComponent),
    data: { animation: 'MisTurnosPaciente' }
  },
  {
    path: 'mis-turnos-especialista',
    canMatch: [canMatchGuardSoloEspecialista],
    loadComponent: () => import('./components/mis-turnos-especialista/mis-turnos-especialista.component').then(c => c.MisTurnosEspecialistaComponent),
    data: { animation: 'MisTurnosEspecialista' }
  },
  {
    path: 'turnos-admin',
    canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/turnos-admin/turnos-admin.component').then(c => c.TurnosAdministradorComponent),
    data: { animation: 'TurnosAdmin' }
  },
  {
    path: 'solicitar-turno',
    canMatch: [canMatchPacienteOAdmin],
    loadComponent: () => import('./components/solicitar-turno/solicitar-turno.component').then(c => c.SolicitarTurnoComponent),
    data: { animation: 'SolicitarTurno' }
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./components/mi-perfil/mi-perfil.component').then(c => c.MiPerfilComponent),
    data: { animation: 'MiPerfil' }
  },
  {
    path: 'pacientes',
    canMatch: [canMatchGuardSoloEspecialista],
    loadComponent: () => import('./components/pacientes/pacientes.component').then(c => c.PacientesComponent),
    data: { animation: 'Pacientes' }
  },
  {
    path: 'estadisticas',
    canMatch: [canMatchGuardSoloAdmin],
    loadComponent: () => import('./components/estadisticas/estadisticas.component').then(c => c.EstadisticasComponent),
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];