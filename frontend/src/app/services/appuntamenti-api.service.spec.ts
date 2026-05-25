import { TestBed } from '@angular/core/testing';

import { AppuntamentiApiService } from './appuntamenti-api.service';

describe('AppuntamentiApiService', () => {
  let service: AppuntamentiApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppuntamentiApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
