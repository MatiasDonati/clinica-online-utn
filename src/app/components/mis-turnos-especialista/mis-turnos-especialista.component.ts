import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { HeaderComponent } from "../header/header.component";
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormatearFechaPipe } from '../../pipes/formatear-fecha.pipe';
import { FiltrarTurnosEspecialistaPipe } from '../../pipes/filtrar-turnos-especialista';
import { EstadoTurnoDirective } from '../../directivas/estado-turno.directive';



@Component({
  selector: 'app-mis-turnos-especialista',
  standalone: true,
  templateUrl: './mis-turnos-especialista.component.html',
  styleUrls: ['./mis-turnos-especialista.component.css'],
  imports: [HeaderComponent, NgFor, NgIf, FormsModule, FormatearFechaPipe, FiltrarTurnosEspecialistaPipe, UpperCasePipe, EstadoTurnoDirective]
})
export class MisTurnosEspecialistaComponent implements OnInit {
  turnos: any[] = [];
  userEmail: string | null = null;
  cargando = true;
  filtro: string = '';


  constructor(private turnosService: TurnosService, private authService: AuthService) {}

  async ngOnInit() {
    this.userEmail = await this.authService.obtenerUsuarioActual();
    if (this.userEmail) {
      await this.cargarTurnos();
    }
  }


  async aceptarTurno(turno: any) {
    const { isConfirmed } = await Swal.fire({
      title: '¿Aceptar turno?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    });

    if (!isConfirmed) return;

    await this.turnosService.actualizarEstadoTurno(turno.id, 'aceptado');
    Swal.fire('Turno aceptado', '', 'success');
    this.ngOnInit();
  }

  async rechazarTurno(turno: any) {
    let { value: motivo } = await Swal.fire({
      title: 'Motivo de rechazo',
      input: 'text',
      inputPlaceholder: 'Escribí el motivo',
      showCancelButton: true
    });

    if (!motivo) return;
    motivo = 'Especialista rechazó el turno: ' + motivo;

    await this.turnosService.rechazarTurno(turno.id, motivo);
    Swal.fire('Turno rechazado', '', 'info');
    this.ngOnInit();
  }

  async finalizarTurno(turno: any) {
    const { value: formValues } = await Swal.fire({
      title: 'Finalizar Turno',
      html:
        `<input id="swal-comentario" class="swal2-input" placeholder="Comentario general">` +
        `<textarea id="swal-diagnostico" class="swal2-textarea" placeholder="Diagnóstico médico"></textarea>`,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const comentario = (document.getElementById('swal-comentario') as HTMLInputElement).value;
        const diagnostico = (document.getElementById('swal-diagnostico') as HTMLTextAreaElement).value;
        if (!comentario || !diagnostico) {
          Swal.showValidationMessage('Debe completar ambos campos');
          return;
        }
        return { comentario, diagnostico };
      }
    });

    if (!formValues) return;

    await this.turnosService.finalizarTurno(turno.id, formValues.comentario, formValues.diagnostico);
    Swal.fire('Turno finalizado', '', 'success');
    this.ngOnInit();
  }


  verDetalles(turno: any) {
    const cancelacionHTML = turno.estado === 'cancelado'
      ? `<strong>Motivo de Cancelación:</strong> ${turno.comentario_cancelacion || '—'}<br><br>`
      : '';

    const realizadoHTML = turno.estado === 'realizado'
      ? `
        <strong>Comentario del Especialista:</strong><br>
        ${turno.resena_especialista || '—'}<br><br>
        <strong>Diagnóstico:</strong><br>
        ${turno.diagnostico || '—'}<br><br>
      `
      : '';

    Swal.fire({
      title: 'Detalles del Turno',
      html: `
        <div style="text-align:left">
          <strong>Paciente:</strong> ${turno.paciente_email}<br>
          <strong>Especialidad:</strong> ${turno.especialidad}<br>
          <strong>Comentario del Paciente:</strong> ${turno.comentario_paciente || '—'}<br>
          <strong>Estado:</strong> ${turno.estado.toUpperCase()}<br><br>
          ${cancelacionHTML}
          ${realizadoHTML}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }


async cancelarTurno(turno: any) {
  let { value: motivo } = await Swal.fire({
    title: 'Motivo de cancelación',
    input: 'text',
    inputPlaceholder: 'Ingresá el motivo',
    showCancelButton: true
  });

  if (!motivo) return;

  motivo = 'Especialista canceló el turno: ' + motivo;

  try {
    await this.turnosService.cancelarTurno(turno.id, motivo);
    await Swal.fire('Turno cancelado', '', 'warning');
    await this.cargarTurnos(); // 👈 mejor que llamar a ngOnInit()
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo cancelar el turno.', 'error');
  }
}


  verResena(turno: any) {
    Swal.fire({
      title: 'Resumen del Turno Realizado',
      html: `
        <div style="text-align:left">
          <strong>Comentario del especialista:</strong><br>
          ${turno.resena_especialista || '—'}<br><br>
          <strong>Diagnóstico:</strong><br>
          ${turno.diagnostico || '—'}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }

  async cargarTurnos() {
    this.cargando = true;
    if (this.userEmail) {
      const todos = await this.turnosService.obtenerTurnosDelEspecialista(this.userEmail);
      this.turnos = todos;
    }
    this.cargando = false;
  }




}
