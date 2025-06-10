import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public supabase = supabase;

  userEmailSignal = signal<string | null>(null);
  private userEmail: string | null = null;

  constructor(private router: Router) {}

  async obtenerUsuarioActual(): Promise<string | null> {
    await supabase.auth.getSession();
    const { data, error } = await supabase.auth.getUser();
    const email = data.user?.email || null;
    this.userEmailSignal.set(email);
    return email;
  }


  async cerrarSesion(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.userEmailSignal.set(null);
      this.userEmail = null;
      localStorage.removeItem('authId');
      localStorage.removeItem('email');
      localStorage.removeItem('tipoUsuario');
      this.router.navigate(['']);
    } catch (err) {
      console.log('Error al cerrar sesión:', err);
    }
  }

  async verificarUsuarioRegistrado(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users_data')
        .select('mail')
        .eq('mail', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('Error al verificar el email:', error.message);
        return false;
      }

      return !!data;
    } catch (err) {
      console.log('Excepción al verificar el email:', err);
      return false;
    }
  }

  async registrarUsuarioCompleto(datos: {
    tipo: 'paciente' | 'especialista' | 'admin',
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    edad: number,
    dni: string,
    obraSocial?: string,
    especialidad?: string,
    nuevaEspecialidad?: string,
    imagen1?: File,
    imagen2?: File
  }): Promise<{ exito: boolean; mensaje: string }> {
    try {
      console.log('Datos recibidos para registrar:', datos);

      const yaExiste = await this.verificarUsuarioRegistrado(datos.email);
      if (yaExiste) return { exito: false, mensaje: 'El email ya está en uso.' };

      // crea usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.password
      });

      if (error || !data.user?.id) {
        return { exito: false, mensaje: 'Error al registrarse: ' + error?.message };
      }

      const authId = data.user.id;
      console.log('Usuario creado en auth con ID:', authId);

      // imagenes
      let imagen1Url: string | undefined;
      let imagen2Url: string | undefined;

      const emailSanitizado = datos.email.replace(/[^a-zA-Z0-9]/g, '_');

      if (datos.imagen1) {
        const nombreArchivo1 = `${datos.tipo}_${Date.now()}_1_${emailSanitizado}`;
        const { error: errorImg1 } = await supabase.storage
          .from('perfiles')
          .upload(nombreArchivo1, datos.imagen1);

        if (!errorImg1) {
          const { data } = supabase.storage.from('perfiles').getPublicUrl(nombreArchivo1);
          imagen1Url = data.publicUrl;
          console.log('Imagen 1 subida correctamente. URL:', imagen1Url);
        } else {
          console.log('Error al subir imagen1:', errorImg1.message);
        }
      }

      if (datos.tipo === 'paciente' && datos.imagen2) {
        const nombreArchivo2 = `${datos.tipo}_${Date.now()}_2_${emailSanitizado}`;
        const { error: errorImg2 } = await supabase.storage
          .from('perfiles')
          .upload(nombreArchivo2, datos.imagen2);

        if (!errorImg2) {
          const { data } = supabase.storage.from('perfiles').getPublicUrl(nombreArchivo2);
          imagen2Url = data.publicUrl;
          console.log('Imagen 2 subida correctamente. URL:', imagen2Url);
        } else {
          console.log('Error al subir imagen2:', errorImg2.message);
        }
      }

      // objeto para insertar en la tabla q crresponda
      let tabla = '';
      const info: any = {
        authid: authId,
        mail: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        edad: datos.edad,
        dni: datos.dni
      };

      switch (datos.tipo) {
        case 'paciente':
          tabla = 'pacientes';
          if (imagen1Url) info.imagen1 = imagen1Url;
          if (imagen2Url) info.imagen2 = imagen2Url;
          info.obrasocial = datos.obraSocial;
          break;

        case 'especialista':
          tabla = 'especialistas';
          if (imagen1Url) info.imagen1 = imagen1Url;
          info.especialidad = datos.nuevaEspecialidad || datos.especialidad;
          break;

        case 'admin':
          tabla = 'administradores';
          if (imagen1Url) info.imagen = imagen1Url;
          break;
      }

      console.log('Insertando en tabla:', tabla, info);

      const { error: insertError } = await supabase.from(tabla).insert([info]);
      if (insertError) {
        console.log('Error al insertar en tabla específica:', insertError.message);
        return { exito: false, mensaje: 'Error al guardar datos adicionales.' };
      }

      // users_data
      await supabase.from('users_data').insert([
        { authid: authId, mail: datos.email, tipo: datos.tipo }
      ]);

      console.log('Datos insertados correctamente.');
      return {
        exito: true,
        mensaje: 'Registro exitoso. Te enviamos un email para confirmar tu cuenta.'
      };

    } catch (err: any) {
      console.log('Excepción en el registro:', err);
      return { exito: false, mensaje: 'Ocurrió un error inesperado.' };
    }
  }


  async obtenerTipoUsuario(email: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('users_data')
        .select('tipo')
        .eq('mail', email)
        .single();

      if (error || !data) {
        console.log('No se pudo obtener el tipo de usuario:', error?.message);
        return null;
      }

      return data.tipo;
    } catch (err) {
      console.log('Error al obtener tipo de usuario:', err);
      return null;
    }
  }


}
