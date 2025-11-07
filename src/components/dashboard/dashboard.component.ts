

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ChargingSession } from '../../models/charging-session.model';

@Component({
  selector: 'app-dashboard',
  // Removed standalone: true as it's the default in Angular v20+
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  dataService = inject(DataService);
  
  sessions = this.dataService.sessions;

  // Computed signals for dashboard metrics
  activeSessions = computed(() => this.sessions().filter(s => s.status === 'active'));
  
  todayCompletedSessions = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.sessions().filter(s => 
      s.status === 'completed' && s.endTime && s.endTime >= today
    );
  });
  
  todaysRevenue = computed(() => 
    this.todayCompletedSessions().reduce((sum, session) => sum + (session.amount || 0), 0)
  );

  todaysKwh = computed(() => 
    this.todayCompletedSessions().reduce((sum, session) => sum + (session.kwh || 0), 0)
  );
}