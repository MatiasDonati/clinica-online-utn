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


@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [HeaderComponent, NgIf, NgFor, FormsModule, UpperCasePipe, FiltrarTurnosPipe, FormatearFechaPipe, HoverResaltadoDirective],
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
    const { value: motivo } = await Swal.fire({
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
      await this.turnosService.cancelarTurno(turno.id, motivo);
      await Swal.fire('Éxito', 'Turno cancelado con éxito.', 'success');
      this.cargarTurnos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cancelar el turno.', 'error');
    }
  }

  async completarEncuesta(turno: any) {
    const { isConfirmed } = await Swal.fire({
      title: 'Completar encuesta',
      text: '¿Querés marcar la encuesta como completada?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    try {
      await this.turnosService.completarEncuesta(turno.id);
      await Swal.fire('Encuesta completada', '', 'success');
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
      inputLabel: '¿Cómo fue la atención del especialista?',
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
      title: 'Reseña del Especialista',
      text: turno.resena_especialista || 'Sin reseña disponible.',
      icon: 'info',
      confirmButtonText: 'Cerrar'
    });
  }


}
