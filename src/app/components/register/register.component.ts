import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../services/auth.service';

import { edadMayorA16Validator } from '../../validators/edad.validator';
import { nombreApellidoValidator } from '../../validators/nombre-apellido.validator';
import { dniValidator } from '../../validators/dni.validator';
import { obraSocialValidator } from '../../validators/obra-social.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent]
})
export class RegisterComponent implements OnInit {

  @Input() mostrarHeader: boolean = true;
  @Input() desdeAdmin: boolean = false;

  form!: FormGroup;
  mensaje = '';
  imagen1!: File;
  imagen2!: File;

  cargando: boolean = false;
  registroExitoso: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['paciente', Validators.required],
      nombre: ['', [Validators.required, nombreApellidoValidator()]],
      apellido: ['', [Validators.required, nombreApellidoValidator()]],
      edad: ['', [Validators.required, edadMayorA16Validator()]],
      dni: ['', [Validators.required, dniValidator()]],
      obraSocial: ['', [obraSocialValidator()]],
      especialidad: [''],
      nuevaEspecialidad: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.form.get('especialidad')?.valueChanges.subscribe(value => {
      if (value) {
        this.form.get('nuevaEspecialidad')?.setValue('');
      }
    });

    this.form.get('nuevaEspecialidad')?.valueChanges.subscribe(value => {
      if (value) {
        this.form.get('especialidad')?.setValue('');
      }
    });

    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'admin') {
        this.form.get('obraSocial')?.reset();
        this.form.get('especialidad')?.reset();
        this.form.get('nuevaEspecialidad')?.reset();
      }
    });
  }

  seleccionarArchivo(event: any, cual: number) {
    const archivo = event.target.files[0];
    if (cual === 1) this.imagen1 = archivo;
    if (cual === 2) this.imagen2 = archivo;
  }

  async register() {
    this.mensaje = '';
    this.cargando = true;
    this.registroExitoso = false;

    const tipo = this.form.getRawValue().tipo;

    // Validaciones por Tiop usuario!
    // Validaciones por Tiop usuario!
    
    if (
      this.form.invalid ||
      (tipo !== 'admin' && !this.imagen1) ||
      (tipo === 'paciente' && !this.imagen2)
    ) {
      this.mensaje = 'Todos los campos obligatorios deben estar completos.';
      this.cargando = false;
      return;
    }

    const datos = {
      tipo,
      nombre: this.form.value.nombre,
      apellido: this.form.value.apellido,
      edad: this.form.value.edad,
      dni: this.form.value.dni,
      email: this.form.value.email,
      password: this.form.value.password,
      obraSocial: tipo === 'paciente' ? this.form.value.obraSocial : undefined,
      especialidad: tipo === 'especialista' ? this.form.value.especialidad : undefined,
      nuevaEspecialidad: tipo === 'especialista' ? this.form.value.nuevaEspecialidad : undefined,
      imagen1: tipo !== 'admin' ? this.imagen1 : this.imagen1,
      // Ver esto
      // imagen1: this.imagen1,
      imagen2: tipo === 'paciente' ? this.imagen2 : undefined
    };

    const resultado = await this.authService.registrarUsuarioCompleto(datos);

    this.mensaje = resultado.exito
      ? resultado.mensaje + ' Por favor, confirmá tu email antes de iniciar sesión.'
      : resultado.mensaje;

    this.registroExitoso = resultado.exito;
    this.cargando = false;
  }

  irA(ruta: string) {
    this.router.navigate([ruta]);
  }
}
