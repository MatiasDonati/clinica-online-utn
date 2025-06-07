import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from "../header/header.component";

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-crear-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './crear-admin.component.html',
  styleUrls: ['./crear-admin.component.css']
})
export class CrearAdminComponent {
  form: FormGroup;
  mensaje: string = '';

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async crearAdmin() {
    this.mensaje = '';

    const { email, password } = this.form.value;


    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error || !data.user?.id) {
      this.mensaje = 'Error al crear el usuario: ' + error?.message;
      return;
    }

    const authId = data.user.id;

    const { error: insertError } = await supabase
      .from('users_data')
      .insert([{ authid: authId, mail: email, tipo: 'admin' }]);

    if (insertError) {
      this.mensaje = 'Error al insertar en users_data: ' + insertError.message;
      return;
    }

    this.mensaje = '¡Admin creado con éxito!';
    this.form.reset();
  }
}
