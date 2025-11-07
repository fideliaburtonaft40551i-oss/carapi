
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './reports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent {
  dataService = inject(DataService);
  geminiService = inject(GeminiService);

  summary = signal<string>('');
  isLoadingSummary = signal(false);
  
  completedSessions = computed(() => this.dataService.sessions().filter(s => s.status === 'completed'));
  
  totalRevenue = computed(() => this.completedSessions().reduce((sum, s) => sum + s.amount, 0));
  totalKwh = computed(() => this.completedSessions().reduce((sum, s) => sum + (s.kwh || 0), 0));

  generateSummary() {
    this.isLoadingSummary.set(true);
    this.summary.set('');
    this.geminiService.generateReportSummary(this.completedSessions())
      .then(result => this.summary.set(result))
      .catch(error => this.summary.set('حدث خطأ أثناء الاتصال بالخدمة.'))
      .finally(() => this.isLoadingSummary.set(false));
  }
}
