import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../../services/usuarios.service';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ExcelService } from '../../../services/excel.service';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-usuarios-lista',
  imports: [NgIf, CommonModule, NgClass],
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




}
