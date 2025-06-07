import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function nombreApellidoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.trim();

    if (!valor) return null;

    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}$/;

    if (!regex.test(valor)) {
      return { nombreInvalido: 'Debe tener al menos 2 letras. Sin numeros ni espacios.' };
    }

    return null;
  };
}
