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

  // Más adelante:
  // async cancelarTurno(id: number, motivo: string) { ... }
  // async aceptarTurno(...) { ... }
  // async finalizarTurno(...) { ... }
}
