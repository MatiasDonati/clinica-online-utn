import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit {
  historias: any[] = [];
  cargando = true;
  objectKeys = Object.keys;
  tipoUsuario: string | null = null;
  emailUsuario: string | null = null;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    this.emailUsuario = await this.authService.obtenerUsuarioActual();
    if (!this.emailUsuario) {
      this.cargando = false;
      return;
    }

    this.tipoUsuario = await this.authService.obtenerTipoUsuario(this.emailUsuario);
    if (!this.tipoUsuario) {
      this.cargando = false;
      return;
    }

    const { data, error } = await supabase
      .from('historias_clinicas')
      .select('*')
      .or(`paciente_email.eq.${this.emailUsuario},especialista_email.eq.${this.emailUsuario}`) // para paciente o especialista
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener historias clínicas:', error.message);
      this.cargando = false;
      return;
    }

    // Traer todos los usuarios para poder cruzar mail con nombre
    const usuariosQuery = await supabase
      .from('users_data')
      .select('mail, nombre, apellido');

    const usuarios = usuariosQuery.data || [];

    this.historias = (data || []).map(historia => {
      const paciente = usuarios.find(u => u.mail === historia.paciente_email);
      const especialista = usuarios.find(u => u.mail === historia.especialista_email);

      return {
        ...historia,
        pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : historia.paciente_email,
        especialistaNombre: especialista ? `${especialista.nombre} ${especialista.apellido}` : historia.especialista_email
      };
    });

    this.cargando = false;
  }
}
