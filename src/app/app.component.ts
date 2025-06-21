// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  group
} from '@angular/animations';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('routeAnimations', [
      transition('HomePage => LoginPage, HomePage => RegisterPage', slideTo('left')),
      transition('LoginPage => HomePage, RegisterPage => HomePage', slideTo('right')),

      // transición entre login y register
      transition('LoginPage <=> RegisterPage', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' }), { optional: true }),
        group([
          query(':leave', [
            animate('1200ms ease-in-out', style({ opacity: 0, transform: 'scale(0.9)' }))
          ], { optional: true }),
          query(':enter', [
            style({ opacity: 0, transform: 'scale(1.05)' }),
            animate('1200ms ease-in-out', style({ opacity: 1, transform: 'scale(1)' }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class AppComponent {
  title = 'clinica-online-utn';

  getAnimationData(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}

function slideTo(direction: 'left' | 'right') {
  return [
    query(':enter, :leave', style({ position: 'fixed', width: '100%' }), {
      optional: true
    }),
    group([
      query(':leave', [
        animate('750ms ease-out', style({ transform: `translateX(${direction === 'left' ? '-100%' : '100%'})` }))
      ], { optional: true }),
      query(':enter', [
        style({ transform: `translateX(${direction === 'left' ? '100%' : '-100%'})` }),
        animate('750ms ease-out', style({ transform: 'translateX(0%)' }))
      ], { optional: true })
    ])
  ];
}
