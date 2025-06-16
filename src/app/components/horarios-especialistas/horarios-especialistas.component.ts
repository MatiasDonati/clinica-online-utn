import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TurnosService } from '../../services/turnos.service';
import { NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-horarios-especialistas',
  standalone: true,
  imports: [NgFor, FormsModule, TitleCasePipe],
  templateUrl: './horarios-especialistas.component.html',
  styleUrl: './horarios-especialistas.component.css'
})
export class HorariosEspecialistasComponent {

  horariosActuales: any[] = [];
  userEmail: string | null = null;

  nuevoDia: string = '';
  nuevoDesde: string = '';
  nuevoHasta: string = '';

  diasSemanaValidos = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  constructor(private authService: AuthService, private turnosService: TurnosService) {}

  async ngOnInit() {
    try {
      this.userEmail = await this.authService.obtenerUsuarioActual();
      if (this.userEmail) {
        this.horariosActuales = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  }

  async agregarHorario() {
    console.log('entro a agregarHorario');

    if (!this.nuevoDia || !this.nuevoDesde || !this.nuevoHasta) {
      console.log('Faltan campos');
      await Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Completá todos los campos para agregar un horario.' });
      return;
    }

    const minutosValidos = ['00', '30'];
    const desdeMin = this.nuevoDesde.split(':')[1];
    const hastaMin = this.nuevoHasta.split(':')[1];
    if (!minutosValidos.includes(desdeMin) || !minutosValidos.includes(hastaMin)) {
      console.log('Minutos inválidos');
      await Swal.fire({ icon: 'warning', title: 'Minutos inválidos', text: 'Los minutos deben ser :00 o :30.' });
      return;
    }

    const desde = parseInt(this.nuevoDesde.replace(':', ''));
    const hasta = parseInt(this.nuevoHasta.replace(':', ''));

    const limiteInicio = 800;
    const limiteFin = this.nuevoDia === 'sábado' ? 1400 : 1900;

    if (desde < limiteInicio || hasta > limiteFin) {
      console.log('horario fuera de rango');
      await Swal.fire({
        icon: 'warning',
        title: 'Horario fuera de rango',
        text: `El horario debe estar entre ${this.nuevoDia === 'sábado' ? '08:00 y 14:00' : '08:00 y 19:00'}.`
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Agregar horario?',
      html: `
        <p>Vas a agregar el siguiente horario:</p>
        <p><strong>${this.nuevoDia}</strong> de <strong>${this.nuevoDesde}</strong> a <strong>${this.nuevoHasta}</strong>.</p>
        <p>¿Deseás continuar?</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await this.turnosService.agregarHorarioEspecialista(this.userEmail!, this.nuevoDia, this.nuevoDesde, this.nuevoHasta);
      this.horariosActuales = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);

      await Swal.fire({
        icon: 'success',
        title: 'Horario agregado',
        text: `Se agregó el horario para ${this.nuevoDia} de ${this.nuevoDesde} a ${this.nuevoHasta}.`
      });

      this.nuevoDia = '';
      this.nuevoDesde = '';
      this.nuevoHasta = '';
    } catch (error) {
      console.error('Error al agregar horario:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo agregar el horario. Intentá nuevamente.'
      });
    }
  }

  async eliminarHorario(id: number) {
    try {
      const confirmacion = await Swal.fire({
        icon: 'question',
        title: '¿Eliminar horario?',
        text: '¿Estás seguro de que querés eliminar este horario?',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmacion.isConfirmed) return;

      await this.turnosService.eliminarHorario(id);
      this.horariosActuales = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);

      await Swal.fire({
        icon: 'success',
        title: 'Horario eliminado',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo eliminar el horario.'
      });
    }
  }
}
