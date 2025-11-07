import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { Employee, UserWithCredentials } from '../../../models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent {
  private dataService = inject(DataService);
  private fb = inject(FormBuilder);

  employees = this.dataService.employees;

  // Modal and form state
  isModalOpen = signal(false);
  isSaving = signal(false);
  errorMessage = signal('');
  selectedEmployee = signal<Employee | null>(null);
  
  // FIX: Initialize FormGroup as a property initializer instead of in the constructor to resolve injection context issues. This addresses the "Property 'group' does not exist on type 'unknown'" error.
  employeeForm = this.fb.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    password: [''], // Not required on edit
    role: ['employee' as 'admin' | 'employee', Validators.required],
    position: ['', Validators.required],
    shift: ['صباحي' as 'صباحي' | 'مسائي' | 'ليلي', Validators.required],
  });

  constructor() {}

  openModal(employee: Employee | null = null): void {
    this.errorMessage.set('');
    this.selectedEmployee.set(employee);
    this.employeeForm.reset();

    if (employee) {
      // Editing existing employee
      this.employeeForm.patchValue(employee);
      this.employeeForm.get('id')?.disable();
      this.employeeForm.get('password')?.setValidators(null);
      this.employeeForm.get('password')?.updateValueAndValidity();
    } else {
      // Adding new employee
      this.employeeForm.get('id')?.enable();
      this.employeeForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.employeeForm.get('password')?.updateValueAndValidity();
      this.employeeForm.patchValue({ role: 'employee', shift: 'صباحي' });
    }
    
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.errorMessage.set('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');

    const formValue = this.employeeForm.getRawValue();
    const employeeData: UserWithCredentials = {
        id: formValue.id,
        name: formValue.name,
        // FIX: Type 'string' is not assignable to type '"admin" | "employee"'.
        role: formValue.role as 'admin' | 'employee',
        position: formValue.position,
        // FIX: Type 'string' is not assignable to type '"صباحي" | "مسائي" | "ليلي"'.
        shift: formValue.shift as 'صباحي' | 'مسائي' | 'ليلي',
        // Only include password if it has been entered
        ...(formValue.password && { password: formValue.password })
    };

    const saveOperation = this.selectedEmployee()
      ? this.dataService.updateEmployee(employeeData)
      : this.dataService.addEmployee(employeeData);

    saveOperation.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.errorMessage.set('حدث خطأ أثناء حفظ الموظف. قد يكون المعرف مستخدماً بالفعل.');
        console.error(err);
        this.isSaving.set(false);
      }
    });
  }
}