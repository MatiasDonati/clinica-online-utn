import { Component } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { HistoriaClinicaComponent } from "../historia-clinica/historia-clinica.component";

@Component({
  selector: 'app-pacientes',
  imports: [HeaderComponent, HistoriaClinicaComponent],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent {

}
