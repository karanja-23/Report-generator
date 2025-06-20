import { TestBed } from '@angular/core/testing';

import { ProjectViewService } from './project-view.service';

describe('ProjectViewService', () => {
  let service: ProjectViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
