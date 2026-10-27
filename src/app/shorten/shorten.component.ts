import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UrlService } from '../shared/services/url.service';
import { RecentLinksService } from '../shared/services/recent-links.service';
import { ConfigService } from '../shared/services/config.service';
import { RecentLink } from '../shared/models/short-url.model';
import { IconComponent } from '../shared/components/icon.component';
import { ShortLinkComponent } from '../shared/components/short-link.component';

const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,50}$/;
const RECENT_LIMIT = 5;

@Component({
  selector: 'app-shorten',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, IconComponent, ShortLinkComponent],
  template: `
    <section class="page">
      <div class="title-row">
        <div>
          <h1>Encurtar link</h1>
          <p class="subline">
            @if (recent().length > 0) {
              {{ recent().length }} {{ recent().length === 1 ? 'link criado' : 'links criados' }} neste navegador
            } @else {
              Links curtos em <span class="mono">{{ config.shortDomain() }}</span>
            }
          </p>
        </div>
      </div>

      <div class="workbench">
        <form class="panel composer" (ngSubmit)="submit()" novalidate>
          <div class="panel-head">
            <h2>Novo link</h2>
          </div>

          <div class="field">
            <label for="long-url">Endereço longo</label>
            <input
              id="long-url"
              class="input"
              name="longUrl"
              type="url"
              inputmode="url"
              autocomplete="off"
              placeholder="https://exemplo.com/uma/pagina/com/endereco/comprido"
              [ngModel]="longUrl()"
              (ngModelChange)="longUrl.set($event)"
              [disabled]="loading()"
              [attr.aria-invalid]="urlError() ? 'true' : null"
              [attr.aria-describedby]="urlError() ? 'long-url-error' : null"
            />
            @if (urlError(); as message) {
              <span id="long-url-error" class="hint error">{{ message }}</span>
            }
          </div>

          <div class="field">
            <label for="alias">Palavra no link <span class="optional">opcional</span></label>
            <div class="joined" [class.invalid]="aliasError()">
              <span class="prefix mono" aria-hidden="true">{{ config.shortDomain() }}/</span>
              <input
                id="alias"
                class="input mono"
                name="alias"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                maxlength="50"
                placeholder="minha-promo"
                [ngModel]="alias()"
                (ngModelChange)="alias.set($event)"
                [disabled]="loading()"
                [attr.aria-invalid]="aliasError() ? 'true' : null"
                aria-describedby="alias-hint"
              />
            </div>
            <span id="alias-hint" class="hint" [class.error]="aliasError()">
              {{ aliasError() ?? '3 a 50 caracteres: letras sem acento, números, - e _. Em branco, um código é gerado.' }}
            </span>
          </div>

          @if (requestError(); as message) {
            <div class="notice" role="alert">{{ message }}</div>
          }

          <div class="actions">
            <button type="submit" class="btn btn-primary" [disabled]="loading()">
              {{ loading() ? 'Encurtando…' : 'Encurtar' }}
            </button>
          </div>
        </form>

        <section class="panel result" aria-live="polite" aria-labelledby="result-title">
          <div class="panel-head">
            <h2 id="result-title">{{ result() ? 'Link pronto' : 'Seu link' }}</h2>
            @if (result()) {
              <span class="aside">agora</span>
            }
          </div>

          @if (result(); as current) {
            <a class="result-link" [href]="current.shortUrl" target="_blank" rel="noopener">
              <app-short-link [domain]="domainOf(current.shortUrl)" [slug]="current.shortCode" />
            </a>
            <p class="destination" [title]="current.longUrl">leva para {{ current.longUrl }}</p>
            <div class="result-actions">
              <button type="button" class="btn btn-primary" (click)="copy(current.shortUrl, current.shortCode)">
                <app-icon [name]="copiedCode() === current.shortCode ? 'check' : 'copy'" />
                {{ copiedCode() === current.shortCode ? 'Copiado' : 'Copiar link' }}
              </button>
              <a class="btn btn-secondary" [href]="current.shortUrl" target="_blank" rel="noopener">
                <app-icon name="open" />
                Abrir
              </a>
            </div>
          } @else {
            <p class="result-link preview">
              <app-short-link [domain]="config.shortDomain()" [slug]="previewSlug()" [pending]="!aliasIsUsable()" />
            </p>
            <p class="destination">
              {{ aliasIsUsable() ? 'É assim que o link vai ficar.' : 'Sem palavra, o link recebe um código de 7 caracteres.' }}
            </p>
            @if (recent()[0]; as last) {
              <div class="last">
                <span class="last-label">Último criado {{ last.createdAt | date: 'dd/MM/yyyy, HH:mm' }}</span>
                <a class="last-link" [href]="last.shortUrl" target="_blank" rel="noopener">
                  <app-short-link [domain]="domainOf(last.shortUrl)" [slug]="last.shortCode" />
                </a>
                <span class="destination" [title]="last.longUrl">leva para {{ last.longUrl }}</span>
              </div>
              <div class="result-actions">
                <button type="button" class="btn btn-secondary" (click)="copy(last.shortUrl, last.shortCode)">
                  <app-icon [name]="copiedCode() === last.shortCode ? 'check' : 'copy'" />
                  {{ copiedCode() === last.shortCode ? 'Copiado' : 'Copiar' }}
                </button>
                <a class="btn btn-secondary" [href]="last.shortUrl" target="_blank" rel="noopener">
                  <app-icon name="open" />
                  Abrir
                </a>
              </div>
            } @else {
              <dl class="facts">
                <div>
                  <dt>Fica salvo</dt>
                  <dd>neste navegador, na lista de recentes</dd>
                </div>
                <div>
                  <dt>Cliques</dt>
                  <dd>contados a cada acesso, no <a class="link-action" routerLink="/painel">Painel</a></dd>
                </div>
                <div>
                  <dt>Palavra em uso</dt>
                  <dd>avisamos antes de criar, sem trocar o link de ninguém</dd>
                </div>
              </dl>
            }
          }
        </section>
      </div>

      <section class="panel recent" aria-labelledby="recent-title">
        <div class="panel-head">
          <h2 id="recent-title">Recentes</h2>
          @if (recent().length > 0) {
            <a class="link-action" routerLink="/painel">Ver cliques de {{ recent().length === 1 ? '1 link' : 'todos os ' + recent().length }}</a>
          }
        </div>

        @if (recent().length === 0) {
          <p class="empty">Nenhum link criado neste navegador ainda. O primeiro aparece aqui.</p>
        } @else {
          <table>
            <thead>
              <tr>
                <th scope="col">Link</th>
                <th scope="col" class="col-dest">Destino</th>
                <th scope="col" class="num col-date">Criado</th>
                <th scope="col" class="col-actions"><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              @for (link of visibleRecent(); track link.shortCode) {
                <tr>
                  <td class="col-link">
                    <a [href]="link.shortUrl" target="_blank" rel="noopener">
                      <app-short-link [domain]="foreignDomain(link.shortUrl)" [slug]="link.shortCode" />
                    </a>
                    <span class="sub">{{ link.longUrl }}</span>
                  </td>
                  <td class="col-dest"><span class="truncate" [title]="link.longUrl">{{ link.longUrl }}</span></td>
                  <td class="num col-date">{{ link.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td class="col-actions">
                    <button type="button" class="icon-btn" (click)="copy(link.shortUrl, link.shortCode)" [attr.aria-label]="'Copiar ' + link.shortCode">
                      <app-icon [name]="copiedCode() === link.shortCode ? 'check' : 'copy'" />
                    </button>
                    <button type="button" class="icon-btn" (click)="remove(link.shortCode)" [attr.aria-label]="'Tirar ' + link.shortCode + ' da lista'">
                      <app-icon name="close" />
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          @if (recent().length > visibleRecent().length) {
            <p class="more">Mostrando {{ visibleRecent().length }} de {{ recent().length }}. <a class="link-action" routerLink="/painel">Ver todos no painel</a></p>
          }
        }
      </section>
    </section>
  `,
  styles: [`
    .workbench {
      display: grid;
      grid-template-columns: 7fr 5fr;
      gap: var(--gap);
      margin-bottom: var(--gap);
    }
    .composer {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .composer .panel-head {
      margin-bottom: 0;
    }
    .optional {
      color: var(--muted);
      font-weight: 400;
      margin-left: 4px;
    }
    .joined {
      display: flex;
      align-items: stretch;
    }
    .prefix {
      flex: none;
      display: inline-flex;
      align-items: center;
      padding: 0 10px 0 12px;
      background: var(--raised);
      border: 1px solid var(--control);
      border-right: 0;
      border-radius: var(--radius-control) 0 0 var(--radius-control);
      color: var(--muted);
      font-size: 13px;
      white-space: nowrap;
      max-width: 55%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .joined .input {
      border-radius: 0 var(--radius-control) var(--radius-control) 0;
      min-width: 0;
    }
    .joined.invalid .prefix {
      border-color: var(--negative);
    }
    .actions {
      display: flex;
    }
    .result {
      display: flex;
      flex-direction: column;
    }
    .result-link {
      display: block;
      font-size: 22px;
      line-height: 30px;
      font-weight: 500;
      letter-spacing: -0.01em;
      border-radius: 4px;
    }
    a.result-link:hover {
      text-decoration: underline;
      text-decoration-color: var(--control);
      text-underline-offset: 6px;
    }
    .destination {
      margin-top: 8px;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .facts {
      margin: auto 0 0;
      padding-top: 20px;
      border-top: 1px solid var(--rule);
    }
    .facts div {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      gap: 12px;
      padding: 6px 0;
    }
    .facts dt {
      color: var(--muted);
    }
    .facts dd {
      margin: 0;
    }
    .last {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--rule);
    }
    .last-label {
      color: var(--muted);
      font-size: var(--fs-small);
    }
    .last-link {
      font-size: 16px;
      line-height: 24px;
      border-radius: 4px;
    }
    .last .destination {
      margin-top: 0;
    }
    .result-actions {
      display: flex;
      gap: 8px;
      margin-top: auto;
      padding-top: 24px;
    }
    .recent .panel-head {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th {
      height: 36px;
      text-align: left;
      font-weight: 400;
      font-size: var(--fs-small);
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    td {
      height: var(--row-height);
      border-bottom: 1px solid var(--rule);
      vertical-align: middle;
    }
    tbody tr:last-child td {
      border-bottom: 0;
    }
    th.num,
    td.num {
      text-align: right;
    }
    .col-link {
      width: 40%;
      padding-right: 16px;
    }
    .col-link a {
      font-size: 15px;
    }
    .col-link a:hover {
      text-decoration: underline;
      text-decoration-color: var(--control);
      text-underline-offset: 4px;
    }
    .col-link .sub {
      display: none;
    }
    .col-dest {
      padding-right: 16px;
    }
    .truncate {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--muted);
    }
    .col-date {
      width: 148px;
      color: var(--muted);
    }
    .col-actions {
      width: 84px;
      text-align: right;
      white-space: nowrap;
    }
    .more {
      margin-top: 12px;
      color: var(--muted);
    }
    @media (max-width: 900px) {
      .workbench {
        grid-template-columns: 1fr;
      }
      .result-actions {
        padding-top: 20px;
      }
    }
    @media (max-width: 640px) {
      .result-link {
        font-size: 18px;
        line-height: 26px;
      }
      .result-actions .btn {
        flex: 1 1 0;
      }
      thead {
        display: none;
      }
      .col-dest,
      .col-date {
        display: none;
      }
      .col-link {
        width: auto;
        padding: 10px 8px 10px 0;
      }
      .col-link .sub {
        display: block;
        margin-top: 2px;
        font-size: var(--fs-small);
        line-height: 16px;
        color: var(--muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .col-actions {
        width: 72px;
      }
      .icon-btn {
        width: 36px;
        height: 44px;
      }
    }
  `]
})
export class ShortenComponent {
  private readonly urlService = inject(UrlService);
  private readonly recentLinks = inject(RecentLinksService);
  protected readonly config = inject(ConfigService);

