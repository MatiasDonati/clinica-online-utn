import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HeaderComponent } from "../header/header.component";
import { DatePipe, NgClass, NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';


const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css'],
  standalone: true,
  imports: [HeaderComponent, NgFor, NgIf, TitleCasePipe, NgClass, DatePipe, FormsModule]
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

  fechasDisponibles: { fecha: string, dia: string, desde: string, hasta: string }[] = [];

  pacientes: string[] = [];
  pacienteSeleccionado: string | null = null;


  userEmail: string | null = null;
  tipoUsuario: string | null = null;

  enviando: boolean = false;

  constructor( private turnosService: TurnosService, private authService: AuthService) { }

  async ngOnInit() {
    this.cargando = true;
    this.userEmail = await this.authService.obtenerUsuarioActual();

    if (this.userEmail) {
      this.tipoUsuario = await this.authService.obtenerTipoUsuario(this.userEmail);

      console.log(this.tipoUsuario)

      if (this.tipoUsuario === 'admin') {
        await this.cargarPacientes();
      }
    }

  await this.cargarEspecialidades();
  this.cargando = false;
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
    this.disponibilidad = original;

    this.fechasDisponibles = this.obtenerFechasProximas(original);
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


  private obtenerFechasProximas(disponibilidad: any[]): { fecha: string, dia: string, desde: string, hasta: string }[] {
    const fechas: { fecha: string, dia: string, desde: string, hasta: string }[] = [];
    const hoy = new Date();

    for (let i = 0; i < 15; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const dia = fecha.toLocaleDateString('es-AR', { weekday: 'long' }).toLowerCase();

      const disp = disponibilidad.find(d => d.dia.toLowerCase() === dia);

      if (disp) {
        fechas.push({
          fecha: fecha.toISOString().split('T')[0],
          dia,
          desde: disp.desde,
          hasta: disp.hasta
        });
      }
    }

    return fechas;
  }

  seleccionarFecha(f: { fecha: string, desde: string, hasta: string }) {
    this.diaSeleccionado = f.fecha;
    this.horariosDisponibles = this.generarHorarios(f.desde, f.hasta);
  }


  async cargarPacientes() {
    this.pacientes = await this.turnosService.obtenerPacientes();
  }

  async confirmarTurno() {
    if (this.enviando) return;
    this.enviando = true;

    const emailPaciente = this.tipoUsuario === 'admin'
      ? this.pacienteSeleccionado
      : this.userEmail;

    if (
      !this.seleccionada ||
      !this.especialistaSeleccionado ||
      !this.diaSeleccionado ||
      !this.horarioSeleccionado ||
      !emailPaciente
    ) {
      alert('Faltan datos para confirmar el turno.');
      this.enviando = false;
      return;
    }

    const nuevoTurno = {
      fecha: this.diaSeleccionado,
      hora: this.horarioSeleccionado,
      especialidad: this.seleccionada,
      especialista_email: this.especialistaSeleccionado,
      paciente_email: emailPaciente,
      estado: 'pendiente',
      comentario_cancelacion: null,
      resena_especialista: null,
      comentario_paciente: null,
      encuesta_completada: false,
      calificacion: null,
      diagnostico: null
    };

    try {
      await this.turnosService.solicitarTurno(nuevoTurno);
      await Swal.fire({
        icon: 'success',
        title: 'Turno solicitado con éxito',
        showConfirmButton: false,
        timer: 2000
      });
      this.resetFormulario();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error al solicitar turno:', mensaje);

      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar el turno',
        text: mensaje
      });
    } finally {
      this.enviando = false;
    }
  }



  resetFormulario() {
    this.seleccionada = null;
    this.especialistas = [];
    this.especialistaSeleccionado = null;
    this.disponibilidad = [];
    this.fechasDisponibles = [];
    this.diaSeleccionado = null;
    this.horariosDisponibles = [];
    this.horarioSeleccionado = null;
    if (this.tipoUsuario === 'admin') this.pacienteSeleccionado = null;
  }



}
