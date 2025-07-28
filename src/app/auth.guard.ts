import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginService } from './Services/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Check if user is logged in
    if (this.loginService.isLoggedIn) {
      return true;
    }
    
    // Check if there's a token that might still be valid
    const token = this.loginService.getToken();
    if (token) {
      // Let the app component handle token validation
      // Return true for now, the app component will redirect if token is invalid
      return true;
    }
    
    // No token at all - redirect to login
    return this.router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
}