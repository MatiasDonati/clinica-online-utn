import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HorariosEspecialistasComponent } from './horarios-especialistas.component';

describe('HorariosEspecialistasComponent', () => {
  let component: HorariosEspecialistasComponent;
  let fixture: ComponentFixture<HorariosEspecialistasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HorariosEspecialistasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HorariosEspecialistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
