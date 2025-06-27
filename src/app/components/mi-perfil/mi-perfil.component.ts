import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { AuthService } from '../../services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { HorariosEspecialistasComponent } from '../horarios-especialistas/horarios-especialistas.component';
import { HistoriaClinicaComponent } from "../historia-clinica/historia-clinica.component";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, HeaderComponent, HorariosEspecialistasComponent, HistoriaClinicaComponent, FormsModule],
  templateUrl: './mi-perfil.component.html',
  styleUrls: ['./mi-perfil.component.css']
})
export class MiPerfilComponent implements OnInit {
  userEmail: string | null = null;
  tipoUsuario: string | null = null;
  nombre: string = '';
  apellido: string = '';
  imagenesPerfil: string[] = [];
  especialidades: string[] = [];
  imagenesCargando = true;

  dni: string = '';
  edad: number | null = null;
  obraSocial: string = '';

  mostrarHistoria = false;
  historiasClinicas: any[] = [];

  especialistasUnicos: { mail: string, nombreCompleto: string }[] = [];
  especialistaSeleccionado: string = '';


  @ViewChild('historiaClinicaRef') historiaClinicaElement!: ElementRef;

  constructor(private authService: AuthService, private usuariosService: UsuariosService
) {}

  async ngOnInit() {
    this.userEmail = await this.authService.obtenerUsuarioActual();

    if (this.userEmail) {
      const userData = await this.authService.obtenerDatosUsuario(this.userEmail);

      if (userData) {
        this.tipoUsuario = userData.tipo || '';
        this.nombre = userData.nombre || '';
        this.apellido = userData.apellido || '';
        this.imagenesPerfil = userData.imagenes || [];
        this.dni = userData.dni || '';
        this.edad = userData.edad || null;
        this.obraSocial = userData.obrasocial || '';

        if (this.tipoUsuario === 'especialista') {
          this.especialidades = await this.authService.obtenerEspecialidadesPorEmail(this.userEmail);
        }

        if (this.tipoUsuario === 'paciente') {
          await this.cargarHistoriaClinica();
        }
      }

      this.imagenesCargando = false;
    }
  }

  toggleHistoriaClinica() {
    this.mostrarHistoria = !this.mostrarHistoria;

    if (this.mostrarHistoria) {
      setTimeout(() => {
        this.historiaClinicaElement?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  async cargarHistoriaClinica() {
    if (this.userEmail) {
      const { data, error } = await this.authService.supabase
        .from('historias_clinicas')
        .select('*')
        .eq('paciente_email', this.userEmail);

      if (!error && data) {
        this.historiasClinicas = data;

        // extraer especialistas únicos
        const uniqueEmails = Array.from(new Set(data.map(h => h.especialista_email)));

        // obtener nombres completos
        const especialistas: { mail: string, nombreCompleto: string }[] = [];
        for (const email of uniqueEmails) {
          const nombre = await this.usuariosService.obtenerNombreApellidoPorMail(email);
          especialistas.push({
            mail: email,
            nombreCompleto: nombre ? `${nombre.nombre} ${nombre.apellido}` : email
          });
        }

        this.especialistasUnicos = especialistas;
      }
    }
  }


  async generarPDFHistoriaClinica(historiaClinica: any[], tituloExtra?: string) {
    const doc = new jsPDF();
    const logo = new Image();
    logo.src = '/header-img.png';
    const fecha = new Date();
    const fechaStr = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;

    logo.onload = () => {
      doc.addImage(logo, 'PNG', 10, 10, 30, 30);
      doc.setFontSize(18);

      const titulo = tituloExtra 
        ? `Historia Clínica con ${tituloExtra}`
        : 'Historia Clínica - Clínica Online Dr. Donati y Asociados';

      doc.text(titulo, 50, 20);
      doc.setFontSize(12);
      doc.text(`Fecha de emisión: ${fechaStr}`, 50, 30);
      doc.text(`Paciente: ${this.nombre} ${this.apellido}`, 10, 50);
      doc.text(`DNI: ${this.dni}`, 10, 58);
      doc.text(`Email: ${this.userEmail}`, 10, 66);
      doc.text(`Obra social: ${this.obraSocial}`, 10, 74);

      const tabla = historiaClinica.map(item => [
        item.fecha,
        item.especialista_email,
        `Altura: ${item.altura}, Peso: ${item.peso}, Temp: ${item.temperatura}°C, Presión: ${item.presion}`,
        Object.entries(item.datos_dinamicos || {}).map(([k, v]) => `${k}: ${v}`).join(', ')
      ]);

      autoTable(doc, {
        head: [['Fecha', 'Especialista', 'Datos básicos', 'Datos adicionales']],
        body: tabla,
        startY: 85,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [138, 43, 226] }
      });

      const filename = tituloExtra
        ? `historia_clinica_${this.apellido}_${tituloExtra}_${fechaStr}.pdf`
        : `historia_clinica_${this.apellido}_${fechaStr}.pdf`;

      doc.save(filename);
    };
  }


  async generarPDFHistoriaClinicaPorEspecialista() {
    if (!this.especialistaSeleccionado) return;

    const historiasFiltradas = this.historiasClinicas.filter(
      h => h.especialista_email === this.especialistaSeleccionado
    );

    const especialista = this.especialistasUnicos.find(
      e => e.mail === this.especialistaSeleccionado
    )?.nombreCompleto || this.especialistaSeleccionado;

    if (!historiasFiltradas.length) {
      alert('No hay historias clínicas con este especialista.');
      return;
    }

    this.generarPDFHistoriaClinica(historiasFiltradas, especialista);
  }

  get nombreEspecialistaSeleccionado(): string {
    const especialista = this.especialistasUnicos.find(e => e.mail === this.especialistaSeleccionado);
    return especialista ? especialista.nombreCompleto : 'Especialista';
  }


}
