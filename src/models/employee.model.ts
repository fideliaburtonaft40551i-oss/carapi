export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'employee';
  position: string;
  shift: 'صباحي' | 'مسائي' | 'ليلي';
}

// Used when creating a new user, as password is required
export type UserWithCredentials = Employee & { password?: string };
