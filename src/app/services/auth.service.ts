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
    especialidades?: string[]

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

      // TABLA ESPECILIDADES !!!A
      // TABLA ESPECILIDADES !!!A

      if (datos.tipo === 'especialista' && Array.isArray(datos.especialidades) && datos.especialidades.length > 0) {
        for (const esp of datos.especialidades) {
          const { error: errorEspecialidad } = await supabase
            .from('especialistas_especialidades')
            .insert([{ especialista_email: datos.email, especialidad: esp }]);

          if (errorEspecialidad) {
            console.log(`Error al insertar especialidad '${esp}':`, errorEspecialidad.message);
          }
        }
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

  async obtenerImagenesPorTipoUsuario(email: string, tipo: string): Promise<string[] | null> {
    let tabla = '';
    let campos = '';

    switch (tipo) {
      case 'paciente':
        tabla = 'pacientes';
        campos = 'imagen1,imagen2';
        break;
      case 'especialista':
        tabla = 'especialistas';
        campos = 'imagen1';
        break;
      case 'admin':
      case 'administrador':
        tabla = 'administradores';
        campos = 'imagen';
        break;
      default:
        console.error('Tipo de usuario no válido:', tipo);
        return null;
    }

    const { data, error } = await this.supabase
      .from(tabla)
      .select(campos)
      .eq('mail', email)
      .single();

    if (error || !data) {
      console.error('Error obteniendo imágenes:', error?.message);
      return null;
    }

    const camposData = data as unknown as Record<string, string>;
    const imagenes: string[] = [];

    if ('imagen1' in camposData && camposData['imagen1']) imagenes.push(camposData['imagen1']);
    if ('imagen2' in camposData && camposData['imagen2']) imagenes.push(camposData['imagen2']);
    if ('imagen' in camposData && camposData['imagen']) imagenes.push(camposData['imagen']);

    return imagenes;

  }


  async obtenerDatosUsuario(email: string) {
    // Obtener tipo de usuario
    const { data: usuarioBase, error: errorBase } = await supabase
      .from('users_data')
      .select('tipo')
      .eq('mail', email)
      .single();

    if (errorBase || !usuarioBase) {
      console.log(' Error al obtener tipo de usuario:', errorBase?.message);
      return null;
    }

    const tipo = usuarioBase.tipo;

    let tabla = '';
    switch (tipo) {
      case 'paciente':
        tabla = 'pacientes';
        break;
      case 'especialista':
        tabla = 'especialistas';
        break;
      case 'admin':
        tabla = 'administradores';
        break;
      default:
        console.log('❌Tipo de usuario no reconocido');
        return null;
    }

    // Bbuscar en la tabla correspondiente
    const { data, error } = await supabase
      .from(tabla)
      .select('*')
      .eq('mail', email)
      .single();

    if (error || !data) {
      console.log(`❌ Error al obtener datos desde tabla ${tabla}:`, error?.message);
      return null;
    }

    // Array de imágenes según tipo
    let imagenes: string[] = [];

    switch (tipo) {
      case 'paciente':
        imagenes = [data.imagen1, data.imagen2].filter((i: string) => i);
        break;
      case 'especialista':
        if (data.imagen1) imagenes = [data.imagen1];
        break;
      case 'admin':
        if (data.imagen) imagenes = [data.imagen];
        break;
    }

    return {
      ...data,
      tipo,
      imagenes
    };
  }

  async obtenerEspecialidadesPorEmail(email: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('especialistas_especialidades')
      .select('especialidad')
      .eq('especialista_email', email);

    if (error) {
      console.log(' Error al obtener especialidades:', error.message);
      return [];
    }

    // Devuelve solo los valores de especialidad
    return data.map((item: any) => item.especialidad);
  }

    async obtenerEspecialistasPorEspecialidadCompleto(especialidad: string): Promise<{ nombre: string, apellido: string, email: string, imagen1: string }[]> {
    // 1. Obtener los mails de los especialistas para esa especialidad
    const { data: relaciones, error: errorRelaciones } = await supabase
      .from('especialistas_especialidades')
      .select('especialista_email')
      .eq('especialidad', especialidad);

    if (errorRelaciones || !relaciones) {
      console.error('Error al obtener relaciones:', errorRelaciones?.message);
      return [];
    }

    const emails = relaciones.map(r => r.especialista_email);

    // 2. Traer los datos desde la tabla especialistas
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

  async obtenerTodosLosEspecialistas(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('especialistas')
      .select('*');

    if (error) {
      console.error('Error al obtener especialistas:', error.message);
      return [];
    }

    return data;
  }

  async obtenerTodosLosPacientes(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('pacientes')
      .select('*');

    if (error) {
      console.error('Error al obtener pacientes:', error.message);
      return [];
    }

    return data;
  }

  async obtenerTodosLosAdministradores(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('administradores')
      .select('*');

    if (error) {
      console.error('Error al obtener administradores:', error.message);
      return [];
    }

    return data;
  }

  async obtenerTodosLosUsuariosCompletos(): Promise<any[]> {
    try {
      const [especialistas, pacientes, administradores] = await Promise.all([
        this.obtenerTodosLosEspecialistas(),
        this.obtenerTodosLosPacientes(),
        this.obtenerTodosLosAdministradores()
      ]);

      return [
        ...especialistas.map(e => ({ ...e, tipo: 'especialista' })),
        ...pacientes.map(p => ({ ...p, tipo: 'paciente' })),
        ...administradores.map(a => ({ ...a, tipo: 'admin' }))
      ];
    } catch (err) {
      console.error('Error al obtener todos los usuarios:', err);
      return [];
    }
  }


  async obtenerEspecialidadesDeEspecialista(email: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('especialistas_especialidades')
        .select('especialidad')
        .eq('especialista_email', email);

      if (error) {
        console.error(`Error al obtener especialidades de ${email}:`, error.message);
        return [];
      }

      return data.map((item: any) => item.especialidad);
    } catch (err) {
      console.error(`Excepción al obtener especialidades de ${email}:`, err);
      return [];
    }
  }

  async logIngreso(email: string) {
    const { error } = await this.supabase
      .from('logs_ingresos')
      .insert({ email });

    if (error) {
      console.log('Error al registrar log de ingreso:', error);
    }
  }

  async obtenerLogsIngresos() {
    const { data, error } = await this.supabase
      .from('logs_ingresos')
      .select('*')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error al obtener logs de ingresos:', error);
      return [];
    }

    return data;
  }



}
