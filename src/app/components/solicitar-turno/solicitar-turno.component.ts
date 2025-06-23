import { Component, OnInit } from '@angular/core';
import { TurnosService } from '../../services/turnos.service';
import { HeaderComponent } from "../header/header.component";
import { DatePipe, NgClass, NgFor, NgIf, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';
import { flatMap } from 'rxjs';
import { HoraFormatoPipe } from '../../pipes/hora-formato.pipe';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-solicitar-turno',
  templateUrl: './solicitar-turno.component.html',
  styleUrls: ['./solicitar-turno.component.css'],
  standalone: true,
  imports: [HeaderComponent, NgFor, NgIf, TitleCasePipe, NgClass, DatePipe, FormsModule, UpperCasePipe, HoraFormatoPipe]
})
export class SolicitarTurnoComponent implements OnInit {

  especialidades: string[] = [];
  especialistas: { nombre: string, apellido: string, email: string, imagen1: string }[] = [];
  disponibilidad: any[] = [];

  cargando = true;

  seleccionada: string | null = null;
  especialistaSeleccionado: string | null = null;

  horariosDisponibles: { hora: string, disponible: boolean }[] = [];
  diaSeleccionado: string | null = null;
  horarioSeleccionado: string | null = null;

  fechasDisponibles: { fecha: string, dia: string, desde: string, hasta: string }[] = [];

  pacientes: string[] = [];
  pacienteSeleccionado: string | null = null;

  userEmail: string | null = null;
  tipoUsuario: string | null = null;

  enviando: boolean = false;

  ////////////
  ////////////
  modoPrueba: boolean = false;
  ////////////
  ////////////

  cargandoEspecialistas = false;
  cargandoFechas = false;
  cargandoHorarios = false;

  constructor(private turnosService: TurnosService, private authService: AuthService) {}

