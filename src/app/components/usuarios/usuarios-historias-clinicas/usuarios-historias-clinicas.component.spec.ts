import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosHistoriasClinicasComponent } from './usuarios-historias-clinicas.component';

describe('UsuariosHistoriasClinicasComponent', () => {
  let component: UsuariosHistoriasClinicasComponent;
  let fixture: ComponentFixture<UsuariosHistoriasClinicasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosHistoriasClinicasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsuariosHistoriasClinicasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