  readonly longUrl = signal('');
  readonly alias = signal('');
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly requestError = signal<string | null>(null);
  readonly result = signal<RecentLink | null>(null);
  readonly recent = signal<RecentLink[]>(this.recentLinks.list());
  readonly copiedCode = signal<string | null>(null);

  readonly visibleRecent = computed(() => this.recent().slice(0, RECENT_LIMIT));
  readonly trimmedAlias = computed(() => this.alias().trim());
  readonly aliasIsUsable = computed(() => ALIAS_PATTERN.test(this.trimmedAlias()));
  readonly previewSlug = computed(() => (this.aliasIsUsable() ? this.trimmedAlias() : 'a1B2c3D'));

  readonly aliasError = computed(() => {
    const alias = this.trimmedAlias();
    if (!alias || ALIAS_PATTERN.test(alias)) {
      return null;
    }
    if (alias.length < 3) {
      return 'Use pelo menos 3 caracteres.';
    }
    return 'Só letras sem acento, números, - e _ (até 50).';
  });

  readonly urlError = computed(() =>
    this.submitted() && !this.longUrl().trim() ? 'Cole o endereço que você quer encurtar.' : null
  );

  submit(): void {
    this.submitted.set(true);
    this.requestError.set(null);
    const url = this.longUrl().trim();
    if (!url || this.aliasError()) {
      return;
    }
    this.loading.set(true);
    this.urlService.shorten(url, this.trimmedAlias() || undefined).subscribe({
      next: (response) => {
        const link: RecentLink = {
          shortCode: response.shortCode,
          shortUrl: response.shortUrl,
          longUrl: url,
          createdAt: new Date().toISOString()
        };
        this.result.set(link);
        this.recent.set(this.recentLinks.add(link));
        this.longUrl.set('');
        this.alias.set('');
        this.submitted.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.requestError.set(err?.error?.message ?? 'Não foi possível encurtar agora. Tente de novo em instantes.');
      }
    });
  }

  copy(value: string, code: string): void {
    navigator.clipboard.writeText(value).then(() => {
      this.copiedCode.set(code);
      setTimeout(() => {
        if (this.copiedCode() === code) {
          this.copiedCode.set(null);
        }
      }, 1800);
    });
  }

  remove(shortCode: string): void {
    this.recent.set(this.recentLinks.remove(shortCode));
    if (this.result()?.shortCode === shortCode) {
      this.result.set(null);
    }
  }

  foreignDomain(shortUrl: string): string {
    const domain = this.domainOf(shortUrl);
    return domain === this.config.shortDomain() ? '' : domain;
  }

  domainOf(shortUrl: string): string {
    return shortUrl.replace(/^https?:\/\//, '').replace(/\/[^/]*$/, '');
  }
}