  async ngOnInit() {
    this.cargando = true;
    this.userEmail = await this.authService.obtenerUsuarioActual();

    if (this.userEmail) {
      this.tipoUsuario = await this.authService.obtenerTipoUsuario(this.userEmail);
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
    this.cargandoEspecialistas = true;

    // ✅ ahora se obtienen nombre, apellido, email, imagen1
    this.especialistas = await this.turnosService.obtenerEspecialistasPorEspecialidadCompleto(esp);

    this.cargandoEspecialistas = false;

    this.especialistaSeleccionado = null;
    this.disponibilidad = [];
    this.horariosDisponibles = [];
    this.fechasDisponibles = [];
    this.horariosDisponibles = [];
    this.horarioSeleccionado = null;
  }

  async seleccionarEspecialista(email: string) {
    this.especialistaSeleccionado = email;
    this.cargandoFechas = true;

    const original = await this.turnosService.obtenerDisponibilidadPorEspecialista(email);

    this.disponibilidad = original;
    console.log(this.disponibilidad);

    this.fechasDisponibles = this.obtenerFechasProximas(original);
    console.log('Fechas disponibles!..', this.fechasDisponibles);
    this.diaSeleccionado = null;
    this.horariosDisponibles = [];
    this.cargandoFechas = false;
  }

  seleccionarDia(dia: string) {
    this.diaSeleccionado = dia;
    const diaObj = this.disponibilidad.find(d => d.dia === dia);
    if (diaObj) {
      this.generarHorarios(diaObj.desde, diaObj.hasta).then(h => this.horariosDisponibles = h);
    }
  }

  async generarHorarios(desde: string, hasta: string): Promise<{ hora: string, disponible: boolean }[]> {
    const [desdeHora, desdeMinuto] = desde.split(':').map(Number);
    const [hastaHora, hastaMinuto] = hasta.split(':').map(Number);

    const inicio = new Date();
    inicio.setHours(desdeHora, desdeMinuto, 0);

    const fin = new Date();
    fin.setHours(hastaHora, hastaMinuto, 0);

    const promesas: Promise<{ hora: string, disponible: boolean }>[] = [];

    while (inicio < fin) {
      const hora = inicio.toTimeString().slice(0, 5);

      promesas.push(
        this.verificarDisponibilidad(hora).then(disponible => ({ hora, disponible }))
      );

      inicio.setMinutes(inicio.getMinutes() + 30);
    }

    const resultados = await Promise.all(promesas);
    console.log('Horarios generados...', resultados);
    return resultados;
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
    this.generarHorarios(desde, hasta).then(h => this.horariosDisponibles = h);
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
          fecha: fecha.toLocaleDateString('sv-SE'),
          dia,
          desde: disp.desde,
          hasta: disp.hasta
        });
      }
    }

    return fechas;
  }

  async seleccionarFecha(f: { fecha: string, desde: string, hasta: string }) {
    this.diaSeleccionado = f.fecha;
    this.cargandoHorarios = true;
    this.horariosDisponibles = await this.generarHorarios(f.desde, f.hasta);
    this.cargandoHorarios = false;
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

    if (!this.seleccionada || !this.especialistaSeleccionado || !this.diaSeleccionado || !this.horarioSeleccionado || !emailPaciente) {
      await Swal.fire({
        icon: 'warning',
        title: 'Faltan datos',
        text: 'Por favor, completá todos los campos para solicitar el turno.'
      });
      this.enviando = false;
      return;
    }

    const turnosEnEseMomento = await this.turnosService.obtenerTurnosPorFechaYHora(
      this.diaSeleccionado,
      this.horarioSeleccionado
    );

    if (turnosEnEseMomento.length >= 6) {
      await Swal.fire({
        icon: 'warning',
        title: 'Consultorios ocupados',
        text: 'Ya hay 6 turnos para este horario. Por favor, elegí otro.'
      });
      this.enviando = false;
      return;
    }

    const turnosEspecialista = await this.turnosService.obtenerTurnosEnFechaHora(
      this.diaSeleccionado,
      this.horarioSeleccionado,
      this.especialistaSeleccionado
    );

    if (turnosEspecialista.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Horario ocupado',
        text: 'El especialista ya tiene un turno en este horario.'
      });
      this.enviando = false;
      return;
    }

    const tieneTurnoConOtro = await this.turnosService.pacienteTieneTurnoConOtroEspecialista(
      this.diaSeleccionado,
      this.horarioSeleccionado,
      emailPaciente,
      this.especialistaSeleccionado
    );

    if (tieneTurnoConOtro) {
      await Swal.fire({
        icon: 'warning',
        title: 'Conflicto de horario',
        text: 'El paciente ya tiene un turno con otro especialista en ese horario.'
      });
      this.enviando = false;
      return;
    }

    const mismoDiaMismoEspecialista = await this.turnosService.obtenerTurnosPacienteConEspecialistaMismoDia(
      this.diaSeleccionado,
      emailPaciente,
      this.especialistaSeleccionado
    );

    if (mismoDiaMismoEspecialista.length > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Turno duplicado',
        text: 'El paciente ya tiene un turno con este especialista el mismo día.'
      });
      this.enviando = false;
      return;
    }

    const fecha = new Date(this.diaSeleccionado + 'T00:00:00');

    const day = String(fecha.getDate()).padStart(2, '0');
    const month = String(fecha.getMonth() + 1).padStart(2, '0');

    const fechaCorta = `${day}/${month}`;

    // formatear hora
    const horaFormateada = new Date(`1970-01-01T${this.horarioSeleccionado}`)
      .toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).replace('a. m.', 'AM').replace('p. m.', 'PM');

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Confirmar turno?',
      text: `¿Deseás solicitar el turno el ${fechaCorta} a las ${horaFormateada}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) {
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
      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar el turno',
        text: mensaje
      });
    } finally {
      this.enviando = false;
    }
  }

  async verificarDisponibilidad(horario: string): Promise<boolean> {
    if (!this.diaSeleccionado || !this.especialistaSeleccionado || !this.userEmail) return false;

    const emailPaciente = this.tipoUsuario === 'admin'
      ? this.pacienteSeleccionado
      : this.userEmail;

    const [global, individual, paciente] = await Promise.all([
      this.turnosService.obtenerTurnosPorFechaYHora(this.diaSeleccionado, horario),
      this.turnosService.obtenerTurnosEnFechaHora(this.diaSeleccionado, horario, this.especialistaSeleccionado),
      this.turnosService.obtenerTurnosPacienteEnFechaHora(this.diaSeleccionado, horario, emailPaciente!)
    ]);

    return global.length < 6 && individual.length === 0 && paciente.length === 0;
  }

  getImagenEspecialidad(especialidad: string): string {
    const nombreNormalizado = this.normalizarNombre(especialidad);

    const disponibles = [
      'cardiologia', 'clinico', 'dermatologia', 'odontologia',
      'otorrino', 'pediatria', 'traumatologia', 'urologia'
    ];

    return disponibles.includes(nombreNormalizado)
      ? `/imgs_especialidades/${nombreNormalizado}.jpg`
      : '/imgs_especialidades/default.jpg';
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  getNombreCompletoEspecialista(): string {
    const seleccionado = this.especialistas.find(e => e.email === this.especialistaSeleccionado);
    return seleccionado ? `${seleccionado.nombre} ${seleccionado.apellido}` : '';
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
