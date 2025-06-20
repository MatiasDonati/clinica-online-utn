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

  get diasDisponibles() {
    return this.diasSemanaValidos.filter(d => !this.horariosActuales.some(h => h.dia === d));
  }

  constructor(private authService: AuthService, private turnosService: TurnosService) {}

  async ngOnInit() {
    try {
      this.userEmail = await this.authService.obtenerUsuarioActual();
      if (this.userEmail) {
        const horarios = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail);
        this.horariosActuales = this.ordenarHorariosPorDia(horarios);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  }

  private validarHorario(dia: string, desde: string, hasta: string): string | null {
    if (!desde || !hasta) return 'Completá los campos desde y hasta.';

    const [hDesde, mDesde] = desde.split(':').map(Number);
    const [hHasta, mHasta] = hasta.split(':').map(Number);
    const minutosValidos = [0, 30];

    if (!minutosValidos.includes(mDesde) || !minutosValidos.includes(mHasta)) {
      return 'Los minutos deben ser :00 o :30.';
    }

    const desdeNum = hDesde * 100 + mDesde;
    const hastaNum = hHasta * 100 + mHasta;
    if (desdeNum >= hastaNum) return 'La hora de inicio debe ser menor que la hora de fin.';

    const limiteInicio = 800;
    const limiteFin = dia === 'sábado' ? 1400 : 1900;

    if (desdeNum < limiteInicio || hastaNum > limiteFin) {
      return `El horario debe estar entre ${dia === 'sábado' ? '08:00 y 14:00' : '08:00 y 19:00'}.`;
    }

    return null;
  }

  async agregarHorario() {
    const error = this.validarHorario(this.nuevoDia, this.nuevoDesde, this.nuevoHasta);
    if (error) {
      await Swal.fire({ icon: 'warning', title: 'Horario inválido', text: error });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Agregar horario?',
      html: `<p>Vas a agregar el siguiente horario:</p><p><strong>${this.nuevoDia}</strong> de <strong>${this.nuevoDesde}</strong> a <strong>${this.nuevoHasta}</strong>.</p><p>¿Deseás continuar?</p>`,
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await this.turnosService.agregarHorarioEspecialista(this.userEmail!, this.nuevoDia, this.nuevoDesde, this.nuevoHasta);
      const horarios = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);
      this.horariosActuales = this.ordenarHorariosPorDia(horarios);

      await Swal.fire({ icon: 'success', title: 'Horario agregado', text: `Se agregó el horario para ${this.nuevoDia} de ${this.nuevoDesde} a ${this.nuevoHasta}.` });

      this.nuevoDia = '';
      this.nuevoDesde = '';
      this.nuevoHasta = '';
    } catch (error) {
      console.error('Error al agregar horario:', error);
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el horario. Intentá nuevamente.' });
    }
  }

  async actualizarHorario(h: any) {
    const error = this.validarHorario(h.dia, h.desde, h.hasta);
    if (error) {
      await Swal.fire({ icon: 'warning', title: 'Horario inválido', text: error });
      return;
    }

    await this.turnosService.eliminarHorario(h.id);
    await this.turnosService.agregarHorarioEspecialista(this.userEmail!, h.dia, h.desde, h.hasta);
    const horarios = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);
    this.horariosActuales = this.ordenarHorariosPorDia(horarios);

    await Swal.fire({ icon: 'success', title: 'Horario actualizado', timer: 1000, showConfirmButton: false });
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
      const horarios = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);
      this.horariosActuales = this.ordenarHorariosPorDia(horarios);

      await Swal.fire({ icon: 'success', title: 'Horario eliminado', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error al eliminar horario:', error);
      await Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el horario.' });
    }
  }

  async eliminarDia(dia: string) {
    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Eliminar día completo?',
      text: `¿Querés eliminar el horario del día ${dia}?`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    const diaHorarios = this.horariosActuales.filter(h => h.dia === dia);
    for (let h of diaHorarios) {
      await this.turnosService.eliminarHorario(h.id);
    }

    const horarios = await this.turnosService.obtenerDisponibilidadPorEspecialista(this.userEmail!);
    this.horariosActuales = this.ordenarHorariosPorDia(horarios);

    Swal.fire({ icon: 'success', title: 'Día eliminado', timer: 1200, showConfirmButton: false });
  }

  private ordenarHorariosPorDia(horarios: any[]): any[] {
    return horarios.sort((a, b) => {
      return this.diasSemanaValidos.indexOf(a.dia) - this.diasSemanaValidos.indexOf(b.dia);
    });
  }
}
