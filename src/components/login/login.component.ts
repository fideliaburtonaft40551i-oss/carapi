
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  // Removed standalone: true as it's the default in Angular v20+
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);

  username = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit(): void {
    if (!this.username() || !this.password()) {
      this.errorMessage.set('يرجى إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.username(), this.password()).subscribe({
      next: (user) => {
        if (!user) {
          this.errorMessage.set('اسم المستخدم أو كلمة المرور غير صحيحة.');
        }
        // On successful login, the app.component will detect the currentUser change and switch views.
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
        this.isLoading.set(false);
      }
    });
  }
}