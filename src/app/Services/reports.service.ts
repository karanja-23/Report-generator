import { Injectable } from '@angular/core';
import { CreateProject } from '../Interfaces/create-project';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor() { }

  myUrl = `http://127.0.0.1:6060/`

  async getProjects(){
    const response = await fetch(this.myUrl + 'projects');
    const data = await response.json();
    return data;
  }
  async getProjectById(id: number){
    const response = await fetch(this.myUrl + 'project/' + id);
    const data = await response.json();
    return data;
  }
  async getCategories(){
    const response = await fetch(this.myUrl + 'categories');
    const data = await response.json();
    return data;
  }
  async createProject(project: CreateProject){  
    const response = await fetch(this.myUrl + 'projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)      
    })
    .then(res => res.json());
    return response['message'];
  }
  async editProject(project: {name: string, description: string}, id: number){
    const response = await fetch(this.myUrl + 'project/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)      
    })
    .then(res => res.json());
    return response['message'];
  }
  async getSeverities(){
    const response = await fetch(this.myUrl + 'severities');
    const data = await response.json();
    return data;
  }
  async postFinding(finding: any){
    const response = await fetch(this.myUrl + 'findings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(finding)      
    })
    .then(res => res.json());
    return response['message'];
  }
  async editProjectDetails(project: {name: string, description: JSON}, id: number){
    console.log('hi')
    const response = await fetch(this.myUrl + 'project/' + id, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)      
    })
    .then(res => res.json());
    
    return response['message'];
  }
  async deleteProject(id: number){
    const response = await fetch(this.myUrl + 'project/' + id, {
      method: 'DELETE'
    })
    .then(res => res.json());
    return response['message'];
  }
}
