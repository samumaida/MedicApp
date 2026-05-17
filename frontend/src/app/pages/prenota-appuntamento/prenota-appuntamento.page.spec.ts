import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrenotaAppuntamentoPage } from './prenota-appuntamento.page';

describe('PrenotaAppuntamentoPage', () => {
  let component: PrenotaAppuntamentoPage;
  let fixture: ComponentFixture<PrenotaAppuntamentoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PrenotaAppuntamentoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
