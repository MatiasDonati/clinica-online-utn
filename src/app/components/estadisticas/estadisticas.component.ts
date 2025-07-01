import { Component, OnInit } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { AuthService } from '../../services/auth.service';
import { TurnosService } from '../../services/turnos.service';
import { ChartConfiguration, ChartType, ChartData } from 'chart.js';
import { HeaderComponent } from "../header/header.component";
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { FormatearFechaPipe } from '../../pipes/formatear-fecha.pipe';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [NgChartsModule, HeaderComponent, NgFor, FormsModule],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent implements OnInit {

  formatearFechaPipe = new FormatearFechaPipe();

  logs: any[] = [];

  fechaDesde: string = '';
  fechaHasta: string = '';
  fechaEspecifica: string = '';

  especialidadSeleccionada: string = '';
  especialidadesDisponibles: string[] = [];

  especialistaSeleccionado: string = '';
  especialistasDisponibles: string[] = [];

  soloFinalizados: boolean = false;


  chartData: ChartData<'bar'> = { labels: [], datasets: [] };
  chartTurnosEspecialidad: ChartData<'bar'> = { labels: [], datasets: [] };
  chartTurnosPorDia: ChartData<'bar'> = { labels: [], datasets: [] };

  chartType: ChartType = 'bar';

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#e0b3ff' } }
    },
    scales: {
      x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.2)' } },
      y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.2)' } }
    }
  };

  constructor(private authService: AuthService, private turnosService: TurnosService) {}

  async ngOnInit() {
    const logs = await this.authService.obtenerLogsIngresos();
    this.logs = logs;

    const map = new Map<string, number>();
    for (const log of logs) {
      const fechaArg = this.convertirFechaArgentina(log.fecha_hora).split(',')[0];
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    this.chartData = {
      labels: Array.from(map.keys()).reverse(),
      datasets: [{ label: 'Ingresos por día', data: Array.from(map.values()).reverse() }]
    };

    await this.cargarTurnosPorEspecialidad();
    await this.cargarTurnosPorDia();
    await this.cargarEspecialidades();
    await this.cargarEspecialistas();

  }

  convertirFechaArgentina(fechaUTC: string) {
    return new Date(fechaUTC).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  }

  async cargarTurnosPorEspecialidad() {
    const turnos = await this.turnosService.obtenerTurnosPorEspecialidad();
    const map = new Map<string, number>();

    for (const turno of turnos) {
      map.set(turno.especialidad, (map.get(turno.especialidad) || 0) + 1);
    }

    this.chartTurnosEspecialidad = {
      labels: Array.from(map.keys()),
      datasets: [{ label: 'Turnos por Especialidad', data: Array.from(map.values()) }]
    };
  }

  async cargarTurnosPorDia() {
    const turnos = await this.turnosService.obtenerTurnosPorDia();
    const map = new Map<string, number>();

    for (const turno of turnos) {
      // Pipe
      const fechaArg = this.formatearFechaPipe.transform(turno.fecha);
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }


    const sortedEntries = Array.from(map.entries()).sort(([fechaA], [fechaB]) =>
      fechaA.localeCompare(fechaB)
    );

    this.chartTurnosPorDia = {
      labels: sortedEntries.map(([fecha]) => fecha),
      datasets: [{
        label: 'Turnos por día',
        data: sortedEntries.map(([, cantidad]) => cantidad)
      }]
    };
  }

  async filtrarTurnosPorDia() {
    if (!this.fechaDesde || !this.fechaHasta) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Seleccioná ambas fechas para filtrar.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const desde = new Date(this.fechaDesde);
    const hasta = new Date(this.fechaHasta);

    if (hasta < desde) {
      Swal.fire({
        icon: 'error',
        title: 'Rango inválido',
        text: 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const hastaInclusive = new Date(hasta);
    hastaInclusive.setDate(hastaInclusive.getDate() + 1);

    const turnos = await this.turnosService.obtenerTurnosPorDiaEnRango(
      this.fechaDesde,
      hastaInclusive.toISOString().split('T')[0]
    );

    const map = new Map<string, number>();
    for (const turno of turnos) {
      const fechaArg = turno.fecha;
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    const sortedEntries = Array.from(map.entries()).sort(([fechaA], [fechaB]) =>
      fechaA.localeCompare(fechaB)
    );

    this.chartTurnosPorDia = {
      labels: sortedEntries.map(([fecha]) => fecha),
      datasets: [{
        label: 'Turnos por día',
        data: sortedEntries.map(([, cantidad]) => cantidad)
      }]
    };
  }

  async verTurnosPorFechaEspecifica() {
    if (!this.fechaEspecifica) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Seleccioná la fecha que querés consultar.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const turnos = await this.turnosService.obtenerTurnosPorFechaEspecifica(this.fechaEspecifica);

    const map = new Map<string, number>();
    for (const turno of turnos) {
       // usar directamente como string
      const fechaArg = turno.fecha;
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    this.chartTurnosPorDia = {
      labels: Array.from(map.keys()),
      datasets: [{
        label: `Turnos del ${this.fechaEspecifica}`,
        data: Array.from(map.values())
      }]
    };
  }


  async cargarEspecialidades() {
    const data = await this.turnosService.obtenerTodasLasEspecialidades();
    this.especialidadesDisponibles = Array.from(new Set(data.map(e => e.especialidad)));
  }

  async filtrarTurnosPorEspecialidad() {
    if (!this.especialidadSeleccionada) {
      Swal.fire({
        icon: 'warning',
        title: 'Especialidad requerida',
        text: 'Seleccioná una especialidad para filtrar.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const turnos = await this.turnosService.obtenerTurnosPorEspecialidadYDia(this.especialidadSeleccionada);

    this.chartTurnosEspecialidad = {
      labels: [this.especialidadSeleccionada],
      datasets: [{
        label: `Total de turnos (${this.especialidadSeleccionada})`,
        data: [turnos.length]
      }]
    };
  }

  async verTodosLosTurnosPorDia() {
    this.fechaDesde = '';
    this.fechaHasta = '';
    await this.cargarTurnosPorDia();
  }

  async verTodasLasEspecialidades() {
    this.especialidadSeleccionada = '';
    await this.cargarTurnosPorEspecialidad();
  }

  async cargarEspecialistas() {
    const data = await this.turnosService.obtenerEspecialistasDeTurnos();
    this.especialistasDisponibles = data;
  }

  async filtrarTurnosPorEspecialista() {
    if (!this.especialistaSeleccionado) {
      Swal.fire({
        icon: 'warning',
        title: 'Especialista requerido',
        text: 'Seleccioná un especialista para filtrar.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const turnos = await this.turnosService.obtenerTurnosPorEspecialista(this.especialistaSeleccionado);

    const map = new Map<string, number>();
    for (const turno of turnos) {
      const fechaArg = turno.fecha;
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    this.chartTurnosPorDia = {
      labels: Array.from(map.keys()),
      datasets: [{
        label: `Turnos de ${this.especialistaSeleccionado}`,
        data: Array.from(map.values())
      }]
    };
  }

async filtrarTurnosPorMedicoEnRango() {

  // con Pipe Personaliado
  const desdeFormateada = this.formatearFechaPipe.transform(this.fechaDesde);
  const hastaFormateada = this.formatearFechaPipe.transform(this.fechaHasta);

  if (!this.especialistaSeleccionado || !this.fechaDesde || !this.fechaHasta) {
    Swal.fire({
      icon: 'warning',
      title: 'Datos requeridos',
      text: 'Seleccioná un especialista y un rango de fechas.',
      confirmButtonColor: '#8A2BE2'
    });
    return;
  }

  const desde = new Date(this.fechaDesde);
  const hasta = new Date(this.fechaHasta);

  if (hasta < desde) {
    Swal.fire({
      icon: 'error',
      title: 'Rango inválido',
      text: 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".',
      confirmButtonColor: '#8A2BE2'
    });
    return;
  }

  const hastaInclusive = new Date(hasta);
  hastaInclusive.setDate(hastaInclusive.getDate() + 1);

  let turnos;

  if (this.soloFinalizados) {
    turnos = await this.turnosService.obtenerTurnosFinalizadosPorMedicoEnRango(
      this.especialistaSeleccionado,
      this.fechaDesde,
      hastaInclusive.toISOString().split('T')[0]
    );
  } else {
    turnos = await this.turnosService.obtenerTurnosPorMedicoEnRango(
      this.especialistaSeleccionado,
      this.fechaDesde,
      hastaInclusive.toISOString().split('T')[0]
    );
  }

  const cantidad = turnos.length;

  Swal.fire({
    icon: 'info',
    title: this.soloFinalizados ? 'Turnos Finalizados' : 'Turnos Totales',
    html: `<b>${this.especialistaSeleccionado}</b> ${this.soloFinalizados ? 'finalizó' : 'tiene'} <b>${cantidad}</b> turnos entre <b>${desdeFormateada}</b> y <b>${hastaFormateada}</b>.`,
    confirmButtonColor: '#8A2BE2'
  });
}





}
