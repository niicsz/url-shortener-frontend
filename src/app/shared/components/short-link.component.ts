import { Component, input } from '@angular/core';

@Component({
  selector: 'app-short-link',
  standalone: true,
  template: `<span class="mono">@if (domain()) {<span class="short-domain">{{ domain() }}</span>}<span class="short-domain">/</span><span class="short-slug" [class.pending]="pending()">{{ slug() }}</span></span>`,
  styles: [`
    :host { min-width: 0; }
    .mono { overflow-wrap: anywhere; }
    .pending { color: var(--faint); }
  `]
})
export class ShortLinkComponent {
  readonly domain = input.required<string>();
  readonly slug = input.required<string>();
  readonly pending = input(false);
}
