import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HeaderComponent } from "../header/header.component";
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { FiltrarTurnosAdminPipe } from '../../pipes/filtrar-turnos-admim.pipe';
import { EstadoTurnoDirective } from '../../directivas/estado-turno.directive';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-turnos-administrador',
  templateUrl: './turnos-admin.component.html',
  styleUrls: ['./turnos-admin.component.css'],
  imports: [HeaderComponent, FormsModule, NgIf, NgFor, FiltrarTurnosAdminPipe, EstadoTurnoDirective]
})
export class TurnosAdministradorComponent implements OnInit {
  turnos: any[] = [];
  cargando = true;
  filtro: string = '';


  constructor(private turnosService: TurnosService) {}

  async ngOnInit() {
    await this.cargarTurnos();
  }

  async cargarTurnos() {
    this.cargando = true;
    try {
      this.turnos = await this.turnosService.obtenerTodosLosTurnos();
      console.log('Turnos cargados:', this.turnos);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
    }
    this.cargando = false;
  }

  async cancelarTurno(turno: any) {
    let { value: motivo } = await Swal.fire({
      title: 'Motivo de cancelación',
      input: 'text',
      inputPlaceholder: 'Ingresá el motivo',
      showCancelButton: true
    });

    if (!motivo) return;

    motivo = 'Administrador canceló el turno: ' + motivo;

    try {
      await this.turnosService.cancelarTurno(turno.id, motivo);
      await Swal.fire('Turno cancelado', '', 'warning');
      await this.cargarTurnos();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cancelar el turno.', 'error');
    }
  }


}
