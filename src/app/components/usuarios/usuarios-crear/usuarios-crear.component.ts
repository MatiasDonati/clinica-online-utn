import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterComponent } from "../../register/register.component";

@Component({
  selector: 'app-usuarios-crear',
  standalone: true,
  imports: [CommonModule, RegisterComponent],
  templateUrl: './usuarios-crear.component.html',
  styleUrl: './usuarios-crear.component.css'
})

export class UsuariosCrearComponent  {
  
}
