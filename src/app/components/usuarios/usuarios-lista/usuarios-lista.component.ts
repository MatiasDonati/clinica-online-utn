import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../../services/usuarios.service';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ExcelService } from '../../../services/excel.service';
import { AuthService } from '../../../services/auth.service';
import Swal from 'sweetalert2';
import { TipoUsuarioBordeDirective } from '../../../directivas/tipo-usuario-borde.directive';


@Component({
  selector: 'app-usuarios-lista',
  imports: [NgIf, CommonModule, NgClass, TipoUsuarioBordeDirective],
  templateUrl: './usuarios-lista.component.html',
  styleUrl: './usuarios-lista.component.css'
})
export class UsuariosListaComponent {

  usuarios: any[] = [];
    cargando: boolean = false;
    mensaje: string = '';
  
    actualizandoEstado: string | null = null;
  
    tipoMensaje: 'info' | 'danger' = 'info';
  
    tipoFiltro: 'todos' | 'especialista' | 'paciente' | 'admin' = 'todos';

    nombres: { [mail: string]: string } = {};

    imagenes: { [mail: string]: string } = {};

    cargandoDescarga: boolean = false;

  
  constructor(private usuariosService: UsuariosService, private excelService: ExcelService, private authService: AuthService) {}

  async ngOnInit() {

    this.cargando = true;

    const usuariosData = await this.usuariosService.obtenerUsuarios();
    const especialistasData = await this.usuariosService.obtenerEspecialistas();

    for (const especialista of especialistasData) {
      const especialidades = await this.usuariosService.obtenerEspecialidadesPorEmail(especialista.mail);
      console.log(especialista.mail, especialidades);
    }


    this.usuarios = usuariosData.map(usuario => {
      if (usuario.tipo === 'especialista') {
        const datosEsp = especialistasData.find(e => e.mail === usuario.mail);
        return { ...usuario, aprobado: datosEsp?.aprobado ?? false };
      }
      return usuario;
    });

    for (const u of this.usuarios) {
      this.obtenerImagen(u.mail, u.tipo);
    }

    for (const u of this.usuarios) {
      this.obtenerNombre(u.mail);
    }

    this.cargando = false;
  }


  async cambiarEstadoEspecialista(mail: string, aprobado: boolean) {
    this.actualizandoEstado = mail;

    const ok = await this.usuariosService.cambiarEstadoEspecialista(mail, aprobado);
    if (ok) {
      this.mensaje = `El Especialista ${mail} fue ${aprobado ? 'habilitado' : 'inhabilitado'}.`;
      this.tipoMensaje = aprobado ? 'info' : 'danger';


      const usuariosData = await this.usuariosService.obtenerUsuarios();
      const especialistasData = await this.usuariosService.obtenerEspecialistas();

      this.usuarios = usuariosData.map(usuario => {
        if (usuario.tipo === 'especialista') {
          const datosEsp = especialistasData.find(e => e.mail === usuario.mail);
          return { ...usuario, aprobado: datosEsp?.aprobado ?? false };
        }
        return usuario;
      });

      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    } else {
      this.mensaje = 'Error al cambiar el estado.';
      this.tipoMensaje = 'danger';

    }

    this.actualizandoEstado = null;
  }

  get usuariosFiltrados() {
    if (this.tipoFiltro === 'todos') return this.usuarios;
    return this.usuarios.filter(u => u.tipo === this.tipoFiltro);
  }

