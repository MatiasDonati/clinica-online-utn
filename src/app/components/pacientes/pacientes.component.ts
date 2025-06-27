import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { HistoriaClinicaComponent } from "../historia-clinica/historia-clinica.component";
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import Swal from 'sweetalert2';
import { NgClass, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [HeaderComponent, HistoriaClinicaComponent, NgFor, NgIf, NgClass],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent {

  vista: 'historias' | 'pacientes' = 'historias';

  pacientesAtendidos: any[] = [];
  pacienteSeleccionado: any = null;

  emailUsuario: string | null = null;
  cargando: boolean = false;

  constructor(private usuariosService: UsuariosService, private authService: AuthService) {}

  async ngOnInit() {
    this.emailUsuario = await this.authService.obtenerUsuarioActual();

    if (!this.emailUsuario) {
      console.error('No se obtuvo email de usuario');
      return;
    }

    // Si querés cargar pacientes al iniciar la vista, descomentá:
    // this.pacientesAtendidos = await this.usuariosService.obtenerPacientesAtendidosPorEspecialista(this.emailUsuario);
  }

  mostrarHistorias() {
    this.vista = 'historias';
    this.pacienteSeleccionado = null;
  }

  async mostrarPacientesAtendidos() {
    this.vista = 'pacientes';
    this.pacienteSeleccionado = null;

    if (!this.emailUsuario) return;

    this.cargando = true;
    this.pacientesAtendidos = await this.usuariosService.obtenerPacientesAtendidosPorEspecialista(this.emailUsuario);
    this.cargando = false;
  }

  async seleccionarPaciente(paciente: any) {
    if (!this.emailUsuario) return;

    const historias = await this.usuariosService.obtenerHistoriasClinicasPorPacienteYEspecialista(paciente.mail, this.emailUsuario);

    this.pacienteSeleccionado = {
      ...paciente,
      turnos: historias
    };
  }

  verResena(turno: any) {
    Swal.fire({
      title: 'Reseña de la consulta',
      text: turno.resena,
      icon: 'info'
    });
  }

}
