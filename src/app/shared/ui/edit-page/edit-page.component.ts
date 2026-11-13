import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { Breadcrumb } from '../platform.models';

@Component({
  selector: 'pt-edit-page',
  imports: [MatButtonModule, MatIconModule, PageHeaderComponent],
  templateUrl: './edit-page.component.html',
  styleUrl: './edit-page.component.scss',
})
export class EditPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
  readonly dirty = input(false);
  readonly saving = input(false);
  readonly saveLabel = input('Сохранить');

  readonly save = output<void>();
  readonly cancel = output<void>();
}
