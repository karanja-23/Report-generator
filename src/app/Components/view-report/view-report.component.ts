import { Component, OnInit } from '@angular/core';
import { RouterModule,ActivatedRoute } from '@angular/router';
import { ReportsService } from '../../Services/reports.service';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-report',
  imports: [DatePickerModule,FormsModule],
  templateUrl: './view-report.component.html',
  styleUrl: './view-report.component.css'
})
export class ViewReportComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private reportsService: ReportsService
  ) { }
  projectId: number = 0
  project: any
  date: any
  ngOnInit() {
    this.projectId = this.route.snapshot.params['id'];
    this.getProjectById(this.projectId);
    
   }
   async getProjectById(id: number){
    const response = await fetch(this.reportsService.url + 'get/project/' + id);
    const data = await response.json();
    this.project = data;  
    this.date = new Date(this.project.created_date); 
  }
  goBack(){
    window.history.back();
  }
}
