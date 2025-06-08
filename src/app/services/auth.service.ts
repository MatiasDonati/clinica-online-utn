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
  public supabase = supabase; // Para usarlo desde otros componentes si hace falta

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
      console.error('Error al cerrar sesión:', err);
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
        console.error('Error al verificar el email:', error.message);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('Excepción al verificar el email:', err);
      return false;
    }
  }

  async registrarUsuarioCompleto(datos: {
    tipo: 'paciente' | 'especialista',
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
      console.log('📝 Datos recibidos para registrar:', datos);

      // Verificar si ya existe el email
      const yaExiste = await this.verificarUsuarioRegistrado(datos.email);
      if (yaExiste) return { exito: false, mensaje: 'El email ya está en uso.' };

      // Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email: datos.email,
        password: datos.password
      });

      if (error || !data.user?.id) {
        return { exito: false, mensaje: 'Error al registrarse: ' + error?.message };
      }

      const authId = data.user.id;
      console.log('Usuario creado en auth con ID:', authId);

      // Subir imágenes (opcional)
      let imagen1Url: string | undefined;
      let imagen2Url: string | undefined;

      // Imagen 1
      if (datos.imagen1) {
        console.log('📸 Subiendo imagen 1:', datos.imagen1);
        const emailSanitizado = datos.email.replace(/[^a-zA-Z0-9]/g, '_');
        const nombreArchivo1 = `${datos.tipo}_${Date.now()}_1_${emailSanitizado}`;

        const { error: errorImg1 } = await supabase.storage
          .from('perfiles')
          .upload(nombreArchivo1, datos.imagen1);

        if (errorImg1) {
          console.error('Error al subir imagen1:', errorImg1.message);
        } else {
          const { data } = supabase.storage.from('perfiles').getPublicUrl(nombreArchivo1);
          imagen1Url = data.publicUrl;
          console.log('Imagen 1 subida correctamente. URL:', imagen1Url);
        }
      } else {
        console.warn('No se recibió imagen1.');
      }

      // Imagen 2
      if (datos.tipo === 'paciente' && datos.imagen2) {
        console.log('Subiendo imagen 2:', datos.imagen2);
        const emailSanitizado = datos.email.replace(/[^a-zA-Z0-9]/g, '_');
        const nombreArchivo2 = `${datos.tipo}_${Date.now()}_2_${emailSanitizado}`;

        const { error: errorImg2 } = await supabase.storage
          .from('perfiles')
          .upload(nombreArchivo2, datos.imagen2);

        if (errorImg2) {
          console.error('Error al subir imagen2:', errorImg2.message);
        } else {
          const { data } = supabase.storage.from('perfiles').getPublicUrl(nombreArchivo2);
          imagen2Url = data.publicUrl;
          console.log('Imagen 2 subida correctamente. URL:', imagen2Url);
        }
      } else if (datos.tipo === 'paciente') {
        console.warn('No se recibió imagen2 para paciente.');
      }

      // Armar objeto para la tabla específica
      const tabla = datos.tipo === 'paciente' ? 'pacientes' : 'especialistas';
      const info: any = {
        authid: authId,
        mail: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        edad: datos.edad,
        dni: datos.dni
      };

      if (imagen1Url) info.imagen1 = imagen1Url;
      if (imagen2Url) info.imagen2 = imagen2Url;

      if (datos.tipo === 'paciente') {
        info.obrasocial = datos.obraSocial;
      } else {
        info.especialidad = datos.nuevaEspecialidad || datos.especialidad;
      }

      console.log('Objeto a insertar en tabla', tabla, ':', info);

      // Insertar en tabla específica
      const { error: insertError } = await supabase.from(tabla).insert([info]);
      if (insertError) {
        console.error('Error al insertar en tabla específica:', insertError.message);
        return { exito: false, mensaje: 'Error al guardar datos adicionales.' };
      }

      // Insertar en tabla general de usuarios
      await supabase.from('users_data').insert([
        { authid: authId, mail: datos.email, tipo: datos.tipo }
      ]);

      console.log('Datos insertados correctamente.');

      return {
        exito: true,
        mensaje: 'Registro exitoso. Te enviamos un email para confirmar tu cuenta.'
      };

    } catch (err: any) {
      console.error('Excepción en el registro:', err);
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
      console.warn('No se pudo obtener el tipo de usuario:', error?.message);
      return null;
    }

    return data.tipo;
  } catch (err) {
    console.error('Error al obtener tipo de usuario:', err);
    return null;
  }
}


}
