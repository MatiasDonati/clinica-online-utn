import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function edadValidaValidator(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;

    if (valor === null || valor === '') return null;

    if (isNaN(valor) || valor < min || valor > max) {
      return { edadFueraDeRango: `Debe tener entre ${min} y ${max} años` };
    }

    return null;
  };
}
