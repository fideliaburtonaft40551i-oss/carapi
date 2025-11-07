import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ChargingSession } from '../models/charging-session.model';
import { Employee, UserWithCredentials } from '../models/employee.model';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private apiUrl = 'https://24.jopythonapps.com/ai/api'; // Base path to the API folder

  sessions = signal<ChargingSession[]>([]);
  employees = signal<Employee[]>([]);

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.fetchSessions();
    this.fetchEmployees();
  }
  
  // --- Sessions ---
  fetchSessions(): void {
    this.http.get<ChargingSession[]>(`${this.apiUrl}/sessions.php`).pipe(
      catchError(() => of([]))
    ).subscribe(sessions => this.sessions.set(sessions));
  }

  getSession(id: number): Observable<ChargingSession | undefined> {
    return this.http.get<ChargingSession>(`${this.apiUrl}/sessions.php?id=${id}`);
  }

  addSession(sessionData: Omit<ChargingSession, 'id' | 'status' | 'amount'>): Observable<ChargingSession> {
    const payload = { ...sessionData, action: 'start' };
    return this.http.post<ChargingSession>(`${this.apiUrl}/sessions.php`, payload).pipe(
      tap(() => this.fetchSessions()) // Refresh the list after adding
    );
  }
  
  completeSession(id: number, completionData: Partial<ChargingSession>): Observable<any> {
    const payload = { ...completionData, id, action: 'complete' };
    return this.http.post(`${this.apiUrl}/sessions.php`, payload).pipe(
      tap(() => this.fetchSessions()) // Refresh the list after completing
    );
  }

  // --- Employees ---
  fetchEmployees(): void {
    this.http.get<Employee[]>(`${this.apiUrl}/employees.php`).pipe(
      catchError(() => of([]))
    ).subscribe(employees => this.employees.set(employees));
  }

  addEmployee(employeeData: UserWithCredentials): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees.php`, employeeData).pipe(
      tap(() => this.fetchEmployees()) // Refresh list
    );
  }

  updateEmployee(employeeData: Employee & { password?: string }): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees.php`, employeeData).pipe(
      tap(() => this.fetchEmployees()) // Refresh list
    );
  }
}