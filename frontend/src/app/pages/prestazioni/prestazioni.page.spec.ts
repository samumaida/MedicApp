import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrestazioniPage } from './prestazioni.page';

describe('PrestazioniPage', () => {
  let component: PrestazioniPage;
  let fixture: ComponentFixture<PrestazioniPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrestazioniPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
