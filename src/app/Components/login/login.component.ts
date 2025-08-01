import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../../Services/login.service';
import { ProjectViewService } from '../../Services/project-view.service';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../loadingmain/loading.component';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ToastModule,CommonModule,LoadingComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  standalone: true,
  providers: [MessageService]
})
export class LoginComponent implements OnInit, OnDestroy {
  form: FormGroup;
  isLoggedIn?: boolean;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  returnUrl: string = '/'; // Default return URL
  isRedirecting: boolean = false;
  constructor(
    public loginService: LoginService,
    public projectViewService: ProjectViewService,
    private formBuilder: FormBuilder,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute // Add ActivatedRoute to get query params
  ) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Set flag to hide menu on login page
    this.projectViewService.setRenderingAuthpage(true);
    
    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if already logged in
    this.isLoggedIn = this.loginService.isLoggedIn;
    if (this.isLoggedIn) {
      this.router.navigate([this.returnUrl]);
    }
  }

  ngOnDestroy(): void {
    // Reset flag when leaving login page
    this.projectViewService.setRenderingAuthpage(false);
  }

  async login() {
    if (this.form.invalid) {
      this.errorMessage = 'Please enter valid email and password';
      this.showError();
      return;
    }

    if (this.form.value.email.length === 0 || this.form.value.password.length === 0) {
      this.errorMessage = 'Please enter email and password';
      this.showError();
      return;
    }

    this.isLoading = true;
    
    try {
      const response = await this.loginService.login(this.form.value.email, this.form.value.password);
      
      if (response['access_token']) {
        localStorage.setItem('token', JSON.stringify(response));
        this.loginService.setIsLoggedIn(true);
        this.isLoggedIn = true;
        this .loginService.loggedUser = this.loginService.getProtectedUser(response['access_token']);
        this.successMessage = 'Login successful';
        this.showSuccess();
        
        this.form.reset();
        this.projectViewService.setRenderingAuthpage(false);
        this.isRedirecting = true;
        // Navigate to return URL or dashboard
        setTimeout(() => {
          this.isRedirecting = false;          
          this.router.navigate([this.returnUrl]);
        }, 5000);
      } else {
        this.handleLoginError(response['error'] || 'Login failed');
      }
    } catch (error) {
      this.handleLoginError('An error occurred during login');
    } finally {
      this.isLoading = false;
    }
  }

  private handleLoginError(errorMessage: string) {
    this.isLoggedIn = false;
    this.loginService.setIsLoggedIn(false);
    this.errorMessage = errorMessage;
    this.showError();
  }

  showSuccess() {
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: this.successMessage, 
      life: 5000 
    });
  }

  showError() {
    this.messageService.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: this.errorMessage, 
      life: 5000 
    });
  }
}