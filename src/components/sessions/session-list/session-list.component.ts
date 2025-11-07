import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DataService } from '../../../services/data.service';
import { ChargingSession } from '../../../models/charging-session.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionListComponent {
  dataService = inject(DataService);

  // Outputs to notify parent component of user actions
  addSession = output<void>();
  viewSession = output<number>();

  // Signals for filtering
  filterText = signal('');
  filterStatus = signal<'all' | 'active' | 'completed'>('all');

  // A computed signal that filters sessions based on the filter signals
  filteredSessions = computed(() => {
    const text = this.filterText().toLowerCase();
    const status = this.filterStatus();
    
    return this.dataService.sessions().filter(session => {
      const statusMatch = status === 'all' || session.status === status;
      const textMatch = !text ||
        session.vehicleType.toLowerCase().includes(text) ||
        session.station.toLowerCase().includes(text) ||
        String(session.id).includes(text);

      return statusMatch && textMatch;
    });
  });

  // Emits an event to signal the creation of a new session
  onAddNewSession(): void {
    this.addSession.emit();
  }

  // Emits an event to signal viewing details of a specific session
  onViewDetails(id: number): void {
    this.viewSession.emit(id);
  }
}