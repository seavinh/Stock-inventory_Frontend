import { TestBed } from '@angular/core/testing';

import { Saleservice } from './saleservice';

describe('Saleservice', () => {
  let service: Saleservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Saleservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
