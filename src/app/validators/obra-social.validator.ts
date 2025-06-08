import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function obraSocialValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();

    if (!valor) return null;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 ]{2,}$/;

    if (!regex.test(valor)) {
      return {
        obraSocialInvalida: 'Debe tener al menos 2 caracteres. Solo letras, números y espacios.'
      };
    }

    return null;
  };
}
