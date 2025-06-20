import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { UsuariosListaComponent } from './usuarios-lista/usuarios-lista.component';
import { UsuariosCrearComponent } from './usuarios-crear/usuarios-crear.component';
import { UsuariosHistoriasClinicasComponent } from "./usuarios-historias-clinicas/usuarios-historias-clinicas.component";

// import * as XLSX from 'xlsx';
// import * as FileSaver from 'file-saver';


@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, HeaderComponent, UsuariosListaComponent, UsuariosCrearComponent, UsuariosHistoriasClinicasComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})

export class UsuariosComponent {

  vistaActual: 'listado' | 'crear' | 'historias' = 'listado';

}
