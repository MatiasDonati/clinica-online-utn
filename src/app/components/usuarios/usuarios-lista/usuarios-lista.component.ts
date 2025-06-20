import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../../services/usuarios.service';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { ExcelService } from '../../../services/excel.service';


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
  
  
  
    constructor(private usuariosService: UsuariosService, private excelService: ExcelService) {}
  
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
      // Carga todos los usuarios según filtro seleccionado (tipoFiltro p.ej. 'todos', 'paciente', etc.)

      // si est todos tengo q armar una tabla con todos llos campos de todos y el q no tiene por ej paciente especialidades q sea "-"
      // si son especialista los especialstas
      // si son admin los admin
      // si son paciente los paciente

      // Tengo que hacer metodos de consulta a Supabase para traer todos los datos ya q aca solo llegan mail tipo y aprobado..

      const usuarios = this.tipoFiltro === 'todos'
        ? this.usuarios
        : this.usuariosFiltrados;

      // Mapea cada usuario según su tipo
      const datosParaExcel = usuarios.map(u => {
        switch (u.tipo) {
          case 'paciente':
            return {
              tipo: u.tipo,
              nombre: u.nombre,
              apellido: u.apellido,
              edad: u.edad,
              dni: u.dni,
              obraSocial: u.obrasocial,
              mail: u.mail
            };
          case 'especialista':
            return {
              tipo: u.tipo,
              nombre: u.nombre,
              apellido: u.apellido,
              edad: u.edad,
              dni: u.dni,
              especialidades: (u.especialidades ?? []).join(', '),
              aprobado: u.aprobado ? 'Sí' : 'No',
              mail: u.mail
            };
          case 'admin':
            return {
              tipo: u.tipo,
              nombre: u.nombre,
              apellido: u.apellido,
              edad: u.edad,
              dni: u.dni,
              mail: u.mail
            };
          default:
            return u;
        }
      });

      this.excelService.exportAsExcelFile(datosParaExcel, 'usuarios_completos');
    }


}
