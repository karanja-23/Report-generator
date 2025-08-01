import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  url= 'http://127.0.0.1:6060'
  constructor() { }
  isLoggedIn: boolean = false;
  loggedUser: any = null
  setIsLoggedIn(value: boolean){
    this.isLoggedIn = value
    return this.isLoggedIn
  }
  async login(email: string, password: string){
    const response = await fetch(this.url + '/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, password})      
    })
    .then(res => res.json());
    return response;
  }
  async getProtectedUser(token: string){
    const response = await fetch(this.url + '/protected', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json());
    this.loggedUser = response
    return response;
    
  }
  getToken(): string | null {
    if (typeof window !== 'undefined' && localStorage !== undefined) {
      const stored = localStorage.getItem('token');
      if (stored && stored !== 'undefined') {
        try {
          const parsed = JSON.parse(stored);
         return parsed['access_token'] ?? null;
        } catch {
          return null;
        }
      }
    
    }
    return null;
    
  }
  
  checkLoggedIn(): boolean {
    return !!this.getToken();
  }
  async logout() {
    localStorage.removeItem('token');
    this.isLoggedIn = false;
  }
}
