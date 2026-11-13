import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { Rule, RuleScopeType, RuleType, RulesService } from '../../core/api/rules.service';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { PtAction, PtColumn, PtRow, PtRowAction } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-rules-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    SearchPageComponent,
  ],
  templateUrl: './rules-page.component.html',
  styles: `
    .filter { width: 220px; max-width: 100%; }
  `,
})
export class RulesPageComponent implements OnInit {
  private readonly rulesService = inject(RulesService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly query = signal('');
  protected readonly ruleType = signal<RuleType | ''>('');
  protected readonly scopeType = signal<RuleScopeType | ''>('');
  protected readonly rules = signal<Rule[]>([]);

  protected readonly ruleTypes: RuleType[] = [
    'PRE_QUOTE_VALIDATION',
    'POST_QUOTE_VALIDATION',
    'PRE_SAVE_VALIDATION',
    'UNDERWRITING',
  ];
  protected readonly scopeTypes: RuleScopeType[] = ['PRODUCT', 'LOB', 'TENANT', 'CLIENT'];

  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '140px' },
    { key: 'name', label: 'Название' },
    { key: 'llmText', label: 'Текст' },
    { key: 'scopeType', label: 'Область', width: '110px' },
    { key: 'scopeCode', label: 'Код области', width: '140px' },
    { key: 'ruleType', label: 'Тип', width: '190px' },
    { key: 'priority', label: 'Приоритет', width: '110px' },
    { key: 'status', label: 'Статус', width: '110px' },
  ];

  protected readonly actions: PtAction[] = [
    { id: 'reload', label: 'Обновить кэш', icon: 'refresh', tone: 'ghost' },
    { id: 'create', label: 'Новое правило', icon: 'add', tone: 'accent' },
  ];

  protected readonly rowActions: PtRowAction[] = [
    { id: 'edit', label: 'Изменить', icon: 'edit' },
  ];

  protected readonly rows = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.rules()
      .filter((rule) => {
        const haystack = `${rule.code} ${rule.name} ${rule.llmText ?? ''} ${rule.scopeCode}`.toLowerCase();
        return !query || haystack.includes(query);
      })
      .map((rule) => ({
        id: String(rule.id ?? rule.code),
        code: rule.code,
        name: rule.name,
        llmText: rule.llmText || '—',
        scopeType: rule.scopeType,
        scopeCode: rule.scopeCode,
        ruleType: rule.ruleType,
        priority: String(rule.priority ?? ''),
        status: rule.recordStatus ?? '',
      }));
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.rulesService.list({
      ruleType: this.ruleType(),
      scopeType: this.scopeType(),
      recordStatus: 'ACTIVE',
    }).subscribe({
      next: (rules) => {
        this.rules.set(rules ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Ошибка загрузки правил'), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' });
      },
    });
  }

  protected onAction(id: string): void {
    if (id === 'create') {
      void this.router.navigate(['/rules', 'new']);
      return;
    }
    this.rulesService.reloadCache().subscribe({
      next: () => this.snack.open('Кэш правил обновлён', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' }),
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Не удалось обновить кэш'), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' }),
    });
  }

  protected open(row: PtRow): void {
    void this.router.navigate(['/rules', row.id]);
  }
}
