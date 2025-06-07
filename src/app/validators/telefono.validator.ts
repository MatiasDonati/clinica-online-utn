import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function telefonoValidoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value?.toString().trim();

    if (!valor) return null;

    const regex = /^[0-9]{8,10}$/;

    if (!regex.test(valor)) {
      return { telefonoInvalido: 'Debe tener entre 8 y 10 dígitos numéricos' };
    }

    return null;
  };
}
