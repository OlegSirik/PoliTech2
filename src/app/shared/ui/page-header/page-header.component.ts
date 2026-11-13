import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Breadcrumb, PtAction } from '../platform.models';

@Component({
  selector: 'pt-page-header',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly breadcrumbs = input<Breadcrumb[]>([]);
  readonly notice = input('');
  readonly actions = input<PtAction[]>([]);
  readonly action = output<string>();
}
