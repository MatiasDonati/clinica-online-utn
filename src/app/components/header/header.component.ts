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

  userEmail: string | null = null;
  mostrarLoginRegister = false;
  cargando: boolean = false;

  esAdmin: boolean = false;

  cargandoUsuario: boolean = true;

  especialista: boolean = false;

  paciente: boolean = false;



  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      this.userEmail = this.authService.userEmailSignal();
      this.mostrarLoginRegister = !this.userEmail;
    });
  }

  async ngOnInit() {

    const tipo = localStorage.getItem('tipoUsuario');
    this.esAdmin = tipo === 'admin';
    this.paciente = tipo === 'paciente'



    const email = await this.authService.obtenerUsuarioActual();

    if (email) {

      const tipo = await this.authService.obtenerTipoUsuario(email);

      if (tipo === 'especialista') {
        this.especialista = true;
        const { data: especialistaData, error } = await this.authService.supabase
          .from('especialistas')
          .select('aprobado')
          .eq('mail', email)
          .single();

        if (error || !especialistaData || especialistaData.aprobado !== true) {
          console.log('Especialista no aprobado, cerrando sesión automáticamente');
          await this.authService.cerrarSesion();
          this.router.navigate(['/login']);
          return; 
        }
      }else if (tipo === 'admin') {
        this.esAdmin = true;
      }

      this.authService.userEmailSignal.set(email);
    }

    this.cargandoUsuario = false;

  }

  async cerrarSesion() {
    this.cargando = true;
    this.esAdmin = false;
    this.especialista = false;
    this.paciente = false;

    try {
      await this.authService.cerrarSesion();
      this.authService.userEmailSignal.set(null);
      localStorage.clear();
      window.location.href = '/home';
      // this.router.navigate(['/home']);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      this.cargando = false;
      // localStorage.clear()
    }
  }


  irA(ruta: string) {
    if(ruta === 'mis-turnos' && this.especialista) {
      ruta = 'mis-turnos-especialista';
    }
    this.router.navigate([ruta]);
  }
}
