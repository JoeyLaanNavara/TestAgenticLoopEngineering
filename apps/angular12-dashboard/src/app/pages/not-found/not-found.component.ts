import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="not-found">
      <h1>404</h1>
      <p>Page not found.</p>
      <a routerLink="/dashboard">Go to Dashboard</a>
    </div>
  `,
})
export class NotFoundComponent {}
