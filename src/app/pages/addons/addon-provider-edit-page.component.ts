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
import { AddonProvider } from '../../core/api/catalog.models';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';

function emptyProvider(): AddonProvider {
  return { name: '', recordStatus: 'ACTIVE', executionMode: 'LOCAL' };
}

@Component({
  selector: 'pt-addon-provider-edit-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './addon-provider-edit-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class AddonProviderEditPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly isNew = signal(true);
  protected provider: AddonProvider = emptyProvider();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      this.provider = emptyProvider();
      return;
    }
    this.isNew.set(false);
    this.api.addonProvider(Number(id)).subscribe({
      next: (provider) => {
        this.provider = {
          ...emptyProvider(),
          ...provider,
          recordStatus: provider.recordStatus || 'ACTIVE',
          executionMode: provider.executionMode || 'LOCAL',
        };
      },
      error: (error: unknown) => {
        this.snack.open(bffErrorMessage(error, 'Поставщик не найден'), 'Закрыть', { duration: 3000 });
        this.back();
      },
    });
  }

  protected touch(): void {
    this.dirty.set(true);
  }

  protected back(): void {
    void this.router.navigate(['/addons']);
  }

  protected save(): void {
    const name = this.provider.name?.trim() ?? '';
    if (!name) {
      this.snack.open('Укажите название', 'Закрыть', { duration: 2500 });
      return;
    }
    this.provider.name = name;
    this.provider.recordStatus = this.provider.recordStatus || 'ACTIVE';
    this.provider.executionMode = this.provider.executionMode || 'LOCAL';
    this.saving.set(true);
    const request = this.isNew() || this.provider.id == null
      ? this.api.createAddonProvider(this.provider)
      : this.api.updateAddonProvider(this.provider.id, this.provider);
    request.subscribe({
      next: (saved) => {
        this.provider = {
          ...emptyProvider(),
          ...saved,
          recordStatus: saved.recordStatus || 'ACTIVE',
          executionMode: saved.executionMode || 'LOCAL',
        };
        this.isNew.set(false);
        this.dirty.set(false);
        this.saving.set(false);
        this.snack.open('Сохранено', 'Закрыть', { duration: 2000 });
        if (saved.id != null && this.route.snapshot.paramMap.get('id') !== String(saved.id)) {
          void this.router.navigate(['/addons', 'providers', saved.id], { replaceUrl: true });
        }
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось сохранить поставщика'), 'Закрыть', { duration: 3000 });
      },
    });
  }
}
