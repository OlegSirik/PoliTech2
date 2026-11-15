import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { bffErrorMessage } from '../../core/bff/bff-error';
import { CatalogApiService } from '../../core/api/catalog-api.service';
import { Partner } from '../../core/api/catalog.models';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { statusClass as ptStatusClass } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-partners-page',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule, ActionButtonComponent, PageHeaderComponent],
  templateUrl: './partners-page.component.html',
  styleUrl: '../catalog/sheet.scss',
})
export class PartnersPageComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  protected readonly loading = signal(false);
  protected readonly partners = signal<Partner[]>([]);

  ngOnInit(): void {
    this.load();
  }

  protected status(partner: Partner): string {
    if (partner.recordStatus) {
      return partner.recordStatus;
    }
    return partner.isDeleted ? 'SUSPENDED' : 'ACTIVE';
  }

  protected statusClass(value: string): string {
    return ptStatusClass(value);
  }

  protected add(): void {
    void this.router.navigate(['/partners', 'new']);
  }

  protected open(partner: Partner): void {
    if (partner.id == null) {
      return;
    }
    void this.router.navigate(['/partners', partner.id]);
  }

  private load(): void {
    this.loading.set(true);
    this.api.partners().subscribe({
      next: (items) => {
        this.partners.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.snack.open(bffErrorMessage(error, 'Не удалось загрузить партнеров'), 'Закрыть', { duration: 3000 });
      },
    });
  }
}
