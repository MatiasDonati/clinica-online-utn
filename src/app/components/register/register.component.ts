import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';


const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, CommonModule, HeaderComponent]
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  mensaje: string = '';

  constructor(private router: Router) {}

  
  async register() {
    try {

      const { data: usuarioEmailExistente } = await supabase
        .from('users-data')
        .select('mail')
        .eq('mail', this.email)
        .single();

      if (usuarioEmailExistente) {
        this.mensaje = 'El email ya se encuentra en uso.';
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: this.email,
        password: this.password
      });

      if (error) {
        this.mensaje = 'Error al registrarse: ' + error.message;
        if (error.message === 'Password should be at least 6 characters.') {
          this.mensaje = 'La contraseña debe tener al menos 6 caracteres.';
        }
        return;
      }

      // login Automatico
      // login Automatico
      
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password
      });

      if (loginError) {
        this.mensaje = 'Error al iniciar sesión automáticamente: ' + loginError.message;
        return;
      }

      await supabase.from('users-data').insert([
        { authId: data.user?.id, mail: data.user?.email }
      ]);

      //REGISTRO y LOGIN con EXITO
      this.router.navigate(['/home']);

    } catch (err) {
      this.mensaje = 'Ocurrió un error.';
      console.error('Error en el registro:', err);
    }
  }
}
