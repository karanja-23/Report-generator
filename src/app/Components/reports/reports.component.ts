import { Component, OnInit } from '@angular/core';
import { ReportsService } from '../../Services/reports.service';
import { Projects } from '../../Interfaces/projects';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
@Component({
  selector: 'app-reports',
  imports: [TableModule, CommonModule,FormsModule,RouterModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  projects: Projects[] = [];
  filteredProjects: Projects[] = [];
  searchTerm:string = '';
  constructor(
    private router: Router,
    public reportsService: ReportsService
  ){}

  async ngOnInit(){
    this.projects = await this.reportsService.getProjects();
    this.filteredProjects = this.projects;
  }
  searchProjects(searchValue: string) {
    if (!searchValue || searchValue.trim() === '') {
      this.filteredProjects = this.projects;
    } else {
      this.filteredProjects = this.projects.filter(project => 
        project.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        project.description.toLowerCase().includes(searchValue.toLowerCase()) ||
        project.created_date.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
  }
  onClickReport(reportId: number){
    this.router.navigate(['reports', reportId]);
  }
}
