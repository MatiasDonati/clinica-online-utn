import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appTipoUsuarioBorde]',
  standalone: true
})
export class TipoUsuarioBordeDirective implements OnChanges {

  @Input('appTipoUsuarioBorde') tipo: string = '';

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.aplicarBorde();
  }

  aplicarBorde() {
    const element = this.el.nativeElement;

    let color = '';

    switch (this.tipo.toLowerCase()) {
      case 'admin':
        // dorado
        color = '#FFD700'; 
        break;
      case 'especialista':
        // violeta
        color = '#8A2BE2'; 
        break;
      case 'paciente':
        // celeste
        color = '#00BFFF'; 
        break;
    }

    element.style.border = `3px solid ${color}`;
    element.style.borderRadius = '50%';
  }
}
