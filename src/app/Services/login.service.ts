import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  url= 'http://127.0.0.1:6060'
  constructor() { }
  isLoggedIn: boolean = false
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
}
