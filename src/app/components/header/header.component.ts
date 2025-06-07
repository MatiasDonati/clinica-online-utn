import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIf],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  userEmail: string | null = null;
  mostrarLoginRegister: boolean = false;
  title = 'Clinica Online';
  constructor(private authService: AuthService, private router: Router) {}


  async ngOnInit() {
    await this.verificarUsuario();
  }

  async verificarUsuario() {
    try {
      this.userEmail = await this.authService.obtenerUsuarioActual();
      this.mostrarLoginRegister = !this.userEmail;
    } catch (err) {
      console.error('Error al verificar el usuario:', err);
      this.mostrarLoginRegister = true;
    }
  }

  async cerrarSesion() {
    try {
      await this.authService.cerrarSesion();
      this.userEmail = null;
      this.mostrarLoginRegister = true;
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  irA(ruta: string){
    this.router.navigate([ruta]);
  }

}
