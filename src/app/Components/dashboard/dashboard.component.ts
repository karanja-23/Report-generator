import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginService } from '../../Services/login.service';
import { ProjectViewService } from '../../Services/project-view.service';
@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = true
  constructor( 
    public loginService: LoginService,
    public projectViewService: ProjectViewService
  ) { }

  ngOnInit(): void {
    this.isLoggedIn = this.loginService.isLoggedIn
    
   }
   ngOnDestroy(): void {
     
   }
}
