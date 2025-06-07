import { Component, OnInit } from '@angular/core'; // <-- agregá OnInit
import { Router } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  userEmail: string | null = null;
  tipoUsuario: string | null = null;

  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    const email = await this.authService.obtenerUsuarioActual();
    console.log('EMAIL EN HOME', email);

    this.userEmail = email;

    if (email) {
      const tipo = await this.authService.obtenerTipoUsuario(email);
      console.log('TIPO EN HOME', tipo);

      this.tipoUsuario = tipo;

      if (tipo) {
        localStorage.setItem('tipoUsuario', tipo);
      }
    }
  }



  irA(ruta: string) {
    this.router.navigate([ruta]);
  }
}
