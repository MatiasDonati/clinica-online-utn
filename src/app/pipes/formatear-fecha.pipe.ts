import { Pipe, PipeTransform } from '@angular/core';
import Moment from 'moment';

@Pipe({
  name: 'formatearFecha',
  standalone: true
})
export class FormatearFechaPipe implements PipeTransform {
  transform(value: string): string {
    return Moment(value).format('DD/MM/YYYY');
  }
}
