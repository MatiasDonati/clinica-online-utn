import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function edadMayorA16Validator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;

    if (valor === null || valor === '') return null;

    if (isNaN(valor) || valor < 16) {
      return { edadInvalida: 'La edad debe ser mayor o igual a 16 años' };
    }

    return null;
  };
}
