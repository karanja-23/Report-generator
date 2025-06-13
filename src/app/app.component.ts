import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule,RouterLink,RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  
  menuIsOpen: boolean = true;
  toggleIcon: string = 'pi pi-circle-on';
  menuIsLocked: boolean = true;
  left: string = '220px';
  justUnpinned: boolean = false;

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

}
