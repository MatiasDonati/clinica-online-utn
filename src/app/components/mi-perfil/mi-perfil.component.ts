import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit {
  userEmail: string | null = null;
  tipoUsuario: string | null = null;
  nombre: string = '';
  apellido: string = '';
  imagenesPerfil: string[] = [];
  especialidades: string[] = [];
  imagenesCargando = true;

  dni: string = '';
  edad: number | null = null;
  obraSocial: string = '';


  constructor(private authService: AuthService) {}

  async ngOnInit() {

    
    this.userEmail = await this.authService.obtenerUsuarioActual();

    if (this.userEmail) {
      const userData = await this.authService.obtenerDatosUsuario(this.userEmail);

      if (userData) {
        this.tipoUsuario = userData.tipo || '';
        this.nombre = userData.nombre || '';
        this.apellido = userData.apellido || '';
        this.imagenesPerfil = userData.imagenes || [];
        this.dni = userData.dni || '';
        this.edad = userData.edad || null;
        this.obraSocial = userData.obrasocial || '';

        

        if (this.tipoUsuario === 'especialista') {
          this.especialidades = await this.authService.obtenerEspecialidadesPorEmail(this.userEmail);
        }
      }

      this.imagenesCargando = false;
    }
  }
}

