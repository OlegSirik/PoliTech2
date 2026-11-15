import { Component, OnInit, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RuleAssistService } from '../../../core/api/rule-assist.service';

@Component({
  selector: 'pt-llm-prompt',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './llm-prompt.component.html',
  styleUrl: './llm-prompt.component.scss',
  host: { class: 'pt-panel' },
})
export class LlmPromptComponent implements OnInit {
  private readonly assist = inject(RuleAssistService);

  readonly text = model('');
  readonly busy = input(false);
  readonly placeholder = input('Опишите задачу обычным языком');

  readonly run = output<string>();
  readonly close = output<void>();

  protected readonly ready = signal(true);

  ngOnInit(): void {
    this.assist.llmConfig().subscribe({
      next: (view) => this.ready.set(!!view.configured && !!view.enabled),
      error: () => this.ready.set(false),
    });
  }

  protected submit(): void {
    const text = this.text().trim();
    if (!text || this.busy() || !this.ready()) {
      return;
    }
    this.run.emit(text);
  }
}
