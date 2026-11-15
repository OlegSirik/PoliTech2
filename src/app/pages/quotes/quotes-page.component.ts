import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { SalesApiService } from '../../core/api/sales-api.service';
import { Quote } from '../../core/api/sales.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

const STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'EXPIRED'];
const MAX_ROWS = 20;

@Component({
  selector: 'pt-quotes-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './quotes-page.component.html',
  styleUrls: ['../catalog/sheet.scss', './quotes-page.component.scss'],
})
export class QuotesPageComponent implements OnInit {
  private readonly api = inject(SalesApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  protected readonly statuses = STATUSES;
  protected readonly loading = signal(false);
  protected readonly quotes = signal<Quote[]>([]);
  protected searchText = '';
  protected selectedStatus = '';

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((text) => this.fetch(text)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((items) => {
      this.quotes.set(items);
      this.loading.set(false);
    });
    this.loading.set(true);
    this.search$.next('');
  }

  protected visibleQuotes(): Quote[] {
    return this.applyFilters(this.quotes()).slice(0, MAX_ROWS);
  }

  protected onSearch(value: string): void {
    this.searchText = value;
    this.loading.set(true);
    this.search$.next(value);
  }

  protected text(value: string | number | null | undefined, fallback = '—'): string {
    if (value == null) {
      return fallback;
    }
    const trimmed = String(value).trim();
    return trimmed ? trimmed : fallback;
  }

  protected statusClass(status: string | undefined): string {
    switch ((status ?? '').toUpperCase()) {
      case 'DRAFT':
        return 'is-draft';
      case 'ISSUED':
      case 'PAID':
        return 'is-published';
      case 'CANCELLED':
      case 'EXPIRED':
        return 'is-archived';
      default:
        return '';
    }
  }

  protected commandOn(quote: Quote, index: number): boolean {
    const flags: Array<boolean | undefined> = [
      quote.comand1, quote.comand2, quote.comand3, quote.comand4, quote.comand5,
      quote.comand6, quote.comand7, quote.comand8, quote.comand9,
    ];
    return !!flags[index - 1];
  }

  protected commandLabel(index: number): string {
    if (index === 1) {
      return 'Печать договора';
    }
    if (index === 2) {
      return 'Печать КИД';
    }
    return `comand ${index}`;
  }

  protected commandIndexes(quote: Quote): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((index) => this.commandOn(quote, index));
  }

  protected viewPolicy(quote: Quote): void {
    const policyNr = quote.policyNr?.trim();
    if (!policyNr) {
      this.snack.open('У котировки нет номера', 'Закрыть', { duration: 3000 });
      return;
    }
    void this.router.navigate(['/quotes', policyNr]);
  }

  protected runCommand(quote: Quote, index: number): void {
    if (index === 1) {
      this.print(quote, 'policy');
    } else if (index === 2) {
      this.print(quote, 'kid');
    }
  }

  private fetch(text: string) {
    const query = text.trim();
    return this.api.quotes(query || undefined).pipe(
      catchError((error: unknown) => {
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить котировки'), 'Закрыть', { duration: 3000 });
        return of([] as Quote[]);
      }),
    );
  }

  private applyFilters(source: Quote[]): Quote[] {
    let filtered = [...source];
    const search = this.searchText.trim().toLowerCase();
    if (search) {
      filtered = filtered.filter((quote) =>
        (quote.phDigest ?? '').toLowerCase().includes(search)
        || (quote.policyNr ?? '').toLowerCase().includes(search)
        || (quote.productCode ?? '').toLowerCase().includes(search));
    }
    if (this.selectedStatus) {
      filtered = filtered.filter((quote) => quote.policyStatus === this.selectedStatus);
    }
    return filtered;
  }

  private print(quote: Quote, pfType: 'policy' | 'kid'): void {
    const policyNr = quote.policyNr?.trim();
    if (!policyNr) {
      this.snack.open('У котировки нет номера', 'Закрыть', { duration: 3000 });
      return;
    }
    this.api.printForm(policyNr, pfType).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pfType === 'kid' ? `policy_${policyNr}_kid.pdf` : `policy_${policyNr}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => {
        void this.printError(error);
      },
    });
  }

  private async printError(error: unknown): Promise<void> {
    let message = 'Не удалось скачать печатную форму';
    if (error instanceof HttpErrorResponse && error.error instanceof Blob) {
      try {
        const text = await error.error.text();
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) {
          message = parsed.message;
        }
      } catch {
        message = 'Не удалось скачать печатную форму';
      }
    } else {
      message = bffErrorMessage(error, message);
    }
    this.snack.open(message, 'Закрыть', { duration: 3000 });
  }
}