  // xlsx
  async exportarExcel() {
    let datos: any[] = [];

    try {
      if (this.tipoFiltro === 'todos') {
        const [especialistas, pacientes, administradores] = await Promise.all([
          this.authService.obtenerTodosLosEspecialistas(),
          this.authService.obtenerTodosLosPacientes(),
          this.authService.obtenerTodosLosAdministradores()
        ]);

        // Especialidades de los especialistas
        const emails = especialistas.map(e => e.mail);
        const { data: relaciones, error: errorRelaciones } = await this.authService.supabase
          .from('especialistas_especialidades')
          .select('especialista_email, especialidad')
          .in('especialista_email', emails);

        const mapaEspecialidades = new Map<string, string[]>();
        if (!errorRelaciones && relaciones) {
          for (const r of relaciones) {
            if (!mapaEspecialidades.has(r.especialista_email)) {
              mapaEspecialidades.set(r.especialista_email, []);
            }
            mapaEspecialidades.get(r.especialista_email)?.push(r.especialidad);
          }
        }

        for (const esp of especialistas) {
          esp.especialidades = mapaEspecialidades.get(esp.mail) ?? [];
        }

        datos = [
          ...especialistas.map(e => ({
            tipo: 'especialista',
            nombre: e.nombre,
            apellido: e.apellido,
            edad: e.edad,
            dni: e.dni,
            especialidades: e.especialidades.join(', ') || '-',
            aprobado: e.aprobado ? 'Sí' : 'No',
            obraSocial: '-',
            mail: e.mail
          })),
          ...pacientes.map(p => ({
            tipo: 'paciente',
            nombre: p.nombre,
            apellido: p.apellido,
            edad: p.edad,
            dni: p.dni,
            especialidades: '-',
            aprobado: '-',
            obraSocial: p.obrasocial ?? '-',
            mail: p.mail
          })),
          ...administradores.map(a => ({
            tipo: 'admin',
            nombre: a.nombre,
            apellido: a.apellido,
            edad: a.edad,
            dni: a.dni,
            especialidades: '-',
            aprobado: '-',
            obraSocial: '-',
            mail: a.mail
          }))
        ];
      }

      else if (this.tipoFiltro === 'especialista') {
        const especialistas = await this.authService.obtenerTodosLosEspecialistas();

        const emails = especialistas.map(e => e.mail);
        const { data: relaciones, error: errorRelaciones } = await this.authService.supabase
          .from('especialistas_especialidades')
          .select('especialista_email, especialidad')
          .in('especialista_email', emails);

        const mapaEspecialidades = new Map<string, string[]>();
        if (!errorRelaciones && relaciones) {
          for (const r of relaciones) {
            if (!mapaEspecialidades.has(r.especialista_email)) {
              mapaEspecialidades.set(r.especialista_email, []);
            }
            mapaEspecialidades.get(r.especialista_email)?.push(r.especialidad);
          }
        }

        for (const esp of especialistas) {
          esp.especialidades = mapaEspecialidades.get(esp.mail) ?? [];
        }

        datos = especialistas.map(e => ({
          tipo: 'especialista',
          nombre: e.nombre,
          apellido: e.apellido,
          edad: e.edad,
          dni: e.dni,
          especialidades: e.especialidades.join(', ') || '-',
          aprobado: e.aprobado ? 'Sí' : 'No',
          mail: e.mail
        }));
      }

      else if (this.tipoFiltro === 'paciente') {
        const pacientes = await this.authService.obtenerTodosLosPacientes();
        datos = pacientes.map(p => ({
          tipo: 'paciente',
          nombre: p.nombre,
          apellido: p.apellido,
          edad: p.edad,
          dni: p.dni,
          obraSocial: p.obrasocial ?? '-',
          mail: p.mail
        }));
      }

      else if (this.tipoFiltro === 'admin') {
        const admins = await this.authService.obtenerTodosLosAdministradores();
        datos = admins.map(a => ({
          tipo: 'admin',
          nombre: a.nombre,
          apellido: a.apellido,
          edad: a.edad,
          dni: a.dni,
          mail: a.mail
        }));
      }

      let nombreArchivo = 'usuarios_completos';

      switch (this.tipoFiltro) {
        case 'paciente':
          nombreArchivo = 'pacientes';
          break;
        case 'todos':
          nombreArchivo = 'todos';
          break;
        case 'especialista':
          nombreArchivo = 'especialistas';
          break;
        case 'admin':
          nombreArchivo = 'administradores';
          break;
      }

      this.excelService.exportAsExcelFile(datos, nombreArchivo);

    } catch (err) {
      console.log('Error al exportar a Excel:', err);
    }
  }

  async obtenerNombre(mail: string) {
    if (!this.nombres[mail]) {
      const datos = await this.usuariosService.obtenerNombreApellidoPorMail(mail);
      if (datos) {
        this.nombres[mail] = `${datos.nombre} ${datos.apellido}`;
      } else {
        this.nombres[mail] = '';
      }
    }
    return this.nombres[mail];
  }

  async obtenerImagen(mail: string, tipo: string) {
    if (!this.imagenes[mail]) {
      const url = await this.usuariosService.obtenerImagenPorMailYTipo(mail, tipo);
      this.imagenes[mail] = url ?? '/placeholder.jpg';
    }
  }


