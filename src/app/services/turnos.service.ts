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
      .select('*')
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
      .select('*')
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

} 
