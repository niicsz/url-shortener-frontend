import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfigService } from './shared/services/config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="bar">
        <a class="brand" routerLink="/" aria-label="Encurtador, início">
          <svg class="mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <rect width="22" height="22" rx="6" fill="#141414" />
            <path d="M13.5 5.5 8.5 16.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" />
          </svg>
          <span class="name">Encurtador</span>
          <span class="scope mono">{{ config.shortDomain() }}</span>
        </a>
        <nav class="nav" aria-label="Principal">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Encurtar</a>
          <a routerLink="/painel" routerLinkActive="active">Painel</a>
        </nav>
      </div>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .topbar {
      background: var(--ground);
    }
    .bar {
      max-width: calc(var(--column) + 2 * var(--gutter));
      margin: 0 auto;
      padding: 0 var(--gutter);
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      border-radius: 6px;
    }
    .mark {
      flex: none;
    }
    .name {
      font-weight: 600;
      font-size: 15px;
    }
    .scope {
      color: var(--muted);
      font-size: var(--fs-small);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .nav {
      display: flex;
      gap: 4px;
    }
    .nav a {
      height: 32px;
      display: inline-flex;
      align-items: center;
      padding: 0 12px;
      border-radius: var(--radius-control);
      color: var(--muted);
      font-weight: 500;
      transition: background-color 120ms var(--ease), color 120ms var(--ease);
    }
    .nav a:hover {
      color: var(--text);
    }
    .nav a.active {
      background: var(--active);
      color: var(--text);
    }
    @media (max-width: 480px) {
      .scope {
        display: none;
      }
      .nav a {
        height: 44px;
      }
    }
  `]
})
export class AppComponent {
  protected readonly config = inject(ConfigService);
}
