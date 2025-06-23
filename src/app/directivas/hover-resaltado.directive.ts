import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';

@Directive({
  selector: '[appHoverResaltado]',
  standalone: true
})
export class HoverResaltadoDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    const cells = this.el.nativeElement.querySelectorAll('td');
    const especialistaCell = cells[3]; 

    if (especialistaCell) {
      this.renderer.setStyle(especialistaCell, 'textDecoration', 'underline');
      this.renderer.setStyle(especialistaCell, 'textDecorationColor', '#8a2be2');
      this.renderer.setStyle(especialistaCell, 'textDecorationThickness', '2px');
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    const cells = this.el.nativeElement.querySelectorAll('td');
    const especialistaCell = cells[3];

    if (especialistaCell) {
      this.renderer.removeStyle(especialistaCell, 'textDecoration');
      this.renderer.removeStyle(especialistaCell, 'textDecorationColor');
      this.renderer.removeStyle(especialistaCell, 'textDecorationThickness');
    }
  }
}
