import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  userEmail: string | null = null;
  tipoUsuario: string | null = null;
  cargando: boolean = true;

  imagenesPerfil: string[] = [];
  imagenesCargando: boolean = true;



  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    const emailGuardado = localStorage.getItem('email');
    const tipoGuardado = localStorage.getItem('tipoUsuario');

    if (emailGuardado && tipoGuardado) {

      this.imagenesCargando = true;
      this.userEmail = emailGuardado;
      this.tipoUsuario = tipoGuardado;

    } else {
      const email = await this.authService.obtenerUsuarioActual();
      this.userEmail = email;

      if (email) {
        const tipo = await this.authService.obtenerTipoUsuario(email);
        this.tipoUsuario = tipo;

        if (tipo) {
          localStorage.setItem('email', email);
          localStorage.setItem('tipoUsuario', tipo);
        }
      }
    }

    if (this.userEmail && this.tipoUsuario) {
      const imagenes = await this.authService.obtenerImagenesPorTipoUsuario(this.userEmail, this.tipoUsuario);
      if (imagenes) {
        this.imagenesPerfil = imagenes;
      }
    }

    this.cargando = false;
    this.imagenesCargando = false;
  }



  irA(ruta: string) {
    this.router.navigate([ruta]);
  }
}
