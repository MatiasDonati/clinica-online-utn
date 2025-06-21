import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../services/auth.service';

import { edadMayorA16Validator } from '../../validators/edad.validator';
import { nombreApellidoValidator } from '../../validators/nombre-apellido.validator';
import { dniValidator } from '../../validators/dni.validator';
import { obraSocialValidator } from '../../validators/obra-social.validator';

//////
import { RecaptchaModule } from 'ng-recaptcha';

// animaciones
import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [ReactiveFormsModule, CommonModule, HeaderComponent, RecaptchaModule, FormsModule],
  animations: [
  trigger('zoomFade', [
    transition(':enter', [
      style({ opacity: 0, transform: 'scale(0.95)' }),
      animate('400ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
    ]),
    transition(':leave', [
      animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
    ])
  ])
]
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

  /////
  captchaToken: string = '';
  siteKey: string = '6LdY5VwrAAAAAFk__WuJUdZZuM5PhwOveV-B47B7';

  tipoSeleccionado: 'paciente' | 'especialista' | 'admin' | null = null;

  especialidadesDisponibles = ['Cardiología', 'Pediatría', 'Dermatología'];
  especialidadesSeleccionadas: string[] = [];
  nuevaEspecialidad: string = '';


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    
    this.form = this.fb.group({
      tipo: [null, Validators.required],
      nombre: ['', [Validators.required, nombreApellidoValidator()]],
      apellido: ['', [Validators.required, nombreApellidoValidator()]],
      edad: ['', [Validators.required, edadMayorA16Validator()]],
      dni: ['', [Validators.required, dniValidator()]],
      obraSocial: ['', [obraSocialValidator()]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo === 'admin') {
        this.form.get('obraSocial')?.reset();
      }

      this.imagen1 = undefined!;
      this.imagen2 = undefined!;
      this.especialidadesSeleccionadas = [];
      this.nuevaEspecialidad = '';
    });
  }


  elegirTipo(tipo: 'paciente' | 'especialista' | 'admin') {
    this.tipoSeleccionado = tipo;
    this.form.get('tipo')?.setValue(tipo);
  }

  ///
  onCaptchaResolved(token: string | null) {
    this.captchaToken = token ?? '';
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

    // validar CAPTCHA
    if (!this.captchaToken) {
      this.mensaje = 'Por favor completá el captcha antes de registrarte.';
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
      imagen1: tipo !== 'admin' ? this.imagen1 : this.imagen1,
      imagen2: tipo === 'paciente' ? this.imagen2 : undefined,
      especialidades: tipo === 'especialista' ? this.especialidadesSeleccionadas : undefined
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

  volverAElegirTipo() {
    this.tipoSeleccionado = null;
    this.form.reset();
    this.imagen1 = undefined!;
    this.imagen2 = undefined!;
  }

  toggleEspecialidad(esp: string, event: any) {
    if (event.target.checked) {
      this.especialidadesSeleccionadas.push(esp);
    } else {
      this.especialidadesSeleccionadas = this.especialidadesSeleccionadas.filter(e => e !== esp);
    }
  }

  agregarEspecialidadManual() {
    const esp = this.nuevaEspecialidad.trim();
    if (esp && !this.especialidadesDisponibles.includes(esp)) {
      this.especialidadesDisponibles.push(esp);
    }
    this.nuevaEspecialidad = '';
  }


}
