import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'pt-property-drawer',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './property-drawer.component.html',
  styleUrl: './property-drawer.component.scss',
  host: {
    '[class.is-open]': 'open()',
    '[attr.aria-hidden]': 'open() ? null : true',
  },
})
export class PropertyDrawerComponent {
  readonly open = input(true);
  readonly title = input('Свойства');
  readonly subtitle = input('');
  readonly closed = output<void>();
}
