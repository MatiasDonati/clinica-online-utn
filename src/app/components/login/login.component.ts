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

  constructor(private router: Router, private authService: AuthService) {}

  async login(loginBotonRapido: boolean = false) {
    this.mensaje = '';

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
      // 🔍 Paso 1: Obtener tipo de usuario antes de loguear
      const { data: tipoData, error: tipoError } = await supabase
        .from('users_data')
        .select('tipo')
        .eq('mail', this.username)
        .single();

      if (tipoError || !tipoData) {
        this.mensaje = 'No se pudo verificar el tipo de usuario.';
        return;
      }

      // ✅ Paso 2: Si es especialista, verificar si está aprobado
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

      // 🔐 Paso 3: Si todo está ok, loguear
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

      // 🚀 Paso 4: Redirigir según tipo
      switch (tipoData.tipo) {
        case 'admin':
          this.router.navigate(['/admin']);
          break;
        case 'especialista':
          this.router.navigate(['/turnos-especialista']);
          break;
        case 'paciente':
        default:
          this.router.navigate(['/usuarios']);
          break;
      }
    } catch (err) {
      this.mensaje = 'Error inesperado al intentar iniciar sesión.';
      console.error(err);
    }
  }

  loginRapido(email: string, password: string) {
    this.username = email;
    this.password = password;
    this.login(true);
  }

  irARegistrarse() {
    this.router.navigate(['/register']);
  }
}
