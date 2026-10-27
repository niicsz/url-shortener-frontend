import { Component, input } from '@angular/core';

export type IconName = 'copy' | 'open' | 'close' | 'refresh' | 'check';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('copy') {
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5v-2a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
        }
        @case ('open') {
          <path d="M9.5 2.5h4v4" />
          <path d="M13.5 2.5 7.5 8.5" />
          <path d="M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" />
        }
        @case ('close') {
          <path d="m4 4 8 8M12 4l-8 8" />
        }
        @case ('refresh') {
          <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
          <path d="M13.5 2.5v3h-3" />
        }
        @case ('check') {
          <path d="m3.5 8.5 3 3 6-7" />
        }
      }
    </svg>
  `,
  styles: [`:host { display: inline-flex; flex: none; }`]
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(16);
}
