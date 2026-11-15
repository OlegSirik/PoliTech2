import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { InsuranceCompany } from '../../core/api/catalog.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

function emptyCompany(): InsuranceCompany {
  return { code: '', name: '', status: 'active' };
}

@Component({
  selector: 'pt-ins-company-edit-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './ins-company-edit-page.component.html',
  styleUrl: '../catalog/sheet.scss',
  styles: '.wide { grid-column: 1 / -1; }',
})
export class InsCompanyEditPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly isNew = signal(true);
  protected company: InsuranceCompany = emptyCompany();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      this.company = emptyCompany();
      return;
    }
    this.isNew.set(false);
    this.api.insuranceCompany(Number(id)).subscribe({
      next: (company) => { this.company = { status: 'active', ...company }; },
      error: (error: unknown) => this.snack.open(bffErrorMessage(error, 'Компания не найдена'), 'Закрыть', { duration: 3000 }),
    });
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected back(): void {
    void this.router.navigate(['/ins-companies']);
  }

  protected save(): void {
    const code = this.company.code?.trim() ?? '';
    const name = this.company.name?.trim() ?? '';
    if (!code || !name) {
      this.snack.open('Укажите код и название', 'Закрыть', { duration: 2500 });
      return;
    }
    this.company.code = code;
    this.company.name = name;
    this.saving.set(true);
    const request = this.isNew() || this.company.id == null
      ? this.api.createInsuranceCompany(this.company)
      : this.api.updateInsuranceCompany(this.company.id, this.company);
    request.subscribe({
      next: (saved) => {
        this.company = { status: 'active', ...saved };
        this.isNew.set(false);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
        if (saved.id != null && this.route.snapshot.paramMap.get('id') !== String(saved.id)) {
          void this.router.navigate(['/ins-companies', saved.id], { replaceUrl: true });
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить компанию'), 'Закрыть', { duration: 3000 });
      },
    });
  }
}
