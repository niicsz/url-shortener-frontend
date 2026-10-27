import { Component, computed, inject, signal } from '@angular/core';
import { ConfigService } from '../shared/services/config.service';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UrlService } from '../shared/services/url.service';
import { RecentLinksService } from '../shared/services/recent-links.service';
import { RecentLink } from '../shared/models/short-url.model';
import { IconComponent } from '../shared/components/icon.component';
import { ShortLinkComponent } from '../shared/components/short-link.component';

interface StatRow {
  shortCode: string;
  shortUrl: string;
  domain: string;
  longUrl: string;
  createdAt: string;
  clicks: number | null;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, IconComponent, ShortLinkComponent],
  template: `
    <section class="page">
      <div class="title-row">
        <div>
          <h1>Painel</h1>
          <p class="subline">
            @if (links.length === 0) {
              Os links criados neste navegador aparecem aqui com os cliques de cada um.
            } @else if (loading() && rows().length === 0) {
              Contando os cliques de {{ links.length }} {{ links.length === 1 ? 'link' : 'links' }}…
            } @else if (top(); as leader) {
              <span class="mono">/{{ leader.shortCode }}</span> é o mais acessado, com {{ leader.clicks | number }} de {{ totalClicks() | number }} cliques.
            } @else {
              Nenhum clique ainda nos {{ links.length }} {{ links.length === 1 ? 'link' : 'links' }} deste navegador.
            }
          </p>
        </div>
        @if (links.length > 0) {
          <div class="freshness">
            @if (updatedAt(); as at) {
              <span class="stamp">Atualizado às {{ at | date: 'HH:mm' }}</span>
            }
            <button type="button" class="btn btn-secondary" (click)="refresh()" [disabled]="loading()">
              <app-icon name="refresh" />
              {{ loading() ? 'Atualizando…' : 'Atualizar' }}
            </button>
          </div>
        }
      </div>

      @if (links.length === 0) {
        <section class="panel first-run" aria-labelledby="first-run-title">
          <h2 id="first-run-title">Nenhum link para acompanhar</h2>
          <p class="subline">Encurte um endereço e volte aqui para ver quantas vezes ele foi aberto.</p>
          <a class="btn btn-primary" routerLink="/">Encurtar um link</a>
        </section>
      } @else {
        <div class="dash">
        <section class="panel board" aria-labelledby="board-title">
          <div class="board-head">
            <h2 id="board-title">Cliques por link</h2>
            <p class="aside">{{ links.length }} {{ links.length === 1 ? 'link' : 'links' }} em <span class="mono">{{ config.shortDomain() }}</span>, do mais ao menos acessado</p>
          </div>

          @if (failedCount() > 0) {
            <div class="notice" role="status">
              <span>Não deu para contar os cliques de {{ failedCount() }} {{ failedCount() === 1 ? 'link' : 'links' }}. Eles aparecem com um traço.</span>
              <button type="button" class="link-action retry" (click)="refresh()">Tentar de novo</button>
            </div>
          }

          <ol class="ranking">
            @if (rows().length === 0) {
              @for (link of links; track link.shortCode) {
                <li class="row">
                  <div class="identity">
                    <span class="skeleton" style="width: 180px"></span>
                    <span class="skeleton sub-skeleton" style="width: 260px"></span>
                  </div>
                  <span class="skeleton date-skeleton"></span>
                  <span class="skeleton clicks-skeleton"></span>
                </li>
              }
            } @else {
              @for (row of rows(); track row.shortCode; let first = $first) {
                <li class="row">
                  <div class="identity">
                    <a [href]="row.shortUrl" target="_blank" rel="noopener" class="code">
                      <app-short-link [domain]="row.domain === config.shortDomain() ? '' : row.domain" [slug]="row.shortCode" />
                    </a>
                    <span class="dest" [title]="row.longUrl">{{ row.longUrl }}</span>
                    <span class="track" aria-hidden="true">
                      <span class="fill" [class.lead]="first && (row.clicks ?? 0) > 0" [style.width.%]="share(row)"></span>
                    </span>
                  </div>
                  <span class="date num">{{ row.createdAt | date: 'dd/MM/yyyy' }}</span>
                  <span class="clicks mono num" [class.zero]="row.clicks === 0" [class.missing]="row.clicks === null">
                    @if (row.clicks === null) {
                      <span aria-label="sem dados">—</span>
                    } @else {
                      {{ row.clicks | number }}
                    }
                  </span>
                </li>
              }
            }
          </ol>
        </section>

        <aside class="panel summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Resumo</h2>
          <dl>
            <div class="lead">
              <dt>Cliques no total</dt>
              <dd class="mono num">
                @if (rows().length === 0) {
                  <span class="skeleton total-skeleton"></span>
                } @else {
                  {{ totalClicks() | number }}
                }
              </dd>
            </div>
            <div>
              <dt>Links com cliques</dt>
              <dd class="mono num">
                @if (rows().length === 0) {
                  <span class="skeleton"></span>
                } @else {
                  {{ clickedCount() }} <span class="of">de {{ rows().length }}</span>
                }
              </dd>
            </div>
            <div>
              <dt>Sem cliques ainda</dt>
              <dd class="mono num">
                @if (rows().length === 0) {
                  <span class="skeleton"></span>
                } @else {
                  {{ unclickedCount() }}
                }
              </dd>
            </div>
            <div>
              <dt>Sem dados</dt>
              <dd class="mono num" [class.missing]="failedCount() === 0">
                @if (rows().length === 0) {
                  <span class="skeleton"></span>
                } @else if (failedCount() === 0) {
                  —
                } @else {
                  {{ failedCount() }}
                }
              </dd>
            </div>
          </dl>
          <a class="btn btn-primary summary-action" routerLink="/">Encurtar outro link</a>
        </aside>
        </div>
      }
    </section>
  `,
  styles: [`
    .freshness {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stamp {
      color: var(--muted);
      font-size: var(--fs-small);
      white-space: nowrap;
    }
    .first-run {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    .first-run h2 {
      font-size: var(--fs-section);
      font-weight: 600;
    }
    .first-run .btn {
      margin-top: 12px;
    }
    .dash {
      display: grid;
      grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
      gap: var(--gap);
      align-items: stretch;
    }
    .board {
      padding-bottom: 8px;
    }
    .board-head {
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .summary {
      display: flex;
      flex-direction: column;
    }
    .summary h2 {
      font-size: var(--fs-section);
      line-height: 24px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    dl {
      margin: 0 0 24px;
    }
    dl div {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--rule);
    }
    dl div:last-child {
      border-bottom: 0;
    }
    dt {
      color: var(--muted);
    }
    dd {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      text-align: right;
    }
    dd .of {
      color: var(--muted);
      font-family: var(--font);
      font-weight: 400;
    }
    dd .skeleton {
      width: 32px;
      vertical-align: middle;
    }
    dd.missing {
      color: var(--muted);
      font-weight: 400;
    }
    dl .lead {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding-top: 4px;
    }
    dl .lead dd {
      font-size: var(--fs-figure);
      line-height: 36px;
      letter-spacing: -0.02em;
      text-align: left;
    }
    .summary-action {
      margin-top: auto;
      align-self: flex-start;
    }
    .board-head h2 {
      font-size: var(--fs-section);
      line-height: 24px;
      font-weight: 600;
    }
    .board-head .aside {
      color: var(--muted);
      font-size: var(--fs-small);
    }
    .total-skeleton {
      width: 64px;
      height: 30px;
      margin-top: 4px;
    }
    .notice {
      margin-top: 16px;
    }
    .retry {
      color: inherit;
      background: none;
      border: 0;
      padding: 0;
      cursor: pointer;
      white-space: nowrap;
    }
    .ranking {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 96px 72px;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--rule);
    }
    .row:last-child {
      border-bottom: 0;
    }
    .identity {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .code {
      font-size: 16px;
      line-height: 22px;
      border-radius: 4px;
    }
    .code:hover {
      text-decoration: underline;
      text-decoration-color: var(--control);
      text-underline-offset: 4px;
    }
    .dest {
      color: var(--muted);
      font-size: var(--fs-small);
      line-height: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .track {
      display: block;
      height: 3px;
      margin-top: 8px;
      max-width: 520px;
    }
    .fill {
      display: block;
      height: 100%;
      border-radius: 2px;
      background: #9aa0a6;
    }
    .fill.lead {
      background: var(--hue);
    }
    .date {
      text-align: right;
      color: var(--muted);
    }
    .clicks {
      text-align: right;
      font-size: 18px;
      line-height: 24px;
      font-weight: 500;
    }
    .clicks.zero,
    .clicks.missing {
      color: var(--muted);
      font-weight: 400;
    }
    .sub-skeleton {
      height: 12px;
      margin-top: 4px;
      max-width: 100%;
    }
    .date-skeleton {
      justify-self: end;
      width: 80px;
    }
    .clicks-skeleton {
      justify-self: end;
      width: 32px;
      height: 18px;
    }
    @media (max-width: 900px) {
      .dash {
        grid-template-columns: 1fr;
      }
      .summary {
        order: -1;
      }
      dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 16px;
        margin-bottom: 16px;
      }
      dl .lead {
        grid-column: 1 / -1;
      }
      dl div:nth-last-child(2) {
        border-bottom: 0;
      }
    }
    @media (max-width: 640px) {
      .title-row {
        flex-direction: column;
        align-items: stretch;
      }
      .freshness {
        justify-content: space-between;
      }
      .row {
        grid-template-columns: minmax(0, 1fr) 64px;
      }
      .date,
      .date-skeleton {
        display: none;
      }
    }
  `]
})
export class StatsComponent {
  private readonly urlService = inject(UrlService);
  private readonly recentLinks = inject(RecentLinksService);
  protected readonly config = inject(ConfigService);

