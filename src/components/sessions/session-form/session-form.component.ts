import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { ChargingSession } from '../../../models/charging-session.model';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe, CurrencyPipe],
  templateUrl: './session-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionFormComponent {
  // Services
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Inputs & Outputs
  sessionId = input<number | null>(null);
  formClose = output<void>();

  // State
  session = signal<ChargingSession | null>(null);
  currentUser = this.authService.currentUser;
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  
  // Computed mode based on session existence and status
  mode = computed<'create' | 'view' | 'complete'>(() => {
    if (!this.sessionId()) return 'create';
    const s = this.session();
    if (!s) return 'create'; // Should be loading, but default to create
    return s.status === 'active' ? 'complete' : 'view';
  });

  // Forms
  // FIX: Initialize FormGroups as property initializers instead of in the constructor to resolve injection context issues. This addresses the "Property 'group' does not exist on type 'unknown'" error.
  startSessionForm = this.fb.group({
    station: ['المحطة الرئيسية', Validators.required],
    platform: [1, [Validators.required, Validators.min(1)]],
    vehicleType: ['', Validators.required],
    vehicleImageUrl: [''],
  });

  completeSessionForm = this.fb.group({
    kwh: [null, [Validators.required, Validators.min(0.1)]],
    durationMinutes: [null, [Validators.required, Validators.min(1)]],
    amount: [null, [Validators.required, Validators.min(0)]],
    paymentMethod: ['cash' as 'cash' | 'card' | 'transfer', Validators.required],
    screenImageUrl: [''],
  });

  constructor() {
    // Effect to load session data when sessionId changes
    effect(() => {
      const id = this.sessionId();
      if (id) {
        this.loadSession(id);
      } else {
        this.session.set(null);
        this.startSessionForm.reset({ station: 'المحطة الرئيسية', platform: 1, vehicleType: '' });
        this.completeSessionForm.reset({ paymentMethod: 'cash' });
      }
    });
  }

  loadSession(id: number): void {
    this.isLoading.set(true);
    this.dataService.getSession(id).subscribe(session => {
      if (session) {
        this.session.set(session);
      } else {
        this.errorMessage.set(`لم يتم العثور على جلسة بالمعرف ${id}`);
      }
      this.isLoading.set(false);
    });
  }

  // File handling (simulated with base64)
  onFileChange(event: Event, formControlName: string, formGroup: FormGroup): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        formGroup.patchValue({ [formControlName]: reader.result as string });
        formGroup.get(formControlName)?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  onStartSession(): void {
    if (this.startSessionForm.invalid) {
      this.errorMessage.set('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set('');

    const user = this.currentUser();
    if (!user) {
      this.errorMessage.set('خطأ: المستخدم غير مسجل.');
      this.isSaving.set(false);
      return;
    }

    const formValue = this.startSessionForm.value;
    const newSessionData = {
      startTime: new Date(),
      startEmployeeId: user.id,
      station: formValue.station,
      platform: formValue.platform,
      vehicleType: formValue.vehicleType,
      vehicleImageUrl: formValue.vehicleImageUrl,
    };

    this.dataService.addSession(newSessionData as any).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.formClose.emit();
      },
      error: () => {
        this.errorMessage.set('حدث خطأ أثناء بدء الجلسة.');
        this.isSaving.set(false);
      }
    });
  }

  onCompleteSession(): void {
    if (this.completeSessionForm.invalid) {
      this.errorMessage.set('يرجى ملء جميع بيانات إنهاء الجلسة.');
      return;
    }
    const sessionId = this.sessionId();
    const user = this.currentUser();

    if (!sessionId || !user) {
      this.errorMessage.set('خطأ: بيانات الجلسة أو المستخدم غير متوفرة.');
      return;
    }
    
    this.isSaving.set(true);
    this.errorMessage.set('');

    const formValue = this.completeSessionForm.value;
    const completionData = {
      kwh: formValue.kwh,
      durationMinutes: formValue.durationMinutes,
      amount: formValue.amount,
      // FIX: Type 'string' is not assignable to type '"cash" | "card" | "transfer"'. Cast to the correct type.
      paymentMethod: formValue.paymentMethod as 'cash' | 'card' | 'transfer',
      screenImageUrl: formValue.screenImageUrl,
      endEmployeeId: user.id,
    };
    
    this.dataService.completeSession(sessionId, completionData).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.formClose.emit();
      },
      error: () => {
        this.errorMessage.set('حدث خطأ أثناء إنهاء الجلسة.');
        this.isSaving.set(false);
      }
    });
  }

  close(): void {
    this.formClose.emit();
  }
}