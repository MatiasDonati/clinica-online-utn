import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';
import { HeaderComponent } from '../header/header.component';
import { environment } from '../../../environments/environment';

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

  constructor(private router: Router) {}

  login(loginBotonRapido: boolean = false) {

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

    supabase.auth.signInWithPassword({
      email: this.username,
      password: this.password,
    }).then(({ data, error }) => {
      if (error) {

        if(error.message === 'Invalid login credentials') {
          this.mensaje = 'Credenciales inválidas';
        }
      } else {
        this.mensaje = '';

        if (data.user) {
          const userId = data.user.id;

          if(!loginBotonRapido) {
            this.registrarLogin(userId);
          }
          this.router.navigate(['/home']);
        }
      }
    }).catch((err) => {
      this.mensaje = 'Error en la conexión';
    });
  }

  async registrarLogin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('logins-usuarios')
        .insert([
          {
            user_id: userId,
            fecha_log: new Date().toISOString()
          }
        ]);

      // Por si falla SUPABASE
      if (error) {
        console.error('Error registrando el login:', error.message);
      } else {
        console.log('Login registrado correctamente:', data);
      }

    } catch (err) {
      console.error('Error en la inserción del login:', err);
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
