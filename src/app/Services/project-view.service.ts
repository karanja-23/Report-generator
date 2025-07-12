import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProjectViewService {

  constructor() { }
  expandReport: boolean = false;
  isRenderingAuthpage: boolean = false

  toggleView(){
    this.expandReport = !this.expandReport;
    return this.expandReport
  }
  setView(view: boolean): boolean {
    this.expandReport = view;
    return this.expandReport;
  }
  setRenderingAuthpage(view: boolean){
    this.isRenderingAuthpage = view;    
  }
}
  