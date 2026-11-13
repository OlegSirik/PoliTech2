import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { Breadcrumb, PtAction, PtColumn, PtRow, PtRowAction, PtRowActionEvent } from '../platform.models';

@Component({
  selector: 'pt-search-page',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
})
export class SearchPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
  readonly columns = input.required<PtColumn[]>();
  readonly rows = input.required<PtRow[]>();
  readonly actions = input<PtAction[]>([]);
  readonly rowActions = input<PtRowAction[]>([]);
  readonly interactive = input(true);
  readonly loading = input(false);
  readonly queryPlaceholder = input('Код, название или линия');
  readonly query = model('');

  readonly action = output<string>();
  readonly rowAction = output<PtRowActionEvent>();
  readonly rowClick = output<PtRow>();

  protected cell(row: PtRow, column: PtColumn): string {
    return row[column.key] ?? '';
  }

  protected onRowClick(row: PtRow): void {
    if (this.interactive()) {
      this.rowClick.emit(row);
    }
  }

  protected countLabel(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) {
      return `${count} запись`;
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} записи`;
    }
    return `${count} записей`;
  }
}
