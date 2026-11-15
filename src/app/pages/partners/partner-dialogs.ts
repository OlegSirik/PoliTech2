import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PartnerMember, ProductSummary } from '../../core/api/catalog.models';

@Component({
  selector: 'pt-partner-product-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Добавить продукт</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Продукт</mat-label>
        <mat-select [(ngModel)]="selectedId">
          @for (product of data.products; track product.id ?? product.code) {
            <mat-option [value]="product.id">{{ product.name }} ({{ product.code }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Отмена</button>
      <button mat-flat-button color="primary" type="button" [disabled]="selectedId == null" (click)="save()">Сохранить</button>
    </mat-dialog-actions>
  `,
  styles: `mat-form-field { width: 100%; } mat-dialog-content { min-width: min(420px, 80vw); padding-top: 8px; }`,
})
export class PartnerProductDialogComponent {
  protected selectedId: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: { products: ProductSummary[] },
    private readonly dialogRef: MatDialogRef<PartnerProductDialogComponent, number | undefined>,
  ) {}

  protected save(): void {
    if (this.selectedId == null) {
      return;
    }
    this.dialogRef.close(this.selectedId);
  }
}

@Component({
  selector: 'pt-partner-admin-dialog',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Добавить администратора</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Логин</mat-label>
        <input matInput [(ngModel)]="userLogin" autocomplete="off">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Отмена</button>
      <button mat-flat-button class="pt-btn-accent" type="button" [disabled]="!userLogin.trim()" (click)="save()">
        <mat-icon>add</mat-icon>
        Добавить
      </button>
    </mat-dialog-actions>
  `,
  styles: `mat-form-field { width: 100%; } mat-dialog-content { min-width: min(420px, 80vw); padding-top: 8px; }`,
})
export class PartnerAdminDialogComponent {
  protected userLogin = '';

  constructor(private readonly dialogRef: MatDialogRef<PartnerAdminDialogComponent, string | undefined>) {}

  protected save(): void {
    const login = this.userLogin.trim();
    if (!login) {
      return;
    }
    this.dialogRef.close(login);
  }
}

@Component({
  selector: 'pt-partner-member-dialog',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Администратор</h2>
    <mat-dialog-content class="view">
      <p><strong>Логин:</strong> {{ data.member.userLogin }}</p>
      <p><strong>ФИО:</strong> {{ data.member.fullName || '—' }}</p>
      <p><strong>Должность:</strong> {{ data.member.position || '—' }}</p>
      <p><strong>Роль:</strong> {{ data.member.userRole || '—' }}</p>
      <p><strong>ID:</strong> {{ data.member.id }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Закрыть</button>
    </mat-dialog-actions>
  `,
  styles: `.view { min-width: min(420px, 80vw); } .view p { margin: 8px 0; }`,
})
export class PartnerMemberDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) protected readonly data: { member: PartnerMember }) {}
}