  protected links: RecentLink[] = this.recentLinks.list();

  readonly loading = signal(false);
  readonly rows = signal<StatRow[]>([]);
  readonly updatedAt = signal<Date | null>(null);

  readonly totalClicks = computed(() => this.rows().reduce((sum, row) => sum + (row.clicks ?? 0), 0));
  readonly failedCount = computed(() => this.rows().filter((row) => row.clicks === null).length);
  readonly clickedCount = computed(() => this.rows().filter((row) => (row.clicks ?? 0) > 0).length);
  readonly unclickedCount = computed(() => this.rows().filter((row) => row.clicks === 0).length);
  readonly maxClicks = computed(() => Math.max(0, ...this.rows().map((row) => row.clicks ?? 0)));
  readonly top = computed(() => {
    const leader = this.rows()[0];
    return leader && (leader.clicks ?? 0) > 0 ? leader : null;
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.links = this.recentLinks.list();
    if (this.links.length === 0) {
      this.rows.set([]);
      return;
    }
    this.loading.set(true);
    forkJoin(
      this.links.map((link) =>
        this.urlService.getStats(link.shortCode).pipe(
          map((stats) => this.toRow(link, stats.clicks, stats.createdAt)),
          catchError(() => of(this.toRow(link, null, link.createdAt)))
        )
      )
    ).subscribe((results) => {
      this.rows.set(results.sort((a, b) => (b.clicks ?? -1) - (a.clicks ?? -1)));
      this.updatedAt.set(new Date());
      this.loading.set(false);
    });
  }

  share(row: StatRow): number {
    const max = this.maxClicks();
    if (!max || !row.clicks) {
      return 0;
    }
    return (row.clicks / max) * 100;
  }

  private toRow(link: RecentLink, clicks: number | null, createdAt: string): StatRow {
    return {
      shortCode: link.shortCode,
      shortUrl: link.shortUrl,
      domain: link.shortUrl.replace(/^https?:\/\//, '').replace(/\/[^/]*$/, ''),
      longUrl: link.longUrl,
      createdAt,
      clicks
    };
  }
}
