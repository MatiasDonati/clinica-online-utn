import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';

export function usuarioExisteValidator(authService: AuthService): AsyncValidatorFn {
  return async (control: AbstractControl): Promise<ValidationErrors | null> => {
    const email = control.value?.trim().toLowerCase();

    if (!email) return null;

    const existe = await authService.verificarUsuarioRegistrado(email);
    
    return existe ? null : { usuarioNoExiste: 'El email no está registrado' };
  };
}


