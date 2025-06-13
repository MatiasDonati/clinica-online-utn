import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtrarTurnos',
  standalone: true
})
export class FiltrarTurnosPipe implements PipeTransform {
  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const texto = filtro.toLowerCase();
    return turnos.filter(turno =>
      turno.especialidad?.toLowerCase().includes(texto) ||
      turno.especialista_email?.toLowerCase().includes(texto)
    );
  }
}
