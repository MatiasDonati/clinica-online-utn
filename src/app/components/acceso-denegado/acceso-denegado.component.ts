import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  imports: [],
  templateUrl: './acceso-denegado.component.html',
  styleUrl: './acceso-denegado.component.css'
})
export class AccesoDenegadoComponent {

  constructor(private router: Router) { }

  ngOnInit() {

    const tipo = localStorage.getItem('tipoUsuario');
    let ruta = "/";

    if (tipo && tipo !== 'admin') {
      setTimeout(() => {
        this.router.navigate([ruta]);
      }, 1500);
      return;
    }else{
      ruta = '/login';
    }


    setTimeout(() => {
      this.router.navigate([ruta]);
    }
    , 1500);

  }

}