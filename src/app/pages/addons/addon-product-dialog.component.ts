import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ProductSummary } from '../../core/api/catalog.models';

@Component({
  selector: 'pt-addon-product-dialog',
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
export class AddonProductDialogComponent {
  protected selectedId: number | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected readonly data: { products: ProductSummary[] },
    private readonly dialogRef: MatDialogRef<AddonProductDialogComponent, number | undefined>,
  ) {}

  protected save(): void {
    if (this.selectedId == null) {
      return;
    }
    this.dialogRef.close(this.selectedId);
  }
}
