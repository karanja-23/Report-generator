import { Component, OnInit } from '@angular/core';
import { RouterModule,ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../Services/reports.service';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectViewService } from '../../Services/project-view.service';

@Component({
  selector: 'app-view-report',
  imports: [DatePickerModule,FormsModule, CommonModule],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.css'
})
export class ViewReportComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private reportsService: ReportsService,
    public projectViewService: ProjectViewService
  ) { }
  projectId: number = 0
  project: any;
  date: any;
  expandReport: boolean = false
  findings: any = [];
  categories: any = [];
  high: number = 0;
  medium: number = 0;
  low: number = 0;
  critical: number = 0;
  async ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    await this.getProjectById(this.projectId);
    await this.getFindings();
    this.getCategories();
   }
   async getProjectById(id: number){
    const response = await fetch(this.reportsService.myUrl + 'get/project/' + id);
    const data = await response.json();
    this.project = data;  
    this.date = new Date(this.project.created_date); 
  }
  async getCategories(){
    this.categories = await this.reportsService.getCategories();
  }
  goBack(){
    
    if(this.expandReport){
      this.expandReport = this.projectViewService.toggleView();
    }
    window.history.back();
  }
  toggle(){
    this.expandReport = this.projectViewService.toggleView();
  }
  async getFindings(){
    this.findings = [];
    this.critical = 0;
    this.high = 0;
    this.medium = 0;
    this.low = 0;

    this.project.categories.forEach((category: any) => {

      category.findings.forEach((finding: any) => {
        
        
          if (finding.severity === 'Critical') {
            this.critical++;
          } else if (finding.severity === 'High') {
            this.high++;
          } else if (finding.severity === 'Medium') {
            this.medium++;
          } else if (finding.severity === 'Low') {
            this.low++;
          }
      
        this.findings.push(finding);

      })
     
    })
 
  }
  
}
