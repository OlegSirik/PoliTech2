import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { LlmAssistResponse, ProductListItem, RuleAssistService } from '../../core/api/rule-assist.service';
import { Rule, RuleScopeType, RuleType, RulesService } from '../../core/api/rules.service';
import { EditPageComponent } from '../../shared/ui/edit-page/edit-page.component';
import { PropertyDrawerComponent } from '../../shared/ui/property-drawer/property-drawer.component';

@Component({
  selector: 'pt-rule-edit-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    EditPageComponent,
    PropertyDrawerComponent,
  ],
  templateUrl: './rule-edit-page.component.html',
  styleUrl: './rule-edit-page.component.scss',
})
export class RuleEditPageComponent implements OnInit {
  private readonly rulesService = inject(RulesService);
  private readonly assistService = inject(RuleAssistService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly ruleTypes: RuleType[] = [
    'PRE_QUOTE_VALIDATION',
    'POST_QUOTE_VALIDATION',
    'PRE_SAVE_VALIDATION',
    'UNDERWRITING',
  ];
  protected readonly scopeTypes: RuleScopeType[] = ['PRODUCT', 'LOB', 'TENANT', 'CLIENT'];

  protected rule: Rule = this.emptyRule();
  protected readonly isNew = signal(true);
  protected readonly saving = signal(false);
  protected readonly askingLlm = signal(false);
  protected readonly llmReady = signal(false);
  protected readonly dirty = signal(false);
  protected readonly drawerOpen = signal(true);
  protected scopeLocked = false;
  protected ruleTypeLocked = false;
  private returnUrl = '';

  ngOnInit(): void {
    this.applyContext();
    this.assistService.llmConfig().subscribe({
      next: (view) => this.llmReady.set(!!view.configured && !!view.enabled),
      error: () => this.llmReady.set(false),
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isNew.set(false);
      this.rulesService.getById(id).subscribe({
        next: (rule) => {
          this.rule = { ...rule };
          this.reapplyLocks();
        },
        error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Правило не найдено'), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' }),
      });
    }
  }

  protected markDirty(): void {
    this.dirty.set(true);
  }

