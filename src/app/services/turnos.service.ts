import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})

export class TurnosService {

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

}
