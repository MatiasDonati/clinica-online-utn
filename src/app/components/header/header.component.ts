import { Component, effect, OnInit } from '@angular/core';
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
  title = 'Clinica Online';
  userEmail: string | null = null;
  mostrarLoginRegister = false;

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      this.userEmail = this.authService.userEmailSignal();
      this.mostrarLoginRegister = !this.userEmail;
    });
  }

  async ngOnInit() {
    const email = await this.authService.obtenerUsuarioActual();

    if (email) {

      const tipo = await this.authService.obtenerTipoUsuario(email);

      if (tipo === 'especialista') {
        const { data: especialistaData, error } = await this.authService.supabase
          .from('especialistas')
          .select('aprobado')
          .eq('mail', email)
          .single();

        if (error || !especialistaData || especialistaData.aprobado !== true) {
          console.log('Especialista no aprobado, cerrando sesión automáticamente');
          await this.authService.cerrarSesion();
          this.router.navigate(['/login']);
          return; // <-- que no setee el signal
        }
      }

      this.authService.userEmailSignal.set(email);
    }
  }

  async cerrarSesion() {
    try {
      await this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  irA(ruta: string) {
    this.router.navigate([ruta]);
  }
}
