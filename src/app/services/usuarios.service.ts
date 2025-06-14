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

}
