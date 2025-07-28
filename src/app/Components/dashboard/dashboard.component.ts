import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginService } from '../../Services/login.service';
import { ProjectViewService } from '../../Services/project-view.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  isLoggedIn: boolean = true

  constructor( 
    public loginService: LoginService,
    public projectViewService: ProjectViewService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.projectViewService.setView(false);
  }
  
   
   
}
