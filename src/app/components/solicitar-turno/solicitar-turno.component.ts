import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HeaderComponent } from "../header/header.component";
import { NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css'],
  standalone: true,
  imports: [HeaderComponent, NgFor, NgIf, TitleCasePipe, NgClass]
})
export class SolicitarTurnoComponent implements OnInit {
  especialidades: string[] = [];
  especialistas: string[] = [];
  disponibilidad: any[] = [];

  cargando = true;

  seleccionada: string | null = null;
  especialistaSeleccionado: string | null = null;

  horariosDisponibles: string[] = [];
  diaSeleccionado: string | null = null;

  horarioSeleccionado: string | null = null;

  


  constructor(private turnosService: TurnosService) {}

  async ngOnInit() {
    await this.cargarEspecialidades();
  }

  async cargarEspecialidades() {
    this.cargando = true;
    this.especialidades = await this.turnosService.obtenerEspecialidadesDisponibles();
    this.cargando = false;
  }

  async seleccionarEspecialidad(esp: string) {
    this.seleccionada = esp;
    this.especialistas = await this.turnosService.obtenerEspecialistasPorEspecialidad(esp);
    this.especialistaSeleccionado = null;
    this.disponibilidad = [];
    this.horariosDisponibles = [];
  }

  async seleccionarEspecialista(email: string) {
    this.especialistaSeleccionado = email;
    const original = await this.turnosService.obtenerDisponibilidadPorEspecialista(email);
    this.disponibilidad = original.map(d => ({
      ...d,
      fechas: this.obtenerFechasValidasParaDia(d.dia)
    }));
    this.diaSeleccionado = null;
    this.horariosDisponibles = [];
  }


  seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    const diaObj = this.disponibilidad.find(d => d.dia === dia);
    if (diaObj) {
      this.horariosDisponibles = this.generarHorarios(diaObj.desde, diaObj.hasta);
    }
  }

  generarHorarios(desde: string, hasta: string): string[] {
    const horarios: string[] = [];
    const [desdeHora, desdeMinuto] = desde.split(':').map(Number);
    const [hastaHora, hastaMinuto] = hasta.split(':').map(Number);

    const inicio = new Date();
    inicio.setHours(desdeHora, desdeMinuto, 0);

    const fin = new Date();
    fin.setHours(hastaHora, hastaMinuto, 0);

    while (inicio < fin) {
      const hora = inicio.toTimeString().slice(0, 5);
      horarios.push(hora);
      inicio.setMinutes(inicio.getMinutes() + 30);
    }

    return horarios;
  }

  seleccionarHorario(horario: string) {
    this.horarioSeleccionado = horario;
  }


  private obtenerFechasValidasParaDia(diaSemana: string): string[] {
    const fechasValidas: string[] = [];
    const hoy = new Date();

    for (let i = 0; i < 15; i++) {
      const fecha = new Date();
      fecha.setDate(hoy.getDate() + i);

      const nombreDia = fecha.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();

      if (nombreDia === diaSemana.toLowerCase()) {
        fechasValidas.push(fecha.toISOString().split('T')[0]);
      }
    }

    return fechasValidas;
  }

  seleccionarDiaConDia(fecha: string, desde: string, hasta: string) {
    this.diaSeleccionado = fecha;
    this.horariosDisponibles = this.generarHorarios(desde, hasta);
  }


}
