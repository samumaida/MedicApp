import { TestBed } from '@angular/core/testing';

import { Prestazioni } from './prestazioni';

describe('Prestazioni', () => {
  let service: Prestazioni;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Prestazioni);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
