import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearAdminComponent } from './crear-admin.component';

describe('CrearAdminComponent', () => {
  let component: CrearAdminComponent;
  let fixture: ComponentFixture<CrearAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
