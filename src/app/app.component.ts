import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectViewService } from './Services/project-view.service';
import { LoginService } from './Services/login.service';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule,RouterLink,RouterLinkActive, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  form : FormGroup
  menuIsOpen: boolean = true;
  toggleIcon: string = 'pi pi-circle-on';
  menuIsLocked: boolean = true;
  left: string = '220px';
  justUnpinned: boolean = false;
  expandedReport: boolean = false
  isLoggedIn: boolean = false;
  
  constructor(
    public loginService: LoginService,
    public projectViewService: ProjectViewService,
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    this.expandedReport = this.projectViewService.expandReport
    this.isLoggedIn = this.loginService.isLoggedIn
  }
  toggleMenu() {
    if (this.menuIsLocked) {
      this.menuIsLocked = false;
      this.toggleIcon = 'pi pi-circle-off';
      this.menuIsOpen = false;
      this.left = '80px';
      this.justUnpinned = true;

      setTimeout(() => {
        this.justUnpinned = false;
      }, 100);
      
      return;
    }else{
      this.menuIsLocked = true;
      this.menuIsOpen = true;
      this.left = '220px';
      this.toggleIcon = 'pi pi-circle-on';
    }
  }
  closeMenu() {
    if (this.justUnpinned) {
      return;
    }
    if (this.menuIsLocked) {
      return;
    }
    this.menuIsLocked = false;
    this.menuIsOpen = false;
    this.left = '80px';
    this.toggleIcon = 'pi pi-circle-off';
  }
  mouseOver() {
    if (!this.menuIsLocked && !this.justUnpinned) {
      this.menuIsOpen = true;
    
    }
  }

  mouseOut() {
    if (!this.menuIsLocked) {
      this.menuIsOpen = false;
            
    }
  }
  disableMenu(){
    this.expandedReport = this.projectViewService.expandReport
  }
  async login(){
    
    const response = await this.loginService.login(this.form.value.email, this.form.value.password)
    console.log(response)
    localStorage.setItem('token', response.token)
    this.isLoggedIn = await this.loginService.setIsLoggedIn(true)
  }

}
