import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '../../../services/usuarios.service';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-usuarios-historias-clinicas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-historias-clinicas.component.html',
  styleUrls: ['./usuarios-historias-clinicas.component.css']
})
export class UsuariosHistoriasClinicasComponent implements OnInit {

  historiasOriginales: any[] = [];
  historiasFiltradas = signal<any[]>([]);
  objectKeys = Object.keys;
  cargando = true;

  pacientes: string[] = [];
  especialistas: string[] = [];

  pacienteSeleccionado: string = '';
  especialistaSeleccionado: string = '';

  // Cache de nombres
  nombres: { [mail: string]: string } = {};

  constructor(private usuariosService: UsuariosService) {}

  async ngOnInit() {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .select('*')
      .order('fecha', { ascending: false });

    if (error) {
      console.error('Error al obtener historias clínicas:', error.message);
    } else {
      this.historiasOriginales = data || [];
      this.historiasFiltradas.set(this.historiasOriginales);

      // extraer pacientes y especialistas unicos
      const pacientesSet = new Set<string>();
      const especialistasSet = new Set<string>();

      for (const h of this.historiasOriginales) {
        pacientesSet.add(h.paciente_email);
        especialistasSet.add(h.especialista_email);

        // Pre-cargar nombres
        this.obtenerNombre(h.paciente_email);
        this.obtenerNombre(h.especialista_email);
      }

      this.pacientes = Array.from(pacientesSet).sort();
      this.especialistas = Array.from(especialistasSet).sort();
    }

    this.cargando = false;
  }

  aplicarFiltros(origen: 'paciente' | 'especialista') {
    if (origen === 'paciente') {
      this.especialistaSeleccionado = '';
    }

    if (origen === 'especialista') {
      this.pacienteSeleccionado = '';
    }

    this.historiasFiltradas.set(
      this.historiasOriginales.filter(h =>
        (!this.pacienteSeleccionado || h.paciente_email === this.pacienteSeleccionado) &&
        (!this.especialistaSeleccionado || h.especialista_email === this.especialistaSeleccionado)
      )
    );
  }

  limpiarFiltros() {
    this.pacienteSeleccionado = '';
    this.especialistaSeleccionado = '';
    this.historiasFiltradas.set(this.historiasOriginales);
  }

  // nombre y apellido usando UsuariosService
  async obtenerNombre(mail: string) {
    if (!this.nombres[mail]) {
      const datos = await this.usuariosService.obtenerNombreApellidoPorMail(mail);
      if (datos) {
        this.nombres[mail] = `${datos.nombre} ${datos.apellido}`;
      } else {
        this.nombres[mail] = 'Sin nombre';
      }
    }
    return this.nombres[mail];
  }

}
