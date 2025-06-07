import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [FormsModule, CommonModule, HeaderComponent]
})
export class RegisterComponent {
  tipo: 'paciente' | 'especialista' = 'paciente';

  nombre = '';
  apellido = '';
  edad!: number;
  dni = '';
  obraSocial = '';
  especialidad = '';
  nuevaEspecialidad = '';
  email = '';
  password = '';
  imagen1!: File;
  imagen2!: File;
  mensaje = '';

  constructor(private router: Router, private authService: AuthService) {}

  async register() {
    const datos = {
      tipo: this.tipo,
      email: this.email,
      password: this.password,
      nombre: this.nombre,
      apellido: this.apellido,
      edad: this.edad,
      dni: this.dni,
      obraSocial: this.obraSocial || undefined,
      especialidad: this.especialidad || undefined,
      nuevaEspecialidad: this.nuevaEspecialidad || undefined,
      imagen1: this.imagen1,
      imagen2: this.tipo === 'paciente' ? this.imagen2 : undefined
    };

    const resultado = await this.authService.registrarUsuarioCompleto(datos);

    this.mensaje = resultado.mensaje;

    if (resultado.exito) {
      this.mensaje = resultado.mensaje + ' Por favor, confirmá tu email antes de iniciar sesión.';
    }

  }

  seleccionarArchivo(event: any, cual: number) {
    const archivo = event.target.files[0];
    if (cual === 1) this.imagen1 = archivo;
    if (cual === 2) this.imagen2 = archivo;
  }
}
