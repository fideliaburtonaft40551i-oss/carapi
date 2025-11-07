import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'https://24.jopythonapps.com/ai/api'; // Base path to the API folder
  
  currentUser = signal<User | null>(null);

  constructor() {
    // Check for saved user in local storage to persist login
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUser.set(JSON.parse(savedUser));
    }
  }

  login(username: string, password: string): Observable<User | null> {
    return this.http.post<User>(`${this.apiUrl}/login.php`, { username, password }).pipe(
      delay(1000), // Simulate network latency
      tap(user => {
        // The backend might return a non-error response with an empty body or an object without an ID on failure.
        if (user && user.id) {
          this.currentUser.set(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
          // This case handles successful requests that don't return a valid user.
          this.logout();
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // This handles HTTP-level errors (4xx, 5xx) and provides detailed debugging info.
        console.error('Login request failed!');
        console.error(`Status: ${error.status} ${error.statusText}`);
        // The 'error.error' property can be a string (like HTML from a PHP error) or an object if the server returns a structured error.
        console.error('Response Body:', error.error);
        
        this.logout();
        return of(null); // Return null to the component so it can display a generic error message.
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('currentUser');
  }
}