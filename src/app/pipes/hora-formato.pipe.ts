import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horaFormato',
  standalone: true
})
export class HoraFormatoPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return '';

    const [horaStr, minutoStr] = value.split(':');
    let hora = parseInt(horaStr, 10);
    const minuto = minutoStr.padStart(2, '0');

    const ampm = hora >= 12 ? 'pm' : 'am';
    hora = hora % 12;
    if (hora === 0) hora = 12;

    return `${hora}:${minuto}${ampm}`;
  }

}
