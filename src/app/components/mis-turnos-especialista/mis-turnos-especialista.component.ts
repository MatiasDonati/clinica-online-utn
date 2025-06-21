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
      title: 'Reseña del Especialista',
      html: `
        <textarea id="reina" class="swal2-textarea" placeholder="Reseña del Especialista…">Finalizado con historia clínica</textarea>
        <h3 style="margin-top:1rem;">Diagnóstico</h3>
        <textarea id="diag" class="swal2-textarea" placeholder="Diagnóstico (obligatorio)"></textarea>
        <h3 style="margin-top:1.5rem;">Historia Clínica</h3>
        <input id="hc-altura" class="swal2-input" placeholder="Altura (ej. 1.70)" type="number" step="0.01">
        <input id="hc-peso" class="swal2-input" placeholder="Peso (kg)" type="number" step="0.1">
        <input id="hc-temperatura" class="swal2-input" placeholder="Temperatura (°C)" type="number" step="0.1">
        <input id="hc-presion" class="swal2-input" placeholder="Presión (ej. 120/80)">
        <hr>
        <input id="clave1" class="swal2-input" placeholder="Campo 1">
        <input id="valor1" class="swal2-input" placeholder="Valor 1">
        <input id="clave2" class="swal2-input" placeholder="Campo 2 (opcional)">
        <input id="valor2" class="swal2-input" placeholder="Valor 2">
        <input id="clave3" class="swal2-input" placeholder="Campo 3 (opcional)">
        <input id="valor3" class="swal2-input" placeholder="Valor 3">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const reseña = (document.getElementById('reina') as HTMLTextAreaElement).value.trim();
        const diagnostico = (document.getElementById('diag') as HTMLTextAreaElement).value.trim();
        const altura = parseFloat((<HTMLInputElement>document.getElementById('hc-altura')).value);
        const peso = parseFloat((<HTMLInputElement>document.getElementById('hc-peso')).value);
        const temperatura = parseFloat((<HTMLInputElement>document.getElementById('hc-temperatura')).value);
        const presion = (<HTMLInputElement>document.getElementById('hc-presion')).value.trim();

        if (!reseña || !diagnostico || !altura || !peso || !temperatura || !presion) {
          Swal.showValidationMessage('Por favor completá la reseña, diagnóstico y todos los datos médicos.');
          return;
        }

        const datos_dinamicos: { [clave: string]: string } = {};
        for (let i = 1; i <= 3; i++) {
          const clave = (<HTMLInputElement>document.getElementById(`clave${i}`)).value.trim();
          const valor = (<HTMLInputElement>document.getElementById(`valor${i}`)).value.trim();
          if (clave && valor) datos_dinamicos[clave] = valor;
        }

        return { reseña, diagnostico, altura, peso, temperatura, presion, datos_dinamicos };
      }
    });

    if (!formValues) return;

    try {
      await this.turnosService.guardarHistoriaClinica({
        turno_id: turno.id,
        paciente_email: turno.paciente_email,
        especialista_email: this.userEmail!,
        altura: formValues.altura,
        peso: formValues.peso,
        temperatura: formValues.temperatura,
        presion: formValues.presion,
        datos_dinamicos: formValues.datos_dinamicos
      });

      await this.turnosService.finalizarTurno(turno.id, formValues.reseña, formValues.diagnostico);

      Swal.fire('Guardado', 'La historia clínica fue registrada con éxito.', 'success');
      this.cargarTurnos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo guardar la historia clínica.', 'error');
    }
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
    const calificacionHTML = turno.calificacion
      ? `
        <br><strong>Calificación del Paciente:</strong> ${turno.calificacion}/5<br>
        <strong>Comentario del Paciente:</strong><br>
        ${turno.comentario_paciente || '—'}
      `
      : '';

    Swal.fire({
      title: 'Resumen del Turno Realizado',
      html: `
        <div style="text-align:left">
          <strong>Comentario del Especialista:</strong><br>
          ${turno.resena_especialista || '—'}<br><br>
          <strong>Diagnóstico:</strong><br>
          ${turno.diagnostico || '—'}
          ${calificacionHTML}
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
