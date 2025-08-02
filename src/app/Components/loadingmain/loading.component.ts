import { Component, OnDestroy, OnInit } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProjectViewService } from '../../Services/project-view.service';
@Component({
  selector: 'app-loading',
  imports: [ProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent implements OnInit,OnDestroy {

  constructor(public projectViewService: ProjectViewService) { }

  ngOnInit(): void {
    this.projectViewService.setView(true);
  }

  ngOnDestroy(): void {
    this.projectViewService.setView(false);
  }
}
