import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../../services/usuarios.service';
import { CommonModule, NgClass, NgIf } from '@angular/common';

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
  
  
  
    constructor(private usuariosService: UsuariosService) {}
  
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

}
