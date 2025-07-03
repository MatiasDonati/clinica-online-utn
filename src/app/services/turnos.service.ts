import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class TurnosService {

  private turnosSignal = signal<any[]>([]);
  turnos$ = this.turnosSignal.asReadonly();

  constructor() {}


  async obtenerTurnosDelPaciente(email: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        historias_clinicas (*)
      `)
      .eq('paciente_email', email);

    if (error) throw error;
    return data;
  }



  async cancelarTurno(id: number, motivo: string) {
    const { error } = await supabase
      .from('turnos')
      .update({
        estado: 'cancelado',
        comentario_cancelacion: motivo
      })
      .eq('id', id);

    if (error) throw error;
  }

  async completarEncuesta(id: number) {
    const { error } = await supabase
      .from('turnos')
      .update({ encuesta_completada: true })
      .eq('id', id);

    if (error) throw error;
  }

  async calificarTurno(id: number, comentario: string, calificacion: number) {
    const { error } = await supabase
      .from('turnos')
      .update({
        comentario_paciente: comentario,
        calificacion: calificacion
      })
      .eq('id', id);

    if (error) throw error;
  }

  // Especialista


  async obtenerTurnosDelEspecialista(email: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select(`
        *,
        historias_clinicas (*)
      `)
      .eq('especialista_email', email);

    if (error) throw error;
    return data;
  }


  async actualizarEstadoTurno(id: number, estado: string) {
    const { error } = await supabase
      .from('turnos')
      .update({ estado })
      .eq('id', id);
    if (error) throw error;
  }

  async rechazarTurno(id: number, comentario: string) {
    const { error } = await supabase
      .from('turnos')
      // .update({ estado: 'cancelado', comentario_cancelacion: comentario })
      .update({ estado: 'rechazado', comentario_cancelacion: comentario })
      .eq('id', id);
    if (error) throw error;
  }

  async finalizarTurno(id: number, comentario: string, diagnostico: string) {
    await supabase
      .from('turnos')
      .update({
        estado: 'realizado',
        resena_especialista: comentario,
        diagnostico: diagnostico
      })
      .eq('id', id);
  }

  async guardarEncuesta(turnoId: number, pacienteEmail: string, facilidad: string, volverias: string, comentario: string) {
    await supabase
      .from('encuestas')
      .insert([{
        turno_id: turnoId,
        paciente_email: pacienteEmail,
        respuesta_facilidad: facilidad,
        respuesta_volverias: volverias,
        comentario: comentario
      }]);
  }

  async cargarTurnosPara(email: string, tipo: 'paciente' | 'especialista') {
    const campo = tipo === 'paciente' ? 'paciente_email' : 'especialista_email';

    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq(campo, email);

    if (error) {
      console.error('Error al cargar turnos:', error.message);
      return;
    }

    this.turnosSignal.set(data || []);
  }

  obtenerTurnosActuales() {
    return this.turnosSignal();
  }

  actualizarTurnosEnMemoria(nuevosTurnos: any[]) {
    this.turnosSignal.set(nuevosTurnos);
  }

  async obtenerTodosLosTurnos(): Promise<any[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*');

    if (error) {
      console.error('Error al obtener todos los turnos:', error.message);
      return [];
    }

    return data || [];
  }

  async obtenerEspecialidadesDisponibles(): Promise<string[]> {
    const { data, error } = await supabase
      .from('especialistas_especialidades')
      .select('especialidad');

    if (error) {
      console.error('Error al obtener especialidades:', error.message);
      return [];
    }

    // Eliminar duplicados
    const especialidadesUnicas = Array.from(new Set(data.map(e => e.especialidad)));
    return especialidadesUnicas;
  }

  async obtenerEspecialistasPorEspecialidad(especialidad: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('especialistas_especialidades')
      .select('especialista_email')
      .eq('especialidad', especialidad);

    if (error) {
      console.error('Error al obtener especialistas:', error.message);
      return [];
    }

    return data.map(e => e.especialista_email);
  }

  async obtenerDisponibilidadPorEspecialista(email: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('disponibilidad_especialistas')
      .select('*')
      .eq('especialista_email', email);

    if (error) {
      console.error('Error al obtener disponibilidad:', error.message);
      return [];
    }

    return data || [];
  }

  async obtenerPacientes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('users_data')
      .select('mail')
      .eq('tipo', 'paciente');

    if (error) {
      console.error('Error al obtener pacientes:', error.message);
      return [];
    }

    return data.map(p => p.mail);
  }

  async solicitarTurno(turno: any) {
    const { error } = await supabase.from('turnos').insert([turno]);
    if (error) throw error;
  }

  async obtenerTurnosEnFechaHora(
    fecha: string,
    hora: string,
    especialistaEmail: string
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .eq('hora', hora)
      .eq('especialista_email', especialistaEmail)
      .filter('estado', 'not.in', '(cancelado,rechazado)')

    if (error) {
      console.error(' Error al consultar turnos en Supabase:', error.message);
      throw error;
    }

    return data || [];
  }

  async obtenerTurnosPorFechaYHora(fecha: string, hora: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .eq('hora', hora)
      .in('estado', ['pendiente', 'aceptado']);

    return data || [];
  }

  async obtenerTurnosPacienteEnFechaHora(fecha: string, hora: string, emailPaciente: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .eq('hora', hora)
      .eq('paciente_email', emailPaciente)
      .in('estado', ['pendiente', 'aceptado']);

    return data || [];
  }

  async obtenerTurnosPacienteConEspecialistaMismoDia(fecha: string, emailPaciente: string, emailEspecialista: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('fecha', fecha)
      .eq('paciente_email', emailPaciente)
      .eq('especialista_email', emailEspecialista)
      .in('estado', ['pendiente', 'aceptado']);

    return data || [];
  }

  async pacienteTieneTurnoConOtroEspecialista(
    fecha: string,
    hora: string,
    emailPaciente: string,
    especialistaEmail: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('turnos')
      .select('especialista_email')
      .eq('fecha', fecha)
      .eq('hora', hora)
      .eq('paciente_email', emailPaciente)
      .in('estado', ['pendiente', 'aceptado']);

    if (error) {
      console.error('Error al verificar conflicto de turno:', error.message);
      return false;
    }

    return (data || []).some(t => t.especialista_email !== especialistaEmail);
  }


  async agregarHorarioEspecialista(email: string, dia: string, desde: string, hasta: string) {
    const { error } = await supabase
      .from('disponibilidad_especialistas')
      .insert([{ especialista_email: email, dia, desde, hasta }]);
    if (error) throw error;
  }

  async eliminarHorario(id: number) {
    const { error } = await supabase
      .from('disponibilidad_especialistas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }


  async obtenerEspecialistasPorEspecialidadCompleto(especialidad: string): Promise<{ nombre: string, apellido: string, email: string, imagen1: string }[]> {
  const { data: relaciones, error: errorRelaciones } = await supabase
    .from('especialistas_especialidades')
    .select('especialista_email')
    .eq('especialidad', especialidad);

  if (errorRelaciones || !relaciones) {
    console.error('Error al obtener relaciones:', errorRelaciones?.message);
    return [];
  }

  const emails = relaciones.map(r => r.especialista_email);

  const { data: especialistas, error: errorEspecialistas } = await supabase
    .from('especialistas')
    .select('nombre, apellido, mail, imagen1')
    .in('mail', emails);

  if (errorEspecialistas || !especialistas) {
    console.error('Error al obtener especialistas:', errorEspecialistas?.message);
    return [];
  }

  return especialistas.map((esp: any) => ({
    nombre: esp.nombre,
    apellido: esp.apellido,
    email: esp.mail,
    imagen1: esp.imagen1
  }));
}

  async guardarHistoriaClinica(historia: any) {
    const { error } = await supabase
      .from('historias_clinicas')
      .insert([historia]);
    return { error };
  }


  async obtenerTurnosPorEspecialidad() {
    const { data, error } = await supabase
      .from('turnos')
      .select('especialidad');

    if (error) {
      console.error('Error al obtener turnos por especialidad:', error);
      return [];
    }

    return data;
  }

  async obtenerTurnosPorDia() {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha');

    if (error) {
      console.error('Error al obtener turnos por día:', error);
      return [];
    }

    return data;
  }

  async obtenerTurnosPorDiaEnRango(desde: string, hasta: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) {
      console.error('Error al obtener turnos por día en rango:', error);
      return [];
    }

    return data;
  }


  async obtenerTurnosPorEspecialidadYDia(especialidad: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha, especialidad')
      .eq('especialidad', especialidad);

    if (error) {
      console.error('Error al obtener turnos por especialidad y día:', error);
      return [];
    }

    return data;
  }

  async obtenerTodasLasEspecialidades() {
    const { data, error } = await supabase
      .from('turnos')
      .select('especialidad');

    if (error) {
      console.error('Error al obtener especialidades:', error);
      return [];
    }

    return data;
  }

  async obtenerTurnosPorFechaEspecifica(fecha: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha')
      .eq('fecha', fecha);

    if (error) {
      console.error('Error al obtener turnos por fecha específica:', error);
      return [];
    }

    return data;
  }

  async obtenerEspecialistasDeTurnos() {
    const { data, error } = await supabase
      .from('turnos')
      .select('especialista_email')
      .neq('especialista_email', null);

    if (error) {
      console.error('Error al obtener especialistas de turnos:', error);
      return [];
    }

    // Retornar emails únicos
    return Array.from(new Set(data.map(e => e.especialista_email)));
  }

  async obtenerTurnosPorEspecialista(especialista_email: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha')
      .eq('especialista_email', especialista_email);

    if (error) {
      console.error('Error al obtener turnos por especialista:', error);
      return [];
    }

    return data;
  }


  async obtenerTurnosFinalizadosPorMedicoEnRango(especialista: string, desde: string, hasta: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha, especialista_email, estado')
      .eq('especialista_email', especialista)
      .eq('estado', 'realizado')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) {
      console.error('Error al obtener turnos finalizados por médico en rango:', error);
      return [];
    }

    return data;
  }


  async obtenerTurnosPorMedicoEnRango(especialista: string, desde: string, hasta: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha, especialista_email')
      .eq('especialista_email', especialista)
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) {
      console.error('Error al obtener turnos por médico en rango:', error);
      return [];
    }

    return data;
  }


  async obtenerTurnosPorEspecialidadPorDia(especialidad: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('fecha')
      .eq('especialidad', especialidad);

    if (error) {
      console.error(error);
      return [];
    }
    return data;
  }


  async obtenerTurnosPorEspecialidadCompleto(especialidad: string) {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .eq('especialidad', especialidad);

    if (error) {
      console.error('Error al obtener turnos por especialidad:', error.message);
      return [];
    }
    return data;
  }

  async obtenerTurnosCompletos() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*');

    if (error) {
      console.error('Error al obtener todos los turnos:', error.message);
      return [];
    }
    return data;
  }



} 
