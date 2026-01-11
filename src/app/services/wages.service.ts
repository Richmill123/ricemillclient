import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type WorkType = 'other' | 'boiling' | 'drying' | 'packing' | 'loading' | 'unloading';

export interface Wage {
  _id?: string;
  employeeId?: string;
  employeeName: string;
  advanceWage: number;
  totalWage: number;
  typeOfWork: string;
  machineType: string;
  date: string;
  clientId: string;
  advanceamount?: string;
  notes?: string;
  pendingamount?: string;
  createdAt?: string;
  bags: number;
  advancedebtamount?: number;
  updatedAt?: string;
}

export type WageCreateRequest = Omit<Wage, '_id' | 'createdAt' | 'updatedAt'>;
export type WageUpdateRequest = Partial<Omit<Wage, '_id' | 'createdAt' | 'updatedAt'>> & { clientId: string };

@Injectable({
  providedIn: 'root'
})
export class WagesService {
   private apiUrl = 'https://richmill-git-main-richmill123s-projects.vercel.app/api';
    //private apiUrl = 'http://192.168.1.2:5000/api';


  constructor(private http: HttpClient) {}

  private getClientId(): string {
    try {
      const raw = sessionStorage.getItem('user');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      return String(parsed?._id ?? parsed);
    } catch {
      return '';
    }
  }

  getWages(): Observable<Wage[]> {
    const clientId = this.getClientId();
    return this.http.get<Wage[]>(`${this.apiUrl}/wages?clientId=${encodeURIComponent(clientId)}`);
  }

  createWage(payload: WageCreateRequest): Observable<Wage> {
    return this.http.post<Wage>(`${this.apiUrl}/wages`, payload);
  }

  updateWage(id: string, payload: WageUpdateRequest): Observable<Wage> {
    return this.http.put<Wage>(`${this.apiUrl}/wages/${id}`, payload);
  }

  deleteWage(id: string): Observable<unknown> {
    const clientId = this.getClientId();
    return this.http.delete(`${this.apiUrl}/wages/${id}?clientId=${encodeURIComponent(clientId)}`);
  }
}
