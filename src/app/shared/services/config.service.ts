import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface AppConfig {
  shortBaseUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);

  readonly shortBaseUrl = signal('');
  readonly shortDomain = signal('');

  async load(): Promise<void> {
    try {
      const config = await firstValueFrom(this.http.get<AppConfig>('/config.json'));
      this.apply(config.shortBaseUrl);
    } catch {
      this.apply(window.location.origin);
    }
  }

  private apply(baseUrl: string): void {
    const normalized = baseUrl.replace(/\/+$/, '');
    this.shortBaseUrl.set(normalized);
    this.shortDomain.set(normalized.replace(/^https?:\/\//, ''));
  }
}
