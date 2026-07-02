import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="sidebar">
      <div class="sidebar-logo">Dashboard</div>
      <a routerLink="/dashboard" routerLinkActive="active">Overview</a>
      <a routerLink="/users" routerLinkActive="active">Users</a>
      <a routerLink="/settings" routerLinkActive="active">Settings</a>
    </nav>
  `,
  styles: [`
    .sidebar { width: 220px; background: #1e293b; color: #cbd5e1; min-height: 100vh; padding: 24px 0; display: flex; flex-direction: column; }
    .sidebar-logo { font-size: 1.2rem; font-weight: 700; color: #fff; padding: 0 24px 24px; border-bottom: 1px solid #334155; margin-bottom: 16px; }
    a { color: #94a3b8; text-decoration: none; padding: 10px 24px; display: block; }
    a:hover, a.active { color: #fff; background: #334155; }
  `],
})
export class NavbarComponent {}