  protected save(): void {
    if (!this.rule.code.trim() || !this.rule.name.trim() || !this.rule.expression.trim() || !this.rule.message.trim()) {
      this.snack.open('Заполните код, название, выражение и сообщение', 'Закрыть', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const request = this.isNew()
      ? this.rulesService.create(this.rule)
      : this.rulesService.update(this.rule.id!, this.rule);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(this.isNew() ? 'Правило создано' : 'Правило обновлено', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
        this.back();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Ошибка сохранения'), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' });
      },
    });
  }

  protected remove(): void {
    if (!this.rule.id || !confirm('Удалить правило?')) {
      return;
    }
    this.rulesService.delete(this.rule.id).subscribe({
      next: () => {
        this.snack.open('Правило удалено', 'Закрыть', { duration: 2000, panelClass: 'pt-snack-success' });
        this.back();
      },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Ошибка удаления'), 'Закрыть', { duration: 3000, panelClass: 'pt-snack-error' }),
    });
  }

  protected askLlm(): void {
    const text = (this.rule.llmText || '').trim();
    if (!text) {
      return;
    }
    if (this.rule.scopeType === 'TENANT' || this.rule.scopeType === 'CLIENT') {
      this.snack.open('LLM для областей TENANT и CLIENT не поддерживается', 'Закрыть', { duration: 3500 });
      return;
    }
    if (!this.rule.scopeCode?.trim()) {
      this.snack.open('Укажите код области', 'Закрыть', { duration: 3000 });
      return;
    }

    this.askingLlm.set(true);
    const scopeCode = this.rule.scopeCode.trim();
    if (this.rule.scopeType === 'LOB') {
      this.assistService.assistLob(scopeCode, text).subscribe({
        next: (response) => this.applyLlm(response),
        error: (error: unknown) => this.failLlm(bffErrorMessage(error, 'LLM не ответил')),
      });
      return;
    }

    this.assistService.products().pipe(
      map((products) => this.resolveProduct(products, scopeCode)),
      catchError(() => {
        this.failLlm('Не удалось загрузить список продуктов');
        return of(null);
      }),
    ).subscribe((context) => {
      if (!context) {
        return;
      }
      this.assistService.assistProduct(context.productId, context.versionNo, text).subscribe({
        next: (response) => this.applyLlm(response),
        error: (error: unknown) => this.failLlm(bffErrorMessage(error, 'LLM не ответил')),
      });
    });
  }

  protected back(): void {
    if (this.returnUrl.startsWith('/') && !this.returnUrl.startsWith('//')) {
      void this.router.navigateByUrl(this.returnUrl);
      return;
    }
    void this.router.navigate(['/rules']);
  }

  private applyContext(): void {
    const params = this.route.snapshot.queryParamMap;
    this.returnUrl = params.get('returnUrl') ?? '';
    const scopeType = params.get('scopeType') as RuleScopeType | null;
    const scopeCode = params.get('scopeCode')?.trim() ?? '';
    if (scopeType && this.scopeTypes.includes(scopeType) && scopeCode) {
      this.scopeLocked = true;
      this.rule.scopeType = scopeType;
      this.rule.scopeCode = scopeCode;
    }
    const ruleType = params.get('ruleType') as RuleType | null;
    if (ruleType && this.ruleTypes.includes(ruleType)) {
      this.ruleTypeLocked = true;
      this.rule.ruleType = ruleType;
    }
  }

  private reapplyLocks(): void {
    const params = this.route.snapshot.queryParamMap;
    if (this.scopeLocked) {
      this.rule.scopeType = params.get('scopeType') as RuleScopeType;
      this.rule.scopeCode = params.get('scopeCode') ?? '';
    }
    if (this.ruleTypeLocked) {
      this.rule.ruleType = params.get('ruleType') as RuleType;
    }
  }

  private resolveProduct(products: ProductListItem[], code: string): { productId: number; versionNo: number } | null {
    const product = products.find((item) => item.code === code);
    const versionNo = product?.devVersionNo ?? product?.prodVersionNo;
    if (!product?.id || !versionNo) {
      this.failLlm(product ? 'У продукта нет версии для LLM' : `Продукт не найден: ${code}`);
      return null;
    }
    return { productId: product.id, versionNo };
  }

  private applyLlm(response: LlmAssistResponse): void {
    this.askingLlm.set(false);
    if (!response.success) {
      this.snack.open(response.errors?.join('; ') || 'LLM вернул ошибку', 'Закрыть', { duration: 4000, panelClass: 'pt-snack-error' });
      return;
    }
    const draft = response.result;
    if (!draft?.condition) {
      this.snack.open('В ответе нет CEL-выражения', 'Закрыть', { duration: 3000 });
      return;
    }
    this.rule.expression = draft.condition;
    if (this.isNew() && draft.code && !this.rule.code) {
      this.rule.code = draft.code;
    }
    if (draft.name && !this.rule.name) {
      this.rule.name = draft.name;
    }
    if (draft.message) {
      this.rule.message = draft.message;
    }
    this.dirty.set(true);
    this.snack.open(response.warnings?.length ? response.warnings.join('; ') : 'CEL-выражение подставлено', 'Закрыть', { duration: 3000, panelClass: 'pt-snack-success' });
  }

  private failLlm(message: string): void {
    this.askingLlm.set(false);
    this.snack.open(message, 'Закрыть', { duration: 4000, panelClass: 'pt-snack-error' });
  }

  private emptyRule(): Rule {
    return {
      code: '',
      name: '',
      scopeType: 'PRODUCT',
      scopeCode: '',
      ruleType: 'PRE_QUOTE_VALIDATION',
      priority: 100,
      recordStatus: 'ACTIVE',
      expressionLanguage: 'CEL',
      expression: '',
      message: '',
      llmText: '',
    };
  }
}
