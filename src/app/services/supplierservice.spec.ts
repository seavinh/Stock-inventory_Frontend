import { TestBed } from '@angular/core/testing';

import { Supplierservice } from './supplierservice';

describe('Supplierservice', () => {
  let service: Supplierservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Supplierservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
