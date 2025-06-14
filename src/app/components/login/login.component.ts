import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';
import { HeaderComponent } from '../header/header.component';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  mensaje: string = '';
  cargando: boolean = false;

  usuariosRapidos: any[] = [];

  readonly PASSWORD_COMUN = '123123';

  cargandoAccesos: boolean = true;



  constructor(private router: Router, private authService: AuthService) {}

async ngOnInit() {
  this.cargandoAccesos = true;

  // verificar si ya estan guardados
  // const accesosGuardados = localStorage.getItem('usuariosRapidos');

  // if (accesosGuardados) {
  //   this.usuariosRapidos = JSON.parse(accesosGuardados);
  //   this.cargandoAccesos = false;
  //   return;
  // }

  // Si no estaban, los cargamos desde Supabase
  this.usuariosRapidos = (await Promise.all([
    this.accesoRapido('matiaseduardodonati@gmail.com', 'paciente'),
    this.accesoRapido('hifolif397@linacit.com', 'paciente'),
    this.accesoRapido('pabija2042@pngzero.com', 'paciente'),
    this.accesoRapido('tejokak266@linacit.com', 'especialista'),
    this.accesoRapido('ripeb54041@pngzero.com', 'especialista'),
    this.accesoRapido('befino7826@linacit.com', 'admin'),
  ])).filter(Boolean);

  // guardar en localStorage
  // localStorage.setItem('usuariosRapidos', JSON.stringify(this.usuariosRapidos));

  this.cargandoAccesos = false;
}


  async login() {
    this.mensaje = '';
    this.cargando = true;

    if (!this.username || !this.password) {
      this.mensaje = 'Todos los campos son obligatorios';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.username)) {
      this.mensaje = 'Formato de email incorrecto';
      return;
    }

    if (this.password.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    try {
      const { data: tipoData, error: tipoError } = await supabase
        .from('users_data')
        .select('tipo')
        .eq('mail', this.username)
        .single();

      if (tipoError || !tipoData) {
        this.mensaje = 'No se pudo verificar el tipo de usuario.';
        return;
      }


      if (tipoData.tipo === 'especialista') {
        const { data: especialistaData, error: especialistaError } = await supabase
          .from('especialistas')
          .select('aprobado')
          .eq('mail', this.username)
          .single();

        if (especialistaError || !especialistaData) {
          this.mensaje = 'No se pudo verificar si estás aprobado como especialista.';
          return;
        }

        if (!especialistaData.aprobado) {
          this.mensaje = 'Tu cuenta de especialista aún no fue aprobada.';
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: this.username,
        password: this.password,
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          this.mensaje = 'Debés confirmar tu email antes de iniciar sesión.';
        } else if (error.message === 'Invalid login credentials') {
          this.mensaje = 'Credenciales inválidas';
        } else {
          this.mensaje = 'Error: ' + error.message;
        }
        return;
      }

      if (!data.user) {
        this.mensaje = 'No se pudo iniciar sesión.';
        return;
      }

      const userId = data.user.id;
      const email = data.user.email;

      localStorage.setItem('authId', userId);
      localStorage.setItem('email', email!);
      localStorage.setItem('tipoUsuario', tipoData.tipo);
      this.authService.userEmailSignal.set(email!);


      console.log('Tipo de usuario:', tipoData.tipo);

      switch (tipoData.tipo) {
        case 'admin':
          this.router.navigate(['']);
          break;
        case 'especialista':
          this.router.navigate(['']);
          break;
        case 'paciente':
        default:
          this.router.navigate(['']);
          break;
      }
    } catch (err) {
      this.mensaje = 'Error inesperado al intentar iniciar sesión.';
      console.error(err);
    }finally {
      this.cargando = false;
    }
  }

  loginRapido(email: string, password: string) {
    this.username = email;
    this.password = password;
    this.login();
  }

  irARegistrarse() {
    this.router.navigate(['/register']);
  }

  async accesoRapido(email: string, tipo: 'paciente' | 'especialista' | 'admin') {
    let imagenUrl = '';
    let alt = tipo.charAt(0).toUpperCase() + tipo.slice(1);

    try {
      switch (tipo) {
        case 'paciente':
          const { data: paciente, error: errorPaciente } = await supabase
            .from('pacientes')
            .select('imagen1')
            .eq('mail', email)
            .single();
          if (errorPaciente || !paciente) throw errorPaciente;
          imagenUrl = paciente.imagen1;
          break;

        case 'especialista':
          const { data: especialista, error: errorEsp } = await supabase
            .from('especialistas')
            .select('imagen1')
            .eq('mail', email)
            .single();
          if (errorEsp || !especialista) throw errorEsp;
          imagenUrl = especialista.imagen1;
          break;

        case 'admin':
          const { data: admin, error: errorAdmin } = await supabase
            .from('administradores')
            .select('imagen')
            .eq('mail', email)
            .single();
          if (errorAdmin || !admin) throw errorAdmin;
          imagenUrl = admin.imagen;
          break;
      }

      return {
        email,
        password: this.PASSWORD_COMUN,
        imagenUrl,
        alt
      };

    } catch (error) {
      console.error(`Error cargando acceso rápido para ${tipo}:`, error);
      return null;
    }
  }

}
