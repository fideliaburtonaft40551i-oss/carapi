import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SessionListComponent } from './components/sessions/session-list/session-list.component';
import { SessionFormComponent } from './components/sessions/session-form/session-form.component';
import { ReportsComponent } from './components/reports/reports.component';
import { EmployeeListComponent } from './components/employees/employee-list/employee-list.component';

type View = 'dashboard' | 'sessions' | 'reports' | 'employees';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    DashboardComponent,
    SessionListComponent,
    SessionFormComponent,
    ReportsComponent,
    EmployeeListComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  // --- View Management ---
  currentView = signal<View>('dashboard');
  
  // --- Session Form Management ---
  isSessionFormOpen = signal(false);
  selectedSessionId = signal<number | null>(null);
  
  // Computed values
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  setView(view: View): void {
    this.currentView.set(view);
  }

  logout(): void {
    this.authService.logout();
  }

  // --- Session Form Event Handlers ---
  openNewSessionForm(): void {
    this.selectedSessionId.set(null);
    this.isSessionFormOpen.set(true);
  }

  openViewSessionForm(sessionId: number): void {
    this.selectedSessionId.set(sessionId);
    this.isSessionFormOpen.set(true);
  }

  closeSessionForm(): void {
    this.isSessionFormOpen.set(false);
    this.selectedSessionId.set(null);
  }
}
