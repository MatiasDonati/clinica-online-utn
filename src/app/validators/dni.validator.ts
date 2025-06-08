import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.toString().trim();

    if (!valor) return null;

    const dniRegex = /^\d{7,8}$/;

    if (!dniRegex.test(valor)) {
      return { dniInvalido: 'El DNI debe tener entre 7 y 8 números, sin letras ni puntos.' };
    }

    return null;
  };
}
