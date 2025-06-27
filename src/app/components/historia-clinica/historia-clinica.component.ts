import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import Swal from 'sweetalert2';


const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-historia-clinica',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  templateUrl: './historia-clinica.component.html',
  styleUrl: './historia-clinica.component.css'
})
export class HistoriaClinicaComponent implements OnInit, OnChanges {

  @Input() pacienteEmailFiltro: string | null = null; // nuevo input

  historias: any[] = [];
  cargando = true;
  objectKeys = Object.keys;
  tipoUsuario: string | null = null;
  emailUsuario: string | null = null;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    await this.cargarHistorias();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['pacienteEmailFiltro'] && !changes['pacienteEmailFiltro'].firstChange) {
      await this.cargarHistorias();
    }
  }

  private async cargarHistorias() {
    this.cargando = true;

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

    let query = supabase
      .from('historias_clinicas')
      .select('*')
      .order('fecha', { ascending: false });

    if (this.pacienteEmailFiltro) {
      // paciente seleccionado y especialista logueado
      query = query
        .eq('paciente_email', this.pacienteEmailFiltro)
        .eq('especialista_email', this.emailUsuario);
    } else {
      // caso normal: paciente o especialista logueado
      query = query.or(`paciente_email.eq.${this.emailUsuario},especialista_email.eq.${this.emailUsuario}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener historias clínicas:', error.message);
      this.cargando = false;
      return;
    }

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

  async verResenaYDiagnostico(turnoId: number) {
    const { data, error } = await supabase
      .from('turnos')
      .select('resena_especialista, diagnostico')
      .eq('id', turnoId)
      .single();

    if (error) {
      console.error('Error al obtener reseña y diagnóstico:', error.message);
      alert('No se pudo obtener la reseña y diagnóstico.');
      return;
    }

    const resena = data.resena_especialista || 'Sin reseña';
    const diagnostico = data.diagnostico || 'Sin diagnóstico cargado.';

    Swal.fire({
      title: 'Reseña y Diagnóstico',
      html: `<strong>Reseña:</strong> ${resena}<br><strong>Diagnóstico:</strong> ${diagnostico}`,
      icon: 'info'
    });  
  }

}
