import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  async obtenerUsuarios(): Promise<any[]> {
    const { data, error } = await supabase.from('users_data').select('*');
    if (error) {
      console.error('Error al obtener usuarios:', error.message);
      return [];
    }
    return data;
  }

  async cambiarEstadoEspecialista(mail: string, aprobado: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('especialistas')
      .update({ aprobado })
      .eq('mail', mail);

    if (error) {
      console.error('Error al actualizar especialista:', error.message);
      return false;
    }
    return true;
  }

  async crearUserData(mail: string, tipo: string): Promise<boolean> {
    const { error } = await supabase.from('users_data').insert([{ mail, tipo }]);
    if (error) {
      console.error('Error al crear user_data:', error.message);
      return false;
    }
    return true;
  }

  async crearAdministrador(datos: any): Promise<boolean> {
    const { error } = await supabase.from('administradores').insert([datos]);
    if (error) {
      console.error('Error al crear administrador:', error.message);
      return false;
    }
    return true;
  }

  async obtenerEspecialistas(): Promise<any[]> {
    const { data, error } = await supabase
      .from('especialistas')
      .select('*');
    if (error) {
      console.error('Error al obtener especialistas:', error.message);
      return [];
    }
    return data;
  }

  async obtenerEspecialidadesPorEmail(mail: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('especialistas_especialidades')
      .select('especialidad')
      .eq('especialista_email', mail);

    if (error) {
      console.error('Error al obtener especialidades:', error.message);
      return [];
    }

    return data.map(e => e.especialidad);
  }


  async obtenerPacientesAtendidosPorEspecialista(especialistaEmail: string): Promise<any[]> {
    // 🔹 Todas las historias clínicas del especialista
    const { data: historias, error } = await supabase
      .from('historias_clinicas')
      .select('paciente_email')
      .eq('especialista_email', especialistaEmail);

    if (error) {
      console.error('Error al obtener historias clínicas:', error.message);
      return [];
    }

    // 🔹 Emails únicos de pacientes
    const pacientesEmails = Array.from(new Set(historias.map(h => h.paciente_email)));

    if (pacientesEmails.length === 0) {
      return [];
    }

    // 🔹 Traer datos de la tabla pacientes (en lugar de users_data)
    const { data: pacientes, error: errorPacientes } = await supabase
      .from('pacientes')
      .select('mail, nombre, apellido, imagen1, imagen2')
      .in('mail', pacientesEmails);

    if (errorPacientes) {
      console.error('Error al obtener datos de pacientes:', errorPacientes.message);
      return [];
    }

    return pacientes;
  }

  async obtenerHistoriasClinicasPorPacienteYEspecialista(pacienteEmail: string, especialistaEmail: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .select('*')
      .eq('paciente_email', pacienteEmail)
      .eq('especialista_email', especialistaEmail);

    if (error) {
      console.error('Error al obtener historias clínicas del paciente:', error.message);
      return [];
    }

    return data;
  }


  async obtenerResenaYDiagnosticoDeTurno(turnoId: number): Promise<{ resena: string, diagnostico: string } | null> {
    const { data, error } = await supabase
      .from('turnos')
      .select('resena_especialista, diagnostico')
      .eq('id', turnoId)
      .single();

    if (error) {
      console.error('Error al obtener reseña y diagnóstico del turno:', error.message);
      return null;
    }

    return {
      resena: data.resena_especialista,
      diagnostico: data.diagnostico
    };
  }


}
