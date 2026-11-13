import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header.component';
import { SearchPageComponent } from '../../shared/ui/search-page/search-page.component';
import { EditPageComponent } from '../../shared/ui/edit-page/edit-page.component';
import { PropertyDrawerComponent } from '../../shared/ui/property-drawer/property-drawer.component';
import { ThemeToggleComponent } from '../../shared/ui/theme-toggle/theme-toggle.component';
import { ActionButtonComponent } from '../../shared/ui/action-button/action-button.component';
import { PtAction, PtColumn, PtRow, PtRowAction } from '../../shared/ui/platform.models';

@Component({
  selector: 'pt-demo-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
    PageHeaderComponent,
    SearchPageComponent,
    EditPageComponent,
    PropertyDrawerComponent,
    ThemeToggleComponent,
    ActionButtonComponent,
  ],
  templateUrl: './demo-page.component.html',
  styleUrl: './demo-page.component.scss',
})
export class DemoPageComponent {
  private readonly snack = inject(MatSnackBar);

  protected readonly drawerOpen = signal(true);
  protected readonly query = signal('');
  protected readonly cleared = signal(false);
  protected readonly dirty = signal(true);

  protected readonly swatches = [
    { name: 'Primary', token: '--pt-color-primary', hex: '#11443f' },
    { name: 'Accent', token: '--pt-color-accent', hex: '#b8612d' },
    { name: 'Canvas', token: '--pt-color-canvas', hex: '#f3f0e8' },
    { name: 'Surface', token: '--pt-color-surface', hex: '#fffcf7' },
    { name: 'Ink', token: '--pt-color-ink', hex: '#14242b' },
    { name: 'Line', token: '--pt-color-line', hex: '#d5cec0' },
    { name: 'Danger', token: '--pt-color-danger', hex: '#9d2c2c' },
    { name: 'Success', token: '--pt-color-success', hex: '#1f6b45' },
  ];

  protected readonly columns: PtColumn[] = [
    { key: 'code', label: 'Код', width: '90px' },
    { key: 'name', label: 'Название' },
    { key: 'status', label: 'Статус', kind: 'status', width: '140px' },
  ];

  protected readonly rows: PtRow[] = [
    { id: '1', code: 'ACC', name: 'НС Классика', status: 'Опубликован' },
    { id: '2', code: 'GAD', name: 'Комплексная защита', status: 'Черновик' },
    { id: '3', code: 'PAX', name: 'Пассажиры', status: 'Архив' },
  ];

  protected readonly actions: PtAction[] = [
    { id: 'ghost', label: 'Экспорт', icon: 'download', tone: 'ghost' },
    { id: 'create', label: 'Создать', icon: 'add', tone: 'accent' },
  ];

  protected readonly rowActions: PtRowAction[] = [
    { id: 'edit', label: 'Изменить', icon: 'edit' },
  ];

  protected readonly visibleRows = computed(() => {
    if (this.cleared()) {
      return [];
    }
    const query = this.query().trim().toLowerCase();
    return this.rows.filter((row) => !query || `${row['code']} ${row['name']}`.toLowerCase().includes(query));
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    code: [{ value: 'ACC', disabled: true }],
    name: ['НС Классика', Validators.required],
    email: ['not-an-email', Validators.email],
    status: ['Черновик', Validators.required],
    channel: ['agent'],
    agree: [true],
    active: [true],
  });

  constructor() {
    this.form.controls.email.markAsTouched();
  }

  protected onSearchAction(id: string): void {
    this.snack.open(id === 'create' ? 'Действие «Создать»' : 'Действие «Экспорт»', 'Закрыть', {
      duration: 2000,
      panelClass: 'pt-snack-success',
    });
  }

  protected saveDemo(): void {
    this.dirty.set(false);
    this.snack.open('Демо-форма отмечена сохранённой', 'Закрыть', {
      duration: 2000,
      panelClass: 'pt-snack-success',
    });
  }

  protected cancelDemo(): void {
    this.dirty.set(true);
  }
}
