import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtrarTurnosEspecialista',
  standalone: true
})
export class FiltrarTurnosEspecialistaPipe implements PipeTransform {
  transform(turnos: any[], filtro: string): any[] {
    if (!filtro) return turnos;

    const texto = filtro.toLowerCase();

    return turnos.filter(turno => {
       // puede que no haya
      const historia = turno.historias_clinicas?.[0];

      // filtros base
      const matchBase =
        turno.especialidad?.toLowerCase().includes(texto) ||
        turno.paciente_email?.toLowerCase().includes(texto);

      // historia clinica fija
      const matchHistoriaFija = historia && (
        historia.altura?.toString().toLowerCase().includes(texto) ||
        historia.peso?.toString().toLowerCase().includes(texto) ||
        historia.temperatura?.toString().toLowerCase().includes(texto) ||
        historia.presion?.toLowerCase().includes(texto)
      );

      // historia clinica dinamica
      const matchDinamico = historia?.datos_dinamicos && Object.entries(historia.datos_dinamicos)
        .some(([clave, valor]) =>
          clave.toLowerCase().includes(texto) ||
          String(valor).toLowerCase().includes(texto)
        );

      return matchBase || matchHistoriaFija || matchDinamico;
    });
  }
}
