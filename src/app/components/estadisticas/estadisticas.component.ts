import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { AuthService } from '../../services/auth.service';
import { TurnosService } from '../../services/turnos.service';
import { ChartConfiguration, ChartType, ChartData } from 'chart.js';
import { HeaderComponent } from "../header/header.component";
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { FormatearFechaPipe } from '../../pipes/formatear-fecha.pipe';
import { FormatearHoraPipe } from '../../pipes/formatear-hora.pipe';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [NgChartsModule, HeaderComponent, NgFor, FormsModule, NgIf, FormatearFechaPipe, FormatearHoraPipe],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.css'
})
export class EstadisticasComponent implements OnInit {

  @ViewChild('graficoIngresos') graficoIngresos!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoTurnosPorDia') graficoTurnosPorDia!: ElementRef;


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

  cantidadTurnosEspecialidad: number = 0;

  botonDescargarTurnosTexto: string = '📉 Descargar Excel de Turnos 📉';
  botonDescargarGraficoTexto: string = '📊 Descargar Gráfico 📊';


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

    this.cantidadTurnosEspecialidad = Array.from(map.values()).reduce((acc, val) => acc + val, 0);
  }

  async cargarTurnosPorDia() {
    const turnos = await this.turnosService.obtenerTurnosPorDia();
    const map = new Map<string, number>();

    for (const turno of turnos) {
      const fechaArg = turno.fecha; // formato yyyy-mm-dd
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    const sortedEntries = Array.from(map.entries()).sort(([fechaA], [fechaB]) =>
      fechaA.localeCompare(fechaB)
    );

    this.chartTurnosPorDia = {
      labels: sortedEntries.map(([fecha]) => this.formatearFechaPipe.transform(fecha)),
      datasets: [{
        label: 'Turnos por día',
        data: sortedEntries.map(([, cantidad]) => cantidad)
      }]
    };
  }

  async filtrarTurnosPorDia() {

    this.fechaEspecifica = '';

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

    const sortedEntries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));

    this.chartTurnosPorDia = {
      labels: sortedEntries.map(([fecha]) => this.formatearFechaPipe.transform(fecha)),
      datasets: [{ label: 'Turnos por día', data: sortedEntries.map(([, c]) => c) }]
    };

    const desdeArg = this.formatearFechaPipe.transform(this.fechaDesde);
    const hastaArg = this.formatearFechaPipe.transform(this.fechaHasta);

    this.botonDescargarTurnosTexto = `📉 Descargar Excel de Turnos - ${desdeArg} a ${hastaArg} 📉`;
    this.botonDescargarGraficoTexto = `📊 Descargar Gráfico - ${desdeArg} a ${hastaArg} 📊`;

    setTimeout(() => {
      const grafico = document.getElementById('grafico-turnos-por-dia');
      if (grafico) {
        grafico.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }


  async verTurnosPorFechaEspecifica() {

    this.fechaDesde = '';
    this.fechaHasta = '';

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
      const fechaArg = turno.fecha;
      map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
    }

    this.chartTurnosPorDia = {
      labels: Array.from(map.keys()).map(fecha => this.formatearFechaPipe.transform(fecha)),
      datasets: [{
        label: `Turnos del ${this.formatearFechaPipe.transform(this.fechaEspecifica)}`,
        data: Array.from(map.values())
      }]
    };

    const fechaArg = this.formatearFechaPipe.transform(this.fechaEspecifica);

    this.botonDescargarTurnosTexto = `📉 Descargar Excel de Turnos - ${fechaArg} 📉`;
    this.botonDescargarGraficoTexto = `📊 Descargar Gráfico - ${fechaArg} 📊`;

    setTimeout(() => {
      const grafico = document.getElementById('grafico-turnos-por-dia');
      if (grafico) {
        grafico.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

    this.cantidadTurnosEspecialidad = turnos.length;
  }

  async verTodosLosTurnosPorDia() {
    this.fechaDesde = '';
    this.fechaHasta = '';
    await this.cargarTurnosPorDia();
    this.botonDescargarTurnosTexto = '📉 Descargar Excel de Turnos 📉';
    this.botonDescargarGraficoTexto = '📊 Descargar Gráfico 📊';


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
      labels: Array.from(map.keys()).map(fecha => this.formatearFechaPipe.transform(fecha)),
      datasets: [{
        label: `Turnos de ${this.especialistaSeleccionado}`,
        data: Array.from(map.values())
      }]
    };
  }

  async filtrarTurnosPorMedicoEnRango() {
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

  descargarGraficoIngresos() {
    const canvas: HTMLCanvasElement = this.graficoIngresos.nativeElement;

    const canvasConFondo = document.createElement('canvas');
    const ctx = canvasConFondo.getContext('2d');

    canvasConFondo.width = canvas.width;
    canvasConFondo.height = canvas.height;

    if (ctx) {
      //  fondo negro
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // dibujar el grafico arriba
      ctx.drawImage(canvas, 0, 0);

      // crear enlace de descarga
      const enlace = document.createElement('a');
      enlace.href = canvasConFondo.toDataURL('image/png');
      enlace.download = 'grafico_ingresos.png';
      enlace.click();
    }
  }

  exportarDetalleIngresos() {
    const worksheetData = this.logs.map(log => ({
      Email: log.email,
      Fecha: this.formatearFechaPipe.transform(log.fecha_hora),
      Hora: new Date(log.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = { Sheets: { 'Detalle de Ingresos': worksheet }, SheetNames: ['Detalle de Ingresos'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(data, 'detalle_ingresos.xlsx');
  }

  exportarTurnosPorEspecialidad() {
    let worksheetData;
    let nombreArchivo = 'turnos_por_especialidad.xlsx';

    if (this.especialidadSeleccionada) {
      // filtrafo por especialidad
      worksheetData = [{
        Especialidad: this.especialidadSeleccionada,
        'Cantidad de Turnos': this.cantidadTurnosEspecialidad
      }];

      // especialidad al nombre del archivo (remplazar espacios por guiones bajos)
      const especialidadNombre = this.especialidadSeleccionada.replace(/\s+/g, '_').toLowerCase();
      nombreArchivo = `turnos_${especialidadNombre}.xlsx`;
    } else {
      // todos-  recorrer chartTurnosEspecialidad
      const labels = this.chartTurnosEspecialidad.labels as string[] ?? [];
      const data = this.chartTurnosEspecialidad.datasets[0]?.data ?? [];

      worksheetData = labels.map((label, index) => ({
        Especialidad: label,
        'Cantidad de Turnos': (data[index] as number) ?? 0
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = { Sheets: { 'Turnos por Especialidad': worksheet }, SheetNames: ['Turnos por Especialidad'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, nombreArchivo);
  }


  exportarTurnosPorDia() {
    let worksheetData: any[] = [];

    if (this.fechaDesde && this.fechaHasta) {
      // Filtrado por rango de fechas
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

      this.turnosService.obtenerTurnosPorDiaEnRango(
        this.fechaDesde,
        hastaInclusive.toISOString().split('T')[0]
      ).then(turnos => {
        if (!turnos || turnos.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin turnos',
            text: 'No hay turnos en el rango seleccionado.',
            confirmButtonColor: '#8A2BE2'
          });
          return;
        }

        const map = new Map<string, number>();
        for (const turno of turnos) {
          const fechaArg = turno.fecha;
          map.set(fechaArg, (map.get(fechaArg) || 0) + 1);
        }

        worksheetData = Array.from(map.entries()).map(([fecha, cantidad]) => ({
          Fecha: this.formatearFechaPipe.transform(fecha),
          'Cantidad de Turnos': cantidad
        }));

        this.generarExcel(worksheetData, `turnos_${this.fechaDesde}_a_${this.fechaHasta}`);
      });
    }

    else if (this.fechaEspecifica) {
      // Filtrado por una sola fecha
      this.turnosService.obtenerTurnosPorFechaEspecifica(this.fechaEspecifica).then(turnos => {
        const fechaFormateada = this.formatearFechaPipe.transform(this.fechaEspecifica);

        if (!turnos || turnos.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin turnos',
            text: `No hay turnos para la fecha ${fechaFormateada}.`,
            confirmButtonColor: '#8A2BE2'
          });
          return;
        }

        const cantidad = turnos.length;
        worksheetData = [{
          Fecha: fechaFormateada,
          'Cantidad de Turnos': cantidad
        }];

        this.generarExcel(worksheetData, `turnos_${this.fechaEspecifica}`);
      });
    }

    else if (!this.fechaDesde && !this.fechaHasta && !this.fechaEspecifica) {
      // Exportar todos los turnos por día (vista por defecto)
      const labels = this.chartTurnosPorDia.labels as string[] ?? [];
      const data = this.chartTurnosPorDia.datasets[0]?.data ?? [];

      if (labels.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin turnos',
          text: 'No hay turnos cargados.',
          confirmButtonColor: '#8A2BE2'
        });
        return;
      }

      worksheetData = labels.map((label, index) => ({
        Fecha: label,
        'Cantidad de Turnos': (data[index] as number) ?? 0
      }));

      this.generarExcel(worksheetData, 'turnos_todos');
    }

    else {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Seleccioná un rango o una fecha específica para exportar.',
        confirmButtonColor: '#8A2BE2'
      });
    }
  }


  private generarExcel(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'Turnos': worksheet }, SheetNames: ['Turnos'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    FileSaver.saveAs(blob, `${filename}.xlsx`);
  }

  descargarGraficoTurnosPorDia() {
    if (!this.graficoTurnosPorDia) return;

    // Validar si el gráfico tiene datos
    const tieneDatos = this.chartTurnosPorDia?.labels && this.chartTurnosPorDia.labels.length > 0;

    if (!tieneDatos) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'No hay datos para generar el gráfico en este filtro.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    const canvas: HTMLCanvasElement = this.graficoTurnosPorDia.nativeElement;

    // Crear un canvas temporal con el mismo tamaño
    const canvasConFondo = document.createElement('canvas');
    const ctx = canvasConFondo.getContext('2d');

    canvasConFondo.width = canvas.width;
    canvasConFondo.height = canvas.height;

    if (ctx) {
      // Pintar fondo negro
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar el gráfico arriba
      ctx.drawImage(canvas, 0, 0);

      // Crear enlace de descarga
      const enlace = document.createElement('a');

      // Nombre dinámico según filtro
      let nombreArchivo = 'turnos_por_dia';
      if (this.fechaEspecifica) {
        nombreArchivo += `_${this.formatearFechaPipe.transform(this.fechaEspecifica)}`;
      } else if (this.fechaDesde && this.fechaHasta) {
        nombreArchivo += `_${this.formatearFechaPipe.transform(this.fechaDesde)}_a_${this.formatearFechaPipe.transform(this.fechaHasta)}`;
      }

      // Descargar como PNG
      enlace.href = canvasConFondo.toDataURL('image/png');
      enlace.download = `${nombreArchivo}.png`;
      enlace.click();
    }
  }

 async exportarTurnosPorMedicoEnRangoExcel() {
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

    if (!turnos || turnos.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin turnos',
        text: 'No hay turnos para el especialista y rango seleccionados.',
        confirmButtonColor: '#8A2BE2'
      });
      return;
    }

    // mapear datos para Excel
    const map = new Map<string, number>();
    for (const turno of turnos) {
      const fecha = turno.fecha;
      map.set(fecha, (map.get(fecha) || 0) + 1);
    }

    const worksheetData = Array.from(map.entries()).map(([fecha, cantidad]) => ({
      Especialista: this.especialistaSeleccionado,
      Fecha: this.formatearFechaPipe.transform(fecha),
      'Cantidad de Turnos': cantidad,
      Estado: this.soloFinalizados ? 'Finalizado' : 'Pendiente'
    }));

    // generar Excel
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = { Sheets: { 'Turnos Especialista': worksheet }, SheetNames: ['Turnos Especialista'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const desdeFormateada = this.formatearFechaPipe.transform(this.fechaDesde);
    const hastaFormateada = this.formatearFechaPipe.transform(this.fechaHasta);
    const estadoNombre = this.soloFinalizados ? '_finalizados' : '';

    const nombreArchivo = `turnos_${this.especialistaSeleccionado.replace(/\s+/g, '_').toLowerCase()}_${desdeFormateada}_a_${hastaFormateada}${estadoNombre}.xlsx`;

    FileSaver.saveAs(blob, nombreArchivo);
  }


}
