import { TestBed } from '@angular/core/testing';

import { PrestazioniApiService } from './prestazioni-api.service';

describe('PrestazioniApiService', () => {
  let service: PrestazioniApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrestazioniApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
