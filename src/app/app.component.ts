import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProjectViewService } from './Services/project-view.service';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule,RouterLink,RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  
  menuIsOpen: boolean = false;
  toggleIcon: string = 'pi pi-circle-off';
  menuIsLocked: boolean = false;
  left: string = '80px';
  justUnpinned: boolean = false;
  expandedReport: boolean = false
  constructor(public projectViewService: ProjectViewService) { }
  ngOnInit(): void {
    this.expandedReport = this.projectViewService.expandReport
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

}
