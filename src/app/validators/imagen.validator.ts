export function esImagenValida(archivo: File | undefined): string | null {
  if (!archivo) return 'Debe seleccionar una imagen.';

  const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];

  if (!tiposPermitidos.includes(archivo.type)) {
    return 'Solo se permiten archivos JPG, PNG o PDF.';
  }

  return null;
}
