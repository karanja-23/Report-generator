import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectViewService } from './Services/project-view.service';
import { LoginService } from './Services/login.service';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Router, NavigationEnd } from '@angular/router';
import { LoadingComponent } from './Components/loadingmain/loading.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule, ToastModule, LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  menuIsOpen: boolean = true;
  toggleIcon: string = 'pi pi-circle-on';
  menuIsLocked: boolean = true;
  left: string = '220px';
  justUnpinned: boolean = false;
  expandedReport: boolean = false;
  isLoggedIn: boolean = false;
  loading = true;
  authInitialized = false;

  constructor(
    public loginService: LoginService,
    public projectViewService: ProjectViewService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeAuth();
    this.watchRouteChanges();
  }

  private watchRouteChanges(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const isAuthPage = event.url === '/login';
        this.projectViewService.setRenderingAuthpage(isAuthPage);
      });
  }

  async initializeAuth() {
    this.loading = true;
    
    try {
      const token = this.loginService.getToken();
      
      if (!token) {
        // No token - only redirect to login if not already there
        this.handleUnauthenticated();
      } else {
        // Token exists - verify it's valid
        await this.confirmLogin();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.handleUnauthenticated();
    } finally {
      this.loading = false;
      this.authInitialized = true;
    }
  }

  async confirmLogin() {
    try {
      const stored = localStorage.getItem('token');
      if (stored && stored !== 'undefined') {
        const parsed = JSON.parse(stored);
        const accessToken = parsed?.['access_token'];
        
        if (accessToken) {
          const user = await this.loginService.getProtectedUser(accessToken);
          const isAuthenticated = !!user?.email;
          
          this.setAuthState(isAuthenticated);
          
          if (isAuthenticated) {
            // User is authenticated - stay on current page
            // No navigation needed, just maintain auth state
            console.log('User authenticated, staying on current page');
          } else {
            // Token is invalid/expired
            this.handleInvalidAuth();
          }
        } else {
          // No access token in stored data
          this.handleInvalidAuth();
        }
      } else {
        // No valid stored token
        this.handleInvalidAuth();
      }
    } catch (err) {
      console.error('Auth check failed', err);
      // Network error or other issue - treat as invalid auth
      this.handleInvalidAuth();
    }
  }

  private setAuthState(isLoggedIn: boolean) {
    this.isLoggedIn = isLoggedIn;
    this.loginService.setIsLoggedIn(isLoggedIn);
  }

  private handleUnauthenticated() {
    this.setAuthState(false);
    const currentUrl = this.router.url;
    
    // Only redirect to login if not already there
    if (currentUrl !== '/login') {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: currentUrl } 
      });
    }
  }

  private handleInvalidAuth() {
    this.setAuthState(false);
    localStorage.removeItem('token');
    
    const currentUrl = this.router.url;
    // Only redirect to login if not already there, and store return URL
    if (currentUrl !== '/login') {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: currentUrl } 
      });
    }
  }

  // Show app content after auth is initialized
  get shouldShowApp(): boolean {
    return this.authInitialized && !this.loading;
  }

  shouldHideMenu(): boolean {
    // Don't show menu until auth is initialized
    if (!this.authInitialized || this.loading) {
      return true;
    }
    
    const currentUrl = this.router.url;
    const isAuthPage = currentUrl === '/login' || currentUrl === '/register';
    
    return this.projectViewService.expandReport || 
           this.projectViewService.isRenderingAuthpage ||
           isAuthPage || 
           !this.isLoggedIn;
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
    } else {
      this.menuIsLocked = true;
      this.menuIsOpen = true;
      this.left = '220px';
      this.toggleIcon = 'pi pi-circle-on';
    }
  }

  closeMenu() {
    if (this.justUnpinned || this.menuIsLocked) {
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

  disableMenu() {
    this.expandedReport = this.projectViewService.expandReport;
  }

  logout() {
    this.loginService.logout();
    this.setAuthState(false);
    this.router.navigate(['/login']);
  }
}