import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { TurnosService } from '../../services/turnos.service';
import { AuthService } from '../../services/auth.service';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mis-turnos',
  standalone: true,
  imports: [HeaderComponent, NgIf, NgFor, FormsModule],
  templateUrl: './mis-turnos.component.html',
  styleUrls: ['./mis-turnos.component.css']
})
export class MisTurnosComponent implements OnInit {

  turnos: any[] = [];
  userEmail: string | null = null;
  cargando = true;

  filtro: string = '';
  turnosFiltrados: any[] = [];

  constructor( private turnosService: TurnosService, private authService: AuthService ) {}

  async ngOnInit() {
    
    this.userEmail = await this.authService.obtenerUsuarioActual();
    if (this.userEmail) {
      this.turnos = await this.turnosService.obtenerTurnosDelPaciente(this.userEmail);
      this.turnosFiltrados = [...this.turnos];
    }
    this.cargando = false;
    // console.log(this.userEmail);
    // console.log(this.turnos);
  }

  aplicarFiltro() {
    
    const texto = this.filtro.toLowerCase();

    this.turnosFiltrados = this.turnos.filter(turno =>
      turno.especialidad.toLowerCase().includes(texto) ||
      turno.especialista_email.toLowerCase().includes(texto)
    );
  }


}
