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

  async obtenerNombreApellidoPorMail(mail: string): Promise<{ nombre: string, apellido: string } | null> {

    const { data: paciente, error: errorPaciente } = await supabase
      .from('pacientes')
      .select('nombre, apellido')
      .eq('mail', mail)
      .single();

    if (paciente && !errorPaciente) {
      return { nombre: paciente.nombre, apellido: paciente.apellido };
    }

    const { data: especialista, error: errorEspecialista } = await supabase
      .from('especialistas')
      .select('nombre, apellido')
      .eq('mail', mail)
      .single();

    if (especialista && !errorEspecialista) {
      return { nombre: especialista.nombre, apellido: especialista.apellido };
    }

    const { data: admin, error: errorAdmin } = await supabase
      .from('administradores')
      .select('nombre, apellido')
      .eq('mail', mail)
      .single();

    if (admin && !errorAdmin) {
      return { nombre: admin.nombre, apellido: admin.apellido };
    }

    const { data: user, error: errorUser } = await supabase
      .from('users_data')
      .select('nombre, apellido')
      .eq('mail', mail)
      .single();

    if (user && !errorUser) {
      return { nombre: user.nombre, apellido: user.apellido };
    }

    console.warn('No se encontró el usuario con mail:', mail);
    return null;
  }

  async obtenerImagenPorMailYTipo(mail: string, tipo: string): Promise<string | null> {
    let tabla = '';
    let campo = '';

    switch (tipo) {
      case 'paciente':
        tabla = 'pacientes';
        campo = 'imagen1';
        break;
      case 'especialista':
        tabla = 'especialistas';
        campo = 'imagen1';
        break;
      case 'admin':
        tabla = 'administradores';
        campo = 'imagen';
        break;
      default:
        return null;
    }

    const { data, error } = await supabase
      .from(tabla)
      .select(campo)
      .eq('mail', mail)
      .single();

    if (error || !data || !(data as Record<string, any>)[campo]) {
      console.warn(`No se encontró imagen para ${mail} en ${tabla}`);
      return null;
    }

    return (data as Record<string, any>)[campo] as string;
  }




}
