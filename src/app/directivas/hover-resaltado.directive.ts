import { Directive, ElementRef, Renderer2, HostListener } from '@angular/core';
import { RendererStyleFlags2 } from '@angular/core';

@Directive({
  selector: '[appHoverResaltado]',
  standalone: true
})
export class HoverResaltadoDirective {

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', '#e0e0ff', RendererStyleFlags2.Important);
    this.renderer.setStyle(this.el.nativeElement, 'textDecoration', 'underline');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'all 0.2s ease');
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.removeStyle(this.el.nativeElement, 'backgroundColor');
    this.renderer.removeStyle(this.el.nativeElement, 'textDecoration');
  }
}
