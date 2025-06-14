import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

import { BehaviorSubject } from 'rxjs';


const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})

export class TurnosService {

  constructor() {}

  // BehaviorSubject
  // BehaviorSubject
  // private _turnos$ = new BehaviorSubject<any[]>([]);
  // turnos$ = this._turnos$.asObservable();
  
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
      .update({ estado: 'cancelado', comentario_cancelacion: comentario })
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





}
