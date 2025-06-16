import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor() { }
  url =` http://127.0.0.1:5000/`;

  async getProjects(){
    const response = await fetch(this.url + 'projects');
    const data = await response.json();
    return data;
  }
  async getProjectById(id: number){
    const response = await fetch(this.url + 'get/project/' + id);
    const data = await response.json();
    return data;
  }
  async getCategories(){
    const response = await fetch(this.url + 'get/categories');
    const data = await response.json();
    return data;
  }
}
