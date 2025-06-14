import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { TurnosService } from '../../services/turnos.service';
import { AuthService } from '../../services/auth.service';
import { NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';
import Moment from 'moment';

import { FiltrarTurnosPipe } from '../../pipes/filtrar-turnos.pipe';
import { FormatearFechaPipe } from '../../pipes/formatear-fecha.pipe';

import { HoverResaltadoDirective } from '../../directivas/hover-resaltado.directive';
import { EstadoTurnoDirective } from '../../directivas/estado-turno.directive';


@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [HeaderComponent, NgIf, NgFor, FormsModule, UpperCasePipe, FiltrarTurnosPipe, FormatearFechaPipe, HoverResaltadoDirective, EstadoTurnoDirective],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.css']
})
export class MisTurnosComponent implements OnInit {
  

  turnos: any[] = [];
  userEmail: string | null = null;
  cargando = true;

  filtro: string = '';
  turnosFiltrados: any[] = [];

  constructor(private turnosService: TurnosService, private authService: AuthService) {}

  async ngOnInit() {
    await this.cargarTurnos();
  }

  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.turnosFiltrados = this.turnos.filter(turno =>
      turno.especialidad.toLowerCase().includes(texto) ||
      turno.especialista_email.toLowerCase().includes(texto)
    );
  }

  async cargarTurnos() {
    this.cargando = true;
    this.userEmail = await this.authService.obtenerUsuarioActual();
    if (this.userEmail) {
      this.turnos = await this.turnosService.obtenerTurnosDelPaciente(this.userEmail);
      this.turnosFiltrados = [...this.turnos];
    }
    this.cargando = false;
  }

  async cancelarTurno(turno: any) {
    let { value: motivo } = await Swal.fire({
      title: 'Cancelar turno',
      input: 'text',
      inputLabel: '¿Por qué querés cancelarlo?',
      inputPlaceholder: 'Escribí el motivo...',
      showCancelButton: true,
      confirmButtonText: 'Cancelar turno',
      cancelButtonText: 'Volver'
    });

    if (!motivo) return;

    try {
      motivo = 'Paciente canceló el turno: ' + motivo;
      await this.turnosService.cancelarTurno(turno.id, motivo);
      await Swal.fire('Éxito', 'Turno cancelado con éxito.', 'success');
      await this.cargarTurnos();               // borrar cuando ponga BehaviorSubject
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cancelar el turno.', 'error');
    }
  }


  async completarEncuesta(turno: any) {
    const { value: respuestas } = await Swal.fire({
      title: 'Encuesta sobre tu experiencia',
      html: `
        <div style="text-align:left">
          <p><strong>¿Fue fácil sacar el turno?</strong></p>
          <label><input type="radio" name="facilidad" value="sí"> Sí</label><br>
          <label><input type="radio" name="facilidad" value="no"> No</label><br><br>

          <p><strong>¿Volverías a atenderte con este especialista?</strong></p>
          <label><input type="radio" name="volverias" value="sí"> Sí</label><br>
          <label><input type="radio" name="volverias" value="no"> No</label><br><br>

          <p><strong>¿Querés dejarnos un comentario?</strong></p>
          <textarea id="comentarioEncuesta" class="swal2-textarea" placeholder="Escribí tu comentario (opcional)"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enviar encuesta',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const facilidad = document.querySelector<HTMLInputElement>('input[name="facilidad"]:checked');
        const volverias = document.querySelector<HTMLInputElement>('input[name="volverias"]:checked');
        const comentario = (document.getElementById('comentarioEncuesta') as HTMLTextAreaElement)?.value || '';

        if (!facilidad || !volverias) {
          Swal.showValidationMessage('Por favor, respondé ambas preguntas.');
          return;
        }

        return {
          facilidad: facilidad.value,
          volverias: volverias.value,
          comentario
        };
      }
    });

    if (!respuestas) return;

    try {
      await this.turnosService.guardarEncuesta(
        turno.id,
        this.userEmail!,
        respuestas.facilidad,
        respuestas.volverias,
        respuestas.comentario
      );

      await this.turnosService.completarEncuesta(turno.id); // actualiza booleano

      await Swal.fire('¡Gracias!', 'Tu encuesta fue enviada con éxito.', 'success');
      this.cargarTurnos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo completar la encuesta.', 'error');
    }
  }

  async calificar(turno: any) {
    const { value: comentario } = await Swal.fire({
      title: 'Calificar atención',
      input: 'text',
      inputLabel: '¿Comentanos cómo fue la atención del especialista?',
      inputPlaceholder: 'Escribí tu comentario',
      showCancelButton: true
    });

    if (!comentario) return;

    const { value: calificacion } = await Swal.fire({
      title: 'Calificación (1 a 5)',
      input: 'number',
      inputAttributes: {
        min: '1',
        max: '5',
        step: '1'
      },
      inputPlaceholder: 'Ingresá un número del 1 al 5',
      showCancelButton: true
    });

    const valor = parseInt(calificacion || '', 10);
    if (!valor || valor < 1 || valor > 5) {
      Swal.fire('Error', 'Calificación inválida. Debe ser entre 1 y 5.', 'error');
      return;
    }

    try {
      await this.turnosService.calificarTurno(turno.id, comentario, valor);
      await Swal.fire('Gracias', 'Tu calificación fue registrada.', 'success');
      this.cargarTurnos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo registrar la calificación.', 'error');
    }
  }

  verResena(turno: any) {
    Swal.fire({
      title: 'Detalle del Turno Realizado',
      html: `
        <div style="text-align:left">
          <strong>Comentario del Especialista:</strong><br>
          ${turno.resena_especialista || '—'}<br><br>
          <strong>Diagnóstico:</strong><br>
          ${turno.diagnostico || '—'}
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }

}
