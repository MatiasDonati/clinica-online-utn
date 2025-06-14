import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appEstadoTurno]',
  standalone: true
})
export class EstadoTurnoDirective implements OnChanges {

  @Input('appEstadoTurno') estado: string = '';

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estado']) {
      this.aplicarColor();
    }
  }

  aplicarColor() {
    const estado = this.estado?.toLowerCase();

    // Primero, remover cualquier clase previa
    const element = this.el.nativeElement;
    this.renderer.removeClass(element, 'estado-pendiente');
    this.renderer.removeClass(element, 'estado-aceptado');
    this.renderer.removeClass(element, 'estado-realizado');
    this.renderer.removeClass(element, 'estado-cancelado');
    this.renderer.removeClass(element, 'estado-rechazado');

    if (estado) {
      this.renderer.addClass(element, `estado-${estado}`);
    }
  }

}
