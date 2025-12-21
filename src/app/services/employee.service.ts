import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  name: string;
  gender: string;
  address: string;
  dob: string;
  phoneNumber: string;
  emergencyContactNumber: string;
  maritalStatus: string;
  salary: number;
  clientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = 'https://richmill-git-main-richmill123s-projects.vercel.app/api';
  public clientId = JSON.parse(sessionStorage.getItem('user') || '');

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/employees?clientId=${this.clientId}`);
  }

  createEmployee(employee: Omit<Employee, '_id' | 'createdAt' | 'updatedAt' | 'clientId'>): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, employee);
  }

  updateEmployee(id: string, employee: Omit<Employee, '_id' | 'createdAt' | 'updatedAt' | 'clientId'>): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/employees/${id}`, {
      ...employee,
      clientId: this.clientId
    });
  }

  deleteEmployee(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/employees/${id}?clientId=${this.clientId}`);
  }
}
