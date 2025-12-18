import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  private router = inject(Router);

  navigateTo(route: string): void {
    this.router.navigate([route]).catch(err => {
    console.error('Navigation error:', err);
  });
  }

  isActive(route: string): boolean {
    return this.router.url === `/${route}`;
  }

  logout(): void {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    this.router.navigate(['/login']).catch(err => {
      console.error('Navigation error during logout:', err);
    });
  }
}