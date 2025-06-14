import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtrarTurnosEspecialista',
  standalone: true
})
export class FiltrarTurnosEspecialistaPipe implements PipeTransform {
  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const texto = filtro.toLowerCase();
    return turnos.filter(turno =>
      turno.especialidad?.toLowerCase().includes(texto) ||
      turno.paciente_email?.toLowerCase().includes(texto)
    );
  }
}