  async descargarTurnosUsuario(usuario: any) {
    try {
      this.cargandoDescarga = true;

      const { data: turnos, error } = await this.authService.supabase
        .from('turnos')
        .select('id, paciente_email, especialista_email, fecha, hora, estado')
        .or(`paciente_email.eq.${usuario.mail},especialista_email.eq.${usuario.mail}`);

      if (error) {
        console.error('Error al obtener turnos:', error.message);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener los turnos de este usuario.'
        });
        return;
      }

      if (!turnos || turnos.length === 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Sin turnos',
          text: `El usuario ${usuario.mail} no tiene turnos registrados.`
        });
        return;
      }

      const datosExcel = turnos.map(t => ({
        ID: t.id,
        Fecha: t.fecha,
        Hora: t.hora,
        Estado: t.estado,
        Paciente: t.paciente_email,
        Especialista: t.especialista_email
      }));

      const nombreArchivo = `turnos_${usuario.mail.replace(/[@.]/g, '_')}`;

      this.excelService.exportAsExcelFile(datosExcel, nombreArchivo);

      await Swal.fire({
        icon: 'success',
        title: 'Descarga completa',
        text: 'El archivo Excel con los turnos se descargó correctamente.'
      });

    } catch (err) {
      console.error('Error general:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al exportar los turnos.'
      });
    } finally {
      this.cargandoDescarga = false;
    }
  }

  async descargarHistoriasClinicasUsuario(usuario: any) {
    try {
      this.cargandoDescarga = true;

      // 🔹 Determinar filtro según tipo
      const filtro = usuario.tipo === 'especialista'
        ? { especialista_email: usuario.mail }
        : { paciente_email: usuario.mail };

      // 🔹 Obtener historias clínicas filtradas
      const { data: historias, error } = await this.authService.supabase
        .from('historias_clinicas')
        .select('*')
        .match(filtro);

      if (error) {
        console.error('Error al obtener historias clínicas:', error.message);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron obtener las historias clínicas de este usuario.'
        });
        return;
      }

      if (!historias || historias.length === 0) {
        await Swal.fire({
          icon: 'info',
          title: 'Sin historias clínicas',
          text: 'Este usuario no tiene historias clínicas registradas.'
        });
        return;
      }

      // obtener los nombres con los mails y aplanar los datos dinámicos
      for (const h of historias) {
        // Obtener nombre paciente
        const paciente = await this.usuariosService.obtenerNombreApellidoPorMail(h.paciente_email);
        (h as any).paciente = paciente ? `${paciente.nombre} ${paciente.apellido}` : h.paciente_email;

        // Obtener nombre especialista
        const especialista = await this.usuariosService.obtenerNombreApellidoPorMail(h.especialista_email);
        (h as any).especialista = especialista ? `${especialista.nombre} ${especialista.apellido}` : h.especialista_email;

        // Flatten datos_dinamicos si existe
        if (h.datos_dinamicos) {
          Object.assign(h, h.datos_dinamicos);
          delete h.datos_dinamicos;
        }
      }

      // reordenar datos y armar arrayfinal
      const historiasOrdenadas = historias.map(h => {
        const base: any = {
          id: h.id,
          paciente_email: h.paciente_email,
          paciente: (h as any).paciente,
          especialista_email: h.especialista_email,
          especialista: (h as any).especialista,
          fecha: h.fecha,
          altura: h.altura,
          peso: h.peso,
          temperatura: h.temperatura,
          presion: h.presion,
          turno_id: h.turno_id
        };

        // Agregar datos dinámicos al final
        for (const [clave, valor] of Object.entries(h)) {
          if (!Object.keys(base).includes(clave) && valor !== null && typeof valor !== 'object') {
            base[clave] = valor;
          }
        }

        return base;
      });

      // 🔹 Exportar a Excel
      this.excelService.exportAsExcelFile(historiasOrdenadas, `historias_${usuario.mail.replace(/[@.]/g, '_')}`);

      await Swal.fire({
        icon: 'success',
        title: 'Descarga completa',
        text: 'El archivo Excel con las historias clínicas se descargó correctamente.'
      });

    } catch (err) {
      console.error('Error general:', err);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Ocurrió un error al exportar las historias clínicas.'
      });
    } finally {
      this.cargandoDescarga = false;
    }
  }








  get tipoBotonExcel(): string {
    switch (this.tipoFiltro) {
      case 'especialista':
        return 'especialistas';
      case 'paciente':
        return 'pacientes';
      case 'admin':
        return 'administradores';
      default:
        return 'todos';
    }
  }


}
