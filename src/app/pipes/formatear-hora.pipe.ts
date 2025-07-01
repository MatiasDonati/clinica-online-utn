import { Pipe, PipeTransform } from '@angular/core';
import Moment from 'moment';

@Pipe({
  name: 'formatearHora',
  standalone: true
})
export class FormatearHoraPipe implements PipeTransform {
  transform(value: string): string {
    return Moment(value).format('HH:mm');
  }
}
